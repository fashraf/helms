// HELMS Logistics Module — packing/release workflow + KPI dashboard
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Truck, Plane, MapPin, Filter, X, Clock, CheckCircle2,
  AlertCircle, Activity, BarChart3, Timer, TrendingUp, ArrowRight,
  ChevronRight, Send, ClipboardCheck, Boxes,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import useToastStore      from '../../store/toastStore'
import Select2            from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  LOCATION_MASTER, OVERALL_STATUS_CFG, deriveOverallStatus, computeKPIs,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function fmtDateTime(iso) { if (!iso) return '—'; return new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
function fmtHours(h) {
  if (h === null || h === undefined) return '—'
  if (h < 24) return `${h}h`
  return `${Math.floor(h/24)}d ${h % 24}h`
}

export default function Logistics() {
  const navigate = useNavigate()
  const { localShipments, intlShipments, updateLocalShipment } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const toast = useToastStore()

  const [typeFilter, setType] = useState('all')
  const [statusFilter, setStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('orders')   // 'orders' | 'dashboard'
  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')    // all|today|yesterday|week|month
  const [actionModal, setActionModal] = useState(null)   // { kind:'pack'|'release', shipment }
  const [itemsModal,  setItemsModal]  = useState(null)   // a shipment (for item drill-down)
  const [draft, setDraft] = useState({ remarks:'' })

  // Combine + annotate with overall status
  const all = useMemo(() => {
    const annotate = (s, kind) => ({ ...s, _kind: kind, _overall: deriveOverallStatus({ ...s, _kind: kind }), _kpis: computeKPIs(s) })
    return [
      ...(localShipments ?? []).map(s => annotate(s, 'local')),
      ...(intlShipments  ?? []).map(s => annotate(s, 'international')),
    ]
  }, [localShipments, intlShipments])

  const filtered = useMemo(() => all.filter(s => {
    if (typeFilter !== 'all' && s._kind !== typeFilter) return false
    if (statusFilter !== 'all' && s._overall !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matchId = s.id?.toLowerCase().includes(q)
      const matchProj = (s.project ?? '').toLowerCase().includes(q)
      const matchPO = (s.poNumber ?? s.poNumbers?.join(' ') ?? '').toLowerCase().includes(q)
      const matchSO = (s.salesOrderNumber ?? '').toLowerCase().includes(q)
      if (!matchId && !matchProj && !matchPO && !matchSO) return false
    }
    if (timeFilter !== 'all') {
      const created = new Date(s.createdAt ?? s.shipmentDate ?? 0)
      const now = new Date()
      const sameDay = (a, b) => a.toDateString() === b.toDateString()
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
      const daysAgo = Math.floor((now - created) / 86400000)
      if (timeFilter === 'today'     && !sameDay(created, now))       return false
      if (timeFilter === 'yesterday' && !sameDay(created, yesterday)) return false
      if (timeFilter === 'week'      && daysAgo > 7)                  return false
      if (timeFilter === 'month'     && daysAgo > 30)                 return false
    }
    return true
  }), [all, typeFilter, statusFilter, search, timeFilter])

  // Group shipments by date bucket for the Orders tab
  const grouped = useMemo(() => {
    const buckets = { today: [], yesterday: [], thisWeek: [], earlier: [] }
    const now = new Date()
    const sameDay = (a, b) => a.toDateString() === b.toDateString()
    const yest = new Date(now); yest.setDate(now.getDate() - 1)
    filtered.forEach(s => {
      const d = new Date(s.createdAt ?? s.shipmentDate ?? 0)
      if (sameDay(d, now))            buckets.today.push(s)
      else if (sameDay(d, yest))      buckets.yesterday.push(s)
      else if ((now - d) / 86400000 <= 7) buckets.thisWeek.push(s)
      else                            buckets.earlier.push(s)
    })
    return buckets
  }, [filtered])

  // Warnings for Dashboard tab: today/tomorrow ETAs + delayed
  const warnings = useMemo(() => {
    const now = new Date()
    const today = new Date(now.toDateString())
    const tomorrow = new Date(today.getTime() + 86400000)
    const dayAfter = new Date(today.getTime() + 2 * 86400000)
    const dueToday = [], dueTomorrow = [], delayed = []
    filtered.forEach(s => {
      if (['delivered','closed','completed'].includes(s.status)) return
      if (!s.eta) return
      const eta = new Date(s.eta)
      if (eta < now)             delayed.push(s)
      else if (eta < tomorrow)   dueToday.push(s)
      else if (eta < dayAfter)   dueTomorrow.push(s)
    })
    return { dueToday, dueTomorrow, delayed }
  }, [filtered])

  // KPI aggregation
  const kpis = useMemo(() => {
    const withKpi = filtered.filter(s => s._kpis.totalProcessing !== null)
    const avg = (arr, k) => {
      const vals = arr.map(x => x._kpis[k]).filter(v => v !== null && v !== undefined)
      if (vals.length === 0) return null
      return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
    }
    const byVendor = new Map()
    withKpi.forEach(s => {
      const vId = s.supplier ?? s.vendor
      if (!vId) return
      if (!byVendor.has(vId)) byVendor.set(vId, [])
      byVendor.get(vId).push(s._kpis.totalProcessing)
    })
    const vendorAvg = Array.from(byVendor.entries())
      .map(([vId, arr]) => ({ vendorId: vId, name: vendors?.find(v => v.id === vId)?.name ?? vId, avg: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length), count: arr.length }))
      .sort((a, b) => a.avg - b.avg)
    const localAvg = avg(withKpi.filter(s => s._kind === 'local'), 'totalProcessing')
    const intlAvg  = avg(withKpi.filter(s => s._kind === 'international'), 'totalProcessing')
    return {
      createdToPacked:    avg(withKpi, 'createdToPacked'),
      packedToReleased:   avg(withKpi, 'packedToReleased'),
      releasedToDelivered:avg(withKpi, 'releasedToDelivered'),
      totalProcessing:    avg(withKpi, 'totalProcessing'),
      vendorAvg, localAvg, intlAvg,
      sampleSize: withKpi.length,
    }
  }, [filtered, vendors])

  // Status counts for dashboard
  const statusCounts = useMemo(() => {
    const counts = {}
    Object.keys(OVERALL_STATUS_CFG).forEach(k => counts[k] = 0)
    filtered.forEach(s => { if (counts[s._overall] !== undefined) counts[s._overall]++ })
    return counts
  }, [filtered])

  const openAction = (kind, shipment) => { setActionModal({ kind, shipment }); setDraft({ remarks:'' }) }
  const confirmAction = () => {
    if (!actionModal) return
    const s = actionModal.shipment
    if (s._kind !== 'local') { toast.warning('Local only', 'Pack/Release actions are wired for local shipments in this build.'); setActionModal(null); return }
    const now = new Date().toISOString()
    if (actionModal.kind === 'pack') {
      updateLocalShipment(s.id, {
        packedAt: now,
        packedBy: 'Khalid Salman',
        packingRemarks: draft.remarks || 'Marked packed via Logistics module',
        auditLog: [...(s.auditLog ?? []), { id:`AUD-${s.id}-${Date.now()}`, actor:'Khalid Salman', action:'Marked Packed', date: now, meta:{ remarks: draft.remarks } }],
      })
      toast.success('Marked packed', `${s.id} → Packed at ${fmtDateTime(now)}`)
    } else {
      updateLocalShipment(s.id, {
        releasedAt: now,
        releasedBy: 'Khalid Salman',
        releaseRemarks: draft.remarks || 'Released via Logistics module',
        auditLog: [...(s.auditLog ?? []), { id:`AUD-${s.id}-${Date.now()}`, actor:'Khalid Salman', action:'Released / Sent', date: now, meta:{ remarks: draft.remarks } }],
      })
      toast.success('Released', `${s.id} → Released/Sent at ${fmtDateTime(now)}`)
    }
    setActionModal(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
          <Boxes className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Logistics Module</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Shipment fulfillment visibility · packing & release · operational KPIs</p>
        </div>
      </div>

      {/* Tab strip */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex" style={{ borderBottom:'1px solid var(--border)' }}>
          {[
            { id:'orders',    label:'Orders',    icon: ClipboardCheck, sub:`${filtered.length} shipments` },
            { id:'dashboard', label:'Dashboard', icon: BarChart3,     sub:`${warnings.dueToday.length + warnings.dueTomorrow.length + warnings.delayed.length} alerts` },
          ].map(t => {
            const active = activeTab === t.id
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all relative"
                style={{
                  background: active ? 'var(--card)' : 'var(--bg2)',
                  color:      active ? 'var(--primary)' : 'var(--text2)',
                  borderRight: '1px solid var(--border)',
                }}>
                <t.icon className="w-4 h-4" />{t.label}
                <span className="text-[12.5px] font-normal opacity-70 ml-1">· {t.sub}</span>
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'var(--primary)' }} />}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'dashboard' && (<>
      {/* Warnings panel */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l:'Delayed',       arr: warnings.delayed,     c:'var(--danger)',  icon: AlertCircle, sub:'ETA already passed · not delivered' },
          { l:'Due Today',     arr: warnings.dueToday,    c:'var(--warning)', icon: Clock,       sub:'ETA today' },
          { l:'Due Tomorrow',  arr: warnings.dueTomorrow, c:'var(--primary)', icon: Clock,       sub:'ETA tomorrow' },
        ].map(({ l, arr, c, icon:Icon, sub }) => (
          <div key={l} className="rounded-xl border overflow-hidden" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="p-3 flex items-start gap-2.5">
              <Icon className="w-4 h-4 mt-0.5" style={{ color: c }} />
              <div className="flex-1">
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</div>
                <div className="text-2xl font-black font-mono" style={{ color: c }}>{arr.length}</div>
                <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{sub}</div>
              </div>
            </div>
            {arr.length > 0 && (
              <div className="px-3 pb-3 space-y-1">
                {arr.slice(0, 3).map(s => {
                  const isIntl = s._kind === 'international'
                  return (
                    <button key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                      className="w-full rounded border px-2 py-1 text-[12.5px] flex items-center gap-1.5 text-left" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                      {isIntl ? <Plane className="w-3 h-3" style={{ color:'var(--primary)' }} /> : <Truck className="w-3 h-3" style={{ color:'var(--success)' }} />}
                      <span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                      <span className="ml-auto" style={{ color:'var(--text3)' }}>ETA {fmtDateTime(s.eta)}</span>
                    </button>
                  )
                })}
                {arr.length > 3 && <div className="text-[12.5px] text-center pt-1" style={{ color:'var(--text3)' }}>+ {arr.length - 3} more</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* KPI dashboard */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Created → Packed',  v: fmtHours(kpis.createdToPacked),    c:'var(--cyan)',    icon: Package,        sub:'Avg prep time' },
          { l:'Packed → Released', v: fmtHours(kpis.packedToReleased),   c:'var(--primary)', icon: Send,           sub:'Avg dispatch lag' },
          { l:'Released → Delivered', v: fmtHours(kpis.releasedToDelivered), c:'var(--success)', icon: CheckCircle2,sub:'Avg transit time' },
          { l:'Total Processing',  v: fmtHours(kpis.totalProcessing),    c:'#8B5CF6',        icon: Timer,          sub:`${kpis.sampleSize} shipments` },
        ].map(({ l, v, c, icon: Icon, sub }) => (
          <div key={l} className="rounded-xl border p-3" style={{ ...C, borderLeft: `3px solid ${c}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: c }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
            </div>
            <div className="text-xl font-black font-mono" style={{ color: c }}>{v}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Status pipeline + avg by type */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-xl border p-4" style={C}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Status Pipeline</h3>
          <div className="flex items-stretch gap-1">
            {Object.entries(OVERALL_STATUS_CFG).map(([k, cfg], i, arr) => {
              const count = statusCounts[k] ?? 0
              const max = Math.max(...Object.values(statusCounts), 1)
              const pctHeight = (count / max) * 100
              return (
                <button key={k} onClick={() => setStatus(k)}
                  className="flex-1 rounded-lg p-2.5 transition-all hover:-translate-y-0.5"
                  style={{ background: statusFilter === k ? `${cfg.color}15` : 'var(--bg2)', border: `1px solid ${statusFilter === k ? cfg.color : 'var(--border)'}` }}>
                  <div className="text-center">
                    <div className="text-base">{cfg.icon}</div>
                    <div className="text-2xl font-black font-mono my-1" style={{ color: cfg.color }}>{count}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{cfg.label}</div>
                    <div className="h-1 mt-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                      <div className="h-full" style={{ width:`${pctHeight}%`, background: cfg.color }} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        <div className="col-span-4 rounded-xl border p-4" style={C}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>By Shipment Type</h3>
          <div className="space-y-2">
            <div className="rounded-lg p-2.5 flex items-center gap-2" style={{ background:'var(--bg2)' }}>
              <Truck className="w-4 h-4" style={{ color:'var(--success)' }} />
              <div className="flex-1">
                <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Local</div>
                <div className="text-sm font-mono font-bold" style={{ color:'var(--text)' }}>{fmtHours(kpis.localAvg)}</div>
              </div>
            </div>
            <div className="rounded-lg p-2.5 flex items-center gap-2" style={{ background:'var(--bg2)' }}>
              <Plane className="w-4 h-4" style={{ color:'var(--primary)' }} />
              <div className="flex-1">
                <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>International</div>
                <div className="text-sm font-mono font-bold" style={{ color:'var(--text)' }}>{fmtHours(kpis.intlAvg)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top vendor performance */}
      {kpis.vendorAvg.length > 0 && (
        <div className="rounded-xl border p-4" style={C}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Avg Processing Time by Vendor</h3>
          <div className="space-y-1.5">
            {kpis.vendorAvg.slice(0, 6).map(v => {
              const max = Math.max(...kpis.vendorAvg.map(x => x.avg))
              const pct = (v.avg / max) * 100
              return (
                <div key={v.vendorId} className="flex items-center gap-3 text-xs">
                  <span className="w-44 truncate font-bold" style={{ color:'var(--text)' }}>{v.name}</span>
                  <div className="flex-1 h-5 rounded relative overflow-hidden" style={{ background:'var(--bg2)' }}>
                    <div className="h-full transition-all" style={{ width:`${pct}%`, background: 'var(--primary)' }} />
                    <span className="absolute inset-0 flex items-center px-2 text-[12.5px] font-mono font-bold" style={{ color: pct > 30 ? '#fff' : 'var(--text)' }}>
                      {fmtHours(v.avg)} · {v.count} shipment{v.count === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      </>)}

      {activeTab === 'orders' && (<>
      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[220px]">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipment, project, PO, SO…"
            className="w-full rounded-lg pl-3 pr-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-36">
          <Select2 size="sm" value={timeFilter} onChange={v => setTimeFilter(v ?? 'all')}
            options={[
              { id:'all',       label:'All Time' },
              { id:'today',     label:'Today' },
              { id:'yesterday', label:'Yesterday' },
              { id:'week',      label:'This Week' },
              { id:'month',     label:'This Month' },
            ]} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={typeFilter} onChange={v => setType(v ?? 'all')}
            options={[{ id:'all', label:'All Types' }, { id:'local', label:'Local' }, { id:'international', label:'International' }]} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatus(v ?? 'all')}
            options={[
              { id:'all', label:'All Statuses' },
              ...Object.entries(OVERALL_STATUS_CFG).map(([k, cfg]) => ({ id: k, label: cfg.label })),
            ]} />
        </div>
        {(typeFilter !== 'all' || statusFilter !== 'all' || search || timeFilter !== 'all') && (
          <button onClick={() => { setType('all'); setStatus('all'); setSearch(''); setTimeFilter('all') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Date-grouped order cards */}
      <div className="space-y-3">
        {Object.entries({ today:'Today', yesterday:'Yesterday', thisWeek:'This Week', earlier:'Earlier' }).map(([k, label]) => {
          const bucket = grouped[k]
          if (bucket.length === 0) return null
          return (
            <div key={k} className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>{label}</h3>
                <span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:'var(--card)', color:'var(--primary)' }}>{bucket.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                {bucket.slice(0, 12).map(s => {
                  const isIntl = s._kind === 'international'
                  const cfg = OVERALL_STATUS_CFG[s._overall]
                  const itemCount = s._kind === 'local'
                    ? (s.checklist?.loaded?.items?.length ?? s.items?.length ?? 0)
                    : (s.items?.filter?.(it => it.active !== false)?.length ?? s.items?.length ?? 0)
                  return (
                    <div key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                      className="rounded-lg border p-2.5 cursor-pointer transition-all" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isIntl ? <Plane className="w-3 h-3" style={{ color:'var(--primary)' }} /> : <Truck className="w-3 h-3" style={{ color:'var(--success)' }} />}
                          <span className="font-mono text-[11px] font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                          <span>{cfg.icon}</span>{cfg.label}
                        </span>
                      </div>
                      <div className="text-[12.5px] truncate" style={{ color:'var(--text2)' }}>{s.project ?? '—'} · {s.shipmentType ?? '—'}</div>
                      <div className="flex items-center justify-between text-[12.5px] mt-1.5 pt-1.5" style={{ borderTop:'1px solid var(--border)', color:'var(--text3)' }}>
                        <span className="inline-flex items-center gap-0.5"><Package className="w-2.5 h-2.5" />{itemCount} items</span>
                        <span className="inline-flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{fmtDateTime(s.createdAt ?? s.shipmentDate)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {bucket.length > 12 && <div className="px-3 py-2 text-center text-[12.5px]" style={{ color:'var(--text3)', borderTop:'1px solid var(--border)' }}>+ {bucket.length - 12} more in this group</div>}
            </div>
          )
        })}
        {Object.values(grouped).every(b => b.length === 0) && (
          <div className="rounded-xl border py-12 text-center" style={C}>
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
            <p className="text-sm" style={{ color:'var(--text2)' }}>No shipments match your filters</p>
          </div>
        )}
      </div>

      </>)}

      {activeTab === '_legacy' && (<>
      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="w-40">
          <Select2 size="sm" value={typeFilter} onChange={v => setType(v ?? 'all')}
            options={[{ id:'all', label:'All Types' }, { id:'local', label:'Local' }, { id:'international', label:'International' }]} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatus(v ?? 'all')}
            options={[
              { id:'all', label:'All Statuses' },
              ...Object.entries(OVERALL_STATUS_CFG).map(([k, cfg]) => ({ id: k, label: cfg.label })),
            ]} />
        </div>
        {(typeFilter !== 'all' || statusFilter !== 'all') && (
          <button onClick={() => { setType('all'); setStatus('all') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Shipment list */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Shipment Fulfillment ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Shipment #','Type','Route','Items','Overall Status','Packing','Release','Total Time','Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No shipments match filters</td></tr>
              ) : filtered.slice(0, 50).map(s => {
                const isIntl = s._kind === 'international'
                const cfg = OVERALL_STATUS_CFG[s._overall]
                const itemCount = s._kind === 'local'
                  ? (s.checklist?.loaded?.items?.length ?? 0)
                  : (s.items?.filter?.(it => it.active !== false)?.length ?? s.items?.length ?? 0)
                const canPack    = s._kind === 'local' && !s.packedAt
                const canRelease = s._kind === 'local' && s.packedAt && !s.releasedAt
                return (
                  <tr key={s.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 cursor-pointer" onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}>
                      <span className="font-mono text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                    </td>
                    <td className="px-3 py-2">
                      {isIntl ? <Plane className="w-3.5 h-3.5 inline" style={{ color:'var(--primary)' }} /> : <Truck className="w-3.5 h-3.5 inline" style={{ color:'var(--success)' }} />}
                      <span className="ml-1 text-[12.5px] font-bold" style={{ color:'var(--text2)' }}>{isIntl ? 'Intl' : 'Local'}</span>
                    </td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text2)' }}>
                      {isIntl ? (s.originCountry ?? s.origins?.[0]?.country ?? '—') : (locName(s.route?.origin?.locationId) || locName(s.route?.origins?.[0]?.locationId))}
                      <ArrowRight className="w-2.5 h-2.5 inline mx-0.5" />
                      {isIntl ? (s.destinations?.[0]?.country ?? '—') : locName(s.route?.stops?.[s.route?.stops?.length - 1]?.locationId)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>{itemCount} items</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded-md" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                        <span>{cfg.icon}</span>{cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {s.packedAt ? (
                        <div>
                          <div className="text-[12.5px] font-mono" style={{ color:'var(--success)' }}>✓ {fmtDateTime(s.packedAt)}</div>
                          <div className="text-[9px]" style={{ color:'var(--text3)' }}>by {s.packedBy}</div>
                        </div>
                      ) : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {s.releasedAt ? (
                        <div>
                          <div className="text-[12.5px] font-mono" style={{ color:'var(--success)' }}>✓ {fmtDateTime(s.releasedAt)}</div>
                          <div className="text-[9px]" style={{ color:'var(--text3)' }}>by {s.releasedBy}</div>
                        </div>
                      ) : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[12.5px] font-mono font-bold" style={{ color:'var(--text)' }}>{fmtHours(s._kpis.totalProcessing)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/logistics/${s.id}`)} className="px-2 py-1 text-[12.5px] font-bold rounded-md text-white" style={{ background:'var(--primary)' }}>
                          <Boxes className="w-3 h-3 inline" /> Items
                        </button>
                        {canPack && (
                          <button onClick={() => openAction('pack', s)} className="px-2 py-1 text-[12.5px] font-bold rounded-md text-white" style={{ background:'var(--cyan)' }}>
                            <Package className="w-3 h-3 inline" /> Pack
                          </button>
                        )}
                        {canRelease && (
                          <button onClick={() => openAction('release', s)} className="px-2 py-1 text-[12.5px] font-bold rounded-md text-white" style={{ background:'var(--primary)' }}>
                            <Send className="w-3 h-3 inline" /> Release
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {/* Shipment Items View modal — per-item packing/release tracking */}
      <EnterpriseModal open={!!itemsModal} onClose={() => setItemsModal(null)}
        title="Shipment Items"
        subtitle={itemsModal ? `${itemsModal.id} · ${itemsModal._kind === 'international' ? 'International' : 'Local'}` : ''}
        icon={<Boxes className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="xl"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setItemsModal(null)}>Close</ModalBtn>
          {itemsModal && (
            <ModalBtn onClick={() => { navigate(`/shipments/${itemsModal._kind === 'international' ? 'intl' : 'local'}/${itemsModal.id}`); setItemsModal(null) }}>
              Open Shipment Profile →
            </ModalBtn>
          )}
        </>}>
        {itemsModal && (() => {
          const isIntl = itemsModal._kind === 'international'
          // Pull items from the right place
          const items = isIntl
            ? (itemsModal.items ?? []).filter(i => i.active !== false)
            : (itemsModal.checklist?.loaded?.items ?? [])
          const cargo = (itemsModal.cargo ?? []).filter(c => c.active !== false)
          const overallCfg = OVERALL_STATUS_CFG[deriveOverallStatus(itemsModal)]
          const packedCount   = items.filter(i => i.packed).length
          const releasedCount = items.filter(i => i.released).length
          const togglePackItem = (item) => {
            if (!itemsModal._kind || itemsModal._kind !== 'local') {
              toast.info('Local-only', 'Per-item toggle wired for local shipments in this build.')
              return
            }
            const updatedItems = items.map(it => it.id === item.id ? { ...it, packed: !it.packed, packedAt: !it.packed ? new Date().toISOString() : null } : it)
            updateLocalShipment(itemsModal.id, {
              checklist: { ...itemsModal.checklist, loaded: { ...itemsModal.checklist.loaded, items: updatedItems } },
            })
            setItemsModal({ ...itemsModal, checklist: { ...itemsModal.checklist, loaded: { ...itemsModal.checklist.loaded, items: updatedItems } } })
          }
          return (
            <div className="space-y-3">
              {/* Header summary */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Status</div>
                  <div className="text-xs font-bold inline-flex items-center gap-1" style={{ color: overallCfg.color }}>
                    <span>{overallCfg.icon}</span>{overallCfg.label}
                  </div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Items</div>
                  <div className="text-sm font-mono font-bold" style={{ color:'var(--text)' }}>{items.length} · {cargo.length} cargo</div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Packed</div>
                  <div className="text-sm font-mono font-bold" style={{ color: 'var(--cyan)' }}>{packedCount} / {items.length}</div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Released</div>
                  <div className="text-sm font-mono font-bold" style={{ color: 'var(--primary)' }}>{releasedCount} / {items.length}</div>
                </div>
              </div>

              {/* Cargo units (with dims) */}
              {cargo.length > 0 && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor:'var(--border)' }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                    <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Cargo Units ({cargo.length})</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead style={{ background:'var(--bg2)' }}>
                      <tr>
                        {['#','Name','Pkg Type','Qty','Weight','Dimensions','Packed','Released'].map(h => (
                          <th key={h} className="text-left px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cargo.map((c, i) => (
                        <tr key={c.id} style={{ borderTop:'1px solid var(--border)' }}>
                          <td className="px-3 py-1.5 font-mono font-bold" style={{ color:'var(--text3)' }}>{i + 1}</td>
                          <td className="px-3 py-1.5 font-bold" style={{ color:'var(--text)' }}>{c.name || `Cargo ${i + 1}`}</td>
                          <td className="px-3 py-1.5" style={{ color:'var(--text2)' }}>{c.packageType ?? 'Pallet'}</td>
                          <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{c.quantity ?? c.packages ?? 1}</td>
                          <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{c.weight ? `${c.weight} ${c.weightUnit ?? 'KG'}` : '—'}</td>
                          <td className="px-3 py-1.5 font-mono text-[12.5px]" style={{ color:'var(--text3)' }}>
                            {[c.length, c.width, c.height].filter(Boolean).join('×') || '—'}{c.unit ? ` ${c.unit}` : ''}
                          </td>
                          <td className="px-3 py-1.5">
                            {c.packed
                              ? <span className="inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color:'var(--cyan)' }}><CheckCircle2 className="w-3 h-3" />{fmtDateTime(c.packedAt)}</span>
                              : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                          </td>
                          <td className="px-3 py-1.5">
                            {c.released
                              ? <span className="inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color:'var(--primary)' }}><CheckCircle2 className="w-3 h-3" />{fmtDateTime(c.releasedAt)}</span>
                              : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Items with per-item packing tracking */}
              {items.length > 0 ? (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor:'var(--border)' }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                    <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Items ({items.length})</span>
                    {itemsModal._kind === 'local' && (
                      <span className="text-[9px]" style={{ color:'var(--text3)' }}>Click rows to toggle item packing status</span>
                    )}
                  </div>
                  <table className="w-full text-xs">
                    <thead style={{ background:'var(--bg2)' }}>
                      <tr>
                        {['#','Item','Quantity','HS Code','Packed','Released'].map(h => (
                          <th key={h} className="text-left px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={it.id ?? i} onClick={() => itemsModal._kind === 'local' && togglePackItem(it)}
                          className={itemsModal._kind === 'local' ? 'cursor-pointer transition-colors' : ''}
                          style={{ borderTop:'1px solid var(--border)' }}
                          onMouseEnter={e => itemsModal._kind === 'local' && (e.currentTarget.style.background = 'var(--bg2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td className="px-3 py-1.5 font-mono font-bold" style={{ color:'var(--text3)' }}>{i + 1}</td>
                          <td className="px-3 py-1.5 font-bold" style={{ color:'var(--text)' }}>{it.name ?? it.description ?? `Item ${i + 1}`}</td>
                          <td className="px-3 py-1.5 font-mono font-bold" style={{ color:'var(--text)' }}>{it.quantity ?? '—'} {it.unit ?? ''}</td>
                          <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{it.hsCode ?? '—'}</td>
                          <td className="px-3 py-1.5">
                            {it.packed
                              ? <span className="inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color:'var(--cyan)' }}><CheckCircle2 className="w-3 h-3" />{fmtDateTime(it.packedAt)}</span>
                              : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                          </td>
                          <td className="px-3 py-1.5">
                            {it.released
                              ? <span className="inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color:'var(--primary)' }}><CheckCircle2 className="w-3 h-3" />{fmtDateTime(it.releasedAt)}</span>
                              : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed py-6 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                  <Boxes className="w-6 h-6 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                  <p className="text-[11px]" style={{ color:'var(--text3)' }}>No items recorded yet · check the Cargo tab on the shipment profile</p>
                </div>
              )}
            </div>
          )
        })()}
      </EnterpriseModal>

      {/* Action modal (pack / release) */}
      <EnterpriseModal open={!!actionModal} onClose={() => setActionModal(null)}
        title={actionModal?.kind === 'pack' ? 'Mark as Packed' : 'Mark as Released / Sent'}
        subtitle={actionModal?.shipment?.id ?? ''}
        icon={actionModal?.kind === 'pack' ? <Package className="w-4 h-4" style={{ color:'var(--cyan)' }} /> : <Send className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setActionModal(null)}>Cancel</ModalBtn><ModalBtn onClick={confirmAction}>Confirm {actionModal?.kind === 'pack' ? 'Pack' : 'Release'}</ModalBtn></>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 text-[11px]" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text2)' }}>
            {actionModal?.kind === 'pack'
              ? <>This will record a <strong>Packed</strong> milestone with timestamp + your user · this enables KPI tracking for the Created → Packed leg.</>
              : <>This will record a <strong>Released / Sent</strong> milestone with timestamp + your user · this enables KPI tracking for the Packed → Released leg and starts the transit clock.</>}
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Remarks</label>
            <textarea value={draft.remarks} onChange={e => setDraft({ remarks: e.target.value })} rows={3} placeholder={actionModal?.kind === 'pack' ? 'How the cargo was packed, any special notes…' : 'Convoy info, escort, departure conditions…'}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
