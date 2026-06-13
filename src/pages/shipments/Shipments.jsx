import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, Plus, X, ChevronUp, ChevronDown, ChevronsUpDown,
  Package, SlidersHorizontal, RefreshCw, Download,
} from 'lucide-react'
import useShipmentStore from '../../store/shipmentStore'
import { REGIONS } from '../../api/mock/shipmentData'
import {
  StatusBadge, TypeBadge, PriorityBadge, RiskScore, ETADisplay,
} from '../../components/shipments/ShipmentBadges'

const STATUS_OPTIONS = [
  { value: 'all',        label: 'All Statuses' },
  { value: 'pending',    label: 'Pending'       },
  { value: 'in_transit', label: 'In Transit'    },
  { value: 'delivered',  label: 'Delivered'     },
  { value: 'delayed',    label: 'Delayed'       },
  { value: 'on_hold',    label: 'On Hold'       },
]
const TYPE_OPTIONS = [
  { value: 'all',           label: 'All Types'     },
  { value: 'local',         label: 'Local'         },
  { value: 'international', label: 'International' },
]

const COLUMNS = [
  { key: 'id',              label: 'Shipment ID',   sortable: true,  width: 'w-[110px]'  },
  { key: 'customer',        label: 'Customer',      sortable: true,  width: 'w-[150px]'  },
  { key: 'type',            label: 'Type',          sortable: true,  width: 'w-[110px]'  },
  { key: 'status',          label: 'Status',        sortable: true,  width: 'w-[120px]'  },
  { key: 'priority',        label: 'Priority',      sortable: true,  width: 'w-[100px]'  },
  { key: 'currentLocation', label: 'Current Location', sortable: false, width: 'flex-1'  },
  { key: 'eta',             label: 'ETA',           sortable: true,  width: 'w-[120px]'  },
  { key: 'riskScore',       label: 'Risk',          sortable: true,  width: 'w-[100px]'  },
]

function SortIcon({ colKey, sortKey, sortDir }) {
  if (colKey !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-slate-700" />
  return sortDir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-amber-400" />
    : <ChevronDown className="w-3 h-3 text-amber-400" />
}

export default function Shipments() {
  const navigate = useNavigate()
  const {
    filteredList, filters, setFilter, clearFilters,
    sortKey, sortDir, setSort,
  } = useShipmentStore()

  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = [
    filters.status !== 'all', filters.region !== 'all', filters.type !== 'all', !!filters.search,
  ].filter(Boolean).length

  const regionOptions = [{ value: 'all', label: 'All Regions' }, ...REGIONS.map((r) => ({ value: r, label: r }))]

  return (
    <div className="space-y-4">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Package className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Shipments</h2>
            <p className="text-[11px] text-slate-500">
              {filteredList.length} shipments {activeFilterCount > 0 ? `(filtered from ${useShipmentStore.getState().shipments.length})` : 'total'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-helm-600 hover:border-helm-500 rounded-lg text-slate-400 hover:text-slate-200 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => navigate('/shipments/create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-helm-900 rounded-lg transition-all shadow-amber-glow-sm"
          >
            <Plus className="w-4 h-4" />
            New Shipment
          </button>
        </div>
      </div>

      {/* ── Search + Filter bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search ID or customer…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="w-full bg-helm-800 border border-helm-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick status pills */}
        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.slice(0, 5).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter('status', filters.status === opt.value ? 'all' : opt.value)}
              className={`px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg transition-all
                ${filters.status === opt.value
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-helm-800 text-slate-500 border border-helm-600 hover:border-helm-500 hover:text-slate-300'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all
            ${showFilters || activeFilterCount > 0
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-helm-800 border-helm-600 text-slate-400 hover:text-slate-200 hover:border-helm-500'
            }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-helm-900 text-[9px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-[12.5px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="flex items-end gap-3 p-4 bg-helm-800 border border-helm-600 rounded-xl animate-fade-in">
          <div className="flex-1">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">Type</div>
            <select
              value={filters.type}
              onChange={(e) => setFilter('type', e.target.value)}
              className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 transition-all"
            >
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">Region</div>
            <select
              value={filters.region}
              onChange={(e) => setFilter('region', e.target.value)}
              className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 transition-all"
            >
              {regionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-helm-700 bg-helm-850/60">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left px-4 py-3 ${col.width}`}
                    onClick={col.sortable ? () => setSort(col.key) : undefined}
                  >
                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500
                      ${col.sortable ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}>
                      {col.label}
                      {col.sortable && <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-helm-700/40">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="py-16 text-center">
                    <Package className="w-10 h-10 text-helm-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No shipments match your filters</p>
                    <button onClick={clearFilters} className="mt-2 text-xs text-amber-400 hover:text-amber-300">
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredList.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="hover:bg-helm-750/50 cursor-pointer transition-colors group"
                  >
                    {/* ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                        {s.id}
                      </span>
                    </td>
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-200 truncate block max-w-[140px]">{s.customer}</span>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      <TypeBadge type={s.type} />
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <PriorityBadge priority={s.priority} />
                    </td>
                    {/* Current location */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 truncate block max-w-[180px]">{s.currentLocation}</span>
                    </td>
                    {/* ETA */}
                    <td className="px-4 py-3">
                      <ETADisplay eta={s.eta} compact />
                    </td>
                    {/* Risk */}
                    <td className="px-4 py-3">
                      <RiskScore score={s.riskScore} showBar />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-helm-700 bg-helm-850/30">
          <span className="text-[12.5px] text-slate-600 font-mono">
            Showing {filteredList.length} of {useShipmentStore.getState().shipments.length} shipments
          </span>
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
            <RefreshCw className="w-3 h-3" />
            <span className="font-mono">Live — updates every 30s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
