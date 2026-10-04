import { create } from 'zustand'
import {
  PERMISSION_TREE, SEED_ROLES, ROLE_AUDIT_LOG, PERM_ACTIONS,
  permKey, parsePermKey, allPermissionKeys, menuPermissionKeys, pagePermissionKeys,
  applyDependencies, permissionSummary, visibleMenusFromPermissions, totalPermissionCount,
} from '../api/mock/permissionTree'

let _idCounter = SEED_ROLES.length

const useRBACv2Store = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────
  roles:    SEED_ROLES,
  auditLog: ROLE_AUDIT_LOG,
  filter:   { search: '', status: 'all' },
  viewMode: 'list',

  setFilter:    (k, v) => set(s => ({ filter: { ...s.filter, [k]: v } })),
  setViewMode:  (m) => set({ viewMode: m }),

  filteredRoles: () => {
    const { roles, filter: f } = get()
    return roles.filter(r => {
      if (f.status !== 'all' && r.status !== f.status) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        const hit = r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  },

  getRole: (id) => get().roles.find(r => r.id === id),

  // ─── CRUD (no delete) ─────────────────────────────────────────────────
  createRole: (data) => {
    const id = `ROLE-${String(++_idCounter).padStart(3, '0')}`
    const role = {
      id, status: 'active', userCount: 0,
      color: '#2563EB', badge: 'NR',
      permissions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Abdullah Al-Rashid',
      ...data,
    }
    set(s => ({ roles: [role, ...s.roles] }))
    get().addAudit({ action: 'Role Created', targetRole: role.name, targetRoleId: id })
    return id
  },

  updateRole: (id, patch) => {
    set(s => ({
      roles: s.roles.map(r => r.id !== id ? r : { ...r, ...patch, updatedAt: new Date().toISOString() }),
    }))
    get().addAudit({ action: 'Role Updated', targetRole: get().getRole(id)?.name, targetRoleId: id })
  },

  cloneRole: (id) => {
    const src = get().getRole(id)
    if (!src) return null
    const newId = `ROLE-${String(++_idCounter).padStart(3, '0')}`
    const clone = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      name: src.name + ' (Copy)',
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Abdullah Al-Rashid',
    }
    set(s => ({ roles: [clone, ...s.roles] }))
    get().addAudit({ action: 'Role Cloned', targetRole: clone.name, targetRoleId: newId, sourceRole: src.name })
    return newId
  },

  deactivateRole: (id) => {
    set(s => ({ roles: s.roles.map(r => r.id !== id ? r : { ...r, status: 'inactive', updatedAt: new Date().toISOString() }) }))
    get().addAudit({ action: 'Role Deactivated', targetRole: get().getRole(id)?.name, targetRoleId: id })
  },

  activateRole: (id) => {
    set(s => ({ roles: s.roles.map(r => r.id !== id ? r : { ...r, status: 'active', updatedAt: new Date().toISOString() }) }))
    get().addAudit({ action: 'Role Activated', targetRole: get().getRole(id)?.name, targetRoleId: id })
  },

  // ─── Permission editing (with dependency enforcement) ────────────────
  setPermission: (roleId, menuId, submenuId, pageId, actionId, value) => {
    set(s => ({
      roles: s.roles.map(r => {
        if (r.id !== roleId) return r
        const key = permKey(menuId, submenuId, pageId, actionId)
        const next = { ...r.permissions, [key]: value }
        // Auto-add view dependency if granting; auto-remove dependents if revoking view
        const enforced = value ? applyDependencies(next) : (() => {
          const copy = { ...next }
          if (actionId === 'view') {
            // Revoking view → remove all other perms for this page
            pagePermissionKeys(menuId, submenuId, pageId).forEach(k => { copy[k] = false })
          } else {
            copy[key] = false
          }
          return copy
        })()
        return { ...r, permissions: enforced, updatedAt: new Date().toISOString() }
      }),
    }))
  },

  setManyPermissions: (roleId, keys, value) => {
    set(s => ({
      roles: s.roles.map(r => {
        if (r.id !== roleId) return r
        let next = { ...r.permissions }
        keys.forEach(k => { next[k] = value })
        if (value) next = applyDependencies(next)
        return { ...r, permissions: next, updatedAt: new Date().toISOString() }
      }),
    }))
  },

  toggleAllForMenu: (roleId, menuId, value) => {
    get().setManyPermissions(roleId, menuPermissionKeys(menuId), value)
  },

  toggleAllForPage: (roleId, menuId, submenuId, pageId, value) => {
    get().setManyPermissions(roleId, pagePermissionKeys(menuId, submenuId, pageId), value)
  },

  toggleAllInTree: (roleId, value) => {
    get().setManyPermissions(roleId, allPermissionKeys(), value)
  },

  // ─── Audit ────────────────────────────────────────────────────────────
  addAudit: (entry) => set(s => ({
    auditLog: [{
      id: `RA-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Abdullah Al-Rashid',
      actorRole: 'System Administrator',
      ipAddress: '10.1.1.1',
      ...entry,
    }, ...s.auditLog].slice(0, 200),
  })),

  // ─── Derived helpers ──────────────────────────────────────────────────
  summaryFor: (roleId) => {
    const r = get().getRole(roleId)
    return r ? permissionSummary(r.permissions) : { menus: 0, submenus: 0, pages: 0, granted: 0, total: totalPermissionCount() }
  },
  visibleMenusFor: (roleId) => {
    const r = get().getRole(roleId)
    return r ? visibleMenusFromPermissions(r.permissions) : []
  },
}))

export default useRBACv2Store
