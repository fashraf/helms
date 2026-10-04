import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  GitBranch, ArrowLeft, Save, X, Plus, GripVertical, AlertCircle,
  Clock, Trash2, ChevronRight, User, Briefcase, AlertTriangle, Power,
  CheckCircle2, XCircle, CornerUpLeft, Edit3, UserPlus,
} from 'lucide-react'
import useWorkflowV2Store from '../../store/workflowV2Store'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  ENTITY_TYPES, ESCALATION_ACTIONS, APPROVER_TYPES, ROLES_FOR_APPROVAL, WORKFLOW_ACTIONS,
} from '../../api/mock/workflowV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const EMPTY_FORM = {
  name: '', description: '', entityType: 'project',
  status: 'active', maxDays: 15, expiryAction: 'auto_rej',
  actionsEnabled: { approve: true, reject: true, return: true, modify: true, reassign: true },
  steps: [
    { id: 'S1', seq: 1, role: 'Project Manager', approverType: 'manager', slaDays: 5, escalationAction: 'next' },
  ],
}

// ─── Visual horizontal designer ───────────────────────────────────────────────
function VisualDesigner({ steps, expiryAction }) {
  const ACTION_ICONS = {
    next: '⏭️', auto_app: '✅', auto_rej: '❌', remind: '🔔',
  }
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Visual Designer</h4>
        <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Live preview · Max {steps.reduce((s, x) => s + (Number(x.slaDays) || 0), 0)} SLA days</span>
      </div>
      <div className="overflow-x-auto p-5">
        <div className="flex items-center gap-0 min-w-max">
          {/* Creator node */}
          <div className="flex flex-col items-center" style={{ minWidth: 130 }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--text3)' }}>
              <User className="w-5 h-5" />
            </div>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mt-2" style={{ color:'var(--text3)' }}>Start</div>
            <div className="text-xs font-bold leading-tight" style={{ color:'var(--text)' }}>Creator</div>
          </div>
          <div className="w-12 h-0.5 mx-1 rounded" style={{ background:'var(--border)' }} />

          {/* Step nodes */}
          {steps.map((step, i) => {
            const esc = ESCALATION_ACTIONS.find(e => e.id === step.escalationAction)
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center" style={{ minWidth: 160 }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background:'var(--primary)' }}>
                    {i + 1}
                  </div>
                  <div className="text-[12.5px] font-bold uppercase tracking-widest mt-2" style={{ color:'var(--text3)' }}>Step {step.seq}</div>
                  <div className="text-xs font-bold leading-tight text-center px-2" style={{ color:'var(--text)' }}>{step.role}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ background:'var(--warning-light)', color:'var(--warning)' }}>
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />{step.slaDays}d
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }} title={esc?.desc}>
                      {ACTION_ICONS[step.escalationAction] ?? '⏭️'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-0.5 mx-1 rounded" style={{ background:'var(--border)' }} />
              </div>
            )
          })}

          {/* Final node */}
          <div className="flex flex-col items-center" style={{ minWidth: 130 }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background:'var(--success)' }}>
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mt-2" style={{ color:'var(--success)' }}>End</div>
            <div className="text-xs font-bold leading-tight" style={{ color:'var(--text)' }}>Approved</div>
          </div>
        </div>

        {/* Reject / Recheck / Modify branches indicator */}
        <div className="mt-6 flex items-center gap-4 text-[12.5px] flex-wrap" style={{ color:'var(--text3)' }}>
          <span className="font-bold uppercase tracking-widest">Available Branches:</span>
          <div className="flex items-center gap-1.5"><XCircle className="w-3 h-3 text-red-500" /><span>Reject → Closed</span></div>
          <div className="flex items-center gap-1.5"><CornerUpLeft className="w-3 h-3 text-orange-500" /><span>Return → Resubmit to same step</span></div>
          <div className="flex items-center gap-1.5"><Edit3 className="w-3 h-3 text-yellow-600" /><span>Modify → Restart from step 1</span></div>
          <div className="flex items-center gap-1.5"><UserPlus className="w-3 h-3 text-cyan-600" /><span>Reassign → Temporary delegate</span></div>
        </div>
      </div>
    </div>
  )
}

