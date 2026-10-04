// ═══════════════════════════════════════════════════════════════════════════════
// Hierarchical permission tree: Menu → Submenu → Page → Action
//
// Permissions are stored on a Role as a flat map:
//   { "<menuId>.<submenuId>.<pageId>.<actionId>": true }
//
// Action ids are the standardised PERM_TYPES below.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Standard permission actions ──────────────────────────────────────────────
export const PERM_ACTIONS = [
  { id: 'view',              label: 'View',              icon: '👁', level: 'basic'    },
  { id: 'create',            label: 'Create',            icon: '➕', level: 'standard' },
  { id: 'edit',              label: 'Edit',              icon: '✏️', level: 'standard' },
  { id: 'deactivate',        label: 'Deactivate',        icon: '⛔', level: 'elevated' },
  { id: 'approve',           label: 'Approve',           icon: '✅', level: 'elevated' },
  { id: 'reject',            label: 'Reject',            icon: '❌', level: 'elevated' },
  { id: 'return',            label: 'Return for Recheck',icon: '↩️', level: 'elevated' },
  { id: 'export_excel',      label: 'Export Excel',      icon: '📊', level: 'standard' },
  { id: 'export_pdf',        label: 'Export PDF',        icon: '📄', level: 'standard' },
  { id: 'print',             label: 'Print',             icon: '🖨', level: 'basic'    },
  { id: 'assign',            label: 'Assign',            icon: '🔗', level: 'standard' },
  { id: 'upload_docs',       label: 'Upload Documents',  icon: '📤', level: 'standard' },
  { id: 'download_docs',     label: 'Download Documents',icon: '📥', level: 'standard' },
  { id: 'view_financial',    label: 'View Financial',    icon: '💰', level: 'elevated' },
  { id: 'manage_settings',   label: 'Manage Settings',   icon: '⚙️', level: 'admin'    },
  { id: 'manage_workflow',   label: 'Manage Workflow',   icon: '🔀', level: 'admin'    },
]

// ─── Permission dependencies ──────────────────────────────────────────────────
// "If you tick X you also need Y"
export const PERM_DEPENDENCIES = {
  edit:           ['view'],
  deactivate:     ['view'],
  approve:        ['view'],
  reject:         ['view'],
  return:         ['view'],
  export_excel:   ['view'],
  export_pdf:     ['view'],
  print:          ['view'],
  assign:         ['view'],
  upload_docs:    ['view'],
  download_docs:  ['view'],
  view_financial: ['view'],
  create:         ['view'],
}

// ─── Default action sets per page ─────────────────────────────────────────────
// Re-used below to avoid repetition
const A_CRUD       = ['view','create','edit','deactivate']
const A_CRUD_APR   = ['view','create','edit','deactivate','approve','reject','return']
const A_LIST       = ['view','export_excel','export_pdf','print']
const A_FULL_OPS   = ['view','create','edit','deactivate','approve','reject','return','assign','upload_docs','download_docs','export_excel','export_pdf','print']
const A_FINANCIAL  = ['view','create','edit','view_financial','export_excel','export_pdf']
const A_REPORT     = ['view','export_excel','export_pdf','print']
const A_SETTINGS   = ['view','edit','manage_settings']

