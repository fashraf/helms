import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Briefcase, ArrowLeft, ArrowRight, Check, AlertCircle, Save, X, Eye,
  MapPin, Users, Clock, Shield, GitBranch, FileText,
} from 'lucide-react'
import useProjectStore from '../../store/projectStore'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2       from '../../components/ui/Select2'
import MultiSelect2  from '../../components/ui/MultiSelect2'
import {
  PROJECT_SCALES, PROJECT_OWNERS, COUNTRIES, WORK_DAYS, PEOPLE, APPROVAL_DEFAULT_FLOW,
} from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }

const STEPS = [
  { id: 'basic',     num: 1, label: 'Basic Info',   icon: FileText,  sub: 'Project identity & scale' },
  { id: 'team',      num: 2, label: 'Team',         icon: Users,     sub: 'Managers, controllers, coordinators' },
  { id: 'location',  num: 3, label: 'Location',     icon: MapPin,    sub: 'Country, city, site address' },
  { id: 'schedule',  num: 4, label: 'Schedule',     icon: Clock,     sub: 'Working days and hours' },
  { id: 'site',      num: 5, label: 'Site Reqs',    icon: Shield,    sub: 'Gate pass & site requirements' },
  { id: 'approval',  num: 6, label: 'Approval',     icon: GitBranch, sub: 'Approval workflow & review' },
]

const URL_RE = /^https?:\/\/.+/

const EMPTY = {
  name: '', scale: 'medium', owner: 'private', description: '',
  managers: [], docControllers: [], coordinators: [], finalApprover: '',
  country: 'SA', city: '', location: '', address: '',
  workDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
  workFrom: '07:00', workTo: '17:00',
  gatePass: false,
  approvalFlow: APPROVAL_DEFAULT_FLOW,
}

function validateStep(step, form) {
  const e = {}
  if (step === 'basic') {
    if (!form.name?.trim())      e.name  = 'Project name is required'
    if (!form.scale)              e.scale = 'Select a project scale'
    if (!form.owner)              e.owner = 'Select project owner type'
  }
  if (step === 'team') {
    if (!form.managers?.length)        e.managers = 'At least one project manager is required'
    if (!form.finalApprover)            e.finalApprover = 'Final approver is required'
  }
  if (step === 'location') {
    if (!form.country)                  e.country = 'Country is required'
    if (!form.city?.trim())              e.city    = 'City is required'
    if (form.location && !URL_RE.test(form.location)) e.location = 'Must be a valid URL (https://...)'
  }
  if (step === 'schedule') {
    if (!form.workDays?.length)        e.workDays = 'Select at least one working day'
    if (!form.workFrom)                  e.workFrom = 'Start time is required'
    if (!form.workTo)                    e.workTo = 'End time is required'
  }
  return e
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-[12.5px]" style={{ color: 'var(--danger)' }}>
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
      {hint && !error && <div className="text-[12.5px] mt-1" style={{ color: 'var(--text3)' }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, error, ...props }) {
  return (
    <input
      value={value ?? ''}
      onChange={onChange}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none transition-all"
      style={{
        background: 'var(--bg2)',
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        color: 'var(--text)',
      }}
      {...props}
    />
  )
}

function CardPicker({ options, value, onChange, error }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {options.map(o => {
        const sel = value === o.id
        return (
          <button key={o.id} type="button" onClick={() => onChange(o.id)}
            className="flex items-start gap-2.5 p-3 rounded-xl border-2 transition-all text-left"
            style={{
              background: sel ? 'var(--primary-light)' : 'var(--card)',
              borderColor: sel ? 'var(--primary)' : error ? 'var(--danger)' : 'var(--border)',
            }}>
            <span className="text-xl flex-shrink-0">{o.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: sel ? 'var(--primary)' : 'var(--text)' }}>{o.label}</div>
              {o.desc && <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{o.desc}</div>}
            </div>
            {sel && <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />}
          </button>
        )
      })}
    </div>
  )
}

function ToggleSwitch({ value, onChange, label, sublabel }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left"
      style={{ background: value ? 'var(--primary-light)' : 'var(--card)', borderColor: value ? 'rgba(37,99,235,.25)' : 'var(--border)' }}>
      <div>
        <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</div>
        {sublabel && <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{sublabel}</div>}
      </div>
      <div className="w-11 h-6 rounded-full p-0.5 transition-all flex-shrink-0" style={{ background: value ? 'var(--primary)' : 'var(--bg3)' }}>
        <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
      </div>
    </button>
  )
}

