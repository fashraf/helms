import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  GitBranch, ArrowLeft, Save, X, Plus, Trash2, GripVertical, AlertCircle,
  Clock, AlertTriangle, ArrowRight, User, CheckCircle2, XCircle, ChevronDown,
  ChevronUp, Workflow as WorkflowIcon,
} from 'lucide-react'
import useWorkflowV2Store from '../../store/workflowV2Store'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import { ENTITY_TYPES, ESCALATION_ACTIONS, ROLES_FOR_APPROVAL, APPROVER_TYPES } from '../../api/mock/workflowV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const EMPTY = {
  name: '', description: '', entityType: 'project', status: 'active',
  maxDays: 15, expiryAction: 'auto_rej',
  actionsEnabled: { approve: true, reject: true, return: true, modify: true, reassign: true },
  steps: [
    { id: 'S1', seq: 1, role: 'Project Manager', approverType: 'manager', slaDays: 5, escalationAction: 'next' },
  ],
}

const ACTION_DEFS = [
  { id: 'approve',  label: 'Approve',              color: 'var(--success)' },
  { id: 'reject',   label: 'Reject',               color: 'var(--danger)'  },
  { id: 'return',   label: 'Return for Recheck',   color: 'var(--warning)' },
  { id: 'modify',   label: 'Request Modification', color: 'var(--purple)'  },
  { id: 'reassign', label: 'Reassign',             color: 'var(--cyan)'    },
]

function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color:'var(--text3)' }}>
        {label} {required && <span style={{ color:'var(--danger)' }}>*</span>}
      </label>
      {children}
      {error && <div className="flex items-center gap-1 mt-1 text-[12.5px]" style={{ color:'var(--danger)' }}><AlertCircle className="w-3 h-3" /> {error}</div>}
      {hint && !error && <div className="text-[12.5px] mt-1" style={{ color:'var(--text3)' }}>{hint}</div>}
    </div>
  )
}

