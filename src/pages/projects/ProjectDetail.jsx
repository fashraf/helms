import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Briefcase, ArrowLeft, Edit3, Copy, Power, FileText, GitBranch, Layers,
  History, Users, MapPin, Clock, Shield, CheckCircle2, XCircle, Send,
  RotateCcw, ArrowUp, AlertTriangle, ChevronDown, ChevronRight,
  Fuel, Plus,
} from 'lucide-react'
import useProjectStore from '../../store/projectStore'
import useFuelStore from '../../store/fuelStore'
import useWaitingChargeStore from '../../store/waitingChargeStore'
import { FUEL_TYPES, FUEL_STATUSES } from '../../api/mock/fuelData'
import { DELAY_REASONS } from '../../api/mock/waitingChargeData'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  PROJECT_STATUSES, PROJECT_SCALES, PROJECT_OWNERS, COUNTRIES, WORK_DAYS, PEOPLE, APPROVAL_ACTIONS,
} from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }

function getPerson(id) { return PEOPLE.find(p => p.id === id) }
function fmtDate(iso)  { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }
function fmtDateTime(iso) { if (!iso) return '—'; return new Date(iso).toLocaleString('en-SA', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) }

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: Layers   },
  { id: 'team',      label: 'Team',      icon: Users    },
  { id: 'approval',  label: 'Approval',  icon: GitBranch},
  { id: 'hierarchy', label: 'Hierarchy', icon: FileText },
  { id: 'fuel',      label: 'Fuel',      icon: Fuel     },
  { id: 'waiting',   label: 'Charges',   icon: Clock    },
  { id: 'audit',     label: 'Audit',     icon: History  },
]

