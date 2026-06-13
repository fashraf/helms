import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Truck, ArrowLeft, ArrowRight, Check, AlertCircle, X, Save, Send,
  MapPin, Calendar, Box, FileText, Upload, Eye, Plus, Plane,
  Power, Edit3, ChevronRight, Building2, Briefcase, Briefcase as BriefcaseIcon,
  GitBranch, Clock, AlertTriangle, Hash, Boxes, Package, Trash2,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store from '../../store/vendorV2Store'
import useProjectStore from '../../store/projectStore'
import useUserStore from '../../store/userStore'
import useFinanceStore from '../../store/financeStore'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  TRANSPORTER_ASSIGN, REQUESTED_EQUIPMENT, CARGO_TYPES, SHIPMENT_TYPES_LOCAL,
  SHIPMENT_STATUSES_LOCAL, LOCATION_MASTER, nextShipmentId, newStop, newOrigin,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const STEPS = [
  { id: 'basic',     num: 1, label: 'Basic Info',  icon: Truck,     sub: 'Project, type & transporter'      },
  { id: 'route',     num: 2, label: 'Route',       icon: GitBranch, sub: 'Origin + multiple destinations'   },
  { id: 'schedule',  num: 3, label: 'Schedule',    icon: Calendar,  sub: 'Dates & delivery note'            },
  { id: 'items',     num: 4, label: 'Items',       icon: Box,       sub: 'Pick items from inventory'        },
  { id: 'cargo',     num: 5, label: 'Cargo',       icon: Package,   sub: 'Pack items into cargo units'      },
  { id: 'documents', num: 6, label: 'Documents',   icon: FileText,  sub: 'Delivery notes & permits'         },
  { id: 'review',    num: 7, label: 'Review',      icon: Eye,       sub: 'Final review & submit'            },
]

