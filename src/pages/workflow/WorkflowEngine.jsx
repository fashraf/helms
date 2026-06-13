import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, GitBranch, Globe, Flag, Play, Pause,
  Copy, Trash2, ExternalLink, Clock, Zap, MoreVertical, RefreshCw,
} from 'lucide-react'
import useWorkflowStore from '../../store/workflowStore'
import { useToast }     from '../../hooks/useToast'
import { WFStatusBadge, WFTypeBadge, WorkflowProgress } from '../../components/workflow/WorkflowBadges'
import { StepIcon, getStepColors } from '../../components/workflow/WorkflowBadges'
import { useState } from 'react'

const FILTER_TABS = [
  { id: 'all',           label: 'All'           },
  { id: 'active',        label: 'Active'        },
  { id: 'draft',         label: 'Draft'         },
  { id: 'local',         label: 'Local'         },
  { id: 'international', label: 'International' },
  { id: 'completed',     label: 'Completed'     },
]

function relTime(iso) {
  if (!iso) return '—'
  const d = (Date.now() - new Date(iso)) / 60000
  if (d < 1) return 'just now'
  if (d < 60) return Math.floor(d) + 'm ago'
  if (d < 1440) return Math.floor(d / 60) + 'h ago'
  return Math.floor(d / 1440) + 'd ago'
}

function StepMiniFlow({ steps }) {
  const realSteps = steps.filter((s) => s.type !== 'location_marker').slice(0, 5)
  return (
    <div className="flex items-center gap-1 mt-2">
      {realSteps.map((step, i) => {
        const c = getStepColors(step.type)
        return (
          <div key={step.id} className="flex items-center gap-0.5">
            {i > 0 && <div className="w-2 h-px bg-helm-700" />}
            <div className={`w-5 h-5 rounded flex items-center justify-center ${c.bg} border ${c.border}`}
              title={step.name}>
              <StepIcon type={step.type} size="xs" className={c.text} />
            </div>
          </div>
        )
      })}
      {steps.filter((s) => s.type !== 'location_marker').length > 5 && (
        <span className="text-[9px] text-slate-600 ml-1">+{steps.filter((s) => s.type !== 'location_marker').length - 5}</span>
      )}
    </div>
  )
}

function WorkflowCard({ wf }) {
  const navigate          = useNavigate()
  const { toast }         = useToast()
  const { deleteWorkflow, duplicateWorkflow, newDraft, loadDraft } = useWorkflowStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const locations = wf.steps.filter((s) => s.type === 'location_marker')
  const realSteps = wf.steps.filter((s) => s.type !== 'location_marker')
  const completed = realSteps.filter((s) => s.status === 'completed').length

  const handleEdit = () => {
    loadDraft(wf.id)
    navigate(`/workflow/builder/${wf.id}`)
  }

  const handleDuplicate = () => {
    const newId = duplicateWorkflow(wf.id)
    toast.info('Duplicated', `${wf.name} (copy) created as draft.`)
    setMenuOpen(false)
  }

  const handleDelete = () => {
    deleteWorkflow(wf.id)
    toast.warning('Deleted', `${wf.name} has been removed.`)
    setMenuOpen(false)
  }

  return (
    <div className="bg-helm-800 border border-helm-600 hover:border-helm-500 rounded-xl overflow-hidden transition-all group">
      {/* Card header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-helm-700/50">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <WFStatusBadge status={wf.status} />
            <WFTypeBadge type={wf.type} />
            {wf.linkedShipment && (
              <span className="text-[9px] font-mono text-amber-400/70 border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 rounded">
                {wf.linkedShipment}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
            {wf.name}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{wf.description}</p>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-200 rounded-lg hover:bg-helm-700 transition-all">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 bg-helm-750 border border-helm-600 rounded-xl shadow-card-hover z-20 overflow-hidden animate-fade-in">
              <button onClick={handleEdit}   className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-helm-700 hover:text-white transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open Builder
              </button>
              <button onClick={handleDuplicate} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-helm-700 hover:text-white transition-colors">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <div className="border-t border-helm-700/50" />
              <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step mini flow */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 text-[12.5px] text-slate-500 mb-2">
          <span className="font-mono">{realSteps.length} steps</span>
          <span className="font-mono">{locations.length} locations</span>
          {wf.config.vatEnabled && <span className="text-teal-400">VAT</span>}
          {wf.config.arabicInvoice && <span className="text-teal-400">عربي</span>}
          {wf.config.incoterms && <span className="text-purple-400">{wf.config.incoterms}</span>}
          {wf.config.currencies?.[0] && <span className="text-purple-400">{wf.config.currencies[0]}</span>}
        </div>
        <WorkflowProgress steps={wf.steps} />
        <StepMiniFlow steps={wf.steps} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-helm-700/50">
        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
          <Clock className="w-3 h-3" />
          <span className="font-mono">Updated {relTime(wf.updatedAt)}</span>
        </div>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-lg transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Open Builder
        </button>
      </div>
    </div>
  )
}

export default function WorkflowEngine() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { listFilter, setListFilter, filteredWorkflows, newDraft, workflows } = useWorkflowStore()
  const [search, setSearch] = useState('')

  const all = filteredWorkflows()
  const shown = search
    ? all.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase()))
    : all

  const stats = {
    total:   workflows.length,
    active:  workflows.filter((w) => w.status === 'active').length,
    draft:   workflows.filter((w) => w.status === 'draft').length,
    intl:    workflows.filter((w) => w.type === 'international').length,
  }

  const handleNew = (type) => {
    const tmpl = type === 'local' ? 'local_standard' : 'intl_export'
    newDraft(tmpl)
    navigate('/workflow/builder/create')
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <GitBranch className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Workflow Engine</h2>
            <p className="text-[11px] text-slate-500">Build, configure and run logistics workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleNew('local')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400 rounded-lg transition-all">
            <Flag className="w-3.5 h-3.5" /> New Local
          </button>
          <button onClick={() => handleNew('international')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 rounded-lg transition-all">
            <Globe className="w-3.5 h-3.5" /> New International
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Workflows', value: stats.total,  color: 'text-slate-200' },
          { label: 'Active',          value: stats.active, color: 'text-emerald-400' },
          { label: 'Draft',           value: stats.draft,  color: 'text-amber-400'   },
          { label: 'International',   value: stats.intl,   color: 'text-purple-400'  },
        ].map((s) => (
          <div key={s.label} className="bg-helm-800 border border-helm-600 rounded-xl p-3">
            <div className={`text-xl font-black font-mono tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[12.5px] text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-helm-800 border border-helm-600 rounded-lg p-0.5 gap-0.5">
          {FILTER_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setListFilter(tab.id)}
              className={`px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-md transition-all
                ${listFilter === tab.id
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows…"
            className="bg-helm-800 border border-helm-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-48 transition-all" />
        </div>

        <span className="text-[12.5px] text-slate-600 ml-auto font-mono">{shown.length} workflows</span>
      </div>

      {/* Workflow grid */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-helm-600 rounded-2xl">
          <GitBranch className="w-10 h-10 text-helm-600 mb-3" />
          <p className="text-slate-500 text-sm">No workflows match your filters</p>
          <button onClick={() => { setListFilter('all'); setSearch('') }}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {shown.map((wf) => <WorkflowCard key={wf.id} wf={wf} />)}
        </div>
      )}
    </div>
  )
}
