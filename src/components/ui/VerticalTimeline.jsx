import { useState } from 'react'
import {
  Package, Warehouse, ClipboardCheck, Shield, Truck,
  MapPin, CheckCircle2, AlertTriangle, Search, User, Wrench,
  ChevronDown, ChevronUp, Clock, Users, Brain,
} from 'lucide-react'

const ICON_MAP = { Package, Warehouse, ClipboardCheck, Shield, TruckIcon: Truck, MapPin, CheckCircle2, AlertTriangle, Search, User, Wrench }

const RISK_LABEL = (s) =>
  s >= 60 ? { text: 'HIGH', cls: 'text-red-600 bg-red-50 border border-red-200' }
  : s >= 30 ? { text: 'MEDIUM', cls: 'text-amber-600 bg-amber-50 border border-amber-200' }
  : { text: 'LOW', cls: 'text-emerald-600 bg-emerald-50 border border-emerald-200' }

function relTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 60000
  if (diff < 0) return d.toLocaleTimeString('en-SA', { hour:'2-digit', minute:'2-digit' }) + ' (upcoming)'
  if (diff < 60) return Math.floor(diff) + 'm ago'
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago'
  return d.toLocaleDateString('en-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

// ─── Single timeline node ──────────────────────────────────────────────────────
function TimelineNode({ event, isLast, isFirst, config }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICON_MAP[config?.icon] ?? Package
  const risk = RISK_LABEL(event.riskScore ?? 0)
  const isPast    = event.completed
  const isCurrent = !event.completed && !isLast

  const dotBg   = isPast    ? config?.color ?? '#2563EB'
    : isCurrent ? config?.color ?? '#D97706'
    : 'var(--bg3)'
  const dotBorder = isPast    ? 'transparent'
    : isCurrent ? config?.color ?? '#D97706'
    : 'var(--border2)'
  const cardBg   = isCurrent ? config?.bg ?? '#EFF6FF' : 'var(--card)'
  const cardBorder = isCurrent ? (config?.color ?? '#2563EB') + '40' : 'var(--border)'

  return (
    <div className="flex gap-4 relative">
      {/* Left: dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        {/* Node dot */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all"
          style={{ background: dotBg, border: `2px solid ${dotBorder}`, boxShadow: isPast || isCurrent ? '0 0 0 3px ' + dotBg + '25' : 'none' }}
        >
          {isPast
            ? <CheckCircle2 className="w-4 h-4 text-white" />
            : <Icon className="w-4 h-4" style={{ color: isCurrent ? 'white' : 'var(--text3)' }} />
          }
        </div>
        {/* Vertical line */}
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1" style={{ minHeight: 32, background: isPast ? (config?.color ?? '#2563EB') + '40' : 'var(--border)' }} />
        )}
      </div>

      {/* Right: card */}
      <div className="flex-1 pb-6">
        <div
          className="rounded-xl border overflow-hidden transition-all"
          style={{ background: cardBg, borderColor: cardBorder, boxShadow: isCurrent ? '0 4px 12px ' + (config?.color ?? '#2563EB') + '18' : 'var(--shadow)' }}
        >
          {/* Card header */}
          <div className="flex items-start justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold" style={{ color: config?.color ?? 'var(--primary)' }}>
                  {config?.label ?? event.type}
                </span>
                {isCurrent && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                    style={{ background: (config?.color ?? '#2563EB') + '20', color: config?.color ?? 'var(--primary)' }}>
                    IN PROGRESS
                  </span>
                )}
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{event.notes}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${risk.cls}`}>{risk.text} RISK</span>
              <button onClick={() => setExpanded(!expanded)} style={{ color: 'var(--text3)' }}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 px-4 pb-3 text-[12.5px]" style={{ color: 'var(--text3)' }}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {relTime(event.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.by}
            </span>
            {event.team && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {event.team}
              </span>
            )}
            {event.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration: {event.duration}
              </span>
            )}
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="px-4 pb-4 border-t animate-fade-in" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text3)' }}>Risk Score</div>
                  <div className="text-lg font-black font-mono" style={{ color: event.riskScore >= 60 ? 'var(--danger)' : event.riskScore >= 30 ? 'var(--warning)' : 'var(--success)' }}>
                    {event.riskScore ?? 0}
                    <span className="text-xs font-normal" style={{ color: 'var(--text3)' }}>/100</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text3)' }}>Status</div>
                  <div className="text-sm font-semibold" style={{ color: isPast ? 'var(--success)' : isCurrent ? 'var(--warning)' : 'var(--text3)' }}>
                    {isPast ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text3)' }}>Team</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{event.team}</div>
                </div>
              </div>
              {event.aiPrediction && (
                <div className="mt-3 rounded-lg px-3 py-2 border text-xs" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)', color: 'var(--primary)' }}>
                  <Brain className="w-3.5 h-3.5 inline mr-1.5" />
                  AI: {event.aiPrediction}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main VerticalTimeline ────────────────────────────────────────────────────
export default function VerticalTimeline({ events = [], title, compact = false }) {
  const TIMELINE_EVENT_TYPES = {
    created:    { icon:'Package',        color:'#2563EB', bg:'#EFF6FF', label:'Created'       },
    warehouse:  { icon:'Warehouse',      color:'#7C3AED', bg:'#F5F3FF', label:'Warehouse'     },
    qa:         { icon:'ClipboardCheck', color:'#D97706', bg:'#FFFBEB', label:'QA Inspection' },
    customs:    { icon:'Shield',         color:'#EA580C', bg:'#FFF7ED', label:'Customs'       },
    departure:  { icon:'TruckIcon',      color:'#0891B2', bg:'#ECFEFF', label:'Departed'      },
    arrival:    { icon:'MapPin',         color:'#059669', bg:'#ECFDF5', label:'Arrived'       },
    delivered:  { icon:'CheckCircle2',   color:'#059669', bg:'#ECFDF5', label:'Delivered'     },
    delayed:    { icon:'AlertTriangle',  color:'#DC2626', bg:'#FEF2F2', label:'Delayed'       },
    inspection: { icon:'Search',         color:'#D97706', bg:'#FFFBEB', label:'Inspection'    },
    approved:   { icon:'CheckCircle2',   color:'#059669', bg:'#ECFDF5', label:'Approved'      },
    assigned:   { icon:'User',           color:'#2563EB', bg:'#EFF6FF', label:'Assigned'      },
    maintenance:{ icon:'Wrench',         color:'#7C3AED', bg:'#F5F3FF', label:'Maintenance'   },
  }

  if (!events.length) {
    return (
      <div className="text-center py-10" style={{ color: 'var(--text3)' }}>
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No timeline events</p>
      </div>
    )
  }

  return (
    <div>
      {title && (
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text2)' }}>{title}</h3>
      )}
      <div className={compact ? 'space-y-0' : 'space-y-0'}>
        {events.map((ev, i) => (
          <TimelineNode
            key={ev.id}
            event={ev}
            isFirst={i === 0}
            isLast={i === events.length - 1}
            config={TIMELINE_EVENT_TYPES[ev.type]}
          />
        ))}
      </div>
    </div>
  )
}
