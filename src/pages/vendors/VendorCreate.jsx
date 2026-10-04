import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2, ArrowLeft, ArrowRight, Check, AlertCircle, Globe, MapPin,
  User, Users, FileText, Save, X, ChevronRight, Plane, Flag, Eye,
} from 'lucide-react'
import useVendorV2Store from '../../store/vendorV2Store'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  SERVICE_CATEGORIES, VENDOR_TYPES, COUNTRIES, SA_REGIONS, VENDOR_STATUSES,
} from '../../api/mock/vendorV2Data'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }

// ─── Wizard steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'company',  num: 1, label: 'Company',  icon: Building2, sub: 'Classification & company info' },
  { id: 'services', num: 2, label: 'Services', icon: Globe,     sub: 'What this vendor provides'    },
  { id: 'coverage', num: 3, label: 'Coverage', icon: MapPin,    sub: 'Countries & regions served'   },
  { id: 'contacts', num: 4, label: 'Contacts', icon: Users,     sub: 'Primary & secondary contacts' },
  { id: 'review',   num: 5, label: 'Review',   icon: Eye,       sub: 'Notes & final review'         },
]

// ─── Validation ───────────────────────────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE    = /^https?:\/\/.+\..+/
const MOBILE_RE = /[\d\s+()-]{7,}/