// ─── Hierarchical menu tree ───────────────────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for menus and permissions.
// Each leaf "page" has an array of supported actions.
export const PERMISSION_TREE = [
  {
    id: 'dashboard', label: 'Dashboard', icon: '📊', menuPath: '/dashboard',
    submenus: [{
      id: 'dashboard_home', label: 'Dashboard Home', menuPath: '/dashboard',
      pages: [
        { id: 'main', label: 'Main Dashboard', actions: ['view','export_excel','export_pdf'] },
      ],
    }],
  },
  {
    id: 'projects', label: 'Projects', icon: '📋', menuPath: '/projects',
    submenus: [{
      id: 'projects_main', label: 'Project Management',
      pages: [
        { id: 'list',    label: 'Project List',    menuPath: '/projects',        actions: A_FULL_OPS },
        { id: 'create',  label: 'Create Project',  menuPath: '/projects/create', actions: ['view','create'] },
      ],
    }],
  },
  {
    id: 'rfq', label: 'RFQ Management', icon: '📝', menuPath: '/rfq',
    submenus: [{
      id: 'rfq_main', label: 'RFQ',
      pages: [
        { id: 'list',   label: 'RFQ List',    menuPath: '/rfq',        actions: A_FULL_OPS },
        { id: 'create', label: 'Create RFQ',  menuPath: '/rfq/create', actions: ['view','create'] },
      ],
    }],
  },
  {
    id: 'vendors', label: 'Vendor Management', icon: '🏢', menuPath: '/vendors-v2',
    submenus: [{
      id: 'vendor_main', label: 'Vendors',
      pages: [
        { id: 'list',      label: 'Vendor List',      menuPath: '/vendors-v2',           actions: A_FULL_OPS },
        { id: 'create',    label: 'Create Vendor',    menuPath: '/vendors-v2/create',    actions: ['view','create'] },
        { id: 'contracts', label: 'Contracts',        menuPath: '/vendors-v2',           actions: [...A_CRUD,'upload_docs','download_docs','export_pdf'] },
        { id: 'ratings',   label: 'Ratings & Reviews',menuPath: '/vendors-v2',           actions: ['view','create','edit'] },
        { id: 'blacklist', label: 'Blacklist',        menuPath: '/vendors-blacklist',    actions: ['view','approve','reject'] },
      ],
    }],
  },
  {
    id: 'local_ops', label: 'Local Operations', icon: '🚛', menuPath: '/shipments/local',
    submenus: [{
      id: 'local_ship', label: 'Local Shipments',
      pages: [
        { id: 'list',   label: 'Shipment List',    menuPath: '/shipments/local',        actions: A_FULL_OPS },
        { id: 'create', label: 'Create Shipment',  menuPath: '/shipments/local/create', actions: ['view','create','upload_docs'] },
      ],
    }],
  },
  {
    id: 'intl_ops', label: 'International Operations', icon: '✈️', menuPath: '/shipments/intl',
    submenus: [{
      id: 'intl_ship', label: 'International Shipments',
      pages: [
        { id: 'list',   label: 'Shipment List',    menuPath: '/shipments/intl',         actions: [...A_FULL_OPS, 'view_financial'] },
        { id: 'create', label: 'Create Shipment',  menuPath: '/shipments/intl/create',  actions: ['view','create','upload_docs','view_financial'] },
      ],
    }],
  },
  {
    id: 'warehouses', label: 'Warehouses', icon: '🏭', menuPath: '/warehouse',
    submenus: [{
      id: 'warehouse_main', label: 'Warehouse Operations',
      pages: [
        { id: 'list', label: 'Warehouse List', menuPath: '/warehouse', actions: A_FULL_OPS },
      ],
    }],
  },
  {
    id: 'fleet', label: 'Fleet', icon: '🚚', menuPath: '/fleet',
    submenus: [{
      id: 'fleet_main', label: 'Fleet Management',
      pages: [
        { id: 'list',    label: 'Vehicle List',  menuPath: '/fleet',   actions: A_FULL_OPS },
        { id: 'drivers', label: 'Drivers',       menuPath: '/drivers', actions: A_FULL_OPS },
      ],
    }],
  },
  {
    id: 'maintenance', label: 'Maintenance', icon: '🔧', menuPath: '/maintenance',
    submenus: [{
      id: 'maint_main', label: 'Maintenance Operations',
      pages: [
        { id: 'work_orders', label: 'Work Orders', menuPath: '/maintenance', actions: A_FULL_OPS },
      ],
    }],
  },
  {
    id: 'workflows', label: 'Workflows', icon: '🔀', menuPath: '/workflow',
    submenus: [{
      id: 'workflow_main', label: 'Workflow Engine',
      pages: [
        { id: 'designer', label: 'Workflow Designer', menuPath: '/workflow', actions: ['view','create','edit','deactivate','manage_workflow'] },
      ],
    }],
  },
  {
    id: 'reports', label: 'Reports', icon: '📈', menuPath: '/reports',
    submenus: [{
      id: 'reports_main', label: 'Reports',
      pages: [
        { id: 'operational', label: 'Operational Reports', menuPath: '/reports', actions: A_REPORT },
        { id: 'financial',   label: 'Financial Reports',   menuPath: '/reports', actions: [...A_REPORT, 'view_financial'] },
        { id: 'vendor',      label: 'Vendor Reports',      menuPath: '/reports', actions: A_REPORT },
        { id: 'shipment',    label: 'Shipment Reports',    menuPath: '/reports', actions: A_REPORT },
      ],
    }],
  },
  {
    id: 'audit', label: 'Audit Logs', icon: '📜', menuPath: '/audit',
    submenus: [{
      id: 'audit_main', label: 'Audit',
      pages: [
        { id: 'logs', label: 'Audit Logs', menuPath: '/audit', actions: ['view','export_excel','export_pdf'] },
      ],
    }],
  },
  {
    id: 'settings', label: 'Settings', icon: '⚙️', menuPath: '/settings',
    submenus: [{
      id: 'settings_main', label: 'System Settings',
      pages: [
        { id: 'users',       label: 'Users',       menuPath: '/users',    actions: [...A_CRUD,'reset_password' ?? 'edit'].filter(Boolean) },
        { id: 'roles',       label: 'Roles',       menuPath: '/roles',    actions: A_CRUD },
        { id: 'permissions', label: 'Permissions', menuPath: '/roles',    actions: A_CRUD },
        { id: 'master_data', label: 'Master Data', menuPath: '/settings', actions: A_SETTINGS },
      ],
    }],
  },
  {
    id: 'finance', label: 'Finance', icon: '💰', menuPath: '/reports',
    submenus: [{
      id: 'finance_main', label: 'Finance',
      pages: [
        { id: 'cost_tracking',   label: 'Cost Tracking',   menuPath: '/reports', actions: A_FINANCIAL },
        { id: 'budget_tracking', label: 'Budget Tracking', menuPath: '/reports', actions: A_FINANCIAL },
      ],
    }],
  },
]

