// HELMS Logistics Detail — per-item packing/release workflow with confirmations + timeline
import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Package, Send, Truck, Plane, MapPin, CheckCircle2, AlertCircle,
  Clock, History, ClipboardCheck, Boxes, Activity, Lock, FileText, User,
  Check, X,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useToastStore       from '../../store/toastStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  LOCATION_MASTER, OVERALL_STATUS_CFG, deriveOverallStatus, computeKPIs,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function fmtDateTime(iso) { if (!iso) return '—'; return new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
function fmtHours(h) { if (h === null || h === undefined) return '—'; if (h < 24) return `${h}h`; return `${Math.floor(h/24)}d ${h % 24}h` }

export default function LogisticsDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getShipment, updateLocalShipment } = useShipmentV2Store()
  const toast = useToastStore()

  const shipment = getShipment(id)
  const [confirmItem, setConfirmItem]       = useState(null)   // { item, action:'pack'|'release' }
  const [confirmRelease, setConfirmRelease] = useState(false)  // release-shipment modal
  const [confirmDelivery, setConfirmDelivery] = useState(false) // delivery-confirmation modal
  const [deliveryForm, setDeliveryForm] = useState({ deliveryNoteNumber:'', remarks:'', deliveryNoteFile:'' })

  if (!shipment) {
    return (
      <div className="rounded-xl border p-12 text-center" style={C}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--danger)' }} />
        <h3 className="text-base font-bold mb-1" style={{ color:'var(--text)' }}>Shipment not found</h3>
        <button onClick={() => navigate('/logistics')} className="px-4 py-2 text-xs font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
          ← Back to Logistics
        </button>
      </div>
    )
  }

  const isIntl = shipment.type === 'international' || shipment.originCountry || shipment.origins?.[0]?.country
  const items  = isIntl
    ? (shipment.items ?? []).filter(i => i.active !== false)
    : (shipment.checklist?.loaded?.items ?? [])
  const cargo  = (shipment.cargo ?? []).filter(c => c.active !== false)
  const allUnits = [...items.map(i => ({ ...i, _kind:'item' })), ...cargo.map(c => ({ ...c, _kind:'cargo', name: c.name || `Cargo Unit` }))]
  const packedCount   = allUnits.filter(u => u.packed).length
  const releasedCount = allUnits.filter(u => u.released).length
  const allPacked     = allUnits.length > 0 && packedCount === allUnits.length
  const allReleased   = allUnits.length > 0 && releasedCount === allUnits.length
  const overall = deriveOverallStatus(shipment)
  const cfg = OVERALL_STATUS_CFG[overall]
  const kpis = computeKPIs(shipment)

  // ─── Mutation helpers ────────────────────────────────────────────────
  const updateItemsInStore = (newItems, newCargo, extra = {}) => {
    if (isIntl) {
      toast.info('Local only', 'Per-item updates are wired for local shipments in this build.')
      return
    }
    updateLocalShipment(shipment.id, {
      checklist: { ...shipment.checklist, loaded: { ...shipment.checklist?.loaded, items: newItems } },
      cargo: newCargo,
      auditLog: [...(shipment.auditLog ?? []), ...(extra.audit ?? [])],
      ...extra.fields,
    })
  }

  const handleConfirmItem = () => {
    if (!confirmItem) return
    const { item, action } = confirmItem
    const now = new Date().toISOString()
    const updateOne = (arr) => arr.map(x => x.id === item.id
      ? (action === 'pack'
          ? { ...x, packed: true,   packedAt:   now }
          : { ...x, released: true, releasedAt: now })
      : x)
    const newItems = updateOne(items)
    const newCargo = updateOne(cargo)
    const audit = [{
      id: `AUD-${shipment.id}-${Date.now()}`,
      actor: 'Khalid Salman',
      action: action === 'pack' ? `Item packed: ${item.name}` : `Item released: ${item.name}`,
      date: now,
      meta: { unitId: item.id, kind: item._kind ?? 'item' },
    }]
    updateItemsInStore(newItems, newCargo, { audit })
    toast.success(action === 'pack' ? 'Item packed' : 'Item released', item.name)
    setConfirmItem(null)
  }

  const handleConfirmRelease = () => {
    const now = new Date().toISOString()
    // Mark every unit released + set shipment-level releasedAt
    const newItems = items.map(i => ({ ...i, released: true, releasedAt: i.releasedAt ?? now }))
    const newCargo = cargo.map(c => ({ ...c, released: true, releasedAt: c.releasedAt ?? now }))
    const audit = [{
      id: `AUD-${shipment.id}-${Date.now()}`,
      actor: 'Khalid Salman',
      action: 'Shipment released from Logistics',
      date: now,
      meta: { itemsReleased: newItems.length, cargoReleased: newCargo.length },
    }]
    updateItemsInStore(newItems, newCargo, {
      audit,
      fields: { releasedAt: now, releasedBy: 'Khalid Salman', releaseRemarks: 'Released after all items confirmed packed' },
    })
    toast.success('🚛 Shipment Released', `${shipment.id} has been dispatched from the warehouse`)
    setConfirmRelease(false)
  }

  const handleConfirmDelivery = () => {
    if (!deliveryForm.deliveryNoteNumber?.trim()) {
      toast.warning('Missing field', 'Delivery Note Number is required to confirm delivery.')
      return
    }
    if (isIntl) {
      toast.info('Local only', 'Per-item delivery confirmation is wired for local shipments in this build.')
      return
    }
    const now = new Date().toISOString()
    const newItems = items.map(i => ({ ...i, delivered: true, deliveredAt: now }))
    const newCargo = cargo.map(c => ({ ...c, delivered: true, deliveredAt: now }))
    const audit = [{
      id: `AUD-${shipment.id}-${Date.now()}`,
      actor: 'Khalid Salman',
      action: 'Shipment confirmed delivered from Logistics',
      date: now,
      meta: {
        deliveryNoteNumber: deliveryForm.deliveryNoteNumber,
        remarks: deliveryForm.remarks,
        deliveryNoteFile: deliveryForm.deliveryNoteFile,
        itemsDelivered: newItems.length,
      },
    }]
    updateLocalShipment(shipment.id, {
      checklist: {
        ...shipment.checklist,
        loaded: { ...shipment.checklist?.loaded, items: newItems },
        delivered: {
          ...shipment.checklist?.delivered,
          done: true,
          deliveryNoteAttached: !!deliveryForm.deliveryNoteFile,
          deliveryNoteFile: deliveryForm.deliveryNoteFile || shipment.checklist?.delivered?.deliveryNoteFile,
          images: shipment.checklist?.delivered?.images ?? [],
          completedAt: now,
        },
      },
      cargo: newCargo,
      actualDeliveryDate: now,
      deliveryNoteNumber: deliveryForm.deliveryNoteNumber,
      deliveryStatus: 'delivered',
      status: 'delivered',
      auditLog: [...(shipment.auditLog ?? []), ...audit],
    })
    toast.success('✓ Delivery Confirmed', `${shipment.id} is now in Delivered status · DN ${deliveryForm.deliveryNoteNumber}`)
    setConfirmDelivery(false)
    setDeliveryForm({ deliveryNoteNumber:'', remarks:'', deliveryNoteFile:'' })
  }

  // ─── Build a status flow timeline for the side panel ─────────────────
  const approvedQ = shipment.quotes?.find(q => q.status === 'approved')
  const flowEvents = [
    { key:'created',          label:'Created',          date: shipment.createdAt },
    { key:'vendor_allocated', label:'Vendor Allocated', date: approvedQ?.approvedAt },
    { key:'packed',           label:'Packed',           date: shipment.packedAt },
    { key:'released',         label:'Released',         date: shipment.releasedAt },
    { key:'delivered',        label:'Delivered',        date: shipment.actualDeliveryDate ?? shipment.checklist?.delivered?.completedAt },
    { key:'closed',           label:'Closed',           date: shipment.vendorInvoices?.find(v => v.closure)?.closure?.date },
  ]

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/logistics')} className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ ...C, color:'var(--text2)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Boxes className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
              <span className="font-mono">{shipment.id}</span>
              {isIntl ? <Plane className="w-4 h-4" style={{ color:'var(--primary)' }} /> : <Truck className="w-4 h-4" style={{ color:'var(--success)' }} />}
              <span className="text-[12.5px] font-normal px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>
                {isIntl ? 'International' : 'Local'} · {shipment.shipmentType ?? '—'}
              </span>
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color:'var(--text3)' }}>
              {isIntl ? (shipment.originCountry ?? shipment.origins?.[0]?.country ?? '—') : (locName(shipment.route?.origin?.locationId) || locName(shipment.route?.origins?.[0]?.locationId))}
              <span className="mx-1">→</span>
              {isIntl ? (shipment.destinations?.[0]?.country ?? '—') : locName(shipment.route?.stops?.[shipment.route?.stops?.length - 1]?.locationId)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Pipeline Status</div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg mt-0.5" style={{ background:`${cfg.color}15`, color: cfg.color, border:`1px solid ${cfg.color}40` }}>
              <span>{cfg.icon}</span>{cfg.label}
              <span className="ml-1 text-[9px] font-mono opacity-70">{cfg.step}/6</span>
            </span>
          </div>
          {!shipment.releasedAt && allPacked && (
            <button onClick={() => setConfirmRelease(true)} className="px-4 py-2 text-sm font-bold rounded-lg text-white animate-pulse" style={{ background:'var(--primary)' }}>
              🚛 Release Shipment
            </button>
          )}
          {shipment.releasedAt && !shipment.actualDeliveryDate && (
            <button onClick={() => setConfirmDelivery(true)} className="px-4 py-2 text-sm font-bold rounded-lg text-white animate-pulse" style={{ background:'var(--success)' }}>
              ✓ Confirm Delivery
            </button>
          )}
          {shipment.actualDeliveryDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg" style={{ background:'rgba(5,150,105,.15)', color:'var(--success)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Delivered {fmtDateTime(shipment.actualDeliveryDate)}
            </span>
          )}
        </div>
      </div>

      {/* Progress strip */}
      <div className="rounded-xl border p-3" style={C}>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Fulfillment Progress</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{allUnits.length} units · {packedCount} packed · {releasedCount} released</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12.5px] font-bold" style={{ color:'var(--cyan)' }}>📦 Packing</span>
              <span className="text-[12.5px] font-mono font-bold" style={{ color:'var(--cyan)' }}>{packedCount} / {allUnits.length}</span>
            </div>
            <div className="h-2 rounded overflow-hidden" style={{ background:'var(--border)' }}>
              <div className="h-full transition-all" style={{ width: `${(packedCount / Math.max(1, allUnits.length)) * 100}%`, background:'var(--cyan)' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>🚛 Release</span>
              <span className="text-[12.5px] font-mono font-bold" style={{ color:'var(--primary)' }}>{releasedCount} / {allUnits.length}</span>
            </div>
            <div className="h-2 rounded overflow-hidden" style={{ background:'var(--border)' }}>
              <div className="h-full transition-all" style={{ width: `${(releasedCount / Math.max(1, allUnits.length)) * 100}%`, background:'var(--primary)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Items + cargo list (left, col-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          {allUnits.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
              <Boxes className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
              <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No items recorded yet</p>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>Items / cargo will appear here once the shipment is created</p>
            </div>
          ) : (
            <>
              {/* Items section */}
              {items.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={C}>
                  <div className="px-3 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Items ({items.length})</h3>
                    <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Click an action to pack or release</span>
                  </div>
                  <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                    {items.map((it, i) => (
                      <ItemRow key={it.id ?? i} unit={{ ...it, _kind:'item' }} index={i + 1}
                        onPack={() => setConfirmItem({ item: { ...it, _kind:'item' }, action:'pack' })}
                        onRelease={() => setConfirmItem({ item: { ...it, _kind:'item' }, action:'release' })} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cargo units section */}
              {cargo.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={C}>
                  <div className="px-3 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Cargo Units ({cargo.length})</h3>
                  </div>
                  <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                    {cargo.map((c, i) => (
                      <ItemRow key={c.id ?? i} unit={{ ...c, _kind:'cargo', name: c.name || `Cargo Unit ${i + 1}` }} index={i + 1}
                        onPack={() => setConfirmItem({ item: { ...c, _kind:'cargo', name: c.name || `Cargo Unit ${i + 1}` }, action:'pack' })}
                        onRelease={() => setConfirmItem({ item: { ...c, _kind:'cargo', name: c.name || `Cargo Unit ${i + 1}` }, action:'release' })} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar: Timeline + KPIs (col-4) */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {/* Status flow timeline */}
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                <Activity className="w-3.5 h-3.5" /> Status Timeline
              </h3>
            </div>
            <div className="p-3">
              <div className="space-y-0">
                {flowEvents.map((e, i) => {
                  const stageCfg = OVERALL_STATUS_CFG[e.key]
                  const done = !!e.date
                  const next = flowEvents[i + 1]
                  const gap = (done && next?.date) ? Math.round((new Date(next.date) - new Date(e.date)) / 36e5) : null
                  return (
                    <div key={e.key} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] relative z-10 flex-shrink-0"
                          style={{ background: done ? stageCfg.color : 'var(--bg2)', border: done ? `2px solid ${stageCfg.color}` : '2px solid var(--border)' }}>
                          {done ? <Check className="w-3.5 h-3.5 text-white" /> : stageCfg.icon}
                        </div>
                        {i < flowEvents.length - 1 && (
                          <div className="flex-1 w-0.5 my-1 relative" style={{ background: done && next.date ? stageCfg.color : 'var(--border)', minHeight: 36 }}>
                            {gap !== null && (
                              <div className="absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded whitespace-nowrap"
                                style={{ background:'var(--card)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                                +{gap < 24 ? `${gap}h` : `${Math.floor(gap/24)}d`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pb-3 pt-0.5">
                        <div className="text-[11px] font-bold" style={{ color: done ? 'var(--text)' : 'var(--text3)' }}>{e.label}</div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color:'var(--text3)' }}>{e.date ? fmtDateTime(e.date) : 'Pending'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                <Clock className="w-3.5 h-3.5" /> Processing KPIs
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                { l:'Created → Packed',  v: fmtHours(kpis.createdToPacked),  c:'var(--cyan)' },
                { l:'Packed → Released', v: fmtHours(kpis.packedToReleased), c:'var(--primary)' },
                { l:'Released → Delivered', v: fmtHours(kpis.releasedToDelivered), c:'var(--success)' },
                { l:'Total Processing',  v: fmtHours(kpis.totalProcessing),  c:'#8B5CF6' },
              ].map(({ l, v, c }) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Open profile button */}
          <button onClick={() => navigate(`/shipments/${isIntl ? 'intl' : 'local'}/${shipment.id}`)}
            className="w-full px-3 py-2.5 text-xs font-bold rounded-lg border" style={{ ...C, color:'var(--primary)' }}>
            Open Full Shipment Profile →
          </button>
        </div>
      </div>

      {/* Per-item confirmation modal */}
      <EnterpriseModal open={!!confirmItem} onClose={() => setConfirmItem(null)}
        title={confirmItem?.action === 'pack' ? 'Mark Item as Packed?' : 'Mark Item as Released?'}
        subtitle={confirmItem?.item?.name ?? ''}
        icon={confirmItem?.action === 'pack' ? <Package className="w-4 h-4" style={{ color:'var(--cyan)' }} /> : <Send className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="sm"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmItem(null)}>Cancel</ModalBtn><ModalBtn onClick={handleConfirmItem}>Yes, confirm</ModalBtn></>}>
        {confirmItem && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{confirmItem.item._kind === 'cargo' ? 'Cargo Unit' : 'Item'}</div>
              <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{confirmItem.item.name}</div>
              {confirmItem.item.quantity && <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Quantity: {confirmItem.item.quantity}</div>}
            </div>
            <div className="rounded-lg border p-3 text-[11px]" style={{ background: confirmItem.action === 'pack' ? 'rgba(6,182,212,.08)' : 'var(--primary-light)', borderColor: confirmItem.action === 'pack' ? 'rgba(6,182,212,.3)' : 'rgba(37,99,235,.2)', color:'var(--text2)' }}>
              {confirmItem.action === 'pack'
                ? <>Are you sure you want to mark this item as <strong>Packed</strong>? This will record a timestamp + your user, and contribute to the packing KPI. Once all items are packed, you can release the shipment.</>
                : <>Are you sure you want to mark this item as <strong>Released</strong>? This is typically done after the full shipment is released.</>}
            </div>
          </div>
        )}
      </EnterpriseModal>

      {/* Release shipment confirmation modal */}
      <EnterpriseModal open={confirmRelease} onClose={() => setConfirmRelease(false)}
        title="Release Shipment?" subtitle={`All ${allUnits.length} items packed · ready to dispatch`}
        icon={<Send className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmRelease(false)}>Not Yet</ModalBtn><ModalBtn onClick={handleConfirmRelease}>🚛 Yes, Release Shipment</ModalBtn></>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />
              <span className="text-xs font-bold" style={{ color:'var(--success)' }}>All items confirmed packed</span>
            </div>
            <div className="text-[11px]" style={{ color:'var(--text2)' }}>
              {packedCount} of {allUnits.length} items are marked packed. Releasing the shipment will:
            </div>
            <ul className="text-[11px] mt-1.5 ml-3 space-y-0.5" style={{ color:'var(--text2)' }}>
              <li>• Set shipment <strong>Released / Sent</strong> timestamp + your user</li>
              <li>• Mark all items as <strong>Released</strong></li>
              <li>• Advance the pipeline to step 4/6 (Released)</li>
              <li>• Log the action in the audit trail</li>
            </ul>
          </div>
          <div className="text-[11px]" style={{ color:'var(--text3)' }}>
            This is a confirmed action. The driver/transporter can now collect the shipment.
          </div>
        </div>
      </EnterpriseModal>

      {/* Confirm Delivery modal */}
      <EnterpriseModal open={confirmDelivery} onClose={() => setConfirmDelivery(false)}
        title="Confirm Delivery?" subtitle={`Mark ${shipment.id} as delivered`}
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmDelivery(false)}>Cancel</ModalBtn><ModalBtn onClick={handleConfirmDelivery}>✓ Yes, Confirm Delivery</ModalBtn></>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />
              <span className="text-xs font-bold" style={{ color:'var(--success)' }}>Closing the loop</span>
            </div>
            <div className="text-[11px]" style={{ color:'var(--text2)' }}>
              The shipment was released on {fmtDateTime(shipment.releasedAt)}. Confirming delivery now will:
            </div>
            <ul className="text-[11px] mt-1.5 ml-3 space-y-0.5" style={{ color:'var(--text2)' }}>
              <li>• Set <strong>Actual Delivery Date</strong> + your user</li>
              <li>• Mark all items as <strong>Delivered</strong></li>
              <li>• Update Checklist · Delivered to ✓ done (syncs with Profile)</li>
              <li>• Advance pipeline to <strong>Step 5/6 · Delivered</strong></li>
              <li>• Log the action in the audit trail</li>
            </ul>
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Delivery Note Number <span style={{ color:'var(--danger)' }}>*</span></label>
            <input value={deliveryForm.deliveryNoteNumber} onChange={e => setDeliveryForm({ ...deliveryForm, deliveryNoteNumber: e.target.value })} placeholder="DN-2026-XXXX"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Delivery Note File</label>
            {deliveryForm.deliveryNoteFile ? (
              <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:'var(--success)' }}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{deliveryForm.deliveryNoteFile}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--success)' }}>Attached</div>
                </div>
                <button type="button" onClick={() => setDeliveryForm({ ...deliveryForm, deliveryNoteFile: '' })} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color:'var(--danger)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="block rounded-lg border-2 border-dashed p-3 text-center cursor-pointer" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setDeliveryForm({ ...deliveryForm, deliveryNoteFile: f.name }) }} />
                <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>📎 Upload signed delivery note</div>
                <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>Optional · PDF/JPG/PNG</div>
              </label>
            )}
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Remarks</label>
            <textarea value={deliveryForm.remarks} onChange={e => setDeliveryForm({ ...deliveryForm, remarks: e.target.value })} rows={2} placeholder="Receiver name, site conditions, any anomalies…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
function ItemRow({ unit, index, onPack, onRelease }) {
  return (
    <div className="p-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-md flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background: unit._kind === 'cargo' ? 'var(--cyan)' : 'var(--primary)' }}>
        {index}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{unit.name ?? unit.description ?? 'Unnamed'}</div>
        <div className="text-[12.5px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color:'var(--text3)' }}>
          {unit.quantity && <span>Qty {unit.quantity} {unit.unit ?? ''}</span>}
          {unit.weight && <span>· {unit.weight} {unit.weightUnit ?? 'KG'}</span>}
          {unit.hsCode && <span>· HS {unit.hsCode}</span>}
          {unit.packageType && <span>· {unit.packageType}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {unit.packed ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-[12.5px] font-bold rounded-md" style={{ background:'rgba(6,182,212,.15)', color:'var(--cyan)' }}>
            <CheckCircle2 className="w-3 h-3" /> Packed
            {unit.packedAt && <span className="text-[9px] font-mono opacity-70 ml-0.5">{fmtDateTime(unit.packedAt)}</span>}
          </span>
        ) : (
          <button onClick={onPack} className="inline-flex items-center gap-1 px-2.5 py-1 text-[12.5px] font-bold rounded-md text-white" style={{ background:'var(--cyan)' }}>
            <Package className="w-3 h-3" /> Mark Packed
          </button>
        )}
        {unit.released ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-[12.5px] font-bold rounded-md" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
            <CheckCircle2 className="w-3 h-3" /> Released
            {unit.releasedAt && <span className="text-[9px] font-mono opacity-70 ml-0.5">{fmtDateTime(unit.releasedAt)}</span>}
          </span>
        ) : (
          unit.packed && (
            <button onClick={onRelease} className="inline-flex items-center gap-1 px-2.5 py-1 text-[12.5px] font-bold rounded-md text-white" style={{ background:'var(--primary)' }}>
              <Send className="w-3 h-3" /> Release
            </button>
          )
        )}
      </div>
    </div>
  )
}
