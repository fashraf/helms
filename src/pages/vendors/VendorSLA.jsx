import { useState } from 'react'
import { BarChart3, Brain, Star, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import useVendorStore from '../../store/vendorStore'
import { MOCK_VENDORS } from '../../api/mock/vendorData'
import { SLABadge, RiskBadge, CountryBadge, ModeBadge, SLA_COLOR } from '../../components/vendors/VendorBadges'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const CRITERIA_CFG = {
  balanced: { label:'Balanced',  icon:'⚖️', desc:'Best overall balance of speed, safety, and cost' },
  fastest:  { label:'Fastest',   icon:'⚡', desc:'Minimise transit time above all other factors'   },
  cheapest: { label:'Cheapest',  icon:'💰', desc:'Lowest cost option with acceptable SLA'          },
  safest:   { label:'Safest',    icon:'🛡', desc:'Highest reliability and lowest damage risk'      },
}

const RANK_CFG = {
  1: { label:'Recommended', color:'var(--primary)',        bg:'var(--primary-light)' },
  2: { label:'Alternative',  color:'var(--success)',       bg:'rgba(5,150,105,.08)' },
  3: { label:'Budget',       color:'var(--warning)',       bg:'rgba(217,119,6,.08)' },
  4: { label:'Specialist',   color:'var(--purple)',        bg:'rgba(124,58,237,.08)' },
}

function RecommendationCard({ vendor, rank, reasoning, aiScore, label }) {
  const rc = RANK_CFG[rank] ?? RANK_CFG[4]
  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={C}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
      <div className="h-1" style={{ background: rc.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border font-mono"
                style={{ background: rc.bg, color: rc.color, borderColor: rc.color + '40' }}>
                #{rank} {rc.label.toUpperCase()}
              </span>
            </div>
            <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{vendor.name}</div>
            <CountryBadge code={vendor.country} />
          </div>
          <div className="text-right">
            <div className="text-2xl font-black font-mono" style={{ color: rc.color }}>{aiScore}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'var(--text3)' }}>AI Score</div>
          </div>
        </div>

        <div className="mb-3"><SLABadge sla={vendor.sla} /></div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {vendor.modes.map(m => <ModeBadge key={m} mode={m} />)}
          <RiskBadge risk={vendor.risk} />
        </div>

        <div className="space-y-1.5">
          {reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color:'var(--text2)' }}>
              <Star className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: rc.color }} />
              {r}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { l:'Avg Delivery', v: vendor.performance.avgDeliveryDays+'d' },
            { l:'On-Time',      v: vendor.performance.onTimeRate+'%'      },
            { l:'Reliability',  v: vendor.performance.reliabilityScore+'%' },
          ].map(({l,v}) => (
            <div key={l} className="rounded-lg px-2.5 py-2 text-center" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
              <div className="text-xs font-bold font-mono" style={{ color:'var(--text)' }}>{v}</div>
              <div className="text-[9px]" style={{ color:'var(--text3)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SLATable({ vendors }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>SLA Performance Overview</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
            {['Vendor','Country','SLA Score','Avg Delivery','Delay Risk','Damage Rate','Active','Reliability','Status'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
          {vendors.map((v, i) => {
            const trend = v.performance.trendData
            const recent = trend[trend.length-1]?.sla ?? v.sla
            const prev   = trend[trend.length-2]?.sla ?? v.sla
            const up     = recent > prev
            return (
              <tr key={v.id}
                style={{ background: i%2===0 ? 'var(--card)' : 'var(--bg2)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = i%2===0 ? 'var(--card)' : 'var(--bg2)'}>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{v.name}</div>
                  <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{v.id}</div>
                </td>
                <td className="px-4 py-3"><CountryBadge code={v.country} /></td>
                <td className="px-4 py-3 w-36"><SLABadge sla={v.sla} /></td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono" style={{ color:'var(--text)' }}>{v.performance.avgDeliveryDays}d</span>
                </td>
                <td className="px-4 py-3"><RiskBadge risk={v.risk} /></td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono" style={{ color: v.performance.damageRate > 1.5 ? 'var(--danger)' : 'var(--success)' }}>
                    {v.performance.damageRate}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{v.active}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {up ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    <span className="text-xs font-mono" style={{ color: up ? 'var(--success)' : 'var(--danger)' }}>
                      {v.performance.reliabilityScore}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border
                    ${v.status==='active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                    {v.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function VendorSLA() {
  const { recCriteria, setRecCriteria, getRecommendations, vendors } = useVendorStore()
  const recs = getRecommendations()
  const activeVendors = vendors.filter(v => v.status === 'active')

  const criteriaStyle = (key) => ({
    background: recCriteria===key ? 'var(--primary)' : 'var(--card)',
    borderColor: recCriteria===key ? 'var(--primary)' : 'var(--border)',
    color: recCriteria===key ? '#fff' : 'var(--text2)',
    boxShadow: recCriteria===key ? 'var(--shadow-md)' : 'var(--shadow)',
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
          <BarChart3 className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>SLA Tracking & AI Recommendations</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Vendor performance metrics + AI-powered vendor selection</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Active Vendors',  v:activeVendors.length,                                                   c:'var(--text)'    },
          { l:'Avg SLA Score',   v:Math.round(activeVendors.reduce((a,v)=>a+v.sla,0)/activeVendors.length)+'%', c:'var(--primary)' },
          { l:'High Performers', v:activeVendors.filter(v=>v.sla>=94).length,                              c:'var(--success)' },
          { l:'Needs Attention', v:activeVendors.filter(v=>v.sla<85).length,                               c:'var(--danger)'  },
        ].map(({l,v,c}) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* SLA table */}
      <SLATable vendors={activeVendors.sort((a,b) => b.sla - a.sla)} />

      {/* AI Recommendation Engine */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color:'var(--purple)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>AI Vendor Recommendation Engine</span>
          </div>
        </div>

        <div className="p-4">
          {/* Criteria selector */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-2" style={{ color:'var(--text2)' }}>Optimization criteria:</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CRITERIA_CFG).map(([key,cfg]) => (
                <button key={key} onClick={() => setRecCriteria(key)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all"
                  style={criteriaStyle(key)}>
                  <span className="text-xl">{cfg.icon}</span>
                  <span className="text-[12.5px] font-bold">{cfg.label}</span>
                  <span className="text-[9px] leading-tight opacity-80">{cfg.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation cards */}
          <div className="grid grid-cols-4 gap-3">
            {recs.map(rec => <RecommendationCard key={rec.id} {...rec} />)}
          </div>

          <div className="mt-3 rounded-lg px-3 py-2.5 border text-xs" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)', color:'var(--primary)' }}>
            <Zap className="w-3.5 h-3.5 inline mr-1.5" />
            AI scoring based on: historical SLA data, on-time rates, damage incidents, route congestion patterns, seasonal trends, and equipment-type compatibility.
          </div>
        </div>
      </div>
    </div>
  )
}
