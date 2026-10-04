// ─── Permission types ─────────────────────────────────────────────────────────
export const PERM_TYPES = [
  { id: 'view',            label: 'View',                icon: '👁',  level: 'basic'    },
  { id: 'create',          label: 'Create',              icon: '➕',  level: 'standard' },
  { id: 'edit',            label: 'Edit / Update',       icon: '✏️',  level: 'standard' },
  { id: 'delete',          label: 'Delete',              icon: '🗑',  level: 'elevated' },
  { id: 'approve',         label: 'Approve',             icon: '✅',  level: 'elevated' },
  { id: 'assign',          label: 'Assign',              icon: '🔗',  level: 'standard' },
  { id: 'export',          label: 'Export',              icon: '📤',  level: 'standard' },
  { id: 'print',           label: 'Print',               icon: '🖨',  level: 'basic'    },
  { id: 'cancel',          label: 'Cancel',              icon: '⛔',  level: 'elevated' },
  { id: 'reopen',          label: 'Reopen',              icon: '🔄',  level: 'elevated' },
  { id: 'manage_settings', label: 'Manage Settings',     icon: '⚙️',  level: 'admin'    },
  { id: 'view_financial',  label: 'View Financial Data', icon: '💰',  level: 'elevated' },
  { id: 'view_ai',         label: 'View AI Analytics',   icon: '🤖',  level: 'standard' },
  { id: 'reset_password',  label: 'Reset Password',      icon: '🔑',  level: 'elevated' },
  { id: 'impersonate',     label: 'Impersonate User',    icon: '🎭',  level: 'admin'    },
]

