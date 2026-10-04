// ═══════════════════════════════════════════════════════════════════════════
// SHARED SHIPMENT CHECKLIST
// Verbatim port of the Local Shipment checklist — used by BOTH local and
// international shipment profiles. 1:1 feature parity by design: identical
// cards, sequential gating, transit log, cargo container tracking, activity
// timeline, image uploads.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Lock, ClipboardList, CheckCircle2, AlertTriangle, Plus, X, Upload, Check,
  FileText, Box,
} from 'lucide-react'
import EnterpriseModal, { ModalBtn } from '../ui/EnterpriseModal'
import { LOCATION_MASTER, TRANSIT_REASONS } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function fmtDateTime(iso) { if (!iso) return '—'; return new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }

const PHASE_LABELS = {
  loaded:    'Loading Complete',
  pickup:    'Pickup Complete',
  reached:   'Reached Destination',
  delivered: 'Delivered',
}

// ─── Image upload strip (max N images) ──────────────────────────────────────
function ImageUploadStrip({ images = [], onChange, max = 2, label = 'Photos' }) {
  const onFiles = (files) => {
    const left = max - images.length
    Array.from(files).slice(0, left).forEach(f => {
      const r = new FileReader()
      r.onload = () => onChange([...images, r.result])
      r.readAsDataURL(f)
    })
  }
  const remove = (idx) => onChange(images.filter((_, i) => i !== idx))
  return (
    <div>
      <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>{label} <span className="font-normal normal-case" style={{ color:'var(--text3)' }}>({images.length}/{max})</span></div>
      <div className="flex items-center gap-2 flex-wrap">
        {images.map((img, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg border overflow-hidden group" style={{ borderColor:'var(--border)' }}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage:`url(${img})` }} />
            <button onClick={() => remove(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
              style={{ background:'var(--danger)', color:'#fff' }}>
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer"
            style={{ borderColor:'var(--border2)', color:'var(--text3)' }}>
            <Upload className="w-3.5 h-3.5 mb-0.5" />
            <span className="text-[8px] font-bold">UPLOAD</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
          </label>
        )}
      </div>
    </div>
  )
}

function DoneSummary({ items }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ l, v }) => (
        <div key={l} className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
          <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{v}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Cargo container tracking section ───────────────────────────────────────
function CargoTrackingSection({ shipment, update, toast }) {
  const origins = shipment.route?.origins ?? []
  const stops   = shipment.route?.stops ?? []
  const cargo   = (shipment.cargo ?? []).filter(c => c.active !== false)

  const originLabel = (oId) => {
    const o = origins.find(x => x.id === oId)
    if (!o) return '—'
    const idx = origins.findIndex(x => x.id === oId)
    return origins.length > 1 ? `Origin ${idx + 1}: ${locName(o.locationId)}` : locName(o.locationId)
  }
  const stopLabel = (sId) => {
    const s = stops.find(x => x.id === sId)
    if (!s) return '—'
    const idx = stops.findIndex(x => x.id === sId)
    return `${idx === stops.length - 1 ? 'Final' : `Stop ${idx + 1}`}: ${locName(s.locationId)}`
  }

  const setStatus = (cargoNumber, status) => {
    const now = new Date().toISOString()
    const newCargo = cargo.map(c => {
      if (c.cargoNumber !== cargoNumber) return c
      return {
        ...c,
        trackingStatus: status,
        ...(status === 'picked_up' ? { pickedUpAt: now } : {}),
        ...(status === 'delivered' ? { deliveredAt: now } : {}),
      }
    })
    const allCargo = (shipment.cargo ?? []).map(c => newCargo.find(nc => nc.cargoNumber === c.cargoNumber) ?? c)
    update({ cargo: allCargo })
    toast.success('Container updated', `${cargoNumber} → ${status.replace('_', ' ')}`)
  }

  if (cargo.length === 0) return null

  const pendingCount   = cargo.filter(c => (c.trackingStatus ?? 'pending') === 'pending').length
  const pickedUpCount  = cargo.filter(c => c.trackingStatus === 'picked_up').length
  const deliveredCount = cargo.filter(c => c.trackingStatus === 'delivered').length

  return (
    <div className="rounded-xl border" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5" style={{ color:'var(--cyan)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Cargo Container Tracking</h3>
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background:'rgba(6,182,212,.12)', color:'var(--cyan)' }}>{cargo.length}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-bold" style={{ color:'#64748B' }}>{pendingCount} pending</span>
          <span className="opacity-30">·</span>
          <span className="font-bold" style={{ color:'var(--warning)' }}>{pickedUpCount} picked up</span>
          <span className="opacity-30">·</span>
          <span className="font-bold" style={{ color:'var(--success)' }}>{deliveredCount} delivered</span>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor:'var(--border)' }}>
        {cargo.map(c => {
          const packedCount = (c.packedItems ?? []).length
          const totalUnits  = (c.packedItems ?? []).reduce((s, p) => s + Number(p.quantity ?? 0), 0)
          const status = c.trackingStatus ?? 'pending'
          return (
            <div key={c.cargoNumber ?? c.id} className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1">
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(6,182,212,.12)', color:'var(--cyan)' }}>{c.cargoNumber ?? c.id}</span>
              </div>
              <div className="col-span-3">
                <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{c.name ?? '—'}</div>
                <div className="text-[10px]" style={{ color:'var(--text3)' }}>{packedCount} items · {totalUnits} units</div>
              </div>
              <div className="col-span-3 text-[11px]" style={{ color:'var(--text2)' }}>
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color:'var(--text3)' }}>Pickup:</span> {originLabel(c.originId)}
              </div>
              <div className="col-span-3 text-[11px]" style={{ color:'var(--text2)' }}>
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color:'var(--text3)' }}>Drop:</span> {c.destinationId ? stopLabel(c.destinationId) : '—'}
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                {status === 'pending' && (
                  <button onClick={() => setStatus(c.cargoNumber ?? c.id, 'picked_up')} className="px-2 py-1 text-[10px] font-bold rounded border" style={{ background:'var(--card)', borderColor:'var(--warning)', color:'var(--warning)' }}>
                    Mark Picked Up
                  </button>
                )}
                {status === 'picked_up' && (
                  <>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.12)', color:'var(--warning)' }}>Picked Up · {fmtDateTime(c.pickedUpAt)}</span>
                    <button onClick={() => setStatus(c.cargoNumber ?? c.id, 'delivered')} className="px-2 py-1 text-[10px] font-bold rounded text-white" style={{ background:'var(--success)' }}>
                      Mark Delivered
                    </button>
                  </>
                )}
                {status === 'delivered' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'var(--success)' }}>✓ Delivered · {fmtDateTime(c.deliveredAt)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST TAB — verbatim from LocalShipmentProfile
// ═══════════════════════════════════════════════════════════════════════════
export default function SharedChecklistTab({ shipment, update, toast }) {
  const cl = shipment.checklist ?? {}
  const stops = shipment.route?.stops ?? []
  const cargoItems = ['Generator Set', 'Spare Parts Kit', 'Tools Pack', 'Safety Equipment', 'Loading Crane']

  const [loadedDraft, setLoadedDraft] = useState({
    vehicleNumber: cl.loaded?.vehicleNumber ?? '',
    items: cl.loaded?.items ?? [],
    images: cl.loaded?.images ?? [],
  })
  const [pickupDraft, setPickupDraft] = useState({
    driverName: cl.pickup?.driverName ?? '',
    driverContact: cl.pickup?.driverContact ?? '',
    dateTime: cl.pickup?.dateTime ?? '',
    images: cl.pickup?.images ?? [],
  })
  const [reachedDrafts, setReachedDrafts] = useState(() => {
    const initial = cl.reachedDestinations ?? stops.map(s => ({ stopId: s.id, locationId: s.locationId, done: false, dateTime:'', images:[] }))
    return initial.map(r => ({ ...r, dateTime: r.dateTime ?? '', images: r.images ?? [] }))
  })
  const [deliveredDraft, setDeliveredDraft] = useState({
    deliveryNoteAttached: cl.delivered?.deliveryNoteAttached ?? false,
    deliveryNoteFile: cl.delivered?.deliveryNoteFile ?? null,
    images: cl.delivered?.images ?? [],
  })

  const isLoadedDone   = cl.loaded?.done
  const isPickupDone   = cl.pickup?.done
  const isReachedDone  = (cl.reachedDestinations ?? []).every(r => r.done) && (cl.reachedDestinations ?? []).length > 0
  const isDeliveredDone = cl.delivered?.done

  // ─── Transit log ─────────────────────────────────────────────────────────
  const transitLogs = cl.transitLogs ?? []
  const [transitOpen, setTransitOpen] = useState(false)
  const [transitDraft, setTransitDraft] = useState({ phase:'', reason:'', notes:'' })

  const logTransit = () => {
    if (!transitDraft.phase)  { toast.warning('Pick phase', 'Which checklist step is in transit?'); return }
    if (!transitDraft.reason) { toast.warning('Pick reason', 'Choose a transit reason.'); return }
    const newLog = {
      id: `TL-${Date.now()}`,
      phase: transitDraft.phase,
      reason: transitDraft.reason,
      notes: transitDraft.notes,
      recordedAt: new Date().toISOString(),
    }
    update({ checklist: { ...cl, transitLogs: [...transitLogs, newLog] } })
    toast.success('Transit logged', TRANSIT_REASONS.find(r => r.id === transitDraft.reason)?.label)
    setTransitOpen(false); setTransitDraft({ phase:'', reason:'', notes:'' })
  }

  // ─── Activity timeline ──────────────────────────────────────────────────
  const timeline = (() => {
    const events = []
    if (cl.loaded?.completedAt)   events.push({ key:'loaded',  label:'Loading Complete',  date: cl.loaded.completedAt,  type:'complete', icon:'📦' })
    if (cl.pickup?.completedAt)   events.push({ key:'pickup',  label:'Pickup Complete',   date: cl.pickup.completedAt,  type:'complete', icon:'🚚' })
    ;(cl.reachedDestinations ?? []).forEach((r, i) => {
      if (r.done && r.dateTime)   events.push({ key:`reached-${i}`, label:`Reached Destination ${i + 1}`, date: r.dateTime, type:'complete', icon:'📍' })
    })
    if (cl.delivered?.completedAt) events.push({ key:'delivered', label:'Delivered', date: cl.delivered.completedAt, type:'complete', icon:'✅' })
    transitLogs.forEach(t => events.push({ key: t.id, label: PHASE_LABELS[t.phase] ?? t.phase, date: t.recordedAt, type:'transit', reason: t.reason, notes: t.notes, icon:'⚠️' }))
    events.sort((a, b) => new Date(a.date) - new Date(b.date))
    return events.map((e, i) => ({
      ...e,
      dayGap: i > 0 ? Math.floor((new Date(e.date) - new Date(events[i - 1].date)) / 86400000) : null,
    }))
  })()

  const pushAudit = (entries) => [...(shipment.auditLog ?? []), ...entries]

  const confirmLoaded = () => {
    if (!loadedDraft.vehicleNumber.trim()) { toast.warning('Missing', 'Vehicle number is required.'); return }
    if (loadedDraft.items.length === 0)    { toast.warning('Missing', 'Select at least one item being loaded.'); return }
    if (loadedDraft.images.length < 2)     { toast.warning('Missing', '2 photos required.'); return }
    const now = new Date().toISOString()
    update({
      checklist: { ...cl, loaded: { done: true, vehicleNumber: loadedDraft.vehicleNumber, items: loadedDraft.items, images: loadedDraft.images, completedAt: now } },
      deliveryStatus: 'loaded',
      auditLog: pushAudit([{ id:`AUD-${shipment.id}-${Date.now()}`, actor:'Khalid Salman', action:'Loading checklist completed', date: now, meta:{ vehicle: loadedDraft.vehicleNumber, items: loadedDraft.items.length } }]),
    })
    toast.success('Step 1 done', 'Loading confirmed · move to Pickup Complete')
  }
  const confirmPickup = () => {
    if (!pickupDraft.driverName.trim())    { toast.warning('Missing', 'Driver name required.'); return }
    if (!pickupDraft.driverContact.trim()) { toast.warning('Missing', 'Driver contact required.'); return }
    if (!pickupDraft.dateTime)             { toast.warning('Missing', 'Pickup date/time required.'); return }
    if (pickupDraft.images.length < 2)     { toast.warning('Missing', '2 photos required.'); return }
    const now = new Date().toISOString()
    update({
      checklist: { ...cl, pickup: { done: true, ...pickupDraft, completedAt: now } },
      deliveryStatus: 'pickup_complete',
      auditLog: pushAudit([{ id:`AUD-${shipment.id}-${Date.now()}`, actor: pickupDraft.driverName, action:'Pickup confirmed', date: now, meta:{ driverContact: pickupDraft.driverContact } }]),
    })
    toast.success('Step 2 done', 'Pickup confirmed · move to Reached Destination')
  }
  const confirmReached = (idx) => {
    const r = reachedDrafts[idx]
    if (!r.dateTime)         { toast.warning('Missing', 'Date/time required.'); return }
    if (r.images.length < 2) { toast.warning('Missing', '2 photos required.'); return }
    const now = new Date().toISOString()
    const updated = reachedDrafts.map((x, i) => i === idx ? { ...x, done: true, completedAt: now } : x)
    setReachedDrafts(updated)
    const allDone = updated.every(x => x.done)
    update({
      checklist: { ...cl, reachedDestinations: updated },
      deliveryStatus: allDone ? 'reached_destination' : 'pickup_complete',
      auditLog: pushAudit([{ id:`AUD-${shipment.id}-${Date.now()}`, actor:'Driver', action:`Reached ${locName(r.locationId)}`, date: now }]),
    })
    toast.success(`Destination ${idx + 1} reached`, `${locName(r.locationId)}`)
  }
  const confirmDelivered = () => {
    if (!deliveredDraft.deliveryNoteAttached) { toast.warning('Missing', 'Delivery note must be attached to close the shipment.'); return }
    if (deliveredDraft.images.length < 2)     { toast.warning('Missing', '2 photos required.'); return }
    const now = new Date().toISOString()
    update({
      checklist: { ...cl, delivered: { done: true, ...deliveredDraft, completedAt: now } },
      deliveryStatus: 'delivered',
      status: 'delivered',
      actualDeliveryDate: now,
      auditLog: pushAudit([{ id:`AUD-${shipment.id}-${Date.now()}`, actor:'Site Manager', action:'Shipment delivered + closed', date: now, meta:{ deliveryNote: deliveredDraft.deliveryNoteFile } }]),
    })
    toast.success('🎉 Shipment closed', 'All checklist steps complete · marked as delivered')
  }

  const Card = ({ step, title, locked, done, children, color = 'var(--primary)' }) => (
    <div className="rounded-xl border-2 overflow-hidden transition-all"
      style={{ ...C, borderColor: done ? 'var(--success)' : locked ? 'var(--border)' : color, opacity: locked ? 0.55 : 1 }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: done ? 'rgba(5,150,105,.08)' : 'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0" style={{ background: done ? 'var(--success)' : locked ? 'var(--text3)' : color }}>
          {done ? '✓' : locked ? <Lock className="w-4 h-4" /> : step}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{title}</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{done ? 'Completed' : locked ? 'Locked — complete the previous step first' : 'Ready to complete'}</div>
        </div>
      </div>
      {!locked && <div className="p-4">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
        <ClipboardList className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
        <div>
          <div className="text-xs font-bold mb-0.5" style={{ color:'var(--primary)' }}>Sequential checklist</div>
          <div className="text-[11px]" style={{ color:'var(--text2)' }}>Each step must be confirmed in order. Complete each card with the required information and 2 photos to unlock the next.</div>
        </div>
      </div>

      {/* Card 1: Loaded */}
      <Card step={1} title="Loaded — Items + Vehicle" done={isLoadedDone} locked={false} color="var(--cyan)">
        {!isLoadedDone ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8 space-y-3">
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Items in this Shipment <span style={{ color:'var(--danger)' }}>*</span></label>
                <div className="rounded-lg border p-2 space-y-1" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                  {cargoItems.map(item => {
                    const checked = loadedDraft.items.includes(item)
                    return (
                      <label key={item} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors" style={{ background: checked ? 'var(--card)' : 'transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setLoadedDraft(d => ({ ...d, items: checked ? d.items.filter(x => x !== item) : [...d.items, item] }))
                        }} className="w-4 h-4" />
                        <span className="text-xs font-medium" style={{ color: checked ? 'var(--text)' : 'var(--text2)' }}>{item}</span>
                        {checked && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" style={{ color:'var(--success)' }} />}
                      </label>
                    )
                  })}
                </div>
                <div className="text-[12.5px] mt-1" style={{ color:'var(--text3)' }}>{loadedDraft.items.length} of {cargoItems.length} items selected</div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 space-y-3">
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Vehicle Number <span style={{ color:'var(--danger)' }}>*</span></label>
                <input value={loadedDraft.vehicleNumber} onChange={e => setLoadedDraft(d => ({ ...d, vehicleNumber: e.target.value.toUpperCase() }))} placeholder="KSA-1234"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <ImageUploadStrip images={loadedDraft.images} onChange={imgs => setLoadedDraft(d => ({ ...d, images: imgs }))} max={2} label="Vehicle Photos *" />
            </div>
            <div className="col-span-12">
              <button onClick={confirmLoaded} className="w-full py-2.5 text-sm font-bold rounded-lg text-white" style={{ background:'var(--success)' }}>
                ✓ Confirm Loading
              </button>
            </div>
          </div>
        ) : (
          <DoneSummary items={[
            { l:'Vehicle', v: cl.loaded.vehicleNumber },
            { l:'Items', v: `${cl.loaded.items.length} loaded` },
            { l:'Photos', v: `${cl.loaded.images?.length ?? 0} attached` },
            { l:'Completed', v: fmtDateTime(cl.loaded.completedAt) },
          ]} />
        )}
      </Card>

      {/* Card 2: Pickup */}
      <Card step={2} title="Pickup Complete — Driver Confirmation" done={isPickupDone} locked={!isLoadedDone} color="var(--primary)">
        {!isPickupDone ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Driver Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <input value={pickupDraft.driverName} onChange={e => setPickupDraft(d => ({ ...d, driverName: e.target.value }))} placeholder="Full name"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Contact Number <span style={{ color:'var(--danger)' }}>*</span></label>
                <input value={pickupDraft.driverContact} onChange={e => setPickupDraft(d => ({ ...d, driverContact: e.target.value }))} placeholder="+966 5X XXX XXXX"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div className="col-span-2">
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Pickup Date & Time <span style={{ color:'var(--danger)' }}>*</span></label>
                <input type="datetime-local" value={pickupDraft.dateTime} onChange={e => setPickupDraft(d => ({ ...d, dateTime: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <ImageUploadStrip images={pickupDraft.images} onChange={imgs => setPickupDraft(d => ({ ...d, images: imgs }))} max={2} label="Pickup Photos *" />
            </div>
            <div className="col-span-12">
              <button onClick={confirmPickup} className="w-full py-2.5 text-sm font-bold rounded-lg text-white" style={{ background:'var(--success)' }}>
                ✓ Confirm & Submit Pickup
              </button>
            </div>
          </div>
        ) : (
          <DoneSummary items={[
            { l:'Driver', v: cl.pickup.driverName },
            { l:'Contact', v: cl.pickup.driverContact },
            { l:'Pickup Time', v: fmtDateTime(cl.pickup.dateTime) },
            { l:'Confirmed', v: fmtDateTime(cl.pickup.completedAt) },
          ]} />
        )}
      </Card>

      {/* Card 3: Reached destinations */}
      <Card step={3} title={`Reached Destination${reachedDrafts.length > 1 ? `s (${reachedDrafts.length})` : ''}`} done={isReachedDone} locked={!isPickupDone} color="#8B5CF6">
        <div className="space-y-3">
          {reachedDrafts.length === 0 && (
            <div className="rounded-lg border-2 border-dashed p-4 text-center text-[12.5px]" style={{ borderColor:'var(--border2)', color:'var(--text3)' }}>
              No intermediate stops configured for this shipment — proceed directly to Delivered.
            </div>
          )}
          {reachedDrafts.map((r, i) => {
            const stop = stops.find(s => s.id === r.stopId)
            return (
              <div key={r.stopId} className="rounded-lg border" style={{ background: r.done ? 'rgba(5,150,105,.05)' : 'var(--bg2)', borderColor: r.done ? 'var(--success)' : 'var(--border)' }}>
                <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white" style={{ background: r.done ? 'var(--success)' : '#8B5CF6' }}>{r.done ? '✓' : i + 1}</div>
                  <span className="text-xs font-bold" style={{ color:'var(--text)' }}>{locName(r.locationId)}</span>
                  <span className="text-[9px] font-mono ml-1 px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text3)' }}>{stop?.type ?? 'final'}</span>
                </div>
                {!r.done ? (
                  <div className="p-3 grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-8">
                      <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Date & Time Reached <span style={{ color:'var(--danger)' }}>*</span></label>
                      <input type="datetime-local" value={r.dateTime} onChange={e => setReachedDrafts(arr => arr.map((x, idx) => idx === i ? { ...x, dateTime: e.target.value } : x))}
                        className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <ImageUploadStrip images={r.images} onChange={imgs => setReachedDrafts(arr => arr.map((x, idx) => idx === i ? { ...x, images: imgs } : x))} max={2} label="Photos *" />
                    </div>
                    <div className="col-span-12">
                      <button onClick={() => confirmReached(i)} className="w-full py-2 text-xs font-bold rounded-lg text-white" style={{ background:'#8B5CF6' }}>
                        ✓ Confirm Arrival at {locName(r.locationId)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 text-[12.5px] flex items-center gap-3" style={{ color:'var(--text3)' }}>
                    <span>⏱ {fmtDateTime(r.dateTime)}</span>
                    <span>📷 {r.images?.length ?? 0} photos</span>
                    <span className="ml-auto font-bold" style={{ color:'var(--success)' }}>Confirmed {fmtDateTime(r.completedAt)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Card 4: Delivered */}
      <Card step={4} title="Delivered — Close Shipment" done={isDeliveredDone} locked={reachedDrafts.length > 0 ? !isReachedDone : !isPickupDone} color="var(--success)">
        {!isDeliveredDone ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8 space-y-3">
              <div className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={deliveredDraft.deliveryNoteAttached} onChange={e => setDeliveredDraft(d => ({ ...d, deliveryNoteAttached: e.target.checked, deliveryNoteFile: e.target.checked ? `DN-${shipment.id}.pdf` : null }))} className="w-4 h-4" />
                  <span className="text-xs font-bold" style={{ color:'var(--text)' }}>Delivery Note Attached <span style={{ color:'var(--danger)' }}>*</span></span>
                </label>
                <div className="text-[12.5px] mt-1 ml-6" style={{ color:'var(--text3)' }}>Required to close this shipment. The DN PDF will be auto-attached.</div>
                {deliveredDraft.deliveryNoteAttached && (
                  <div className="mt-2 ml-6 flex items-center gap-2 text-xs" style={{ color:'var(--success)' }}>
                    <FileText className="w-3.5 h-3.5" /><span className="font-mono">{deliveredDraft.deliveryNoteFile}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <ImageUploadStrip images={deliveredDraft.images} onChange={imgs => setDeliveredDraft(d => ({ ...d, images: imgs }))} max={2} label="Delivery Photos *" />
            </div>
            <div className="col-span-12">
              <button onClick={confirmDelivered} className="w-full py-2.5 text-sm font-bold rounded-lg text-white" style={{ background:'var(--success)' }}>
                🎉 Confirm Delivery & Close Shipment
              </button>
            </div>
          </div>
        ) : (
          <DoneSummary items={[
            { l:'Delivery Note', v: cl.delivered.deliveryNoteFile ?? '—' },
            { l:'Photos', v: `${cl.delivered.images?.length ?? 0} attached` },
            { l:'Closed', v: fmtDateTime(cl.delivered.completedAt) },
          ]} />
        )}
      </Card>

      {/* Cargo Container Tracking */}
      <CargoTrackingSection shipment={shipment} update={update} toast={toast} />

      {/* Transit Log */}
      <div className="rounded-xl border" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color:'var(--warning)' }} />
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Transit Log</h3>
            <span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:'rgba(217,119,6,.12)', color:'#D97706' }}>{transitLogs.length}</span>
          </div>
          <button onClick={() => setTransitOpen(true)} className="px-2.5 py-1 text-[12.5px] font-bold rounded-lg border flex items-center gap-1" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--warning)' }}>
            <Plus className="w-3 h-3" /> Log Transit
          </button>
        </div>
        {transitLogs.length === 0 ? (
          <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No transit issues logged · use Log Transit to flag holds (payment, weather, vehicle, etc.)</div>
        ) : (
          <div className="divide-y" style={{ borderColor:'var(--border)' }}>
            {transitLogs.map(t => {
              const reason = TRANSIT_REASONS.find(r => r.id === t.reason)
              return (
                <div key={t.id} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-start text-xs">
                  <div className="col-span-3">
                    <span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>{PHASE_LABELS[t.phase] ?? t.phase}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" style={{ color: reason?.color }} />
                    <span className="font-bold" style={{ color: reason?.color }}>{reason?.label ?? 'Other'}</span>
                  </div>
                  <div className="col-span-4 text-[11px]" style={{ color:'var(--text2)' }}>{t.notes || <em style={{ color:'var(--text3)' }}>(no notes)</em>}</div>
                  <div className="col-span-2 text-right text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDateTime(t.recordedAt)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl border p-4" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Activity Timeline</h3>
        {timeline.length === 0 ? (
          <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No checklist activity yet. Complete a step or log a transit to populate this timeline.</div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background:'var(--border)' }} />
            {timeline.map((e, idx) => {
              const reason = TRANSIT_REASONS.find(r => r.id === e.reason)
              const tooltip = e.type === 'complete' ? `Completed: ${e.label}` : `${reason?.label}: ${e.notes || 'No notes'}`
              return (
                <div key={e.key} className="relative pl-12 pb-4">
                  <div className="absolute left-1 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: e.type === 'complete' ? '#059669' : reason?.color ?? '#64748B', border: '2px solid var(--card)', color:'#fff' }}>
                    {e.type === 'complete' ? <Check className="w-3 h-3" /> : '!'}
                  </div>
                  <div className="rounded-lg border p-2.5 cursor-help" style={{ background:'var(--bg2)', borderColor:'var(--border)' }} title={tooltip}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold" style={{ color:'var(--text)' }}>
                          <span className="mr-1">{e.icon}</span>{e.label}
                          {e.type === 'transit' && <span className="ml-2 text-[12.5px] font-bold" style={{ color: reason?.color }}>· {reason?.label}</span>}
                        </div>
                        <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDateTime(e.date)}</div>
                      </div>
                      {idx > 0 && e.dayGap != null && (
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background:'var(--card)', color: e.dayGap > 3 ? 'var(--warning)' : 'var(--text2)' }}>
                          +{e.dayGap}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Transit modal */}
      <EnterpriseModal open={transitOpen} onClose={() => { setTransitOpen(false); setTransitDraft({ phase:'', reason:'', notes:'' }) }}
        title="Log Transit Reason" subtitle="Flag a checklist step as in transit"
        icon={<AlertTriangle className="w-4 h-4" style={{ color:'var(--warning)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => { setTransitOpen(false); setTransitDraft({ phase:'', reason:'', notes:'' }) }}>Cancel</ModalBtn><ModalBtn onClick={logTransit}>Log Transit</ModalBtn></>}>
        <div className="space-y-2">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Phase <span style={{ color:'var(--danger)' }}>*</span></label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(PHASE_LABELS).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTransitDraft(d => ({ ...d, phase: id }))}
                  className="px-2.5 py-2 text-[11px] font-bold rounded-lg border-2"
                  style={{
                    background: transitDraft.phase === id ? 'var(--primary-light)' : 'var(--bg2)',
                    borderColor: transitDraft.phase === id ? 'var(--primary)' : 'var(--border)',
                    color: transitDraft.phase === id ? 'var(--primary)' : 'var(--text2)',
                  }}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reason <span style={{ color:'var(--danger)' }}>*</span></label>
            <div className="grid grid-cols-2 gap-1.5">
              {TRANSIT_REASONS.map(r => (
                <button key={r.id} type="button" onClick={() => setTransitDraft(d => ({ ...d, reason: r.id }))}
                  className="px-2 py-1.5 text-[12.5px] font-bold rounded-lg border-2 flex items-center gap-1.5"
                  style={{
                    background: transitDraft.reason === r.id ? `${r.color}15` : 'var(--bg2)',
                    borderColor: transitDraft.reason === r.id ? r.color : 'var(--border)',
                    color: transitDraft.reason === r.id ? r.color : 'var(--text2)',
                  }}>
                  <AlertTriangle className="w-2.5 h-2.5" />{r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Notes</label>
            <textarea value={transitDraft.notes} onChange={e => setTransitDraft({ ...transitDraft, notes: e.target.value })} rows={3} placeholder="Describe the hold · expected resolution date · responsible party"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
