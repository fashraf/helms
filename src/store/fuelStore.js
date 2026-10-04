import { create } from 'zustand'
import { SAMPLE_FUEL_LOGS, nextFuelId } from '../api/mock/fuelData'

const useFuelStore = create((set, get) => ({
  logs: SAMPLE_FUEL_LOGS,

  // Project-scoped fetch
  getLogsForProject: (projectId) => get().logs
    .filter(l => l.projectId === projectId)
    .sort((a, b) => new Date(b.date) - new Date(a.date)),

  addLog: (draft) => set(s => {
    const id = draft.id || nextFuelId(s.logs)
    const newLog = {
      id,
      projectId:  draft.projectId,
      date:       draft.date,
      fuelType:   draft.fuelType,
      amount:     Number(draft.amount) || 0,
      unit:       draft.unit || 'L',
      status:     draft.status || 'pending',
      loggedBy:   draft.loggedBy || 'Admin',
      loggedAt:   new Date().toISOString(),
      notes:      draft.notes || '',
    }
    return { logs: [newLog, ...s.logs] }
  }),

  updateLog: (id, patch) => set(s => ({
    logs: s.logs.map(l => l.id === id ? {
      ...l,
      ...patch,
      amount: patch.amount != null ? Number(patch.amount) : l.amount,
      updatedAt: new Date().toISOString(),
    } : l),
  })),

  setStatus: (id, status) => set(s => ({
    logs: s.logs.map(l => l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l),
  })),
}))

export default useFuelStore
