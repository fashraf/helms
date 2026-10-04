import { create } from 'zustand'

// Toast store
// Convenience helpers: success/warning/error/info — match the call pattern used
// across the codebase (`const toast = useToastStore(); toast.success(t, m)`).
//
// Per-toast options:
//   { duration: ms, position: 'top-right' | 'bottom-center', variant: 'fuel' | undefined }
const useToastStore = create((set, get) => ({
  toasts: [],

  push: (toast) => set((s) => ({
    toasts: [
      ...s.toasts.slice(-4),
      {
        id:        `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type:      'info',
        duration:  5000,
        position:  'top-right',
        ...toast,
        timestamp: Date.now(),
      },
    ],
  })),

  // Convenience helpers — call signature: (title, message, opts?)
  success: (title, message, opts) => get().push({ type: 'success', title, message, ...(opts || {}) }),
  warning: (title, message, opts) => get().push({ type: 'warning', title, message, ...(opts || {}) }),
  error:   (title, message, opts) => get().push({ type: 'error',   title, message, ...(opts || {}) }),
  info:    (title, message, opts) => get().push({ type: 'info',    title, message, ...(opts || {}) }),

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dismissAll: () => set({ toasts: [] }),
}))

export default useToastStore
