import { useState } from 'react'
import {
  Navigation, Search, MapPin, Clock, Fuel, AlertTriangle,
  ChevronRight, CheckCircle2, Route, Zap,
} from 'lucide-react'
import useOperationsStore from '../../store/operationsStore'
import { StatMini, RoutRiskBadge, relTime } from '../../components/operations/OperationsBadges'
import { SA_ROUTES } from '../../api/mock/operationsData'

const STATUS_CFG = {
  active:     { cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20',  label: 'ACTIVE'     },
  in_transit: { cls: 'text-sky-400    bg-sky-500/10    border-sky-500/20',    label: 'IN TRANSIT' },
  completed:  { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'COMPLETED' },
  pending:    { cls: 'text-slate-400  bg-slate-500/10  border-slate-500/20',  label: 'PENDING'    },
}

function RouteCard({ ra, onSelect, selected }) {
  const { route } = ra
  const sCfg = STATUS_CFG[ra.status] ?? STATUS_CFG.pending
  const pct  = Math.round((ra.distanceCovered / route.distance) * 100)
  return (
    <div
      onClick={() => onSelect(ra.assignmentId)}
      className={`bg-helm-800 border rounded-xl p-4 cursor-pointer transition-all hover:border-helm-500
        ${selected ? 'border-amber-500/50 bg-amber-500/5' : 'border-helm-600'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12.5px] text-amber-400 font-bold">{ra.assignmentId}</span>
            <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 border rounded-md ${sCfg.cls}`}>{sCfg.label}</span>
          </div>
          <div className="text-xs font-semibold text-slate-200">{route.name}</div>
        </div>
        <RoutRiskBadge risk={route.risk} />
      </div>

      {/* Route visual */}
      <div className="flex items-center gap-2 my-2.5">
        <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <div className="flex-1 relative">
          <div className="h-0.5 bg-helm-700 rounded-full" />
          <div className="absolute top-0 left-0 h-0.5 bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          {ra.status === 'active' && (
            <div className="absolute top-0 -translate-y-1/2 h-3 w-3 rounded-full bg-amber-500 border-2 border-helm-900 shadow-amber-glow-sm transition-all" style={{ left: `${pct}%` }} />
          )}
        </div>
        <div className="w-2 h-2 rounded-full bg-sky-500" />
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-600 mb-3">
        <span className="truncate max-w-[110px]">{route.origin}</span>
        <span className="text-amber-400 font-mono">{route.distance} km</span>
        <span className="truncate max-w-[110px] text-right">{route.dest}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[12.5px]">
        <div className="bg-helm-750 rounded-lg px-2 py-1.5 text-center">
          <div className="text-slate-600">Duration</div>
          <div className="font-mono text-slate-200">{route.estHours}h</div>
        </div>
        <div className="bg-helm-750 rounded-lg px-2 py-1.5 text-center">
          <div className="text-slate-600">Progress</div>
          <div className="font-mono text-slate-200">{pct}%</div>
        </div>
        <div className="bg-helm-750 rounded-lg px-2 py-1.5 text-center">
          <div className="text-slate-600">Shipment</div>
          <div className="font-mono text-amber-400">{ra.shipmentId}</div>
        </div>
      </div>
    </div>
  )
}

