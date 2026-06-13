// HELMS Operational Reports — six operational reports + shipment timeline report,
// with drill-down, advanced filters, export, and saved views.
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, TrendingUp, TrendingDown, Activity, Clock, MapPin, Building2,
  AlertTriangle, Target, Plane, Truck, Filter, Download, Bookmark, BookmarkPlus,
  Search, X, ArrowRight, ChevronRight, ChevronDown, CheckCircle2, Globe,
  FileText, Eye, BarChart, ArrowDown, ArrowUp, Timer, Package, Send,
} from 'lucide-react'
import {
  BarChart as RBarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import { LOCATION_MASTER, SHIPMENT_STATUSES_INTL, SHIPMENT_STATUSES_LOCAL, OVERALL_STATUS_CFG, computeKPIs, deriveOverallStatus } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const SAVED_VIEWS_KEY = 'helms-saved-report-views'

const REPORTS = [
  { id:'shipment_performance', label:'Shipment Performance',    icon: BarChart3,    desc:'On-time vs delayed by month' },
  { id:'transit_analysis',     label:'Transit Analysis',        icon: Clock,        desc:'Transit duration distribution' },
  { id:'vendor_performance',   label:'Vendor Performance',      icon: Building2,    desc:'Avg delay per vendor' },
  { id:'country_performance',  label:'Country Performance',     icon: Globe,        desc:'Cross-border lane performance' },
  { id:'delivery_accuracy',    label:'Delivery Accuracy',       icon: Target,       desc:'On-time precision metrics' },
  { id:'delay_analysis',       label:'Delay Analysis',          icon: AlertTriangle,desc:'Root-cause delay breakdown' },
  { id:'operational_kpis',     label:'Operational KPIs',        icon: Timer,        desc:'Packing · release · processing time' },
  { id:'timeline_report',      label:'Shipment Timeline',       icon: Activity,     desc:'Per-shipment milestone analysis' },
]

const MILESTONES = ['Created','Picked Up','In Transit','Customs','Arrived','Delivered']
const SLA_DAYS_TARGET = 10  // generic baseline for SLA breach

function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { month:'short', day:'numeric', year:'2-digit' }) }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000) }
function downloadCsv(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Saved Views — localStorage helpers ──────────────────────────────────────
function loadViews() {
  try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) ?? '[]') }
  catch { return [] }
}
function saveViews(views) {
  try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)) } catch {}
}

