import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * EnterpriseModal — full-featured enterprise modal.
 * Props:
 *   open, onClose, title, subtitle, icon, size, children,
 *   footer, noPadding, scrollable (default true), closeOnBackdrop
 */
export default function EnterpriseModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  children,
  footer,
  noPadding = false,
  scrollable = true,
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null)

  // Keyboard: Escape closes
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open])

  if (!open) return null

  const WIDTHS = { sm: 480, md: 640, lg: 820, xl: 1040, '2xl': 1200 }
  const width  = WIDTHS[size] ?? WIDTHS.md

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: 'var(--modal-overlay)' }}
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose?.() } : undefined}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex flex-col rounded-2xl shadow-xl outline-none animate-fade-in"
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--border)',
          boxShadow:    'var(--shadow-lg)',
          width:        '100%',
          maxWidth:     width,
          maxHeight:    '90vh',
        }}
      >
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <div
          className="flex items-start justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,.2)' }}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>{title}</h2>
              {subtitle && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ────────────────────────────────────────────── */}
        <div
          className={`flex-1 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}
          style={{ minHeight: 0 }}
        >
          <div className={noPadding ? '' : 'p-6'}>
            {children}
          </div>
        </div>

        {/* ── Sticky Footer ──────────────────────────────────────────────── */}
        {footer && (
          <div
            className="flex items-center justify-end gap-2.5 px-6 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ─── Modal action button helpers ──────────────────────────────────────────────
export function ModalBtn({ children, variant = 'primary', onClick, disabled, type = 'button', loading }) {
  const styles = {
    primary:   { background: 'var(--primary)',    color: '#fff',           border: 'none'                           },
    secondary: { background: 'var(--card)',        color: 'var(--text2)',   border: '1px solid var(--border)'        },
    danger:    { background: 'var(--danger)',      color: '#fff',           border: 'none'                           },
    ghost:     { background: 'transparent',        color: 'var(--text3)',   border: '1px solid var(--border)'        },
    success:   { background: 'var(--success)',     color: '#fff',           border: 'none'                           },
  }
  const s = styles[variant] ?? styles.primary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={s}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '0.88')}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = '1')}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
      {children}
    </button>
  )
}
