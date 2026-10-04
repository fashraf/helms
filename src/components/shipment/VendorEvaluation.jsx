// Vendor-performance scoring widget shown on Accounts tab of any closed
// shipment. Three pillars per spec:
//   • Communication — manual 1–5 rating
//   • On-time      — derived from ETA vs ATA + manual 1–5 fallback
//   • Pricing      — derived from shipment pricing vs route average + 1–5
// These per-shipment scores roll up into a vendor's rolling SLA elsewhere.

import { useState, useMemo } from 'react'
import { MessageSquare, Clock, DollarSign, Star, Check, AlertCircle } from 'lucide-react'

const PILLARS = [
  { id: 'communication', label: 'Communication', icon: MessageSquare, color: '#2563EB', desc: 'Responsiveness, clarity, proactive updates' },
  { id: 'onTime',        label: 'On-time',       icon: Clock,         color: '#059669', desc: 'Pickup window + ETA vs ATA' },
  { id: 'pricing',       label: 'Pricing',       icon: DollarSign,    color: '#D97706', desc: 'Cost vs benchmark for this route' },
]

// Auto-rate on-time based on ETA vs ATA in days
//   delta ≤ 0d → 5★ · 1d → 4★ · 2d → 3★ · 3-4d → 2★ · 5d+ → 1★
function autoOnTimeRating(eta, ata) {
  if (!eta || !ata) return null
  const days = Math.round((new Date(ata) - new Date(eta)) / 86400000)
  if (days <= 0) return 5
  if (days === 1) return 4
  if (days === 2) return 3
  if (days <= 4) return 2
  return 1
}

