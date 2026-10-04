import { createPortal } from 'react-dom'
import useToastStore from '../../store/toastStore'
import Toast from './Toast'

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const top    = toasts.filter(t => (t.position ?? 'top-right') === 'top-right')
  const bottom = toasts.filter(t => t.position === 'bottom-center')

  return (
    <>
      {createPortal(
        <div aria-live="polite" aria-atomic="false"
          className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
          {top.map(t => (
            <div key={t.id} className="pointer-events-auto"><Toast {...t} /></div>
          ))}
        </div>,
        document.body,
      )}
      {createPortal(
        <div aria-live="polite" aria-atomic="false"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 pointer-events-none items-center">
          {bottom.map(t => (
            <div key={t.id} className="pointer-events-auto"><Toast {...t} /></div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
