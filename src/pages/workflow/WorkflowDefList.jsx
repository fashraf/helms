import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GitBranch, Plus, Search, Edit3, Copy, Eye, Power, MoreVertical,
  ChevronLeft, ChevronRight, AlertTriangle, Clock, Users, History,
  RotateCcw, Download, Layers, ArrowRight,
} from 'lucide-react'
import useWorkflowV2Store from '../../store/workflowV2Store'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import { ENTITY_TYPES } from '../../api/mock/workflowV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }

function StatusBadge({ status }) {
  const cls = status === 'active'
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : 'text-slate-500 bg-slate-50 border-slate-200'
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{status === 'active' ? 'ACTIVE' : 'INACTIVE'}
  </span>
}

function MiniFlowPreview({ steps }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
            style={{ background:'var(--primary-light)', color:'var(--primary)', border:'1px solid rgba(37,99,235,.2)' }}>
            {s.role}
          </span>
          {i < steps.length - 1 && <ArrowRight className="w-2.5 h-2.5" style={{ color:'var(--text3)' }} />}
        </div>
      ))}
    </div>
  )
}

function RowActions({ wf, onView, onEdit, onClone, onDeactivate, onActivate }) {
  const [open, setOpen] = useState(false)
  const isInactive = wf.status === 'inactive'
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color:'var(--text3)' }}
        onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
        onMouseLeave={e => e.currentTarget.style.background=''}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-40 rounded-xl border z-30 overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow-md)' }}>
            {[
              { icon:Eye,   label:'View',   fn:onView,   color:'var(--text2)'  },
              { icon:Edit3, label:'Edit',   fn:onEdit,   color:'var(--text2)'  },
              { icon:Copy,  label:'Clone',  fn:onClone,  color:'var(--primary)'},
              isInactive
                ? { icon:RotateCcw, label:'Activate',   fn:onActivate,   color:'var(--success)' }
                : { icon:Power,     label:'Deactivate', fn:onDeactivate, color:'var(--danger)'  },
            ].map(({ icon:Icon, label, fn, color }) => (
              <button key={label} onClick={() => { fn(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors" style={{ color }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background=''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onChange, total, showing }) {
  let pages = []
  if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  else if (page <= 4)              pages = [1,2,3,4,5,'…',totalPages]
  else if (page >= totalPages - 3) pages = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
  else                             pages = [1,'…',page-1,page,page+1,'…',totalPages]
  return (
    <div className="flex items-center justify-between gap-3 px-2">
      <div className="text-[11px]" style={{ color:'var(--text3)' }}>Showing <strong style={{ color:'var(--text)' }}>{showing}</strong> of <strong style={{ color:'var(--text)' }}>{total}</strong></div>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}><ChevronLeft className="w-3.5 h-3.5" /></button>
        {pages.map((p, i) => p === '…' ? <span key={i} className="px-1.5 text-xs" style={{ color:'var(--text3)' }}>…</span>
          : <button key={i} onClick={() => onChange(p)} className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border"
              style={p === page ? { background:'var(--primary)', color:'#fff', borderColor:'var(--primary)' } : { background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }}>{p}</button>)}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

export default function WorkflowDefList() {
  const navigate = useNavigate()
  const { filteredWorkflows, filter, setFilter, workflows, requests,
    cloneWorkflow, deactivateWorkflow, activateWorkflow } = useWorkflowV2Store()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)

  const fullList = filteredWorkflows()
  useEffect(() => { setPage(1) }, [filter.search, filter.status, filter.entityType])

  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const cp = Math.min(page, totalPages)
  const list = fullList.slice((cp - 1) * PAGE_SIZE, cp * PAGE_SIZE)

  const stats = {
    total:    workflows.length,
    active:   workflows.filter(w => w.status === 'active').length,
    inactive: workflows.filter(w => w.status === 'inactive').length,
    inFlight: requests.filter(r => ['pending_approval','pending_recheck','pending_modification','reassigned'].includes(r.status)).length,
  }

  const askConfirm = (type, wf) => setConfirmAction({ type, wf })
  const performAction = () => {
    if (!confirmAction) return
    const { type, wf } = confirmAction
    if (type === 'deactivate'){ deactivateWorkflow(wf.id); toast.warning('Deactivated', `${wf.name} deactivated.`) }
    else if (type === 'activate'){ activateWorkflow(wf.id); toast.success('Activated', `${wf.name} is now active.`) }
    else if (type === 'clone') {
      const newId = cloneWorkflow(wf.id)
      toast.success('Cloned', `Created copy. Opening editor.`)
      navigate(`/workflows-v2/${newId}/edit`)
    }
    setConfirmAction(null)
  }

  const statusOpts = [{ id:'all', label:'All Status' }, { id:'active', label:'Active' }, { id:'inactive', label:'Inactive' }]
  const entityOpts = [{ id:'all', label:'All Entity Types' }, ...ENTITY_TYPES.map(e => ({ id: e.id, label: e.label, icon: e.icon }))]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <GitBranch className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Approval Workflows</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{fullList.length} of {stats.total} workflows · {stats.inFlight} requests in flight</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/workflows-v2/requests')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Layers className="w-3.5 h-3.5" /> Workflow Requests
          </button>
          <button onClick={() => navigate('/workflows-v2/audit')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <History className="w-3.5 h-3.5" /> Audit Trail
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/workflows-v2/create')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Workflows', v:stats.total,    c:'var(--text)'    },
          { l:'Active',          v:stats.active,   c:'var(--success)' },
          { l:'Inactive',        v:stats.inactive, c:'var(--text3)'   },
          { l:'In Flight',       v:stats.inFlight, c:'var(--primary)' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={filter.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search workflow name, description…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-48"><Select2 options={statusOpts} value={filter.status} onChange={v => setFilter('status', v ?? 'all')} size="sm" /></div>
        <div className="w-56"><Select2 options={entityOpts} value={filter.entityType} onChange={v => setFilter('entityType', v ?? 'all')} getIcon={o => o.icon} size="sm" /></div>
      </div>

      {/* List */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Workflow Name','Entity Type','Steps','Approval Path','Max Days','Status','Last Updated','Version',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {list.length === 0
                ? <tr><td colSpan={9} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No workflows match your filters</td></tr>
                : list.map(w => {
                  const entity = ENTITY_TYPES.find(e => e.id === w.entityType)
                  return (
                    <tr key={w.id} className="cursor-pointer transition-colors" onClick={() => navigate(`/workflows-v2/${w.id}/edit`)}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{w.name}</div>
                        <div className="text-[12.5px] line-clamp-1" style={{ color:'var(--text3)' }}>{w.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>
                          {entity?.icon} {entity?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm font-bold font-mono" style={{ color:'var(--text)' }}>{w.steps.length}</span></td>
                      <td className="px-4 py-3"><MiniFlowPreview steps={w.steps} /></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--warning-light)', color:'var(--warning)' }}>
                          <Clock className="w-3 h-3" /> {w.maxDays}d
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(w.updatedAt)}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>v{w.version}</span></td>
                      <td className="px-4 py-3">
                        <RowActions wf={w}
                          onView={() => navigate(`/workflows-v2/${w.id}/edit`)}
                          onEdit={() => navigate(`/workflows-v2/${w.id}/edit`)}
                          onClone={() => askConfirm('clone', w)}
                          onDeactivate={() => askConfirm('deactivate', w)}
                          onActivate={() => askConfirm('activate', w)} />
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <div className="border-t px-3 py-2.5" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
          <Pagination page={cp} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
        </div>
      </div>

      {/* Confirmation */}
      {confirmAction && (
        <EnterpriseModal open={true} onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === 'deactivate' ? 'Confirm Deactivate Workflow'
            : confirmAction.type === 'activate' ? 'Confirm Activate Workflow'
            : 'Confirm Clone Workflow'
          }
          subtitle={confirmAction.wf.name}
          icon={
            confirmAction.type === 'deactivate' ? <Power className="w-4 h-4" style={{ color:'var(--danger)' }} />
            : confirmAction.type === 'activate' ? <Power className="w-4 h-4" style={{ color:'var(--success)' }} />
            : <Copy className="w-4 h-4" style={{ color:'var(--primary)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={confirmAction.type === 'deactivate' ? 'danger' : confirmAction.type === 'activate' ? 'success' : 'primary'}
              onClick={performAction}>
              {confirmAction.type === 'deactivate' ? 'Yes, Deactivate' : confirmAction.type === 'activate' ? 'Yes, Activate' : 'Yes, Clone'}
            </ModalBtn>
          </>}>
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{
            background: confirmAction.type === 'deactivate' ? 'var(--danger-light)' : 'var(--bg2)',
            borderColor: confirmAction.type === 'deactivate' ? 'rgba(220,38,38,.3)' : 'var(--border)',
          }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{
              color: confirmAction.type === 'deactivate' ? 'var(--danger)' : 'var(--text3)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {confirmAction.type === 'deactivate' && <>This workflow will no longer be available for new requests. <strong>In-flight requests continue normally</strong> using the version they started with. No data is deleted.</>}
              {confirmAction.type === 'activate'   && <>This workflow will be available again for new requests.</>}
              {confirmAction.type === 'clone'      && <>A copy will be created and the editor will open for you to customize it.</>}
            </p>
          </div>
        </EnterpriseModal>
      )}
    </div>
  )
}
