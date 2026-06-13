// HELMS Local Shipment Profile — 4 main tabs: Detail / Quotes / Invoice / Checklist
// Detail has 9 sub-sections. Dual-status workflow with sequential checklist sub-wizard.
import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Truck, MapPin, Box, FileText, Users, Activity, DollarSign,
  CheckSquare, ClipboardList, Receipt, ChevronRight, Plus, Edit3,
  CheckCircle2, AlertCircle, Clock, Calendar, Upload, X, Lock,
  Send, Printer, Mail, User, Phone, Image as ImageIcon, Eye, Trash2,
  Check, Building2, Hash, ShieldCheck, History, Briefcase, Star, AlertTriangle,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import useToastStore      from '../../store/toastStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  LOCATION_MASTER, SHIPMENT_STATUSES_LOCAL,
  CREATION_STATUS_CFG, DELIVERY_STATUS_CFG, nextLocalStep,
  getVendorHistory, scoreQuote,
  OVERALL_STATUS_CFG, deriveOverallStatus,
  TRANSIT_REASONS,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) }
function fmtDateTime(iso) { if (!iso) return '—'; return new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
function daysBetween(a, b) { if (!a || !b) return null; return Math.round((new Date(b) - new Date(a)) / 86400000) }

const PHASE_LABELS = {
  loaded:    'Loading Complete',
  pickup:    'Pickup Complete',
  reached:   'Reached Destination',
  delivered: 'Delivered',
}

const MAIN_TABS = [
  { id:'detail',    label:'Shipment Detail', icon: FileText      },
  { id:'inventory', label:'Inventory',       icon: Box           },
  { id:'quotes',    label:'Quotes',          icon: ClipboardList },
  { id:'checklist', label:'Checklist',       icon: CheckSquare   },
  { id:'accounts',  label:'Accounts',        icon: DollarSign    },
]

const DETAIL_SECTIONS = [
  { id:'overview',   label:'Overview',   icon: Eye       },
  { id:'route',      label:'Route',      icon: MapPin    },
  { id:'documents',  label:'Documents',  icon: FileText  },
  { id:'vendors',    label:'Vendors',    icon: Building2 },
  { id:'timeline',   label:'Timeline',   icon: Activity  },
  { id:'costs',      label:'Costs',      icon: DollarSign},
  { id:'approvals',  label:'Approvals',  icon: ShieldCheck },
  { id:'audit',      label:'Audit Log',  icon: History   },
]

// ─── Dual-status pill ─────────────────────────────────────────────────────
function DualStatusBadge({ creation, delivery }) {
  const cCfg = CREATION_STATUS_CFG[creation] ?? CREATION_STATUS_CFG.created
  const dCfg = DELIVERY_STATUS_CFG[delivery] ?? DELIVERY_STATUS_CFG.pending
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 px-2 py-1 text-[12.5px] font-bold rounded-md" style={{ background:`${cCfg.color}15`, color: cCfg.color, border:`1px solid ${cCfg.color}30` }}>
        <span>{cCfg.icon}</span>{cCfg.label}
      </span>
      <ChevronRight className="w-3 h-3" style={{ color:'var(--text3)' }} />
      <span className="inline-flex items-center gap-1 px-2 py-1 text-[12.5px] font-bold rounded-md" style={{ background:`${dCfg.color}15`, color: dCfg.color, border:`1px solid ${dCfg.color}30` }}>
        <span>{dCfg.icon}</span>{dCfg.label}
      </span>
    </div>
  )
}

// ─── Image upload helper (data URL, max N) ─────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function LocalShipmentProfile() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getShipment, updateLocalShipment } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const toast = useToastStore()

  const shipment = getShipment(id)
  const allLocalShipments = useShipmentV2Store(s => s.localShipments)
  const [activeTab, setActiveTab]       = useState('detail')
  const [detailSection, setDetailSection] = useState('overview')

  if (!shipment) {
    return (
      <div className="rounded-xl border p-12 text-center" style={C}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--danger)' }} />
        <h3 className="text-base font-bold mb-1" style={{ color:'var(--text)' }}>Shipment not found</h3>
        <p className="text-[11px] mb-4" style={{ color:'var(--text3)' }}>ID <span className="font-mono font-bold">{id}</span> doesn't exist or has been deleted.</p>
        <button onClick={() => navigate('/shipments/local')} className="px-4 py-2 text-xs font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
          ← Back to list
        </button>
      </div>
    )
  }

  const next = nextLocalStep(shipment)
  const update = (patch) => updateLocalShipment(shipment.id, patch)

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/shipments/local')} className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ ...C, color:'var(--text2)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(5,150,105,.1)', border:'1px solid rgba(5,150,105,.2)' }}>
            <Truck className="w-4.5 h-4.5" style={{ color:'var(--success)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 flex-wrap" style={{ color:'var(--text)' }}>
              <span className="font-mono">{shipment.id}</span>
              <span className="text-[12.5px] font-normal px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{shipment.shipmentType}</span>
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color:'var(--text3)' }}>
              {locName(shipment.route?.origin?.locationId)} → {locName(shipment.route?.stops?.[shipment.route?.stops?.length - 1]?.locationId)}
              <span className="mx-2">·</span>
              Created {fmtDate(shipment.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {(() => {
            const overall = deriveOverallStatus(shipment)
            const cfg = OVERALL_STATUS_CFG[overall]
            return (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Status</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg" style={{ background:`${cfg.color}15`, color: cfg.color, border:`1px solid ${cfg.color}40` }}>
                  <span>{cfg.icon}</span>{cfg.label}
                  <span className="ml-1 text-[9px] font-mono opacity-70">{cfg.step}/6</span>
                </span>
              </div>
            )
          })()}
          <DualStatusBadge creation={shipment.creationStatus} delivery={shipment.deliveryStatus} />
          {next.action && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--primary)' }}>Next Step</span>
              <span className="text-xs font-bold" style={{ color:'var(--text)' }}>{next.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex" style={{ borderBottom:'1px solid var(--border)' }}>
          {MAIN_TABS.map(t => {
            const active = activeTab === t.id
            // Per-tab counter badges
            let badge = null
            if (t.id === 'detail') {
              const totalOriginsStops = (shipment.origins?.length ?? 1) + (shipment.route?.stops?.length ?? 0)
              badge = totalOriginsStops > 0 ? totalOriginsStops : null
            }
            if (t.id === 'quotes') {
              badge = shipment.quotes?.length ?? 0
            }
            if (t.id === 'inventory') {
              const cargo = (shipment.cargo ?? []).filter(c => c.active !== false).length
              const equip = shipment.requestedEquipment?.length ?? 0
              badge = cargo + equip
              if (badge === 0) badge = null
            }
            if (t.id === 'accounts') {
              badge = shipment.vendorInvoices?.length ?? 0
            }
            if (t.id === 'checklist') {
              const cl = shipment.checklist ?? {}
              const total = 4   // Loaded / Pickup / Reached / Delivered
              const done = (cl.loaded?.done ? 1 : 0)
                         + (cl.pickup?.done ? 1 : 0)
                         + (((cl.reachedDestinations ?? []).length > 0 && cl.reachedDestinations.every(r => r.done)) ? 1 : 0)
                         + (cl.delivered?.done ? 1 : 0)
              badge = `${done}/${total}`
            }
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all relative"
                style={{
                  background: active ? 'var(--card)' : 'var(--bg2)',
                  color:      active ? 'var(--primary)' : 'var(--text2)',
                  borderRight: '1px solid var(--border)',
                }}>
                <t.icon className="w-4 h-4" />{t.label}
                {badge !== null && badge !== undefined && (
                  <span className="ml-1 text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--text3)',
                      color: '#fff',
                    }}>
                    {badge}
                  </span>
                )}
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'var(--primary)' }} />}
              </button>
            )
          })}
        </div>

        <div className="p-4">
          {activeTab === 'detail'    && <DetailTab shipment={shipment} vendors={vendors} allLocalShipments={allLocalShipments} section={detailSection} setSection={setDetailSection} update={update} toast={toast} />}
          {activeTab === 'inventory' && <InventoryTab shipment={shipment} />}
          {activeTab === 'quotes'    && <QuotesTab shipment={shipment} vendors={vendors} allLocalShipments={allLocalShipments} update={update} toast={toast} />}
          {activeTab === 'accounts'  && <AccountsTab shipment={shipment} vendors={vendors} update={update} toast={toast} />}
          {activeTab === 'checklist' && <ChecklistTab shipment={shipment} update={update} toast={toast} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — DETAIL (with 9 sub-sections)
// ═══════════════════════════════════════════════════════════════════════════
function DetailTab({ shipment, vendors, allLocalShipments, section, setSection, update, toast }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Mini-nav */}
      <div className="col-span-12 md:col-span-3">
        <div className="rounded-lg border overflow-hidden" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          {DETAIL_SECTIONS.map(s => {
            const active = section === s.id
            // Per-section counter badges
            let badge = null
            if (s.id === 'route')     badge = (shipment.origins?.length ?? 1) + (shipment.route?.stops?.length ?? 0)
            if (s.id === 'cargo')     badge = (shipment.requestedEquipment?.length ?? 0) + 1  // +1 for cargo type itself
            if (s.id === 'documents') badge = shipment.documents?.length ?? 0
            if (s.id === 'vendors')   badge = shipment.quotes?.length ?? 0
            if (s.id === 'costs')     badge = shipment.costs?.length ?? 0
            if (s.id === 'approvals') badge = shipment.approvals?.length ?? 0
            if (s.id === 'audit')     badge = shipment.auditLog?.length ?? 0
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all"
                style={{
                  background:  active ? 'var(--card)' : 'transparent',
                  borderLeft:  active ? '3px solid var(--primary)' : '3px solid transparent',
                  color:       active ? 'var(--primary)' : 'var(--text2)',
                  borderBottom:'1px solid var(--border)',
                }}>
                <s.icon className="w-3.5 h-3.5" />
                <span className="text-xs font-bold flex-1">{s.label}</span>
                {badge !== null && badge !== undefined && badge !== 0 && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--card)',
                      color:      active ? '#fff' : 'var(--text3)',
                      border:     active ? 'none' : '1px solid var(--border)',
                    }}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section content */}
      <div className="col-span-12 md:col-span-9">
        {section === 'overview'  && <OverviewSection  shipment={shipment} vendors={vendors} />}
        {section === 'route'     && <RouteSection     shipment={shipment} />}
        {section === 'documents' && <DocumentsSection shipment={shipment} />}
        {section === 'vendors'   && <VendorsSection   shipment={shipment} vendors={vendors} allLocalShipments={allLocalShipments} />}
        {section === 'timeline'  && <TimelineSection  shipment={shipment} />}
        {section === 'costs'     && <CostsSection     shipment={shipment} vendors={vendors} />}
        {section === 'approvals' && <ApprovalsSection shipment={shipment} />}
        {section === 'audit'     && <AuditSection     shipment={shipment} />}
      </div>
    </div>
  )
}