function StatusBadge({ status }) {
  const cfg = PROJECT_STATUSES[status] ?? PROJECT_STATUSES.draft
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[12.5px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

// ─── Approval step card (vertical timeline node) ──────────────────────────────
const STEP_STATUS_CFG = {
  approved: { color: 'var(--success)', bg: 'rgba(5,150,105,.06)',  label: 'APPROVED'  },
  pending:  { color: 'var(--primary)', bg: 'rgba(37,99,235,.06)',  label: 'PENDING'   },
  rejected: { color: 'var(--danger)',  bg: 'rgba(220,38,38,.06)',  label: 'REJECTED'  },
  returned: { color: 'var(--warning)', bg: 'rgba(217,119,6,.06)',  label: 'RETURNED'  },
  waiting:  { color: 'var(--text3)',   bg: 'var(--bg2)',           label: 'WAITING'   },
}

function ApprovalStep({ step, idx, isLast, isCurrent, onAction, canAct }) {
  const cfg = STEP_STATUS_CFG[step.status] ?? STEP_STATUS_CFG.waiting
  return (
    <div className="flex gap-4 relative">
      {/* Left: dot + line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-1"
          style={{ background: cfg.color, border: `2px solid ${cfg.color}`, boxShadow: isCurrent ? `0 0 0 3px ${cfg.color}25` : 'none' }}>
          {step.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-white" />
            : step.status === 'rejected' ? <XCircle className="w-4 h-4 text-white" />
            : step.status === 'returned' ? <RotateCcw className="w-4 h-4 text-white" />
            : <span className="text-white text-xs font-black">{idx + 1}</span>
          }
        </div>
        {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ minHeight: 60, background: step.status === 'approved' ? cfg.color : 'var(--border)' }} />}
      </div>

      {/* Right: card */}
      <div className="flex-1 pb-5">
        <div className="rounded-xl border overflow-hidden" style={{ background: cfg.bg, borderColor: isCurrent ? cfg.color + '40' : 'var(--border)' }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{step.label}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.color, color: '#fff' }}>{cfg.label}</span>
                {isCurrent && <span className="text-[9px] font-bold uppercase tracking-widest animate-pulse" style={{ color: cfg.color }}>Current Step</span>}
              </div>
              {step.actor && (
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  By {step.actor.name} · {fmtDateTime(step.actedAt)}
                </div>
              )}
              {step.comment && (
                <div className="text-xs mt-2 italic" style={{ color: 'var(--text2)' }}>
                  "{step.comment}"
                </div>
              )}
            </div>
          </div>

          {isCurrent && canAct && (
            <div className="px-4 py-3 border-t flex flex-wrap gap-2" style={{ borderColor: cfg.color + '20', background: 'rgba(255,255,255,0.5)' }}>
              {APPROVAL_ACTIONS.map(a => (
                <button key={a.id} onClick={() => onAction(a, idx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold rounded-lg transition-all"
                  style={{ background: 'var(--card)', border: `1px solid ${a.color}40`, color: a.color }}>
                  {a.id === 'approve' && <CheckCircle2 className="w-3 h-3" />}
                  {a.id === 'reject'  && <XCircle className="w-3 h-3" />}
                  {a.id === 'return'  && <RotateCcw className="w-3 h-3" />}
                  {a.id === 'modify'  && <Edit3 className="w-3 h-3" />}
                  {a.id === 'escalate' && <ArrowUp className="w-3 h-3" />}
                  {a.id === 'reassign' && <Users className="w-3 h-3" />}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Hierarchy tree ───────────────────────────────────────────────────────────
function HierarchyNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = (node.workPackages?.length || node.activities?.length) > 0
  const children = node.workPackages || node.activities || []

  const typeColors = {
    phase:        { bg: 'rgba(37,99,235,.06)',  border: 'rgba(37,99,235,.2)',  text: 'var(--primary)', label: 'PHASE'        },
    work_package: { bg: 'rgba(124,58,237,.06)', border: 'rgba(124,58,237,.2)', text: 'var(--purple)',  label: 'WORK PACKAGE' },
    activity:     { bg: 'rgba(5,150,105,.06)',  border: 'rgba(5,150,105,.2)',  text: 'var(--success)', label: 'ACTIVITY'     },
  }
  const cfg = typeColors[node.type] ?? typeColors.phase
  const statusColors = {
    completed: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    active:    'text-blue-600 bg-blue-50 border-blue-200',
    pending:   'text-slate-500 bg-slate-50 border-slate-200',
  }

  return (
    <div>
      <div className="flex items-center gap-2 p-2.5 rounded-lg transition-all" style={{ paddingLeft: 12 + depth * 24 }}>
        {hasChildren ? (
          <button onClick={() => setExpanded(v => !v)} className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text3)' }}>
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : <div className="w-5 h-5 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--border2)' }} /></div>}
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>{node.name}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md uppercase ${statusColors[node.status]}`}>{node.status}</span>
        <div className="w-24 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
            <div className="h-full rounded-full" style={{ width: `${node.progress}%`, background: cfg.text }} />
          </div>
          <span className="text-[12.5px] font-mono font-bold w-8 text-right" style={{ color: 'var(--text2)' }}>{node.progress}%</span>
        </div>
      </div>
      {expanded && children.map((child, i) => (
        <HierarchyNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProject, performApprovalAction, submitForApproval, deactivateProject, activateProject, cloneProject } = useProjectStore()
  const { toast } = useToast()
  const [tab, setTab]                       = useState('overview')
  const [actionModal, setActionModal]       = useState(null)  // { step, idx, action }
  const [actionComment, setActionComment]   = useState('')
  const [confirmModal, setConfirmModal]     = useState(null)  // { type: 'submit' | 'deactivate' | 'activate' | 'clone' }

  const project = getProject(id)
  if (!project) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Briefcase className="w-12 h-12" style={{ color: 'var(--text3)' }} />
      <p className="text-sm" style={{ color: 'var(--text3)' }}>Project not found</p>
      <button onClick={() => navigate('/projects')} className="text-xs" style={{ color: 'var(--primary)' }}>← Back to Projects</button>
    </div>
  )

  const isInactive = project.status === 'inactive'
  const country    = COUNTRIES.find(c => c.code === project.country)
  const owner      = PROJECT_OWNERS.find(o => o.id === project.owner)
  const scale      = PROJECT_SCALES.find(s => s.id === project.scale)
  const finalAppr  = getPerson(project.finalApprover)
  const currentStepIdx = project.approvalFlow.findIndex(s => s.status === 'pending')

  const handleAction = () => {
    if (!actionModal) return
    performApprovalAction({
      projectId: project.id,
      stepIdx: actionModal.idx,
      action: actionModal.action.id,
      actor: PEOPLE[8], // Default to COO
      comment: actionComment,
    })
    toast.success(actionModal.action.label, `Action recorded on ${project.name}.`)
    setActionModal(null)
    setActionComment('')
  }

  const performConfirm = () => {
    if (!confirmModal) return
    const { type } = confirmModal
    if (type === 'submit')          { submitForApproval(project.id);    toast.success('Submitted', 'Project sent for approval.') }
    else if (type === 'deactivate') { deactivateProject(project.id);    toast.warning('Deactivated', `${project.name} marked inactive.`) }
    else if (type === 'activate')   { activateProject(project.id);      toast.success('Activated', `${project.name} is now active.`) }
    else if (type === 'clone')      { const nid = cloneProject(project.id); navigate(`/projects/${nid}/edit`); toast.success('Cloned', 'Draft created.') }
    setConfirmModal(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text2)' }} />
          </button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,.2)' }}>
            <Briefcase className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text3)' }}>
              <span className="font-mono" style={{ color: 'var(--primary)' }}>{project.id}</span>
              <span>·</span>
              <span>{country?.flag} {project.city}, {country?.name}</span>
              <span>·</span>
              <span>{scale?.icon} {scale?.label}</span>
              <span>·</span>
              <span>{owner?.icon} {owner?.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.status === 'draft' && (
            <button onClick={() => setConfirmModal({ type: 'submit' })}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: 'var(--primary)' }}>
              <Send className="w-3.5 h-3.5" /> Submit for Approval
            </button>
          )}
          <button onClick={() => navigate(`/projects/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => setConfirmModal({ type: 'clone' })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
            <Copy className="w-3.5 h-3.5" /> Clone
          </button>
          <button onClick={() => setConfirmModal({ type: isInactive ? 'activate' : 'deactivate' })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all" style={{ ...C, color: isInactive ? 'var(--success)' : 'var(--danger)' }}>
            <Power className="w-3.5 h-3.5" /> {isInactive ? 'Activate' : 'Deactivate'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap"
              style={tab === t.id ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'transparent', color: 'var(--text3)' }}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Project Information</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ['Project Number',  project.id                          ],
                  ['Project Name',    project.name                        ],
                  ['Scale',           scale?.label ?? '—'                 ],
                  ['Owner Type',      owner?.label ?? '—'                 ],
                  ['Country',         `${country?.flag} ${country?.name}` ],
                  ['City',            project.city                        ],
                  ['Created By',      project.createdBy                   ],
                  ['Created Date',    fmtDate(project.createdAt)          ],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text3)' }}>{l}</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{v}</div>
                  </div>
                ))}
                {project.description && <div className="col-span-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Description</div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{project.description}</div>
                </div>}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Location</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-sm" style={{ color: 'var(--text)' }}>{project.address}</div>
                {project.location && <a href={project.location} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--primary)' }}>
                  <MapPin className="w-3 h-3" /> View on Google Maps
                </a>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Working Hours</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>Work Days</div>
                  <div className="flex flex-wrap gap-1">
                    {WORK_DAYS.map(d => {
                      const sel = project.workDays.includes(d.id)
                      return (
                        <span key={d.id} className="text-[9px] font-bold px-2 py-1 rounded-md"
                          style={sel
                            ? { background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,.25)' }
                            : { background: 'var(--bg2)', color: 'var(--text3)', border: '1px solid var(--border)', opacity: 0.5 }}>
                          {d.short.toUpperCase()}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text3)' }}>Hours</div>
                  <div className="text-sm font-bold font-mono" style={{ color: 'var(--text)' }}>{project.workFrom} – {project.workTo}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Site Requirements</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text)' }}>Gate Pass Required</span>
                  <span className={`text-[12.5px] font-bold px-2 py-0.5 rounded-md border
                    ${project.gatePass ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                    {project.gatePass ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      {tab === 'team' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { l: 'Project Managers',    ids: project.managers,       color: 'var(--primary)' },
            { l: 'Document Controllers', ids: project.docControllers, color: 'var(--purple)'  },
            { l: 'Project Coordinators', ids: project.coordinators,   color: 'var(--success)' },
            { l: 'Final Approver',       ids: [project.finalApprover],color: 'var(--warning)' },
          ].map(({ l, ids, color }) => (
            <div key={l} className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>{l}</h3>
              </div>
              <div className="p-3 space-y-2">
                {ids.filter(Boolean).length === 0
                  ? <div className="py-4 text-center text-xs" style={{ color: 'var(--text3)' }}>None assigned</div>
                  : ids.filter(Boolean).map(uid => {
                    const p = getPerson(uid)
                    if (!p) return null
                    return (
                      <div key={uid} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg2)' }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: 'var(--primary-light)', color }}>
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</div>
                          <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{p.role} · {p.dept}</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval workflow */}
      {tab === 'approval' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-3 flex items-center gap-2.5" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.25)' }}>
            <GitBranch className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              Project approval workflow supports <strong>Approve</strong>, <strong>Reject</strong>, <strong>Return for Recheck</strong>, <strong>Request Modification</strong>, <strong>Escalate</strong>, and <strong>Reassign</strong>. Final approval rests with <strong>{finalAppr?.name ?? 'Final Approver'}</strong>.
            </p>
          </div>
          <div className="rounded-xl border p-5" style={C}>
            {project.approvalFlow.map((step, i) => (
              <ApprovalStep
                key={step.id}
                step={step}
                idx={i}
                isLast={i === project.approvalFlow.length - 1}
                isCurrent={i === currentStepIdx}
                onAction={(a, idx) => setActionModal({ action: a, idx, step })}
                canAct={!isInactive && project.status !== 'rejected'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy */}
      {tab === 'hierarchy' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Project Hierarchy</h3>
            <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>
              Project → Phase → Work Package → Activity
            </div>
          </div>
          <div className="p-2">
            {project.hierarchy?.length > 0
              ? project.hierarchy.map(phase => <HierarchyNode key={phase.id} node={phase} />)
              : <div className="py-12 text-center text-sm" style={{ color: 'var(--text3)' }}>No hierarchy defined yet</div>
            }
          </div>
        </div>
      )}

      {/* Fuel logs · project-scoped sub-tab mirror */}
      {tab === 'fuel' && <ProjectFuelTab projectId={project.id} navigate={navigate} />}

      {/* Waiting charges · project-scoped sub-tab mirror */}
      {tab === 'waiting' && <ProjectWaitingTab projectId={project.id} navigate={navigate} />}

      {/* Audit */}
      {tab === 'audit' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Audit Trail</h3>
          </div>
          <table className="w-full">
            <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <tr>
                {['Date', 'User', 'Action', 'Field', 'Old', 'New'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {project.auditHistory.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{fmtDateTime(a.date)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text)' }}>{a.user}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>{a.action}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{a.field ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color: 'var(--danger)' }}>{a.old ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color: 'var(--success)' }}>{a.new ?? '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval action modal */}
      {actionModal && (
        <EnterpriseModal open={true} onClose={() => setActionModal(null)}
          title={`Confirm ${actionModal.action.label}`}
          subtitle={actionModal.step.label}
          icon={
            actionModal.action.id === 'approve' ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} /> :
            actionModal.action.id === 'reject'  ? <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} /> :
            actionModal.action.id === 'return'  ? <RotateCcw className="w-4 h-4" style={{ color: 'var(--warning)' }} /> :
            <Edit3 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setActionModal(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={actionModal.action.id === 'reject' ? 'danger' : actionModal.action.id === 'approve' ? 'success' : 'primary'}
              onClick={handleAction}>
              Yes, {actionModal.action.label}
            </ModalBtn>
          </>}>
          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-xs flex items-start gap-2.5"
              style={{ background: actionModal.action.color + '10', borderColor: actionModal.action.color + '30', color: 'var(--text2)' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: actionModal.action.color }} />
              <span>{actionModal.action.confirmMsg}</span>
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text3)' }}>Comment (optional)</label>
              <textarea value={actionComment} onChange={e => setActionComment(e.target.value)} rows={3}
                placeholder="Add a comment for the audit trail…"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>
        </EnterpriseModal>
      )}

      {/* Generic confirm modal */}
      {confirmModal && (
        <EnterpriseModal open={true} onClose={() => setConfirmModal(null)}
          title={
            confirmModal.type === 'submit'     ? 'Submit for Approval'
            : confirmModal.type === 'deactivate' ? 'Confirm Deactivate Project'
            : confirmModal.type === 'activate'   ? 'Confirm Activate Project'
            : 'Confirm Clone Project'
          }
          subtitle={project.name}
          icon={
            confirmModal.type === 'submit' ? <Send className="w-4 h-4" style={{ color: 'var(--primary)' }} /> :
            confirmModal.type === 'deactivate' ? <Power className="w-4 h-4" style={{ color: 'var(--danger)' }} /> :
            confirmModal.type === 'activate' ? <Power className="w-4 h-4" style={{ color: 'var(--success)' }} /> :
            <Copy className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={confirmModal.type === 'deactivate' ? 'danger' : confirmModal.type === 'activate' ? 'success' : 'primary'}
              onClick={performConfirm}>
              Confirm
            </ModalBtn>
          </>}>
          <p className="text-xs" style={{ color: 'var(--text2)' }}>
            {confirmModal.type === 'submit'     && <>This will submit <strong>{project.name}</strong> through the approval workflow. The first reviewer will be notified.</>}
            {confirmModal.type === 'deactivate' && <>The project will be marked Inactive. Full audit history is preserved.</>}
            {confirmModal.type === 'activate'   && <>The project will be reactivated and team members will regain access.</>}
            {confirmModal.type === 'clone'      && <>A new draft project will be created with the same configuration.</>}
          </p>
        </EnterpriseModal>
      )}
    </div>
  )
}

// ─── Project sub-tab: Fuel Logs ───────────────────────────────────────────────
function ProjectFuelTab({ projectId, navigate }) {
  const { logs } = useFuelStore()
  const projectLogs = logs
    .filter(l => l.projectId === projectId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const sumDiesel = projectLogs.filter(l => l.fuelType === 'diesel').reduce((s, l) => s + Number(l.amount || 0), 0)
  const sumPetrol = projectLogs.filter(l => l.fuelType === 'petrol').reduce((s, l) => s + Number(l.amount || 0), 0)
  return (
    <div className="space-y-3">
      {/* Header strip */}
      <div className="rounded-xl border p-3 flex items-center justify-between flex-wrap gap-2" style={C}>
        <div className="flex items-center gap-3">
          <Fuel className="w-4 h-4" style={{ color:'#D97706' }} />
          <div className="text-[12.5px]">
            <strong style={{ color:'var(--text)' }}>{projectLogs.length} fuel log{projectLogs.length === 1 ? '' : 's'}</strong>
            <span className="ml-2" style={{ color:'var(--text3)' }}>· {sumDiesel}L Diesel · {sumPetrol}L Petrol</span>
          </div>
        </div>
        <button onClick={() => navigate(`/fuel/log?projectId=${projectId}`)} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5" style={{ background:'var(--primary)' }}>
          <Plus className="w-3 h-3" /> Log Fuel
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Date', 'Fuel Type', 'Amount', 'Status', 'Notes'].map(h =>
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {projectLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-[12.5px]" style={{ color:'var(--text3)' }}>
                  No fuel logs recorded for this project yet
                </td></tr>
              ) : projectLogs.map(l => {
                const tcfg = FUEL_TYPES.find(t => t.id === l.fuelType)
                const scfg = FUEL_STATUSES[l.status]
                return (
                  <tr key={l.id} style={{ borderTop:'1px solid var(--border)' }} className="hover:bg-[var(--bg2)]">
                    <td className="px-3 py-2 font-mono">{new Date(l.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: tcfg?.bg, color: tcfg?.color }}>
                        {tcfg?.icon} {tcfg?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold">{l.amount} {l.unit}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: scfg?.bg, color: scfg?.c }}>{scfg?.label}</span>
                    </td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text3)' }}>{l.notes || '—'}</td>
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

// ─── Project sub-tab: Waiting Charges ─────────────────────────────────────────
function ProjectWaitingTab({ projectId, navigate }) {
  const { charges } = useWaitingChargeStore()
  const projectCharges = charges
    .filter(c => c.projectId === projectId)
    .sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate))
  const totalFine = projectCharges.reduce((s, c) => s + Number(c.totalAmount || 0), 0)
  const totalHrs  = projectCharges.reduce((s, c) => s + Number(c.chargedHours || 0), 0)
  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3 flex items-center justify-between flex-wrap gap-2" style={C}>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4" style={{ color:'#DC2626' }} />
          <div className="text-[12.5px]">
            <strong style={{ color:'var(--text)' }}>{projectCharges.length} incident{projectCharges.length === 1 ? '' : 's'}</strong>
            <span className="ml-2" style={{ color:'var(--text3)' }}>· {totalHrs.toFixed(1)}h charged · SAR {totalFine.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <button onClick={() => navigate(`/waiting-charges/create?projectId=${projectId}`)} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5" style={{ background:'#DC2626' }}>
          <Plus className="w-3 h-3" /> Add Charge
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Date', 'Reason', 'Hours', 'Rate', 'Total Fine', 'Shipment'].map(h =>
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {projectCharges.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[12.5px]" style={{ color:'var(--text3)' }}>
                  No waiting charges recorded for this project yet
                </td></tr>
              ) : projectCharges.map(c => {
                const reason = DELAY_REASONS.find(r => r.id === c.delayReason)
                return (
                  <tr key={c.id} style={{ borderTop:'1px solid var(--border)' }} className="hover:bg-[var(--bg2)]">
                    <td className="px-3 py-2 font-mono">{new Date(c.incidentDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${reason?.color ?? '#6B7280'}15`, color: reason?.color ?? '#6B7280' }}>
                        {reason?.icon} {reason?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold">{c.chargedHours}h</td>
                    <td className="px-3 py-2 font-mono">{c.currency} {Number(c.penaltyRate).toFixed(2)}/h</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: c.totalAmount > 0 ? '#DC2626' : '#059669' }}>
                      {c.currency} {Number(c.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px]" style={{ color:'var(--text3)' }}>{c.shipmentId || '—'}</td>
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
