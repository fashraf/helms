import { useState } from 'react'
import {
  AlertOctagon, Search, ChevronDown, ChevronUp,
  Truck, User, MapPin, Clock, DollarSign, Camera, Check,
} from 'lucide-react'
import useOperationsStore from '../../store/operationsStore'
import { SeverityBadge, IncidentStatusBadge, StatMini, getSeverityBar, relTime } from '../../components/operations/OperationsBadges'
import { INCIDENT_TYPES } from '../../api/mock/operationsData'

const LEFT_BORDER = {
  critical: 'border-l-red-500',
  high:     'border-l-amber-500',
  medium:   'border-l-orange-500',
  low:      'border-l-emerald-500',
}

function IncidentCard({ inc }) {
  const [expanded, setExpanded] = useState(false)
  const { resolveIncident } = useOperationsStore()

  return (
    <div className={`bg-helm-800 border border-helm-600 border-l-4 ${LEFT_BORDER[inc.severity] ?? 'border-l-slate-500'} rounded-xl overflow-hidden transition-all`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[12.5px] font-black text-amber-400">{inc.id}</span>
            <SeverityBadge severity={inc.severity} />
            <IncidentStatusBadge status={inc.status} />
          </div>
          <span className="text-[12.5px] text-slate-600 font-mono flex-shrink-0 ml-2">{relTime(inc.reportedAt)}</span>
        </div>

        {/* Type + description */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className={`text-[9px] font-bold uppercase tracking-widest
            ${inc.type === 'Breakdown' ? 'text-red-400' :
              inc.type === 'Delay' ? 'text-amber-400' :
              inc.type === 'Cargo Damage' ? 'text-orange-400' :
              'text-slate-400'}`}>
            {inc.type}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-2">{inc.description}</p>

        {/* Quick info */}
        <div className="flex items-center gap-4 text-[12.5px] text-slate-500">
          <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-slate-600" /><span className="font-mono text-slate-400">{inc.vehicleId}</span></span>
          <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-600" />{inc.driverName.split(' ')[0]}</span>
          <span className="flex items-center gap-1 truncate max-w-[160px]"><MapPin className="w-3 h-3 text-slate-600 flex-shrink-0" />{inc.location}</span>
          {inc.images > 0 && <span className="flex items-center gap-1"><Camera className="w-3 h-3 text-slate-600" />{inc.images}</span>}
        </div>

        {/* Expandable details */}
        <button onClick={() => setExpanded(!expanded)} className="mt-2 flex items-center gap-1 text-[9px] text-slate-600 hover:text-slate-300 transition-colors">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Collapse' : 'View Details'}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-helm-700/50 animate-fade-in">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
              {[
                { l: 'Shipment',        v: inc.shipmentId,                 cls: 'text-amber-400 font-mono'  },
                { l: 'Vehicle Model',   v: inc.vehicleModel,               cls: 'text-slate-300'            },
                { l: 'Delay Impact',    v: inc.estimatedDelay > 0 ? inc.estimatedDelay + ' min' : 'None', cls: inc.estimatedDelay > 0 ? 'text-amber-400' : 'text-emerald-400' },
                { l: 'Est. Cost',       v: inc.estimatedCost > 0 ? 'SAR ' + inc.estimatedCost.toLocaleString() : 'None', cls: 'text-slate-300' },
                { l: 'Reported By',     v: inc.reportedBy,                 cls: 'text-slate-300'            },
                { l: 'Resolved',        v: inc.resolvedAt ? relTime(inc.resolvedAt) : 'Pending', cls: inc.resolvedAt ? 'text-emerald-400' : 'text-slate-500' },
              ].map(({ l, v, cls }) => (
                <div key={l}>
                  <span className="text-slate-600">{l}: </span>
                  <span className={cls}>{v}</span>
                </div>
              ))}
            </div>
            {inc.notes && <p className="text-[11px] text-amber-400/80 mt-2">⚠ {inc.notes}</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      {['open', 'investigating'].includes(inc.status) && (
        <div className="border-t border-helm-700/50 flex">
          <button
            onClick={() => resolveIncident(inc.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <Check className="w-3 h-3" /> Mark Resolved
          </button>
        </div>
      )}
    </div>
  )
}

export default function Incidents() {
  const { filteredIncidents, incidentFilter, setIncidentFilter, incidents } = useOperationsStore()
  const shown = filteredIncidents()

  const stats = {
    total:    incidents.length,
    open:     incidents.filter(i => i.status === 'open').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    totalCost: incidents.reduce((a, i) => a + (i.estimatedCost ?? 0), 0),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertOctagon className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Incident Management</h2>
            <p className="text-[11px] text-slate-500">{shown.length} incidents · {stats.open} open</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatMini label="Total Incidents" value={stats.total}     color="text-slate-100" />
        <StatMini label="Open"            value={stats.open}      color={stats.open > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <StatMini label="Critical"        value={stats.critical}  color={stats.critical > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'} />
        <StatMini label="Est. Impact"     value={'SAR ' + (stats.totalCost / 1000).toFixed(0) + 'k'} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={incidentFilter.search} onChange={e => setIncidentFilter('search', e.target.value)}
            placeholder="Search incident…"
            className="bg-helm-800 border border-helm-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-40" />
        </div>

        {/* Severity */}
        <div className="flex items-center gap-1">
          {[['all','All'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']].map(([v, l]) => (
            <button key={v} onClick={() => setIncidentFilter('severity', v)}
              className={`px-2.5 py-1.5 text-[9px] font-bold tracking-wider rounded-lg border transition-all
                ${incidentFilter.severity === v ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-helm-800 text-slate-500 border-helm-600 hover:text-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Status */}
        <select value={incidentFilter.status} onChange={e => setIncidentFilter('status', e.target.value)}
          className="bg-helm-800 border border-helm-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
          <option value="all">All Statuses</option>
          {['open','investigating','resolved','closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {/* Type */}
        <select value={incidentFilter.type} onChange={e => setIncidentFilter('type', e.target.value)}
          className="bg-helm-800 border border-helm-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
          <option value="all">All Types</option>
          {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Incident list */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-helm-600 rounded-2xl">
          <AlertOctagon className="w-10 h-10 text-helm-600 mb-3" />
          <p className="text-slate-500 text-sm">No incidents match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shown.map(inc => <IncidentCard key={inc.id} inc={inc} />)}
        </div>
      )}
    </div>
  )
}
