import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Globe,
  CheckCircle2, XCircle, BarChart3, FileText, Calendar, Shield,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import useVendorStore from '../../store/vendorStore'
import { SLABadge, RiskBadge, ModeBadge, StatusBadge, CountryBadge, SLA_COLOR, relTime } from '../../components/vendors/VendorBadges'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const Label = ({children}) => <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{children}</div>
const Val   = ({children, mono=false}) => <div className={`text-sm font-medium ${mono?'font-mono':''}`} style={{color:'var(--text)'}}>{children||'—'}</div>
const InfoBlock = ({label,value,mono}) => <div><Label>{label}</Label><Val mono={mono}>{value}</Val></div>

function Section({title, icon:Icon, children}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{borderColor:'var(--border)',background:'var(--bg2)'}}>
        {Icon && <Icon className="w-3.5 h-3.5" style={{color:'var(--primary)'}} />}
        <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{color:'var(--text2)'}}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Cap({label, enabled}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b last:border-0" style={{borderColor:'var(--border)'}}>
      {enabled
        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
        : <XCircle      className="w-4 h-4 flex-shrink-0 text-red-300" />}
      <span className="text-xs" style={{color: enabled ? 'var(--text)' : 'var(--text3)'}}>{label}</span>
    </div>
  )
}

function ChartTip({active,payload,label}) {
  if (!active||!payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{background:'var(--card)',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)'}}>
      <p className="font-medium mb-1" style={{color:'var(--text2)'}}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{background:p.color}} />
          <span style={{color:'var(--text2)'}}>{p.name}:</span>
          <span className="font-semibold" style={{color:'var(--text)'}}>{p.value}{p.name==='SLA'?'%':''}</span>
        </div>
      ))}
    </div>
  )
}

