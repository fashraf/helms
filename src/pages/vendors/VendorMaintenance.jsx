import { useState } from 'react'
import { Wrench, Plus, Search, ChevronDown, ChevronUp, Brain, CheckCircle2, Clock } from 'lucide-react'
import useVendorStore from '../../store/vendorStore'
import { MAINT_TIMELINE_STEPS } from '../../api/mock/vendorData'
import { CountryBadge, relTime } from '../../components/vendors/VendorBadges'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const STEP_COLORS = {
  completed: { node:'bg-emerald-500 border-emerald-400', text:'text-emerald-600', line:'bg-emerald-500' },
  active:    { node:'bg-blue-500 border-blue-400',     text:'text-blue-600',   line:'bg-gray-200'     },
  pending:   { node:'bg-gray-200 border-gray-300',     text:'text-gray-400',   line:'bg-gray-200'     },
}

const PRIO_CFG = {
  critical: 'text-red-600 bg-red-50 border-red-200 animate-pulse',
  high:     'text-amber-600 bg-amber-50 border-amber-200',
  medium:   'text-orange-600 bg-orange-50 border-orange-200',
  low:      'text-slate-500 bg-slate-50 border-slate-200',
}

function HorizontalTimeline({ currentStep, steps }) {
  return (
    <div className="overflow-x-auto py-4">
      <div className="flex items-center min-w-max px-2">
        {steps.map((step, i) => {
          const done = i < currentStep
          const curr = i === currentStep
          const cfg  = done ? STEP_COLORS.completed : curr ? STEP_COLORS.active : STEP_COLORS.pending
          const isLast = i === steps.length - 1
          return (
            <div key={step} className="flex items-center">
              {/* Node + label */}
              <div className="flex flex-col items-center" style={{ width: 110 }}>
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${cfg.node}`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : curr
                      ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      : <Clock className="w-4 h-4 text-gray-400" />
                  }
                </div>
                <div className={`mt-2 text-[12.5px] font-bold text-center leading-tight ${cfg.text}`}
                  style={{ maxWidth: 90 }}>
                  {step}
                </div>
                {curr && (
                  <div className="text-[9px] text-blue-500 font-bold mt-0.5 animate-pulse">IN PROGRESS</div>
                )}
              </div>
              {/* Connector */}
              {!isLast && (
                <div className="w-10 h-0.5 flex-shrink-0 -mt-5 mx-1">
                  <div className={`h-full ${done ? 'bg-emerald-400' : 'bg-gray-200'} rounded-full transition-all`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MaintenanceCard({ req }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={C}>
      {/* Priority accent */}
      <div className="h-1" style={{
        background: req.priority === 'critical' ? 'var(--danger)' : req.priority === 'high' ? 'var(--warning)' : req.priority === 'medium' ? '#f97316' : 'var(--text3)'
      }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{req.id}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${PRIO_CFG[req.priority]}`}>
                {req.priority.toUpperCase()}
              </span>
            </div>
            <div className="text-sm font-semibold" style={{color:'var(--text)'}}>{req.equipmentId} — {req.equipType}</div>
            <div className="text-xs mt-0.5" style={{color:'var(--text3)'}}>{req.issue}</div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-xs font-mono font-bold" style={{color:'var(--primary)'}}>
              SAR {req.costEstimate.toLocaleString()}
            </div>
            <div className="text-[12.5px]" style={{color:'var(--text3)'}}>est. cost</div>
          </div>
        </div>

        {/* Vendor + region */}
        <div className="flex items-center gap-4 mb-3 text-xs" style={{color:'var(--text2)'}}>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold" style={{color:'var(--text)'}}>{req.vendorName}</span>
            <CountryBadge code={req.vendorCountry} />
          </span>
          <span>·</span>
          <span>{req.region}</span>
          <span>·</span>
          <span>{req.estRepairDays}d estimated</span>
        </div>

        {/* Horizontal timeline */}
        <HorizontalTimeline currentStep={req.currentStep} steps={MAINT_TIMELINE_STEPS} />

        {/* Expand toggle */}
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[12.5px] font-medium mt-1 transition-colors"
          style={{color:'var(--text3)'}}
          onMouseEnter={e => e.currentTarget.style.color='var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide AI Prediction' : 'View AI Prediction'}
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl p-4 border animate-fade-in"
            style={{background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)'}}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" style={{color:'var(--primary)'}} />
              <span className="text-[12.5px] font-bold uppercase tracking-wider" style={{color:'var(--primary)'}}>AI Repair Prediction</span>
              <span className="ml-auto text-[9px]" style={{color:'var(--primary)'}}>Confidence: {req.aiPrediction.confidence}%</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l:'Repair Duration',    v: req.aiPrediction.repairDuration },
                { l:'Repeat Failure Risk',v: req.aiPrediction.repeatRisk     },
                { l:'Parts Delay',        v: req.aiPrediction.partsDelay     },
                { l:'Cost Range',         v: req.aiPrediction.costRange       },
              ].map(({l,v}) => (
                <div key={l} className="rounded-lg p-2.5" style={{background:'rgba(255,255,255,.7)'}}>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{color:'var(--primary)'}}>
                    {l}
                  </div>
                  <div className="text-xs font-semibold" style={{color:'var(--text)'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VendorMaintenance() {
  const { filteredOsMaint, maintFilter, setMaintFilter, outsourcedMaint } = useVendorStore()
  const list = filteredOsMaint()

  const stats = {
    total:    outsourcedMaint.length,
    active:   outsourcedMaint.filter(m => !['completed'].includes(m.status)).length,
    critical: outsourcedMaint.filter(m => m.priority === 'critical').length,
    total_cost: outsourcedMaint.reduce((a,m) => a + m.costEstimate, 0),
  }

  const selStyle = { background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }
  const filterBtn = (active) => ({
    background: active ? 'var(--primary-light)' : 'var(--card)',
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    color: active ? 'var(--primary)' : 'var(--text2)',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{background:'var(--primary-light)',border:'1px solid rgba(37,99,235,.2)'}}>
            <Wrench className="w-4.5 h-4.5" style={{color:'var(--primary)'}} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{color:'var(--text)'}}>Outsourced Maintenance</h2>
            <p className="text-[11px]" style={{color:'var(--text3)'}}>External repair & service vendor requests</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all text-white"
          style={{background:'var(--primary)'}}>
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Requests', v:stats.total,        c:'var(--text)'    },
          { l:'Active',         v:stats.active,       c:'var(--primary)' },
          { l:'Critical',       v:stats.critical,     c:'var(--danger)'  },
          { l:'Est. Total Cost',v:'SAR '+(stats.total_cost/1000).toFixed(0)+'k', c:'var(--warning)' },
        ].map(({l,v,c}) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text3)'}} />
          <input value={maintFilter.search} onChange={e=>setMaintFilter('search',e.target.value)}
            placeholder="Search request or unit…"
            className="rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-44"
            style={selStyle} />
        </div>
        {[['all','All Status'],['inspection','Inspection'],['repair','Repair'],['qa_testing','QA'],['completed','Completed']].map(([v,l]) => (
          <button key={v} onClick={() => setMaintFilter('status',v)}
            className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
            style={filterBtn(maintFilter.status===v)}>{l}</button>
        ))}
        {[['all','All Priority'],['critical','Critical'],['high','High'],['medium','Medium']].map(([v,l]) => (
          <button key={v} onClick={() => setMaintFilter('priority',v)}
            className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
            style={filterBtn(maintFilter.priority===v)}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {list.map(req => <MaintenanceCard key={req.id} req={req} />)}
      </div>
    </div>
  )
}
