import { create } from 'zustand'
import { buildAIProfile, MOCK_AUDIT_LOGS } from '../api/mock/aiData'
import { MOCK_SHIPMENTS } from '../api/mock/shipmentData'

// ─── Demo users for management ────────────────────────────────────────────────
const INITIAL_USERS = [
  { id: 'USR-001', name: 'Abdullah Al-Rashid', email: 'admin@helms.sa',    role: 'admin',    status: 'active', lastLogin: new Date(Date.now()-3600000).toISOString(),  dept: 'System Administration', phone: '+966 50 123 4567' },
  { id: 'USR-002', name: 'Fatima Al-Zahrani',  email: 'manager@helms.sa',  role: 'manager',  status: 'active', lastLogin: new Date(Date.now()-86400000).toISOString(), dept: 'Logistics Operations',  phone: '+966 55 234 5678' },
  { id: 'USR-003', name: 'Khalid Al-Mutairi',  email: 'operator@helms.sa', role: 'operator', status: 'active', lastLogin: new Date(Date.now()-3600000).toISOString(),  dept: 'Fleet Operations',      phone: '+966 56 345 6789' },
  { id: 'USR-004', name: 'Sara Al-Otaibi',     email: 'viewer@helms.sa',   role: 'viewer',   status: 'active', lastLogin: new Date(Date.now()-7200000).toISOString(),  dept: 'Finance & Analytics',   phone: '+966 59 456 7890' },
  { id: 'USR-005', name: 'Hamad Al-Saud',      email: 'hamad@helms.sa',    role: 'operator', status: 'active', lastLogin: new Date(Date.now()-10800000).toISOString(), dept: 'Warehouse Ops',         phone: '+966 50 567 8901' },
  { id: 'USR-006', name: 'Reema Al-Harbi',     email: 'reema@helms.sa',    role: 'viewer',   status: 'inactive', lastLogin: new Date(Date.now()-864000000).toISOString(), dept: 'Customer Relations', phone: '+966 55 678 9012' },
  { id: 'USR-007', name: 'Nawaf Al-Ghamdi',    email: 'nawaf@helms.sa',    role: 'operator', status: 'active', lastLogin: new Date(Date.now()-21600000).toISOString(), dept: 'Fleet Operations',      phone: '+966 56 789 0123' },
  { id: 'USR-008', name: 'Hessa Al-Enazi',     email: 'hessa@helms.sa',    role: 'manager',  status: 'active', lastLogin: new Date(Date.now()-43200000).toISOString(), dept: 'International Ops',     phone: '+966 59 890 1234' },
]

// ─── Roles + permissions ──────────────────────────────────────────────────────
const ALL_PERMISSIONS = {
  shipments:    ['view', 'create', 'edit', 'delete', 'export'],
  fleet:        ['view', 'create', 'edit', 'delete'],
  drivers:      ['view', 'create', 'edit', 'delete'],
  warehouse:    ['view', 'create', 'edit'],
  maintenance:  ['view', 'create', 'approve', 'edit'],
  incidents:    ['view', 'create', 'resolve'],
  workflow:     ['view', 'create', 'activate', 'edit'],
  reports:      ['view', 'create', 'export'],
  users:        ['view', 'create', 'edit', 'delete'],
  roles:        ['view', 'create', 'edit', 'delete'],
  settings:     ['view', 'edit'],
  audit:        ['view'],
  ai:           ['view', 'configure'],
}

