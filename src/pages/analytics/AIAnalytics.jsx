// HELMS Shipment Intelligence — AI-driven predictions from historical shipment data
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain, TrendingUp, AlertTriangle, Plane, Truck, MapPin, Clock,
  Activity, Sparkles, Building2, ShieldAlert, ArrowRight, Calendar,
  Target, Award, Zap,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts'
import useShipmentV2Store from '../../store/shipmentV2Store'
import { LOCATION_MASTER } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { month:'short', day:'numeric' }) }

// ─── AI Prediction Engine (rule-based, reads historical data) ────────────────
function predictDelay(target, historical) {
  // Find shipments with same origin → destination + same vendor
  const origin = target._kind === 'international' ? target.originCountry : target.route?.origin?.locationId
  const dest   = target._kind === 'international' ? target.destinations?.[0]?.country : target.route?.stops?.[0]?.locationId
  const vendor = target.vendor ?? target.supplier

  const sameRoute  = historical.filter(s => {
    if (s.id === target.id) return false
    const o = s._kind === 'international' ? s.originCountry : s.route?.origin?.locationId
    const d = s._kind === 'international' ? s.destinations?.[0]?.country : s.route?.stops?.[0]?.locationId
    return o === origin && d === dest
  })
  const sameVendor = historical.filter(s => s.id !== target.id && (s.vendor ?? s.supplier) === vendor)
  const sameBoth   = sameRoute.filter(s => (s.vendor ?? s.supplier) === vendor)

  // Calculate average delay across each cohort
  const delayOf = (s) => {
    if (!s.eta || !s.actualDeliveryDate) return null
    return Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000)
  }
  const cohortAvg = (cohort) => {
    const delays = cohort.map(delayOf).filter(d => d !== null)
    if (delays.length === 0) return null
    return delays.reduce((sum, x) => sum + x, 0) / delays.length
  }

  const avgSameRoute  = cohortAvg(sameRoute)
  const avgSameVendor = cohortAvg(sameVendor)
  const avgSameBoth   = cohortAvg(sameBoth)

  // Weighted prediction — same-route+same-vendor most informative
  const predictions = [
    { weight: 0.5, value: avgSameBoth,   label: 'same route + same vendor' },
    { weight: 0.3, value: avgSameRoute,  label: 'same route' },
    { weight: 0.2, value: avgSameVendor, label: 'same vendor' },
  ].filter(p => p.value !== null)

  if (predictions.length === 0) {
    return { delay: 0, confidence: 0, basis: 'No historical data', cohortSize: 0 }
  }
  const totalWeight = predictions.reduce((s, p) => s + p.weight, 0)
  const predicted   = predictions.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight
  const confidence  = Math.min(95, Math.round((sameBoth.length * 15 + sameRoute.length * 5 + sameVendor.length * 3)))
  const basis = sameBoth.length > 0 ? `${sameBoth.length} prior route+vendor shipments` :
                sameRoute.length > 0 ? `${sameRoute.length} prior shipments on this route` :
                `${sameVendor.length} prior shipments with this vendor`
  return { delay: Math.round(predicted * 10) / 10, confidence, basis, cohortSize: sameBoth.length + sameRoute.length + sameVendor.length }
}

function predictionRiskTier(predictedDelay) {
  const abs = Math.abs(predictedDelay)
  if (abs <= 0.5) return { tier: 'On-Time',   color:'var(--success)', cls:'bg-green-50 text-green-700 border-green-200' }
  if (abs <= 2)   return { tier: 'Slight',    color:'var(--primary)', cls:'bg-blue-50 text-blue-700 border-blue-200' }
  if (abs <= 4)   return { tier: 'Moderate',  color:'var(--warning)', cls:'bg-amber-50 text-amber-700 border-amber-200' }
  return            { tier: 'High Risk', color:'var(--danger)',  cls:'bg-red-50 text-red-700 border-red-200' }
}

// ─── Card components ─────────────────────────────────────────────────────────
function Card({ children, className='' }) {
  return <div className={`rounded-xl border p-4 ${className}`} style={C}>{children}</div>
}

