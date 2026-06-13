// International Shipment Profile — mirrors LocalShipmentProfile pattern
// Tabs: Detail · Items · Quotes (RFQ + selection) · Checklist (with Transit reasons + timeline) · Accounts
import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Plane, MapPin, FileText, Box, ClipboardList, CheckSquare, DollarSign, Activity,
  ArrowLeft, Edit3, Send, Check, X, Eye, Plus, Upload, Clock, AlertTriangle,
  Building2, Briefcase, Package, Calendar, Truck, ChevronRight, ChevronDown,
  CheckCircle2, Hash, Award, AlertCircle, Receipt, CreditCard, Filter, Search,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store from '../../store/vendorV2Store'
import useFinanceStore from '../../store/financeStore'
import useToastStore from '../../store/toastStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  OVERALL_STATUS_CFG, deriveOverallStatus, LOCATION_MASTER,
  TRANSIT_REASONS, INTL_CHECKLIST_STEPS, SHIPMENT_MODES,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmt = (n) => (n ?? 0).toLocaleString()
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'
const daysBetween = (a, b) => {
  if (!a || !b) return null
  return Math.floor((new Date(b) - new Date(a)) / 86400000)
}

const MAIN_TABS = [
  { id:'detail',    label:'Shipment Detail', icon: FileText      },
  { id:'items',     label:'Items',           icon: Box           },
  { id:'quotes',    label:'RFQ & Quotes',    icon: ClipboardList },
  { id:'checklist', label:'Checklist',       icon: CheckSquare   },
  { id:'accounts',  label:'Accounts',        icon: DollarSign    },
]

const DETAIL_SECTIONS = [
  { id:'overview',  label:'Overview',  icon: Eye      },
  { id:'route',     label:'Route',     icon: MapPin   },
  { id:'cost',      label:'Cost',      icon: DollarSign },
  { id:'timeline',  label:'Timeline',  icon: Activity },
]