const INITIAL_ROLES = [
  {
    id: 'ROL-001', name: 'admin', label: 'Administrator', color: 'amber', userCount: 1,
    description: 'Full system access — no restrictions',
    permissions: Object.fromEntries(Object.entries(ALL_PERMISSIONS).map(([mod, perms]) => [mod, perms])),
  },
  {
    id: 'ROL-002', name: 'manager', label: 'Logistics Manager', color: 'sky', userCount: 2,
    description: 'Manages operations, workflows and reporting',
    permissions: { shipments:['view','create','edit','export'], fleet:['view','edit'], drivers:['view','edit'], warehouse:['view','edit'], maintenance:['view','create','approve'], incidents:['view','create','resolve'], workflow:['view','create','activate'], reports:['view','create','export'], users:['view'], roles:[], settings:['view'], audit:['view'], ai:['view'] },
  },
  {
    id: 'ROL-003', name: 'operator', label: 'Operations Staff', color: 'emerald', userCount: 3,
    description: 'Day-to-day shipment and fleet operations',
    permissions: { shipments:['view','create','edit'], fleet:['view','edit'], drivers:['view'], warehouse:['view'], maintenance:['view','create'], incidents:['view','create'], workflow:['view'], reports:['view'], users:[], roles:[], settings:[], audit:[], ai:['view'] },
  },
  {
    id: 'ROL-004', name: 'warehouse_staff', label: 'Warehouse Staff', color: 'purple', userCount: 1,
    description: 'Warehouse inventory and dock management only',
    permissions: { shipments:['view'], fleet:[], drivers:[], warehouse:['view','edit'], maintenance:[], incidents:['view'], workflow:[], reports:['view'], users:[], roles:[], settings:[], audit:[], ai:[] },
  },
  {
    id: 'ROL-005', name: 'driver', label: 'Driver', color: 'teal', userCount: 0,
    description: 'Limited — view assigned shipments and update status',
    permissions: { shipments:['view'], fleet:['view'], drivers:[], warehouse:[], maintenance:['view'], incidents:['create'], workflow:[], reports:[], users:[], roles:[], settings:[], audit:[], ai:[] },
  },
  {
    id: 'ROL-006', name: 'viewer', label: 'Customer Viewer', color: 'slate', userCount: 2,
    description: 'Read-only access to shipment tracking',
    permissions: { shipments:['view'], fleet:[], drivers:[], warehouse:[], maintenance:[], incidents:[], workflow:[], reports:['view'], users:[], roles:[], settings:[], audit:[], ai:[] },
  },
]

// ─── Settings defaults ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  system: {
    companyName:   'HELMS Logistics Co.',
    timezone:      'AST',
    language:      'en',
    currency:      'SAR',
    dateFormat:    'DD/MM/YYYY',
    sessionTimeout: 60,
    maintenanceMode: false,
  },
  notifications: {
    emailEnabled:  true,
    smsEnabled:    false,
    pushEnabled:   true,
    delayAlerts:   true,
    criticalAlerts:true,
    weeklyReport:  true,
    dailyDigest:   false,
    alertThreshold: 70,
  },
  ai: {
    riskEngineEnabled:      true,
    predictionsEnabled:     true,
    recommendationsEnabled: true,
    autoEscalate:           true,
    confidenceThreshold:    70,
    updateIntervalMins:     15,
    historicalWindowDays:   90,
    models: {
      delay:   'helms-risk-v2',
      damage:  'helms-risk-v2',
      customs: 'helms-customs-v1',
      weather: 'openmeteo-ksa',
    },
  },
  workflow: {
    defaultSLAHours:       24,
    autoApproveBelow:      5000,
    requireDualApproval:   true,
    escalationChain:       ['manager', 'admin'],
    defaultBranch:         'Riyadh HQ',
    vatRate:               15,
  },
}