// ─── Module definitions ───────────────────────────────────────────────────────
export const PERMISSION_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'System overview and KPI monitoring',
    menuPath: '/dashboard',
    permissions: ['view','view_ai','export'],
  },
  {
    id: 'shipments',
    label: 'Shipments',
    icon: '📦',
    description: 'Core shipment tracking and management',
    menuPath: '/shipments',
    permissions: ['view','create','edit','delete','approve','assign','export','print','cancel','view_financial','view_ai'],
  },
  {
    id: 'local_ops',
    label: 'Local Operations',
    icon: '📍',
    description: 'Domestic logistics operations center',
    menuPath: '/local-operations',
    permissions: ['view','create','edit','approve','assign','export'],
  },
  {
    id: 'intl_ops',
    label: 'International Ops',
    icon: '🌐',
    description: 'Cross-border logistics and customs',
    menuPath: '/international-operations',
    permissions: ['view','create','edit','approve','assign','export','view_financial'],
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: '🏢',
    description: 'Logistics and maintenance vendor management',
    menuPath: '/vendors',
    permissions: ['view','create','edit','delete','approve','assign','export','view_financial'],
  },
  {
    id: 'fleet',
    label: 'Fleet Management',
    icon: '🚛',
    description: 'Vehicle registry and tracking',
    menuPath: '/fleet',
    permissions: ['view','create','edit','delete','assign','export','view_ai'],
  },
  {
    id: 'drivers',
    label: 'Drivers',
    icon: '👤',
    description: 'Driver roster and performance',
    menuPath: '/drivers',
    permissions: ['view','create','edit','delete','assign','export'],
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    icon: '🏭',
    description: 'Inventory and dock management',
    menuPath: '/warehouse',
    permissions: ['view','create','edit','approve','export'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    description: 'Scheduled and corrective maintenance',
    menuPath: '/maintenance',
    permissions: ['view','create','edit','approve','assign','cancel','reopen','export','view_financial'],
  },
  {
    id: 'incidents',
    label: 'Incidents',
    icon: '⚠️',
    description: 'Breakdown and delay incident tracking',
    menuPath: '/incidents',
    permissions: ['view','create','edit','approve','reopen','export'],
  },
  {
    id: 'workflow',
    label: 'Workflow Engine',
    icon: '🔀',
    description: 'Process automation and approvals',
    menuPath: '/workflow',
    permissions: ['view','create','edit','delete','approve','export'],
  },
  {
    id: 'routes',
    label: 'Route Planning',
    icon: '🗺️',
    description: 'Route assignment and optimization',
    menuPath: '/routes',
    permissions: ['view','create','edit','assign','export'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📈',
    description: 'Analytics and exportable reports',
    menuPath: '/reports',
    permissions: ['view','create','export','print','view_financial','view_ai'],
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: '📋',
    description: 'Full activity trail',
    menuPath: '/audit-logs',
    permissions: ['view','export'],
  },
  {
    id: 'ai_analytics',
    label: 'AI Analytics',
    icon: '🤖',
    description: 'Risk scoring and predictions',
    menuPath: '/ai-analytics',
    permissions: ['view','view_ai','manage_settings'],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: '👥',
    description: 'User accounts and roles',
    menuPath: '/users',
    permissions: ['view','create','edit','delete','assign','reset_password','impersonate'],
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: '🛡️',
    description: 'RBAC role management',
    menuPath: '/roles',
    permissions: ['view','create','edit','delete','assign'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'System configuration',
    menuPath: '/settings',
    permissions: ['view','edit','manage_settings'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    description: 'Financial reports and cost management',
    menuPath: '/reports',
    permissions: ['view','create','export','print','view_financial'],
  },
]

// ─── Permission metadata (for detail modal) ───────────────────────────────────
export const PERMISSION_META = {
  'shipments.assign': {
    description: 'Allows assigning external vendors and drivers to active shipments',
    accessLevel: 'Advanced',
    dependsOn: ['shipments.view'],
    affectedScreens: ['Shipment Detail', 'Vendor Assignment Panel'],
    securityImpact: 'Medium',
  },
  'shipments.approve': {
    description: 'Grants authority to approve high-value or flagged shipments',
    accessLevel: 'Elevated',
    dependsOn: ['shipments.view', 'shipments.edit'],
    affectedScreens: ['Shipment List', 'Approval Queue', 'Dashboard'],
    securityImpact: 'High',
  },
  'shipments.view_financial': {
    description: 'View cost breakdowns, vendor invoices, and financial data attached to shipments',
    accessLevel: 'Restricted',
    dependsOn: ['shipments.view'],
    affectedScreens: ['Shipment Detail → Financial Tab', 'Reports → Financial'],
    securityImpact: 'High',
  },
  'users.impersonate': {
    description: 'Log in as another user to debug permission issues. Full audit trail recorded.',
    accessLevel: 'Admin Only',
    dependsOn: ['users.view'],
    affectedScreens: ['User Management', 'Session Management'],
    securityImpact: 'Critical',
  },
  'users.reset_password': {
    description: 'Force reset a user password and trigger re-authentication',
    accessLevel: 'Elevated',
    dependsOn: ['users.view'],
    affectedScreens: ['User Detail', 'Security Panel'],
    securityImpact: 'High',
  },
  'vendors.approve': {
    description: 'Approve vendor contracts and SLA agreements',
    accessLevel: 'Advanced',
    dependsOn: ['vendors.view', 'vendors.edit'],
    affectedScreens: ['Vendor Detail → Contract Tab', 'Approval Queue'],
    securityImpact: 'High',
  },
}

// ─── Preset role templates ────────────────────────────────────────────────────
const BASIC_MODULES = ['dashboard','shipments','fleet','drivers','reports']
const OPS_MODULES   = ['dashboard','shipments','local_ops','intl_ops','fleet','drivers','warehouse','maintenance','incidents','routes','workflow','reports']

function buildPerms(modules, permTypes) {
  const result = {}
  modules.forEach(mod => {
    result[mod] = permTypes.filter(p =>
      PERMISSION_MODULES.find(m => m.id === mod)?.permissions.includes(p) ?? false
    )
  })
  return result
}

const ALL_PERMS_PER_MOD = Object.fromEntries(
  PERMISSION_MODULES.map(m => [m.id, m.permissions])
)

export const ROLE_TEMPLATES = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access — no restrictions. Reserved for system administrators.',
    color: 'amber',
    badge: '#B45309',
    permissions: ALL_PERMS_PER_MOD,
  },
  logistics_manager: {
    name: 'Logistics Manager',
    description: 'Manages all logistics operations, workflows, vendors and reporting.',
    color: 'blue',
    badge: '#1D4ED8',
    permissions: buildPerms(OPS_MODULES, ['view','create','edit','approve','assign','export','view_ai','view_financial']),
  },
  warehouse_supervisor: {
    name: 'Warehouse Supervisor',
    description: 'Full warehouse access plus shipment visibility.',
    color: 'purple',
    badge: '#7C3AED',
    permissions: buildPerms(['dashboard','shipments','warehouse','maintenance','incidents','reports'], ['view','create','edit','approve','export']),
  },
  driver_coordinator: {
    name: 'Driver Coordinator',
    description: 'Manages driver assignments, routes, and fleet tracking.',
    color: 'teal',
    badge: '#0D9488',
    permissions: buildPerms(['dashboard','shipments','fleet','drivers','routes','incidents'], ['view','create','edit','assign','export']),
  },
  customs_officer: {
    name: 'Customs Officer',
    description: 'International operations, customs clearance, and vendor document management.',
    color: 'orange',
    badge: '#EA580C',
    permissions: buildPerms(['dashboard','intl_ops','vendors','shipments','workflow'], ['view','create','edit','approve','export']),
  },
  finance_team: {
    name: 'Finance Team',
    description: 'Financial data access across all modules. Read and export only.',
    color: 'green',
    badge: '#059669',
    permissions: buildPerms(['dashboard','shipments','vendors','maintenance','reports','finance'], ['view','export','print','view_financial']),
  },
  vendor_manager: {
    name: 'Vendor Manager',
    description: 'Full vendor management, SLA tracking, and contract approvals.',
    color: 'indigo',
    badge: '#4338CA',
    permissions: buildPerms(['dashboard','vendors','shipments','warehouse','reports'], ['view','create','edit','approve','assign','export']),
  },
  readonly_auditor: {
    name: 'Read-Only Auditor',
    description: 'View-only access to all modules plus full audit log access.',
    color: 'slate',
    badge: '#475569',
    permissions: buildPerms([...PERMISSION_MODULES.map(m => m.id)], ['view','export','print']),
  },
}

// ─── Permission audit trail ───────────────────────────────────────────────────
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()
const PERM_AUDIT_ACTIONS = [
  'Added permission',
  'Removed permission',
  'Cloned role',
  'Created role',
  'Deleted role',
  'Assigned user to role',
  'Removed user from role',
  'Bulk permission update',
]
const USERS = ['Abdullah Al-Rashid','Fatima Al-Zahrani','System Auto-Policy']
const ROLES = ['Logistics Manager','Warehouse Supervisor','Driver Coordinator','Customs Officer']

export const PERMISSION_AUDIT_LOG = Array.from({ length: 40 }, (_, i) => ({
  id:       `PA-${String(10000 + i).padStart(5,'0')}`,
  timestamp:past(i * 0.8 + Math.random() * 2),
  actor:    USERS[i % USERS.length],
  actorRole:'admin',
  action:   PERM_AUDIT_ACTIONS[i % PERM_AUDIT_ACTIONS.length],
  targetRole: ROLES[i % ROLES.length],
  module:   PERMISSION_MODULES[i % PERMISSION_MODULES.length].label,
  permission: PERM_TYPES[i % PERM_TYPES.length].label,
  oldValue: i % 3 === 0 ? 'Disabled' : null,
  newValue: i % 3 === 0 ? 'Enabled'  : null,
  ipAddress:`10.${Math.floor(Math.random()*254)+1}.${Math.floor(Math.random()*254)+1}.${Math.floor(Math.random()*254)+1}`,
}))
