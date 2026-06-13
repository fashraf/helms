import { useState } from 'react'
import {
  Package, Warehouse, ClipboardCheck, Shield,
  Building2, CheckCircle2, MapPin, ChevronDown, ChevronUp,
  Clock, Users, Lock, Unlock, CheckCheck,
} from 'lucide-react'
import { StopTypePill, ETADisplay } from './ShipmentBadges'

// ─── Icon map ─────────────────────────────────────────────────────────────────
const STOP_ICONS = {
  pickup:   Package,
  warehouse:Warehouse,
  qa:       ClipboardCheck,
  customs:  Shield,
  showroom: Building2,
  delivery: CheckCircle2,
  waypoint: MapPin,
}

// ─── Stop node colors ─────────────────────────────────────────────────────────
const STOP_STATUS_STYLE = {
  completed: {
    node:  'bg-emerald-500 border-emerald-400',
    icon:  'text-white',
    line:  'bg-emerald-500',
    ring:  '',
  },
  active: {
    node:  'bg-amber-500 border-amber-400',
    icon:  'text-helm-900',
    line:  'bg-helm-700',
    ring:  'ring-2 ring-amber-500/40 ring-offset-1 ring-offset-helm-900',
  },
  delayed: {
    node:  'bg-red-600 border-red-500',
    icon:  'text-white',
    line:  'bg-helm-700',
    ring:  'ring-2 ring-red-500/40 ring-offset-1 ring-offset-helm-900 animate-pulse',
  },
  pending: {
    node:  'bg-helm-700 border-helm-500',
    icon:  'text-slate-500',
    line:  'bg-helm-700',
    ring:  '',
  },
  skipped: {
    node:  'bg-helm-800 border-dashed border-helm-600',
    icon:  'text-slate-700',
    line:  'bg-helm-700',
    ring:  '',
  },
}