function Section({ icon: Icon, title, sub, accent='var(--primary)', children, action }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, color: accent }}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>{title}</h3>
            {sub && <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AIAnalytics() {
  const navigate = useNavigate()
  const { intlShipments, localShipments } = useShipmentV2Store()

  const all = useMemo(() => [
    ...(intlShipments ?? []).map(s => ({ ...s, _kind: 'international' })),
    ...(localShipments ?? []).map(s => ({ ...s, _kind: 'local' })),
  ], [intlShipments, localShipments])

  const historical = all.filter(s => ['delivered','completed','closed'].includes(s.status))
  const active     = all.filter(s => !['delivered','completed','closed','cancelled','draft'].includes(s.status))

  // Run prediction for each active shipment
  const predictions = useMemo(() => active.map(s => ({
    shipment: s,
    prediction: predictDelay(s, historical),
  })).sort((a, b) => Math.abs(b.prediction.delay) - Math.abs(a.prediction.delay)), [active, historical])

  // Vendor risk scoring — average delay per vendor
  const vendorRisk = useMemo(() => {
    const map = new Map()
    historical.forEach(s => {
      const v = s.vendor ?? s.supplier
      if (!v || !s.eta || !s.actualDeliveryDate) return
      const delay = Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000)
      if (!map.has(v)) map.set(v, { vendor: v, delays: [], total: 0 })
      const entry = map.get(v)
      entry.delays.push(delay)
      entry.total++
    })
    return Array.from(map.values())
      .map(e => ({ ...e, avgDelay: e.delays.reduce((s, x) => s + x, 0) / e.delays.length }))
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 8)
  }, [historical])

  // Route performance — historical avg delay per origin→dest pair
  const routePerformance = useMemo(() => {
    const map = new Map()
    historical.forEach(s => {
      const o = s._kind === 'international' ? s.originCountry : locName(s.route?.origin?.locationId)
      const d = s._kind === 'international' ? s.destinations?.[0]?.country : locName(s.route?.stops?.[0]?.locationId)
      if (!o || !d || !s.eta || !s.actualDeliveryDate) return
      const key = `${o} → ${d}`
      const delay = Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000)
      if (!map.has(key)) map.set(key, { route: key, delays: [], total: 0 })
      const e = map.get(key)
      e.delays.push(delay)
      e.total++
    })
    return Array.from(map.values())
      .map(e => ({ ...e, avgDelay: e.delays.reduce((s, x) => s + x, 0) / e.delays.length }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [historical])

  // Trend analysis — completed shipments per week, avg delay per week
  const trendData = useMemo(() => {
    const weeks = new Map()
    historical.forEach(s => {
      if (!s.actualDeliveryDate) return
      const d = new Date(s.actualDeliveryDate)
      const w = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
      if (!weeks.has(w)) weeks.set(w, { week: w, count: 0, delays: [] })
      const e = weeks.get(w)
      e.count++
      if (s.eta) e.delays.push(Math.round((d - new Date(s.eta)) / 86400000))
    })
    return Array.from(weeks.values()).slice(-8).map(w => ({
      week: w.week,
      delivered: w.count,
      avgDelay: w.delays.length > 0 ? Math.round(w.delays.reduce((s, x) => s + x, 0) / w.delays.length * 10) / 10 : 0,
    }))
  }, [historical])

  // Customs delay prediction (international shipments only)
  const customsDelays = useMemo(() => {
    const ksaIntl = historical.filter(s => s._kind === 'international' && s.eta && s.actualDeliveryDate)
    if (ksaIntl.length === 0) return { avg: 0, max: 0, sample: 0 }
    const delays = ksaIntl.map(s => Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000))
    return { avg: Math.round(delays.reduce((s, x) => s + x, 0) / delays.length * 10) / 10, max: Math.max(...delays), sample: delays.length }
  }, [historical])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
              AI Shipment Intelligence
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(129,140,248,.15)', color:'#6366F1' }}>PREDICTIVE</span>
            </h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>
              Reads {historical.length} prior shipments to predict ETA risk on {active.length} active shipments. Same route, same vendor → same outcome.
            </p>
          </div>
        </div>
      </div>

      {/* AI Predictions Top Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Active Predictions', v: predictions.length,                                                 c:'var(--primary)', icon: Target },
          { l:'High-Risk Now',      v: predictions.filter(p => Math.abs(p.prediction.delay) > 4).length,   c:'var(--danger)',  icon: ShieldAlert },
          { l:'Avg Customs Delay',  v: `${customsDelays.avg}d`,                                            c:'var(--warning)', icon: Building2 },
          { l:'Vendors Analyzed',   v: vendorRisk.length,                                                  c:'var(--success)', icon: Award },
        ].map(({ l, v, c, icon: Icon }) => (
          <div key={l} className="rounded-xl border p-4" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${c}15`, color: c }}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Two-column: Predictions list + Vendor Risk */}
      <div className="grid grid-cols-12 gap-4">
        {/* Active Predictions */}
        <div className="col-span-12 lg:col-span-7">
          <Section icon={Sparkles} title="Delay Prediction — Active Shipments" sub="Predicted vs scheduled ETA, based on similar past shipments" accent="#6366F1">
            {predictions.length === 0 ? (
              <div className="py-10 text-center">
                <Brain className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No active shipments to analyze</p>
                <p className="text-[11px]" style={{ color:'var(--text3)' }}>Create some shipments to see AI predictions.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {predictions.slice(0, 12).map(({ shipment: s, prediction: p }) => {
                  const tier = predictionRiskTier(p.delay)
                  const isIntl = s._kind === 'international'
                  return (
                    <div key={s.id} onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${s.id}`)}
                      className="rounded-lg border p-3 cursor-pointer transition-all" style={{ background:'var(--card)', borderColor:'var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {isIntl ? <Plane className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} /> : <Truck className="w-3.5 h-3.5" style={{ color:'var(--success)' }} />}
                        <span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${tier.cls}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{tier.tier}
                        </span>
                        <span className="text-[12.5px] ml-auto" style={{ color:'var(--text3)' }}>Vendor: {s.vendor ?? s.supplier ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color:'var(--text2)' }}>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{isIntl ? `${s.originCountry ?? '—'} → ${s.destinations?.[0]?.country ?? '—'}` : `${locName(s.route?.origin?.locationId)} → ${locName(s.route?.stops?.[0]?.locationId)}`}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Scheduled {fmtDate(s.eta)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between rounded-md px-2 py-1.5" style={{ background:'var(--bg2)' }}>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" style={{ color: tier.color }} />
                          <span className="text-[12.5px] font-bold" style={{ color:'var(--text2)' }}>
                            Predicted {p.delay > 0 ? `+${p.delay}d late` : p.delay < 0 ? `${p.delay}d early` : 'on-time'}
                          </span>
                          <span className="text-[9px]" style={{ color:'var(--text3)' }}>· {p.basis}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color: tier.color, border:`1px solid ${tier.color}30` }}>
                          {p.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Vendor Risk + Route Performance */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <Section icon={Award} title="Vendor Risk Scoring" sub="Avg delivery delay by vendor (lower = better)" accent="var(--warning)">
            {vendorRisk.length === 0 ? (
              <p className="text-[11px] py-3 text-center" style={{ color:'var(--text3)' }}>Not enough completed shipments to score vendors yet.</p>
            ) : (
              <div className="space-y-1.5">
                {vendorRisk.map(v => {
                  const tier = predictionRiskTier(v.avgDelay)
                  return (
                    <div key={v.vendor} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background:'var(--bg2)' }}>
                      <div className="w-1.5 h-6 rounded-full" style={{ background: tier.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color:'var(--text)' }}>{v.vendor}</div>
                        <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{v.total} shipment{v.total === 1 ? '' : 's'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold" style={{ color: tier.color }}>{v.avgDelay > 0 ? '+' : ''}{v.avgDelay.toFixed(1)}d</div>
                        <div className="text-[9px]" style={{ color:'var(--text3)' }}>{tier.tier}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          <Section icon={MapPin} title="Route Performance" sub="Avg delay by origin → destination" accent="var(--cyan)">
            {routePerformance.length === 0 ? (
              <p className="text-[11px] py-3 text-center" style={{ color:'var(--text3)' }}>Not enough completed shipments per route yet.</p>
            ) : (
              <div className="space-y-1.5">
                {routePerformance.map(r => {
                  const tier = predictionRiskTier(r.avgDelay)
                  return (
                    <div key={r.route} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background:'var(--bg2)' }}>
                      <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color:'var(--text)' }}>{r.route}</div>
                        <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{r.total} historical shipments</div>
                      </div>
                      <div className="text-xs font-mono font-bold" style={{ color: tier.color }}>{r.avgDelay > 0 ? '+' : ''}{r.avgDelay.toFixed(1)}d</div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Delivery Trend */}
      <Section icon={TrendingUp} title="Delivery Trend Analysis" sub="Weekly delivered count vs average delay" accent="var(--primary)">
        {trendData.length === 0 ? (
          <p className="text-[11px] py-3 text-center" style={{ color:'var(--text3)' }}>Not enough delivered shipments to plot a trend yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: 'var(--text3)' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
              <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', fontSize: 11 }} />
              <Line yAxisId="left"  type="monotone" dataKey="delivered" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} name="Delivered" />
              <Line yAxisId="right" type="monotone" dataKey="avgDelay"  stroke="var(--danger)"  strokeWidth={2} dot={{ r: 3 }} name="Avg Delay (days)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* AI Insight footer */}
      <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background:'linear-gradient(to right, rgba(99,102,241,.08), rgba(167,139,250,.08))', borderColor:'rgba(99,102,241,.2)' }}>
        <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'#6366F1' }} />
        <div className="text-xs space-y-1" style={{ color:'var(--text2)' }}>
          <p><strong style={{ color:'var(--text)' }}>How the AI works:</strong> for every active shipment we look up past shipments with the same origin→destination route and the same vendor, then weigh the average delay (route+vendor 50%, route 30%, vendor 20%) to predict the likely deviation from the scheduled ETA.</p>
          <p>Confidence rises as more comparable historical shipments become available. Customs Delay Prediction is derived from international deliveries that crossed the KSA border.</p>
        </div>
      </div>
    </div>
  )
}
