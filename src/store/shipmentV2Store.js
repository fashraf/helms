import { create } from 'zustand'
import {
  INTL_SHIPMENTS, LOCAL_SHIPMENTS, nextShipmentId, LOCATION_MASTER,
} from '../api/mock/shipmentV2Data'

const useShipmentV2Store = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────
  intlShipments:  INTL_SHIPMENTS,
  localShipments: LOCAL_SHIPMENTS,
  locations:      LOCATION_MASTER,

  filter:   { search: '', status: 'all', project: 'all', supplier: 'all', mode: 'all' },
  viewMode: 'list',

  setFilter:    (k, v) => set(s => ({ filter: { ...s.filter, [k]: v } })),
  setViewMode:  (m) => set({ viewMode: m }),
  resetFilter:  () => set({ filter: { search: '', status: 'all', project: 'all', supplier: 'all', mode: 'all' } }),

  // ─── Filtered lists ──────────────────────────────────────────────────
  filteredIntl: () => {
    const { intlShipments, filter: f } = get()
    return intlShipments.filter(s => {
      if (f.status   !== 'all' && s.status   !== f.status)   return false
      if (f.project  !== 'all' && s.project  !== f.project)  return false
      if (f.supplier !== 'all' && s.supplier !== f.supplier) return false
      if (f.mode     !== 'all' && s.mode     !== f.mode)     return false
      if (f.search) {
        const q = f.search.toLowerCase()
        const hit = s.id.toLowerCase().includes(q) ||
          (s.poNumber ?? '').toLowerCase().includes(q) ||
          (s.project  ?? '').toLowerCase().includes(q) ||
          (s.supplier ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  },

  filteredLocal: () => {
    const { localShipments, filter: f } = get()
    return localShipments.filter(s => {
      if (f.status   !== 'all' && s.status   !== f.status)   return false
      if (f.project  !== 'all' && s.project  !== f.project)  return false
      if (f.supplier !== 'all' && s.supplier !== f.supplier) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        const hit = s.id.toLowerCase().includes(q) ||
          (s.project ?? '').toLowerCase().includes(q) ||
          (s.deliveryNoteNumber ?? '').toLowerCase().includes(q) ||
          (s.poNumbers ?? []).some(p => p.toLowerCase().includes(q))
        if (!hit) return false
      }
      return true
    })
  },

  // ─── Get one ─────────────────────────────────────────────────────────
  getShipment: (id) => {
    const { intlShipments, localShipments } = get()
    return intlShipments.find(s => s.id === id) ?? localShipments.find(s => s.id === id) ?? null
  },

  // ─── International CRUD ──────────────────────────────────────────────
  createIntlShipment: (data) => {
    const id = nextShipmentId('international')
    const ship = {
      id, type: 'international', status: 'draft',
      cargo: [], items: [], documents: [],
      route: { origin: { locationId: null, contact: '', address: '', notes: '' }, stops: [] },
      createdAt: new Date().toISOString(),
      createdBy: 'Abdullah Al-Rashid',
      updatedAt: new Date().toISOString(),
      ...data,
    }
    set(s => ({ intlShipments: [ship, ...s.intlShipments] }))
    return id
  },

  updateIntlShipment: (id, patch) =>
    set(s => ({
      intlShipments: s.intlShipments.map(sh => sh.id !== id ? sh : {
        ...sh, ...patch, updatedAt: new Date().toISOString(),
      }),
    })),

  // ─── Local CRUD ──────────────────────────────────────────────────────
  createLocalShipment: (data) => {
    const id = nextShipmentId('local')
    const ship = {
      id, type: 'local', status: 'draft',
      documents: [],
      route: { origin: { locationId: null, contact: '', address: '', notes: '' }, stops: [] },
      poNumbers: [],
      requestedEquipment: [],
      createdAt: new Date().toISOString(),
      createdBy: 'Abdullah Al-Rashid',
      updatedAt: new Date().toISOString(),
      ...data,
    }
    set(s => ({ localShipments: [ship, ...s.localShipments] }))
    return id
  },

  // ─── Location Master CRUD ────────────────────────────────────────────
  addLocation: (loc) => set(s => ({ locations: [...s.locations, loc] })),
  updateLocation: (id, patch) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...patch } : l) })),
  toggleLocationActive: (id) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, active: l.active === false ? true : false } : l) })),

  updateLocalShipment: (id, patch) =>
    set(s => ({
      localShipments: s.localShipments.map(sh => sh.id !== id ? sh : {
        ...sh, ...patch, updatedAt: new Date().toISOString(),
      }),
    })),

  // ─── Save draft from mid-wizard (works for both) ────────────────────
  saveDraft: (type, id, data) => {
    if (type === 'international') {
      if (id) get().updateIntlShipment(id, { ...data, status: 'draft' })
      else    return get().createIntlShipment({ ...data, status: 'draft' })
    } else {
      if (id) get().updateLocalShipment(id, { ...data, status: 'draft' })
      else    return get().createLocalShipment({ ...data, status: 'draft' })
    }
    return id
  },

  // ─── Submit / Send for approval ──────────────────────────────────────
  submitShipment: (id) => {
    const s = get().getShipment(id)
    if (!s) return
    const patch = { status: s.type === 'international' ? 'submitted' : 'assigned' }
    if (s.type === 'international') get().updateIntlShipment(id, patch)
    else                            get().updateLocalShipment(id, patch)
  },

  // ─── Cancel (NO delete) ──────────────────────────────────────────────
  cancelShipment: (id) => {
    const s = get().getShipment(id)
    if (!s) return
    if (s.type === 'international') get().updateIntlShipment(id, { status: 'cancelled' })
    else                            get().updateLocalShipment(id, { status: 'cancelled' })
  },
}))

export default useShipmentV2Store