function validateStep(step, form) {
  const e = {}
  if (step === 'company') {
    if (!form.name?.trim())        e.name      = 'Company name is required'
    if (!form.scope)                e.scope     = 'Select International or Local'
    if (!form.country)              e.country   = 'Country is required'
    if (form.website && !URL_RE.test(form.website)) e.website = 'Must start with http:// or https://'
  }
  if (step === 'services') {
    if (!form.services?.length)     e.services  = 'Select at least one service category'
  }
  if (step === 'coverage') {
    // Contract date sanity — only when scope === 'local' AND contracted provider
    if (form.scope === 'local' && form.contractType === 'contracted') {
      if (!form.contractStart) e.contractStart = 'Contract start date required'
      if (!form.contractEnd)   e.contractEnd   = 'Contract end date required'
      if (form.contractStart && form.contractEnd && new Date(form.contractEnd) <= new Date(form.contractStart)) {
        e.contractEnd = 'End date must be after start date'
      }
    }
  }
  if (step === 'contacts') {
    if (!form.primaryContact.name?.trim())       e.pcName   = 'Primary contact name is required'
    if (!form.primaryContact.email?.trim())      e.pcEmail  = 'Email is required'
    else if (!EMAIL_RE.test(form.primaryContact.email)) e.pcEmail = 'Invalid email format'
    if (!form.primaryContact.mobile?.trim())     e.pcMobile = 'Mobile is required'
    else if (!MOBILE_RE.test(form.primaryContact.mobile)) e.pcMobile = 'Invalid mobile number'
    if (form.secondaryContact?.email && !EMAIL_RE.test(form.secondaryContact.email)) e.scEmail = 'Invalid email format'
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

// ─── Multi-select chips (Select2 grid style) ──────────────────────────────────
function MultiSelectGrid({ options, selected, onToggle, getLabel, getKey, getIcon, columns = 3 }) {
  const [search, setSearch] = useState('')
  const filtered = options.filter(o => !search || getLabel(o).toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="rounded-xl border p-3" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search…"
        className="w-full rounded-lg px-3 py-1.5 text-xs border mb-2.5 focus:outline-none"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
      />
      <div className={`grid grid-cols-${columns} gap-1.5`}>
        {filtered.map(opt => {
          const key   = getKey(opt)
          const isSel = selected.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
              style={{
                background: isSel ? 'rgba(37,99,235,.08)' : 'var(--card)',
                border: `1px solid ${isSel ? 'rgba(37,99,235,.3)' : 'var(--border)'}`,
              }}
            >
              <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: isSel ? 'var(--primary)' : 'var(--border2)', background: isSel ? 'var(--primary)' : 'transparent' }}>
                {isSel && <Check className="w-3 h-3 text-white" />}
              </div>
              {getIcon && <span className="text-sm">{getIcon(opt)}</span>}
              <span className="text-xs font-medium truncate" style={{ color: isSel ? 'var(--text)' : 'var(--text2)' }}>
                {getLabel(opt)}
              </span>
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <div className="text-[12.5px] mt-2.5 font-medium" style={{ color: 'var(--primary)' }}>
          {selected.length} selected
        </div>
      )}
    </div>
  )
}

// ─── Scope picker (International / Local) ─────────────────────────────────────
function ScopePicker({ value, onChange, error }) {
  const opts = [
    { v: 'local',         label: 'Local',         desc: 'Operating inside Saudi Arabia',     icon: <Flag  className="w-5 h-5" />, badge: '🇸🇦' },
    { v: 'international', label: 'International', desc: 'Cross-border / multi-country',     icon: <Plane className="w-5 h-5" />, badge: '🌐' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {opts.map(o => {
        const isSel = value === o.v
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className="flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left"
            style={{
              background: isSel ? 'var(--primary-light)' : 'var(--card)',
              borderColor: isSel ? 'var(--primary)' : error ? 'var(--danger)' : 'var(--border)',
              boxShadow: isSel ? '0 4px 12px rgba(37,99,235,.15)' : 'var(--shadow)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: isSel ? 'rgba(37,99,235,.15)' : 'var(--bg2)', color: isSel ? 'var(--primary)' : 'var(--text2)' }}>
                {o.icon}
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: isSel ? 'var(--primary)' : 'var(--text)' }}>
                  {o.label}<span className="text-xl">{o.badge}</span>
                </div>
                <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{o.desc}</div>
              </div>
              {isSel && (
                <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, visited, onJump }) {
  return (
    <div className="rounded-xl border p-4" style={C}>
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon      = s.icon
          const isCurrent = current === s.id
          const isDone    = visited.has(s.id) && !isCurrent && STEPS.findIndex(x => x.id === current) > i
          const canJump   = visited.has(s.id)
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onJump(s.id)}
                className="flex items-center gap-2 flex-shrink-0 transition-all disabled:cursor-not-allowed"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg3)',
                      border: `2px solid ${isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)'}`,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,.15)' : 'none',
                    }}>
                    {isDone
                      ? <Check className="w-4 h-4 text-white" />
                      : <Icon className="w-4 h-4" style={{ color: isCurrent ? '#fff' : 'var(--text3)' }} />
                    }
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Step {s.num}</div>
                  <div className="text-xs font-bold leading-tight" style={{ color: isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text2)' }}>
                    {s.label}
                  </div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full"
                  style={{ background: isDone ? 'var(--success)' : 'var(--border)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Default form ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  scope: 'local',
  name: '', legalName: '', regNumber: '', vatNumber: '', website: '',
  country: 'SA', city: '', address: '', status: 'pending_approval',
  type: VENDOR_TYPES[0],
  services: [], countriesServed: [], regionsServed: [],
  primaryContact:   { name: '', title: '', dept: '', email: '', mobile: '', office: '' },
  secondaryContact: { name: '', title: '', dept: '', email: '', mobile: '', office: '' },
  notes: { internal: '', risk: '', performance: '', operational: '' },
  // Contract metadata — applies only to local KSA vendors (Module 2)
  contractType:   'spot',    // 'spot' = ad-hoc only · 'contracted' = active contract
  contractNumber: '',
  contractStart:  '',
  contractEnd:    '',
  contractNotes:  '',
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function VendorCreate() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const { createVendor, updateVendor, getVendor } = useVendorV2Store()
  const { toast } = useToast()

  const [form, setForm]         = useState(EMPTY_FORM)
  const [step, setStep]         = useState('company')
  const [visited, setVisited]   = useState(new Set(['company']))
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ─── Load for edit ────────────────────────────────────────────────────
  useEffect(() => {
    if (isEdit) {
      const v = getVendor(id)
      if (v) {
        setForm({
          ...EMPTY_FORM, ...v,
          scope: v.scope ?? (v.country === 'SA' ? 'local' : 'international'),
          secondaryContact: v.secondaryContact ?? EMPTY_FORM.secondaryContact,
          notes: v.notes ?? EMPTY_FORM.notes,
        })
        setVisited(new Set(STEPS.map(s => s.id)))
      }
    }
  }, [id, isEdit, getVendor])

  // ─── Setters ──────────────────────────────────────────────────────────
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setC = (group, k, v) => setForm(f => ({ ...f, [group]: { ...f[group], [k]: v } }))
  const toggleArr = (k, val) => setForm(f => ({
    ...f, [k]: f[k].includes(val) ? f[k].filter(x => x !== val) : [...f[k], val],
  }))

  // When scope changes, lock/unlock country
  const setScope = (newScope) => {
    setForm(f => ({
      ...f,
      scope: newScope,
      country: newScope === 'local' ? 'SA' : (f.country === 'SA' && newScope === 'international' ? '' : f.country),
    }))
  }

  // ─── Navigation ───────────────────────────────────────────────────────
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

  const goPrev = () => {
    if (!isFirst) setStep(STEPS[stepIdx - 1].id)
  }

  const jumpTo = (id) => {
    // Validate current step before jumping (silently — they can return)
    setStep(id)
  }

  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = () => {
    // Full validate
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
      const payload = {
        ...form,
        secondaryContact: form.secondaryContact.name?.trim() ? form.secondaryContact : null,
      }
      if (isEdit) {
        updateVendor(id, payload)
        toast.success('Vendor Updated', `${form.name} has been updated.`)
        navigate(`/vendors-v2/${id}`)
      } else {
        const newId = createVendor(payload)
        toast.success('Vendor Created', `${form.name} added as pending approval.`)
        navigate(`/vendors-v2/${newId}`)
      }
      setConfirmOpen(false)
      setSaving(false)
    }, 500)
  }

  const err = (k) => errors[k]

  // Build summary for review step / confirm modal
  const summary = useMemo(() => ({
    classification: form.scope === 'local' ? 'Local (Saudi Arabia)' : 'International',
    company:        form.name || '—',
    services:       form.services.length,
    countries:      form.countriesServed.length,
    regions:        form.regionsServed.length,
    contact:        form.primaryContact.name || '—',
    secondary:      form.secondaryContact.name?.trim() ? 'Yes' : 'No',
  }), [form])

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendors-v2')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,.2)' }}>
              <Building2 className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit Vendor' : 'Create Vendor'}</h2>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                {STEPS[stepIdx].sub} — Step {stepIdx + 1} of {STEPS.length}
              </p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/vendors-v2')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} visited={visited} onJump={jumpTo} />

      {/* ── STEP CONTENT ────────────────────────────────────────────────── */}
      <div className="rounded-xl border p-6 animate-fade-in" style={C}>
        {/* Step 1: Company */}
        {step === 'company' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Vendor Classification</h3>
              <p className="text-[11px] mb-3" style={{ color: 'var(--text3)' }}>Is this vendor based inside Saudi Arabia or operating internationally?</p>
              <ScopePicker value={form.scope} onChange={setScope} error={err('scope')} />
              {err('scope') && <div className="flex items-center gap-1 mt-2 text-[12.5px]" style={{ color: 'var(--danger)' }}>
                <AlertCircle className="w-3 h-3" /> {err('scope')}
              </div>}
            </div>

            <div className="border-t pt-5" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Vendor Code" hint="Auto-generated on save">
                  <Input value={isEdit ? form.code : 'Auto-generated'} disabled />
                </Field>
                <Field label="Company Name" required error={err('name')}>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} placeholder="FedEx Saudi Arabia" />
                </Field>
                <Field label="Legal Company Name">
                  <Input value={form.legalName} onChange={e => set('legalName', e.target.value)} placeholder="Federal Express Saudi LLC" />
                </Field>
                <Field label="Vendor Type">
                  <Select2
                    options={VENDOR_TYPES.map(t => ({ id: t, label: t }))}
                    value={form.type}
                    onChange={v => set('type', v)}
                    placeholder="Select vendor type…"
                  />
                </Field>
                <Field label="Registration Number">
                  <Input value={form.regNumber} onChange={e => set('regNumber', e.target.value)} placeholder="CR-1234567890" />
                </Field>
                <Field label="VAT Number">
                  <Input value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} placeholder="300000000000003" />
                </Field>
                <Field label="Website" error={err('website')}>
                  <Input value={form.website} onChange={e => set('website', e.target.value)} error={err('website')} placeholder="https://www.example.com" />
                </Field>
                <Field label="Status">
                  <Select2
                    options={Object.entries(VENDOR_STATUSES).map(([k, v]) => ({ id: k, label: v.label }))}
                    value={form.status}
                    onChange={v => set('status', v)}
                  />
                </Field>
                <Field label="Head Office Country" required error={err('country')}
                  hint={form.scope === 'local' ? 'Locked to Saudi Arabia for local vendors' : undefined}>
                  <Select2
                    options={COUNTRIES}
                    value={form.country}
                    onChange={v => set('country', v)}
                    getKey={c => c.code}
                    getLabel={c => c.name}
                    getIcon={c => c.flag}
                    placeholder="Select country…"
                    disabled={form.scope === 'local'}
                    error={!!err('country')}
                  />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Riyadh" />
                </Field>
                <div className="col-span-2">
                  <Field label="Address">
                    <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Logistics District, Riyadh" />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 'services' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Service Categories</h3>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Select all services this vendor provides. A vendor may offer multiple services.</p>
            </div>
            {err('services') && (
              <div className="flex items-center gap-1 text-[12.5px]" style={{ color: 'var(--danger)' }}>
                <AlertCircle className="w-3 h-3" /> {err('services')}
              </div>
            )}
            <MultiSelectGrid
              options={SERVICE_CATEGORIES}
              selected={form.services}
              onToggle={v => toggleArr('services', v)}
              getLabel={o => o.label}
              getKey={o => o.id}
              getIcon={o => o.icon}
              columns={3}
            />
          </div>
        )}

        {/* Step 3: Coverage */}
        {step === 'coverage' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Coverage Areas</h3>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Where does this vendor operate? Select countries and Saudi regions.</p>
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text3)' }}>Countries Served</label>
              <MultiSelectGrid
                options={COUNTRIES}
                selected={form.countriesServed}
                onToggle={v => toggleArr('countriesServed', v)}
                getLabel={o => o.name}
                getKey={o => o.code}
                getIcon={o => o.flag}
                columns={3}
              />
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text3)' }}>Regions Served (Saudi Arabia)</label>
              <MultiSelectGrid
                options={SA_REGIONS.map(r => ({ id: r, label: r }))}
                selected={form.regionsServed}
                onToggle={v => toggleArr('regionsServed', v)}
                getLabel={o => o.label}
                getKey={o => o.id}
                columns={4}
              />
            </div>

            {/* ─── Contract Configuration Card · Local KSA vendors only ─── */}
            {(() => {
              const isLocal = form.scope === 'local'
              const greyed = !isLocal
              return (
                <div className="rounded-xl border-2 p-4 space-y-3"
                  style={{
                    background: greyed ? 'var(--bg2)' : 'var(--card)',
                    borderColor: greyed ? 'var(--border)' : '#003399',
                    opacity: greyed ? 0.55 : 1,
                  }}>
                  <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-base">📜</span>
                    <h3 className="text-sm font-bold" style={{ color: greyed ? 'var(--text3)' : '#003399' }}>Contract Configuration</h3>
                    {greyed && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'var(--card)', color:'var(--text3)', border:'1px solid var(--border)' }}>
                        KSA-only · select "Local" scope to enable
                      </span>
                    )}
                  </div>
                  <p className="text-[11px]" style={{ color:'var(--text3)' }}>
                    Local vendors with an active corporate contract can be booked directly without going through the RFQ bidding flow. Set the contract type and validity window below.
                  </p>

                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Contract Type" required>
                      <Select2 size="sm" value={form.contractType} disabled={greyed}
                        onChange={v => set('contractType', v)}
                        options={[
                          { id: 'spot',       label: 'Spot / Ad-hoc Only' },
                          { id: 'contracted', label: 'Contracted Provider' },
                        ]} />
                    </Field>
                    <Field label="Contract Number" hint={form.contractType === 'contracted' ? 'Internal contract reference' : 'N/A for spot vendors'}>
                      <Input value={form.contractNumber}
                        disabled={greyed || form.contractType !== 'contracted'}
                        onChange={e => set('contractNumber', e.target.value)}
                        placeholder="CTR-2026-XXX" />
                    </Field>
                    <Field label="Contract Start Date" required={form.contractType === 'contracted'} error={err('contractStart')}>
                      <input type="date" disabled={greyed || form.contractType !== 'contracted'}
                        value={form.contractStart} onChange={e => set('contractStart', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                        style={{ background: greyed || form.contractType !== 'contracted' ? 'var(--bg2)' : 'var(--card)', borderColor: err('contractStart') ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
                    </Field>
                    <Field label="Contract End Date" required={form.contractType === 'contracted'} error={err('contractEnd')}>
                      <input type="date" disabled={greyed || form.contractType !== 'contracted'}
                        value={form.contractEnd} onChange={e => set('contractEnd', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                        style={{ background: greyed || form.contractType !== 'contracted' ? 'var(--bg2)' : 'var(--card)', borderColor: err('contractEnd') ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
                    </Field>
                  </div>

                  <Field label="Contract Notes (optional)">
                    <textarea disabled={greyed} value={form.contractNotes} onChange={e => set('contractNotes', e.target.value)} rows={2}
                      placeholder="Lane coverage, special terms, reference number…"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none"
                      style={{ background: greyed ? 'var(--bg2)' : 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                  </Field>

                  {/* Live validity preview */}
                  {!greyed && form.contractType === 'contracted' && form.contractStart && form.contractEnd && (() => {
                    const now = new Date()
                    const start = new Date(form.contractStart)
                    const end = new Date(form.contractEnd)
                    const active = now >= start && now <= end
                    const expired = now > end
                    return (
                      <div className="rounded-lg p-2.5 flex items-center gap-2 text-[12.5px]"
                        style={{
                          background: active ? 'rgba(5,150,105,.08)' : expired ? 'rgba(220,38,38,.08)' : 'rgba(217,119,6,.08)',
                          border: `1px solid ${active ? 'rgba(5,150,105,.4)' : expired ? 'rgba(220,38,38,.4)' : 'rgba(217,119,6,.4)'}`,
                        }}>
                        <span style={{ color: active ? '#059669' : expired ? '#DC2626' : '#D97706' }}>
                          {active ? '✓ ACTIVE' : expired ? '⚠ EXPIRED' : '⏳ NOT YET ACTIVE'}
                        </span>
                        <span style={{ color:'var(--text2)' }}>
                          · valid {start.toLocaleDateString('en-GB')} → {end.toLocaleDateString('en-GB')}
                          {expired && ` · expired ${Math.floor((now - end) / 86400000)}d ago`}
                          {!active && !expired && ` · activates in ${Math.ceil((start - now) / 86400000)}d`}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )
            })()}
          </div>
        )}

        {/* Step 4: Contacts */}
        {step === 'contacts' && (
          <div className="space-y-6">
            {/* Primary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Primary Contact</h3>
                <span className="text-[12.5px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>REQUIRED</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Contact Name" required error={err('pcName')}>
                  <Input value={form.primaryContact.name} onChange={e => setC('primaryContact', 'name', e.target.value)} error={err('pcName')} placeholder="Mohammed Al-Harbi" />
                </Field>
                <Field label="Job Title">
                  <Input value={form.primaryContact.title} onChange={e => setC('primaryContact', 'title', e.target.value)} placeholder="Operations Director" />
                </Field>
                <Field label="Department">
                  <Input value={form.primaryContact.dept} onChange={e => setC('primaryContact', 'dept', e.target.value)} placeholder="Operations" />
                </Field>
                <Field label="Email" required error={err('pcEmail')}>
                  <Input value={form.primaryContact.email} onChange={e => setC('primaryContact', 'email', e.target.value)} error={err('pcEmail')} placeholder="contact@vendor.com" />
                </Field>
                <Field label="Mobile" required error={err('pcMobile')}>
                  <Input value={form.primaryContact.mobile} onChange={e => setC('primaryContact', 'mobile', e.target.value)} error={err('pcMobile')} placeholder="+966 5X XXX XXXX" />
                </Field>
                <Field label="Office Number">
                  <Input value={form.primaryContact.office} onChange={e => setC('primaryContact', 'office', e.target.value)} placeholder="+966 11 XXX XXXX" />
                </Field>
              </div>
            </div>

            {/* Secondary */}
            <div className="border-t pt-5" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" style={{ color: 'var(--text3)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Secondary Contact</h3>
                <span className="text-[12.5px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>OPTIONAL</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Contact Name">
                  <Input value={form.secondaryContact.name} onChange={e => setC('secondaryContact', 'name', e.target.value)} placeholder="Fatima Al-Zahrani" />
                </Field>
                <Field label="Job Title">
                  <Input value={form.secondaryContact.title} onChange={e => setC('secondaryContact', 'title', e.target.value)} placeholder="Account Manager" />
                </Field>
                <Field label="Department">
                  <Input value={form.secondaryContact.dept} onChange={e => setC('secondaryContact', 'dept', e.target.value)} placeholder="Sales" />
                </Field>
                <Field label="Email" error={err('scEmail')}>
                  <Input value={form.secondaryContact.email} onChange={e => setC('secondaryContact', 'email', e.target.value)} error={err('scEmail')} placeholder="support@vendor.com" />
                </Field>
                <Field label="Mobile">
                  <Input value={form.secondaryContact.mobile} onChange={e => setC('secondaryContact', 'mobile', e.target.value)} placeholder="+966 5X XXX XXXX" />
                </Field>
                <Field label="Office Number">
                  <Input value={form.secondaryContact.office} onChange={e => setC('secondaryContact', 'office', e.target.value)} placeholder="+966 11 XXX XXXX" />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review + Notes */}
        {step === 'review' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Notes & Final Review</h3>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Add notes for internal use, then review the summary before confirming.</p>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: 'internal',    label: 'Internal Notes'    },
                { k: 'risk',        label: 'Risk Notes'        },
                { k: 'performance', label: 'Performance Notes' },
                { k: 'operational', label: 'Operational Notes' },
              ].map(({ k, label }) => (
                <Field key={k} label={label}>
                  <textarea
                    value={form.notes[k]}
                    onChange={e => setC('notes', k, e.target.value)}
                    rows={2}
                    placeholder={`Add ${label.toLowerCase()}…`}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </Field>
              ))}
            </div>

            {/* Summary card */}
            <div className="rounded-xl border p-4 mt-4" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)' }}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Eye className="w-3.5 h-3.5" /> Summary
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                {[
                  ['Classification', summary.classification],
                  ['Company Name',   summary.company       ],
                  ['Vendor Type',    form.type             ],
                  ['Status',         VENDOR_STATUSES[form.status]?.label ?? form.status],
                  ['Country',        COUNTRIES.find(c => c.code === form.country)?.name ?? '—'],
                  ['Services',       `${summary.services} selected`],
                  ['Countries Served', `${summary.countries} selected`],
                  ['Regions Served', `${summary.regions} selected`],
                  ['Primary Contact', summary.contact     ],
                  ['Secondary Contact', summary.secondary ],
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

      {/* ── Wizard navigation ──────────────────────────────────────────── */}
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
          {isLast ? <>{isEdit ? 'Save Changes' : 'Create Vendor'} <Check className="w-4 h-4" /></>
                  : <>Next <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>

      {/* ── Confirmation Modal ─────────────────────────────────────────── */}
      <EnterpriseModal
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title={isEdit ? 'Confirm Vendor Update' : 'Confirm Vendor Creation'}
        subtitle={isEdit ? `Save changes to ${form.name}?` : `Add ${form.name || 'new vendor'} to the system?`}
        icon={<Building2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Yes, Save Changes' : 'Yes, Create Vendor'}
          </ModalBtn>
        </>}
      >
        <div className="space-y-4">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              {isEdit
                ? <>Changes will be recorded in the vendor's audit history. The vendor's status, contacts and permissions remain unchanged unless modified above.</>
                : <>The vendor will be created with status <strong>Pending Approval</strong>. Documents and contracts can be added from the profile page after creation.</>
              }
            </p>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="px-4 py-2 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Summary</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {[
                ['Classification', summary.classification],
                ['Company Name',   summary.company        ],
                ['Vendor Type',    form.type              ],
                ['Country',        COUNTRIES.find(c => c.code === form.country)?.flag + ' ' + (COUNTRIES.find(c => c.code === form.country)?.name ?? '—')],
                ['Services',       `${summary.services} categories`],
                ['Primary Contact', `${summary.contact} · ${form.primaryContact.email}`],
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
