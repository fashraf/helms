import { useRef, useEffect, useState } from 'react'
import {
  Package, AlertTriangle, CheckCircle2, Truck,
  Warehouse, GitBranch, Wrench, Radio, Pause, Play
} from 'lucide-react'
import useDashboardStore from '../../store/dashboardStore'

// ── Event type config ─────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  shipment_created:   { icon: Package,      color: 'text-sky-400',     bg: 'bg-sky-500/10',     dot: 'bg-sky-500',     label: 'CREATED'   },
  shipment_delayed:   { icon: AlertTriangle,color: 'text-amber-400',   bg: 'bg-amber-500/10',   dot: 'bg-amber-500',   label: 'DELAYED'   },
  shipment_delivered: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'DELIVERED' },
  driver_assigned:    { icon: Truck,        color: 'text-teal-400',    bg: 'bg-teal-500/10',    dot: 'bg-teal-500',    label: 'ASSIGNED'  },
  warehouse_updated:  { icon: Warehouse,    color: 'text-purple-400',  bg: 'bg-purple-500/10',  dot: 'bg-purple-500',  label: 'WAREHOUSE' },
  workflow_approved:  { icon: GitBranch,    color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'APPROVED'  },
  fleet_alert:        { icon: Truck,        color: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-500',     label: 'ALERT'     },
  maintenance_alert:  { icon: Wrench,       color: 'text-orange-400',  bg: 'bg-orange-500/10',  dot: 'bg-orange-500',  label: 'MAINT'     },
}

const DEFAULT_CFG = { icon: Radio, color: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-500', label: 'EVENT' }

// ── Relative timestamp ────────────────────────────────────────────────────────
function useRelativeTime(isoString) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(isoString).getTime()
      const s = Math.floor(diff / 1000)
      if (s < 10)  { setLabel('just now');       return }
      if (s < 60)  { setLabel(`${s}s ago`);      return }
      const m = Math.floor(s / 60)
      if (m < 60)  { setLabel(`${m}m ago`);      return }
      const h = Math.floor(m / 60)
      if (h < 24)  { setLabel(`${h}h ago`);      return }
      setLabel(`${Math.floor(h/24)}d ago`)
    }

    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [isoString])

  return label
}

// ── Single event row ──────────────────────────────────────────────────────────
function EventRow({ event }) {
  const cfg = EVENT_CONFIG[event.type] ?? DEFAULT_CFG
  const Icon = cfg.icon
  const timeLabel = useRelativeTime(event.timestamp)

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-2.5
        border-b border-helm-700/40 last:border-0
        hover:bg-helm-750/40 transition-colors duration-100
        ${event.isNew ? 'animate-slide-in' : ''}
      `}
    >
      {/* Type icon */}
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`w-3 h-3 ${cfg.color}`} />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold tracking-widest ${cfg.color} font-mono`}>
            {cfg.label}
          </span>
          <span className="text-[12.5px] font-semibold text-slate-300 truncate">{event.title}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed truncate">{event.message}</p>
        {event.detail && (
          <p className="text-[12.5px] text-slate-600 mt-0.5 truncate">{event.detail}</p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[12.5px] text-slate-600 font-mono flex-shrink-0 mt-0.5 tabular-nums">
        {timeLabel}
      </span>
    </div>
  )
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
export default function ActivityFeed() {
  const events     = useDashboardStore((s) => s.activityFeed)
  const paused     = useDashboardStore((s) => s.feedPaused)
  const setPaused  = useDashboardStore((s) => s.setFeedPaused)
  const listRef    = useRef(null)

  // Scroll to top when new event arrives (if not paused)
  useEffect(() => {
    if (!paused && listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [events.length, paused])

  return (
    <div className="flex flex-col bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-helm-700 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {!paused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            {paused && <span className="h-2 w-2 rounded-full bg-slate-600" />}
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-slate-300">
            Live Activity Feed
          </span>
          <span className="text-[12.5px] text-slate-600 font-mono">{events.length} events</span>
        </div>

        <button
          onClick={() => setPaused(!paused)}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12.5px] font-semibold
            transition-all duration-150
            ${paused
              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
              : 'bg-helm-700 text-slate-400 hover:text-slate-200'
            }
          `}
          title={paused ? 'Resume feed' : 'Pause feed'}
        >
          {paused
            ? <><Play  className="w-3 h-3" /> RESUME</>
            : <><Pause className="w-3 h-3" /> PAUSE</>
          }
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-helm-850/50 border-b border-helm-700/50">
        <div className="w-6" />
        <div className="flex-1 grid grid-cols-3 gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Type / ID</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 col-span-2">Event</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 w-12 text-right">When</span>
      </div>

      {/* Event list */}
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight: '320px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {events.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-600">
            Waiting for activity events…
          </div>
        ) : (
          events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  )
}