// ─── Visual horizontal designer ────────────────────────────────────────────────
function VisualDesigner({ steps }) {
  if (!steps?.length) return null
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <div className="flex items-center gap-2">
          <WorkflowIcon className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Visual Workflow</h3>
          <span className="text-[12.5px] font-mono px-2 py-0.5 rounded ml-auto" style={{ background:'var(--card)', color:'var(--text3)', border:'1px solid var(--border)' }}>
            {steps.length} steps · {steps.reduce((sum, s) => sum + (Number(s.slaDays) || 0), 0)} days total
          </span>
        </div>
      </div>
      <div className="overflow-x-auto p-6">
        <div className="flex items-start min-w-max gap-0">
          {/* Initiator node */}
          <div className="flex flex-col items-center" style={{ minWidth: 140 }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <User className="w-6 h-6" style={{ color:'var(--text3)' }} />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-2" style={{ color:'var(--text3)' }}>Start</div>
            <div className="text-xs font-bold" style={{ color:'var(--text)' }}>Initiator</div>
          </div>

          {/* Steps */}
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start">
              {/* Arrow */}
              <div className="flex items-center pt-7 px-1" style={{ minWidth: 50 }}>
                <ArrowRight className="w-5 h-5" style={{ color:'var(--primary)' }} />
              </div>
              <div className="flex flex-col items-center" style={{ minWidth: 160 }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-black text-white"
                  style={{ background:'var(--primary)' }}>
                  {step.seq}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-2" style={{ color:'var(--primary)' }}>Step {step.seq}</div>
                <div className="text-xs font-bold text-center" style={{ color:'var(--text)' }}>{step.role || 'Unassigned'}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{APPROVER_TYPES.find(a => a.id === step.approverType)?.label ?? step.approverType}</div>
                <div className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded font-bold text-[9px]"
                  style={{ background: step.slaDays <= 2 ? 'var(--danger-light)' : step.slaDays <= 5 ? 'var(--warning-light)' : 'var(--bg2)',
                           color:      step.slaDays <= 2 ? 'var(--danger)'      : step.slaDays <= 5 ? 'var(--warning)'      : 'var(--text3)' }}>
                  <Clock className="w-2.5 h-2.5" /> SLA {step.slaDays}d
                </div>
                <div className="text-[9px] mt-1 italic" style={{ color:'var(--text3)' }}>{ESCALATION_ACTIONS.find(a => a.id === step.escalationAction)?.label ?? step.escalationAction}</div>
              </div>
            </div>
          ))}

          {/* End */}
          <div className="flex items-center pt-7 px-1" style={{ minWidth: 50 }}>
            <ArrowRight className="w-5 h-5" style={{ color:'var(--success)' }} />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 140 }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white"
              style={{ background:'var(--success)' }}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-2" style={{ color:'var(--success)' }}>End</div>
            <div className="text-xs font-bold" style={{ color:'var(--text)' }}>Approved</div>
          </div>
        </div>
      </div>

      {/* Legend with paths */}
      <div className="border-t px-4 py-2.5 flex items-center gap-4 text-[12.5px]" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        {[
          { l:'Approve path',  c:'var(--success)' },
          { l:'Reject path',   c:'var(--danger)'  },
          { l:'Recheck path',  c:'var(--warning)' },
          { l:'Modify path',   c:'var(--purple)'  },
        ].map(({ l, c }) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ background: c }} />
            <span style={{ color:'var(--text2)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step editor row ───────────────────────────────────────────────────────────
function StepRow({ step, idx, total, onChange, onMove, onRemove }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="flex items-center px-3 py-2 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <button type="button" onClick={() => onMove(idx, -1)} disabled={idx === 0}
          className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ color:'var(--text3)' }}>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => onMove(idx, 1)} disabled={idx === total - 1}
          className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ color:'var(--text3)' }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ml-2 mr-2" style={{ background:'var(--primary)' }}>
          {step.seq}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text2)' }}>Step {step.seq}</span>
        <span className="ml-3 text-xs" style={{ color:'var(--text)' }}>{step.role || '—'}</span>
        <button type="button" onClick={() => onRemove(idx)} disabled={total === 1}
          className="ml-auto text-[12.5px] font-semibold px-2 py-1 rounded disabled:opacity-40" style={{ color:'var(--danger)' }}>
          <Trash2 className="w-3.5 h-3.5 inline" /> Remove
        </button>
      </div>
      <div className="p-3 grid grid-cols-4 gap-3">
        <Field label="Role / Title">
          <input value={step.role} onChange={e => onChange(idx, { role: e.target.value })} placeholder="e.g. COO"
            className="w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </Field>
        <Field label="Approver Type">
          <Select2 options={APPROVER_TYPES} value={step.approverType} onChange={v => onChange(idx, { approverType: v })} />
        </Field>
        <Field label="SLA Days">
          <input type="number" min={1} value={step.slaDays} onChange={e => onChange(idx, { slaDays: Number(e.target.value) || 1 })}
            className="w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </Field>
        <Field label="On SLA Breach">
          <Select2 options={ESCALATION_ACTIONS} value={step.escalationAction} onChange={v => onChange(idx, { escalationAction: v })} />
        </Field>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WorkflowDesigner() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { createWorkflow, updateWorkflow, getWorkflow } = useWorkflowV2Store()
  const { toast } = useToast()

  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const w = getWorkflow(id)
      if (w) setForm({ ...EMPTY, ...w })
    }
  }, [id, isEdit, getWorkflow])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const updateStep = (idx, patch) =>
    setForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, ...patch } : s) }))

  const moveStep = (idx, dir) => {
    setForm(f => {
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= f.steps.length) return f
      const next = [...f.steps]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return { ...f, steps: next.map((s, i) => ({ ...s, seq: i + 1 })) }
    })
  }

  const addStep = () =>
    setForm(f => ({ ...f, steps: [...f.steps, { id: `S${Date.now()}`, seq: f.steps.length + 1, role: '', approverType: 'role', slaDays: 5, escalationAction: 'next' }] }))

  const removeStep = (idx) =>
    setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, seq: i + 1 })) }))

  const validate = () => {
    const e = {}
    if (!form.name?.trim())                    e.name = 'Workflow name is required'
    if (!form.description?.trim())             e.description = 'Description is required'
    if (form.steps.length === 0)               e.steps = 'At least one step is required'
    form.steps.forEach((s, i) => { if (!s.role?.trim()) e[`step_${i}`] = `Step ${i + 1} role is required` })
    if (form.maxDays < form.steps.reduce((sum, s) => sum + (Number(s.slaDays) || 0), 0))
      e.maxDays = 'Max workflow days must be ≥ sum of step SLAs'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) { toast.warning('Validation', 'Fix highlighted fields.'); setConfirmOpen(false); return }
    setSaving(true)
    setTimeout(() => {
      if (isEdit) {
        updateWorkflow(id, form)
        toast.success('Workflow Saved', `${form.name} updated.`)
      } else {
        const newId = createWorkflow(form)
        toast.success('Workflow Created', `${form.name} created (${newId}).`)
      }
      setSaving(false); setConfirmOpen(false)
      navigate('/workflows')
    }, 400)
  }

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
              <WorkflowIcon className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>{isEdit ? 'Edit Workflow' : 'Create Workflow'}</h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Define approval steps, SLAs and escalation rules</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/workflows')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={() => setConfirmOpen(true)} className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Workflow'}
          </button>
        </div>
      </div>

      {/* Visual designer preview */}
      <VisualDesigner steps={form.steps} />

      {/* Workflow info */}
      <div className="rounded-xl border p-5" style={C}>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color:'var(--text)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--primary)' }}>1</span>
          Workflow Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Workflow Name" required error={errors.name}>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Project Approval"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
              style={{ background:'var(--bg2)', borderColor: errors.name ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
          </Field>
          <Field label="Entity Type" required>
            <Select2 options={ENTITY_TYPES} value={form.entityType} onChange={v => set('entityType', v)} />
          </Field>
          <div className="col-span-2">
            <Field label="Description" required error={errors.description}>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                placeholder="What this workflow is for and when to use it…"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                style={{ background:'var(--bg2)', borderColor: errors.description ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
            </Field>
          </div>
        </div>
      </div>

      {/* Steps editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--primary)' }}>2</span>
            Approval Steps
          </h3>
          <button type="button" onClick={addStep}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        </div>
        {form.steps.map((s, i) => (
          <StepRow key={s.id} step={s} idx={i} total={form.steps.length} onChange={updateStep} onMove={moveStep} onRemove={removeStep} />
        ))}
      </div>

      {/* Expiry settings */}
      <div className="rounded-xl border p-5" style={C}>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color:'var(--text)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--primary)' }}>3</span>
          Workflow Expiry & Actions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Maximum Workflow Days" required error={errors.maxDays}>
            <input type="number" min={1} value={form.maxDays} onChange={e => set('maxDays', Number(e.target.value) || 1)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
              style={{ background:'var(--bg2)', borderColor: errors.maxDays ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
          </Field>
          <Field label="On Workflow Expiry">
            <Select2
              options={[
                { id:'auto_rej',    label:'Auto Reject & Notify' },
                { id:'auto_cancel', label:'Auto Cancel'           },
                { id:'escalate',    label:'Escalate to Admin'     },
              ]} value={form.expiryAction} onChange={v => set('expiryAction', v)} />
          </Field>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-2 block" style={{ color:'var(--text3)' }}>Enabled Actions</label>
            <div className="grid grid-cols-5 gap-2">
              {ACTION_DEFS.map(a => {
                const k = a.id
                const isOn = form.actionsEnabled[k]
                return (
                  <button key={k} type="button"
                    onClick={() => set('actionsEnabled', { ...form.actionsEnabled, [k]: !isOn })}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all"
                    style={{
                      background: isOn ? a.color + '15' : 'var(--card)',
                      borderColor: isOn ? a.color : 'var(--border)',
                      color: isOn ? a.color : 'var(--text3)',
                    }}>
                    {isOn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <EnterpriseModal open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)}
        title={isEdit ? 'Confirm Save Workflow' : 'Confirm Create Workflow'}
        subtitle={form.name || 'New Workflow'}
        icon={<WorkflowIcon className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn onClick={handleSave} loading={saving}>{isEdit ? 'Yes, Save' : 'Yes, Create Workflow'}</ModalBtn>
        </>}>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
          <div className="divide-y" style={{ borderColor:'var(--border)' }}>
            {[
              ['Name',         form.name],
              ['Entity Type',  ENTITY_TYPES.find(e => e.id === form.entityType)?.label],
              ['Steps',        `${form.steps.length} approval step(s)`],
              ['Max Duration', `${form.maxDays} days`],
              ['Actions',      Object.entries(form.actionsEnabled).filter(([_, v]) => v).map(([k]) => k).join(', ')],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center px-4 py-2.5">
                <span className="text-[12.5px] font-bold uppercase tracking-wider w-40 flex-shrink-0" style={{ color:'var(--text3)' }}>{l}</span>
                <span className="text-sm font-medium" style={{ color:'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
