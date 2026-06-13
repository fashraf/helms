import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Search, Plus, Filter, Download, ChevronRight, Star } from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from 'recharts'
import useVendorStore from '../../store/vendorStore'
import { VENDOR_TYPES, TRANSPORT_MODES, COUNTRIES } from '../../api/mock/vendorData'
import { SLABadge, RiskBadge, ModeBadge, StatusBadge, CountryBadge } from '../../components/vendors/VendorBadges'

const CARD_STYLE = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function StatCard({ label, value, color = 'var(--text)', sub }) {
  return (
    <div className="rounded-xl border p-4" style={CARD_STYLE}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{label}</div>
      <div className="text-2xl font-black font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function VendorRow({ vendor, onClick }) {
  return (
    <tr className="cursor-pointer transition-colors"
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <td className="px-5 py-3.5">
        <span className="font-mono text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>{vendor.id}</span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
            {vendor.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color:'var(--text)' }}>{vendor.name}</div>
            <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{vendor.hq}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs px-2 py-0.5 rounded-md border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text2)' }}>
          {vendor.type}
        </span>
      </td>
      <td className="px-5 py-3.5"><CountryBadge code={vendor.country} /></td>
      <td className="px-5 py-3.5">
        <div className="flex gap-1 flex-wrap max-w-[120px]">
          {vendor.modes.map(m => <ModeBadge key={m} mode={m} />)}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm font-bold font-mono" style={{ color:'var(--text)' }}>{vendor.active}</span>
      </td>
      <td className="px-5 py-3.5 w-36"><SLABadge sla={vendor.sla} /></td>
      <td className="px-5 py-3.5"><RiskBadge risk={vendor.risk} /></td>
      <td className="px-5 py-3.5"><StatusBadge status={vendor.status} /></td>
      <td className="px-5 py-3.5">
        <ChevronRight className="w-4 h-4" style={{ color:'var(--text3)' }} />
      </td>
    </tr>
  )
}

export default function VendorMaster() {
  const navigate = useNavigate()
  const { filteredVendors, vendorFilter, setVendorFilter, vendors } = useVendorStore()
  const [showFilters, setShowFilters] = useState(false)
  const list = filteredVendors()

  const stats = {
    total:  vendors.length,
    active: vendors.filter(v=>v.status==='active').length,
    avgSla: Math.round(vendors.reduce((a,v)=>a+v.sla,0)/vendors.length),
    active_ships: vendors.reduce((a,v)=>a+v.active,0),
  }

  const selStyle = { background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }
  const filterBtn = (active) => ({
    background: active ? 'var(--primary-light)' : 'var(--card)',
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    color: active ? 'var(--primary)' : 'var(--text2)',
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Building2 className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Vendor Master</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{list.length} vendors · Global logistics & maintenance partners</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all"
            style={{ ...CARD_STYLE, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/vendors/create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all text-white"
            style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Vendors"   value={stats.total}        color="var(--text)"    />
        <StatCard label="Active Vendors"  value={stats.active}       color="var(--success)" sub={stats.total - stats.active + ' inactive'} />
        <StatCard label="Avg SLA Score"   value={stats.avgSla + '%'} color="var(--primary)" />
        <StatCard label="Active Shipments" value={stats.active_ships} color="var(--warning)" sub="Across all vendors" />
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={vendorFilter.search} onChange={e => setVendorFilter('search',e.target.value)}
            placeholder="Search vendor name or ID…"
            className="rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-48"
            style={selStyle} />
        </div>

        {/* Status pills */}
        {[['all','All'],['active','Active'],['inactive','Inactive']].map(([v,l]) => (
          <button key={v} onClick={() => setVendorFilter('status',v)}
            className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
            style={filterBtn(vendorFilter.status===v)}>{l}</button>
        ))}

        <select value={vendorFilter.country} onChange={e=>setVendorFilter('country',e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none" style={selStyle}>
          <option value="all">All Countries</option>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
        </select>

        <select value={vendorFilter.type} onChange={e=>setVendorFilter('type',e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none" style={selStyle}>
          <option value="all">All Types</option>
          {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={vendorFilter.mode} onChange={e=>setVendorFilter('mode',e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none" style={selStyle}>
          <option value="all">All Modes</option>
          {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <button onClick={() => setVendorFilter('slaMin', vendorFilter.slaMin>0 ? 0 : 90)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold rounded-lg border transition-all"
          style={filterBtn(vendorFilter.slaMin>0)}>
          <Star className="w-3 h-3" /> SLA ≥90%
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={CARD_STYLE}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['ID','Vendor Name','Type','Country','Transport Modes','Active Shipments','SLA Score','Risk','Status',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {list.length === 0 ? (
                <tr><td colSpan={10} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No vendors match your filters</td></tr>
              ) : (
                list.map(v => (
                  <VendorRow key={v.id} vendor={v} onClick={() => navigate(`/vendors/${v.id}`)} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-t"
          style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>
            Showing {list.length} of {vendors.length} vendors
          </span>
        </div>
      </div>
    </div>
  )
}
