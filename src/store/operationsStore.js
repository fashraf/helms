import { create } from 'zustand'
import {
  MOCK_VEHICLES, MOCK_DRIVERS, MOCK_WAREHOUSES,
  MOCK_MAINTENANCE, MOCK_INCIDENTS, MOCK_ROUTE_ASSIGNMENTS,
} from '../api/mock/operationsData'

const useOperationsStore = create((set, get) => ({

  // ─── Fleet ──────────────────────────────────────────────────────────
  vehicles:        MOCK_VEHICLES,
  vehicleFilter:   { status: 'all', type: 'all', search: '' },
  selectedVehicleId: null,

  setVehicleFilter: (key, val) => set((s) => ({
    vehicleFilter: { ...s.vehicleFilter, [key]: val },
  })),
  selectVehicle: (id) => set({ selectedVehicleId: id }),

  filteredVehicles: () => {
    const { vehicles, vehicleFilter: f } = get()
    return vehicles.filter((v) => {
      if (f.status !== 'all' && v.status !== f.status) return false
      if (f.type !== 'all' && v.type !== f.type) return false
      if (f.search && !v.id.toLowerCase().includes(f.search.toLowerCase()) &&
                      !v.model.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  updateVehicleStatus: (id, status) =>
    set((s) => ({
      vehicles: s.vehicles.map((v) => v.id !== id ? v : { ...v, status }),
    })),

  // ─── Drivers ─────────────────────────────────────────────────────────
  drivers:        MOCK_DRIVERS,
  driverFilter:   { status: 'all', search: '' },
  selectedDriverId: null,

  setDriverFilter: (key, val) => set((s) => ({
    driverFilter: { ...s.driverFilter, [key]: val },
  })),
  selectDriver: (id) => set({ selectedDriverId: id }),

  filteredDrivers: () => {
    const { drivers, driverFilter: f } = get()
    return drivers.filter((d) => {
      if (f.status !== 'all' && d.status !== f.status) return false
      if (f.search && !d.name.toLowerCase().includes(f.search.toLowerCase()) &&
                      !d.id.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  // ─── Warehouses ──────────────────────────────────────────────────────
  warehouses:      MOCK_WAREHOUSES,
  selectedWarehouseId: null,
  selectWarehouse: (id) => set({ selectedWarehouseId: id }),

  warehouseStats: () => {
    const whs = get().warehouses
    return {
      total:    whs.length,
      avgCap:   Math.round(whs.reduce((a, w) => a + w.capacity, 0) / whs.length),
      critical: whs.filter((w) => w.capacity > 90).length,
      totalDocks: whs.reduce((a, w) => a + w.totalDocks, 0),
      activeDocks: whs.reduce((a, w) => a + w.activeDocks, 0),
    }
  },

  // ─── Maintenance ─────────────────────────────────────────────────────
  maintenance:     MOCK_MAINTENANCE,
  maintFilter:     { status: 'all', priority: 'all', search: '' },

  setMaintFilter: (key, val) => set((s) => ({
    maintFilter: { ...s.maintFilter, [key]: val },
  })),

  filteredMaintenance: () => {
    const { maintenance, maintFilter: f } = get()
    return maintenance.filter((m) => {
      if (f.status !== 'all' && m.status !== f.status) return false
      if (f.priority !== 'all' && m.priority !== f.priority) return false
      if (f.search && !m.vehicleId.toLowerCase().includes(f.search.toLowerCase()) &&
                      !m.id.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  approveMaintRequest: (id) =>
    set((s) => ({
      maintenance: s.maintenance.map((m) =>
        m.id !== id ? m : { ...m, status: 'approved', approvedBy: 'Abdullah Al-Rashid', approvedAt: new Date().toISOString() }
      ),
    })),

  updateMaintStatus: (id, status) =>
    set((s) => ({
      maintenance: s.maintenance.map((m) =>
        m.id !== id ? m : { ...m, status, completedAt: status === 'completed' ? new Date().toISOString() : m.completedAt }
      ),
    })),

  addMaintRequest: (req) =>
    set((s) => ({
      maintenance: [
        {
          id:          `MR-${3000 + s.maintenance.length}`,
          status:      'pending',
          requestedAt: new Date().toISOString(),
          approvedBy:  null, approvedAt: null,
          assignedTech: null, completedAt: null,
          actualCost:   null,
          ...req,
        },
        ...s.maintenance,
      ],
    })),

  // ─── Incidents ───────────────────────────────────────────────────────
  incidents:      MOCK_INCIDENTS,
  incidentFilter: { status: 'all', severity: 'all', type: 'all', search: '' },

  setIncidentFilter: (key, val) => set((s) => ({
    incidentFilter: { ...s.incidentFilter, [key]: val },
  })),

  filteredIncidents: () => {
    const { incidents, incidentFilter: f } = get()
    return incidents.filter((i) => {
      if (f.status !== 'all' && i.status !== f.status) return false
      if (f.severity !== 'all' && i.severity !== f.severity) return false
      if (f.type !== 'all' && i.type !== f.type) return false
      if (f.search && !i.id.toLowerCase().includes(f.search.toLowerCase()) &&
                      !i.vehicleId.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  resolveIncident: (id) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id !== id ? i : { ...i, status: 'resolved', resolvedAt: new Date().toISOString() }
      ),
    })),

  // ─── Routes ──────────────────────────────────────────────────────────
  routeAssignments: MOCK_ROUTE_ASSIGNMENTS,
  routeFilter:      { status: 'all', search: '' },
  setRouteFilter:   (key, val) => set((s) => ({ routeFilter: { ...s.routeFilter, [key]: val } })),

  filteredRoutes: () => {
    const { routeAssignments, routeFilter: f } = get()
    return routeAssignments.filter((r) => {
      if (f.status !== 'all' && r.status !== f.status) return false
      if (f.search && !r.route.name.toLowerCase().includes(f.search.toLowerCase()) &&
                      !r.shipmentId.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },
}))

export default useOperationsStore
