// HELMS Finance Dashboard · all sections 1-10 + global filters + export
import { useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, FileText, Receipt, CheckCircle2,
  AlertCircle, Clock, Plus, Search, Filter, X, Upload, Eye, ChevronRight, ChevronDown,
  Building2, Hash, FileCheck, ArrowUpRight, ArrowDownRight, Download, Activity, Sheet,
} from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store from '../../store/vendorV2Store'
import useToastStore from '../../store/toastStore'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  INVOICE_STATUS_CFG, RECEIPT_STATUS_CFG, PAYMENT_METHODS, AGING_BUCKETS, agingBucket,
} from '../../api/mock/financeData'
import {
  GlobalFilters, DEFAULT_FILTERS, dateInRange,
  Section6Revenue, Section7Expense, Section8Profitability, Section9CashFlow,
} from './FinanceSections2'
import { exportToExcel } from './financeExport'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtMoney = (n) => (n ?? 0).toLocaleString()
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const isThisMonth = (iso) => {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export default function FinanceDashboard() {
  const { customers, customerInvoices, customerReceipts, addCustomerReceipt } = useFinanceStore()
  const { localShipments } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const toast = useToastStore()

  // ─── Global filter state (Section 10) ────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [drilldown, setDrilldown] = useState(null)   // { title, rows, columns }

  // Apply filters to invoices
  const filteredInvoices = useMemo(() => customerInvoices.filter(i => {
    if (!dateInRange(i.invoiceDate, filters.dateRange)) return false
    if (filters.customer !== 'all' && i.customerId !== filters.customer) return false
    if (filters.invoiceStatus !== 'all' && i.status !== filters.invoiceStatus) return false
    return true
  }), [customerInvoices, filters])

  // Apply filters to receipts (via parent invoice match)
  const filteredReceipts = useMemo(() => customerReceipts.filter(r => {
    if (!dateInRange(r.date, filters.dateRange)) return false
    if (filters.customer !== 'all' && r.customerId !== filters.customer) return false
    return true
  }), [customerReceipts, filters])

  // ─── Section 1: KPI calculations ────────────────────────────────────
  const kpis = useMemo(() => {
    // Customer side (AR) — filtered
    const totalRevenue        = filteredInvoices.reduce((s, i) => s + (i.amount ?? 0), 0)
    const revenueThisMonth    = filteredInvoices.filter(i => isThisMonth(i.invoiceDate)).reduce((s, i) => s + (i.amount ?? 0), 0)
    const totalReceiptsReceived = filteredReceipts.filter(r => r.status === 'verified').reduce((s, r) => s + (r.amount ?? 0), 0)
    const outstandingReceivables = filteredInvoices.reduce((s, i) => s + Math.max(0, (i.amount ?? 0) - (i.paidAmount ?? 0)), 0)

    // Vendor side (AP) — read from all shipment.vendorInvoices, filter by vendor + date
    const allVendorInvoices = []
    localShipments.forEach(s => (s.vendorInvoices ?? []).forEach(vi => allVendorInvoices.push({ ...vi, _shipment: s })))
    const filteredVendorInv = allVendorInvoices.filter(vi => {
      if (!dateInRange(vi.invoiceDate, filters.dateRange)) return false
      if (filters.vendor !== 'all' && vi.vendorId !== filters.vendor) return false
      return true
    })
    const totalExpenses        = filteredVendorInv.reduce((s, i) => s + (i.amount ?? 0), 0)
    const expensesThisMonth    = filteredVendorInv.filter(i => isThisMonth(i.invoiceDate)).reduce((s, i) => s + (i.amount ?? 0), 0)
    const totalPaymentsMade    = filteredVendorInv.reduce((s, i) => s + (i.payments ?? []).reduce((sum, p) => sum + p.amount, 0), 0)
    const outstandingPayables  = filteredVendorInv.reduce((s, i) => {
      const paid = (i.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
      return s + Math.max(0, (i.amount ?? 0) - paid)
    }, 0)

    return {
      totalRevenue,
      revenueThisMonth,
      totalExpenses,
      expensesThisMonth,
      grossProfit:        totalRevenue - totalExpenses,
      profitThisMonth:    revenueThisMonth - expensesThisMonth,
      outstandingReceivables,
      outstandingPayables,
      totalReceiptsReceived,
      totalPaymentsMade,
      totalCustomerInvoices: filteredInvoices.length,
      totalVendorInvoices:   filteredVendorInv.length,
      allVendorInvoices: filteredVendorInv,
      _filteredInvoices: filteredInvoices,
      _filteredReceipts: filteredReceipts,
    }
  }, [filteredInvoices, filteredReceipts, localShipments, filters])

  return (
    <div className="space-y-4">
      {/* Section 10: Global filters (at top per spec design) */}
      <GlobalFilters filters={filters} setFilters={setFilters} customers={customers} vendors={vendors} />

      {/* Section 1: KPI summary */}
      <Section1KPIs kpis={kpis} onDrilldown={setDrilldown} />

      {/* Section 2: Customer Invoices (AR) */}
      <Section2CustomerInvoices customers={customers} customerInvoices={filteredInvoices} />

      {/* Section 3: Vendor Invoices (AP) */}
      <Section3VendorInvoices allVendorInvoices={kpis.allVendorInvoices} />

      {/* Section 4: Receipts */}
      <Section4Receipts customers={customers} customerInvoices={customerInvoices} customerReceipts={filteredReceipts}
        addCustomerReceipt={addCustomerReceipt} toast={toast} />

      {/* Section 5: Vendor Payments */}
      <Section5VendorPayments allVendorInvoices={kpis.allVendorInvoices} />

      {/* Section 6: Revenue Analysis */}
      <Section6Revenue customerInvoices={filteredInvoices} customers={customers} filters={filters} />

      {/* Section 7: Expense Analysis */}
      <Section7Expense allVendorInvoices={kpis.allVendorInvoices} vendors={vendors} filters={filters} />

      {/* Section 8: Profitability */}
      <Section8Profitability localShipments={localShipments} customerInvoices={filteredInvoices} customers={customers} filters={filters} />

      {/* Section 9: Cash Flow */}
      <Section9CashFlow customerReceipts={customerReceipts} allVendorInvoices={kpis.allVendorInvoices} customerInvoices={filteredInvoices} filters={filters} />

      {/* Drilldown modal */}
      <DrilldownModal drilldown={drilldown} onClose={() => setDrilldown(null)} customers={customers} />
    </div>
  )
}

// ─── Drilldown modal ─────────────────────────────────────────────────────
function DrilldownModal({ drilldown, onClose, customers }) {
  if (!drilldown) return null
  return (
    <EnterpriseModal open onClose={onClose}
      title={drilldown.title}
      subtitle={`${drilldown.rows.length} record${drilldown.rows.length === 1 ? '' : 's'}`}
      icon={<Eye className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="xl"
      footer={<><ModalBtn variant="secondary" onClick={onClose}>Close</ModalBtn>
        <ModalBtn onClick={() => exportToExcel(drilldown.title.toLowerCase().replace(/\s+/g, '-'), [{ name: drilldown.title.slice(0,30), rows: drilldown.rows }])}>
          <Sheet className="w-3 h-3 mr-1" /> Export Excel
        </ModalBtn></>}>
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {drilldown.columns.map(c => (
                  <th key={c} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drilldown.rows.length === 0 ? (
                <tr><td colSpan={drilldown.columns.length} className="py-8 text-center" style={{ color:'var(--text3)' }}>No records to show</td></tr>
              ) : drilldown.rows.slice(0, 50).map((r, idx) => (
                <tr key={idx} style={{ borderTop:'1px solid var(--border)' }}>
                  {drilldown.columns.map(c => (
                    <td key={c} className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{r[c] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EnterpriseModal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — KPI Summary Cards (12 cards) — clickable for drill-down
// ═══════════════════════════════════════════════════════════════════════════
function Section1KPIs({ kpis, onDrilldown }) {
  const drillToInvoices = () => onDrilldown({
    title: 'Customer Invoices',
    columns: ['Invoice', 'Customer', 'Amount', 'Paid', 'Outstanding', 'Status'],
    rows: kpis._filteredInvoices.map(i => ({
      Invoice: i.id, Customer: i.customerId,
      Amount: `SAR ${(i.amount ?? 0).toLocaleString()}`,
      Paid: `SAR ${(i.paidAmount ?? 0).toLocaleString()}`,
      Outstanding: `SAR ${Math.max(0, i.amount - (i.paidAmount ?? 0)).toLocaleString()}`,
      Status: i.status,
    })),
  })
  const drillToReceipts = () => onDrilldown({
    title: 'Customer Receipts',
    columns: ['Receipt', 'Customer', 'Invoice', 'Date', 'Amount', 'Method', 'Status'],
    rows: kpis._filteredReceipts.map(r => ({
      Receipt: r.id, Customer: r.customerId, Invoice: r.invoiceId,
      Date: new Date(r.date).toLocaleDateString('en-SA'),
      Amount: `SAR ${r.amount.toLocaleString()}`,
      Method: r.paymentMethod, Status: r.status,
    })),
  })
  const drillToVendorInv = () => onDrilldown({
    title: 'Vendor Invoices',
    columns: ['Invoice', 'Vendor', 'Shipment', 'Amount', 'Status'],
    rows: kpis.allVendorInvoices.map(i => ({
      Invoice: i.invoiceNumber, Vendor: i.vendorName, Shipment: i.shipmentRef,
      Amount: `SAR ${(i.amount ?? 0).toLocaleString()}`, Status: i.status,
    })),
  })

  const cards = [
    { l:'Total Revenue',          v:`SAR ${fmtMoney(kpis.totalRevenue)}`,          c:'#059669', icon: TrendingUp,    sub:'All customer invoices', onClick: drillToInvoices },
    { l:'Revenue This Month',     v:`SAR ${fmtMoney(kpis.revenueThisMonth)}`,      c:'#06B6D4', icon: ArrowUpRight,  sub:'Current month', onClick: drillToInvoices },
    { l:'Total Expenses',         v:`SAR ${fmtMoney(kpis.totalExpenses)}`,         c:'#DC2626', icon: TrendingDown,  sub:'All vendor invoices', onClick: drillToVendorInv },
    { l:'Expenses This Month',    v:`SAR ${fmtMoney(kpis.expensesThisMonth)}`,     c:'#EA580C', icon: ArrowDownRight,sub:'Current month', onClick: drillToVendorInv },
    { l:'Gross Profit',           v:`SAR ${fmtMoney(kpis.grossProfit)}`,           c: kpis.grossProfit >= 0 ? '#059669' : '#DC2626', icon: DollarSign, sub:'Revenue − Expenses' },
    { l:'Profit This Month',      v:`SAR ${fmtMoney(kpis.profitThisMonth)}`,       c: kpis.profitThisMonth >= 0 ? '#059669' : '#DC2626', icon: DollarSign, sub:'This month delta' },
    { l:'Outstanding Receivables',v:`SAR ${fmtMoney(kpis.outstandingReceivables)}`,c:'#D97706', icon: Wallet,        sub:'To be collected', onClick: drillToInvoices },
    { l:'Outstanding Payables',   v:`SAR ${fmtMoney(kpis.outstandingPayables)}`,   c:'#8B5CF6', icon: Wallet,        sub:'To be paid', onClick: drillToVendorInv },
    { l:'Total Receipts Received',v:`SAR ${fmtMoney(kpis.totalReceiptsReceived)}`, c:'#059669', icon: Receipt,       sub:'Verified inbound', onClick: drillToReceipts },
    { l:'Total Payments Made',    v:`SAR ${fmtMoney(kpis.totalPaymentsMade)}`,     c:'#2563EB', icon: ArrowUpRight,  sub:'Vendor disbursements' },
    { l:'Total Customer Invoices',v: kpis.totalCustomerInvoices,                   c:'#06B6D4', icon: FileText,      sub:'AR invoice count', onClick: drillToInvoices },
    { l:'Total Vendor Invoices',  v: kpis.totalVendorInvoices,                     c:'#8B5CF6', icon: FileText,      sub:'AP invoice count', onClick: drillToVendorInv },
  ]
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-2" style={{ borderBottom:'2px solid var(--text)' }}>
        <div>
          <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>KPI Summary</h3>
          <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>12 core indicators · click any card to drill into records</p>
        </div>
        <button onClick={() => exportToExcel('kpi-summary', [{
          name: 'KPIs',
          rows: cards.map(c => ({ KPI: c.l, Value: typeof c.v === 'string' ? c.v.replace('SAR ', '') : c.v, Notes: c.sub })),
        }])}
          className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
          style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)', color:'#059669' }}>
          <Sheet className="w-3 h-3" /> Excel
        </button>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {cards.map(({ l, v, c, icon:Icon, sub, onClick }) => (
          <button key={l} onClick={onClick} disabled={!onClick}
            className={`text-left rounded-xl border p-2.5 transition-all ${onClick ? 'hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
            style={{ ...C, borderLeft:`3px solid ${c}` }}
            title={onClick ? 'Click to drill into records' : ''}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3 h-3" style={{ color: c }} />
              <span className="text-[8.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
              {onClick && <Eye className="w-2.5 h-2.5 ml-auto opacity-40" style={{ color: c }} />}
            </div>
            <div className="text-base font-black font-mono" style={{ color: c }}>{v}</div>
            <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — Customer Invoices (Accounts Receivable)
// ═══════════════════════════════════════════════════════════════════════════
function Section2CustomerInvoices({ customers, customerInvoices }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(() => {
    const total = customerInvoices.length
    let paid = 0, unpaid = 0, partial = 0, overdue = 0, outstanding = 0
    const aging = { '0_30':0, '31_60':0, '61_90':0, '90_plus':0, current:0 }
    customerInvoices.forEach(i => {
      const out = Math.max(0, (i.amount ?? 0) - (i.paidAmount ?? 0))
      outstanding += out
      if (i.status === 'paid') paid++
      else if (i.status === 'partially_paid') partial++
      else if (i.status === 'overdue') overdue++
      else unpaid++
      if (out > 0) {
        const bucket = agingBucket(i)
        aging[bucket] = (aging[bucket] ?? 0) + out
      }
    })
    return { total, paid, unpaid, partial, overdue, outstanding, aging }
  }, [customerInvoices])

  const filtered = useMemo(() => customerInvoices.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const cust = customers.find(c => c.id === i.customerId)
      return i.id.toLowerCase().includes(q)
        || (cust?.name ?? '').toLowerCase().includes(q)
        || (i.contractNumber ?? '').toLowerCase().includes(q)
        || (i.shipmentRef ?? '').toLowerCase().includes(q)
    }
    return true
  }), [customerInvoices, customers, search, statusFilter])

  return (
    <div>
      <SectionHeader title="Customer Invoices (Accounts Receivable)" subtitle="Money the business is owed by customers"
        action={<button onClick={() => exportToExcel('customer-invoices-AR', [{
          name: 'Customer Invoices',
          rows: customerInvoices.map(i => {
            const cust = customers.find(c => c.id === i.customerId)
            return {
              Invoice: i.id, Customer: cust?.name, Contract: i.contractNumber, Shipment: i.shipmentRef,
              InvoiceDate: i.invoiceDate?.slice(0,10), DueDate: i.dueDate?.slice(0,10),
              Amount_SAR: i.amount, Paid_SAR: i.paidAmount ?? 0,
              Outstanding_SAR: Math.max(0, i.amount - (i.paidAmount ?? 0)),
              Status: i.status,
            }
          }),
        }])} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
          style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)', color:'#059669' }}>
          <Sheet className="w-3 h-3" /> Excel
        </button>} />

      {/* Status tiles */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        <KPIChip label="Total"           value={stats.total}           color="var(--text)" />
        <KPIChip label="Paid"            value={stats.paid}            color="#059669" />
        <KPIChip label="Unpaid"          value={stats.unpaid}          color="#D97706" />
        <KPIChip label="Partial"         value={stats.partial}         color="#2563EB" />
        <KPIChip label="Overdue"         value={stats.overdue}         color="#DC2626" />
        <KPIChip label="Outstanding"     value={`SAR ${fmtMoney(stats.outstanding)}`} color="#D97706" mono small />
      </div>

      {/* Aging analysis */}
      <div className="rounded-xl border p-3 mb-3" style={C}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Aging Analysis</h4>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Outstanding amount by age</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AGING_BUCKETS.map(b => {
            const amt = stats.aging[b.id] ?? 0
            const pct = stats.outstanding > 0 ? (amt / stats.outstanding) * 100 : 0
            return (
              <div key={b.id} className="rounded-lg border p-2.5" style={{ background:`${b.c}10`, borderColor:`${b.c}30` }}>
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: b.c }}>{b.label}</div>
                <div className="text-base font-black font-mono mt-0.5" style={{ color: b.c }}>SAR {fmtMoney(amt)}</div>
                <div className="h-1.5 rounded mt-1.5 overflow-hidden" style={{ background:'var(--border)' }}>
                  <div className="h-full" style={{ width:`${pct}%`, background: b.c }} />
                </div>
                <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{pct.toFixed(1)}% of outstanding</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-2 flex items-center gap-2 flex-wrap mb-2" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice, customer, contract, shipment…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatusFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Statuses' }, ...Object.entries(INVOICE_STATUS_CFG).map(([k, cfg]) => ({ id:k, label: cfg.label }))]} />
        </div>
      </div>

      {/* Invoice table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Invoice #','Customer','Contract','Shipment','Invoice Date','Due Date','Amount','Paid','Outstanding','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center" style={{ color:'var(--text3)' }}>No customer invoices match filters</td></tr>
              ) : filtered.map(i => {
                const cust = customers.find(c => c.id === i.customerId)
                const cfg = INVOICE_STATUS_CFG[i.status]
                const outstanding = Math.max(0, (i.amount ?? 0) - (i.paidAmount ?? 0))
                return (
                  <tr key={i.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{i.id}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text)' }}>{cust?.name ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{i.contractNumber}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{i.shipmentRef}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(i.invoiceDate)}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(i.dueDate)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmtMoney(i.amount)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--success)' }}>SAR {fmtMoney(i.paidAmount)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(outstanding)}</td>
                    <td className="px-3 py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span></td>
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

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — Vendor Invoices (Accounts Payable)
// ═══════════════════════════════════════════════════════════════════════════
function Section3VendorInvoices({ allVendorInvoices }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(() => {
    let paid = 0, unpaid = 0, overdue = 0, payable = 0
    const aging = { '0_30':0, '31_60':0, '61_90':0, '90_plus':0, current:0 }
    allVendorInvoices.forEach(i => {
      const totalPaid = (i.payments ?? []).reduce((s, p) => s + p.amount, 0)
      const out = Math.max(0, (i.amount ?? 0) - totalPaid)
      payable += out
      if (i.status === 'paid') paid++
      else if (i.status === 'overdue') overdue++
      else unpaid++
      if (out > 0 && i.invoiceDate) {
        const bucket = agingBucket({ ...i, dueDate: new Date(new Date(i.invoiceDate).getTime() + 30 * 86400000).toISOString() })
        aging[bucket] = (aging[bucket] ?? 0) + out
      }
    })
    return { total: allVendorInvoices.length, paid, unpaid, overdue, payable, aging }
  }, [allVendorInvoices])

  const filtered = useMemo(() => allVendorInvoices.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (i.invoiceNumber ?? '').toLowerCase().includes(q)
        || (i.vendorName ?? '').toLowerCase().includes(q)
        || (i.shipmentRef ?? '').toLowerCase().includes(q)
    }
    return true
  }), [allVendorInvoices, search, statusFilter])

  return (
    <div>
      <SectionHeader title="Vendor Invoices (Accounts Payable)" subtitle="Money the business owes to vendors"
        action={<button onClick={() => exportToExcel('vendor-invoices-AP', [{
          name: 'Vendor Invoices',
          rows: allVendorInvoices.map(i => {
            const totalPaid = (i.payments ?? []).reduce((s, p) => s + p.amount, 0)
            return {
              Invoice: i.invoiceNumber, Vendor: i.vendorName, Shipment: i.shipmentRef,
              InvoiceDate: i.invoiceDate?.slice(0,10),
              Amount_SAR: i.amount, Paid_SAR: totalPaid,
              Outstanding_SAR: Math.max(0, i.amount - totalPaid),
              Status: i.status,
            }
          }),
        }])} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
          style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)', color:'#059669' }}>
          <Sheet className="w-3 h-3" /> Excel
        </button>} />

      <div className="grid grid-cols-5 gap-2 mb-3">
        <KPIChip label="Total"        value={stats.total}    color="var(--text)" />
        <KPIChip label="Paid"         value={stats.paid}     color="#059669" />
        <KPIChip label="Unpaid"       value={stats.unpaid}   color="#D97706" />
        <KPIChip label="Overdue"      value={stats.overdue}  color="#DC2626" />
        <KPIChip label="Total Payable" value={`SAR ${fmtMoney(stats.payable)}`} color="#8B5CF6" mono small />
      </div>

      <div className="rounded-xl border p-3 mb-3" style={C}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Payables Aging</h4>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Outstanding to vendors by age</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AGING_BUCKETS.map(b => {
            const amt = stats.aging[b.id] ?? 0
            const pct = stats.payable > 0 ? (amt / stats.payable) * 100 : 0
            return (
              <div key={b.id} className="rounded-lg border p-2.5" style={{ background:`${b.c}10`, borderColor:`${b.c}30` }}>
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: b.c }}>{b.label}</div>
                <div className="text-base font-black font-mono mt-0.5" style={{ color: b.c }}>SAR {fmtMoney(amt)}</div>
                <div className="h-1.5 rounded mt-1.5 overflow-hidden" style={{ background:'var(--border)' }}>
                  <div className="h-full" style={{ width:`${pct}%`, background: b.c }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border p-2 flex items-center gap-2 flex-wrap mb-2" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice, vendor, shipment…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatusFilter(v ?? 'all')}
            options={[{ id:'all', label:'All' }, { id:'pending', label:'Pending' }, { id:'partially_paid', label:'Partial' }, { id:'paid', label:'Paid' }]} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Invoice #','Vendor','Shipment','Invoice Date','Due Date','Amount','Paid','Outstanding','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center" style={{ color:'var(--text3)' }}>No vendor invoices match filters</td></tr>
              ) : filtered.map(i => {
                const totalPaid = (i.payments ?? []).reduce((s, p) => s + p.amount, 0)
                const outstanding = Math.max(0, (i.amount ?? 0) - totalPaid)
                const cfg = INVOICE_STATUS_CFG[i.status] ?? INVOICE_STATUS_CFG.pending
                const due = i.invoiceDate ? new Date(new Date(i.invoiceDate).getTime() + 30 * 86400000).toISOString() : null
                return (
                  <tr key={i.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{i.invoiceNumber}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text)' }}>{i.vendorName}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{i.shipmentRef}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(i.invoiceDate)}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(due)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmtMoney(i.amount)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--success)' }}>SAR {fmtMoney(totalPaid)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(outstanding)}</td>
                    <td className="px-3 py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span></td>
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

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — Receipts Management
// ═══════════════════════════════════════════════════════════════════════════
function Section4Receipts({ customers, customerInvoices, customerReceipts, addCustomerReceipt, toast }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recordOpen, setRecordOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)   // 2-stage confirm
  const [draft, setDraft] = useState({ invoiceId:'', date:'', amount:'', method:'Wire Transfer', referenceNumber:'', attachment:'' })

  const stats = useMemo(() => {
    const total = customerReceipts.length
    const thisMonth = customerReceipts.filter(r => isThisMonth(r.date)).length
    const pendingVerify = customerReceipts.filter(r => r.status === 'pending_verification').length
    const rejected = customerReceipts.filter(r => r.status === 'rejected').length
    return { total, thisMonth, pendingVerify, rejected }
  }, [customerReceipts])

  const filtered = useMemo(() => customerReceipts.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const cust = customers.find(c => c.id === r.customerId)
      return r.id.toLowerCase().includes(q) || (cust?.name ?? '').toLowerCase().includes(q) || (r.referenceNumber ?? '').toLowerCase().includes(q)
    }
    return true
  }), [customerReceipts, customers, search, statusFilter])

  const handleRecord = () => {
    if (!draft.invoiceId || !draft.date || !draft.amount || !draft.referenceNumber || !draft.attachment) {
      toast.warning('Missing fields', 'Invoice, date, amount, reference and attachment are all required.')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    const inv = customerInvoices.find(i => i.id === draft.invoiceId)
    if (!inv) { toast.warning('Invalid invoice', 'Cannot find the selected invoice.'); return }
    const newReceipt = {
      id: `RCPT-${String(customerReceipts.length + 1).padStart(3, '0')}`,
      customerId: inv.customerId,
      invoiceId: inv.id,
      date: new Date(draft.date).toISOString(),
      amount: Number(draft.amount),
      paymentMethod: draft.method,
      referenceNumber: draft.referenceNumber,
      attachment: draft.attachment,
      status: 'pending_verification',
      createdBy: 'Khalid Salman',
    }
    addCustomerReceipt(newReceipt)
    toast.success('Receipt recorded', `${newReceipt.id} · SAR ${fmtMoney(newReceipt.amount)} · queued for verification`)
    setRecordOpen(false); setConfirmOpen(false)
    setDraft({ invoiceId:'', date:'', amount:'', method:'Wire Transfer', referenceNumber:'', attachment:'' })
  }

  return (
    <div>
      <SectionHeader title="Receipts Management" subtitle="Customer payments received against invoices"
        action={<div className="flex items-center gap-1.5">
          <button onClick={() => exportToExcel('customer-receipts', [{
            name: 'Customer Receipts',
            rows: customerReceipts.map(r => ({
              Receipt: r.id, Customer: r.customerId, Invoice: r.invoiceId,
              Date: r.date?.slice(0,10), Amount_SAR: r.amount,
              Method: r.paymentMethod, Reference: r.referenceNumber,
              Status: r.status, CreatedBy: r.createdBy,
            })),
          }])} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
            style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)', color:'#059669' }}>
            <Sheet className="w-3 h-3" /> Excel
          </button>
          <button onClick={() => setRecordOpen(true)} className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-white flex items-center gap-1" style={{ background:'var(--primary)' }}>
            <Plus className="w-3 h-3" /> Record Receipt
          </button>
        </div>} />

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPIChip label="Total Receipts"   value={stats.total} color="var(--text)" />
        <KPIChip label="This Month"       value={stats.thisMonth} color="#06B6D4" />
        <KPIChip label="Pending Verify"   value={stats.pendingVerify} color="#D97706" />
        <KPIChip label="Rejected"         value={stats.rejected} color="#DC2626" />
      </div>

      <div className="rounded-xl border p-2 flex items-center gap-2 flex-wrap mb-2" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt, customer, reference…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatusFilter(v ?? 'all')}
            options={[{id:'all', label:'All'}, ...Object.entries(RECEIPT_STATUS_CFG).map(([k, cfg]) => ({ id:k, label: cfg.label }))]} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Receipt #','Customer','Invoice','Date','Amount','Method','Reference','Attachment','Status','Created By'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center" style={{ color:'var(--text3)' }}>No receipts match filters</td></tr>
              ) : filtered.map(r => {
                const cust = customers.find(c => c.id === r.customerId)
                const cfg = RECEIPT_STATUS_CFG[r.status]
                return (
                  <tr key={r.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{r.id}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text)' }}>{cust?.name ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{r.invoiceId}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(r.date)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(r.amount)}</td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text2)' }}>{r.paymentMethod}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{r.referenceNumber}</td>
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-1 text-[12.5px]" style={{ color:'var(--text3)' }}><FileText className="w-2.5 h-2.5" />{r.attachment}</span></td>
                    <td className="px-3 py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span></td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text3)' }}>{r.createdBy}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Receipt modal */}
      <EnterpriseModal open={recordOpen} onClose={() => setRecordOpen(false)}
        title="Record Customer Receipt" subtitle="Log a payment received against a customer invoice"
        icon={<Receipt className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setRecordOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleRecord}>Continue</ModalBtn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Customer Invoice <span style={{ color:'var(--danger)' }}>*</span></label>
            <Select2 value={draft.invoiceId} onChange={v => setDraft({ ...draft, invoiceId: v })} placeholder="Select unpaid invoice…"
              options={customerInvoices.filter(i => i.status !== 'paid').map(i => {
                const cust = customers.find(c => c.id === i.customerId)
                const out = Math.max(0, i.amount - (i.paidAmount ?? 0))
                return { id: i.id, label: `${i.id} · ${cust?.name} · outstanding SAR ${fmtMoney(out)}` }
              })} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Receipt Date <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="number" value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Method <span style={{ color:'var(--danger)' }}>*</span></label>
            <Select2 size="sm" value={draft.method} onChange={v => setDraft({ ...draft, method: v })}
              options={PAYMENT_METHODS.map(m => ({ id: m, label: m }))} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Bank/Reference # <span style={{ color:'var(--danger)' }}>*</span></label>
            <input value={draft.referenceNumber} onChange={e => setDraft({ ...draft, referenceNumber: e.target.value })} placeholder="WT-XXXXXXX"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Receipt Attachment <span style={{ color:'var(--danger)' }}>*</span></label>
            {draft.attachment ? (
              <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                <Receipt className="w-4 h-4" style={{ color:'var(--success)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{draft.attachment}</div>
                </div>
                <button type="button" onClick={() => setDraft({ ...draft, attachment: '' })} className="w-7 h-7 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, attachment: f.name }) }} />
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Receipt</div>
              </label>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {/* Confirm step */}
      <EnterpriseModal open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="Confirm Receipt" subtitle="Review before saving"
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)}>Go Back</ModalBtn><ModalBtn onClick={handleConfirm}>Confirm &amp; Save</ModalBtn></>}>
        <div className="space-y-2 text-xs">
          <div className="rounded-lg border p-3" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--success)' }}>You're about to record:</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <KV k="Invoice"      v={draft.invoiceId} />
              <KV k="Amount"       v={`SAR ${fmtMoney(Number(draft.amount))}`} />
              <KV k="Date"         v={fmtDate(draft.date)} />
              <KV k="Method"       v={draft.method} />
              <KV k="Reference"    v={draft.referenceNumber} />
              <KV k="Attachment"   v={draft.attachment} />
            </div>
          </div>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>The receipt will be created in <strong>Pending Verification</strong> status. The invoice's <em>paid amount</em> will be updated and its status recomputed automatically.</p>
        </div>
      </EnterpriseModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — Vendor Payments
// ═══════════════════════════════════════════════════════════════════════════
function Section5VendorPayments({ allVendorInvoices }) {
  const [search, setSearch] = useState('')

  // Flatten all payments across all vendor invoices
  const allPayments = useMemo(() => {
    const out = []
    allVendorInvoices.forEach(vi => {
      (vi.payments ?? []).forEach(p => out.push({
        ...p,
        vendorName: vi.vendorName,
        invoiceNumber: vi.invoiceNumber,
        shipmentRef: vi.shipmentRef,
      }))
    })
    return out.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [allVendorInvoices])

  const stats = useMemo(() => {
    const total = allPayments.length
    const thisMonth = allPayments.filter(p => isThisMonth(p.date)).length
    const totalAmount = allPayments.reduce((s, p) => s + p.amount, 0)
    return { total, thisMonth, totalAmount, pending: 0, scheduled: 0 }
  }, [allPayments])

  const filtered = useMemo(() => allPayments.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      return (p.vendorName ?? '').toLowerCase().includes(q) || (p.invoiceNumber ?? '').toLowerCase().includes(q) || (p.referenceNumber ?? '').toLowerCase().includes(q)
    }
    return true
  }), [allPayments, search])

  return (
    <div>
      <SectionHeader title="Vendor Payments" subtitle="Disbursements made to transport vendors"
        action={<button onClick={() => exportToExcel('vendor-payments', [{
          name: 'Vendor Payments',
          rows: allPayments.map(p => ({
            Payment: p.id, Vendor: p.vendorName, Invoice: p.invoiceNumber, Shipment: p.shipmentRef,
            Date: p.date?.slice(0,10),
            Amount_SAR: p.amount,
            Reference: p.referenceNumber,
            Attachment: p.proofFile,
          })),
        }])} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
          style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)', color:'#059669' }}>
          <Sheet className="w-3 h-3" /> Excel
        </button>} />

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPIChip label="Total Payments" value={stats.total} color="var(--text)" />
        <KPIChip label="This Month"     value={stats.thisMonth} color="#06B6D4" />
        <KPIChip label="Pending"        value={stats.pending} color="#D97706" />
        <KPIChip label="Total Amount"   value={`SAR ${fmtMoney(stats.totalAmount)}`} color="#059669" mono small />
      </div>

      <div className="rounded-xl border p-2 flex items-center gap-2 flex-wrap mb-2" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, invoice, reference…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Payment #','Vendor','Invoice #','Date','Amount','Method','Bank Ref','Attachment','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center" style={{ color:'var(--text3)' }}>No payments yet</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderTop:'1px solid var(--border)' }}>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{p.id}</td>
                  <td className="px-3 py-2" style={{ color:'var(--text)' }}>{p.vendorName}</td>
                  <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{p.invoiceNumber}</td>
                  <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(p.date)}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(p.amount)}</td>
                  <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text2)' }}>Wire Transfer</td>
                  <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{p.referenceNumber}</td>
                  <td className="px-3 py-2"><span className="inline-flex items-center gap-1 text-[12.5px]" style={{ color:'var(--text3)' }}><FileText className="w-2.5 h-2.5" />{p.proofFile}</span></td>
                  <td className="px-3 py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>Completed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Shared bits ────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-2" style={{ borderBottom:'2px solid var(--text)' }}>
      <div>
        <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>{title}</h3>
        <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function KPIChip({ label, value, color, mono, small }) {
  return (
    <div className="rounded-lg border p-2" style={{ ...C, borderLeft:`3px solid ${color}` }}>
      <div className="text-[8.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</div>
      <div className={`${small ? 'text-sm' : 'text-lg'} font-black ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</div>
    </div>
  )
}

function KV({ k, v }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{k}</div>
      <div className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{v}</div>
    </div>
  )
}
