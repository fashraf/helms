import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * HELMS Authentication Store
 * Manages JWT token, user object, and authentication state.
 * Persists token + user to localStorage so sessions survive refresh.
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      // ── Actions ────────────────────────────────────────────────────────────

      /** Called after a successful /auth/login response */
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        })
      },

      /** Clear all auth state and remove persisted storage */
      logout: () => {
        set({
          user:            null,
          token:           null,
          isAuthenticated: false,
          error:           null,
          isLoading:       false,
        })
      },

      /** Update user profile data (e.g. after profile edit) */
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError:   (error)     => set({ error, isLoading: false }),
      clearError: ()          => set({ error: null }),

      // ── Selectors ──────────────────────────────────────────────────────────
      hasRole: (role) => {
        const { user } = get()
        if (!user) return false
        if (Array.isArray(role)) return role.includes(user.role)
        return user.role === role
      },

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'helms-auth-v1',
      // Only persist these keys to localStorage
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
