import { CheckCircle2, Clock, Wrench, XCircle, AlertTriangle, Zap } from 'lucide-react'

// ─── Vehicle status ───────────────────────────────────────────────────────────
const VS = {
  active:      { label: 'ACTIVE',      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', pulse: true  },
  idle:        { label: 'IDLE',        cls: 'text-slate-400   bg-slate-500/10   border-slate-500/20',   dot: 'bg-slate-500',   pulse: false },
  maintenance: { label: 'MAINTENANCE', cls: 'text-amber-400   bg-amber-500/10   border-amber-500/20',   dot: 'bg-amber-500',   pulse: false },
  inactive:    { label: 'INACTIVE',    cls: 'text-red-400     bg-red-500/10     border-red-500/20',     dot: 'bg-red-500',     pulse: false },
}
export function VehicleStatusBadge({ status }) {
  const c = VS[status] ?? VS.idle
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${c.cls}`}>
      <span className={`relative w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}

// ─── Driver status ────────────────────────────────────────────────────────────
const DS = {
  on_duty:   { label: 'ON DUTY',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  available: { label: 'AVAILABLE', cls: 'text-sky-400     bg-sky-500/10     border-sky-500/20'     },
  off_duty:  { label: 'OFF DUTY',  cls: 'text-slate-400   bg-slate-500/10   border-slate-500/20'   },
  on_leave:  { label: 'ON LEAVE',  cls: 'text-purple-400  bg-purple-500/10  border-purple-500/20'  },
}
export function DriverStatusBadge({ status }) {
  const c = DS[status] ?? DS.off_duty
  return <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${c.cls}`}>{c.label}</span>
}

// ─── Priority badge ───────────────────────────────────────────────────────────
const PRI = {
  critical: { label: 'CRITICAL', cls: 'text-red-400    bg-red-500/10    border-red-500/20    animate-pulse' },
  high:     { label: 'HIGH',     cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  medium:   { label: 'MEDIUM',   cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  low:      { label: 'LOW',      cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20'  },
}
export function PriorityBadge({ priority }) {
  const c = PRI[priority] ?? PRI.low
  return <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${c.cls}`}>{c.label}</span>
}

// ─── Maintenance status ───────────────────────────────────────────────────────
const MS = {
  pending:     { label: 'PENDING',     cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20',  icon: Clock         },
  approved:    { label: 'APPROVED',    cls: 'text-sky-400    bg-sky-500/10    border-sky-500/20',     icon: CheckCircle2  },
  in_progress: { label: 'IN PROGRESS', cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20',  icon: Wrench        },
  completed:   { label: 'COMPLETED',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  cancelled:   { label: 'CANCELLED',   cls: 'text-red-400    bg-red-500/10    border-red-500/20',    icon: XCircle       },
}
export function MaintStatusBadge({ status }) {
  const c = MS[status] ?? MS.pending
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${c.cls}`}>
      <Icon className="w-2.5 h-2.5" />{c.label}
    </span>
  )
}

// ─── Severity badge ───────────────────────────────────────────────────────────
const SEV = {
  critical: { label: 'CRITICAL', cls: 'text-red-400    bg-red-500/10    border-red-500/20    animate-pulse', bar: 'bg-red-500'    },
  high:     { label: 'HIGH',     cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20',                bar: 'bg-amber-500'  },
  medium:   { label: 'MEDIUM',   cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20',               bar: 'bg-orange-500' },
  low:      { label: 'LOW',      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',            bar: 'bg-emerald-500'},
}
export function SeverityBadge({ severity }) {
  const c = SEV[severity] ?? SEV.low
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${c.cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{c.label}</span>
}
export function getSeverityBar(severity) { return SEV[severity]?.bar ?? 'bg-slate-500' }

// ─── Incident status ──────────────────────────────────────────────────────────
const IS = {
  open:         { label: 'OPEN',         cls: 'text-red-400    bg-red-500/10    border-red-500/20'    },
  investigating:{ label: 'INVESTIGATING',cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  resolved:     { label: 'RESOLVED',     cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  closed:       { label: 'CLOSED',       cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20'  },
}
export function IncidentStatusBadge({ status }) {
  const c = IS[status] ?? IS.open
  return <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${c.cls}`}>{c.label}</span>
}

// ─── Warehouse status ─────────────────────────────────────────────────────────
export function CapacityBar({ pct, height = 'h-1.5' }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className={`w-full ${height} bg-helm-700 rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
export function CapacityLabel({ pct }) {
  const color = pct >= 90 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'
  return <span className={`text-xs font-mono font-bold tabular-nums ${color}`}>{pct}%</span>
}

// ─── Fuel gauge ───────────────────────────────────────────────────────────────
export function FuelGauge({ level, compact = false }) {
  const color = level <= 20 ? 'bg-red-500 text-red-400' : level <= 40 ? 'bg-amber-500 text-amber-400' : 'bg-emerald-500 text-emerald-400'
  const [bg, text] = color.split(' ')
  if (compact) return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-helm-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${level}%` }} />
      </div>
      <span className={`text-[12.5px] font-mono tabular-nums ${text}`}>{level}%</span>
    </div>
  )
  return (
    <div className="space-y-1">
      <div className="w-full h-2 bg-helm-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bg}`} style={{ width: `${level}%` }} />
      </div>
      <div className="flex justify-between text-[12.5px]">
        <span className="text-slate-600">0%</span>
        <span className={`font-mono font-bold ${text}`}>{level}%</span>
        <span className="text-slate-600">100%</span>
      </div>
    </div>
  )
}

// ─── Performance score ring ───────────────────────────────────────────────────
export function ScoreRing({ score }) {
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444'
  const r = 20; const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#1d2d42" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black font-mono" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

// ─── Stats mini-card ──────────────────────────────────────────────────────────
export function StatMini({ label, value, color = 'text-slate-100', sub }) {
  return (
    <div className="bg-helm-800 border border-helm-600 rounded-xl px-4 py-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">{label}</div>
      <div className={`text-2xl font-black font-mono tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[12.5px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Route risk badge ─────────────────────────────────────────────────────────
const RR = {
  low:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  high:   'text-red-400    bg-red-500/10    border-red-500/20',
}
export function RoutRiskBadge({ risk }) {
  return <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${RR[risk] ?? RR.low}`}>{risk?.toUpperCase()}</span>
}

// ─── Relative time helper ─────────────────────────────────────────────────────
export function relTime(iso) {
  if (!iso) return '—'
  const d = (Date.now() - new Date(iso)) / 60000
  if (d < 0)   return 'in ' + Math.round(-d) + 'm'
  if (d < 1)   return 'just now'
  if (d < 60)  return Math.floor(d) + 'm ago'
  if (d < 1440)return Math.floor(d/60) + 'h ago'
  return Math.floor(d/1440) + 'd ago'
}
