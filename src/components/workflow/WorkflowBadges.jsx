import {
  CheckCircle2, ClipboardCheck, Shield, PackageCheck,
  FileCheck, Banknote, Bell, Search, MapPin, Layers,
  AlertTriangle, XCircle, Clock, Play, Pause,
} from 'lucide-react'
import { STEP_TYPES } from '../../api/mock/workflowData'

// ─── Step icon resolver ────────────────────────────────────────────────────────
const ICON_MAP = {
  CheckCircle2, ClipboardCheck, Shield, PackageCheck,
  FileCheck, Banknote, Bell, Search, MapPin, Layers,
}

export function StepIcon({ type, size = 'sm', className = '' }) {
  const cfg  = STEP_TYPES[type]
  const Icon = ICON_MAP[cfg?.icon] ?? Layers
  const sz   = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
  return <Icon className={`${sz} ${className}`} />
}

// ─── Step type color map ──────────────────────────────────────────────────────
const TYPE_COLORS = {
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', solid: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-400',   solid: 'bg-amber-500'   },
  orange:  { bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  text: 'text-orange-400',  solid: 'bg-orange-500'  },
  sky:     { bg: 'bg-sky-500/15',     border: 'border-sky-500/30',     text: 'text-sky-400',     solid: 'bg-sky-500'     },
  purple:  { bg: 'bg-purple-500/15',  border: 'border-purple-500/30',  text: 'text-purple-400',  solid: 'bg-purple-500'  },
  teal:    { bg: 'bg-teal-500/15',    border: 'border-teal-500/30',    text: 'text-teal-400',    solid: 'bg-teal-500'    },
  slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   text: 'text-slate-400',   solid: 'bg-slate-500'   },
  red:     { bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-400',     solid: 'bg-red-500'     },
}

export function getStepColors(type) {
  const color = STEP_TYPES[type]?.color ?? 'slate'
  return TYPE_COLORS[color] ?? TYPE_COLORS.slate
}

// ─── Workflow status badge ────────────────────────────────────────────────────
const WF_STATUS = {
  draft:     { label: 'DRAFT',     cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20'  },
  active:    { label: 'ACTIVE',    cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  paused:    { label: 'PAUSED',    cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  completed: { label: 'COMPLETED', cls: 'text-sky-400    bg-sky-500/10    border-sky-500/20'    },
  failed:    { label: 'FAILED',    cls: 'text-red-400    bg-red-500/10    border-red-500/20'    },
}

export function WFStatusBadge({ status }) {
  const cfg = WF_STATUS[status] ?? WF_STATUS.draft
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  )
}

// ─── Workflow type badge ──────────────────────────────────────────────────────
export function WFTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md
      ${type === 'international'
        ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        : 'text-teal-400   bg-teal-500/10   border-teal-500/20'
      }`}>
      {type === 'international' ? '🌐 INTL' : '📍 LOCAL'}
    </span>
  )
}

// ─── Step status dot ──────────────────────────────────────────────────────────
const SS_CFG = {
  pending:   { cls: 'bg-slate-600',   pulse: false },
  active:    { cls: 'bg-amber-500',   pulse: true  },
  completed: { cls: 'bg-emerald-500', pulse: false },
  failed:    { cls: 'bg-red-500',     pulse: true  },
  skipped:   { cls: 'bg-slate-700',   pulse: false },
  waiting:   { cls: 'bg-sky-500',     pulse: true  },
}

export function StepStatusDot({ status, size = 'sm' }) {
  const cfg = SS_CFG[status] ?? SS_CFG.pending
  const sz  = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  return (
    <span className="relative inline-flex flex-shrink-0">
      {cfg.pulse && <span className={`animate-ping absolute inline-flex ${sz} rounded-full ${cfg.cls} opacity-60`} />}
      <span className={`relative inline-flex ${sz} rounded-full ${cfg.cls}`} />
    </span>
  )
}

// ─── SLA indicator ───────────────────────────────────────────────────────────
export function SLABadge({ hours, compact = false }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-slate-600 font-mono">
      <Clock className="w-2.5 h-2.5" />
      {hours}h SLA
    </span>
  )
}

// ─── Workflow stats bar ───────────────────────────────────────────────────────
export function WorkflowProgress({ steps }) {
  const real      = steps.filter((s) => s.type !== 'location_marker')
  const total     = real.length
  const completed = real.filter((s) => s.status === 'completed').length
  const active    = real.filter((s) => s.status === 'active').length
  const failed    = real.filter((s) => s.status === 'failed').length
  const pct       = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-helm-700 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${failed > 0 ? 'bg-red-500' : 'bg-emerald-500'} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12.5px] font-mono text-slate-500">{completed}/{total}</span>
    </div>
  )
}
