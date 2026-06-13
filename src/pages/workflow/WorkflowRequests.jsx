import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox, ArrowLeft, Search, Filter, Clock, AlertTriangle, CheckCircle2,
  XCircle, ArrowRight, ArrowLeft as ArrowLeftIcon, Edit3, RefreshCw, Send, MessageSquare,
  History as HistoryIcon, Paperclip, User, AlertCircle, GitBranch, Globe, Smartphone,
  Workflow as WorkflowIcon,
} from 'lucide-react'
import useWorkflowV2Store from '../../store/workflowV2Store'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import { WORKFLOW_STATUSES, ENTITY_TYPES, slaRemaining } from '../../api/mock/workflowV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const ACTION_DEFS = [
  { id: 'approve',  label: 'Approve',              color: 'var(--success)', icon: CheckCircle2, variant: 'success' },
  { id: 'reject',   label: 'Reject',               color: 'var(--danger)',  icon: XCircle,      variant: 'danger'  },
  { id: 'return',   label: 'Return for Recheck',   color: 'var(--warning)', icon: ArrowLeftIcon, variant: 'primary' },
  { id: 'modify',   label: 'Request Modification', color: 'var(--purple)',  icon: Edit3,        variant: 'primary' },
  { id: 'reassign', label: 'Reassign',             color: 'var(--cyan)',    icon: RefreshCw,    variant: 'primary' },
]

