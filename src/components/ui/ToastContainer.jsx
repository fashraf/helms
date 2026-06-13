import { createPortal } from 'react-dom'
import useToastStore from '../../store/toastStore'
import Toast from './Toast'

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="
        fixed top-4 right-4 z-[9999]
        flex flex-col gap-2.5
        pointer-events-none
      "
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>,
    document.body
  )
}
