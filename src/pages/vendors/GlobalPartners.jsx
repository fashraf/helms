import { useState } from 'react'
import { Globe, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useVendorStore from '../../store/vendorStore'
import { MOCK_VENDORS, COUNTRIES, MULTI_VENDOR_FLOWS, SLA_HEATMAP } from '../../api/mock/vendorData'
import { ModeBadge, CountryBadge, SLABadge, RiskBadge, SLA_COLOR } from '../../components/vendors/VendorBadges'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

// ─── Flow step ────────────────────────────────────────────────────────────────
function FlowStep({ step, isLast }) {
  const statusCfg = {
    completed: { dot: 'bg-emerald-500', line: 'bg-emerald-400', text: 'text-emerald-600', label: 'DONE'    },
    active:    { dot: 'bg-blue-500 animate-pulse', line: 'bg-gray-200', text: 'text-blue-600', label: 'ACTIVE' },
    delayed:   { dot: 'bg-red-500 animate-pulse',  line: 'bg-gray-200', text: 'text-red-600',  label: 'DELAYED'},
    pending:   { dot: 'bg-gray-300',               line: 'bg-gray-200', text: 'text-gray-400', label: 'PENDING'},
  }
  const cfg = statusCfg[step.status] ?? statusCfg.pending

  return (
    <div className="flex items-start flex-shrink-0" style={{ minWidth: 160 }}>
      {/* Step content */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div className={`w-4 h-4 rounded-full ${cfg.dot} ring-2 ring-white shadow-sm flex-shrink-0 mt-1`} />
        {/* Connector */}
        {!isLast && (
          <div className="flex-1 w-0.5 mt-1" style={{ height: 24, background: step.status === 'completed' ? '#10b981' : 'var(--border)' }} />
        )}
      </div>

      <div className="ml-3 pb-4">
        <div className={`text-[9px] font-bold tracking-widest mb-0.5 ${cfg.text}`}>{cfg.label}</div>
        <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{step.location}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--text3)' }}>
          <span className="font-medium" style={{ color: 'var(--primary)' }}>{step.vendor}</span>
          {step.mode && <> · <ModeBadge mode={step.mode} /></>}
        </div>
        <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: 'var(--text3)' }}>{step.handoff}</div>
        <CountryBadge code={step.country} />
      </div>

      {/* Arrow */}
      {!isLast && (
        <div className="flex-shrink-0 mt-2 mx-1">
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--text3)' }} />
        </div>
      )}
    </div>
  )
}

