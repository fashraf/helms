import { useState } from 'react'
import { Globe, Package, Shield, Plane, Ship, AlertTriangle, CheckCircle2, Clock, ChevronRight, X } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { INTL_SHIPMENTS, CUSTOMS_QUEUE, AI_INSIGHTS } from '../../api/mock/phase7Data'
import { KPIWidget, ViewModeSwitcher, AIAnalyticsCard } from '../../components/ui/EnterpriseWidgets'
import VerticalTimeline from '../../components/ui/VerticalTimeline'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const CUSTOMS_STATUS_CFG = {
  pending:     { cls:'text-slate-500 bg-slate-50 border-slate-200',    label:'PENDING'      },
  in_progress: { cls:'text-blue-600 bg-blue-50 border-blue-200',       label:'IN PROGRESS'  },
  cleared:     { cls:'text-emerald-600 bg-emerald-50 border-emerald-200', label:'CLEARED'   },
  hold:        { cls:'text-red-600 bg-red-50 border-red-200 animate-pulse', label:'HOLD'    },
  rejected:    { cls:'text-red-700 bg-red-100 border-red-300',          label:'REJECTED'     },
}

const STATUS_CFG = {
  in_transit:  { cls:'text-blue-600 bg-blue-50 border-blue-200',     label:'IN TRANSIT'  },
  on_hold:     { cls:'text-amber-600 bg-amber-50 border-amber-200',   label:'ON HOLD'     },
  delivered:   { cls:'text-emerald-600 bg-emerald-50 border-emerald-200',label:'DELIVERED'},
  delayed:     { cls:'text-red-600 bg-red-50 border-red-200 animate-pulse', label:'DELAYED'},
  pending:     { cls:'text-slate-500 bg-slate-50 border-slate-200',   label:'PENDING'     },
}

