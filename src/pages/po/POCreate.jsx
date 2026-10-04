// PO Create — clean 5-step wizard
// Steps: Basic · Inventory · Commercial · Payment Schedule (w/ reminders) · Review
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Send, Check, Eye, Plus, Trash2, Search, X,
  FileText, Briefcase, DollarSign, Calendar, Info, AlertCircle, AlertTriangle, Package, Bell,
} from 'lucide-react'
import usePoStore from '../../store/poStore'
import useVendorV2Store from '../../store/vendorV2Store'
import useToastStore from '../../store/toastStore'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  PO_TYPES, INCOTERMS, CURRENCIES, PAYMENT_PRESETS, PAYMENT_TRIGGERS,
  nextPoId, generateMilestonesFromPreset, computeReminderDate,
} from '../../api/mock/poData'
import { INVENTORY_MASTER, INVENTORY_CATEGORIES } from '../../api/mock/financeData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtMoney = (n) => (Number(n) || 0).toLocaleString()
const todayISO = () => new Date().toISOString().slice(0, 10)
const inNDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const STEPS = [
  { id:'basic',     num:1, label:'Basic Info',       icon: FileText  },
  { id:'inventory', num:2, label:'Inventory & Items',icon: Package   },
  { id:'commercial',num:3, label:'Commercial Terms', icon: Briefcase },
  { id:'payment',   num:4, label:'Payment Schedule', icon: DollarSign },
  { id:'review',    num:5, label:'Review & Submit',  icon: Eye       },
]