export default function WorkflowBuilderV2() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const { createWorkflow, updateWorkflow, getWorkflow } = useWorkflowV2Store()
  const { toast } = useToast()

  const [form, setForm]       = useState(EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)

  useEffect(() => {
    if (isEdit) {
      const w = getWorkflow(id)
      if (w) setForm({ ...EMPTY_FORM, ...w })
    }
  }, [id, isEdit, getWorkflow])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAction = (k, v) => setForm(f => ({ ...f, actionsEnabled: { ...f.actionsEnabled, [k]: v } }))
  const updateStep = (idx, patch) => setForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, ...patch } : s) }))
  const addStep = () => setForm(f => ({
    ...f,
    steps: [...f.steps, { id: `S${Date.now()}`, seq: f.steps.length + 1, role: 'COO', approverType: 'role', slaDays: 5, escalationAction: 'next' }],
  }))
  const removeStep = (idx) => setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, seq: i + 1 })) }))

  // Drag-drop reorder
  const onDragStart = (i) => setDragIdx(i)
  const onDragOver  = (e) => e.preventDefault()
  const onDrop = (i) => {
    if (dragIdx === null || dragIdx === i) return
    setForm(f => {
      const steps = [...f.steps]
      const [moved] = steps.splice(dragIdx, 1)
      steps.splice(i, 0, moved)
      return { ...f, steps: steps.map((s, idx) => ({ ...s, seq: idx + 1 })) }
    })
    setDragIdx(null)
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim())        e.name = 'Workflow name is required'
    if (!form.description?.trim()) e.description = 'Description is required'
    if (form.steps.length === 0)   e.steps = 'Add at least one approval step'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onAttemptSave = () => {
    if (!validate()) { toast.warning('Validation', 'Fix highlighted fields.'); return }
    setConfirmOpen(true)
  }

  const handleSubmit = () => {
    setSaving(true)
    setTimeout(() => {
      if (isEdit) {
        updateWorkflow(id, form)
        toast.success('Workflow Updated', `${form.name} updated.`)
      } else {
        createWorkflow(form)
        toast.success('Workflow Created', `${form.name} is now available.`)
      }
      setSaving(false); setConfirmOpen(false)
      navigate('/workflows-v2')
    }, 500)
  }

  const ACTION_ICONS = {
    approve:  { icon: CheckCircle2, color: 'var(--success)' },
    reject:   { icon: XCircle,      color: 'var(--danger)'  },
    return:   { icon: CornerUpLeft, color: 'var(--warning)' },
    modify:   { icon: Edit3,        color: '#CA8A04'        },
    reassign: { icon: UserPlus,     color: 'var(--cyan)'    },
  }

  return (
    <div className="space-y-4 pb-8">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/workflows-v2')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <GitBranch className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>{isEdit ? 'Edit Workflow' : 'Create Workflow'}</h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Configure steps, SLA, escalation rules and available actions</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/workflows-v2')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={onAttemptSave} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Workflow'}
          </button>
        </div>
      </div>

      {/* Workflow info */}
      <div className="rounded-xl border p-5" style={C}>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4" style={{ color:'var(--primary)' }} />
          <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Workflow Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Workflow Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Project Approval"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
              style={{ background:'var(--bg2)', borderColor: errors.name ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Entity Type</label>
            <Select2 options={ENTITY_TYPES} value={form.entityType} onChange={v => set('entityType', v)} getIcon={o => o.icon} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Describe when this workflow applies…"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
              style={{ background:'var(--bg2)', borderColor: errors.description ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </div>

      {/* Visual Designer (live preview) */}
      <VisualDesigner steps={form.steps} expiryAction={form.expiryAction} />

      {/* Steps editor */}
      <div className="rounded-xl border p-5" style={C}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color:'var(--primary)' }} />
            <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Approval Steps</h3>
            <span className="text-[12.5px] font-mono px-2 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{form.steps.length} steps · drag to reorder</span>
          </div>
          <button type="button" onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        </div>
        {errors.steps && <div className="flex items-center gap-1 mb-2 text-xs" style={{ color:'var(--danger)' }}><AlertCircle className="w-3.5 h-3.5" /> {errors.steps}</div>}

        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <div key={step.id} draggable onDragStart={() => onDragStart(i)} onDragOver={onDragOver} onDrop={() => onDrop(i)}
              className="rounded-xl border p-3 transition-all cursor-move"
              style={{
                background: dragIdx === i ? 'var(--primary-light)' : 'var(--bg2)',
                borderColor: dragIdx === i ? 'var(--primary)' : 'var(--border)',
              }}>
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color:'var(--text3)' }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background:'var(--primary)' }}>{step.seq}</div>

                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest mb-0.5 block" style={{ color:'var(--text3)' }}>Role</label>
                    <Select2 options={ROLES_FOR_APPROVAL.map(r => ({ id: r, label: r }))} value={step.role} onChange={v => updateStep(i, { role: v })} size="sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest mb-0.5 block" style={{ color:'var(--text3)' }}>Approver Type</label>
                    <Select2 options={APPROVER_TYPES} value={step.approverType} onChange={v => updateStep(i, { approverType: v })} getSubLabel={o => o.desc} size="sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest mb-0.5 block" style={{ color:'var(--text3)' }}>SLA (days)</label>
                    <input type="number" min="1" max="60" value={step.slaDays} onChange={e => updateStep(i, { slaDays: Number(e.target.value) })}
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest mb-0.5 block" style={{ color:'var(--text3)' }}>Escalation</label>
                    <Select2 options={ESCALATION_ACTIONS} value={step.escalationAction} onChange={v => updateStep(i, { escalationAction: v })} getIcon={o => o.icon} getSubLabel={o => o.desc} size="sm" />
                  </div>
                </div>

                {form.steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0" style={{ color:'var(--danger)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--danger-light)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow expiry + actions config */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={C}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color:'var(--warning)' }} />
            <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Workflow Expiry</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Max Workflow Days</label>
              <input type="number" min="1" max="180" value={form.maxDays} onChange={e => set('maxDays', Number(e.target.value))}
                className="w-full rounded-lg px-3 py-2 text-sm border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Expiry Action</label>
              <Select2 options={ESCALATION_ACTIONS} value={form.expiryAction} onChange={v => set('expiryAction', v)} getIcon={o => o.icon} size="sm" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={C}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" style={{ color:'var(--primary)' }} />
            <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Actions Configuration</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(WORKFLOW_ACTIONS).map(a => {
              const ai = ACTION_ICONS[a.id]
              const Icon = ai.icon
              const enabled = !!form.actionsEnabled[a.id]
              return (
                <button key={a.id} type="button" onClick={() => setAction(a.id, !enabled)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: enabled ? ai.color + '10' : 'var(--bg2)',
                    border: `1px solid ${enabled ? ai.color + '50' : 'var(--border)'}`,
                  }}>
                  <div className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: enabled ? ai.color : 'var(--border2)', background: enabled ? ai.color : 'transparent' }}>
                    {enabled && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <Icon className="w-3.5 h-3.5" style={{ color: enabled ? ai.color : 'var(--text3)' }} />
                  <span className="text-xs font-medium" style={{ color: enabled ? 'var(--text)' : 'var(--text3)' }}>{a.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <EnterpriseModal
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title={isEdit ? 'Confirm Workflow Update' : 'Confirm Workflow Creation'}
        subtitle={form.name}
        icon={<GitBranch className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn onClick={handleSubmit} loading={saving}>{isEdit ? 'Yes, Save Changes' : 'Yes, Create Workflow'}</ModalBtn>
        </>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {isEdit
                ? <>Workflow version will be incremented to <strong>v{(form.version ?? 1) + 1}</strong>. In-flight requests continue using their original version.</>
                : <>This workflow will be immediately available for new approval requests.</>}
            </p>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {[
                ['Entity Type',  ENTITY_TYPES.find(e => e.id === form.entityType)?.label],
                ['Total Steps',  form.steps.length],
                ['Max Days',     form.maxDays + ' days'],
                ['Actions',      Object.entries(form.actionsEnabled).filter(([, v]) => v).map(([k]) => WORKFLOW_ACTIONS[k]?.label).join(', ')],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center px-4 py-2.5">
                  <span className="text-[12.5px] font-bold uppercase tracking-wider w-32 flex-shrink-0" style={{ color:'var(--text3)' }}>{l}</span>
                  <span className="text-sm font-medium" style={{ color:'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