const MONTHLY_CUSTOMS = ['Jan','Feb','Mar','Apr','May','Jun'].map(m => ({
  month:m, cleared:15+Math.floor(Math.random()*20), delayed:Math.floor(Math.random()*8), pending:Math.floor(Math.random()*6)
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

function CustomsRow({ item }) {
  const sc = CUSTOMS_STATUS_CFG[item.status] ?? CUSTOMS_STATUS_CFG.pending
  return (
    <tr className="transition-colors"
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
      onMouseLeave={e=>e.currentTarget.style.background=''}>
      <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{item.shipmentId}</span></td>
      <td className="px-4 py-3"><span className="text-xs font-bold uppercase" style={{color:item.type==='export'?'var(--primary)':'var(--success)'}}>{item.type}</span></td>
      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${sc.cls}`}>{sc.label}</span></td>
      <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text2)'}}>{item.officerName}</span></td>
      <td className="px-4 py-3">
        {item.docs_missing.length > 0
          ? <span className="text-xs text-red-500">{item.docs_missing.join(', ')}</span>
          : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      </td>
      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{new Date(item.estimatedClearance).toLocaleDateString('en-SA',{month:'short',day:'numeric'})}</span></td>
      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${item.priority==='urgent'?'text-red-600 bg-red-50 border-red-200':'text-slate-500 bg-slate-50 border-slate-200'}`}>{item.priority.toUpperCase()}</span></td>
    </tr>
  )
}

function ShipmentCard({ s, onSelect }) {
  const sc = STATUS_CFG[s.status] ?? STATUS_CFG.pending
  const modeIcon = s.type === 'export' ? Plane : Ship
  return (
    <div className="rounded-xl border overflow-hidden cursor-pointer transition-all" style={C}
      onClick={()=>onSelect(s)}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.borderColor='var(--border2)'}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow)';e.currentTarget.style.borderColor='var(--border)'}}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{s.id}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${sc.cls}`}>{sc.label}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${CUSTOMS_STATUS_CFG[s.customsStatus].cls}`}>
                CUSTOMS {s.customsStatus.toUpperCase().replace('_',' ')}
              </span>
            </div>
            <p className="text-sm font-semibold" style={{color:'var(--text)'}}>{s.customer}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border rounded-md"
              style={{color:s.type==='export'?'var(--primary)':'var(--success)',background:s.type==='export'?'rgba(37,99,235,.08)':'rgba(5,150,105,.08)',borderColor:s.type==='export'?'rgba(37,99,235,.2)':'rgba(5,150,105,.2)'}}>
              {s.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs mb-2" style={{color:'var(--text3)'}}>
          <span className="font-semibold" style={{color:'var(--text)'}}>{s.origin}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold" style={{color:'var(--text)'}}>{s.destination}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          {[
            {l:'Port of Loading', v:s.portOfLoading},
            {l:'Port of Dest.',   v:s.portOfDest   },
            {l:'Vendor',          v:s.vendor        },
            {l:'Incoterms',       v:s.incoterms     },
          ].map(({l,v})=>(
            <div key={l} className="rounded-lg px-2 py-1.5" style={{background:'var(--bg2)',border:'1px solid var(--border)'}}>
              <div style={{color:'var(--text3)'}}>{l}</div>
              <div className="font-semibold truncate" style={{color:'var(--text)'}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Document checklist */}
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {Object.entries(s.documents).map(([k,v])=>(
            <span key={k} className={`text-[9px] px-1.5 py-0.5 rounded font-medium
              ${v?'text-emerald-600 bg-emerald-50 border border-emerald-200':'text-red-500 bg-red-50 border border-red-200'}`}>
              {v?'✓':' ✗'} {k.replace(/([A-Z])/g,' $1').trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InternationalOperations() {
  const [view,     setView]    = useState('card')
  const [tab,      setTab]     = useState('shipments')
  const [selected, setSelected]= useState(null)

  const stats = {
    active:  INTL_SHIPMENTS.filter(s=>s.status==='in_transit').length,
    customs: CUSTOMS_QUEUE.filter(c=>['pending','in_progress'].includes(c.status)).length,
    hold:    CUSTOMS_QUEUE.filter(c=>c.status==='hold').length,
    cleared: CUSTOMS_QUEUE.filter(c=>c.status==='cleared').length,
  }

  const TABS = [['shipments','Shipments'],['customs','Customs Queue'],['analytics','AI Analytics']]

  return (
    <div className="flex gap-4 h-[calc(100vh-128px)]">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--primary-light)',border:'1px solid rgba(37,99,235,.2)'}}>
              <Globe className="w-4.5 h-4.5" style={{color:'var(--primary)'}} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{color:'var(--text)'}}>International Operations Center</h2>
              <p className="text-[11px]" style={{color:'var(--text3)'}}>Cross-border logistics, customs & freight management</p>
            </div>
          </div>
          <ViewModeSwitcher modes={['list','card','timeline']} value={view} onChange={setView} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <KPIWidget label="Active Intl Shipments" value={stats.active}   icon={Globe}     color="var(--primary)"  delta={+2} trend="up"   compact />
          <KPIWidget label="Customs Queue"          value={stats.customs}  icon={Shield}    color="var(--warning)"  delta={-3} trend="down" compact />
          <KPIWidget label="Customs Hold"           value={stats.hold}     icon={AlertTriangle} color="var(--danger)" delta={0} trend="neutral" compact />
          <KPIWidget label="Cleared This Week"      value={stats.cleared}  icon={CheckCircle2}  color="var(--success)" delta={+4} trend="up" compact />
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b flex-shrink-0" style={{borderColor:'var(--border)'}}>
          {TABS.map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className="px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px"
              style={tab===t?{borderColor:'var(--primary)',color:'var(--primary)'}:{borderColor:'transparent',color:'var(--text3)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {tab === 'shipments' && (
            <>
              {view === 'card' && (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {INTL_SHIPMENTS.map(s=><ShipmentCard key={s.id} s={s} onSelect={setSelected} />)}
                </div>
              )}
              {view === 'list' && (
                <div className="rounded-xl border overflow-hidden" style={C}>
                  <table className="w-full">
                    <thead className="border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                      <tr>
                        {['ID','Type','Route','Status','Customs','Vendor','Risk','ETA'].map(h=>(
                          <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--text3)'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{borderColor:'var(--border)'}}>
                      {INTL_SHIPMENTS.map(s=>{
                        const sc = STATUS_CFG[s.status]??STATUS_CFG.pending
                        const cc = CUSTOMS_STATUS_CFG[s.customsStatus]
                        return (
                          <tr key={s.id} className="cursor-pointer transition-colors" onClick={()=>setSelected(s)}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                            onMouseLeave={e=>e.currentTarget.style.background=''}>
                            <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{s.id}</span></td>
                            <td className="px-4 py-3"><span className="text-xs font-bold uppercase" style={{color:s.type==='export'?'var(--primary)':'var(--success)'}}>{s.type}</span></td>
                            <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text2)'}}>{s.origin} → {s.destination}</span></td>
                            <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${sc.cls}`}>{sc.label}</span></td>
                            <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${cc.cls}`}>{cc.label}</span></td>
                            <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text2)'}}>{s.vendor}</span></td>
                            <td className="px-4 py-3"><span className="text-xs font-mono" style={{color:s.riskScore>=60?'var(--danger)':s.riskScore>=30?'var(--warning)':'var(--success)'}}>{s.riskScore}</span></td>
                            <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{new Date(s.eta).toLocaleDateString('en-SA',{month:'short',day:'numeric'})}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {view === 'timeline' && (
                <div className="space-y-4 pb-4">
                  {INTL_SHIPMENTS.slice(0,4).map(s=>(
                    <div key={s.id} className="rounded-xl border overflow-hidden" style={C}>
                      <div className="flex items-center justify-between px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                        <div>
                          <span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{s.id}</span>
                          <span className="ml-2 text-xs" style={{color:'var(--text2)'}}>{s.customer} · {s.origin} → {s.destination}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${(STATUS_CFG[s.status]??STATUS_CFG.pending).cls}`}>
                          {(STATUS_CFG[s.status]??STATUS_CFG.pending).label}
                        </span>
                      </div>
                      <div className="p-4"><VerticalTimeline events={s.timeline} compact /></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'customs' && (
            <div className="space-y-4">
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--text2)'}}>Customs Clearance Queue</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                      <tr>
                        {['Shipment ID','Type','Status','Officer','Missing Docs','Est. Clearance','Priority'].map(h=>(
                          <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--text3)'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{borderColor:'var(--border)'}}>
                      {CUSTOMS_QUEUE.map(item=><CustomsRow key={item.shipmentId} item={item} />)}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customs trend chart */}
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--text2)'}}>Customs Clearance Trend (6 Months)</h3>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={MONTHLY_CUSTOMS} margin={{top:4,right:0,left:-20,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{fill:'var(--text3)',fontSize:10}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill:'var(--text3)',fontSize:10}} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="cleared" name="Cleared" fill="var(--success)" radius={[3,3,0,0]} />
                      <Bar dataKey="delayed" name="Delayed" fill="var(--danger)"  radius={[3,3,0,0]} />
                      <Bar dataKey="pending" name="Pending" fill="var(--warning)" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="space-y-3 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--text3)'}}>AI-Powered International Insights</p>
              {AI_INSIGHTS.map(insight=><AIAnalyticsCard key={insight.id} insight={insight} />)}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-[340px] flex-shrink-0 bg-white border rounded-2xl overflow-hidden flex flex-col animate-slide-in"
          style={{borderColor:'var(--border)',boxShadow:'var(--shadow-lg)'}}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div>
              <div className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{selected.id}</div>
              <div className="text-xs" style={{color:'var(--text)'}}>{selected.customer}</div>
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