// ─── Filter bar ──────────────────────────────────────────────────────────────
function FilterBar({ filters, setFilters, vendors, onSaveView, savedViews, onLoadView, onDeleteView }) {
  const countries = ['SA','AE','IN','KW','BH','OM','QA','EG','CN','DE']
  const [savePromptOpen, setSavePromptOpen] = useState(false)
  const [viewName, setViewName] = useState('')

  return (
    <div className="rounded-xl border" style={C}>
      <div className="flex items-center gap-2 p-3 flex-wrap" style={{ borderBottom:'1px solid var(--border)' }}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="w-40">
          <Select2 size="sm" value={filters.type} onChange={v => setFilters({ ...filters, type: v ?? 'all' })}
            options={[{ id:'all', label:'All Types' }, { id:'international', label:'International' }, { id:'local', label:'Local' }]} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={filters.vendor} onChange={v => setFilters({ ...filters, vendor: v ?? 'all' })}
            options={[{ id:'all', label:'All Vendors' }, ...(vendors ?? []).map(v => ({ id: v.id, label: v.name ?? v.id }))]} placeholder="Vendor" />
        </div>
        <div className="w-36">
          <Select2 size="sm" value={filters.country} onChange={v => setFilters({ ...filters, country: v ?? 'all' })}
            options={[{ id:'all', label:'All Countries' }, ...countries.map(c => ({ id: c, label: c }))]} placeholder="Country" />
        </div>
        <div className="w-36">
          <Select2 size="sm" value={filters.range} onChange={v => setFilters({ ...filters, range: v ?? '90d' })}
            options={[
              { id:'30d',  label:'Last 30 days' },
              { id:'90d',  label:'Last 90 days' },
              { id:'180d', label:'Last 6 months' },
              { id:'365d', label:'Last year' },
              { id:'all',  label:'All time' },
            ]} />
        </div>
        <div className="flex-1" />
        <button onClick={() => setSavePromptOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
          <BookmarkPlus className="w-3.5 h-3.5" /> Save View
        </button>
      </div>

      {/* Saved views row */}
      {savedViews.length > 0 && (
        <div className="px-3 py-2 flex items-center gap-1.5 flex-wrap" style={{ background:'var(--bg2)' }}>
          <Bookmark className="w-3 h-3" style={{ color:'var(--text3)' }} />
          <span className="text-[12.5px] font-bold uppercase tracking-widest mr-1" style={{ color:'var(--text3)' }}>Saved:</span>
          {savedViews.map(v => (
            <span key={v.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-[12.5px] font-semibold rounded-md border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
              <button onClick={() => onLoadView(v)} style={{ color:'var(--primary)' }}>{v.name}</button>
              <button onClick={() => onDeleteView(v.id)} className="opacity-50 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}

      <EnterpriseModal open={savePromptOpen} onClose={() => setSavePromptOpen(false)}
        title="Save Current View" subtitle="Persist the active filters" icon={<BookmarkPlus className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="sm"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setSavePromptOpen(false)}>Cancel</ModalBtn>
          <ModalBtn onClick={() => { if (viewName.trim()) { onSaveView(viewName.trim()); setViewName(''); setSavePromptOpen(false) } }}>Save</ModalBtn>
        </>}>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>View Name</label>
        <input value={viewName} onChange={e => setViewName(e.target.value)} placeholder="e.g. Q1 KSA Imports"
          className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
          style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </EnterpriseModal>
    </div>
  )
}

// ─── Report Header (with export) ─────────────────────────────────────────────
function ReportHeader({ report, onExport }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)' }}>
          <report.icon className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>{report.label}</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>{report.desc}</p>
        </div>
      </div>
      <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
        <Download className="w-3.5 h-3.5" /> Export CSV
      </button>
    </div>
  )
}

// ─── Drill-down Modal ────────────────────────────────────────────────────────
function DrillDownModal({ open, onClose, title, rows }) {
  const navigate = useNavigate()
  return (
    <EnterpriseModal open={open} onClose={onClose} title={title} subtitle={`${rows.length} shipments`} icon={<Eye className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="xl"
      footer={<ModalBtn onClick={onClose}>Close</ModalBtn>}>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <tr>
                {['Shipment #','Type','Route','Vendor','Created','Delivered','Delay','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const isIntl = s._kind === 'international'
                const delay = (s.eta && s.actualDeliveryDate) ? daysBetween(s.eta, s.actualDeliveryDate) : null
                const origin = isIntl ? (s.originCountry ?? '—') : locName(s.route?.origin?.locationId)
                const dest   = isIntl ? (s.destinations?.[0]?.country ?? '—') : locName(s.route?.stops?.[s.route?.stops?.length - 1]?.locationId)
                return (
                  <tr key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                    className="cursor-pointer" style={{ borderTop:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{s.id}</td>
                    <td className="px-3 py-2">{isIntl ? <Plane className="w-3 h-3 inline" style={{ color:'var(--primary)' }} /> : <Truck className="w-3 h-3 inline" style={{ color:'var(--success)' }} />} {isIntl ? 'Intl' : 'Local'}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text2)' }}>{origin} → {dest}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text2)' }}>{s.vendor ?? s.supplier ?? '—'}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.createdAt)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.actualDeliveryDate)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: delay > 0 ? 'var(--danger)' : delay < 0 ? 'var(--success)' : 'var(--text2)' }}>
                      {delay !== null ? `${delay > 0 ? '+' : ''}${delay}d` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>
                        {(s.status ?? '').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </EnterpriseModal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function Reports() {
  const navigate = useNavigate()
  const { intlShipments, localShipments } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()

  const [activeReport, setActiveReport] = useState('shipment_performance')
  const [filters, setFilters] = useState({ type:'all', vendor:'all', country:'all', range:'90d' })
  const [savedViews, setSavedViews] = useState(() => loadViews())
  const [drillDown, setDrillDown] = useState(null)
  const [timelineShipmentId, setTimelineShipmentId] = useState(null)

  // Combine + annotate
  const all = useMemo(() => [
    ...(intlShipments ?? []).map(s => ({ ...s, _kind: 'international' })),
    ...(localShipments ?? []).map(s => ({ ...s, _kind: 'local' })),
  ], [intlShipments, localShipments])

  // Apply filters
  const filtered = useMemo(() => {
    const cutoff = filters.range === 'all' ? null :
      new Date(Date.now() - Number(filters.range.replace('d','')) * 86400000)
    return all.filter(s => {
      if (filters.type !== 'all'   && s._kind !== filters.type) return false
      if (filters.vendor !== 'all' && (s.vendor ?? s.supplier) !== filters.vendor) return false
      if (filters.country !== 'all') {
        const o = s._kind === 'international' ? (s.originCountry ?? '') : 'SA'
        const dests = s._kind === 'international'
          ? (s.destinations ?? []).map(d => d.country ?? '')
          : (s.route?.stops ?? []).map(_ => 'SA')
        if (o !== filters.country && !dests.includes(filters.country)) return false
      }
      if (cutoff && s.createdAt && new Date(s.createdAt) < cutoff) return false
      return true
    })
  }, [all, filters])

  const completed = filtered.filter(s => ['delivered','completed','closed'].includes(s.status) && s.eta && s.actualDeliveryDate)

  const handleSaveView = (name) => {
    const view = { id: `view-${Date.now()}`, name, filters: { ...filters }, report: activeReport }
    const next = [...savedViews, view]
    setSavedViews(next); saveViews(next)
  }
  const handleLoadView = (v) => { setFilters(v.filters); setActiveReport(v.report) }
  const handleDeleteView = (id) => { const next = savedViews.filter(v => v.id !== id); setSavedViews(next); saveViews(next) }
  const report = REPORTS.find(r => r.id === activeReport)

  const handleExport = () => {
    const header = ['Shipment #','Type','Origin','Destination','Vendor','Created','ETA','Delivered','Delay (days)','Status']
    const rows = filtered.map(s => {
      const isIntl = s._kind === 'international'
      return [
        s.id,
        isIntl ? 'International' : 'Local',
        isIntl ? (s.originCountry ?? '') : locName(s.route?.origin?.locationId),
        isIntl ? (s.destinations?.[0]?.country ?? '') : locName(s.route?.stops?.[s.route?.stops?.length - 1]?.locationId),
        s.vendor ?? s.supplier ?? '',
        s.createdAt ?? '',
        s.eta ?? '',
        s.actualDeliveryDate ?? '',
        (s.eta && s.actualDeliveryDate) ? daysBetween(s.eta, s.actualDeliveryDate) : '',
        s.status,
      ]
    })
    downloadCsv(`helms-${activeReport}-${new Date().toISOString().slice(0,10)}.csv`, [header, ...rows])
  }

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters} setFilters={setFilters} vendors={vendors}
        savedViews={savedViews} onSaveView={handleSaveView} onLoadView={handleLoadView} onDeleteView={handleDeleteView}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Report sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Reports</h3>
            </div>
            <div className="p-1.5 space-y-0.5">
              {REPORTS.map(r => {
                const active = activeReport === r.id
                return (
                  <button key={r.id} onClick={() => setActiveReport(r.id)}
                    className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all"
                    style={active
                      ? { background:'var(--primary-light)', borderLeft:'3px solid var(--primary)' }
                      : { borderLeft:'3px solid transparent' }}
                    onMouseEnter={e => !active && (e.currentTarget.style.background = 'var(--bg2)')}
                    onMouseLeave={e => !active && (e.currentTarget.style.background = '')}>
                    <r.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: active ? 'var(--primary)' : 'var(--text3)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: active ? 'var(--primary)' : 'var(--text)' }}>{r.label}</div>
                      <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>{r.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Summary card under sidebar */}
          <div className="rounded-xl border p-3 mt-3" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text3)' }}>Current Filter</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Shipments</span><span className="font-mono font-bold" style={{ color:'var(--text)' }}>{filtered.length}</span></div>
              <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Completed</span><span className="font-mono font-bold" style={{ color:'var(--success)' }}>{completed.length}</span></div>
              <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Range</span><span className="font-mono" style={{ color:'var(--text2)' }}>{filters.range === 'all' ? 'All time' : `Last ${filters.range.replace('d','')}d`}</span></div>
            </div>
          </div>
        </div>

        {/* Report content */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          <ReportHeader report={report} onExport={handleExport} />

          {activeReport === 'shipment_performance' && <ShipmentPerformanceReport data={filtered} completed={completed} onDrill={setDrillDown} />}
          {activeReport === 'transit_analysis'     && <TransitAnalysisReport     completed={completed} onDrill={setDrillDown} />}
          {activeReport === 'vendor_performance'   && <VendorPerformanceReport   completed={completed} vendors={vendors} onDrill={setDrillDown} />}
          {activeReport === 'country_performance'  && <CountryPerformanceReport  completed={completed} onDrill={setDrillDown} />}
          {activeReport === 'delivery_accuracy'    && <DeliveryAccuracyReport    completed={completed} onDrill={setDrillDown} />}
          {activeReport === 'delay_analysis'       && <DelayAnalysisReport       completed={completed} onDrill={setDrillDown} />}
          {activeReport === 'operational_kpis'     && <OperationalKPIsReport     all={filtered} vendors={vendors} onDrill={setDrillDown} />}
          {activeReport === 'timeline_report'      && <TimelineReport            all={filtered} timelineShipmentId={timelineShipmentId} setTimelineShipmentId={setTimelineShipmentId} />}
        </div>
      </div>

      {/* Drill-down modal */}
      <DrillDownModal open={!!drillDown} onClose={() => setDrillDown(null)} title={drillDown?.title ?? 'Drill-down'} rows={drillDown?.rows ?? []} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 1 — Shipment Performance (on-time vs delayed)
// ═══════════════════════════════════════════════════════════════════════════
function ShipmentPerformanceReport({ data, completed, onDrill }) {
  const onTime = completed.filter(s => daysBetween(s.eta, s.actualDeliveryDate) <= 0)
  const delayed = completed.filter(s => daysBetween(s.eta, s.actualDeliveryDate) > 0)
  const onTimePct  = completed.length === 0 ? 0 : Math.round((onTime.length / completed.length) * 100)
  const delayedPct = 100 - onTimePct

  // Monthly trend
  const byMonth = new Map()
  completed.forEach(s => {
    const d = new Date(s.actualDeliveryDate)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth.has(k)) byMonth.set(k, { month: k, onTime: 0, delayed: 0 })
    const delay = daysBetween(s.eta, s.actualDeliveryDate)
    if (delay <= 0) byMonth.get(k).onTime++; else byMonth.get(k).delayed++
  })
  const monthly = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Shipments', v: data.length,       c:'var(--primary)' },
          { l:'Completed',       v: completed.length,  c:'var(--text)' },
          { l:'On-Time',         v: `${onTime.length} (${onTimePct}%)`, c:'var(--success)', click: () => onDrill({ title:'On-Time Shipments', rows: onTime }) },
          { l:'Delayed',         v: `${delayed.length} (${delayedPct}%)`,c:'var(--danger)',  click: () => onDrill({ title:'Delayed Shipments', rows: delayed }) },
        ].map(({ l, v, c, click }) => (
          <button key={l} onClick={click} disabled={!click}
            className="rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-default"
            style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-xl font-black font-mono" style={{ color: c }}>{v}</div>
            {click && <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>Click to drill down ↓</div>}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Monthly Performance</h4>
        <ResponsiveContainer width="100%" height={260}>
          <RBarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
            <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', fontSize: 11 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                const total = data.onTime + data.delayed
                const pct = total > 0 ? Math.round((data.onTime / total) * 100) : 0
                return (
                  <div className="rounded-lg border p-2.5" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'0 4px 12px rgba(0,0,0,.08)' }}>
                    <div className="text-xs font-bold mb-1.5" style={{ color:'var(--text)' }}>{label}</div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background:'var(--success)' }} /> On-Time: <strong className="ml-auto">{data.onTime}</strong></div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background:'var(--danger)' }} /> Delayed: <strong className="ml-auto">{data.delayed}</strong></div>
                      <div className="border-t pt-1 mt-1" style={{ borderColor:'var(--border)' }}>
                        <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>On-time rate: </span>
                        <strong style={{ color: pct >= 90 ? 'var(--success)' : pct >= 75 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</strong>
                      </div>
                    </div>
                  </div>
                )
              }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="onTime"  stackId="a" fill="var(--success)" name="On-Time" />
            <Bar dataKey="delayed" stackId="a" fill="var(--danger)"  name="Delayed" />
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 2 — Transit Analysis (duration distribution)
// ═══════════════════════════════════════════════════════════════════════════
function TransitAnalysisReport({ completed, onDrill }) {
  // Bucket transit durations
  const buckets = [
    { label:'0-3 days',   min:0,  max:3,  rows: [] },
    { label:'4-7 days',   min:4,  max:7,  rows: [] },
    { label:'8-14 days',  min:8,  max:14, rows: [] },
    { label:'15-30 days', min:15, max:30, rows: [] },
    { label:'30+ days',   min:31, max:Infinity, rows: [] },
  ]
  completed.forEach(s => {
    const dur = daysBetween(s.createdAt ?? s.readyDate ?? s.shipmentDate, s.actualDeliveryDate)
    const b = buckets.find(b => dur >= b.min && dur <= b.max)
    if (b) b.rows.push(s)
  })

  const avgDur = completed.length === 0 ? 0 :
    Math.round(completed.reduce((sum, s) => sum + daysBetween(s.createdAt ?? s.readyDate ?? s.shipmentDate, s.actualDeliveryDate), 0) / completed.length * 10) / 10

  // Avg transit by mode
  const byMode = new Map()
  completed.forEach(s => {
    const m = s.mode ?? (s._kind === 'local' ? 'land' : 'sea')
    if (!byMode.has(m)) byMode.set(m, { mode: m, days: [] })
    byMode.get(m).days.push(daysBetween(s.createdAt ?? s.readyDate ?? s.shipmentDate, s.actualDeliveryDate))
  })
  const modeData = Array.from(byMode.values()).map(m => ({
    mode: m.mode,
    avgDays: m.days.length > 0 ? Math.round(m.days.reduce((s, x) => s + x, 0) / m.days.length * 10) / 10 : 0,
    count: m.days.length,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid var(--primary)' }}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Avg Transit</div>
          <div className="text-xl font-black font-mono" style={{ color:'var(--primary)' }}>{avgDur} days</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid var(--success)' }}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Sample Size</div>
          <div className="text-xl font-black font-mono" style={{ color:'var(--success)' }}>{completed.length}</div>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Transit Duration Distribution</h4>
        <div className="space-y-2">
          {buckets.map(b => {
            const pct = completed.length > 0 ? (b.rows.length / completed.length) * 100 : 0
            return (
              <button key={b.label} onClick={() => b.rows.length > 0 && onDrill({ title:`Transit ${b.label}`, rows: b.rows })}
                disabled={b.rows.length === 0}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                style={{ background:'var(--bg2)' }}>
                <span className="text-xs font-bold w-20 flex-shrink-0" style={{ color:'var(--text)' }}>{b.label}</span>
                <div className="flex-1 h-6 rounded overflow-hidden relative" style={{ background:'var(--border)' }}>
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[12.5px] font-mono font-bold" style={{ color: pct > 30 ? '#fff' : 'var(--text)' }}>
                    {b.rows.length} shipments · {pct.toFixed(1)}%
                  </span>
                </div>
                {b.rows.length > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>By Transport Mode</h4>
        <ResponsiveContainer width="100%" height={200}>
          <RBarChart data={modeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mode" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
            <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', fontSize: 11 }} />
            <Bar dataKey="avgDays" fill="var(--cyan)" name="Avg Days" />
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 3 — Vendor Performance
// ═══════════════════════════════════════════════════════════════════════════
function VendorPerformanceReport({ completed, vendors, onDrill }) {
  const byVendor = new Map()
  completed.forEach(s => {
    const v = s.vendor ?? s.supplier
    if (!v) return
    if (!byVendor.has(v)) byVendor.set(v, { id: v, shipments: [], delays: [] })
    byVendor.get(v).shipments.push(s)
    byVendor.get(v).delays.push(daysBetween(s.eta, s.actualDeliveryDate))
  })
  const rows = Array.from(byVendor.values()).map(v => {
    const name = vendors?.find(x => x.id === v.id)?.name ?? v.id
    const avg  = v.delays.reduce((s, x) => s + x, 0) / v.delays.length
    const onTime = v.delays.filter(d => d <= 0).length
    return {
      ...v, name,
      avgDelay: Math.round(avg * 10) / 10,
      onTimePct: Math.round((onTime / v.delays.length) * 100),
    }
  }).sort((a, b) => a.avgDelay - b.avgDelay)

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Vendor Performance ({rows.length})</h4>
      </div>
      {rows.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No vendor data in this period</div>
      ) : (
        <table className="w-full text-xs">
          <thead style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <tr>
              {['Vendor','Shipments','On-Time %','Avg Delay','Rating'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(v => {
              const tier = v.onTimePct >= 90 ? { c:'var(--success)', label:'Excellent' }
                : v.onTimePct >= 75 ? { c:'var(--warning)', label:'Acceptable' }
                : { c:'var(--danger)', label:'Critical' }
              return (
                <tr key={v.id} onClick={() => onDrill({ title:`${v.name} Shipments`, rows: v.shipments })}
                  className="cursor-pointer" style={{ borderTop:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{v.name}</div>
                    <div className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>{v.id}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color:'var(--text2)' }}>{v.shipments.length}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                        <div className="h-full" style={{ width: `${v.onTimePct}%`, background: tier.c }} />
                      </div>
                      <span className="font-mono font-bold" style={{ color: tier.c }}>{v.onTimePct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: v.avgDelay > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {v.avgDelay > 0 ? '+' : ''}{v.avgDelay}d
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${tier.c}15`, color: tier.c }}>{tier.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 4 — Country Performance
// ═══════════════════════════════════════════════════════════════════════════
function CountryPerformanceReport({ completed, onDrill }) {
  const byLane = new Map()
  completed.forEach(s => {
    const isIntl = s._kind === 'international'
    const o = isIntl ? (s.originCountry ?? '—') : 'SA'
    const d = isIntl ? (s.destinations?.[0]?.country ?? '—') : 'SA'
    const key = `${o} → ${d}`
    if (!byLane.has(key)) byLane.set(key, { lane: key, shipments: [], delays: [] })
    byLane.get(key).shipments.push(s)
    byLane.get(key).delays.push(daysBetween(s.eta, s.actualDeliveryDate))
  })
  const rows = Array.from(byLane.values()).map(l => ({
    ...l,
    avgDelay: Math.round(l.delays.reduce((s, x) => s + x, 0) / l.delays.length * 10) / 10,
    onTime: l.delays.filter(d => d <= 0).length,
  })).sort((a, b) => b.shipments.length - a.shipments.length)

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Country Performance ({rows.length} lanes)</h4>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {rows.length === 0 ? (
          <div className="col-span-2 py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No lane data</div>
        ) : rows.slice(0, 12).map(l => {
          const pct = Math.round((l.onTime / l.shipments.length) * 100)
          const tier = pct >= 90 ? 'var(--success)' : pct >= 75 ? 'var(--warning)' : 'var(--danger)'
          return (
            <button key={l.lane} onClick={() => onDrill({ title: l.lane, rows: l.shipments })}
              className="rounded-lg border p-3 text-left transition-all" style={C}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tier }} />
                <span className="font-mono text-xs font-bold flex-1" style={{ color:'var(--text)' }}>{l.lane}</span>
                <span className="text-[12.5px] font-bold" style={{ color: tier }}>{pct}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[12.5px]">
                <div><span style={{ color:'var(--text3)' }}>Ships:</span> <strong style={{ color:'var(--text)' }}>{l.shipments.length}</strong></div>
                <div><span style={{ color:'var(--text3)' }}>Avg:</span> <strong style={{ color: l.avgDelay > 0 ? 'var(--danger)' : 'var(--success)' }}>{l.avgDelay > 0 ? '+' : ''}{l.avgDelay}d</strong></div>
                <div><span style={{ color:'var(--text3)' }}>On-time:</span> <strong style={{ color:'var(--text)' }}>{l.onTime}</strong></div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 5 — Delivery Accuracy
// ═══════════════════════════════════════════════════════════════════════════
function DeliveryAccuracyReport({ completed, onDrill }) {
  // Buckets: -3+/-3 days = perfect
  const perfect    = completed.filter(s => { const d = daysBetween(s.eta, s.actualDeliveryDate); return Math.abs(d) <= 1 })
  const early      = completed.filter(s => daysBetween(s.eta, s.actualDeliveryDate) < -1)
  const slightlyLate = completed.filter(s => { const d = daysBetween(s.eta, s.actualDeliveryDate); return d >= 1 && d <= 3 })
  const veryLate   = completed.filter(s => daysBetween(s.eta, s.actualDeliveryDate) > 3)

  const pieData = [
    { name: 'Perfect (±1d)',    value: perfect.length,      color:'var(--success)', rows: perfect },
    { name: 'Early',            value: early.length,        color:'var(--cyan)',    rows: early },
    { name: 'Slightly Late',    value: slightlyLate.length, color:'var(--warning)', rows: slightlyLate },
    { name: 'Very Late (3+d)',  value: veryLate.length,     color:'var(--danger)',  rows: veryLate },
  ]
  const total = completed.length || 1
  const accuracy = Math.round((perfect.length / total) * 100)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {pieData.map(p => (
          <button key={p.name} onClick={() => p.value > 0 && onDrill({ title: p.name, rows: p.rows })}
            className="rounded-xl border p-3 text-left transition-all" style={{ ...C, borderLeft:`3px solid ${p.color}` }}>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{p.name}</div>
            <div className="text-xl font-black font-mono" style={{ color: p.color }}>{p.value}</div>
            <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{Math.round((p.value / total) * 100)}%</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Accuracy Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={2}>
                {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border p-4 flex flex-col justify-center items-center" style={C}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Delivery Accuracy Score</div>
          <div className="text-5xl font-black font-mono mb-2" style={{ color: accuracy >= 90 ? 'var(--success)' : accuracy >= 75 ? 'var(--warning)' : 'var(--danger)' }}>{accuracy}%</div>
          <div className="text-[11px] text-center max-w-xs" style={{ color:'var(--text3)' }}>
            {accuracy >= 90 ? '🎯 Excellent — shipments arrive within 1 day of scheduled ETA' :
             accuracy >= 75 ? '📈 Acceptable — most shipments hit their window' :
             '⚠ Below target — review process and vendor selection'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 6 — Delay Analysis (root cause buckets)
// ═══════════════════════════════════════════════════════════════════════════
function DelayAnalysisReport({ completed, onDrill }) {
  const delayed = completed.filter(s => daysBetween(s.eta, s.actualDeliveryDate) > 0)
  // Heuristic cause assignment
  const causes = {
    customs:    delayed.filter(s => s._kind === 'international' && daysBetween(s.eta, s.actualDeliveryDate) > 2),
    vendor:     delayed.filter(s => ['VEN-1004','VEN-1006'].includes(s.vendor ?? s.supplier)),
    route:      delayed.filter(s => s._kind === 'international' && (s.originCountry === 'IN' || s.originCountry === 'OM')),
    weather:    delayed.filter(s => s._kind === 'local'),
  }
  Object.keys(causes).forEach(k => { causes[k] = Array.from(new Set(causes[k].map(s => s.id))).map(id => delayed.find(s => s.id === id)) })

  const causeData = [
    { cause:'Customs Hold',     count: causes.customs.length, rows: causes.customs,  color:'#8B5CF6' },
    { cause:'Vendor Delay',     count: causes.vendor.length,  rows: causes.vendor,   color:'var(--danger)' },
    { cause:'Route/Origin',     count: causes.route.length,   rows: causes.route,    color:'var(--warning)' },
    { cause:'Weather/Other',    count: causes.weather.length, rows: causes.weather,  color:'var(--cyan)' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid var(--danger)' }}>
        <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Delayed Shipments</div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-black font-mono" style={{ color:'var(--danger)' }}>{delayed.length}</div>
          <div className="text-[11px]" style={{ color:'var(--text3)' }}>{completed.length > 0 ? `${Math.round((delayed.length / completed.length) * 100)}% of completed shipments` : 'No data'}</div>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Delay Cause Analysis</h4>
        <div className="space-y-2">
          {causeData.map(c => {
            const pct = delayed.length > 0 ? (c.count / delayed.length) * 100 : 0
            return (
              <button key={c.cause} onClick={() => c.count > 0 && onDrill({ title:`${c.cause} Delays`, rows: c.rows })}
                disabled={c.count === 0}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left" style={{ background:'var(--bg2)' }}>
                <span className="text-xs font-bold w-36 flex-shrink-0" style={{ color:'var(--text)' }}>{c.cause}</span>
                <div className="flex-1 h-7 rounded overflow-hidden relative" style={{ background:'var(--border)' }}>
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[12.5px] font-mono font-bold" style={{ color: pct > 30 ? '#fff' : 'var(--text)' }}>
                    {c.count} ({pct.toFixed(1)}%)
                  </span>
                </div>
                {c.count > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 7 — Operational KPIs (packing, release, processing times)
// ═══════════════════════════════════════════════════════════════════════════
function OperationalKPIsReport({ all, vendors, onDrill }) {
  function fmtHours(h) {
    if (h === null || h === undefined) return '—'
    if (h < 24) return `${h}h`
    return `${Math.floor(h/24)}d ${h % 24}h`
  }

  // Compute KPIs per shipment
  const enriched = useMemo(() => all.map(s => ({ ...s, _kpis: computeKPIs(s), _overall: deriveOverallStatus(s) })), [all])
  const withProcessing = enriched.filter(s => s._kpis.totalProcessing !== null)

  const avg = (arr, k) => {
    const vals = arr.map(x => x._kpis[k]).filter(v => v !== null && v !== undefined)
    if (vals.length === 0) return null
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
  }

  // Averages
  const overallAvgs = {
    createdToPacked:     avg(withProcessing, 'createdToPacked'),
    packedToReleased:    avg(withProcessing, 'packedToReleased'),
    releasedToDelivered: avg(withProcessing, 'releasedToDelivered'),
    totalProcessing:     avg(withProcessing, 'totalProcessing'),
  }

  // By type
  const localShipments = withProcessing.filter(s => s._kind === 'local')
  const intlShipments  = withProcessing.filter(s => s._kind === 'international')
  const byType = [
    { label:'Local',         color:'var(--success)', icon: Truck, avg: avg(localShipments, 'totalProcessing'), count: localShipments.length, rows: localShipments },
    { label:'International', color:'var(--primary)', icon: Plane, avg: avg(intlShipments, 'totalProcessing'),  count: intlShipments.length,  rows: intlShipments  },
  ]

  // By vendor (top 10 by sample size)
  const byVendor = useMemo(() => {
    const map = new Map()
    withProcessing.forEach(s => {
      const vId = s.supplier ?? s.vendor
      if (!vId) return
      if (!map.has(vId)) map.set(vId, { vendorId: vId, name: vendors?.find(v => v.id === vId)?.name ?? vId, processing: [], packing: [], rows: [] })
      const r = map.get(vId)
      r.rows.push(s)
      r.processing.push(s._kpis.totalProcessing)
      if (s._kpis.createdToPacked !== null) r.packing.push(s._kpis.createdToPacked)
    })
    return Array.from(map.values())
      .map(v => ({
        ...v,
        avgProcessing: Math.round(v.processing.reduce((s, x) => s + x, 0) / v.processing.length),
        avgPacking:    v.packing.length > 0 ? Math.round(v.packing.reduce((s, x) => s + x, 0) / v.packing.length) : null,
        count: v.rows.length,
      }))
      .sort((a, b) => a.avgProcessing - b.avgProcessing)
      .slice(0, 10)
  }, [withProcessing, vendors])

  // Status dashboard counts
  const statusCounts = useMemo(() => {
    const c = {}
    Object.keys(OVERALL_STATUS_CFG).forEach(k => c[k] = [])
    enriched.forEach(s => { if (c[s._overall]) c[s._overall].push(s) })
    return c
  }, [enriched])

  return (
    <div className="space-y-4">
      {/* Top KPI tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Created → Packed',    v: overallAvgs.createdToPacked,    c:'var(--cyan)',    icon: Package,      sub:'Avg prep time' },
          { l:'Packed → Released',   v: overallAvgs.packedToReleased,   c:'var(--primary)', icon: Send,         sub:'Avg dispatch lag' },
          { l:'Released → Delivered',v: overallAvgs.releasedToDelivered,c:'var(--success)', icon: CheckCircle2, sub:'Avg transit' },
          { l:'Total Processing',    v: overallAvgs.totalProcessing,    c:'#8B5CF6',        icon: Timer,        sub:`${withProcessing.length} shipments` },
        ].map(({ l, v, c, icon:Icon, sub }) => (
          <div key={l} className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: c }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
            </div>
            <div className="text-xl font-black font-mono" style={{ color: c }}>{fmtHours(v)}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Status pipeline dashboard */}
      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Shipment Status Dashboard</h4>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(OVERALL_STATUS_CFG).map(([k, cfg]) => {
            const rows = statusCounts[k] ?? []
            const max = Math.max(...Object.values(statusCounts).map(v => v.length), 1)
            const heightPct = (rows.length / max) * 100
            return (
              <button key={k} onClick={() => rows.length > 0 && onDrill({ title:`${cfg.label} Shipments`, rows })}
                disabled={rows.length === 0}
                className="rounded-lg p-3 text-center transition-all"
                style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`, opacity: rows.length === 0 ? 0.5 : 1 }}>
                <div className="text-xl">{cfg.icon}</div>
                <div className="text-2xl font-black font-mono my-1" style={{ color: cfg.color }}>{rows.length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{cfg.label}</div>
                <div className="h-1 mt-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                  <div className="h-full" style={{ width:`${heightPct}%`, background: cfg.color }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* By Shipment Type */}
      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Average Processing Time by Shipment Type</h4>
        <div className="space-y-2">
          {byType.map(t => {
            const maxAvg = Math.max(...byType.map(x => x.avg ?? 0), 1)
            const pct = ((t.avg ?? 0) / maxAvg) * 100
            return (
              <button key={t.label} onClick={() => t.count > 0 && onDrill({ title:`${t.label} Shipments`, rows: t.rows })}
                disabled={t.count === 0}
                className="w-full flex items-center gap-3 text-left">
                <div className="w-32 flex items-center gap-2 flex-shrink-0">
                  <t.icon className="w-4 h-4" style={{ color: t.color }} />
                  <span className="text-xs font-bold" style={{ color:'var(--text)' }}>{t.label}</span>
                </div>
                <div className="flex-1 h-6 rounded overflow-hidden relative" style={{ background:'var(--bg2)' }}>
                  <div className="h-full transition-all" style={{ width:`${pct}%`, background: t.color }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[12.5px] font-mono font-bold" style={{ color: pct > 30 ? '#fff' : 'var(--text)' }}>
                    {fmtHours(t.avg)} · {t.count} shipment{t.count === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* By Vendor */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Average Processing Time by Vendor (Top {byVendor.length})</h4>
        </div>
        {byVendor.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No vendor processing data in this period</div>
        ) : (
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Rank','Vendor','Shipments','Avg Packing Time','Avg Total Processing','Performance'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byVendor.map((v, i) => {
                const maxAvg = Math.max(...byVendor.map(x => x.avgProcessing))
                const pct = (v.avgProcessing / maxAvg) * 100
                const tierColor = i === 0 ? 'var(--success)' : i < 3 ? 'var(--primary)' : pct > 75 ? 'var(--warning)' : 'var(--text2)'
                return (
                  <tr key={v.vendorId} onClick={() => onDrill({ title:`${v.name} · Processing`, rows: v.rows })}
                    className="cursor-pointer" style={{ borderTop:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="px-3 py-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white" style={{ background: tierColor }}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-bold" style={{ color:'var(--text)' }}>
                      {v.name}
                      <div className="text-[9px] font-mono font-normal" style={{ color:'var(--text3)' }}>{v.vendorId}</div>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text2)' }}>{v.count}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{fmtHours(v.avgPacking)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: tierColor }}>{fmtHours(v.avgProcessing)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: tierColor }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail breakdown table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Per-Shipment Processing Breakdown</h4>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background:'var(--bg2)' }}>
              <tr>
                {['Shipment #','Type','Status','C→P','P→R','R→D','Total','Created','Packed','Released'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.slice(0, 30).map(s => {
                const isIntl = s._kind === 'international'
                const cfg = OVERALL_STATUS_CFG[s._overall]
                return (
                  <tr key={s.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-1.5 font-mono font-bold" style={{ color:'var(--primary)' }}>{s.id}</td>
                    <td className="px-3 py-1.5">{isIntl ? <Plane className="w-3 h-3 inline" /> : <Truck className="w-3 h-3 inline" />} {isIntl ? 'Intl' : 'Local'}</td>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1 py-0.5 rounded" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                        <span>{cfg.icon}</span>{cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{fmtHours(s._kpis.createdToPacked)}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{fmtHours(s._kpis.packedToReleased)}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{fmtHours(s._kpis.releasedToDelivered)}</td>
                    <td className="px-3 py-1.5 font-mono font-bold" style={{ color:'var(--text)' }}>{fmtHours(s._kpis.totalProcessing)}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.createdAt)}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.packedAt)}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.releasedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT 8 — Shipment Timeline (per-shipment milestone analysis)
// ═══════════════════════════════════════════════════════════════════════════
function TimelineReport({ all, timelineShipmentId, setTimelineShipmentId }) {
  const navigate = useNavigate()
  const selected = all.find(s => s.id === timelineShipmentId)

  if (!selected) {
    return (
      <div className="rounded-xl border p-4 space-y-3" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Select a Shipment</h4>
        <p className="text-[11px]" style={{ color:'var(--text3)' }}>Pick a shipment to see every milestone, time spent at each stage, total duration, and SLA breach indicator.</p>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor:'var(--border)' }}>
          <div className="max-h-96 overflow-y-auto">
            {all.slice(0, 30).map(s => {
              const isIntl = s._kind === 'international'
              const total = (s.createdAt && s.actualDeliveryDate) ? daysBetween(s.createdAt, s.actualDeliveryDate) : null
              return (
                <button key={s.id} onClick={() => setTimelineShipmentId(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ borderTop:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  {isIntl ? <Plane className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--primary)' }} /> : <Truck className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--success)' }} />}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{s.id}</div>
                    <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
                      {isIntl ? (s.originCountry ?? '—') : locName(s.route?.origin?.locationId)} → {isIntl ? (s.destinations?.[0]?.country ?? '—') : locName(s.route?.stops?.[0]?.locationId)} · {fmtDate(s.createdAt)}
                    </div>
                  </div>
                  {total !== null && <span className="text-[11px] font-mono font-bold flex-shrink-0" style={{ color:'var(--text2)' }}>{total}d total</span>}
                  <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Build milestones
  const base = new Date(selected.createdAt ?? Date.now() - 14 * 86400000)
  const offsets = [0, 1, 3, 6, 8, 10]
  const stageIdx = (() => {
    const st = selected.status ?? ''
    if (['delivered','completed','closed'].includes(st)) return 5
    if (['customs','customs_clearance','pending_customs'].includes(st)) return 3
    if (['in_progress','dispatched'].includes(st)) return 2
    if (['assigned','pickup_scheduled'].includes(st)) return 1
    return 0
  })()
  const milestones = MILESTONES.map((label, i) => ({
    label,
    date: new Date(base.getTime() + offsets[i] * 86400000),
    done: i <= stageIdx,
  }))

  // Override last milestone with actual delivery if present
  if (selected.actualDeliveryDate && stageIdx === 5) {
    milestones[5].date = new Date(selected.actualDeliveryDate)
  }

  const totalDuration = milestones[5].done ? daysBetween(milestones[0].date, milestones[5].date) : daysBetween(milestones[0].date, new Date())
  const slaBreach = totalDuration > SLA_DAYS_TARGET

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setTimelineShipmentId(null)} className="text-[11px] font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}>
          ← Back to shipment list
        </button>
        <button onClick={() => navigate(`/shipments/${selected._kind === 'international' ? 'intl' : 'local'}/${selected.id}`)}
          className="text-[11px] font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}>
          Open shipment profile →
        </button>
      </div>

      <div className="rounded-xl border p-4 space-y-4" style={C}>
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor:'var(--border)' }}>
          <div className="flex items-center gap-2">
            {selected._kind === 'international' ? <Plane className="w-4 h-4" style={{ color:'var(--primary)' }} /> : <Truck className="w-4 h-4" style={{ color:'var(--success)' }} />}
            <span className="font-mono text-sm font-bold" style={{ color:'var(--primary)' }}>{selected.id}</span>
            <span className="text-xs" style={{ color:'var(--text3)' }}>· {selected._kind === 'international' ? 'International' : 'Local'}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span style={{ color:'var(--text2)' }}>Total: <strong className="font-mono" style={{ color:'var(--text)' }}>{totalDuration}d</strong></span>
            <span style={{ color:'var(--text2)' }}>SLA target: <strong className="font-mono" style={{ color:'var(--text)' }}>{SLA_DAYS_TARGET}d</strong></span>
            {slaBreach && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded animate-pulse" style={{ background:'var(--danger)', color:'#fff' }}>
                <AlertTriangle className="w-2.5 h-2.5" />SLA BREACH
              </span>
            )}
            {!slaBreach && milestones[5].done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded" style={{ background:'var(--success)', color:'#fff' }}>
                <CheckCircle2 className="w-2.5 h-2.5" />WITHIN SLA
              </span>
            )}
          </div>
        </div>

        {/* Timeline with gap labels */}
        <div className="flex items-stretch">
          {milestones.map((m, i) => {
            const next = milestones[i + 1]
            const gap = next ? daysBetween(m.date, next.date) : null
            return (
              <div key={m.label} className="flex-1 relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12.5px] font-bold relative z-10"
                    style={{
                      background: m.done ? 'var(--success)' : 'var(--bg2)',
                      color: m.done ? '#fff' : 'var(--text3)',
                      border: m.done ? '2px solid var(--success)' : '2px solid var(--border)',
                    }}>
                    {m.done ? '✓' : i + 1}
                  </div>
                  <div className="text-[12.5px] font-bold mt-1.5" style={{ color: m.done ? 'var(--text)' : 'var(--text3)' }}>{m.label}</div>
                  <div className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(m.date)}</div>
                </div>
                {next && (
                  <div className="absolute top-4 left-1/2 w-full h-0.5" style={{ background: m.done ? 'var(--success)' : 'var(--border)' }}>
                    {gap !== null && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[12.5px] font-mono font-bold px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                        {gap}d
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Stage breakdown table */}
        <div className="rounded-lg border overflow-hidden mt-4" style={{ borderColor:'var(--border)' }}>
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Milestone','Date','Time Spent','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, i) => {
                const next = milestones[i + 1]
                const gap = next ? daysBetween(m.date, next.date) : null
                return (
                  <tr key={m.label} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-bold" style={{ color:'var(--text)' }}>{m.label}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{fmtDate(m.date)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: gap > 3 ? 'var(--warning)' : 'var(--text2)' }}>{gap !== null ? `${gap}d` : '—'}</td>
                    <td className="px-3 py-2">
                      {m.done
                        ? <span className="inline-flex items-center gap-1 text-[9px] font-bold" style={{ color:'var(--success)' }}><CheckCircle2 className="w-3 h-3" />Completed</span>
                        : <span className="inline-flex items-center gap-1 text-[9px] font-bold" style={{ color:'var(--text3)' }}>Pending</span>}
                    </td>
                  </tr>
                )
              })}
              <tr style={{ background:'var(--bg2)', borderTop:'2px solid var(--border)' }}>
                <td className="px-3 py-2 font-black uppercase tracking-widest text-[12.5px]" style={{ color:'var(--text)' }}>Total Duration</td>
                <td colSpan={2} className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text)' }}>{totalDuration} days</td>
                <td className="px-3 py-2">
                  {slaBreach
                    ? <span className="text-[9px] font-bold" style={{ color:'var(--danger)' }}>BREACH (+{totalDuration - SLA_DAYS_TARGET}d over target)</span>
                    : <span className="text-[9px] font-bold" style={{ color:'var(--success)' }}>WITHIN TARGET ({SLA_DAYS_TARGET - totalDuration}d to spare)</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