// ─── Horizontal flow card ─────────────────────────────────────────────────────
function MultiVendorFlowCard({ flow }) {
  const statusCfg = {
    in_transit: { cls: 'text-blue-600 bg-blue-50 border-blue-200', label: 'IN TRANSIT' },
    delayed:    { cls: 'text-red-600 bg-red-50 border-red-200 animate-pulse', label: 'DELAYED' },
    completed:  { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'COMPLETED' },
    pending:    { cls: 'text-slate-500 bg-slate-50 border-slate-200', label: 'PENDING' },
  }
  const sc = statusCfg[flow.status] ?? statusCfg.pending
  const activeStep = flow.steps.findIndex(s => s.status === 'active' || s.status === 'delayed')
  const pct = Math.round(((activeStep < 0 ? flow.steps.length : activeStep) / flow.steps.length) * 100)

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{flow.id}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${sc.cls}`}>{sc.label}</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{flow.title}</div>
          <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Shipment: <span className="font-mono" style={{ color: 'var(--primary)' }}>{flow.shipmentId}</span></div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black font-mono" style={{ color: 'var(--primary)' }}>{pct}%</div>
          <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: flow.status === 'delayed' ? 'var(--danger)' : 'var(--primary)' }} />
        </div>
      </div>

      {/* Horizontal timeline */}
      <div className="overflow-x-auto">
        <div className="flex items-start p-4 gap-0" style={{ minWidth: flow.steps.length * 160 }}>
          {flow.steps.map((step, i) => (
            <FlowStep key={step.seq} step={step} isLast={i === flow.steps.length - 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SLA heatmap cell ─────────────────────────────────────────────────────────
function HeatCell({ value }) {
  const v = Math.round(value)
  const bg = v >= 94 ? '#dcfce7' : v >= 88 ? '#dbeafe' : v >= 80 ? '#fef3c7' : '#fee2e2'
  const text = v >= 94 ? '#15803d' : v >= 88 ? '#1d4ed8' : v >= 80 ? '#b45309' : '#b91c1c'
  return (
    <td className="px-2 py-2 text-center">
      <div className="rounded-md px-1.5 py-1 text-[12.5px] font-bold font-mono" style={{ background: bg, color: text }}>{v}%</div>
    </td>
  )
}

export default function GlobalPartners() {
  const { vendors } = useVendorStore()
  const [view, setView] = useState('network')

  // Group vendors by country
  const byCountry = {}
  vendors.forEach(v => {
    if (!byCountry[v.country]) byCountry[v.country] = []
    byCountry[v.country].push(v)
  })

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,.2)' }}>
            <Globe className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Global Partner Network</h2>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>International logistics partners, multi-vendor flows & SLA tracking</p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center border rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {[['network','Partner Network'],['flows','Shipment Flows'],['sla','SLA Heatmap']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5 text-[12.5px] font-bold rounded-md transition-all"
              style={view===v ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--text3)' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Partner Network view ──────────────────────────────────────────── */}
      {view === 'network' && (
        <div className="space-y-3">
          {Object.entries(byCountry).map(([code, cvs]) => {
            const country = COUNTRIES.find(c => c.code === code)
            return (
              <div key={code} className="rounded-xl border overflow-hidden" style={C}>
                {/* Country header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                  <span className="text-2xl">{country?.flag ?? '🌐'}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{country?.name ?? code}</div>
                    <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{cvs.length} vendors · {country?.region}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-3 text-[12.5px]" style={{ color: 'var(--text3)' }}>
                    <span className="font-mono">{cvs.reduce((a,v)=>a+v.active,0)} active shipments</span>
                    <span className="font-mono">Avg SLA: {Math.round(cvs.reduce((a,v)=>a+v.sla,0)/cvs.length)}%</span>
                  </div>
                </div>

                {/* Vendors in this country */}
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {cvs.map(v => (
                    <div key={v.id} className="flex items-center gap-4 px-4 py-3 transition-colors"
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      {/* Connector line */}
                      <div className="flex items-center gap-2 ml-8">
                        <div className="w-px h-4 bg-gray-200" />
                        <ChevronRight className="w-3 h-3" style={{ color: 'var(--text3)' }} />
                      </div>
                      <div className="w-32">
                        <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{v.name}</div>
                        <div className="text-[9px] font-mono" style={{ color: 'var(--text3)' }}>{v.id}</div>
                      </div>
                      <ChevronRight className="w-3 h-3" style={{ color: 'var(--text3)' }} />
                      <div className="flex gap-1 flex-wrap">
                        {v.modes.map(m => <ModeBadge key={m} mode={m} />)}
                      </div>
                      <ChevronRight className="w-3 h-3" style={{ color: 'var(--text3)' }} />
                      <div className="text-xs" style={{ color: 'var(--text2)' }}>{v.service}</div>
                      <div className="ml-auto flex items-center gap-4">
                        <div className="w-32"><SLABadge sla={v.sla} /></div>
                        <RiskBadge risk={v.risk} />
                        <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{v.active} active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Shipment Flows view ───────────────────────────────────────────── */}
      {view === 'flows' && (
        <div className="space-y-4">
          {MULTI_VENDOR_FLOWS.map(flow => <MultiVendorFlowCard key={flow.id} flow={flow} />)}
          <div className="rounded-xl border p-6 text-center border-dashed" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text3)' }} />
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Assign vendors to a shipment to create a multi-vendor flow</p>
          </div>
        </div>
      )}

      {/* ── SLA Heatmap view ──────────────────────────────────────────────── */}
      {view === 'sla' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>SLA Performance Heatmap — Jan to Jun</h3>
            <div className="flex items-center gap-4 mt-1.5">
              {[['#dcfce7','#15803d','≥94% Excellent'],['#dbeafe','#1d4ed8','88–93% Good'],['#fef3c7','#b45309','80–87% Monitor'],['#fee2e2','#b91c1c','<80% Critical']].map(([bg,c,l]) => (
                <div key={l} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--text3)' }}>
                  <div className="w-3 h-3 rounded" style={{ background: bg }} />
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Vendor</th>
                  <th className="text-center px-2 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Country</th>
                  {MONTHS.map(m => (
                    <th key={m} className="text-center px-2 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{m}</th>
                  ))}
                  <th className="text-center px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {SLA_HEATMAP.map((row, i) => {
                  const avg = Math.round(MONTHS.reduce((a,m) => a+row[m], 0) / MONTHS.length)
                  return (
                    <tr key={row.vendorId}
                      style={{ background: i%2===0 ? 'var(--card)' : 'var(--bg2)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = i%2===0 ? 'var(--card)' : 'var(--bg2)'}>
                      <td className="px-4 py-2">
                        <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{row.vendor}</div>
                        <div className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{row.vendorId}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <CountryBadge code={row.country} />
                      </td>
                      {MONTHS.map(m => <HeatCell key={m} value={row[m]} />)}
                      <HeatCell value={avg} />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
