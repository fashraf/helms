// International Shipment Profile — mirrors LocalShipmentProfile pattern
// Tabs: Detail · Items · Quotes (RFQ + selection) · Checklist (with Transit reasons + timeline) · Accounts
import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Plane, MapPin, FileText, Box, ClipboardList, CheckSquare, DollarSign, Activity,
  ArrowLeft, Edit3, Send, Check, X, Eye, Plus, Upload, Clock, AlertTriangle,
  Building2, Briefcase, Package, Calendar, Truck, ChevronRight, ChevronDown,
  CheckCircle2, Hash, Award, AlertCircle, Receipt, CreditCard, Filter, Search,
  Shield, FileCheck, Trash2, FileUp, Bell,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store from '../../store/vendorV2Store'
import useFinanceStore from '../../store/financeStore'
import useToastStore from '../../store/toastStore'
import useTCTemplateStore from '../../store/tcTemplateStore'
import useWaitingChargeStore from '../../store/waitingChargeStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import SharedChecklistTab from '../../components/shipment/SharedChecklist'
import SecretKeyBadge from '../../components/shipment/SecretKeyBadge'
import VendorEvaluation from '../../components/shipment/VendorEvaluation'
import PrintFrame from '../../components/print/PrintFrame'
import DeliveryNote from '../../components/print/DeliveryNote'
import ComparisonSheet from '../../components/print/ComparisonSheet'
import PaymentRequest from '../../components/print/PaymentRequest'
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
  { id:'inventory', label:'Inventory',       icon: Box           },
  { id:'quotes',    label:'Quotes',          icon: ClipboardList },
  { id:'saber',     label:'SABER & Customs', icon: Shield        },
  { id:'charges',   label:'Extra Charges',   icon: Clock         },
  { id:'checklist', label:'Checklist',       icon: CheckSquare   },
  { id:'accounts',  label:'Accounts',        icon: DollarSign    },
]

