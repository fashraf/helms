import { useState } from 'react'
import { Users, Search, Phone, Mail, Truck, Package, X, ChevronRight, Star } from 'lucide-react'
import useOperationsStore from '../../store/operationsStore'
import { DriverStatusBadge, ScoreRing, StatMini, relTime } from '../../components/operations/OperationsBadges'

function DriverDetailPanel({ driver, onClose }) {
  if (!driver) return null
  const p = driver.performance
  const metrics = [
    { label: 'On-Time Rate',    value: p.onTimeRate + '%',             color: p.onTimeRate >= 95 ? 'text-emerald-400' : p.onTimeRate >= 85 ? 'text-amber-400' : 'text-red-400' },
    { label: 'Safety Score',    value: p.safetyScore + '/100',         color: p.safetyScore >= 90 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Customer Rating', value: '★ ' + p.customerRating,       color: 'text-amber-400' },
    { label: 'Distance / Month',value: p.distanceThisMonth.toLocaleString() + ' km', color: 'text-sky-400' },
    { label: 'Incidents (FY)',  value: p.incidentsFY,                  color: p.incidentsFY === 0 ? 'text-emerald-400' : p.incidentsFY > 2 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Deliveries Done', value: p.shipmentsCompleted,           color: 'text-slate-200' },
  ]
  return (
    <div className="w-[320px] flex-shrink-0 bg-helm-900 border-l border-helm-700 flex flex-col overflow-hidden animate-slide-in">
      <div className="px-4 py-3 border-b border-helm-700 flex items-start justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm font-black text-amber-400">
            {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{driver.name}</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12.5px] text-slate-500">{driver.id}</span>
              <DriverStatusBadge status={driver.status} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Score */}
        <div className="flex items-center gap-4 bg-helm-800 border border-helm-700 rounded-xl p-4">
          <ScoreRing score={driver.overallScore} />
          <div>
            <div className="text-[9px] text-slate-600 uppercase tracking-widest">Overall Score</div>
            <div className="text-sm font-black text-slate-100 mt-0.5">
              {driver.overallScore >= 90 ? 'Excellent' : driver.overallScore >= 75 ? 'Good' : 'Needs Improvement'}
            </div>
            <div className="text-[12.5px] text-slate-500 mt-0.5">{driver.experience} experience</div>
          </div>
        </div>

        {/* Performance metrics */}
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Performance Metrics</div>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map(({ label, value, color }) => (
              <div key={label} className="bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                <div className="text-[9px] text-slate-600">{label}</div>
                <div className={`text-xs font-semibold font-mono mt-0.5 ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact + details */}
        <div className="space-y-2">
          {[
            { icon: Phone, label: driver.phone,         color: 'text-sky-400'   },
            { icon: Mail,  label: driver.email,         color: 'text-slate-400' },
            { icon: Truck, label: driver.assignedVehicle ?? 'No vehicle assigned', color: 'text-amber-400' },
            { icon: Package, label: driver.assignedShipment ?? 'No active shipment', color: 'text-purple-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2.5 bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
              <span className="text-xs text-slate-300 truncate font-mono">{label}</span>
            </div>
          ))}
        </div>

        {/* License */}
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">License</div>
          <div className="bg-helm-800 border border-helm-700 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Type</span>
              <span className="text-slate-200 font-medium">{driver.licenseType}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Number</span>
              <span className="font-mono text-amber-400">{driver.licenseNo}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Base</span>
              <span className="text-slate-300">{driver.baseLocation}</span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Recent Activity</div>
          <div className="space-y-1.5">
            {driver.recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-helm-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-300">{a.action} — <span className="font-mono text-amber-400/80">{a.ref}</span></div>
                  <div className="text-[9px] text-slate-600">{a.location} · {relTime(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Drivers() {
  const { filteredDrivers, driverFilter, setDriverFilter, selectedDriverId, selectDriver, drivers } = useOperationsStore()
  const filtered = filteredDrivers()
  const selected = drivers.find(d => d.id === selectedDriverId)

  const stats = {
    total:    drivers.length,
    onDuty:   drivers.filter(d => d.status === 'on_duty').length,
    available:drivers.filter(d => d.status === 'available').length,
    avgScore: Math.round(drivers.reduce((a, d) => a + d.overallScore, 0) / drivers.length),
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-128px)]">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden space-y-4">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Driver Management</h2>
              <p className="text-[11px] text-slate-500">{filtered.length} of {stats.total} drivers</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <StatMini label="Total Drivers" value={stats.total}     color="text-slate-100" />
          <StatMini label="On Duty"       value={stats.onDuty}   color="text-emerald-400" />
          <StatMini label="Available"     value={stats.available} color="text-sky-400" />
          <StatMini label="Avg Score"     value={stats.avgScore}  color="text-amber-400" sub="Performance" />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={driverFilter.search} onChange={e => setDriverFilter('search', e.target.value)}
              placeholder="Search driver…"
              className="bg-helm-800 border border-helm-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-44" />
          </div>
          {[['all','All'],['on_duty','On Duty'],['available','Available'],['off_duty','Off Duty']].map(([v, l]) => (
            <button key={v} onClick={() => setDriverFilter('status', v)}
              className={`px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all
                ${driverFilter.status === v ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-helm-800 text-slate-500 border-helm-600 hover:text-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(d => (
              <div key={d.id}
                onClick={() => selectDriver(selectedDriverId === d.id ? null : d.id)}
                className={`bg-helm-800 border rounded-xl p-4 cursor-pointer transition-all hover:border-helm-500
                  ${selectedDriverId === d.id ? 'border-amber-500/50 bg-amber-500/5' : 'border-helm-600'}`}>
                <div className="flex items-start gap-3">
                  <ScoreRing score={d.overallScore} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-200 truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12.5px] text-slate-600">{d.id}</span>
                      <DriverStatusBadge status={d.status} />
                    </div>
                    <div className="text-[12.5px] text-slate-500 mt-1">{d.licenseType}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[
                    { l: 'On-Time', v: d.performance.onTimeRate + '%' },
                    { l: 'Deliveries', v: d.performance.shipmentsCompleted },
                    { l: 'Distance', v: (d.performance.distanceThisMonth / 1000).toFixed(0) + 'k' },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-helm-750 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[9px] text-slate-600">{l}</div>
                      <div className="text-[11px] font-mono font-bold text-slate-200">{v}</div>
                    </div>
                  ))}
                </div>
                {d.assignedShipment && (
                  <div className="mt-2 flex items-center gap-1.5 text-[12.5px]">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span className="font-mono text-amber-400">{d.assignedShipment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {selected && <DriverDetailPanel driver={selected} onClose={() => selectDriver(null)} />}
    </div>
  )
}