// ─── Permission key helpers ───────────────────────────────────────────────────
export function permKey(menuId, submenuId, pageId, actionId) {
  return `${menuId}.${submenuId}.${pageId}.${actionId}`
}

export function parsePermKey(key) {
  const [menuId, submenuId, pageId, actionId] = key.split('.')
  return { menuId, submenuId, pageId, actionId }
}

// Counts: how many permissions exist across the whole tree?
export function totalPermissionCount() {
  let n = 0
  PERMISSION_TREE.forEach(m => m.submenus.forEach(s => s.pages.forEach(p => n += p.actions.length)))
  return n
}

// All keys, for "Select All" features
export function allPermissionKeys() {
  const keys = []
  PERMISSION_TREE.forEach(m =>
    m.submenus.forEach(s =>
      s.pages.forEach(p =>
        p.actions.forEach(a => keys.push(permKey(m.id, s.id, p.id, a)))
      )
    )
  )
  return keys
}

export function menuPermissionKeys(menuId) {
  const menu = PERMISSION_TREE.find(m => m.id === menuId)
  if (!menu) return []
  const keys = []
  menu.submenus.forEach(s =>
    s.pages.forEach(p =>
      p.actions.forEach(a => keys.push(permKey(menuId, s.id, p.id, a)))
    )
  )
  return keys
}

export function pagePermissionKeys(menuId, submenuId, pageId) {
  const page = PERMISSION_TREE
    .find(m => m.id === menuId)?.submenus
    .find(s => s.id === submenuId)?.pages
    .find(p => p.id === pageId)
  if (!page) return []
  return page.actions.map(a => permKey(menuId, submenuId, pageId, a))
}

// ─── Visible menu computation (drives the live preview) ───────────────────────
// A menu is "visible" if the role has any 'view' permission on any page beneath it.
export function visibleMenusFromPermissions(permissions = {}) {
  return PERMISSION_TREE.filter(m =>
    m.submenus.some(s =>
      s.pages.some(p => permissions[permKey(m.id, s.id, p.id, 'view')])
    )
  )
}

export function visibleSubmenusFromPermissions(menuId, permissions = {}) {
  const menu = PERMISSION_TREE.find(m => m.id === menuId)
  if (!menu) return []
  return menu.submenus.filter(s =>
    s.pages.some(p => permissions[permKey(menuId, s.id, p.id, 'view')])
  )
}

// ─── Access summary ───────────────────────────────────────────────────────────
export function permissionSummary(permissions = {}) {
  let menus = 0, submenus = 0, pages = 0, granted = 0
  PERMISSION_TREE.forEach(m => {
    let hasMenu = false
    m.submenus.forEach(s => {
      let hasSub = false
      s.pages.forEach(p => {
        let hasPage = false
        p.actions.forEach(a => {
          if (permissions[permKey(m.id, s.id, p.id, a)]) {
            granted++
            hasPage = true; hasSub = true; hasMenu = true
          }
        })
        if (hasPage) pages++
      })
      if (hasSub) submenus++
    })
    if (hasMenu) menus++
  })
  return { menus, submenus, pages, granted, total: totalPermissionCount() }
}