// Vendor evaluation card — drops into Accounts tab of Local/Intl profiles
export default function VendorEvaluation({ shipment, vendorName, vendorId, update, toast, onSubmitted, allShipments = [] }) {
  const existing = shipment.vendorEvaluation
  const submitted = !!existing?.submittedAt

  // Auto-derive on-time + pricing baselines
  const autoOnTime = useMemo(() => autoOnTimeRating(shipment.eta, shipment.actualDeliveryDate ?? shipment.deliveredAt), [shipment])

  // Pricing baseline = average of historical shipments for the same vendor.
  // 5★ = ≤90% of avg · 4★ = ≤100% · 3★ = ≤110% · 2★ = ≤125% · 1★ = >125%
  const autoPricing = useMemo(() => {
    if (!vendorId) return null
    const totalThis = totalSpendOf(shipment)
    if (!totalThis) return null
    const peers = allShipments
      .filter(s => s.id !== shipment.id && (s.vendor === vendorId || s.vendorId === vendorId))
      .map(totalSpendOf).filter(n => n > 0)
    if (peers.length < 2) return null
    const avg = peers.reduce((a, b) => a + b, 0) / peers.length
    const ratio = totalThis / avg
    if (ratio <= 0.90) return 5
    if (ratio <= 1.00) return 4
    if (ratio <= 1.10) return 3
    if (ratio <= 1.25) return 2
    return 1
  }, [shipment, allShipments, vendorId])

  const [draft, setDraft] = useState(() => ({
    communication: existing?.communication ?? 0,
    onTime:        existing?.onTime ?? autoOnTime ?? 0,
    pricing:       existing?.pricing ?? autoPricing ?? 0,
    notes:         existing?.notes ?? '',
    reviewer:      existing?.reviewer ?? '',
  }))

  const setScore = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const canSubmit = draft.communication > 0 && draft.onTime > 0 && draft.pricing > 0 && draft.reviewer.trim().length > 0
  const overall = ((draft.communication + draft.onTime + draft.pricing) / 3) || 0

  const totalThisShipment = totalSpendOf(shipment)

  const submit = () => {
    if (!canSubmit) {
      toast?.warning('Cannot submit', 'Rate all three pillars and add the reviewer name.')
      return
    }
    const now = new Date().toISOString()
    const evalRecord = {
      ...draft,
      autoOnTime, autoPricing, // keep the auto-derived values alongside the manual override
      overall: +overall.toFixed(2),
      submittedAt: now,
    }
    update({ vendorEvaluation: evalRecord })
    toast?.success('Vendor evaluation saved', `${vendorName ?? 'Vendor'} · overall ${overall.toFixed(2)}★`)
    onSubmitted?.(evalRecord)
  }

  return (
    <div className="rounded-xl border-2 p-4 space-y-3" style={{ background:'var(--card)', borderColor: submitted ? '#059669' : '#2563EB' }}>
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4" style={{ color: submitted ? '#059669' : '#2563EB' }} />
        <h4 className="text-sm font-bold" style={{ color: submitted ? '#059669' : '#2563EB' }}>Vendor Performance Evaluation</h4>
        {submitted && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>✓ Submitted</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-[10px]" style={{ color:'var(--text3)' }}>
          {vendorName && <span><strong style={{ color:'var(--text2)' }}>{vendorName}</strong></span>}
          {existing?.submittedAt && <span>· {new Date(existing.submittedAt).toLocaleDateString('en-GB')}</span>}
        </div>
      </div>

      {/* Auto-derived context strip */}
      <div className="rounded-lg p-2 text-[11px] grid grid-cols-3 gap-3" style={{ background:'var(--bg2)' }}>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>ETA → ATA</div>
          <div style={{ color:'var(--text2)' }}>
            {shipment.eta && shipment.actualDeliveryDate ? (
              <>
                <span className="font-mono">{new Date(shipment.eta).toLocaleDateString('en-GB')}</span>
                <span className="mx-1">→</span>
                <span className="font-mono">{new Date(shipment.actualDeliveryDate).toLocaleDateString('en-GB')}</span>
                {autoOnTime !== null && (
                  <span className="ml-1.5 font-bold" style={{ color: autoOnTime >= 4 ? '#059669' : autoOnTime <= 2 ? '#DC2626' : '#D97706' }}>
                    · auto-suggests {autoOnTime}★
                  </span>
                )}
              </>
            ) : (
              <span style={{ color:'var(--text3)' }}>ETA or ATA missing — manual rate</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>This Shipment Cost</div>
          <div style={{ color:'var(--text2)' }}>
            <span className="font-mono">SAR {Number(totalThisShipment || 0).toLocaleString()}</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Pricing vs Vendor Avg</div>
          <div style={{ color:'var(--text2)' }}>
            {autoPricing !== null
              ? <span className="font-bold" style={{ color: autoPricing >= 4 ? '#059669' : autoPricing <= 2 ? '#DC2626' : '#D97706' }}>auto-suggests {autoPricing}★</span>
              : <span style={{ color:'var(--text3)' }}>Insufficient history — manual rate</span>}
          </div>
        </div>
      </div>

      {/* 3 pillars */}
      <div className="grid grid-cols-3 gap-3">
        {PILLARS.map(p => (
          <PillarCard key={p.id} pillar={p}
            value={draft[p.id]}
            disabled={submitted}
            onChange={v => setScore(p.id, v)}
            autoHint={p.id === 'onTime' ? autoOnTime : p.id === 'pricing' ? autoPricing : null} />
        ))}
      </div>

      {/* Notes + reviewer + submit */}
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-7">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reviewer Notes</label>
          <textarea value={draft.notes} disabled={submitted}
            onChange={e => setScore('notes', e.target.value)}
            placeholder="Specific incidents, follow-up actions, vendor strengths…"
            rows={2}
            className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none resize-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Overall</label>
          <div className="rounded-lg px-2 py-2 text-center font-mono font-bold"
            style={{
              background: overall >= 4 ? 'rgba(5,150,105,.08)' : overall >= 3 ? 'rgba(217,119,6,.08)' : overall > 0 ? 'rgba(220,38,38,.08)' : 'var(--bg2)',
              border: `2px solid ${overall >= 4 ? '#059669' : overall >= 3 ? '#D97706' : overall > 0 ? '#DC2626' : 'var(--border)'}`,
              color: overall >= 4 ? '#059669' : overall >= 3 ? '#D97706' : overall > 0 ? '#DC2626' : 'var(--text3)',
            }}>
            {overall > 0 ? `${overall.toFixed(2)}★` : '—'}
          </div>
        </div>
        <div className="col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reviewer <span style={{ color:'var(--danger)' }}>*</span></label>
          <input value={draft.reviewer} disabled={submitted}
            onChange={e => setScore('reviewer', e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none mb-1"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          {!submitted ? (
            <button onClick={submit} disabled={!canSubmit}
              className="w-full px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white transition-opacity flex items-center justify-center gap-1.5"
              style={{ background:'#2563EB', opacity: canSubmit ? 1 : 0.5 }}>
              <Check className="w-3.5 h-3.5" /> Submit Evaluation
            </button>
          ) : (
            <div className="w-full px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-center flex items-center justify-center gap-1.5"
              style={{ background:'rgba(5,150,105,.12)', color:'#059669', border:'1px solid rgba(5,150,105,.4)' }}>
              <Check className="w-3.5 h-3.5" /> Saved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// One pillar's 1–5 selector card
function PillarCard({ pillar, value, onChange, disabled, autoHint }) {
  const Icon = pillar.icon
  return (
    <div className="rounded-lg border p-2.5" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: pillar.color }} />
        <span className="text-[12.5px] font-bold" style={{ color: pillar.color }}>{pillar.label}</span>
        {autoHint !== null && autoHint !== undefined && value !== autoHint && (
          <span className="ml-auto text-[9px] font-mono" style={{ color:'var(--text3)' }}>auto: {autoHint}★</span>
        )}
      </div>
      <div className="text-[10px] mb-1.5" style={{ color:'var(--text3)' }}>{pillar.desc}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => {
          const active = n <= value
          return (
            <button key={n} type="button" disabled={disabled}
              onClick={() => onChange(value === n ? 0 : n)}
              className="flex-1 py-1 rounded text-[10px] font-bold transition-all"
              style={{
                background: active ? pillar.color : 'var(--card)',
                color: active ? '#fff' : 'var(--text3)',
                border: `1px solid ${active ? pillar.color : 'var(--border)'}`,
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? 'default' : 'pointer',
              }}>
              {n}★
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Pull total shipment cost from whichever fields the shipment has stored
function totalSpendOf(s) {
  if (!s) return 0
  if (s.invoice?.totalAmount) return Number(s.invoice.totalAmount) || 0
  if (s.approvedQuoteAmount)  return Number(s.approvedQuoteAmount) || 0
  if (s.totalAmount)          return Number(s.totalAmount) || 0
  // Fallback: pull from approved quote if present
  if (Array.isArray(s.quotes) && s.approvedQuoteId) {
    const q = s.quotes.find(x => x.id === s.approvedQuoteId)
    if (q) return Number(q.amount) || 0
  }
  return 0
}

// Aggregate per-vendor SLA from all submitted evaluations across a shipment list.
export function aggregateVendorSLA(allShipments, vendorId) {
  const records = allShipments
    .filter(s => (s.vendor === vendorId || s.vendorId === vendorId) && s.vendorEvaluation?.submittedAt)
    .map(s => s.vendorEvaluation)
  if (records.length === 0) {
    return { count: 0, overall: null, communication: null, onTime: null, pricing: null }
  }
  const avg = (k) => +(records.reduce((a, r) => a + (r[k] || 0), 0) / records.length).toFixed(2)
  return {
    count: records.length,
    overall:       avg('overall'),
    communication: avg('communication'),
    onTime:        avg('onTime'),
    pricing:       avg('pricing'),
  }
}
