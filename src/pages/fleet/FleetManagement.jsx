import { useState } from 'react'
import {
  Truck, Search, X, ChevronRight, Fuel, MapPin, User, Calendar,
  AlertTriangle, CheckCircle2, Settings, History, FileText, Zap,
} from 'lucide-react'
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts'
import useOperationsStore from '../../store/operationsStore'
import {
  VehicleStatusBadge, FuelGauge, StatMini, relTime,
} from '../../components/operations/OperationsBadges'
import { VEHICLE_TYPES } from '../../api/mock/operationsData'

function VehicleDetailPanel({ vehicle, onClose }) {
  const [tab, setTab] = useState('overview')
  const { updateVehicleStatus } = useOperationsStore()
  if (!vehicle) return null

  const expiry = (iso) => {
    const d = new Date(iso)
    const daysLeft = Math.floor((d - Date.now()) / 86400000)
    const color = daysLeft < 30 ? 'text-red-400' : daysLeft < 90 ? 'text-amber-400' : 'text-emerald-400'
    return <span className={`font-mono text-xs ${color}`}>{d.toLocaleDateString('en-SA', { year: '2-digit', month: 'short', day: 'numeric' })} ({daysLeft}d)</span>
  }

  return (
    <div className="w-[340px] flex-shrink-0 bg-helm-900 border-l border-helm-700 flex flex-col overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-helm-700 flex items-start justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-black text-amber-400">{vehicle.id}</span>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          <p className="text-xs text-slate-300 font-semibold">{vehicle.model}</p>
          <p className="text-[12.5px] text-slate-500">{vehicle.type} · {vehicle.year}</p>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-200 transition-colors mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-helm-700 flex-shrink-0">
        {[['overview','Overview'],['fuel','Fuel'],['service','Service'],['docs','Docs']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[12.5px] font-bold tracking-wider transition-colors
              ${tab === t ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-600 hover:text-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'overview' && (
          <>
            {/* Key stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Mileage',    v: vehicle.mileage.toLocaleString() + ' km' },
                { l: 'Payload',    v: vehicle.payload                           },
                { l: 'Fuel Type',  v: vehicle.fuelType                          },
                { l: 'Incidents',  v: vehicle.incidents, color: vehicle.incidents > 2 ? 'text-amber-400' : 'text-emerald-400' },
              ].map(({ l, v, color }) => (
                <div key={l} className="bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">{l}</div>
                  <div className={`text-xs font-semibold font-mono ${color ?? 'text-slate-200'}`}>{v}</div>
                </div>
              ))}
            </div>

            {/* Fuel */}
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Fuel Level</div>
              <FuelGauge level={vehicle.fuelLevel} />
            </div>

            {/* Assignment */}
            <div className="space-y-2">
              {vehicle.assignedDriver && (
                <div className="flex items-center gap-2 bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                  <User className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] text-slate-600">Assigned Driver</div>
                    <div className="text-xs text-slate-200 font-mono">{vehicle.assignedDriver}</div>
                  </div>
                </div>
              )}
              {vehicle.assignedShipment && (
                <div className="flex items-center gap-2 bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                  <Truck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] text-slate-600">Active Shipment</div>
                    <div className="text-xs font-mono text-amber-400">{vehicle.assignedShipment}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-600">Current Location</div>
                  <div className="text-xs text-slate-200 truncate">{vehicle.currentLocation}</div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Schedule PM', action: () => updateVehicleStatus(vehicle.id, 'maintenance'), cls: 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10' },
                  { label: 'Set Active',  action: () => updateVehicleStatus(vehicle.id, 'active'),      cls: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' },
                ].map(({ label, action, cls }) => (
                  <button key={label} onClick={action} className={`py-1.5 text-[12.5px] font-semibold border rounded-lg transition-all ${cls}`}>{label}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'fuel' && (
          <div className="space-y-4">
            <div className="h-32">
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">14-Day Fuel History</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vehicle.fuelHistory} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                  <Line type="monotone" dataKey="level" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  <Tooltip contentStyle={{ background: '#141f30', border: '1px solid #1d2d42', borderRadius: '8px', fontSize: '10px' }}
                    formatter={(v) => [v + '%', 'Fuel']} labelFormatter={(l) => l} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Current',   v: vehicle.fuelLevel + '%' },
                { l: 'Capacity',  v: vehicle.fuelCapacity + (vehicle.fuelType === 'Electric' ? 'kWh' : 'L') },
                { l: 'Avg/Day',   v: Math.round(vehicle.fuelCapacity * 0.08) + (vehicle.fuelType === 'Electric' ? 'kWh' : 'L') },
                { l: 'Cost/km',   v: vehicle.fuelType === 'Electric' ? '0.12 SAR' : '0.38 SAR' },
              ].map(({ l, v }) => (
                <div key={l} className="bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                  <div className="text-[9px] text-slate-600">{l}</div>
                  <div className="text-xs font-mono font-semibold text-slate-200">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'service' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: 'Last Service', v: relTime(vehicle.lastService) },
                { l: 'Next Service', v: relTime(vehicle.nextService) },
              ].map(({ l, v }) => (
                <div key={l} className="bg-helm-800 border border-helm-700 rounded-lg px-3 py-2">
                  <div className="text-[9px] text-slate-600">{l}</div>
                  <div className="text-xs font-mono text-slate-200">{v}</div>
                </div>
              ))}
            </div>
            {vehicle.serviceHistory.map((s, i) => (
              <div key={i} className="bg-helm-800 border border-helm-700 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-slate-200">{s.type}</span>
                  <span className="text-[12.5px] text-amber-400 font-mono">{s.cost.toLocaleString()} SAR</span>
                </div>
                <div className="text-[12.5px] text-slate-500">{s.tech} · {relTime(s.date)}</div>
                <div className="text-[12.5px] text-slate-600 mt-0.5">{s.notes}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'docs' && (
          <div className="space-y-2">
            {Object.entries(vehicle.documents).map(([type, date]) => (
              <div key={type} className="flex items-center justify-between bg-helm-800 border border-helm-700 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-xs font-semibold text-slate-200 capitalize">{type.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-[12.5px] text-slate-500">Expires: {expiry(date)}</div>
                </div>
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
            ))}
            <div className="mt-2">
              <div className="text-[9px] text-slate-600 mb-1">License Plate</div>
              <div className="font-mono text-sm text-amber-400 bg-helm-800 border border-helm-700 rounded-lg px-3 py-2 text-center">
                {vehicle.licensePlate}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FleetManagement() {
  const { filteredVehicles, vehicleFilter, setVehicleFilter, selectedVehicleId, selectVehicle, vehicles } = useOperationsStore()
  const filtered  = filteredVehicles()
  const selected  = vehicles.find((v) => v.id === selectedVehicleId)

  const stats = {
    total:       vehicles.length,
    active:      vehicles.filter((v) => v.status === 'active').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
    idle:        vehicles.filter((v) => v.status === 'idle').length,
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-128px)]">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Truck className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Fleet Management</h2>
              <p className="text-[11px] text-slate-500">{filtered.length} of {stats.total} vehicles</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <StatMini label="Total Fleet"  value={stats.total}       color="text-slate-100" />
          <StatMini label="Active"       value={stats.active}      color="text-emerald-400" sub="On route or assigned" />
          <StatMini label="Maintenance"  value={stats.maintenance} color="text-amber-400"  sub="In service" />
          <StatMini label="Idle"         value={stats.idle}        color="text-slate-400"  sub="Available" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={vehicleFilter.search} onChange={(e) => setVehicleFilter('search', e.target.value)}
              placeholder="Search ID or model…"
              className="bg-helm-800 border border-helm-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-44" />
          </div>
          {/* Status pills */}
          {[['all','All'],['active','Active'],['idle','Idle'],['maintenance','Service']].map(([v, l]) => (
            <button key={v} onClick={() => setVehicleFilter('status', v)}
              className={`px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all
                ${vehicleFilter.status === v ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-helm-800 text-slate-500 border-helm-600 hover:text-slate-300'}`}>
              {l}
            </button>
          ))}
          <select value={vehicleFilter.type} onChange={(e) => setVehicleFilter('type', e.target.value)}
            className="bg-helm-800 border border-helm-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
            <option value="all">All Types</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-helm-800 border border-helm-600 rounded-xl">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-helm-700 bg-helm-850/60 sticky top-0 z-10">
              <tr>
                {['Unit ID','Model / Type','Status','Location','Fuel','Driver','Next Service',''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-helm-700/40">
              {filtered.map((v) => (
                <tr key={v.id} onClick={() => selectVehicle(selectedVehicleId === v.id ? null : v.id)}
                  className={`cursor-pointer transition-colors hover:bg-helm-750/50 ${selectedVehicleId === v.id ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-amber-400">{v.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-slate-200">{v.model}</div>
                    <div className="text-[12.5px] text-slate-500">{v.type}</div>
                  </td>
                  <td className="px-4 py-3"><VehicleStatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 truncate block max-w-[140px]">{v.currentLocation}</span>
                  </td>
                  <td className="px-4 py-3"><FuelGauge level={v.fuelLevel} compact /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-400">{v.assignedDriver ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12.5px] text-slate-500 font-mono">{relTime(v.nextService)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedVehicleId === v.id ? 'rotate-90 text-amber-400' : 'text-slate-700'}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && <VehicleDetailPanel vehicle={selected} onClose={() => selectVehicle(null)} />}
    </div>
  )
}
