import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  UserCog, ArrowLeft, ArrowRight, Check, AlertCircle, X, Save,
  User, Shield, Key, Calendar, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react'
import useUserStore from '../../store/userStore'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  USER_TYPES, DEPARTMENTS, DESIGNATIONS, NATIONALITIES, ROLES_OPTIONS,
} from '../../api/mock/userData'
import { MENU_ITEMS, visibleMenusForRole } from '../../api/mock/menuMap'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

// ─── Wizard steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'info',     num: 1, label: 'User Info',       icon: User,     sub: 'Basic information & type'    },
  { id: 'security', num: 2, label: 'Security & Role', icon: Shield,   sub: 'Role, password & permissions' },
  { id: 'identity', num: 3, label: 'Identification',  icon: Key,      sub: 'National ID, passport, expiry' },
  { id: 'expiry',   num: 4, label: 'Account Expiry',  icon: Calendar, sub: 'Set account expiration policy' },
  { id: 'review',   num: 5, label: 'Review',          icon: Eye,      sub: 'Final review & confirmation'  },
]

// ─── Validation rules ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_RE = /[\d\s+()-]{7,}/

function validateStep(step, form, isEdit) {
  const e = {}
  if (step === 'info') {
    if (!form.name?.trim())  e.name  = 'Full name is required'
    if (!form.email?.trim()) e.email = 'Email is required'
    else if (!EMAIL_RE.test(form.email)) e.email = 'Invalid email format'
    if (!form.mobile?.trim()) e.mobile = 'Mobile is required'
    else if (!MOBILE_RE.test(form.mobile)) e.mobile = 'Invalid mobile format'
    if (!form.dept)         e.dept = 'Department is required'
    if (!form.type)         e.type = 'User type is required'
  }
  if (step === 'security') {
    if (!form.role) e.role = 'Role is required'
    if (!isEdit) {
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Must be at least 8 characters'
      else if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = 'Must include uppercase & number'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
  }
  if (step === 'identity') {
    if (!form.nationality) e.nationality = 'Nationality is required'
    if (!form.nationalId?.trim()) e.nationalId = 'National ID / Iqama is required'
    if (!form.nationalIdExpiry) e.nationalIdExpiry = 'National ID expiry is required'
  }
  if (step === 'expiry') {
    if (!form.neverExpires && !form.accountExpiry) e.accountExpiry = 'Specify expiry date or select Never Expires'
  }
  return e
}

// ─── Field atoms ──────────────────────────────────────────────────────────────
function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
      {error && <div className="flex items-center gap-1 mt-1 text-[12.5px]" style={{ color: 'var(--danger)' }}>
        <AlertCircle className="w-3 h-3" /> {error}
      </div>}
      {hint && !error && <div className="text-[12.5px] mt-1" style={{ color: 'var(--text3)' }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, error, type='text', ...props }) {
  return (
    <input value={value ?? ''} onChange={onChange} type={type}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none transition-all"
      style={{
        background: 'var(--bg2)',
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        color: 'var(--text)',
      }} {...props} />
  )
}

function Toggle({ value, onChange, label, hint }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex items-center gap-3 w-full">
      <div className="w-10 h-5 rounded-full transition-all flex items-center px-0.5"
        style={{ background: value ? 'var(--primary)' : 'var(--bg3)' }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
      </div>
      <div className="text-left flex-1">
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
        {hint && <div className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{hint}</div>}
      </div>
    </button>
  )
}

// ─── User-type picker ─────────────────────────────────────────────────────────
function TypePicker({ value, onChange, error }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.values(USER_TYPES).map(t => {
        const isSel = value === t.id
        return (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className="flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left"
            style={{
              background: isSel ? 'var(--primary-light)' : 'var(--card)',
              borderColor: isSel ? 'var(--primary)' : error ? 'var(--danger)' : 'var(--border)',
              boxShadow: isSel ? '0 4px 12px rgba(37,99,235,.15)' : 'var(--shadow)',
            }}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: t.color + '15' }}>
                {t.icon}
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: isSel ? 'var(--primary)' : 'var(--text)' }}>{t.label}</div>
                <div className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{t.prefix}-XXXXX</div>
              </div>
              {isSel && <Check className="w-4 h-4 ml-auto text-white rounded-full" style={{ background: 'var(--primary)', padding: 2 }} />}
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
                    boxShadow: isCurrent ? '0 0 0 3px rgba(37,99,235,.15)' : 'none',
                  }}>
                  {isDone ? <Check className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4" style={{ color: isCurrent ? '#fff' : 'var(--text3)' }} />}
                </div>
                <div className="hidden xl:block">
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Step {s.num}</div>
                  <div className="text-xs font-bold leading-tight" style={{ color: isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text2)' }}>{s.label}</div>
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

// ─── Live Menu Preview Panel (right column) ───────────────────────────────────
function LiveMenuPreview({ role }) {
  const visible = useMemo(() => visibleMenusForRole(role), [role])
  const hidden  = MENU_ITEMS.filter(m => !visible.find(v => v.id === m.id))
  const roleObj = ROLES_OPTIONS.find(r => r.id === role)

  return (
    <div className="sticky top-4 rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Live Menu Preview</h3>
        </div>
        <p className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Updates as role changes</p>
      </div>

      {/* Role banner */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: role ? 'var(--primary-light)' : 'var(--bg2)' }}>
        {role ? (
          <>
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--primary)' }}>Assigned Role</div>
            <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{roleObj?.label}</div>
            <div className="text-[12.5px] mt-0.5 leading-tight" style={{ color: 'var(--text3)' }}>{roleObj?.desc}</div>
          </>
        ) : (
          <div className="text-xs" style={{ color: 'var(--text3)' }}>No role selected yet</div>
        )}
      </div>

      {/* Visible count */}
      <div className="px-4 py-2 flex items-center justify-between text-[12.5px]" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text3)' }}>Menus visible to this user</span>
        <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{visible.length} / {MENU_ITEMS.length}</span>
      </div>

      {/* Menu list */}
      <div className="max-h-[480px] overflow-y-auto p-2">
        {visible.length > 0 && (
          <div className="mb-3">
            <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5" style={{ color: 'var(--success)' }}>✓ Visible</div>
            <div className="space-y-0.5">
              {visible.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs animate-fade-in"
                  style={{ background: 'rgba(5,150,105,.04)', color: 'var(--text)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-base">{m.icon}</span>
                  <span className="font-medium truncate">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hidden.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5" style={{ color: 'var(--text3)' }}>✗ Hidden</div>
            <div className="space-y-0.5">
              {hidden.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs opacity-50">
                  <XCircle className="w-3.5 h-3.5 text-red-300 flex-shrink-0" />
                  <span className="text-base">{m.icon}</span>
                  <span style={{ color: 'var(--text3)' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  type: 'employee',
  name: '', email: '', mobile: '', dept: '', designation: '',
  role: '', password: '', confirmPassword: '', mustChangePassword: true,
  nationality: 'Saudi', nationalId: '', nationalIdExpiry: '',
  passportNumber: '', passportExpiry: '',
  neverExpires: true, accountExpiry: '',
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function UserCreate() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const { createUser, updateUser, getUser } = useUserStore()
  const { toast } = useToast()

  const [form, setForm]         = useState(EMPTY_FORM)
  const [step, setStep]         = useState('info')
  const [visited, setVisited]   = useState(new Set(['info']))
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showPwd, setShowPwd]   = useState(false)

  useEffect(() => {
    if (isEdit) {
      const u = getUser(id)
      if (u) {
        setForm({
          ...EMPTY_FORM, ...u,
          password: '', confirmPassword: '',
          nationalIdExpiry: u.nationalIdExpiry?.split('T')[0] ?? '',
          passportExpiry:   u.passportExpiry?.split('T')[0]   ?? '',
          accountExpiry:    u.accountExpiry?.split('T')[0]    ?? '',
        })
        setVisited(new Set(STEPS.map(s => s.id)))
      }
    }
  }, [id, isEdit, getUser])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const isFirst = stepIdx === 0
  const isLast  = stepIdx === STEPS.length - 1

  const goNext = () => {
    const e = validateStep(step, form, isEdit)
    setErrors(e)
    if (Object.keys(e).length) { toast.warning('Validation', 'Fix highlighted fields.'); return }
    if (isLast) { setConfirmOpen(true); return }
    const next = STEPS[stepIdx + 1].id
    setVisited(s => new Set([...s, next]))
    setStep(next)
  }

  const goPrev = () => { if (!isFirst) setStep(STEPS[stepIdx - 1].id) }
  const jumpTo = (id) => setStep(id)

  const handleSubmit = () => {
    const all = {}
    STEPS.forEach(s => Object.assign(all, validateStep(s.id, form, isEdit)))
    setErrors(all)
    if (Object.keys(all).length) { toast.warning('Validation Failed', 'Some fields are still invalid.'); setConfirmOpen(false); return }
    setSaving(true)
    setTimeout(() => {
      const payload = {
        ...form,
        nationalIdExpiry: form.nationalIdExpiry ? new Date(form.nationalIdExpiry).toISOString() : null,
        passportExpiry:   form.passportExpiry   ? new Date(form.passportExpiry).toISOString()   : null,
        accountExpiry:    form.neverExpires ? null : (form.accountExpiry ? new Date(form.accountExpiry).toISOString() : null),
      }
      delete payload.confirmPassword
      if (isEdit) {
        updateUser(id, payload)
        toast.success('User Updated', `${form.name} has been updated.`)
        navigate('/users')
      } else {
        const newId = createUser(payload)
        toast.success('User Created', `${form.name} created with ID ${newId}.`)
        navigate('/users')
      }
      setSaving(false)
      setConfirmOpen(false)
    }, 500)
  }

  const err = (k) => errors[k]

  // Password strength
  const pwdStrength = useMemo(() => {
    if (!form.password) return { score: 0, label: '' }
    let score = 0
    if (form.password.length >= 8)        score++
    if (form.password.length >= 12)       score++
    if (/[A-Z]/.test(form.password))      score++
    if (/[0-9]/.test(form.password))      score++
    if (/[^A-Za-z0-9]/.test(form.password)) score++
    return { score, label: ['Very Weak','Weak','Fair','Strong','Very Strong'][Math.min(score-1, 4)] ?? 'Very Weak' }
  }, [form.password])

  const summary = useMemo(() => ({
    userIdPrefix: USER_TYPES[form.type]?.prefix ?? 'EMP',
    typeLabel:    USER_TYPES[form.type]?.label  ?? '—',
    roleLabel:    ROLES_OPTIONS.find(r => r.id === form.role)?.label ?? '—',
    expiry:       form.neverExpires ? 'Never expires' : form.accountExpiry ? new Date(form.accountExpiry).toLocaleDateString('en-SA') : '—',
  }), [form])

  return (
    <div className="space-y-4 pb-8">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/users')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <UserCog className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>{isEdit ? 'Edit User' : 'Create User'}</h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>{STEPS[stepIdx].sub} — Step {stepIdx + 1} of {STEPS.length}</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/users')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all" style={{ ...C, color:'var(--text2)' }}>
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>

      {/* Col-8 wizard / Col-4 menu preview */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Wizard (8/12) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <StepIndicator current={step} visited={visited} onJump={jumpTo} />

          <div className="rounded-xl border p-5 animate-fade-in" style={C}>
            {/* ─── STEP 1: User Info ─────────────────────────────── */}
            {step === 'info' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>User Type</h3>
                  <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>Select the user category — this determines the ID prefix.</p>
                  <TypePicker value={form.type} onChange={v => set('type', v)} error={err('type')} />
                </div>
                <div className="border-t pt-5" style={{ borderColor:'var(--border)' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color:'var(--text)' }}>Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="User ID" hint="Auto-generated on save">
                      <Input value={isEdit ? form.id : `${USER_TYPES[form.type].prefix}-Auto-generated`} disabled />
                    </Field>
                    <Field label="Full Name" required error={err('name')}>
                      <Input value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} placeholder="Abdullah Al-Rashid" />
                    </Field>
                    <Field label="Email" required error={err('email')}>
                      <Input value={form.email} onChange={e => set('email', e.target.value)} error={err('email')} placeholder="user@helms.sa" />
                    </Field>
                    <Field label="Mobile" required error={err('mobile')}>
                      <Input value={form.mobile} onChange={e => set('mobile', e.target.value)} error={err('mobile')} placeholder="+966 5X XXX XXXX" />
                    </Field>
                    <Field label="Department" required error={err('dept')}>
                      <Select2 options={DEPARTMENTS.map(d => ({ id: d, label: d }))} value={form.dept} onChange={v => set('dept', v)} placeholder="Select department…" error={!!err('dept')} />
                    </Field>
                    <Field label="Designation">
                      <Select2 options={DESIGNATIONS.map(d => ({ id: d, label: d }))} value={form.designation} onChange={v => set('designation', v)} placeholder="Select designation…" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Security & Role ───────────────────────── */}
            {step === 'security' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Role Assignment</h3>
                  <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>Selecting a role determines which menus and features this user can access. Watch the live preview on the right.</p>
                  <Field label="Assign Role" required error={err('role')}>
                    <Select2
                      options={ROLES_OPTIONS}
                      value={form.role}
                      onChange={v => set('role', v)}
                      getSubLabel={o => o.desc}
                      placeholder="Select role…"
                      error={!!err('role')}
                    />
                  </Field>
                </div>
                <div className="border-t pt-5" style={{ borderColor:'var(--border)' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color:'var(--text)' }}>Password</h3>
                  {isEdit ? (
                    <div className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                      <p className="text-xs" style={{ color:'var(--text2)' }}>Use the <strong>Reset Password</strong> action from the user list to force a password reset. The user will receive an email link.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Set Password" required error={err('password')}>
                        <div className="relative">
                          <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                            placeholder="Minimum 8 chars, uppercase & number"
                            className="w-full rounded-xl pl-3.5 pr-10 py-2.5 text-sm border focus:outline-none"
                            style={{ background:'var(--bg2)', borderColor: err('password') ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
                          <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text3)' }}>
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {form.password && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg3)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(pwdStrength.score / 5) * 100}%`,
                                  background: pwdStrength.score <= 2 ? 'var(--danger)' : pwdStrength.score <= 3 ? 'var(--warning)' : 'var(--success)'
                                }} />
                            </div>
                            <span className="text-[12.5px] font-bold" style={{
                              color: pwdStrength.score <= 2 ? 'var(--danger)' : pwdStrength.score <= 3 ? 'var(--warning)' : 'var(--success)'
                            }}>{pwdStrength.label}</span>
                          </div>
                        )}
                      </Field>
                      <Field label="Confirm Password" required error={err('confirmPassword')}>
                        <Input type={showPwd ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} error={err('confirmPassword')} placeholder="Re-enter password" />
                      </Field>
                    </div>
                  )}
                </div>
                <div className="border-t pt-5" style={{ borderColor:'var(--border)' }}>
                  <Toggle
                    value={form.mustChangePassword}
                    onChange={v => set('mustChangePassword', v)}
                    label="Must change password on first login"
                    hint="Strongly recommended. The user will be prompted to set their own password the first time they sign in."
                  />
                </div>
              </div>
            )}

            {/* ─── STEP 3: Identification ────────────────────────── */}
            {step === 'identity' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Identification</h3>
                  <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>National ID / Iqama details and passport (optional).</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nationality" required error={err('nationality')}>
                    <Select2 options={NATIONALITIES.map(n => ({ id: n, label: n }))} value={form.nationality} onChange={v => set('nationality', v)} error={!!err('nationality')} />
                  </Field>
                  <Field label="National ID / Iqama Number" required error={err('nationalId')}>
                    <Input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} error={err('nationalId')} placeholder="1010234567" />
                  </Field>
                  <Field label="National ID Expiry Date" required error={err('nationalIdExpiry')}>
                    <Input type="date" value={form.nationalIdExpiry} onChange={e => set('nationalIdExpiry', e.target.value)} error={err('nationalIdExpiry')} />
                  </Field>
                  <div />
                </div>
                <div className="border-t pt-5" style={{ borderColor:'var(--border)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text3)' }}>Passport (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Passport Number">
                      <Input value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)} placeholder="A12345678" />
                    </Field>
                    <Field label="Passport Expiry Date">
                      <Input type="date" value={form.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4: Account Expiry ────────────────────────── */}
            {step === 'expiry' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Account Expiry Policy</h3>
                  <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>If set, the account will auto-lock on expiry. Only an administrator can unlock it.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { set('neverExpires', true); set('accountExpiry', '') }}
                    className="flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      background: form.neverExpires ? 'rgba(5,150,105,.05)' : 'var(--card)',
                      borderColor: form.neverExpires ? 'var(--success)' : 'var(--border)',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: form.neverExpires ? 'rgba(5,150,105,.15)' : 'var(--bg2)', color: form.neverExpires ? 'var(--success)' : 'var(--text2)' }}>
                      ∞
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: form.neverExpires ? 'var(--success)' : 'var(--text)' }}>Never Expires</div>
                      <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Permanent account, no auto-lock</div>
                    </div>
                    {form.neverExpires && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>

                  <button type="button" onClick={() => set('neverExpires', false)}
                    className="flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      background: !form.neverExpires ? 'var(--warning-light)' : 'var(--card)',
                      borderColor: !form.neverExpires ? 'var(--warning)' : 'var(--border)',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: !form.neverExpires ? 'rgba(217,119,6,.15)' : 'var(--bg2)', color: !form.neverExpires ? 'var(--warning)' : 'var(--text2)' }}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: !form.neverExpires ? 'var(--warning)' : 'var(--text)' }}>Specific Expiry Date</div>
                      <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Auto-lock at this date</div>
                    </div>
                    {!form.neverExpires && <Check className="w-5 h-5 text-amber-500" />}
                  </button>
                </div>

                {!form.neverExpires && (
                  <div className="rounded-xl border p-4 animate-fade-in" style={{ background:'var(--warning-light)', borderColor:'rgba(217,119,6,.3)' }}>
                    <Field label="Account Expiry Date" required error={err('accountExpiry')}>
                      <Input type="date" value={form.accountExpiry} onChange={e => set('accountExpiry', e.target.value)} error={err('accountExpiry')} />
                    </Field>
                    <div className="mt-3 text-xs" style={{ color:'var(--text2)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--warning)' }}>Reminder Notifications</div>
                      <div className="space-y-1">
                        {['14 days before expiry','7 days before expiry','3 days before expiry','1 day before expiry'].map(r => (
                          <div key={r} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" style={{ color:'var(--warning)' }} /> {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 5: Review ────────────────────────────────── */}
            {step === 'review' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Final Review</h3>
                  <p className="text-[11px]" style={{ color:'var(--text3)' }}>Verify everything is correct, then confirm.</p>
                </div>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
                  <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                    {[
                      ['User ID',       isEdit ? form.id : `${summary.userIdPrefix}-Auto-generated`],
                      ['Type',          summary.typeLabel],
                      ['Full Name',     form.name],
                      ['Email',         form.email],
                      ['Mobile',        form.mobile],
                      ['Department',    form.dept],
                      ['Designation',   form.designation || '—'],
                      ['Role',          summary.roleLabel],
                      ['Nationality',   form.nationality],
                      ['National ID',   form.nationalId],
                      ['Account Expiry',summary.expiry],
                      ['Must change password', form.mustChangePassword ? 'Yes' : 'No'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex items-center px-4 py-2.5" style={{ background: 'var(--card)' }}>
                        <span className="text-[12.5px] font-bold uppercase tracking-wider w-44 flex-shrink-0" style={{ color:'var(--text3)' }}>{l}</span>
                        <span className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div className="rounded-xl border p-3 flex items-center justify-between" style={C}>
            <button onClick={goPrev} disabled={isFirst}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <div className="text-[11px]" style={{ color:'var(--text3)' }}>
              Step <strong style={{ color:'var(--text)' }}>{stepIdx + 1}</strong> of {STEPS.length}
            </div>
            <button onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all"
              style={{ background:'var(--primary)' }}>
              {isLast ? <>{isEdit ? 'Save Changes' : 'Create User'} <Check className="w-4 h-4" /></>
                      : <>Next <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>

        {/* Right: Live Menu Preview (4/12) */}
        <div className="col-span-12 lg:col-span-4">
          <LiveMenuPreview role={form.role} />
        </div>
      </div>

      {/* Confirmation modal */}
      <EnterpriseModal
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title={isEdit ? 'Confirm User Update' : 'Confirm User Creation'}
        subtitle={isEdit ? `Save changes to ${form.name}?` : `Add ${form.name || 'new user'} to the system?`}
        icon={<UserCog className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Yes, Save Changes' : 'Yes, Create User'}
          </ModalBtn>
        </>}>
        <div className="space-y-4">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {isEdit
                ? <>Changes will be recorded in audit history. The user's role-based menu visibility will update on their next sign-in.</>
                : <>The user will be created with an auto-generated ID (<strong>{summary.userIdPrefix}-XXXXX</strong>) and will receive a welcome email. They will be required to change their password on first login.</>
              }
            </p>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
            <div className="px-4 py-2 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Summary</span>
            </div>
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {[
                ['Type / ID prefix', `${summary.typeLabel} → ${summary.userIdPrefix}-XXXXX`],
                ['Full Name',        form.name],
                ['Email',            form.email],
                ['Role',             summary.roleLabel],
                ['Department',       form.dept],
                ['Account Expiry',   summary.expiry],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center px-4 py-2.5">
                  <span className="text-[12.5px] font-bold uppercase tracking-wider w-44 flex-shrink-0" style={{ color:'var(--text3)' }}>{l}</span>
                  <span className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