const STOP_TYPES = [
  { id: 'qa',       label: 'QA Inspection',    icon: '🔍', color: 'var(--cyan)'    },
  { id: 'transit',  label: 'Transit Stop',     icon: '📍', color: 'var(--primary)' },
  { id: 'storage',  label: 'Temporary Storage',icon: '🏪', color: 'var(--purple)'  },
  { id: 'final',    label: 'Final Delivery',   icon: '🏁', color: 'var(--success)' },
]

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(step, form) {
  const e = {}
  if (step === 'basic') {
    if (!form.operatedBy)          e.operatedBy = 'Operator is required'
    if (!form.project)             e.project = 'Project is required'
    if (!form.shipmentType)        e.shipmentType = 'Shipment type is required'
  }
  if (step === 'route') {
    if (!form.route?.origins?.length) e.origins = 'Add at least one origin'
    // Unique locations across origins
    const originLocs = (form.route?.origins ?? []).map(o => o.locationId).filter(Boolean)
    const dupOriginLocs = new Set(originLocs.filter((l, i) => originLocs.indexOf(l) !== i))
    form.route?.origins?.forEach((o, i) => {
      if (!o.locationId)       e[`origin_${i}_loc`]     = 'Origin location is required'
      else if (dupOriginLocs.has(o.locationId)) e[`origin_${i}_loc`] = 'Duplicate origin · each pickup must be unique'
      if (!o.mapLink?.trim())  e[`origin_${i}_mapLink`] = 'Google Map location is required'
    })
    if (!form.route?.stops?.length)      e.stops          = 'Add at least one destination'
    // Unique locations across destinations
    const stopLocs = (form.route?.stops ?? []).map(s => s.locationId).filter(Boolean)
    const dupStopLocs = new Set(stopLocs.filter((l, i) => stopLocs.indexOf(l) !== i))
    // Also a destination cannot be the same as any origin
    const originSet = new Set(originLocs)
    form.route?.stops?.forEach((s, i) => {
      if (!s.locationId)         e[`stop_${i}_loc`]     = `Stop ${i + 1}: location required`
      else if (dupStopLocs.has(s.locationId)) e[`stop_${i}_loc`] = `Stop ${i + 1}: duplicate destination · each must be unique`
      else if (originSet.has(s.locationId))   e[`stop_${i}_loc`] = `Stop ${i + 1}: same as an origin · pick a different location`
      if (!s.mapLink?.trim())    e[`stop_${i}_mapLink`] = `Stop ${i + 1}: Google Map location required`
      if (!s.contact?.trim())    e[`stop_${i}_contact`] = `Stop ${i + 1}: contact person required`
      if (!s.mobile?.trim())     e[`stop_${i}_mobile`]  = `Stop ${i + 1}: mobile required`
    })
  }
  if (step === 'schedule') {
    if (!form.shipmentDate) e.shipmentDate = 'Shipment date is required'
  }
  if (step === 'cargo') {
    // All cargo dimensions mandatory
    if (Array.isArray(form.cargo)) {
      form.cargo.forEach((c, i) => {
        if (!c.length)   e[`cargo_${i}_length`]   = `Cargo ${i + 1}: length required`
        if (!c.width)    e[`cargo_${i}_width`]    = `Cargo ${i + 1}: width required`
        if (!c.height)   e[`cargo_${i}_height`]   = `Cargo ${i + 1}: height required`
        if (!c.weight)   e[`cargo_${i}_weight`]   = `Cargo ${i + 1}: weight required`
        if (!c.quantity) e[`cargo_${i}_quantity`] = `Cargo ${i + 1}: quantity required`
      })
    }
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
      {error && <div className="flex items-center gap-1 mt-1 text-[12.5px]" style={{ color: 'var(--danger)' }}><AlertCircle className="w-3 h-3" /> {error}</div>}
      {hint && !error && <div className="text-[12.5px] mt-1" style={{ color: 'var(--text3)' }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, error, type='text', ...props }) {
  return (
    <input value={value ?? ''} onChange={onChange} type={type}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none transition-all"
      style={{ background:'var(--bg2)', borderColor: error ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} {...props} />
  )
}

function Textarea({ value, onChange, rows=3, ...props }) {
  return (
    <textarea value={value ?? ''} onChange={onChange} rows={rows}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
      style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} {...props} />
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
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Step {s.num}</div>
                  <div className="text-xs font-bold leading-tight" style={{ color: isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text2)' }}>{s.label}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 rounded-full" style={{ background: isDone ? 'var(--success)' : 'var(--border)' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── PO Chips multi-entry ─────────────────────────────────────────────────────
function POChips({ value = [], onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setInput('')
  }
  return (
    <div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="PO-001 then press Enter or click Add"
          className="flex-1 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
          style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        <button type="button" onClick={add}
          className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {value.map((po, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-semibold"
              style={{ background:'var(--primary-light)', color:'var(--primary)', border:'1px solid rgba(37,99,235,.2)' }}>
              {po}
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-[12.5px] opacity-70 hover:opacity-100"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  operatedBy: '',
  project: '',
  shipmentType: 'New Material',
  transporterMode: 'contracted',
  vendor: '',
  shipmentReference: '',
  poNumbers: [],
  route: { origins: [newOrigin()], stops: [] },
  shipmentDate: '',
  eta: '',
  actualDeliveryDate: '',
  deliveryNoteNumber: '',
  status: 'draft',
  requestedEquipment: [],
  cargoType: 'General',
  cargoDescription: '',
  cargo: [],          // per-unit cargo (crates, pallets)
  items: [],          // items from inventory: { inventoryId, sapId, name, quantity, unit }
  specialHandling: '',
  insuranceRequired: false, insuranceValue: '',
  waitingRequired: false,   waitingAmount: '',
  documents: [],
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function LocalShipmentCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { createLocalShipment, updateLocalShipment, getShipment, saveDraft, submitShipment } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const { projects } = useProjectStore()
  const { users }    = useUserStore()
  const { inventory } = useFinanceStore()
  const { toast } = useToast()

  const [form, setForm]         = useState(EMPTY_FORM)
  const [step, setStep]         = useState('basic')
  const [visited, setVisited]   = useState(new Set(['basic']))
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState('submit') // 'submit' | 'draft' | 'approval'
  const [shipmentId, setShipmentId]   = useState(id ?? null)

  // Load for edit
  useEffect(() => {
    if (isEdit) {
      const s = getShipment(id)
      if (s) {
        // Migrate legacy single-origin to origins[] for editing
        const origins = s.route?.origins?.length
          ? s.route.origins
          : (s.route?.origin ? [{
              id: `ORG-${s.id}-1`,
              locationId: s.route.origin.locationId,
              contact:    typeof s.route.origin.contact === 'string' ? s.route.origin.contact : (s.route.origin.contact?.name ?? ''),
              mobile:     s.route.origin.mobile  ?? s.route.origin.contact?.mobile ?? '',
              email:      s.route.origin.email   ?? s.route.origin.contact?.email  ?? '',
              address:    s.route.origin.address  ?? '',
              landmark:   s.route.origin.landmark ?? '',
              mapLink:    s.route.origin.mapLink  ?? '',
              readyDate:  '',
              notes:      s.route.origin.notes    ?? '',
            }] : [newOrigin()])
        setForm({
          ...EMPTY_FORM, ...s,
          route: { origins, stops: s.route?.stops ?? [] },
          shipmentDate:       s.shipmentDate?.split('T')[0] ?? '',
          eta:                s.eta?.split('T')[0] ?? '',
          actualDeliveryDate: s.actualDeliveryDate?.split('T')[0] ?? '',
        })
        setVisited(new Set(STEPS.map(x => x.id)))
        setShipmentId(s.id)
      }
    }
  }, [id, isEdit, getShipment])

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Fill an origin/stop's city/address/landmark/mapLink/description automatically
  // from the LOCATION_MASTER entry when a location is picked from the dropdown.
  const fillFromLocation = (locationId, existing = {}) => {
    const m = LOCATION_MASTER.find(l => l.id === locationId)
    if (!m) return { ...existing, locationId }
    return {
      ...existing,
      locationId,
      // only auto-fill when the field is empty so user-edited values aren't clobbered
      address:  existing.address?.trim()  ? existing.address  : (m.address  ?? `${m.name}, ${m.city}`),
      landmark: existing.landmark?.trim() ? existing.landmark : (m.landmark ?? ''),
      mapLink:  existing.mapLink?.trim()  ? existing.mapLink  : (m.mapLink  ?? ''),
    }
  }

  const updateOrigin = (idx, patch) =>
    setForm(f => ({ ...f, route: { ...f.route, origins: f.route.origins.map((o, i) => {
      if (i !== idx) return o
      if ('locationId' in patch) return fillFromLocation(patch.locationId, { ...o, ...patch })
      return { ...o, ...patch }
    }) } }))
  const addOrigin = () =>
    setForm(f => ({ ...f, route: { ...f.route, origins: [...f.route.origins, newOrigin()] } }))
  const removeOrigin = (idx) =>
    setForm(f => ({ ...f, route: { ...f.route, origins: f.route.origins.filter((_, i) => i !== idx) } }))

  const updateStop = (idx, patch) =>
    setForm(f => ({ ...f, route: { ...f.route, stops: f.route.stops.map((s, i) => {
      if (i !== idx) return s
      if ('locationId' in patch) return fillFromLocation(patch.locationId, { ...s, ...patch })
      return { ...s, ...patch }
    }) } }))
  const addStop = () =>
    setForm(f => ({ ...f, route: { ...f.route, stops: [...f.route.stops, newStop()] } }))
  const removeStop = (idx) =>
    setForm(f => ({ ...f, route: { ...f.route, stops: f.route.stops.filter((_, i) => i !== idx) } }))

  // Nav
  const stepIdx = STEPS.findIndex(s => s.id === step)
  const isFirst = stepIdx === 0
  const isLast  = stepIdx === STEPS.length - 1

  const goNext = () => {
    const e = validateStep(step, form)
    setErrors(e)
    if (Object.keys(e).length) { toast.warning('Validation', 'Fix highlighted fields.'); return }
    if (isLast) { setConfirmMode('submit'); setConfirmOpen(true); return }
    const next = STEPS[stepIdx + 1].id
    setVisited(s => new Set([...s, next]))
    setStep(next)
  }

  const goPrev = () => { if (!isFirst) setStep(STEPS[stepIdx - 1].id) }
  const jumpTo = (sid) => setStep(sid)

  const handleSaveDraft = () => {
    setSaving(true)
    setTimeout(() => {
      const payload = {
        ...form,
        shipmentDate:       form.shipmentDate       ? new Date(form.shipmentDate).toISOString() : null,
        eta:                form.eta                ? new Date(form.eta).toISOString() : null,
        actualDeliveryDate: form.actualDeliveryDate ? new Date(form.actualDeliveryDate).toISOString() : null,
      }
      const newId = saveDraft('local', shipmentId, payload)
      if (!shipmentId && newId) setShipmentId(newId)
      toast.success('Draft Saved', `Shipment draft saved. You can return anytime.`)
      setSaving(false)
    }, 400)
  }

  const handleSubmit = (mode) => {
    const all = {}
    STEPS.forEach(s => Object.assign(all, validateStep(s.id, form)))
    setErrors(all)
    if (Object.keys(all).length) {
      toast.warning('Validation Failed', 'Some fields are invalid.')
      setConfirmOpen(false); return
    }
    setSaving(true)
    setTimeout(() => {
      const payload = {
        ...form,
        shipmentDate:       form.shipmentDate       ? new Date(form.shipmentDate).toISOString() : null,
        eta:                form.eta                ? new Date(form.eta).toISOString() : null,
        actualDeliveryDate: form.actualDeliveryDate ? new Date(form.actualDeliveryDate).toISOString() : null,
        status: mode === 'draft' ? 'draft' : (mode === 'approval' ? 'pending_approval' : 'assigned'),
      }
      let finalId = shipmentId
      if (shipmentId) updateLocalShipment(shipmentId, payload)
      else            finalId = createLocalShipment(payload)
      toast.success(
        mode === 'draft' ? 'Draft Saved' : mode === 'approval' ? 'Sent for Approval' : 'Shipment Submitted',
        `${finalId} created.`
      )
      setSaving(false); setConfirmOpen(false)
      // Redirect to success page when actually submitting (not when saving a draft)
      if (mode === 'draft') navigate(`/shipments/local/${finalId}`)
      else                  navigate(`/shipments/local/${finalId}/success`)
    }, 500)
  }

  const err = (k) => errors[k]

  // Helper option arrays
  const projectOpts = projects.filter(p => p.status !== 'inactive').map(p => ({ id: p.id, label: p.name, sublabel: `${p.country} · ${p.city}` }))
  const userOpts    = users.filter(u => u.status === 'active').map(u => ({ id: u.id, label: u.name, sublabel: `${u.dept} · ${u.designation}` }))
  const vendorOpts  = vendors
    .filter(v => v.status === 'active' && (v.scope === 'local' || v.country === 'SA'))
    .map(v => ({ id: v.id, label: v.name, sublabel: `${v.code} · ${v.type}` }))
  const locOpts     = LOCATION_MASTER.map(l => ({ id: l.id, label: l.name, sublabel: `${l.city}, ${l.country}` }))
  const summaryProject = projects.find(p => p.id === form.project)?.name ?? '—'
  const summaryVendor  = vendors.find(v => v.id === form.vendor)?.name ?? (form.transporterMode === 'rfq' ? 'Via RFQ Process' : '—')

  return (
    <div className="space-y-4 pb-8 max-w-6xl mx-auto">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/shipments/local')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <Truck className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
                {isEdit ? 'Edit Local Shipment' : 'Create Local Shipment'}
                {shipmentId && <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{shipmentId}</span>}
              </h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>{STEPS[stepIdx].sub} — Step {stepIdx + 1} of {STEPS.length}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all"
            style={{ ...C, color:'var(--text2)' }}>
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button onClick={() => navigate('/shipments/local')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>

      <StepIndicator current={step} visited={visited} onJump={jumpTo} />

      <div className="rounded-xl border p-5 animate-fade-in" style={C}>
        {/* ─── STEP 1: Basic ──────────────────────────────────────── */}
        {step === 'basic' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Basic Information</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Identify the project, type, and how the transporter will be assigned.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Shipment Number" hint="Auto-generated on save">
                <Input value={shipmentId || 'LTS-26-06-Auto'} disabled />
              </Field>
              <Field label="Operated By" required error={err('operatedBy')}>
                <Select2 options={userOpts} value={form.operatedBy} onChange={v => set('operatedBy', v)} getSubLabel={o => o.sublabel} placeholder="Search internal user…" error={!!err('operatedBy')} />
              </Field>
              <Field label="Project" required error={err('project')}>
                <Select2 options={projectOpts} value={form.project} onChange={v => set('project', v)} getSubLabel={o => o.sublabel} placeholder="Search project…" error={!!err('project')} />
              </Field>
              <Field label="Shipment Type" required error={err('shipmentType')}>
                <Select2 options={SHIPMENT_TYPES_LOCAL.map(t => ({ id: t, label: t }))} value={form.shipmentType} onChange={v => set('shipmentType', v)} error={!!err('shipmentType')} />
              </Field>
              <div className="col-span-2 rounded-xl border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
                <div className="flex-1">
                  <div className="text-xs font-bold mb-0.5" style={{ color:'var(--primary)' }}>Vendor will be allocated through Quotes</div>
                  <div className="text-[11px]" style={{ color:'var(--text2)' }}>
                    Skip vendor selection here. After saving, the shipment will appear in the Quotes tab where you can collect bids and approve one. The vendor is auto-populated into this shipment once a quote is approved.
                  </div>
                </div>
              </div>
              <Field label="Shipment Reference" hint="Optional internal reference (e.g. legacy ID)">
                <Input value={form.shipmentReference} onChange={e => set('shipmentReference', e.target.value)} placeholder="OLD-2024-001" />
              </Field>
              <div className="col-span-2">
                <Field label="PO Numbers" hint="Add multiple PO numbers — these will be linked to this shipment">
                  <POChips value={form.poNumbers} onChange={v => set('poNumbers', v)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Route ──────────────────────────────────────── */}
        {step === 'route' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Route Information</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Define the origin and one or more destinations. Multi-stop routes are supported for future route optimization.</p>
            </div>

            {/* Origins (multi) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
                  Origins · Pickup Points
                  <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>
                    {form.route.origins?.length ?? 0}
                  </span>
                  <span className="text-[11px] font-normal" style={{ color:'var(--text3)' }}>(at least 1 required)</span>
                </h4>
                <button type="button" onClick={addOrigin} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Origin
                </button>
              </div>
              {err('origins') && <div className="flex items-center gap-1 mb-2 text-[12.5px]" style={{ color:'var(--danger)' }}><AlertCircle className="w-3 h-3" /> {err('origins')}</div>}

              <div className="space-y-3">
                {form.route.origins?.map((origin, i) => {
                  const locErr = err(`origin_${i}_loc`)
                  const mapErr = err(`origin_${i}_mapLink`)
                  const m = LOCATION_MASTER.find(l => l.id === origin.locationId)
                  return (
                    <div key={origin.id} className="rounded-xl border overflow-hidden" style={C}>
                      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--primary)' }}>{i + 1}</div>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--primary)' }}>
                            Origin {i + 1}{form.route.origins.length > 1 ? ` / ${form.route.origins.length}` : ''}
                          </span>
                          {m && <span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text3)' }}>{m.country} · {m.city}</span>}
                        </div>
                        {form.route.origins.length > 1 && (
                          <button type="button" onClick={() => removeOrigin(i)} className="flex items-center gap-1 px-2 py-1 text-[12.5px] font-semibold rounded-md" style={{ color:'var(--danger)' }}>
                            <X className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="p-3 grid grid-cols-3 gap-3">
                        <div className="col-span-3 md:col-span-1">
                          <Field label="Origin Location" required error={locErr} hint="Pick from Location Master · fills the rest">
                            <Select2 options={locOpts} value={origin.locationId} onChange={v => updateOrigin(i, { locationId: v })} getSubLabel={o => o.sublabel} placeholder="Search location…" error={!!locErr} />
                          </Field>
                        </div>
                        <div className="col-span-3 md:col-span-1">
                          <Field label="Ready Date">
                            <Input type="datetime-local" value={origin.readyDate} onChange={e => updateOrigin(i, { readyDate: e.target.value })} />
                          </Field>
                        </div>
                        <div className="col-span-3 md:col-span-1">
                          <Field label="Contact Name" required error={err(`origin_${i}_contact`)}>
                            <Input value={origin.contact} onChange={e => updateOrigin(i, { contact: e.target.value })} placeholder="Pickup contact name" />
                          </Field>
                        </div>

                        {/* Col-4 / Col-4 / Col-4 POC layout */}
                        <div className="col-span-3 grid grid-cols-12 gap-3 pt-1 border-t" style={{ borderColor:'var(--border)' }}>
                          <div className="col-span-4">
                            <Field label="Mobile">
                              <Input value={origin.mobile} onChange={e => updateOrigin(i, { mobile: e.target.value })} placeholder="+966 5X XXX XXXX" />
                            </Field>
                          </div>
                          <div className="col-span-4">
                            <Field label="Email">
                              <Input type="email" value={origin.email} onChange={e => updateOrigin(i, { email: e.target.value })} placeholder="pickup@example.com" />
                            </Field>
                          </div>
                          <div className="col-span-4">
                            <Field label="Nearby Landmark">
                              <Input value={origin.landmark} onChange={e => updateOrigin(i, { landmark: e.target.value })} placeholder="e.g. Gate 4" />
                            </Field>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <Field label="Address">
                            <Input value={origin.address} onChange={e => updateOrigin(i, { address: e.target.value })} placeholder="Full pickup address (auto-filled from master)" />
                          </Field>
                        </div>
                        <div className="col-span-3">
                          <Field label="Google Map Location" required error={mapErr} hint="Auto-filled from Location Master · editable">
                            <Input value={origin.mapLink} onChange={e => updateOrigin(i, { mapLink: e.target.value })} placeholder="https://maps.google.com/?q=…" error={mapErr} />
                          </Field>
                        </div>
                        <div className="col-span-3">
                          <Field label="Notes">
                            <textarea value={origin.notes} onChange={e => updateOrigin(i, { notes: e.target.value })} rows={2}
                              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }}
                              placeholder="Special pickup instructions for this origin…" />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stops */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold" style={{ color:'var(--text)' }}>Destinations <span className="text-[11px] font-normal" style={{ color:'var(--text3)' }}>(at least 1 required)</span></h4>
                <button type="button" onClick={addStop} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Destination
                </button>
              </div>
              {err('stops') && <div className="flex items-center gap-1 mb-2 text-[12.5px]" style={{ color:'var(--danger)' }}><AlertCircle className="w-3 h-3" /> {err('stops')}</div>}

              <div className="space-y-3">
                {form.route.stops.map((stop, i) => {
                  const stopErr = err(`stop_${i}_loc`)
                  const m = LOCATION_MASTER.find(l => l.id === stop.locationId)
                  return (
                    <div key={stop.id} className="rounded-xl border overflow-hidden" style={C}>
                      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--cyan)' }}>{i + 1}</div>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text2)' }}>Destination {i + 1}</span>
                          {m && <span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text3)' }}>{m.country} · {m.city}</span>}
                        </div>
                        <button type="button" onClick={() => removeStop(i)}
                          className="flex items-center gap-1 px-2 py-1 text-[12.5px] font-semibold rounded-md transition-all"
                          style={{ color:'var(--danger)' }}>
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                      <div className="p-3 grid grid-cols-3 gap-3">
                        <Field label="Stop Type">
                          <Select2 options={STOP_TYPES} value={stop.type} onChange={v => updateStop(i, { type: v })} getIcon={o => o.icon} />
                        </Field>
                        <Field label="Location" required error={stopErr} hint="Pick from Location Master · fills the rest">
                          <Select2 options={locOpts} value={stop.locationId} onChange={v => updateStop(i, { locationId: v })} getSubLabel={o => o.sublabel} placeholder="Search location…" error={!!stopErr} />
                        </Field>
                        <Field label="ETA">
                          <Input type="datetime-local" value={stop.eta} onChange={e => updateStop(i, { eta: e.target.value })} />
                        </Field>

                        {/* Point of Contact — Col-4 / Col-4 / Col-4 */}
                        <div className="col-span-3 grid grid-cols-12 gap-3 pt-1 border-t" style={{ borderColor:'var(--border)' }}>
                          <div className="col-span-4">
                            <Field label="Contact Name" required error={err(`stop_${i}_contact`)}>
                              <Input value={stop.contact} onChange={e => updateStop(i, { contact: e.target.value })} placeholder="Receiver name" error={err(`stop_${i}_contact`)} />
                            </Field>
                          </div>
                          <div className="col-span-4">
                            <Field label="Mobile" required error={err(`stop_${i}_mobile`)}>
                              <Input value={stop.mobile ?? ''} onChange={e => updateStop(i, { mobile: e.target.value })} placeholder="+966 5X XXX XXXX" error={err(`stop_${i}_mobile`)} />
                            </Field>
                          </div>
                          <div className="col-span-4">
                            <Field label="Email">
                              <Input type="email" value={stop.email ?? ''} onChange={e => updateStop(i, { email: e.target.value })} />
                            </Field>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <Field label="Address">
                            <Input value={stop.address} onChange={e => updateStop(i, { address: e.target.value })} placeholder="Full address (auto-filled from master)" />
                          </Field>
                        </div>
                        <div className="col-span-3">
                          <Field label="Google Map Location" required error={err(`stop_${i}_mapLink`)} hint="Auto-filled from master · editable">
                            <Input value={stop.mapLink ?? ''} onChange={e => updateStop(i, { mapLink: e.target.value })} placeholder="https://maps.google.com/?q=…" error={err(`stop_${i}_mapLink`)} />
                          </Field>
                        </div>
                        <div className="col-span-3 md:col-span-1">
                          <Field label="Nearby Landmark">
                            <Input value={stop.landmark ?? ''} onChange={e => updateStop(i, { landmark: e.target.value })} />
                          </Field>
                        </div>
                        <div className="col-span-3 md:col-span-2">
                          <Field label="Notes">
                            <Input value={stop.notes} onChange={e => updateStop(i, { notes: e.target.value })} placeholder="Special instructions for this stop" />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {form.route.stops.length === 0 && (
                  <div className="rounded-xl border border-dashed py-10 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                    <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color:'var(--text2)' }}>No destinations added yet</p>
                    <p className="text-[11px]" style={{ color:'var(--text3)' }}>Click "Add Destination" to add one or more stops</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Schedule ───────────────────────────────────── */}
        {step === 'schedule' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Schedule</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Set dispatch dates and the delivery note number.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Shipment Date" required error={err('shipmentDate')}>
                <Input type="date" value={form.shipmentDate} onChange={e => set('shipmentDate', e.target.value)} error={err('shipmentDate')} />
              </Field>
              <Field label="Expected Time of Arrival (ETA)">
                <Input type="date" value={form.eta} onChange={e => set('eta', e.target.value)} />
              </Field>
              <Field label="Actual Delivery Date" hint="Filled in upon delivery">
                <Input type="date" value={form.actualDeliveryDate} onChange={e => set('actualDeliveryDate', e.target.value)} />
              </Field>
              <Field label="Delivery Note Number">
                <Input value={form.deliveryNoteNumber} onChange={e => set('deliveryNoteNumber', e.target.value)} placeholder="DN-2026-XXXX" />
              </Field>
            </div>

            {/* Insurance & Waiting Charges */}
            <div className="border-t pt-4 grid grid-cols-2 gap-4" style={{ borderColor:'var(--border)' }}>
              {/* Insurance */}
              <div className="rounded-xl border p-3.5 space-y-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Insurance</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[12.5px] font-bold uppercase" style={{ color:'var(--text3)' }}>Required</span>
                    <button type="button" onClick={() => set('insuranceRequired', !form.insuranceRequired)}
                      className="relative w-9 h-5 rounded-full transition-colors"
                      style={{ background: form.insuranceRequired ? 'var(--success)' : 'var(--border)' }}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: form.insuranceRequired ? '18px' : '2px' }} />
                    </button>
                  </label>
                </div>
                {form.insuranceRequired ? (
                  <Field label="Insurance Value (SAR)">
                    <Input type="number" value={form.insuranceValue} onChange={e => set('insuranceValue', e.target.value)} placeholder="0.00" />
                  </Field>
                ) : (
                  <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Toggle on to enter insurance amount.</p>
                )}
              </div>

              {/* Waiting Charges */}
              <div className="rounded-xl border p-3.5 space-y-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Waiting Charges</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[12.5px] font-bold uppercase" style={{ color:'var(--text3)' }}>Required</span>
                    <button type="button" onClick={() => set('waitingRequired', !form.waitingRequired)}
                      className="relative w-9 h-5 rounded-full transition-colors"
                      style={{ background: form.waitingRequired ? 'var(--success)' : 'var(--border)' }}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: form.waitingRequired ? '18px' : '2px' }} />
                    </button>
                  </label>
                </div>
                {form.waitingRequired ? (
                  <Field label="Waiting Amount (SAR)">
                    <Input type="number" value={form.waitingAmount} onChange={e => set('waitingAmount', e.target.value)} placeholder="0.00" />
                  </Field>
                ) : (
                  <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Toggle on to enter waiting amount.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Items (from inventory) ───────────────────────── */}
        {step === 'items' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Equipment & Items</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Pick required transport equipment + items from inventory. Cargo packing comes next.</p>
            </div>

            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Requested Equipment</label>
              <div className="grid grid-cols-4 gap-2">
                {REQUESTED_EQUIPMENT.map(e => {
                  const isSel = form.requestedEquipment.includes(e.id)
                  return (
                    <button key={e.id} type="button"
                      onClick={() => set('requestedEquipment', isSel ? form.requestedEquipment.filter(x => x !== e.id) : [...form.requestedEquipment, e.id])}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: isSel ? 'rgba(37,99,235,.08)' : 'var(--card)',
                        border: `1px solid ${isSel ? 'rgba(37,99,235,.3)' : 'var(--border)'}`,
                      }}>
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: isSel ? 'var(--primary)' : 'var(--border2)', background: isSel ? 'var(--primary)' : 'transparent' }}>
                        {isSel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-base">{e.icon}</span>
                      <span className="text-xs font-medium truncate" style={{ color: isSel ? 'var(--text)' : 'var(--text2)' }}>{e.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cargo Type">
                <Select2 options={CARGO_TYPES.map(c => ({ id: c, label: c }))} value={form.cargoType} onChange={v => set('cargoType', v)} />
              </Field>
              <div />
              <div className="col-span-2">
                <Field label="Cargo Description">
                  <Textarea value={form.cargoDescription} onChange={e => set('cargoDescription', e.target.value)} rows={3} placeholder="Describe the cargo being shipped…" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Special Handling Instructions" hint="e.g. Handle with care, Keep dry, Requires crane, Temperature controlled">
                  <Textarea value={form.specialHandling} onChange={e => set('specialHandling', e.target.value)} rows={3} placeholder="Special handling notes…" />
                </Field>
              </div>
            </div>

            {/* ─── Items from Inventory ─────────────────────────────── */}
            <div className="rounded-xl border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
              <div className="px-3 py-2.5 flex items-center justify-between border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color:'var(--primary)' }} />
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Items from Inventory</h4>
                  <span className="text-[12.5px] px-1.5 py-0.5 rounded font-bold" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{(form.items ?? []).length}</span>
                </div>
                <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Pick from SAP-synced inventory · qty capped at available stock</p>
              </div>
              <div className="p-3 space-y-2">
                {(form.items ?? []).map((it, idx) => {
                  const invItem = inventory.find(i => i.id === it.inventoryId)
                  const maxStock = invItem?.stock ?? 0
                  const qty = Number(it.quantity ?? 1)
                  return (
                    <div key={idx} className="rounded-lg border p-2.5 grid grid-cols-12 gap-2 items-center" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                      <div className="col-span-6">
                        <Select2 size="sm" placeholder="Search inventory by name or SAP ID…"
                          value={it.inventoryId}
                          options={inventory.map(i => ({ id: i.id, label: `${i.name} · ${i.sapId} · stock ${i.stock} ${i.unit}` }))}
                          onChange={v => {
                            const picked = inventory.find(i => i.id === v)
                            if (picked) {
                              const newItems = [...form.items]
                              newItems[idx] = { inventoryId: picked.id, sapId: picked.sapId, name: picked.name, unit: picked.unit, quantity: 1 }
                              set('items', newItems)
                            }
                          }} />
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-1 rounded-lg border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                          <button type="button" disabled={!invItem || qty <= 1}
                            onClick={() => {
                              const newItems = [...form.items]
                              newItems[idx] = { ...newItems[idx], quantity: Math.max(1, qty - 1) }
                              set('items', newItems)
                            }}
                            className="w-8 h-8 flex items-center justify-center font-bold disabled:opacity-30"
                            style={{ color:'var(--primary)' }}>−</button>
                          <input type="number" min="1" max={maxStock || undefined} value={qty}
                            onChange={e => {
                              const v = Math.max(1, Math.min(maxStock || 999, Number(e.target.value) || 1))
                              const newItems = [...form.items]
                              newItems[idx] = { ...newItems[idx], quantity: v }
                              set('items', newItems)
                            }}
                            className="flex-1 text-center text-sm font-mono font-bold border-0 focus:outline-none bg-transparent"
                            style={{ color:'var(--text)' }} />
                          <button type="button" disabled={!invItem || qty >= maxStock}
                            onClick={() => {
                              const newItems = [...form.items]
                              newItems[idx] = { ...newItems[idx], quantity: Math.min(maxStock, qty + 1) }
                              set('items', newItems)
                            }}
                            className="w-8 h-8 flex items-center justify-center font-bold disabled:opacity-30"
                            style={{ color:'var(--primary)' }}>+</button>
                        </div>
                      </div>
                      <div className="col-span-2 text-[12.5px]" style={{ color:'var(--text3)' }}>
                        {invItem
                          ? <span>of <strong style={{ color: qty >= maxStock ? 'var(--warning)' : 'var(--text2)' }}>{maxStock}</strong> {invItem.unit}</span>
                          : 'Pick item first'}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => set('items', form.items.filter((_, i) => i !== idx))}
                          className="w-7 h-7 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <button type="button" onClick={() => set('items', [...(form.items ?? []), { inventoryId: '', quantity: 1 }])}
                  className="w-full rounded-lg border border-dashed py-2 text-xs font-bold flex items-center justify-center gap-1.5" style={{ borderColor:'var(--border2)', color:'var(--primary)', background:'var(--bg2)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Item from Inventory
                </button>
                {(form.items ?? []).length > 0 && (
                  <p className="text-[12.5px] text-center pt-1" style={{ color:'var(--text3)' }}>
                    Next: pack these items into cargo units with weight & dimensions →
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 5: Cargo (pack items into units) ──────────────────── */}
        {step === 'cargo' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Pack Items into Cargo Units</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Group the {(form.items ?? []).length} item(s) you picked into shippable cargo units · add weight & dimensions for each unit.</p>
            </div>

            {(form.items ?? []).length === 0 ? (
              <div className="rounded-xl border-2 border-dashed py-8 text-center" style={{ borderColor:'var(--border2)' }}>
                <Package className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                <p className="text-sm font-bold mb-1" style={{ color:'var(--text2)' }}>No items added yet</p>
                <p className="text-[11px]" style={{ color:'var(--text3)' }}>Go back to the Items step to pick items from inventory first.</p>
              </div>
            ) : (
              <div className="rounded-xl border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                <div className="px-3 py-2.5 flex items-center justify-between border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4" style={{ color:'var(--cyan)' }} />
                    <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Cargo Units</h4>
                    <span className="text-[12.5px] px-1.5 py-0.5 rounded font-bold" style={{ background:'rgba(6,182,212,.12)', color:'var(--cyan)' }}>{(form.cargo ?? []).length}</span>
                  </div>
                  <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Each unit is a physical container (crate · pallet · box)</p>
                </div>
                <div className="p-3 space-y-3">
                  {(form.cargo ?? []).map((c, idx) => {
                    const linkedItems = (c.itemIds ?? []).map(id => (form.items ?? []).find(i => i.inventoryId === id)).filter(Boolean)
                    return (
                      <div key={idx} className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background:'var(--cyan)' }}>{idx + 1}</span>
                            <input value={c.name ?? ''} onChange={e => {
                              const newCargo = [...form.cargo]
                              newCargo[idx] = { ...newCargo[idx], name: e.target.value }
                              set('cargo', newCargo)
                            }} placeholder="Unit description (e.g. Crate A · Pallet 1)"
                              className="rounded-lg px-3 py-1.5 text-sm border focus:outline-none font-bold w-72" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                          </div>
                          <button onClick={() => set('cargo', form.cargo.filter((_, i) => i !== idx))}
                            className="w-7 h-7 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Items in this unit */}
                        <div className="mb-2.5">
                          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Items in this unit</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(form.items ?? []).filter(i => i.inventoryId).map(item => {
                              const selected = (c.itemIds ?? []).includes(item.inventoryId)
                              return (
                                <button key={item.inventoryId} type="button" onClick={() => {
                                  const newCargo = [...form.cargo]
                                  const currentIds = newCargo[idx].itemIds ?? []
                                  newCargo[idx] = {
                                    ...newCargo[idx],
                                    itemIds: selected ? currentIds.filter(id => id !== item.inventoryId) : [...currentIds, item.inventoryId],
                                  }
                                  set('cargo', newCargo)
                                }}
                                  className="px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-1"
                                  style={{
                                    background: selected ? 'var(--cyan-light, #CFFAFE)' : 'var(--card)',
                                    borderColor: selected ? 'var(--cyan)' : 'var(--border)',
                                    color: selected ? 'var(--cyan)' : 'var(--text2)',
                                  }}>
                                  {selected && <Check className="w-3 h-3" />}
                                  {item.name ?? item.inventoryId} · ×{item.quantity}
                                </button>
                              )
                            })}
                            {(form.items ?? []).filter(i => i.inventoryId).length === 0 && (
                              <span className="text-[11px]" style={{ color:'var(--text3)' }}>No items available — pick items in the previous step first</span>
                            )}
                          </div>
                          {linkedItems.length > 0 && (
                            <p className="text-[12.5px] mt-1.5" style={{ color:'var(--cyan)' }}>
                              {linkedItems.length} item type(s) packed in this unit
                            </p>
                          )}
                        </div>

                        {/* Dimensions + weight */}
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Qty</label>
                            <input type="number" min="1" value={c.quantity ?? 1} onChange={e => {
                              const newCargo = [...form.cargo]
                              newCargo[idx] = { ...newCargo[idx], quantity: Number(e.target.value) }
                              set('cargo', newCargo)
                            }}
                              className="w-full rounded-lg px-2 py-1.5 text-sm border focus:outline-none font-mono" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                          </div>
                          <div>
                            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Weight (kg)</label>
                            <input type="number" value={c.weight ?? ''} onChange={e => {
                              const newCargo = [...form.cargo]
                              newCargo[idx] = { ...newCargo[idx], weight: e.target.value }
                              set('cargo', newCargo)
                            }}
                              className="w-full rounded-lg px-2 py-1.5 text-sm border focus:outline-none font-mono" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                          </div>
                          <div>
                            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>L (cm)</label>
                            <input type="number" value={c.length ?? ''} onChange={e => {
                              const newCargo = [...form.cargo]
                              newCargo[idx] = { ...newCargo[idx], length: e.target.value }
                              set('cargo', newCargo)
                            }}
                              className="w-full rounded-lg px-2 py-1.5 text-sm border focus:outline-none font-mono" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                          </div>
                          <div>
                            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>W (cm)</label>
                            <input type="number" value={c.width ?? ''} onChange={e => {
                              const newCargo = [...form.cargo]
                              newCargo[idx] = { ...newCargo[idx], width: e.target.value }
                              set('cargo', newCargo)
                            }}
                              className="w-full rounded-lg px-2 py-1.5 text-sm border focus:outline-none font-mono" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                          </div>
                          <div>
                            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>H (cm)</label>
                            <input type="number" value={c.height ?? ''} onChange={e => {
                              const newCargo = [...form.cargo]
                              newCargo[idx] = { ...newCargo[idx], height: e.target.value }
                              set('cargo', newCargo)
                            }}
                              className="w-full rounded-lg px-2 py-1.5 text-sm border focus:outline-none font-mono" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <button type="button" onClick={() => set('cargo', [...(form.cargo ?? []), { name: `Unit ${(form.cargo ?? []).length + 1}`, quantity:1, weight:'', length:'', width:'', height:'', itemIds:[], active:true }])}
                    className="w-full rounded-lg border border-dashed py-2 text-xs font-bold flex items-center justify-center gap-1.5" style={{ borderColor:'var(--border2)', color:'var(--cyan)', background:'var(--bg2)' }}>
                    <Plus className="w-3.5 h-3.5" /> Add Cargo Unit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 5: Documents ──────────────────────────────────── */}
        {step === 'documents' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Documents</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Upload supporting documents. Files can be added or replaced later from the shipment profile.</p>
            </div>
            <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--text3)' }} />
              <p className="text-sm font-medium" style={{ color:'var(--text2)' }}>Drag & drop documents here, or click to browse</p>
              <p className="text-[11px] mt-1" style={{ color:'var(--text3)' }}>PDF, JPG, PNG up to 10MB</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Delivery Note', 'Gate Pass', 'Transport Permit', 'Site Clearance', 'Safety Documents', 'Other Attachments'].map(t => (
                <div key={t} className="rounded-xl border p-3 flex items-center gap-2.5" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <FileText className="w-4 h-4" style={{ color:'var(--text3)' }} />
                  <span className="text-xs font-medium flex-1" style={{ color:'var(--text2)' }}>{t}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background:'var(--bg3)', color:'var(--text3)' }}>0</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 6: Review ─────────────────────────────────────── */}
        {step === 'review' && (() => {
          // Calculations
          const stops = form.route?.stops ?? []
          const activeCargo = (form.cargo ?? []).filter(c => c.active !== false)
          const totalWeight = activeCargo.reduce((sum, c) => sum + (Number(c.weight) * Number(c.quantity ?? 1) || 0), 0)
          const totalVolume = activeCargo.reduce((sum, c) => {
            const [l, w, h] = [Number(c.length), Number(c.width), Number(c.height)]
            if (l && w && h) return sum + (l * w * h / 1_000_000) * Number(c.quantity ?? 1)
            return sum
          }, 0)
          const originNames = (form.route?.origins ?? []).map(o => LOCATION_MASTER.find(l => l.id === o.locationId)?.name).filter(Boolean)
          const originLabel = originNames.length === 0 ? '—' : originNames.length === 1 ? originNames[0] : `${originNames.length} origins: ${originNames.join(' + ')}`
          const destNames  = stops.map(s => LOCATION_MASTER.find(l => l.id === s.locationId)?.name).filter(Boolean)
          const routeStr   = [originLabel, ...destNames].join(' → ')
          // Heuristic distance/duration — rough estimates based on stop count
          // KSA cross-city distances ~400-1500km; 60km/h avg
          const distanceKm = stops.length === 0 ? 0 : 350 + stops.length * 280 + (form.cargoType === 'Heavy Equipment' ? 50 : 0)
          const durationHrs = Math.round(distanceKm / 60)
          const durationDays = Math.ceil(durationHrs / 10)  // 10 driving hrs/day

          // Charges totals (insurance + waiting)
          const insAmt = form.insuranceRequired ? Number(form.insuranceValue || 0) : 0
          const waitAmt = form.waitingRequired ? Number(form.waitingAmount  || 0) : 0
          const chargesTotal = insAmt + waitAmt

          return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Final Review</h3>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Verify everything is correct, then choose to save draft, submit, or send for approval.</p>
            </div>

            {/* Calculation tiles */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { l:'Distance',     v:`${distanceKm.toLocaleString()} km`,        c:'var(--primary)', icon: MapPin },
                { l:'Est. Duration',v:`${durationDays}d (${durationHrs}h)`,       c:'var(--cyan)',    icon: Clock },
                { l:'Total Weight', v:`${totalWeight.toLocaleString()} KG`,       c:'#8B5CF6',        icon: Box },
                { l:'Total Volume', v:`${totalVolume.toFixed(2)} m³`,             c:'var(--success)', icon: Box },
                { l:'Stops',        v: stops.length,                              c:'var(--warning)', icon: MapPin },
              ].map(({ l, v, c, icon:Icon }) => (
                <div key={l} className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${c}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" style={{ color: c }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
                  </div>
                  <div className="text-base font-black font-mono" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Route summary hero */}
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background:'linear-gradient(135deg, rgba(5,150,105,.1) 0%, var(--bg2) 100%)', borderColor:'rgba(5,150,105,.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'var(--success)' }}>
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--success)' }}>Route Summary</div>
                <div className="text-base font-bold truncate" style={{ color:'var(--text)' }}>{routeStr}</div>
                <div className="text-[11px] mt-0.5" style={{ color:'var(--text2)' }}>
                  Estimated <strong>{durationDays} day{durationDays === 1 ? '' : 's'}</strong> · <strong>{distanceKm.toLocaleString()} km</strong> total
                </div>
              </div>
            </div>

            {/* Section grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Shipment details */}
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Shipment Details</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Shipment #</span><span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{shipmentId || 'Auto-generated'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Project</span><span style={{ color:'var(--text)' }}>{summaryProject}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Shipment Type</span><span style={{ color:'var(--text)' }}>{form.shipmentType}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Transporter</span><span style={{ color:'var(--text)' }}>{TRANSPORTER_ASSIGN.find(t => t.id === form.transporterMode)?.label}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Vendor</span><span style={{ color:'var(--text)' }}>{summaryVendor}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>PO Numbers</span><span className="font-mono" style={{ color:'var(--text)' }}>{form.poNumbers.length ? form.poNumbers.join(', ') : '—'}</span></div>
                </div>
              </div>

              {/* Origin */}
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Origin</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Location</span><span style={{ color:'var(--text)' }}>{originName}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Contact</span><span style={{ color:'var(--text)' }}>{form.route?.origin?.contact || '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Mobile</span><span style={{ color:'var(--text)' }}>{form.route?.origin?.mobile || '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Shipment Date</span><span className="font-mono" style={{ color:'var(--text)' }}>{form.shipmentDate || '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>ETA</span><span className="font-mono" style={{ color:'var(--text)' }}>{form.eta || '—'}</span></div>
                </div>
              </div>

              {/* Destinations list */}
              <div className="rounded-xl border overflow-hidden col-span-2" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Destinations ({stops.length})</div>
                <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                  {stops.map((s, i) => (
                    <div key={s.id ?? i} className="px-3 py-2 flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background:'var(--success)' }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold" style={{ color:'var(--text)' }}>{LOCATION_MASTER.find(l => l.id === s.locationId)?.name ?? 'Unknown'}</div>
                        <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>
                          {s.contact && <span>👤 {s.contact}</span>}
                          {s.mobile  && <span className="ml-2">📞 {s.mobile}</span>}
                          {s.eta     && <span className="ml-2">⏱ {new Date(s.eta).toLocaleString('en-SA')}</span>}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background:'var(--bg2)', color:'var(--text2)' }}>{s.type ?? 'final'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cargo summary */}
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Cargo Summary</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Cargo Type</span><span style={{ color:'var(--text)' }}>{form.cargoType}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Units</span><span style={{ color:'var(--text)' }}>{activeCargo.length} active</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Total Weight</span><span className="font-mono" style={{ color:'var(--text)' }}>{totalWeight.toLocaleString()} KG</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Total Volume</span><span className="font-mono" style={{ color:'var(--text)' }}>{totalVolume.toFixed(2)} m³</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Equipment</span><span style={{ color:'var(--text)' }}>{form.requestedEquipment.length} requested</span></div>
                </div>
              </div>

              {/* Insurance & Charges */}
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Insurance & Charges</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Insurance</span><span className="font-mono" style={{ color: form.insuranceRequired ? 'var(--text)' : 'var(--text3)' }}>{form.insuranceRequired ? `SAR ${insAmt.toLocaleString()}` : 'Not required'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Waiting Charges</span><span className="font-mono" style={{ color: form.waitingRequired ? 'var(--text)' : 'var(--text3)' }}>{form.waitingRequired ? `SAR ${waitAmt.toLocaleString()}` : 'Not required'}</span></div>
                  <div className="flex justify-between border-t pt-1.5 mt-1.5" style={{ borderColor:'var(--border)' }}>
                    <span className="font-bold" style={{ color:'var(--text)' }}>Total Extra Charges</span>
                    <span className="font-mono font-bold" style={{ color:'var(--primary)' }}>SAR {chargesTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Delivery Note #</span><span className="font-mono" style={{ color:'var(--text)' }}>{form.deliveryNoteNumber || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>
          )
        })()}
      </div>

      {/* Wizard nav */}
      <div className="rounded-xl border p-3 flex items-center justify-between" style={C}>
        <button onClick={goPrev} disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <div className="text-[11px]" style={{ color:'var(--text3)' }}>
          Step <strong style={{ color:'var(--text)' }}>{stepIdx + 1}</strong> of {STEPS.length}
        </div>
        {isLast ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { setConfirmMode('draft'); setConfirmOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
              <Save className="w-4 h-4" /> Save as Draft
            </button>
            <button onClick={() => { setConfirmMode('approval'); setConfirmOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--warning)' }}>
              <Send className="w-4 h-4" /> Send for Approval
            </button>
            <button onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
              Submit <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Confirmation */}
      <EnterpriseModal
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title={confirmMode === 'draft' ? 'Save as Draft' : confirmMode === 'approval' ? 'Send for Approval' : 'Submit Shipment'}
        subtitle={`Local Shipment ${shipmentId ?? '(new)'}`}
        icon={<Truck className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn variant={confirmMode === 'approval' ? 'primary' : 'primary'} onClick={() => handleSubmit(confirmMode)} loading={saving}>
            {confirmMode === 'draft' ? 'Save Draft' : confirmMode === 'approval' ? 'Yes, Send for Approval' : 'Yes, Submit Shipment'}
          </ModalBtn>
        </>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {confirmMode === 'draft'    && <>The shipment will be saved as a draft. You can return and finish later. Nothing is sent to vendors or operations yet.</>}
              {confirmMode === 'submit'   && <>Submitting will move the shipment to <strong>Assigned</strong> status. Operations will be notified.</>}
              {confirmMode === 'approval' && <>The shipment will be routed through the configured approval workflow before becoming active.</>}
            </p>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
