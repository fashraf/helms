// Purchase Order List · /po
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Search, Filter, X, Calendar, TrendingUp, DollarSign,
  AlertCircle, CheckCircle2, Clock, ChevronRight, Building2, Hash,
} from 'lucide-react'
import usePoStore from '../../store/poStore'
import Select2 from '../../components/ui/Select2'
import {
  PO_TYPES, PO_STAGES, PAYMENT_STATUS_CFG,
  poPaymentStatus, nextUnpaid, daysUntilNextPayment, totalPaidFor,
} from '../../api/mock/poData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtMoney = (n) => (n ?? 0).toLocaleString()
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'

export default function POList() {
  const { pos } = usePoStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [payStatusFilter, setPayStatusFilter] = useState('all')

  const filtered = useMemo(() => pos.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (stageFilter !== 'all' && p.currentStage !== stageFilter) return false
    if (vendorFilter !== 'all' && p.vendorId !== vendorFilter) return false
    if (payStatusFilter !== 'all' && poPaymentStatus(p) !== payStatusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.id.toLowerCase().includes(q)
        || (p.vendorName ?? '').toLowerCase().includes(q)
        || (p.referenceNumber ?? '').toLowerCase().includes(q)
    }
    return true
  }), [pos, search, typeFilter, stageFilter, vendorFilter, payStatusFilter])

  const stats = useMemo(() => {
    const total = pos.length
    const totalValue = pos.reduce((s, p) => s + p.totalAmount, 0)
    const overdue = pos.filter(p => poPaymentStatus(p) === 'overdue').length
    const upcoming = pos.filter(p => poPaymentStatus(p) === 'upcoming').length
    const closed = pos.filter(p => p.currentStage === 'closed').length
    return { total, totalValue, overdue, upcoming, closed }
  }, [pos])

  const vendors = useMemo(() => {
    const map = {}
    pos.forEach(p => { map[p.vendorId] = p.vendorName })
    return Object.entries(map).map(([id, name]) => ({ id, label: name }))
  }, [pos])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <FileText className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Purchase Orders</h2>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Supplier POs · payment milestones · lifecycle tracking</p>
          </div>
        </div>
        <button onClick={() => navigate('/po/create')}
          className="px-3.5 py-2 text-xs font-bold rounded-lg text-white flex items-center gap-1.5" style={{ background:'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Create Purchase Order
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total POs"      value={stats.total}                       icon={FileText}     color="var(--text)" />
        <StatCard label="Total Value"    value={`SAR ${fmtMoney(stats.totalValue)}`} icon={DollarSign} color="var(--primary)" small mono />
        <StatCard label="Overdue"        value={stats.overdue}                     icon={AlertCircle}  color="var(--danger)" highlight={stats.overdue > 0} />
        <StatCard label="Upcoming"       value={stats.upcoming}                    icon={Clock}        color="var(--warning)" />
        <StatCard label="Closed"         value={stats.closed}                      icon={CheckCircle2} color="var(--success)" />
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO number, vendor, reference…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={typeFilter} onChange={v => setTypeFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Types' }, ...PO_TYPES.map(t => ({ id: t.id, label: t.label }))]} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={stageFilter} onChange={v => setStageFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Stages' }, ...PO_STAGES.map(s => ({ id: s.id, label: s.label }))]} />
        </div>
        <div className="w-52">
          <Select2 size="sm" value={vendorFilter} onChange={v => setVendorFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Vendors' }, ...vendors]} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={payStatusFilter} onChange={v => setPayStatusFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Pay Status' }, ...Object.entries(PAYMENT_STATUS_CFG).map(([k, cfg]) => ({ id: k, label: cfg.label }))]} />
        </div>
        {(typeFilter !== 'all' || stageFilter !== 'all' || vendorFilter !== 'all' || payStatusFilter !== 'all' || search) && (
          <button onClick={() => { setTypeFilter('all'); setStageFilter('all'); setVendorFilter('all'); setPayStatusFilter('all'); setSearch('') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* PO table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['PO Number','Vendor','Type','Amount','Created','Stage','Next Payment','Pay Status','Days Rem.',''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center" style={{ color:'var(--text3)' }}>
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No purchase orders match these filters</p>
                </td></tr>
              ) : filtered.map(p => {
                const typeCfg = PO_TYPES.find(t => t.id === p.type)
                const stageCfg = PO_STAGES.find(s => s.id === p.currentStage)
                const next = nextUnpaid(p)
                const daysRem = daysUntilNextPayment(p)
                const payStatus = poPaymentStatus(p)
                const payCfg = PAYMENT_STATUS_CFG[payStatus]
                return (
                  <tr key={p.id} className="cursor-pointer transition-colors"
                    onClick={() => navigate(`/po/${p.id}`)}
                    style={{ borderTop:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="px-3 py-2.5 font-mono font-bold" style={{ color:'var(--primary)' }}>{p.id}</td>
                    <td className="px-3 py-2.5" style={{ color:'var(--text)' }}>
                      <div className="font-bold">{p.vendorName}</div>
                      <div className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{p.referenceNumber || '—'}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${typeCfg?.color}15`, color: typeCfg?.color }}>
                        <span>{typeCfg?.icon}</span>{typeCfg?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold" style={{ color:'var(--text)' }}>{p.currency} {fmtMoney(p.totalAmount)}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color:'var(--text2)' }}>{fmtDate(p.creationDate)}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${stageCfg?.color}15`, color: stageCfg?.color }}>
                        <span>{stageCfg?.icon}</span>{stageCfg?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px]" style={{ color:'var(--text2)' }}>
                      {next ? (
                        <div>
                          <div className="font-bold">{next.label}</div>
                          <div className="font-mono" style={{ color:'var(--text3)' }}>{fmtMoney(p.totalAmount * next.percentage / 100)} {p.currency}</div>
                        </div>
                      ) : <span style={{ color:'var(--success)' }}>All Paid</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: payCfg.bg, color: payCfg.c }}>{payCfg.label}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-center" style={{ color: daysRem == null ? 'var(--text3)' : daysRem < 0 ? 'var(--danger)' : daysRem < 7 ? 'var(--warning)' : 'var(--text2)' }}>
                      {daysRem == null ? '—' : daysRem < 0 ? `${Math.abs(daysRem)}d overdue` : `${daysRem}d`}
                    </td>
                    <td className="px-3 py-2.5">
                      <ChevronRight className="w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, small, mono, highlight }) {
  return (
    <div className="rounded-xl border p-3" style={{ ...C, borderLeft: `3px solid ${color}`, background: highlight ? `${color}10` : 'var(--card)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className={`${small ? 'text-sm' : 'text-xl'} font-black ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</div>
    </div>
  )
}
