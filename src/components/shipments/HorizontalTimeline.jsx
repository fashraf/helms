import {
  CheckCircle2, Clock, Package, Truck, ShieldCheck, MapPin,
  PackageCheck, AlertTriangle, FileCheck2, Send,
} from 'lucide-react'

// Map event type → icon
const ICON = {
  created:     Package,
  submitted:   Send,
  in_progress: Truck,
  customs:     ShieldCheck,
  delivered:   PackageCheck,
  closed:      FileCheck2,
  pending:     Clock,
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })
}
function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' })
}

export default function HorizontalTimeline({ events }) {
  if (!events || events.length === 0) return null

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Shipment Timeline</h3>
        <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>
          {events.filter(e => e.completed).length} of {events.length} completed
        </span>
      </div>

      {/* Horizontally scrollable on small viewports */}
      <div className="overflow-x-auto">
        <div className="flex items-start gap-0 p-6 min-w-max">
          {events.map((e, i) => {
            const Icon  = ICON[e.type] ?? Clock
            const isLast = i === events.length - 1
            const color = e.completed
              ? (e.type === 'closed' || e.type === 'delivered' ? 'var(--success)' : 'var(--primary)')
              : 'var(--text3)'
            const bg = e.completed
              ? (e.type === 'closed' || e.type === 'delivered' ? 'rgba(5,150,105,.12)' : 'rgba(37,99,235,.12)')
              : 'var(--bg2)'

            return (
              <div key={e.id} className="flex items-start gap-0 flex-shrink-0">
                {/* Node */}
                <div className="flex flex-col items-center min-w-[170px] max-w-[200px] px-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: bg,
                      border: `2px solid ${color}`,
                      boxShadow: e.completed && !isLast ? `0 0 0 4px ${color}15` : 'none',
                    }}>
                    {e.completed
                      ? <CheckCircle2 className="w-5 h-5" style={{ color }} />
                      : <Icon className="w-5 h-5" style={{ color }} />
                    }
                  </div>
                  <div className="mt-3 text-center w-full">
                    <div className="text-xs font-bold leading-tight" style={{ color: e.completed ? 'var(--text)' : 'var(--text3)' }}>
                      {e.label}
                    </div>
                    {e.actor && (
                      <div className="text-[12.5px] mt-1 truncate" style={{ color: 'var(--text3)' }}>
                        {e.actor}
                      </div>
                    )}
                    {e.date && (
                      <div className="text-[12.5px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                        {fmtDate(e.date)} · {fmtTime(e.date)}
                      </div>
                    )}
                    {e.duration && (
                      <div className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>
                        <Clock className="w-2.5 h-2.5" /> {e.duration}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className="flex items-center pt-6 flex-shrink-0" style={{ minWidth: 60 }}>
                    <div className="h-0.5 w-full rounded-full"
                      style={{ background: events[i + 1].completed && e.completed ? color : 'var(--border)' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
