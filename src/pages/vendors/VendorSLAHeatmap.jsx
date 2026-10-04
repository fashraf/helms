// HELMS Vendor SLA Heatmap — performance grid across vendors and months
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid3x3, Filter, X, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, Building2, ChevronRight, ArrowRight,
  Plane, Truck, BarChart3,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import { LOCATION_MASTER } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }

// ─── Color a cell from on-time %  ─────────────────────────────────────────────
function cellColor(onTimePct, sample) {
  if (sample === 0) return { bg: 'var(--bg2)', text: 'var(--text3)', label: 'N/A' }
  if (onTimePct >= 90) return { bg: '#10B98115', text: '#059669',   label: 'Good',     ring: '#10B981' }
  if (onTimePct >= 75) return { bg: '#FBBF2422', text: '#92400E',   label: 'Warning',  ring: '#FBBF24' }
  return                       { bg: '#F8717122', text: '#B91C1C',   label: 'Critical', ring: '#F87171' }
}

// ─── Build metrics for a (vendor, month) bucket  ─────────────────────────────
function bucketMetrics(shipments) {
  if (shipments.length === 0) return { onTimePct: 0, delayedPct: 0, avgDays: 0, avgCustoms: 0, failed: 0, sample: 0 }
  let onTime = 0, delayed = 0, failed = 0, totalDays = 0, customsDays = 0
  shipments.forEach(s => {
    if (s.status === 'cancelled' || s.status === 'rejected') { failed++; return }
    if (!s.eta || !s.actualDeliveryDate) return
    const dDelay = Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000)
    if (dDelay <= 0) onTime++
    else delayed++
    const dTotal = Math.round((new Date(s.actualDeliveryDate) - new Date(s.createdAt ?? s.readyDate ?? s.shipmentDate)) / 86400000)
    totalDays += Math.max(0, dTotal)
    if (s._kind === 'international' && dDelay > 0) customsDays += dDelay
  })
  const sample = shipments.length
  return {
    onTimePct:  Math.round((onTime / Math.max(1, onTime + delayed)) * 100),
    delayedPct: Math.round((delayed / Math.max(1, onTime + delayed)) * 100),
    avgDays:    Math.round(totalDays / Math.max(1, onTime + delayed) * 10) / 10,
    avgCustoms: Math.round(customsDays / Math.max(1, sample) * 10) / 10,
    failed,
    sample,
    shipments,
  }
}