const DETAIL_SECTIONS = [
  { id:'overview',  label:'Overview',  icon: Eye        },
  { id:'route',     label:'Route',     icon: MapPin     },
  { id:'documents', label:'Documents', icon: FileText   },
  { id:'vendors',   label:'Vendors',   icon: Building2  },
  { id:'timeline',  label:'Timeline',  icon: Activity   },
  { id:'costs',     label:'Costs',     icon: DollarSign },
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
            {/* Breadcrumb */}
            <div className="text-[10px] mb-0.5" style={{ color:'var(--text3)' }}>
              <Link to="/shipments/intl" className="hover:underline" style={{ color:'var(--text3)' }}>Shipments</Link>
              <span className="mx-1">/</span>
              <Link to="/shipments/intl" className="hover:underline" style={{ color:'var(--text3)' }}>International</Link>
              <span className="mx-1">/</span>
              <span className="font-mono" style={{ color:'var(--text2)' }}>{shipment.id}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold font-mono" style={{ color:'var(--text)' }}>{shipment.id}</h2>
              <SecretKeyBadge secretKey={shipment.secretKey} />
              <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${cfg.color}15`, color: cfg.color }}>
                <span>{cfg.icon}</span>{cfg.label}
              </span>
              {(shipment.modes ?? (shipment.mode ? [shipment.mode] : [])).map(m => (
                <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                  {SHIPMENT_MODES.find(x => x.id === m)?.label ?? m}
                </span>
              ))}
              {/* SABER badge */}
              {(shipment.items ?? []).some(i => i.saberRequired) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'rgba(139,92,246,.1)', color:'#8B5CF6', border:'1px solid rgba(139,92,246,.3)' }}>
                  <Shield className="w-2.5 h-2.5" />SABER Enforced
                </span>
              )}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color:'var(--text3)' }}>
              {shipment.project ?? '—'} · PO {shipment.poNumber ?? '—'} · Incoterm {shipment.incoterm ?? '—'} · Owner {shipment.owner ?? '—'}
            </div>
          </div>
          <button onClick={() => navigate(`/shipments/intl/edit/${shipment.id}`)} className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => navigate(`/waiting-charges/create?shipmentId=${shipment.id}${shipment.projectId ? `&projectId=${shipment.projectId}` : ''}`)}
            data-tour="intl-add-charges" data-tour-order="30"
            data-tour-title="Add Charges"
            data-tour-desc="Log waiting charges or port demurrage against this international shipment. For port-storage delays use the Demurrage category — it runs the per-diem calculator with a 2-day free window."
            className="px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5"
            style={{ background:'var(--card)', borderColor:'rgba(220,38,38,.3)', color:'#DC2626' }}
            title="Log a waiting charge for this shipment">
            ⏳ Add Charges
          </button>
        </div>

        {/* Pre-arrival reminder configuration panel */}
        <PreArrivalConfig shipment={shipment} update={update} toast={toast} />
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
            if (t.id === 'saber') {
              const saberItems = (shipment.items ?? []).filter(i => i.saberRequired).length
              const docs = shipment.saberDocs ?? {}
              const uploaded = ['awb','bol','saberCert'].filter(k => docs[k]).length
              const customsUploaded = !!shipment.customsDoc
              const allValid = saberItems > 0 ? (uploaded === 3 && customsUploaded) : true
              if (saberItems > 0) {
                badge = allValid ? `✓ ${uploaded + (customsUploaded ? 1 : 0)}/4` : `${uploaded + (customsUploaded ? 1 : 0)}/4`
                badgeColor = allValid ? '#059669' : '#D97706'
              }
            }
            if (t.id === 'accounts') {
              // We can't easily count without finance store here; skip badge
            }
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-all relative"
                style={{
                  background: active ? 'var(--card)' : (badgeColor === '#059669' ? '#E6F4EA' : 'var(--bg2)'),
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
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: badgeColor === '#059669' ? '#34A853' : 'var(--primary)' }} />}
                {!active && badgeColor === '#059669' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'#34A853' }} />}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'detail'    && <DetailTab shipment={shipment} section={detailSection} setSection={setDetailSection} />}
      {activeTab === 'inventory' && <ItemsTab shipment={shipment} update={update} toast={toast} />}
      {activeTab === 'quotes'    && <QuotesTab shipment={shipment} vendors={vendors} update={update} toast={toast} />}
      {activeTab === 'saber'     && <SaberClearanceTab shipment={shipment} update={update} toast={toast} />}
      {activeTab === 'charges'   && <ExtraChargesTab shipment={shipment} />}
      {activeTab === 'checklist' && <SharedChecklistTab shipment={shipment} update={update} toast={toast} />}
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

      {section === 'overview'  && <OverviewSection shipment={shipment} />}
      {section === 'route'     && <RouteSection shipment={shipment} />}
      {section === 'documents' && <DocumentsSection shipment={shipment} />}
      {section === 'vendors'   && <VendorsSection shipment={shipment} />}
      {section === 'timeline'  && <TimelineSection shipment={shipment} />}
      {section === 'costs'     && <CostSection shipment={shipment} />}
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

// ─── Documents Section ─────────────────────────────────────────────────
function DocumentsSection({ shipment }) {
  const docs = shipment.documents ?? []
  const saberDocs = shipment.saberDocs ?? {}
  const saberRows = [
    { key:'awb',       label:'Air Waybill',         icon:'✈️', color:'#06B6D4' },
    { key:'bol',       label:'Bill of Lading',      icon:'🚢', color:'#059669' },
    { key:'saberCert', label:'SABER Certificate',   icon:'📜', color:'#8B5CF6' },
  ]
  const customsDoc = shipment.customsDoc
  return (
    <div className="space-y-3">
      {/* General docs */}
      <div className="rounded-xl border" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Shipment Documents</h3>
          <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{docs.length} attached</span>
        </div>
        <div className="p-3 space-y-1.5">
          {docs.length === 0 ? (
            <div className="text-[12.5px] text-center py-6" style={{ color:'var(--text3)' }}>No general documents uploaded</div>
          ) : docs.map(d => (
            <div key={d.id} className="rounded-lg p-2 flex items-center gap-2.5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'var(--card)' }}>
                <FileText className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold truncate" style={{ color:'var(--text)' }}>{d.type}</div>
                <div className="text-[10px] font-mono truncate" style={{ color:'var(--text3)' }}>{d.fileName}</div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                style={{ background: d.status === 'valid' ? 'rgba(5,150,105,.12)' : 'rgba(217,119,6,.12)',
                         color: d.status === 'valid' ? '#059669' : '#D97706' }}>
                {d.status ?? 'pending'}
              </span>
              <span className="text-[10px]" style={{ color:'var(--text3)' }}>v{d.version ?? 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SABER + Customs (the cross-ref into the SABER tab) */}
      <div className="rounded-xl border" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>SABER &amp; Customs Documents</h3>
          <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>
            {Object.values(saberDocs).filter(Boolean).length + (customsDoc ? 1 : 0)} / 4 uploaded
          </span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {saberRows.map(r => {
            const f = saberDocs[r.key]
            return (
              <div key={r.key} className="rounded-lg p-2 flex items-center gap-2" style={{ background:'var(--bg2)', border:`1px solid ${f ? r.color : 'var(--border)'}40` }}>
                <span className="text-base">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold" style={{ color:'var(--text)' }}>{r.label}</div>
                  <div className="text-[10px] font-mono truncate" style={{ color:'var(--text3)' }}>{f ? f.name : 'Not uploaded'}</div>
                </div>
                {f && <span className="text-[10px] font-bold" style={{ color:'#059669' }}>✓</span>}
              </div>
            )
          })}
          <div className="rounded-lg p-2 flex items-center gap-2 col-span-2" style={{ background:'var(--bg2)', border:`1px solid ${customsDoc ? '#D97706' : 'var(--border)'}40` }}>
            <span className="text-base">🛃</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-bold" style={{ color:'var(--text)' }}>Customs Document</div>
              <div className="text-[10px] font-mono truncate" style={{ color:'var(--text3)' }}>{customsDoc ? customsDoc.name : 'Not uploaded'}</div>
            </div>
            {customsDoc && <span className="text-[10px] font-bold" style={{ color:'#059669' }}>✓</span>}
          </div>
        </div>
        <div className="px-4 py-2 text-[11px]" style={{ borderTop:'1px solid var(--border)', color:'var(--text3)' }}>
          Manage uploads in the <strong style={{ color:'var(--primary)' }}>SABER &amp; Customs</strong> tab above.
        </div>
      </div>
    </div>
  )
}

// ─── Vendors Section ───────────────────────────────────────────────────
function VendorsSection({ shipment }) {
  const vendorList = useVendorV2Store(s => s.vendors)
  const supplierId = shipment.supplier ?? shipment.vendorId
  const supplier   = vendorList.find(v => v.id === supplierId)
  const quotes     = shipment.quotes ?? []
  const approved   = shipment.approvedQuoteId
  // Carriers / freight forwarders mentioned on the shipment
  const carrierIds = [shipment.carrierId, shipment.forwarderId, shipment.customsBrokerId].filter(Boolean)
  const carriers   = carrierIds.map(id => vendorList.find(v => v.id === id)).filter(Boolean)

  const VendorCard = ({ v, role }) => v ? (
    <div className="rounded-xl border p-3" style={{ ...C }}>
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[12.5px] font-black flex-shrink-0" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
          {v.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12.5px] font-bold" style={{ color:'var(--text)' }}>{v.name}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{role}</span>
            {v.contractType === 'contracted' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'rgba(0,51,153,.12)', color:'#003399' }}>📜 {v.contractNumber ?? 'CONTRACTED'}</span>
            )}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>
            {v.type ?? '—'} · {v.country ?? '—'} · {v.primaryContact?.email ?? v.email ?? '—'}
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <VendorCard v={supplier} role="Supplier" />
        {carriers.map((c, i) => <VendorCard key={c.id} v={c} role={['Carrier','Freight Forwarder','Customs Broker'][i] ?? 'Carrier'} />)}
      </div>

      {/* Quotes summary */}
      <div className="rounded-xl border" style={C}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>RFQ Quotes</h3>
          <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>
            {quotes.length} received{approved && ' · 1 approved'}
          </span>
        </div>
        {quotes.length === 0 ? (
          <div className="text-[12.5px] text-center py-6" style={{ color:'var(--text3)' }}>No quotes submitted</div>
        ) : (
          <div className="p-2 space-y-1">
            {quotes.map(q => {
              const v = vendorList.find(x => x.id === q.vendorId)
              const isApproved = q.id === approved
              return (
                <div key={q.id} className="rounded-lg p-2 flex items-center gap-2"
                  style={{ background: isApproved ? 'rgba(5,150,105,.08)' : 'var(--bg2)',
                           border:`1px solid ${isApproved ? 'rgba(5,150,105,.4)' : 'var(--border)'}` }}>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-bold" style={{ color:'var(--text)' }}>{v?.name ?? q.vendorId}</div>
                    <div className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{q.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12.5px] font-mono font-bold" style={{ color: isApproved ? '#059669' : 'var(--text)' }}>
                      {shipment.currency ?? 'SAR'} {Number(q.amount ?? 0).toLocaleString()}
                    </div>
                    {isApproved && <div className="text-[9px] font-bold" style={{ color:'#059669' }}>✓ APPROVED</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Vendor evaluation summary if any */}
      {shipment.vendorEvaluation?.submittedAt && (
        <div className="rounded-xl border p-3 grid grid-cols-4 gap-3" style={{ ...C, borderColor:'rgba(5,150,105,.4)' }}>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Overall ★</div>
            <div className="text-base font-mono font-bold" style={{ color:'#059669' }}>{shipment.vendorEvaluation.overall}★</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Communication</div>
            <div className="text-base font-mono" style={{ color:'#2563EB' }}>{shipment.vendorEvaluation.communication}★</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>On-time</div>
            <div className="text-base font-mono" style={{ color:'#059669' }}>{shipment.vendorEvaluation.onTime}★</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Pricing</div>
            <div className="text-base font-mono" style={{ color:'#D97706' }}>{shipment.vendorEvaluation.pricing}★</div>
          </div>
        </div>
      )}
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
function ItemsTab({ shipment, update, toast }) {
  const items = (shipment.items ?? []).filter(i => i.active !== false)
  const cargo = shipment.cargo ?? []

  const toggleSaberRequired = (itemId, next) => {
    if (!update) return
    const updatedItems = (shipment.items ?? []).map(it =>
      it.id === itemId ? { ...it, saberRequired: next } : it
    )
    update({ items: updatedItems })
    if (toast) {
      toast.success(
        next ? 'SABER Required flagged' : 'SABER Required cleared',
        next
          ? 'This shipment is now SABER Compliance Enforced.'
          : `Item updated · ${updatedItems.filter(i => i.saberRequired).length} item(s) still flagged.`,
      )
    }
  }

  const saberCount   = items.filter(i => i.saberRequired).length
  const saberActive  = saberCount > 0

  return (
    <div className="space-y-4">
      {/* SABER Enforcement banner */}
      {saberActive && (
        <div className="rounded-lg p-2.5 flex items-center gap-3" style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.3)' }}>
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color:'#8B5CF6' }} />
          <div className="text-[12.5px] flex-1" style={{ color:'var(--text2)' }}>
            <strong style={{ color:'#8B5CF6' }}>SABER Compliance Enforced</strong>
            <span className="ml-2">· {saberCount} item{saberCount === 1 ? '' : 's'} flagged · all three documents (AWB, B/L, SABER Certificate) must be uploaded before this shipment can transition out of the SABER phase</span>
          </div>
        </div>
      )}

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
                  {['#','Description','Material Code','HS Code','Qty','Unit','Weight','Declared Value','Origin','SABER'].map(h => (
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
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox"
                          checked={!!it.saberRequired}
                          onChange={(e) => toggleSaberRequired(it.id, e.target.checked)}
                          className="w-3.5 h-3.5 rounded cursor-pointer"
                          style={{ accentColor:'#8B5CF6' }} />
                        {it.saberRequired
                          ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(139,92,246,.1)', color:'#8B5CF6' }}>Required</span>
                          : <span className="text-[10px]" style={{ color:'var(--text3)' }}>—</span>}
                      </label>
                    </td>
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
// ═══════════════════════════════════════════════════════════════════════════
// SABER & CLEARANCE TAB
// Two child workspaces:
//   1) SABER Documentation — AWB + B/L + SABER Cert uploads (all required)
//   2) Customs Clearance   — Customs Doc upload + checklist (mirrors LocalShipment)
// ═══════════════════════════════════════════════════════════════════════════

// Customs clearance checklist — structurally mirrors the LocalShipment checklist:
// sequential cards, completion gating, confirm-toggle, notes field.
const CUSTOMS_CHECKLIST_STEPS = [
  { id:'docReview',   label:'Document Review',     icon: FileCheck, desc:'Confirm Customs Document is signed and all attached pages are legible.' },
  { id:'dutyAssess',  label:'Duty Assessment',     icon: DollarSign, desc:'HS codes validated, declared values matched, duties calculated.' },
  { id:'inspection',  label:'Inspection Cleared',  icon: Eye,       desc:'Physical or digital inspection completed by customs officer.' },
  { id:'release',     label:'Release Authorized',  icon: CheckCircle2, desc:'Customs release authorisation granted; goods cleared for onward movement.' },
]

// ─── CUSTOMS PAYMENT CARD (request #2) ─────────────────────────────────────
// Lets the user record the duty/customs payable while filling SABER. Pulls in
// the PO, captures the customer's % share + currency + current KSA SAR rate,
// computes the SAR amount, and configures a reminder lead-time so Finance is
// alerted that many days before the customs ETA.
function CustomsPaymentCard({ shipment, update, toast }) {
  const cp = shipment.customsPayment ?? {
    dutyPercent: 5,
    foreignCurrency: 'USD',
    ksaRate: 3.75,
    invoiceValue: '',
    reminderDays: 5,
    paid: false,
  }
  const [draft, setDraft] = useState(cp)
  const dirty = JSON.stringify(draft) !== JSON.stringify(cp)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  // PO from the shipment (use first listed, since intl shipments typically have a single primary)
  const po = (shipment.poNumber || (shipment.poNumbers ?? [])[0] || '—')

  // Compute the SAR amount: invoiceValue (in foreign currency) × ksaRate × dutyPercent/100
  const invoice = Number(draft.invoiceValue || 0)
  const rate    = Number(draft.ksaRate || 0)
  const pct     = Number(draft.dutyPercent || 0)
  const customsSAR = +(invoice * rate * (pct / 100)).toFixed(2)

  // Days until the customs ETA — the system would compute this from the
  // discharge/clearance window; we approximate using the shipment ETA.
  const eta = shipment.eta ? new Date(shipment.eta) : null
  const daysToEta = eta
    ? Math.ceil((eta.getTime() - Date.now()) / 86400000)
    : null

  const handleSave = () => {
    update({ customsPayment: { ...draft, customsSAR, savedAt: new Date().toISOString() } })
    toast.success('Customs payment recorded', `SAR ${customsSAR.toLocaleString()} payable · reminder ${draft.reminderDays}d before ETA`)
  }
  const markPaid = () => {
    update({ customsPayment: { ...draft, customsSAR, paid: true, paidAt: new Date().toISOString() } })
    toast.success('Customs marked as paid', `SAR ${customsSAR.toLocaleString()} cleared`)
  }

  return (
    <div data-tour="customs-payment" data-tour-order="60"
      data-tour-title="Customs Payment Configuration"
      data-tour-desc="Record the customs duty payable while completing SABER. Enter the customer's duty %, the foreign currency the invoice is denominated in, today's SAR exchange rate, and a reminder lead-time. The computed SAR amount flows to the Finance dashboard's Customs Queue with overdue/in-window alerts."
      className="rounded-xl border-2 p-4 space-y-3" style={{ background:'rgba(217,119,6,.04)', borderColor:'#D97706' }}>
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4" style={{ color:'#D97706' }} />
        <h4 className="text-sm font-bold" style={{ color:'#D97706' }}>Customs Payment Configuration</h4>
        {cp.paid && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'rgba(5,150,105,.12)', color:'#059669' }}>✓ PAID</span>
        )}
        {!cp.paid && cp.savedAt && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background:'rgba(217,119,6,.12)', color:'#D97706' }}>● PENDING</span>
        )}
        <span className="ml-auto text-[10px] font-mono" style={{ color:'var(--text3)' }}>PO: {po}</span>
      </div>
      <p className="text-[11px]" style={{ color:'var(--text2)' }}>
        Set the customer's duty share, today's KSA SAR exchange rate, and a reminder lead-time. Once saved, the customs charge appears on the <strong>Finance dashboard</strong> for advance clearance, with reminders firing the configured number of days before port discharge.
      </p>

      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Customer Duty Share</label>
          <div className="flex items-center gap-1">
            <input type="number" min="0" max="100" step="0.5" value={draft.dutyPercent}
              onChange={e => set('dutyPercent', Number(e.target.value))}
              className="flex-1 rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none font-mono font-bold"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
            <span className="text-sm font-bold" style={{ color:'var(--text3)' }}>%</span>
          </div>
        </div>
        <div className="col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Foreign Currency</label>
          <select value={draft.foreignCurrency} onChange={e => set('foreignCurrency', e.target.value)}
            className="w-full rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none font-mono font-bold"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }}>
            {['USD','EUR','GBP','AED','CNY','JPY','INR','SAR'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Current KSA Rate</label>
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color:'var(--text3)' }}>1 {draft.foreignCurrency} =</span>
            <input type="number" min="0" step="0.0001" value={draft.ksaRate}
              onChange={e => set('ksaRate', Number(e.target.value))}
              className="flex-1 rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none font-mono font-bold"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
            <span className="text-[10px]" style={{ color:'var(--text3)' }}>SAR</span>
          </div>
        </div>
        <div className="col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Invoice Value <span style={{ color:'var(--text3)', fontWeight:400 }}>({draft.foreignCurrency})</span></label>
          <input type="number" min="0" step="0.01" value={draft.invoiceValue}
            onChange={e => set('invoiceValue', e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none font-mono font-bold"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reminder · days before ETA</label>
          <div className="flex items-center gap-1">
            <input type="number" min="1" max="30" step="1" value={draft.reminderDays}
              onChange={e => set('reminderDays', Number(e.target.value))}
              className="flex-1 rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none font-mono font-bold"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
            <span className="text-sm font-bold" style={{ color:'var(--text3)' }}>days</span>
          </div>
          <p className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>Default 5 days · finance dashboard alerts</p>
        </div>
        {/* Computed customs amount */}
        <div className="col-span-6 rounded-lg p-3" style={{ background:'var(--card)', border:'2px solid #D97706' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#D97706' }}>Customs Payable to ZATCA</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-mono font-bold" style={{ color:'#D97706' }}>SAR {customsSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>
              = {draft.foreignCurrency} {Number(draft.invoiceValue || 0).toLocaleString()} × {Number(draft.ksaRate).toFixed(4)} × {pct}%
            </span>
          </div>
          {eta && (
            <p className="text-[10px] mt-1" style={{ color: daysToEta != null && daysToEta <= (draft.reminderDays ?? 5) ? '#DC2626' : 'var(--text3)' }}>
              {daysToEta != null && daysToEta >= 0
                ? `ETA in ${daysToEta}d · reminder fires ${draft.reminderDays}d before ETA${daysToEta <= draft.reminderDays ? ' · ⚠ within window, alert active' : ''}`
                : daysToEta != null && daysToEta < 0
                  ? `ETA passed ${-daysToEta}d ago — clear customs immediately`
                  : 'ETA not set on shipment'}
            </p>
          )}
        </div>
        <div className="col-span-3 flex flex-col gap-1">
          <button onClick={handleSave} disabled={!dirty || customsSAR <= 0}
            className="px-3 py-2 text-[12.5px] font-bold rounded-lg text-white transition-opacity"
            style={{ background:'#D97706', opacity: (dirty && customsSAR > 0) ? 1 : 0.5 }}>
            {cp.savedAt ? 'Update' : 'Save'} & Notify Finance
          </button>
          {cp.savedAt && !cp.paid && (
            <button onClick={markPaid}
              className="px-3 py-2 text-[12.5px] font-bold rounded-lg border transition-colors"
              style={{ background:'var(--card)', borderColor:'#059669', color:'#059669' }}>
              ✓ Mark Paid
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FileDropZone({ icon: Icon, label, hint, file, color, onUpload, onClear }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handlePick = (f) => {
    if (!f) return
    // Mock storage — we capture name + size + lastModified for the receipt
    const meta = { name: f.name, size: f.size, type: f.type, lastModified: f.lastModified, uploadedAt: new Date().toISOString() }
    onUpload(meta)
  }

  return (
    <div className="rounded-xl border-2 transition-all overflow-hidden flex flex-col"
      style={{
        background: file ? `${color}08` : (dragActive ? `${color}12` : 'var(--card)'),
        borderColor: file ? color : (dragActive ? color : 'var(--border2)'),
        borderStyle: file ? 'solid' : 'dashed',
      }}
      onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
      onDrop={(e) => {
        e.preventDefault(); setDragActive(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handlePick(f)
      }}>
      <div className="p-3 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
          style={{ background: file ? color : `${color}15`, color: file ? '#fff' : color }}>
          {file ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <div className="text-[12.5px] font-bold" style={{ color: file ? color : 'var(--text)' }}>{label}</div>
        <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>{hint}</div>
        {file && (
          <div className="mt-2 text-[10px] font-mono" style={{ color:'var(--text2)' }}>
            {file.name} · {Math.round((file.size || 0) / 1024)} KB
          </div>
        )}
      </div>
      <div className="px-3 py-2 flex items-center gap-1.5" style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)' }}>
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={(e) => handlePick(e.target.files?.[0])} />
        <button onClick={() => inputRef.current?.click()}
          className="flex-1 px-2 py-1 text-[10px] font-bold rounded border flex items-center justify-center gap-1"
          style={{ background:'var(--card)', borderColor:'var(--border)', color: file ? 'var(--text2)' : color }}>
          <FileUp className="w-3 h-3" />{file ? 'Replace' : 'Upload'}
        </button>
        {file && (
          <button onClick={onClear}
            className="w-7 h-7 rounded border flex items-center justify-center"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--danger)' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

function CustomsChecklist({ shipment, update, toast }) {
  const cl = shipment.customsChecklist ?? {}

  const completeStep = (stepId, notes) => {
    const now = new Date().toISOString()
    update({
      customsChecklist: {
        ...(shipment.customsChecklist ?? {}),
        [stepId]: { completed: true, completedAt: now, completedBy: 'Fahad Al-Ghamdi', notes: notes ?? '' },
      },
    })
    toast.success(`${CUSTOMS_CHECKLIST_STEPS.find(s => s.id === stepId)?.label} confirmed`, 'Step locked. Move to the next item.')
  }

  const undoStep = (stepId) => {
    const newCl = { ...(shipment.customsChecklist ?? {}) }
    delete newCl[stepId]
    update({ customsChecklist: newCl })
    toast.info('Step reopened', 'You can now re-confirm with updated information.')
  }

  // Sequential gating: each step requires the previous to be done
  const stepIndex = (id) => CUSTOMS_CHECKLIST_STEPS.findIndex(s => s.id === id)
  const isUnlocked = (id) => {
    const idx = stepIndex(id)
    if (idx === 0) return true
    const prev = CUSTOMS_CHECKLIST_STEPS[idx - 1]
    return !!cl[prev.id]?.completed
  }

  const doneCount = CUSTOMS_CHECKLIST_STEPS.filter(s => cl[s.id]?.completed).length
  const allDone = doneCount === CUSTOMS_CHECKLIST_STEPS.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
          <h4 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Customs Clearance Checklist</h4>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: allDone ? '#E6F4EA' : 'var(--bg2)', color: allDone ? '#059669' : 'var(--text3)', border: `1px solid ${allDone ? '#34A853' : 'var(--border)'}` }}>
          {doneCount}/{CUSTOMS_CHECKLIST_STEPS.length} {allDone && '✓ COMPLETE'}
        </span>
      </div>

      {CUSTOMS_CHECKLIST_STEPS.map((step) => (
        <CustomsChecklistCard
          key={step.id}
          step={step}
          state={cl[step.id]}
          unlocked={isUnlocked(step.id)}
          onComplete={(notes) => completeStep(step.id, notes)}
          onUndo={() => undoStep(step.id)}
        />
      ))}
    </div>
  )
}

function CustomsChecklistCard({ step, state, unlocked, onComplete, onUndo }) {
  const [notes, setNotes] = useState(state?.notes ?? '')
  const done = !!state?.completed
  const Icon = step.icon
  const locked = !unlocked && !done

  return (
    <div className="rounded-lg border overflow-hidden transition-all"
      style={{
        background: done ? 'rgba(5,150,105,.04)' : locked ? 'var(--bg2)' : 'var(--card)',
        borderColor: done ? 'rgba(5,150,105,.4)' : 'var(--border)',
        opacity: locked ? 0.55 : 1,
      }}>
      <div className="px-3 py-2 flex items-center gap-2" style={{ background: done ? 'rgba(5,150,105,.08)' : 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: done ? 'var(--success)' : locked ? 'var(--border)' : 'var(--primary-light)', color: done ? '#fff' : locked ? 'var(--text3)' : 'var(--primary)' }}>
          {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold" style={{ color: 'var(--text)' }}>{step.label}</div>
          <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{step.desc}</div>
        </div>
        {done && (
          <button onClick={onUndo} className="px-2 py-1 text-[10px] font-bold rounded border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text3)' }}>
            Reopen
          </button>
        )}
      </div>

      {!locked && (
        <div className="p-3">
          {done ? (
            <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
              <span style={{ color:'var(--success)' }}>✓ Confirmed</span>
              {state.completedAt && <span className="ml-2 font-mono text-[10px]" style={{ color:'var(--text3)' }}>{fmtDateTime(state.completedAt)}</span>}
              {state.completedBy && <span className="ml-2 text-[10px]" style={{ color:'var(--text3)' }}>by {state.completedBy}</span>}
              {state.notes && <div className="mt-1.5 text-[10px] italic" style={{ color:'var(--text3)' }}>"{state.notes}"</div>}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Optional notes — reference numbers, officer name, exceptions…"
                className="w-full rounded px-2 py-1.5 text-[12.5px] border focus:outline-none resize-none"
                style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              <button onClick={() => onComplete(notes)}
                className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5"
                style={{ background:'var(--success)' }}>
                <Check className="w-3 h-3" /> Confirm Step
              </button>
            </div>
          )}
        </div>
      )}
      {locked && (
        <div className="px-3 py-2 text-[10px] italic" style={{ color:'var(--text3)' }}>
          🔒 Locked — complete the previous step first
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-ARRIVAL CONFIG — ETA + Reminder Days fields with finance alert simulation
// ═══════════════════════════════════════════════════════════════════════════
function PreArrivalConfig({ shipment, update, toast }) {
  const eta = shipment.eta ?? ''
  const reminderDays = shipment.reminderDays ?? 5

  const setEta = (val) => update({ eta: val ? new Date(val).toISOString() : null })
  const setReminderDays = (val) => update({ reminderDays: Number(val) })

  // Compute trigger date = ETA - reminderDays
  const triggerDate = useMemo(() => {
    if (!eta) return null
    return new Date(new Date(eta).getTime() - Math.max(0, Number(reminderDays)) * 86400000)
  }, [eta, reminderDays])

  const now = new Date()
  const triggerActive = triggerDate && triggerDate <= now && new Date(eta) > now
  const daysToTrigger = triggerDate ? Math.floor((triggerDate - now) / 86400000) : null

  const handlePreviewAlert = () => {
    toast.info(
      'Finance pre-arrival alert dispatched',
      `Notification queued for Finance Dept dashboard + email sent to ${shipment.id} stakeholders · Port of Discharge: ${shipment.portOfDischarge ?? shipment.destinations?.[0]?.port ?? '—'}`,
      { duration: 6000 },
    )
  }

  return (
    <div className="mt-3 pt-3 grid grid-cols-1 md:grid-cols-12 gap-3" style={{ borderTop:'1px solid var(--border)' }}>
      <div className="md:col-span-3">
        <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>
          <Calendar className="w-3 h-3 inline mr-1" />ETA · Port of Discharge
        </label>
        <input type="date"
          value={eta ? eta.slice(0, 10) : ''}
          onChange={(e) => setEta(e.target.value)}
          className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
          style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>
      <div className="md:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>
          <Bell className="w-3 h-3 inline mr-1" />Reminder Days
        </label>
        <Select2 size="sm" value={reminderDays} onChange={(v) => setReminderDays(v)}
          options={[
            { id: 3,  label: '3 Days  before ETA' },
            { id: 5,  label: '5 Days  before ETA · default' },
            { id: 7,  label: '7 Days  before ETA' },
            { id: 10, label: '10 Days before ETA' },
            { id: 14, label: '14 Days before ETA' },
          ]} />
      </div>
      <div className="md:col-span-5 rounded-lg p-2 flex items-center gap-2"
        style={{
          background: triggerActive ? 'rgba(220,38,38,.06)' : eta ? 'rgba(37,99,235,.04)' : 'var(--bg2)',
          border: `1px solid ${triggerActive ? 'rgba(220,38,38,.3)' : eta ? 'rgba(37,99,235,.2)' : 'var(--border)'}`,
        }}>
        {!eta ? (
          <span className="text-[12.5px] italic" style={{ color:'var(--text3)' }}>Set an ETA to schedule a finance pre-arrival alert</span>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 flex-shrink-0" style={{ color: triggerActive ? '#DC2626' : '#2563EB' }} />
            <div className="flex-1 text-[12.5px]" style={{ color:'var(--text2)' }}>
              <strong style={{ color: triggerActive ? '#DC2626' : '#2563EB' }}>
                {triggerActive ? 'ALERT WINDOW OPEN' : 'Scheduled alert'}
              </strong>
              <span className="ml-1">·</span>
              <span className="ml-1 font-mono">{triggerDate ? triggerDate.toLocaleDateString('en-GB') : '—'}</span>
              {daysToTrigger != null && (
                <span className="ml-1 text-[10px]" style={{ color:'var(--text3)' }}>
                  ({daysToTrigger > 0 ? `in ${daysToTrigger}d` : daysToTrigger === 0 ? 'today' : `${-daysToTrigger}d ago`})
                </span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="md:col-span-2 flex items-end">
        <button onClick={handlePreviewAlert} disabled={!eta}
          className="w-full px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center justify-center gap-1.5 disabled:opacity-40"
          style={{ background:'var(--card)', borderColor:'rgba(217,119,6,.3)', color:'var(--warning)' }}
          title="Simulate firing the cron job — sends to Finance dashboard + email">
          <Bell className="w-3 h-3" />Test Alert
        </button>
      </div>
    </div>
  )
}

function SaberClearanceTab({ shipment, update, toast }) {
  const [subTab, setSubTab] = useState('saber')
  const saberItems = (shipment.items ?? []).filter(i => i.saberRequired)
  const saberCount = saberItems.length
  const docs = shipment.saberDocs ?? {}
  const customsDoc = shipment.customsDoc ?? null

  const setDoc = (key, meta) => {
    update({ saberDocs: { ...(shipment.saberDocs ?? {}), [key]: meta } })
    toast.success('Document uploaded', `${meta.name} · ${Math.round((meta.size || 0) / 1024)} KB`)
  }
  const clearDoc = (key) => {
    const newDocs = { ...(shipment.saberDocs ?? {}) }
    delete newDocs[key]
    update({ saberDocs: newDocs })
    toast.info('Document removed', 'Upload a replacement to keep the SABER phase active.')
  }
  const setCustoms = (meta) => {
    update({ customsDoc: meta })
    toast.success('Customs document uploaded', meta.name)
  }
  const clearCustoms = () => {
    update({ customsDoc: null })
    toast.info('Customs document removed', 'Checklist will lock until a new document is uploaded.')
  }

  const saberValid = !!docs.awb && !!docs.bol && !!docs.saberCert
  const customsUploaded = !!customsDoc

  // Workflow blocker
  const blockerMsg = !saberValid
    ? `Upload all three SABER documents (${[!docs.awb && 'AWB', !docs.bol && 'B/L', !docs.saberCert && 'SABER Cert'].filter(Boolean).join(', ')}) before the shipment can transition out of this phase.`
    : !customsUploaded
      ? 'Upload the Customs Document to unlock the clearance checklist.'
      : null

  // Banner if no items are SABER-flagged
  if (saberCount === 0) {
    return (
      <div className="rounded-xl border p-6 text-center" style={C}>
        <Shield className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--text3)' }} />
        <h3 className="text-sm font-bold mb-1" style={{ color:'var(--text)' }}>SABER Compliance Not Enforced</h3>
        <p className="text-[12.5px] max-w-md mx-auto" style={{ color:'var(--text3)' }}>
          No item in the manifest is flagged as <strong style={{ color:'#8B5CF6' }}>SABER Required</strong>. To enable this phase, mark at least one item as SABER Required on the <strong>Items</strong> tab.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Top SABER enforcement banner */}
      <div className="rounded-xl p-3 flex items-center gap-3" style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.3)' }}>
        <Shield className="w-4 h-4 flex-shrink-0" style={{ color:'#8B5CF6' }} />
        <div className="flex-1 text-[12.5px]" style={{ color:'var(--text2)' }}>
          <strong style={{ color:'#8B5CF6' }}>SABER Compliance Enforced</strong>
          <span className="ml-2">· {saberCount} item{saberCount === 1 ? '' : 's'} flagged · {saberValid ? 'all SABER docs uploaded' : `${3 - [docs.awb, docs.bol, docs.saberCert].filter(Boolean).length} document(s) still required`}</span>
        </div>
        {saberValid && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background:'#E6F4EA', color:'#059669', border:'1px solid #34A853' }}>SABER ✓</span>
        )}
      </div>

      {/* Sub-tab bar */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="flex" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          {[
            { id:'saber',   label:'1. SABER Documentation', icon: Shield,     done: saberValid },
            { id:'customs', label:'2. Customs Clearance',   icon: FileCheck,  done: customsUploaded && CUSTOMS_CHECKLIST_STEPS.every(s => shipment.customsChecklist?.[s.id]?.completed) },
          ].map(t => {
            const active = subTab === t.id
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-bold transition-all relative"
                style={{
                  background: active ? 'var(--card)' : (t.done ? '#E6F4EA' : 'var(--bg2)'),
                  color: active ? 'var(--primary)' : 'var(--text2)',
                  borderRight: '1px solid var(--border)',
                }}>
                <Icon className="w-3.5 h-3.5" />{t.label}
                {t.done && (
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background:'#E6F4EA', color:'#059669', border:'1px solid #34A853' }}>✓</span>
                )}
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: t.done ? '#34A853' : 'var(--primary)' }} />}
                {!active && t.done && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'#34A853' }} />}
              </button>
            )
          })}
        </div>

        <div className="p-4">
          {/* Sub-tab 1: SABER */}
          {subTab === 'saber' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FileDropZone
                  icon={Plane}
                  label="Air Waybill (AWB)"
                  hint="PDF · max 10 MB · drag & drop or click upload"
                  color="#06B6D4"
                  file={docs.awb}
                  onUpload={(meta) => setDoc('awb', meta)}
                  onClear={() => clearDoc('awb')}
                />
                <FileDropZone
                  icon={Truck}
                  label="Bill of Lading (B/L)"
                  hint="PDF · max 10 MB · drag & drop or click upload"
                  color="#059669"
                  file={docs.bol}
                  onUpload={(meta) => setDoc('bol', meta)}
                  onClear={() => clearDoc('bol')}
                />
                <FileDropZone
                  icon={Award}
                  label="SABER Certificate"
                  hint="PDF · max 10 MB · drag & drop or click upload"
                  color="#8B5CF6"
                  file={docs.saberCert}
                  onUpload={(meta) => setDoc('saberCert', meta)}
                  onClear={() => clearDoc('saberCert')}
                />
              </div>

              {/* ─── Customs Payment Configuration (request #2) ───── */}
              <CustomsPaymentCard shipment={shipment} update={update} toast={toast} />

              {/* Workflow blocker */}
              <button disabled={!saberValid}
                className="w-full px-4 py-2.5 text-[12.5px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                style={{
                  background: saberValid ? 'var(--success)' : 'var(--bg2)',
                  color: saberValid ? '#fff' : 'var(--text3)',
                  cursor: saberValid ? 'pointer' : 'not-allowed',
                  border: saberValid ? 'none' : '1px solid var(--border)',
                }}>
                {saberValid
                  ? <><Check className="w-3.5 h-3.5" /> All SABER documents present — Transition Out of SABER Phase</>
                  : <><AlertCircle className="w-3.5 h-3.5" /> Cannot transition — {3 - [docs.awb, docs.bol, docs.saberCert].filter(Boolean).length} document(s) missing</>
                }
              </button>
            </div>
          )}

          {/* Sub-tab 2: Customs Clearance */}
          {subTab === 'customs' && (
            <div className="space-y-3">
              {/* Single full-width dropzone */}
              <FileDropZone
                icon={FileCheck}
                label="Customs Document (official package)"
                hint="PDF only · signed customs clearance package — declaration, duty calculation, officer sign-off"
                color="#D97706"
                file={customsDoc}
                onUpload={setCustoms}
                onClear={clearCustoms}
              />

              {/* Checklist appears once document is verified */}
              {customsUploaded ? (
                <CustomsChecklist shipment={shipment} update={update} toast={toast} />
              ) : (
                <div className="rounded-lg border-2 border-dashed p-6 text-center" style={{ borderColor:'var(--border2)' }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text3)' }} />
                  <p className="text-[12.5px] font-bold" style={{ color:'var(--text2)' }}>Checklist locked</p>
                  <p className="text-[12.5px] mt-1" style={{ color:'var(--text3)' }}>Upload the Customs Document above to unlock the clearance checklist.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

  const [cmpOpen, setCmpOpen] = useState(false)

  // Map RFQ replies → ComparisonSheet supplier list (top 3 cheapest replies)
  const replies = rfq.replies ?? []
  const sortedReplies = [...replies].sort((a, b) => (a.amount ?? Infinity) - (b.amount ?? Infinity))
  const top3 = sortedReplies.slice(0, 3)
  const selectedIdx = Math.max(0, top3.findIndex(r => r.vendorId === rfq.selectedVendorId))
  const cmpData = {
    prNumber: shipment.prNumber ?? '',
    prApprovedDate: shipment.createdAt,
    poNumber: shipment.poNumber ?? '',
    poDate: shipment.createdAt,
    project: shipment.project ?? '',
    currency: shipment.currency ?? 'SAR',
    poType: 'International Freight',
    leadTime: `${shipment.leadTimeDays ?? '—'} days`,
    comparisonPeriod: 3,
    validTill: shipment.readyDate,
    suppliers: top3.map(r => {
      const v = vendors.find(x => x.id === r.vendorId)
      return {
        name: v?.name ?? r.vendorName ?? r.vendorId,
        quotedItems: 'full',
        incoterms: shipment.incoterm ?? '',
        paymentTerms: r.paymentTerms ?? shipment.paymentTerms ?? '',
        deliveryLeadTime: r.leadTime ? `${r.leadTime} days` : '',
        qualityBrand: r.qualityNotes ?? '',
        totalPriceWithoutVat: r.amount,
      }
    }),
    selectedSupplierIndex: selectedIdx >= 0 ? selectedIdx : 0,
    costReduction: top3.length >= 2 ? Math.max(0, (top3[top3.length - 1]?.amount ?? 0) - (top3[0]?.amount ?? 0)) : 0,
    justification: { aramcoApproved: !!vendors.find(v => v.id === rfq.selectedVendorId)?.aramcoApproved },
    approvals: {
      evaluatedBy:    { name: shipment.createdBy ?? 'Khalid Salman', signature: '' },
      reviewedBy:     { name: shipment.owner ?? '', signature: '' },
      supplyChainMgr: { name: 'Yousef Al-Harbi', signature: '' },
      ceo:            { name: 'Abdullah Al-Hulul', signature: '' },
    },
  }

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
        {replies.length >= 2 && (
          <button onClick={() => setCmpOpen(true)}
            className="ml-auto px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-slate-50"
            style={{ background:'var(--card)', borderColor:'#003399', color:'#003399' }}
            title="Generate the official Quotations Comparison Form for review and approval">
            <FileText className="w-3.5 h-3.5" /> Generate Comparison Sheet
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

      {/* Quotations Comparison Sheet — Hulul GS-SC-FRM v03 */}
      <PrintFrame open={cmpOpen} onClose={() => setCmpOpen(false)}
        title={`Quotations Comparison · ${shipment.id}`}
        subtitle="GS-SC-FRM v03 · Hulul Supply Chain"
        docId={cmpData.poNumber || shipment.id}>
        <ComparisonSheet data={cmpData} />
      </PrintFrame>
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

// ACCOUNTS TAB
// ═══════════════════════════════════════════════════════════════════════════
function AccountsTab({ shipment, update, toast }) {
  const { customerInvoices, customerReceipts } = useFinanceStore()
  const relatedInvoices = customerInvoices.filter(i => i.shipmentRef === shipment.id)
  const totalBilled = relatedInvoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = relatedInvoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0)
  const outstanding = Math.max(0, totalBilled - totalPaid)

  // ─── Printable forms ─────────────────────────────────────────────────
  const [prOpen, setPrOpen] = useState(false)
  const [dnOpen, setDnOpen] = useState(false)
  const [prInvoice, setPrInvoice] = useState(null)

  // Build the Payment Request data from an invoice (or shipment defaults)
  const prData = (() => {
    const inv = prInvoice
    const baseAmount = inv ? Math.max(0, inv.amount - (inv.paidAmount ?? 0)) : (shipment.estValue ?? 0)
    const vat = +(baseAmount * 0.15).toFixed(2)
    return {
      paymentMethod: 'bank_transfer',
      supplierName: shipment.supplierName ?? shipment.supplier ?? '',
      supplierSapId: shipment.supplierSapId ?? shipment.supplier ?? '',
      projectId: shipment.project ?? '',
      projectName: shipment.projectName ?? shipment.project ?? '',
      advancePaid: 0,
      advancePaidAmount: 0,
      poValue: shipment.estValue ?? 0,
      poNumber: shipment.poNumber ?? '',
      poDate: shipment.createdAt,
      typeOfService: `International freight – ${shipment.id}${shipment.modes?.length ? ` (${shipment.modes.join(', ')})` : ''}`,
      invoiceNumber: inv?.id ?? '',
      remarks: inv ? `Against invoice ${inv.id} · ${inv.status ?? ''}` : 'Payment release request',
      amount: baseAmount,
      withholdingTax: 0,
      vat,
      currency: shipment.currency ?? 'SAR',
      issueDate: new Date().toISOString(),
      preparedBy: shipment.createdBy ?? 'Khizar Hayat',
      lineManager: shipment.owner ?? 'Yousef Al-Harbi',
      finance: {
        checkedBy: '', reviewedBy: '', approvedBy: '',
      },
    }
  })()

  // Delivery Note data — Intl shipments map their destinations + items
  // Module 3 — Inheritance Engine: pull active T&C bodies
  const activeIntlContractTC = useTCTemplateStore(s => s.getActive('contract', 'international'))
  const activeIntlInvoiceTC  = useTCTemplateStore(s => s.getActive('invoice',  'international'))
  const dnData = {
    orderDate: shipment.createdAt,
    purchaseOrder: shipment.poNumber ?? '',
    deliveryNoteNumber: shipment.deliveryNoteNumber || `DN-${shipment.id}`,
    customerId: shipment.project ?? '',
    despatchDate: shipment.readyDate ?? shipment.createdAt,
    packingList: shipment.packingListNumber ?? '',
    shippingTo: {
      name: shipment.projectName ?? shipment.project ?? '',
      address: shipment.finalDestNotes ?? '',
      city: shipment.portOfDischarge ?? '',
      country: 'KSA',
      contact: shipment.route?.origin?.contact ?? '',
      phone: '',
    },
    items: (shipment.items ?? []).filter(i => i.active !== false).map(it => ({
      code: it.materialCode ?? '',
      description: it.description ?? '',
      quantity: it.quantity ?? '',
      uom: it.unit ?? 'EA',
      remarks: it.saberRequired ? 'SABER · regulated' : (it.notes ?? ''),
    })),
    specialNotes: shipment.finalDestNotes ?? '',
    approvedBy: shipment.createdBy ?? '',
    approverSignature: '',
    receivedByName: '',
    receivedByCompany: '',
    tcAppendix: activeIntlContractTC?.body ?? null,
  }
  // attach the invoice T&C to the prData under remarks tail so it's not lost
  if (activeIntlInvoiceTC?.body && prData) {
    prData.remarks = (prData.remarks ? prData.remarks + '\n\n' : '') + '— T&C Appendix —\n' + activeIntlInvoiceTC.body.split('\n').slice(0, 4).join(' · ')
  }

  const openPaymentRequest = (inv = null) => { setPrInvoice(inv); setPrOpen(true) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KPI label="Total Billed"  value={`SAR ${fmt(totalBilled)}`} color="#2563EB" mono />
        <KPI label="Total Paid"    value={`SAR ${fmt(totalPaid)}`}   color="#059669" mono />
        <KPI label="Outstanding"   value={`SAR ${fmt(outstanding)}`} color={outstanding > 0 ? '#D97706' : '#059669'} mono />
      </div>

      {/* Printable forms — quick-access bar */}
      <div className="rounded-xl border p-3 flex items-center gap-2 flex-wrap" style={C}>
        <div className="text-[10px] font-bold uppercase tracking-widest mr-auto" style={{ color:'var(--text3)' }}>Printable Forms</div>
        <button onClick={() => setDnOpen(true)}
          className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-slate-50"
          style={{ background:'var(--card)', borderColor:'#003399', color:'#003399' }}
          title="Generate the GS-DN2024-01 Delivery Note">
          <FileText className="w-3 h-3" /> Delivery Note
        </button>
        <button onClick={() => openPaymentRequest(null)}
          className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-slate-50"
          style={{ background:'var(--card)', borderColor:'#003399', color:'#003399' }}
          title="Generate the ACT-FRM-001 Payment Request">
          <Receipt className="w-3 h-3" /> Payment Request
        </button>
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
                {['Invoice','Date','Due','Amount','Paid','Outstanding','Status','Action'].map(h => (
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
                    <td className="px-3 py-2">
                      {out > 0 ? (
                        <button onClick={() => openPaymentRequest(i)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded border"
                          style={{ background:'var(--card)', borderColor:'#003399', color:'#003399' }}
                          title="Generate Payment Request for this invoice">
                          <Receipt className="w-2.5 h-2.5 inline mr-0.5" /> Pay Req
                        </button>
                      ) : (
                        <span className="text-[10px]" style={{ color:'var(--text3)' }}>paid</span>
                      )}
                    </td>
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

      {/* Printable form modals */}
      <PrintFrame open={dnOpen} onClose={() => setDnOpen(false)}
        title={`Delivery Note · ${shipment.id}`}
        subtitle="GS-DN2024-01 · Hulul / Gas Solutions"
        docId={dnData.deliveryNoteNumber}>
        <DeliveryNote data={dnData} />
      </PrintFrame>
      <PrintFrame open={prOpen} onClose={() => { setPrOpen(false); setPrInvoice(null) }}
        title={`Payment Request · ${prInvoice ? prInvoice.id : shipment.id}`}
        subtitle="ACT-FRM-001 rev 02 · Hulul Finance"
        docId={prData.poNumber}>
        <PaymentRequest data={prData} />
      </PrintFrame>

      {/* Vendor Evaluation — gated on shipment having a vendor and ETA/ATA */}
      {(shipment.vendor || shipment.vendorId || shipment.supplier) && (
        <IntlVendorEvalGate shipment={shipment} update={update} toast={toast} />
      )}
    </div>
  )
}

function IntlVendorEvalGate({ shipment, update, toast }) {
  const allIntl = useShipmentV2Store(s => s.intlShipments)
  const vendorList = useVendorV2Store(s => s.vendors)
  const vid = shipment.vendor || shipment.vendorId || shipment.supplier
  const vobj = vendorList.find(v => v.id === vid)
  return (
    <VendorEvaluation
      shipment={shipment}
      vendorName={vobj?.name ?? shipment.supplierName ?? vid}
      vendorId={vid}
      update={update}
      toast={toast}
      allShipments={allIntl} />
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

// ═══════════════════════════════════════════════════════════════════════════
// EXTRA CHARGES TAB (request #2)
// Surfaces every waiting + demurrage charge logged against this international
// shipment. Splits the two for clarity and shows totals per category.
// ═══════════════════════════════════════════════════════════════════════════
function ExtraChargesTab({ shipment }) {
  const allCharges = useWaitingChargeStore(s => s.charges)
  const charges = useMemo(
    () => allCharges
      .filter(c => c.shipmentId === shipment.id)
      .sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate)),
    [allCharges, shipment.id])

  const demurrage = charges.filter(c => c.delayReason === 'demurrage_charges')
  const waiting   = charges.filter(c => c.delayReason !== 'demurrage_charges')

  const demTotal = demurrage.reduce((s, c) => s + (c.totalAmount ?? 0), 0)
  const waitTotal = waiting.reduce((s, c) => s + (c.totalAmount ?? 0), 0)
  const grandTotal = demTotal + waitTotal

  return (
    <div className="space-y-4 text-[12.5px]">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Waiting Charges"   value={`SAR ${fmtNum(waitTotal)}`}  count={waiting.length}   color="#DC2626" icon="⏳" />
        <SummaryCard label="Demurrage Charges" value={`SAR ${fmtNum(demTotal)}`}    count={demurrage.length} color="#7C3AED" icon="🚢" />
        <SummaryCard label="Total Extras"      value={`SAR ${fmtNum(grandTotal)}`}  count={charges.length}   color="#003399" icon="💰" />
      </div>

      {/* Empty state */}
      {charges.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor:'var(--border2)', background:'var(--bg2)', color:'var(--text3)' }}>
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No extra charges have been logged for this shipment.</p>
          <p className="text-[11px] mt-1">Use the <strong style={{ color:'#DC2626' }}>⏳ Add Charges</strong> button in the header to log waiting or demurrage charges.</p>
        </div>
      )}

      {/* Demurrage */}
      {demurrage.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ background:'rgba(124,58,237,.06)', borderBottom:'1px solid var(--border)' }}>
            <span className="text-base">🚢</span>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'#7C3AED' }}>Demurrage Charges</h3>
            <span className="ml-auto text-[10px] font-mono" style={{ color:'var(--text3)' }}>{demurrage.length} entries · SAR {fmtNum(demTotal)}</span>
          </div>
          <ChargesTable rows={demurrage} variant="demurrage" />
        </div>
      )}

      {/* Waiting */}
      {waiting.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ background:'rgba(220,38,38,.06)', borderBottom:'1px solid var(--border)' }}>
            <span className="text-base">⏳</span>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'#DC2626' }}>Waiting Charges</h3>
            <span className="ml-auto text-[10px] font-mono" style={{ color:'var(--text3)' }}>{waiting.length} entries · SAR {fmtNum(waitTotal)}</span>
          </div>
          <ChargesTable rows={waiting} variant="waiting" />
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, count, color, icon }) {
  return (
    <div className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="text-lg font-mono font-black" style={{ color }}>{value}</div>
      <div className="text-[10px] font-mono mt-0.5" style={{ color:'var(--text3)' }}>{count} entr{count === 1 ? 'y' : 'ies'}</div>
    </div>
  )
}

function ChargesTable({ rows, variant }) {
  return (
    <table className="w-full text-[12.5px]">
      <thead style={{ background:'var(--bg2)' }}>
        <tr>
          {['Ref','Date',variant === 'demurrage' ? 'Discharge → Gate-Out' : 'Arrival → End', variant === 'demurrage' ? 'Days' : 'Hours','Rate','Amount','Notes'].map(h => (
            <th key={h} className="text-left px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(c => (
          <tr key={c.id} style={{ borderTop:'1px solid var(--border)' }}>
            <td className="px-3 py-1.5 font-mono text-[11px] font-bold" style={{ color:'var(--primary)' }}>{c.id}</td>
            <td className="px-3 py-1.5 font-mono text-[10px]" style={{ color:'var(--text3)' }}>
              {c.incidentDate ? new Date(c.incidentDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
            </td>
            <td className="px-3 py-1.5 font-mono text-[10px]" style={{ color:'var(--text2)' }}>
              {variant === 'demurrage'
                ? `${c.dischargeDate ? new Date(c.dischargeDate).toLocaleDateString('en-GB') : '—'} → ${c.gateOutDate ? new Date(c.gateOutDate).toLocaleDateString('en-GB') : '—'}`
                : `${c.arrivalTime ?? '—'} → ${c.endTime ?? '—'}`}
            </td>
            <td className="px-3 py-1.5 font-mono font-bold" style={{ color:'var(--text)' }}>
              {variant === 'demurrage' ? `${c.demurrageDays ?? c.chargedHours ?? 0}d` : `${c.chargedHours ?? 0}h`}
            </td>
            <td className="px-3 py-1.5 font-mono" style={{ color:'var(--text2)' }}>
              {variant === 'demurrage'
                ? `SAR ${fmtNum(c.demurrageRate ?? 0)}/day × ${c.containers ?? 1}`
                : `SAR ${fmtNum(c.penaltyRate ?? 0)}/h`}
            </td>
            <td className="px-3 py-1.5 font-mono font-bold" style={{ color: variant === 'demurrage' ? '#7C3AED' : '#DC2626' }}>
              SAR {fmtNum(c.totalAmount ?? 0)}
            </td>
            <td className="px-3 py-1.5 text-[10px] truncate max-w-[180px]" style={{ color:'var(--text3)' }}>{c.notes ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
