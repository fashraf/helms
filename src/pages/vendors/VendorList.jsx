import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Plus, Search, LayoutGrid, List, Download, Eye, Edit3,
  Ban, Archive, Star, MoreVertical, RotateCcw, Mail, Phone,
  ChevronLeft, ChevronRight, AlertTriangle, Flag, Plane,
} from 'lucide-react'
import useVendorV2Store from '../../store/vendorV2Store'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  SERVICE_CATEGORIES, VENDOR_TYPES, COUNTRIES, VENDOR_STATUSES, BLACKLIST_REASONS,
} from '../../api/mock/vendorV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

function flag(code)        { return COUNTRIES.find(c=>c.code===code)?.flag ?? '🌐' }
function countryName(code) { return COUNTRIES.find(c=>c.code===code)?.name ?? code }
function relDate(iso)      { return new Date(iso).toLocaleDateString('en-SA',{year:'numeric',month:'short',day:'numeric'}) }
function scopeOf(vendor)   { return vendor.scope ?? (vendor.country === 'SA' ? 'local' : 'international') }

function StatusBadge({ status }) {
  const cfg = VENDOR_STATUSES[status] ?? VENDOR_STATUSES.inactive
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function ScopeBadge({ scope }) {
  if (scope === 'local') {
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md" style={{ background:'rgba(5,150,105,.08)', color:'var(--success)', border:'1px solid rgba(5,150,105,.2)' }}>
      <Flag className="w-2.5 h-2.5" /> LOCAL
    </span>
  }
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md" style={{ background:'rgba(37,99,235,.08)', color:'var(--primary)', border:'1px solid rgba(37,99,235,.2)' }}>
    <Plane className="w-2.5 h-2.5" /> INTERNATIONAL
  </span>
}

function Rating({ value }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="text-xs font-bold font-mono" style={{color:'var(--text)'}}>{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  )
}

// ─── Row actions (status-aware) ───────────────────────────────────────────────
function RowActions({ vendor, onView, onEdit, onBlacklist, onActivate, onArchive }) {
  const [open, setOpen] = useState(false)
  const isBlacklisted = vendor.status === 'blacklisted'
  const items = [
    { icon:Eye,     label:'View Profile', fn:onView,   color:'var(--text2)' },
    { icon:Edit3,   label:'Edit',          fn:onEdit,   color:'var(--text2)' },
    isBlacklisted
      ? { icon:RotateCcw, label:'Activate',  fn:onActivate,  color:'var(--success)' }
      : { icon:Ban,       label:'Blacklist', fn:onBlacklist, color:'var(--danger)'  },
    { icon:Archive, label:'Archive',       fn:onArchive,color:'var(--text2)' },
  ]
  return (
    <div className="relative" onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{color:'var(--text3)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
        onMouseLeave={e=>e.currentTarget.style.background=''}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={()=>setOpen(false)} />
          <div className="absolute right-0 top-8 w-44 rounded-xl border z-30 overflow-hidden animate-fade-in"
            style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow-md)'}}>
            {items.map(({icon:Icon,label,fn,color})=>(
              <button key={label} onClick={()=>{fn();setOpen(false)}}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors" style={{color}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Vendor card ──────────────────────────────────────────────────────────────
function VendorCard({ vendor, onView }) {
  return (
    <div onClick={onView} className="rounded-xl border overflow-hidden cursor-pointer transition-all group" style={C}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.borderColor='var(--border2)'}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow)';e.currentTarget.style.borderColor='var(--border)'}}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{background:'var(--primary-light)',color:'var(--primary)'}}>
              {vendor.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div>
              <div className="text-sm font-bold" style={{color:'var(--text)'}}>{vendor.name}</div>
              <div className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{vendor.code}</div>
            </div>
          </div>
          <StatusBadge status={vendor.status} />
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs flex-wrap" style={{color:'var(--text2)'}}>
          <ScopeBadge scope={scopeOf(vendor)} />
          <span>{flag(vendor.country)} {countryName(vendor.country)}</span>
          <span>·</span>
          <span>{vendor.type}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {vendor.services.slice(0,3).map(s=>{
            const svc = SERVICE_CATEGORIES.find(c=>c.id===s)
            return <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md border" style={{background:'var(--bg2)',borderColor:'var(--border)',color:'var(--text2)'}}>{svc?.icon} {svc?.label}</span>
          })}
          {vendor.services.length>3 && <span className="text-[9px] px-1.5 py-0.5" style={{color:'var(--text3)'}}>+{vendor.services.length-3}</span>}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {l:'Shipments',v:vendor.activeShipments,c:'var(--primary)'},
            {l:'RFQs',v:vendor.activeRFQs,c:'var(--warning)'},
            {l:'SLA',v:vendor.slaCompliance+'%',c:'var(--success)'},
          ].map(({l,v,c})=>(
            <div key={l} className="rounded-lg px-2 py-1.5 text-center" style={{background:'var(--bg2)'}}>
              <div className="text-sm font-bold font-mono" style={{color:c}}>{v}</div>
              <div className="text-[8px] uppercase tracking-wide" style={{color:'var(--text3)'}}>{l}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t" style={{borderColor:'var(--border)'}}>
          <Rating value={vendor.rating} />
          <div className="flex items-center gap-1 text-[12.5px]" style={{color:'var(--text3)'}}>
            <Mail className="w-3 h-3" /><span className="truncate max-w-[120px]">{vendor.primaryContact.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pagination control ───────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange, total, showing }) {
  if (totalPages <= 1 && total <= PAGE_SIZE) return (
    <div className="text-[11px] px-2" style={{ color: 'var(--text3)' }}>
      Showing {showing} of {total}
    </div>
  )

  // Build page number list (max 7 items, with ellipsis)
  let pages = []
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  } else if (page <= 4) {
    pages = [1, 2, 3, 4, 5, '…', totalPages]
  } else if (page >= totalPages - 3) {
    pages = [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  } else {
    pages = [1, '…', page - 1, page, page + 1, '…', totalPages]
  }

  return (
    <div className="flex items-center justify-between gap-3 px-2">
      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
        Showing <strong style={{ color: 'var(--text)' }}>{showing}</strong> of <strong style={{ color: 'var(--text)' }}>{total}</strong> vendors
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => (
          p === '…'
            ? <span key={i} className="px-1.5 text-xs" style={{ color: 'var(--text3)' }}>…</span>
            : <button
                key={i}
                onClick={() => onChange(p)}
                className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border transition-all"
                style={p === page
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : { background: 'var(--card)', color: 'var(--text2)', borderColor: 'var(--border)' }
                }
              >
                {p}
              </button>
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main list page ───────────────────────────────────────────────────────────
export default function VendorList() {
  const navigate = useNavigate()
  const { filteredVendors, filter, setFilter, viewMode, setViewMode, vendors, blacklistVendor, reactivateVendor, archiveVendor } = useVendorV2Store()
  const { toast } = useToast()

  const [page, setPage]                     = useState(1)
  const [confirmAction, setConfirmAction]   = useState(null) // { type: 'blacklist' | 'activate' | 'archive', vendor }
  const [blReason, setBlReason]             = useState(BLACKLIST_REASONS[0])
  const [scopeFilter, setScopeFilter]       = useState('all') // 'all' | 'local' | 'international'

  const fullList = filteredVendors().filter(v => {
    if (scopeFilter === 'all') return true
    return scopeOf(v) === scopeFilter
  })

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filter.search, filter.type, filter.country, filter.status, filter.service, scopeFilter, viewMode])

  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIdx    = (currentPage - 1) * PAGE_SIZE
  const list        = fullList.slice(startIdx, startIdx + PAGE_SIZE)

  const stats = {
    total:    vendors.length,
    active:   vendors.filter(v=>v.status==='active').length,
    pending:  vendors.filter(v=>v.status==='pending_approval').length,
    blacklisted: vendors.filter(v=>v.status==='blacklisted').length,
  }

  const pill = (active) => active
    ? { background:'var(--primary)', color:'#fff', borderColor:'var(--primary)' }
    : { background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }

  // ─── Action handlers ──────────────────────────────────────────────────
  const askConfirm = (type, vendor) => {
    setBlReason(BLACKLIST_REASONS[0])
    setConfirmAction({ type, vendor })
  }
  const performAction = () => {
    if (!confirmAction) return
    const { type, vendor } = confirmAction
    if (type === 'blacklist') {
      blacklistVendor(vendor.id, blReason)
      toast.warning('Blacklisted', `${vendor.name} has been blacklisted.`)
    } else if (type === 'activate') {
      reactivateVendor(vendor.id)
      toast.success('Reactivated', `${vendor.name} is now active.`)
    } else if (type === 'archive') {
      archiveVendor(vendor.id)
      toast.info('Archived', `${vendor.name} archived.`)
    }
    setConfirmAction(null)
  }

  // ─── Build Select2 options ────────────────────────────────────────────
  const statusOptions = [
    { id: 'all',              label: 'All Status'        },
    { id: 'active',           label: 'Active'            },
    { id: 'pending_approval', label: 'Pending Approval'  },
    { id: 'blacklisted',      label: 'Blacklisted'       },
    { id: 'inactive',         label: 'Inactive'          },
  ]
  const typeOptions = [
    { id: 'all', label: 'All Types' },
    ...VENDOR_TYPES.map(t => ({ id: t, label: t })),
  ]
  const countryOptions = [
    { id: 'all', label: 'All Countries', flag: '🌐' },
    ...COUNTRIES.map(c => ({ id: c.code, label: c.name, flag: c.flag })),
  ]
  const serviceOptions = [
    { id: 'all', label: 'All Services', icon: '🔧' },
    ...SERVICE_CATEGORIES.map(s => ({ id: s.id, label: s.label, icon: s.icon })),
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--primary-light)',border:'1px solid rgba(37,99,235,.2)'}}>
            <Building2 className="w-4.5 h-4.5" style={{color:'var(--primary)'}} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{color:'var(--text)'}}>Vendor Management</h2>
            <p className="text-[11px]" style={{color:'var(--text3)'}}>{fullList.length} of {stats.total} service providers & business partners</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{background:'var(--card)',borderColor:'var(--border)'}}>
            {[['list','List',List],['card','Cards',LayoutGrid]].map(([v,l,Icon])=>(
              <button key={v} onClick={()=>setViewMode(v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-bold transition-all"
                style={viewMode===v?{background:'var(--primary)',color:'#fff'}:{color:'var(--text3)'}}>
                <Icon className="w-3.5 h-3.5" />{l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all" style={{...C,color:'var(--text2)'}}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={()=>navigate('/vendors-v2/create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{background:'var(--primary)'}}>
            <Plus className="w-4 h-4" /> Create Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'Total Vendors',v:stats.total,c:'var(--text)'},
          {l:'Active',v:stats.active,c:'var(--success)'},
          {l:'Pending Approval',v:stats.pending,c:'var(--warning)'},
          {l:'Blacklisted',v:stats.blacklisted,c:'var(--danger)'},
        ].map(({l,v,c})=>(
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters — search + scope pills + Select2 dropdowns */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text3)'}} />
            <input value={filter.search} onChange={e=>setFilter('search',e.target.value)}
              placeholder="Search name, contact, email, mobile, reg #…"
              className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72"
              style={{background:'var(--card)',borderColor:'var(--border)',color:'var(--text)'}} />
          </div>

          {/* Scope (International / Local) */}
          {[
            ['all',           'All Scopes',     null],
            ['local',         'Local',          Flag],
            ['international', 'International',  Plane],
          ].map(([v, l, Icon]) => (
            <button key={v} onClick={() => setScopeFilter(v)}
              className="flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all" style={pill(scopeFilter === v)}>
              {Icon && <Icon className="w-3 h-3" />} {l}
            </button>
          ))}
        </div>

        {/* Select2 filters row */}
        <div className="grid grid-cols-4 gap-2">
          <Select2
            options={statusOptions}
            value={filter.status}
            onChange={v => setFilter('status', v ?? 'all')}
            placeholder="Filter status…"
            size="sm"
          />
          <Select2
            options={typeOptions}
            value={filter.type}
            onChange={v => setFilter('type', v ?? 'all')}
            placeholder="Filter type…"
            size="sm"
          />
          <Select2
            options={countryOptions}
            value={filter.country}
            onChange={v => setFilter('country', v ?? 'all')}
            getIcon={o => o.flag}
            placeholder="Filter country…"
            size="sm"
          />
          <Select2
            options={serviceOptions}
            value={filter.service}
            onChange={v => setFilter('service', v ?? 'all')}
            getIcon={o => o.icon}
            placeholder="Filter service…"
            size="sm"
          />
        </div>
      </div>

      {/* List view */}
      {viewMode==='list' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                <tr>
                  {['Code','Company','Scope','Type','Country','Primary Contact','Shipments','RFQs','Rating','Status','Created',''].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{color:'var(--text3)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{borderColor:'var(--border)'}}>
                {list.length===0 ? (
                  <tr><td colSpan={12} className="py-16 text-center text-sm" style={{color:'var(--text3)'}}>No vendors match your filters</td></tr>
                ) : list.map(v=>(
                  <tr key={v.id} className="cursor-pointer transition-colors" onClick={()=>navigate(`/vendors-v2/${v.id}`)}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td className="px-4 py-3"><span className="font-mono text-[12.5px] font-bold" style={{color:'var(--primary)'}}>{v.code}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12.5px] font-black flex-shrink-0" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                          {v.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold" style={{color:'var(--text)'}}>{v.name}</div>
                          <div className="text-[9px]" style={{color:'var(--text3)'}}>{v.services.length} services</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><ScopeBadge scope={scopeOf(v)} /></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text2)'}}>{v.type}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text2)'}}>{flag(v.country)} {countryName(v.country)}</span></td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium" style={{color:'var(--text)'}}>{v.primaryContact.name}</div>
                      <div className="text-[9px] font-mono" style={{color:'var(--text3)'}}>{v.primaryContact.email}</div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{color:'var(--text)'}}>{v.activeShipments}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono" style={{color:'var(--text2)'}}>{v.activeRFQs}</span></td>
                    <td className="px-4 py-3"><Rating value={v.rating} /></td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{relDate(v.createdAt)}</span></td>
                    <td className="px-4 py-3">
                      <RowActions vendor={v}
                        onView={()=>navigate(`/vendors-v2/${v.id}`)}
                        onEdit={()=>navigate(`/vendors-v2/${v.id}/edit`)}
                        onBlacklist={()=>askConfirm('blacklist', v)}
                        onActivate={()=>askConfirm('activate', v)}
                        onArchive={()=>askConfirm('archive', v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div className="border-t px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setPage}
              total={fullList.length}
              showing={list.length}
            />
          </div>
        </div>
      )}

      {/* Card view */}
      {viewMode==='card' && (
        <>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {list.map(v=><VendorCard key={v.id} vendor={v} onView={()=>navigate(`/vendors-v2/${v.id}`)} />)}
          </div>
          <div className="rounded-xl border px-3 py-2.5" style={C}>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setPage}
              total={fullList.length}
              showing={list.length}
            />
          </div>
        </>
      )}

      {/* ── Confirmation Modal (Blacklist / Activate / Archive) ──────────── */}
      {confirmAction && (
        <EnterpriseModal
          open={true}
          onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === 'blacklist' ? 'Confirm Blacklist Vendor'
            : confirmAction.type === 'activate' ? 'Confirm Reactivate Vendor'
            : 'Confirm Archive Vendor'
          }
          subtitle={confirmAction.vendor.name}
          icon={
            confirmAction.type === 'blacklist' ? <Ban className="w-4 h-4" style={{ color: 'var(--danger)' }} />
            : confirmAction.type === 'activate' ? <RotateCcw className="w-4 h-4" style={{ color: 'var(--success)' }} />
            : <Archive className="w-4 h-4" style={{ color: 'var(--text3)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={confirmAction.type === 'blacklist' ? 'danger' : confirmAction.type === 'activate' ? 'success' : 'primary'}
              onClick={performAction}
            >
              {confirmAction.type === 'blacklist' ? 'Yes, Blacklist Vendor'
                : confirmAction.type === 'activate' ? 'Yes, Reactivate Vendor'
                : 'Yes, Archive Vendor'}
            </ModalBtn>
          </>}
        >
          <div className="space-y-4">
            {/* Warning block */}
            <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{
              background: confirmAction.type === 'blacklist' ? 'var(--danger-light)'
                : confirmAction.type === 'activate' ? 'rgba(5,150,105,.06)'
                : 'var(--bg2)',
              borderColor: confirmAction.type === 'blacklist' ? 'rgba(220,38,38,.3)'
                : confirmAction.type === 'activate' ? 'rgba(5,150,105,.25)'
                : 'var(--border)',
            }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{
                color: confirmAction.type === 'blacklist' ? 'var(--danger)'
                  : confirmAction.type === 'activate' ? 'var(--success)'
                  : 'var(--text3)'
              }} />
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                {confirmAction.type === 'blacklist' && <>This vendor will no longer receive RFQs or be assignable to shipments, and will be highlighted as blacklisted across the system. This action is recorded in the audit trail.</>}
                {confirmAction.type === 'activate'  && <>This vendor will be reactivated and will once again be eligible for RFQs and shipment assignments. The previous blacklist reason will remain in the audit history.</>}
                {confirmAction.type === 'archive'   && <>The vendor will be marked Inactive. No data will be deleted — they can be reactivated later.</>}
              </p>
            </div>

            {/* Vendor summary card */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg2)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {confirmAction.vendor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{confirmAction.vendor.name}</div>
                  <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--text3)' }}>
                    <span className="font-mono">{confirmAction.vendor.code}</span> ·
                    <ScopeBadge scope={scopeOf(confirmAction.vendor)} /> ·
                    <StatusBadge status={confirmAction.vendor.status} />
                  </div>
                </div>
              </div>
              {/* Mini stats */}
              <div className="grid grid-cols-3 divide-x px-1" style={{ borderColor: 'var(--border)' }}>
                {[
                  { l: 'Active Ships', v: confirmAction.vendor.activeShipments },
                  { l: 'Active RFQs',   v: confirmAction.vendor.activeRFQs      },
                  { l: 'Rating',        v: (confirmAction.vendor.rating || 0).toFixed(1) + ' ★' },
                ].map(({ l, v }) => (
                  <div key={l} className="px-3 py-2 text-center">
                    <div className="text-base font-bold font-mono" style={{ color: 'var(--text)' }}>{v}</div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blacklist reason selector */}
            {confirmAction.type === 'blacklist' && (
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text3)' }}>
                  Blacklist Reason *
                </label>
                <Select2
                  options={BLACKLIST_REASONS.map(r => ({ id: r, label: r }))}
                  value={blReason}
                  onChange={v => setBlReason(v)}
                  placeholder="Select reason…"
                />
              </div>
            )}
          </div>
        </EnterpriseModal>
      )}
    </div>
  )
}
