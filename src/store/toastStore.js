import { create } from 'zustand'

const useToastStore = create((set) => ({
  toasts: [],

  push: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-4),  // cap at 5 total
        {
          id:        `toast-${Date.now()}-${Math.random()}`,
          type:      'info',
          duration:  5000,
          ...toast,
          timestamp: Date.now(),
        },
      ],
    })),

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  dismissAll: () => set({ toasts: [] }),
}))

export default useToastStore
