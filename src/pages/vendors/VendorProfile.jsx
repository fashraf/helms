import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Edit3, Ban, Archive, Globe, MapPin, Phone, Mail,
  Package, FileText, Award, ScrollText, History, Briefcase, Layers,
  CheckCircle2, AlertTriangle, XCircle, Clock, Upload, Download, Eye,
  TrendingUp, Star, ShieldCheck,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts'
import useVendorV2Store from '../../store/vendorV2Store'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  VendorStatusBadge, StarRating, CountryFlag, ServiceChip, relTime, fmtDate, fmtMoney,
} from '../../components/vendors/VendorV2Badges'
import {
  RATING_CATEGORIES, SERVICE_CATEGORIES, COUNTRIES, BLACKLIST_REASONS,
} from '../../api/mock/vendorV2Data'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }

const TABS = [
  { id: 'overview',  label: 'Overview',         icon: Layers     },
  { id: 'services',  label: 'Services',         icon: Globe      },
  { id: 'documents', label: 'Documents',        icon: FileText   },
  { id: 'shipments', label: 'Shipments',        icon: Package    },
  { id: 'rfqs',      label: 'RFQs',             icon: Briefcase  },
  { id: 'contracts', label: 'Contracts',        icon: ScrollText },
  { id: 'ratings',   label: 'Ratings & Reviews', icon: Award     },
  { id: 'audit',     label: 'Audit History',    icon: History    },
]

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text2)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text2)' }}>{p.name}:</span>
          <span className="font-bold" style={{ color: 'var(--text)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function KPI({ label, value, color = 'var(--text)', icon: Icon, sub }) {
  return (
    <div className="rounded-xl border p-4" style={C}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
      </div>
      <div className="text-2xl font-black font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

const DOC_STATUS = {
  valid:         { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Valid',         icon: CheckCircle2 },
  expiring_soon: { cls: 'text-amber-600 bg-amber-50 border-amber-200',       label: 'Expiring Soon', icon: AlertTriangle },
  expired:       { cls: 'text-red-600 bg-red-50 border-red-200',             label: 'Expired',       icon: XCircle },
}

const SHIP_STATUS = {
  Completed:    'text-emerald-600 bg-emerald-50 border-emerald-200',
  'In Transit': 'text-blue-600 bg-blue-50 border-blue-200',
  Delayed:      'text-red-600 bg-red-50 border-red-200',
  Pending:      'text-slate-500 bg-slate-50 border-slate-200',
}

export default function VendorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getVendor, blacklistVendor, reactivateVendor, archiveVendor } = useVendorV2Store()
  const { toast } = useToast()
  const [tab, setTab] = useState('overview')
  const [blacklistModal, setBlacklistModal] = useState(false)
  const [reactivateModal, setReactivateModal] = useState(false)
  const [blReason, setBlReason] = useState(BLACKLIST_REASONS[0])

  const vendor = getVendor(id)
  if (!vendor) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Building2 className="w-12 h-12" style={{ color: 'var(--text3)' }} />
      <p className="text-sm" style={{ color: 'var(--text3)' }}>Vendor <span className="font-mono" style={{ color: 'var(--primary)' }}>{id}</span> not found</p>
      <button onClick={() => navigate('/vendors-v2')} className="text-xs font-medium" style={{ color: 'var(--primary)' }}>← Back to Vendor List</button>
    </div>
  )

  const isBlacklisted = vendor.status === 'blacklisted'

  return (
    <div className="space-y-4">
      <BlockUI />

      {/* Blacklist banner */}
      {isBlacklisted && (
        <div className="rounded-xl border p-3 flex items-center gap-3" style={{ background: 'var(--danger-light)', borderColor: 'rgba(220,38,38,.3)' }}>
          <Ban className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--danger)' }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>This vendor is blacklisted</p>
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              Reason: {vendor.blacklistReason} · Cannot receive RFQs or be assigned to shipments · Since {fmtDate(vendor.blacklistedAt)}
            </p>
          </div>
          <button onClick={() => setReactivateModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background: 'var(--success)' }}>
            Reactivate
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendors-v2')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text2)' }} />
          </button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            {vendor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{vendor.name}</h2>
              <VendorStatusBadge status={vendor.status} />
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text3)' }}>
              <span className="font-mono" style={{ color: 'var(--primary)' }}>{vendor.code}</span>
              <span>·</span>
              <CountryFlag code={vendor.country} />
              <span>·</span>
              <span>{vendor.type}</span>
              <span>·</span>
              <StarRating value={vendor.rating} size={12} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/vendors-v2/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          {!isBlacklisted && (
            <button onClick={() => setBlacklistModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border text-red-600 transition-all" style={C}>
              <Ban className="w-3.5 h-3.5" /> Blacklist
            </button>
          )}
          <button onClick={() => { archiveVendor(vendor.id); toast.info('Archived', `${vendor.name} archived.`) }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap"
              style={tab === t.id ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'transparent', color: 'var(--text3)' }}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ─── TAB 1: Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-6 gap-3">
            <KPI label="Active Shipments"    value={vendor.activeShipments}    color="var(--primary)" icon={Package} />
            <KPI label="Completed"           value={vendor.completedShipments} color="var(--success)" icon={CheckCircle2} />
            <KPI label="Active RFQs"         value={vendor.activeRFQs}         color="var(--warning)" icon={Briefcase} />
            <KPI label="Contracts"           value={vendor.contracts.length}   color="var(--purple)"  icon={ScrollText} />
            <KPI label="Avg Rating"          value={vendor.rating.toFixed(1)}  color="#D97706"        icon={Star} />
            <KPI label="SLA Compliance"      value={vendor.slaCompliance + '%'} color="var(--cyan)"   icon={ShieldCheck} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Summary card */}
            <div className="col-span-2 rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Company Summary</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ['Company Name', vendor.name],
                  ['Legal Name', vendor.legalName],
                  ['Vendor Code', vendor.code],
                  ['Vendor Type', vendor.type],
                  ['Registration #', vendor.regNumber],
                  ['VAT Number', vendor.vatNumber],
                  ['Website', vendor.website],
                  ['City', vendor.city],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text3)' }}>{l}</div>
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{v || '—'}</div>
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Address</div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{vendor.address}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>Services</div>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.services.map(s => <ServiceChip key={s} serviceId={s} />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary contact */}
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Primary Contact</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {vendor.primaryContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{vendor.primaryContact.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{vendor.primaryContact.title}</div>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text2)' }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} /> {vendor.primaryContact.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text2)' }}>
                    <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} /> {vendor.primaryContact.mobile}
                  </div>
                  {vendor.primaryContact.office && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text2)' }}>
                      <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} /> {vendor.primaryContact.office}
                    </div>
                  )}
                </div>
                {vendor.secondaryContact && (
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Secondary</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{vendor.secondaryContact.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{vendor.secondaryContact.email}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Services ─────────────────────────────────────────── */}
      {tab === 'services' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Services Provided</h3>
            </div>
            <div className="p-4 space-y-2">
              {vendor.services.map(s => {
                const svc = SERVICE_CATEGORIES.find(c => c.id === s)
                return (
                  <div key={s} className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                    <span className="text-xl">{svc?.icon}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{svc?.label}</span>
                    <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Countries Served</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {vendor.countriesServed.map(c => (
                  <span key={c} className="px-2.5 py-1.5 rounded-lg border text-xs" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                    <CountryFlag code={c} />
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border overflow-hidden" style={C}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Regions Served</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {vendor.regionsServed.map(r => (
                  <span key={r} className="px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1" style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
                    <MapPin className="w-3 h-3" style={{ color: 'var(--text3)' }} /> {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Documents ────────────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--border2)', background: 'var(--bg2)' }}>
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text3)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Drag & drop documents here, or click to browse</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>PDF, JPG, PNG up to 10MB</p>
          </div>
          {/* Expiry alerts */}
          {vendor.documents.some(d => d.status !== 'valid') && (
            <div className="rounded-xl border p-3 flex items-center gap-2.5" style={{ background: 'var(--warning-light)', borderColor: 'rgba(217,119,6,.3)' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--warning)' }} />
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                <strong>{vendor.documents.filter(d => d.status === 'expired').length} expired</strong> and{' '}
                <strong>{vendor.documents.filter(d => d.status === 'expiring_soon').length} expiring soon</strong> — review required
              </p>
            </div>
          )}
          {/* Doc table */}
          <div className="rounded-xl border overflow-hidden" style={C}>
            <table className="w-full">
              <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <tr>
                  {['Document Type', 'File', 'Version', 'Uploaded', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {vendor.documents.map(doc => {
                  const ds = DOC_STATUS[doc.status]
                  const DsIcon = ds.icon
                  return (
                    <tr key={doc.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{doc.type}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{doc.fileName}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color: 'var(--text2)' }}>v{doc.version}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{relTime(doc.uploadedAt)}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: doc.status === 'expired' ? 'var(--danger)' : 'var(--text2)' }}>{fmtDate(doc.expiryDate)}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${ds.cls}`}>
                          <DsIcon className="w-3 h-3" /> {ds.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="w-6 h-6 flex items-center justify-center rounded transition-all" style={{ color: 'var(--text3)' }}><Eye className="w-3.5 h-3.5" /></button>
                          <button className="w-6 h-6 flex items-center justify-center rounded transition-all" style={{ color: 'var(--text3)' }}><Download className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Shipments ────────────────────────────────────────── */}
      {tab === 'shipments' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <table className="w-full">
            <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <tr>
                {['Shipment ID', 'Customer', 'Route', 'Vendor Role', 'Status', 'ETA', 'Delivery', 'Performance'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {vendor.shipments.map(s => (
                <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{s.id}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text)' }}>{s.customer}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{s.route}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{s.role}</span></td>
                  <td className="px-4 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${SHIP_STATUS[s.status]}`}>{s.status}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{fmtDate(s.eta)}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{fmtDate(s.deliveryDate)}</span></td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-bold" style={{ color: s.perfScore >= 90 ? 'var(--success)' : s.perfScore >= 80 ? 'var(--primary)' : 'var(--warning)' }}>{s.perfScore}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 5: RFQs ─────────────────────────────────────────────── */}
      {tab === 'rfqs' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <table className="w-full">
            <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <tr>
                {['RFQ Number', 'Date', 'Bid Amount', 'Awarded', 'Status', 'Comments'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {vendor.rfqs.map(r => (
                <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{r.id}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{fmtDate(r.date)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-mono font-semibold" style={{ color: 'var(--text)' }}>{fmtMoney(r.bidAmount)}</span></td>
                  <td className="px-4 py-3">
                    {r.awarded
                      ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      : <span className="text-[9px] font-bold" style={{ color: 'var(--text3)' }}>No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${r.status === 'Awarded' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : r.status === 'Lost' ? 'text-red-600 bg-red-50 border-red-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text3)' }}>{r.comments}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 6: Contracts ────────────────────────────────────────── */}
      {tab === 'contracts' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <table className="w-full">
            <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <tr>
                {['Contract Number', 'Start Date', 'End Date', 'Renewal Date', 'Value', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {vendor.contracts.map(ct => (
                <tr key={ct.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>{ct.number}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text2)' }}>{fmtDate(ct.startDate)}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: ct.status === 'expired' ? 'var(--danger)' : 'var(--text2)' }}>{fmtDate(ct.endDate)}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{fmtDate(ct.renewalDate)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-mono font-semibold" style={{ color: 'var(--text)' }}>{fmtMoney(ct.value)}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${ct.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : ct.status === 'expiring' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200'}`}>{ct.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 7: Ratings & Reviews ────────────────────────────────── */}
      {tab === 'ratings' && (
        <div className="grid grid-cols-3 gap-4">
          {/* Overall */}
          <div className="rounded-xl border p-5 text-center" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>Overall Rating</div>
            <div className="text-5xl font-black font-mono mb-2" style={{ color: '#D97706' }}>{vendor.rating.toFixed(1)}</div>
            <div className="flex justify-center mb-2"><StarRating value={vendor.rating} size={18} showValue={false} /></div>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Based on {vendor.ratings.totalReviews} reviews</div>
          </div>

          {/* Category breakdown */}
          <div className="col-span-2 rounded-xl border overflow-hidden" style={C}>
            <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Category Breakdown (Weighted Formula)</h3>
            </div>
            <div className="p-4 space-y-3">
              {RATING_CATEGORIES.map(cat => {
                const val = vendor.ratings.categories[cat.id] ?? 0
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="w-40 flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{cat.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>{cat.weight}%</span>
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(val / 5) * 100}%`, background: val >= 4.5 ? 'var(--success)' : val >= 4 ? 'var(--primary)' : 'var(--warning)' }} />
                    </div>
                    <span className="text-xs font-bold font-mono w-8 text-right" style={{ color: 'var(--text)' }}>{val.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly trend */}
          <div className="col-span-3 rounded-xl border overflow-hidden" style={C}>
            <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Rating Trend (6 Months)</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={vendor.ratings.trend} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D97706" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[3, 5]} tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="rating" name="Rating" stroke="#D97706" strokeWidth={2.5} fill="url(#gRating)" dot={{ fill: '#D97706', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 8: Audit History ────────────────────────────────────── */}
      {tab === 'audit' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Audit Trail</h3>
          </div>
          <table className="w-full">
            <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <tr>
                {['Date', 'User', 'Action', 'Field', 'Old Value', 'New Value'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {vendor.auditHistory.map(a => (
                <tr key={a.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{new Date(a.date).toLocaleString('en-SA', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text)' }}>{a.user}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>{a.action}</span></td>
                  <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{a.field ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color: 'var(--danger)' }}>{a.old ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color: 'var(--success)' }}>{a.new ?? '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blacklist modal */}
      <EnterpriseModal open={blacklistModal} onClose={() => setBlacklistModal(false)}
        title="Blacklist Vendor"
        subtitle={vendor.name}
        icon={<Ban className="w-4 h-4 text-red-500" />}
        size="sm"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setBlacklistModal(false)}>Cancel</ModalBtn>
          <ModalBtn variant="danger" onClick={() => { blacklistVendor(vendor.id, blReason); toast.warning('Blacklisted', `${vendor.name} has been blacklisted.`); setBlacklistModal(false) }}>Confirm Blacklist</ModalBtn>
        </>}>
        <div className="space-y-4">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background: 'var(--danger-light)', borderColor: 'rgba(220,38,38,.3)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              Blacklisting will prevent this vendor from receiving RFQs or being assigned to shipments. They will be highlighted across the system.
            </p>
          </div>
          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text3)' }}>Blacklist Reason *</label>
            <select value={blReason} onChange={e => setBlReason(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {BLACKLIST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </EnterpriseModal>

      {/* Reactivate confirmation modal */}
      <EnterpriseModal open={reactivateModal} onClose={() => setReactivateModal(false)}
        title="Confirm Reactivate Vendor"
        subtitle={vendor.name}
        icon={<ShieldCheck className="w-4 h-4" style={{ color: 'var(--success)' }} />}
        size="sm"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setReactivateModal(false)}>Cancel</ModalBtn>
          <ModalBtn variant="success" onClick={() => { reactivateVendor(vendor.id); toast.success('Reactivated', `${vendor.name} is now active.`); setReactivateModal(false) }}>
            Yes, Reactivate Vendor
          </ModalBtn>
        </>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background: 'rgba(5,150,105,.06)', borderColor: 'rgba(5,150,105,.25)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              This vendor will be reactivated and once again eligible to receive RFQs and be assigned to shipments. The previous blacklist reason (<strong>{vendor.blacklistReason}</strong>) will remain visible in the audit history.
            </p>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