export default function POCreate() {
  const navigate = useNavigate()
  const { pos, createPo } = usePoStore()
  const { vendors: vendorMaster } = useVendorV2Store()
  const toast = useToastStore()
  const eligibleVendors = useMemo(() => vendorMaster.filter(v => v.status === 'active'), [vendorMaster])

  const [step, setStep] = useState('basic')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState('all')

  const [autoPoNumber, setAutoPoNumber] = useState(true)
  const [form, setForm] = useState(() => ({
    id: '',
    referenceNumber: '',
    type: 'manufacturing',
    creationDate: todayISO(),
    expectedCompletionDate: inNDays(30),
    vendorId: null, vendorName: '', vendorContact: '', vendorEmail: '', vendorPhone: '',
    items: [],                            // [{ id, name, sku, qty, unitPrice, lineTotal }]
    incoterm: 'FOB',
    currency: 'SAR',
    totalAmount: 0,                       // computed from items but can be overridden
    overrideTotal: false,
    paymentPresetId: '25_75',
    milestones: generateMilestonesFromPreset('25_75', 0),
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Generate suggested PO id
  const suggestedId = useMemo(() => autoPoNumber ? nextPoId(pos) : (form.id || ''), [autoPoNumber, pos, form.id])

  // Vendor change auto-fill
  const onVendorChange = (vendorId) => {
    const v = eligibleVendors.find(x => x.id === vendorId)
    if (v) {
      setForm(f => ({ ...f, vendorId: v.id, vendorName: v.name, vendorContact: v.primaryContact?.name ?? '', vendorEmail: v.primaryContact?.email ?? '', vendorPhone: v.primaryContact?.mobile ?? v.primaryContact?.office ?? '' }))
    } else {
      setForm(f => ({ ...f, vendorId: null, vendorName:'', vendorContact:'', vendorEmail:'', vendorPhone:'' }))
    }
  }

  // Item handlers
  const addItem = (invItem) => setForm(f => ({
    ...f,
    items: [...f.items, {
      id: `LINE-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      invId: invItem?.id ?? null, name: invItem?.name ?? '', sku: invItem?.sapId ?? '',
      category: invItem?.category ?? '', unit: invItem?.unit ?? 'unit',
      qty: 1, unitPrice: invItem?.unitCost ?? 0, lineTotal: invItem?.unitCost ?? 0,
    }],
  }))
  const updateItem = (idx, patch) => setForm(f => ({
    ...f,
    items: f.items.map((it, i) => {
      if (i !== idx) return it
      const merged = { ...it, ...patch }
      merged.lineTotal = +(Number(merged.qty || 0) * Number(merged.unitPrice || 0)).toFixed(2)
      return merged
    }),
  }))
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  // Computed total
  const computedTotal = useMemo(() => form.items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0), [form.items])
  const effectiveTotal = form.overrideTotal ? (Number(form.totalAmount) || 0) : computedTotal

  // Preset change
  const onPresetChange = (presetId) => {
    setForm(f => ({ ...f, paymentPresetId: presetId, milestones: generateMilestonesFromPreset(presetId, 0, f.creationDate) }))
  }

  // Milestone helpers
  const updateMilestone = (idx, patch) => setForm(f => ({
    ...f,
    milestones: f.milestones.map((m, i) => {
      if (i !== idx) return m
      const merged = { ...m, ...patch }
      // Recompute reminderDate when due date or reminderDays change
      if ('dueDate' in patch || 'reminderDays' in patch) {
        merged.reminderDate = computeReminderDate(merged.dueDate, merged.reminderDays ?? 3)
      }
      return merged
    }),
  }))
  const addMilestone = () => setForm(f => ({
    ...f,
    milestones: [...f.milestones, {
      id: `MS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      label: `Payment ${f.milestones.length + 1}`,
      percentage: 0, trigger: 'agreed_date',
      dueDate: inNDays(30), reminderDays: 7, reminderDate: inNDays(23),
      status: 'pending',
    }],
  }))
  const removeMilestone = (idx) => setForm(f => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }))

  const totalPercent = form.milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0)
  const isHundred = Math.abs(totalPercent - 100) < 0.01
  const hasPartialMilestones = form.milestones.some(m => Number(m.percentage) < 100)

  // Validation
  const stepErrors = useMemo(() => {
    const e = {}
    if (step === 'basic') {
      if (!autoPoNumber && !form.id) e.id = 'PO Number required'
      if (!form.type) e.type = 'PO Type required'
      if (!form.vendorId) e.vendor = 'Vendor required'
    }
    if (step === 'inventory') {
      if (form.items.length === 0) e.items = 'Add at least one item (or skip and override total in step 3)'
      form.items.forEach((it, i) => {
        if (!it.name) e[`it_${i}_name`] = `Item ${i + 1}: name required`
        if (!(Number(it.qty) > 0)) e[`it_${i}_qty`] = `Item ${i + 1}: qty must be > 0`
        if (!(Number(it.unitPrice) >= 0)) e[`it_${i}_price`] = `Item ${i + 1}: price required`
      })
    }
    if (step === 'commercial') {
      if (!effectiveTotal || effectiveTotal <= 0) e.total = 'Total amount must be greater than zero'
      if (!form.expectedCompletionDate) e.exp = 'Expected completion date required'
    }
    if (step === 'payment') {
      if (form.milestones.length === 0) e.milestones = 'At least one payment milestone required'
      if (!isHundred) e.percent = `Milestone percentages must sum to 100% (currently ${totalPercent}%)`
      form.milestones.forEach((m, i) => {
        if (!m.label) e[`m_${i}_label`] = `Milestone ${i + 1}: label required`
        if (Number(m.percentage) <= 0) e[`m_${i}_pct`] = `Milestone ${i + 1}: percentage required`
      })
    }
    return e
  }, [step, form, autoPoNumber, effectiveTotal, totalPercent, isHundred])

  const canProceed = Object.keys(stepErrors).length === 0
  const goPrev = () => { const idx = STEPS.findIndex(s => s.id === step); if (idx > 0) setStep(STEPS[idx - 1].id) }
  const goNext = () => {
    if (!canProceed) { toast.warning('Cannot proceed', Object.values(stepErrors)[0]); return }
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
    else setConfirmOpen(true)
  }

  const submit = () => {
    const id = autoPoNumber ? nextPoId(pos) : form.id
    createPo({
      id, referenceNumber: form.referenceNumber, type: form.type,
      vendorId: form.vendorId, vendorName: form.vendorName, vendorContact: form.vendorContact, vendorEmail: form.vendorEmail, vendorPhone: form.vendorPhone,
      items: form.items, totalAmount: effectiveTotal, currency: form.currency, incoterm: form.incoterm,
      paymentType: PAYMENT_PRESETS.find(p => p.id === form.paymentPresetId)?.type ?? 'percentage',
      milestones: form.milestones.map(m => ({ ...m, dueDate: new Date(m.dueDate).toISOString(), reminderDate: new Date(m.reminderDate).toISOString() })),
      creationDate: new Date(form.creationDate).toISOString(),
      expectedCompletionDate: new Date(form.expectedCompletionDate).toISOString(),
      currentStage: 'created',
      stageHistory: [{ stage:'created', date: new Date().toISOString(), by:'Fahad Al-Ghamdi', remarks:'PO drafted' }],
      createdBy:'Fahad Al-Ghamdi',
    })
    toast.success('PO created', `${id} · ${form.currency} ${fmtMoney(effectiveTotal)}`)
    setConfirmOpen(false)
    navigate(`/po/${id}`)
  }

  const stepIdx = STEPS.findIndex(s => s.id === step)

  // Picker filter
  const filteredInventory = useMemo(() => INVENTORY_MASTER.filter(it => {
    if (pickerCategory !== 'all' && it.category !== pickerCategory) return false
    if (pickerSearch) {
      const q = pickerSearch.toLowerCase()
      return (it.name ?? '').toLowerCase().includes(q) || (it.sapId ?? '').toLowerCase().includes(q) || (it.category ?? '').toLowerCase().includes(q)
    }
    return true
  }), [pickerSearch, pickerCategory])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/po')} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={{ ...C }}>
            <ArrowLeft className="w-3.5 h-3.5" style={{ color:'var(--text2)' }} />
          </button>
          <div>
            <h2 className="text-sm font-bold" style={{ color:'var(--text)' }}>Create Purchase Order</h2>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>5-step wizard · vendor master · inventory items · payment milestones with reminders</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
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
                      background: isActive ? 'var(--primary)' : isDone ? '#059669' : 'var(--bg2)',
                      color: isActive || isDone ? '#fff' : 'var(--text3)',
                    }}>
                    {isDone ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color: isActive ? 'var(--primary)' : 'var(--text3)' }} />
                    <span className="text-[12.5px] font-bold truncate" style={{ color: isActive ? 'var(--text)' : 'var(--text3)' }}>{s.label}</span>
                  </div>
                </button>
                {idx < STEPS.length - 1 && <div className="h-0.5 w-3 flex-shrink-0" style={{ background: idx < stepIdx ? '#059669' : 'var(--border)' }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step body */}
      <div className="rounded-xl border p-4" style={C}>
        {step === 'basic'     && <Step1 form={form} set={set} suggestedId={suggestedId} autoPoNumber={autoPoNumber} setAutoPoNumber={setAutoPoNumber} eligibleVendors={eligibleVendors} onVendorChange={onVendorChange} errors={stepErrors} />}
        {step === 'inventory' && <Step2 form={form} updateItem={updateItem} removeItem={removeItem} openPicker={() => setPickerOpen(true)} computedTotal={computedTotal} errors={stepErrors} />}
        {step === 'commercial'&& <Step3 form={form} set={set} computedTotal={computedTotal} effectiveTotal={effectiveTotal} errors={stepErrors} />}
        {step === 'payment'   && <Step4 form={form} set={set} effectiveTotal={effectiveTotal} totalPercent={totalPercent} hasPartialMilestones={hasPartialMilestones} updateMilestone={updateMilestone} addMilestone={addMilestone} removeMilestone={removeMilestone} onPresetChange={onPresetChange} errors={stepErrors} />}
        {step === 'review'    && <Step5 form={form} effectiveTotal={effectiveTotal} suggestedId={suggestedId} autoPoNumber={autoPoNumber} />}
      </div>

      {/* Step nav */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={stepIdx === 0}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1.5 disabled:opacity-40"
          style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
          <ArrowLeft className="w-3 h-3" /> Previous
        </button>
        <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Step {stepIdx + 1} of {STEPS.length}</div>
        <button onClick={goNext}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5"
          style={{ background:'var(--primary)' }}>
          {stepIdx === STEPS.length - 1 ? <><Send className="w-3 h-3" />Submit PO</> : <>Next <ArrowRight className="w-3 h-3" /></>}
        </button>
      </div>

      {/* Confirm modal */}
      <EnterpriseModal open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="Confirm PO" subtitle={`${form.currency} ${fmtMoney(effectiveTotal)} · ${form.milestones.length} milestone${form.milestones.length > 1 ? 's' : ''}`}
        icon={<Eye className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)}>Back</ModalBtn>
          <ModalBtn onClick={submit}><Check className="w-3 h-3 mr-1" />Confirm & Create</ModalBtn>
        </>}>
        <Step5 form={form} effectiveTotal={effectiveTotal} suggestedId={suggestedId} autoPoNumber={autoPoNumber} compact />
      </EnterpriseModal>

      {/* Inventory picker modal */}
      <EnterpriseModal open={pickerOpen} onClose={() => { setPickerOpen(false); setPickerSearch(''); setPickerCategory('all') }}
        title="Pick Inventory Item" subtitle={`${INVENTORY_MASTER.length} master items · filtered ${filteredInventory.length}`}
        icon={<Package className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<ModalBtn variant="secondary" onClick={() => setPickerOpen(false)}>Close</ModalBtn>}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
              <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus
                placeholder="Search name, SAP ID, category…"
                className="w-full rounded-lg pl-7 pr-3 py-1.5 text-[12.5px] border focus:outline-none"
                style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
            </div>
            <div className="w-48">
              <Select2 size="sm" value={pickerCategory} onChange={v => setPickerCategory(v ?? 'all')}
                options={[{ id:'all', label:'All Categories' }, ...INVENTORY_CATEGORIES.map(c => ({ id: c, label: c }))]} />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredInventory.length === 0 ? (
              <p className="text-center py-6 text-[12.5px]" style={{ color:'var(--text3)' }}>No items match</p>
            ) : filteredInventory.map(it => (
              <button key={it.id} onClick={() => { addItem(it); toast.success('Item added', it.name) }}
                className="w-full text-left rounded-lg border p-2.5 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <Package className="w-4 h-4 flex-shrink-0" style={{ color:'var(--primary)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold truncate" style={{ color:'var(--text)' }}>{it.name}</div>
                  <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color:'var(--text3)' }}>
                    <span className="font-mono">{it.sapId}</span><span>·</span>
                    <span>{it.category}</span><span>·</span>
                    <span>Stock {it.stock} {it.unit}</span><span>·</span>
                    <span>{it.location}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12.5px] font-mono font-bold" style={{ color:'var(--text2)' }}>SAR {fmtMoney(it.unitCost)}</div>
                  <div className="text-[10px]" style={{ color:'var(--text3)' }}>/ {it.unit}</div>
                </div>
                <Plus className="w-4 h-4 flex-shrink-0" style={{ color:'var(--primary)' }} />
              </button>
            ))}
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 1 — Basic Info
// ═══════════════════════════════════════════════════════════════════════
function Step1({ form, set, suggestedId, autoPoNumber, setAutoPoNumber, eligibleVendors, onVendorChange, errors }) {
  return (
    <div className="space-y-3">
      <Section icon={FileText} title="Basic PO Information">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={6} label="PO Number" required error={errors.id}>
            <div className="flex gap-2">
              <input value={autoPoNumber ? suggestedId : form.id} disabled={autoPoNumber}
                onChange={e => set('id', e.target.value.toUpperCase())} placeholder="e.g. PO-2026-100"
                className="flex-1 rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono font-bold"
                style={{ background: autoPoNumber ? 'var(--bg2)' : 'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
              <button onClick={() => setAutoPoNumber(v => !v)}
                className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border whitespace-nowrap"
                style={{ background: autoPoNumber ? 'var(--primary)' : 'var(--card)', borderColor:'var(--border)', color: autoPoNumber ? '#fff' : 'var(--text2)' }}>
                {autoPoNumber ? 'Auto · ON' : 'Manual'}
              </button>
            </div>
          </Field>
          <Field colSpan={3} label="Reference Number">
            <input value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value.toUpperCase())}
              placeholder="External ref / RFQ"
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
          </Field>
          <Field colSpan={3} label="PO Creation Date">
            <input type="date" value={form.creationDate} onChange={e => set('creationDate', e.target.value)}
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
          </Field>
          <Field colSpan={12} label="PO Type" required error={errors.type}>
            <div className="grid grid-cols-4 gap-1.5">
              {PO_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set('type', t.id)}
                  className="px-3 py-2 text-[12.5px] font-bold rounded-lg border-2 flex items-center gap-1.5"
                  style={{
                    background: form.type === t.id ? `${t.color}15` : 'var(--card)',
                    borderColor: form.type === t.id ? t.color : 'var(--border)',
                    color: form.type === t.id ? t.color : 'var(--text2)',
                  }}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      <Section icon={Briefcase} title="Vendor">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={12} label="Supplier / Vendor" required tooltip="Active vendor from master · auto-fills contact + SLA" error={errors.vendor}>
            <Select2 value={form.vendorId} onChange={onVendorChange} placeholder={`Search ${eligibleVendors.length} active vendors…`}
              options={eligibleVendors.map(v => ({ id: v.id, label: v.name, sublabel: `${v.type} · ${v.city}, ${v.country} · SLA ${v.slaScore ?? v.sla ?? '—'}%` }))}
              getSubLabel={o => o.sublabel} />
            {form.vendorId && (() => {
              const v = eligibleVendors.find(x => x.id === form.vendorId)
              if (!v) return null
              return (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12.5px]">
                  <span className="font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{v.code}</span>
                  <span style={{ color:'var(--text3)' }}>·</span>
                  <span style={{ color:'var(--text2)' }}>{v.type}</span>
                  <span style={{ color:'var(--text3)' }}>·</span>
                  <span style={{ color:'var(--text2)' }}>{v.city}, {v.country}</span>
                  {(v.slaScore ?? v.sla) != null && (
                    <>
                      <span style={{ color:'var(--text3)' }}>·</span>
                      <span className="font-mono font-bold" style={{ color: (v.slaScore ?? v.sla) >= 90 ? 'var(--success)' : 'var(--warning)' }}>SLA {(v.slaScore ?? v.sla)}%</span>
                    </>
                  )}
                </div>
              )
            })()}
          </Field>
          {form.vendorId && (
            <>
              <Field colSpan={4} label="Contact Person">
                <input value={form.vendorContact} disabled className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border opacity-60" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </Field>
              <Field colSpan={4} label="Email">
                <input value={form.vendorEmail} disabled className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border font-mono opacity-60" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </Field>
              <Field colSpan={4} label="Phone">
                <input value={form.vendorPhone} disabled className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border font-mono opacity-60" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </Field>
            </>
          )}
        </div>
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 2 — Inventory & Items
// ═══════════════════════════════════════════════════════════════════════
function Step2({ form, updateItem, removeItem, openPicker, computedTotal, errors }) {
  return (
    <div className="space-y-3">
      <Section icon={Package} title="Inventory & Items" subtitle="Pick from inventory master or add ad-hoc rows" right={
        <button type="button" onClick={openPicker} className="px-2.5 py-1 text-[12.5px] font-bold rounded-lg flex items-center gap-1.5 text-white" style={{ background:'var(--primary)' }}>
          <Search className="w-3 h-3" /> Pick from Inventory
        </button>
      }>
        {form.items.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-6 text-center" style={{ borderColor:'var(--border2)' }}>
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>No items yet · pick from inventory or skip if PO has no line items</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Line Total</div>
              <div className="col-span-1" />
            </div>
            {form.items.map((it, idx) => (
              <div key={it.id} className="rounded-lg border p-2.5 grid grid-cols-12 gap-2 items-center" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="col-span-5">
                  <input value={it.name} onChange={e => updateItem(idx, { name: e.target.value })} placeholder="Item name"
                    className="w-full rounded px-2 py-1 text-[12.5px] font-bold border focus:outline-none"
                    style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                  <div className="text-[10px] mt-0.5 flex items-center gap-1.5" style={{ color:'var(--text3)' }}>
                    {it.sku && <span className="font-mono">{it.sku}</span>}
                    {it.category && <><span>·</span><span>{it.category}</span></>}
                    <span>·</span><span className="font-mono">per {it.unit}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <input type="number" step="1" min="0" value={it.qty} onChange={e => updateItem(idx, { qty: Number(e.target.value) })}
                    className="w-full rounded px-2 py-1 text-[12.5px] border focus:outline-none font-mono font-bold text-center"
                    style={{ background:'var(--card)', borderColor: errors[`it_${idx}_qty`] ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2">
                  <input type="number" step="0.01" min="0" value={it.unitPrice} onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) })}
                    className="w-full rounded px-2 py-1 text-[12.5px] border focus:outline-none font-mono text-right"
                    style={{ background:'var(--card)', borderColor: errors[`it_${idx}_price`] ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2 text-right text-[12.5px] font-mono font-bold" style={{ color:'var(--primary)' }}>
                  {form.currency} {fmtMoney(it.lineTotal)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-end gap-2 px-2 py-2 text-[12.5px]" style={{ borderTop:'2px solid var(--border)' }}>
              <span style={{ color:'var(--text3)' }}>Computed total:</span>
              <span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{form.currency} {fmtMoney(computedTotal)}</span>
            </div>
          </div>
        )}
        {errors.items && <ErrorBanner msg={errors.items} />}
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 3 — Commercial Terms
// ═══════════════════════════════════════════════════════════════════════
function Step3({ form, set, computedTotal, effectiveTotal, errors }) {
  return (
    <div className="space-y-3">
      <Section icon={Briefcase} title="Commercial Terms">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={4} label="Incoterm" required>
            <Select2 size="sm" value={form.incoterm} onChange={v => set('incoterm', v)} options={INCOTERMS} />
          </Field>
          <Field colSpan={4} label="Currency" required>
            <Select2 size="sm" value={form.currency} onChange={v => set('currency', v)} options={CURRENCIES} />
          </Field>
          <Field colSpan={4} label="Expected Completion" required error={errors.exp}>
            <input type="date" value={form.expectedCompletionDate} onChange={e => set('expectedCompletionDate', e.target.value)}
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
          </Field>
        </div>
      </Section>

      <Section icon={DollarSign} title="Total Amount" subtitle="Computed from items in step 2 · override if needed">
        <div className="grid grid-cols-12 gap-2">
          <Field colSpan={6} label="Computed from Items">
            <div className="px-2.5 py-1.5 text-[12.5px] font-mono font-bold rounded-lg border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--primary)' }}>
              {form.currency} {fmtMoney(computedTotal)} ({form.items.length} item{form.items.length === 1 ? '' : 's'})
            </div>
          </Field>
          <Field colSpan={6} label="Override Total">
            <label className="flex items-center gap-2 h-[34px] cursor-pointer">
              <input type="checkbox" checked={form.overrideTotal} onChange={e => set('overrideTotal', e.target.checked)} />
              <span className="text-[12.5px]" style={{ color:'var(--text2)' }}>Enter total manually</span>
            </label>
          </Field>
          {form.overrideTotal && (
            <Field colSpan={12} label="Manual Total Amount" required error={errors.total}>
              <input type="number" step="0.01" min="0" value={form.totalAmount} onChange={e => set('totalAmount', Number(e.target.value))}
                className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono font-bold"
                style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
            </Field>
          )}
          <div className="col-span-12 rounded-lg p-2.5 flex items-center justify-between" style={{ background:'rgba(37,99,235,.06)', border:'1px solid rgba(37,99,235,.3)' }}>
            <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--primary)' }}>Effective PO Total</span>
            <span className="text-lg font-mono font-black" style={{ color:'var(--primary)' }}>{form.currency} {fmtMoney(effectiveTotal)}</span>
          </div>
          {errors.total && <div className="col-span-12"><ErrorBanner msg={errors.total} /></div>}
        </div>
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 4 — Payment Schedule (with reminders)
// ═══════════════════════════════════════════════════════════════════════
function Step4({ form, set, effectiveTotal, totalPercent, hasPartialMilestones, updateMilestone, addMilestone, removeMilestone, onPresetChange, errors }) {
  const pctColor = Math.abs(totalPercent - 100) < 0.01 ? 'var(--success)' : 'var(--danger)'
  return (
    <div className="space-y-3">
      <Section icon={DollarSign} title="Payment Schedule" subtitle="Pick a preset or build custom milestones">
        <div className="grid grid-cols-12 gap-2">
          {PAYMENT_PRESETS.map(p => (
            <button key={p.id} type="button" onClick={() => onPresetChange(p.id)}
              className="col-span-3 px-2 py-2 text-[12.5px] font-bold rounded-lg border-2"
              style={{
                background: form.paymentPresetId === p.id ? 'var(--primary-light)' : 'var(--card)',
                borderColor: form.paymentPresetId === p.id ? 'var(--primary)' : 'var(--border)',
                color: form.paymentPresetId === p.id ? 'var(--primary)' : 'var(--text2)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {hasPartialMilestones && (
        <div className="rounded-lg p-2 flex items-start gap-2" style={{ background:'rgba(217,119,6,.06)', border:'1px solid rgba(217,119,6,.3)' }}>
          <Bell className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color:'var(--warning)' }} />
          <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
            <strong style={{ color:'var(--warning)' }}>Reminders enabled</strong> · This payment plan is not 100%-upfront. For each partial milestone, set "Remind me X days before due" to schedule a payment reminder.
          </div>
        </div>
      )}

      <Section icon={Calendar} title={`Milestones (${form.milestones.length}) · ${totalPercent}%`} right={
        <button type="button" onClick={addMilestone} className="px-2.5 py-1 text-[12.5px] font-bold rounded-lg border flex items-center gap-1.5" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
          <Plus className="w-3 h-3" /> Add Custom
        </button>
      }>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-1.5 px-1 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>
            <div className="col-span-3">Label</div>
            <div className="col-span-1 text-center">%</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Trigger</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-center">Remind</div>
            <div className="col-span-1" />
          </div>
          {form.milestones.map((m, idx) => {
            const amt = effectiveTotal * (Number(m.percentage) || 0) / 100
            const isFull = Number(m.percentage) >= 100
            return (
              <div key={m.id} className="rounded-lg border p-2 grid grid-cols-12 gap-1.5 items-center" style={{ background:'var(--bg2)', borderColor: errors[`m_${idx}_pct`] ? 'var(--danger)' : 'var(--border)' }}>
                <div className="col-span-3">
                  <input value={m.label} onChange={e => updateMilestone(idx, { label: e.target.value })}
                    className="w-full rounded px-2 py-1 text-[12.5px] font-bold border focus:outline-none"
                    style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-1">
                  <input type="number" step="1" min="0" max="100" value={m.percentage} onChange={e => updateMilestone(idx, { percentage: Number(e.target.value) })}
                    className="w-full rounded px-1 py-1 text-[12.5px] border focus:outline-none font-mono font-bold text-center"
                    style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2 text-right text-[12.5px] font-mono font-bold" style={{ color:'var(--primary)' }}>
                  {form.currency} {fmtMoney(amt)}
                </div>
                <div className="col-span-2">
                  <Select2 size="sm" value={m.trigger} onChange={v => updateMilestone(idx, { trigger: v })} options={PAYMENT_TRIGGERS} />
                </div>
                <div className="col-span-2">
                  <input type="date" value={m.dueDate?.slice(0, 10) ?? ''} onChange={e => updateMilestone(idx, { dueDate: new Date(e.target.value).toISOString() })}
                    className="w-full rounded px-1.5 py-1 text-[12.5px] border focus:outline-none font-mono"
                    style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-1">
                  {isFull ? (
                    <div className="text-[10px] text-center italic" style={{ color:'var(--text3)' }}>No remind</div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input type="number" step="1" min="0" value={m.reminderDays ?? 3} onChange={e => updateMilestone(idx, { reminderDays: Number(e.target.value) })}
                        className="w-full rounded px-1 py-1 text-[12.5px] border focus:outline-none font-mono font-bold text-center"
                        style={{ background:'var(--card)', borderColor:'rgba(217,119,6,.4)', color:'var(--warning)' }} />
                      <span className="text-[10px]" style={{ color:'var(--text3)' }}>d</span>
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeMilestone(idx)} className="w-6 h-6 rounded flex items-center justify-center" style={{ color:'var(--danger)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {!isFull && m.reminderDays != null && m.dueDate && (
                  <div className="col-span-12 text-[10px] flex items-center gap-1 pl-1" style={{ color:'var(--text3)' }}>
                    <Bell className="w-2.5 h-2.5" style={{ color:'var(--warning)' }} />
                    <span>Reminder will fire on <strong className="font-mono" style={{ color:'var(--warning)' }}>{fmtDate(computeReminderDate(m.dueDate, m.reminderDays))}</strong> ({m.reminderDays} day{m.reminderDays === 1 ? '' : 's'} before due)</span>
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex items-center justify-end gap-2 px-2 py-1.5 text-[12.5px]" style={{ borderTop:'2px solid var(--border)' }}>
            <span style={{ color:'var(--text3)' }}>Sum of percentages:</span>
            <span className="font-mono font-bold" style={{ color: pctColor }}>{totalPercent}%</span>
            {Math.abs(totalPercent - 100) < 0.01 ? <Check className="w-3 h-3" style={{ color:'var(--success)' }} /> : <AlertCircle className="w-3 h-3" style={{ color:'var(--danger)' }} />}
          </div>
          {errors.percent && <ErrorBanner msg={errors.percent} />}
          {errors.milestones && <ErrorBanner msg={errors.milestones} />}
        </div>
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 5 — Review
// ═══════════════════════════════════════════════════════════════════════
function Step5({ form, effectiveTotal, suggestedId, autoPoNumber, compact }) {
  const typeCfg = PO_TYPES.find(t => t.id === form.type)
  return (
    <div className="space-y-2">
      {!compact && <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>Final Review</h3>}

      <ReviewBlock title="Basic" rows={[
        { k:'PO Number',  v: <span className="font-mono font-bold">{autoPoNumber ? suggestedId : form.id}</span> },
        { k:'Reference',  v: <span className="font-mono">{form.referenceNumber || '—'}</span> },
        { k:'Type',       v: <span>{typeCfg?.icon} {typeCfg?.label}</span> },
        { k:'Created',    v: fmtDate(form.creationDate) },
      ]} />

      <ReviewBlock title="Vendor" rows={[
        { k:'Name',     v: form.vendorName || '—' },
        { k:'Contact',  v: form.vendorContact || '—' },
        { k:'Email',    v: <span className="font-mono">{form.vendorEmail || '—'}</span> },
        { k:'Phone',    v: <span className="font-mono">{form.vendorPhone || '—'}</span> },
      ]} />

      {form.items.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <div className="px-2.5 py-1" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Items ({form.items.length})</h4>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ background:'var(--bg2)' }}>
                {['Item', 'Qty', 'Unit Price', 'Line Total'].map(h => <th key={h} className="text-left px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {form.items.map(it => (
                <tr key={it.id} style={{ borderTop:'1px solid var(--border)' }}>
                  <td className="px-2.5 py-1.5 font-bold" style={{ color:'var(--text)' }}>{it.name} <span className="font-mono text-[10px]" style={{ color:'var(--text3)' }}>{it.sku}</span></td>
                  <td className="px-2.5 py-1.5 font-mono">{it.qty} {it.unit}</td>
                  <td className="px-2.5 py-1.5 font-mono">{form.currency} {fmtMoney(it.unitPrice)}</td>
                  <td className="px-2.5 py-1.5 font-mono font-bold" style={{ color:'var(--primary)' }}>{form.currency} {fmtMoney(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReviewBlock title="Commercial Terms" rows={[
        { k:'Incoterm',     v: <span className="font-mono">{form.incoterm}</span> },
        { k:'Currency',     v: <span className="font-mono">{form.currency}</span> },
        { k:'Total',        v: <strong className="font-mono" style={{ color:'var(--primary)' }}>{form.currency} {fmtMoney(effectiveTotal)}</strong> },
        { k:'Expected By',  v: fmtDate(form.expectedCompletionDate) },
      ]} />

      <div className="rounded-lg border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <div className="px-2.5 py-1" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Payment Milestones ({form.milestones.length})</h4>
        </div>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ background:'var(--bg2)' }}>
              {['Milestone', '%', 'Amount', 'Trigger', 'Due', 'Reminder'].map(h => <th key={h} className="text-left px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {form.milestones.map(m => {
              const amt = effectiveTotal * (Number(m.percentage) || 0) / 100
              const trig = PAYMENT_TRIGGERS.find(t => t.id === m.trigger)
              return (
                <tr key={m.id} style={{ borderTop:'1px solid var(--border)' }}>
                  <td className="px-2.5 py-1.5 font-bold" style={{ color:'var(--text)' }}>{m.label}</td>
                  <td className="px-2.5 py-1.5 font-mono">{m.percentage}%</td>
                  <td className="px-2.5 py-1.5 font-mono font-bold" style={{ color:'var(--primary)' }}>{form.currency} {fmtMoney(amt)}</td>
                  <td className="px-2.5 py-1.5">{trig?.label ?? m.trigger}</td>
                  <td className="px-2.5 py-1.5 font-mono">{fmtDate(m.dueDate)}</td>
                  <td className="px-2.5 py-1.5">
                    {Number(m.percentage) >= 100 ? (
                      <span className="text-[10px] italic" style={{ color:'var(--text3)' }}>—</span>
                    ) : (
                      <span className="font-mono" style={{ color:'var(--warning)' }}>
                        <Bell className="w-2.5 h-2.5 inline mr-0.5" />{m.reminderDays}d before · {fmtDate(m.reminderDate)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════
function Section({ icon: Icon, title, subtitle, right, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-1 mb-2" style={{ borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>{title}</h3>
          {subtitle && <span className="text-[10px] ml-1" style={{ color:'var(--text3)' }}>· {subtitle}</span>}
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

function ReviewBlock({ title, rows }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
      <div className="px-2.5 py-1" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{title}</h4>
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

function ErrorBanner({ msg }) {
  return (
    <div className="rounded-lg p-2 flex items-center gap-2 text-[12.5px]" style={{ background:'rgba(220,38,38,.06)', border:'1px solid rgba(220,38,38,.3)' }}>
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--danger)' }} />
      <span className="font-bold" style={{ color:'var(--danger)' }}>{msg}</span>
    </div>
  )
}