function RouteDetailPanel({ ra, onClose }) {
  const { route } = ra
  const pct = Math.round((ra.distanceCovered / route.distance) * 100)
  const remaining = route.distance - ra.distanceCovered
  const etaHours = ((remaining / route.distance) * route.estHours).toFixed(1)

  return (
    <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-helm-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-amber-400 font-mono">{ra.assignmentId}</div>
            <div className="text-sm font-bold text-white mt-0.5">{route.name}</div>
          </div>
          <RoutRiskBadge risk={route.risk} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-[12.5px] mb-2">
            <span className="text-slate-500">Route Progress</span>
            <span className="font-mono text-amber-400">{ra.distanceCovered.toLocaleString()} / {route.distance} km</span>
          </div>
          <div className="h-3 bg-helm-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-slate-600">
            <span>{route.origin}</span>
            <span>{pct}% complete</span>
            <span>{route.dest}</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Total Distance',  v: route.distance + ' km',        icon: Route },
            { l: 'Est. Duration',   v: route.estHours + ' hours',     icon: Clock },
            { l: 'Remaining',       v: remaining.toLocaleString() + ' km', icon: Navigation },
            { l: 'ETA Remaining',   v: etaHours + ' hours',           icon: Clock },
            { l: 'Fuel Consumed',   v: ra.fuelConsumed + ' L',        icon: Fuel  },
            { l: 'Road',            v: route.road,                    icon: MapPin },
          ].map(({ l, v, icon: Icon }) => (
            <div key={l} className="flex items-center gap-2.5 bg-helm-750 border border-helm-700 rounded-lg px-3 py-2.5">
              <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <div>
                <div className="text-[9px] text-slate-600">{l}</div>
                <div className="text-xs font-semibold text-slate-200">{v}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest">Assignment</div>
          {[
            { l: 'Driver',   v: ra.driverName, cls: 'text-slate-200' },
            { l: 'Vehicle',  v: ra.vehicleId,  cls: 'text-amber-400 font-mono' },
            { l: 'Shipment', v: ra.shipmentId, cls: 'text-sky-400 font-mono'   },
          ].map(({ l, v, cls }) => (
            <div key={l} className="flex justify-between bg-helm-750 border border-helm-700 rounded-lg px-3 py-2 text-xs">
              <span className="text-slate-500">{l}</span>
              <span className={cls}>{v}</span>
            </div>
          ))}
        </div>

        {/* Route alerts */}
        {route.risk !== 'low' && (
          <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs
            ${route.risk === 'high' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Route Risk: {route.risk.toUpperCase()}</div>
              <div className="text-[12.5px] mt-0.5 opacity-80">
                {route.risk === 'high' ? 'Remote area — limited support facilities. Satellite communication recommended.' : 'Monitor for road conditions and weather advisories along this corridor.'}
              </div>
            </div>
          </div>
        )}
        {route.toll && (
          <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            Toll road — ensure Sayer account is loaded
          </div>
        )}
      </div>
    </div>
  )
}

function RouteCalculator() {
  const [origin, setOrigin] = useState('')
  const [dest, setDest]     = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const match = SA_ROUTES.find(r =>
      (r.origin.toLowerCase().includes(origin.toLowerCase()) && r.dest.toLowerCase().includes(dest.toLowerCase())) ||
      (r.dest.toLowerCase().includes(origin.toLowerCase()) && r.origin.toLowerCase().includes(dest.toLowerCase()))
    )
    if (match) {
      setResult({ ...match, calculated: true })
    } else {
      const mockDist = Math.floor(Math.random() * 1500 + 50)
      setResult({ name: `${origin} → ${dest}`, distance: mockDist, estHours: (mockDist / 100).toFixed(1), road: 'Calculated', risk: 'medium', toll: false, calculated: true, mock: true })
    }
  }

  return (
    <div className="bg-helm-800 border border-helm-600 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-bold text-slate-200">Route Calculator</span>
      </div>
      <div className="space-y-2">
        <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin (e.g. Riyadh)"
          className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40" />
        <input value={dest} onChange={e => setDest(e.target.value)} placeholder="Destination (e.g. Jeddah)"
          className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40" />
        <button onClick={calculate}
          className="w-full py-2 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-all">
          Calculate Route
        </button>
      </div>
      {result && (
        <div className="mt-3 pt-3 border-t border-helm-700 animate-fade-in space-y-1.5">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest">Result{result.mock ? ' (estimated)' : ''}</div>
          {[
            { l: 'Route',    v: result.name ?? result.road },
            { l: 'Distance', v: result.distance + ' km' },
            { l: 'Est. Time',v: result.estHours + ' hours' },
            { l: 'Road',     v: result.road || '—' },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between text-[11px]">
              <span className="text-slate-500">{l}</span>
              <span className="text-slate-200 font-mono">{v}</span>
            </div>
          ))}
          {result.risk && <RoutRiskBadge risk={result.risk} />}
        </div>
      )}
    </div>
  )
}

export default function RoutePlanning() {
  const { filteredRoutes, routeFilter, setRouteFilter, routeAssignments } = useOperationsStore()
  const [selectedId, setSelectedId] = useState(null)
  const shown    = filteredRoutes()
  const selected = routeAssignments.find(r => r.assignmentId === selectedId)

  const stats = {
    total:    routeAssignments.length,
    active:   routeAssignments.filter(r => r.status === 'active').length,
    distance: routeAssignments.reduce((a, r) => a + r.route.distance, 0),
    highRisk: routeAssignments.filter(r => r.route.risk === 'high').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Navigation className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Route Planning</h2>
          <p className="text-[11px] text-slate-500">{stats.active} active routes · {stats.total} total assignments</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatMini label="Assignments"  value={stats.total}              color="text-slate-100" />
        <StatMini label="Active"       value={stats.active}            color="text-amber-400" />
        <StatMini label="Total Distance" value={(stats.distance / 1000).toFixed(0) + 'k km'} color="text-sky-400" />
        <StatMini label="High Risk"    value={stats.highRisk}          color={stats.highRisk > 0 ? 'text-red-400' : 'text-emerald-400'} />
      </div>

      <div className="grid grid-cols-3 gap-4 items-start">
        {/* Left: Route list + calculator */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input value={routeFilter.search} onChange={e => setRouteFilter('search', e.target.value)}
                placeholder="Search route or shipment…"
                className="w-full bg-helm-800 border border-helm-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40" />
            </div>
            {[['all','All'],['active','Active'],['completed','Done'],['pending','Pending']].map(([v,l]) => (
              <button key={v} onClick={() => setRouteFilter('status', v)}
                className={`px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all
                  ${routeFilter.status === v ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-helm-800 text-slate-500 border-helm-600 hover:text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {shown.map(ra => (
              <RouteCard key={ra.assignmentId} ra={ra} selected={selectedId === ra.assignmentId} onSelect={setSelectedId} />
            ))}
          </div>
        </div>

        {/* Right: Detail or calculator */}
        <div className="space-y-4">
          {selected
            ? <RouteDetailPanel ra={selected} onClose={() => setSelectedId(null)} />
            : <div className="bg-helm-800 border border-dashed border-helm-600 rounded-xl p-8 text-center mb-4">
                <Navigation className="w-8 h-8 text-helm-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Click a route card for details</p>
              </div>
          }
          <RouteCalculator />
        </div>
      </div>
    </div>
  )
}
