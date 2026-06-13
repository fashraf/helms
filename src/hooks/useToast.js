import useToastStore from '../store/toastStore'

/**
 * useToast — fire typed toast notifications from any component.
 *
 * Usage:
 *   const { toast } = useToast()
 *   toast.success('Saved', 'Your changes were saved.')
 *   toast.error('Failed', 'Could not reach server.')
 */
export function useToast() {
  const { push, dismiss, dismissAll } = useToastStore()

  const toast = {
    info:    (title, message, opts) => push({ type: 'info',    title, message, ...opts }),
    success: (title, message, opts) => push({ type: 'success', title, message, ...opts }),
    warning: (title, message, opts) => push({ type: 'warning', title, message, ...opts }),
    error:   (title, message, opts) => push({ type: 'error',   title, message, ...opts }),
  }

  return { toast, dismiss, dismissAll }
}

export default useToast
