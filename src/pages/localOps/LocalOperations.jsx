import { useState } from 'react'
import {
  MapPin, Package, Truck, Warehouse, AlertTriangle,
  CheckCircle2, Clock, Users, BarChart3, RefreshCw,
  ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { LOCAL_SHIPMENTS, LOCAL_REGIONS, AI_INSIGHTS } from '../../api/mock/phase7Data'
import { KPIWidget, ViewModeSwitcher, AIAnalyticsCard } from '../../components/ui/EnterpriseWidgets'
import VerticalTimeline from '../../components/ui/VerticalTimeline'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const STATUS_CFG = {
  in_transit: { cls:'text-blue-600 bg-blue-50 border-blue-200',   label:'IN TRANSIT' },
  pending:    { cls:'text-slate-500 bg-slate-50 border-slate-200', label:'PENDING'    },
  delivered:  { cls:'text-emerald-600 bg-emerald-50 border-emerald-200', label:'DELIVERED' },
  delayed:    { cls:'text-red-600 bg-red-50 border-red-200 animate-pulse', label:'DELAYED'  },
  on_hold:    { cls:'text-amber-600 bg-amber-50 border-amber-200', label:'ON HOLD'    },
}

const SLA_CFG = {
  on_track: { cls:'text-emerald-600 bg-emerald-50 border-emerald-200', label:'ON TRACK' },
  at_risk:  { cls:'text-amber-600 bg-amber-50 border-amber-200',  label:'AT RISK'  },
  breached: { cls:'text-red-600 bg-red-50 border-red-200',        label:'BREACHED' },
}

const REGION_PERF = LOCAL_REGIONS.slice(0,6).map(r => ({
  region: r, onTime: 85+Math.floor(Math.random()*12), shipments: 20+Math.floor(Math.random()*60), delayed: Math.floor(Math.random()*6),
}))

const WEEKLY_DATA = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
  day:d, delivered:15+Math.floor(Math.random()*20), delayed:Math.floor(Math.random()*5), pending:5+Math.floor(Math.random()*10)
}))

