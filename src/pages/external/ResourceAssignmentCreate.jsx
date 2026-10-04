// External Resource Assignment · Create Wizard (4 steps, compact)
// 1 equipment + 1 worker per assignment · auto-generates a manpower PO on submit
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Briefcase, Users, Calendar, Eye, Check, X,
  Truck, Sun, Moon, AlertCircle, AlertTriangle, Search, Clock, Info,
  Send, User, DollarSign, FileText, Phone,
} from 'lucide-react'
import useExternalResourceStore from '../../store/externalResourceStore'
import useToastStore from '../../store/toastStore'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  EQUIPMENT_TYPES, PROJECTS, NATIONALITIES, ATTENDANCE_MANAGERS,
  findEmployee, daysBetween, totalDaysOf, buildWorkerPool,
} from '../../api/mock/externalResourceData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtMoney = (n) => (Number(n) || 0).toLocaleString()

const STEPS = [
  { id:'project', num:1, label:'Project & Equipment', icon: Briefcase },
  { id:'worker',  num:2, label:'Worker Assignment',   icon: Users     },
  { id:'shift',   num:3, label:'Shift & Cost',        icon: Calendar  },
  { id:'review',  num:4, label:'Review & Confirm',    icon: Eye       },
]

export default function ResourceAssignmentCreate() {
  const navigate = useNavigate()
  const { createAssignment, assignments: existingAssignments } = useExternalResourceStore()
  const toast = useToastStore()
  const [step, setStep] = useState('project')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const todayISO = new Date().toISOString().slice(0, 10)
  const inNDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

  const [form, setForm] = useState({
    projectId: null, projectName: '', projectLocation: '',
    passRequired: false, passNumber: '', passExpiry: '',
    equipment: { name: '', type: 'crane', numberPlate: '', startDate: todayISO, endDate: inNDays(7) },
    resource:  { name: '', iqama: '', nationality: 'India', mobile: '', manager: '', managerPhone: '' },
    shift: {
      startDate: todayISO, endDate: inNDays(7),
      fridayWork: false, fridayOvertime: false,
      startTime: '07:00', endTime: '17:00', breakHours: 1,
      nightShift: false,
      needAttendance: true, attendanceManagedBy: 'site_supervisor', minHours: 8,
    },
    cost: { dailyRate: 750, currency: 'SAR' },
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setEq = (k, v) => setForm(f => ({ ...f, equipment: { ...f.equipment, [k]: v } }))
  const setRes = (k, v) => setForm(f => ({ ...f, resource:  { ...f.resource,  [k]: v } }))
  const setShift = (k, v) => setForm(f => ({ ...f, shift:    { ...f.shift,    [k]: v } }))
  const setCost = (k, v) => setForm(f => ({ ...f, cost:     { ...f.cost,     [k]: v } }))

  const totalDays = totalDaysOf(form.shift.startDate, form.shift.endDate)
  const totalAmount = (form.cost.dailyRate || 0) * totalDays

  // ─── Validation ──────────────────────────────────────────────────────
  const stepErrors = useMemo(() => {
    const e = {}
    if (step === 'project') {
      if (!form.projectId) e.projectId = 'Project is required'
      if (form.passRequired && !form.passNumber) e.passNumber = 'Pass number required'
      if (form.passRequired && !form.passExpiry) e.passExpiry = 'Pass expiry required'
      if (!form.equipment.name) e.eqName = 'Equipment name required'
      if (!form.equipment.numberPlate) e.eqPlate = 'Number plate required'
      if (form.equipment.startDate && form.equipment.endDate && new Date(form.equipment.endDate) < new Date(form.equipment.startDate)) e.eqDates = 'End date cannot be before start date'
    }
    if (step === 'worker') {
      if (!form.resource.name) e.resName = 'Worker name required'
      if (!form.resource.iqama || form.resource.iqama.length < 6) e.resIqama = 'Valid Iqama required (≥6 digits)'
      // Cross-assignment conflict
      if (form.resource.iqama) {
        existingAssignments.filter(a => ['active','upcoming','delayed'].includes(a.status)).forEach(a => {
          if (a.resource?.iqama !== form.resource.iqama) return
          const start1 = new Date(form.shift.startDate), end1 = new Date(form.shift.endDate)
          const start2 = new Date(a.shift?.startDate), end2 = new Date(a.shift?.endDate)
          if (start1 <= end2 && start2 <= end1) {
            e.resConflict = `Iqama ${form.resource.iqama} already assigned to ${a.id} (${a.projectName}) from ${fmtDate(a.shift?.startDate)} to ${fmtDate(a.shift?.endDate)}`
          }
        })
      }
    }
    if (step === 'shift') {
      if (!form.shift.startDate || !form.shift.endDate) e.shiftDates = 'Start and end dates required'
      if (new Date(form.shift.endDate) < new Date(form.shift.startDate)) e.shiftDates = 'End date cannot be before start date'
      if (!form.cost.dailyRate || form.cost.dailyRate <= 0) e.cost = 'Daily rate must be greater than zero'
    }
    return e
  }, [form, step, existingAssignments])

  const canProceed = Object.keys(stepErrors).length === 0
  const goPrev = () => { const idx = STEPS.findIndex(s => s.id === step); if (idx > 0) setStep(STEPS[idx - 1].id) }
  const goNext = () => {
    if (!canProceed) { toast.warning('Cannot proceed', Object.values(stepErrors)[0]); return }
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
    else setConfirmOpen(true)
  }

  // ─── Handlers ────────────────────────────────────────────────────────
  const onProjectChange = (id) => {
    const p = PROJECTS.find(x => x.id === id)
    if (p) setForm(f => ({ ...f, projectId: p.id, projectName: p.name, projectLocation: p.location }))
    else   setForm(f => ({ ...f, projectId: null, projectName:'', projectLocation:'' }))
  }

  const onIqamaBlur = () => {
    const hist = findEmployee(form.resource.iqama)
    if (hist && !form.resource.name) {
      setForm(f => ({ ...f, resource: { ...f.resource, name: hist.name, nationality: hist.nationality, mobile: hist.mobile } }))
      toast.success('Auto-filled from history', `${hist.name} · ${hist.daysWorked}d worked`)
    }
  }

  const pickWorker = (w) => {
    setForm(f => ({ ...f, resource: { ...f.resource, name: w.name, iqama: w.iqama, nationality: w.nationality, mobile: w.mobile } }))
    toast.success('Worker selected', `${w.name} · Iqama ${w.iqama}`)
    setPickerOpen(false)
    setPickerSearch('')
  }

  const submit = () => {
    const draft = {
      ...form,
      passExpiry: form.passExpiry ? new Date(form.passExpiry).toISOString() : null,
      equipment: {
        ...form.equipment,
        id: `EQ-${Date.now()}`,
        status: 'upcoming',
        startDate: new Date(form.equipment.startDate).toISOString(),
        endDate: new Date(form.equipment.endDate).toISOString(),
      },
      resource: { ...form.resource, id: `RES-${Date.now()}` },
      shift: {
        ...form.shift,
        startDate: new Date(form.shift.startDate).toISOString(),
        endDate: new Date(form.shift.endDate).toISOString(),
      },
      cost: { ...form.cost, totalDays, totalAmount },
      createdBy: 'Fahad Al-Ghamdi',
    }
    const result = createAssignment(draft)
    toast.success('Assignment created', `${result?.id} · ${result?.poId} auto-generated`)
    setConfirmOpen(false)
    navigate('/external-resources')
  }

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const workerPool = useMemo(() => buildWorkerPool(existingAssignments).filter(w => {
    if (!pickerSearch) return true
    const q = pickerSearch.toLowerCase()
    return (w.name ?? '').toLowerCase().includes(q) || (w.iqama ?? '').includes(q) || (w.nationality ?? '').toLowerCase().includes(q)
  }), [existingAssignments, pickerSearch])

  return (
    <div className="space-y-3">
      {/* Header — single row, dense */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/external-resources')} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={{ ...C }}>
            <ArrowLeft className="w-3.5 h-3.5" style={{ color:'var(--text2)' }} />
          </button>
          <div>
            <h2 className="text-sm font-bold" style={{ color:'var(--text)' }}>New External Resource Assignment</h2>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>1 equipment + 1 worker · auto-generates manpower PO</p>
          </div>
        </div>
      </div>

      {/* Compact stepper */}
      <div className="rounded-lg border p-2" style={C}>
        <div className="flex items-center gap-1">
          {STEPS.map((s, idx) => {
            const isActive = step === s.id
            const isDone = idx < stepIdx
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center flex-1">
                <button onClick={() => isDone && setStep(s.id)} disabled={!isDone}
                  className="flex items-center gap-1.5 flex-1 px-1.5 py-1 rounded transition-all disabled:cursor-not-allowed">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{
                      background: isActive ? '#8B5CF6' : isDone ? '#059669' : 'var(--bg2)',
                      color: isActive || isDone ? '#fff' : 'var(--text3)',
                    }}>
                    {isDone ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color: isActive ? '#8B5CF6' : 'var(--text3)' }} />
                    <span className="text-[12.5px] font-bold truncate" style={{ color: isActive ? 'var(--text)' : 'var(--text3)' }}>{s.label}</span>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className="h-0.5 w-3 flex-shrink-0" style={{ background: idx < stepIdx ? '#059669' : 'var(--border)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step body */}
      <div className="rounded-xl border p-4" style={C}>
        {step === 'project' && <Step1 form={form} set={set} setEq={setEq} onProjectChange={onProjectChange} errors={stepErrors} />}
        {step === 'worker'  && <Step2 form={form} setRes={setRes} onIqamaBlur={onIqamaBlur} openPicker={() => setPickerOpen(true)} errors={stepErrors} />}
        {step === 'shift'   && <Step3 form={form} setShift={setShift} setCost={setCost} totalDays={totalDays} totalAmount={totalAmount} errors={stepErrors} />}
        {step === 'review'  && <Step4 form={form} totalDays={totalDays} totalAmount={totalAmount} />}
      </div>

      {/* Step nav */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={stepIdx === 0}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 disabled:opacity-40"
          style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
          <ArrowLeft className="w-3 h-3" /> Previous
        </button>
        <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Step {stepIdx + 1} of {STEPS.length}</div>
        <button onClick={goNext}
          className="px-3 py-1.5 text-xs font-bold rounded-lg text-white flex items-center gap-1.5"
          style={{ background:'#8B5CF6' }}>
          {stepIdx === STEPS.length - 1 ? <><Send className="w-3 h-3" />Submit</> : <>Next <ArrowRight className="w-3 h-3" /></>}
        </button>
      </div>

      {/* Confirm modal */}
      <EnterpriseModal open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="Confirm Assignment" subtitle="A matching manpower PO will be auto-generated"
        icon={<Eye className="w-4 h-4" style={{ color:'#8B5CF6' }} />} size="lg"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)}>Back</ModalBtn>
          <ModalBtn onClick={submit}><Check className="w-3 h-3 mr-1" />Confirm</ModalBtn>
        </>}>
        <Step4 form={form} totalDays={totalDays} totalAmount={totalAmount} compact />
      </EnterpriseModal>

      {/* Worker picker modal */}
      <EnterpriseModal open={pickerOpen} onClose={() => { setPickerOpen(false); setPickerSearch('') }}
        title="Pick a Worker" subtitle="Workers from prior assignments and employee history pool"
        icon={<Users className="w-4 h-4" style={{ color:'#8B5CF6' }} />} size="lg"
        footer={<ModalBtn variant="secondary" onClick={() => { setPickerOpen(false); setPickerSearch('') }}>Cancel</ModalBtn>}>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
            <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus
              placeholder="Search name, Iqama, nationality…"
              className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {workerPool.length === 0 ? (
              <p className="text-center py-6 text-xs" style={{ color:'var(--text3)' }}>No matching workers</p>
            ) : workerPool.map(w => (
              <button key={w.iqama} onClick={() => pickWorker(w)}
                className="w-full text-left rounded-lg border p-2.5 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background:'#8B5CF6' }}>
                  {w.name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color:'var(--text)' }}>{w.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: w.source === 'history' ? 'rgba(37,99,235,.12)' : 'rgba(139,92,246,.12)', color: w.source === 'history' ? 'var(--primary)' : '#8B5CF6' }}>
                      {w.source === 'history' ? 'History' : 'Prior Assignment'}
                    </span>
                  </div>
                  <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color:'var(--text3)' }}>
                    <span className="font-mono">{w.iqama}</span><span>·</span>
                    <span>{w.nationality}</span><span>·</span>
                    <Phone className="w-2.5 h-2.5" /><span className="font-mono">{w.mobile}</span>
                  </div>
                  {w.daysWorked != null && (
                    <div className="text-[10px] flex items-center gap-3 mt-0.5" style={{ color:'var(--text3)' }}>
                      <span><strong>{w.daysWorked}d</strong> worked</span>
                      {w.attendanceRating != null && <span>Rating <strong style={{ color: w.attendanceRating >= 90 ? 'var(--success)' : 'var(--warning)' }}>{w.attendanceRating}%</strong></span>}
                      {w.avgHours != null && <span>Avg <strong>{w.avgHours}h</strong></span>}
                    </div>
                  )}
                  {w.projects?.length > 0 && (
                    <div className="text-[9px] mt-0.5 truncate" style={{ color:'var(--text3)' }}>{w.projects.join(' · ')}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 1 — Project & Equipment (compact)
// ═══════════════════════════════════════════════════════════════════════
function Step1({ form, set, setEq, onProjectChange, errors }) {
  return (
    <div className="space-y-3">
      <Section icon={Briefcase} title="Project">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={7} label="Project Name" required error={errors.projectId}>
            <Select2 value={form.projectId} onChange={onProjectChange} placeholder="Search project…"
              options={PROJECTS.map(p => ({ id: p.id, label: p.name, sublabel: `${p.client} · ${p.location}` }))}
              getSubLabel={o => o.sublabel} />
          </Field>
          <Field colSpan={5} label="Location">
            <Input value={form.projectLocation} disabled />
          </Field>
          <Field colSpan={3} label="Pass Required">
            <Toggle value={form.passRequired} onChange={v => set('passRequired', v)} />
          </Field>
          {form.passRequired && (
            <>
              <Field colSpan={5} label="Pass Number" required error={errors.passNumber}>
                <Input value={form.passNumber} onChange={v => set('passNumber', v.toUpperCase())} placeholder="e.g. NEOM-P-44521" mono />
              </Field>
              <Field colSpan={4} label="Pass Expiry" required error={errors.passExpiry}>
                <Input type="date" value={form.passExpiry} onChange={v => set('passExpiry', v)} mono />
              </Field>
            </>
          )}
        </div>
      </Section>

      <Section icon={Truck} title="Equipment">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={5} label="Equipment Name" required error={errors.eqName}>
            <Input value={form.equipment.name} onChange={v => setEq('name', v)} placeholder="e.g. Crane #44 · 60T Crawler" />
          </Field>
          <Field colSpan={3} label="Type">
            <Select2 size="sm" value={form.equipment.type} onChange={v => setEq('type', v)}
              options={EQUIPMENT_TYPES.map(t => ({ id: t.id, label: `${t.icon} ${t.label}` }))} />
          </Field>
          <Field colSpan={4} label="Number Plate" required tooltip="Equipment registration / number plate" error={errors.eqPlate}>
            <Input value={form.equipment.numberPlate} onChange={v => setEq('numberPlate', v.toUpperCase())} placeholder="e.g. RUH-7842" mono />
          </Field>
          <Field colSpan={6} label="Start Date" error={errors.eqDates}>
            <Input type="date" value={form.equipment.startDate} onChange={v => setEq('startDate', v)} mono />
          </Field>
          <Field colSpan={6} label="End Date">
            <Input type="date" value={form.equipment.endDate} onChange={v => setEq('endDate', v)} mono />
          </Field>
        </div>
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 2 — Worker (compact, with picker modal trigger)
// ═══════════════════════════════════════════════════════════════════════
function Step2({ form, setRes, onIqamaBlur, openPicker, errors }) {
  const hist = findEmployee(form.resource.iqama)
  return (
    <div className="space-y-3">
      <Section icon={Users} title="Worker Details" right={
        <button type="button" onClick={openPicker}
          className="px-2.5 py-1 text-[12.5px] font-bold rounded-lg flex items-center gap-1.5 text-white"
          style={{ background:'#8B5CF6' }}>
          <Search className="w-3 h-3" /> Pick from History
        </button>
      }>
        {/* History hit banner */}
        {hist && (
          <div className="rounded-lg p-2 mb-2 flex items-start gap-2" style={{ background:'rgba(5,150,105,.06)', border:'1px solid rgba(5,150,105,.3)' }}>
            <Search className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color:'var(--success)' }} />
            <div className="flex-1 text-[12.5px]">
              <span className="font-bold" style={{ color:'var(--success)' }}>History match · {hist.name}</span>
              <span className="ml-2" style={{ color:'var(--text2)' }}>
                {hist.daysWorked}d worked · Rating <strong style={{ color: hist.attendanceRating >= 90 ? 'var(--success)' : 'var(--warning)' }}>{hist.attendanceRating ?? '—'}%</strong> · Avg {hist.avgHours ?? '—'}h
              </span>
            </div>
          </div>
        )}

        {/* Conflict banner */}
        {errors.resConflict && (
          <div className="rounded-lg p-2 mb-2 flex items-start gap-2" style={{ background:'rgba(220,38,38,.06)', border:'1px solid rgba(220,38,38,.3)' }}>
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color:'var(--danger)' }} />
            <div className="flex-1 text-[12.5px]">
              <span className="font-bold" style={{ color:'var(--danger)' }}>Resource conflict</span>
              <span className="ml-1" style={{ color:'var(--text2)' }}>{errors.resConflict}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={3} label="Iqama Number" required error={errors.resIqama}>
            <Input value={form.resource.iqama} onChange={v => setRes('iqama', v.replace(/[^0-9]/g, '').slice(0, 10))}
              onBlur={onIqamaBlur} placeholder="10-digit Iqama" maxLength={10} mono />
          </Field>
          <Field colSpan={4} label="Worker Name" required error={errors.resName}>
            <Input value={form.resource.name} onChange={v => setRes('name', v)} placeholder="Full name as on Iqama" />
          </Field>
          <Field colSpan={2} label="Nationality">
            <Select2 size="sm" value={form.resource.nationality} onChange={v => setRes('nationality', v)}
              options={NATIONALITIES.map(n => ({ id: n, label: n }))} />
          </Field>
          <Field colSpan={3} label="Mobile Number">
            <Input value={form.resource.mobile} onChange={v => setRes('mobile', v)} placeholder="+966 50 123 4567" mono />
          </Field>
          <Field colSpan={6} label="Manager Name">
            <Input value={form.resource.manager} onChange={v => setRes('manager', v)} placeholder="Reporting manager on site" />
          </Field>
          <Field colSpan={6} label="Manager Contact">
            <Input value={form.resource.managerPhone} onChange={v => setRes('managerPhone', v)} placeholder="+966 50 ..." mono />
          </Field>
        </div>
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 3 — Shift + Cost
// ═══════════════════════════════════════════════════════════════════════
function Step3({ form, setShift, setCost, totalDays, totalAmount, errors }) {
  const shift = form.shift

  const workingHours = useMemo(() => {
    if (!shift.startTime || !shift.endTime) return 0
    const [sh, sm] = shift.startTime.split(':').map(Number)
    const [eh, em] = shift.endTime.split(':').map(Number)
    let start = sh + sm / 60
    let end = eh + em / 60
    if (shift.nightShift && end < start) end += 24
    return Math.max(0, end - start - (Number(shift.breakHours) || 0))
  }, [shift.startTime, shift.endTime, shift.breakHours, shift.nightShift])

  const crossesMidnight = shift.nightShift && shift.endTime && shift.startTime && shift.endTime < shift.startTime

  return (
    <div className="space-y-3">
      <Section icon={Calendar} title="Shift Period">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={4} label="Start Date" required error={errors.shiftDates}>
            <Input type="date" value={shift.startDate} onChange={v => setShift('startDate', v)} mono />
          </Field>
          <Field colSpan={4} label="End Date" required>
            <Input type="date" value={shift.endDate} onChange={v => setShift('endDate', v)} mono />
          </Field>
          <Field colSpan={4} label="Total Duration">
            <div className="px-2.5 py-1.5 text-sm font-mono font-bold rounded-lg border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'#8B5CF6' }}>
              {totalDays > 0 ? `${totalDays} day${totalDays > 1 ? 's' : ''}` : '—'}
            </div>
          </Field>
        </div>
      </Section>

      <Section icon={Sun} title="Working Schedule">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={2} label="Start Time"><Input type="time" value={shift.startTime} onChange={v => setShift('startTime', v)} mono /></Field>
          <Field colSpan={2} label="End Time"><Input type="time" value={shift.endTime} onChange={v => setShift('endTime', v)} mono /></Field>
          <Field colSpan={2} label="Break (h)"><Input type="number" step="0.5" min="0" value={shift.breakHours} onChange={v => setShift('breakHours', Number(v))} mono /></Field>
          <Field colSpan={2} label="Min Hours"><Input type="number" min="0" value={shift.minHours} onChange={v => setShift('minHours', Number(v))} mono /></Field>
          <Field colSpan={2} label="Working">
            <div className="px-2.5 py-1.5 text-sm font-mono font-bold rounded-lg border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color: workingHours >= shift.minHours ? 'var(--success)' : 'var(--warning)' }}>
              {workingHours.toFixed(1)}h
            </div>
          </Field>
          <Field colSpan={2} label="Night Shift">
            <div className="flex items-center gap-1.5">
              <Toggle value={shift.nightShift} onChange={v => setShift('nightShift', v)} />
            </div>
          </Field>
          {crossesMidnight && (
            <div className="col-span-12 text-[10px] font-bold inline-flex items-center gap-1 px-2 py-1 rounded" style={{ background:'rgba(139,92,246,.12)', color:'#8B5CF6', width:'fit-content' }}>
              <Moon className="w-3 h-3" /> Shift crosses midnight
            </div>
          )}

          <Field colSpan={3} label="Friday Work">
            <Toggle value={shift.fridayWork} onChange={v => setShift('fridayWork', v)} />
          </Field>
          {shift.fridayWork && (
            <Field colSpan={3} label="Friday Overtime">
              <label className="flex items-center gap-1.5 cursor-pointer h-[34px]">
                <input type="checkbox" checked={shift.fridayOvertime} onChange={e => setShift('fridayOvertime', e.target.checked)} />
                <span className="text-[12.5px]" style={{ color:'var(--text2)' }}>Apply OT rates</span>
              </label>
            </Field>
          )}
          <Field colSpan={shift.fridayWork ? 3 : 4} label="Attendance Required">
            <Toggle value={shift.needAttendance} onChange={v => setShift('needAttendance', v)} />
          </Field>
          {shift.needAttendance && (
            <Field colSpan={shift.fridayWork ? 3 : 5} label="Managed By">
              <Select2 size="sm" value={shift.attendanceManagedBy} onChange={v => setShift('attendanceManagedBy', v)} options={ATTENDANCE_MANAGERS} />
            </Field>
          )}
        </div>
      </Section>

      <Section icon={DollarSign} title="Cost (auto-generates manpower PO)" right={
        <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.12)', color:'var(--warning)' }}>
          <FileText className="w-3 h-3" /> PO auto-generated on submit
        </span>
      }>
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={3} label="Currency">
            <Select2 size="sm" value={form.cost.currency} onChange={v => setCost('currency', v)}
              options={[{ id:'SAR', label:'SAR' },{ id:'USD', label:'USD' },{ id:'AED', label:'AED' }]} />
          </Field>
          <Field colSpan={3} label="Daily Rate" required error={errors.cost}>
            <Input type="number" min="0" value={form.cost.dailyRate} onChange={v => setCost('dailyRate', Number(v))} mono placeholder="e.g. 750" />
          </Field>
          <Field colSpan={2} label="Total Days">
            <div className="px-2.5 py-1.5 text-sm font-mono font-bold rounded-lg border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}>
              {totalDays}
            </div>
          </Field>
          <Field colSpan={4} label="Total Manpower Cost">
            <div className="px-2.5 py-1.5 text-sm font-mono font-bold rounded-lg border-2" style={{ background:'rgba(139,92,246,.06)', borderColor:'#8B5CF6', color:'#8B5CF6' }}>
              {form.cost.currency} {fmtMoney(totalAmount)}
            </div>
          </Field>
        </div>
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 4 — Review
// ═══════════════════════════════════════════════════════════════════════
function Step4({ form, totalDays, totalAmount, compact }) {
  const t = EQUIPMENT_TYPES.find(x => x.id === form.equipment.type)
  return (
    <div className="space-y-2">
      {!compact && <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Final Review</h3>}

      <ReviewBlock title="Project" rows={[
        { k:'Project',       v: form.projectName || '—' },
        { k:'Location',      v: form.projectLocation || '—' },
        { k:'Pass Required', v: form.passRequired ? `Yes · ${form.passNumber} (expires ${fmtDate(form.passExpiry)})` : 'No' },
      ]} />

      <ReviewBlock title="Equipment" rows={[
        { k:'Name',         v: <span>{t?.icon} {form.equipment.name || '—'}</span> },
        { k:'Type',         v: t?.label },
        { k:'Number Plate', v: <span className="font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color: t?.color }}>{form.equipment.numberPlate || '—'}</span> },
        { k:'Duration',     v: `${fmtDate(form.equipment.startDate)} → ${fmtDate(form.equipment.endDate)}` },
      ]} />

      <ReviewBlock title="Worker" rows={[
        { k:'Name',     v: form.resource.name || '—' },
        { k:'Iqama',    v: <span className="font-mono">{form.resource.iqama || '—'}</span> },
        { k:'Contact',  v: `${form.resource.nationality} · ${form.resource.mobile || '—'}` },
        { k:'Manager',  v: `${form.resource.manager || '—'} · ${form.resource.managerPhone || '—'}` },
      ]} />

      <ReviewBlock title="Shift & Cost" rows={[
        { k:'Period',           v: `${fmtDate(form.shift.startDate)} → ${fmtDate(form.shift.endDate)} · ${totalDays} day${totalDays > 1 ? 's' : ''}` },
        { k:'Working Hours',    v: `${form.shift.startTime} → ${form.shift.endTime} · ${form.shift.breakHours}h break${form.shift.nightShift ? ' · Night shift' : ''}` },
        { k:'Friday Work',      v: form.shift.fridayWork ? `Yes${form.shift.fridayOvertime ? ' · Overtime rates' : ''}` : 'No' },
        { k:'Attendance',       v: form.shift.needAttendance ? `Required · ${ATTENDANCE_MANAGERS.find(m => m.id === form.shift.attendanceManagedBy)?.label}` : 'Not required' },
        { k:'Daily Rate',       v: `${form.cost.currency} ${fmtMoney(form.cost.dailyRate)} × ${totalDays} days` },
        { k:'Total Manpower',   v: <strong style={{ color:'#8B5CF6' }}>{form.cost.currency} {fmtMoney(totalAmount)}</strong> },
      ]} />

      <div className="rounded-lg p-2 flex items-start gap-2" style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.25)' }}>
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color:'#8B5CF6' }} />
        <p className="text-[12.5px]" style={{ color:'var(--text2)' }}>
          On confirmation: assignment created in <strong>Upcoming</strong> status, a <strong>manpower PO</strong> auto-generated in the Finance module with 100%-on-completion milestone, both linked. The PO closes when the assignment is marked complete.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════
function Section({ icon: Icon, title, right, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-1 mb-2" style={{ borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color:'#8B5CF6' }} />
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, tooltip, error, children, colSpan = 12 }) {
  return (
    <div className={`col-span-${colSpan}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: error ? 'var(--danger)' : 'var(--text3)' }}>
          {label} {required && <span style={{ color:'var(--danger)' }}>*</span>}
        </label>
        {tooltip && <span title={tooltip}><Info className="w-2.5 h-2.5 cursor-help" style={{ color:'var(--text3)' }} /></span>}
      </div>
      {children}
      {error && <p className="text-[10px] mt-0.5 font-bold" style={{ color:'var(--danger)' }}>{error}</p>}
    </div>
  )
}

function Input({ value, onChange, onBlur, type='text', placeholder, mono, disabled, maxLength, min, step }) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange?.(e.target.value)} onBlur={onBlur}
      placeholder={placeholder} disabled={disabled} maxLength={maxLength} min={min} step={step}
      className={`w-full rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none ${mono ? 'font-mono' : ''} ${disabled ? 'opacity-60' : ''}`}
      style={{ background: disabled ? 'var(--bg2)' : 'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
  )
}

function Toggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border" style={{ borderColor:'var(--border)' }}>
      {[{ id:true, label:'Yes' }, { id:false, label:'No' }].map(opt => (
        <button key={String(opt.id)} type="button" onClick={() => onChange(opt.id)}
          className="flex-1 px-2.5 py-1.5 text-[12.5px] font-bold"
          style={{ background: value === opt.id ? '#8B5CF6' : 'var(--card)', color: value === opt.id ? '#fff' : 'var(--text2)' }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ReviewBlock({ title, rows }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
      <div className="px-2.5 py-1" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{title}</h4>
      </div>
      <div className="p-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px]">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="font-bold flex-shrink-0 w-28" style={{ color:'var(--text3)' }}>{r.k}</div>
            <div style={{ color:'var(--text)' }}>{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
