// ─── Route Paths ────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN:                   '/login',
  DASHBOARD:               '/dashboard',
  SHIPMENTS:               '/shipments',
  LOCAL_OPERATIONS:        '/local-operations',
  INTERNATIONAL_OPERATIONS:'/international-operations',
  WORKFLOW_ENGINE:         '/workflow',
  FLEET_MANAGEMENT:        '/fleet',
  DRIVERS:                 '/drivers',
  MAINTENANCE:             '/maintenance',
  WAREHOUSE:               '/warehouse',
  USERS:                   '/users',
  ROLES:                   '/roles',
  SETTINGS:                '/settings',
  AUDIT_LOGS:              '/audit-logs',
  REPORTS:                 '/reports',
}

// ─── User Roles ──────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'admin',
  MANAGER:  'manager',
  OPERATOR: 'operator',
  VIEWER:   'viewer',
}

export const ROLE_LABELS = {
  admin:    'Administrator',
  manager:  'Manager',
  operator: 'Operator',
  viewer:   'Viewer',
}

export const ROLE_COLORS = {
  admin:    'text-amber-400 bg-amber-500/10',
  manager:  'text-sky-400 bg-sky-500/10',
  operator: 'text-emerald-400 bg-emerald-500/10',
  viewer:   'text-slate-400 bg-slate-500/10',
}

// ─── Role-based default redirect ────────────────────────────────────────────
export const ROLE_REDIRECT = {
  admin:    ROUTES.DASHBOARD,
  manager:  ROUTES.DASHBOARD,
  operator: ROUTES.SHIPMENTS,
  viewer:   ROUTES.REPORTS,
}

// ─── Shipment Status ─────────────────────────────────────────────────────────
export const SHIPMENT_STATUS = {
  PENDING:   'pending',
  IN_TRANSIT:'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  ON_HOLD:   'on_hold',
}

export const STATUS_LABELS = {
  pending:    'Pending',
  in_transit: 'In Transit',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
  on_hold:    'On Hold',
}

export const STATUS_COLORS = {
  pending:    'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  in_transit: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  delivered:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cancelled:  'text-red-400 bg-red-500/10 border-red-500/20',
  on_hold:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

// ─── Fleet Status ────────────────────────────────────────────────────────────
export const FLEET_STATUS = {
  ON_ROUTE:    'on_route',
  IDLE:        'idle',
  MAINTENANCE: 'maintenance',
  OUT_OF_SVC:  'out_of_service',
}

export const FLEET_STATUS_COLORS = {
  on_route:     'text-emerald-400 bg-emerald-500/10',
  idle:         'text-slate-400 bg-slate-500/10',
  maintenance:  'text-amber-400 bg-amber-500/10',
  out_of_service:'text-red-400 bg-red-500/10',
}

// ─── API Endpoints ───────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:   '/auth/login',
    LOGOUT:  '/auth/logout',
    REFRESH: '/auth/refresh',
    ME:      '/auth/me',
  },
  SHIPMENTS:     '/shipments',
  FLEET:         '/fleet',
  DRIVERS:       '/drivers',
  MAINTENANCE:   '/maintenance',
  WAREHOUSE:     '/warehouse',
  USERS:         '/users',
  ROLES:         '/roles',
  AUDIT:         '/audit-logs',
  REPORTS:       '/reports',
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20

// ─── Demo credentials ────────────────────────────────────────────────────────
export const DEMO_CREDENTIALS = [
  { email: 'admin@helms.sa',    password: 'Admin123!',    role: 'admin',    label: 'Administrator' },
  { email: 'manager@helms.sa',  password: 'Manager123!',  role: 'manager',  label: 'Manager' },
  { email: 'operator@helms.sa', password: 'Operator123!', role: 'operator', label: 'Operator' },
  { email: 'viewer@helms.sa',   password: 'Viewer123!',   role: 'viewer',   label: 'Viewer' },
]