// ─── Apply dependency rules ───────────────────────────────────────────────────
// Returns updated permission map after enforcing PERM_DEPENDENCIES.
export function applyDependencies(permissions = {}) {
  const next = { ...permissions }
  Object.keys(next).forEach(key => {
    if (!next[key]) return
    const { menuId, submenuId, pageId, actionId } = parsePermKey(key)
    const deps = PERM_DEPENDENCIES[actionId] ?? []
    deps.forEach(dep => {
      next[permKey(menuId, submenuId, pageId, dep)] = true
    })
  })
  return next
}

// ─── Seed roles (with sensible default permissions) ───────────────────────────
function seedAll() {
  const perms = {}
  allPermissionKeys().forEach(k => { perms[k] = true })
  return perms
}

function seedView() {
  const perms = {}
  PERMISSION_TREE.forEach(m =>
    m.submenus.forEach(s =>
      s.pages.forEach(p => {
        perms[permKey(m.id, s.id, p.id, 'view')] = true
      })
    )
  )
  return perms
}

function seedForMenus(menuIds, includeActions = ['view','create','edit','export_excel','export_pdf']) {
  const perms = {}
  PERMISSION_TREE.filter(m => menuIds.includes(m.id)).forEach(m =>
    m.submenus.forEach(s =>
      s.pages.forEach(p =>
        p.actions.forEach(a => {
          if (includeActions.includes(a)) perms[permKey(m.id, s.id, p.id, a)] = true
        })
      )
    )
  )
  // Dashboard view always on
  perms[permKey('dashboard','dashboard_home','main','view')] = true
  return perms
}

// ─── Seed roles ───────────────────────────────────────────────────────────────
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()

let _roleCounter = 0
const nextRoleId = () => `ROLE-${String(++_roleCounter).padStart(3, '0')}`

export const SEED_ROLES = [
  {
    id: nextRoleId(),
    name: 'Super Administrator',
    description: 'Unrestricted access to every menu, page and action across HELMS.',
    color: '#DC2626', badge: 'SA',
    permissions: seedAll(),
    userCount: 1, status: 'active',
    createdAt: past(24 * 365), updatedAt: past(24 * 3), createdBy: 'System',
  },
  {
    id: nextRoleId(),
    name: 'System Administrator',
    description: 'User management, roles, permissions and master data.',
    color: '#9333EA', badge: 'SY',
    permissions: {
      ...seedView(),
      ...seedForMenus(['settings','audit'], ['view','create','edit','deactivate','manage_settings','export_excel']),
    },
    userCount: 1, status: 'active',
    createdAt: past(24 * 300), updatedAt: past(24 * 7), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Operations Manager',
    description: 'Full operational control across shipments, fleet and warehouses.',
    color: '#2563EB', badge: 'OM',
    permissions: seedForMenus(['dashboard','projects','local_ops','intl_ops','warehouses','fleet','maintenance','vendors','reports'], A_FULL_OPS),
    userCount: 4, status: 'active',
    createdAt: past(24 * 250), updatedAt: past(24 * 2), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Project Manager',
    description: 'Manage projects, approve workflows, view related shipments.',
    color: '#0891B2', badge: 'PM',
    permissions: seedForMenus(['dashboard','projects','local_ops','intl_ops','reports'], ['view','create','edit','approve','reject','return','assign','upload_docs','export_excel','export_pdf']),
    userCount: 3, status: 'active',
    createdAt: past(24 * 220), updatedAt: past(24 * 5), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Logistics Coordinator',
    description: 'Day-to-day shipment coordination — local & international.',
    color: '#059669', badge: 'LC',
    permissions: seedForMenus(['dashboard','local_ops','intl_ops','fleet','warehouses'], ['view','create','edit','assign','upload_docs','export_excel']),
    userCount: 6, status: 'active',
    createdAt: past(24 * 200), updatedAt: past(24 * 1), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Warehouse Supervisor',
    description: 'Warehouse operations and inbound shipment visibility.',
    color: '#D97706', badge: 'WS',
    permissions: seedForMenus(['dashboard','warehouses','local_ops','maintenance'], ['view','create','edit','export_excel','print']),
    userCount: 5, status: 'active',
    createdAt: past(24 * 180), updatedAt: past(24 * 4), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Vendor Coordinator',
    description: 'Vendor management, contracts and ratings.',
    color: '#7C3AED', badge: 'VC',
    permissions: seedForMenus(['dashboard','vendors','rfq','intl_ops'], ['view','create','edit','assign','upload_docs','download_docs','export_excel']),
    userCount: 2, status: 'active',
    createdAt: past(24 * 160), updatedAt: past(24 * 6), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Finance Officer',
    description: 'Financial reports, cost tracking and budget oversight.',
    color: '#16A34A', badge: 'FO',
    permissions: seedForMenus(['dashboard','reports','finance','intl_ops'], ['view','view_financial','export_excel','export_pdf','print']),
    userCount: 2, status: 'active',
    createdAt: past(24 * 140), updatedAt: past(24 * 9), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Customs Officer',
    description: 'Customs clearance and international shipment compliance.',
    color: '#0EA5E9', badge: 'CO',
    permissions: seedForMenus(['dashboard','intl_ops'], ['view','edit','approve','upload_docs','download_docs','export_pdf']),
    userCount: 2, status: 'active',
    createdAt: past(24 * 120), updatedAt: past(24 * 12), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Document Controller',
    description: 'Manages document uploads, versioning and downloads.',
    color: '#64748B', badge: 'DC',
    permissions: seedForMenus(['dashboard','projects','local_ops','intl_ops','vendors'], ['view','upload_docs','download_docs','export_pdf']),
    userCount: 3, status: 'active',
    createdAt: past(24 * 100), updatedAt: past(24 * 15), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Read-Only Auditor',
    description: 'View-only access across the platform including audit logs.',
    color: '#475569', badge: 'AU',
    permissions: { ...seedView(), [permKey('audit','audit_main','logs','export_excel')]: true },
    userCount: 1, status: 'active',
    createdAt: past(24 * 80), updatedAt: past(24 * 20), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Vendor User',
    description: 'External vendor portal access — own shipments and RFQs only.',
    color: '#F97316', badge: 'VU',
    permissions: seedForMenus(['dashboard','rfq','intl_ops'], ['view','upload_docs']),
    userCount: 8, status: 'active',
    createdAt: past(24 * 60), updatedAt: past(24 * 25), createdBy: 'Abdullah Al-Rashid',
  },
  {
    id: nextRoleId(),
    name: 'Part Time User',
    description: 'Limited-scope contractor access with time-bound expiry.',
    color: '#A16207', badge: 'PT',
    permissions: seedForMenus(['dashboard','local_ops'], ['view','create']),
    userCount: 4, status: 'active',
    createdAt: past(24 * 40), updatedAt: past(24 * 30), createdBy: 'Abdullah Al-Rashid',
  },
]

