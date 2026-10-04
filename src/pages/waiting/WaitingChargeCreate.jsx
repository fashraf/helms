// Waiting Charge Create — multi-row block configuration form.
// Row 1: Project (with verification banner)
// Row 2: Delay reason (Other reveals custom field)
// Row 3: 4-col time calculation matrix (Arrival · Free Hrs · End · Computed)
// Row 4: Penalty rate + action footer

import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Clock, AlertTriangle, MapPin, User, Briefcase, Check, X, Calculator, DollarSign, Calendar, Hash,
} from 'lucide-react'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import useWaitingChargeStore from '../../store/waitingChargeStore'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useToastStore from '../../store/toastStore'
import {
  DELAY_REASONS, FREE_HOURS_OPTIONS, DEFAULT_PENALTY_RATE,
  computeElapsedHours, computeChargedHours, computeTotalAmount, getSiteMetrics,
  DEMURRAGE_CHARGES, DEFAULT_DEMURRAGE_RATE_PER_DAY, computeDemurrageDays,
} from '../../api/mock/waitingChargeData'
import { PROJECTS } from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function WaitingChargeCreate() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { addCharge, updateCharge, getById } = useWaitingChargeStore()
  const { intlShipments, localShipments } = useShipmentV2Store()
  const toast = useToastStore()

  const editId = params.get('editId')
  const editing = editId ? getById(editId) : null

  // Resolve project context from shipment when arriving from a shipment detail page.
  // Lookup tries both intl + local shipment masters; field name `projectId` (with fallbacks).
  const shipmentIdFromUrl = params.get('shipmentId') || null
  const shipmentFromContext = useMemo(() => {
    if (!shipmentIdFromUrl) return null
    return (
      intlShipments.find(s => s.id === shipmentIdFromUrl)
      ?? localShipments.find(s => s.id === shipmentIdFromUrl)
      ?? null
    )
  }, [shipmentIdFromUrl, intlShipments, localShipments])

  const resolvedProjectId =
    params.get('projectId')
    || shipmentFromContext?.projectId
    || shipmentFromContext?.project        // legacy field on some intl shipments
    || ''

  // Inheritance is "active" only when the create flow originated from a shipment view
  // AND we actually resolved a project for it. In edit mode it stays off so users can
  // adjust if needed.
  const inheritedFromShipment = !editing && !!shipmentIdFromUrl && !!resolvedProjectId

  const [draft, setDraft] = useState(() => editing ? { ...editing } : ({
    projectId:    resolvedProjectId,
    shipmentId:   shipmentIdFromUrl,
    incidentDate: todayISO(),
    delayReason:  '',
    customReason: '',
    arrivalTime:  '10:00',
    freeHours:    3,
    endTime:      '14:00',
    penaltyRate:  DEFAULT_PENALTY_RATE,
    currency:     'SAR',
    notes:        '',
    // Demurrage-specific fields — only used when delayReason === 'demurrage_charges'
    dischargeDate: '',
    gateOutDate:   '',
    containers:    1,
    demurrageRate: DEFAULT_DEMURRAGE_RATE_PER_DAY,
  }))

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const projectOptions = useMemo(() =>
    PROJECTS.map(p => ({ id: p.id, label: p.name, sublabel: `${p.city} · ${p.country}` })),
    [])

  // Mode: per-diem (demurrage) vs hourly (everything else)
  const isDemurrage = draft.delayReason === DEMURRAGE_CHARGES

  // Computed live values — branch by kind
  const elapsed   = useMemo(() => computeElapsedHours(draft.arrivalTime, draft.endTime), [draft.arrivalTime, draft.endTime])
  const charged   = useMemo(() => computeChargedHours(elapsed, draft.freeHours), [elapsed, draft.freeHours])
  const demDays   = useMemo(() => computeDemurrageDays(draft.dischargeDate, draft.gateOutDate), [draft.dischargeDate, draft.gateOutDate])
  const total     = useMemo(() => isDemurrage
    ? demDays * Number(draft.demurrageRate || 0) * Number(draft.containers || 1)
    : computeTotalAmount(charged, draft.penaltyRate),
    [isDemurrage, demDays, draft.demurrageRate, draft.containers, charged, draft.penaltyRate])
  const siteMetrics = useMemo(() => getSiteMetrics(draft.projectId), [draft.projectId])

  const isOther = draft.delayReason === 'other'

  const errors = useMemo(() => {
    const e = {}
    if (!draft.projectId)   e.projectId = 'Project required'
    if (!draft.incidentDate)e.incidentDate = 'Incident date required'
    if (!draft.delayReason) e.delayReason = 'Reason required'
    if (isOther && !draft.customReason?.trim()) e.customReason = 'Custom reason required when "Other" is selected'
    if (isDemurrage) {
      if (!draft.dischargeDate) e.dischargeDate = 'Port arrival / discharge date required'
      if (!draft.gateOutDate)   e.gateOutDate   = 'Port gate-out / clearance date required'
      if (draft.dischargeDate && draft.gateOutDate && new Date(draft.gateOutDate) < new Date(draft.dischargeDate)) {
        e.gateOutDate = 'Gate-out must be on/after discharge date'
      }
      if (!(Number(draft.demurrageRate) >= 0)) e.demurrageRate = 'Daily demurrage rate required'
      if (!(Number(draft.containers) >= 1))    e.containers = 'At least one container'
    } else {
      if (!draft.arrivalTime) e.arrivalTime = 'Arrival time required'
      if (!draft.endTime)     e.endTime = 'End time required'
      if (!(Number(draft.penaltyRate) >= 0)) e.penaltyRate = 'Penalty rate required'
    }
    return e
  }, [draft, isOther, isDemurrage])

  const canSave = Object.keys(errors).length === 0

  const [reviewOpen, setReviewOpen] = useState(false)

  const handleOpenReview = () => {
    if (!canSave) {
      toast.warning('Cannot save', Object.values(errors)[0])
      return
    }
    setReviewOpen(true)
  }

  const handleCommit = () => {
    if (editing) {
      updateCharge(editing.id, draft)
      toast.success('Waiting charge updated', `${editing.id} · ${draft.currency} ${fmtMoney(total)}`)
      setReviewOpen(false)
      navigate('/waiting-charges')
    } else {
      addCharge(draft)
      toast.success('Waiting charge saved', `${draft.currency} ${fmtMoney(total)} · ${charged}h charged`)
      setReviewOpen(false)
      navigate('/waiting-charges')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/waiting-charges')} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={C}>
            <ArrowLeft className="w-3.5 h-3.5" style={{ color: 'var(--text2)' }} />
          </button>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Clock className="w-4 h-4" style={{ color: '#DC2626' }} />
              {editing ? `Edit Charge · ${editing.id}` : 'Add Charges'}
            </h2>
            <p className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Log a shipment / site delay · computed waiting hours · auto-calc penalty</p>
          </div>
        </div>
        {draft.shipmentId && (
          <span className="px-2 py-1 text-[10px] font-bold rounded font-mono" style={{ background: 'rgba(37,99,235,.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,.3)' }}>
            Linked shipment: {draft.shipmentId}
          </span>
        )}
      </div>

      {/* ROW 1 — Project Identity Engagement */}
      <div className="rounded-xl border p-4 space-y-2" style={C}>
        <div className="flex items-center gap-1.5 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Project Identity</h3>
          {inheritedFromShipment && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'rgba(37,99,235,.1)', color:'#2563EB' }}>
              Auto-bound · context inherited
            </span>
          )}
        </div>
        <div className="grid grid-cols-12 gap-2">
          {inheritedFromShipment ? (
            /* Project picker is bypassed when context is inherited — show read-only inheritance card */
            <div className="col-span-12 md:col-span-9">
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Project (Inherited from Shipment)</label>
              <div className="rounded-lg p-2.5" style={{ background:'rgba(37,99,235,.06)', border:'1px solid rgba(37,99,235,.25)' }}>
                {(() => {
                  const proj = PROJECTS.find(p => p.id === draft.projectId)
                  if (!proj) return <span className="text-[12.5px] italic" style={{ color:'var(--text3)' }}>Resolving project from shipment {draft.shipmentId}…</span>
                  return (
                    <div className="flex items-center gap-2 flex-wrap text-[12.5px]">
                      <Briefcase className="w-3.5 h-3.5" style={{ color:'#2563EB' }} />
                      <strong style={{ color:'var(--text)' }}>{proj.name}</strong>
                      <span style={{ color:'var(--text3)' }}>·</span>
                      <span style={{ color:'var(--text2)' }}>{proj.city}, {proj.country}</span>
                      <span style={{ color:'var(--text3)' }}>·</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--primary)', border:'1px solid var(--border)' }}>Via {draft.shipmentId}</span>
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            <Field label="Project Associated with Delay" required error={errors.projectId} colSpan={9}>
              <Select2 value={draft.projectId} onChange={v => set('projectId', v ?? '')} placeholder="Select Project…" options={projectOptions} getSubLabel={o => o.sublabel} />
            </Field>
          )}
          <Field label="Incident Date" required error={errors.incidentDate} colSpan={3}>
            <input type="date" value={draft.incidentDate} onChange={e => set('incidentDate', e.target.value)}
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </Field>
        </div>
        {siteMetrics && (
          <div className="rounded-lg p-2.5 flex items-center gap-3 flex-wrap text-[12.5px] animate-fade-in" style={{ background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.25)' }}>
            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: '#2563EB' }}>
              <MapPin className="w-3.5 h-3.5" /><strong>Site Location:</strong> <span style={{ color: 'var(--text)' }}>{siteMetrics.siteLocation}</span>
            </span>
            <span style={{ color: 'var(--text3)' }}>|</span>
            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: '#2563EB' }}>
              <User className="w-3.5 h-3.5" /><strong>Assigned Supervisor:</strong> <span style={{ color: 'var(--text)' }}>{siteMetrics.supervisor}</span>
              {siteMetrics.supervisorRole && <span className="text-[10px]" style={{ color: 'var(--text3)' }}>({siteMetrics.supervisorRole})</span>}
            </span>
          </div>
        )}
      </div>

      {/* ROW 2 — Delay reason */}
      <div className="rounded-xl border p-4 space-y-2" style={C}>
        <div className="flex items-center gap-1.5 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Categorization of Operational Delay</h3>
        </div>
        <Field label="Primary Reason for Delay" required error={errors.delayReason}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
            {DELAY_REASONS.map(r => (
              <button key={r.id} type="button" onClick={() => set('delayReason', r.id)}
                className="px-2 py-2 text-[12.5px] font-bold rounded-lg border-2 flex flex-col items-center gap-0.5"
                style={{
                  background: draft.delayReason === r.id ? `${r.color}15` : 'var(--card)',
                  borderColor: draft.delayReason === r.id ? r.color : 'var(--border)',
                  color: draft.delayReason === r.id ? r.color : 'var(--text2)',
                }}>
                <span className="text-base">{r.icon}</span>
                <span className="text-center leading-tight">{r.label}</span>
              </button>
            ))}
          </div>
        </Field>
        {isOther && (
          <Field label="Specify Custom Delay Reason" required error={errors.customReason}>
            <input value={draft.customReason} onChange={e => set('customReason', e.target.value)} autoFocus
              placeholder="Specify custom delay reason constraints here…"
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none animate-fade-in"
              style={{ background: 'var(--bg2)', borderColor: errors.customReason ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
          </Field>
        )}
      </div>

      {/* ROW 3 — Calculation matrix (per-diem when demurrage, otherwise hourly) */}
      {!isDemurrage ? (
      <div className="rounded-xl border p-4 space-y-2" style={C}>
        <div className="flex items-center gap-1.5 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <Calculator className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Time Calculation Matrix</h3>
          <span className="text-[10px] ml-1" style={{ color: 'var(--text3)' }}>· chargeable = elapsed − free hours</span>
        </div>
        <div className="grid grid-cols-12 gap-2">
          {/* Unit 1: Arrival Time */}
          <Field label="Field A · Arrival Time" required error={errors.arrivalTime} colSpan={3}>
            <input type="time" value={draft.arrivalTime} onChange={e => set('arrivalTime', e.target.value)}
              className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none font-mono font-bold"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </Field>
          {/* Unit 2: Free Hours */}
          <Field label="Field B · Free Hours Allocated" required colSpan={3}>
            <Select2 size="sm" value={draft.freeHours} onChange={v => set('freeHours', Number(v))}
              options={FREE_HOURS_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
          </Field>
          {/* Unit 3: End Time */}
          <Field label="Field C · End Time" required error={errors.endTime} colSpan={3}>
            <input type="time" value={draft.endTime} onChange={e => set('endTime', e.target.value)}
              className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none font-mono font-bold"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </Field>
          {/* Unit 4: Computed read-only card */}
          <div className="col-span-3">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: '#DC2626' }}>
              Calculated Waiting
            </label>
            <div className="rounded-lg p-2 h-[38px] flex items-center justify-between" style={{ background: charged > 0 ? 'rgba(220,38,38,.08)' : 'rgba(5,150,105,.08)', border: `2px solid ${charged > 0 ? 'rgba(220,38,38,.4)' : 'rgba(5,150,105,.4)'}` }}>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Hours:</span>
              <span className="font-mono font-bold text-base" style={{ color: charged > 0 ? '#DC2626' : '#059669' }}>
                {charged}h
              </span>
            </div>
            <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text3)' }}>
              ({elapsed}h elapsed − {draft.freeHours}h free)
            </p>
          </div>
        </div>
      </div>
      ) : (
      // ─── Demurrage matrix · per-diem calculation ──────────────────────────
      <div className="rounded-xl border-2 p-4 space-y-2" style={{ ...C, borderColor: '#7C3AED' }}>
        <div className="flex items-center gap-1.5 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-base">🚢</span>
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>Demurrage Calculation</h3>
          <span className="text-[10px] ml-1" style={{ color: 'var(--text3)' }}>· per-diem · free window = 2 days · day 3+ chargeable · fractional days round up</span>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <Field label="Port Arrival / Discharge Date" required error={errors.dischargeDate} colSpan={3}>
            <input type="date" value={draft.dischargeDate} onChange={e => set('dischargeDate', e.target.value)}
              className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none font-mono font-bold"
              style={{ background: 'var(--bg2)', borderColor: errors.dischargeDate ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
          </Field>
          <Field label="Port Gate-Out / Clearance Date" required error={errors.gateOutDate} colSpan={3}>
            <input type="date" value={draft.gateOutDate} onChange={e => set('gateOutDate', e.target.value)}
              className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none font-mono font-bold"
              style={{ background: 'var(--bg2)', borderColor: errors.gateOutDate ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
          </Field>
          <Field label="Containers" required error={errors.containers} colSpan={2}>
            <input type="number" min="1" step="1" value={draft.containers} onChange={e => set('containers', Number(e.target.value))}
              className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none font-mono font-bold"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </Field>
          <Field label="Daily Rate (per container)" required error={errors.demurrageRate} colSpan={2}>
            <input type="number" min="0" step="0.01" value={draft.demurrageRate} onChange={e => set('demurrageRate', Number(e.target.value))}
              className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none font-mono font-bold"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </Field>
          {/* Computed days card */}
          <div className="col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: '#7C3AED' }}>
              Chargeable Days
            </label>
            <div className="rounded-lg p-2 h-[38px] flex items-center justify-between"
              style={{ background: demDays > 0 ? 'rgba(124,58,237,.08)' : 'rgba(5,150,105,.08)', border: `2px solid ${demDays > 0 ? 'rgba(124,58,237,.4)' : 'rgba(5,150,105,.4)'}` }}>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Days:</span>
              <span className="font-mono font-bold text-base" style={{ color: demDays > 0 ? '#7C3AED' : '#059669' }}>
                {demDays}d
              </span>
            </div>
            <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text3)' }}>
              {draft.dischargeDate && draft.gateOutDate
                ? `(elapsed − 2 free days)`
                : 'Pick both dates'}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* ROW 4 — Financial overhead */}
      <div className="rounded-xl border p-4 space-y-2" style={C}>
        <div className="flex items-center gap-1.5 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Financial Overhead</h3>
        </div>
        <div className="grid grid-cols-12 gap-2 items-end">
          <Field label="Penalty Fee Rate (per hour)" required error={errors.penaltyRate} colSpan={4}>
            <div className="flex items-center gap-2">
              <div className="w-20">
                <Select2 size="sm" value={draft.currency} onChange={v => set('currency', v ?? 'SAR')}
                  options={[{ id: 'SAR', label: 'SAR' }, { id: 'USD', label: 'USD' }, { id: 'AED', label: 'AED' }]} />
              </div>
              <input type="number" step="0.01" min="0" value={draft.penaltyRate} onChange={e => set('penaltyRate', Number(e.target.value))}
                className="flex-1 rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono font-bold"
                style={{ background: 'var(--bg2)', borderColor: errors.penaltyRate ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
            </div>
          </Field>
          <Field label="Notes (optional)" colSpan={8}>
            <input value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)}
              placeholder="Add additional context, references, witnesses…"
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </Field>

          {/* Total badge */}
          <div className="col-span-12 rounded-lg p-3 flex items-center justify-between" style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.3)' }}>
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: '#DC2626' }}>Total Fine Value</span>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>· {charged}h × {draft.currency} {fmtMoney(draft.penaltyRate)}/h</span>
            </div>
            <span className="text-xl font-mono font-black" style={{ color: '#DC2626' }}>{draft.currency} {fmtMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => navigate('/waiting-charges')}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1.5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <X className="w-3 h-3" /> Cancel
        </button>
        <button onClick={handleOpenReview} disabled={!canSave}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5 disabled:opacity-40"
          style={{ background: '#DC2626' }}>
          <Check className="w-3 h-3" /> Review &amp; Apply
        </button>
      </div>

      {/* Review-gate modal — required before any database write */}
      <EnterpriseModal open={reviewOpen} onClose={() => setReviewOpen(false)}
        title="Review Charge"
        subtitle="Confirm the calculated values before committing"
        icon={<Clock className="w-4 h-4" style={{ color: '#DC2626' }} />} size="lg"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setReviewOpen(false)}>Back to Edit</ModalBtn>
          <ModalBtn onClick={handleCommit}><Check className="w-3 h-3 mr-1" />Save and Apply Changes</ModalBtn>
        </>}>
        {(() => {
          const proj = PROJECTS.find(p => p.id === draft.projectId)
          const reason = DELAY_REASONS.find(r => r.id === draft.delayReason)
          const reasonLabel = reason ? `${reason.icon} ${reason.label}${draft.delayReason === 'other' && draft.customReason ? ` — "${draft.customReason}"` : ''}` : '—'
          return (
            <div className="space-y-3 text-[12.5px]">
              {/* Asset / shipment identity */}
              <div className="rounded-lg p-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Asset Identity</div>
                <div className="grid grid-cols-2 gap-y-1">
                  <Row k="Project"     v={proj?.name ?? draft.projectId} />
                  <Row k="Location"    v={proj ? `${proj.city}, ${proj.country}` : '—'} />
                  <Row k="Shipment"    v={draft.shipmentId ? <span className="font-mono">{draft.shipmentId}</span> : <em style={{ color:'var(--text3)' }}>standalone</em>} />
                  <Row k="Date"        v={<span className="font-mono">{new Date(draft.incidentDate).toLocaleDateString('en-GB')}</span>} />
                  <Row k="Reason"      v={reasonLabel} colSpan={2} />
                </div>
              </div>

              {/* Time math */}
              <div className="rounded-lg p-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Idle Time Calculation</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Tile k="Arrival"        v={draft.arrivalTime} />
                  <Tile k="End"            v={draft.endTime} />
                  <Tile k="Free Hours"     v={`${draft.freeHours} h`} />
                  <Tile k="Total Idle"     v={`${charged} h`} accent={charged > 0 ? '#DC2626' : '#059669'} />
                </div>
                <div className="text-[10px] font-mono mt-1.5 text-right" style={{ color:'var(--text3)' }}>
                  {elapsed}h elapsed − {draft.freeHours}h free = <strong style={{ color: charged > 0 ? '#DC2626' : '#059669' }}>{charged}h chargeable</strong>
                </div>
              </div>

              {/* Money */}
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background:'rgba(220,38,38,.06)', border:'1px solid rgba(220,38,38,.3)' }}>
                <div className="text-[12.5px]">
                  <div className="font-bold uppercase tracking-widest text-[10px]" style={{ color:'#DC2626' }}>Total Currency Product</div>
                  <div className="font-mono mt-0.5" style={{ color:'var(--text2)' }}>
                    {charged}h × {draft.currency} {fmtMoney(draft.penaltyRate)}/h
                  </div>
                </div>
                <span className="text-2xl font-mono font-black" style={{ color: '#DC2626' }}>{draft.currency} {fmtMoney(total)}</span>
              </div>

              {draft.notes && (
                <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Notes</div>
                  <p style={{ color:'var(--text2)' }}>{draft.notes}</p>
                </div>
              )}

              <div className="rounded-lg p-2 flex items-start gap-2 text-[12.5px]" style={{ background:'rgba(217,119,6,.06)', border:'1px solid rgba(217,119,6,.3)' }}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color:'var(--warning)' }} />
                <p style={{ color:'var(--text2)' }}>
                  Once applied, this charge is recorded against the project ledger and cannot be deleted — only adjusted via a new edit. Click <strong style={{ color:'var(--text)' }}>"Save and Apply Changes"</strong> to commit.
                </p>
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>
    </div>
  )
}

function Row({ k, v, colSpan = 1 }) {
  return (
    <div className={`flex items-start gap-2 ${colSpan === 2 ? 'col-span-2' : ''}`}>
      <span className="font-bold flex-shrink-0 w-24 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{k}</span>
      <span style={{ color: 'var(--text)' }}>{v}</span>
    </div>
  )
}

function Tile({ k, v, accent }) {
  return (
    <div className="rounded-lg p-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{k}</div>
      <div className="font-mono font-bold mt-0.5" style={{ color: accent || 'var(--text)' }}>{v}</div>
    </div>
  )
}

function Field({ label, required, error, colSpan = 12, children }) {
  return (
    <div className={`col-span-12 md:col-span-${colSpan}`}>
      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: error ? 'var(--danger)' : 'var(--text3)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] mt-0.5 font-bold" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}
