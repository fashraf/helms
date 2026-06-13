import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plane, Plus, Search, LayoutGrid, List, Download, Eye, Edit3, X,
  MoreVertical, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import useProjectStore    from '../../store/projectStore'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  SHIPMENT_STATUSES_INTL, SHIPMENT_MODES, INCOTERMS,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' })
}

function StatusBadge({ status }) {
  const cfg = SHIPMENT_STATUSES_INTL[status] ?? SHIPMENT_STATUSES_INTL.draft
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function ModeBadge({ mode }) {
  const m = SHIPMENT_MODES.find(x => x.id === mode)
  if (!m) return null
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md"
    style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}>
    {m.icon} {m.label.toUpperCase()}
  </span>
}

function RowActions({ shipment, onView, onEdit, onCancel }) {
  const [open, setOpen] = useState(false)
  const canCancel = !['completed','cancelled'].includes(shipment.status)
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color:'var(--text3)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-40 rounded-xl border z-30 overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow-md)' }}>
            {[
              { icon:Eye,   label:'View', fn:onView, color:'var(--text2)' },
              { icon:Edit3, label:'Edit', fn:onEdit, color:'var(--text2)' },
              canCancel ? { icon:X, label:'Cancel', fn:onCancel, color:'var(--danger)' } : null,
            ].filter(Boolean).map(({ icon:Icon, label, fn, color }) => (
              <button key={label} onClick={() => { fn(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors" style={{ color }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onChange, total, showing }) {
  let pages = []
  if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  else if (page <= 4)              pages = [1,2,3,4,5,'…',totalPages]
  else if (page >= totalPages - 3) pages = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
  else                             pages = [1,'…',page-1,page,page+1,'…',totalPages]
  return (
    <div className="flex items-center justify-between gap-3 px-2">
      <div className="text-[11px]" style={{ color:'var(--text3)' }}>
        Showing <strong style={{ color:'var(--text)' }}>{showing}</strong> of <strong style={{ color:'var(--text)' }}>{total}</strong>
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={i} className="px-1.5 text-xs" style={{ color:'var(--text3)' }}>…</span>
          : <button key={i} onClick={() => onChange(p)} className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border"
              style={p === page ? { background:'var(--primary)', color:'#fff', borderColor:'var(--primary)' } : { background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }}>{p}</button>
        )}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function IntlShipmentList() {
  const navigate = useNavigate()
  const { filteredIntl, filter, setFilter, intlShipments, cancelShipment } = useShipmentV2Store()
  const { vendors }  = useVendorV2Store()
  const { projects } = useProjectStore()
  const { toast } = useToast()

  const [page, setPage]   = useState(1)
  const [confirmCancel, setConfirmCancel] = useState(null)

  const fullList = filteredIntl()
  useEffect(() => { setPage(1) }, [filter.search, filter.status, filter.project, filter.supplier, filter.mode])

  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const cp = Math.min(page, totalPages)
  const startIdx = (cp - 1) * PAGE_SIZE
  const list = fullList.slice(startIdx, startIdx + PAGE_SIZE)

  const stats = {
    total:      intlShipments.length,
    inProgress: intlShipments.filter(s => s.status === 'in_progress').length,
    completed:  intlShipments.filter(s => s.status === 'completed').length,
    drafts:     intlShipments.filter(s => s.status === 'draft').length,
  }

  const statusOpts = [{ id: 'all', label: 'All Status' }, ...Object.entries(SHIPMENT_STATUSES_INTL).map(([k,v]) => ({ id: k, label: v.label }))]
  const modeOpts   = [{ id: 'all', label: 'All Modes', icon: '🚢' }, ...SHIPMENT_MODES.map(m => ({ id: m.id, label: m.label, icon: m.icon }))]
  const projectOpts = [{ id: 'all', label: 'All Projects' }, ...projects.filter(p => p.status !== 'inactive').map(p => ({ id: p.id, label: p.name }))]
  const supplierOpts = [{ id: 'all', label: 'All Suppliers' }, ...vendors.filter(v => v.status === 'active').map(v => ({ id: v.id, label: v.name }))]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Plane className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>International Shipments</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{fullList.length} of {stats.total} international shipments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/shipments/intl/create')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create Shipment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total',       v:stats.total,      c:'var(--text)'    },
          { l:'In Progress', v:stats.inProgress, c:'var(--primary)' },
          { l:'Completed',   v:stats.completed,  c:'var(--success)' },
          { l:'Drafts',      v:stats.drafts,     c:'var(--text3)'   },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={filter.search} onChange={e => setFilter('search', e.target.value)}
            placeholder="Search shipment #, PO, supplier, project…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Select2 options={statusOpts}   value={filter.status}   onChange={v => setFilter('status', v ?? 'all')}   placeholder="Status…"   size="sm" />
        <Select2 options={modeOpts}     value={filter.mode}     onChange={v => setFilter('mode', v ?? 'all')}     getIcon={o => o.icon} placeholder="Mode…" size="sm" />
        <Select2 options={projectOpts}  value={filter.project}  onChange={v => setFilter('project', v ?? 'all')}  placeholder="Project…"  size="sm" />
        <Select2 options={supplierOpts} value={filter.supplier} onChange={v => setFilter('supplier', v ?? 'all')} placeholder="Supplier…" size="sm" />
      </div>

      {/* List */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Shipment #','PO Number','Supplier','Mode','Incoterm','Project','Ready Date','Status',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {list.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No shipments match your filters</td></tr>
              ) : list.map(s => {
                const supplier = vendors.find(v => v.id === s.supplier)
                const project  = projects.find(p => p.id === s.project)
                return (
                  <tr key={s.id} className="cursor-pointer transition-colors" onClick={() => navigate(`/shipments/intl/${s.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="px-4 py-3"><span className="font-mono text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>{s.id}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--text2)' }}>{s.poNumber}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color:'var(--text)' }}>{supplier?.name ?? s.supplier}</span></td>
                    <td className="px-4 py-3"><ModeBadge mode={s.mode} /></td>
                    <td className="px-4 py-3"><span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text2)' }}>{INCOTERMS.find(i => i.id === s.incoterm)?.label ?? s.incoterm}</span></td>
                    <td className="px-4 py-3"><span className="text-xs truncate max-w-[140px] inline-block" style={{ color:'var(--text2)' }}>{project?.name ?? '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.readyDate)}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <RowActions shipment={s}
                        onView={() => navigate(`/shipments/intl/${s.id}`)}
                        onEdit={() => navigate(`/shipments/intl/${s.id}/edit`)}
                        onCancel={() => setConfirmCancel(s)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t px-3 py-2.5" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
          <Pagination page={cp} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
        </div>
      </div>

      {/* Cancel confirmation */}
      {confirmCancel && (
        <EnterpriseModal open={true} onClose={() => setConfirmCancel(null)}
          title="Cancel Shipment" subtitle={confirmCancel.id}
          icon={<X className="w-4 h-4" style={{ color:'var(--danger)' }} />} size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmCancel(null)}>Keep Shipment</ModalBtn>
            <ModalBtn variant="danger" onClick={() => { cancelShipment(confirmCancel.id); toast.warning('Cancelled', `${confirmCancel.id} has been cancelled.`); setConfirmCancel(null) }}>
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
    </div>
  )
}