const useAdminStore = create((set, get) => ({

  // ─── AI Profiles ──────────────────────────────────────────────────────
  aiProfiles:   {},
  aiLoading:    false,
  aiShipmentId: null,

  getAIProfile: (shipmentId) => {
    const { aiProfiles } = get()
    if (aiProfiles[shipmentId]) return aiProfiles[shipmentId]
    const shipment = MOCK_SHIPMENTS.find((s) => s.id === shipmentId)
    const profile  = buildAIProfile(shipment)
    set((s) => ({ aiProfiles: { ...s.aiProfiles, [shipmentId]: profile } }))
    return profile
  },

  setAIShipment: (id) => set({ aiShipmentId: id }),

  // ─── Audit logs ───────────────────────────────────────────────────────
  auditLogs:   MOCK_AUDIT_LOGS,
  auditFilter: { search: '', module: 'all', status: 'all', user: 'all', dateRange: '7d' },

  setAuditFilter: (key, val) => set((s) => ({
    auditFilter: { ...s.auditFilter, [key]: val },
  })),

  filteredAuditLogs: () => {
    const { auditLogs, auditFilter: f } = get()
    const cutoff = f.dateRange === '24h' ? 24 : f.dateRange === '7d' ? 168 : f.dateRange === '30d' ? 720 : 99999
    return auditLogs.filter((log) => {
      const age = (Date.now() - new Date(log.timestamp)) / 3600000
      if (age > cutoff) return false
      if (f.module !== 'all' && log.module !== f.module) return false
      if (f.status !== 'all' && log.status !== f.status) return false
      if (f.user !== 'all' && log.userId !== f.user) return false
      if (f.search && !log.action.toLowerCase().includes(f.search.toLowerCase()) &&
                      !log.user.toLowerCase().includes(f.search.toLowerCase()) &&
                      !log.id.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  // ─── Users ────────────────────────────────────────────────────────────
  users:      INITIAL_USERS,
  userFilter: { search: '', role: 'all', status: 'all' },

  setUserFilter: (key, val) => set((s) => ({ userFilter: { ...s.userFilter, [key]: val } })),

  filteredUsers: () => {
    const { users, userFilter: f } = get()
    return users.filter((u) => {
      if (f.role !== 'all' && u.role !== f.role) return false
      if (f.status !== 'all' && u.status !== f.status) return false
      if (f.search && !u.name.toLowerCase().includes(f.search.toLowerCase()) &&
                      !u.email.toLowerCase().includes(f.search.toLowerCase())) return false
      return true
    })
  },

  createUser: (data) => {
    const user = { id: `USR-${String(Date.now()).slice(-3)}`, status: 'active', lastLogin: null, ...data }
    set((s) => ({ users: [...s.users, user] }))
  },
  updateUser: (id, data) => set((s) => ({ users: s.users.map((u) => u.id !== id ? u : { ...u, ...data }) })),
  deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
  toggleUserStatus: (id) => set((s) => ({
    users: s.users.map((u) => u.id !== id ? u : { ...u, status: u.status === 'active' ? 'inactive' : 'active' }),
  })),

  // ─── Roles ────────────────────────────────────────────────────────────
  roles:           INITIAL_ROLES,
  selectedRoleId:  null,
  selectRole:      (id) => set({ selectedRoleId: id }),

  updateRolePermission: (roleId, module, perm, enabled) =>
    set((s) => ({
      roles: s.roles.map((r) => {
        if (r.id !== roleId) return r
        const perms = enabled
          ? [...new Set([...(r.permissions[module] ?? []), perm])]
          : (r.permissions[module] ?? []).filter((p) => p !== perm)
        return { ...r, permissions: { ...r.permissions, [module]: perms } }
      }),
    })),

  // ─── Settings ─────────────────────────────────────────────────────────
  settings:    DEFAULT_SETTINGS,
  settingsDirty: false,

  setSetting: (section, key, value) =>
    set((s) => ({
      settings:      { ...s.settings, [section]: { ...s.settings[section], [key]: value } },
      settingsDirty: true,
    })),

  setNestedSetting: (section, sub, key, value) =>
    set((s) => ({
      settings: {
        ...s.settings,
        [section]: { ...s.settings[section], [sub]: { ...s.settings[section][sub], [key]: value } },
      },
      settingsDirty: true,
    })),

  saveSettings: () => set({ settingsDirty: false }),
}))

export default useAdminStore
