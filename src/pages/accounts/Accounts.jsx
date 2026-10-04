// HELMS Accounts — central finance workspace
//   Tabs:
//     1. Dashboard       — paid/unpaid invoices, receipts dew (today/week/month), shipment-progress nested grid
//     2. Sales Order List — per-SO breakdown showing vendor + invoices + receipts per shipment
import { useState, useMemo, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, Receipt, FileText, Clock, CheckCircle2, AlertCircle, Lock,
  Search, Filter, X, Download, ChevronRight, ChevronDown, Plus, Upload,
  Truck, Plane, Calendar, TrendingUp, Wallet, FileCheck, Hash, Building2, Shield,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import useFinanceStore    from '../../store/financeStore'
import useToastStore      from '../../store/toastStore'
import Select2            from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import FinanceDashboard   from './FinanceDashboard'
import CustomerOrdersTab  from './CustomerOrdersTab'
import { OVERALL_STATUS_CFG, deriveOverallStatus, LOCATION_MASTER } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) }
function fmtMoney(n) { if (n === null || n === undefined) return '—'; return n.toLocaleString() }
function daysFromNow(iso) {
  if (!iso) return null
  return Math.round((new Date(iso) - new Date()) / 86400000)
}

const STATUS_CFG = {
  pending:        { label:'Pending',        c:'var(--warning)', bg:'rgba(217,119,6,.12)' },
  partially_paid: { label:'Partially Paid', c:'var(--primary)', bg:'var(--primary-light)' },
  paid:           { label:'Paid',           c:'var(--success)', bg:'rgba(5,150,105,.12)' },
}

