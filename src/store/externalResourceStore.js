// External Resource Assignment store
// On create: auto-generates a manpower PO entry that flows through the PO module.
// On complete: closes both the assignment AND the linked PO milestone.
import { create } from 'zustand'
import { SAMPLE_ASSIGNMENTS, nextAssignmentId, nextManpowerPoId, totalDaysOf } from '../api/mock/externalResourceData'
import usePoStore from './poStore'

const useExternalResourceStore = create((set, get) => ({
  assignments: SAMPLE_ASSIGNMENTS,

  // Create assignment + matching PO
  createAssignment: (draft) => {
    const state = get()
    const id = draft.id ?? nextAssignmentId(state.assignments)
    const now = new Date().toISOString()

    // Generate matching PO via PO store
    const poStore = usePoStore.getState()
    const poId = nextManpowerPoId(poStore.pos)
    const totalDays = totalDaysOf(draft.shift?.startDate, draft.shift?.endDate)
    const totalAmount = (draft.cost?.dailyRate ?? 0) * totalDays

    // Hand-craft the PO so it lives in the PO module's store
    poStore.addRaw?.({
      id: poId,
      referenceNumber: id,
      type: 'manpower',
      vendorId: null,
      vendorName: `External Manpower · ${draft.resource?.name ?? 'Unnamed'}`,
      vendorContact: draft.resource?.name,
      vendorEmail: '',
      vendorPhone: draft.resource?.mobile ?? '',
      totalAmount,
      currency: draft.cost?.currency ?? 'SAR',
      incoterm: 'OTHER',
      paymentType: 'percentage',
      creationDate: now,
      milestones: [{
        id:'m1', label:'100% on assignment completion', percentage:100, trigger:'on_delivery',
        dueDate: draft.shift?.endDate, reminderDate: draft.shift?.endDate,
        status:'pending', receipt:null, paidDate:null, notes:'Released on assignment completion',
      }],
      currentStage: 'created',
      stageHistory: [{ stage:'created', date: now, by: draft.createdBy ?? 'Fahad Al-Ghamdi', remarks:`Auto-generated from ${id}` }],
      expectedCompletionDate: draft.shift?.endDate,
      createdBy: draft.createdBy ?? 'Fahad Al-Ghamdi',
      createdAt: now,
      updatedBy: draft.createdBy ?? 'Fahad Al-Ghamdi',
      updatedAt: now,
      auditLog: [{ action:'create', date: now, by: draft.createdBy ?? 'Fahad Al-Ghamdi', summary:`Manpower PO auto-created for ${id}` }],
    })

    const newA = {
      ...draft,
      id,
      status: 'upcoming',
      attendance: [],
      cost: {
        ...(draft.cost ?? {}),
        currency: draft.cost?.currency ?? 'SAR',
        dailyRate: draft.cost?.dailyRate ?? 0,
        totalDays,
        totalAmount,
        poId,
        poStatus: 'created',
      },
      auditLog: [{ action:'create', date: now, by: draft.createdBy ?? 'Fahad Al-Ghamdi', summary:`Assignment created · ${poId} generated` }],
      createdAt: now, updatedAt: now,
    }

    set(s => ({ assignments: [newA, ...s.assignments] }))
    return { id, poId }
  },

  updateAssignment: (id, patch, by = 'Fahad Al-Ghamdi') => set(s => ({
    assignments: s.assignments.map(a => {
      if (a.id !== id) return a
      if (a.status === 'completed') return a
      const now = new Date().toISOString()
      return {
        ...a, ...patch,
        auditLog: [...(a.auditLog ?? []), { action:'update', date: now, by, summary: `Updated: ${Object.keys(patch).join(', ')}` }],
        updatedBy: by, updatedAt: now,
      }
    }),
  })),

  // Mark attendance — 1 worker per assignment now (no resourceId)
  markAttendance: (assignmentId, status, hours = 0, startTime = null, endTime = null) => set(s => ({
    assignments: s.assignments.map(a => {
      if (a.id !== assignmentId) return a
      if (a.status === 'completed') return a
      const now = new Date().toISOString()
      const today = now.slice(0, 10)
      const existing = a.attendance ?? []
      const idx = existing.findIndex(x => x.date?.startsWith(today))
      const newRec = { date: now, status, hours, startTime, endTime }
      const newArr = idx >= 0 ? existing.map((x, i) => i === idx ? newRec : x) : [...existing, newRec]
      return {
        ...a,
        attendance: newArr,
        auditLog: [...(a.auditLog ?? []), { action:'attendance', date: now, by:'Site Supervisor', summary: `${status} · ${hours}h${startTime ? ` · ${startTime}–${endTime}` : ''}` }],
        updatedAt: now,
      }
    }),
  })),

  // Mark attendance for a specific date
  markAttendanceOnDate: (assignmentId, dateISO, status, hours = 0, startTime = null, endTime = null) => set(s => ({
    assignments: s.assignments.map(a => {
      if (a.id !== assignmentId) return a
      if (a.status === 'completed') return a
      const now = new Date().toISOString()
      const datePrefix = dateISO.slice(0, 10)
      const existing = a.attendance ?? []
      const idx = existing.findIndex(x => x.date?.startsWith(datePrefix))
      const newRec = { date: new Date(datePrefix + 'T09:00:00').toISOString(), status, hours, startTime, endTime }
      const newArr = idx >= 0 ? existing.map((x, i) => i === idx ? newRec : x) : [...existing, newRec]
      return {
        ...a,
        attendance: newArr.sort((x, y) => new Date(x.date) - new Date(y.date)),
        auditLog: [...(a.auditLog ?? []), { action:'attendance', date: now, by:'Site Supervisor', summary: `${status} · ${hours}h${startTime ? ` · ${startTime}–${endTime}` : ''} on ${datePrefix}` }],
        updatedAt: now,
      }
    }),
  })),

  // Complete assignment + close PO milestone via PO store
  completeAssignment: (id, by = 'Fahad Al-Ghamdi', remarks = '') => {
    const a = get().assignments.find(x => x.id === id)
    if (!a) return
    // Close linked PO milestone if exists
    if (a.cost?.poId) {
      const poStore = usePoStore.getState()
      const po = poStore.pos.find(p => p.id === a.cost.poId)
      if (po && po.milestones?.[0]) {
        poStore.payMilestone?.(po.id, po.milestones[0].id, {
          paidDate: new Date().toISOString(),
          paidBy: by,
          receipt: `RCP-${a.cost.poId}.pdf`,
          remarks: `Manpower contract closed alongside ${id}`,
        })
        poStore.advanceStage?.(po.id, 'closed', by, `PO closed alongside ${id}`)
      }
    }
    set(s => ({
      assignments: s.assignments.map(x => {
        if (x.id !== id) return x
        const now = new Date().toISOString()
        return {
          ...x,
          status: 'completed',
          equipment: { ...x.equipment, status:'completed' },
          cost: { ...(x.cost ?? {}), poStatus: 'closed' },
          auditLog: [...(x.auditLog ?? []), { action:'status_change', date: now, by, summary: `Assignment completed · ${x.cost?.poId ?? 'PO'} closed${remarks ? ` · ${remarks}` : ''}` }],
          updatedBy: by, updatedAt: now,
        }
      }),
    }))
  },

  setStatus: (id, status, by = 'Fahad Al-Ghamdi', remarks = '') => set(s => ({
    assignments: s.assignments.map(a => {
      if (a.id !== id || a.status === 'completed') return a
      const now = new Date().toISOString()
      return {
        ...a, status,
        auditLog: [...(a.auditLog ?? []), { action:'status_change', date: now, by, summary: `Status → ${status}${remarks ? ` · ${remarks}` : ''}` }],
        updatedBy: by, updatedAt: now,
      }
    }),
  })),
}))

export default useExternalResourceStore
