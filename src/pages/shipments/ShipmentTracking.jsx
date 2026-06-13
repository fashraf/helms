import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, Search, Plane, Truck, MapPin, Clock, CheckCircle2, AlertTriangle,
  Package, ArrowRight, LayoutGrid, List, Activity, Filter, X,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import Select2 from '../../components/ui/Select2'
import {
  SHIPMENT_STATUSES_INTL, SHIPMENT_STATUSES_LOCAL, LOCATION_MASTER,
  OVERALL_STATUS_CFG, deriveOverallStatus,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { month:'short', day:'numeric' }) }
function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? '—' }

export default function ShipmentTracking() {
  const navigate = useNavigate()
  const { intlShipments, localShipments } = useShipmentV2Store()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [viewMode, setViewMode] = useState('pipeline')   // 'cards' | 'list' | 'pipeline'

  const all = useMemo(() => [
    ...intlShipments.map(s => ({ ...s, _kind: 'international' })),
    ...localShipments.map(s => ({ ...s, _kind: 'local' })),
  ], [intlShipments, localShipments])

  const filtered = useMemo(() => {
    return all.filter(s => {
      if (typeFilter !== 'all' && s._kind !== typeFilter) return false
      if (statusFilter === 'active' && ['completed','closed','delivered','cancelled'].includes(s.status)) return false
      if (statusFilter === 'completed' && !['completed','closed','delivered'].includes(s.status)) return false
      if (search) {
        const q = search.toLowerCase()
        return s.id.toLowerCase().includes(q) ||
          (s.poNumber ?? '').toLowerCase().includes(q) ||
          (s.deliveryNoteNumber ?? '').toLowerCase().includes(q)
      }
      return true
    }).map(s => ({ ...s, _overall: deriveOverallStatus(s) }))
  }, [all, typeFilter, statusFilter, search])

  const stats = {
    total:     all.length,
    inTransit: all.filter(s => ['in_progress','dispatched','assigned'].includes(s.status)).length,
    delivered: all.filter(s => ['delivered','completed','closed'].includes(s.status)).length,
    delayed:   all.filter(s => s.status === 'pending_recheck' || s.status === 'pending_modification').length,
  }

  // Build pipeline buckets
  const pipelineBuckets = useMemo(() => {
    const out = {}
    Object.keys(OVERALL_STATUS_CFG).forEach(k => out[k] = [])
    filtered.forEach(s => { if (out[s._overall]) out[s._overall].push(s) })
    return out
  }, [filtered])

  const VIEWS = [
    { id:'cards',    label:'Cards',    icon: LayoutGrid },
    { id:'list',     label:'List',     icon: List },
    { id:'pipeline', label:'Pipeline', icon: Activity },
  ]

  const buildOriginDest = (s) => {
    const isIntl = s._kind === 'international'
    const origin = locName(s.route?.origin?.locationId) || locName(s.route?.origins?.[0]?.locationId) || (isIntl ? (s.originCity ?? s.originCountry ?? s.origins?.[0]?.country) : '—')
    const finalStop = s.route?.stops?.[s.route?.stops?.length - 1]
    const dest = finalStop ? locName(finalStop.locationId) : (isIntl ? (s.destinations?.[0]?.country ?? '—') : '—')
    return { origin, dest, isIntl }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Navigation className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Shipment Tracking</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{filtered.length} of {stats.total} shipments · live status</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg border" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          {VIEWS.map(v => {
            const active = viewMode === v.id
            return (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all"
                style={active
                  ? { background:'var(--card)', color:'var(--primary)', boxShadow:'var(--shadow)' }
                  : { background:'transparent', color:'var(--text3)' }}>
                <v.icon className="w-3.5 h-3.5" />{v.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total',       v:stats.total,     c:'var(--text)' },
          { l:'In Transit',  v:stats.inTransit, c:'var(--primary)' },
          { l:'Delivered',   v:stats.delivered, c:'var(--success)' },
          { l:'Needs Attention', v:stats.delayed, c:'var(--warning)' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search shipment #, PO, delivery note…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-40">
          <Select2 size="sm" placeholder="Type"
            options={[
              { id:'all', label:'All Types' },
              { id:'international', label:'International' },
              { id:'local', label:'Local' },
            ]}
            value={typeFilter} onChange={v => setTypeFilter(v ?? 'all')} />
        </div>
        <div className="w-44">
          <Select2 size="sm" placeholder="Status"
            options={[
              { id:'all',       label:'All Shipments' },
              { id:'active',    label:'Active Only' },
              { id:'completed', label:'Completed Only' },
            ]}
            value={statusFilter} onChange={v => setStatusFilter(v ?? 'active')} />
        </div>
        {(search || typeFilter !== 'all' || statusFilter !== 'active') && (
          <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('active') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* ─── CARDS VIEW ──────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="md:col-span-2 rounded-xl border p-12 text-center" style={C}>
              <Navigation className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
              <p className="text-sm" style={{ color:'var(--text3)' }}>No shipments match your filters</p>
            </div>
          ) : filtered.map(s => {
            const { origin, dest, isIntl } = buildOriginDest(s)
            const cfg = (isIntl ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[s.status] ?? { label: s.status, cls:'text-slate-500 bg-slate-50 border-slate-200' }
            const overCfg = OVERALL_STATUS_CFG[s._overall]
            return (
              <div key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                className="rounded-xl border p-4 cursor-pointer transition-all" style={C}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                      {isIntl ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{s.id}</div>
                      <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{isIntl ? 'International' : 'Local'} · {fmtDate(s.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md" style={{ background:`${overCfg.color}15`, color: overCfg.color }}>
                      <span>{overCfg.icon}</span>{overCfg.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2 my-2 border-t border-b" style={{ borderColor:'var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Origin</div>
                    <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{origin}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color:'var(--text3)' }} />
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Destination</div>
                    <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{dest}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12.5px]" style={{ color:'var(--text3)' }}>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(s.route?.stops?.length ?? 0)} stop{(s.route?.stops?.length ?? 0) === 1 ? '' : 's'}</span>
                  {s.eta && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />ETA {fmtDate(s.eta)}</span>}
                  {(s.cargo?.length > 0) && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.cargo.length} cargo</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── LIST VIEW ──────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={{ background:'var(--bg2)' }}>
                <tr>
                  {['Shipment #','Type','Origin','Destination','Status','Pipeline','ETA','Created'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center" style={{ color:'var(--text3)' }}>No shipments match your filters</td></tr>
                ) : filtered.map(s => {
                  const { origin, dest, isIntl } = buildOriginDest(s)
                  const cfg = (isIntl ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[s.status] ?? { label: s.status, cls:'text-slate-500 bg-slate-50 border-slate-200' }
                  const overCfg = OVERALL_STATUS_CFG[s._overall]
                  return (
                    <tr key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                      className="cursor-pointer" style={{ borderTop:'1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{s.id}</td>
                      <td className="px-3 py-2">
                        {isIntl ? <Plane className="w-3.5 h-3.5 inline" style={{ color:'var(--primary)' }} /> : <Truck className="w-3.5 h-3.5 inline" style={{ color:'var(--success)' }} />}
                        <span className="ml-1 text-[12.5px] font-bold" style={{ color:'var(--text2)' }}>{isIntl ? 'Intl' : 'Local'}</span>
                      </td>
                      <td className="px-3 py-2" style={{ color:'var(--text)' }}>{origin}</td>
                      <td className="px-3 py-2" style={{ color:'var(--text)' }}>{dest}</td>
                      <td className="px-3 py-2"><span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 ${cfg.cls}`}>{cfg.label}</span></td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md" style={{ background:`${overCfg.color}15`, color: overCfg.color }}>
                          <span>{overCfg.icon}</span>{overCfg.label}
                          <span className="ml-0.5 font-mono opacity-60">{overCfg.step}/6</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{fmtDate(s.eta)}</td>
                      <td className="px-3 py-2 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PIPELINE VIEW ────────────────────────────────────────── */}
      {viewMode === 'pipeline' && (
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 md:grid md:grid-cols-6 md:overflow-visible">
          {Object.entries(OVERALL_STATUS_CFG).map(([key, cfg]) => {
            const bucket = pipelineBuckets[key] ?? []
            return (
              <div key={key} className="rounded-xl border overflow-hidden snap-start flex-shrink-0 w-[78vw] md:w-auto" style={C}>
                <div className="px-2.5 py-2 border-b" style={{ background:`${cfg.color}10`, borderColor:'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-[12.5px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: cfg.color }}>
                      <span>{cfg.icon}</span>{cfg.label}
                    </div>
                    <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color: cfg.color }}>{bucket.length}</span>
                  </div>
                </div>
                <div className="p-2 space-y-1.5 max-h-[500px] overflow-y-auto">
                  {bucket.length === 0 ? (
                    <div className="text-center py-6 text-[12.5px]" style={{ color:'var(--text3)' }}>Empty</div>
                  ) : bucket.map(s => {
                    const { origin, dest, isIntl } = buildOriginDest(s)
                    return (
                      <div key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                        className="rounded-lg border p-2 cursor-pointer text-[12.5px] transition-all" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                          {isIntl ? <Plane className="w-3 h-3" style={{ color:'var(--primary)' }} /> : <Truck className="w-3 h-3" style={{ color:'var(--success)' }} />}
                        </div>
                        <div className="truncate" style={{ color:'var(--text2)' }}>{origin}</div>
                        <div className="flex items-center gap-0.5 text-[9px]" style={{ color:'var(--text3)' }}>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className="truncate">{dest}</span>
                        </div>
                        {s.eta && <div className="text-[9px] mt-1 font-mono" style={{ color:'var(--text3)' }}>ETA {fmtDate(s.eta)}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
