// Purchase Order store
import { create } from 'zustand'
import { SAMPLE_POS, nextPoId } from '../api/mock/poData'

const usePoStore = create((set, get) => ({
  pos: SAMPLE_POS,

  // Inject a fully-formed PO (used by External Resource module to insert manpower POs)
  addRaw: (po) => set(s => s.pos.some(p => p.id === po.id) ? s : ({ pos: [po, ...s.pos] })),

  // Create a new PO
  createPo: (poDraft) => set(s => {
    const id = poDraft.id ?? nextPoId(s.pos)
    const now = new Date().toISOString()
    const newPo = {
      ...poDraft,
      id,
      currentStage: 'created',
      stageHistory: [
        { stage:'created', date: now, by: poDraft.createdBy ?? 'Fahad Al-Ghamdi', remarks: poDraft.remarks ?? '' },
      ],
      auditLog: [
        { action:'create', date: now, by: poDraft.createdBy ?? 'Fahad Al-Ghamdi', summary:'PO created' },
      ],
      createdAt: now,
      updatedAt: now,
    }
    return { pos: [newPo, ...s.pos] }
  }),

  // Update a PO
  updatePo: (id, patch, by = 'Fahad Al-Ghamdi') => set(s => ({
    pos: s.pos.map(p => {
      if (p.id !== id) return p
      // Closed PO cannot be edited (per business rules)
      if (p.currentStage === 'closed') return p
      const now = new Date().toISOString()
      return {
        ...p,
        ...patch,
        auditLog: [...(p.auditLog ?? []), { action:'update', date: now, by, summary: `Updated: ${Object.keys(patch).join(', ')}` }],
        updatedBy: by,
        updatedAt: now,
      }
    }),
  })),

  // Advance status
  advanceStage: (id, newStage, by = 'Fahad Al-Ghamdi', remarks = '') => set(s => ({
    pos: s.pos.map(p => {
      if (p.id !== id) return p
      if (p.currentStage === 'closed') return p
      const now = new Date().toISOString()
      return {
        ...p,
        currentStage: newStage,
        stageHistory: [...(p.stageHistory ?? []), { stage: newStage, date: now, by, remarks }],
        auditLog: [...(p.auditLog ?? []), { action:'status_change', date: now, by, summary: `Stage → ${newStage}` }],
        updatedBy: by,
        updatedAt: now,
      }
    }),
  })),

  // Mark a milestone as paid (with receipt)
  payMilestone: (poId, milestoneId, { paidDate, paidBy, receipt, remarks }) => set(s => ({
    pos: s.pos.map(p => {
      if (p.id !== poId) return p
      if (p.currentStage === 'closed') return p
      const now = new Date().toISOString()
      const newMilestones = p.milestones.map(m =>
        m.id === milestoneId
          ? { ...m, status:'paid', paidDate, paidBy, receipt, remarks }
          : m
      )
      // Auto-advance to pay_done if all milestones paid
      const allPaid = newMilestones.every(m => m.status === 'paid')
      const newStage = allPaid && ['delivered','dispatched'].includes(p.currentStage) ? 'pay_done' : p.currentStage
      const newHistory = newStage !== p.currentStage
        ? [...(p.stageHistory ?? []), { stage: newStage, date: now, by: paidBy, remarks:'All milestones cleared' }]
        : p.stageHistory
      return {
        ...p,
        milestones: newMilestones,
        currentStage: newStage,
        stageHistory: newHistory,
        auditLog: [...(p.auditLog ?? []), { action:'payment', date: now, by: paidBy, summary: `Milestone paid: ${p.milestones.find(m => m.id === milestoneId)?.label}` }],
        updatedBy: paidBy,
        updatedAt: now,
      }
    }),
  })),
}))

export default usePoStore
