import { create } from 'zustand'
import { EXTENDED_USERS, USER_TYPES, nextUserId, PASSWORD_RESET_LOG, ACCOUNT_UNLOCK_LOG } from '../api/mock/userData'

const useUserStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────
  users:       EXTENDED_USERS,
  filter:      { search: '', type: 'all', role: 'all', status: 'all', dept: 'all' },
  viewMode:    'list',
  passwordResetLog: PASSWORD_RESET_LOG,
  unlockLog:        ACCOUNT_UNLOCK_LOG,

  setFilter:    (k, v) => set(s => ({ filter: { ...s.filter, [k]: v } })),
  setViewMode:  (m) => set({ viewMode: m }),

  filteredUsers: () => {
    const { users, filter: f } = get()
    return users.filter(u => {
      if (f.type   !== 'all' && u.type   !== f.type)   return false
      if (f.role   !== 'all' && u.role   !== f.role)   return false
      if (f.status !== 'all' && u.status !== f.status) return false
      if (f.dept   !== 'all' && u.dept   !== f.dept)   return false
      if (f.search) {
        const q = f.search.toLowerCase()
        const hit = u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          (u.mobile ?? '').includes(q) ||
          (u.nationalId ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  },

  getUser: (id) => get().users.find(u => u.id === id),

  // ─── CRUD ─────────────────────────────────────────────────────────────
  createUser: (data) => {
    const id = nextUserId(data.type ?? 'employee')
    const user = {
      id,
      status: 'active',
      lastLogin: null,
      lastPasswordChange: new Date().toISOString(),
      ...data,
    }
    set(s => ({ users: [user, ...s.users] }))
    return id
  },

  updateUser: (id, patch) =>
    set(s => ({ users: s.users.map(u => u.id !== id ? u : { ...u, ...patch }) })),

  // No delete — deactivate only
  deactivateUser: (id) =>
    set(s => ({ users: s.users.map(u => u.id !== id ? u : { ...u, status: 'inactive' }) })),

  activateUser: (id) =>
    set(s => ({ users: s.users.map(u => u.id !== id ? u : { ...u, status: 'active' }) })),

  lockAccount: (id) =>
    set(s => ({ users: s.users.map(u => u.id !== id ? u : { ...u, status: 'locked' }) })),

  unlockAccount: (id, reason = 'Administrator unlock') => {
    set(s => ({
      users:     s.users.map(u => u.id !== id ? u : { ...u, status: 'active' }),
      unlockLog: [{
        id: `UNL-${Date.now()}`, userId: id, date: new Date().toISOString(),
        by: 'Abdullah Al-Rashid', reason,
      }, ...s.unlockLog],
    }))
  },

  resetPassword: (id, reason = 'Admin reset') => {
    set(s => ({
      users: s.users.map(u => u.id !== id ? u : {
        ...u,
        mustChangePassword: true,
        lastPasswordChange: new Date().toISOString(),
      }),
      passwordResetLog: [{
        id: `PWR-${Date.now()}`, userId: id, date: new Date().toISOString(),
        by: 'Abdullah Al-Rashid', reason, method: 'admin_reset',
      }, ...s.passwordResetLog],
    }))
  },

  // ─── Account expiry checks ────────────────────────────────────────────
  daysUntilExpiry: (user) => {
    if (user.neverExpires || !user.accountExpiry) return null
    return Math.floor((new Date(user.accountExpiry) - Date.now()) / 86400000)
  },
}))

export default useUserStore
