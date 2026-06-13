// ─── Menu items + which roles see each ─────────────────────────────────────────
// `roles: null` means visible to all roles
export const MENU_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',           icon: '📊', roles: null },
  { id: 'projects',       label: 'Projects',            icon: '📋', roles: ['admin','manager','operator','warehouse'] },
  { id: 'shipments',      label: 'Shipments',           icon: '📦', roles: null },
  { id: 'local_ops',      label: 'Local Operations',    icon: '📍', roles: ['admin','manager','operator','warehouse','driver'] },
  { id: 'intl_ops',       label: 'International Ops',   icon: '🌐', roles: ['admin','manager','customs','operator'] },
  { id: 'workflow',       label: 'Workflow Engine',     icon: '🔀', roles: ['admin','manager'] },
  { id: 'fleet',          label: 'Fleet Management',    icon: '🚛', roles: ['admin','manager','operator','driver'] },
  { id: 'drivers',        label: 'Drivers',             icon: '👥', roles: ['admin','manager','operator','driver'] },
  { id: 'maintenance',    label: 'Maintenance',         icon: '🔧', roles: ['admin','manager','operator','warehouse'] },
  { id: 'warehouse',      label: 'Warehouse',           icon: '🏭', roles: ['admin','manager','warehouse'] },
  { id: 'incidents',      label: 'Incidents',           icon: '⚠️', roles: ['admin','manager','operator'] },
  { id: 'routes',         label: 'Route Planning',      icon: '🗺️', roles: ['admin','manager','driver','operator'] },
  { id: 'vendors',        label: 'Vendor Management',   icon: '🏢', roles: ['admin','manager','vendor_mgr'] },
  { id: 'rfq',            label: 'RFQ',                 icon: '📝', roles: ['admin','manager','vendor_mgr'] },
  { id: 'reports',        label: 'Reports',             icon: '📈', roles: ['admin','manager','finance','auditor'] },
  { id: 'ai_analytics',   label: 'AI Analytics',        icon: '🤖', roles: ['admin','manager'] },
  { id: 'audit',          label: 'Audit Logs',          icon: '📋', roles: ['admin','auditor'] },
  { id: 'users',          label: 'User Management',     icon: '👤', roles: ['admin'] },
  { id: 'roles',          label: 'Roles & Permissions', icon: '🛡', roles: ['admin'] },
  { id: 'settings',       label: 'Settings',            icon: '⚙️', roles: ['admin'] },
]

export function visibleMenusForRole(role) {
  if (!role) return []
  return MENU_ITEMS.filter(m => m.roles === null || m.roles.includes(role))
}

export function isMenuVisible(menuId, role) {
  const m = MENU_ITEMS.find(x => x.id === menuId)
  if (!m) return false
  return m.roles === null || m.roles.includes(role)
}
