import { useState } from 'react'
import { Wrench, Plus, Search, Check, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import useOperationsStore from '../../store/operationsStore'
import { MaintStatusBadge, PriorityBadge, StatMini, relTime } from '../../components/operations/OperationsBadges'
import { MOCK_VEHICLES, MAINT_TYPES } from '../../api/mock/operationsData'

const KANBAN_COLS = [
  { status: 'pending',     label: 'Pending',     color: 'text-slate-400  border-slate-500/20' },
  { status: 'approved',    label: 'Approved',    color: 'text-sky-400    border-sky-500/20'   },
  { status: 'in_progress', label: 'In Progress', color: 'text-amber-400  border-amber-500/20' },
  { status: 'completed',   label: 'Completed',   color: 'text-emerald-400 border-emerald-500/20' },
]

function NewRequestModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ vehicleId: '', type: '', priority: 'medium', description: '', estimatedCost: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-helm-950/80 z-50 flex items-center justify-center">
      <div className="bg-helm-800 border border-helm-600 rounded-2xl w-[480px] overflow-hidden shadow-card-hover animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-helm-700">
          <h3 className="text-sm font-bold text-white">New Maintenance Request</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Vehicle *</div>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}
                className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                <option value="">Select vehicle…</option>
                {MOCK_VEHICLES.map(v => <option key={v.id} value={v.id}>{v.id} — {v.model}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Type *</div>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                <option value="">Select type…</option>
                {MAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Priority</div>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Est. Cost (SAR)</div>
              <input type="number" value={form.estimatedCost} onChange={e => set('estimatedCost', e.target.value)}
                placeholder="0"
                className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40" />
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Description *</div>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Describe the issue or required maintenance…"
              className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-helm-700">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 border border-helm-600 hover:border-helm-500 rounded-lg transition-all">Cancel</button>
          <button onClick={() => { if (form.vehicleId && form.type && form.description) { onSubmit(form); onClose() } }}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-helm-900 rounded-lg transition-all shadow-amber-glow-sm">
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

function MaintCard({ req }) {
  const [expanded, setExpanded] = useState(false)
  const { approveMaintRequest, updateMaintStatus } = useOperationsStore()
  return (
    <div className={`bg-helm-800 border rounded-xl overflow-hidden transition-all
      ${req.priority === 'critical' ? 'border-red-500/40' : 'border-helm-600'}`}>
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <span className="font-mono text-[12.5px] font-bold text-amber-400">{req.id}</span>
          <PriorityBadge priority={req.priority} />
        </div>
        <div className="text-xs font-semibold text-slate-200 mb-1">{req.type}</div>
        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500 mb-2">
          <span className="font-mono text-slate-400">{req.vehicleId}</span>
          <span>·</span>
          <span>{relTime(req.requestedAt)}</span>
        </div>
        <p className="text-[12.5px] text-slate-400 line-clamp-2">{req.description}</p>
        
        <button onClick={() => setExpanded(!expanded)} className="mt-2 flex items-center gap-1 text-[9px] text-slate-600 hover:text-slate-300 transition-colors">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'Details'}
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-helm-700/50 space-y-1.5 animate-fade-in">
            {[
              { l: 'Requested by', v: req.requestedBy },
              { l: 'Est. Cost', v: req.estimatedCost ? req.estimatedCost.toLocaleString() + ' SAR' : '—' },
              { l: 'SLA', v: req.slaHours + 'h' },
              { l: 'Location', v: req.location },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-[12.5px]">
                <span className="text-slate-600">{l}</span>
                <span className="text-slate-300">{v}</span>
              </div>
            ))}
            {req.approvedBy && (
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate-600">Approved by</span>
                <span className="text-emerald-400">{req.approvedBy}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {req.status === 'pending' && (
        <div className="flex border-t border-helm-700/50">
          <button onClick={() => approveMaintRequest(req.id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[12.5px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <Check className="w-3 h-3" /> Approve
          </button>
          <div className="w-px bg-helm-700" />
          <button onClick={() => updateMaintStatus(req.id, 'cancelled')}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[12.5px] text-red-400 hover:bg-red-500/10 transition-colors">
            <X className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
      {req.status === 'approved' && (
        <button onClick={() => updateMaintStatus(req.id, 'in_progress')}
          className="w-full flex items-center justify-center gap-1 py-2 border-t border-helm-700/50 text-[12.5px] text-amber-400 hover:bg-amber-500/10 transition-colors">
          <Wrench className="w-3 h-3" /> Start Work
        </button>
      )}
      {req.status === 'in_progress' && (
        <button onClick={() => updateMaintStatus(req.id, 'completed')}
          className="w-full flex items-center justify-center gap-1 py-2 border-t border-helm-700/50 text-[12.5px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">
          <Check className="w-3 h-3" /> Mark Complete
        </button>
      )}
    </div>
  )
}

export default function Maintenance() {
  const { maintenance, maintFilter, setMaintFilter, addMaintRequest } = useOperationsStore()
  const [showModal, setShowModal] = useState(false)

  const stats = {
    total:      maintenance.length,
    pending:    maintenance.filter(m => m.status === 'pending').length,
    inProgress: maintenance.filter(m => m.status === 'in_progress').length,
    critical:   maintenance.filter(m => m.priority === 'critical').length,
  }

  const getColItems = (status) => maintenance.filter(m => {
    if (m.status !== status) return false
    if (maintFilter.priority !== 'all' && m.priority !== maintFilter.priority) return false
    if (maintFilter.search && !m.vehicleId.includes(maintFilter.search) && !m.id.includes(maintFilter.search)) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Wrench className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Maintenance Management</h2>
            <p className="text-[11px] text-slate-500">{stats.pending} pending · {stats.inProgress} in progress</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-helm-900 rounded-lg transition-all shadow-amber-glow-sm">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatMini label="Total Requests" value={stats.total}      color="text-slate-100" />
        <StatMini label="Pending"        value={stats.pending}    color="text-slate-400" />
        <StatMini label="In Progress"    value={stats.inProgress} color="text-amber-400" />
        <StatMini label="Critical"       value={stats.critical}   color={stats.critical > 0 ? 'text-red-400' : 'text-emerald-400'} />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={maintFilter.search} onChange={e => setMaintFilter('search', e.target.value)}
            placeholder="Search ID or vehicle…"
            className="bg-helm-800 border border-helm-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-40" />
        </div>
        {[['all','All Priority'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']].map(([v,l]) => (
          <button key={v} onClick={() => setMaintFilter('priority', v)}
            className={`px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all
              ${maintFilter.priority === v ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-helm-800 text-slate-500 border-helm-600 hover:text-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-4 gap-3 items-start">
        {KANBAN_COLS.map(col => {
          const items = getColItems(col.status)
          return (
            <div key={col.status} className="bg-helm-850 border border-helm-700 rounded-xl overflow-hidden">
              <div className={`flex items-center justify-between px-3 py-2.5 border-b border-helm-700`}>
                <span className={`text-[12.5px] font-bold uppercase tracking-widest ${col.color.split(' ')[0]}`}>{col.label}</span>
                <span className="text-[12.5px] font-mono text-slate-600 bg-helm-800 border border-helm-700 rounded-full px-2">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[520px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="py-6 text-center text-[12.5px] text-slate-700">No items</div>
                ) : (
                  items.map(req => <MaintCard key={req.id} req={req} />)
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && <NewRequestModal onClose={() => setShowModal(false)} onSubmit={addMaintRequest} />}
    </div>
  )
}
