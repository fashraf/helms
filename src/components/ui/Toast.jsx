import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import useToastStore from '../../store/toastStore'

// ── Icon + color map ──────────────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: {
    icon:     CheckCircle2,
    iconCls:  'text-emerald-400',
    border:   'border-l-emerald-500',
    bar:      'bg-emerald-500',
    bg:       'bg-helm-800',
  },
  warning: {
    icon:     AlertTriangle,
    iconCls:  'text-amber-400',
    border:   'border-l-amber-500',
    bar:      'bg-amber-500',
    bg:       'bg-helm-800',
  },
  error: {
    icon:     XCircle,
    iconCls:  'text-red-400',
    border:   'border-l-red-500',
    bar:      'bg-red-500',
    bg:       'bg-helm-800',
  },
  info: {
    icon:     Info,
    iconCls:  'text-sky-400',
    border:   'border-l-sky-500',
    bar:      'bg-sky-500',
    bg:       'bg-helm-800',
  },
}

export default function Toast({ id, type = 'info', title, message, duration = 5000 }) {
  const dismiss   = useToastStore((s) => s.dismiss)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG.info
  const Icon = cfg.icon

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), duration)
    return () => clearTimeout(timer)
  }, [duration])

  const handleDismiss = () => {
    setLeaving(true)
    setTimeout(() => dismiss(id), 280)
  }

  return (
    <div
      className={`
        relative flex items-start gap-3
        w-80 ${cfg.bg} border border-helm-600 border-l-4 ${cfg.border}
        rounded-xl shadow-card-hover overflow-hidden
        transition-all duration-300 ease-out
        ${visible && !leaving
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full'
        }
      `}
    >
      {/* Content */}
      <div className="flex items-start gap-3 flex-1 p-4 min-w-0">
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.iconCls}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-slate-100 leading-tight">{title}</p>
          )}
          {message && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        style={{
          width: '100%',
          animation: `shrinkWidth ${duration}ms linear forwards`,
        }}
      />
    </div>
  )
}