function fmtDT(iso) { return new Date(iso).toLocaleString('en-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }

function StatusBadge({ status, sm = false }) {
  const cfg = WORKFLOW_STATUSES[status] ?? { label: status, cls:'text-slate-500 bg-slate-50 border-slate-200' }
  return <span className={`inline-flex items-center gap-1 font-bold border rounded-md ${cfg.cls} ${sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[12.5px] px-2 py-0.5'}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function SLAIndicator({ remaining, overdue, slaDays }) {
  if (remaining == null) return null
  const days = Math.abs(remaining)
  const color = overdue ? 'var(--danger)' : days < 1 ? 'var(--danger)' : days < 2 ? 'var(--warning)' : 'var(--text2)'
  return (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[12.5px]"
      style={{ background: overdue ? 'var(--danger-light)' : 'var(--bg2)', color, border:`1px solid ${overdue ? 'rgba(220,38,38,.3)' : 'var(--border)'}` }}>
      {overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {overdue ? `Overdue ${Math.floor(days)}d` : `${days.toFixed(1)}d left`}
    </div>
  )
}

// ─── Horizontal approval progress bar ──────────────────────────────────────────
function ApprovalProgress({ workflow, request }) {
  if (!workflow) return null
  return (
    <div className="rounded-xl border p-4" style={C}>
      <div className="flex items-center gap-2 mb-3">
        <WorkflowIcon className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Approval Path</h4>
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-start min-w-max gap-0">
          {/* Initiator */}
          <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center border-2"
              style={{ background:'var(--success)', borderColor:'var(--success)' }}>
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-1.5" style={{ color:'var(--text3)' }}>Submit</div>
            <div className="text-[12.5px]" style={{ color:'var(--text)' }}>{request.requestedBy}</div>
          </div>

          {workflow.steps.map((step, i) => {
            const isCurrent = i === request.currentStep && ['pending_approval','pending_recheck','pending_modification','reassigned'].includes(request.status)
            const isDone    = i < request.currentStep || (request.currentStep > i && request.status === 'approved')
            const isFinal   = request.status === 'approved' && i === workflow.steps.length - 1

            const bg     = isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg3)'
            const border = isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--border)'
            const txt    = isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--text3)'

            return (
              <div key={step.id} className="flex items-start">
                <div className="flex items-center pt-4 px-1" style={{ minWidth: 30 }}>
                  <ArrowRight className="w-4 h-4" style={{ color: isDone ? 'var(--success)' : 'var(--text3)' }} />
                </div>
                <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: bg, border: `2px solid ${border}`, boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,.15)' : 'none' }}>
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span style={{ color: isCurrent ? '#fff' : 'var(--text3)' }}>{step.seq}</span>}
                    </div>
                    {isCurrent && <span className="absolute -top-0.5 -right-1 text-[7px] font-black px-1 py-0 rounded-full text-white" style={{ background:'var(--primary)' }}>NOW</span>}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mt-1.5" style={{ color: txt }}>Step {step.seq}</div>
                  <div className="text-[12.5px] text-center leading-tight" style={{ color:'var(--text)' }}>{step.role}</div>
                  <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>SLA {step.slaDays}d</div>
                </div>
              </div>
            )
          })}

          {/* End */}
          <div className="flex items-center pt-4 px-1" style={{ minWidth: 30 }}>
            <ArrowRight className="w-4 h-4" style={{ color: request.status === 'approved' ? 'var(--success)' : 'var(--text3)' }} />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: request.status === 'approved' ? 'var(--success)' : 'var(--bg3)', border: `2px solid ${request.status === 'approved' ? 'var(--success)' : 'var(--border)'}` }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: request.status === 'approved' ? '#fff' : 'var(--text3)' }} />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-1.5" style={{ color: request.status === 'approved' ? 'var(--success)' : 'var(--text3)' }}>End</div>
            <div className="text-[12.5px]" style={{ color:'var(--text)' }}>Approved</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Approval history timeline ─────────────────────────────────────────────────
function HistoryTimeline({ history }) {
  return (
    <div className="rounded-xl border p-4" style={C}>
      <div className="flex items-center gap-2 mb-3">
        <HistoryIcon className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Approval History</h4>
      </div>
      <div className="relative">
        <div className="absolute left-3 top-1 bottom-1 w-0.5" style={{ background:'var(--border)' }} />
        <div className="space-y-3">
          {history.map(h => {
            const action = ACTION_DEFS.find(a => a.id === h.action) ?? { color:'var(--text3)', icon: CheckCircle2, label: h.action }
            const Icon = action.icon
            return (
              <div key={h.id} className="relative pl-9">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background:'var(--card)', border:`2px solid ${action.color}` }}>
                  <Icon className="w-3 h-3" style={{ color: action.color }} />
                </div>
                <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: action.color }}>{action.label}</span>
                    <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDT(h.timestamp)}</span>
                  </div>
                  <div className="text-[12.5px] mb-1" style={{ color:'var(--text2)' }}>
                    <strong style={{ color:'var(--text)' }}>{h.actor}</strong> · {h.actorRole}
                  </div>
                  {h.comment && <div className="text-[11px] italic mt-1.5 pt-1.5 border-t" style={{ color:'var(--text2)', borderColor:'var(--border)' }}>"{h.comment}"</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Action panel ──────────────────────────────────────────────────────────────
function ActionPanel({ workflow, request, onAction }) {
  if (!workflow || !['pending_approval','pending_recheck','pending_modification','reassigned'].includes(request.status)) {
    return (
      <div className="rounded-xl border p-4 text-center" style={C}>
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
        <p className="text-sm" style={{ color:'var(--text3)' }}>No actions available — workflow {WORKFLOW_STATUSES[request.status]?.label?.toLowerCase()}</p>
      </div>
    )
  }
  const enabledActions = ACTION_DEFS.filter(a => workflow.actionsEnabled?.[a.id])
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Approval Actions</h4>
        <p className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>All actions require a comment</p>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {enabledActions.map(a => {
          const Icon = a.icon
          return (
            <button key={a.id} onClick={() => onAction(a.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-bold transition-all"
              style={{ borderColor: a.color, color: a.color, background: 'var(--card)' }}
              onMouseEnter={e => e.currentTarget.style.background = a.color + '10'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}>
              <Icon className="w-4 h-4" /> {a.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WorkflowRequests() {
  const navigate = useNavigate()
  const { filteredRequests, requests, workflows, performAction, filter, setFilter } = useWorkflowV2Store()
  const { toast } = useToast()

  const [selectedId, setSelectedId]   = useState(null)
  const [actionModal, setActionModal] = useState(null)  // { actionId }
  const [comment, setComment]         = useState('')
  const [reassignTo, setReassignTo]   = useState('')
  const [reassignReturn, setReassignReturn] = useState(true)
  const [saving, setSaving]           = useState(false)

  const list = useMemo(() => filteredRequests(), [filter, requests])
  const selected = selectedId ? requests.find(r => r.id === selectedId) : list[0]
  const workflow = selected ? workflows.find(w => w.id === selected.workflowId) : null
  const sla = selected && workflow ? slaRemaining(selected) : null

  const stats = {
    pending:   requests.filter(r => ['pending_approval','pending_recheck','pending_modification','reassigned'].includes(r.status)).length,
    overdue:   requests.filter(r => { const s = slaRemaining(r); return s?.overdue }).length,
    approved:  requests.filter(r => r.status === 'approved').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
  }

  const openAction = (actionId) => {
    setComment(''); setReassignTo(''); setReassignReturn(true)
    setActionModal({ actionId })
  }
  const submitAction = () => {
    if (!comment.trim()) { toast.warning('Comment Required', 'Please add a comment to record this action.'); return }
    if (actionModal.actionId === 'reassign' && !reassignTo) { toast.warning('Assignee Required', 'Select a user to reassign to.'); return }
    setSaving(true)
    setTimeout(() => {
      performAction(selected.id, actionModal.actionId, { comment, reassignTo, reassignReturn })
      const def = ACTION_DEFS.find(a => a.id === actionModal.actionId)
      toast.success(`${def?.label} Recorded`, `Action applied to ${selected.id}.`)
      setSaving(false); setActionModal(null); setComment('')
    }, 400)
  }

  // Filter options
  const statusOpts = [{ id:'all', label:'All Status' }, ...Object.entries(WORKFLOW_STATUSES).map(([k, v]) => ({ id: k, label: v.label }))]
  const wfOpts     = [{ id:'all', label:'All Workflows' }, ...workflows.map(w => ({ id: w.id, label: w.name }))]
  const entityOpts = [{ id:'all', label:'All Entities' }, ...ENTITY_TYPES.map(e => ({ id: e.id, label: e.label }))]

  // Users for reassign (sample pool)
  const userOpts = ['Abdullah Al-Rashid','Fatima Al-Zahrani','Khalid Al-Mutairi','Hessa Al-Enazi','Hamad Al-Saud']
    .map(n => ({ id: n, label: n }))

  return (
    <div className="space-y-4 pb-8">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/workflows')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <Inbox className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Workflow Requests</h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>{list.length} of {requests.length} requests · {stats.pending} pending action · {stats.overdue} overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Pending',  v: stats.pending,  c:'var(--warning)' },
          { l:'Overdue',  v: stats.overdue,  c:'var(--danger)'  },
          { l:'Approved', v: stats.approved, c:'var(--success)' },
          { l:'Rejected', v: stats.rejected, c:'var(--text3)'   },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={filter.search} onChange={e => setFilter('search', e.target.value)}
            placeholder="Search request, project, requester…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select2 size="sm" placeholder="Status…"   options={statusOpts} value={filter.status}     onChange={v => setFilter('status', v ?? 'all')} />
        <Select2 size="sm" placeholder="Workflow…" options={wfOpts}     value={filter.workflowId} onChange={v => setFilter('workflowId', v ?? 'all')} />
        <Select2 size="sm" placeholder="Entity…"   options={entityOpts} value={filter.entityType} onChange={v => setFilter('entityType', v ?? 'all')} />
      </div>

      {/* Full-width table with all spec columns */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Requests ({list.length})</span>
          {selected && (
            <button onClick={() => setSelectedId(null)} className="text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>
              Clear selection
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <tr>
                {['Request No','Title','Type','Created By','Created Date','Days Open','Current Stage','Next Approver','Priority','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-sm" style={{ color:'var(--text3)' }}>No requests match filters</td></tr>
              ) : list.map(r => {
                const isSel  = selected?.id === r.id
                const reqSla = slaRemaining(r)
                const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(r.createdAt)) / 86400000))
                // Priority derivation: overdue > 0 → HIGH, ≤ 2 days remaining → MEDIUM, else NORMAL
                let priority = 'normal'
                if (reqSla?.overdue)                       priority = 'high'
                else if (reqSla && reqSla.remainDays <= 2) priority = 'medium'
                const priorityCfg = {
                  high:   { label:'High',   color:'var(--danger)',  bg:'rgba(220,38,38,.12)' },
                  medium: { label:'Medium', color:'var(--warning)', bg:'rgba(217,119,6,.12)' },
                  normal: { label:'Normal', color:'var(--text2)',   bg:'var(--bg2)' },
                }[priority]
                return (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)}
                    className="cursor-pointer relative group"
                    style={{
                      borderTop:'1px solid var(--border)',
                      background: isSel ? 'var(--primary-light)' : '',
                      borderLeft: isSel ? '3px solid var(--primary)' : '3px solid transparent',
                    }}
                    onMouseEnter={e => !isSel && (e.currentTarget.style.background = 'var(--bg2)')}
                    onMouseLeave={e => !isSel && (e.currentTarget.style.background = '')}>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{r.id}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-bold truncate max-w-[180px]" style={{ color:'var(--text)' }} title={r.projectName}>{r.projectName}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px]" style={{ color:'var(--text2)' }}>{r.workflowName}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] truncate" style={{ color:'var(--text2)' }}>{r.requestedBy}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(r.createdAt)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-mono font-bold" style={{ color: daysOpen > 7 ? 'var(--danger)' : daysOpen > 3 ? 'var(--warning)' : 'var(--text2)' }}>
                        {daysOpen}d
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-bold" style={{ color:'var(--text)' }}>{r.currentRole ?? '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px]" style={{ color:'var(--text2)' }}>{r.currentApprover ?? '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md"
                        style={{ background: priorityCfg.bg, color: priorityCfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{priorityCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.status} sm />
                    </td>

                    {/* Hover tooltip: Approval History · SLA · Pending Since · Comments */}
                    <td className="absolute z-30 left-3 top-full mt-1 hidden group-hover:block pointer-events-none" colSpan="0">
                      <div className="rounded-xl border p-3 w-[420px]" style={{ ...C, background:'var(--card)', boxShadow:'0 16px 48px rgba(15,23,42,.18)' }}>
                        <div className="grid grid-cols-2 gap-3 mb-2 pb-2 border-b" style={{ borderColor:'var(--border)' }}>
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Current SLA</div>
                            <div className="text-xs font-mono font-bold" style={{ color: reqSla?.overdue ? 'var(--danger)' : 'var(--text)' }}>
                              {reqSla
                                ? (reqSla.overdue ? `Overdue by ${Math.abs(reqSla.remainDays)}d` : `${reqSla.remainDays}d remaining of ${reqSla.slaDays}d`)
                                : 'No SLA'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Pending Since</div>
                            <div className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{fmtDate(r.updatedAt ?? r.createdAt)}</div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Approval History ({(r.history ?? []).length})</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {(r.history ?? []).slice(0, 4).map(h => (
                              <div key={h.id} className="flex items-center gap-1.5 text-[12.5px]" style={{ color:'var(--text2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'var(--primary)' }} />
                                <span className="font-bold" style={{ color:'var(--text)' }}>{h.action}</span>
                                <span style={{ color:'var(--text3)' }}>by {h.actor}</span>
                                <span className="ml-auto font-mono" style={{ color:'var(--text3)' }}>{fmtDate(h.date)}</span>
                              </div>
                            ))}
                            {(r.history ?? []).length === 0 && <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>No history yet</div>}
                          </div>
                        </div>
                        {(r.comments ?? []).length > 0 && (
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Latest Comment</div>
                            <div className="text-[12.5px] line-clamp-2" style={{ color:'var(--text2)' }}>{r.comments[r.comments.length - 1].text}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel below (visible when a row is selected) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-3">
          {!selected ? (
            <div className="rounded-xl border p-12 text-center" style={C}>
              <Inbox className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
              <p className="text-sm" style={{ color:'var(--text3)' }}>Select a request to view details</p>
            </div>
          ) : (
            <>
              {/* Header card */}
              <div className="rounded-xl border p-4" style={C}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{selected.id}</span>
                      <StatusBadge status={selected.status} />
                      {sla && ['pending_approval','pending_recheck','pending_modification','reassigned'].includes(selected.status) && (
                        <SLAIndicator remaining={sla.remainDays} overdue={sla.overdue} slaDays={sla.slaDays} />
                      )}
                    </div>
                    <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>{selected.projectName}</h3>
                    <div className="text-[11px] mt-0.5" style={{ color:'var(--text3)' }}>{selected.workflowName} · {ENTITY_TYPES.find(e => e.id === selected.entityType)?.label}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor:'var(--border)' }}>
                  {[
                    { l:'Requested By', v: selected.requestedBy },
                    { l:'Current Step', v: selected.currentRole ?? '—' },
                    { l:'Created',      v: fmtDate(selected.createdAt) },
                    { l:'Max Deadline', v: fmtDate(selected.maxDeadline) },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
                      <div className="text-xs font-medium truncate" style={{ color:'var(--text)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval progress */}
              <ApprovalProgress workflow={workflow} request={selected} />

              {/* Action panel */}
              <ActionPanel workflow={workflow} request={selected} onAction={openAction} />

              {/* History */}
              <HistoryTimeline history={selected.history ?? []} />
            </>
          )}
        </div>
      </div>

      {/* Action confirmation modal */}
      {actionModal && (() => {
        const def = ACTION_DEFS.find(a => a.id === actionModal.actionId)
        const Icon = def?.icon ?? CheckCircle2
        const isReassign = actionModal.actionId === 'reassign'
        return (
          <EnterpriseModal open={true} onClose={() => !saving && setActionModal(null)}
            title={`${def?.label} Workflow Request`}
            subtitle={selected.id + ' — ' + selected.projectName}
            icon={<Icon className="w-4 h-4" style={{ color: def?.color }} />}
            size="md"
            footer={<>
              <ModalBtn variant="secondary" onClick={() => setActionModal(null)} disabled={saving}>Cancel</ModalBtn>
              <ModalBtn variant={def?.variant ?? 'primary'} onClick={submitAction} loading={saving}>
                Confirm {def?.label}
              </ModalBtn>
            </>}>
            <div className="space-y-3">
              <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background: def?.color + '08', borderColor: def?.color + '40' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: def?.color }} />
                <p className="text-xs" style={{ color:'var(--text2)' }}>
                  {actionModal.actionId === 'approve' && <>The request will move to the next approver in the workflow. Recorded in audit trail with timestamp, IP and device.</>}
                  {actionModal.actionId === 'reject'  && <>The workflow will be closed and the initiator notified. No further action is possible.</>}
                  {actionModal.actionId === 'return'  && <>The request will be returned to the initiator. On resubmission it will come <strong>back to you</strong> (same step).</>}
                  {actionModal.actionId === 'modify'  && <>The request will be returned to the initiator. On resubmission it will <strong>restart from step 1</strong>.</>}
                  {actionModal.actionId === 'reassign'&& <>The request will be temporarily assigned to another user. If "Return to workflow" is checked, control returns here after completion.</>}
                </p>
              </div>

              {isReassign && (
                <>
                  <div>
                    <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Reassign To *</label>
                    <Select2 options={userOpts} value={reassignTo} onChange={v => setReassignTo(v)} placeholder="Search user…" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => setReassignReturn(!reassignReturn)} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{
                        background: reassignReturn ? 'var(--primary)' : 'transparent',
                        borderColor: reassignReturn ? 'var(--primary)' : 'var(--border2)',
                      }}>
                        {reassignReturn && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs" style={{ color:'var(--text)' }}>Return to workflow after completion</span>
                    </button>
                  </div>
                </>
              )}

              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>
                  Comment <span style={{ color:'var(--danger)' }}>*</span>
                </label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder="Required — explain your decision…"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                  style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
            </div>
          </EnterpriseModal>
        )
      })()}
    </div>
  )
}
