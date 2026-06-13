// HELMS Shipment-First Dashboard — focus on shipment visibility, not generic widgets
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, Plane, AlertTriangle, Clock, CheckCircle2, Package,
  TrendingUp, MapPin, ArrowRight, Calendar, Users, Search,
  ShieldAlert, Inbox, ChevronRight, Zap, Flame, Wind, Activity,
  Send, ClipboardList,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useWorkflowV2Store from '../../store/workflowV2Store'
import useAuthStore       from '../../store/authStore'
import {
  SHIPMENT_STATUSES_INTL, SHIPMENT_STATUSES_LOCAL, LOCATION_MASTER,
} from '../../api/mock/shipmentV2Data'

const C  = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const TS = { background:'var(--bg2)', borderColor:'var(--border)' }

// ─── Utilities ───────────────────────────────────────────────────────────────
function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function daysBetween(a, b) {
  if (!a || !b) return null
  const d = Math.round((new Date(b) - new Date(a)) / 86400000)
  return d
}
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { month:'short', day:'numeric' }) }

// Synthesize milestone progression for a shipment from its status
const MILESTONES = ['Created', 'Picked Up', 'In Transit', 'Customs', 'Arrived', 'Delivered']
function deriveMilestones(s) {
  // Use createdAt as base; spread realistic gaps
  const base = new Date(s.createdAt ?? Date.now() - 14 * 86400000)
  const offsets = [0, 1, 3, 6, 8, 10]  // days from creation
  const stageIdx = (() => {
    const st = s.status ?? ''
    if (['draft','pending_approval'].includes(st))         return 0
    if (['assigned','pickup_scheduled'].includes(st))      return 1
    if (['in_progress','dispatched'].includes(st))         return 2
    if (['customs','customs_clearance','pending_customs'].includes(st)) return 3
    if (['arrived','at_destination'].includes(st))         return 4
    if (['delivered','completed','closed'].includes(st))   return 5
    return 2  // default to In Transit
  })()
  return MILESTONES.map((label, i) => ({
    label,
    date: new Date(base.getTime() + offsets[i] * 86400000),
    done: i <= stageIdx,
    current: i === stageIdx,
  }))
}

// ─── Top KPI Card ────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, icon: Icon, onClick, highlight }) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ ...C, borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, color }}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {highlight && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded animate-pulse" style={{ background: color, color:'#fff' }}>
            LIVE
          </span>
        )}
      </div>
      <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{label}</div>
      <div className="text-2xl font-black font-mono leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </button>
  )
}

// ─── Shipment Hover Tooltip (Cargo Type, Fragile, Hazardous, Vendor) ─────────
function ShipmentTooltip({ s, isIntl }) {
  const cargoCount = s.cargo?.length ?? 0
  const fragile    = s.cargo?.some(c => c.specialHandling?.toLowerCase().includes('fragile')) || /fragile/i.test(s.specialHandling ?? '')
  const hazardous  = s.cargo?.some(c => c.hazardous) || /hazard/i.test(s.specialHandling ?? '')
  const mode       = isIntl ? (s.mode?.toLowerCase().includes('air') ? 'Air Freight' : s.mode?.toLowerCase().includes('sea') ? 'Sea Freight' : (s.mode ?? 'Road')) : 'Road'
  return (
    <div className="absolute left-0 top-full mt-2 z-30 rounded-xl border p-3 w-72 animate-fade-in"
      style={{ ...C, boxShadow:'0 16px 48px rgba(15,23,42,.18)' }}>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor:'var(--border)' }}>
        {isIntl ? <Plane className="w-4 h-4" style={{ color:'var(--primary)' }} /> : <Truck className="w-4 h-4" style={{ color:'var(--success)' }} />}
        <span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>{mode}</span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-bold uppercase" style={{ color:'var(--text3)' }}>Cargo Type</span>
          <span style={{ color:'var(--text)' }}>{s.cargoType ?? (cargoCount ? `${cargoCount} item${cargoCount === 1 ? '' : 's'}` : '—')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-bold uppercase" style={{ color:'var(--text3)' }}>Vendor</span>
          <span style={{ color:'var(--text)' }}>{s.vendor ?? s.supplier ?? '—'}</span>
        </div>
        <div className="flex gap-1 flex-wrap pt-1">
          {fragile && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background:'rgba(217,119,6,.1)', color:'var(--warning)' }}><Wind className="w-2.5 h-2.5" />Fragile</span>}
          {hazardous && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background:'rgba(220,38,38,.1)', color:'var(--danger)' }}><Flame className="w-2.5 h-2.5" />Hazardous</span>}
          {mode === 'Air Freight' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background:'rgba(37,99,235,.1)', color:'var(--primary)' }}><Plane className="w-2.5 h-2.5" />Air</span>}
          {mode === 'Sea Freight' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background:'rgba(8,145,178,.1)', color:'var(--cyan)' }}><Activity className="w-2.5 h-2.5" />Sea</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Compact Shipment Timeline (with elapsed days per gap) ───────────────────
