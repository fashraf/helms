// Customer-centric Sales Order List
//   Customer → Order Details + cost → View Detail with timeline → Add Invoice → Add Receipt
import { useState, useMemo } from 'react'
import {
  Building2, ChevronDown, ChevronRight, Plus, FileText, Receipt, Upload, X, Calendar,
  Search, Filter, Truck, Plane, MapPin, Clock, CheckCircle2, AlertCircle, DollarSign, Eye,
  Hash, ArrowRight, FileCheck, CreditCard,
} from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useToastStore from '../../store/toastStore'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import { INVOICE_STATUS_CFG, RECEIPT_STATUS_CFG, PAYMENT_METHODS } from '../../api/mock/financeData'
import { OVERALL_STATUS_CFG, deriveOverallStatus, LOCATION_MASTER } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtMoney = (n) => (n ?? 0).toLocaleString()
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'
function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }

export default function CustomerOrdersTab() {
  const { customers, customerInvoices, customerReceipts, addCustomerInvoice, addCustomerReceipt } = useFinanceStore()
  const { localShipments, intlShipments } = useShipmentV2Store()
  const toast = useToastStore()

  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState(new Set())
  const [detailOrder, setDetailOrder] = useState(null) // shipment-as-order
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [confirmInvoice, setConfirmInvoice] = useState(false)
  const [confirmReceipt, setConfirmReceipt] = useState(false)

  const [invoiceDraft, setInvoiceDraft] = useState({ amount:'', dueDate:'', contractNumber:'', attachment:'', notes:'' })
  const [receiptDraft, setReceiptDraft] = useState({ invoiceId:'', date:'', amount:'', method:'Wire Transfer', referenceNumber:'', attachment:'', notes:'' })

  // ─── Aggregation: customer → orders ────────────────────────────────
  const allShipments = useMemo(() => {
    const annotate = (s, kind) => ({ ...s, _kind: kind, _overall: deriveOverallStatus({ ...s, _kind: kind }) })
    return [
      ...(localShipments ?? []).map(s => annotate(s, 'local')),
      ...(intlShipments ?? []).map(s => annotate(s, 'international')),
    ]
  }, [localShipments, intlShipments])

  // Map shipments → customers by name match (operator/project loose heuristic)
  // In production this would be a real customer FK. Here we round-robin assign by index.
  const orderCustomerMap = useMemo(() => {
    const map = {}
    allShipments.forEach((s, idx) => {
      const cust = customers[idx % customers.length]
      map[s.id] = cust?.id
    })
    return map
  }, [allShipments, customers])

  const customerGroups = useMemo(() => {
    const groups = customers.map(cust => {
      const orders = allShipments.filter(s => orderCustomerMap[s.id] === cust.id)
      const invoices = customerInvoices.filter(i => i.customerId === cust.id)
      const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0)
      const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount ?? 0), 0)
      const outstanding = Math.max(0, totalBilled - totalPaid)
      return { customer: cust, orders, invoices, totalBilled, totalPaid, outstanding }
    })
    if (!search) return groups.filter(g => g.orders.length > 0)
    const q = search.toLowerCase()
    return groups.filter(g => g.customer.name.toLowerCase().includes(q) || g.orders.some(o => o.id.toLowerCase().includes(q)))
  }, [customers, allShipments, customerInvoices, orderCustomerMap, search])

  const toggle = (id) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  // ─── Invoice flow ──────────────────────────────────────────────────
  const handleInvoiceSubmit = () => {
    if (!invoiceDraft.amount || !invoiceDraft.dueDate || !invoiceDraft.attachment) {
      toast.warning('Missing fields', 'Amount, due date and invoice attachment are required.')
      return
    }
    setConfirmInvoice(true)
  }
  const handleInvoiceConfirm = () => {
    if (!detailOrder) return
    const custId = orderCustomerMap[detailOrder.id]
    const id = `CINV-${new Date().getFullYear()}-${String(customerInvoices.length + 1).padStart(3, '0')}`
    addCustomerInvoice({
      id, customerId: custId,
      contractNumber: invoiceDraft.contractNumber || '—',
      shipmentRef: detailOrder.id,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(invoiceDraft.dueDate).toISOString(),
      amount: Number(invoiceDraft.amount),
      paidAmount: 0,
      attachment: invoiceDraft.attachment,
      notes: invoiceDraft.notes,
      status: 'pending',
    })
    toast.success('Invoice created', `${id} · SAR ${fmtMoney(Number(invoiceDraft.amount))}`)
    setInvoiceOpen(false); setConfirmInvoice(false)
    setInvoiceDraft({ amount:'', dueDate:'', contractNumber:'', attachment:'', notes:'' })
  }

  // ─── Receipt flow ──────────────────────────────────────────────────
  const handleReceiptSubmit = () => {
    if (!receiptDraft.invoiceId || !receiptDraft.date || !receiptDraft.amount || !receiptDraft.referenceNumber || !receiptDraft.attachment) {
      toast.warning('Missing fields', 'Invoice, date, amount, reference and attachment are all required.')
      return
    }
    setConfirmReceipt(true)
  }
  const handleReceiptConfirm = () => {
    const id = `RCPT-${String(customerReceipts.length + 1).padStart(3, '0')}`
    const inv = customerInvoices.find(i => i.id === receiptDraft.invoiceId)
    if (!inv) { toast.warning('Invalid invoice', 'Cannot find the selected invoice.'); return }
    addCustomerReceipt({
      id,
      customerId: inv.customerId,
      invoiceId: inv.id,
      date: new Date(receiptDraft.date).toISOString(),
      amount: Number(receiptDraft.amount),
      paymentMethod: receiptDraft.method,
      referenceNumber: receiptDraft.referenceNumber,
      attachment: receiptDraft.attachment,
      notes: receiptDraft.notes,
      status: 'pending_verification',
      createdBy: 'Khalid Salman',
    })
    toast.success('Receipt recorded', `${id} · queued for verification`)
    setReceiptOpen(false); setConfirmReceipt(false)
    setReceiptDraft({ invoiceId:'', date:'', amount:'', method:'Wire Transfer', referenceNumber:'', attachment:'', notes:'' })
  }

  // ─── Order detail invoices ──────────────────────────────────────────
  const detailInvoices = useMemo(() => {
    if (!detailOrder) return []
    return customerInvoices.filter(i => i.shipmentRef === detailOrder.id)
  }, [detailOrder, customerInvoices])
  const detailReceipts = useMemo(() => {
    const invIds = detailInvoices.map(i => i.id)
    return customerReceipts.filter(r => invIds.includes(r.invoiceId))
  }, [detailInvoices, customerReceipts])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or order number…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        {search && <button onClick={() => setSearch('')} className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}><X className="w-3 h-3" /> Clear</button>}
      </div>

      {/* Customer groups */}
      {customerGroups.length === 0 ? (
        <div className="rounded-xl border py-12 text-center" style={C}>
          <Building2 className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
          <p className="text-sm" style={{ color:'var(--text2)' }}>No customers match your search</p>
        </div>
      ) : customerGroups.map(g => {
        const open = expanded.has(g.customer.id)
        return (
          <div key={g.customer.id} className="rounded-xl border overflow-hidden" style={C}>
            <button onClick={() => toggle(g.customer.id)} className="w-full p-3 flex items-center gap-3 transition-colors" style={{ background: open ? 'var(--bg2)' : 'var(--card)' }}>
              {open ? <ChevronDown className="w-4 h-4" style={{ color:'var(--text3)' }} /> : <ChevronRight className="w-4 h-4" style={{ color:'var(--text3)' }} />}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background:'var(--primary-light)' }}>
                <Building2 className="w-4 h-4" style={{ color:'var(--primary)' }} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{g.customer.name}</div>
                <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>
                  {g.customer.contact} · {g.customer.email} · Credit terms {g.customer.creditTerm}d
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-right">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Orders</div>
                  <div className="text-sm font-bold font-mono" style={{ color:'var(--text)' }}>{g.orders.length}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Billed</div>
                  <div className="text-sm font-bold font-mono" style={{ color:'var(--primary)' }}>SAR {fmtMoney(g.totalBilled)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Paid</div>
                  <div className="text-sm font-bold font-mono" style={{ color:'var(--success)' }}>SAR {fmtMoney(g.totalPaid)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Outstanding</div>
                  <div className="text-sm font-bold font-mono" style={{ color: g.outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(g.outstanding)}</div>
                </div>
              </div>
            </button>

            {open && (
              <div className="p-3" style={{ borderTop:'1px solid var(--border)', background:'var(--bg2)' }}>
                {g.orders.length === 0 ? (
                  <div className="text-center text-xs py-4" style={{ color:'var(--text3)' }}>No orders for this customer</div>
                ) : (
                  <div className="space-y-2">
                    {g.orders.map(o => {
                      const isIntl = o._kind === 'international'
                      const cfg = OVERALL_STATUS_CFG[o._overall]
                      const orderInvoices = customerInvoices.filter(i => i.shipmentRef === o.id)
                      const orderBilled = orderInvoices.reduce((sum, i) => sum + i.amount, 0)
                      const orderPaid = orderInvoices.reduce((sum, i) => sum + (i.paidAmount ?? 0), 0)
                      return (
                        <div key={o.id} className="rounded-lg border p-3 grid grid-cols-12 gap-3 items-center" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                          <div className="col-span-1 flex items-center justify-center">
                            {isIntl ? <Plane className="w-4 h-4" style={{ color:'var(--primary)' }} /> : <Truck className="w-4 h-4" style={{ color:'var(--success)' }} />}
                          </div>
                          <div className="col-span-2">
                            <div className="font-mono text-[11px] font-bold" style={{ color:'var(--primary)' }}>{o.id}</div>
                            <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{o.project ?? '—'}</div>
                          </div>
                          <div className="col-span-3 text-[12.5px]" style={{ color:'var(--text2)' }}>
                            {isIntl
                              ? `${o.originCountry ?? o.origins?.[0]?.country ?? '—'} → ${o.destinations?.[0]?.country ?? '—'}`
                              : `${locName(o.route?.origins?.[0]?.locationId)} → ${locName(o.route?.stops?.[o.route?.stops?.length - 1]?.locationId)}`}
                          </div>
                          <div className="col-span-2">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                              <span>{cfg.icon}</span>{cfg.label}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Billed / Paid</div>
                            <div className="text-[11px] font-mono font-bold" style={{ color:'var(--text)' }}>
                              SAR {fmtMoney(orderBilled)} <span style={{ color:'var(--success)' }}>/ {fmtMoney(orderPaid)}</span>
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <button onClick={() => setDetailOrder(o)} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1" style={{ background:'var(--card)', color:'var(--primary)', borderColor:'var(--border)' }}>
                              <Eye className="w-3 h-3" /> View Detail
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ─── Order Detail Modal ─────────────────────────────────────────── */}
      <EnterpriseModal open={!!detailOrder} onClose={() => setDetailOrder(null)}
        title={detailOrder ? `Order ${detailOrder.id}` : ''}
        subtitle={detailOrder ? `${detailOrder.project ?? '—'} · ${detailOrder._kind === 'international' ? 'International' : 'Local'} shipment` : ''}
        icon={<FileCheck className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="xl"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setDetailOrder(null)}>Close</ModalBtn>
          <ModalBtn variant="secondary" onClick={() => setInvoiceOpen(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add Invoice
          </ModalBtn>
          <ModalBtn onClick={() => setReceiptOpen(true)} disabled={detailInvoices.length === 0}>
            <Receipt className="w-3 h-3 mr-1" /> Add Receipt
          </ModalBtn>
        </>}>
        {detailOrder && (
          <div className="space-y-4">
            {/* Shipment summary */}
            <div className="grid grid-cols-4 gap-2">
              <SummaryBlock label="Type" value={detailOrder._kind === 'international' ? 'International' : 'Local'} icon={detailOrder._kind === 'international' ? Plane : Truck} />
              <SummaryBlock label="Status" value={OVERALL_STATUS_CFG[detailOrder._overall]?.label} icon={CheckCircle2} />
              <SummaryBlock label="Created" value={fmtDate(detailOrder.createdAt ?? detailOrder.shipmentDate)} icon={Calendar} />
              <SummaryBlock label="ETA" value={fmtDate(detailOrder.eta)} icon={Clock} />
            </div>

            {/* Timeline */}
            <div className="rounded-xl border p-3" style={C}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text)' }}>Order Timeline</h4>
              <div className="space-y-2">
                {[
                  { label:'Order Placed',     date: detailOrder.createdAt ?? detailOrder.shipmentDate, done:true },
                  { label:'Quote Approved',   date: detailOrder.quoteApprovedAt,  done: !!detailOrder.quoteApprovedAt },
                  { label:'Packed',           date: detailOrder.packedAt,         done: !!detailOrder.packedAt },
                  { label:'Released',         date: detailOrder.releasedAt,       done: !!detailOrder.releasedAt },
                  { label:'Delivered',        date: detailOrder.actualDeliveryDate, done: !!detailOrder.actualDeliveryDate },
                ].map((step, idx, arr) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: step.done ? 'var(--success)' : 'var(--bg2)', border:'2px solid', borderColor: step.done ? 'var(--success)' : 'var(--border)' }}>
                        {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      {idx < arr.length - 1 && <div className="absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-4" style={{ background: arr[idx + 1].done ? 'var(--success)' : 'var(--border)' }} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold" style={{ color: step.done ? 'var(--text)' : 'var(--text3)' }}>{step.label}</div>
                      <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{step.done ? fmtDateTime(step.date) : 'Pending'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices for this order */}
            <div className="rounded-xl border" style={C}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Invoices ({detailInvoices.length})</h4>
                <button onClick={() => setInvoiceOpen(true)} className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-0.5 rounded" style={{ color:'var(--primary)' }}>
                  <Plus className="w-3 h-3" /> Add Invoice
                </button>
              </div>
              {detailInvoices.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color:'var(--text3)' }}>No invoices raised yet</div>
              ) : (
                <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                  {detailInvoices.map(i => {
                    const cfg = INVOICE_STATUS_CFG[i.status]
                    const outstanding = Math.max(0, i.amount - (i.paidAmount ?? 0))
                    return (
                      <div key={i.id} className="px-3 py-2 grid grid-cols-12 gap-2 text-xs items-center">
                        <div className="col-span-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{i.id}</div>
                        <div className="col-span-2 font-mono text-[12.5px]" style={{ color:'var(--text3)' }}>{fmtDate(i.invoiceDate)}</div>
                        <div className="col-span-2 font-mono text-[12.5px]" style={{ color:'var(--text3)' }}>Due {fmtDate(i.dueDate)}</div>
                        <div className="col-span-2 font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmtMoney(i.amount)}</div>
                        <div className="col-span-2 font-mono" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmtMoney(outstanding)} out</div>
                        <div className="col-span-2 flex justify-end">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Receipts for this order */}
            <div className="rounded-xl border" style={C}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Receipts ({detailReceipts.length})</h4>
                <button onClick={() => setReceiptOpen(true)} disabled={detailInvoices.length === 0}
                  className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-0.5 rounded disabled:opacity-50" style={{ color:'var(--success)' }}>
                  <Plus className="w-3 h-3" /> Add Receipt
                </button>
              </div>
              {detailReceipts.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color:'var(--text3)' }}>No receipts recorded yet</div>
              ) : (
                <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                  {detailReceipts.map(r => {
                    const cfg = RECEIPT_STATUS_CFG[r.status]
                    return (
                      <div key={r.id} className="px-3 py-2 grid grid-cols-12 gap-2 text-xs items-center">
                        <div className="col-span-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{r.id}</div>
                        <div className="col-span-2 font-mono text-[12.5px]" style={{ color:'var(--text3)' }}>{fmtDate(r.date)}</div>
                        <div className="col-span-2 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(r.amount)}</div>
                        <div className="col-span-2 text-[12.5px]" style={{ color:'var(--text2)' }}>{r.paymentMethod}</div>
                        <div className="col-span-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{r.referenceNumber}</div>
                        <div className="col-span-2 flex justify-end">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </EnterpriseModal>

      {/* ─── Add Invoice Modal ─────────────────────────────────────────── */}
      <EnterpriseModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)}
        title="Add Invoice" subtitle={detailOrder ? `For order ${detailOrder.id}` : ''}
        icon={<FileText className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setInvoiceOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleInvoiceSubmit}>Continue</ModalBtn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="number" value={invoiceDraft.amount} onChange={e => setInvoiceDraft({ ...invoiceDraft, amount: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Due Date <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="date" value={invoiceDraft.dueDate} onChange={e => setInvoiceDraft({ ...invoiceDraft, dueDate: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Contract Number</label>
            <input value={invoiceDraft.contractNumber} onChange={e => setInvoiceDraft({ ...invoiceDraft, contractNumber: e.target.value })} placeholder="CON-XXX-2026-Y00"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Notes</label>
            <textarea value={invoiceDraft.notes} onChange={e => setInvoiceDraft({ ...invoiceDraft, notes: e.target.value })} rows={2} placeholder="Optional notes for this invoice…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Upload Invoice <span style={{ color:'var(--danger)' }}>*</span></label>
            {invoiceDraft.attachment ? (
              <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                <FileText className="w-4 h-4" style={{ color:'var(--success)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{invoiceDraft.attachment}</div>
                </div>
                <button type="button" onClick={() => setInvoiceDraft({ ...invoiceDraft, attachment: '' })} className="w-7 h-7 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) setInvoiceDraft({ ...invoiceDraft, attachment: f.name }) }} />
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Invoice PDF</div>
              </label>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {/* Confirm Invoice */}
      <EnterpriseModal open={confirmInvoice} onClose={() => setConfirmInvoice(false)}
        title="Confirm Invoice" subtitle="Review before saving"
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmInvoice(false)}>Go Back</ModalBtn><ModalBtn onClick={handleInvoiceConfirm}>Confirm &amp; Create</ModalBtn></>}>
        <div className="rounded-lg border p-3 grid grid-cols-2 gap-2 text-xs" style={{ background:'rgba(37,99,235,.08)', borderColor:'var(--primary)' }}>
          <KV k="Order"    v={detailOrder?.id ?? '—'} />
          <KV k="Amount"   v={`SAR ${fmtMoney(Number(invoiceDraft.amount))}`} />
          <KV k="Due Date" v={fmtDate(invoiceDraft.dueDate)} />
          <KV k="Contract" v={invoiceDraft.contractNumber || '—'} />
          <KV k="Attachment" v={invoiceDraft.attachment} />
        </div>
      </EnterpriseModal>

      {/* ─── Add Receipt Modal ─────────────────────────────────────────── */}
      <EnterpriseModal open={receiptOpen} onClose={() => setReceiptOpen(false)}
        title="Add Receipt" subtitle={detailOrder ? `Against an invoice for ${detailOrder.id}` : ''}
        icon={<Receipt className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setReceiptOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleReceiptSubmit}>Continue</ModalBtn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice <span style={{ color:'var(--danger)' }}>*</span></label>
            <Select2 value={receiptDraft.invoiceId} onChange={v => setReceiptDraft({ ...receiptDraft, invoiceId: v })} placeholder="Select invoice for this order…"
              options={detailInvoices.filter(i => i.status !== 'paid').map(i => {
                const out = Math.max(0, i.amount - (i.paidAmount ?? 0))
                return { id: i.id, label: `${i.id} · invoice SAR ${fmtMoney(i.amount)} · outstanding SAR ${fmtMoney(out)}` }
              })} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Receipt Date <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="date" value={receiptDraft.date} onChange={e => setReceiptDraft({ ...receiptDraft, date: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Amount Paid (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="number" value={receiptDraft.amount} onChange={e => setReceiptDraft({ ...receiptDraft, amount: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Method <span style={{ color:'var(--danger)' }}>*</span></label>
            <Select2 size="sm" value={receiptDraft.method} onChange={v => setReceiptDraft({ ...receiptDraft, method: v })}
              options={PAYMENT_METHODS.map(m => ({ id: m, label: m }))} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Bank/Reference # <span style={{ color:'var(--danger)' }}>*</span></label>
            <input value={receiptDraft.referenceNumber} onChange={e => setReceiptDraft({ ...receiptDraft, referenceNumber: e.target.value })} placeholder="WT-XXXXXXX"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Transaction Notes</label>
            <textarea value={receiptDraft.notes} onChange={e => setReceiptDraft({ ...receiptDraft, notes: e.target.value })} rows={2} placeholder="Optional details about the payment…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Upload Receipt <span style={{ color:'var(--danger)' }}>*</span></label>
            {receiptDraft.attachment ? (
              <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                <Receipt className="w-4 h-4" style={{ color:'var(--success)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{receiptDraft.attachment}</div>
                </div>
                <button type="button" onClick={() => setReceiptDraft({ ...receiptDraft, attachment: '' })} className="w-7 h-7 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) setReceiptDraft({ ...receiptDraft, attachment: f.name }) }} />
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Receipt</div>
              </label>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {/* Confirm Receipt */}
      <EnterpriseModal open={confirmReceipt} onClose={() => setConfirmReceipt(false)}
        title="Confirm Receipt" subtitle="Review before saving"
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmReceipt(false)}>Go Back</ModalBtn><ModalBtn onClick={handleReceiptConfirm}>Confirm &amp; Save</ModalBtn></>}>
        <div className="rounded-lg border p-3 grid grid-cols-2 gap-2 text-xs" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
          <KV k="Invoice"   v={receiptDraft.invoiceId} />
          <KV k="Date"      v={fmtDate(receiptDraft.date)} />
          <KV k="Amount"    v={`SAR ${fmtMoney(Number(receiptDraft.amount))}`} />
          <KV k="Method"    v={receiptDraft.method} />
          <KV k="Reference" v={receiptDraft.referenceNumber} />
          <KV k="Attachment" v={receiptDraft.attachment} />
        </div>
        <p className="text-[11px] mt-2" style={{ color:'var(--text3)' }}>The receipt will be saved in <strong>Pending Verification</strong> status and the invoice's paid amount will be updated.</p>
      </EnterpriseModal>
    </div>
  )
}

function SummaryBlock({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border p-2.5" style={C}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color:'var(--primary)' }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{value}</div>
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
