import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Package, ArrowLeft, ArrowRight, Check, AlertCircle, X, Save, Send,
  Plane, MapPin, DollarSign, Box, FileText, Upload, Eye, Plus, Trash2,
  Power, Edit3, ChevronRight, Building2, Briefcase, CheckCircle2, Boxes, Hash, Search,
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
  INCOTERMS, SHIPMENT_MODES, CURRENCIES, FREIGHT_TERMS, PAYMENT_TERMS,
  DIMENSION_UNITS, WEIGHT_UNITS, LOCATION_MASTER, FINAL_DEST_TYPES,
  SHIPMENT_STATUSES_INTL, nextShipmentId, newCargoRow, newItemRow,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const STEPS = [
  { id: 'basic',     num: 1, label: 'Basic Info',  icon: Plane,       sub: 'PO, supplier, incoterm & owner'    },
  { id: 'route',     num: 2, label: 'Origin & Destination', icon: MapPin, sub: 'Pickup, delivery & final dest' },
  { id: 'financial', num: 3, label: 'Financial',    icon: DollarSign,  sub: 'Value, insurance, freight terms'    },
  { id: 'items',     num: 4, label: 'Items',        icon: Package,     sub: 'Pick items from inventory'          },
  { id: 'cargo',     num: 5, label: 'Cargo',        icon: Box,         sub: 'Pack items into cargo units'        },
  { id: 'documents', num: 6, label: 'Documents',    icon: FileText,    sub: 'PO, invoice, packing list & more'   },
  { id: 'review',    num: 7, label: 'Review',       icon: Eye,         sub: 'Final summary & submit'             },
]