export default function IntlShipmentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { intlShipments, updateIntlShipment } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()
  const toast = useToastStore()

  const shipment = useMemo(() => intlShipments.find(s => s.id === id), [intlShipments, id])
  const [activeTab, setActiveTab] = useState('detail')
  const [detailSection, setDetailSection] = useState('overview')

  if (!shipment) {
    return (
      <div className="rounded-xl border py-12 text-center" style={C}>
        <Plane className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
        <p className="text-sm" style={{ color:'var(--text2)' }}>Shipment <span className="font-mono font-bold">{id}</span> not found</p>
        <button onClick={() => navigate('/shipments/intl')} className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
          ← Back to International Shipments
        </button>
      </div>
    )
  }

  const update = (patch) => updateIntlShipment(shipment.id, patch)
  const cfg = OVERALL_STATUS_CFG[deriveOverallStatus({ ...shipment, _kind:'international' })]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border p-4" style={C}>
        <div className="flex items-start gap-3">
          <Link to="/shipments/intl" className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </Link>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)' }}>
            <Plane className="w-5 h-5" style={{ color:'var(--primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold font-mono" style={{ color:'var(--text)' }}>{shipment.id}</h2>
              <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                <span>{cfg.icon}</span>{cfg.label}
              </span>
              {(shipment.modes ?? (shipment.mode ? [shipment.mode] : [])).map(m => (
                <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                  {SHIPMENT_MODES.find(x => x.id === m)?.label ?? m}
                </span>
              ))}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color:'var(--text3)' }}>
              {shipment.project ?? '—'} · PO {shipment.poNumber ?? '—'} · Incoterm {shipment.incoterm ?? '—'} · Owner {shipment.owner ?? '—'}
            </div>
          </div>
          <button onClick={() => navigate(`/shipments/intl/edit/${shipment.id}`)} className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex" style={{ borderBottom:'1px solid var(--border)' }}>
          {MAIN_TABS.map(t => {
            const active = activeTab === t.id
            const Icon = t.icon
            // Per-tab counter badges
            let badge = null
            let badgeColor = null
            if (t.id === 'detail') {
              const total = (shipment.origins?.length ?? 0) + (shipment.destinations?.length ?? 0)
              badge = total > 0 ? total : null
            }
            if (t.id === 'items') {
              const items = (shipment.items ?? []).filter(i => i.active !== false).length
              const cargo = (shipment.cargo ?? []).filter(c => c.active !== false).length
              badge = items + cargo > 0 ? `${items}+${cargo}` : null
            }
            if (t.id === 'quotes') {
              const rfq = shipment.rfq ?? {}
              const sentCount = rfq.sentTo?.length ?? 0
              const replyCount = rfq.replies?.length ?? 0
              const selected = !!rfq.selectedVendorId
              if (selected) {
                badge = `✓ ${replyCount}`
                badgeColor = '#059669'   // green: RFQ sent + quote approved → green tab
              } else if (sentCount > 0) {
                badge = `${replyCount}/${sentCount}`
                badgeColor = replyCount === sentCount ? '#06B6D4' : '#D97706'
              }
            }
            if (t.id === 'checklist') {
              const phases = shipment.intlChecklist ?? {}
              const done = Object.values(phases).filter(p => p?.completed).length
              const total = 10   // 10 phases
              badge = `${done}/${total}`
              if (done === total) badgeColor = '#059669'
            }
            if (t.id === 'accounts') {
              // We can't easily count without finance store here; skip badge
            }
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-all relative"
                style={{
                  background: active ? 'var(--card)' : 'var(--bg2)',
                  color: active ? 'var(--primary)' : 'var(--text2)',
                  borderRight:'1px solid var(--border)',
                }}>
                <Icon className="w-3.5 h-3.5" />{t.label}
                {badge != null && (
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md"
                    style={{
                      background: badgeColor ? `${badgeColor}20` : 'var(--card)',
                      color: badgeColor ?? 'var(--text3)',
                      border: badgeColor ? `1px solid ${badgeColor}40` : '1px solid var(--border)',
                    }}>
                    {badge}
                  </span>
                )}
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'var(--primary)' }} />}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'detail'    && <DetailTab shipment={shipment} section={detailSection} setSection={setDetailSection} />}
      {activeTab === 'items'     && <ItemsTab shipment={shipment} />}
      {activeTab === 'quotes'    && <QuotesTab shipment={shipment} vendors={vendors} update={update} toast={toast} />}
      {activeTab === 'checklist' && <ChecklistTab shipment={shipment} update={update} toast={toast} />}
      {activeTab === 'accounts'  && <AccountsTab shipment={shipment} update={update} toast={toast} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL TAB — sub-sections: Overview · Route (with horizontal timeline) · Cost · Timeline
// ═══════════════════════════════════════════════════════════════════════════
function DetailTab({ shipment, section, setSection }) {
  // Counts for each sub-section badge
  const routeCount = (shipment.origins?.length ?? 0) + (shipment.destinations?.length ?? 0)
  const docsCount  = (shipment.documents ?? []).filter(d => d.file).length

  return (
    <div className="space-y-3">
      {/* Sub-section nav */}
      <div className="rounded-xl border p-1.5 flex items-center gap-1 flex-wrap" style={C}>
        {DETAIL_SECTIONS.map(s => {
          const active = section === s.id
          const Icon = s.icon
          let count = null
          if (s.id === 'route') count = routeCount
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
              style={{
                background: active ? 'var(--primary-light)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text2)',
              }}>
              <Icon className="w-3.5 h-3.5" />{s.label}
              {count != null && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: active ? 'var(--card)' : 'var(--bg2)', color: active ? 'var(--primary)' : 'var(--text3)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {section === 'overview' && <OverviewSection shipment={shipment} />}
      {section === 'route'    && <RouteSection shipment={shipment} />}
      {section === 'cost'     && <CostSection shipment={shipment} />}
      {section === 'timeline' && <TimelineSection shipment={shipment} />}
    </div>
  )
}

// ─── Overview Section ───────────────────────────────────────────────────
function OverviewSection({ shipment }) {
  return (
    <div className="rounded-xl border p-4" style={C}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Overview</h3>
      <div className="grid grid-cols-4 gap-3 text-xs">
        <KV k="PO Number"        v={shipment.poNumber} />
        <KV k="Supplier"         v={shipment.supplier} />
        <KV k="Incoterm"         v={shipment.incoterm} />
        <KV k="Project"          v={shipment.project} />
        <KV k="Assigned Owner"   v={shipment.owner} />
        <KV k="Modes"            v={(shipment.modes ?? (shipment.mode ? [shipment.mode] : [])).map(m => SHIPMENT_MODES.find(x => x.id === m)?.label ?? m).join(', ')} />
        <KV k="Created"          v={fmtDate(shipment.createdAt)} />
        <KV k="Currency"         v={shipment.currency} />
      </div>
    </div>
  )
}

// ─── Route Section with horizontal timeline ─────────────────────────────
function RouteSection({ shipment }) {
  const origins      = shipment.origins ?? []
  const destinations = shipment.destinations ?? []
  // Build nodes: origins first then destinations
  const nodes = [
    ...origins.map((o, i) => ({ ...o, kind: 'origin', label: `Origin ${i + 1}`, place: `${o.city ?? '—'}, ${o.country ?? '—'}` })),
    ...destinations.map((d, i) => ({ ...d, kind: 'destination', label: `Destination ${i + 1}`, place: `${d.city ?? '—'}, ${d.country ?? '—'}` })),
  ]
  return (
    <div className="space-y-3">
      {/* Horizontal route timeline */}
      <div className="rounded-xl border p-4 overflow-x-auto" style={C}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text)' }}>Route Timeline</h3>
        {nodes.length === 0 ? (
          <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No route configured</div>
        ) : (
          <div className="flex items-start gap-2 min-w-min relative pt-3">
            {nodes.map((n, idx) => {
              const isOrigin = n.kind === 'origin'
              const isLast = idx === nodes.length - 1
              return (
                <div key={`${n.kind}-${idx}`} className="flex items-start flex-shrink-0">
                  <div className="flex flex-col items-center" style={{ minWidth: 140 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isOrigin ? 'rgba(5,150,105,.12)' : 'rgba(220,38,38,.12)', border: `2px solid ${isOrigin ? '#059669' : '#DC2626'}` }}>
                      <MapPin className="w-4 h-4" style={{ color: isOrigin ? '#059669' : '#DC2626' }} />
                    </div>
                    <div className="text-center mt-2 max-w-[140px]">
                      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isOrigin ? '#059669' : '#DC2626' }}>{n.label}</div>
                      <div className="text-[12px] font-bold mt-0.5" style={{ color:'var(--text)' }}>{n.place}</div>
                      {n.country?.toUpperCase() === 'SA' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>🇸🇦 KSA</span>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex items-center pt-4 px-1" style={{ minWidth: 60 }}>
                      <div className="h-0.5 flex-1" style={{ background:'var(--border)' }} />
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--text3)' }} />
                      <div className="h-0.5 flex-1" style={{ background:'var(--border)' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Origin + Destination cards */}
      <div className="rounded-xl border p-4" style={C}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Locations</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:'#059669' }}>Origins ({origins.length})</div>
            <div className="space-y-1.5">
              {origins.map((o, idx) => (
                <div key={idx} className="rounded-lg border p-2.5 text-xs" style={{ background:'rgba(5,150,105,.04)', borderColor:'rgba(5,150,105,.2)' }}>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" style={{ color:'#059669' }} />
                    <span className="font-bold" style={{ color:'var(--text)' }}>{o.city ?? '—'}, {o.country ?? '—'}</span>
                  </div>
                  <div className="text-[11px] mt-0.5 pl-4" style={{ color:'var(--text3)' }}>{o.address ?? 'No address'}</div>
                  {o.readyDate && <div className="text-[11px] pl-4" style={{ color:'var(--text3)' }}>Ready: <span className="font-mono">{fmtDate(o.readyDate)}</span></div>}
                </div>
              ))}
              {origins.length === 0 && <div className="text-[11px] text-center py-3" style={{ color:'var(--text3)' }}>No origins</div>}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:'#DC2626' }}>Destinations ({destinations.length})</div>
            <div className="space-y-1.5">
              {destinations.map((d, idx) => (
                <div key={idx} className="rounded-lg border p-2.5 text-xs" style={{ background:'rgba(220,38,38,.04)', borderColor:'rgba(220,38,38,.2)' }}>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" style={{ color:'#DC2626' }} />
                    <span className="font-bold" style={{ color:'var(--text)' }}>{d.city ?? '—'}, {d.country ?? '—'}</span>
                    {d.country?.toUpperCase() === 'SA' && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>KSA</span>}
                  </div>
                  <div className="text-[11px] mt-0.5 pl-4" style={{ color:'var(--text3)' }}>{d.address ?? 'No address'}</div>
                </div>
              ))}
              {destinations.length === 0 && <div className="text-[11px] text-center py-3" style={{ color:'var(--text3)' }}>No destinations</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Cost Section ──────────────────────────────────────────────────────
function CostSection({ shipment }) {
  const cur = shipment.currency ?? 'SAR'
  const base = Number(shipment.estValue ?? 0)
  const ins  = shipment.insuranceRequired ? Number(shipment.insuranceValue ?? 0) : 0
  const tr   = shipment.transitRequired ? Number(shipment.transitAmount ?? 0) : 0
  const cl   = shipment.cargoLoadingRequired ? Number(shipment.cargoLoadingAmount ?? 0) : 0
  const total = base + ins + tr + cl
  return (
    <div className="rounded-xl border p-4" style={C}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Cost Breakdown</h3>
      <div className="space-y-2 text-sm">
        <CostRow label="Estimated Value"  value={`${cur} ${fmt(base)}`} />
        <CostRow label="Insurance"        value={shipment.insuranceRequired ? `${cur} ${fmt(ins)}` : '—'} muted={!shipment.insuranceRequired} />
        <CostRow label="Transit"          value={shipment.transitRequired ? `${cur} ${fmt(tr)}` : '—'} muted={!shipment.transitRequired} />
        <CostRow label="Cargo Loading"    value={shipment.cargoLoadingRequired ? `${cur} ${fmt(cl)}` : '—'} muted={!shipment.cargoLoadingRequired} />
        <div className="pt-2 mt-2" style={{ borderTop:'2px solid var(--border)' }}>
          <CostRow label="Total Estimated" value={`${cur} ${fmt(total)}`} bold />
        </div>
        <div className="text-xs pt-2" style={{ color:'var(--text3)' }}>Payment Terms: <strong style={{ color:'var(--text2)' }}>{shipment.paymentTerms ?? 'Net 30'}</strong> · Freight: <strong style={{ color:'var(--text2)' }}>{shipment.freightTerms ?? '—'}</strong></div>
      </div>
    </div>
  )
}

// ─── Timeline Section ──────────────────────────────────────────────────
function TimelineSection({ shipment }) {
  const transitDays = daysBetween(shipment.createdAt, shipment.actualArrivalDate)
  const expectedDays = Number(shipment.expectedTransitDays ?? 0)
  const transitDelta = transitDays != null ? transitDays - expectedDays : null
  return (
    <div className="rounded-xl border p-4" style={C}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Timeline & Transit</h3>
      <div className="grid grid-cols-4 gap-3">
        <TimelineCard label="Estimated Arrival"  value={fmtDate(shipment.estArrivalDate)}     icon={Calendar} color="#2563EB" />
        <TimelineCard label="Actual Arrival"     value={fmtDate(shipment.actualArrivalDate)}  icon={CheckCircle2} color={shipment.actualArrivalDate ? '#059669' : '#64748B'} sub={shipment.actualArrivalDate ? 'Auto from checklist' : 'Pending'} />
        <TimelineCard label="Expected Transit"   value={`${expectedDays || '—'} days`}        icon={Clock} color="#06B6D4" />
        <TimelineCard label="Actual Transit"     value={transitDays != null ? `${transitDays} days` : '—'}
          sub={transitDelta != null ? (transitDelta > 0 ? `${transitDelta}d delayed` : transitDelta < 0 ? `${Math.abs(transitDelta)}d early` : 'On time') : ''}
          icon={Activity} color={transitDelta == null ? '#64748B' : transitDelta > 0 ? '#DC2626' : '#059669'} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ITEMS TAB
// ═══════════════════════════════════════════════════════════════════════════
function ItemsTab({ shipment }) {
  const items = (shipment.items ?? []).filter(i => i.active !== false)
  const cargo = shipment.cargo ?? []

  return (
    <div className="space-y-4">
      <div className="rounded-xl border" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Items ({items.length})</h3>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>From inventory + custom items</span>
        </div>
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color:'var(--text3)' }}>No items added</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={{ background:'var(--bg2)' }}>
                <tr>
                  {['#','Description','Material Code','HS Code','Qty','Unit','Weight','Declared Value','Origin'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id ?? idx} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{idx + 1}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text)' }}>{it.description ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]"><span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>{it.inventoryId && <Hash className="w-2.5 h-2.5" />}{it.materialCode ?? '—'}</span></td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{it.hsCode ?? '—'}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text)' }}>{it.quantity ?? '—'}</td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text3)' }}>{it.unit ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{it.weight ? `${it.weight} kg` : '—'}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--success)' }}>{it.declaredValue ? `SAR ${fmt(it.declaredValue)}` : '—'}</td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text2)' }}>{it.origin ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Cargo Units ({cargo.length})</h3>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Crates · pallets · containers</span>
        </div>
        {cargo.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color:'var(--text3)' }}>No cargo units defined</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={{ background:'var(--bg2)' }}>
                <tr>
                  {['#','Description','Qty','Weight','L','W','H','Volume'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargo.map((c, idx) => {
                  const vol = c.length && c.width && c.height ? (Number(c.length) * Number(c.width) * Number(c.height) / 1e6).toFixed(2) : null
                  return (
                    <tr key={idx} style={{ borderTop:'1px solid var(--border)' }}>
                      <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{idx + 1}</td>
                      <td className="px-3 py-2" style={{ color:'var(--text)' }}>{c.name ?? '—'}</td>
                      <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text)' }}>{c.quantity ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{c.weight ? `${c.weight} kg` : '—'}</td>
                      <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{c.length ? `${c.length}` : '—'}</td>
                      <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{c.width ? `${c.width}` : '—'}</td>
                      <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{c.height ? `${c.height}` : '—'}</td>
                      <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{vol ? `${vol} m³` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTES TAB — RFQ creation + quote receipt + selection (mirrors Local)
// ═══════════════════════════════════════════════════════════════════════════
function QuotesTab({ shipment, vendors, update, toast }) {
  const rfq = shipment.rfq ?? { sentTo: [], replies: [] }
  const [sendOpen, setSendOpen] = useState(false)
  const [viewRfqOpen, setViewRfqOpen] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState({ category:'all', city:'all' })
  const [selectedVendors, setSelectedVendors] = useState([])
  const [quoteEntryOpen, setQuoteEntryOpen] = useState(null) // vendorId

  const filteredVendors = useMemo(() => vendors.filter(v => {
    if (vendorFilter.category !== 'all' && v.category !== vendorFilter.category) return false
    if (vendorFilter.city !== 'all' && v.city !== vendorFilter.city) return false
    if (vendorSearch) {
      const q = vendorSearch.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.code?.toLowerCase().includes(q)
    }
    return true
  }), [vendors, vendorSearch, vendorFilter])

  const handleSubmitRFQ = () => {
    if (selectedVendors.length === 0) { toast.warning('Pick at least one vendor', 'Select vendors to send the RFQ to.'); return }
    setConfirmSend(true)
  }
  const handleConfirmSend = () => {
    const newRfq = {
      sentAt: new Date().toISOString(),
      sentTo: selectedVendors.map(vid => {
        const v = vendors.find(x => x.id === vid)
        return { vendorId: vid, vendorName: v?.name ?? vid, sentAt: new Date().toISOString(), replied: false }
      }),
      replies: rfq.replies ?? [],
    }
    update({ rfq: newRfq, status: 'rfq_sent' })
    toast.success('RFQ sent', `${selectedVendors.length} vendor(s) notified`)
    setSendOpen(false); setConfirmSend(false); setSelectedVendors([])
  }

  const handleQuoteReceived = (vendorId, quoteData) => {
    const replies = [...(rfq.replies ?? []), {
      vendorId, vendorName: vendors.find(v => v.id === vendorId)?.name,
      receivedAt: new Date().toISOString(),
      amount: Number(quoteData.amount),
      currency: quoteData.currency,
      validityDays: Number(quoteData.validityDays),
      notes: quoteData.notes,
      attachment: quoteData.attachment,
    }]
    const sentTo = rfq.sentTo.map(s => s.vendorId === vendorId ? { ...s, replied: true, repliedAt: new Date().toISOString() } : s)
    update({ rfq: { ...rfq, sentTo, replies } })
    toast.success('Quote recorded', `From ${vendors.find(v => v.id === vendorId)?.name}`)
    setQuoteEntryOpen(null)
  }

  const handleSelectQuote = (vendorId) => {
    const winner = rfq.replies.find(r => r.vendorId === vendorId)
    update({ rfq: { ...rfq, selectedVendorId: vendorId, selectedAt: new Date().toISOString() }, status: 'quote_approved', assignedVendorId: vendorId, assignedVendorName: winner?.vendorName, quoteApprovedAt: new Date().toISOString() })
    toast.success('Quote selected', `${winner?.vendorName} awarded the shipment`)
  }

  const lowestAmount  = Math.min(...(rfq.replies?.map(r => r.amount) ?? [Infinity]))
  const highestAmount = Math.max(...(rfq.replies?.map(r => r.amount) ?? [0]))

  return (
    <div className="space-y-4">
      {/* RFQ Status Strip */}
      <div className="rounded-xl border p-3 grid grid-cols-4 gap-3" style={C}>
        <KPI label="RFQs Sent"     value={rfq.sentTo?.length ?? 0}  color="#2563EB" />
        <KPI label="Replies"       value={rfq.replies?.length ?? 0} color="#06B6D4" />
        <KPI label="Lowest Quote"  value={rfq.replies?.length ? `${shipment.currency} ${fmt(lowestAmount)}` : '—'} color="#059669" small />
        <KPI label="Selected"      value={rfq.selectedVendorId ? vendors.find(v => v.id === rfq.selectedVendorId)?.name ?? '—' : '—'} color="#8B5CF6" small />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {(() => {
          const sent = (rfq.sentTo?.length ?? 0) > 0
          return (
            <button onClick={() => setSendOpen(true)}
              className="px-3 py-2 text-xs font-bold rounded-lg text-white flex items-center gap-1.5"
              style={{ background: sent ? 'var(--success)' : 'var(--primary)' }}
              title={sent ? 'RFQ already sent · click to resend or add vendors' : ''}>
              <Send className="w-3.5 h-3.5" />
              {sent ? `✓ RFQ Sent · Resend` : `Send RFQ`}
            </button>
          )
        })()}
        {(rfq.sentTo?.length ?? 0) > 0 && (
          <button onClick={() => setViewRfqOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
            <Eye className="w-3.5 h-3.5" /> View RFQ
          </button>
        )}
      </div>

      {/* Sent To / Replies — col-6 / col-6 layout per spec */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border" style={C}>
          <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Sent To</h4>
            <span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{rfq.sentTo?.length ?? 0}</span>
          </div>
          {(!rfq.sentTo || rfq.sentTo.length === 0) ? (
            <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No RFQs sent yet</div>
          ) : (
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {rfq.sentTo.map(s => (
                <div key={s.vendorId} className="px-3 py-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold" style={{ color:'var(--text)' }}>{s.vendorName}</div>
                    <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>Sent {fmtDateTime(s.sentAt)}</div>
                  </div>
                  {s.replied
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>Replied</span>
                    : <button onClick={() => setQuoteEntryOpen(s.vendorId)} className="px-2 py-1 text-[12.5px] font-bold rounded border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>Record Reply</button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border" style={C}>
          <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Reply From</h4>
            <span className="text-[12.5px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:'rgba(6,182,212,.12)', color:'#06B6D4' }}>{rfq.replies?.length ?? 0}</span>
          </div>
          {(!rfq.replies || rfq.replies.length === 0) ? (
            <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No replies received yet</div>
          ) : (
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {rfq.replies.map(r => {
                const isWinner   = rfq.selectedVendorId === r.vendorId
                const isLowest   = r.amount === lowestAmount && rfq.replies.length > 1
                return (
                  <div key={r.vendorId} className="px-3 py-2 grid grid-cols-12 gap-2 items-center text-xs" style={{ background: isWinner ? 'rgba(5,150,105,.08)' : '' }}>
                    <div className="col-span-5">
                      <div className="flex items-center gap-1.5 font-bold" style={{ color:'var(--text)' }}>
                        {isWinner && <Award className="w-3 h-3" style={{ color:'#FCD34D' }} />}
                        {r.vendorName}
                        {isLowest && !isWinner && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>Lowest</span>}
                      </div>
                      <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDateTime(r.receivedAt)}</div>
                    </div>
                    <div className="col-span-3 font-mono font-bold text-right" style={{ color:'var(--primary)' }}>{r.currency} {fmt(r.amount)}</div>
                    <div className="col-span-2 text-[12.5px] text-right" style={{ color:'var(--text3)' }}>{r.validityDays}d valid</div>
                    <div className="col-span-2 flex justify-end">
                      {rfq.selectedVendorId
                        ? (isWinner ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>✓ Selected</span> : null)
                        : <button onClick={() => handleSelectQuote(r.vendorId)} className="px-2 py-1 text-[12.5px] font-bold rounded text-white" style={{ background:'var(--primary)' }}>Select</button>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* View RFQ Modal — printable / PDF-ready */}
      <EnterpriseModal open={viewRfqOpen} onClose={() => setViewRfqOpen(false)}
        title="Request for Quotation" subtitle={`RFQ for shipment ${shipment.id}`}
        icon={<FileText className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="xl"
        footer={<><ModalBtn variant="secondary" onClick={() => setViewRfqOpen(false)}>Close</ModalBtn>
          <ModalBtn onClick={() => {
            const w = window.open('', '_blank', 'width=900,height=700')
            if (!w) return
            const html = document.getElementById('rfq-printable')?.innerHTML ?? ''
            w.document.write(`<!DOCTYPE html><html><head><title>RFQ ${shipment.id}</title>
              <style>
                body { font-family: -apple-system, sans-serif; padding: 24px; color: #1F2937; }
                h1 { font-size: 22px; margin: 0 0 4px; }
                h2 { font-size: 14px; margin: 16px 0 6px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0 16px; }
                th, td { padding: 6px 10px; border: 1px solid #E5E7EB; text-align: left; }
                th { background: #F9FAFB; font-weight: 700; }
                .meta { color: #6B7280; font-size: 11px; margin: 4px 0 12px; }
                .kv { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin: 8px 0; }
                .kv > div { padding: 4px 0; border-bottom: 1px dotted #E5E7EB; }
                .label { font-weight: 700; color: #6B7280; font-size: 10px; text-transform: uppercase; }
                .value { font-family: ui-monospace, monospace; }
                .signature { margin-top: 48px; }
                .sig-line { display: inline-block; border-bottom: 1px solid #1F2937; width: 240px; margin-top: 32px; }
              </style></head><body>${html}<script>setTimeout(() => window.print(), 200)</script></body></html>`)
            w.document.close()
          }}><FileText className="w-3 h-3 mr-1" /> Print / PDF</ModalBtn></>}>
        <div id="rfq-printable">
          <div style={{ textAlign:'center', marginBottom: 16 }}>
            <h1 style={{ fontSize:'18px', fontWeight: 800, margin: 0, color:'var(--text)' }}>HELMS · Request for Quotation</h1>
            <div className="text-[11px] mt-1" style={{ color:'var(--text3)' }}>Heavy Equipment Logistics Management System</div>
          </div>

          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 12 }}>RFQ Identification</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mt-2 mb-3">
            <KV k="RFQ Number"      v={`RFQ-${shipment.id}`} />
            <KV k="Shipment ID"     v={shipment.id} />
            <KV k="Issue Date"      v={fmtDate(rfq.sentAt ?? new Date().toISOString())} />
            <KV k="Reply Deadline"  v={fmtDate(rfq.replyDeadline ?? new Date(Date.now() + 7 * 86400000).toISOString())} />
            <KV k="Project"         v={shipment.project} />
            <KV k="PO Number"       v={shipment.poNumber} />
          </div>

          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 12 }}>Shipment Details</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mt-2 mb-3">
            <KV k="Modes"           v={(shipment.modes ?? (shipment.mode ? [shipment.mode] : [])).map(m => SHIPMENT_MODES.find(x => x.id === m)?.label ?? m).join(' + ') || '—'} />
            <KV k="Incoterm"        v={shipment.incoterm} />
            <KV k="Estimated Value" v={shipment.estValue ? `${shipment.currency} ${fmt(shipment.estValue)}` : '—'} />
            <KV k="Insurance"       v={shipment.insuranceRequired ? `Required · ${shipment.currency} ${fmt(shipment.insuranceValue)}` : 'Not required'} />
            <KV k="Transit Required" v={shipment.transitRequired ? `Yes · ${shipment.currency} ${fmt(shipment.transitAmount)}` : 'No'} />
            <KV k="Cargo Loading"   v={shipment.cargoLoadingRequired ? `Yes · ${shipment.currency} ${fmt(shipment.cargoLoadingAmount)}` : 'No'} />
            <KV k="Payment Terms"   v={shipment.paymentTerms} />
            <KV k="Currency"        v={shipment.currency} />
            <KV k="Estimated Arrival" v={fmtDate(shipment.estArrivalDate)} />
            <KV k="Expected Transit Days" v={shipment.expectedTransitDays ? `${shipment.expectedTransitDays} days` : '—'} />
          </div>

          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 12 }}>Route</h2>
          <table className="w-full text-xs mt-2 mb-3">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>{['Leg','Country','City','Address'].map(h => <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)', border:'1px solid var(--border)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(shipment.origins ?? []).map((o, i) => (
                <tr key={`o${i}`}>
                  <td className="px-2 py-1.5 font-bold" style={{ border:'1px solid var(--border)', color:'#059669' }}>Origin {i + 1}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{o.country ?? '—'}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{o.city ?? '—'}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{o.address ?? '—'}</td>
                </tr>
              ))}
              {(shipment.destinations ?? []).map((d, i) => (
                <tr key={`d${i}`}>
                  <td className="px-2 py-1.5 font-bold" style={{ border:'1px solid var(--border)', color:'#DC2626' }}>Destination {i + 1}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{d.country ?? '—'}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{d.city ?? '—'}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{d.address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 12 }}>Cargo Summary</h2>
          {(shipment.items ?? []).filter(i => i.active !== false).length === 0 && (shipment.cargo ?? []).length === 0 ? (
            <p className="text-xs mt-2" style={{ color:'var(--text3)' }}>No items or cargo defined.</p>
          ) : (
            <table className="w-full text-xs mt-2 mb-3">
              <thead style={{ background:'var(--bg2)' }}>
                <tr>{['Type','Description','Material/SAP','Qty','Weight','Dimensions'].map(h => <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)', border:'1px solid var(--border)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(shipment.items ?? []).filter(i => i.active !== false).map((it, idx) => (
                  <tr key={`it${idx}`}>
                    <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)', color:'#2563EB' }}>Item</td>
                    <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{it.description ?? it.name ?? '—'}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{it.materialCode ?? '—'}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{it.quantity ?? '—'} {it.unit}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{it.weight ? `${it.weight} kg` : '—'}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>—</td>
                  </tr>
                ))}
                {(shipment.cargo ?? []).map((c, idx) => (
                  <tr key={`c${idx}`}>
                    <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)', color:'#06B6D4' }}>Cargo Unit</td>
                    <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>{c.name ?? `Unit ${idx + 1}`}</td>
                    <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)' }}>—</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{c.quantity ?? 1}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{c.weight ? `${c.weight} kg` : '—'}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{c.length && c.width && c.height ? `${c.length}×${c.width}×${c.height} cm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 12 }}>Vendors Approached</h2>
          <table className="w-full text-xs mt-2 mb-3">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>{['#','Vendor','Sent At','Status'].map(h => <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)', border:'1px solid var(--border)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(rfq.sentTo ?? []).map((s, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5 font-mono" style={{ border:'1px solid var(--border)' }}>{i + 1}</td>
                  <td className="px-2 py-1.5 font-bold" style={{ border:'1px solid var(--border)' }}>{s.vendorName}</td>
                  <td className="px-2 py-1.5 font-mono text-[11px]" style={{ border:'1px solid var(--border)' }}>{fmtDateTime(s.sentAt)}</td>
                  <td className="px-2 py-1.5" style={{ border:'1px solid var(--border)', color: s.replied ? '#059669' : '#D97706', fontWeight: 700 }}>{s.replied ? '✓ Replied' : 'Awaiting reply'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 6, marginTop: 12 }}>Quote Submission Instructions</h2>
          <ol className="text-xs mt-2 mb-3" style={{ color:'var(--text2)', paddingLeft: 20 }}>
            <li className="mb-1">Submit your quote in <strong>{shipment.currency}</strong> via the vendor portal or by email to logistics@helms.sa.</li>
            <li className="mb-1">Reference RFQ Number <strong className="font-mono">RFQ-{shipment.id}</strong> in your subject line.</li>
            <li className="mb-1">Include validity period (minimum 30 days), payment terms, and any conditions.</li>
            <li className="mb-1">All vendor quotes are evaluated on price, transit time, and historical performance.</li>
            <li className="mb-1">Award notification will be sent within 5 business days of the deadline.</li>
          </ol>

          <div className="mt-8 pt-4" style={{ borderTop:'1px solid var(--border)' }}>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color:'var(--text3)' }}>Issued By</div>
                <div className="h-px w-48" style={{ background:'var(--text)' }}></div>
                <div className="text-[11px] mt-1" style={{ color:'var(--text3)' }}>{shipment.owner ?? 'Operations Manager'} · HELMS Logistics</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color:'var(--text3)' }}>Vendor Acceptance</div>
                <div className="h-px w-48" style={{ background:'var(--text)' }}></div>
                <div className="text-[11px] mt-1" style={{ color:'var(--text3)' }}>Authorized Signature · Date</div>
              </div>
            </div>
          </div>
        </div>
      </EnterpriseModal>

      {/* Send RFQ Modal — with vendor filter */}
      <EnterpriseModal open={sendOpen} onClose={() => setSendOpen(false)}
        title="Send RFQ to Vendors" subtitle="Pick vendors to request quotes from"
        icon={<Send className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="xl"
        footer={<><ModalBtn variant="secondary" onClick={() => setSendOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleSubmitRFQ}>Continue ({selectedVendors.length})</ModalBtn></>}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
              <input value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} placeholder="Search vendor name or code…"
                className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
            </div>
            <div className="w-44">
              <Select2 size="sm" value={vendorFilter.category} onChange={v => setVendorFilter({ ...vendorFilter, category: v ?? 'all' })}
                options={[
                  { id:'all', label:'All Categories' },
                  ...[...new Set(vendors.map(v => v.category))].filter(Boolean).map(c => ({ id: c, label: c })),
                ]} />
            </div>
            <div className="w-36">
              <Select2 size="sm" value={vendorFilter.city} onChange={v => setVendorFilter({ ...vendorFilter, city: v ?? 'all' })}
                options={[
                  { id:'all', label:'All Cities' },
                  ...[...new Set(vendors.map(v => v.city))].filter(Boolean).map(c => ({ id: c, label: c })),
                ]} />
            </div>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', maxHeight: 320, overflowY:'auto' }}>
            <table className="w-full text-xs">
              <thead style={{ background:'var(--bg2)', position:'sticky', top:0 }}>
                <tr>
                  {['','Vendor','Category','City','Performance'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(v => {
                  const checked = selectedVendors.includes(v.id)
                  return (
                    <tr key={v.id} onClick={() => setSelectedVendors(checked ? selectedVendors.filter(x => x !== v.id) : [...selectedVendors, v.id])}
                      className="cursor-pointer" style={{ borderTop:'1px solid var(--border)', background: checked ? 'var(--primary-light)' : '' }}>
                      <td className="px-3 py-2">
                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: checked ? 'var(--primary)' : 'var(--border)', background: checked ? 'var(--primary)' : 'var(--card)' }}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </td>
                      <td className="px-3 py-2" style={{ color:'var(--text)' }}>
                        <div className="font-bold">{v.name}</div>
                        <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{v.code}</div>
                      </td>
                      <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text2)' }}>{v.category ?? '—'}</td>
                      <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text2)' }}>{v.city ?? '—'}</td>
                      <td className="px-3 py-2"><span className="text-[12.5px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>★ {v.rating ?? '—'}</span></td>
                    </tr>
                  )
                })}
                {filteredVendors.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center" style={{ color:'var(--text3)' }}>No vendors match the filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </EnterpriseModal>

      {/* Confirm Send */}
      <EnterpriseModal open={confirmSend} onClose={() => setConfirmSend(false)}
        title="Confirm RFQ Send" subtitle="Review the recipients before dispatching"
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmSend(false)}>Go Back</ModalBtn><ModalBtn onClick={handleConfirmSend}>Confirm &amp; Send</ModalBtn></>}>
        <div className="rounded-lg border p-3" style={{ background:'rgba(37,99,235,.08)', borderColor:'var(--primary)' }}>
          <div className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--primary)' }}>Sending RFQ to {selectedVendors.length} vendor(s):</div>
          <div className="flex flex-wrap gap-1.5">
            {selectedVendors.map(vid => (
              <span key={vid} className="text-[12.5px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:'var(--card)', color:'var(--text)' }}>
                {vendors.find(v => v.id === vid)?.name}
              </span>
            ))}
          </div>
        </div>
      </EnterpriseModal>

      {/* Record Quote modal */}
      <RecordQuoteModal open={quoteEntryOpen} vendors={vendors} shipmentCurrency={shipment.currency} onClose={() => setQuoteEntryOpen(null)} onSave={handleQuoteReceived} />
    </div>
  )
}

function RecordQuoteModal({ open, vendors, shipmentCurrency, onClose, onSave }) {
  const [draft, setDraft] = useState({ amount:'', currency: shipmentCurrency ?? 'SAR', validityDays:'30', notes:'', attachment:'' })
  if (!open) return null
  const vendor = vendors.find(v => v.id === open)
  return (
    <EnterpriseModal open onClose={onClose}
      title="Record Quote Reply" subtitle={vendor?.name ?? ''}
      icon={<ClipboardList className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="md"
      footer={<><ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn><ModalBtn onClick={() => onSave(open, draft)}>Save Quote</ModalBtn></>}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Quote Amount</label>
          <input type="number" value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div>
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Currency</label>
          <Select2 size="sm" value={draft.currency} onChange={v => setDraft({ ...draft, currency: v })}
            options={[{id:'SAR',label:'SAR'},{id:'USD',label:'USD'},{id:'EUR',label:'EUR'},{id:'AED',label:'AED'}]} />
        </div>
        <div>
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Validity (days)</label>
          <input type="number" value={draft.validityDays} onChange={e => setDraft({ ...draft, validityDays: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div>
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Attachment</label>
          <label className="block rounded-lg border-2 border-dashed px-3 py-2 cursor-pointer text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
            <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, attachment: f.name }) }} />
            <span className="text-[12.5px] font-bold" style={{ color: draft.attachment ? 'var(--success)' : 'var(--text2)' }}>{draft.attachment || 'Upload PDF'}</span>
          </label>
        </div>
        <div className="col-span-2">
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Notes</label>
          <textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={2} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>
    </EnterpriseModal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST TAB — phases with timeline, day gaps, transit reasons, sub-tasks
// ═══════════════════════════════════════════════════════════════════════════
function ChecklistTab({ shipment, update, toast }) {
  const phases = shipment.intlChecklist ?? {}
  const [expanded, setExpanded] = useState(new Set())
  const [completeModal, setCompleteModal] = useState(null)   // step id
  const [transitModal,  setTransitModal]  = useState(null)   // step id
  const [draft, setDraft] = useState({ notes:'', transitReason:'', transitNotes:'' })

  // Are required docs uploaded for a given step?
  const hasAllRequiredDocs = (stepId) => {
    const step = INTL_CHECKLIST_STEPS.find(s => s.id === stepId)
    if (!step) return true
    const phase = phases[stepId] ?? {}
    const uploaded = phase.docs ?? {}
    return (step.requiredDocs ?? []).filter(d => d.required).every(d => !!uploaded[d.id])
  }

  // Add or remove a doc upload for a phase
  const setDoc = (stepId, docId, filename) => {
    const phase = phases[stepId] ?? {}
    const newDocs = { ...(phase.docs ?? {}) }
    if (filename) newDocs[docId] = { filename, uploadedAt: new Date().toISOString() }
    else delete newDocs[docId]
    update({ intlChecklist: { ...phases, [stepId]: { ...phase, docs: newDocs } } })
    if (filename) toast.success('Document attached', filename)
  }

  const toggle = (id) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  const handleComplete = () => {
    if (!completeModal) return
    if (!hasAllRequiredDocs(completeModal)) {
      toast.warning('Documents missing', 'Upload all required documents before completing this step.')
      return
    }
    const newPhases = { ...phases, [completeModal]: { ...(phases[completeModal] ?? {}), completed: true, completedAt: new Date().toISOString(), notes: draft.notes } }
    const patch = { intlChecklist: newPhases }
    if (completeModal === 'delivered') patch.actualArrivalDate = new Date().toISOString()
    update(patch)
    toast.success('Step completed', INTL_CHECKLIST_STEPS.find(s => s.id === completeModal)?.label)
    setCompleteModal(null); setDraft({ notes:'', transitReason:'', transitNotes:'' })
  }

  const handleTransit = () => {
    if (!transitModal) return
    if (!draft.transitReason) { toast.warning('Reason required', 'Pick a transit reason.'); return }
    const newPhases = {
      ...phases,
      [transitModal]: {
        ...(phases[transitModal] ?? {}),
        transit: [...((phases[transitModal]?.transit) ?? []), {
          id: `T-${Date.now()}`,
          reason: draft.transitReason,
          notes: draft.transitNotes,
          recordedAt: new Date().toISOString(),
        }],
      },
    }
    update({ intlChecklist: newPhases })
    toast.success('Transit logged', `${TRANSIT_REASONS.find(r => r.id === draft.transitReason)?.label}`)
    setTransitModal(null); setDraft({ notes:'', transitReason:'', transitNotes:'' })
  }

  // Build timeline events with day gaps
  const timeline = useMemo(() => {
    const events = []
    INTL_CHECKLIST_STEPS.forEach(step => {
      const phase = phases[step.id]
      if (phase?.completedAt) {
        events.push({ stepId: step.id, label: step.label, icon: step.icon, type: 'complete', date: phase.completedAt, notes: phase.notes })
      }
      (phase?.transit ?? []).forEach(t => {
        events.push({ stepId: step.id, label: step.label, icon: step.icon, type: 'transit', date: t.recordedAt, reason: t.reason, notes: t.notes })
      })
    })
    events.sort((a, b) => new Date(a.date) - new Date(b.date))
    return events.map((e, i) => ({
      ...e,
      dayGap: i > 0 ? daysBetween(events[i - 1].date, e.date) : null,
    }))
  }, [phases])

  return (
    <div className="space-y-4">
      {/* Phase grid */}
      <div className="rounded-xl border" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Shipment Phases</h3>
          <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Click to expand · log transit reason or complete the step</span>
        </div>
        <div>
          {INTL_CHECKLIST_STEPS.map((step, idx) => {
            const phase = phases[step.id] ?? {}
            const open = expanded.has(step.id)
            const done = !!phase.completed
            const inTransit = !done && (phase.transit?.length ?? 0) > 0
            const requiredDocs = step.requiredDocs ?? []
            const uploadedCount = Object.keys(phase.docs ?? {}).length
            const requiredCount = requiredDocs.filter(d => d.required).length
            const docsReady = hasAllRequiredDocs(step.id)
            return (
              <div key={step.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                <button onClick={() => toggle(step.id)} className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors">
                  {open ? <ChevronDown className="w-3.5 h-3.5" style={{ color:'var(--text3)' }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color:'var(--text3)' }} />}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: done ? 'rgba(5,150,105,.12)' : inTransit ? 'rgba(217,119,6,.12)' : 'var(--bg2)' }}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold" style={{ color:'var(--text)' }}>{step.label}</span>
                      {done && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>✓ Done</span>}
                      {inTransit && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.12)', color:'#D97706' }}>⚠ Transit · {phase.transit.length}</span>}
                      {requiredDocs.length > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5" style={{ background: docsReady ? 'rgba(5,150,105,.12)' : 'rgba(217,119,6,.12)', color: docsReady ? '#059669' : '#D97706' }}>
                          <FileText className="w-2.5 h-2.5" />
                          {uploadedCount}/{requiredDocs.length} docs
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{step.desc}</div>
                  </div>
                  {!done && (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setTransitModal(step.id)} className="px-2 py-1 text-[12.5px] font-bold rounded border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--warning)' }}>
                        Log Transit
                      </button>
                      <button onClick={() => setCompleteModal(step.id)}
                        disabled={!docsReady}
                        className="px-2 py-1 text-[12.5px] font-bold rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: docsReady ? 'var(--success)' : 'var(--text3)' }}
                        title={docsReady ? '' : `Upload ${requiredCount} required document(s) first`}>
                        Mark Done
                      </button>
                    </div>
                  )}
                </button>
                {open && (
                  <div className="px-4 pb-3 pl-16" style={{ background:'var(--bg2)' }}>
                    {/* Required Documents */}
                    {requiredDocs.length > 0 && (
                      <div className="rounded-lg border p-3 mb-2" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Required Documents</h5>
                          <span className="text-[9px]" style={{ color:'var(--text3)' }}>Required docs gate the Mark Done action</span>
                        </div>
                        <div className="space-y-1.5">
                          {requiredDocs.map(doc => {
                            const uploaded = phase.docs?.[doc.id]
                            return (
                              <div key={doc.id} className="rounded border p-2 flex items-center gap-2" style={{ background:'var(--bg2)', borderColor: uploaded ? 'rgba(5,150,105,.3)' : 'var(--border)' }}>
                                {uploaded
                                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'#059669' }} />
                                  : doc.required
                                    ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'#D97706' }} />
                                    : <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--text3)' }} />}
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold" style={{ color:'var(--text)' }}>
                                    {doc.label}
                                    {doc.required && <span className="text-[9px] ml-1.5 font-bold" style={{ color:'var(--danger)' }}>REQUIRED</span>}
                                  </div>
                                  {uploaded && (
                                    <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{uploaded.filename} · {fmtDateTime(uploaded.uploadedAt)}</div>
                                  )}
                                </div>
                                {uploaded
                                  ? (!done && <button onClick={() => setDoc(step.id, doc.id, null)} className="text-[12.5px] font-bold px-2 py-1 rounded" style={{ color:'var(--danger)' }}>Remove</button>)
                                  : (!done && (
                                      <label className="text-[12.5px] font-bold px-2 py-1 rounded border cursor-pointer flex items-center gap-1" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
                                        <Upload className="w-3 h-3" />
                                        Upload
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => {
                                          const f = e.target.files?.[0]
                                          if (f) setDoc(step.id, doc.id, f.name)
                                        }} />
                                      </label>
                                    ))}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {done && (
                      <div className="rounded-lg border p-2.5 text-xs mb-2" style={{ background:'rgba(5,150,105,.06)', borderColor:'rgba(5,150,105,.3)' }}>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" style={{ color:'#059669' }} />
                          <span className="font-bold" style={{ color:'#059669' }}>Completed {fmtDateTime(phase.completedAt)}</span>
                        </div>
                        {phase.notes && <div className="text-[12.5px] mt-1" style={{ color:'var(--text2)' }}>{phase.notes}</div>}
                      </div>
                    )}
                    {(phase.transit ?? []).length === 0 && !done && requiredDocs.length === 0 && (
                      <div className="text-[12.5px] py-2" style={{ color:'var(--text3)' }}>No transit logs or completion yet for this phase.</div>
                    )}
                    {(phase.transit ?? []).map(t => {
                      const reason = TRANSIT_REASONS.find(r => r.id === t.reason)
                      return (
                        <div key={t.id} className="rounded-lg border p-2.5 mb-1.5" style={{ background:`${reason?.color ?? '#64748B'}08`, borderColor: `${reason?.color ?? '#64748B'}30` }}>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3" style={{ color: reason?.color }} />
                              <span className="font-bold" style={{ color: reason?.color }}>{reason?.label ?? 'Other'}</span>
                            </div>
                            <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDateTime(t.recordedAt)}</span>
                          </div>
                          {t.notes && <div className="text-[12.5px] mt-1" style={{ color:'var(--text2)' }}>{t.notes}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline with day gaps */}
      <div className="rounded-xl border p-4" style={C}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>Activity Timeline</h3>
        {timeline.length === 0 ? (
          <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No events logged yet. Complete a phase or log a transit to see it here.</div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background:'var(--border)' }} />
            {timeline.map((e, idx) => {
              const reason = TRANSIT_REASONS.find(r => r.id === e.reason)
              const tooltip = e.type === 'complete' ? `Completed: ${e.notes || 'No notes'}` : `${reason?.label}: ${e.notes || 'No notes'}`
              return (
                <div key={idx} className="relative pl-12 pb-4">
                  <div className="absolute left-1 top-1 w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: e.type === 'complete' ? '#059669' : reason?.color ?? '#64748B', border: '2px solid var(--card)' }}>
                    {e.type === 'complete' ? <Check className="w-3 h-3 text-white" /> : '!'}
                  </div>
                  <div className="rounded-lg border p-2.5 cursor-help" style={{ background:'var(--bg2)', borderColor:'var(--border)' }} title={tooltip}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold" style={{ color:'var(--text)' }}>
                          {e.icon} {e.label}
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

      {/* Complete modal */}
      <EnterpriseModal open={!!completeModal} onClose={() => setCompleteModal(null)}
        title="Mark Phase Complete" subtitle={INTL_CHECKLIST_STEPS.find(s => s.id === completeModal)?.label}
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setCompleteModal(null)}>Cancel</ModalBtn><ModalBtn onClick={handleComplete}>Confirm Complete</ModalBtn></>}>
        <div className="space-y-2">
          <p className="text-xs" style={{ color:'var(--text2)' }}>Add notes about this completion (optional):</p>
          <textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={3} placeholder="e.g. All documents verified by customs broker; goods released"
            className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          {completeModal === 'delivered' && (
            <div className="rounded-lg border p-2.5 text-[11px]" style={{ background:'rgba(5,150,105,.08)', borderColor:'var(--success)', color:'var(--success)' }}>
              ✓ This will set <strong>Actual Arrival Date</strong> on the shipment.
            </div>
          )}
        </div>
      </EnterpriseModal>

      {/* Transit modal */}
      <EnterpriseModal open={!!transitModal} onClose={() => setTransitModal(null)}
        title="Log Transit Reason" subtitle={INTL_CHECKLIST_STEPS.find(s => s.id === transitModal)?.label}
        icon={<AlertTriangle className="w-4 h-4" style={{ color:'var(--warning)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setTransitModal(null)}>Cancel</ModalBtn><ModalBtn onClick={handleTransit}>Log Transit</ModalBtn></>}>
        <div className="space-y-2">
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reason <span style={{ color:'var(--danger)' }}>*</span></label>
            <Select2 value={draft.transitReason} onChange={v => setDraft({ ...draft, transitReason: v })} placeholder="Why is this phase in transit?…"
              options={TRANSIT_REASONS.map(r => ({ id: r.id, label: r.label }))} />
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Notes</label>
            <textarea value={draft.transitNotes} onChange={e => setDraft({ ...draft, transitNotes: e.target.value })} rows={3} placeholder="e.g. Awaiting payment release from Aramco finance; expected by 25 Jun"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNTS TAB
// ═══════════════════════════════════════════════════════════════════════════
function AccountsTab({ shipment, update, toast }) {
  const { customerInvoices, customerReceipts } = useFinanceStore()
  const relatedInvoices = customerInvoices.filter(i => i.shipmentRef === shipment.id)
  const totalBilled = relatedInvoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = relatedInvoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0)
  const outstanding = Math.max(0, totalBilled - totalPaid)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KPI label="Total Billed"  value={`SAR ${fmt(totalBilled)}`} color="#2563EB" mono />
        <KPI label="Total Paid"    value={`SAR ${fmt(totalPaid)}`}   color="#059669" mono />
        <KPI label="Outstanding"   value={`SAR ${fmt(outstanding)}`} color={outstanding > 0 ? '#D97706' : '#059669'} mono />
      </div>

      <div className="rounded-xl border" style={C}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Customer Invoices for this Shipment</h4>
        </div>
        {relatedInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color:'var(--text3)' }}>No customer invoices yet · raise one from the Accounts module &rarr; Customer Orders</div>
        ) : (
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Invoice','Date','Due','Amount','Paid','Outstanding','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatedInvoices.map(i => {
                const out = Math.max(0, i.amount - (i.paidAmount ?? 0))
                return (
                  <tr key={i.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{i.id}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(i.invoiceDate)}</td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text2)' }}>{fmtDate(i.dueDate)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--text)' }}>SAR {fmt(i.amount)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--success)' }}>SAR {fmt(i.paidAmount ?? 0)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: out > 0 ? 'var(--warning)' : 'var(--success)' }}>SAR {fmt(out)}</td>
                    <td className="px-3 py-2 text-[12.5px] uppercase font-bold tracking-widest" style={{ color:'var(--text2)' }}>{i.status?.replace('_', ' ')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border p-3" style={C}>
        <p className="text-[11px]" style={{ color:'var(--text3)' }}>
          To raise a new invoice or record a customer payment, go to <Link to="/accounts" className="font-bold" style={{ color:'var(--primary)' }}>Accounts → Customer Orders</Link>, find this shipment under its customer, click <strong>View Detail</strong>, then use Add Invoice / Add Receipt.
        </p>
      </div>
    </div>
  )
}

// ─── Shared bits ────────────────────────────────────────────────────────
function KV({ k, v }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{k}</div>
      <div className="text-xs font-mono font-bold truncate" style={{ color:'var(--text)' }}>{v ?? '—'}</div>
    </div>
  )
}

function KPI({ label, value, color, mono, small }) {
  return (
    <div className="rounded-lg border p-2.5" style={{ ...C, borderLeft:`3px solid ${color}` }}>
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</div>
      <div className={`${small ? 'text-xs' : 'text-base'} font-black ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</div>
    </div>
  )
}

function CostRow({ label, value, bold, muted }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: muted ? 'var(--text3)' : 'var(--text3)' }}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold text-sm' : ''}`} style={{ color: muted ? 'var(--text3)' : bold ? 'var(--primary)' : 'var(--text)' }}>{value}</span>
    </div>
  )
}

function TimelineCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-lg border p-3" style={{ ...C, borderLeft:`3px solid ${color}` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className="text-sm font-black font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[12.5px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </div>
  )
}
