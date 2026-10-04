// ═══════════════════════════════════════════════════════════════════════════
// VENDOR SLA — Performance dashboard (V2)
// Re-implemented on the V2 vendor store + per-shipment vendor evaluations.
// Pulls rolling SLA scores from the new Communication / On-time / Pricing
// evaluation widget, and surfaces per-vendor recommendations based on the
// aggregated data.
// ═══════════════════════════════════════════════════════════════════════════
import { useMemo } from 'react'
import { BarChart3, Brain, Zap, MessageSquare, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useVendorV2Store   from '../../store/vendorV2Store'
import useShipmentV2Store from '../../store/shipmentV2Store'
import { aggregateVendorSLA } from '../../components/shipment/VendorEvaluation'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function pct(n) { return n == null ? '—' : `${Math.round(n * 20)}%` }   // 1–5 → percent

function rankCfg(score) {
  if (score == null) return { c:'var(--text3)',   bg:'var(--bg2)',           label:'NO DATA'    }
  if (score >= 4.5)  return { c:'var(--success)', bg:'rgba(5,150,105,.10)',  label:'EXCELLENT'  }
  if (score >= 3.8)  return { c:'var(--primary)', bg:'var(--primary-light)', label:'GOOD'       }
  if (score >= 3.0)  return { c:'var(--warning)', bg:'rgba(217,119,6,.10)',  label:'AVERAGE'    }
  return                  { c:'var(--danger)',   bg:'rgba(220,38,38,.10)',  label:'NEEDS WORK' }
}

export default function VendorSLA() {
  const navigate = useNavigate()
  const vendors = useVendorV2Store(s => s.vendors)
  const allLocal = useShipmentV2Store(s => s.localShipments)
  const allIntl  = useShipmentV2Store(s => s.intlShipments)
  const allShipments = useMemo(() => [...allLocal, ...allIntl], [allLocal, allIntl])

  const rows = useMemo(() =>
    vendors
      .filter(v => v.status === 'active')
      .map(v => {
        const sla = aggregateVendorSLA(allShipments, v.id)
        return { vendor: v, sla }
      })
      .sort((a, b) => (b.sla.overall ?? 0) - (a.sla.overall ?? 0)),
    [vendors, allShipments])

  const activeCount = rows.length
  const withData = rows.filter(r => r.sla.count > 0)
  const avgOverall = withData.length > 0
    ? +(withData.reduce((a, r) => a + (r.sla.overall ?? 0), 0) / withData.length).toFixed(2)
    : null
  const highPerformers = rows.filter(r => (r.sla.overall ?? 0) >= 4.0).length

  const recommendations = withData.slice(0, 3)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
          <BarChart3 className="w-4 h-4" style={{ color:'var(--primary)' }} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Vendor Performance &amp; SLA</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>
            Rolling SLA derived from per-shipment evaluations · Communication / On-time / Pricing across {allShipments.length} shipments
          </p>
        </div>
        <button onClick={() => navigate('/vendors-v2')}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg border"
          style={{ ...C, color:'var(--text2)' }}>
          Browse Vendors →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Active Vendors"  value={activeCount}                                            color="var(--text)"    />
        <Kpi label="Evaluated"       value={`${withData.length} / ${activeCount}`}                  color="var(--primary)" />
        <Kpi label="Avg Overall ★"   value={avgOverall != null ? `${avgOverall}★ · ${pct(avgOverall)}` : '—'} color="var(--success)" />
        <Kpi label="High Performers" value={`${highPerformers}`}                                    color="var(--success)" />
      </div>

      {/* AI recommendations */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color:'#7C3AED' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>AI Recommendation Engine</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>top 3 by rolling SLA</span>
        </div>
        <div className="p-3">
          {recommendations.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color:'var(--text3)' }}>
              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No evaluations submitted yet. Close a shipment and complete the Vendor Evaluation on the Accounts tab to seed recommendations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {recommendations.map((r, i) => (
                <RecommendationCard key={r.vendor.id} rank={i + 1} vendor={r.vendor} sla={r.sla}
                  onClick={() => navigate(`/vendors-v2/${r.vendor.id}`)} />
              ))}
            </div>
          )}
          <div className="mt-3 rounded-lg px-3 py-2.5 border text-xs" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)', color:'var(--primary)' }}>
            <Zap className="w-3.5 h-3.5 inline mr-1.5" />
            Ranking is computed from submitted per-shipment evaluations (Communication / On-time / Pricing) plus contract status.
            High-performing contracted vendors are surfaced first for direct assignment.
          </div>
        </div>
      </div>

      {/* SLA Table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-4 py-3" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>SLA Performance Overview</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              {['Vendor','Contract','Communication','On-time','Pricing','Overall ★','Evaluations','Tier'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const v = r.vendor
              const sla = r.sla
              const cfg = rankCfg(sla.overall)
              return (
                <tr key={v.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/vendors-v2/${v.id}`)}
                  style={{
                    background: i % 2 === 0 ? 'var(--card)' : 'var(--bg2)',
                    borderTop: '1px solid var(--border)',
                  }}>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{v.name}</div>
                    <div className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{v.id} · {v.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    {v.contractType === 'contracted' ? (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#003399' }}>📜 Contracted</div>
                        <div className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{v.contractNumber ?? '—'}</div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Spot / Ad-hoc</span>
                    )}
                  </td>
                  <PillarCell value={sla.communication} color="#2563EB" />
                  <PillarCell value={sla.onTime}        color="#059669" />
                  <PillarCell value={sla.pricing}       color="#D97706" />
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-sm" style={{ color: cfg.c }}>
                      {sla.overall != null ? `${sla.overall.toFixed(2)}★` : '—'}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{pct(sla.overall)}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color:'var(--text2)' }}>{sla.count}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                      style={{ background: cfg.bg, color: cfg.c, border: `1px solid ${cfg.c}40` }}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-xs" style={{ color:'var(--text3)' }}>No active vendors</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ label, value, color }) {
  return (
    <div className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${color}` }}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{label}</div>
      <div className="font-mono font-black text-lg" style={{ color }}>{value}</div>
    </div>
  )
}

function PillarCell({ value, color }) {
  if (value == null) {
    return <td className="px-4 py-3 text-xs font-mono" style={{ color:'var(--text3)' }}>—</td>
  }
  return (
    <td className="px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg2)' }}>
          <div className="h-full" style={{ width: `${value * 20}%`, background: color }} />
        </div>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{value.toFixed(1)}★</span>
      </div>
    </td>
  )
}

function RecommendationCard({ rank, vendor, sla, onClick }) {
  const RANK_CFG = {
    1: { color:'#FFB300', label:'🥇 Top Pick',      bg:'rgba(255,179,0,.10)' },
    2: { color:'#94A3B8', label:'🥈 Alternative',   bg:'rgba(148,163,184,.10)' },
    3: { color:'#A16207', label:'🥉 Budget Option', bg:'rgba(161,98,7,.10)' },
  }[rank] ?? { color:'#94A3B8', label:'Other', bg:'var(--bg2)' }

  return (
    <button onClick={onClick} className="rounded-xl border overflow-hidden text-left transition-all hover:shadow-md"
      style={{ ...C, borderColor: RANK_CFG.color, background: RANK_CFG.bg }}>
      <div className="h-1" style={{ background: RANK_CFG.color }} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RANK_CFG.color }}>{RANK_CFG.label}</span>
          <span className="font-mono font-bold text-sm" style={{ color: RANK_CFG.color }}>{sla.overall.toFixed(2)}★</span>
        </div>
        <div className="text-sm font-bold mb-0.5" style={{ color:'var(--text)' }}>{vendor.name}</div>
        <div className="text-[10px] font-mono mb-2" style={{ color:'var(--text3)' }}>
          {vendor.type} · {sla.count} eval{sla.count === 1 ? '' : 's'}
          {vendor.contractType === 'contracted' && <span style={{ color:'#003399' }}> · 📜 contracted</span>}
        </div>
        <div className="space-y-1">
          <Bar icon={MessageSquare} label="Communication" value={sla.communication} color="#2563EB" />
          <Bar icon={Clock}         label="On-time"       value={sla.onTime}        color="#059669" />
          <Bar icon={DollarSign}    label="Pricing"       value={sla.pricing}       color="#D97706" />
        </div>
      </div>
    </button>
  )
}

function Bar({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="w-20 font-bold" style={{ color:'var(--text2)' }}>{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background:'var(--bg2)' }}>
        <div className="h-full" style={{ width: `${(value ?? 0) * 20}%`, background: color }} />
      </div>
      <span className="font-mono w-7 text-right" style={{ color }}>{value ? value.toFixed(1) : '—'}</span>
    </div>
  )
}
