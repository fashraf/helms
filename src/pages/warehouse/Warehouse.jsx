import { useState } from 'react'
import { Warehouse, Package, Truck, AlertTriangle, Clock, ArrowDown, ArrowUp } from 'lucide-react'
import useOperationsStore from '../../store/operationsStore'
import { CapacityBar, CapacityLabel, StatMini, relTime } from '../../components/operations/OperationsBadges'

function WarehouseCard({ wh, selected, onClick }) {
  return (
    <div onClick={onClick} className={`bg-helm-800 border rounded-xl p-4 cursor-pointer transition-all hover:border-helm-500
      ${selected ? 'border-amber-500/50 bg-amber-500/5' : 'border-helm-600'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-bold text-slate-200">{wh.name}</div>
          <div className="text-[12.5px] text-slate-500 mt-0.5 font-mono">{wh.id}</div>
        </div>
        <CapacityLabel pct={wh.capacity} />
      </div>
      <CapacityBar pct={wh.capacity} height="h-2" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: 'Docks', v: `${wh.activeDocks}/${wh.totalDocks}` },
          { l: 'Items',  v: wh.totalItems.toLocaleString() },
          { l: 'Area',   v: (wh.usedArea/1000).toFixed(0) + 'k m²' },
        ].map(({ l, v }) => (
          <div key={l} className="bg-helm-750 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-slate-600">{l}</div>
            <div className="text-[12.5px] font-mono font-bold text-slate-200">{v}</div>
          </div>
        ))}
      </div>
      {wh.alerts.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-amber-400">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{wh.alerts[0]}</span>
        </div>
      )}
    </div>
  )
}

function DockRow({ dock }) {
  const cls = dock.status === 'loading' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : dock.status === 'unloading' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    : 'text-slate-500 bg-slate-500/5 border-slate-500/10'
  const Icon = dock.status === 'loading' ? ArrowUp : dock.status === 'unloading' ? ArrowDown : Clock
  return (
    <tr className="border-b border-helm-700/40 hover:bg-helm-750/30 transition-colors">
      <td className="px-4 py-2.5"><span className="font-mono text-[12.5px] font-bold text-slate-300">{dock.dock}</span></td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border rounded-md ${cls}`}>
          <Icon className="w-2.5 h-2.5" />
          {dock.status === 'available' ? 'AVAILABLE' : dock.status.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-2.5"><span className="font-mono text-[12.5px] text-amber-400">{dock.vehicle ?? '—'}</span></td>
      <td className="px-4 py-2.5"><span className="font-mono text-[12.5px] text-sky-400">{dock.shipment ?? '—'}</span></td>
      <td className="px-4 py-2.5"><span className="text-[12.5px] text-slate-500">{dock.startTime ? relTime(dock.startTime) : '—'}</span></td>
      <td className="px-4 py-2.5"><span className="text-[12.5px] text-slate-500">{dock.endTime ? relTime(dock.endTime) + ' (eta)' : '—'}</span></td>
    </tr>
  )
}

export default function WarehousePage() {
  const { warehouses, selectedWarehouseId, selectWarehouse, warehouseStats } = useOperationsStore()
  const stats    = warehouseStats()
  const selected = warehouses.find(w => w.id === selectedWarehouseId) ?? warehouses[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Warehouse className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Warehouse Management</h2>
          <p className="text-[11px] text-slate-500">{stats.total} sites · {stats.avgCap}% average capacity</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatMini label="Total Sites"   value={stats.total}       color="text-slate-100" />
        <StatMini label="Avg Capacity"  value={stats.avgCap + '%'} color={stats.avgCap > 85 ? 'text-red-400' : 'text-emerald-400'} />
        <StatMini label="Critical"      value={stats.critical}    color={stats.critical > 0 ? 'text-red-400' : 'text-emerald-400'} sub="Sites >90% full" />
        <StatMini label="Active Docks"  value={`${stats.activeDocks}/${stats.totalDocks}`} color="text-sky-400" />
      </div>

      {/* Warehouse cards */}
      <div className="grid grid-cols-3 gap-3">
        {warehouses.map(wh => (
          <WarehouseCard key={wh.id} wh={wh}
            selected={selected?.id === wh.id}
            onClick={() => selectWarehouse(wh.id)} />
        ))}
      </div>

      {/* Selected warehouse detail */}
      {selected && (
        <div className="grid grid-cols-2 gap-4">
          {/* Inventory */}
          <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-helm-700 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200">{selected.name} — Inventory</h3>
                <p className="text-[12.5px] text-slate-500">Manager: {selected.manager}</p>
              </div>
              <span className="text-[12.5px] font-mono text-amber-400">SAR {(selected.totalValue / 1000000).toFixed(1)}M total value</span>
            </div>
            <div className="overflow-auto max-h-56">
              <table className="w-full text-sm">
                <thead className="border-b border-helm-700 bg-helm-850/60">
                  <tr>
                    {['Category','Items','Value (SAR)','Updated'].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-helm-700/30">
                  {selected.inventory.map(item => (
                    <tr key={item.category} className="hover:bg-helm-750/30 transition-colors">
                      <td className="px-4 py-2.5"><span className="text-xs text-slate-300">{item.category}</span></td>
                      <td className="px-4 py-2.5"><span className="text-xs font-mono text-slate-200">{item.count.toLocaleString()}</span></td>
                      <td className="px-4 py-2.5"><span className="text-[12.5px] font-mono text-emerald-400">{(item.value/1000).toFixed(0)}k</span></td>
                      <td className="px-4 py-2.5"><span className="text-[12.5px] text-slate-600">{relTime(item.lastUpdated)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dock management */}
          <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-helm-700">
              <h3 className="text-xs font-bold text-slate-200">Live Dock Activity — {selected.name}</h3>
              <p className="text-[12.5px] text-slate-500">{selected.activeDocks} active of {selected.totalDocks} docks</p>
            </div>
            <div className="overflow-auto max-h-56">
              <table className="w-full">
                <thead className="border-b border-helm-700 bg-helm-850/60">
                  <tr>
                    {['Dock','Status','Vehicle','Shipment','Started','ETA'].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.dockSchedule.map(dock => <DockRow key={dock.dock} dock={dock} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