export default function VendorSLAHeatmap() {
  const navigate = useNavigate()
  const { intlShipments, localShipments } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()

  // Filters
  const [vendorFilter,  setVendor]  = useState('all')
  const [countryFilter, setCountry] = useState('all')
  const [typeFilter,    setType]    = useState('all')
  const [statusFilter,  setStatus]  = useState('completed')
  const [drillDown, setDrillDown] = useState(null)  // { vendorId, monthKey, metrics }

  // Combine + annotate
  const all = useMemo(() => [
    ...(intlShipments ?? []).map(s => ({ ...s, _kind: 'international' })),
    ...(localShipments ?? []).map(s => ({ ...s, _kind: 'local' })),
  ], [intlShipments, localShipments])

  const filtered = useMemo(() => all.filter(s => {
    if (vendorFilter !== 'all'  && (s.vendor ?? s.supplier) !== vendorFilter) return false
    if (typeFilter   !== 'all'  && s._kind !== typeFilter)                    return false
    if (countryFilter !== 'all') {
      const o = s._kind === 'international' ? (s.originCountry ?? s.origins?.[0]?.country ?? '') : 'SA'
      if (o !== countryFilter) return false
    }
    if (statusFilter === 'completed' && !['delivered','completed','closed'].includes(s.status)) return false
    if (statusFilter === 'failed'    && !['cancelled','rejected'].includes(s.status))           return false
    return true
  }), [all, vendorFilter, countryFilter, typeFilter, statusFilter])

  // Generate last 6 months (most recent on right)
  const months = useMemo(() => {
    const now = new Date()
    const arr = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push({
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`,
        label: d.toLocaleString('en-SA', { month:'short' }),
        year:  d.getFullYear(),
        month: d.getMonth(),
      })
    }
    return arr
  }, [])

  // Determine which vendors to row out
  const vendorRows = useMemo(() => {
    const ids = new Set(filtered.map(s => s.vendor ?? s.supplier).filter(Boolean))
    return (vendors ?? [])
      .filter(v => ids.has(v.id))
      .map(v => ({ id: v.id, name: v.name ?? v.id }))
  }, [vendors, filtered])

  // Build the matrix: { [vendorId]: { [monthKey]: metrics, _row: aggregate } }
  const matrix = useMemo(() => {
    const out = {}
    vendorRows.forEach(v => {
      out[v.id] = {}
      // Per-month bucket
      months.forEach(m => {
        const shipments = filtered.filter(s => {
          if ((s.vendor ?? s.supplier) !== v.id) return false
          const ref = s.actualDeliveryDate ?? s.eta ?? s.createdAt
          if (!ref) return false
          const d = new Date(ref)
          return d.getFullYear() === m.year && d.getMonth() === m.month
        })
        out[v.id][m.key] = bucketMetrics(shipments)
      })
      // Row aggregate
      const rowShipments = filtered.filter(s => (s.vendor ?? s.supplier) === v.id)
      out[v.id]._row = bucketMetrics(rowShipments)
    })
    return out
  }, [vendorRows, months, filtered])

  // Overall stats for the summary cards
  const overall = useMemo(() => bucketMetrics(filtered), [filtered])

  // Top performers / risks
  const ranked = useMemo(() => {
    return vendorRows
      .map(v => ({ ...v, ...matrix[v.id]._row }))
      .filter(r => r.sample > 0)
      .sort((a, b) => b.onTimePct - a.onTimePct)
  }, [vendorRows, matrix])

  // Country options derived from data
  const countryOpts = useMemo(() => {
    const set = new Set()
    all.forEach(s => {
      const c = s._kind === 'international' ? (s.originCountry ?? s.origins?.[0]?.country) : 'SA'
      if (c) set.add(c)
    })
    return [{ id:'all', label:'All Countries' }, ...Array.from(set).map(c => ({ id: c, label: c }))]
  }, [all])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Grid3x3 className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Vendor SLA Heatmap</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>
              {vendorRows.length} vendors × {months.length} months · {filtered.length} shipments analyzed
            </p>
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { l:'On-Time %',         v: `${overall.onTimePct}%`,    c:'var(--success)', icon: CheckCircle2 },
          { l:'Delayed %',         v: `${overall.delayedPct}%`,   c:'var(--warning)', icon: AlertTriangle },
          { l:'Avg Delivery Days', v: `${overall.avgDays}d`,      c:'var(--primary)', icon: Clock },
          { l:'Avg Customs Delay', v: `${overall.avgCustoms}d`,   c:'#8B5CF6',        icon: Plane },
          { l:'Failed Deliveries', v: overall.failed,             c:'var(--danger)',  icon: TrendingDown },
        ].map(({ l, v, c, icon: Icon }) => (
          <div key={l} className="rounded-xl border p-4" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${c}15`, color: c }}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="w-44">
          <Select2 size="sm" value={vendorFilter} onChange={v => setVendor(v ?? 'all')}
            options={[{ id:'all', label:'All Vendors' }, ...(vendors ?? []).map(v => ({ id: v.id, label: v.name ?? v.id }))]}
            placeholder="Vendor" />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={countryFilter} onChange={v => setCountry(v ?? 'all')} options={countryOpts} placeholder="Country" />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={typeFilter} onChange={v => setType(v ?? 'all')}
            options={[{ id:'all', label:'All Types' }, { id:'international', label:'International' }, { id:'local', label:'Local' }]} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatus(v ?? 'completed')}
            options={[
              { id:'completed', label:'Completed' },
              { id:'failed',    label:'Failed' },
              { id:'all',       label:'All' },
            ]} />
        </div>
        {(vendorFilter !== 'all' || countryFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'completed') && (
          <button onClick={() => { setVendor('all'); setCountry('all'); setType('all'); setStatus('completed') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Heatmap */}
        <div className="col-span-12 lg:col-span-9">
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>SLA Performance Heatmap</h3>
                <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>On-time % per vendor per month · click a cell to drill down</p>
              </div>
              <div className="flex items-center gap-3 text-[12.5px]" style={{ color:'var(--text3)' }}>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ background:'#10B98115', border:'1px solid #10B981' }} />Good ≥ 90%</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ background:'#FBBF2422', border:'1px solid #FBBF24' }} />Warning 75–89%</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ background:'#F8717122', border:'1px solid #F87171' }} />Critical &lt; 75%</span>
              </div>
            </div>
            {vendorRows.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No vendor activity in this window</p>
                <p className="text-[11px]" style={{ color:'var(--text3)' }}>Try a different filter combination.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                      <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest sticky left-0 z-10" style={{ color:'var(--text3)', background:'var(--bg2)', minWidth:200 }}>
                        Vendor
                      </th>
                      {months.map(m => (
                        <th key={m.key} className="text-center px-2 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)', minWidth:90 }}>
                          {m.label} <span style={{ color:'var(--text4)' }}>'{String(m.year).slice(2)}</span>
                        </th>
                      ))}
                      <th className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)', background:'var(--bg2)', minWidth:100 }}>
                        Overall
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorRows.map(v => {
                      const row = matrix[v.id]
                      const overall = row._row
                      const overallCol = cellColor(overall.onTimePct, overall.sample)
                      return (
                        <tr key={v.id} style={{ borderTop:'1px solid var(--border)' }}>
                          <td className="px-3 py-2 sticky left-0 z-10" style={{ background:'var(--card)', borderRight:'1px solid var(--border)' }}>
                            <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{v.name}</div>
                            <div className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>{v.id} · {overall.sample} shipment{overall.sample === 1 ? '' : 's'}</div>
                          </td>
                          {months.map(m => {
                            const cell = row[m.key]
                            const col  = cellColor(cell.onTimePct, cell.sample)
                            return (
                              <td key={m.key} className="p-1">
                                <button
                                  onClick={() => cell.sample > 0 && setDrillDown({ vendor: v, monthLabel: m.label + ' ' + m.year, metrics: cell })}
                                  className="w-full rounded-md py-2 px-1 transition-all"
                                  style={{ background: col.bg, border: cell.sample > 0 ? `1px solid ${col.ring}40` : '1px dashed var(--border)' }}
                                  title={cell.sample > 0 ? `${cell.onTimePct}% on-time · ${cell.sample} shipments` : 'No shipments'}>
                                  {cell.sample > 0 ? (
                                    <>
                                      <div className="text-sm font-mono font-bold" style={{ color: col.text }}>{cell.onTimePct}%</div>
                                      <div className="text-[9px]" style={{ color: col.text, opacity:.7 }}>{cell.sample}s · {cell.avgDays}d</div>
                                    </>
                                  ) : (
                                    <div className="text-[12.5px] py-1" style={{ color:'var(--text4)' }}>—</div>
                                  )}
                                </button>
                              </td>
                            )
                          })}
                          <td className="px-2 py-1" style={{ borderLeft:'1px solid var(--border)', background:'var(--bg2)' }}>
                            <div className="rounded-md py-2 text-center" style={{ background: overallCol.bg, border: overall.sample > 0 ? `1px solid ${overallCol.ring}40` : '1px dashed var(--border)' }}>
                              <div className="text-sm font-mono font-bold" style={{ color: overallCol.text }}>
                                {overall.sample > 0 ? `${overall.onTimePct}%` : '—'}
                              </div>
                              <div className="text-[9px]" style={{ color: overallCol.text, opacity:.7 }}>{overallCol.label}</div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: top performers + risks */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color:'var(--success)' }} /> Top Performers
              </h3>
            </div>
            {ranked.slice(0, 5).map(r => (
              <div key={r.id} className="px-3 py-2 flex items-center gap-2" style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="w-1.5 h-6 rounded-full" style={{ background: cellColor(r.onTimePct, r.sample).ring }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color:'var(--text)' }}>{r.name}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{r.sample} shipments</div>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: cellColor(r.onTimePct, r.sample).text }}>{r.onTimePct}%</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                <TrendingDown className="w-3.5 h-3.5" style={{ color:'var(--danger)' }} /> At-Risk Vendors
              </h3>
            </div>
            {ranked.slice(-5).reverse().map(r => (
              <div key={r.id} className="px-3 py-2 flex items-center gap-2" style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="w-1.5 h-6 rounded-full" style={{ background: cellColor(r.onTimePct, r.sample).ring }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color:'var(--text)' }}>{r.name}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{r.sample} shipments · {r.delayedPct}% delayed</div>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: cellColor(r.onTimePct, r.sample).text }}>{r.onTimePct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      <EnterpriseModal
        open={!!drillDown}
        onClose={() => setDrillDown(null)}
        title={drillDown ? `${drillDown.vendor.name} · ${drillDown.monthLabel}` : ''}
        subtitle={drillDown ? `${drillDown.metrics.sample} shipments · ${drillDown.metrics.onTimePct}% on-time` : ''}
        icon={<Grid3x3 className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="lg"
        footer={<ModalBtn onClick={() => setDrillDown(null)}>Close</ModalBtn>}>
        {drillDown && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { l:'On-Time',    v:`${drillDown.metrics.onTimePct}%`, c:'var(--success)' },
                { l:'Delayed',    v:`${drillDown.metrics.delayedPct}%`,c:'var(--warning)' },
                { l:'Avg Days',   v:`${drillDown.metrics.avgDays}d`,   c:'var(--primary)' },
                { l:'Failed',     v: drillDown.metrics.failed,         c:'var(--danger)' },
              ].map(({ l, v, c }) => (
                <div key={l} className="rounded-lg p-2.5 text-center" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
                  <div className="text-sm font-mono font-bold" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
              <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Shipments in this bucket</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor:'var(--border)' }}>
                {drillDown.metrics.shipments.map(s => {
                  const isIntl = s._kind === 'international'
                  const onTime = s.actualDeliveryDate && s.eta &&
                    new Date(s.actualDeliveryDate) <= new Date(s.eta)
                  const delay = (s.actualDeliveryDate && s.eta)
                    ? Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000)
                    : null
                  return (
                    <button key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                      className="w-full px-3 py-2 flex items-center gap-2 text-left transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      {isIntl ? <Plane className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--primary)' }} /> : <Truck className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--success)' }} />}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold truncate" style={{ color:'var(--primary)' }}>{s.id}</div>
                        <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>
                          {isIntl ? (s.originCountry ?? s.origins?.[0]?.country ?? '—') : locName(s.route?.origin?.locationId)}
                          <ArrowRight className="w-2.5 h-2.5 inline mx-0.5" />
                          {isIntl ? (s.destinations?.[0]?.country ?? '—') : locName(s.route?.stops?.[0]?.locationId)}
                        </div>
                      </div>
                      <span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: onTime ? 'rgba(5,150,105,.15)' : 'rgba(220,38,38,.15)', color: onTime ? 'var(--success)' : 'var(--danger)' }}>
                        {onTime ? 'On time' : `+${delay}d late`}
                      </span>
                      <ChevronRight className="w-3 h-3" style={{ color:'var(--text3)' }} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </EnterpriseModal>
    </div>
  )
}
