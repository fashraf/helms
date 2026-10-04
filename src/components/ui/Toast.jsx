import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import useToastStore from '../../store/toastStore'

// ── Icon + color map ──────────────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: { icon: CheckCircle2,   iconCls: 'text-emerald-400', border: 'border-l-emerald-500', bar: 'bg-emerald-500', bg: 'bg-helm-800' },
  warning: { icon: AlertTriangle,  iconCls: 'text-amber-400',   border: 'border-l-amber-500',   bar: 'bg-amber-500',   bg: 'bg-helm-800' },
  error:   { icon: XCircle,        iconCls: 'text-red-400',     border: 'border-l-red-500',     bar: 'bg-red-500',     bg: 'bg-helm-800' },
  info:    { icon: Info,           iconCls: 'text-sky-400',     border: 'border-l-sky-500',     bar: 'bg-sky-500',     bg: 'bg-helm-800' },
}

// ── Fuel variant — 40% bg opacity, glyph icon, 2-col layout, bottom-center ────
// Background tints use rgba with 0.4 alpha against the type color.
const FUEL_VARIANT = {
  success: { glyph: '✓',  bg: 'rgba(16, 185, 129, 0.40)', border: 'rgba(16, 185, 129, 0.7)',  iconColor: '#065F46' },
  warning: { glyph: '⚠️', bg: 'rgba(245, 158, 11, 0.40)', border: 'rgba(245, 158, 11, 0.7)',  iconColor: '#7C2D12' },
  error:   { glyph: '✕',  bg: 'rgba(220, 38, 38, 0.40)',  border: 'rgba(220, 38, 38, 0.7)',   iconColor: '#7F1D1D' },
  info:    { glyph: 'ℹ',  bg: 'rgba(14, 165, 233, 0.40)', border: 'rgba(14, 165, 233, 0.7)',  iconColor: '#0C4A6E' },
}

export default function Toast({ id, type = 'info', title, message, duration = 4000, variant, position }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const isFuel = variant === 'fuel'
  const fromBottom = position === 'bottom-center'

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), duration)
    return () => clearTimeout(timer)
  }, [duration])

  const handleDismiss = () => {
    setLeaving(true)
    setTimeout(() => dismiss(id), 280)
  }

  // ── Fuel variant render ────────────────────────────────────────────────────
  if (isFuel) {
    const v = FUEL_VARIANT[type] ?? FUEL_VARIANT.info
    const enterCls = fromBottom
      ? (visible && !leaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
      : (visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full')
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md transition-all duration-300 ease-out ${enterCls}`}
        style={{
          background: v.bg,
          border: `1px solid ${v.border}`,
          minWidth: 320,
          maxWidth: 480,
        }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
          style={{ background: '#fff', color: v.iconColor }}>
          {v.glyph}
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-bold text-white leading-tight drop-shadow-sm">{title}</p>}
          {message && <p className={`text-[12.5px] text-white/90 leading-relaxed ${title ? 'mt-0.5' : ''}`}>{message}</p>}
        </div>
        <button onClick={handleDismiss} className="flex-shrink-0 text-white/70 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  // ── Default render ─────────────────────────────────────────────────────────
  const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG.info
  const Icon = cfg.icon
  const enterCls = fromBottom
    ? (visible && !leaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
    : (visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full')

  return (
    <div
      className={`
        relative flex items-start gap-3
        w-80 ${cfg.bg} border border-helm-600 border-l-4 ${cfg.border}
        rounded-xl shadow-card-hover overflow-hidden
        transition-all duration-300 ease-out
        ${enterCls}
      `}>
      <div className="flex items-start gap-3 flex-1 p-4 min-w-0">
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.iconCls}`} />
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-semibold text-slate-100 leading-tight">{title}</p>}
          {message && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{message}</p>}
        </div>
        <button onClick={handleDismiss} className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        style={{ width: '100%', animation: `shrinkWidth ${duration}ms linear forwards` }} />
    </div>
  )
}