function ChartTip({active,payload,label}) {
  if(!active||!payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{background:'var(--card)',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)'}}>
      <p className="font-medium mb-1" style={{color:'var(--text2)'}}>{label}</p>
      {payload.map(p=>(
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{background:p.color}} />
          <span style={{color:'var(--text2)'}}>{p.name}:</span>
          <span className="font-bold" style={{color:'var(--text)'}}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function ShipmentCard({ s, onSelect }) {
  const sc = STATUS_CFG[s.status] ?? STATUS_CFG.pending
  const sl = SLA_CFG[s.slaStatus] ?? SLA_CFG.on_track
  return (
    <div className="rounded-xl border overflow-hidden cursor-pointer transition-all" style={C}
      onClick={()=>onSelect(s)}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.borderColor='var(--border2)'}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow)';e.currentTarget.style.borderColor='var(--border)'}}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{s.id}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${sc.cls}`}>{sc.label}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${sl.cls}`}>{sl.label}</span>
            </div>
            <p className="text-sm font-semibold" style={{color:'var(--text)'}}>{s.customer}</p>
            <p className="text-xs" style={{color:'var(--text3)'}}>{s.equipment}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold" style={{color:s.riskScore>=60?'var(--danger)':s.riskScore>=30?'var(--warning)':'var(--success)'}}>
              Risk {s.riskScore}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] mb-3" style={{color:'var(--text3)'}}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{s.origin}</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{s.dest}</span>
          <span className="ml-auto font-mono">{s.distance}km</span>
        </div>
        {/* Progress bar based on checkpoints */}
        <div>
          <div className="flex items-center justify-between text-[9px] mb-1" style={{color:'var(--text3)'}}>
            <span>Progress</span>
            <span>{s.checkpoints.filter(c=>c.done).length}/{s.checkpoints.length} checkpoints</span>
          </div>
          <div className="flex gap-0.5">
            {s.checkpoints.map((cp,i)=>(
              <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                style={{background:cp.done?'var(--primary)':'var(--bg3)'}} title={cp.label} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t text-[12.5px]" style={{borderColor:'var(--border)',background:'var(--bg2)'}}>
        <span style={{color:'var(--text3)'}}><Users className="w-3 h-3 inline mr-1" />{s.driver}</span>
        <span style={{color:'var(--text3)'}}><Truck className="w-3 h-3 inline mr-1" />Truck</span>
        <span className="font-mono" style={{color:'var(--text3)'}}>
          ETA: {new Date(s.eta).toLocaleTimeString('en-SA',{hour:'2-digit',minute:'2-digit'})}
        </span>
      </div>
    </div>
  )
}

function ShipmentRow({ s, onSelect }) {
  const sc = STATUS_CFG[s.status] ?? STATUS_CFG.pending
  return (
    <tr className="cursor-pointer transition-colors" onClick={()=>onSelect(s)}
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
      onMouseLeave={e=>e.currentTarget.style.background=''}>
      <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{s.id}</span></td>
      <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text)'}}>{s.customer}</span></td>
      <td className="px-4 py-3"><span className="text-xs truncate block max-w-[120px]" style={{color:'var(--text2)'}}>{s.origin} → {s.dest}</span></td>
      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${sc.cls}`}>{sc.label}</span></td>
      <td className="px-4 py-3"><span className="text-xs font-mono" style={{color:s.riskScore>=60?'var(--danger)':s.riskScore>=30?'var(--warning)':'var(--success)'}}>{s.riskScore}</span></td>
      <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text3)'}}>{s.driver.split(' ')[0]}</span></td>
      <td className="px-4 py-3"><span className="text-xs font-mono" style={{color:'var(--text3)'}}>{new Date(s.eta).toLocaleDateString('en-SA',{month:'short',day:'numeric'})}</span></td>
      <td className="px-4 py-3"><ChevronRight className="w-4 h-4" style={{color:'var(--text3)'}} /></td>
    </tr>
  )
}

export default function LocalOperations() {
  const [view, setView]     = useState('card')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const shown = filter === 'all' ? LOCAL_SHIPMENTS : LOCAL_SHIPMENTS.filter(s=>s.status===filter||s.region===filter)
  const stats = {
    active:   LOCAL_SHIPMENTS.filter(s=>s.status==='in_transit').length,
    delayed:  LOCAL_SHIPMENTS.filter(s=>s.status==='delayed').length,
    delivered:LOCAL_SHIPMENTS.filter(s=>s.status==='delivered').length,
    slaOk:    LOCAL_SHIPMENTS.filter(s=>s.slaStatus==='on_track').length,
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-128px)]">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--primary-light)',border:'1px solid rgba(37,99,235,.2)'}}>
              <MapPin className="w-4.5 h-4.5" style={{color:'var(--primary)'}} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{color:'var(--text)'}}>Local Operations Center</h2>
              <p className="text-[11px]" style={{color:'var(--text3)'}}>Domestic logistics command — {shown.length} shipments</p>
            </div>
          </div>
          <ViewModeSwitcher modes={['list','card','timeline']} value={view} onChange={setView} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <KPIWidget label="Active Shipments"  value={stats.active}   icon={Package} color="var(--primary)"  delta={+3}  trend="up"   compact />
          <KPIWidget label="Delayed"            value={stats.delayed}  icon={AlertTriangle} color="var(--danger)" delta={-1}  trend="down" compact />
          <KPIWidget label="Delivered Today"    value={stats.delivered} icon={CheckCircle2} color="var(--success)" delta={+5} trend="up"  compact />
          <KPIWidget label="SLA Compliance"     value={Math.round(stats.slaOk/LOCAL_SHIPMENTS.length*100)} unit="%" icon={BarChart3} color="var(--warning)" compact />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {[['all','All'],['in_transit','In Transit'],['delayed','Delayed'],['pending','Pending'],['delivered','Delivered']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)}
              className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
              style={filter===v?{background:'var(--primary)',color:'#fff',borderColor:'var(--primary)'}:{background:'var(--card)',color:'var(--text2)',borderColor:'var(--border)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* Views */}
        <div className="flex-1 overflow-auto">
          {view === 'card' && (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
              {shown.map(s => <ShipmentCard key={s.id} s={s} onSelect={setSelected} />)}
            </div>
          )}
          {view === 'list' && (
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                    <tr>
                      {['ID','Customer','Route','Status','Risk','Driver','ETA',''].map(h=>(
                        <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--text3)'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{borderColor:'var(--border)'}}>
                    {shown.map(s=><ShipmentRow key={s.id} s={s} onSelect={setSelected} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {view === 'timeline' && (
            <div className="space-y-4 pb-4">
              {shown.slice(0,6).map(s=>(
                <div key={s.id} className="rounded-xl border overflow-hidden" style={C}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                    <div>
                      <span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{s.id}</span>
                      <span className="ml-2 text-xs" style={{color:'var(--text2)'}}>{s.customer} · {s.origin} → {s.dest}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${(STATUS_CFG[s.status]??STATUS_CFG.pending).cls}`}>
                      {(STATUS_CFG[s.status]??STATUS_CFG.pending).label}
                    </span>
                  </div>
                  <div className="p-4">
                    <VerticalTimeline events={s.timeline} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel: shipment timeline */}
      {selected && (
        <div className="w-[340px] flex-shrink-0 bg-white border rounded-2xl overflow-hidden flex flex-col animate-slide-in"
          style={{borderColor:'var(--border)',boxShadow:'var(--shadow-lg)'}}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div>
              <div className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{selected.id}</div>
              <div className="text-xs font-semibold" style={{color:'var(--text)'}}>{selected.customer}</div>
            </div>
            <button onClick={()=>setSelected(null)} style={{color:'var(--text3)'}}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <VerticalTimeline events={selected.timeline} title="Shipment Timeline" />
          </div>
        </div>
      )}
    </div>
  )
}
