// ─── User types (with ID prefix) ──────────────────────────────────────────────
export const USER_TYPES = {
  employee:   { id: 'employee',   label: 'Employee',   prefix: 'EMP', icon: '👤', color: '#2563EB' },
  vendor:     { id: 'vendor',     label: 'Vendor',     prefix: 'VEN', icon: '🏢', color: '#7C3AED' },
  part_time:  { id: 'part_time',  label: 'Part Time',  prefix: 'PT',  icon: '⏱', color: '#D97706'  },
}

// ─── User statuses ────────────────────────────────────────────────────────────
export const USER_STATUSES = {
  active:        { label: 'Active',        cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  inactive:      { label: 'Inactive',      cls: 'text-slate-500 bg-slate-50 border-slate-200'       },
  locked:        { label: 'Locked',        cls: 'text-red-600 bg-red-50 border-red-200'             },
  pending:       { label: 'Pending',       cls: 'text-amber-600 bg-amber-50 border-amber-200'       },
  expired:       { label: 'Expired',       cls: 'text-orange-600 bg-orange-50 border-orange-200'    },
}

export const DEPARTMENTS = [
  'System Administration', 'Logistics Operations', 'Fleet Operations',
  'Warehouse Ops', 'International Ops', 'Customer Relations',
  'Finance & Analytics', 'IT & Engineering', 'Compliance & QA',
  'Field Operations', 'Sales', 'HR',
]

export const DESIGNATIONS = [
  'System Administrator', 'Operations Director', 'Operations Manager',
  'Logistics Coordinator', 'Fleet Supervisor', 'Warehouse Supervisor',
  'Project Manager', 'Document Controller', 'Driver Coordinator',
  'Customs Officer', 'Finance Analyst', 'Compliance Officer',
  'Account Manager', 'Customer Support Specialist', 'Field Engineer',
]

export const NATIONALITIES = [
  'Saudi', 'Indian', 'Pakistani', 'Egyptian', 'Filipino',
  'Bangladeshi', 'Yemeni', 'Jordanian', 'Sudanese', 'British',
  'American', 'German', 'French', 'Other',
]

export const ROLES_OPTIONS = [
  { id: 'admin',       label: 'Super Admin',          desc: 'Full system access — no restrictions'   },
  { id: 'manager',     label: 'Logistics Manager',    desc: 'Manages logistics operations & teams'    },
  { id: 'operator',    label: 'Operator',             desc: 'Day-to-day operations execution'         },
  { id: 'warehouse',   label: 'Warehouse Supervisor', desc: 'Warehouse access + shipment visibility'  },
  { id: 'driver',      label: 'Driver Coordinator',   desc: 'Driver assignments & fleet tracking'     },
  { id: 'customs',     label: 'Customs Officer',      desc: 'International ops & customs clearance'   },
  { id: 'finance',     label: 'Finance Team',         desc: 'Financial reports — read-only & export'  },
  { id: 'vendor_mgr',  label: 'Vendor Manager',       desc: 'Full vendor management & SLA tracking'   },
  { id: 'auditor',     label: 'Read-Only Auditor',    desc: 'View-only access + full audit log'       },
  { id: 'viewer',      label: 'Viewer',               desc: 'Limited dashboard view'                 },
]

// ─── ID generators ────────────────────────────────────────────────────────────
let _counters = { employee: 12, vendor: 5, part_time: 3 }

export function nextUserId(type = 'employee') {
  const prefix = USER_TYPES[type]?.prefix ?? 'EMP'
  _counters[type] = (_counters[type] ?? 0) + 1
  return `${prefix}-${String(_counters[type]).padStart(5, '0')}`
}

// ─── Enriched seed users ──────────────────────────────────────────────────────
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

export const EXTENDED_USERS = [
  { id: 'EMP-00001', name: 'Khalid Salman', email: 'admin@helms.sa',    type: 'employee',  role: 'admin',     status: 'active', lastLogin: past(1),    dept: 'System Administration', designation: 'System Administrator', phone: '+966 50 123 4567', mobile: '+966 50 123 4567', nationality: 'Saudi', nationalId: '1010234567', nationalIdExpiry: future(365*24), passportNumber: 'A12345678', passportExpiry: future(720*24), neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*30) },
  { id: 'EMP-00002', name: 'Fatima Al-Zahrani',  email: 'manager@helms.sa',  type: 'employee',  role: 'manager',   status: 'active', lastLogin: past(24),   dept: 'Logistics Operations',  designation: 'Operations Director',  phone: '+966 55 234 5678', mobile: '+966 55 234 5678', nationality: 'Saudi', nationalId: '1010345678', nationalIdExpiry: future(180*24), passportNumber: '',         passportExpiry: null,           neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*15) },
  { id: 'EMP-00003', name: 'Khalid Al-Mutairi',  email: 'operator@helms.sa', type: 'employee',  role: 'operator',  status: 'active', lastLogin: past(1),    dept: 'Fleet Operations',      designation: 'Fleet Supervisor',     phone: '+966 56 345 6789', mobile: '+966 56 345 6789', nationality: 'Saudi', nationalId: '1010456789', nationalIdExpiry: future(540*24), passportNumber: '',         passportExpiry: null,           neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*60) },
  { id: 'EMP-00004', name: 'Sara Al-Otaibi',     email: 'viewer@helms.sa',   type: 'employee',  role: 'viewer',    status: 'active', lastLogin: past(2),    dept: 'Finance & Analytics',   designation: 'Finance Analyst',      phone: '+966 59 456 7890', mobile: '+966 59 456 7890', nationality: 'Saudi', nationalId: '1010567890', nationalIdExpiry: future(700*24), passportNumber: '',         passportExpiry: null,           neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*45) },
  { id: 'EMP-00005', name: 'Hamad Al-Saud',      email: 'hamad@helms.sa',    type: 'employee',  role: 'operator',  status: 'active', lastLogin: past(3),    dept: 'Warehouse Ops',         designation: 'Warehouse Supervisor', phone: '+966 50 567 8901', mobile: '+966 50 567 8901', nationality: 'Saudi', nationalId: '1010678901', nationalIdExpiry: future(420*24), passportNumber: '',         passportExpiry: null,           neverExpires: true,  accountExpiry: null, mustChangePassword: true,  lastPasswordChange: past(24*92) },
  { id: 'EMP-00006', name: 'Reema Al-Harbi',     email: 'reema@helms.sa',    type: 'employee',  role: 'viewer',    status: 'inactive', lastLogin: past(240), dept: 'Customer Relations',    designation: 'Customer Support Specialist', phone: '+966 55 678 9012', mobile: '+966 55 678 9012', nationality: 'Saudi', nationalId: '1010789012', nationalIdExpiry: future(190*24), passportNumber: '', passportExpiry: null, neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*180) },
  { id: 'EMP-00007', name: 'Nawaf Al-Ghamdi',    email: 'nawaf@helms.sa',    type: 'employee',  role: 'operator',  status: 'active', lastLogin: past(6),    dept: 'Fleet Operations',      designation: 'Driver Coordinator',   phone: '+966 56 789 0123', mobile: '+966 56 789 0123', nationality: 'Saudi', nationalId: '1010890123', nationalIdExpiry: future(620*24), passportNumber: '',         passportExpiry: null,           neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*30) },
  { id: 'EMP-00008', name: 'Hessa Al-Enazi',     email: 'hessa@helms.sa',    type: 'employee',  role: 'manager',   status: 'active', lastLogin: past(12),   dept: 'International Ops',     designation: 'Operations Manager',   phone: '+966 59 890 1234', mobile: '+966 59 890 1234', nationality: 'Saudi', nationalId: '1010901234', nationalIdExpiry: future(380*24), passportNumber: 'A87654321', passportExpiry: future(900*24), neverExpires: true,  accountExpiry: null, mustChangePassword: false, lastPasswordChange: past(24*22) },
  { id: 'VEN-00001', name: 'Mohammed Al-Harbi',  email: 'm.harbi@fedex.sa.com', type: 'vendor',  role: 'vendor_mgr', status: 'active', lastLogin: past(48), dept: 'External',              designation: 'Account Manager',      phone: '+966 50 111 2222', mobile: '+966 50 111 2222', nationality: 'Saudi', nationalId: '1011000001', nationalIdExpiry: future(280*24), passportNumber: '',         passportExpiry: null,           neverExpires: false, accountExpiry: future(120*24), mustChangePassword: false, lastPasswordChange: past(24*5) },
  { id: 'VEN-00002', name: 'Rajesh Kumar',       email: 'r.kumar@indiapost.in', type: 'vendor',  role: 'vendor_mgr', status: 'active', lastLogin: past(72), dept: 'External',              designation: 'Logistics Head',       phone: '+91 98 7654 3210', mobile: '+91 98 7654 3210', nationality: 'Indian', nationalId: 'ABCDE1234F',    nationalIdExpiry: future(900*24), passportNumber: 'P9876543', passportExpiry: future(1095*24), neverExpires: false, accountExpiry: future(45*24),  mustChangePassword: false, lastPasswordChange: past(24*10) },
  { id: 'PT-00001',  name: 'Ali Hassan',         email: 'a.hassan@helms.sa', type: 'part_time', role: 'operator',  status: 'active', lastLogin: past(96),   dept: 'Field Operations',      designation: 'Field Engineer',       phone: '+966 50 999 8888', mobile: '+966 50 999 8888', nationality: 'Yemeni', nationalId: '2020111111', nationalIdExpiry: future(7*24), passportNumber: 'Y123456', passportExpiry: future(450*24), neverExpires: false, accountExpiry: future(7*24), mustChangePassword: false, lastPasswordChange: past(24*40) },
  { id: 'PT-00002',  name: 'Priya Patel',        email: 'p.patel@helms.sa',  type: 'part_time', role: 'operator',  status: 'locked', lastLogin: past(720), dept: 'Field Operations',      designation: 'Field Engineer',       phone: '+91 97 1111 2222', mobile: '+91 97 1111 2222', nationality: 'Indian', nationalId: 'XYZ123',     nationalIdExpiry: past(1*24), passportNumber: 'IN555444', passportExpiry: future(200*24), neverExpires: false, accountExpiry: past(1*24), mustChangePassword: false, lastPasswordChange: past(24*120) },
]

// ─── Password reset audit log ─────────────────────────────────────────────────
export const PASSWORD_RESET_LOG = [
  { id: 'PWR-1', userId: 'EMP-00005', date: past(24), by: 'Abdullah Al-Rashid', reason: 'User forgot password', method: 'admin_reset'    },
  { id: 'PWR-2', userId: 'PT-00001',  date: past(72), by: 'Abdullah Al-Rashid', reason: 'Onboarding',          method: 'admin_reset'    },
  { id: 'PWR-3', userId: 'EMP-00003', date: past(720), by: 'Abdullah Al-Rashid', reason: '90-day policy',      method: 'forced_rotation' },
]

// ─── Account unlock log ───────────────────────────────────────────────────────
export const ACCOUNT_UNLOCK_LOG = [
  { id: 'UNL-1', userId: 'PT-00002', date: past(360), by: 'Abdullah Al-Rashid', reason: 'Account expired — pending renewal' },
]
