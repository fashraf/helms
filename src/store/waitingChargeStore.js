import { create } from 'zustand'
import {
  SAMPLE_WAITING_CHARGES, nextWaitingChargeId,
  computeElapsedHours, computeChargedHours, computeTotalAmount,
} from '../api/mock/waitingChargeData'

const useWaitingChargeStore = create((set, get) => ({
  charges: SAMPLE_WAITING_CHARGES,

  getById: (id) => get().charges.find(c => c.id === id),

  getForProject: (projectId) => get().charges
    .filter(c => c.projectId === projectId)
    .sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate)),

  getForShipment: (shipmentId) => get().charges
    .filter(c => c.shipmentId === shipmentId)
    .sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate)),

  addCharge: (draft) => set(s => {
    const id = draft.id || nextWaitingChargeId(s.charges)
    const elapsed = computeElapsedHours(draft.arrivalTime, draft.endTime)
    const charged = computeChargedHours(elapsed, draft.freeHours)
    const newCharge = {
      id,
      projectId:    draft.projectId,
      shipmentId:   draft.shipmentId ?? null,
      incidentDate: draft.incidentDate,
      delayReason:  draft.delayReason,
      customReason: draft.customReason || '',
      arrivalTime:  draft.arrivalTime,
      freeHours:    Number(draft.freeHours),
      endTime:      draft.endTime,
      elapsedHours: elapsed,
      chargedHours: charged,
      penaltyRate:  Number(draft.penaltyRate) || 0,
      totalAmount:  computeTotalAmount(charged, draft.penaltyRate),
      currency:     draft.currency || 'SAR',
      createdAt:    new Date().toISOString(),
      createdBy:    draft.createdBy || 'Admin',
      notes:        draft.notes || '',
    }
    return { charges: [newCharge, ...s.charges] }
  }),

  updateCharge: (id, patch) => set(s => ({
    charges: s.charges.map(c => {
      if (c.id !== id) return c
      const merged = { ...c, ...patch }
      // Recompute downstream values when time inputs change
      merged.elapsedHours = computeElapsedHours(merged.arrivalTime, merged.endTime)
      merged.chargedHours = computeChargedHours(merged.elapsedHours, merged.freeHours)
      merged.totalAmount  = computeTotalAmount(merged.chargedHours, merged.penaltyRate)
      merged.updatedAt    = new Date().toISOString()
      return merged
    }),
  })),
}))

export default useWaitingChargeStore