// ─── 1.1 Overview ──────────────────────────────────────────────────────────
function OverviewSection({ shipment, vendors }) {
  const stops = shipment.route?.stops ?? []
  const v = vendors?.find(x => x.id === shipment.supplier)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 space-y-1.5 text-xs" style={C}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Shipment</div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Type</span><span style={{ color:'var(--text)' }}>{shipment.shipmentType}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Transporter</span><span style={{ color:'var(--text)' }}>{shipment.transporterMode}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Cargo Type</span><span style={{ color:'var(--text)' }}>{shipment.cargoType}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Operated By</span><span style={{ color:'var(--text)' }}>{shipment.operatedBy ?? '—'}</span></div>
        </div>
        <div className="rounded-lg border p-3 space-y-1.5 text-xs" style={C}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Vendor & Project</div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Vendor</span><span style={{ color:'var(--text)' }}>{v?.name ?? shipment.supplier ?? 'Awaiting allocation'}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Project</span><span style={{ color:'var(--text)' }}>{shipment.project ?? '—'}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Sales Order</span><span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{shipment.salesOrderNumber ?? '—'}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>PO Numbers</span><span className="font-mono truncate ml-2" style={{ color:'var(--text)' }}>{shipment.poNumbers?.join(', ') ?? '—'}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Delivery Note #</span><span className="font-mono" style={{ color:'var(--text)' }}>{shipment.deliveryNoteNumber || '—'}</span></div>
        </div>
        <div className="rounded-lg border p-3 space-y-1.5 text-xs" style={C}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Dates</div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Created</span><span className="font-mono" style={{ color:'var(--text)' }}>{fmtDate(shipment.createdAt)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Shipment Date</span><span className="font-mono" style={{ color:'var(--text)' }}>{fmtDate(shipment.shipmentDate)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>ETA</span><span className="font-mono" style={{ color:'var(--text)' }}>{fmtDate(shipment.eta)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--text3)' }}>Delivered</span><span className="font-mono" style={{ color:'var(--text)' }}>{fmtDate(shipment.actualDeliveryDate)}</span></div>
        </div>
        <div className="rounded-lg border p-3 space-y-1.5 text-xs" style={C}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color:'var(--text3)' }}>Route Summary</div>
          <div className="text-[11px] font-bold" style={{ color:'var(--text)' }}>{locName(shipment.route?.origin?.locationId)} → {locName(stops[stops.length - 1]?.locationId)}</div>
          <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{stops.length} stop{stops.length === 1 ? '' : 's'} · {shipment.requestedEquipment?.length ?? 0} equipment</div>
          <div className="pt-1.5 border-t" style={{ borderColor:'var(--border)' }}>
            <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Special Instructions</div>
            <div className="text-[11px] mt-0.5" style={{ color:'var(--text2)' }}>{shipment.specialInstr ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 1.2 Route ─────────────────────────────────────────────────────────────
function RouteSection({ shipment }) {
  // Multi-origin support: use origins[] if present, else fall back to route.origin
  const origins = shipment.origins?.length
    ? shipment.origins
    : [{ id:'ORG-1', locationId: shipment.route?.origin?.locationId, contact: { name: shipment.route?.origin?.contact ?? '—', mobile:'—', email:'—' }, readyDate: shipment.shipmentDate, notes: shipment.route?.origin?.notes }]
  const stops = shipment.route?.stops ?? []

  const LocationCard = ({ loc, contact, role, idx, total, readyDate, notes, eta, type }) => {
    const masterLoc = LOCATION_MASTER.find(l => l.id === loc)
    const isOrigin = role === 'origin'
    const isFinal  = role === 'dest' && idx === total - 1
    const color = isOrigin ? 'var(--primary)' : isFinal ? 'var(--success)' : 'var(--cyan)'
    const roleLabel = isOrigin ? `ORIGIN ${total > 1 ? `${idx + 1}/${total}` : ''}` : isFinal ? 'FINAL DESTINATION' : `STOP ${idx + 1}`
    const c = contact ?? {}
    return (
      <div className="rounded-xl border overflow-hidden transition-all" style={{ ...C, borderColor: `${color}40` }}>
        {/* Header strip */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: `${color}10`, borderBottom: `1px solid ${color}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: color }}>
            {isOrigin ? <MapPin className="w-5 h-5" /> : isFinal ? <Check className="w-5 h-5" /> : <span className="text-sm">{idx + 1}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
              {roleLabel}
              {type && type !== 'final' && (
                <span className="ml-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded normal-case tracking-normal" style={{ background:'var(--card)', color:'var(--text3)', border:'1px solid var(--border)' }}>{type}</span>
              )}
            </div>
            <div className="text-sm font-bold truncate" style={{ color:'var(--text)' }}>{masterLoc?.name ?? loc ?? '—'}</div>
            <div className="text-[12.5px] flex items-center gap-1.5 mt-0.5" style={{ color:'var(--text3)' }}>
              <span className="font-mono font-bold px-1 py-0.5 rounded" style={{ background:'var(--bg2)' }}>{masterLoc?.country ?? 'SA'}</span>
              <span>·</span>
              <span>{masterLoc?.city ?? '—'}</span>
              {masterLoc?.type && (
                <>
                  <span>·</span>
                  <span className="capitalize">{masterLoc.type}</span>
                </>
              )}
            </div>
          </div>
          {masterLoc?.mapLink && (
            <a href={masterLoc.mapLink} target="_blank" rel="noopener noreferrer"
               className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background:'var(--card)', color:'var(--primary)', border:'1px solid var(--border)' }}>
              <MapPin className="w-3 h-3" /> Map
            </a>
          )}
        </div>

        {/* Description */}
        {masterLoc?.description && (
          <div className="px-4 py-2 text-[12.5px]" style={{ color:'var(--text3)', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            {masterLoc.description}
          </div>
        )}

        {/* Point of Contact — Col-4 / Col-4 / Col-4 */}
        <div className="px-4 py-3">
          <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text3)' }}>Point of Contact</div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Name</div>
              <div className="text-xs font-bold flex items-center gap-1" style={{ color:'var(--text)' }}><User className="w-3 h-3" style={{ color:'var(--text3)' }} />{c.name || '—'}</div>
            </div>
            <div className="col-span-4">
              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Mobile</div>
              <div className="text-xs font-mono font-bold flex items-center gap-1" style={{ color:'var(--text)' }}><Phone className="w-3 h-3" style={{ color:'var(--text3)' }} />{c.mobile || '—'}</div>
            </div>
            <div className="col-span-4">
              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Email</div>
              <div className="text-xs flex items-center gap-1 truncate" style={{ color:'var(--text)' }}><Mail className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} /><span className="truncate">{c.email || '—'}</span></div>
            </div>
          </div>

          {(readyDate || eta || notes) && (
            <div className="grid grid-cols-12 gap-3 mt-3 pt-3 border-t" style={{ borderColor:'var(--border)' }}>
              {readyDate && (
                <div className="col-span-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Ready Date</div>
                  <div className="text-xs font-mono flex items-center gap-1" style={{ color:'var(--text)' }}><Calendar className="w-3 h-3" style={{ color:'var(--text3)' }} />{fmtDate(readyDate)}</div>
                </div>
              )}
              {eta && (
                <div className="col-span-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>ETA</div>
                  <div className="text-xs font-mono flex items-center gap-1" style={{ color:'var(--text)' }}><Clock className="w-3 h-3" style={{ color:'var(--text3)' }} />{fmtDateTime(eta)}</div>
                </div>
              )}
              {notes && (
                <div className={readyDate || eta ? 'col-span-4' : 'col-span-12'}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Notes</div>
                  <div className="text-[11px]" style={{ color:'var(--text2)' }}>{notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary header */}
      <div className="rounded-xl border p-3 flex items-center gap-3" style={{ background:'linear-gradient(135deg, var(--primary-light) 0%, var(--bg2) 100%)', borderColor:'rgba(37,99,235,.2)' }}>
        <Truck className="w-5 h-5 flex-shrink-0" style={{ color:'var(--primary)' }} />
        <div className="flex-1">
          <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--primary)' }}>Route Overview</div>
          <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>
            {origins.map(o => LOCATION_MASTER.find(l => l.id === o.locationId)?.name ?? '—').join(' + ')}
            <span className="mx-2">→</span>
            {stops.map(s => LOCATION_MASTER.find(l => l.id === s.locationId)?.name).filter(Boolean).join(' → ')}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color:'var(--text2)' }}>
          <span><strong>{origins.length}</strong> {origins.length === 1 ? 'origin' : 'origins'}</span>
          <span>·</span>
          <span><strong>{stops.length}</strong> stops</span>
        </div>
      </div>

      {/* Horizontal Route Timeline */}
      {(origins.length > 0 || stops.length > 0) && (
        <div className="rounded-xl border p-4 overflow-x-auto" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Route Timeline</h4>
          <div className="flex items-start gap-2 min-w-min relative pt-3">
            {[
              ...origins.map((o, i) => ({ kind:'origin',  idx:i, total:origins.length, locationId:o.locationId, role:`Origin ${origins.length > 1 ? i + 1 : ''}` })),
              ...stops.map((s, i) => ({ kind:'stop',    idx:i, total:stops.length,   locationId:s.locationId, role: i === stops.length - 1 ? 'Final Destination' : `Stop ${i + 1}` })),
            ].map((n, idx, arr) => {
              const isOrigin = n.kind === 'origin'
              const isFinal  = n.kind === 'stop' && n.idx === n.total - 1
              const color = isOrigin ? 'var(--primary)' : isFinal ? 'var(--success)' : 'var(--cyan)'
              const masterLoc = LOCATION_MASTER.find(l => l.id === n.locationId)
              const isLast = idx === arr.length - 1
              return (
                <div key={`${n.kind}-${idx}`} className="flex items-start flex-shrink-0">
                  <div className="flex flex-col items-center" style={{ minWidth: 140 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${color === 'var(--primary)' ? 'rgba(37,99,235,.12)' : color === 'var(--success)' ? 'rgba(5,150,105,.12)' : 'rgba(6,182,212,.12)'}`, border:`2px solid ${color}` }}>
                      <MapPin className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="text-center mt-2 max-w-[140px]">
                      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{n.role}</div>
                      <div className="text-[12px] font-bold mt-0.5 truncate" style={{ color:'var(--text)' }} title={masterLoc?.name}>{masterLoc?.name ?? '—'}</div>
                      <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>{masterLoc?.city ?? ''}</div>
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex items-center pt-4 px-1" style={{ minWidth: 50 }}>
                      <div className="h-0.5 flex-1" style={{ background:'var(--border)' }} />
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--text3)' }} />
                      <div className="h-0.5 flex-1" style={{ background:'var(--border)' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Origins section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--primary)' }}>A</div>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Origins · Pickup Points</h4>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{origins.length}</span>
        </div>
        <div className="space-y-2">
          {origins.map((o, i) => (
            <LocationCard key={o.id} loc={o.locationId} contact={o.contact} role="origin"
              idx={i} total={origins.length} readyDate={o.readyDate} notes={o.notes} />
          ))}
        </div>
      </div>

      {/* Connector arrow */}
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-0.5" style={{ background:'var(--border)' }} />
        <ArrowLeft className="w-4 h-4 rotate-180" style={{ color:'var(--text3)' }} />
        <div className="flex-1 h-0.5" style={{ background:'var(--border)' }} />
      </div>

      {/* Destinations section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--cyan)' }}>B</div>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Destinations & Stops</h4>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{stops.length}</span>
        </div>
        <div className="space-y-2">
          {stops.length === 0 ? (
            <div className="rounded-xl border border-dashed py-6 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
              <MapPin className="w-6 h-6 mx-auto mb-1" style={{ color:'var(--text3)' }} />
              <p className="text-xs" style={{ color:'var(--text3)' }}>No destinations yet</p>
            </div>
          ) : stops.map((s, i) => (
            <LocationCard key={s.id ?? i} loc={s.locationId} contact={s.contactPoc ?? { name: s.contact, mobile:'—', email:'—' }}
              role="dest" idx={i} total={stops.length} eta={s.eta} notes={s.notes} type={s.type} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 1.3 Cargo ─────────────────────────────────────────────────────────────
function CargoSection({ shipment }) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={C}>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l:'Cargo Type',    v: shipment.cargoType },
          { l:'Equipment',     v: `${shipment.requestedEquipment?.length ?? 0} requested` },
          { l:'Special Instr', v: shipment.specialInstr ? '✓ Set' : '—' },
        ].map(({ l, v }) => (
          <div key={l} className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-sm font-bold mt-0.5" style={{ color:'var(--text)' }}>{v ?? '—'}</div>
          </div>
        ))}
      </div>
      {shipment.cargoDesc && <div className="text-xs" style={{ color:'var(--text2)' }}>{shipment.cargoDesc}</div>}
      {shipment.requestedEquipment?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t" style={{ borderColor:'var(--border)' }}>
          <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Equipment:</span>
          {shipment.requestedEquipment.map(e => (
            <span key={e} className="text-[12.5px] font-bold px-2 py-0.5 rounded" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 1.4 Documents ─────────────────────────────────────────────────────────
function DocumentsSection({ shipment }) {
  const docs = shipment.documents ?? []
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Documents ({docs.length})</h4>
      </div>
      {docs.length === 0
        ? <div className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No documents uploaded</div>
        : <div className="divide-y" style={{ borderColor:'var(--border)' }}>
            {docs.map(d => (
              <div key={d.id} className="p-3 flex items-center gap-3">
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color:'var(--primary)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{d.type}</div>
                  <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{d.fileName} · v{d.version}</div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.15)', color:'var(--success)' }}>{(d.status ?? '').toUpperCase()}</span>
                <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(d.uploadedAt)}</span>
              </div>
            ))}
          </div>}
    </div>
  )
}

// ─── 1.5 Vendors (all considered + approved one + AI history reflection) ──
function VendorsSection({ shipment, vendors, allLocalShipments }) {
  const quotes = shipment.quotes ?? []
  if (quotes.length === 0) {
    return <div className="rounded-xl border p-8 text-center" style={C}>
      <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
      <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No vendors quoted yet</p>
      <p className="text-[11px]" style={{ color:'var(--text3)' }}>Go to the <strong>Quotes</strong> tab to start collecting bids.</p>
    </div>
  }

  // Reflect AI analysis from Quotes tab here
  const amounts = quotes.map(q => q.amount)
  const lowest  = Math.min(...amounts)
  const highest = Math.max(...amounts)
  const enriched = quotes.map(q => {
    const history = getVendorHistory(allLocalShipments ?? [], q.vendorId)
    const score = scoreQuote(q, history, lowest, highest)
    return { q, history, score }
  }).sort((a, b) => b.score - a.score)

  const approved = enriched.find(x => x.q.status === 'approved')

  return (
    <div className="space-y-3">
      {approved && (
        <div className="rounded-xl border-2 p-3" style={{ background:'rgba(5,150,105,.05)', borderColor:'var(--success)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--success)' }}>Approved Vendor</span>
          </div>
          {(() => {
            const aq = approved.q
            const v = vendors?.find(x => x.id === aq.vendorId)
            return (
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Vendor</div><div className="font-bold" style={{ color:'var(--text)' }}>{v?.name ?? aq.vendorId}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Amount</div><div className="font-mono font-bold" style={{ color:'var(--primary)' }}>SAR {aq.amount.toLocaleString()}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Delivery</div><div className="font-mono" style={{ color:'var(--text)' }}>{fmtDate(aq.deliveryDate)}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Approved</div><div className="font-mono" style={{ color:'var(--text)' }}>{fmtDate(aq.approvedAt)}</div></div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>AI Score</div>
                  <div className="font-mono font-bold" style={{ color:'var(--success)' }}>{approved.score}/100</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>All Vendors Considered ({quotes.length})</h4>
          <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color:'var(--text3)' }}>
            <Star className="w-3 h-3" /> Ranked by AI Score
          </span>
        </div>
        <table className="w-full text-xs">
          <thead style={{ background:'var(--bg2)' }}>
            <tr>
              {['Rank','Vendor','Amount','Delivery','History','On-Time','AI Score','Status'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enriched.map(({ q, history, score }, idx) => {
              const v = vendors?.find(x => x.id === q.vendorId)
              const cfg = q.status === 'approved' ? { c:'var(--success)', b:'rgba(5,150,105,.15)' }
                       : q.status === 'rejected' ? { c:'var(--danger)',  b:'rgba(220,38,38,.15)' }
                       : { c:'var(--warning)', b:'rgba(217,119,6,.15)' }
              const scoreColor = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--primary)' : score >= 40 ? 'var(--warning)' : 'var(--danger)'
              return (
                <tr key={q.id} style={{ borderTop:'1px solid var(--border)', opacity: q.status === 'rejected' ? 0.6 : 1 }}>
                  <td className="px-3 py-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[12.5px] font-black text-white" style={{ background: idx === 0 ? 'var(--success)' : idx === 1 ? 'var(--primary)' : 'var(--text3)' }}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-bold" style={{ color:'var(--text)' }}>
                    {v?.name ?? q.vendorId}
                    <div className="text-[9px] font-mono font-normal" style={{ color:'var(--text3)' }}>{q.vendorId}</div>
                  </td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>SAR {q.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{fmtDate(q.deliveryDate)}</td>
                  <td className="px-3 py-2" style={{ color:'var(--text2)' }}>
                    {history.hasHistory ? `${history.jobs} job${history.jobs === 1 ? '' : 's'}` : <span style={{ color:'var(--text3)' }}>New</span>}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: history.hasHistory ? (history.onTimePct >= 90 ? 'var(--success)' : history.onTimePct >= 75 ? 'var(--warning)' : 'var(--danger)') : 'var(--text3)' }}>
                    {history.hasHistory ? `${history.onTimePct}%` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                        <div className="h-full" style={{ width: `${score}%`, background: scoreColor }} />
                      </div>
                      <span className="font-mono font-bold" style={{ color: scoreColor }}>{score}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.b, color: cfg.c }}>{q.status.toUpperCase()}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 1.6 Timeline (DUAL timelines with days between) ─────────────────────
function TimelineSection({ shipment }) {
  // Creation timeline: Created → Quote Created → Quote Approved
  const createdAt   = shipment.createdAt
  const firstQuote  = shipment.quotes?.[0]?.createdAt
  const approvedQt  = shipment.quotes?.find(q => q.status === 'approved')?.approvedAt
  const cTimeline = [
    { label:'Created',        icon:'📝', date: createdAt,   done: !!createdAt,  color:'var(--primary)' },
    { label:'Quote Created',  icon:'💬', date: firstQuote,  done: !!firstQuote, color:'var(--warning)' },
    { label:'Quote Approved', icon:'✓',  date: approvedQt,  done: !!approvedQt, color:'var(--success)' },
  ]

  // Delivery timeline: Loaded → Pickup → Reached Destination(s) → Delivered
  const cl = shipment.checklist ?? {}
  const dTimeline = [
    { label:'Loaded',          icon:'📦', date: cl.loaded?.completedAt,  done: cl.loaded?.done,    color:'var(--cyan)' },
    { label:'Pickup Complete', icon:'🚛', date: cl.pickup?.completedAt,  done: cl.pickup?.done,    color:'var(--primary)' },
    ...(cl.reachedDestinations ?? []).map((r, i) => ({
      label: `Reached ${locName(r.locationId)}`,
      icon:'📍',
      date: r.completedAt,
      done: r.done,
      color:'#8B5CF6',
    })),
    { label:'Delivered',       icon:'✓', date: cl.delivered?.completedAt, done: cl.delivered?.done, color:'var(--success)' },
  ]

  const renderTimeline = (events, title) => (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>{title}</h4>
      </div>
      <div className="p-3">
        <div className="relative">
          {events.map((e, i) => {
            const next = events[i + 1]
            const gap = (e.date && next?.date) ? daysBetween(e.date, next.date) : null
            return (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 relative z-10"
                    style={{
                      background: e.done ? e.color : 'var(--bg2)',
                      color: e.done ? '#fff' : 'var(--text3)',
                      border: e.done ? `2px solid ${e.color}` : '2px solid var(--border)',
                    }}>
                    {e.done ? '✓' : e.icon}
                  </div>
                  {i < events.length - 1 && (
                    <div className="flex-1 w-0.5 my-1 relative" style={{ background: e.done && next.done ? e.color : 'var(--border)', minHeight: 40 }}>
                      {gap !== null && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[9px] font-mono font-bold rounded whitespace-nowrap"
                          style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                          +{gap}d
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-3 pt-1">
                  <div className="text-xs font-bold" style={{ color: e.done ? 'var(--text)' : 'var(--text3)' }}>{e.label}</div>
                  <div className="text-[12.5px] font-mono mt-0.5" style={{ color:'var(--text3)' }}>{e.date ? fmtDateTime(e.date) : 'Pending'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {renderTimeline(cTimeline, 'Creation Timeline')}
      {renderTimeline(dTimeline, 'Delivery Timeline')}
    </div>
  )
}

// ─── 1.7 Costs ─────────────────────────────────────────────────────────────
function CostsSection({ shipment, vendors }) {
  const costs = shipment.costs ?? []
  const total = costs.reduce((s, c) => s + Number(c.total ?? 0), 0)
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Costs ({costs.length})</h4>
        <span className="text-xs font-mono font-bold" style={{ color:'var(--primary)' }}>Total: SAR {total.toLocaleString()}</span>
      </div>
      {costs.length === 0
        ? <div className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No costs recorded yet — costs are auto-generated once a quote is approved.</div>
        : <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Type','Vendor','Amount','VAT (15%)','Total','Notes'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costs.map(c => {
                const v = vendors?.find(x => x.id === c.vendorId)
                return (
                  <tr key={c.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-bold" style={{ color:'var(--text)' }}>{c.type}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text2)' }}>{v?.name ?? c.vendorId}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>SAR {c.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text3)' }}>SAR {c.vat.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>SAR {c.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text3)' }}>{c.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>}
    </div>
  )
}

// ─── 1.8 Approvals ─────────────────────────────────────────────────────────
function ApprovalsSection({ shipment }) {
  const aps = shipment.approvals ?? []
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Approvals ({aps.length})</h4>
      </div>
      {aps.length === 0
        ? <div className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No approvals yet</div>
        : <div className="divide-y" style={{ borderColor:'var(--border)' }}>
            {aps.map(a => (
              <div key={a.id} className="p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:'rgba(5,150,105,.15)' }}>
                  <ShieldCheck className="w-4 h-4" style={{ color:'var(--success)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color:'var(--text)' }}>{a.action}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>by <strong>{a.actor}</strong> · {fmtDateTime(a.date)}</div>
                  {a.notes && <div className="text-[11px] mt-1" style={{ color:'var(--text2)' }}>{a.notes}</div>}
                </div>
              </div>
            ))}
          </div>}
    </div>
  )
}

// ─── 1.9 Audit Log ─────────────────────────────────────────────────────────
function AuditSection({ shipment }) {
  const log = shipment.auditLog ?? []

  // Build the status-flow timeline from observed timestamps
  const approvedQ = shipment.quotes?.find(q => q.status === 'approved')
  const flowEvents = [
    { key:'created',          label:'Created',          date: shipment.createdAt,              actor:'Khalid Salman' },
    { key:'vendor_allocated', label:'Vendor Allocated', date: approvedQ?.approvedAt,           actor: approvedQ?.approvedBy },
    { key:'packed',           label:'Packed',           date: shipment.packedAt,               actor: shipment.packedBy },
    { key:'released',         label:'Released / Sent',  date: shipment.releasedAt,             actor: shipment.releasedBy },
    { key:'delivered',        label:'Delivered',        date: shipment.actualDeliveryDate ?? shipment.checklist?.delivered?.completedAt, actor:'Site Manager' },
    { key:'closed',           label:'Closed',           date: shipment.vendorInvoices?.find(v => v.closure)?.closure?.date, actor: shipment.vendorInvoices?.find(v => v.closure)?.closure?.closedBy },
  ]

  return (
    <div className="space-y-3">
      {/* Status flow strip — visual 6-stage journey */}
      <div className="rounded-xl border p-4" style={C}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Shipment Status Flow · End-to-End</h4>
        <div className="flex items-stretch">
          {flowEvents.map((e, i) => {
            const cfg = OVERALL_STATUS_CFG[e.key]
            const done = !!e.date
            const next = flowEvents[i + 1]
            const gap = (done && next?.date) ? Math.round((new Date(next.date) - new Date(e.date)) / 36e5) : null
            return (
              <div key={e.key} className="flex-1 relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] relative z-10"
                    style={{ background: done ? cfg.color : 'var(--bg2)', border: done ? `2px solid ${cfg.color}` : '2px solid var(--border)' }}>
                    {done ? <Check className="w-4 h-4 text-white" /> : cfg.icon}
                  </div>
                  <div className="text-[12.5px] font-bold mt-1.5" style={{ color: done ? 'var(--text)' : 'var(--text3)' }}>{e.label}</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color:'var(--text3)' }}>{e.date ? fmtDate(e.date) : '—'}</div>
                  {e.actor && done && <div className="text-[9px]" style={{ color:'var(--text3)' }}>by {e.actor}</div>}
                </div>
                {next && (
                  <div className="absolute top-4 left-1/2 w-full h-0.5" style={{ background: done && next.date ? cfg.color : 'var(--border)' }}>
                    {gap !== null && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded whitespace-nowrap"
                        style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                        +{gap < 24 ? `${gap}h` : `${Math.floor(gap/24)}d`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Full audit log */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Full Audit Log ({log.length} events)</h4>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor:'var(--border)' }}>
          {log.map(e => (
            <div key={e.id} className="p-2.5 flex items-start gap-3 text-xs">
              <Clock className="w-3 h-3 mt-1 flex-shrink-0" style={{ color:'var(--text3)' }} />
              <div className="flex-1 min-w-0">
                <div className="font-bold" style={{ color:'var(--text)' }}>{e.action}</div>
                <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{e.actor} · {fmtDateTime(e.date)}</div>
                {e.meta && Object.keys(e.meta).length > 0 && (
                  <div className="text-[12.5px] mt-1 font-mono" style={{ color:'var(--text2)' }}>
                    {Object.entries(e.meta).map(([k, v]) => <span key={k} className="mr-2"><span style={{ color:'var(--text3)' }}>{k}:</span> {String(v)}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — QUOTES
// ═══════════════════════════════════════════════════════════════════════════
function QuotesTab({ shipment, vendors, allLocalShipments, update, toast }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(null) // a quote
  const [draft, setDraft] = useState({ vendorId:'', amount:'', reason:'', deliveryDate:'' })
  const quotes = shipment.quotes ?? []

  // ── AI Recommendation engine ──
  // For each quoted vendor, compute history score + recommendation score.
  const aiAnalysis = useMemo(() => {
    if (quotes.length === 0) return { topPick: null, vendorScores: new Map() }
    const amounts = quotes.map(q => q.amount)
    const lowest  = Math.min(...amounts)
    const highest = Math.max(...amounts)
    const scored = quotes.map(q => {
      const history = getVendorHistory(allLocalShipments ?? [], q.vendorId)
      const score = scoreQuote(q, history, lowest, highest)
      return { quote: q, history, score }
    }).sort((a, b) => b.score - a.score)
    return {
      topPick: scored[0],
      vendorScores: new Map(scored.map(x => [x.quote.id, { score: x.score, history: x.history }])),
      lowest, highest,
      allScored: scored,
    }
  }, [quotes, allLocalShipments])

  const handleCreate = () => {
    if (!draft.vendorId || !draft.amount || !draft.reason || !draft.deliveryDate) {
      toast.warning('Missing fields', 'Fill in vendor, amount, reason and delivery date.')
      return
    }
    const newQuote = {
      id: `QTE-${shipment.id}-${(quotes.length + 1).toString().padStart(2, '0')}`,
      vendorId: draft.vendorId,
      amount: Number(draft.amount),
      currency: 'SAR',
      reason: draft.reason,
      deliveryDate: new Date(draft.deliveryDate).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: 'Khalid Salman',
      approvedAt: null,
      approvedBy: null,
    }
    const newAudit = { id: `AUD-${shipment.id}-${Date.now()}`, actor: 'Khalid Salman', action: 'Quote created', date: new Date().toISOString(), meta: { quoteId: newQuote.id, vendorId: draft.vendorId } }
    update({
      quotes: [...quotes, newQuote],
      creationStatus: 'quote_created',
      auditLog: [...(shipment.auditLog ?? []), newAudit],
    })
    setCreateOpen(false); setDraft({ vendorId:'', amount:'', reason:'', deliveryDate:'' })
    toast.success('Quote created', `${newQuote.id} added · pending approval`)
  }

  const handleApprove = (q) => {
    const now = new Date().toISOString()
    const v = vendors?.find(x => x.id === q.vendorId)
    const updatedQuotes = quotes.map(x =>
      x.id === q.id ? { ...x, status:'approved', approvedAt: now, approvedBy:'Operations Manager' }
                    : { ...x, status: x.status === 'pending' ? 'rejected' : x.status }
    )
    const invoice = {
      id: `INV-${shipment.id}`, quoteId: q.id, vendorId: q.vendorId,
      amount: q.amount, vat: Math.round(q.amount * 0.15), total: Math.round(q.amount * 1.15),
      issuedDate: now, dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      status:'draft', sentAt: null, poNumber: shipment.poNumbers?.[0] ?? '',
    }
    const costs = [{ id:`CST-${shipment.id}-1`, type:'Transportation', amount: q.amount, vat: invoice.vat, total: invoice.total, vendorId: q.vendorId, notes:'Approved primary transport cost' }]
    const newApproval = { id:`APR-${shipment.id}-${Date.now()}`, action:'Quote Approved', actor:'Operations Manager', date: now, notes: q.reason }
    const newAudit = [
      { id:`AUD-${shipment.id}-${Date.now()}-a`,  actor:'Operations Manager', action:'Quote approved',  date: now, meta: { quoteId: q.id, vendorId: q.vendorId, amount: q.amount } },
      { id:`AUD-${shipment.id}-${Date.now()}-b`,  actor:'System',             action:'Invoice generated', date: now, meta: { invoiceId: invoice.id } },
    ]
    update({
      quotes: updatedQuotes,
      approvedQuoteId: q.id,
      creationStatus: 'quote_approved',
      invoice,
      costs,
      supplier: q.vendorId,
      approvals: [...(shipment.approvals ?? []), newApproval],
      auditLog: [...(shipment.auditLog ?? []), ...newAudit],
    })
    setConfirmApprove(null)
    toast.success('Quote approved', `${v?.name ?? q.vendorId} · SAR ${q.amount.toLocaleString()} · invoice generated`)
  }

  const cheapest = quotes.length > 0 ? [...quotes].sort((a, b) => a.amount - b.amount)[0] : null

  return (
    <div className="space-y-4">
      {/* Header + compare */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Quotes ({quotes.length})</h3>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Compare bids and approve one to lock in the vendor + auto-generate the invoice.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} disabled={shipment.creationStatus === 'quote_approved'}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background:'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Create Quote
        </button>
      </div>

      {/* AI Recommendation Banner */}
      {aiAnalysis.topPick && shipment.creationStatus !== 'quote_approved' && (() => {
        const { quote: q, history, score } = aiAnalysis.topPick
        const v = vendors?.find(x => x.id === q.vendorId)
        const isCheapest = q.amount === aiAnalysis.lowest
        const tierColor = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--primary)' : 'var(--warning)'
        return (
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: tierColor, background: `${tierColor}08` }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom:`1px solid ${tierColor}30`, background: `${tierColor}15` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tierColor }}>
                <Star className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: tierColor }}>AI Recommendation · Best Vendor for This Job</div>
                <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{v?.name ?? q.vendorId}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Confidence</div>
                <div className="text-2xl font-black font-mono" style={{ color: tierColor }}>{score}<span className="text-xs">/100</span></div>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3 p-4">
              <div className="col-span-3">
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Bid Amount</div>
                <div className="text-base font-mono font-black" style={{ color:'var(--primary)' }}>SAR {q.amount.toLocaleString()}</div>
                {isCheapest && <div className="text-[9px] font-bold mt-0.5" style={{ color:'var(--warning)' }}>💰 Lowest bid</div>}
              </div>
              <div className="col-span-3">
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>History</div>
                {history.hasHistory ? (
                  <>
                    <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{history.jobs} job{history.jobs === 1 ? '' : 's'} completed</div>
                    <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>Avg cost: SAR {history.avgCost?.toLocaleString() ?? '—'}</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold" style={{ color:'var(--text3)' }}>New vendor</div>
                    <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>No prior shipment history</div>
                  </>
                )}
              </div>
              <div className="col-span-3">
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>On-Time Performance</div>
                {history.hasHistory ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                        <div className="h-full" style={{ width: `${history.onTimePct}%`, background: history.onTimePct >= 90 ? 'var(--success)' : history.onTimePct >= 75 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span className="text-sm font-bold font-mono" style={{ color: history.onTimePct >= 90 ? 'var(--success)' : history.onTimePct >= 75 ? 'var(--warning)' : 'var(--danger)' }}>{history.onTimePct}%</span>
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>Avg delay: {history.avgDelay > 0 ? `+${history.avgDelay}d` : 'on schedule'}</div>
                  </>
                ) : (
                  <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>No track record yet — assume average risk profile</div>
                )}
              </div>
              <div className="col-span-3 flex items-end justify-end">
                <button onClick={() => setConfirmApprove(q)}
                  className="px-3 py-2 text-xs font-bold rounded-lg text-white" style={{ background: tierColor }}>
                  ✓ Approve Recommended
                </button>
              </div>
              <div className="col-span-12 pt-3 border-t" style={{ borderColor:'var(--border)' }}>
                <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
                  <strong>Why this vendor:</strong> {history.hasHistory
                    ? `${v?.name} has completed ${history.jobs} similar job${history.jobs === 1 ? '' : 's'} with a ${history.onTimePct}% on-time rate. ${isCheapest ? 'Combined with the lowest bid for this shipment, ' : 'Their bid is competitive and '}they score ${score}/100 against the alternatives.`
                    : `${v?.name} has no prior history with us — but their bid (${isCheapest ? 'lowest' : 'mid-range'}) places them at the top among the current candidates. Consider a conservative approval with a follow-up review after delivery.`}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Quote cards comparison */}
      {quotes.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
          <ClipboardList className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
          <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No quotes yet</p>
          <p className="text-[11px] mb-3" style={{ color:'var(--text3)' }}>Click <strong>Create Quote</strong> to collect a bid from a local vendor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {quotes.map(q => {
            const v = vendors?.find(x => x.id === q.vendorId)
            const isApproved = q.status === 'approved'
            const isRejected = q.status === 'rejected'
            const isCheapest = q.id === cheapest?.id
            const aiData = aiAnalysis.vendorScores.get(q.id)
            const isTopPick = aiAnalysis.topPick?.quote.id === q.id && !isRejected
            return (
              <div key={q.id} className="rounded-xl border overflow-hidden transition-all"
                style={{ ...C, opacity: isRejected ? 0.55 : 1, borderColor: isApproved ? 'var(--success)' : isTopPick ? 'var(--primary)' : 'var(--border)', borderWidth: isApproved || isTopPick ? 2 : 1 }}>
                <div className="px-3 py-2 flex items-center justify-between flex-wrap gap-1" style={{ background: isApproved ? 'rgba(5,150,105,.08)' : isTopPick ? 'var(--primary-light)' : 'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                  <span className="font-mono text-[12.5px] font-bold" style={{ color:'var(--text3)' }}>{q.id}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {isTopPick && !isApproved && <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--primary)', color:'#fff' }}><Star className="w-2.5 h-2.5" />AI Pick</span>}
                    {isCheapest && !isApproved && <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.15)', color:'var(--warning)' }}>💰 Cheapest</span>}
                    {isApproved && <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.15)', color:'var(--success)' }}><CheckCircle2 className="w-2.5 h-2.5" />Approved</span>}
                    {isRejected && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(220,38,38,.15)', color:'var(--danger)' }}>Rejected</span>}
                    {q.status === 'pending' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.15)', color:'var(--warning)' }}>Pending</span>}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color:'var(--text)' }}>{v?.name ?? q.vendorId}</div>
                    <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{q.vendorId}</div>
                  </div>

                  {/* AI score row */}
                  {aiData && !isApproved && (
                    <div className="rounded-lg border px-2 py-1.5 flex items-center gap-2" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color:'var(--text3)' }}>AI Score</div>
                      <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                        <div className="h-full" style={{ width: `${aiData.score}%`, background: aiData.score >= 80 ? 'var(--success)' : aiData.score >= 60 ? 'var(--primary)' : aiData.score >= 40 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <div className="text-xs font-black font-mono flex-shrink-0" style={{ color: aiData.score >= 80 ? 'var(--success)' : aiData.score >= 60 ? 'var(--primary)' : 'var(--warning)' }}>{aiData.score}</div>
                    </div>
                  )}

                  {/* History */}
                  {aiData?.history && (
                    <div className="grid grid-cols-2 gap-1.5 text-[12.5px]">
                      <div className="rounded p-1.5" style={{ background:'var(--bg2)' }}>
                        <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Jobs</div>
                        <div className="font-mono font-bold" style={{ color: aiData.history.hasHistory ? 'var(--text)' : 'var(--text3)' }}>{aiData.history.hasHistory ? aiData.history.jobs : 'New'}</div>
                      </div>
                      <div className="rounded p-1.5" style={{ background:'var(--bg2)' }}>
                        <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>On-Time</div>
                        <div className="font-mono font-bold" style={{ color: aiData.history.hasHistory ? (aiData.history.onTimePct >= 90 ? 'var(--success)' : aiData.history.onTimePct >= 75 ? 'var(--warning)' : 'var(--danger)') : 'var(--text3)' }}>
                          {aiData.history.hasHistory ? `${aiData.history.onTimePct}%` : '—'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor:'var(--border)' }}>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Amount</div>
                      <div className="text-sm font-mono font-black" style={{ color:'var(--primary)' }}>SAR {q.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Delivery</div>
                      <div className="text-xs font-mono" style={{ color:'var(--text)' }}>{fmtDate(q.deliveryDate)}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t" style={{ borderColor:'var(--border)' }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Reason</div>
                    <div className="text-[11px]" style={{ color:'var(--text2)' }}>{q.reason}</div>
                  </div>
                  <div className="text-[9px]" style={{ color:'var(--text3)' }}>by {q.createdBy} · {fmtDate(q.createdAt)}</div>
                  {q.status === 'pending' && (
                    <button onClick={() => setConfirmApprove(q)}
                      className="w-full mt-2 py-1.5 text-xs font-bold rounded-lg text-white" style={{ background:'var(--success)' }}>
                      ✓ Approve This Quote
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Quote Modal */}
      <EnterpriseModal open={createOpen} onClose={() => setCreateOpen(false)}
        title="Create Quote" subtitle="Add a new vendor bid" icon={<Plus className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleCreate}>Create & Save</ModalBtn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Vendor <span style={{ color:'var(--danger)' }}>*</span></label>
            <select value={draft.vendorId} onChange={e => setDraft({ ...draft, vendorId: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}>
              <option value="">Select a local vendor…</option>
              {(vendors ?? []).map(v => <option key={v.id} value={v.id}>{v.name} ({v.id})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="number" value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} placeholder="25000"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Delivery Date <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="date" value={draft.deliveryDate} onChange={e => setDraft({ ...draft, deliveryDate: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reason for approval <span style={{ color:'var(--danger)' }}>*</span></label>
            <textarea value={draft.reason} onChange={e => setDraft({ ...draft, reason: e.target.value })} rows={3} placeholder="Why this vendor — rate, experience, ETA, capacity…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>

      {/* Confirm-approve modal */}
      <EnterpriseModal open={!!confirmApprove} onClose={() => setConfirmApprove(null)}
        title="Confirm & Approve Quote" subtitle="This will lock the vendor and generate the invoice"
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmApprove(null)}>Cancel</ModalBtn><ModalBtn onClick={() => handleApprove(confirmApprove)}>✓ Confirm & Approve</ModalBtn></>}>
        {confirmApprove && (() => {
          const v = vendors?.find(x => x.id === confirmApprove.vendorId)
          return (
            <div className="space-y-3">
              <div className="rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Approving</div>
                <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{v?.name ?? confirmApprove.vendorId}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div><span style={{ color:'var(--text3)' }}>Amount:</span> <strong className="font-mono" style={{ color:'var(--primary)' }}>SAR {confirmApprove.amount.toLocaleString()}</strong></div>
                  <div><span style={{ color:'var(--text3)' }}>Delivery:</span> <strong>{fmtDate(confirmApprove.deliveryDate)}</strong></div>
                </div>
              </div>
              <div className="rounded-lg border p-3 text-[11px]" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)', color:'var(--text2)' }}>
                ⚠ Approving this quote will: 1) Lock the vendor for this shipment · 2) Reject all other pending quotes · 3) Auto-generate the invoice with 15% VAT · 4) Move the shipment into the <strong>delivery workflow</strong>.
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — INVOICE
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceTab({ shipment, vendors, update, toast }) {
  const inv = shipment.invoice
  if (!inv) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
        <Receipt className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
        <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No invoice yet</p>
        <p className="text-[11px]" style={{ color:'var(--text3)' }}>The invoice is auto-generated when a quote gets approved. Head to the <strong>Quotes</strong> tab to approve one.</p>
      </div>
    )
  }
  const v = vendors?.find(x => x.id === inv.vendorId)
  const statusCfg = inv.status === 'paid'  ? { c:'var(--success)', label:'Paid' }
                  : inv.status === 'sent'  ? { c:'var(--primary)', label:'Sent' }
                  : { c:'var(--warning)', label:'Draft' }

  const handlePrint = () => {
    toast.success('Print queued', `Invoice ${inv.id} sent to default printer`)
  }
  const handleEmail = () => {
    toast.success('Email sent', `Invoice ${inv.id} sent to ${v?.name ?? inv.vendorId}`)
  }

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Status</span>
          <span className="px-2 py-1 text-[12.5px] font-bold rounded-md" style={{ background:`${statusCfg.c}15`, color: statusCfg.c, border:`1px solid ${statusCfg.c}30` }}>{statusCfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleEmail} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Mail className="w-3.5 h-3.5" /> Send to Vendor
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="rounded-xl border overflow-hidden" style={{ ...C, background:'#fff' }}>
        <div className="p-6 space-y-5" style={{ color:'#111' }}>
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor:'#E5E7EB' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#2563EB' }}>
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-base font-black">HELMS Logistics</div>
                  <div className="text-[12.5px]" style={{ color:'#6B7280' }}>Heavy Equipment Logistics Management · Saudi Arabia</div>
                </div>
              </div>
              <div className="text-[12.5px] mt-2" style={{ color:'#6B7280' }}>VAT Reg: 300012345600003 · CR: 1010012345</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tracking-tight">INVOICE</div>
              <div className="text-xs font-mono mt-1" style={{ color:'#6B7280' }}>{inv.id}</div>
            </div>
          </div>

          {/* Vendor + meta */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[12.5px] font-bold uppercase tracking-widest mb-1" style={{ color:'#6B7280' }}>Billed To</div>
              <div className="text-sm font-bold">{v?.name ?? inv.vendorId}</div>
              <div className="text-[11px] mt-0.5" style={{ color:'#6B7280' }}>Vendor ID: {inv.vendorId}</div>
              {v?.email && <div className="text-[11px]" style={{ color:'#6B7280' }}>{v.email}</div>}
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div><span style={{ color:'#6B7280' }}>Invoice Date:</span> <strong className="font-mono">{fmtDate(inv.issuedDate)}</strong></div>
              <div><span style={{ color:'#6B7280' }}>Due Date:</span> <strong className="font-mono">{fmtDate(inv.dueDate)}</strong></div>
              <div><span style={{ color:'#6B7280' }}>Shipment #:</span> <strong className="font-mono">{shipment.id}</strong></div>
              <div><span style={{ color:'#6B7280' }}>PO #:</span> <strong className="font-mono">{inv.poNumber || '—'}</strong></div>
              <div><span style={{ color:'#6B7280' }}>Quote #:</span> <strong className="font-mono">{inv.quoteId}</strong></div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor:'#E5E7EB' }}>
            <table className="w-full text-xs">
              <thead style={{ background:'#F9FAFB' }}>
                <tr>
                  {['Description','Qty','Unit Price (SAR)','Amount (SAR)'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop:'1px solid #E5E7EB' }}>
                  <td className="px-3 py-2.5">
                    <div className="font-bold">Transportation Services</div>
                    <div className="text-[12.5px]" style={{ color:'#6B7280' }}>{shipment.cargoType} · {locName(shipment.route?.origin?.locationId)} → {locName(shipment.route?.stops?.[shipment.route?.stops?.length - 1]?.locationId)}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono">1</td>
                  <td className="px-3 py-2.5 font-mono">{inv.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-mono font-bold">{inv.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between"><span style={{ color:'#6B7280' }}>Subtotal</span><span className="font-mono">SAR {inv.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span style={{ color:'#6B7280' }}>VAT (15%)</span><span className="font-mono">SAR {inv.vat.toLocaleString()}</span></div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor:'#E5E7EB' }}>
                <span className="font-black text-sm">Total Due</span>
                <span className="font-mono font-black text-sm" style={{ color:'#2563EB' }}>SAR {inv.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t text-[12.5px]" style={{ borderColor:'#E5E7EB', color:'#6B7280' }}>
            Payment terms: Net 30 · Bank transfer details on file · For queries contact accounts@helms.sa
            {inv.sentAt && <span className="ml-2">· Last sent: {fmtDateTime(inv.sentAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — INVENTORY (cargo + items + equipment)
// ═══════════════════════════════════════════════════════════════════════════
function InventoryTab({ shipment }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
          <Box className="w-4 h-4" style={{ color:'var(--primary)' }} />
          Inventory · Cargo & Equipment
        </h3>
        <p className="text-[11px]" style={{ color:'var(--text3)' }}>
          All cargo units, dimensions, packing/release status and equipment requested for this shipment
        </p>
      </div>
      <CargoSection shipment={shipment} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — ACCOUNTS (Sales Order, Vendor Invoices, Payments, Closure)
// ═══════════════════════════════════════════════════════════════════════════
function AccountsTab({ shipment, vendors, update, toast }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Sales Order & Vendor Invoices</h3>
        <p className="text-[11px]" style={{ color:'var(--text3)' }}>
          Vendor-submitted invoices · payment processing · closure with full audit trail
        </p>
      </div>
      <VendorInvoicesSection shipment={shipment} vendors={vendors} update={update} toast={toast} />
    </div>
  )
}

// ─── Vendor Invoices Section (vendor-submitted invoices + payment processing + closure) ──
function VendorInvoicesSection({ shipment, vendors, update, toast }) {
  const invoices = shipment.vendorInvoices ?? []
  const [submitOpen, setSubmitOpen]   = useState(false)
  const [payOpen, setPayOpen]         = useState(null)  // a vendor invoice
  const [closeOpen, setCloseOpen]     = useState(null)  // a vendor invoice
  const [submitDraft, setSubmitDraft] = useState({ invoiceNumber:'', invoiceDate:'', amount:'', vendorId: shipment.invoice?.vendorId ?? '', attachment:'' })
  const [payDraft, setPayDraft]       = useState({ amount:'', date:'', referenceNumber:'', proofFile:'' })
  const [closeDraft, setCloseDraft]   = useState({ remarks:'', finalReference:'', supportingDocs:'', finalReceipt:'' })

  const STATUS_CFG = {
    pending:        { label:'Pending',        c:'var(--warning)', bg:'rgba(217,119,6,.12)' },
    partially_paid: { label:'Partially Paid', c:'var(--primary)', bg:'var(--primary-light)' },
    paid:           { label:'Paid',           c:'var(--success)', bg:'rgba(5,150,105,.12)' },
  }

  const handleSubmit = () => {
    if (!submitDraft.invoiceNumber || !submitDraft.invoiceDate || !submitDraft.amount || !submitDraft.vendorId) {
      toast.warning('Missing fields', 'Invoice #, date, amount and vendor are required.')
      return
    }
    const newInv = {
      id: `VINV-${shipment.id}-${invoices.length + 1}`,
      invoiceNumber: submitDraft.invoiceNumber,
      invoiceDate:   new Date(submitDraft.invoiceDate).toISOString(),
      amount:        Number(submitDraft.amount),
      vendorId:      submitDraft.vendorId,
      vendorName:    vendors?.find(v => v.id === submitDraft.vendorId)?.name ?? submitDraft.vendorId,
      shipmentRef:   shipment.id,
      attachment:    submitDraft.attachment || `vendor-invoice-${shipment.id}.pdf`,
      status:        'pending',
      payments:      [],
      closure:       null,
      submittedAt:   new Date().toISOString(),
    }
    const newAudit = { id:`AUD-${shipment.id}-${Date.now()}`, actor:'Vendor', action:`Submitted invoice ${newInv.invoiceNumber}`, date: newInv.submittedAt, meta:{ amount: newInv.amount } }
    update({ vendorInvoices: [...invoices, newInv], auditLog: [...(shipment.auditLog ?? []), newAudit] })
    setSubmitOpen(false); setSubmitDraft({ invoiceNumber:'', invoiceDate:'', amount:'', vendorId: shipment.invoice?.vendorId ?? '', attachment:'' })
    toast.success('Invoice submitted', `${newInv.invoiceNumber} · SAR ${newInv.amount.toLocaleString()}`)
  }

  const handleRecordPayment = () => {
    if (!payOpen) return
    if (!payDraft.amount || !payDraft.date || !payDraft.referenceNumber) {
      toast.warning('Missing fields', 'Amount, date and reference number are required.')
      return
    }
    const now = new Date().toISOString()
    const newPay = {
      id: `PAY-${payOpen.id}-${(payOpen.payments?.length ?? 0) + 1}`,
      amount: Number(payDraft.amount),
      date: new Date(payDraft.date).toISOString(),
      referenceNumber: payDraft.referenceNumber,
      proofFile: payDraft.proofFile || `receipt-${Date.now()}.pdf`,
      recordedBy: 'Khalid Salman',
      recordedAt: now,
    }
    const updatedPayments = [...(payOpen.payments ?? []), newPay]
    const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0)
    const newStatus = totalPaid >= payOpen.amount ? 'paid' : (totalPaid > 0 ? 'partially_paid' : 'pending')
    const updatedInv = { ...payOpen, payments: updatedPayments, status: newStatus }
    const newAudit = { id:`AUD-${shipment.id}-${Date.now()}`, actor:'Khalid Salman', action:`Payment recorded · ${payOpen.invoiceNumber}`, date: now, meta:{ amount: newPay.amount, ref: newPay.referenceNumber, newStatus } }
    update({
      vendorInvoices: invoices.map(i => i.id === payOpen.id ? updatedInv : i),
      auditLog: [...(shipment.auditLog ?? []), newAudit],
    })
    setPayOpen(null); setPayDraft({ amount:'', date:'', referenceNumber:'', proofFile:'' })
    toast.success('Payment recorded', `${newPay.referenceNumber} · SAR ${newPay.amount.toLocaleString()} · status → ${STATUS_CFG[newStatus].label}`)
  }

  const handleClose = () => {
    if (!closeOpen) return
    if (!closeDraft.remarks || !closeDraft.finalReference) {
      toast.warning('Missing fields', 'Closure remarks and final reference are required.')
      return
    }
    const now = new Date().toISOString()
    const closure = {
      date: now,
      remarks: closeDraft.remarks,
      finalReference: closeDraft.finalReference,
      supportingDocs: closeDraft.supportingDocs ? closeDraft.supportingDocs.split(',').map(s => s.trim()).filter(Boolean) : [],
      finalReceipt: closeDraft.finalReceipt || `final-receipt-${closeOpen.id}.pdf`,
      closedBy: 'Finance Manager',
    }
    const newAudit = { id:`AUD-${shipment.id}-${Date.now()}`, actor:'Finance Manager', action:`Payment closure for ${closeOpen.invoiceNumber}`, date: now, meta:{ finalReference: closure.finalReference } }
    update({
      vendorInvoices: invoices.map(i => i.id === closeOpen.id ? { ...i, closure } : i),
      auditLog: [...(shipment.auditLog ?? []), newAudit],
    })
    setCloseOpen(null); setCloseDraft({ remarks:'', finalReference:'', supportingDocs:'', finalReceipt:'' })
    toast.success('Payment closed', `${closeOpen.invoiceNumber} · audit trail recorded`)
  }

  return (
    <>
      {/* Sales Order link */}
      <div className="rounded-xl border p-3 flex items-center gap-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <Hash className="w-4 h-4" style={{ color:'var(--primary)' }} />
        <div>
          <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Sales Order</div>
          <div className="text-sm font-mono font-bold" style={{ color:'var(--text)' }}>{shipment.salesOrderNumber ?? 'Not linked'}</div>
        </div>
        <div className="ml-auto text-[12.5px]" style={{ color:'var(--text3)' }}>Auto-linked at vendor allocation</div>
      </div>

      {/* Vendor invoices header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color:'var(--text)' }}>
            Vendor Invoices
            <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{invoices.length}</span>
          </h3>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Invoices submitted by the vendor against this shipment · process payments and close once cleared.</p>
        </div>
        <button onClick={() => setSubmitOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Submit Vendor Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
          <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
          <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No vendor invoices submitted yet</p>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>Click <strong>Submit Vendor Invoice</strong> to add one against the approved vendor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(vi => {
            const v = vendors?.find(x => x.id === vi.vendorId)
            const totalPaid = (vi.payments ?? []).reduce((s, p) => s + p.amount, 0)
            const outstanding = vi.amount - totalPaid
            const paidPct = Math.round((totalPaid / vi.amount) * 100)
            const cfg = STATUS_CFG[vi.status] ?? STATUS_CFG.pending
            const closed = !!vi.closure
            return (
              <div key={vi.id} className="rounded-xl border overflow-hidden" style={{ ...C, borderColor: closed ? '#8B5CF6' : cfg.c, borderWidth: closed ? 2 : 1 }}>
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: cfg.bg, borderBottom:`1px solid ${cfg.c}30` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.c }}>
                      <Receipt className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color:'var(--text)' }}>{vi.invoiceNumber}</div>
                      <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{v?.name ?? vi.vendorName} · {fmtDate(vi.invoiceDate)} · {vi.attachment}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-bold px-2 py-1 rounded-md" style={{ background: cfg.c, color:'#fff' }}>{cfg.label}</span>
                    {closed && <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-2 py-1 rounded-md" style={{ background:'#8B5CF6', color:'#fff' }}><Lock className="w-3 h-3" />Closed</span>}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Amount summary */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Invoice Amount</div>
                      <div className="text-sm font-mono font-black" style={{ color:'var(--text)' }}>SAR {vi.amount.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Paid</div>
                      <div className="text-sm font-mono font-black" style={{ color:'var(--success)' }}>SAR {totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Outstanding</div>
                      <div className="text-sm font-mono font-black" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {outstanding.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Progress</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background:'var(--border)' }}>
                          <div className="h-full transition-all" style={{ width:`${paidPct}%`, background: paidPct >= 100 ? 'var(--success)' : paidPct > 0 ? 'var(--primary)' : 'var(--warning)' }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{paidPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment history */}
                  {(vi.payments?.length ?? 0) > 0 && (
                    <div className="rounded-lg border" style={{ borderColor:'var(--border)' }}>
                      <div className="px-3 py-1.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                        <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Payment History ({vi.payments.length})</span>
                      </div>
                      <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                        {vi.payments.map(p => (
                          <div key={p.id} className="px-3 py-2 grid grid-cols-12 gap-2 text-[11px]">
                            <div className="col-span-3 font-mono font-bold" style={{ color:'var(--primary)' }}>SAR {p.amount.toLocaleString()}</div>
                            <div className="col-span-3 font-mono" style={{ color:'var(--text2)' }}>{fmtDate(p.date)}</div>
                            <div className="col-span-3 font-mono" style={{ color:'var(--text2)' }}>{p.referenceNumber}</div>
                            <div className="col-span-3 flex items-center gap-1" style={{ color:'var(--text3)' }}>
                              <FileText className="w-3 h-3" />{p.proofFile}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Closure card */}
                  {closed && (
                    <div className="rounded-lg border-2 p-3" style={{ background:'rgba(139,92,246,.08)', borderColor:'#8B5CF6' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3.5 h-3.5" style={{ color:'#8B5CF6' }} />
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'#8B5CF6' }}>Payment Closed</span>
                        <span className="text-[12.5px] font-mono ml-auto" style={{ color:'var(--text3)' }}>{fmtDateTime(vi.closure.date)} · by {vi.closure.closedBy}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 text-[11px]">
                        <div className="col-span-3">
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Final Reference</div>
                          <div className="font-mono font-bold" style={{ color:'var(--text)' }}>{vi.closure.finalReference}</div>
                        </div>
                        <div className="col-span-3">
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Final Receipt</div>
                          <div className="font-mono truncate" style={{ color:'var(--text)' }}>{vi.closure.finalReceipt}</div>
                        </div>
                        <div className="col-span-6">
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Remarks</div>
                          <div style={{ color:'var(--text2)' }}>{vi.closure.remarks}</div>
                        </div>
                        {vi.closure.supportingDocs?.length > 0 && (
                          <div className="col-span-12 pt-1 border-t" style={{ borderColor:'rgba(139,92,246,.2)' }}>
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Supporting Documents</div>
                            <div className="flex flex-wrap gap-1.5">
                              {vi.closure.supportingDocs.map(d => (
                                <span key={d} className="inline-flex items-center gap-1 text-[12.5px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text2)', border:'1px solid var(--border)' }}>
                                  <FileText className="w-2.5 h-2.5" />{d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!closed && (
                    <div className="flex items-center gap-2 pt-1">
                      {vi.status !== 'paid' && (
                        <button onClick={() => { setPayOpen(vi); setPayDraft({ amount: String(outstanding), date:'', referenceNumber:'', proofFile:'' }) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                          <DollarSign className="w-3.5 h-3.5" /> Process Payment
                        </button>
                      )}
                      {vi.status === 'paid' && (
                        <button onClick={() => setCloseOpen(vi)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white" style={{ background:'#8B5CF6' }}>
                          <Lock className="w-3.5 h-3.5" /> Close Payment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit Invoice Modal */}
      <EnterpriseModal open={submitOpen} onClose={() => setSubmitOpen(false)}
        title="Submit Vendor Invoice" subtitle="Invoice submitted against this shipment" icon={<Receipt className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setSubmitOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleSubmit}>Submit Invoice</ModalBtn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Number <span style={{ color:'var(--danger)' }}>*</span></label>
            <input value={submitDraft.invoiceNumber} onChange={e => setSubmitDraft({ ...submitDraft, invoiceNumber: e.target.value })} placeholder="INV-2026-001"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Date <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="date" value={submitDraft.invoiceDate} onChange={e => setSubmitDraft({ ...submitDraft, invoiceDate: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
            <input type="number" value={submitDraft.amount} onChange={e => setSubmitDraft({ ...submitDraft, amount: e.target.value })} placeholder="0"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Vendor <span style={{ color:'var(--danger)' }}>*</span></label>
            <select value={submitDraft.vendorId} onChange={e => setSubmitDraft({ ...submitDraft, vendorId: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}>
              <option value="">Select vendor…</option>
              {(vendors ?? []).map(v => <option key={v.id} value={v.id}>{v.name} ({v.id})</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Shipment Reference</label>
            <input value={shipment.id} disabled className="w-full rounded-lg px-3 py-2 text-sm border font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Attachment <span style={{ color:'var(--danger)' }}>*</span></label>
            {submitDraft.attachment ? (
              <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:'var(--success)' }}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{submitDraft.attachment}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--success)' }}>Ready to submit</div>
                </div>
                <button type="button" onClick={() => setSubmitDraft({ ...submitDraft, attachment: '' })} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color:'var(--danger)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all"
                style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setSubmitDraft({ ...submitDraft, attachment: f.name }) }} />
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Invoice File</div>
                <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>PDF, JPG or PNG · click to choose</div>
              </label>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {/* Process Payment Modal */}
      <EnterpriseModal open={!!payOpen} onClose={() => setPayOpen(null)}
        title="Process Payment" subtitle={payOpen ? `Against invoice ${payOpen.invoiceNumber}` : ''} icon={<DollarSign className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setPayOpen(null)}>Cancel</ModalBtn><ModalBtn onClick={handleRecordPayment}>Record Payment</ModalBtn></>}>
        {payOpen && (() => {
          const totalPaid = (payOpen.payments ?? []).reduce((s, p) => s + p.amount, 0)
          const outstanding = payOpen.amount - totalPaid
          return (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 grid grid-cols-3 gap-2 text-xs" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Total</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>SAR {payOpen.amount.toLocaleString()}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Paid</div><div className="font-mono font-bold" style={{ color:'var(--success)' }}>SAR {totalPaid.toLocaleString()}</div></div>
                <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Outstanding</div><div className="font-mono font-bold" style={{ color:'var(--warning)' }}>SAR {outstanding.toLocaleString()}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Amount (SAR) <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input type="number" value={payDraft.amount} onChange={e => setPayDraft({ ...payDraft, amount: e.target.value })} placeholder="0" max={outstanding}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Date <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input type="date" value={payDraft.date} onChange={e => setPayDraft({ ...payDraft, date: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2">
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reference Number <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input value={payDraft.referenceNumber} onChange={e => setPayDraft({ ...payDraft, referenceNumber: e.target.value })} placeholder="BANK-XXXXXX or wire transfer ID"
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div className="col-span-2">
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Payment Receipt / Proof <span style={{ color:'var(--danger)' }}>*</span></label>
                  {payDraft.proofFile ? (
                    <div className="rounded-lg border p-3 flex items-center gap-2.5" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)' }}>
                      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:'var(--success)' }}>
                        <Receipt className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{payDraft.proofFile}</div>
                        <div className="text-[12.5px]" style={{ color:'var(--success)' }}>Receipt attached</div>
                      </div>
                      <button type="button" onClick={() => setPayDraft({ ...payDraft, proofFile: '' })} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color:'var(--danger)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all"
                      style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setPayDraft({ ...payDraft, proofFile: f.name }) }} />
                      <Upload className="w-5 h-5 mx-auto mb-1" style={{ color:'var(--text3)' }} />
                      <div className="text-xs font-bold" style={{ color:'var(--text2)' }}>Upload Bank Receipt / Proof</div>
                      <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>PDF, JPG or PNG · attaches to this payment record</div>
                    </label>
                  )}
                </div>
              </div>
              <div className="text-[12.5px] rounded-lg border p-2" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)', color:'var(--text2)' }}>
                After recording: status will update to <strong>{(Number(payDraft.amount) || 0) >= outstanding ? 'Paid' : 'Partially Paid'}</strong>. Once fully paid you can close the payment.
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>

      {/* Close Payment Modal */}
      <EnterpriseModal open={!!closeOpen} onClose={() => setCloseOpen(null)}
        title="Close Payment" subtitle={closeOpen ? `Final closure for ${closeOpen.invoiceNumber}` : ''} icon={<Lock className="w-4 h-4" style={{ color:'#8B5CF6' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setCloseOpen(null)}>Cancel</ModalBtn><ModalBtn onClick={handleClose}>Close Payment</ModalBtn></>}>
        {closeOpen && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-[11px]" style={{ background:'rgba(139,92,246,.08)', borderColor:'rgba(139,92,246,.3)', color:'var(--text2)' }}>
              <strong style={{ color:'#8B5CF6' }}>Final closure</strong> — this is an audited, immutable action that finalises the payment lifecycle for <strong>{closeOpen.invoiceNumber}</strong>. Once closed, the invoice is locked and cannot be edited.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Closure Remarks <span style={{ color:'var(--danger)' }}>*</span></label>
                <textarea value={closeDraft.remarks} onChange={e => setCloseDraft({ ...closeDraft, remarks: e.target.value })} rows={3} placeholder="Confirmation of full payment, reconciliation notes…"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Final Payment Reference <span style={{ color:'var(--danger)' }}>*</span></label>
                <input value={closeDraft.finalReference} onChange={e => setCloseDraft({ ...closeDraft, finalReference: e.target.value })} placeholder="CLR-XXXXX"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Final Receipt</label>
                <input value={closeDraft.finalReceipt} onChange={e => setCloseDraft({ ...closeDraft, finalReceipt: e.target.value })} placeholder="final-receipt.pdf"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div className="col-span-2">
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Supporting Documents <span className="font-normal normal-case" style={{ color:'var(--text3)' }}>(comma-separated filenames)</span></label>
                <input value={closeDraft.supportingDocs} onChange={e => setCloseDraft({ ...closeDraft, supportingDocs: e.target.value })} placeholder="tax-invoice.pdf, delivery-conf.pdf"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
            </div>
          </div>
        )}
      </EnterpriseModal>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — CHECKLIST (sub-wizard, sequential)
// ═══════════════════════════════════════════════════════════════════════════
function ChecklistTab({ shipment, update, toast }) {
  const cl = shipment.checklist ?? {}
  const stops = shipment.route?.stops ?? []
  const cargoItems = ['Generator Set', 'Spare Parts Kit', 'Tools Pack', 'Safety Equipment', 'Loading Crane']

  // Local working state for each card; gets pushed via update() on confirm
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

  // Step locks: can't progress without previous done
  const isLoadedDone   = cl.loaded?.done
  const isPickupDone   = cl.pickup?.done
  const isReachedDone  = (cl.reachedDestinations ?? []).every(r => r.done) && (cl.reachedDestinations ?? []).length > 0
  const isDeliveredDone = cl.delivered?.done

  // ─── Transit log (new) ────────────────────────────────────────────────
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

  // ─── Activity timeline events ─────────────────────────────────────────
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

  // ─── Card wrapper ────────────────────────────────────────────────────────
  const Card = ({ step, title, locked, done, children, color = 'var(--primary)' }) => (
    <div className="rounded-xl border-2 overflow-hidden transition-all"
      style={{ ...C, borderColor: done ? 'var(--success)' : locked ? 'var(--border)' : color, opacity: locked ? 0.55 : 1 }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: done ? 'rgba(5,150,105,.08)' : locked ? 'var(--bg2)' : 'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
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

      {/* Card 1: Loaded — Col-8 + Col-4 */}
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

      {/* Card 3: Reached Destinations (one row per stop) */}
      <Card step={3} title={`Reached Destination${reachedDrafts.length > 1 ? `s (${reachedDrafts.length})` : ''}`} done={isReachedDone} locked={!isPickupDone} color="#8B5CF6">
        <div className="space-y-3">
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
      <Card step={4} title="Delivered — Close Shipment" done={isDeliveredDone} locked={!isReachedDone} color="var(--success)">
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

      {/* ─── Transit Log ───────────────────────────────────────────────── */}
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

      {/* ─── Activity Timeline with day gaps ───────────────────────────── */}
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
