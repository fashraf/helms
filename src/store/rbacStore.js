import { create } from 'zustand'
import { ROLE_TEMPLATES, PERMISSION_MODULES, PERMISSION_AUDIT_LOG } from '../api/mock/rbacData'

let _idCounter = 10

// Build initial roles from templates
const INITIAL_ROLES = Object.entries(ROLE_TEMPLATES).map(([key, tmpl], i) => ({
  id:          `ROLE-${String(i + 1).padStart(3, '0')}`,
  templateKey: key,
  name:        tmpl.name,
  description: tmpl.description,
  color:       tmpl.color,
  badge:       tmpl.badge,
  permissions: JSON.parse(JSON.stringify(tmpl.permissions)),
  userCount:   [2, 4, 3, 2, 2, 2, 2, 1][i] ?? 0,
  status:      'active',
  createdAt:   new Date(Date.now() - (i + 1) * 86400000 * 30).toISOString(),
  updatedAt:   new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
  createdBy:   'Abdullah Al-Rashid',
}))

const useRBACStore = create((set, get) => ({
  // ─── Roles ────────────────────────────────────────────────────────────
  roles:          INITIAL_ROLES,
  selectedRoleId: null,

  filteredRoles: (search = '') =>
    get().roles.filter(r =>
      !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    ),

  selectRole: (id) => set({ selectedRoleId: id }),

  createRole: (data) => {
    const role = {
      id:          `ROLE-${String(++_idCounter).padStart(3, '0')}`,
      status:      'active',
      userCount:   0,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      createdBy:   'Abdullah Al-Rashid',
      permissions: {},
      ...data,
    }
    set(s => ({ roles: [...s.roles, role] }))
    return role.id
  },

  updateRole: (id, patch) =>
    set(s => ({
      roles: s.roles.map(r => r.id !== id ? r : { ...r, ...patch, updatedAt: new Date().toISOString() }),
    })),

  deleteRole: (id) =>
    set(s => ({ roles: s.roles.filter(r => r.id !== id) })),

  cloneRole: (id) => {
    const src = get().roles.find(r => r.id === id)
    if (!src) return
    const clone = {
      ...JSON.parse(JSON.stringify(src)),
      id:        `ROLE-${String(++_idCounter).padStart(3, '0')}`,
      name:      src.name + ' (Copy)',
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ roles: [...s.roles, clone] }))
    return clone.id
  },

  // ─── Permission toggles ───────────────────────────────────────────────
  togglePermission: (roleId, module, perm) => {
    set(s => ({
      roles: s.roles.map(r => {
        if (r.id !== roleId) return r
        const current = r.permissions[module] ?? []
        const updated  = current.includes(perm)
          ? current.filter(p => p !== perm)
          : [...current, perm]
        return { ...r, permissions: { ...r.permissions, [module]: updated }, updatedAt: new Date().toISOString() }
      }),
    }))
    get().addAuditEntry({
      action:     'Toggled permission',
      targetRole: get().roles.find(r => r.id === roleId)?.name ?? roleId,
      module:     PERMISSION_MODULES.find(m => m.id === module)?.label ?? module,
      permission: perm,
    })
  },

  toggleModuleAll: (roleId, moduleId, enable) => {
    const module = PERMISSION_MODULES.find(m => m.id === moduleId)
    if (!module) return
    set(s => ({
      roles: s.roles.map(r => {
        if (r.id !== roleId) return r
        return {
          ...r,
          permissions: { ...r.permissions, [moduleId]: enable ? [...module.permissions] : [] },
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  toggleAllPermissions: (roleId, enable) => {
    set(s => ({
      roles: s.roles.map(r => {
        if (r.id !== roleId) return r
        const perms = enable
          ? Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, [...m.permissions]]))
          : Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, []]))
        return { ...r, permissions: perms, updatedAt: new Date().toISOString() }
      }),
    }))
  },

  getEffectivePermissions: (roleId) => {
    const role = get().roles.find(r => r.id === roleId)
    if (!role) return {}
    return role.permissions
  },

  getVisibleMenus: (roleId) => {
    const perms = get().getEffectivePermissions(roleId)
    return PERMISSION_MODULES.filter(m => (perms[m.id] ?? []).includes('view'))
  },

  // ─── Permission Audit ─────────────────────────────────────────────────
  auditLog: PERMISSION_AUDIT_LOG,

  addAuditEntry: (data) =>
    set(s => ({
      auditLog: [{
        id:         `PA-${Date.now()}`,
        timestamp:  new Date().toISOString(),
        actor:      'Abdullah Al-Rashid',
        actorRole:  'admin',
        ipAddress:  '10.1.1.1',
        ...data,
      }, ...s.auditLog].slice(0, 100),
    })),

  // ─── UI state ─────────────────────────────────────────────────────────
  isLoading:     false,
  loadingMsg:    '',
  setLoading:    (v, msg = '') => set({ isLoading: v, loadingMsg: msg }),

  activeModal:   null,  // 'create-role' | 'edit-role' | 'perm-detail' | 'clone-role'
  modalData:     null,
  openModal:     (modal, data = null) => set({ activeModal: modal, modalData: data }),
  closeModal:    ()                    => set({ activeModal: null,  modalData: null  }),
}))

export default useRBACStore