function ShipmentTimelineBar({ shipment }) {
  const milestones = deriveMilestones(shipment)
  return (
    <div className="rounded-xl border p-4" style={C}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color:'var(--primary)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Shipment Timeline</h3>
          <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{shipment.id}</span>
        </div>
        <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{shipment._kind === 'international' ? 'International' : 'Local'}</span>
      </div>
      <div className="flex items-stretch">
        {milestones.map((m, i) => {
          const next = milestones[i + 1]
          const gapDays = next ? daysBetween(m.date, next.date) : null
          return (
            <div key={m.label} className="flex-1 relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all relative z-10"
                  style={{
                    background: m.done ? 'var(--success)' : 'var(--bg2)',
                    color:      m.done ? '#fff' : 'var(--text3)',
                    border:     m.done ? '2px solid var(--success)' : '2px solid var(--border)',
                    boxShadow:  m.current ? '0 0 0 4px rgba(5,150,105,.18)' : 'none',
                  }}>
                  {m.done ? '✓' : i + 1}
                </div>
                <div className="text-[9px] font-bold mt-1" style={{ color: m.done ? 'var(--text)' : 'var(--text3)' }}>{m.label}</div>
                <div className="text-[8px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(m.date)}</div>
              </div>
              {next && (
                <div className="absolute top-3 left-1/2 w-full h-0.5"
                  style={{ background: m.done ? 'var(--success)' : 'var(--border)' }}>
                  {gapDays !== null && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                      style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                      {gapDays}d
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Priority Grid (delayed/at-risk shipments) ───────────────────────────────
function PriorityGrid({ rows, onOpen }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" style={{ color:'var(--danger)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Priority — Needs Attention</h3>
          <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(220,38,38,.1)', color:'var(--danger)' }}>{rows.length}</span>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--success)' }} />
          <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>All shipments are on schedule</p>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Nothing requires your immediate attention.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <tr>
                {['Shipment #','Origin','Destination(s)','ETA','Delay','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const isIntl = s._kind === 'international'
                const cfg = (isIntl ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[s.status] ?? { label: s.status, cls:'text-slate-500 bg-slate-50 border-slate-200' }
                const origin = isIntl ? (s.originCountry || locName(s.route?.origin?.locationId)) : locName(s.route?.origin?.locationId)
                const stops  = s.route?.stops?.map(x => locName(x.locationId)).filter(Boolean) ?? (s.destinations?.map(d => d.country).filter(Boolean) ?? [])
                const destStr = stops.length === 0 ? '—' : stops.length === 1 ? stops[0] : `${stops[0]} → +${stops.length - 1}`
                const delay  = s._delayDays
                return (
                  <tr key={s.id} onClick={() => onOpen(s)}
                    className="cursor-pointer relative" style={{ borderTop:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="px-4 py-2.5 relative group">
                      <div className="flex items-center gap-1.5">
                        {isIntl ? <Plane className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} /> : <Truck className="w-3.5 h-3.5" style={{ color:'var(--success)' }} />}
                        <span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                      </div>
                      <div className="hidden group-hover:block">
                        <ShipmentTooltip s={s} isIntl={isIntl} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color:'var(--text)' }}>{origin}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color:'var(--text)' }}>{destStr}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color:'var(--text2)' }}>{fmtDate(s.eta)}</td>
                    <td className="px-4 py-2.5">
                      {delay > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[12.5px] font-bold rounded-md animate-pulse"
                          style={{ background:'var(--danger)', color:'#fff' }}>
                          Exceeded ETA by {delay} Day{delay === 1 ? '' : 's'}
                        </span>
                      ) : delay < 0 ? (
                        <span className="text-[12.5px] font-bold" style={{ color:'var(--warning)' }}>Delayed by {Math.abs(delay)} Day{Math.abs(delay) === 1 ? '' : 's'}</span>
                      ) : (
                        <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>On time</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { intlShipments, localShipments } = useShipmentV2Store()
  const { requests } = useWorkflowV2Store()
  const { user } = useAuthStore()

  const [selectedId, setSelectedId] = useState(null)

  const allShipments = useMemo(() => [
    ...(intlShipments ?? []).map(s => ({ ...s, _kind: 'international' })),
    ...(localShipments ?? []).map(s => ({ ...s, _kind: 'local' })),
  ], [intlShipments, localShipments])

  // Annotate each shipment with delay days
  const annotated = useMemo(() => allShipments.map(s => {
    const eta = s.eta ?? s.actualDeliveryDate
    const today = new Date()
    const delay = eta ? Math.round((today - new Date(eta)) / 86400000) : null
    return { ...s, _delayDays: delay }
  }), [allShipments])

  // KPI buckets
  const today = new Date()
  const inDays = (iso, n) => {
    if (!iso) return false
    const d = Math.round((new Date(iso) - today) / 86400000)
    return d >= 0 && d <= n
  }
  const isToday = (iso) => iso && (new Date(iso)).toDateString() === today.toDateString()

  const kpi = {
    delayed:        annotated.filter(s => (s._delayDays ?? 0) > 0 && !['delivered','completed','closed','cancelled'].includes(s.status)),
    today:          annotated.filter(s => isToday(s.eta)),
    week:           annotated.filter(s => inDays(s.eta, 7)),
    inTransit:      annotated.filter(s => ['in_progress','dispatched','assigned'].includes(s.status)),
    customsHold:    annotated.filter(s => ['customs','customs_clearance','pending_customs','pending_modification'].includes(s.status)),
    completed:      annotated.filter(s => ['delivered','completed','closed'].includes(s.status)),
  }

  // ─── RFQ workflow counters ─────────────────────────────────────────────
  // Awaiting Reply: shipments where RFQs have been sent but not all vendors have responded
  // Pending Selection: shipments with replies received but no vendor selected yet
  const rfqKpi = useMemo(() => {
    const awaiting = []
    const pending = []
    annotated.forEach(s => {
      const rfq = s.rfq
      if (!rfq?.sentTo?.length) return
      const totalSent = rfq.sentTo.length
      const replyCount = rfq.replies?.length ?? 0
      const notReplied = rfq.sentTo.filter(v => !v.replied).length
      if (notReplied > 0)        awaiting.push({ ...s, _notReplied: notReplied, _totalSent: totalSent })
      if (replyCount > 0 && !rfq.selectedVendorId) pending.push({ ...s, _replyCount: replyCount })
    })
    return { awaiting, pending }
  }, [annotated])

  // Priority grid = delayed + customs hold (top 8)
  const priorityRows = [...kpi.delayed, ...kpi.customsHold]
    .filter((s, i, a) => a.findIndex(x => x.id === s.id) === i)
    .sort((a, b) => (b._delayDays ?? 0) - (a._delayDays ?? 0))
    .slice(0, 8)

  const featured = annotated.find(s => s.id === selectedId) ?? annotated.find(s => kpi.inTransit.includes(s)) ?? annotated[0]

  // Approval requests summary
  const myApprovals    = (requests ?? []).filter(r => ['pending','in_review'].includes(r.status))
  const completedApprovals = (requests ?? []).filter(r => ['approved','rejected','closed'].includes(r.status)).slice(0, 4)

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Welcome back, {user?.name?.split(' ')[0] ?? 'there'}</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>
            {annotated.length} active shipments · {kpi.delayed.length} need attention · {myApprovals.length} pending approvals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/tracking')} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Search className="w-3.5 h-3.5" /> Track Shipment
          </button>
          <button onClick={() => navigate('/shipments/local/create')} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Truck className="w-3.5 h-3.5" /> New Shipment
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-6 gap-3">
        <KPI label="Delayed"            value={kpi.delayed.length}      color="var(--danger)"  icon={AlertTriangle} sub="Past ETA"          onClick={() => navigate('/tracking')} highlight={kpi.delayed.length > 0} />
        <KPI label="Arriving Today"     value={kpi.today.length}        color="var(--warning)" icon={Clock}         sub="ETA today"         onClick={() => navigate('/shipment-calendar')} />
        <KPI label="Arriving This Week" value={kpi.week.length}         color="var(--primary)" icon={Calendar}      sub="Next 7 days"       onClick={() => navigate('/shipment-calendar')} />
        <KPI label="In Transit"         value={kpi.inTransit.length}    color="var(--cyan)"    icon={Truck}         sub="Active movement"   onClick={() => navigate('/tracking')} />
        <KPI label="Customs Hold"       value={kpi.customsHold.length}  color="#8B5CF6"        icon={Package}       sub="At border"         onClick={() => navigate('/tracking')} />
        <KPI label="Completed"          value={kpi.completed.length}    color="var(--success)" icon={CheckCircle2}  sub="Delivered total"   onClick={() => navigate('/tracking')} />
      </div>

      {/* RFQ Workflow Counters */}
      <div className="grid grid-cols-12 gap-3">
        <button onClick={() => navigate('/shipments/intl')}
          className="col-span-6 rounded-xl border p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
          style={{ ...C, borderLeft: `3px solid ${rfqKpi.awaiting.length > 0 ? '#D97706' : 'var(--border)'}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rfqKpi.awaiting.length > 0 ? 'rgba(217,119,6,.12)' : 'var(--bg2)' }}>
            <Send className="w-4 h-4" style={{ color: rfqKpi.awaiting.length > 0 ? '#D97706' : 'var(--text3)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>RFQs Awaiting Reply</span>
              <span className="text-xl font-black font-mono" style={{ color: rfqKpi.awaiting.length > 0 ? '#D97706' : 'var(--text2)' }}>{rfqKpi.awaiting.length}</span>
            </div>
            <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
              {rfqKpi.awaiting.length === 0
                ? 'All sent RFQs have replies'
                : `${rfqKpi.awaiting.reduce((s, x) => s + x._notReplied, 0)} vendor reply(s) outstanding across ${rfqKpi.awaiting.length} shipment(s)`}
            </div>
          </div>
          {rfqKpi.awaiting.slice(0, 3).map(s => (
            <span key={s.id} className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--primary)' }}>{s.id.split('-').slice(-1)[0]}</span>
          ))}
        </button>

        <button onClick={() => navigate('/shipments/intl')}
          className="col-span-6 rounded-xl border p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
          style={{ ...C, borderLeft: `3px solid ${rfqKpi.pending.length > 0 ? 'var(--primary)' : 'var(--border)'}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rfqKpi.pending.length > 0 ? 'var(--primary-light)' : 'var(--bg2)' }}>
            <ClipboardList className="w-4 h-4" style={{ color: rfqKpi.pending.length > 0 ? 'var(--primary)' : 'var(--text3)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Quotes Pending Selection</span>
              <span className="text-xl font-black font-mono" style={{ color: rfqKpi.pending.length > 0 ? 'var(--primary)' : 'var(--text2)' }}>{rfqKpi.pending.length}</span>
            </div>
            <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
              {rfqKpi.pending.length === 0
                ? 'No quote decisions pending'
                : `${rfqKpi.pending.reduce((s, x) => s + x._replyCount, 0)} quote(s) ready for vendor selection`}
            </div>
          </div>
          {rfqKpi.pending.slice(0, 3).map(s => (
            <span key={s.id} className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--primary)' }}>{s.id.split('-').slice(-1)[0]}</span>
          ))}
        </button>
      </div>

      {/* Priority grid + Timeline */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <PriorityGrid rows={priorityRows} onOpen={s => setSelectedId(s.id)} />
          {featured && <ShipmentTimelineBar shipment={featured} />}
        </div>

        {/* Right column: Approvals */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Pending approvals */}
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" style={{ color:'var(--warning)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Pending Approvals</h3>
                {myApprovals.length > 0 && <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.15)', color:'var(--warning)' }}>{myApprovals.length}</span>}
              </div>
              <button onClick={() => navigate('/workflows/requests')} className="text-[12.5px] font-bold flex items-center gap-0.5" style={{ color:'var(--primary)' }}>
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {myApprovals.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-1.5" style={{ color:'var(--success)' }} />
                  <p className="text-[11px]" style={{ color:'var(--text3)' }}>No pending approvals</p>
                </div>
              ) : myApprovals.slice(0, 5).map(r => (
                <button key={r.id} onClick={() => navigate('/workflows/requests')}
                  className="w-full px-3 py-2.5 flex items-start gap-2 text-left transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'rgba(217,119,6,.15)', color:'var(--warning)' }}>
                    <Inbox className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{r.title ?? r.id}</div>
                    <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>
                      {r.type ?? '—'} · {r.createdBy ?? 'Unknown'} · {fmtDate(r.createdAt)}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background:'rgba(217,119,6,.15)', color:'var(--warning)' }}>
                    {(r.priority ?? 'normal').toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent approvals */}
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Recently Decided</h3>
              </div>
              <button onClick={() => navigate('/workflows/requests')} className="text-[12.5px] font-bold flex items-center gap-0.5" style={{ color:'var(--primary)' }}>
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {completedApprovals.length === 0 ? (
                <div className="py-6 text-center text-[11px]" style={{ color:'var(--text3)' }}>No decisions in the recent history</div>
              ) : completedApprovals.map(r => (
                <div key={r.id} className="px-3 py-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: r.status === 'approved' ? 'rgba(5,150,105,.15)' : r.status === 'rejected' ? 'rgba(220,38,38,.15)' : 'var(--bg2)' }}>
                    {r.status === 'approved' ? <CheckCircle2 className="w-3 h-3" style={{ color:'var(--success)' }} /> :
                     r.status === 'rejected' ? <AlertTriangle className="w-3 h-3" style={{ color:'var(--danger)' }} /> :
                     <Clock className="w-3 h-3" style={{ color:'var(--text3)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate" style={{ color:'var(--text)' }}>{r.title ?? r.id}</div>
                    <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>{r.status?.toUpperCase()} · {fmtDate(r.updatedAt ?? r.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
