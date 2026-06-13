import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GitBranch, Plus, Search, Download, Eye, Edit3, Copy, Power, RotateCcw,
  MoreVertical, ChevronLeft, ChevronRight, AlertTriangle, Inbox,
  Workflow as WorkflowIcon, Layers, Clock,
} from 'lucide-react'
import useWorkflowV2Store from '../../store/workflowV2Store'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import { ENTITY_TYPES } from '../../api/mock/workflowV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

const STATUS = {
  active:   { label: 'Active',   cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  inactive: { label: 'Inactive', cls: 'text-slate-500 bg-slate-50 border-slate-200'       },
}

function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }

function StatusBadge({ status }) {
  const cfg = STATUS[status] ?? STATUS.inactive
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function RowActions({ wf, onView, onEdit, onClone, onActivate, onDeactivate }) {
  const [open, setOpen] = useState(false)
  const isInactive = wf.status === 'inactive'
  const items = [
    { icon: Eye,   label: 'View',         fn: onView,   color:'var(--text2)' },
    { icon: Edit3, label: 'Edit',         fn: onEdit,   color:'var(--text2)' },
    { icon: Copy,  label: 'Clone',        fn: onClone,  color:'var(--primary)' },
    isInactive
      ? { icon: RotateCcw, label: 'Activate',   fn: onActivate,   color: 'var(--success)' }
      : { icon: Power,     label: 'Deactivate', fn: onDeactivate, color: 'var(--danger)'  },
  ]
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color:'var(--text3)' }}
        onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background=''}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-40 rounded-xl border z-30 overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow-md)' }}>
            {items.map(({ icon:Icon, label, fn, color }) => (
              <button key={label} onClick={() => { fn(); setOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors" style={{ color }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function WorkflowList() {
  const navigate = useNavigate()
  const { filteredWorkflows, filter, setFilter, workflows, requests, cloneWorkflow, deactivateWorkflow, activateWorkflow } = useWorkflowV2Store()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [entityFilter, setEntityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmAction, setConfirmAction] = useState(null)

  const fullList = filteredWorkflows().filter(w => {
    if (entityFilter !== 'all' && w.entityType !== entityFilter) return false
    if (statusFilter !== 'all' && w.status     !== statusFilter) return false
    return true
  })

  useEffect(() => { setPage(1) }, [filter.search, entityFilter, statusFilter])
  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const cp = Math.min(page, totalPages)
  const list = fullList.slice((cp - 1) * PAGE_SIZE, cp * PAGE_SIZE)

  const reqByWf = (id) => requests.filter(r => r.workflowId === id).length
  const activeReqByWf = (id) => requests.filter(r => r.workflowId === id && ['pending_approval','pending_recheck','pending_modification','reassigned'].includes(r.status)).length

  const stats = {
    total:    workflows.length,
    active:   workflows.filter(w => w.status === 'active').length,
    requests: requests.length,
    pending:  requests.filter(r => ['pending_approval','pending_recheck','pending_modification','reassigned'].includes(r.status)).length,
  }

  const askConfirm = (type, wf) => setConfirmAction({ type, wf })
  const perform = () => {
    if (!confirmAction) return
    const { type, wf } = confirmAction
    if (type === 'deactivate') { deactivateWorkflow(wf.id); toast.warning('Deactivated', `${wf.name} deactivated.`) }
    else if (type === 'activate') { activateWorkflow(wf.id); toast.success('Activated', `${wf.name} is active.`) }
    else if (type === 'clone') {
      const newId = cloneWorkflow(wf.id)
      toast.success('Cloned', `${wf.name} cloned. Editing new workflow.`)
      navigate(`/workflows/${newId}/edit`)
    }
    setConfirmAction(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <WorkflowIcon className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Workflow Designer</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{fullList.length} of {stats.total} workflow templates · {stats.pending} active requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/workflows/requests')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Inbox className="w-3.5 h-3.5" /> Requests <span className="font-mono font-bold ml-1" style={{ color:'var(--primary)' }}>{stats.pending}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/workflows/create')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Workflows', v:stats.total,    c:'var(--text)' },
          { l:'Active',          v:stats.active,   c:'var(--success)' },
          { l:'Total Requests',  v:stats.requests, c:'var(--primary)' },
          { l:'Pending Action',  v:stats.pending,  c:'var(--warning)' },
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
            placeholder="Search workflow name, description…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-56">
          <Select2 size="sm" placeholder="Entity type…"
            options={[{ id:'all', label:'All Entity Types' }, ...ENTITY_TYPES.map(e => ({ id: e.id, label: e.label }))]}
            value={entityFilter} onChange={v => setEntityFilter(v ?? 'all')} />
        </div>
        <div className="w-40">
          <Select2 size="sm" placeholder="Status…"
            options={[{ id:'all', label:'All Status' },{ id:'active', label:'Active' },{ id:'inactive', label:'Inactive' }]}
            value={statusFilter} onChange={v => setStatusFilter(v ?? 'all')} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Workflow Name','Entity Type','Steps','Max Days','Active Requests','Status','Updated',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {list.length === 0
                ? <tr><td colSpan={8} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No workflows match filters</td></tr>
                : list.map(w => {
                  const entity = ENTITY_TYPES.find(e => e.id === w.entityType)
                  return (
                    <tr key={w.id} className="cursor-pointer transition-colors" onClick={() => navigate(`/workflows/${w.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                            <GitBranch className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{w.name}</div>
                            <div className="text-[9px] truncate max-w-[280px]" style={{ color:'var(--text3)' }}>{w.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-[12.5px] px-2 py-0.5 rounded font-bold" style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}>{entity?.label ?? w.entityType}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{w.steps?.length ?? 0}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--text2)' }}>{w.maxDays}d</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color:'var(--primary)' }}>{activeReqByWf(w.id)}</span> <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>/ {reqByWf(w.id)} total</span></td>
                      <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(w.updatedAt)}</span></td>
                      <td className="px-4 py-3">
                        <RowActions wf={w}
                          onView={() => navigate(`/workflows/${w.id}`)}
                          onEdit={() => navigate(`/workflows/${w.id}/edit`)}
                          onClone={() => askConfirm('clone', w)}
                          onActivate={() => askConfirm('activate', w)}
                          onDeactivate={() => askConfirm('deactivate', w)} />
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmAction && (
        <EnterpriseModal open={true} onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === 'deactivate' ? 'Deactivate Workflow'
            : confirmAction.type === 'activate' ? 'Activate Workflow'
            : 'Clone Workflow'
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
            <ModalBtn variant={confirmAction.type === 'deactivate' ? 'danger' : 'primary'} onClick={perform}>
              {confirmAction.type === 'deactivate' ? 'Yes, Deactivate' : confirmAction.type === 'activate' ? 'Yes, Activate' : 'Yes, Clone'}
            </ModalBtn>
          </>}>
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--text3)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {confirmAction.type === 'deactivate' && <>New requests will not be able to use this workflow. <strong>In-flight requests continue normally</strong>. Audit history is preserved.</>}
              {confirmAction.type === 'activate'   && <>The workflow will become available for new requests immediately.</>}
              {confirmAction.type === 'clone'      && <>A copy will be created with all steps and rules. You will be redirected to edit the new workflow.</>}
            </p>
          </div>
        </EnterpriseModal>
      )}
    </div>
  )
}