function StepIndicator({ current, visited, onJump }) {
  return (
    <div className="rounded-xl border p-3" style={C}>
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isCurrent = current === s.id
          const isDone    = visited.has(s.id) && !isCurrent && STEPS.findIndex(x => x.id === current) > i
          const canJump   = visited.has(s.id)
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button type="button" disabled={!canJump} onClick={() => canJump && onJump(s.id)}
                className="flex items-center gap-2 flex-shrink-0 transition-all disabled:cursor-not-allowed">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg3)',
                    border: `2px solid ${isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)'}`,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,.15)' : 'none',
                  }}>
                  {isDone
                    ? <Check className="w-3.5 h-3.5 text-white" />
                    : <Icon className="w-3.5 h-3.5" style={{ color: isCurrent ? '#fff' : 'var(--text3)' }} />}
                </div>
                <div className="hidden lg:block">
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Step {s.num}</div>
                  <div className="text-xs font-bold leading-tight" style={{ color: isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text2)' }}>
                    {s.label}
                  </div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full" style={{ background: isDone ? 'var(--success)' : 'var(--border)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function ProjectCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { createProject, updateProject, getProject } = useProjectStore()
  const { toast } = useToast()

  const [form, setForm] = useState(EMPTY)
  const [step, setStep] = useState('basic')
  const [visited, setVisited] = useState(new Set(['basic']))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const p = getProject(id)
      if (p) {
        setForm({ ...EMPTY, ...p })
        setVisited(new Set(STEPS.map(s => s.id)))
      }
    }
  }, [id, isEdit, getProject])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const isFirst = stepIdx === 0
  const isLast  = stepIdx === STEPS.length - 1

  const goNext = () => {
    const e = validateStep(step, form)
    setErrors(e)
    if (Object.keys(e).length > 0) {
      toast.warning('Validation', 'Fix the highlighted fields before continuing.')
      return
    }
    if (isLast) { setConfirmOpen(true); return }
    const next = STEPS[stepIdx + 1].id
    setVisited(s => new Set([...s, next]))
    setStep(next)
  }

  const goPrev = () => { if (!isFirst) setStep(STEPS[stepIdx - 1].id) }
  const jumpTo = (id) => setStep(id)

  const handleSubmit = () => {
    const allErrors = {}
    STEPS.forEach(s => Object.assign(allErrors, validateStep(s.id, form)))
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) {
      toast.warning('Validation Failed', 'Some fields are still invalid.')
      setConfirmOpen(false)
      return
    }
    setSaving(true)
    setTimeout(() => {
      if (isEdit) {
        updateProject(id, form)
        toast.success('Project Updated', `${form.name} has been updated.`)
        navigate(`/projects/${id}`)
      } else {
        const newId = createProject(form)
        toast.success('Project Created', `${form.name} created as draft.`)
        navigate(`/projects/${newId}`)
      }
      setConfirmOpen(false)
      setSaving(false)
    }, 500)
  }

  const err = (k) => errors[k]

  const summary = useMemo(() => ({
    name: form.name || '—',
    scale: PROJECT_SCALES.find(s => s.id === form.scale)?.label ?? '—',
    owner: PROJECT_OWNERS.find(o => o.id === form.owner)?.label ?? '—',
    location: `${form.city}, ${COUNTRIES.find(c => c.code === form.country)?.name ?? '—'}`,
    team: `${form.managers.length} managers, ${form.docControllers.length} controllers, ${form.coordinators.length} coordinators`,
    workDays: form.workDays.length,
    hours: `${form.workFrom} – ${form.workTo}`,
    gatePass: form.gatePass ? 'Required' : 'Not required',
  }), [form])

  const selectedCountry = COUNTRIES.find(c => c.code === form.country)
  const cityOpts        = (selectedCountry?.cities ?? []).map(c => ({ id: c, label: c }))

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,.2)' }}>
              <Briefcase className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit Project' : 'Create Project'}</h2>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{STEPS[stepIdx].sub} — Step {stepIdx + 1} of {STEPS.length}</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>

      <StepIndicator current={step} visited={visited} onJump={jumpTo} />

      {/* STEP CONTENT */}
      <div className="rounded-xl border p-6 animate-fade-in" style={C}>
        {/* Step 1: Basic */}
        {step === 'basic' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Project Number" hint="Auto-generated on save">
                  <Input value={isEdit ? form.id : 'Auto-generated'} disabled />
                </Field>
                <Field label="Project Name" required error={err('name')}>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} placeholder="Site A Installation" />
                </Field>
              </div>
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                Project Scale <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <CardPicker options={PROJECT_SCALES} value={form.scale} onChange={v => set('scale', v)} error={err('scale')} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                Project Owner Type <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <CardPicker options={PROJECT_OWNERS} value={form.owner} onChange={v => set('owner', v)} error={err('owner')} />
            </div>
            <Field label="Description / Notes">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="Describe project scope, objectives, key milestones…"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </Field>
          </div>
        )}

        {/* Step 2: Team */}
        {step === 'team' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Project Team</h3>
            <p className="text-[11px] -mt-1 mb-2" style={{ color: 'var(--text3)' }}>Assign multiple users to each role. The Final Approver has authority to close project approval.</p>

            <Field label="Project Managers" required error={err('managers')}>
              <MultiSelect2
                options={PEOPLE}
                selected={form.managers}
                onChange={v => set('managers', v)}
                getLabel={p => p.name}
                getKey={p => p.id}
                getSubLabel={p => `${p.role} · ${p.dept}`}
                placeholder="Select project managers…"
                error={!!err('managers')}
              />
            </Field>
            <Field label="Document Controllers">
              <MultiSelect2
                options={PEOPLE}
                selected={form.docControllers}
                onChange={v => set('docControllers', v)}
                getLabel={p => p.name}
                getKey={p => p.id}
                getSubLabel={p => `${p.role} · ${p.dept}`}
                placeholder="Select document controllers…"
              />
            </Field>
            <Field label="Project Coordinators">
              <MultiSelect2
                options={PEOPLE}
                selected={form.coordinators}
                onChange={v => set('coordinators', v)}
                getLabel={p => p.name}
                getKey={p => p.id}
                getSubLabel={p => `${p.role} · ${p.dept}`}
                placeholder="Select project coordinators…"
              />
            </Field>
            <Field label="Final Approver" required error={err('finalApprover')}
              hint="Only this user can close project approval">
              <Select2
                options={PEOPLE}
                value={form.finalApprover}
                onChange={v => set('finalApprover', v)}
                getLabel={p => p.name}
                getKey={p => p.id}
                getSubLabel={p => `${p.role} · ${p.dept}`}
                placeholder="Select final approver…"
                error={!!err('finalApprover')}
              />
            </Field>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 'location' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Project Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country" required error={err('country')}>
                <Select2
                  options={COUNTRIES}
                  value={form.country}
                  onChange={v => { set('country', v); set('city', '') }}
                  getKey={c => c.code}
                  getLabel={c => c.name}
                  getIcon={c => c.flag}
                  placeholder="Select country…"
                  error={!!err('country')}
                />
              </Field>
              <Field label="City" required error={err('city')}>
                <Select2
                  options={cityOpts}
                  value={form.city}
                  onChange={v => set('city', v)}
                  placeholder="Select city…"
                  error={!!err('city')}
                />
              </Field>
            </div>
            <Field label="Project Location (Google Maps)" error={err('location')} hint="Optional — paste a Google Maps share URL">
              <Input value={form.location} onChange={e => set('location', e.target.value)} error={err('location')} placeholder="https://maps.google.com/?q=…" />
            </Field>
            <Field label="Project Address" hint="Manual entry, free text">
              <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3}
                placeholder="123 Industrial District, Block 4, Riyadh, Saudi Arabia"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </Field>
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 'schedule' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Working Hours & Days</h3>

            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                Work Days <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div className="grid grid-cols-7 gap-2">
                {WORK_DAYS.map(d => {
                  const sel = form.workDays.includes(d.id)
                  return (
                    <button key={d.id} type="button"
                      onClick={() => set('workDays', sel ? form.workDays.filter(x => x !== d.id) : [...form.workDays, d.id])}
                      className="px-2 py-3 rounded-xl border-2 transition-all text-center"
                      style={{
                        background: sel ? 'var(--primary-light)' : 'var(--card)',
                        borderColor: sel ? 'var(--primary)' : 'var(--border)',
                      }}>
                      <div className="text-[12.5px] font-bold tracking-wider mb-0.5" style={{ color: sel ? 'var(--primary)' : 'var(--text3)' }}>{d.short.toUpperCase()}</div>
                      <div className="text-[9px]" style={{ color: sel ? 'var(--primary)' : 'var(--text3)' }}>{d.label.slice(0, 3)}</div>
                    </button>
                  )
                })}
              </div>
              {err('workDays') && <div className="flex items-center gap-1 mt-2 text-[12.5px]" style={{ color: 'var(--danger)' }}><AlertCircle className="w-3 h-3" /> {err('workDays')}</div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="From Time" required error={err('workFrom')}>
                <Input type="time" value={form.workFrom} onChange={e => set('workFrom', e.target.value)} error={err('workFrom')} />
              </Field>
              <Field label="To Time" required error={err('workTo')}>
                <Input type="time" value={form.workTo} onChange={e => set('workTo', e.target.value)} error={err('workTo')} />
              </Field>
            </div>

            <div className="rounded-xl border p-3 text-xs flex items-center gap-2" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)', color: 'var(--primary)' }}>
              <Clock className="w-3.5 h-3.5" />
              {form.workDays.length} day{form.workDays.length !== 1 ? 's' : ''} · {form.workFrom} – {form.workTo}
            </div>
          </div>
        )}

        {/* Step 5: Site requirements */}
        {step === 'site' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Site Requirements</h3>
            <ToggleSwitch
              value={form.gatePass}
              onChange={v => set('gatePass', v)}
              label="Gate Pass Required"
              sublabel="When enabled, all personnel and vehicles must have a valid gate pass before site entry"
            />
          </div>
        )}

        {/* Step 6: Approval */}
        {step === 'approval' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Project Approval Workflow</h3>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>The project will move through the workflow below. Each step supports forward, backward, and modification actions. The Final Approver closes the workflow.</p>
            </div>

            {/* Workflow visual */}
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="text-[12.5px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>Configured Workflow</div>
              <div className="flex items-center gap-2">
                {APPROVAL_DEFAULT_FLOW.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 rounded-xl border p-3 text-center" style={{ background: 'var(--card)', borderColor: 'rgba(37,99,235,.25)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1 text-white text-xs font-black" style={{ background: 'var(--primary)' }}>
                        {s.order}
                      </div>
                      <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{s.label}</div>
                      <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text3)' }}>{s.role}</div>
                    </div>
                    {i < APPROVAL_DEFAULT_FLOW.length - 1 && <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text3)' }} />}
                  </div>
                ))}
              </div>
              <p className="text-[12.5px] mt-3" style={{ color: 'var(--text3)' }}>
                The default workflow is shown. Customize in <strong>Settings → Approval Workflows</strong>.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border p-4" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)' }}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Eye className="w-3.5 h-3.5" /> Project Summary
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                {[
                  ['Project Name', summary.name     ],
                  ['Scale',        summary.scale    ],
                  ['Owner Type',   summary.owner    ],
                  ['Location',     summary.location ],
                  ['Team',         summary.team     ],
                  ['Working Days', `${summary.workDays} days`],
                  ['Hours',        summary.hours    ],
                  ['Gate Pass',    summary.gatePass ],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center gap-2 text-xs">
                    <span className="font-bold" style={{ color: 'var(--text3)' }}>{l}:</span>
                    <span style={{ color: 'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard nav */}
      <div className="rounded-xl border p-3 flex items-center justify-between" style={C}>
        <button onClick={goPrev} disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
          Step <strong style={{ color: 'var(--text)' }}>{stepIdx + 1}</strong> of {STEPS.length}
        </div>
        <button onClick={goNext}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all"
          style={{ background: 'var(--primary)' }}>
          {isLast ? <>{isEdit ? 'Save Changes' : 'Create Project'} <Check className="w-4 h-4" /></>
                  : <>Next <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>

      {/* Confirmation modal */}
      <EnterpriseModal
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title={isEdit ? 'Confirm Project Update' : 'Confirm Project Creation'}
        subtitle={isEdit ? `Save changes to ${form.name}?` : `Create ${form.name || 'new project'}?`}
        icon={<Briefcase className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Yes, Save Changes' : 'Yes, Create Project'}
          </ModalBtn>
        </>}
      >
        <div className="space-y-4">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              {isEdit ? <>Changes will be recorded in the project audit history. Approval workflow state is preserved unless explicitly reset.</>
                : <>The project will be created with status <strong>Draft</strong>. From the project page you can submit it through the approval workflow.</>}
            </p>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="px-4 py-2 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Summary</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {[
                ['Project Name', summary.name     ],
                ['Scale',        summary.scale    ],
                ['Owner Type',   summary.owner    ],
                ['Location',     summary.location ],
                ['Team',         summary.team     ],
                ['Working Days / Hours', `${summary.workDays} days · ${summary.hours}`],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center px-4 py-2.5">
                  <span className="text-[12.5px] font-bold uppercase tracking-wider w-44 flex-shrink-0" style={{ color: 'var(--text3)' }}>{l}</span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
