import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Package, ArrowLeft, Edit3, X, Layers, MapPin, Box, FileText,
  Building2, Clock, DollarSign, ShieldCheck, History, CheckCircle2,
  AlertTriangle, Plane, Truck, Eye, Download, Send, Upload, Briefcase,
  GitBranch, AlertCircle,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import useProjectStore    from '../../store/projectStore'
import useUserStore       from '../../store/userStore'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import HorizontalTimeline from '../../components/shipments/HorizontalTimeline'
import {
  SHIPMENT_STATUSES_INTL, SHIPMENT_STATUSES_LOCAL, SHIPMENT_MODES,
  INCOTERMS, LOCATION_MASTER, REQUESTED_EQUIPMENT, buildShipmentTimeline,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }
function fmtDT(iso)   { if (!iso) return '—'; return new Date(iso).toLocaleString('en-SA', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
function fmtMoney(n, cur = 'SAR') { return cur + ' ' + (n ?? 0).toLocaleString() }

function StatusBadge({ status, type }) {
  const cfg = (type === 'international' ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[status] ?? { label: status, cls:'text-slate-500 bg-slate-50 border-slate-200' }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[12.5px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

const TABS = [
  { id: 'overview',  label: 'Overview',       icon: Layers       },
  { id: 'route',     label: 'Route',          icon: GitBranch    },
  { id: 'cargo',     label: 'Cargo',          icon: Box          },
  { id: 'items',     label: 'Shipment Items', icon: Package      },
  { id: 'documents', label: 'Documents',      icon: FileText     },
  { id: 'vendors',   label: 'Vendors',        icon: Building2    },
  { id: 'timeline',  label: 'Timeline',       icon: Clock        },
  { id: 'costs',     label: 'Costs',          icon: DollarSign   },
  { id: 'approvals', label: 'Approvals',      icon: ShieldCheck  },
  { id: 'audit',     label: 'Audit Log',      icon: History      },
]

function KPI({ label, value, sub, icon: Icon, color = 'var(--text)' }) {
  return (
    <div className="rounded-xl border p-4" style={C}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
      </div>
      <div className="text-xl font-black font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }

const STOP_LABELS = { qa:'QA Inspection', transit:'Transit Stop', storage:'Temporary Storage', final:'Final Delivery' }
const STOP_ICONS  = { qa:'🔍', transit:'📍', storage:'🏪', final:'🏁' }

export default function ShipmentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getShipment, cancelShipment, submitShipment } = useShipmentV2Store()
  const { vendors }  = useVendorV2Store()
  const { projects } = useProjectStore()
  const { users }    = useUserStore()
  const { toast } = useToast()

  const [tab, setTab]       = useState('overview')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const ship = getShipment(id)
  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Package className="w-12 h-12" style={{ color:'var(--text3)' }} />
        <p className="text-sm" style={{ color:'var(--text3)' }}>Shipment <span className="font-mono" style={{ color:'var(--primary)' }}>{id}</span> not found</p>
        <button onClick={() => navigate(-1)} className="text-xs font-medium" style={{ color:'var(--primary)' }}>← Back</button>
      </div>
    )
  }

  const isIntl    = ship.type === 'international'
  const supplier  = vendors.find(v => v.id === ship.supplier)
  const project   = projects.find(p => p.id === ship.project)
  const operator  = users.find(u => u.id === (ship.owner ?? ship.operatedBy))

  const totalWeight = (ship.cargo ?? []).reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
  const totalQty    = (ship.items ?? []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)

  const timelineEvents = buildShipmentTimeline(ship)

  // Mode icon
  const modeObj = isIntl ? SHIPMENT_MODES.find(m => m.id === ship.mode) : null

  return (
    <div className="space-y-4">
      <BlockUI />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(isIntl ? '/shipments/intl' : '/shipments/local')}
            className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
            {isIntl ? <Plane className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h2 className="text-base font-bold font-mono" style={{ color:'var(--text)' }}>{ship.id}</h2>
              <StatusBadge status={ship.status} type={ship.type} />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md"
                style={{ background: isIntl ? 'rgba(37,99,235,.08)' : 'rgba(5,150,105,.08)',
                         color: isIntl ? 'var(--primary)' : 'var(--success)',
                         border: `1px solid ${isIntl ? 'rgba(37,99,235,.2)' : 'rgba(5,150,105,.2)'}` }}>
                {isIntl ? 'INTERNATIONAL' : 'LOCAL'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color:'var(--text3)' }}>
              <span>{project?.name ?? '—'}</span>
              {isIntl && <><span>·</span><span>{modeObj?.icon} {modeObj?.label}</span></>}
              {isIntl && <><span>·</span><span className="font-mono">{ship.poNumber}</span></>}
              <span>·</span>
              <span>Created {fmtDate(ship.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ship.status === 'draft' && (
            <button onClick={() => setConfirmSubmit(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--warning)' }}>
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
          )}
          <button onClick={() => navigate(isIntl ? `/shipments/intl/${ship.id}/edit` : `/shipments/local/${ship.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          {!['completed','closed','cancelled','delivered'].includes(ship.status) && (
            <button onClick={() => setConfirmCancel(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border" style={{ ...C, color:'var(--danger)' }}>
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b overflow-x-auto" style={{ borderColor:'var(--border)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap"
              style={tab === t.id ? { borderColor:'var(--primary)', color:'var(--primary)' } : { borderColor:'transparent', color:'var(--text3)' }}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ─── TAB 1: Overview ──────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            <KPI label="Status"        value={(isIntl ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[ship.status]?.label ?? ship.status} color="var(--primary)" icon={CheckCircle2} />
            <KPI label="Cargo Items"   value={ship.cargo?.length ?? 0} sub={`${totalWeight.toLocaleString()} kg total`} icon={Box} />
            <KPI label="Shipment Items" value={ship.items?.length ?? 0} sub={`${totalQty} units`} icon={Package} />
            <KPI label="Documents"     value={ship.documents?.length ?? 0} icon={FileText} />
            <KPI label="Route Stops"   value={(ship.route?.stops?.length ?? 0)} sub="incl. final destination" icon={MapPin} />
            <KPI label={isIntl ? 'Est. Value' : 'PO Numbers'} value={isIntl ? fmtMoney(ship.estValue, ship.currency) : (ship.poNumbers?.length ?? 0)} color="var(--success)" icon={DollarSign} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Shipment Summary</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-3">
                {(isIntl ? [
                  ['Shipment Number', ship.id],
                  ['PO Number',        ship.poNumber],
                  ['Supplier',         supplier?.name ?? ship.supplier],
                  ['Supplier Country', supplier?.country ?? '—'],
                  ['Incoterm',         INCOTERMS.find(i => i.id === ship.incoterm)?.label ?? ship.incoterm],
                  ['Mode',             modeObj?.label ?? ship.mode],
                  ['Project',          project?.name ?? '—'],
                  ['Owner',            operator?.name ?? '—'],
                  ['Ready Date',       fmtDate(ship.readyDate)],
                  ['Final Destination', locName(ship.deliveryLocation) + ' (' + (ship.finalDestType ?? '—') + ')'],
                ] : [
                  ['Shipment Number',  ship.id],
                  ['Project',          project?.name ?? '—'],
                  ['Shipment Type',    ship.shipmentType],
                  ['Operated By',      operator?.name ?? '—'],
                  ['Transporter',      ship.transporterMode === 'rfq' ? 'Via RFQ Process' : (supplier?.name ?? '—')],
                  ['Reference',        ship.reference ?? ship.shipmentReference ?? '—'],
                  ['PO Numbers',       (ship.poNumbers ?? []).join(', ') || '—'],
                  ['Shipment Date',    fmtDate(ship.shipmentDate)],
                  ['ETA',              fmtDate(ship.eta)],
                  ['Delivery Note #',  ship.deliveryNoteNumber || '—'],
                ]).map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
                    <div className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Quick Timeline</h3>
              </div>
              <div className="p-4 space-y-3">
                {timelineEvents.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: e.completed ? 'var(--success)' : 'var(--bg3)' }}>
                      {e.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Clock className="w-3.5 h-3.5" style={{ color:'var(--text3)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight" style={{ color: e.completed ? 'var(--text)' : 'var(--text3)' }}>{e.label}</div>
                      {e.actor && <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{e.actor}</div>}
                      {e.date && <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(e.date)}</div>}
                    </div>
                  </div>
                ))}
                <button onClick={() => setTab('timeline')} className="text-[11px] font-semibold mt-2" style={{ color:'var(--primary)' }}>
                  View full timeline →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Route ──────────────────────────────────────── */}
      {tab === 'route' && (
        <div className="space-y-3">
          {/* Origin */}
          <div className="rounded-xl border p-4" style={C}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--primary)' }}>A</div>
              <div>
                <h4 className="text-sm font-bold" style={{ color:'var(--text)' }}>Origin</h4>
                <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Pickup point</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Location</div>
                <div className="text-sm font-medium" style={{ color:'var(--text)' }}>{locName(ship.route?.origin?.locationId)}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Contact</div>
                <div className="text-sm font-medium" style={{ color:'var(--text)' }}>{ship.route?.origin?.contact || '—'}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Address</div>
                <div className="text-sm" style={{ color:'var(--text2)' }}>{ship.route?.origin?.address || '—'}</div>
              </div>
            </div>
          </div>

          {/* Stops */}
          {(ship.route?.stops ?? []).length > 0 ? (
            <div className="space-y-3">
              {ship.route.stops.map((stop, i) => (
                <div key={stop.id} className="rounded-xl border overflow-hidden" style={C}>
                  <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background:'var(--cyan)' }}>{i + 1}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{STOP_ICONS[stop.type] ?? '📍'}</span>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text2)' }}>{STOP_LABELS[stop.type] ?? stop.type}</span>
                    </div>
                    {i === ship.route.stops.length - 1 && <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background:'var(--success)', color:'#fff' }}>FINAL</span>}
                  </div>
                  <div className="p-4 grid grid-cols-4 gap-3">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Location</div>
                      <div className="text-sm font-medium" style={{ color:'var(--text)' }}>{locName(stop.locationId)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>ETA</div>
                      <div className="text-sm font-mono" style={{ color:'var(--text)' }}>{fmtDT(stop.eta)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Contact</div>
                      <div className="text-sm font-medium" style={{ color:'var(--text)' }}>{stop.contact || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>Notes</div>
                      <div className="text-xs" style={{ color:'var(--text2)' }}>{stop.notes || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border p-8 text-center" style={C}>
              <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
              <p className="text-sm" style={{ color:'var(--text3)' }}>No route stops defined</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Cargo ─────────────────────────────────────── */}
      {tab === 'cargo' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Name','Packages','Weight','Volume','Dimensions (L×W×H)','Notes','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {(ship.cargo ?? []).length === 0
                ? <tr><td colSpan={7} className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No cargo records</td></tr>
                : ship.cargo.map(c => (
                  <tr key={c.id} style={{ opacity: c.active === false ? 0.5 : 1 }}>
                    <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color:'var(--text)' }}>{c.name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--text2)' }}>{c.packages}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono font-semibold" style={{ color:'var(--text)' }}>{Number(c.weight).toLocaleString()} {c.weightUnit}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--text2)' }}>{c.volume ?? '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{c.length}×{c.width}×{c.height} {c.unit}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>{c.notes || '—'}</span></td>
                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${c.active !== false ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>{c.active !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 4: Items ─────────────────────────────────────── */}
      {tab === 'items' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Material Code','HS Code','Description','Qty','Unit','Origin','Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {(ship.items ?? []).length === 0
                ? <tr><td colSpan={7} className="py-10 text-center text-sm" style={{ color:'var(--text3)' }}>No items recorded</td></tr>
                : ship.items.map(it => (
                  <tr key={it.id}>
                    <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color:'var(--primary)' }}>{it.materialCode}</span></td>
                    <td className="px-4 py-3"><span className="font-mono text-xs" style={{ color:'var(--text2)' }}>{it.hsCode}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text)' }}>{it.description}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{it.quantity}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>{it.unit}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>{it.origin}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text3)' }}>{it.notes || '—'}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 5: Documents ─────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
            <p className="text-sm font-medium" style={{ color:'var(--text2)' }}>Drag & drop documents here, or click to browse</p>
            <p className="text-[11px] mt-1" style={{ color:'var(--text3)' }}>Files are versioned automatically</p>
          </div>
          <div className="rounded-xl border overflow-hidden" style={C}>
            <table className="w-full">
              <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <tr>
                  {['Type','File','Version','Uploaded','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
                {(ship.documents ?? []).map(d => (
                  <tr key={d.id}>
                    <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color:'var(--text)' }}>{d.type}</span></td>
                    <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{d.fileName}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--text2)' }}>v{d.version}</span></td>
                    <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{fmtDate(d.uploadedAt)}</span></td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 border rounded-md text-emerald-600 bg-emerald-50 border-emerald-200">VALID</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color:'var(--text3)' }}><Eye className="w-3.5 h-3.5" /></button>
                        <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color:'var(--text3)' }}><Download className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: Vendors ───────────────────────────────────── */}
      {tab === 'vendors' && (
        <div className="space-y-3">
          {supplier ? (
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>{isIntl ? 'Supplier' : 'Contracted Vendor'}</h3>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                  {supplier.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold mb-0.5" style={{ color:'var(--text)' }}>{supplier.name}</div>
                  <div className="flex items-center gap-3 text-xs" style={{ color:'var(--text3)' }}>
                    <span className="font-mono">{supplier.code}</span>
                    <span>·</span>
                    <span>{supplier.type}</span>
                    <span>·</span>
                    <span>{supplier.country}</span>
                    <span>·</span>
                    <span>{supplier.rating ? supplier.rating.toFixed(1) + ' ★' : '—'}</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/vendors-v2/${supplier.id}`)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
                  View Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border p-8 text-center" style={C}>
              <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
              <p className="text-sm" style={{ color:'var(--text3)' }}>{ship.transporterMode === 'rfq' ? 'Vendor will be selected via RFQ process' : 'No vendor assigned'}</p>
            </div>
          )}

          <div className="rounded-xl border p-4" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
              <p className="text-xs" style={{ color:'var(--text2)' }}>
                Future expansion: this tab will support multi-vendor handoffs (origin handler, freight forwarder, customs broker, last-mile carrier) as the workflow grows.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: Timeline (HORIZONTAL) ─────────────────────── */}
      {tab === 'timeline' && (
        <HorizontalTimeline events={timelineEvents} />
      )}

      {/* ─── TAB 8: Costs ─────────────────────────────────────── */}
      {tab === 'costs' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-xl border overflow-hidden" style={C}>
            <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Financial Breakdown</h3>
            </div>
            <div className="p-4 space-y-3">
              {(isIntl ? [
                ['Estimated Shipment Value', fmtMoney(ship.estValue, ship.currency)],
                ['Currency',                  ship.currency],
                ['Insurance Required',        ship.insuranceRequired ? 'Yes' : 'No'],
                ['Insurance Value',           fmtMoney(ship.insuranceValue, ship.currency)],
                ['Freight Terms',             ship.freightTerms],
                ['Payment Terms',             ship.paymentTerms],
              ] : [
                ['Shipment Type',     ship.shipmentType],
                ['Transporter Mode',  ship.transporterMode === 'rfq' ? 'RFQ' : 'Contracted'],
                ['PO Numbers',        (ship.poNumbers ?? []).length],
              ]).map(([l, v]) => (
                <div key={l} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0" style={{ borderColor:'var(--border)' }}>
                  <span className="text-xs font-medium" style={{ color:'var(--text2)' }}>{l}</span>
                  <span className="text-sm font-mono font-bold" style={{ color:'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border p-4" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <DollarSign className="w-5 h-5 mb-2" style={{ color:'var(--primary)' }} />
            <p className="text-xs leading-relaxed" style={{ color:'var(--text2)' }}>
              <strong>Future expansion:</strong> cost tracking will support freight quotes, customs duties, vendor invoices, currency exchange, and budget vs actual comparisons.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 9: Approvals ─────────────────────────────────── */}
      {tab === 'approvals' && (
        <div className="rounded-xl border p-8 text-center" style={C}>
          <ShieldCheck className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
          <p className="text-sm font-medium mb-1" style={{ color:'var(--text2)' }}>Approval workflow coming soon</p>
          <p className="text-[11px] mb-4" style={{ color:'var(--text3)' }}>The shipment approval flow will be configured per project. This tab will show the active flow once enabled.</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-bold border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }}>
            <Briefcase className="w-3 h-3" /> Future expansion module
          </div>
        </div>
      )}

      {/* ─── TAB 10: Audit ────────────────────────────────────── */}
      {tab === 'audit' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <table className="w-full">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Date','User','Action','Field','Old Value','New Value'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              <tr>
                <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDT(ship.createdAt)}</span></td>
                <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text)' }}>{ship.createdBy}</span></td>
                <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color:'var(--primary)' }}>Shipment Created</span></td>
                <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>—</span></td>
                <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span></td>
                <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--success)' }}>Draft</span></td>
              </tr>
              {ship.status !== 'draft' && (
                <tr>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDT(ship.updatedAt)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text)' }}>{ship.createdBy}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color:'var(--primary)' }}>Status Changed</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>Status</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--danger)' }}>Draft</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--success)' }}>{(isIntl ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[ship.status]?.label}</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel modal */}
      {confirmCancel && (
        <EnterpriseModal open={true} onClose={() => setConfirmCancel(false)}
          title="Cancel Shipment" subtitle={ship.id}
          icon={<X className="w-4 h-4" style={{ color:'var(--danger)' }} />} size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmCancel(false)}>Keep Shipment</ModalBtn>
            <ModalBtn variant="danger" onClick={() => { cancelShipment(ship.id); toast.warning('Cancelled', `${ship.id} has been cancelled.`); setConfirmCancel(false); navigate(isIntl ? '/shipments/intl' : '/shipments/local') }}>
              Yes, Cancel Shipment
            </ModalBtn>
          </>}>
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--danger-light)', borderColor:'rgba(220,38,38,.3)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--danger)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              The shipment will be marked <strong>Cancelled</strong>. No data is deleted — the shipment remains available for audit and reporting.
            </p>
          </div>
        </EnterpriseModal>
      )}

      {/* Submit modal */}
      {confirmSubmit && (
        <EnterpriseModal open={true} onClose={() => setConfirmSubmit(false)}
          title="Submit Shipment" subtitle={ship.id}
          icon={<Send className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmSubmit(false)}>Cancel</ModalBtn>
            <ModalBtn onClick={() => { submitShipment(ship.id); toast.success('Submitted', `${ship.id} submitted.`); setConfirmSubmit(false) }}>
              Yes, Submit
            </ModalBtn>
          </>}>
          <p className="text-xs" style={{ color:'var(--text2)' }}>
            The shipment will be moved from Draft to {isIntl ? 'Submitted' : 'Assigned'} status. Operations will be notified.
          </p>
        </EnterpriseModal>
      )}
    </div>
  )
}
