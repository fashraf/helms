// Purchase Order Details · /po/:id
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, DollarSign, Calendar, AlertCircle, AlertTriangle, CheckCircle2,
  Clock, Building2, Hash, Upload, Lock, Send, ChevronRight, Eye, Activity,
  Receipt, Bell, History, User, X, Check, Info,
} from 'lucide-react'
import usePoStore from '../../store/poStore'
import useVendorV2Store from '../../store/vendorV2Store'
import useToastStore from '../../store/toastStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import PrintFrame from '../../components/print/PrintFrame'
import ComparisonSheet from '../../components/print/ComparisonSheet'
import PaymentRequest from '../../components/print/PaymentRequest'
import {
  PO_TYPES, PO_STAGES, PAYMENT_STATUS_CFG, PAYMENT_TRIGGERS, INCOTERMS,
  computePaymentStatus, daysBetween, totalPaidFor, nextUnpaid, daysUntilNextPayment, poPaymentStatus,
} from '../../api/mock/poData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtMoney = (n) => (Number(n) || 0).toLocaleString()
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

export default function PODetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pos, advanceStage, payMilestone } = usePoStore()
  const { vendors: vendorMaster } = useVendorV2Store()
  const toast = useToastStore()
  const po = pos.find(p => p.id === id)
  const vendorRecord = useMemo(() => vendorMaster.find(v => v.id === po?.vendorId), [vendorMaster, po])

  const [advanceModal, setAdvanceModal] = useState(false)
  const [advanceRemarks, setAdvanceRemarks] = useState('')
  const [payModal, setPayModal] = useState(null) // milestoneId
  const [payDraft, setPayDraft] = useState({ paidDate: new Date().toISOString().slice(0, 10), receipt:'', remarks:'' })
  const [cmpOpen, setCmpOpen] = useState(false)
  const [prOpen,  setPrOpen]  = useState(false)

  if (!po) {
    return (
      <div className="rounded-xl border p-8 text-center" style={C}>
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-bold" style={{ color:'var(--text)' }}>PO Not Found</p>
        <button onClick={() => navigate('/po')} className="mt-3 text-xs font-bold underline" style={{ color:'var(--primary)' }}>← Back to PO List</button>
      </div>
    )
  }

  const typeCfg = PO_TYPES.find(t => t.id === po.type)
  const currentIdx = PO_STAGES.findIndex(s => s.id === po.currentStage)
  const isClosed = po.currentStage === 'closed'
  const totalPaid = totalPaidFor(po)
  const percentPaid = po.totalAmount > 0 ? Math.round((totalPaid / po.totalAmount) * 100) : 0
  const next = nextUnpaid(po)
  const daysRem = daysUntilNextPayment(po)

  const alerts = useMemo(() => {
    const out = []
    po.milestones.forEach(m => {
      const status = computePaymentStatus(m)
      if (status === 'overdue') {
        out.push({ kind:'overdue', text:`Payment "${m.label}" is overdue by ${Math.abs(daysBetween(m.dueDate, new Date().toISOString()))} days`, severity:'danger' })
      } else if (status === 'upcoming') {
        const d = daysBetween(new Date().toISOString(), m.dueDate)
        out.push({ kind:'upcoming', text:`Payment "${m.label}" of ${po.currency} ${fmtMoney(po.totalAmount * m.percentage / 100)} is due in ${d} day(s)`, severity:'warning' })
      } else if (status === 'paid' && !m.receipt) {
        out.push({ kind:'missing', text:`Payment "${m.label}" completed but receipt is not uploaded`, severity:'warning' })
      }
    })
    return out
  }, [po])

  const nextStageId = PO_STAGES[currentIdx + 1]?.id

  const doAdvance = () => {
    if (!nextStageId) return
    advanceStage(po.id, nextStageId, 'Fahad Al-Ghamdi', advanceRemarks)
    toast.success('Stage advanced', `${po.id} → ${PO_STAGES.find(s => s.id === nextStageId)?.label}`)
    setAdvanceModal(false); setAdvanceRemarks('')
  }

  const doPay = () => {
    if (!payModal) return
    payMilestone(po.id, payModal, {
      paidDate: new Date(payDraft.paidDate).toISOString(),
      paidBy: 'Khalid Salman',
      receipt: payDraft.receipt || `receipt-${po.id}-${payModal.slice(-4)}.pdf`,
      remarks: payDraft.remarks,
    })
    const m = po.milestones.find(x => x.id === payModal)
    toast.success('Payment recorded', `${m?.label} · ${po.currency} ${fmtMoney(po.totalAmount * m.percentage / 100)}`)
    setPayModal(null); setPayDraft({ paidDate: new Date().toISOString().slice(0, 10), receipt:'', remarks:'' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/po')} className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{ ...C }}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono" style={{ color:'var(--text)' }}>{po.id}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${typeCfg?.color}15`, color: typeCfg?.color }}>
                <span>{typeCfg?.icon}</span>{typeCfg?.label}
              </span>
              {isClosed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(31,41,55,.08)', color:'#1F2937' }}>
                  <Lock className="w-3 h-3" />Closed · Immutable
                </span>
              )}
            </div>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>
              <strong style={{ color:'var(--text2)' }}>{po.vendorName}</strong> · {po.referenceNumber || 'No reference'} · Created {fmtDate(po.creationDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCmpOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-slate-50"
            style={{ background:'var(--card)', borderColor:'#003399', color:'#003399' }}
            title="Generate the GS-SC-FRM Quotations Comparison Sheet">
            <FileText className="w-3.5 h-3.5" /> Comparison Sheet
          </button>
          <button onClick={() => setPrOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-slate-50"
            style={{ background:'var(--card)', borderColor:'#003399', color:'#003399' }}
            title="Generate the ACT-FRM-001 Payment Request">
            <Receipt className="w-3.5 h-3.5" /> Payment Request
          </button>
          <button onClick={() => exportPoPdf(po, vendorRecord)}
            className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          {!isClosed && nextStageId && (
            <button onClick={() => setAdvanceModal(true)}
              className="px-3 py-2 text-xs font-bold rounded-lg text-white flex items-center gap-1.5"
              style={{ background:'var(--primary)' }}>
              <Send className="w-3.5 h-3.5" /> Advance to {PO_STAGES.find(s => s.id === nextStageId)?.label}
            </button>
          )}
          {!isClosed && po.currentStage === 'pay_done' && (
            <button onClick={() => { advanceStage(po.id, 'closed', 'Fahad Al-Ghamdi', 'PO closed manually'); toast.success('PO closed', po.id) }}
              className="px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5"
              style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'#1F2937' }}>
              <Lock className="w-3.5 h-3.5" /> Close PO
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-5 gap-3">
        <SummaryCard label="Total Amount"  value={`${po.currency} ${fmtMoney(po.totalAmount)}`} mono icon={DollarSign} color="var(--primary)" />
        <SummaryCard label="Paid"          value={`${po.currency} ${fmtMoney(totalPaid)}`}      mono icon={CheckCircle2} color="var(--success)" sub={`${percentPaid}% complete`} />
        <SummaryCard label="Outstanding"   value={`${po.currency} ${fmtMoney(po.totalAmount - totalPaid)}`} mono icon={Clock} color="var(--warning)" />
        <SummaryCard label="Next Payment"  value={next ? `${po.currency} ${fmtMoney(po.totalAmount * next.percentage / 100)}` : 'All Paid'} mono icon={Bell} color="var(--cyan)" sub={next ? `Due ${fmtDate(next.dueDate)}` : '—'} />
        <SummaryCard label="Days Remaining" value={daysRem == null ? '—' : daysRem < 0 ? `${Math.abs(daysRem)}d Overdue` : `${daysRem}d`} icon={Calendar} color={daysRem == null ? 'var(--text3)' : daysRem < 0 ? 'var(--danger)' : daysRem < 7 ? 'var(--warning)' : 'var(--success)'} highlight={daysRem != null && daysRem < 7} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => {
            const sev = { danger:{ bg:'rgba(220,38,38,.06)', border:'rgba(220,38,38,.3)', color:'var(--danger)', icon: AlertCircle },
                          warning:{ bg:'rgba(217,119,6,.06)', border:'rgba(217,119,6,.3)', color:'var(--warning)', icon: AlertTriangle } }[a.severity]
            const Icon = sev.icon
            return (
              <div key={i} className="rounded-lg p-2.5 flex items-center gap-2" style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sev.color }} />
                <span className="text-xs font-bold flex-1" style={{ color: sev.color }}>{a.text}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* PO Lifecycle Timeline */}
      <div className="rounded-xl border p-4" style={C}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>PO Lifecycle Timeline</h3>
          <span className="text-[10px]" style={{ color:'var(--text3)' }}>Stage {currentIdx + 1} of {PO_STAGES.length}</span>
        </div>
        <div className="overflow-x-auto pt-2">
          <div className="flex items-start gap-2 min-w-min">
            {PO_STAGES.map((stage, idx) => {
              const completed = idx < currentIdx
              const isCurrent = idx === currentIdx
              const reached = idx <= currentIdx
              const history = po.stageHistory?.find(h => h.stage === stage.id)
              const prevHistory = idx > 0 ? po.stageHistory?.find(h => h.stage === PO_STAGES[idx - 1].id) : null
              const daysFromPrev = history && prevHistory ? daysBetween(prevHistory.date, history.date) : null
              const isLast = idx === PO_STAGES.length - 1
              return (
                <div key={stage.id} className="flex items-start flex-shrink-0">
                  <div className="flex flex-col items-center" style={{ minWidth: 140 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{
                      background: reached ? `${stage.color}15` : 'var(--bg2)',
                      border: `2px solid ${reached ? stage.color : 'var(--border)'}`,
                      boxShadow: isCurrent ? `0 0 0 4px ${stage.color}25` : 'none',
                    }}>
                      {completed ? <Check className="w-4 h-4" style={{ color: stage.color }} /> : <span style={{ opacity: reached ? 1 : 0.4 }}>{stage.icon}</span>}
                    </div>
                    <div className="text-center mt-2 max-w-[140px]">
                      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: reached ? stage.color : 'var(--text3)' }}>{stage.label}</div>
                      {history && (
                        <>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color:'var(--text2)' }}>{fmtDate(history.date)}</div>
                          <div className="text-[9px]" style={{ color:'var(--text3)' }}>{history.by}</div>
                          {history.remarks && (
                            <div className="text-[9px] mt-0.5 italic line-clamp-2" style={{ color:'var(--text3)' }} title={history.remarks}>"{history.remarks}"</div>
                          )}
                        </>
                      )}
                      {isCurrent && !completed && (
                        <div className="mt-1 text-[9px] font-bold inline-block px-1.5 py-0.5 rounded" style={{ background: `${stage.color}20`, color: stage.color }}>CURRENT</div>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex flex-col items-center pt-4 px-1" style={{ minWidth: 70 }}>
                      <div className="flex items-center w-full">
                        <div className="h-0.5 flex-1" style={{ background: completed ? PO_STAGES[idx + 1] && idx + 1 <= currentIdx ? stage.color : 'var(--border)' : 'var(--border)' }} />
                        <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: completed ? stage.color : 'var(--text3)' }} />
                        <div className="h-0.5 flex-1" style={{ background: completed && idx + 1 <= currentIdx ? PO_STAGES[idx + 1].color : 'var(--border)' }} />
                      </div>
                      {daysFromPrev != null && (
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded mt-1 whitespace-nowrap" style={{ background:'var(--bg2)', color: daysFromPrev > 7 ? 'var(--warning)' : 'var(--text2)' }}>
                          +{daysFromPrev}d
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Payment Timeline */}
      <div className="rounded-xl border p-4" style={C}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Payment Timeline</h3>
          <div className="text-[10px] font-mono font-bold" style={{ color:'var(--text2)' }}>{percentPaid}% complete · {po.milestones.filter(m => m.status === 'paid').length}/{po.milestones.length} milestones</div>
        </div>
        <div className="overflow-x-auto pt-2">
          <div className="flex items-start gap-2 min-w-min">
            {po.milestones.map((m, idx) => {
              const status = computePaymentStatus(m)
              const cfg = PAYMENT_STATUS_CFG[status]
              const paid = m.status === 'paid'
              const trigger = PAYMENT_TRIGGERS.find(t => t.id === m.trigger)
              const isLast = idx === po.milestones.length - 1
              const overdueDays = !paid && daysBetween(m.dueDate, new Date().toISOString())
              return (
                <div key={m.id} className="flex items-start flex-shrink-0">
                  <div className="flex flex-col items-center" style={{ minWidth: 170 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                      background: `${cfg.c}15`, border:`2px solid ${cfg.c}`,
                    }}>
                      {paid ? <Check className="w-4 h-4" style={{ color: cfg.c }} /> : <DollarSign className="w-4 h-4" style={{ color: cfg.c }} />}
                    </div>
                    <div className="text-center mt-2 max-w-[170px]">
                      <div className="text-[11px] font-bold" style={{ color:'var(--text)' }}>{m.label}</div>
                      <div className="text-[14px] font-bold font-mono mt-0.5" style={{ color: cfg.c }}>{m.percentage}%</div>
                      <div className="text-[10px] font-mono" style={{ color:'var(--text2)' }}>{po.currency} {fmtMoney(po.totalAmount * m.percentage / 100)}</div>
                      <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{trigger?.label}</div>
                      <div className="text-[10px] font-mono mt-1" style={{ color:'var(--text2)' }}>Due {fmtDate(m.dueDate)}</div>
                      {!paid && Number(m.percentage) < 100 && m.reminderDate && (
                        <div className="text-[10px] font-mono mt-0.5 flex items-center justify-center gap-1" style={{ color:'var(--warning)' }}>
                          🔔 {fmtDate(m.reminderDate)}{m.reminderDays != null && ` (${m.reminderDays}d)`}
                        </div>
                      )}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
                      {paid && m.paidDate && (
                        <div className="text-[9px] mt-1" style={{ color:'var(--success)' }}>✓ Paid {fmtDate(m.paidDate)} · {m.paidBy}</div>
                      )}
                      {status === 'overdue' && overdueDays > 0 && (
                        <div className="text-[9px] mt-1 font-bold" style={{ color:'var(--danger)' }}>{overdueDays} days overdue</div>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex items-center pt-4 px-1" style={{ minWidth: 50 }}>
                      <div className="h-0.5 flex-1" style={{ background: paid ? cfg.c : 'var(--border)' }} />
                      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: paid ? cfg.c : 'var(--text3)' }} />
                      <div className="h-0.5 flex-1" style={{ background:'var(--border)' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Two-column layout: PO Details + Milestones / Audit */}
      <div className="grid grid-cols-12 gap-3">
        {/* PO Details */}
        <div className="col-span-7 space-y-3">
          <div className="rounded-xl border p-4" style={C}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Commercial Terms</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <KV k="Incoterm"          v={po.incoterm} sub={INCOTERMS.find(i => i.id === po.incoterm)?.label} />
              <KV k="Currency"          v={po.currency} />
              <KV k="Total Amount"      v={`${po.currency} ${fmtMoney(po.totalAmount)}`} mono bold />
              <KV k="Expected Completion" v={fmtDate(po.expectedCompletionDate)} />
              <KV k="Created By"        v={po.createdBy} sub={fmtDateTime(po.createdAt)} />
              <KV k="Last Updated"      v={po.updatedBy} sub={fmtDateTime(po.updatedAt)} />
            </div>
          </div>

          <div className="rounded-xl border p-4" style={C}>
            <div className="flex items-center justify-between mb-3 pb-1.5" style={{ borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Vendor Details</h3>
              {vendorRecord && (
                <button onClick={() => navigate(`/vendors/${vendorRecord.id}`)}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded border"
                  style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--primary)' }}>
                  <Eye className="w-3 h-3" /> View in Master
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <KV k="Vendor Name"       v={po.vendorName} bold />
              <KV k="Vendor Code"       v={vendorRecord?.code ?? po.vendorId} mono sub={vendorRecord?.type ?? '—'} />
              <KV k="Status"            v={vendorRecord
                ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded inline-block" style={{
                    background: vendorRecord.status === 'active' ? 'rgba(5,150,105,.12)' : vendorRecord.status === 'blacklisted' ? 'rgba(220,38,38,.12)' : 'rgba(217,119,6,.12)',
                    color:      vendorRecord.status === 'active' ? 'var(--success)'      : vendorRecord.status === 'blacklisted' ? 'var(--danger)'      : 'var(--warning)',
                  }}>{vendorRecord.status?.toUpperCase()}</span>
                : <span className="text-[11px]" style={{ color:'var(--text3)' }}>Not in master</span>}
              />
              <KV k="Contact Person"    v={po.vendorContact} icon={User} />
              <KV k="Email"             v={po.vendorEmail} mono />
              <KV k="Phone"             v={po.vendorPhone} mono />
              <KV k="Reference Number"  v={po.referenceNumber || '—'} mono />
              <KV k="PO Type"           v={`${typeCfg?.icon} ${typeCfg?.label}`} />
              {vendorRecord && (vendorRecord.slaScore ?? vendorRecord.sla) != null && (
                <KV k="Vendor SLA" v={
                  <span className="font-mono font-bold" style={{ color: (vendorRecord.slaScore ?? vendorRecord.sla) >= 90 ? 'var(--success)' : (vendorRecord.slaScore ?? vendorRecord.sla) >= 80 ? 'var(--warning)' : 'var(--danger)' }}>
                    {vendorRecord.slaScore ?? vendorRecord.sla}%
                  </span>
                } sub={vendorRecord.country ? `${vendorRecord.city ?? ''}, ${vendorRecord.country}` : ''} />
              )}
              {vendorRecord?.vatNumber && (
                <KV k="VAT Number" v={vendorRecord.vatNumber} mono />
              )}
              {vendorRecord?.regNumber && (
                <KV k="CR Number"  v={vendorRecord.regNumber} mono />
              )}
            </div>
          </div>

          {/* Milestones table */}
          {po.items && po.items.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Items / Inventory</h3>
                <span className="text-[10px]" style={{ color:'var(--text3)' }}>{po.items.length} line item(s)</span>
              </div>
              <table className="w-full text-[12.5px]">
                <thead style={{ background:'var(--bg2)' }}>
                  <tr>
                    {['#','Item','SKU','Category','Qty','Unit Price','Line Total'].map(h =>
                      <th key={h} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((it, idx) => (
                    <tr key={it.id ?? idx} style={{ borderTop:'1px solid var(--border)' }}>
                      <td className="px-2 py-1.5 font-mono" style={{ color:'var(--text3)' }}>{idx + 1}</td>
                      <td className="px-2 py-1.5 font-bold" style={{ color:'var(--text)' }}>{it.name}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color:'var(--text2)' }}>{it.sku || '—'}</td>
                      <td className="px-2 py-1.5" style={{ color:'var(--text2)' }}>{it.category || '—'}</td>
                      <td className="px-2 py-1.5 font-mono">{it.qty} {it.unit}</td>
                      <td className="px-2 py-1.5 font-mono">{po.currency} {fmtMoney(it.unitPrice)}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color:'var(--primary)' }}>{po.currency} {fmtMoney(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Milestones table */}
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Payment Milestones</h3>
              <span className="text-[10px]" style={{ color:'var(--text3)' }}>{po.milestones.length} milestone(s) · {po.milestones.filter(m => m.status === 'paid').length} paid</span>
            </div>
            <table className="w-full text-xs">
              <thead style={{ background:'var(--bg2)' }}>
                <tr>
                  {['#','Milestone','%','Amount','Trigger','Due','Status','Action'].map(h =>
                    <th key={h} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {po.milestones.map((m, idx) => {
                  const status = computePaymentStatus(m)
                  const cfg = PAYMENT_STATUS_CFG[status]
                  const trigger = PAYMENT_TRIGGERS.find(t => t.id === m.trigger)
                  return (
                    <tr key={m.id} style={{ borderTop:'1px solid var(--border)' }}>
                      <td className="px-2 py-2 font-mono text-center">{idx + 1}</td>
                      <td className="px-2 py-2 font-bold" style={{ color:'var(--text)' }}>{m.label}</td>
                      <td className="px-2 py-2 font-mono font-bold text-center" style={{ color:'var(--primary)' }}>{m.percentage}%</td>
                      <td className="px-2 py-2 font-mono font-bold" style={{ color:'var(--success)' }}>{po.currency} {fmtMoney(po.totalAmount * m.percentage / 100)}</td>
                      <td className="px-2 py-2 text-[11px]" style={{ color:'var(--text2)' }}>{trigger?.label}</td>
                      <td className="px-2 py-2 font-mono text-[11px]" style={{ color:'var(--text2)' }}>{fmtDate(m.dueDate)}</td>
                      <td className="px-2 py-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
                        {m.status === 'paid' && m.receipt && (
                          <div className="text-[9px] mt-0.5 flex items-center gap-1" style={{ color:'var(--success)' }}>
                            <Receipt className="w-2.5 h-2.5" />{m.receipt}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {m.status !== 'paid' && !isClosed && (
                          <button onClick={() => setPayModal(m.id)}
                            className="px-2 py-1 text-[10px] font-bold rounded text-white"
                            style={{ background:'var(--success)' }}>
                            <Check className="w-3 h-3 inline mr-0.5" />Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit + Stage History */}
        <div className="col-span-5 space-y-3">
          {/* Stage History */}
          <div className="rounded-xl border" style={C}>
            <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                <Activity className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} /> Stage History
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {(po.stageHistory ?? []).map((h, i) => {
                const stage = PO_STAGES.find(s => s.id === h.stage)
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs" style={{ background:`${stage?.color}15`, color: stage?.color }}>
                      {stage?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold" style={{ color: stage?.color }}>{stage?.label}</span>
                        <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{fmtDateTime(h.date)}</span>
                      </div>
                      <div className="text-[10px]" style={{ color:'var(--text2)' }}>by <strong>{h.by}</strong></div>
                      {h.remarks && <div className="text-[10px] italic mt-0.5" style={{ color:'var(--text3)' }}>"{h.remarks}"</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Audit Log */}
          <div className="rounded-xl border" style={C}>
            <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                <History className="w-3.5 h-3.5" style={{ color:'var(--cyan)' }} /> Audit Log
              </h3>
            </div>
            <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
              {(po.auditLog ?? []).slice().reverse().map((a, i) => {
                const actionCfg = {
                  create:        { c:'var(--primary)',  icon:'📋' },
                  update:        { c:'var(--cyan)',     icon:'✏️' },
                  status_change: { c:'var(--warning)',  icon:'🔄' },
                  payment:       { c:'var(--success)',  icon:'💰' },
                }[a.action] ?? { c:'var(--text3)', icon:'•' }
                return (
                  <div key={i} className="flex items-start gap-2 text-[11px] pb-1.5" style={{ borderBottom:'1px dotted var(--border)' }}>
                    <span style={{ color: actionCfg.c }}>{actionCfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold" style={{ color:'var(--text2)' }}>{a.summary}</div>
                      <div className="text-[9px] flex items-center gap-1.5" style={{ color:'var(--text3)' }}>
                        <span>{a.by}</span>
                        <span>·</span>
                        <span className="font-mono">{fmtDateTime(a.date)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {(po.auditLog ?? []).length === 0 && <p className="text-[11px] text-center py-4" style={{ color:'var(--text3)' }}>No audit entries yet</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Advance stage modal */}
      <EnterpriseModal open={advanceModal} onClose={() => { setAdvanceModal(false); setAdvanceRemarks('') }}
        title={`Advance to ${PO_STAGES.find(s => s.id === nextStageId)?.label}`}
        subtitle="Move this PO forward in its lifecycle"
        icon={<Send className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => { setAdvanceModal(false); setAdvanceRemarks('') }}>Cancel</ModalBtn>
          <ModalBtn onClick={doAdvance}>Confirm Advance</ModalBtn>
        </>}>
        <div className="space-y-2">
          <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Transition</div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span style={{ color:'var(--text2)' }}>{PO_STAGES.find(s => s.id === po.currentStage)?.label}</span>
              <ChevronRight className="w-3 h-3" style={{ color:'var(--text3)' }} />
              <span style={{ color:'var(--primary)' }}>{PO_STAGES.find(s => s.id === nextStageId)?.label}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Remarks (optional)</label>
            <textarea value={advanceRemarks} onChange={e => setAdvanceRemarks(e.target.value)} rows={3}
              placeholder="Add context for this stage transition…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>

      {/* Mark Paid modal */}
      <EnterpriseModal open={!!payModal} onClose={() => { setPayModal(null); setPayDraft({ paidDate: new Date().toISOString().slice(0, 10), receipt:'', remarks:'' }) }}
        title="Record Payment"
        subtitle={payModal ? `${po.milestones.find(m => m.id === payModal)?.label} · ${po.currency} ${fmtMoney(po.totalAmount * (po.milestones.find(m => m.id === payModal)?.percentage ?? 0) / 100)}` : ''}
        icon={<DollarSign className="w-4 h-4" style={{ color:'var(--success)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => { setPayModal(null); setPayDraft({ paidDate: new Date().toISOString().slice(0, 10), receipt:'', remarks:'' }) }}>Cancel</ModalBtn>
          <ModalBtn onClick={doPay}><Check className="w-3 h-3 mr-1" />Confirm Payment</ModalBtn>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Date</label>
            <input type="date" value={payDraft.paidDate} onChange={e => setPayDraft({ ...payDraft, paidDate: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Receipt File</label>
            <div className="flex items-center gap-2">
              <input value={payDraft.receipt} onChange={e => setPayDraft({ ...payDraft, receipt: e.target.value })}
                placeholder="receipt.pdf (or upload)"
                className="flex-1 rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              <label className="px-2.5 py-2 text-[10px] font-bold rounded-lg border cursor-pointer flex items-center gap-1" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
                <Upload className="w-3 h-3" /> Upload
                <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setPayDraft({ ...payDraft, receipt: f.name }) }} />
              </label>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Remarks (optional)</label>
            <textarea value={payDraft.remarks} onChange={e => setPayDraft({ ...payDraft, remarks: e.target.value })} rows={2}
              placeholder="Wire reference · payment notes…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>

      {/* ─── Printable forms — Comparison Sheet + Payment Request ─────── */}
      <PrintFrame open={cmpOpen} onClose={() => setCmpOpen(false)}
        title={`Quotations Comparison · ${po.id}`}
        subtitle="GS-SC-FRM v03 · Hulul Supply Chain"
        docId={po.id}>
        <ComparisonSheet data={(() => {
          // Build supplier list from PO's quote-comparison history if present,
          // otherwise show the awarded vendor in slot 1
          const comparisonSources = po.comparedQuotes ?? [
            {
              vendorId: po.vendorId, vendorName: vendorRecord?.name,
              amount: po.totalAmount,
              incoterms: po.incoterm,
              paymentTerms: po.paymentTerms,
              leadTime: po.leadTimeDays,
              qualityNotes: vendorRecord?.aramcoApproved ? 'Aramco Approved' : '',
            },
          ]
          const top3 = comparisonSources.slice(0, 3)
          const selectedIdx = Math.max(0, top3.findIndex(s => s.vendorId === po.vendorId))
          return {
            prNumber: po.prNumber ?? '',
            prApprovedDate: po.createdAt,
            poNumber: po.id,
            poDate: po.createdAt,
            project: po.projectId ?? '',
            currency: po.currency ?? 'SAR',
            poType: po.type ?? 'Material Supply',
            leadTime: po.leadTimeDays ? `${po.leadTimeDays} days` : '',
            comparisonPeriod: 3,
            validTill: po.validUntil ?? '',
            suppliers: top3.map(s => ({
              name: s.vendorName ?? (vendorMaster.find(v => v.id === s.vendorId)?.name ?? s.vendorId),
              quotedItems: 'full',
              incoterms: s.incoterms ?? po.incoterm ?? '',
              paymentTerms: s.paymentTerms ?? po.paymentTerms ?? '',
              deliveryLeadTime: s.leadTime ? `${s.leadTime} days` : '',
              qualityBrand: s.qualityNotes ?? '',
              totalPriceWithoutVat: s.amount ?? 0,
            })),
            selectedSupplierIndex: selectedIdx >= 0 ? selectedIdx : 0,
            costReduction: top3.length >= 2
              ? Math.max(0, (top3[top3.length - 1]?.amount ?? 0) - (top3[0]?.amount ?? 0))
              : 0,
            justification: { aramcoApproved: !!vendorRecord?.aramcoApproved },
            approvals: {
              evaluatedBy:    { name: po.createdBy ?? 'Khalid Salman',     signature: '' },
              reviewedBy:     { name: po.owner ?? '',                       signature: '' },
              supplyChainMgr: { name: 'Yousef Al-Harbi',                    signature: '' },
              ceo:            { name: 'Abdullah Al-Hulul',                  signature: '' },
            },
          }
        })()} />
      </PrintFrame>

      <PrintFrame open={prOpen} onClose={() => setPrOpen(false)}
        title={`Payment Request · ${po.id}`}
        subtitle="ACT-FRM-001 rev 02 · Hulul Finance"
        docId={po.id}>
        <PaymentRequest data={(() => {
          // Pick the next unpaid milestone, or the first one if all paid
          const milestones = po.paymentSchedule ?? []
          const next = milestones.find(m => m.status !== 'paid') ?? milestones[0]
          const amountDue = next?.amount ?? Math.max(0, po.totalAmount - totalPaidFor(po))
          const totalPaid = totalPaidFor(po)
          const advancePct = po.totalAmount ? Math.round((totalPaid / po.totalAmount) * 100) : 0
          const vatRate = 0.15
          const baseAmount = next?.amount ?? amountDue
          return {
            paymentMethod: 'bank_transfer',
            supplierName: vendorRecord?.name ?? po.vendorId,
            supplierSapId: vendorRecord?.sapId ?? vendorRecord?.id ?? '',
            projectId: po.projectId ?? '',
            projectName: po.projectName ?? po.projectId ?? '',
            advancePaid: advancePct,
            advancePaidAmount: totalPaid,
            poValue: po.totalAmount,
            poNumber: po.id,
            poDate: po.createdAt,
            typeOfService: po.description ?? `Purchase Order ${po.id} — ${po.type ?? ''}`,
            invoiceNumber: next?.invoiceNumber ?? '',
            remarks: next ? `Milestone: ${next.label ?? next.id}${next.dueDate ? ` · due ${fmtDate(next.dueDate)}` : ''}` : 'All milestones paid',
            amount: baseAmount,
            withholdingTax: 0,
            vat: +(baseAmount * vatRate).toFixed(2),
            currency: po.currency ?? 'SAR',
            issueDate: new Date().toISOString(),
            preparedBy: po.createdBy ?? 'Khizar Hayat',
            lineManager: po.owner ?? 'Yousef Al-Harbi',
            finance: { checkedBy: '', reviewedBy: '', approvedBy: '' },
          }
        })()} />
      </PrintFrame>
    </div>
  )
}

function SummaryCard({ label, value, sub, icon: Icon, color, mono, highlight }) {
  return (
    <div className="rounded-xl border p-3" style={{ ...C, borderLeft: `3px solid ${color}`, background: highlight ? `${color}10` : 'var(--card)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className={`text-base font-black ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function KV({ k, v, sub, mono, bold, icon: Icon }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{k}</div>
      <div className={`text-xs ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : 'font-semibold'} flex items-center gap-1`} style={{ color:'var(--text)' }}>
        {Icon && <Icon className="w-3 h-3" style={{ color:'var(--text3)' }} />}
        {v ?? '—'}
      </div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

// ─── Export PO as PDF via styled print window ────────────────────────────────
function exportPoPdf(po, vendorRecord) {
  const w = window.open('', '_blank', 'width=900,height=900')
  if (!w) return
  const typeCfg = PO_TYPES.find(t => t.id === po.type) ?? { label: po.type, icon:'•' }
  const totalPaid = totalPaidFor(po)
  const pctPaid = po.totalAmount > 0 ? Math.round((totalPaid / po.totalAmount) * 100) : 0

  const fmtMoneyL = (n) => (Number(n) || 0).toLocaleString()
  const fmtDateL  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
  const fmtDateTimeL = (iso) => iso ? new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

  const rows = (arr, mapper) => arr.map(mapper).join('')

  const milestoneRows = rows(po.milestones, (m, i) => {
    const cfg = PAYMENT_STATUS_CFG[computePaymentStatus(m)]
    const trigger = PAYMENT_TRIGGERS.find(t => t.id === m.trigger)
    return `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="bold">${m.label}</td>
        <td class="num primary">${m.percentage}%</td>
        <td class="num success">${po.currency} ${fmtMoneyL(po.totalAmount * m.percentage / 100)}</td>
        <td>${trigger?.label ?? m.trigger}</td>
        <td class="num small">${fmtDateL(m.dueDate)}</td>
        <td><span class="pill" style="background:${cfg.bg};color:${cfg.c}">${cfg.label}</span></td>
        <td class="num small">${m.status === 'paid' ? `Paid ${fmtDateL(m.paidDate)}` : '—'}</td>
        <td class="num small">${m.receipt ?? '—'}</td>
      </tr>
    `
  })

  const stageRows = rows((po.stageHistory ?? []), (h, i) => {
    const stage = PO_STAGES.find(s => s.id === h.stage)
    return `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="bold" style="color:${stage?.color ?? '#1F2937'}">${stage?.icon ?? '•'} ${stage?.label ?? h.stage}</td>
        <td class="num small">${fmtDateTimeL(h.date)}</td>
        <td>${h.by ?? '—'}</td>
        <td class="small italic">${h.remarks ?? ''}</td>
      </tr>
    `
  })

  const auditRows = rows((po.auditLog ?? []).slice().reverse(), (a, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="bold">${a.action}</td>
      <td>${a.summary ?? ''}</td>
      <td>${a.by ?? ''}</td>
      <td class="num small">${fmtDateTimeL(a.date)}</td>
    </tr>
  `)

  w.document.write(`<!DOCTYPE html><html><head>
<title>${po.id} · Purchase Order</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #1F2937; font-size: 11px; line-height: 1.4; }
  .doc-header { text-align: center; padding-bottom: 16px; border-bottom: 3px double #1F2937; margin-bottom: 20px; }
  .doc-header h1 { font-size: 22px; margin: 0; font-weight: 800; }
  .doc-header .sub { font-size: 11px; color: #6B7280; margin-top: 4px; }
  .doc-header .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 10px; margin-top: 8px; background: #DBEAFE; color: #2563EB; letter-spacing: 0.08em; text-transform: uppercase; }
  h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; margin: 18px 0 10px; }
  .grid { display: grid; gap: 6px 14px; }
  .g2 { grid-template-columns: 1fr 1fr; }
  .g3 { grid-template-columns: 1fr 1fr 1fr; }
  .g4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .kv { padding: 6px 0; border-bottom: 1px dotted #E5E7EB; }
  .kv .lbl { font-size: 9px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .kv .val { font-size: 12px; font-weight: 600; color: #1F2937; margin-top: 2px; }
  .kv .val.mono { font-family: ui-monospace, monospace; }
  .kv .val.bold { font-weight: 800; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 8px 0 16px; }
  th, td { padding: 6px 8px; border: 1px solid #E5E7EB; text-align: left; vertical-align: top; }
  th { background: #F9FAFB; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; }
  td.num { font-family: ui-monospace, monospace; }
  td.bold { font-weight: 700; }
  td.primary { color: #2563EB; font-weight: 700; }
  td.success { color: #059669; font-weight: 700; }
  td.small { font-size: 10px; color: #6B7280; }
  td.italic { font-style: italic; color: #6B7280; }
  .pill { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; }
  .progress { height: 8px; border-radius: 4px; background: #E5E7EB; overflow: hidden; margin: 6px 0; }
  .progress-fill { height: 100%; background: #059669; }
  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .summary-card { padding: 10px; border-radius: 6px; background: #F9FAFB; border-left: 3px solid #2563EB; }
  .summary-card .lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; }
  .summary-card .val { font-size: 16px; font-weight: 800; color: #1F2937; font-family: ui-monospace, monospace; margin-top: 2px; }
  .signature-block { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
  .sig { font-size: 9px; }
  .sig .role { font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 36px; }
  .sig .line { border-bottom: 1.5px solid #1F2937; }
  .sig .name { margin-top: 4px; color: #6B7280; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #E5E7EB; font-size: 9px; color: #9CA3AF; text-align: center; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
    table { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <div class="doc-header">
    <h1>HELMS · Purchase Order</h1>
    <div class="sub">Heavy Equipment Logistics Management System · Issued by HELMS Procurement</div>
    <div class="badge">${typeCfg.icon} ${typeCfg.label}</div>
  </div>

  <h2>PO Identification</h2>
  <div class="grid g4">
    <div class="kv"><div class="lbl">PO Number</div><div class="val mono bold">${po.id}</div></div>
    <div class="kv"><div class="lbl">Reference</div><div class="val mono">${po.referenceNumber || '—'}</div></div>
    <div class="kv"><div class="lbl">Creation Date</div><div class="val mono">${fmtDateL(po.creationDate)}</div></div>
    <div class="kv"><div class="lbl">Current Stage</div><div class="val bold" style="color:${PO_STAGES.find(s => s.id === po.currentStage)?.color}">${PO_STAGES.find(s => s.id === po.currentStage)?.label}</div></div>
    <div class="kv"><div class="lbl">Created By</div><div class="val">${po.createdBy}</div></div>
    <div class="kv"><div class="lbl">Updated By</div><div class="val">${po.updatedBy}</div></div>
    <div class="kv"><div class="lbl">Expected Completion</div><div class="val mono">${fmtDateL(po.expectedCompletionDate)}</div></div>
    <div class="kv"><div class="lbl">Last Updated</div><div class="val mono small">${fmtDateTimeL(po.updatedAt)}</div></div>
  </div>

  <h2>Vendor Information</h2>
  <div class="grid g3">
    <div class="kv"><div class="lbl">Vendor Name</div><div class="val bold">${po.vendorName}</div></div>
    <div class="kv"><div class="lbl">Vendor Code</div><div class="val mono">${vendorRecord?.code ?? po.vendorId}</div></div>
    <div class="kv"><div class="lbl">Vendor Type</div><div class="val">${vendorRecord?.type ?? '—'}</div></div>
    <div class="kv"><div class="lbl">Contact Person</div><div class="val">${po.vendorContact ?? '—'}</div></div>
    <div class="kv"><div class="lbl">Email</div><div class="val mono small">${po.vendorEmail ?? '—'}</div></div>
    <div class="kv"><div class="lbl">Phone</div><div class="val mono">${po.vendorPhone ?? '—'}</div></div>
    ${vendorRecord ? `
      <div class="kv"><div class="lbl">Location</div><div class="val">${vendorRecord.city ?? ''}, ${vendorRecord.country ?? ''}</div></div>
      <div class="kv"><div class="lbl">VAT Number</div><div class="val mono small">${vendorRecord.vatNumber ?? '—'}</div></div>
      <div class="kv"><div class="lbl">CR Number</div><div class="val mono small">${vendorRecord.regNumber ?? '—'}</div></div>
    ` : ''}
  </div>

  <h2>Commercial Terms · Financial Summary</h2>
  <div class="summary-strip">
    <div class="summary-card"><div class="lbl">Total Amount</div><div class="val">${po.currency} ${fmtMoneyL(po.totalAmount)}</div></div>
    <div class="summary-card" style="border-color:#059669"><div class="lbl">Paid</div><div class="val" style="color:#059669">${po.currency} ${fmtMoneyL(totalPaid)}</div></div>
    <div class="summary-card" style="border-color:#D97706"><div class="lbl">Outstanding</div><div class="val" style="color:#D97706">${po.currency} ${fmtMoneyL(po.totalAmount - totalPaid)}</div></div>
    <div class="summary-card" style="border-color:#06B6D4"><div class="lbl">% Complete</div><div class="val" style="color:#06B6D4">${pctPaid}%</div></div>
  </div>
  <div class="progress"><div class="progress-fill" style="width:${pctPaid}%"></div></div>

  <div class="grid g3">
    <div class="kv"><div class="lbl">Incoterm</div><div class="val mono">${po.incoterm}</div></div>
    <div class="kv"><div class="lbl">Currency</div><div class="val mono">${po.currency}</div></div>
    <div class="kv"><div class="lbl">Payment Type</div><div class="val">${po.paymentType === 'advance' ? '100% Advance' : 'Percentage-based'}</div></div>
  </div>

  <h2>Payment Schedule (${po.milestones.length} milestone${po.milestones.length > 1 ? 's' : ''})</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Milestone</th><th>%</th><th>Amount</th><th>Trigger</th><th>Due</th><th>Status</th><th>Paid</th><th>Receipt</th></tr>
    </thead>
    <tbody>${milestoneRows}</tbody>
  </table>

  <h2>Lifecycle History</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Stage</th><th>Date</th><th>By</th><th>Remarks</th></tr>
    </thead>
    <tbody>${stageRows || '<tr><td colspan="5" class="small italic" style="text-align:center;padding:12px">No stage transitions yet</td></tr>'}</tbody>
  </table>

  <h2>Audit Log (${(po.auditLog ?? []).length} entries)</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Action</th><th>Summary</th><th>By</th><th>When</th></tr>
    </thead>
    <tbody>${auditRows || '<tr><td colspan="5" class="small italic" style="text-align:center;padding:12px">No audit entries</td></tr>'}</tbody>
  </table>

  <div class="signature-block">
    <div class="sig">
      <div class="role">Prepared By</div>
      <div class="line"></div>
      <div class="name">${po.createdBy ?? 'HELMS Procurement'} · ${fmtDateL(po.createdAt)}</div>
    </div>
    <div class="sig">
      <div class="role">Approved By</div>
      <div class="line"></div>
      <div class="name">HELMS Finance Head · Date</div>
    </div>
    <div class="sig">
      <div class="role">Vendor Acknowledgement</div>
      <div class="line"></div>
      <div class="name">${po.vendorName} · Date</div>
    </div>
  </div>

  <div class="footer">
    Generated by HELMS · ${new Date().toLocaleString('en-SA')} · This document is system-generated and reflects the latest state of PO ${po.id}.
  </div>

  <script>setTimeout(() => window.print(), 300)</script>
</body></html>`)
  w.document.close()
}
