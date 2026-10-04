// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:    { label: 'Pending',    cls: 'text-slate-300  bg-slate-500/10  border-slate-500/20'  },
  in_transit: { label: 'In Transit', cls: 'text-sky-400    bg-sky-500/10    border-sky-500/20'    },
  delivered:  { label: 'Delivered',  cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  delayed:    { label: 'Delayed',    cls: 'text-red-400    bg-red-500/10    border-red-500/20  animate-pulse' },
  on_hold:    { label: 'On Hold',    cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  cancelled:  { label: 'Cancelled',  cls: 'text-slate-500  bg-slate-600/10  border-slate-600/20'  },
}

export function StatusBadge({ status, className = '' }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[12.5px] font-bold tracking-wider border rounded-md ${cfg.cls} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label.toUpperCase()}
    </span>
  )
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
export function TypeBadge({ type, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[12.5px] font-bold tracking-wider rounded-md
      ${type === 'international'
        ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
        : 'text-teal-400 bg-teal-500/10 border border-teal-500/20'
      } ${className}`}
    >
      {type === 'international' ? '🌐 INTL' : '📍 LOCAL'}
    </span>
  )
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent:   { label: 'URGENT',   cls: 'text-red-400    bg-red-500/10    border-red-500/20'    },
  high:     { label: 'HIGH',     cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  standard: { label: 'STANDARD', cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20'  },
  low:      { label: 'LOW',      cls: 'text-slate-500  bg-slate-600/10  border-slate-600/10'  },
}

export function PriorityBadge({ priority = 'standard', className = '' }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.standard
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[12.5px] font-bold tracking-widest border rounded-md ${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  )
}

// ─── Risk Score ───────────────────────────────────────────────────────────────
export function RiskScore({ score, showBar = true, size = 'md' }) {
  const color = score >= 70 ? 'text-red-400 bg-red-500'
    : score >= 40           ? 'text-amber-400 bg-amber-500'
    : 'text-emerald-400 bg-emerald-500'
  const [textColor, barColor] = color.split(' ')

  return (
    <div className={`flex items-center gap-2 ${size === 'sm' ? '' : ''}`}>
      <span className={`font-mono font-bold tabular-nums ${size === 'sm' ? 'text-xs' : 'text-sm'} ${textColor}`}>
        {score}
      </span>
      {showBar && (
        <div className="flex-1 h-1 bg-helm-700 rounded-full overflow-hidden min-w-[40px]">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Stop Type Pill ───────────────────────────────────────────────────────────
const STOP_TYPE_CFG = {
  pickup:    { cls: 'text-sky-400    bg-sky-500/10    border-sky-500/20',    label: 'PICKUP'    },
  warehouse: { cls: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'WAREHOUSE' },
  qa:        { cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20',  label: 'QA'        },
  customs:   { cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20', label: 'CUSTOMS'   },
  showroom:  { cls: 'text-teal-400   bg-teal-500/10   border-teal-500/20',   label: 'SHOWROOM'  },
  delivery:  { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'DELIVERY' },
  waypoint:  { cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20',  label: 'WAYPOINT'  },
}

export function StopTypePill({ type, className = '' }) {
  const cfg = STOP_TYPE_CFG[type] ?? STOP_TYPE_CFG.waypoint
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded ${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  )
}

// ─── ETA Display ─────────────────────────────────────────────────────────────
export function ETADisplay({ eta, compact = false }) {
  if (!eta) return <span className="text-slate-600 text-xs">—</span>
  const d = new Date(eta)
  const isPast = d < new Date()
  if (compact) {
    return (
      <span className={`text-xs font-mono ${isPast ? 'text-red-400' : 'text-slate-300'}`}>
        {d.toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}
      </span>
    )
  }
  return (
    <div>
      <div className={`text-xs font-mono font-semibold ${isPast ? 'text-red-400' : 'text-slate-200'}`}>
        {d.toLocaleDateString('en-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="text-[12.5px] text-slate-600 font-mono">
        {d.toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