export default function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vendors  = useVendorStore(s => s.vendors)
  const vendor   = vendors.find(v => v.id === id)
  const [tab, setTab] = useState('overview')

  if (!vendor) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Building2 className="w-12 h-12" style={{color:'var(--text3)'}} />
      <p className="text-sm" style={{color:'var(--text3)'}}>Vendor <span className="font-mono" style={{color:'var(--primary)'}}>{id}</span> not found</p>
      <button onClick={() => navigate('/vendors')} className="text-xs font-medium" style={{color:'var(--primary)'}}>← Back to Vendors</button>
    </div>
  )

  const p = vendor.performance
  const slaC = SLA_COLOR(vendor.sla)
  const contractDaysLeft = Math.floor((new Date(vendor.contract.end) - Date.now()) / 86400000)
  const TABS = [['overview','Overview'],['performance','Performance'],['contract','Contract']]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendors')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{...C}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <ArrowLeft className="w-4 h-4" style={{color:'var(--text2)'}} />
          </button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black"
            style={{background:'var(--primary-light)',color:'var(--primary)'}}>
            {vendor.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h2 className="text-lg font-bold" style={{color:'var(--text)'}}>{vendor.name}</h2>
              <StatusBadge status={vendor.status} />
              <RiskBadge risk={vendor.risk} />
            </div>
            <div className="flex items-center gap-3 text-xs" style={{color:'var(--text3)'}}>
              <span className="font-mono" style={{color:'var(--primary)'}}>{vendor.id}</span>
              <span>·</span>
              <CountryBadge code={vendor.country} />
              <span>·</span>
              <span>{vendor.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b" style={{borderColor:'var(--border)'}}>
        {TABS.map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px"
            style={tab===t
              ? {borderColor:'var(--primary)',color:'var(--primary)'}
              : {borderColor:'transparent',color:'var(--text3)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            {/* Basic info */}
            <Section title="Basic Information" icon={Building2}>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <InfoBlock label="Vendor Name"    value={vendor.name} />
                <InfoBlock label="Headquarters"   value={vendor.hq} />
                <InfoBlock label="Vendor ID"      value={vendor.id} mono />
                <InfoBlock label="Contact Person"  value={vendor.contactPerson} />
                <InfoBlock label="Email"          value={vendor.email} mono />
                <InfoBlock label="Phone"          value={vendor.phone} mono />
                <div className="col-span-3">
                  <Label>Operating Regions / Ports</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {vendor.regions.map(r => (
                      <span key={r} className="text-xs px-2.5 py-1 rounded-lg border" style={{background:'var(--bg2)',borderColor:'var(--border)',color:'var(--text2)'}}>
                        <MapPin className="w-3 h-3 inline mr-1" style={{color:'var(--text3)'}} />{r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-3">
                  <Label>Transport Modes</Label>
                  <div className="flex gap-1.5 mt-1 flex-wrap">{vendor.modes.map(m => <ModeBadge key={m} mode={m} />)}</div>
                </div>
              </div>
            </Section>

            {/* Current load */}
            <Section title="Current Load" icon={BarChart3}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l:'Active Shipments',  v:vendor.active,  color:'var(--primary)' },
                  { l:'Delayed',           v:vendor.delayed, color:'var(--danger)'  },
                  { l:'Pending Approvals', v:vendor.pending, color:'var(--warning)' },
                ].map(({l,v,color}) => (
                  <div key={l} className="rounded-xl border p-4 text-center" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                    <div className="text-2xl font-black font-mono" style={{color}}>{v}</div>
                    <div className="text-[12.5px] mt-1" style={{color:'var(--text3)'}}>{l}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-4">
            {/* SLA summary */}
            <Section title="SLA Score" icon={Shield}>
              <div className="text-center mb-4">
                <div className="text-4xl font-black font-mono mb-1" style={{color:slaC.bar}}>{vendor.sla}%</div>
                <div className="text-[12.5px]" style={{color:'var(--text3)'}}>Service Level Agreement</div>
                <div className="mt-3"><SLABadge sla={vendor.sla} /></div>
              </div>
              <div className="space-y-2.5">
                {[
                  { l:'On-Time Rate',    v:p.onTimeRate+'%' },
                  { l:'Avg Delivery',   v:p.avgDeliveryDays+'d' },
                  { l:'Damage Rate',    v:p.damageRate+'%' },
                  { l:'Delay Rate',     v:p.delayRate+'%' },
                  { l:'Incidents (12m)',v:p.incidents12mo },
                ].map(({l,v}) => (
                  <div key={l} className="flex justify-between text-xs py-1 border-b last:border-0" style={{borderColor:'var(--border)'}}>
                    <span style={{color:'var(--text3)'}}>{l}</span>
                    <span className="font-semibold font-mono" style={{color:'var(--text)'}}>{v}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Capabilities */}
            <Section title="Service Capabilities" icon={Globe}>
              {Object.entries({
                'Air Freight':              vendor.capabilities.airFreight,
                'Sea Freight':              vendor.capabilities.seaFreight,
                'Ground Transport':         vendor.capabilities.groundTransport,
                'Customs Clearance':        vendor.capabilities.customsClearance,
                'Heavy Equipment':          vendor.capabilities.heavyEquipment,
                'Warehousing':              vendor.capabilities.warehousing,
                'Installation Support':     vendor.capabilities.installSupport,
              }).map(([l,e]) => <Cap key={l} label={l} enabled={e} />)}
            </Section>
          </div>
        </div>
      )}

      {/* Performance tab */}
      {tab === 'performance' && (
        <div className="grid grid-cols-2 gap-4">
          <Section title="SLA Trend (8 Months)" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={p.trendData} margin={{top:4,right:0,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gSLA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={slaC.bar} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={slaC.bar} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{fill:'var(--text3)',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis domain={[70,100]} tick={{fill:'var(--text3)',fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="sla" name="SLA" stroke={slaC.bar} strokeWidth={2} fill="url(#gSLA)" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Monthly Shipments" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={p.trendData} margin={{top:4,right:0,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{fill:'var(--text3)',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'var(--text3)',fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="shipments" name="Shipments" fill="var(--primary)" radius={[3,3,0,0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Key Performance Metrics" icon={BarChart3}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { l:'On-Time Rate',       v:p.onTimeRate+'%',       good: p.onTimeRate>=90    },
                { l:'Reliability Score',  v:p.reliabilityScore+'%', good: p.reliabilityScore>=88 },
                { l:'Avg Delivery (days)',v:p.avgDeliveryDays,      good: true },
                { l:'Damage Rate',        v:p.damageRate+'%',       good: p.damageRate<1.5   },
                { l:'Delay Rate',         v:p.delayRate+'%',        good: p.delayRate<10     },
                { l:'Customs Clear (d)',  v:p.customsClearDays,     good: p.customsClearDays<=3 },
                { l:'Incidents (12mo)',   v:p.incidents12mo,        good: p.incidents12mo<=2  },
                { l:'Total Shipments',    v:p.shipmentsDone,        good: true },
              ].map(({l,v,good}) => (
                <div key={l}>
                  <Label>{l}</Label>
                  <div className="text-xl font-black font-mono" style={{color: good ? 'var(--success)' : 'var(--danger)'}}>{v}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="AI Assessment" icon={Shield}>
            <div className="space-y-3">
              <div className="rounded-xl p-3 border" style={{background:'var(--primary-light)',borderColor:'rgba(37,99,235,.2)'}}>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--primary)'}}>AI Reliability Score</div>
                <div className="text-3xl font-black font-mono" style={{color:'var(--primary)'}}>{p.reliabilityScore}%</div>
              </div>
              <p className="text-xs leading-relaxed" style={{color:'var(--text2)'}}>
                {vendor.name} has a {p.reliabilityScore >= 90 ? 'strong' : p.reliabilityScore >= 80 ? 'moderate' : 'developing'} track record.
                {p.onTimeRate >= 92 ? ' On-time performance is excellent.' : ' On-time rate needs monitoring.'}
                {p.damageRate < 1 ? ' Damage rate is within acceptable limits.' : ' Damage rate is elevated — recommend additional packaging protocols.'}
              </p>
            </div>
          </Section>
        </div>
      )}

      {/* Contract tab */}
      {tab === 'contract' && (
        <div className="grid grid-cols-2 gap-4">
          <Section title="Contract Details" icon={FileText}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Contract Start" value={new Date(vendor.contract.start).toLocaleDateString()} />
                <div>
                  <Label>Contract End</Label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium" style={{color: contractDaysLeft < 60 ? 'var(--danger)' : contractDaysLeft < 120 ? 'var(--warning)' : 'var(--text)'}}>
                      {new Date(vendor.contract.end).toLocaleDateString()}
                    </div>
                    <span className="text-[12.5px] px-1.5 py-0.5 rounded font-bold"
                      style={{background: contractDaysLeft < 60 ? 'rgba(220,38,38,.1)' : 'rgba(5,150,105,.1)',
                              color: contractDaysLeft < 60 ? 'var(--danger)' : 'var(--success)'}}>
                      {contractDaysLeft}d left
                    </span>
                  </div>
                </div>
                <InfoBlock label="Contract Value" value={`SAR ${(vendor.contract.value/1000).toFixed(0)}k`} />
                <InfoBlock label="Insurance Expiry" value={new Date(vendor.contract.insurance).toLocaleDateString()} />
              </div>
              <div className="pt-3 border-t" style={{borderColor:'var(--border)'}}>
                <Label>Compliance Status</Label>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg
                  ${vendor.contract.compliance==='verified'
                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                    : 'text-amber-600 bg-amber-50 border border-amber-200'}`}>
                  {vendor.contract.compliance==='verified' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                  {vendor.contract.compliance.toUpperCase()}
                </span>
              </div>
            </div>
          </Section>
          <Section title="Documents" icon={FileText}>
            <div className="space-y-2">
              {[
                { l:'SLA Agreement',      f:vendor.contract.slaDoc,   ok:true  },
                { l:'Insurance Certificate',f:'INS-'+vendor.id+'.pdf', ok:true  },
                { l:'Compliance Certificate',f:'COMP-'+vendor.id+'.pdf',ok:vendor.contract.compliance==='verified' },
                { l:'Service Agreement',  f:'SA-'+vendor.id+'.pdf',   ok:true  },
              ].map(({l,f,ok}) => (
                <div key={l} className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
                  style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                  <div className="flex items-center gap-2.5">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <div>
                      <div className="text-xs font-medium" style={{color:'var(--text)'}}>{l}</div>
                      <div className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{f}</div>
                    </div>
                  </div>
                  <FileText className="w-4 h-4" style={{color:'var(--text3)'}} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
