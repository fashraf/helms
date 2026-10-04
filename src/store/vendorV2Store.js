import { create } from 'zustand'
import { VENDORS_V2, recommendVendor } from '../api/mock/vendorV2Data'

let _counter = VENDORS_V2.length + 1001

const useVendorV2Store = create((set, get) => ({
  vendors:      VENDORS_V2,
  filter:       { search: '', type: 'all', country: 'all', status: 'all', rating: 0, service: 'all' },
  viewMode:     'list',
  selectedId:   null,

  setFilter:    (k, v) => set(s => ({ filter: { ...s.filter, [k]: v } })),
  setViewMode:  (m) => set({ viewMode: m }),
  selectVendor: (id) => set({ selectedId: id }),

  filteredVendors: () => {
    const { vendors, filter: f } = get()
    return vendors.filter(v => {
      if (f.status  !== 'all' && v.status  !== f.status)  return false
      if (f.type    !== 'all' && v.type    !== f.type)    return false
      if (f.country !== 'all' && v.country !== f.country) return false
      if (f.service !== 'all' && !v.services.includes(f.service)) return false
      if (f.rating > 0 && v.rating < f.rating) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        const hit = v.name.toLowerCase().includes(q) ||
          v.code.toLowerCase().includes(q) ||
          v.primaryContact.name.toLowerCase().includes(q) ||
          v.primaryContact.email.toLowerCase().includes(q) ||
          v.primaryContact.mobile.includes(q) ||
          v.regNumber.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  },

  getVendor: (id) => get().vendors.find(v => v.id === id),

  createVendor: (data) => {
    const id = `VEN-${String(++_counter).padStart(4, '0')}`
    const vendor = {
      id,
      code: `VEN${_counter}`,
      status: 'pending_approval',
      rating: 0,
      ratings: { categories: {}, overall: 0, totalReviews: 0, trend: [] },
      slaCompliance: 0,
      activeShipments: 0, completedShipments: 0, activeRFQs: 0,
      documents: [], shipments: [], rfqs: [], contracts: [], auditHistory: [
        { id: `${id}-AUD-0`, date: new Date().toISOString(), user: 'Abdullah Al-Rashid', action: 'Vendor Created', field: null, old: null, new: null },
      ],
      createdAt: new Date().toISOString(),
      createdBy: 'Abdullah Al-Rashid',
      ...data,
    }
    set(s => ({ vendors: [vendor, ...s.vendors] }))
    return id
  },

  updateVendor: (id, patch) =>
    set(s => ({
      vendors: s.vendors.map(v => v.id !== id ? v : {
        ...v, ...patch,
        auditHistory: [
          { id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Abdullah Al-Rashid', action: 'Vendor Updated', field: 'Profile', old: null, new: null },
          ...v.auditHistory,
        ],
      }),
    })),

  blacklistVendor: (id, reason) =>
    set(s => ({
      vendors: s.vendors.map(v => v.id !== id ? v : {
        ...v, status: 'blacklisted', blacklistReason: reason,
        blacklistedAt: new Date().toISOString(), blacklistedBy: 'Abdullah Al-Rashid',
        auditHistory: [
          { id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Abdullah Al-Rashid', action: 'Blacklist Action', field: 'Status', old: v.status, new: 'blacklisted' },
          ...v.auditHistory,
        ],
      }),
    })),

  reactivateVendor: (id) =>
    set(s => ({
      vendors: s.vendors.map(v => v.id !== id ? v : {
        ...v, status: 'active', blacklistReason: null, blacklistedAt: null,
        auditHistory: [
          { id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Abdullah Al-Rashid', action: 'Status Changed', field: 'Status', old: 'blacklisted', new: 'active' },
          ...v.auditHistory,
        ],
      }),
    })),

  archiveVendor: (id) =>
    set(s => ({ vendors: s.vendors.map(v => v.id !== id ? v : { ...v, status: 'inactive' }) })),

  // ─── AI recommendation ────────────────────────────────────────────────
  getRecommendation: (route) => recommendVendor(route),
}))

export default useVendorV2Store
