import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
  persist(
    (set, get) => ({
      // ── Sidebar ────────────────────────────────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebar:    ()           => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebar:       (collapsed)  => set({ sidebarCollapsed: collapsed }),

      // ── Theme ──────────────────────────────────────────────────────────────
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // ── Notifications ──────────────────────────────────────────────────────
      notifications: [
        {
          id: 1,
          type: 'warning',
          title: 'Maintenance Due',
          message: 'Unit HX-2291 is due for scheduled maintenance.',
          timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
          read: false,
        },
        {
          id: 2,
          type: 'info',
          title: 'Shipment Delivered',
          message: 'SHP-00847 has been successfully delivered to Site 7.',
          timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
          read: false,
        },
        {
          id: 3,
          type: 'error',
          title: 'Fleet Alert',
          message: 'Unit HX-1103 reported GPS signal loss near Dammam Highway.',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          read: true,
        },
      ],

      unreadCount: () =>
        get().notifications.filter((n) => !n.read).length,

      addNotification: (notification) =>
        set((s) => ({
          notifications: [
            { id: Date.now(), read: false, timestamp: new Date().toISOString(), ...notification },
            ...s.notifications,
          ],
        })),

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'helms-ui-v1',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme:            state.theme,
      }),
    }
  )
)

export default useUIStore