// ─── Expanded stop card ───────────────────────────────────────────────────────
function StopDetailCard({ stop }) {
  const isPast = stop.actualArrival || stop.status === 'completed'
  return (
    <div className="bg-helm-850 border border-helm-600 rounded-xl p-4 mt-2 animate-fade-in">
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
        <div>
          <div className="text-slate-600 mb-0.5 uppercase tracking-wider text-[9px] font-bold">Location</div>
          <div className="text-slate-200 font-medium">{stop.location || '—'}</div>
        </div>
        <div>
          <div className="text-slate-600 mb-0.5 uppercase tracking-wider text-[9px] font-bold">Responsible Team</div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Users className="w-3 h-3 text-slate-500" />
            {stop.team}
          </div>
        </div>
        <div>
          <div className="text-slate-600 mb-0.5 uppercase tracking-wider text-[9px] font-bold">ETA</div>
          <ETADisplay eta={stop.eta} />
        </div>
        {stop.actualArrival && (
          <div>
            <div className="text-slate-600 mb-0.5 uppercase tracking-wider text-[9px] font-bold">Actual Arrival</div>
            <ETADisplay eta={stop.actualArrival} />
          </div>
        )}
        <div>
          <div className="text-slate-600 mb-0.5 uppercase tracking-wider text-[9px] font-bold">Approval Required</div>
          <div className="flex items-center gap-1.5">
            {stop.requiresApproval ? (
              stop.approved
                ? <><Unlock className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Approved</span></>
                : <><Lock   className="w-3 h-3 text-amber-400"  /><span className="text-amber-400">Pending Approval</span></>
            ) : (
              <span className="text-slate-500">Not required</span>
            )}
          </div>
        </div>
        {stop.notes && (
          <div className="col-span-2">
            <div className="text-slate-600 mb-0.5 uppercase tracking-wider text-[9px] font-bold">Notes</div>
            <div className="text-amber-400 text-[11px]">⚠ {stop.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Single stop node ─────────────────────────────────────────────────────────
function StopNode({ stop, index, total, isExpanded, onToggle }) {
  const style  = STOP_STATUS_STYLE[stop.status] ?? STOP_STATUS_STYLE.pending
  const Icon   = STOP_ICONS[stop.type] ?? MapPin
  const isLast = index === total - 1

  return (
    <div className="flex flex-col items-center relative" style={{ minWidth: '120px', flex: 1 }}>
      {/* Connector line (right side, except last) */}
      {!isLast && (
        <div className="absolute top-5 left-1/2 right-0 h-0.5 -translate-y-1/2 z-0" style={{ left: '50%', right: '-50%' }}>
          <div className={`h-full ${style.line}`} />
        </div>
      )}

      {/* Node button */}
      <button
        onClick={onToggle}
        className={`
          relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center
          transition-all duration-200 hover:scale-110
          ${style.node} ${style.ring}
        `}
      >
        {stop.status === 'completed'
          ? <CheckCheck className="w-4 h-4 text-white" />
          : <Icon className={`w-4 h-4 ${style.icon}`} />
        }
      </button>

      {/* Label */}
      <div className="mt-2 text-center max-w-[100px]">
        <div className="text-[12.5px] font-bold text-slate-300 leading-tight">{stop.name}</div>
        <div className="text-[9px] text-slate-600 font-mono mt-0.5">#{stop.sequence}</div>
        {stop.status === 'active' && (
          <div className="text-[9px] text-amber-400 font-bold mt-0.5 animate-pulse">● ACTIVE</div>
        )}
        {stop.status === 'delayed' && (
          <div className="text-[9px] text-red-400 font-bold mt-0.5">⚠ DELAYED</div>
        )}
        {stop.status === 'completed' && (
          <div className="text-[9px] text-emerald-400 mt-0.5">✓ Done</div>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={onToggle}
        className="mt-1 text-slate-600 hover:text-slate-300 transition-colors"
      >
        {isExpanded
          ? <ChevronUp className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3" />
        }
      </button>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ stops }) {
  const completed = stops.filter((s) => s.status === 'completed').length
  const delayed   = stops.some((s)  => s.status === 'delayed')
  const pct       = Math.round((completed / stops.length) * 100)

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
        <span className="text-slate-500 font-medium">Route Progress</span>
        <span className={`font-mono font-bold ${delayed ? 'text-red-400' : 'text-amber-400'}`}>
          {completed}/{stops.length} stops · {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-helm-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${delayed ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Timeline ────────────────────────────────────────────────────────────
export default function RouteTimeline({ stops }) {
  const [expandedStop, setExpandedStop] = useState(
    stops.findIndex((s) => s.status === 'active' || s.status === 'delayed')
  )

  if (!stops?.length) {
    return <div className="py-8 text-center text-sm text-slate-600">No route stops defined.</div>
  }

  const toggleStop = (idx) => setExpandedStop(expandedStop === idx ? null : idx)

  return (
    <div>
      <ProgressBar stops={stops} />

      {/* Horizontal timeline */}
      <div className="overflow-x-auto pb-2">
        <div
          className="flex items-start relative pt-4 pb-2"
          style={{ minWidth: `${stops.length * 130}px` }}
        >
          {/* Background connector line */}
          <div className="absolute top-9 left-8 right-8 h-0.5 bg-helm-700 z-0" />

          {stops.map((stop, i) => (
            <StopNode
              key={stop.id}
              stop={stop}
              index={i}
              total={stops.length}
              isExpanded={expandedStop === i}
              onToggle={() => toggleStop(i)}
            />
          ))}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expandedStop !== null && stops[expandedStop] && (
        <div className="border-t border-helm-700 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <StopTypePill type={stops[expandedStop].type} />
            <span className="text-sm font-semibold text-slate-200">
              Stop {stops[expandedStop].sequence}: {stops[expandedStop].name}
            </span>
          </div>
          <StopDetailCard stop={stops[expandedStop]} />
        </div>
      )}
    </div>
  )
}
