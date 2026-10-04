import { create } from 'zustand'
import { MOCK_SHIPMENTS } from '../api/mock/shipmentData'

// ─── Wizard defaults ──────────────────────────────────────────────────────────
const WIZARD_DEFAULTS = {
  step: 1,
  basic: {
    customer:  '',
    type:      'local',
    priority:  'standard',
    region:    '',
    notes:     '',
  },
  equipment: {
    equipmentType:  '',
    model:          '',
    serialNo:       '',
    weight:         '',
    dimensions:     '',
    condition:      'Good',
    year:           new Date().getFullYear(),
    owner:          '',
  },
  route: {
    stops: [
      { id: 'new-1', type: 'pickup',   name: 'Pickup',        location: '', eta: '', team: 'Logistics Team',  requiresApproval: false, sequence: 1 },
      { id: 'new-2', type: 'delivery', name: 'Final Delivery', location: '', eta: '', team: 'Site Engineers', requiresApproval: false, sequence: 2 },
    ],
  },
  assignment: {
    vehicleId: '',
    driverId:  '',
  },
}

const useShipmentStore = create((set, get) => ({
  // ─── List state ─────────────────────────────────────────────────────────
  shipments:     MOCK_SHIPMENTS,
  filteredList:  MOCK_SHIPMENTS,
  selectedId:    null,
  isLoading:     false,

  filters: {
    search: '',
    status: 'all',
    region: 'all',
    type:   'all',
  },

  setFilter: (key, value) => {
    const filters = { ...get().filters, [key]: value }
    set({ filters })
    get().applyFilters(filters)
  },

  applyFilters: (filters) => {
    const { search, status, region, type } = filters
    const result = get().shipments.filter((s) => {
      if (search && !s.id.toLowerCase().includes(search.toLowerCase()) &&
                    !s.customer.toLowerCase().includes(search.toLowerCase())) return false
      if (status !== 'all' && s.status !== status) return false
      if (region !== 'all' && s.region !== region) return false
      if (type   !== 'all' && s.type   !== type)   return false
      return true
    })
    set({ filteredList: result })
  },

  clearFilters: () => {
    const filters = { search: '', status: 'all', region: 'all', type: 'all' }
    set({ filters, filteredList: get().shipments })
  },

  // ─── Sort ────────────────────────────────────────────────────────────────
  sortKey: 'id',
  sortDir: 'desc',
  setSort: (key) => {
    const { sortKey, sortDir } = get()
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    set({ sortKey: key, sortDir: newDir })
    // Apply to filtered list
    set((s) => ({
      filteredList: [...s.filteredList].sort((a, b) => {
        const av = a[key] ?? ''
        const bv = b[key] ?? ''
        const cmp = String(av).localeCompare(String(bv))
        return newDir === 'asc' ? cmp : -cmp
      }),
    }))
  },

  // ─── CRUD ────────────────────────────────────────────────────────────────
  createShipment: (data) => {
    const existing  = get().shipments
    const nextNum   = parseInt(existing[0]?.id.split('-')[1] ?? '891') + 1
    const newShip = {
      id:          `SHP-${String(nextNum).padStart(5, '0')}`,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      status:      'pending',
      currentLocation: data.route.stops[0]?.location ?? '',
      riskScore:   data.basic.type === 'international' ? 30 : 10,
      ...data.basic,
      equipment:   data.equipment,
      vehicle:     data.assignment.vehicle,
      driver:      data.assignment.driver,
      stops:       data.route.stops.map((s, i) => ({
        ...s, sequence: i + 1, status: 'pending', approved: false, actualArrival: null, notes: null,
      })),
      origin:      data.route.stops[0]?.location ?? '',
      destination: data.route.stops[data.route.stops.length - 1]?.location ?? '',
    }
    set((s) => ({
      shipments:    [newShip, ...s.shipments],
      filteredList: [newShip, ...s.filteredList],
    }))
    return newShip.id
  },

  updateStop: (shipmentId, stopId, patch) => {
    set((s) => ({
      shipments: s.shipments.map((sh) =>
        sh.id !== shipmentId ? sh : {
          ...sh,
          stops: sh.stops.map((st) => st.id !== stopId ? st : { ...st, ...patch }),
          updatedAt: new Date().toISOString(),
        }
      ),
    }))
  },

  // ─── Wizard state ────────────────────────────────────────────────────────
  wizard: { ...WIZARD_DEFAULTS },

  setWizardStep: (step) => set((s) => ({ wizard: { ...s.wizard, step } })),

  setWizardSection: (section, data) =>
    set((s) => ({
      wizard: { ...s.wizard, [section]: { ...s.wizard[section], ...data } },
    })),

  addWizardStop: () =>
    set((s) => {
      const stops = s.wizard.route.stops
      const lastSeq = stops[stops.length - 1]?.sequence ?? 0
      const newStop = {
        id: `new-${Date.now()}`, type: 'waypoint', name: 'Waypoint',
        location: '', eta: '', team: 'Logistics Team',
        requiresApproval: false, sequence: lastSeq + 1,
      }
      return {
        wizard: {
          ...s.wizard,
          route: { ...s.wizard.route, stops: [...stops.slice(0, -1), newStop, stops[stops.length - 1]] },
        },
      }
    }),

  removeWizardStop: (id) =>
    set((s) => ({
      wizard: {
        ...s.wizard,
        route: { stops: s.wizard.route.stops.filter((st) => st.id !== id).map((st, i) => ({ ...st, sequence: i + 1 })) },
      },
    })),

  updateWizardStop: (id, patch) =>
    set((s) => ({
      wizard: {
        ...s.wizard,
        route: {
          stops: s.wizard.route.stops.map((st) => st.id !== id ? st : { ...st, ...patch }),
        },
      },
    })),

  moveWizardStop: (id, direction) =>
    set((s) => {
      const stops = [...s.wizard.route.stops]
      const idx = stops.findIndex((st) => st.id === id)
      if (direction === 'up' && idx > 0) {
        [stops[idx - 1], stops[idx]] = [stops[idx], stops[idx - 1]]
      } else if (direction === 'down' && idx < stops.length - 1) {
        [stops[idx], stops[idx + 1]] = [stops[idx + 1], stops[idx]]
      }
      return {
        wizard: { ...s.wizard, route: { stops: stops.map((st, i) => ({ ...st, sequence: i + 1 })) } },
      }
    }),

  resetWizard: () => set({ wizard: { ...WIZARD_DEFAULTS, route: {
    stops: [
      { id: 'new-1', type: 'pickup',   name: 'Pickup',        location: '', eta: '', team: 'Logistics Team',  requiresApproval: false, sequence: 1 },
      { id: 'new-2', type: 'delivery', name: 'Final Delivery', location: '', eta: '', team: 'Site Engineers', requiresApproval: false, sequence: 2 },
    ],
  } } }),
}))

export default useShipmentStore
