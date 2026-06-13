// Finance Dashboard · Sections 6-10
//   6. Revenue Analysis        7. Expense Analysis
//   8. Profitability Analysis  9. Cash Flow Overview
//   10. Global Filters (top of dashboard)
import { useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Activity, Filter, X, Calendar,
  Award, Layers, Building2, Truck, Plane, Download, Sheet, FileText,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart as PieChartIcon, Wallet,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import Select2 from '../../components/ui/Select2'
import { REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from '../../api/mock/financeData'
import { fmtMoney, fmtDate, isInMonth, lastNMonths, exportToExcel } from './financeExport'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL FILTERS BAR — Section 10 (rendered at top of dashboard)
// ═══════════════════════════════════════════════════════════════════════════
export function GlobalFilters({ filters, setFilters, customers, vendors, shipments }) {
  const active = Object.values(filters).some(v => v && v !== 'all')
  return (
    <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
      <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
      <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Global Filters:</span>
      <div className="w-36">
        <Select2 size="sm" value={filters.dateRange} onChange={v => setFilters({ ...filters, dateRange: v ?? 'all' })}
          options={[
            { id:'all', label:'All Time' },
            { id:'this_month', label:'This Month' },
            { id:'last_month', label:'Last Month' },
            { id:'this_quarter', label:'This Quarter' },
            { id:'this_year', label:'This Year' },
            { id:'last_30', label:'Last 30 Days' },
            { id:'last_90', label:'Last 90 Days' },
          ]} />
      </div>
      <div className="w-44">
        <Select2 size="sm" value={filters.customer} onChange={v => setFilters({ ...filters, customer: v ?? 'all' })}
          options={[{ id:'all', label:'All Customers' }, ...customers.map(c => ({ id: c.id, label: c.name }))]} />
      </div>
      <div className="w-44">
        <Select2 size="sm" value={filters.vendor} onChange={v => setFilters({ ...filters, vendor: v ?? 'all' })}
          options={[{ id:'all', label:'All Vendors' }, ...(vendors ?? []).map(v => ({ id: v.id, label: v.name }))]} />
      </div>
      <div className="w-36">
        <Select2 size="sm" value={filters.shipmentType} onChange={v => setFilters({ ...filters, shipmentType: v ?? 'all' })}
          options={[
            { id:'all', label:'All Types' },
            { id:'local', label:'Local' },
            { id:'international', label:'International' },
          ]} />
      </div>
      <div className="w-40">
        <Select2 size="sm" value={filters.invoiceStatus} onChange={v => setFilters({ ...filters, invoiceStatus: v ?? 'all' })}
          options={[
            { id:'all', label:'All Inv Status' },
            { id:'pending', label:'Pending' },
            { id:'partially_paid', label:'Partial' },
            { id:'paid', label:'Paid' },
            { id:'overdue', label:'Overdue' },
          ]} />
      </div>
      {active && (
        <button onClick={() => setFilters(DEFAULT_FILTERS)}
          className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded ml-auto" style={{ color:'var(--danger)' }}>
          <X className="w-3 h-3" /> Clear All
        </button>
      )}
    </div>
  )
}

export const DEFAULT_FILTERS = {
  dateRange: 'all',
  customer: 'all',
  vendor: 'all',
  shipmentType: 'all',
  invoiceStatus: 'all',
  contract: 'all',
  shipment: '',
}

// Filter date helper
export function dateInRange(iso, rangeId) {
  if (rangeId === 'all' || !iso) return true
  const d = new Date(iso)
  const now = new Date()
  if (rangeId === 'this_month')  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  if (rangeId === 'last_month')  {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth()
  }
  if (rangeId === 'this_quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === q
  }
  if (rangeId === 'this_year')   return d.getFullYear() === now.getFullYear()
  if (rangeId === 'last_30')     return (now - d) / 86400000 <= 30
  if (rangeId === 'last_90')     return (now - d) / 86400000 <= 90
  return true
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6 — REVENUE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════
export function Section6Revenue({ customerInvoices, customers, filters }) {
  const filtered = useMemo(() => customerInvoices.filter(i => {
    if (!dateInRange(i.invoiceDate, filters.dateRange)) return false
    if (filters.customer !== 'all' && i.customerId !== filters.customer) return false
    return true
  }), [customerInvoices, filters])

  // Heuristic split by category (in production each invoice would have a category FK)
  const categoryBreakdown = useMemo(() => {
    const totals = { local_ship: 0, intl_ship: 0, customs: 0, warehousing: 0, other: 0 }
    filtered.forEach((inv, i) => {
      // Distribute by deterministic hash on invoice id
      const k = (inv.id?.charCodeAt(inv.id.length - 1) ?? 0) % 100
      if (k < 60)      totals.local_ship  += inv.amount
      else if (k < 85) totals.intl_ship   += inv.amount
      else if (k < 93) totals.customs     += inv.amount
      else if (k < 98) totals.warehousing += inv.amount
      else             totals.other       += inv.amount
    })
    return REVENUE_CATEGORIES.map(c => ({ ...c, value: totals[c.id] ?? 0 }))
  }, [filtered])

  const byCustomer = useMemo(() => {
    const map = {}
    filtered.forEach(inv => { map[inv.customerId] = (map[inv.customerId] ?? 0) + inv.amount })
    return Object.entries(map)
      .map(([id, value]) => ({ name: customers.find(c => c.id === id)?.name ?? id, value }))
      .sort((a, b) => b.value - a.value)
  }, [filtered, customers])

  const byContract = useMemo(() => {
    const map = {}
    filtered.forEach(inv => {
      const k = inv.contractNumber ?? '—'
      if (!map[k]) map[k] = { contract: k, count: 0, value: 0, customer: customers.find(c => c.id === inv.customerId)?.name }
      map[k].count += 1
      map[k].value += inv.amount
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [filtered, customers])

  const trend = useMemo(() => {
    const months = lastNMonths(6)
    return months.map(m => {
      const total = filtered.filter(i => isInMonth(i.invoiceDate, m.year, m.month)).reduce((s, i) => s + i.amount, 0)
      return { name: m.label, value: total }
    })
  }, [filtered])

  const totalRevenue = filtered.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <SectionHeader title="Revenue Analysis" subtitle="Revenue breakdown by category, customer, contract & time"
        onExportExcel={() => exportToExcel('revenue-analysis', [
          { name: 'By Category',  rows: categoryBreakdown.map(c => ({ Category: c.label, Amount_SAR: c.value })) },
          { name: 'By Customer',  rows: byCustomer.map(c => ({ Customer: c.name, Amount_SAR: c.value })) },
          { name: 'By Contract',  rows: byContract.map(c => ({ Contract: c.contract, Customer: c.customer, Invoices: c.count, Amount_SAR: c.value })) },
          { name: 'Monthly Trend',rows: trend.map(m => ({ Month: m.name, Amount_SAR: m.value })) },
        ])} />

      {/* Total + category breakdown */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-3 rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #059669' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Filtered Revenue</div>
          <div className="text-2xl font-black font-mono" style={{ color:'#059669' }}>SAR {fmtMoney(totalRevenue)}</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{filtered.length} invoices</div>
        </div>
        <div className="col-span-9 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>By Revenue Category</h4>
          <div className="grid grid-cols-5 gap-2">
            {categoryBreakdown.map(c => {
              const pct = totalRevenue > 0 ? (c.value / totalRevenue) * 100 : 0
              return (
                <div key={c.id} className="rounded-lg p-2" style={{ background: `${c.color}10`, border: `1px solid ${c.color}30` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.label}</div>
                  <div className="text-sm font-black font-mono mt-0.5" style={{ color: c.color }}>SAR {fmtMoney(c.value)}</div>
                  <div className="h-1.5 rounded mt-1 overflow-hidden" style={{ background:'var(--border)' }}>
                    <div className="h-full" style={{ width:`${pct}%`, background: c.color }} />
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{pct.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Charts row: Monthly trend + Revenue by customer pie */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-7 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>Monthly Revenue Trend</h4>
          <div style={{ width:'100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill:'var(--text3)' }} />
                <YAxis tick={{ fontSize: 10, fill:'var(--text3)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `SAR ${v.toLocaleString()}`} contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-5 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>By Customer (Top {Math.min(byCustomer.length, 6)})</h4>
          <div style={{ width:'100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCustomer.slice(0, 6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={(p) => `${(p.percent * 100).toFixed(0)}%`} labelLine={false}>
                  {byCustomer.slice(0, 6).map((_, idx) => (
                    <Cell key={idx} fill={['#2563EB','#059669','#D97706','#8B5CF6','#EA580C','#06B6D4'][idx % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `SAR ${v.toLocaleString()}`} contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top contracts table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Revenue by Contract</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Contract #','Customer','Invoices','Total Revenue'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byContract.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center" style={{ color:'var(--text3)' }}>No data for current filters</td></tr>
              ) : byContract.slice(0, 8).map(c => (
                <tr key={c.contract} style={{ borderTop:'1px solid var(--border)' }}>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{c.contract}</td>
                  <td className="px-3 py-2" style={{ color:'var(--text)' }}>{c.customer}</td>
                  <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{c.count}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7 — EXPENSE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════
export function Section7Expense({ allVendorInvoices, vendors, filters }) {
  const filtered = useMemo(() => allVendorInvoices.filter(i => {
    if (!dateInRange(i.invoiceDate, filters.dateRange)) return false
    if (filters.vendor !== 'all' && i.vendorId !== filters.vendor) return false
    return true
  }), [allVendorInvoices, filters])

  const totalExpense = filtered.reduce((s, i) => s + i.amount, 0)

  const categoryBreakdown = useMemo(() => {
    const totals = { transport: 0, freight: 0, customs: 0, fuel: 0, driver: 0, warehouse: 0, admin: 0, other: 0 }
    filtered.forEach(inv => {
      const k = (inv.invoiceNumber?.charCodeAt(inv.invoiceNumber.length - 1) ?? 0) % 100
      if (k < 35)      totals.transport  += inv.amount
      else if (k < 55) totals.freight    += inv.amount
      else if (k < 70) totals.customs    += inv.amount
      else if (k < 80) totals.fuel       += inv.amount
      else if (k < 88) totals.driver     += inv.amount
      else if (k < 93) totals.warehouse  += inv.amount
      else if (k < 97) totals.admin      += inv.amount
      else             totals.other      += inv.amount
    })
    return EXPENSE_CATEGORIES.map(c => ({ ...c, value: totals[c.id] ?? 0 }))
  }, [filtered])

  const byVendor = useMemo(() => {
    const map = {}
    filtered.forEach(inv => {
      const k = inv.vendorName ?? 'Unknown'
      map[k] = (map[k] ?? 0) + inv.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const trend = useMemo(() => {
    const months = lastNMonths(6)
    return months.map(m => {
      const total = filtered.filter(i => isInMonth(i.invoiceDate, m.year, m.month)).reduce((s, i) => s + i.amount, 0)
      return { name: m.label, value: total }
    })
  }, [filtered])

  return (
    <div>
      <SectionHeader title="Expense Analysis" subtitle="Cost breakdown by category, vendor & time"
        onExportExcel={() => exportToExcel('expense-analysis', [
          { name: 'By Category', rows: categoryBreakdown.map(c => ({ Category: c.label, Amount_SAR: c.value })) },
          { name: 'By Vendor',   rows: byVendor.map(v => ({ Vendor: v.name, Amount_SAR: v.value })) },
          { name: 'Monthly Trend', rows: trend.map(m => ({ Month: m.name, Amount_SAR: m.value })) },
        ])} />

      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-3 rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #DC2626' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Filtered Expense</div>
          <div className="text-2xl font-black font-mono" style={{ color:'#DC2626' }}>SAR {fmtMoney(totalExpense)}</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{filtered.length} vendor invoices</div>
        </div>
        <div className="col-span-9 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>By Expense Category</h4>
          <div className="grid grid-cols-4 gap-2">
            {categoryBreakdown.map(c => {
              const pct = totalExpense > 0 ? (c.value / totalExpense) * 100 : 0
              return (
                <div key={c.id} className="rounded-lg p-2" style={{ background: `${c.color}10`, border: `1px solid ${c.color}30` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.label}</div>
                  <div className="text-sm font-black font-mono mt-0.5" style={{ color: c.color }}>SAR {fmtMoney(c.value)}</div>
                  <div className="h-1.5 rounded mt-1 overflow-hidden" style={{ background:'var(--border)' }}>
                    <div className="h-full" style={{ width:`${pct}%`, background: c.color }} />
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{pct.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-7 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>Monthly Expense Trend</h4>
          <div style={{ width:'100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill:'var(--text3)' }} />
                <YAxis tick={{ fontSize: 10, fill:'var(--text3)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `SAR ${v.toLocaleString()}`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-5 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>Top Vendors by Spend</h4>
          <div className="space-y-1.5">
            {byVendor.slice(0, 6).map((v, idx) => {
              const pct = byVendor[0]?.value ? (v.value / byVendor[0].value) * 100 : 0
              return (
                <div key={v.name} className="flex items-center gap-2 text-xs">
                  <span className="w-32 truncate font-bold" style={{ color:'var(--text)' }}>{v.name}</span>
                  <div className="flex-1 h-5 rounded relative overflow-hidden" style={{ background:'var(--bg2)' }}>
                    <div className="h-full transition-all" style={{ width:`${pct}%`, background:`hsl(${10 + idx * 25}, 70%, 50%)` }} />
                    <span className="absolute inset-0 flex items-center px-2 text-[12.5px] font-mono font-bold" style={{ color: pct > 25 ? '#fff' : 'var(--text)' }}>
                      SAR {fmtMoney(v.value)}
                    </span>
                  </div>
                </div>
              )
            })}
            {byVendor.length === 0 && <div className="text-center text-[11px] py-6" style={{ color:'var(--text3)' }}>No expense data for filters</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8 — PROFITABILITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════
export function Section8Profitability({ localShipments, customerInvoices, customers, filters }) {
  const profitData = useMemo(() => {
    return (localShipments ?? []).map(s => {
      const revenue = customerInvoices
        .filter(i => i.shipmentRef === s.id && dateInRange(i.invoiceDate, filters.dateRange))
        .reduce((sum, i) => sum + i.amount, 0)
      const cost = (s.vendorInvoices ?? []).reduce((sum, vi) => sum + (vi.amount ?? 0), 0)
      const profit = revenue - cost
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0
      // Customer attribution
      const invForShip = customerInvoices.find(i => i.shipmentRef === s.id)
      const customer = customers.find(c => c.id === invForShip?.customerId)?.name ?? '—'
      const contract = invForShip?.contractNumber ?? '—'
      return { shipmentId: s.id, customer, contract, revenue, cost, profit, margin }
    }).filter(p => p.revenue > 0 || p.cost > 0)
  }, [localShipments, customerInvoices, customers, filters])

  const totals = useMemo(() => {
    const revenue = profitData.reduce((s, p) => s + p.revenue, 0)
    const cost = profitData.reduce((s, p) => s + p.cost, 0)
    const profit = revenue - cost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    return { revenue, cost, profit, margin }
  }, [profitData])

  const byCustomer = useMemo(() => {
    const map = {}
    profitData.forEach(p => {
      if (!map[p.customer]) map[p.customer] = { name: p.customer, revenue:0, cost:0, profit:0 }
      map[p.customer].revenue += p.revenue
      map[p.customer].cost    += p.cost
      map[p.customer].profit  += p.profit
    })
    return Object.values(map).map(c => ({ ...c, margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0 })).sort((a, b) => b.profit - a.profit)
  }, [profitData])

  return (
    <div>
      <SectionHeader title="Profitability Analysis" subtitle="Profit margins at shipment, contract & customer level"
        onExportExcel={() => exportToExcel('profitability', [
          { name: 'By Shipment', rows: profitData.map(p => ({ Shipment: p.shipmentId, Customer: p.customer, Revenue_SAR: p.revenue, Cost_SAR: p.cost, Profit_SAR: p.profit, Margin_pct: p.margin.toFixed(2) })) },
          { name: 'By Customer', rows: byCustomer.map(c => ({ Customer: c.name, Revenue_SAR: c.revenue, Cost_SAR: c.cost, Profit_SAR: c.profit, Margin_pct: c.margin.toFixed(2) })) },
        ])} />

      {/* Totals */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #059669' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Total Revenue</div>
          <div className="text-lg font-black font-mono" style={{ color:'#059669' }}>SAR {fmtMoney(totals.revenue)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #DC2626' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Total Cost</div>
          <div className="text-lg font-black font-mono" style={{ color:'#DC2626' }}>SAR {fmtMoney(totals.cost)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${totals.profit >= 0 ? '#059669' : '#DC2626'}` }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Gross Profit</div>
          <div className="text-lg font-black font-mono" style={{ color: totals.profit >= 0 ? '#059669' : '#DC2626' }}>SAR {fmtMoney(totals.profit)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${totals.margin >= 20 ? '#059669' : totals.margin >= 10 ? '#D97706' : '#DC2626'}` }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Profit Margin</div>
          <div className="text-lg font-black font-mono" style={{ color: totals.margin >= 20 ? '#059669' : totals.margin >= 10 ? '#D97706' : '#DC2626' }}>{totals.margin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Top profitable customers */}
      <div className="rounded-xl border overflow-hidden mb-3" style={C}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Top Profitable Customers</h4>
          <Award className="w-3.5 h-3.5" style={{ color:'var(--warning)' }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Customer','Revenue','Cost','Profit','Margin %'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byCustomer.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center" style={{ color:'var(--text3)' }}>No profitability data for filters</td></tr>
              ) : byCustomer.slice(0, 6).map((c, idx) => (
                <tr key={c.name} style={{ borderTop:'1px solid var(--border)' }}>
                  <td className="px-3 py-2" style={{ color:'var(--text)' }}>
                    <span className="inline-flex items-center gap-1.5">
                      {idx < 3 && <Award className="w-3 h-3" style={{ color: ['#FCD34D','#94A3B8','#D97706'][idx] }} />}
                      <span className="font-bold">{c.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>SAR {fmtMoney(c.revenue)}</td>
                  <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>SAR {fmtMoney(c.cost)}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: c.profit >= 0 ? '#059669' : '#DC2626' }}>SAR {fmtMoney(c.profit)}</td>
                  <td className="px-3 py-2"><span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background: c.margin >= 20 ? 'rgba(5,150,105,.12)' : c.margin >= 10 ? 'rgba(217,119,6,.12)' : 'rgba(220,38,38,.12)', color: c.margin >= 20 ? '#059669' : c.margin >= 10 ? '#D97706' : '#DC2626' }}>{c.margin.toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-shipment detail */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Per-Shipment Profitability</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Shipment #','Customer','Contract','Revenue','Cost','Gross Profit','Margin %'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profitData.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center" style={{ color:'var(--text3)' }}>No profitability data</td></tr>
              ) : profitData.slice(0, 12).map(p => (
                <tr key={p.shipmentId} style={{ borderTop:'1px solid var(--border)' }}>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{p.shipmentId}</td>
                  <td className="px-3 py-2" style={{ color:'var(--text)' }}>{p.customer}</td>
                  <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{p.contract}</td>
                  <td className="px-3 py-2 font-mono" style={{ color:'#059669' }}>SAR {fmtMoney(p.revenue)}</td>
                  <td className="px-3 py-2 font-mono" style={{ color:'#DC2626' }}>SAR {fmtMoney(p.cost)}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: p.profit >= 0 ? '#059669' : '#DC2626' }}>SAR {fmtMoney(p.profit)}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: p.margin >= 20 ? '#059669' : p.margin >= 10 ? '#D97706' : '#DC2626' }}>{p.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9 — CASH FLOW OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
export function Section9CashFlow({ customerReceipts, allVendorInvoices, customerInvoices, filters }) {
  // Cash IN = verified receipts
  const cashIn = useMemo(() => customerReceipts
    .filter(r => r.status === 'verified' && dateInRange(r.date, filters.dateRange))
    .reduce((s, r) => s + r.amount, 0), [customerReceipts, filters])

  // Cash OUT = vendor payments
  const cashOut = useMemo(() => {
    let total = 0
    allVendorInvoices.forEach(vi => {
      (vi.payments ?? []).forEach(p => {
        if (dateInRange(p.date, filters.dateRange)) total += p.amount
      })
    })
    return total
  }, [allVendorInvoices, filters])

  const opening = 250000   // Mock opening balance
  const closing = opening + cashIn - cashOut

  // Expected
  const expectedReceipts = useMemo(() => customerInvoices.reduce((s, i) => s + Math.max(0, i.amount - (i.paidAmount ?? 0)), 0), [customerInvoices])
  const expectedPayments = useMemo(() => allVendorInvoices.reduce((s, vi) => {
    const paid = (vi.payments ?? []).reduce((a, p) => a + p.amount, 0)
    return s + Math.max(0, vi.amount - paid)
  }, 0), [allVendorInvoices])

  // Monthly trend — cash in vs out
  const trend = useMemo(() => {
    const months = lastNMonths(6)
    return months.map(m => {
      const inAmt = customerReceipts.filter(r => r.status === 'verified' && isInMonth(r.date, m.year, m.month)).reduce((s, r) => s + r.amount, 0)
      let outAmt = 0
      allVendorInvoices.forEach(vi => (vi.payments ?? []).forEach(p => { if (isInMonth(p.date, m.year, m.month)) outAmt += p.amount }))
      return { name: m.label, in: inAmt, out: outAmt, net: inAmt - outAmt }
    })
  }, [customerReceipts, allVendorInvoices])

  return (
    <div>
      <SectionHeader title="Cash Flow Overview" subtitle="Inflows, outflows & expected positions"
        onExportExcel={() => exportToExcel('cashflow', [
          { name: 'Summary', rows: [
            { Line: 'Opening Balance',  Amount_SAR: opening },
            { Line: 'Cash Received',    Amount_SAR: cashIn },
            { Line: 'Cash Paid',        Amount_SAR: cashOut },
            { Line: 'Closing Balance',  Amount_SAR: closing },
            { Line: 'Expected Receipts', Amount_SAR: expectedReceipts },
            { Line: 'Expected Payments', Amount_SAR: expectedPayments },
          ]},
          { name: 'Monthly', rows: trend.map(m => ({ Month: m.name, In_SAR: m.in, Out_SAR: m.out, Net_SAR: m.net })) },
        ])} />

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #06B6D4' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Opening Balance</div>
          <div className="text-lg font-black font-mono" style={{ color:'#06B6D4' }}>SAR {fmtMoney(opening)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #059669' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Cash Received (In)</div>
          <div className="text-lg font-black font-mono" style={{ color:'#059669' }}>+ SAR {fmtMoney(cashIn)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #DC2626' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Cash Paid (Out)</div>
          <div className="text-lg font-black font-mono" style={{ color:'#DC2626' }}>− SAR {fmtMoney(cashOut)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${closing >= 0 ? '#059669' : '#DC2626'}` }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Closing Balance</div>
          <div className="text-lg font-black font-mono" style={{ color: closing >= 0 ? '#059669' : '#DC2626' }}>SAR {fmtMoney(closing)}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #D97706' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Expected Receipts</div>
          <div className="text-lg font-black font-mono" style={{ color:'#D97706' }}>SAR {fmtMoney(expectedReceipts)}</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Outstanding AR</div>
        </div>
        <div className="rounded-xl border p-3" style={{ ...C, borderLeft:'3px solid #8B5CF6' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Expected Payments</div>
          <div className="text-lg font-black font-mono" style={{ color:'#8B5CF6' }}>SAR {fmtMoney(expectedPayments)}</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Outstanding AP</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>Cash In vs Cash Out</h4>
          <div style={{ width:'100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill:'var(--text3)' }} />
                <YAxis tick={{ fontSize: 10, fill:'var(--text3)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `SAR ${v.toLocaleString()}`} contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="in" name="Cash In" fill="#059669" radius={[3,3,0,0]} />
                <Bar dataKey="out" name="Cash Out" fill="#DC2626" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-5 rounded-xl border p-3" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>Net Cash Flow (Monthly)</h4>
          <div style={{ width:'100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill:'var(--text3)' }} />
                <YAxis tick={{ fontSize: 10, fill:'var(--text3)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `SAR ${v.toLocaleString()}`} contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="net" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared Section Header with Export buttons ──────────────────────────
function SectionHeader({ title, subtitle, onExportExcel, onExportPDF }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-2" style={{ borderBottom:'2px solid var(--text)' }}>
      <div>
        <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>{title}</h3>
        <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {onExportExcel && (
          <button onClick={onExportExcel}
            className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
            style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)', color:'#059669' }}>
            <Sheet className="w-3 h-3" /> Excel
          </button>
        )}
        <button onClick={() => window.print()}
          className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
          style={{ background:'rgba(220,38,38,.08)', borderColor:'rgba(220,38,38,.3)', color:'#DC2626' }}>
          <FileText className="w-3 h-3" /> PDF
        </button>
      </div>
    </div>
  )
}