// ─── Validation per step ──────────────────────────────────────────────────────
function validateStep(step, form) {
  const e = {}
  if (step === 'basic') {
    if (!form.poNumber?.trim()) e.poNumber = 'PO Number is required'
    if (!form.incoterm)         e.incoterm = 'Incoterm is required'
    if (!form.modes?.length)    e.modes    = 'At least one shipment mode is required'
    if (!form.project)          e.project  = 'Project is required'
    if (!form.owner)            e.owner    = 'Assigned owner is required'
  }
  if (step === 'route') {
    if (!form.origins?.length) e.origins = 'Add at least one origin'
    // Unique check across origins (by locationId if picked, else by country+address)
    const originKeys = (form.origins ?? []).map(o => o.locationId || `${(o.country ?? '').trim().toUpperCase()}|${(o.address ?? '').trim().toLowerCase()}`).filter(Boolean)
    const dupOrigin = new Set(originKeys.filter((k, i) => originKeys.indexOf(k) !== i))
    form.origins?.forEach((o, i) => {
      const key = o.locationId || `${(o.country ?? '').trim().toUpperCase()}|${(o.address ?? '').trim().toLowerCase()}`
      if (!o.country?.trim()) e[`origin_${i}_country`] = `Origin ${i + 1}: country is required`
      if (!o.address?.trim()) e[`origin_${i}_address`] = `Origin ${i + 1}: address is required`
      else if (dupOrigin.has(key) && key) e[`origin_${i}_address`] = `Origin ${i + 1}: duplicate · each pickup must be unique`
      if (o.email?.trim() && !/\S+@\S+\.\S+/.test(o.email)) e[`origin_${i}_email`] = `Origin ${i + 1}: invalid email`
    })
    if (!form.readyDate && !form.origins?.[0]?.readyDate) e.readyDate = 'Ready date is required (on first origin or schedule step)'

    // Destinations: only Country + Address required per destination
    if (!form.destinations?.length) e.destinations = 'At least one destination is required'
    const destKeys = (form.destinations ?? []).map(d => `${(d.country ?? '').trim().toUpperCase()}|${(d.address ?? '').trim().toLowerCase()}`)
    const dupDest = new Set(destKeys.filter((k, i) => destKeys.indexOf(k) !== i))
    const originKeySet = new Set(originKeys)
    form.destinations?.forEach((d, i) => {
      const key = `${(d.country ?? '').trim().toUpperCase()}|${(d.address ?? '').trim().toLowerCase()}`
      if (!d.country?.trim()) e[`dest_${i}_country`] = `Destination ${i + 1}: country is required`
      if (!d.address?.trim()) e[`dest_${i}_address`] = `Destination ${i + 1}: address is required`
      else if (dupDest.has(key) && key !== '|') e[`dest_${i}_address`] = `Destination ${i + 1}: duplicate · each must be unique`
      else if (originKeySet.has(key))           e[`dest_${i}_address`] = `Destination ${i + 1}: matches an origin · pick a different location`
      if (d.email?.trim() && !/\S+@\S+\.\S+/.test(d.email)) e[`dest_${i}_email`] = `Destination ${i + 1}: invalid email`
    })

    // Cross-border rule: any origin in KSA = origin side has KSA. Compute the strict rule.
    const originsWithCountry = (form.origins ?? []).filter(o => (o.country ?? '').trim())
    const destsWithCountry   = (form.destinations ?? []).filter(d => (d.country ?? '').trim())
    if (originsWithCountry.length > 0 && destsWithCountry.length > 0) {
      const allOriginsKsa = originsWithCountry.every(o => o.country.toUpperCase() === 'SA')
      const allOriginsNonKsa = originsWithCountry.every(o => o.country.toUpperCase() !== 'SA')
      const allDestsKsa  = destsWithCountry.every(d => d.country.toUpperCase() === 'SA')
      const allDestsNonKsa = destsWithCountry.every(d => d.country.toUpperCase() !== 'SA')
      if (allOriginsKsa && allDestsKsa)        e.crossBorder = 'All locations are inside KSA — use a Local Shipment instead'
      if (allOriginsNonKsa && allDestsNonKsa)  e.crossBorder = 'International shipments must include Saudi Arabia (origin or a destination)'
    }
  }
  if (step === 'schedule') {
    if (!form.readyDate) e.readyDate = 'Shipment date is required'
  }
  // Other steps optional but recommended
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
      className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
      style={{
        background:'var(--bg2)',
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        color:'var(--text)',
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, visited, onJump }) {
  return (
    <div className="rounded-xl border p-3" style={C}>
      <div className="flex items-center overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isCurrent = current === s.id
          const isDone    = visited.has(s.id) && !isCurrent && STEPS.findIndex(x => x.id === current) > i
          const canJump   = visited.has(s.id)
          return (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <button type="button" disabled={!canJump} onClick={() => canJump && onJump(s.id)}
                className="flex items-center gap-2 flex-shrink-0 disabled:cursor-not-allowed">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg3)',
                    border: `2px solid ${isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)'}`,
                    boxShadow: isCurrent ? '0 0 0 3px rgba(37,99,235,.15)' : 'none',
                  }}>
                  {isDone ? <Check className="w-4 h-4 text-white" />
                          : <Icon className="w-4 h-4" style={{ color: isCurrent ? '#fff' : 'var(--text3)' }} />}
                </div>
                <div className="hidden xl:block">
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Step {s.num}</div>
                  <div className="text-[11px] font-bold leading-tight whitespace-nowrap" style={{ color: isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text2)' }}>{s.label}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-1.5 rounded-full" style={{ background: isDone ? 'var(--success)' : 'var(--border)' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── New destination factory (multi-destination support) ─────────────────────
function newDestination() {
  return {
    id:        `DST-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    country:   '',
    address:   '',
    mapLink:   '',
    landmark:  '',
    contact:   '',
    email:     '',
    mobile:    '',
    notes:     '',
  }
}

function newOriginI() {
  return {
    id:         `ORG-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    locationId: null,
    country:    '',
    city:       '',
    address:    '',
    mapLink:    '',
    landmark:   '',
    contact:    '',
    email:      '',
    mobile:     '',
    readyDate:  '',
    notes:      '',
  }
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  poNumber: '', supplier: '', incoterm: '',
  modes: [],                                     // multi-select shipment modes
  project: '', owner: '', status: 'draft',
  // Origins (multiple)
  origins: [newOriginI()],
  // Multiple destinations
  destinations: [newDestination()],
  // Legacy fields kept for back-compat with existing data — derived from origins[0] for cross-border calc
  finalDestType: 'warehouse', finalDestNotes: '',
  // Timeline
  estArrivalDate: '', actualArrivalDate: '', expectedTransitDays: '',
  // Financial
  estValue: '', currency: 'SAR', insuranceValue: '', insuranceRequired: true,
  freightTerms: 'Prepaid', paymentTerms: 'Net 30',
  // Additional services
  transitRequired: false, transitAmount: '',
  cargoLoadingRequired: false, cargoLoadingAmount: '',
  cargo: [], items: [], documents: [],
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function IntlShipmentCreate() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const { createIntlShipment, updateIntlShipment, getShipment, saveDraft, submitShipment } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const { projects } = useProjectStore()
  const { users }    = useUserStore()
  const { inventory } = useFinanceStore()
  const [invPickerOpen, setInvPickerOpen] = useState(false)
  const [invSearch, setInvSearch] = useState('')
  const { toast } = useToast()

  const [form, setForm]     = useState(EMPTY_FORM)
  const [draftId, setDraftId] = useState(id ?? null)
  const [step, setStep]     = useState('basic')
  const [visited, setVisited] = useState(new Set(['basic']))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(null)  // 'submit' | 'approval' | null
  const [previewId, setPreviewId] = useState(useMemo(() => nextShipmentId('international'), []))

  // ─── Load draft for edit ─────────────────────────────────────────────
  useEffect(() => {
    if (isEdit) {
      const s = getShipment(id)
      if (s && s.type === 'international') {
        // Migrate flat origin* fields → origins[] if needed
        const origins = s.origins?.length ? s.origins : (s.originCountry || s.originAddress ? [{
          id: `ORG-${s.id}-1`,
          locationId: null,
          country:   s.originCountry  ?? '',
          city:      s.originCity     ?? '',
          address:   s.originAddress  ?? '',
          mapLink:   s.originMapLink  ?? '',
          landmark:  s.originLandmark ?? '',
          contact:   s.originContact  ?? '',
          email:     s.originEmail    ?? '',
          mobile:    s.originMobile   ?? '',
          readyDate: s.readyDate?.split('T')[0] ?? '',
          notes:     s.originNotes    ?? '',
        }] : [newOriginI()])
        setForm({ ...EMPTY_FORM, ...s,
          origins,
          readyDate: s.readyDate?.split('T')[0] ?? '',
        })
        setVisited(new Set(STEPS.map(x => x.id)))
        setPreviewId(s.id)
      }
    }
  }, [id, isEdit, getShipment])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-fill country/city/address/mapLink/landmark from LOCATION_MASTER when origin/dest picks a location
  const fillFromLocation = (locationId, existing = {}) => {
    const m = LOCATION_MASTER.find(l => l.id === locationId)
    if (!m) return { ...existing, locationId }
    return {
      ...existing,
      locationId,
      country:  existing.country?.trim()  ? existing.country  : (m.country  ?? ''),
      city:     existing.city?.trim()     ? existing.city     : (m.city     ?? ''),
      address:  existing.address?.trim()  ? existing.address  : (m.address  ?? `${m.name}, ${m.city}`),
      landmark: existing.landmark?.trim() ? existing.landmark : (m.landmark ?? ''),
      mapLink:  existing.mapLink?.trim()  ? existing.mapLink  : (m.mapLink  ?? ''),
    }
  }

  const updateOrigin = (idx, patch) =>
    setForm(f => ({ ...f, origins: f.origins.map((o, i) => {
      if (i !== idx) return o
      if ('locationId' in patch) return fillFromLocation(patch.locationId, { ...o, ...patch })
      return { ...o, ...patch }
    }) }))
  const addOrigin = () =>
    setForm(f => ({ ...f, origins: [...(f.origins ?? []), newOriginI()] }))
  const removeOrigin = (idx) =>
    setForm(f => ({ ...f, origins: f.origins.filter((_, i) => i !== idx) }))

  // ─── Filter vendors to international only (services include air/sea/freight_forward etc) ─
  const intlVendors = useMemo(() =>
    vendors.filter(v => v.status === 'active' &&
      (v.country !== 'SA' || (v.services ?? []).some(s => ['air_freight','sea_freight','freight_forward','customs_broker'].includes(s)))),
    [vendors],
  )

  // Available modes from selected vendor
  const selectedVendor = intlVendors.find(v => v.id === form.supplier)
  const availableModes = useMemo(() => {
    if (!selectedVendor) return SHIPMENT_MODES
    const map = { air_freight: 'air', sea_freight: 'sea', freight_forward: 'multi', transportation: 'land', heavy_transport: 'land' }
    const ids = new Set(['multi'])
    ;(selectedVendor.services ?? []).forEach(svc => { if (map[svc]) ids.add(map[svc]) })
    return SHIPMENT_MODES.filter(m => ids.has(m.id))
  }, [selectedVendor])

  // Auto-populate supplier country
  useEffect(() => {
    if (selectedVendor) set('supplierCountry', selectedVendor.country)
    // eslint-disable-next-line
  }, [form.supplier])

  // ─── Cargo / Items management ────────────────────────────────────────
  const addCargo  = () => set('cargo', [...form.cargo, newCargoRow()])
  const updCargo  = (id, patch) => set('cargo', form.cargo.map(c => c.id === id ? { ...c, ...patch } : c))
  const deactivateCargo = (id) => set('cargo', form.cargo.map(c => c.id === id ? { ...c, active: !c.active } : c))
  const removeCargo = (id) => set('cargo', form.cargo.filter(c => c.id !== id))

  const addItem   = () => set('items', [...form.items, newItemRow()])
  const updItem   = (id, patch) => set('items', form.items.map(it => it.id === id ? { ...it, ...patch } : it))
  const deactivateItem = (id) => set('items', form.items.map(it => it.id === id ? { ...it, active: !it.active } : it))
  const removeItem = (id) => set('items', form.items.filter(it => it.id !== id))

  // Cargo / Item side-modal state
  const [cargoModal, setCargoModal] = useState(null)  // { mode:'add'|'edit', cargo }
  const [itemModal,  setItemModal]  = useState(null)  // { mode:'add'|'edit', item }
  const [expandedItems, setExpandedItems] = useState(new Set())  // expanded item card IDs

  const openAddCargo  = () => setCargoModal({ mode:'add',  draft: { ...newCargoRow(), packageType:'Pallet', quantity: 1, images: [], hazardous: false, specialHandling: '' } })
  const openEditCargo = (c) => setCargoModal({ mode:'edit', draft: { packageType:'Pallet', quantity: c.packages ?? 1, images: [], hazardous: false, specialHandling: '', ...c } })
  const saveCargoModal = () => {
    if (!cargoModal) return
    if (cargoModal.mode === 'add') set('cargo', [...form.cargo, cargoModal.draft])
    else                            set('cargo', form.cargo.map(c => c.id === cargoModal.draft.id ? cargoModal.draft : c))
    setCargoModal(null)
  }

  const openAddItem  = () => setItemModal({ mode:'add',  draft: { ...newItemRow() } })
  const openEditItem = (it) => setItemModal({ mode:'edit', draft: { ...it } })
  const saveItemModal = () => {
    if (!itemModal) return
    if (itemModal.mode === 'add') set('items', [...form.items, itemModal.draft])
    else                           set('items', form.items.map(i => i.id === itemModal.draft.id ? itemModal.draft : i))
    setItemModal(null)
  }
  const toggleExpanded = (id) => setExpandedItems(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // ─── Navigation ───────────────────────────────────────────────────────
  const stepIdx = STEPS.findIndex(s => s.id === step)
  const isFirst = stepIdx === 0
  const isLast  = stepIdx === STEPS.length - 1

  const goNext = () => {
    const e = validateStep(step, form)
    setErrors(e)
    if (Object.keys(e).length) { toast.warning('Validation', 'Fix highlighted fields.'); return }
    if (isLast) return
    const next = STEPS[stepIdx + 1].id
    setVisited(s => new Set([...s, next]))
    setStep(next)
  }
  const goPrev = () => { if (!isFirst) setStep(STEPS[stepIdx - 1].id) }

  // ─── Save Draft (works at any step) ──────────────────────────────────
  const handleSaveDraft = () => {
    setSaving(true)
    setTimeout(() => {
      const payload = { ...form, readyDate: form.readyDate ? new Date(form.readyDate).toISOString() : null }
      if (draftId) {
        updateIntlShipment(draftId, payload)
        toast.success('Draft Saved', `Shipment ${draftId} updated.`)
      } else {
        const newId = createIntlShipment(payload)
        setDraftId(newId)
        setPreviewId(newId)
        toast.success('Draft Saved', `Shipment ${newId} saved as draft.`)
      }
      setSaving(false)
    }, 400)
  }

  // ─── Submit / Send for Approval ──────────────────────────────────────
  const finalize = (action) => {
    const all = {}
    STEPS.forEach(s => Object.assign(all, validateStep(s.id, form)))
    setErrors(all)
    if (Object.keys(all).length) {
      toast.warning('Validation Failed', 'Required fields missing.')
      setConfirmOpen(null)
      return
    }
    setSaving(true)
    setTimeout(() => {
      const payload = {
        ...form,
        readyDate: form.readyDate ? new Date(form.readyDate).toISOString() : null,
        status: action === 'submit' ? 'submitted' : 'submitted',
      }
      let finalId = draftId
      if (draftId) updateIntlShipment(draftId, payload)
      else         finalId = createIntlShipment(payload)
      toast.success(action === 'submit' ? 'Shipment Submitted' : 'Sent for Approval', `${finalId} is now active.`)
      setSaving(false)
      setConfirmOpen(null)
      navigate(`/shipments/intl/${finalId}/success`)
    }, 500)
  }

  const err = (k) => errors[k]

  return (
    <div className="space-y-4 pb-8">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/shipments/intl')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <Plane className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
                {isEdit ? 'Edit International Shipment' : 'New International Shipment'}
                <span className="font-mono text-xs px-2 py-0.5 rounded-md" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{previewId}</span>
              </h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>{STEPS[stepIdx].sub} — Step {stepIdx+1} of {STEPS.length}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50"
            style={{ ...C, color:'var(--text2)' }}>
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button onClick={() => navigate('/shipments/intl')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>

      <StepIndicator current={step} visited={visited} onJump={setStep} />

      {/* STEP CONTENT */}
      <div className="rounded-xl border p-5 animate-fade-in" style={C}>
        {/* Step 1: Basic Info */}
        {step === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Shipment Number" hint="Auto-generated">
              <Input value={previewId} disabled />
            </Field>
            <Field label="Status">
              <Select2 options={Object.entries(SHIPMENT_STATUSES_INTL).map(([k,v]) => ({ id:k, label:v.label }))} value={form.status} onChange={v => set('status', v)} />
            </Field>
            <Field label="PO Number" required error={err('poNumber')}>
              <Input value={form.poNumber} onChange={e => set('poNumber', e.target.value)} error={err('poNumber')} placeholder="PO-2026-001" />
            </Field>
            <div className="col-span-2 rounded-xl border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
              <div className="flex-1">
                <div className="text-xs font-bold mb-0.5" style={{ color:'var(--primary)' }}>Supplier will be allocated through Quotes</div>
                <div className="text-[11px]" style={{ color:'var(--text2)' }}>
                  Skip supplier selection here. After saving, the shipment will appear in the Quotes flow where vendor bids are collected and the best one is approved. The supplier is auto-populated into this shipment once a quote is approved.
                </div>
              </div>
            </div>
            <Field label="Incoterm" required error={err('incoterm')}>
              <Select2 options={INCOTERMS} value={form.incoterm} onChange={v => set('incoterm', v)} placeholder="Select incoterm…" error={!!err('incoterm')} />
            </Field>
            <Field label="Shipment Mode" required error={err('modes')} hint="Select all that apply (e.g. Sea + Land combo)">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id:'air',  label:'Air Freight',  icon:'✈' },
                  { id:'sea',  label:'Sea Freight',  icon:'⚓' },
                  { id:'land', label:'Land Freight', icon:'🚚' },
                  { id:'rail', label:'Rail Freight', icon:'🚆' },
                  { id:'courier', label:'Courier',   icon:'📦' },
                  { id:'multimodal', label:'Multimodal', icon:'🔀' },
                ].map(m => {
                  const selected = (form.modes ?? []).includes(m.id)
                  return (
                    <button key={m.id} type="button"
                      onClick={() => {
                        const next = selected
                          ? (form.modes ?? []).filter(x => x !== m.id)
                          : [...(form.modes ?? []), m.id]
                        set('modes', next)
                      }}
                      className="px-3 py-2.5 rounded-lg text-xs font-bold border-2 transition-all flex items-center gap-2"
                      style={{
                        background:  selected ? 'var(--primary-light)' : 'var(--bg2)',
                        borderColor: selected ? 'var(--primary)'      : err('modes') ? 'var(--danger)' : 'var(--border)',
                        color:       selected ? 'var(--primary)'      : 'var(--text2)',
                      }}>
                      <span className="text-base">{m.icon}</span>{m.label}
                      {selected && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="Project" required error={err('project')}>
              <Select2
                options={projects.filter(p => p.status === 'active').map(p => ({ id: p.id, label: p.name, subLabel: p.id }))}
                value={form.project}
                onChange={v => set('project', v)}
                getSubLabel={o => o.subLabel}
                placeholder="Search project master…"
                error={!!err('project')}
              />
            </Field>
            <Field label="Assigned Owner" required error={err('owner')} hint="Internal shipment coordinator">
              <Select2
                options={users.filter(u => u.status === 'active').map(u => ({ id: u.id, label: u.name, subLabel: `${u.id} · ${u.dept}` }))}
                value={form.owner}
                onChange={v => set('owner', v)}
                getSubLabel={o => o.subLabel}
                placeholder="Search users…"
                error={!!err('owner')}
              />
            </Field>
          </div>
        )}

        {/* Step 2: Origin & Multiple Destinations */}
        {step === 'route' && (() => {
          // Derive shipment direction
          const originIso = (form.origins?.[0]?.country ?? '').trim().toUpperCase()
          const destsCountries = (form.destinations ?? []).map(d => (d.country ?? '').trim().toUpperCase()).filter(Boolean)
          let direction = null
          if (originIso && destsCountries.length > 0) {
            const allDestsKsa = destsCountries.every(c => c === 'SA')
            const allDestsNonKsa = destsCountries.every(c => c !== 'SA')
            if      (originIso === 'SA' && allDestsNonKsa) direction = { label: 'Export', color: 'var(--cyan)',    desc: 'KSA → Outside KSA' }
            else if (originIso !== 'SA' && allDestsKsa)    direction = { label: 'Import', color: 'var(--success)', desc: 'Outside KSA → KSA' }
            else if (originIso !== 'SA' && allDestsNonKsa) direction = { label: 'Foreign-only', color: 'var(--danger)', desc: 'No KSA leg — block' }
            else                                            direction = { label: 'Multi-stop', color: 'var(--primary)', desc: 'Mixed KSA + non-KSA' }
          }
          const COUNTRY_PICKS = [
            { code:'SA', name:'Saudi Arabia' },
            { code:'AE', name:'UAE' },
            { code:'IN', name:'India' },
            { code:'KW', name:'Kuwait' },
            { code:'BH', name:'Bahrain' },
            { code:'OM', name:'Oman' },
            { code:'QA', name:'Qatar' },
            { code:'EG', name:'Egypt' },
            { code:'CN', name:'China' },
            { code:'DE', name:'Germany' },
          ]

          // Count step errors for the summary banner
          const stepErrors = Object.entries(errors).filter(([k]) =>
            k === 'origins' || k.startsWith('origin_') ||
            k === 'readyDate' || k === 'destinations' || k === 'crossBorder' ||
            k.startsWith('dest_')
          )

          return (
          <div className="space-y-5">
            {/* Direction badge */}
            {direction && (
              <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: `${direction.color}10`, border:`1px solid ${direction.color}30` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: direction.color }}>
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: direction.color }}>
                    {direction.label} Shipment
                  </div>
                  <div className="text-[11px]" style={{ color:'var(--text2)' }}>{direction.desc}</div>
                </div>
              </div>
            )}

            {/* Error summary banner */}
            {stepErrors.length > 0 && (
              <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--danger-light)', borderColor:'rgba(220,38,38,.3)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--danger)' }} />
                <div className="flex-1">
                  <div className="text-xs font-bold mb-1" style={{ color:'var(--danger)' }}>
                    {stepErrors.length} field{stepErrors.length === 1 ? '' : 's'} need{stepErrors.length === 1 ? 's' : ''} attention
                  </div>
                  <ul className="text-[11px] space-y-0.5" style={{ color:'var(--danger)' }}>
                    {stepErrors.slice(0, 4).map(([k, v]) => <li key={k}>• {v}</li>)}
                    {stepErrors.length > 4 && <li>• and {stepErrors.length - 4} more…</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Origins (multi) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
                  Origins · Pickup Points
                  <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>
                    {form.origins?.length ?? 0}
                  </span>
                  <span className="text-[11px] font-normal" style={{ color:'var(--text3)' }}>(at least 1 required)</span>
                </h3>
                <button type="button" onClick={addOrigin} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Origin
                </button>
              </div>

              <div className="space-y-3">
                {form.origins?.map((origin, i) => {
                  const cErr = err(`origin_${i}_country`)
                  const aErr = err(`origin_${i}_address`)
                  const eErr = err(`origin_${i}_email`)
                  const m = LOCATION_MASTER.find(l => l.id === origin.locationId)
                  return (
                    <div key={origin.id} className="rounded-xl border overflow-hidden" style={C}>
                      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--primary)' }}>{i + 1}</div>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--primary)' }}>
                            Origin {i + 1}{form.origins.length > 1 ? ` / ${form.origins.length}` : ''}
                          </span>
                          {(origin.country || m) && <span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text3)' }}>{(origin.country || m?.country)} · {(origin.city || m?.city) || '—'}</span>}
                        </div>
                        {form.origins.length > 1 && (
                          <button type="button" onClick={() => removeOrigin(i)} className="flex items-center gap-1 px-2 py-1 text-[12.5px] font-semibold rounded-md" style={{ color:'var(--danger)' }}>
                            <X className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>

                      {/* Country quick-picks */}
                      <div className="px-3 pt-3">
                        <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Quick pick country</div>
                        <div className="flex flex-wrap gap-1.5">
                          {COUNTRY_PICKS.map(c => {
                            const active = (origin.country ?? '').toUpperCase() === c.code
                            return (
                              <button key={c.code} type="button" onClick={() => updateOrigin(i, { country: c.code })}
                                className="px-2 py-1 text-[12.5px] font-bold rounded-md border transition-all"
                                style={active
                                  ? { background:'var(--primary)', color:'#fff', borderColor:'var(--primary)' }
                                  : { background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }}>
                                {c.code} · {c.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="p-3 grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                          <Field label="Pick from Location Master" hint="Auto-fills the rest · optional">
                            <Select2 options={LOCATION_MASTER.map(l => ({ id: l.id, label: l.name, sublabel: `${l.country} · ${l.city}` }))}
                              value={origin.locationId} onChange={v => updateOrigin(i, { locationId: v })} getSubLabel={o => o.sublabel} placeholder="Search location…" />
                          </Field>
                        </div>
                        <div className="col-span-4">
                          <Field label="Origin Country" required error={cErr}>
                            <Input value={origin.country} onChange={e => updateOrigin(i, { country: e.target.value.toUpperCase() })}
                              placeholder="2-letter code (e.g. AE)" maxLength={2} error={cErr} />
                          </Field>
                        </div>
                        <div className="col-span-4">
                          <Field label="Ready Date">
                            <Input type="date" value={origin.readyDate} onChange={e => updateOrigin(i, { readyDate: e.target.value })} />
                          </Field>
                        </div>
                        <div className="col-span-12">
                          <Field label="Origin Address" required error={aErr}>
                            <Input value={origin.address} onChange={e => updateOrigin(i, { address: e.target.value })}
                              placeholder="Street, city, region (auto-filled from master)" error={aErr} />
                          </Field>
                        </div>
                        <div className="col-span-12">
                          <Field label="Google Map Location" hint="Optional · auto-filled from master">
                            <Input value={origin.mapLink} onChange={e => updateOrigin(i, { mapLink: e.target.value })}
                              placeholder="https://maps.google.com/?q=…" />
                          </Field>
                        </div>

                        {/* Point of Contact — Col-4 / Col-4 / Col-4 */}
                        <div className="col-span-12 grid grid-cols-12 gap-3 pt-1 border-t" style={{ borderColor:'var(--border)' }}>
                          <div className="col-span-4">
                            <Field label="Contact Name">
                              <Input value={origin.contact} onChange={e => updateOrigin(i, { contact: e.target.value })} placeholder="Full name" />
                            </Field>
                          </div>
                          <div className="col-span-4">
                            <Field label="Mobile">
                              <Input value={origin.mobile} onChange={e => updateOrigin(i, { mobile: e.target.value })} placeholder="+91 XXX XXX XXXX" />
                            </Field>
                          </div>
                          <div className="col-span-4">
                            <Field label="Email" error={eErr}>
                              <Input type="email" value={origin.email} onChange={e => updateOrigin(i, { email: e.target.value })} placeholder="contact@example.com" error={eErr} />
                            </Field>
                          </div>
                        </div>

                        <div className="col-span-6">
                          <Field label="Nearby Landmark">
                            <Input value={origin.landmark} onChange={e => updateOrigin(i, { landmark: e.target.value })} placeholder="Auto-filled from master" />
                          </Field>
                        </div>
                        <div className="col-span-6">
                          <Field label="Notes">
                            <Input value={origin.notes} onChange={e => updateOrigin(i, { notes: e.target.value })} placeholder="Special pickup instructions" />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Destinations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--cyan)' }}>B</div>
                  Destination{(form.destinations?.length ?? 0) > 1 ? 's' : ''}
                  <span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded font-bold ml-1" style={{ background:'var(--bg2)', color:'var(--text2)' }}>
                    {form.destinations?.length ?? 0}
                  </span>
                </h3>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, destinations: [...(f.destinations ?? []), newDestination()] }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Destination
                </button>
              </div>

              <div className="space-y-3">
                {(form.destinations ?? []).map((d, i) => (
                  <div key={d.id} className="rounded-xl border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                    <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--cyan)' }}>{i + 1}</div>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text2)' }}>Destination {i + 1}</span>
                        {d.country && (
                          <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                            {d.country.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {(form.destinations?.length ?? 0) > 1 && (
                        <button type="button"
                          onClick={() => setForm(f => ({ ...f, destinations: f.destinations.filter((_, idx) => idx !== i) }))}
                          className="flex items-center gap-1 px-2 py-1 text-[12.5px] font-semibold rounded-md transition-all" style={{ color:'var(--danger)' }}>
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>

                    {/* KSA / International segmented + Location Master picker */}
                    <div className="px-3 pt-2 pb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Destination Type</span>
                        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor:'var(--border)' }}>
                          {[
                            { id:'ksa',  label:'🇸🇦 Inside KSA',     match: (x) => (x.country ?? '').toUpperCase() === 'SA' },
                            { id:'intl', label:'🌍 International',   match: (x) => (x.country ?? '').toUpperCase() !== 'SA' && !!(x.country ?? '').trim() },
                          ].map(seg => {
                            const active = seg.match(d) || (!d.country && seg.id === 'ksa')
                            return (
                              <button key={seg.id} type="button"
                                onClick={() => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, locationId: null, country: seg.id === 'ksa' ? 'SA' : '', city: '', address: '' } : x) }))}
                                className="px-3 py-1.5 text-[11px] font-bold"
                                style={{
                                  background: active ? 'var(--primary)' : 'var(--card)',
                                  color: active ? '#fff' : 'var(--text2)',
                                }}>
                                {seg.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <Field label="Pick from Location Master" hint="Auto-fills country, city & address · optional">
                        <Select2
                          options={LOCATION_MASTER
                            .filter(l => (d.country ?? '').toUpperCase() === 'SA' ? l.type === 'local' : l.type === 'international' || !d.country)
                            .map(l => ({ id: l.id, label: l.name, sublabel: `${l.country} · ${l.city}` }))}
                          value={d.locationId}
                          onChange={v => {
                            const m = LOCATION_MASTER.find(l => l.id === v)
                            if (!m) {
                              setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, locationId: null } : x) }))
                              return
                            }
                            setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? {
                              ...x, locationId: m.id,
                              country: m.country ?? x.country,
                              city: m.city ?? x.city,
                              address: x.address?.trim() ? x.address : `${m.name}, ${m.city}`,
                              mapLink: x.mapLink?.trim() ? x.mapLink : (m.mapLink ?? ''),
                              landmark: x.landmark?.trim() ? x.landmark : (m.landmark ?? ''),
                            } : x) }))
                          }}
                          getSubLabel={o => o.sublabel}
                          placeholder="Search location…" />
                      </Field>
                    </div>

                    {/* Country quick-picks per destination */}
                    <div className="px-3 pt-2 pb-1">
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Quick pick country</div>
                      <div className="flex flex-wrap gap-1">
                        {COUNTRY_PICKS.map(c => {
                          const active = (d.country ?? '').toUpperCase() === c.code
                          return (
                            <button key={c.code} type="button"
                              onClick={() => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, country: c.code } : x) }))}
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded-md border transition-all"
                              style={active
                                ? { background:'var(--cyan)', color:'#fff', borderColor:'var(--cyan)' }
                                : { background:'var(--bg2)', color:'var(--text2)', borderColor:'var(--border)' }}>
                              {c.code}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="p-3 grid grid-cols-2 gap-3">
                      <Field label="Destination Country" required error={err(`dest_${i}_country`)}>
                        <Input value={d.country}
                          onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, country: e.target.value.toUpperCase() } : x) }))}
                          placeholder="e.g. SA, AE, OM…" maxLength={2} error={err(`dest_${i}_country`)} />
                      </Field>
                      <Field label="Destination Address" required error={err(`dest_${i}_address`)}>
                        <Input value={d.address}
                          onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, address: e.target.value } : x) }))}
                          placeholder="Street, city, region" error={err(`dest_${i}_address`)} />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Google Map Location" hint="Optional">
                          <Input value={d.mapLink}
                            onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, mapLink: e.target.value } : x) }))}
                            placeholder="https://maps.google.com/?q=…" />
                        </Field>
                      </div>
                      <Field label="Nearby Landmark" hint="Optional">
                        <Input value={d.landmark}
                          onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, landmark: e.target.value } : x) }))} />
                      </Field>
                      <Field label="Contact Person" hint="Optional">
                        <Input value={d.contact}
                          onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, contact: e.target.value } : x) }))} />
                      </Field>
                      <Field label="Email" hint="Optional" error={err(`dest_${i}_email`)}>
                        <Input type="email" value={d.email}
                          onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x) }))}
                          error={err(`dest_${i}_email`)} />
                      </Field>
                      <Field label="Mobile" hint="Optional">
                        <Input value={d.mobile}
                          onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, mobile: e.target.value } : x) }))} />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Notes" hint="Optional">
                          <textarea value={d.notes}
                            onChange={e => setForm(f => ({ ...f, destinations: f.destinations.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x) }))}
                            rows={2}
                            className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}
                            placeholder="Delivery instructions…" />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-border error (highlighted) */}
            {err('crossBorder') && (
              <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--danger-light)', borderColor:'rgba(220,38,38,.3)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--danger)' }} />
                <p className="text-xs" style={{ color:'var(--danger)' }}>{err('crossBorder')}</p>
              </div>
            )}

            <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
              <p className="text-[11px]" style={{ color:'var(--text2)' }}>
                <strong>Cross-border rule:</strong> International shipments must cross the KSA border.
                <span className="font-mono ml-1">Outside KSA → KSA</span>,
                <span className="font-mono ml-1">KSA → Outside KSA</span>,
                or multi-stop routes mixing the two. The direction badge above updates as you fill in countries.
              </p>
            </div>
          </div>
          )
        })()}

        {/* Step 3: Financial */}
        {step === 'financial' && (
          <div className="space-y-5">
            {/* Core cost block */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Cost & Currency</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Estimated Shipment Value">
                  <Input type="number" value={form.estValue} onChange={e => set('estValue', e.target.value)} placeholder="50000" />
                </Field>
                <Field label="Currency">
                  <Select2 options={CURRENCIES} value={form.currency} onChange={v => set('currency', v)} />
                </Field>
                <Field label="Freight Terms">
                  <Select2 options={FREIGHT_TERMS.map(f => ({ id: f, label: f }))} value={form.freightTerms} onChange={v => set('freightTerms', v)} />
                </Field>
                <Field label="Payment Terms">
                  <Select2 options={PAYMENT_TERMS.map(p => ({ id: p, label: p }))} value={form.paymentTerms} onChange={v => set('paymentTerms', v)} />
                </Field>
              </div>
            </div>

            {/* Insurance block */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Insurance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <Toggle value={form.insuranceRequired} onChange={v => set('insuranceRequired', v)} label="Insurance Required" hint="Mandatory coverage for this shipment" />
                </div>
                {form.insuranceRequired && (
                  <Field label="Insurance Value">
                    <Input type="number" value={form.insuranceValue} onChange={e => set('insuranceValue', e.target.value)} placeholder="2500" />
                  </Field>
                )}
              </div>
            </div>

            {/* Transit block */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Transit</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <Toggle value={form.transitRequired} onChange={v => set('transitRequired', v)} label="Transit Required" hint="Cross-border or stop-over transit handling" />
                </div>
                {form.transitRequired && (
                  <Field label={`Transit Amount (${form.currency})`}>
                    <Input type="number" value={form.transitAmount} onChange={e => set('transitAmount', e.target.value)} placeholder="0" />
                  </Field>
                )}
              </div>
            </div>

            {/* Cargo Loading block */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Cargo Loading</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <Toggle value={form.cargoLoadingRequired} onChange={v => set('cargoLoadingRequired', v)} label="Cargo Loading Required" hint="Specialized loading/unloading services" />
                </div>
                {form.cargoLoadingRequired && (
                  <Field label={`Cargo Loading Amount (${form.currency})`}>
                    <Input type="number" value={form.cargoLoadingAmount} onChange={e => set('cargoLoadingAmount', e.target.value)} placeholder="0" />
                  </Field>
                )}
              </div>
            </div>

            {/* Timeline block */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Timeline</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Estimated Arrival Date">
                  <Input type="date" value={form.estArrivalDate} onChange={e => set('estArrivalDate', e.target.value)} />
                </Field>
                <Field label="Expected Transit Days" hint="Days from departure to arrival">
                  <Input type="number" value={form.expectedTransitDays} onChange={e => set('expectedTransitDays', e.target.value)} placeholder="14" />
                </Field>
              </div>
              <p className="text-[12.5px] mt-2" style={{ color:'var(--text3)' }}>
                Actual Arrival Date and Actual Transit Days will be auto-populated from the Checklist when the shipment is marked delivered.
              </p>
            </div>

            {/* Total cost preview */}
            <div className="rounded-xl border p-3" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.3)' }}>
              <div className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--primary)' }}>Estimated Total Cost</div>
              {(() => {
                const base = Number(form.estValue ?? 0)
                const ins  = form.insuranceRequired ? Number(form.insuranceValue ?? 0) : 0
                const tr   = form.transitRequired ? Number(form.transitAmount ?? 0) : 0
                const cl   = form.cargoLoadingRequired ? Number(form.cargoLoadingAmount ?? 0) : 0
                const total = base + ins + tr + cl
                return (
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Shipment</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>{form.currency} {base.toLocaleString()}</div></div>
                    <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Insurance</div><div className="font-mono font-bold" style={{ color: ins ? 'var(--text)' : 'var(--text3)' }}>{form.currency} {ins.toLocaleString()}</div></div>
                    <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Transit</div><div className="font-mono font-bold" style={{ color: tr ? 'var(--text)' : 'var(--text3)' }}>{form.currency} {tr.toLocaleString()}</div></div>
                    <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Cargo Loading</div><div className="font-mono font-bold" style={{ color: cl ? 'var(--text)' : 'var(--text3)' }}>{form.currency} {cl.toLocaleString()}</div></div>
                    <div className="border-l-2 pl-2" style={{ borderColor:'var(--primary)' }}><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--primary)' }}>Total</div><div className="font-mono font-bold text-sm" style={{ color:'var(--primary)' }}>{form.currency} {total.toLocaleString()}</div></div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Step 4: Cargo Dimensions */}
        {step === 'cargo' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Cargo</h3>
                <p className="text-[11px]" style={{ color:'var(--text3)' }}>{form.cargo.filter(c => c.active).length} active · {form.cargo.length} total — each card represents one cargo unit</p>
              </div>
              <button onClick={openAddCargo} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                <Plus className="w-3.5 h-3.5" /> Add Cargo
              </button>
            </div>

            {form.cargo.length === 0 ? (
              <div className="rounded-xl border border-dashed py-12 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <Box className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No cargo added yet</p>
                <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>Click <strong>Add Cargo</strong> to define what's being shipped — dimensions, weight, package type and images.</p>
                <button onClick={openAddCargo} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Your First Cargo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {form.cargo.map((c, i) => {
                  const dim = [c.length, c.width, c.height].filter(Boolean).join('×') || '—'
                  return (
                    <div key={c.id}
                      className="rounded-xl border overflow-hidden transition-all"
                      style={{ ...C, opacity: c.active ? 1 : 0.55 }}>
                      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--primary)' }}>#{i + 1}</div>
                          <div>
                            <div className="text-xs font-bold leading-tight" style={{ color:'var(--text)' }}>{c.name || `Cargo ${i + 1}`}</div>
                            <div className="text-[9px]" style={{ color:'var(--text3)' }}>{c.packageType ?? 'Pallet'} · Qty {c.quantity ?? c.packages ?? 1}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => openEditCargo(c)} className="w-7 h-7 rounded-md flex items-center justify-center" title="Edit" style={{ color:'var(--text2)' }}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deactivateCargo(c.id)} className="w-7 h-7 rounded-md flex items-center justify-center" title={c.active ? 'Deactivate' : 'Reactivate'} style={{ color: c.active ? 'var(--warning)' : 'var(--success)' }}>
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeCargo(c.id)} className="w-7 h-7 rounded-md flex items-center justify-center" title="Remove" style={{ color:'var(--danger)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        {/* Image strip */}
                        {(c.images?.length ?? 0) > 0 && (
                          <div className="flex gap-1.5 mb-1">
                            {c.images.slice(0, 3).map((img, idx) => (
                              <div key={idx} className="w-12 h-12 rounded-md bg-cover bg-center border" style={{ backgroundImage:`url(${img})`, borderColor:'var(--border)' }} />
                            ))}
                            {c.images.length > 3 && (
                              <div className="w-12 h-12 rounded-md flex items-center justify-center text-[12.5px] font-bold border" style={{ background:'var(--bg2)', color:'var(--text3)', borderColor:'var(--border)' }}>+{c.images.length - 3}</div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-[12.5px]">
                          {[
                            { l:'Weight',     v: c.weight ? `${c.weight} ${c.weightUnit ?? 'KG'}` : '—' },
                            { l:'Dimensions', v: dim !== '—' ? `${dim} ${c.unit ?? 'CM'}` : '—' },
                            { l:'Volume',     v: c.volume ? `${c.volume} m³` : '—' },
                          ].map(({ l, v }) => (
                            <div key={l}>
                              <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</div>
                              <div className="text-[11px] font-mono font-bold truncate" style={{ color:'var(--text)' }}>{v}</div>
                            </div>
                          ))}
                        </div>

                        {(c.hazardous || c.specialHandling) && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t" style={{ borderColor:'var(--border)' }}>
                            {c.hazardous && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background:'rgba(220,38,38,.1)', color:'var(--danger)' }}>⚠ Hazardous</span>}
                            {c.specialHandling && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.1)', color:'var(--warning)' }}>{c.specialHandling}</span>}
                          </div>
                        )}

                        {c.notes && (
                          <div className="text-[12.5px] line-clamp-2 pt-1 border-t" style={{ color:'var(--text3)', borderColor:'var(--border)' }}>{c.notes}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Items */}
        {step === 'items' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Shipment Items</h3>
                <p className="text-[11px]" style={{ color:'var(--text3)' }}>{form.items.filter(i => i.active).length} active · {form.items.length} total — click any card to expand details</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setInvPickerOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
                  <Boxes className="w-3.5 h-3.5" /> From Inventory
                </button>
                <button onClick={openAddItem} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            </div>

            {form.items.length === 0 ? (
              <div className="rounded-xl border border-dashed py-12 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <Package className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No items added yet</p>
                <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>Add the line items being shipped — material code, HS code, quantity and declared value.</p>
                <button onClick={openAddItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Your First Item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {form.items.map((it, i) => {
                  const expanded = expandedItems.has(it.id)
                  return (
                    <div key={it.id} className="rounded-xl border overflow-hidden transition-all" style={{ ...C, opacity: it.active ? 1 : 0.55 }}>
                      <button onClick={() => toggleExpanded(it.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <ChevronRight className="w-4 h-4 transition-transform" style={{ color:'var(--text3)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--primary)' }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{it.description || `Item ${i + 1}`}</div>
                          <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>
                            {it.materialCode ? `${it.materialCode} · ` : ''}HS {it.hsCode || '—'} · Qty {it.quantity || '—'} {it.unit || ''}
                          </div>
                        </div>
                        {it.declaredValue && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                            SAR {Number(it.declaredValue).toLocaleString()}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditItem(it)} className="w-7 h-7 rounded-md flex items-center justify-center" title="Edit" style={{ color:'var(--text2)' }}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deactivateItem(it.id)} className="w-7 h-7 rounded-md flex items-center justify-center" title={it.active ? 'Deactivate' : 'Reactivate'} style={{ color: it.active ? 'var(--warning)' : 'var(--success)' }}>
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeItem(it.id)} className="w-7 h-7 rounded-md flex items-center justify-center" title="Remove" style={{ color:'var(--danger)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </button>

                      {expanded && (
                        <div className="px-4 py-3 border-t grid grid-cols-4 gap-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                          {[
                            { l:'Material Code', v: it.materialCode || '—' },
                            { l:'HS Code',       v: it.hsCode       || '—' },
                            { l:'Quantity',      v: it.quantity ? `${it.quantity} ${it.unit ?? ''}` : '—' },
                            { l:'Weight',        v: it.weight ? `${it.weight} KG` : '—' },
                            { l:'Declared Value',v: it.declaredValue ? `SAR ${Number(it.declaredValue).toLocaleString()}` : '—' },
                            { l:'Country',       v: it.origin || '—' },
                          ].map(({ l, v }) => (
                            <div key={l}>
                              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
                              <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{v}</div>
                            </div>
                          ))}
                          {it.notes && (
                            <div className="col-span-4">
                              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Notes</div>
                              <div className="text-[11px]" style={{ color:'var(--text2)' }}>{it.notes}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Documents */}
        {step === 'documents' && (() => {
          const MANDATORY = ['Commercial Invoice', 'Packing List', 'Export Permit']
          const uploadedTypes = (form.documents ?? []).map(d => d.type)
          const missing = MANDATORY.filter(m => !uploadedTypes.includes(m))
          return (
          <div className="space-y-4">
            {/* Missing documents alert */}
            {missing.length > 0 && (
              <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--danger-light)', borderColor:'rgba(220,38,38,.3)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--danger)' }} />
                <div className="flex-1">
                  <div className="text-xs font-bold mb-1" style={{ color:'var(--danger)' }}>
                    {missing.length} mandatory document{missing.length === 1 ? '' : 's'} missing
                  </div>
                  <div className="text-[11px]" style={{ color:'var(--danger)' }}>
                    Please upload: {missing.map(m => <span key={m} className="font-bold">{m}</span>).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}.
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--text3)' }} />
              <p className="text-sm font-medium mb-1" style={{ color:'var(--text)' }}>Drag & drop documents or click to upload</p>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Mandatory documents are highlighted with red border below</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['PO','Commercial Invoice','Packing List','Export Permit','Certificate of Origin','Insurance','Customs Documents','Other'].map(t => {
                const isMandatory = MANDATORY.includes(t)
                const uploaded    = uploadedTypes.includes(t)
                return (
                  <button key={t} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all"
                    style={{
                      background: uploaded ? 'rgba(5,150,105,.08)' : 'var(--card)',
                      borderColor: isMandatory && !uploaded ? 'var(--danger)' : (uploaded ? 'var(--success)' : 'var(--border)'),
                      color: 'var(--text2)',
                    }}>
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" style={{ color: isMandatory && !uploaded ? 'var(--danger)' : (uploaded ? 'var(--success)' : 'var(--text3)') }} />
                      <span>{t}</span>
                      {isMandatory && <span style={{ color:'var(--danger)', fontWeight: 'bold' }}>*</span>}
                    </span>
                    {uploaded ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color:'var(--success)' }} /> : (
                      isMandatory && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background:'var(--danger)', color:'#fff' }}>REQUIRED</span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>
              Document preview, download, and version history are available once files are uploaded.
              <span className="ml-1"><span style={{ color:'var(--danger)' }}>*</span> Mandatory for international shipments.</span>
            </p>
          </div>
          )
        })()}

        {/* Step 7: Review */}
        {step === 'review' && (() => {
          // Calculations
          const activeCargo = form.cargo.filter(c => c.active)
          const totalWeight = activeCargo.reduce((sum, c) => sum + (Number(c.weight) * Number(c.quantity ?? c.packages ?? 1) || 0), 0)
          const totalVolume = activeCargo.reduce((sum, c) => {
            if (c.volume) return sum + (Number(c.volume) * Number(c.quantity ?? c.packages ?? 1) || 0)
            // Derive from dimensions in m³ (assuming CM)
            const [l, w, h] = [Number(c.length), Number(c.width), Number(c.height)]
            if (l && w && h) return sum + (l * w * h / 1_000_000) * Number(c.quantity ?? c.packages ?? 1)
            return sum
          }, 0)
          const destCount = (form.destinations ?? []).length

          // Build route string: Origin(s) → Dest1 → Dest2 → …
          const originLabels = (form.origins ?? []).map(o => o.country || o.city || 'Origin').filter(Boolean)
          const originPart = originLabels.length === 0 ? 'Origin' : (originLabels.length === 1 ? originLabels[0] : `${originLabels.length} origins (${originLabels.join(' + ')})`)
          const routeParts = [
            originPart,
            ...(form.destinations ?? []).map((d, i) => d.country || d.address?.split(',')[0] || `Dest ${i + 1}`),
          ]
          const routeStr = routeParts.join(' → ')

          // Estimated transit time — heuristic based on mode + dest count
          const baseTransit = (() => {
            const modes = form.modes ?? []
            if (modes.includes('air'))  return 3
            if (modes.includes('rail')) return 5
            if (modes.includes('land')) return 7
            if (modes.includes('sea'))  return 21
            return 6
          })()
          const transitTime = baseTransit + (destCount > 1 ? (destCount - 1) * 2 : 0)

          // Mandatory documents check
          const MANDATORY = ['Commercial Invoice', 'Packing List', 'Export Permit']
          const uploadedTypes = (form.documents ?? []).map(d => d.type)
          const missingDocs = MANDATORY.filter(m => !uploadedTypes.includes(m))

          return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Final Review</h3>

            {/* Calculation tiles — the spec's required summary numbers */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { l:'Transit Time',      v:`${transitTime}d`,                              c:'var(--primary)', icon:Plane },
                { l:'Total Weight',      v:`${totalWeight.toLocaleString()} KG`,           c:'var(--cyan)',    icon:Box },
                { l:'Total Volume',      v:`${totalVolume.toFixed(2)} m³`,                 c:'#8B5CF6',        icon:Box },
                { l:'Destinations',      v: destCount,                                      c:'var(--success)', icon:MapPin },
                { l:'Documents Uploaded',v:`${form.documents.length}${missingDocs.length > 0 ? ` / missing ${missingDocs.length}` : ''}`, c: missingDocs.length > 0 ? 'var(--danger)' : 'var(--success)', icon:FileText },
              ].map(({ l, v, c, icon:Icon }) => (
                <div key={l} className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${c}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" style={{ color: c }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
                  </div>
                  <div className="text-lg font-black font-mono" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Route summary hero card */}
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background:'linear-gradient(135deg, var(--primary-light) 0%, var(--bg2) 100%)', borderColor:'rgba(37,99,235,.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'var(--primary)' }}>
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--primary)' }}>Route Summary</div>
                <div className="text-base font-bold truncate" style={{ color:'var(--text)' }}>{routeStr}</div>
                <div className="text-[11px] mt-0.5" style={{ color:'var(--text2)' }}>
                  Estimated transit time: <strong>{transitTime} days</strong> ({(form.modes ?? []).map(m => ({air:'Air',sea:'Sea',land:'Land',rail:'Rail',courier:'Courier',multimodal:'Multimodal'}[m])).filter(Boolean).join(' + ') || '—'})
                </div>
              </div>
            </div>

            {/* Missing docs alert */}
            {missingDocs.length > 0 && (
              <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--danger-light)', borderColor:'rgba(220,38,38,.3)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--danger)' }} />
                <div className="flex-1">
                  <div className="text-xs font-bold mb-1" style={{ color:'var(--danger)' }}>{missingDocs.length} mandatory document{missingDocs.length === 1 ? '' : 's'} still missing</div>
                  <div className="text-[11px]" style={{ color:'var(--danger)' }}>Go back to Documents step to upload: <strong>{missingDocs.join(', ')}</strong></div>
                </div>
              </div>
            )}

            {/* Section details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Shipment Details</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Shipment #</span><span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{previewId}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>PO Number</span><span style={{ color:'var(--text)' }}>{form.poNumber || '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Supplier</span><span style={{ color:'var(--text)' }}>{selectedVendor?.name ?? '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Incoterm</span><span style={{ color:'var(--text)' }}>{form.incoterm || '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Mode</span><span style={{ color:'var(--text)' }}>{(form.modes ?? []).map(m => SHIPMENT_MODES.find(x => x.id === m)?.label).filter(Boolean).join(' + ') || '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Project</span><span style={{ color:'var(--text)' }}>{projects.find(p => p.id === form.project)?.name || '—'}</span></div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b flex items-center justify-between" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Origins ({(form.origins ?? []).length})</span>
                </div>
                <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                  {(form.origins ?? []).map((o, i) => (
                    <div key={o.id} className="px-3 py-2 flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background:'var(--primary)' }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                          {o.country || '—'}
                          {o.city && <span className="text-[12.5px] font-normal" style={{ color:'var(--text3)' }}>· {o.city}</span>}
                        </div>
                        <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>{o.address || '—'}</div>
                        {(o.contact || o.mobile || o.email) && (
                          <div className="text-[12.5px] mt-0.5 flex items-center gap-2" style={{ color:'var(--text3)' }}>
                            {o.contact && <span>👤 {o.contact}</span>}
                            {o.mobile && <span>📱 {o.mobile}</span>}
                            {o.email && <span className="truncate">✉ {o.email}</span>}
                          </div>
                        )}
                      </div>
                      {o.readyDate && <span className="font-mono text-[12.5px]" style={{ color:'var(--text3)' }}>{o.readyDate}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden col-span-2" style={C}>
                <div className="px-3 py-2 border-b flex items-center justify-between" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Destinations ({destCount})</span>
                </div>
                <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                  {(form.destinations ?? []).map((d, i) => (
                    <div key={d.id} className="px-3 py-2 flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background:'var(--cyan)' }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold" style={{ color:'var(--text)' }}>{d.country || '—'} · {d.address || 'No address'}</div>
                        <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>
                          {d.contact && <span>👤 {d.contact}</span>}
                          {d.mobile  && <span className="ml-2">📞 {d.mobile}</span>}
                          {d.email   && <span className="ml-2">✉ {d.email}</span>}
                          {d.landmark && <span className="ml-2">📍 {d.landmark}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Cargo & Items</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Cargo units</span><span style={{ color:'var(--text)' }}>{activeCargo.length} active</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Total weight</span><span className="font-mono" style={{ color:'var(--text)' }}>{totalWeight.toLocaleString()} KG</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Total volume</span><span className="font-mono" style={{ color:'var(--text)' }}>{totalVolume.toFixed(2)} m³</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Items</span><span style={{ color:'var(--text)' }}>{form.items.filter(i => i.active).length} active</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Documents</span><span style={{ color:'var(--text)' }}>{form.documents.length} uploaded</span></div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={C}>
                <div className="px-3 py-2 border-b text-[12.5px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>Financial</div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Est Value</span><span className="font-mono" style={{ color:'var(--text)' }}>{form.currency} {Number(form.estValue || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Insurance</span><span className="font-mono" style={{ color:'var(--text)' }}>{form.insuranceRequired ? `${form.currency} ${Number(form.insuranceValue || 0).toLocaleString()}` : 'Not required'}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Freight Terms</span><span style={{ color:'var(--text)' }}>{form.freightTerms}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Payment Terms</span><span style={{ color:'var(--text)' }}>{form.paymentTerms}</span></div>
                </div>
              </div>
            </div>
          </div>
          )
        })()}
      </div>

      {/* Bottom navigation */}
      <div className="rounded-xl border p-3 flex items-center justify-between flex-wrap gap-2" style={C}>
        <button onClick={goPrev} disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <div className="text-[11px]" style={{ color:'var(--text3)' }}>
          Step <strong style={{ color:'var(--text)' }}>{stepIdx+1}</strong> of {STEPS.length} · Save Draft available at any step
        </div>
        {!isLast ? (
          <button onClick={goNext} className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button onClick={() => setConfirmOpen('submit')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
              <Check className="w-4 h-4" /> Submit
            </button>
            <button onClick={() => setConfirmOpen('approval')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--success)' }}>
              <Send className="w-4 h-4" /> Send for Approval
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <EnterpriseModal
        open={!!confirmOpen}
        onClose={() => !saving && setConfirmOpen(null)}
        title="Confirm Shipment Submission"
        subtitle={previewId}
        icon={<Plane className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(null)} disabled={saving}>Back</ModalBtn>
          <ModalBtn onClick={() => finalize(confirmOpen)} loading={saving}>
            {confirmOpen === 'approval' ? 'Send for Approval' : 'Submit Shipment'}
          </ModalBtn>
        </>}>
        <div className="space-y-3">
          <div className="rounded-xl border p-4" style={{ borderColor:'var(--border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Shipment Summary</h4>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs mb-3">
              <SummaryRow k="PO Number"  v={form.poNumber} />
              <SummaryRow k="Incoterm"   v={form.incoterm} />
              <SummaryRow k="Modes"      v={(form.modes ?? []).map(m => ({air:'Air',sea:'Sea',land:'Land',rail:'Rail',courier:'Courier',multimodal:'Multimodal'}[m])).filter(Boolean).join(' + ') || '—'} />
              <SummaryRow k="Project"    v={projects.find(p => p.id === form.project)?.name ?? form.project} />
              <SummaryRow k="Owner"      v={users.find(u => u.id === form.owner)?.name ?? form.owner} />
              <SummaryRow k="Currency"   v={form.currency} />
              <SummaryRow k="Origins"    v={`${form.origins?.length ?? 0} location(s)`} />
              <SummaryRow k="Destinations" v={`${form.destinations?.length ?? 0} location(s)`} />
              <SummaryRow k="Items"      v={`${(form.items ?? []).filter(i => i.active !== false).length} item(s)`} />
              <SummaryRow k="Cargo Units" v={`${(form.cargo ?? []).length} unit(s)`} />
              <SummaryRow k="Documents"  v={`${(form.documents ?? []).filter(d => d.file).length} file(s)`} />
              <SummaryRow k="Est. Arrival" v={form.estArrivalDate ? new Date(form.estArrivalDate).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'} />
            </div>

            <h4 className="text-xs font-bold uppercase tracking-widest mb-2 pb-1.5 mt-3" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Cost Breakdown</h4>
            {(() => {
              const base = Number(form.estValue ?? 0)
              const ins  = form.insuranceRequired ? Number(form.insuranceValue ?? 0) : 0
              const tr   = form.transitRequired ? Number(form.transitAmount ?? 0) : 0
              const cl   = form.cargoLoadingRequired ? Number(form.cargoLoadingAmount ?? 0) : 0
              const total = base + ins + tr + cl
              const cur = form.currency
              return (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Estimated Value</span><span className="font-mono font-bold" style={{ color:'var(--text)' }}>{cur} {base.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: form.insuranceRequired ? 'var(--text3)' : 'var(--text3)' }}>Insurance {!form.insuranceRequired && '(off)'}</span><span className="font-mono" style={{ color: form.insuranceRequired ? 'var(--text)' : 'var(--text3)' }}>{cur} {ins.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Transit {!form.transitRequired && '(off)'}</span><span className="font-mono" style={{ color: form.transitRequired ? 'var(--text)' : 'var(--text3)' }}>{cur} {tr.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Cargo Loading {!form.cargoLoadingRequired && '(off)'}</span><span className="font-mono" style={{ color: form.cargoLoadingRequired ? 'var(--text)' : 'var(--text3)' }}>{cur} {cl.toLocaleString()}</span></div>
                  <div className="flex justify-between pt-1.5 mt-1.5" style={{ borderTop:'1px solid var(--border)' }}>
                    <span className="font-bold" style={{ color:'var(--primary)' }}>Total Estimated</span>
                    <span className="font-mono font-bold text-sm" style={{ color:'var(--primary)' }}>{cur} {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Payment Terms</span><span style={{ color:'var(--text2)' }}>{form.paymentTerms}</span></div>
                </div>
              )
            })()}
          </div>

          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'rgba(5,150,105,.3)' }}>
            <Send className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--success)' }} />
            <div className="flex-1 text-xs" style={{ color:'var(--text2)' }}>
              <div className="font-bold mb-1" style={{ color:'var(--success)' }}>RFQ will be auto-created</div>
              <p className="text-[11px]">On submission, an RFQ workflow is created on the shipment profile. From there, you can select vendors and dispatch the request — replies populate in the Quotes tab.</p>
            </div>
          </div>

          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {confirmOpen === 'approval'
                ? <>The shipment will be routed to the approval workflow. Approvers will be notified by email.</>
                : <>The shipment will move from <strong>Draft</strong> → <strong>Submitted</strong> and operations will be notified.</>}
            </p>
          </div>
        </div>
      </EnterpriseModal>

      {/* ── Cargo Side Modal (60% via xl) ───────────────────────────── */}
      <EnterpriseModal
        open={!!cargoModal}
        onClose={() => setCargoModal(null)}
        title={cargoModal?.mode === 'edit' ? 'Edit Cargo' : 'Add Cargo'}
        subtitle={cargoModal?.draft?.name || 'New cargo unit'}
        icon={<Box className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="xl"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setCargoModal(null)}>Cancel</ModalBtn>
          <ModalBtn onClick={saveCargoModal}>
            {cargoModal?.mode === 'edit' ? 'Save Changes' : 'Add Cargo'}
          </ModalBtn>
        </>}>
        {cargoModal && (() => {
          const d  = cargoModal.draft
          const upd = (patch) => setCargoModal(m => ({ ...m, draft: { ...m.draft, ...patch } }))
          const onFiles = (files) => {
            const arr = Array.from(files).slice(0, 3 - (d.images?.length ?? 0))
            arr.forEach(f => {
              const reader = new FileReader()
              reader.onload = () => upd({ images: [...(d.images ?? []), reader.result] })
              reader.readAsDataURL(f)
            })
          }
          const removeImage = (idx) => upd({ images: d.images.filter((_, i) => i !== idx) })
          return (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Cargo Name">
                  <Input value={d.name} onChange={e => upd({ name: e.target.value })} placeholder="e.g. Generator Set" />
                </Field>
              </div>

              {/* Dimensions */}
              <div className="col-span-2 rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text3)' }}>Dimensions <span style={{ color:'var(--danger)' }}>*</span></div>
                <div className="grid grid-cols-4 gap-2">
                  <Field label="Length"><Input type="number" value={d.length} onChange={e => upd({ length: e.target.value })} placeholder="0" /></Field>
                  <Field label="Width"> <Input type="number" value={d.width}  onChange={e => upd({ width:  e.target.value })} placeholder="0" /></Field>
                  <Field label="Height"><Input type="number" value={d.height} onChange={e => upd({ height: e.target.value })} placeholder="0" /></Field>
                  <Field label="Unit">
                    <select value={d.unit} onChange={e => upd({ unit: e.target.value })}
                      className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }}>
                      {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Weight + Quantity */}
              <div className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text3)' }}>Weight <span style={{ color:'var(--danger)' }}>*</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Weight"><Input type="number" value={d.weight} onChange={e => upd({ weight: e.target.value })} placeholder="0" /></Field>
                  <Field label="Unit">
                    <select value={d.weightUnit} onChange={e => upd({ weightUnit: e.target.value })}
                      className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }}>
                      {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text3)' }}>Package <span style={{ color:'var(--danger)' }}>*</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Package Type">
                    <select value={d.packageType ?? 'Pallet'} onChange={e => upd({ packageType: e.target.value })}
                      className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }}>
                      {['Pallet','Box','Crate','Drum','Bag','Bundle','Container','Loose'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Quantity"><Input type="number" value={d.quantity ?? 1} onChange={e => upd({ quantity: e.target.value })} placeholder="1" min="1" /></Field>
                </div>
              </div>

              {/* Volume + Special Handling */}
              <Field label="Volume (m³)" hint="Optional">
                <Input type="number" value={d.volume} onChange={e => upd({ volume: e.target.value })} placeholder="0" />
              </Field>
              <Field label="Special Handling" hint="Optional">
                <Input value={d.specialHandling ?? ''} onChange={e => upd({ specialHandling: e.target.value })} placeholder="e.g. Fragile, Keep Upright" />
              </Field>

              {/* Hazardous toggle */}
              <div className="col-span-2 flex items-center gap-2">
                <button type="button" onClick={() => upd({ hazardous: !d.hazardous })}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: d.hazardous ? 'var(--danger)' : 'var(--border)' }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: d.hazardous ? '22px' : '2px' }} />
                </button>
                <span className="text-xs font-bold" style={{ color: d.hazardous ? 'var(--danger)' : 'var(--text2)' }}>
                  {d.hazardous ? '⚠ Hazardous Material' : 'Not hazardous'}
                </span>
              </div>

              {/* Images drag-drop */}
              <div className="col-span-2">
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>
                  Cargo Images <span className="font-normal normal-case tracking-normal" style={{ color:'var(--text3)' }}>(up to 3 photos · drag & drop or click)</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)' }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border2)'; onFiles(e.dataTransfer.files) }}
                  className="rounded-xl border-2 border-dashed p-4"
                  style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                  <div className="flex items-center gap-3">
                    {(d.images ?? []).map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg border overflow-hidden flex-shrink-0 group" style={{ borderColor:'var(--border)' }}>
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage:`url(${img})` }} />
                        <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:'var(--danger)', color:'#fff' }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(d.images?.length ?? 0) < 3 && (
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-current"
                        style={{ borderColor:'var(--border2)', color:'var(--text3)' }}>
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-bold">UPLOAD</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                      </label>
                    )}
                    {(d.images?.length ?? 0) === 0 && (
                      <span className="text-[11px]" style={{ color:'var(--text3)' }}>Drop images here or click to upload (PNG, JPG)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <Field label="Notes" hint="Optional">
                  <textarea value={d.notes} onChange={e => upd({ notes: e.target.value })} rows={2}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}
                    placeholder="Any additional handling instructions…" />
                </Field>
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>

      {/* ── Item Side Modal ─────────────────────────────────────────── */}
      <EnterpriseModal
        open={!!itemModal}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === 'edit' ? 'Edit Item' : 'Add Item'}
        subtitle={itemModal?.draft?.description || 'Shipment line item'}
        icon={<Package className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="xl"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setItemModal(null)}>Cancel</ModalBtn>
          <ModalBtn onClick={saveItemModal}>
            {itemModal?.mode === 'edit' ? 'Save Changes' : 'Add Item'}
          </ModalBtn>
        </>}>
        {itemModal && (() => {
          const d   = itemModal.draft
          const upd = (patch) => setItemModal(m => ({ ...m, draft: { ...m.draft, ...patch } }))
          return (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Item Name / Description"><Input value={d.description} onChange={e => upd({ description: e.target.value })} placeholder="e.g. Generator Set 500 kVA" /></Field>
              </div>
              <Field label="Material Code"><Input value={d.materialCode} onChange={e => upd({ materialCode: e.target.value })} placeholder="SAP-1001" /></Field>
              <Field label="HS Code" hint="Harmonized System code"><Input value={d.hsCode} onChange={e => upd({ hsCode: e.target.value })} placeholder="850110" /></Field>
              <Field label="Quantity"><Input type="number" value={d.quantity} onChange={e => upd({ quantity: e.target.value })} placeholder="1" /></Field>
              <Field label="Unit"><Input value={d.unit} onChange={e => upd({ unit: e.target.value })} placeholder="EA / KG / M" /></Field>
              <Field label="Weight (KG)" hint="Optional"><Input type="number" value={d.weight ?? ''} onChange={e => upd({ weight: e.target.value })} placeholder="0" /></Field>
              <Field label="Declared Value (SAR)" hint="Optional"><Input type="number" value={d.declaredValue ?? ''} onChange={e => upd({ declaredValue: e.target.value })} placeholder="0" /></Field>
              <Field label="Country of Origin" hint="2-letter code"><Input value={d.origin} onChange={e => upd({ origin: e.target.value.toUpperCase() })} maxLength={2} placeholder="IN" /></Field>
              <div className="col-span-2">
                <Field label="Notes" hint="Optional"><Input value={d.notes} onChange={e => upd({ notes: e.target.value })} /></Field>
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>

      {/* ─── Inventory Picker Modal ─────────────────────────────────────── */}
      <EnterpriseModal open={invPickerOpen} onClose={() => { setInvPickerOpen(false); setInvSearch('') }}
        title="Add Items from Inventory" subtitle="Pick from SAP-synced inventory · pre-fills item fields"
        icon={<Boxes className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="xl"
        footer={<ModalBtn variant="secondary" onClick={() => { setInvPickerOpen(false); setInvSearch('') }}>Done</ModalBtn>}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
            <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Search inventory by name, SAP ID, category…"
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm border focus:outline-none"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', maxHeight: 360, overflowY: 'auto' }}>
            <table className="w-full text-xs">
              <thead style={{ background:'var(--bg2)', position:'sticky', top: 0 }}>
                <tr>
                  {['Item','SAP ID','Category','Stock','Unit Cost',''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter(i => !invSearch || i.name.toLowerCase().includes(invSearch.toLowerCase()) || i.sapId.toLowerCase().includes(invSearch.toLowerCase()) || i.category.toLowerCase().includes(invSearch.toLowerCase()))
                  .map(inv => {
                    const alreadyAdded = (form.items ?? []).some(it => it.inventoryId === inv.id)
                    return (
                      <tr key={inv.id} style={{ borderTop:'1px solid var(--border)' }}>
                        <td className="px-3 py-2" style={{ color:'var(--text)' }}>
                          <div className="font-bold">{inv.name}</div>
                          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>per {inv.unit}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[12.5px]"><span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}><Hash className="w-2.5 h-2.5" />{inv.sapId}</span></td>
                        <td className="px-3 py-2"><span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{inv.category}</span></td>
                        <td className="px-3 py-2 font-mono font-bold" style={{ color: inv.stock > inv.minStock ? 'var(--text)' : 'var(--warning)' }}>{inv.stock}</td>
                        <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>SAR {inv.unitCost.toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => {
                            const newItem = {
                              ...newItemRow(),
                              inventoryId: inv.id,
                              materialCode: inv.sapId,
                              description: inv.name,
                              unit: inv.unit,
                              quantity: 1,
                              declaredValue: inv.unitCost,
                              active: true,
                            }
                            set('items', [...(form.items ?? []), newItem])
                            toast.success('Added from inventory', `${inv.name} · ${inv.sapId}`)
                          }}
                            disabled={alreadyAdded}
                            className="px-2.5 py-1 text-[12.5px] font-bold rounded-md flex items-center gap-1 disabled:opacity-50 text-white"
                            style={{ background: alreadyAdded ? 'var(--text3)' : 'var(--primary)' }}>
                            <Plus className="w-3 h-3" /> {alreadyAdded ? 'Added' : 'Add'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                {inventory.filter(i => !invSearch || i.name.toLowerCase().includes(invSearch.toLowerCase()) || i.sapId.toLowerCase().includes(invSearch.toLowerCase())).length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center" style={{ color:'var(--text3)' }}>No inventory matches "{invSearch}"</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Adding from inventory pre-fills Material Code, Description, Unit & Declared Value. Edit the item afterwards to add HS Code and other customs fields.</p>
        </div>
      </EnterpriseModal>

    </div>
  )
}

// ─── Summary row used in the detailed submit confirmation modal ──────────
function SummaryRow({ k, v }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{k}</div>
      <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{v || '—'}</div>
    </div>
  )
}
