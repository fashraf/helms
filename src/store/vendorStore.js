import { create } from 'zustand'
import { MOCK_VENDORS, MOCK_OUTSOURCED_MAINT, MULTI_VENDOR_FLOWS, buildVendorRecommendations } from '../api/mock/vendorData'

const useVendorStore = create((set, get) => ({
  // ─── Vendor list ──────────────────────────────────────────────────────
  vendors:      MOCK_VENDORS,
  vendorFilter: { search:'', country:'all', type:'all', mode:'all', status:'all', slaMin: 0 },
  selectedVendorId: null,

  setVendorFilter: (key, val) => set((s) => ({ vendorFilter: { ...s.vendorFilter, [key]: val } })),
  selectVendor:    (id) => set({ selectedVendorId: id }),

  filteredVendors: () => {
    const { vendors, vendorFilter: f } = get()
    return vendors.filter(v => {
      if (f.status  !== 'all' && v.status  !== f.status)  return false
      if (f.country !== 'all' && v.country !== f.country) return false
      if (f.type    !== 'all' && v.type    !== f.type)    return false
      if (f.mode    !== 'all' && !v.modes.includes(f.mode)) return false
      if (f.slaMin > 0 && v.sla < f.slaMin) return false
      if (f.search && !v.name.toLowerCase().includes(f.search.toLowerCase()) &&
                      !v.id.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  // ─── Outsourced maintenance ───────────────────────────────────────────
  outsourcedMaint:   MOCK_OUTSOURCED_MAINT,
  maintFilter:       { status:'all', priority:'all', search:'' },
  setMaintFilter:    (k, v) => set((s) => ({ maintFilter: { ...s.maintFilter, [k]: v } })),

  filteredOsMaint: () => {
    const { outsourcedMaint: list, maintFilter: f } = get()
    return list.filter(m => {
      if (f.status   !== 'all' && m.status   !== f.status)   return false
      if (f.priority !== 'all' && m.priority !== f.priority) return false
      if (f.search && !m.id.toLowerCase().includes(f.search.toLowerCase()) &&
                      !m.equipmentId.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  // ─── Multi-vendor flows ───────────────────────────────────────────────
  flows: MULTI_VENDOR_FLOWS,

  // ─── AI recommendations ───────────────────────────────────────────────
  recCriteria:  'balanced',
  setRecCriteria: (c) => set({ recCriteria: c }),
  getRecommendations: () => buildVendorRecommendations(get().recCriteria),
}))

export default useVendorStore