// ─── Audit log ────────────────────────────────────────────────────────────────
const AUDIT_ACTIONS_LOG = ['Role Created','Role Updated','Role Cloned','Role Deactivated','Permission Granted','Permission Revoked','Bulk Permission Update','Role Assigned to User']
const AUDIT_USERS = ['Abdullah Al-Rashid','Fatima Al-Zahrani','Khalid Al-Mutairi']

export const ROLE_AUDIT_LOG = Array.from({ length: 30 }, (_, i) => {
  const action = AUDIT_ACTIONS_LOG[i % AUDIT_ACTIONS_LOG.length]
  const role   = SEED_ROLES[i % SEED_ROLES.length]
  return {
    id:         `RA-${String(i + 1).padStart(4, '0')}`,
    timestamp:  past(i * 6 + 1),
    actor:      AUDIT_USERS[i % AUDIT_USERS.length],
    actorRole:  'System Administrator',
    action,
    targetRole: role.name,
    targetRoleId: role.id,
    module:     action.includes('Permission') ? PERMISSION_TREE[i % PERMISSION_TREE.length].label : null,
    permission: action.includes('Permission') ? PERM_ACTIONS[i % PERM_ACTIONS.length].label : null,
    oldValue:   action === 'Permission Granted' ? 'denied' : action === 'Permission Revoked' ? 'granted' : null,
    newValue:   action === 'Permission Granted' ? 'granted' : action === 'Permission Revoked' ? 'denied' : null,
    ipAddress:  `10.${1 + (i % 9)}.${1 + (i % 20)}.${1 + (i % 99)}`,
  }
})

// ─── Legacy compatibility (so existing imports keep working) ──────────────────
// The earlier rbacData.js exported PERM_TYPES, PERMISSION_MODULES, ROLE_TEMPLATES.
// We re-export adapters so old code (PermissionMatrix etc.) doesn't break.
export const PERM_TYPES = PERM_ACTIONS
export const PERMISSION_MODULES = PERMISSION_TREE.map(m => ({
  id: m.id,
  label: m.label,
  icon: m.icon,
  description: m.submenus[0]?.label ?? '',
  menuPath: m.menuPath,
  permissions: m.submenus.flatMap(s => s.pages.flatMap(p => p.actions)).filter((v, i, arr) => arr.indexOf(v) === i),
}))