export default function Accounts() {
  const [activeTab, setActiveTab] = useState('finance')
  const TABS = [
    { id:'finance',  label:'Finance Dashboard', icon: TrendingUp },
    { id:'customs',  label:'Customs Queue',     icon: Shield     },
    { id:'customer', label:'Customer Orders',   icon: Building2 },
    { id:'orders',   label:'Vendor Sales Orders', icon: FileCheck },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
          <DollarSign className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Accounts</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Invoices · payments · receipts · sales orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex" style={{ borderBottom:'1px solid var(--border)' }}>
          {TABS.map(t => {
            const active = activeTab === t.id
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all relative"
                style={{
                  background: active ? 'var(--card)' : 'var(--bg2)',
                  color:      active ? 'var(--primary)' : 'var(--text2)',
                  borderRight: '1px solid var(--border)',
                }}>
                <t.icon className="w-4 h-4" />{t.label}
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'var(--primary)' }} />}
              </button>
            )
          })}
        </div>
        <div className="p-4">
          {activeTab === 'finance'  && <FinanceDashboard />}
          {activeTab === 'customs'  && <CustomsQueueTab />}
          {activeTab === 'customer' && <CustomerOrdersTab />}
          {activeTab === 'orders'   && <SalesOrdersTab />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function DashboardTab() {
  const navigate = useNavigate()
  const { localShipments } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const [expanded, setExpanded] = useState(new Set())   // expanded shipment ids
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(30)

  // Flatten all vendor invoices across all shipments
  const allInvoices = useMemo(() => {
    const out = []
    localShipments.forEach(s => {
      (s.vendorInvoices ?? []).forEach(vi => {
        out.push({ ...vi, _shipment: s })
      })
    })
    return out
  }, [localShipments])

  // KPIs
  const kpis = useMemo(() => {
    const today = new Date()
    const weekFromNow  = new Date(today.getTime() + 7  * 86400000)
    const monthFromNow = new Date(today.getTime() + 30 * 86400000)

    let totalInvoiced = 0, totalPaid = 0, totalOutstanding = 0
    let paidCount = 0, unpaidCount = 0, partiallyPaidCount = 0
    let dueToday = 0, dueThisWeek = 0, dueThisMonth = 0
    let closedCount = 0

    allInvoices.forEach(vi => {
      const paid = (vi.payments ?? []).reduce((s, p) => s + p.amount, 0)
      totalInvoiced += vi.amount
      totalPaid     += paid
      totalOutstanding += (vi.amount - paid)
      if (vi.closure) closedCount++
      if (vi.status === 'paid')           paidCount++
      else if (vi.status === 'partially_paid') partiallyPaidCount++
      else unpaidCount++

      // Receipt-due heuristic: invoiceDate + 30d payment terms (Net 30)
      if (vi.status !== 'paid' && vi.invoiceDate) {
        const due = new Date(new Date(vi.invoiceDate).getTime() + 30 * 86400000)
        if (due <= today) dueToday++             // already overdue counts as "due today"
        else if (due <= weekFromNow)  dueThisWeek++
        else if (due <= monthFromNow) dueThisMonth++
      }
    })

    return { totalInvoiced, totalPaid, totalOutstanding, paidCount, unpaidCount, partiallyPaidCount, closedCount, dueToday, dueThisWeek, dueThisMonth }
  }, [allInvoices])

  // Shipment-progress table rows
  const allMatching = useMemo(() => {
    return localShipments
      .filter(s => {
        if (statusFilter !== 'all') {
          const overall = deriveOverallStatus(s)
          if (statusFilter === 'open' && overall === 'closed') return false
          if (statusFilter === 'closed' && overall !== 'closed') return false
        }
        if (search) {
          const q = search.toLowerCase()
          const matchShip = s.id.toLowerCase().includes(q) || (s.salesOrderNumber ?? '').toLowerCase().includes(q)
          const matchInv = (s.vendorInvoices ?? []).some(vi => vi.invoiceNumber?.toLowerCase().includes(q))
          const matchVend = (s.vendorInvoices ?? []).some(vi => {
            const v = vendors?.find(x => x.id === vi.vendorId)
            return (v?.name ?? '').toLowerCase().includes(q)
          })
          if (!matchShip && !matchInv && !matchVend) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
  }, [localShipments, search, statusFilter, vendors])
  const tableRows = useMemo(() => allMatching.slice(0, pageSize), [allMatching, pageSize])
  const hasMore = allMatching.length > tableRows.length

  // Reset page size when filters change
  useEffect(() => { setPageSize(30) }, [search, statusFilter])

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  return (
    <div className="space-y-4">
      {/* Money tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Invoiced',  v:`SAR ${fmtMoney(kpis.totalInvoiced)}`,    c:'var(--text)',    icon: FileText, sub:`${allInvoices.length} invoice${allInvoices.length === 1 ? '' : 's'}` },
          { l:'Total Paid',      v:`SAR ${fmtMoney(kpis.totalPaid)}`,        c:'var(--success)', icon: CheckCircle2, sub:`${kpis.paidCount} fully paid` },
          { l:'Outstanding',     v:`SAR ${fmtMoney(kpis.totalOutstanding)}`, c:'var(--warning)', icon: Wallet, sub:`${kpis.unpaidCount + kpis.partiallyPaidCount} open` },
          { l:'Closed',          v: kpis.closedCount,                        c:'#8B5CF6',        icon: Lock, sub:'Fully reconciled' },
        ].map(({ l, v, c, icon:Icon, sub }) => (
          <div key={l} className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: c }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
            </div>
            <div className="text-xl font-black font-mono" style={{ color: c }}>{v}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Receipts due breakdown */}
      <div className="rounded-xl border p-4" style={C}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4" style={{ color:'var(--primary)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Receipts Due</h3>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>· based on Net 30 from invoice date</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l:'Due Today or Overdue', v: kpis.dueToday,    c:'var(--danger)' },
            { l:'Due This Week',         v: kpis.dueThisWeek, c:'var(--warning)' },
            { l:'Due This Month',        v: kpis.dueThisMonth,c:'var(--cyan)' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-lg p-3 text-center" style={{ background:`${c}10`, border:`1px solid ${c}30` }}>
              <div className="text-3xl font-black font-mono" style={{ color: c }}>{v}</div>
              <div className="text-[12.5px] font-bold uppercase tracking-widest mt-1" style={{ color:'var(--text2)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipment, SO, invoice #, vendor name…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatusFilter(v ?? 'all')}
            options={[{ id:'all', label:'All' }, { id:'open', label:'Open' }, { id:'closed', label:'Closed' }]} />
        </div>
      </div>

      {/* Shipment-progress nested grid */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>
            Shipment Progress & Invoice Status (showing {tableRows.length} of {allMatching.length})
          </h3>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Click a row to see invoices, receipts, and current progress</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['', 'Shipment #', 'SO', 'Vendor', 'Invoice', 'Receipt', 'Pipeline', 'Created'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color:'var(--text3)' }}>No shipments match filters</td></tr>
              ) : tableRows.map(s => {
                const vi = (s.vendorInvoices ?? [])[0]   // first invoice for headline
                const v  = vi ? vendors?.find(x => x.id === vi.vendorId) : null
                const overall = deriveOverallStatus(s)
                const overCfg = OVERALL_STATUS_CFG[overall]
                const totalPaid = (vi?.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
                const isExpanded = expanded.has(s.id)
                const statusCfg  = vi ? STATUS_CFG[vi.status] : null
                return (
                  <Fragment key={s.id}>
                    <tr onClick={() => toggleExpand(s.id)} className="cursor-pointer" style={{ borderTop:'1px solid var(--border)' }}>
                      <td className="px-3 py-2">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
                          : <ChevronRight className="w-3.5 h-3.5" style={{ color:'var(--text3)' }} />}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{s.id}</td>
                      <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{s.salesOrderNumber ?? '—'}</td>
                      <td className="px-3 py-2" style={{ color:'var(--text)' }}>{v?.name ?? '—'}</td>
                      <td className="px-3 py-2">
                        {vi
                          ? (<div className="flex items-center gap-1.5">
                              <FileText className="w-3 h-3" style={{ color:'var(--success)' }} />
                              <span className="font-mono text-[12.5px]" style={{ color:'var(--text)' }}>{vi.invoiceNumber}</span>
                              <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: statusCfg.bg, color: statusCfg.c }}>{statusCfg.label}</span>
                            </div>)
                          : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>None</span>}
                      </td>
                      <td className="px-3 py-2">
                        {(vi?.payments?.length ?? 0) > 0
                          ? <span className="inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color:'var(--success)' }}>
                              <Receipt className="w-3 h-3" />{vi.payments.length}
                            </span>
                          : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background:`${overCfg.color}15`, color: overCfg.color }}>
                          <span>{overCfg.icon}</span>{overCfg.label}
                          <span className="ml-0.5 font-mono opacity-60">{overCfg.step}/6</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.createdAt)}</td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background:'var(--bg2)' }}>
                        <td></td>
                        <td colSpan={7} className="px-3 py-3">
                          <NestedDetails shipment={s} vendors={vendors} navigate={navigate} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="px-3 py-3 flex items-center justify-between" style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)' }}>
            <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>
              {allMatching.length - tableRows.length} more shipment{(allMatching.length - tableRows.length) === 1 ? '' : 's'} hidden
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPageSize(p => p + 30)}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg border" style={{ background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }}>
                Load 30 More
              </button>
              <button onClick={() => setPageSize(allMatching.length)}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                Show All ({allMatching.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Nested expanded details (invoices + receipts + progress) ─────────────
function NestedDetails({ shipment, vendors, navigate }) {
  const invoices = shipment.vendorInvoices ?? []
  const overall = deriveOverallStatus(shipment)
  const overCfg = OVERALL_STATUS_CFG[overall]

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 md:col-span-4">
        <div className="rounded-lg border p-3" style={C}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text3)' }}>Current Progress</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[12.5px] font-bold rounded-md" style={{ background:`${overCfg.color}15`, color: overCfg.color }}>
              <span>{overCfg.icon}</span>{overCfg.label}
            </span>
            <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>Step {overCfg.step} of 6</span>
          </div>
          <div className="h-2 rounded overflow-hidden" style={{ background:'var(--border)' }}>
            <div className="h-full" style={{ width: `${(overCfg.step / 6) * 100}%`, background: overCfg.color }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[12.5px]">
            <div><span style={{ color:'var(--text3)' }}>Project: </span><span style={{ color:'var(--text)' }}>{shipment.project ?? '—'}</span></div>
            <div><span style={{ color:'var(--text3)' }}>Type: </span><span style={{ color:'var(--text)' }}>{shipment.shipmentType ?? '—'}</span></div>
            <div><span style={{ color:'var(--text3)' }}>Packed: </span><span style={{ color:'var(--text)' }}>{shipment.packedAt ? fmtDate(shipment.packedAt) : '—'}</span></div>
            <div><span style={{ color:'var(--text3)' }}>Released: </span><span style={{ color:'var(--text)' }}>{shipment.releasedAt ? fmtDate(shipment.releasedAt) : '—'}</span></div>
            <div><span style={{ color:'var(--text3)' }}>ETA: </span><span style={{ color:'var(--text)' }}>{fmtDate(shipment.eta)}</span></div>
            <div><span style={{ color:'var(--text3)' }}>Delivered: </span><span style={{ color:'var(--text)' }}>{shipment.actualDeliveryDate ? fmtDate(shipment.actualDeliveryDate) : '—'}</span></div>
          </div>
          <button onClick={() => navigate(`/shipments/local/${shipment.id}`)} className="mt-3 w-full px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border" style={{ background:'var(--card)', color:'var(--primary)' }}>
            Open Shipment Profile →
          </button>
        </div>
      </div>

      <div className="col-span-12 md:col-span-8 space-y-2">
        <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>
          Invoices & Receipts ({invoices.length} invoice{invoices.length === 1 ? '' : 's'})
        </div>
        {invoices.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center" style={{ borderColor:'var(--border2)', background:'var(--card)' }}>
            <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>No vendor invoices yet · use the shipment Accounts tab to submit one</span>
          </div>
        ) : invoices.map(vi => {
          const v = vendors?.find(x => x.id === vi.vendorId)
          const totalPaid = (vi.payments ?? []).reduce((s, p) => s + p.amount, 0)
          const outstanding = vi.amount - totalPaid
          const pct = Math.round((totalPaid / vi.amount) * 100)
          const cfg = STATUS_CFG[vi.status]
          return (
            <div key={vi.id} className="rounded-lg border" style={C}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ background: cfg.bg, borderBottom:`1px solid ${cfg.c}30` }}>
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5" style={{ color: cfg.c }} />
                  <span className="font-mono text-xs font-bold" style={{ color:'var(--text)' }}>{vi.invoiceNumber}</span>
                  <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>· {v?.name ?? vi.vendorName} · {fmtDate(vi.invoiceDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-mono font-bold" style={{ color: cfg.c }}>{pct}% paid</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.c, color:'#fff' }}>{cfg.label}</span>
                  {vi.closure && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'#8B5CF6', color:'#fff' }}><Lock className="w-2.5 h-2.5" />Closed</span>}
                </div>
              </div>
              <div className="p-2.5 grid grid-cols-4 gap-2 text-[12.5px]">
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Amount</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmtMoney(vi.amount)}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Paid</div><div className="font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(totalPaid)}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Outstanding</div><div className="font-mono font-bold" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(outstanding)}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Receipts</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>{vi.payments?.length ?? 0}</div></div>
              </div>
              {(vi.payments?.length ?? 0) > 0 && (
                <div className="px-2.5 pb-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Payment History</div>
                  <div className="rounded border divide-y" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                    {vi.payments.map(p => (
                      <div key={p.id} className="px-2.5 py-1.5 grid grid-cols-12 gap-2 text-[12.5px]" style={{ borderColor:'var(--border)' }}>
                        <div className="col-span-3 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(p.amount)}</div>
                        <div className="col-span-3 font-mono" style={{ color:'var(--text2)' }}>{fmtDate(p.date)}</div>
                        <div className="col-span-3 font-mono" style={{ color:'var(--text2)' }}>{p.referenceNumber}</div>
                        <div className="col-span-3 flex items-center gap-1" style={{ color:'var(--text3)' }}>
                          <FileText className="w-3 h-3" />{p.proofFile}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — SALES ORDER LIST
// ═══════════════════════════════════════════════════════════════════════════
function SalesOrdersTab() {
  const navigate = useNavigate()
  const { localShipments, updateLocalShipment } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const toast = useToastStore()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  // Upload modals
  const [uploadInvoice, setUploadInvoice] = useState(null)   // { shipment }
  const [uploadReceipt, setUploadReceipt] = useState(null)   // { shipment, vendorInvoice }
  const [invDraft, setInvDraft] = useState({ invoiceNumber:'', invoiceDate:'', amount:'', attachment:'' })
  const [rctDraft, setRctDraft] = useState({ amount:'', date:'', referenceNumber:'', proofFile:'' })
  // Create SO modal
  const [createSO, setCreateSO]   = useState(false)
  const [soDraft, setSoDraft]     = useState({ shipmentIds: [], soNumber:'' })

  // Shipments without an SO (candidates for creating one)
  const orphanShipments = useMemo(() =>
    localShipments
      .filter(s => !s.salesOrderNumber)
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)),
    [localShipments])

  const handleCreateSO = () => {
    if (soDraft.shipmentIds.length === 0) {
      toast.warning('No shipments selected', 'Pick at least one shipment to link to this SO.')
      return
    }
    const soNumber = soDraft.soNumber?.trim() || `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const now = new Date().toISOString()
    soDraft.shipmentIds.forEach(sid => {
      const s = localShipments.find(x => x.id === sid)
      if (!s) return
      updateLocalShipment(sid, {
        salesOrderNumber: soNumber,
        auditLog: [...(s.auditLog ?? []), {
          id:`AUD-${sid}-${Date.now()}`,
          actor:'Khalid Salman',
          action:`Linked to Sales Order ${soNumber}`,
          date: now,
          meta:{ soNumber },
        }],
      })
    })
    toast.success('Sales Order created', `${soNumber} · ${soDraft.shipmentIds.length} shipment${soDraft.shipmentIds.length === 1 ? '' : 's'} linked`)
    setCreateSO(false)
    setSoDraft({ shipmentIds: [], soNumber:'' })
    setExpanded(p => new Set([...p, soNumber]))
  }

  // Group by salesOrderNumber
  const grouped = useMemo(() => {
    const map = new Map()
    localShipments.forEach(s => {
      const so = s.salesOrderNumber
      if (!so) return
      if (!map.has(so)) map.set(so, [])
      map.get(so).push(s)
    })
    let arr = Array.from(map.entries()).map(([so, ships]) => {
      const invoices = ships.flatMap(s => (s.vendorInvoices ?? []).map(vi => ({ ...vi, _shipment: s })))
      const totalInvoiced  = invoices.reduce((sum, i) => sum + i.amount, 0)
      const totalPaid      = invoices.reduce((sum, i) => sum + (i.payments ?? []).reduce((s, p) => s + p.amount, 0), 0)
      const vendorIds      = Array.from(new Set(invoices.map(i => i.vendorId)))
      return {
        salesOrderNumber: so,
        shipments: ships,
        invoices,
        totalInvoiced,
        totalPaid,
        outstanding: totalInvoiced - totalPaid,
        vendorCount: vendorIds.length,
        vendorIds,
      }
    })
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(g => g.salesOrderNumber.toLowerCase().includes(q)
        || g.shipments.some(s => s.id.toLowerCase().includes(q))
        || g.vendorIds.some(id => (vendors?.find(v => v.id === id)?.name ?? '').toLowerCase().includes(q)))
    }
    return arr.sort((a, b) => b.salesOrderNumber.localeCompare(a.salesOrderNumber))
  }, [localShipments, search, vendors])

  const toggle = (so) => setExpanded(p => { const n = new Set(p); n.has(so) ? n.delete(so) : n.add(so); return n })

  // ─── Upload handlers ──────────────────────────────────────────────
  const handleSubmitInvoice = () => {
    if (!uploadInvoice) return
    const { shipment } = uploadInvoice
    if (!invDraft.invoiceNumber || !invDraft.invoiceDate || !invDraft.amount || !invDraft.attachment) {
      toast.warning('Missing fields', 'Invoice #, date, amount and attachment are required.')
      return
    }
    const approvedQ = shipment.quotes?.find(q => q.status === 'approved')
    const vendorId = approvedQ?.vendorId ?? shipment.vendorInvoices?.[0]?.vendorId
    if (!vendorId) { toast.warning('No vendor', 'Approve a quote first so we know which vendor this is for.'); return }
    const newInv = {
      id: `VINV-${shipment.id}-${(shipment.vendorInvoices?.length ?? 0) + 1}`,
      invoiceNumber: invDraft.invoiceNumber,
      invoiceDate:   new Date(invDraft.invoiceDate).toISOString(),
      amount:        Number(invDraft.amount),
      vendorId,
      vendorName:    vendors?.find(v => v.id === vendorId)?.name ?? vendorId,
      shipmentRef:   shipment.id,
      attachment:    invDraft.attachment,
      status:        'pending',
      payments:      [],
      closure:       null,
      submittedAt:   new Date().toISOString(),
    }
    updateLocalShipment(shipment.id, {
      vendorInvoices: [...(shipment.vendorInvoices ?? []), newInv],
      auditLog: [...(shipment.auditLog ?? []), { id:`AUD-${shipment.id}-${Date.now()}`, actor:'Vendor', action:`Invoice submitted from Sales Orders: ${newInv.invoiceNumber}`, date: newInv.submittedAt, meta:{ amount: newInv.amount } }],
    })
    toast.success('Invoice uploaded', `${newInv.invoiceNumber} · SAR ${fmtMoney(newInv.amount)}`)
    setUploadInvoice(null); setInvDraft({ invoiceNumber:'', invoiceDate:'', amount:'', attachment:'' })
  }

  const handleSubmitReceipt = () => {
    if (!uploadReceipt) return
    const { shipment, vendorInvoice } = uploadReceipt
    if (!rctDraft.amount || !rctDraft.date || !rctDraft.referenceNumber || !rctDraft.proofFile) {
      toast.warning('Missing fields', 'Amount, date, reference and receipt are required.')
      return
    }
    const now = new Date().toISOString()
    const newPay = {
      id: `PAY-${vendorInvoice.id}-${(vendorInvoice.payments?.length ?? 0) + 1}`,
      amount: Number(rctDraft.amount),
      date: new Date(rctDraft.date).toISOString(),
      referenceNumber: rctDraft.referenceNumber,
      proofFile: rctDraft.proofFile,
      recordedBy: 'Khalid Salman',
      recordedAt: now,
    }
    const updatedPayments = [...(vendorInvoice.payments ?? []), newPay]
    const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0)
    const newStatus = totalPaid >= vendorInvoice.amount ? 'paid' : (totalPaid > 0 ? 'partially_paid' : 'pending')
    const updatedInv = { ...vendorInvoice, payments: updatedPayments, status: newStatus }
    updateLocalShipment(shipment.id, {
      vendorInvoices: (shipment.vendorInvoices ?? []).map(i => i.id === vendorInvoice.id ? updatedInv : i),
      auditLog: [...(shipment.auditLog ?? []), { id:`AUD-${shipment.id}-${Date.now()}`, actor:'Khalid Salman', action:`Receipt uploaded · ${vendorInvoice.invoiceNumber}`, date: now, meta:{ amount: newPay.amount, ref: newPay.referenceNumber, newStatus } }],
    })
    toast.success('Receipt recorded', `${newPay.referenceNumber} · SAR ${fmtMoney(newPay.amount)}`)
    setUploadReceipt(null); setRctDraft({ amount:'', date:'', referenceNumber:'', proofFile:'' })
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SO #, shipment, vendor…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{grouped.length} sales order{grouped.length === 1 ? '' : 's'}</span>
        {orphanShipments.length > 0 && (
          <span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.15)', color:'var(--warning)' }}>
            {orphanShipments.length} unlinked
          </span>
        )}
        <button onClick={() => { setCreateSO(true); setSoDraft({ shipmentIds: [], soNumber:'' }) }}
          className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-white flex items-center gap-1" style={{ background:'var(--primary)' }}>
          <Plus className="w-3 h-3" /> Create Sales Order
        </button>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border py-12 text-center" style={C}>
          <FileCheck className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
          <p className="text-sm" style={{ color:'var(--text2)' }}>No sales orders match filters</p>
        </div>
      ) : grouped.map(g => {
        const isExp = expanded.has(g.salesOrderNumber)
        const pct = g.totalInvoiced > 0 ? Math.round((g.totalPaid / g.totalInvoiced) * 100) : 0
        return (
          <div key={g.salesOrderNumber} className="rounded-xl border overflow-hidden" style={C}>
            <div onClick={() => toggle(g.salesOrderNumber)}
              className="px-4 py-3 cursor-pointer flex items-center gap-3" style={{ background:'var(--bg2)' }}>
              {isExp
                ? <ChevronDown className="w-4 h-4" style={{ color:'var(--primary)' }} />
                : <ChevronRight className="w-4 h-4" style={{ color:'var(--text3)' }} />}
              <Hash className="w-4 h-4" style={{ color:'var(--primary)' }} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold" style={{ color:'var(--text)' }}>{g.salesOrderNumber}</div>
                <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
                  {g.shipments.length} shipment{g.shipments.length === 1 ? '' : 's'} · {g.vendorCount} vendor{g.vendorCount === 1 ? '' : 's'} · {g.invoices.length} invoice{g.invoices.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Invoiced</div>
                <div className="font-mono font-bold text-xs" style={{ color:'var(--text)' }}>SAR {fmtMoney(g.totalInvoiced)}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Paid</div>
                <div className="font-mono font-bold text-xs" style={{ color:'var(--success)' }}>SAR {fmtMoney(g.totalPaid)}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Outstanding</div>
                <div className="font-mono font-bold text-xs" style={{ color: g.outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(g.outstanding)}</div>
              </div>
              <div className="w-24">
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{pct}%</div>
                <div className="h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : pct > 0 ? 'var(--primary)' : 'var(--warning)' }} />
                </div>
              </div>
            </div>

            {isExp && (
              <div className="p-3 space-y-3" style={{ borderTop:'1px solid var(--border)' }}>
                {g.shipments.map(s => {
                  const sInvoices = s.vendorInvoices ?? []
                  const overall = deriveOverallStatus(s)
                  const overCfg = OVERALL_STATUS_CFG[overall]
                  const approvedQ = s.quotes?.find(q => q.status === 'approved')
                  const vendor = approvedQ ? vendors?.find(v => v.id === approvedQ.vendorId) : null
                  return (
                    <div key={s.id} className="rounded-lg border overflow-hidden" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                      <div className="px-3 py-2 flex items-center gap-3" style={{ background:'var(--card)', borderBottom:'1px solid var(--border)' }}>
                        <Truck className="w-3.5 h-3.5" style={{ color:'var(--success)' }} />
                        <span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{s.id}</span>
                        <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>
                          {s.shipmentType ?? '—'} · {s.project ?? '—'}
                        </span>
                        {vendor && (
                          <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                            <Building2 className="w-2.5 h-2.5" />{vendor.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded-md ml-auto" style={{ background:`${overCfg.color}15`, color: overCfg.color }}>
                          <span>{overCfg.icon}</span>{overCfg.label}
                        </span>
                        <button onClick={() => { setUploadInvoice({ shipment: s }); setInvDraft({ invoiceNumber:'', invoiceDate:'', amount:'', attachment:'' }) }}
                          className="px-2 py-1 text-[12.5px] font-bold rounded-md text-white flex items-center gap-1" style={{ background:'var(--primary)' }}>
                          <Plus className="w-3 h-3" />Upload Invoice
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        {sInvoices.length === 0 ? (
                          <div className="text-[12.5px] py-2 text-center" style={{ color:'var(--text3)' }}>
                            No vendor invoices yet · click <strong>Upload Invoice</strong> above to add one
                          </div>
                        ) : sInvoices.map(vi => {
                          const cfg = STATUS_CFG[vi.status]
                          const totalPaid = (vi.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
                          const outstanding = vi.amount - totalPaid
                          return (
                            <div key={vi.id} className="rounded border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                              <div className="px-2.5 py-1.5 flex items-center gap-2" style={{ background: cfg.bg, borderBottom:`1px solid ${cfg.c}30` }}>
                                <Receipt className="w-3 h-3" style={{ color: cfg.c }} />
                                <span className="font-mono text-[11px] font-bold" style={{ color:'var(--text)' }}>{vi.invoiceNumber}</span>
                                <span className="text-[9px]" style={{ color:'var(--text3)' }}>· {fmtDate(vi.invoiceDate)} · {vi.attachment}</span>
                                <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.c, color:'#fff' }}>{cfg.label}</span>
                                {vi.closure && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'#8B5CF6', color:'#fff' }}><Lock className="w-2.5 h-2.5" />Closed</span>}
                                {vi.status !== 'paid' && !vi.closure && (
                                  <button onClick={() => { setUploadReceipt({ shipment: s, vendorInvoice: vi }); setRctDraft({ amount: String(outstanding), date:'', referenceNumber:'', proofFile:'' }) }}
                                    className="px-2 py-0.5 text-[9px] font-bold rounded text-white flex items-center gap-1" style={{ background:'var(--success)' }}>
                                    <Upload className="w-2.5 h-2.5" />Receipt
                                  </button>
                                )}
                              </div>
                              <div className="px-2.5 py-1.5 grid grid-cols-4 gap-2 text-[12.5px]">
                                <div><div className="text-[9px]" style={{ color:'var(--text3)' }}>Amount</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmtMoney(vi.amount)}</div></div>
                                <div><div className="text-[9px]" style={{ color:'var(--text3)' }}>Paid</div><div className="font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(totalPaid)}</div></div>
                                <div><div className="text-[9px]" style={{ color:'var(--text3)' }}>Outstanding</div><div className="font-mono font-bold" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(outstanding)}</div></div>
                                <div><div className="text-[9px]" style={{ color:'var(--text3)' }}>Receipts</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>{vi.payments?.length ?? 0}</div></div>
                              </div>
                              {(vi.payments?.length ?? 0) > 0 && (
                                <div className="px-2.5 pb-2 space-y-0.5">
                                  {vi.payments.map(p => (
                                    <div key={p.id} className="grid grid-cols-12 gap-2 text-[12.5px] px-2 py-1 rounded" style={{ background:'var(--bg2)' }}>
                                      <div className="col-span-3 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(p.amount)}</div>
                                      <div className="col-span-3 font-mono" style={{ color:'var(--text2)' }}>{fmtDate(p.date)}</div>
                                      <div className="col-span-3 font-mono" style={{ color:'var(--text2)' }}>{p.referenceNumber}</div>
                                      <div className="col-span-3 truncate" style={{ color:'var(--text3)' }}><FileText className="w-2.5 h-2.5 inline" /> {p.proofFile}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Upload Invoice modal */}
      <EnterpriseModal open={!!uploadInvoice} onClose={() => setUploadInvoice(null)}
        title="Upload Vendor Invoice" subtitle={uploadInvoice ? `For shipment ${uploadInvoice.shipment.id}` : ''}
        icon={<Receipt className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setUploadInvoice(null)}>Cancel</ModalBtn><ModalBtn onClick={handleSubmitInvoice}>Upload Invoice</ModalBtn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Number <span style={{ color:'var(--danger)' }}>*</span></label>
            <input value={invDraft.invoiceNumber} onChange={e => setInvDraft({ ...invDraft, invoiceNumber: e.target.value })} placeholder="INV-2026-001"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Date <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="date" value={invDraft.invoiceDate} onChange={e => setInvDraft({ ...invDraft, invoiceDate: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="number" value={invDraft.amount} onChange={e => setInvDraft({ ...invDraft, amount: e.target.value })} placeholder="0"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Shipment</label>
            <input value={uploadInvoice?.shipment?.id ?? ''} disabled className="w-full rounded-lg px-3 py-2 text-sm border font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice File <span style={{ color:'var(--danger)' }}>*</span></label>
            {invDraft.attachment ? (
              <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:'var(--success)' }}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{invDraft.attachment}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--success)' }}>Ready</div>
                </div>
                <button type="button" onClick={() => setInvDraft({ ...invDraft, attachment: '' })} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color:'var(--danger)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer"
                style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setInvDraft({ ...invDraft, attachment: f.name }) }} />
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Invoice File</div>
                <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>PDF, JPG or PNG</div>
              </label>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {/* Upload Receipt modal */}
      <EnterpriseModal open={!!uploadReceipt} onClose={() => setUploadReceipt(null)}
        title="Upload Payment Receipt" subtitle={uploadReceipt ? `For invoice ${uploadReceipt.vendorInvoice.invoiceNumber}` : ''}
        icon={<DollarSign className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setUploadReceipt(null)}>Cancel</ModalBtn><ModalBtn onClick={handleSubmitReceipt}>Record Payment</ModalBtn></>}>
        {uploadReceipt && (() => {
          const { vendorInvoice } = uploadReceipt
          const totalPaid = (vendorInvoice.payments ?? []).reduce((s, p) => s + p.amount, 0)
          const outstanding = vendorInvoice.amount - totalPaid
          return (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 grid grid-cols-3 gap-2 text-xs" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Invoice</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmtMoney(vendorInvoice.amount)}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Paid</div><div className="font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(totalPaid)}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Outstanding</div><div className="font-mono font-bold" style={{ color:'var(--warning)' }}>SAR {fmtMoney(outstanding)}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input type="number" value={rctDraft.amount} onChange={e => setRctDraft({ ...rctDraft, amount: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Date <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input type="date" value={rctDraft.date} onChange={e => setRctDraft({ ...rctDraft, date: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2">
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Bank Transaction Reference <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input value={rctDraft.referenceNumber} onChange={e => setRctDraft({ ...rctDraft, referenceNumber: e.target.value })} placeholder="BANK-XXXXXX, wire transfer ID, etc."
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2">
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Receipt / Proof <span style={{ color:'var(--danger)' }}>*</span></label>
                  {rctDraft.proofFile ? (
                    <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:'var(--success)' }}>
                        <Receipt className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{rctDraft.proofFile}</div>
                        <div className="text-[12.5px]" style={{ color:'var(--success)' }}>Receipt attached</div>
                      </div>
                      <button type="button" onClick={() => setRctDraft({ ...rctDraft, proofFile: '' })} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color:'var(--danger)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setRctDraft({ ...rctDraft, proofFile: f.name }) }} />
                      <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                      <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Bank Receipt</div>
                      <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>PDF, JPG or PNG</div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>

      {/* Create Sales Order modal */}
      <EnterpriseModal open={createSO} onClose={() => setCreateSO(false)}
        title="Create Sales Order" subtitle="Link one or more unlinked shipments under a new SO"
        icon={<FileCheck className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setCreateSO(false)}>Cancel</ModalBtn>
          <ModalBtn onClick={handleCreateSO}>Create SO ({soDraft.shipmentIds.length})</ModalBtn>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>
              Sales Order Number <span className="font-normal normal-case" style={{ color:'var(--text3)' }}>(leave blank to auto-generate)</span>
            </label>
            <input value={soDraft.soNumber} onChange={e => setSoDraft({ ...soDraft, soNumber: e.target.value })} placeholder={`SO-${new Date().getFullYear()}-XXXX`}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>
                Select Shipments to Link <span style={{ color:'var(--danger)' }}>*</span>
              </label>
              <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
                {soDraft.shipmentIds.length} selected · {orphanShipments.length} available
              </div>
            </div>
            {orphanShipments.length === 0 ? (
              <div className="rounded-lg border border-dashed py-6 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1" style={{ color:'var(--success)' }} />
                <p className="text-xs font-bold" style={{ color:'var(--text2)' }}>All shipments are linked to a sales order</p>
                <p className="text-[12.5px] mt-1" style={{ color:'var(--text3)' }}>No orphan shipments to assign.</p>
              </div>
            ) : (
              <div className="rounded-lg border max-h-72 overflow-y-auto divide-y" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
                <div className="px-2.5 py-1.5 flex items-center gap-2 sticky top-0" style={{ background:'var(--card)', borderBottom:'1px solid var(--border)' }}>
                  <button onClick={() => setSoDraft({ ...soDraft, shipmentIds: orphanShipments.map(s => s.id) })}
                    className="text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>Select all</button>
                  <button onClick={() => setSoDraft({ ...soDraft, shipmentIds: [] })}
                    className="text-[12.5px] font-bold" style={{ color:'var(--text3)' }}>Clear</button>
                </div>
                {orphanShipments.map(s => {
                  const checked = soDraft.shipmentIds.includes(s.id)
                  const overall = deriveOverallStatus(s)
                  const cfg = OVERALL_STATUS_CFG[overall]
                  const approvedQ = s.quotes?.find(q => q.status === 'approved')
                  const v = approvedQ ? vendors?.find(x => x.id === approvedQ.vendorId) : null
                  return (
                    <label key={s.id} className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer" style={{ background: checked ? 'var(--primary-light)' : 'transparent' }}>
                      <input type="checkbox" checked={checked}
                        onChange={e => setSoDraft({
                          ...soDraft,
                          shipmentIds: e.target.checked
                            ? [...soDraft.shipmentIds, s.id]
                            : soDraft.shipmentIds.filter(x => x !== s.id),
                        })}
                        className="w-3.5 h-3.5 rounded" />
                      <Truck className="w-3.5 h-3.5" style={{ color:'var(--success)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] font-bold" style={{ color:'var(--primary)' }}>{s.id}</div>
                        <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
                          {s.project ?? '—'} · {s.shipmentType ?? '—'}{v && ` · ${v.name}`}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                        <span>{cfg.icon}</span>{cfg.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-2.5 text-[11px]" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)', color:'var(--text2)' }}>
            Each selected shipment will be tagged with this Sales Order number. The new SO will then appear in the list with all its linked shipments, vendor invoices and receipts grouped together.
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMS QUEUE TAB — request #2
// Surfaces every international shipment that has a customsPayment configured
// from the SABER tab. Sorts by urgency (within reminder window first), shows
// the SAR amount and computed days-to-ETA, with a "Mark Paid" action.
// ═══════════════════════════════════════════════════════════════════════════
function CustomsQueueTab() {
  const intlShipments = useShipmentV2Store(s => s.intlShipments)
  const updateIntl    = useShipmentV2Store(s => s.updateIntlShipment)
  const toast         = useToastStore()
  const navigate      = useNavigate()

  const queue = useMemo(() => intlShipments
    .filter(s => s.customsPayment && (s.customsPayment.invoiceValue || s.customsPayment.customsSAR))
    .map(s => {
      const cp = s.customsPayment
      const eta = s.eta ? new Date(s.eta) : null
      const daysToEta = eta ? Math.ceil((eta.getTime() - Date.now()) / 86400000) : null
      const reminderDays = cp.reminderDays ?? 5
      const inReminderWindow = daysToEta !== null && daysToEta >= 0 && daysToEta <= reminderDays
      const isOverdue = daysToEta !== null && daysToEta < 0 && !cp.paid
      const customsSAR = cp.customsSAR
        ?? +(Number(cp.invoiceValue || 0) * Number(cp.ksaRate || 0) * (Number(cp.dutyPercent || 0) / 100)).toFixed(2)
      return { shipment: s, cp, eta, daysToEta, reminderDays, inReminderWindow, isOverdue, customsSAR }
    })
    .sort((a, b) => {
      // overdue first, then in-window, then by days-to-eta asc
      if (a.cp.paid !== b.cp.paid) return a.cp.paid ? 1 : -1
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      if (a.inReminderWindow !== b.inReminderWindow) return a.inReminderWindow ? -1 : 1
      return (a.daysToEta ?? 9999) - (b.daysToEta ?? 9999)
    }),
    [intlShipments])

  const totalPending = queue.filter(r => !r.cp.paid).reduce((s, r) => s + (r.customsSAR ?? 0), 0)
  const inWindow = queue.filter(r => !r.cp.paid && r.inReminderWindow).length
  const overdue  = queue.filter(r => r.isOverdue).length

  const markPaid = (s, cp, customsSAR) => {
    updateIntl(s.id, { customsPayment: { ...cp, customsSAR, paid: true, paidAt: new Date().toISOString() } })
    toast.success('Customs cleared', `${s.id} · SAR ${customsSAR.toLocaleString()} marked paid`)
  }

  return (
    <div className="space-y-3">
      {/* KPI strip */}
      <div data-tour="customs-kpi" data-tour-order="10"
        data-tour-title="Customs Queue KPIs"
        data-tour-desc="Total SAR pending across all international shipments, how many are inside the configured reminder window, how many are overdue, and the total queue size. Configure reminder days on each shipment's SABER tab."
        className="grid grid-cols-4 gap-3">
        <Kpi label="Total Pending"  value={`SAR ${fmtMoney(totalPending)}`} color="#D97706" />
        <Kpi label="In Reminder Window" value={inWindow}  color="#D97706" small />
        <Kpi label="Overdue"        value={overdue}       color="#DC2626" small />
        <Kpi label="Queue Size"     value={queue.length}  color="#2563EB" small />
      </div>

      {/* Queue */}
      <div data-tour="customs-queue-table" data-tour-order="20"
        data-tour-title="Customs Clearance Queue"
        data-tour-desc="Every international shipment with a configured customs payment, sorted by urgency. Click any shipment to jump to its profile, or hit ✓ Pay to mark customs as cleared once ZATCA has been settled."
        className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <Shield className="w-3.5 h-3.5" style={{ color:'#D97706' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Customs Payments — Pending Clearance</h3>
        </div>
        {queue.length === 0 ? (
          <div className="py-12 text-center text-xs" style={{ color:'var(--text3)' }}>
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No customs payments configured. Open any international shipment with SABER-regulated items and use the <strong>Customs Payment Configuration</strong> card to add one.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Shipment','PO','Foreign Inv.','Rate','Duty %','SAR Payable','ETA','Status','Action'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map(({ shipment, cp, daysToEta, reminderDays, inReminderWindow, isOverdue, customsSAR }) => {
                let statusCfg
                if (cp.paid) statusCfg = { c: '#059669', bg: 'rgba(5,150,105,.12)', text: '✓ PAID' }
                else if (isOverdue) statusCfg = { c: '#DC2626', bg: 'rgba(220,38,38,.12)', text: `⚠ OVERDUE +${-daysToEta}d` }
                else if (inReminderWindow) statusCfg = { c: '#D97706', bg: 'rgba(217,119,6,.12)', text: `🔔 ALERT · ${daysToEta}d to ETA` }
                else statusCfg = { c: '#64748B', bg: 'var(--bg2)', text: daysToEta != null ? `${daysToEta}d to ETA` : 'No ETA' }
                return (
                  <tr key={shipment.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2">
                      <button onClick={() => navigate(`/shipments/intl/${shipment.id}`)}
                        className="font-mono font-bold underline-offset-2 hover:underline" style={{ color:'var(--primary)' }}>
                        {shipment.id}
                      </button>
                      <div className="text-[10px] mt-0.5 truncate max-w-[160px]" style={{ color:'var(--text3)' }}>{shipment.project ?? '—'}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]" style={{ color:'var(--text2)' }}>{shipment.poNumber ?? (shipment.poNumbers ?? [])[0] ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-right" style={{ color:'var(--text)' }}>{cp.foreignCurrency ?? 'USD'} {fmtMoney(Number(cp.invoiceValue || 0))}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{Number(cp.ksaRate || 0).toFixed(4)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{cp.dutyPercent ?? 0}%</td>
                    <td className="px-3 py-2 font-mono font-bold text-right" style={{ color: cp.paid ? '#059669' : '#D97706' }}>SAR {fmtMoney(customsSAR)}</td>
                    <td className="px-3 py-2 font-mono text-[11px]" style={{ color:'var(--text2)' }}>{shipment.eta ? fmtDate(shipment.eta) : '—'}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background: statusCfg.bg, color: statusCfg.c }}>{statusCfg.text}</span>
                    </td>
                    <td className="px-3 py-2">
                      {!cp.paid && (
                        <button onClick={() => markPaid(shipment, cp, customsSAR)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded border"
                          style={{ background:'var(--card)', borderColor:'#059669', color:'#059669' }}>
                          ✓ Pay
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reminder banner */}
      {inWindow > 0 && (
        <div className="rounded-lg p-3 flex items-start gap-2" style={{ background:'rgba(217,119,6,.06)', border:'1px solid rgba(217,119,6,.3)' }}>
          <span className="text-base">🔔</span>
          <p className="text-[12.5px]" style={{ color:'var(--text2)' }}>
            <strong style={{ color:'#D97706' }}>{inWindow} customs payment(s) inside reminder window</strong>
            {' — Finance is alerted by email + dashboard banner ahead of the configured lead-time so duties are cleared before the goods reach the port.'}
          </p>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, color, small, onClick }) {
  const cls = `rounded-xl border p-3 ${onClick ? 'cursor-pointer transition-all hover:-translate-y-0.5' : ''}`
  return (
    <div onClick={onClick} className={cls}
      style={{ ...C, borderLeft: `3px solid ${color}`, boxShadow: onClick ? undefined : 'var(--shadow)' }}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{label}</div>
      <div className={`font-mono font-black ${small ? 'text-base' : 'text-lg'}`} style={{ color }}>{value}</div>
    </div>
  )
}
