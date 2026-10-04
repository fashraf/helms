import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, Plus, Search, Download, Eye, Edit3, X, MoreVertical,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import useProjectStore    from '../../store/projectStore'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  SHIPMENT_STATUSES_LOCAL, SHIPMENT_TYPES_LOCAL, LOCATION_MASTER,
  CREATION_STATUS_CFG, DELIVERY_STATUS_CFG, nextLocalStep,
  OVERALL_STATUS_CFG, deriveOverallStatus,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }

function StatusBadge({ status }) {
  const cfg = SHIPMENT_STATUSES_LOCAL[status] ?? SHIPMENT_STATUSES_LOCAL.draft
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function RowActions({ shipment, onView, onEdit, onCancel }) {
  const [open, setOpen] = useState(false)
  const canCancel = !['delivered','closed','cancelled'].includes(shipment.status)
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
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}><ChevronLeft className="w-3.5 h-3.5" /></button>
        {pages.map((p, i) => p === '…' ? <span key={i} className="px-1.5 text-xs" style={{ color:'var(--text3)' }}>…</span>
          : <button key={i} onClick={() => onChange(p)} className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border"
              style={p === page ? { background:'var(--primary)', color:'#fff', borderColor:'var(--primary)' } : { background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }}>{p}</button>)}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

export default function LocalShipmentList() {
  const navigate = useNavigate()
  const { filteredLocal, filter, setFilter, localShipments, cancelShipment } = useShipmentV2Store()
  const { vendors }  = useVendorV2Store()
  const { projects } = useProjectStore()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [confirmCancel, setConfirmCancel] = useState(null)

  const fullList = filteredLocal()
  useEffect(() => { setPage(1) }, [filter.search, filter.status, filter.project, filter.supplier])

  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const cp = Math.min(page, totalPages)
  const startIdx = (cp - 1) * PAGE_SIZE
  const list = fullList.slice(startIdx, startIdx + PAGE_SIZE)

  const stats = {
    total:      localShipments.length,
    dispatched: localShipments.filter(s => s.status === 'dispatched').length,
    delivered:  localShipments.filter(s => s.status === 'delivered' || s.status === 'closed').length,
    drafts:     localShipments.filter(s => s.status === 'draft').length,
  }

  const statusOpts = [{ id: 'all', label: 'All Status' }, ...Object.entries(SHIPMENT_STATUSES_LOCAL).map(([k,v]) => ({ id: k, label: v.label }))]
  const projectOpts = [{ id: 'all', label: 'All Projects' }, ...projects.filter(p => p.status !== 'inactive').map(p => ({ id: p.id, label: p.name }))]
  const supplierOpts = [{ id: 'all', label: 'All Suppliers' }, ...vendors.filter(v => v.status === 'active').map(v => ({ id: v.id, label: v.name }))]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Truck className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Local Shipments</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{fullList.length} of {stats.total} local shipments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/shipments/local/create')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create Shipment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total',      v:stats.total,      c:'var(--text)'    },
          { l:'Dispatched', v:stats.dispatched, c:'var(--primary)' },
          { l:'Delivered',  v:stats.delivered,  c:'var(--success)' },
          { l:'Drafts',     v:stats.drafts,     c:'var(--text3)'   },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={filter.search} onChange={e => setFilter('search', e.target.value)}
            placeholder="Search shipment #, project, delivery note, PO…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select2 options={statusOpts}   value={filter.status}   onChange={v => setFilter('status', v ?? 'all')}   placeholder="Status…"   size="sm" />
        <Select2 options={projectOpts}  value={filter.project}  onChange={v => setFilter('project', v ?? 'all')}  placeholder="Project…"  size="sm" />
        <Select2 options={supplierOpts} value={filter.supplier} onChange={v => setFilter('supplier', v ?? 'all')} placeholder="Vendor…"   size="sm" />
      </div>

      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <tr>
                {['Shipment #','Project','Route','Vendor','Pipeline','Status (Creation / Delivery)','Next Step',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
              {list.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No shipments match your filters</td></tr>
              ) : list.map(s => {
                const project = projects.find(p => p.id === s.project)
                const vendor  = vendors.find(v => v.id === s.vendor || v.id === s.supplier)
                const origin  = LOCATION_MASTER.find(l => l.id === s.route?.origin?.locationId)
                const lastStop = s.route?.stops?.[s.route?.stops?.length - 1]
                const destLoc = LOCATION_MASTER.find(l => l.id === lastStop?.locationId)
                // Dual-status configs + Next Step from new data model
                const cCfg = CREATION_STATUS_CFG[s.creationStatus] ?? CREATION_STATUS_CFG.created
                const dCfg = DELIVERY_STATUS_CFG[s.deliveryStatus] ?? DELIVERY_STATUS_CFG.pending
                const next = nextLocalStep(s)
                return (
                  <tr key={s.id} className="cursor-pointer transition-colors" onClick={() => navigate(`/shipments/local/${s.id}`)}
                    style={s.isReturn ? { background: 'rgba(124,58,237,0.04)' } : {}}
                    onMouseEnter={e => e.currentTarget.style.background = s.isReturn ? 'rgba(124,58,237,0.10)' : 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = s.isReturn ? 'rgba(124,58,237,0.04)' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="font-mono text-[12.5px] font-bold" style={{ color: s.isReturn ? '#7C3AED' : 'var(--primary)' }}>{s.id}</div>
                        {s.isReturn && (
                          <span title={s.returnSource ? `Reverse logistics from ${s.returnSource}` : 'Reverse logistics shipment'}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest"
                            style={{ background:'rgba(124,58,237,.12)', color:'#7C3AED', border:'1px solid rgba(124,58,237,.3)' }}>
                            🔄 RETURN
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] mt-0.5 font-mono" style={{ color:'var(--text3)' }}>{fmtDate(s.shipmentDate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium truncate max-w-[160px]" style={{ color:'var(--text)' }}>{project?.name ?? '—'}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: s.shipmentType === 'Returned Material' ? 'var(--warning-light)' : 'var(--primary-light)', color: s.shipmentType === 'Returned Material' ? 'var(--warning)' : 'var(--primary)' }}>{s.shipmentType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-bold" style={{ color:'var(--text)' }}>{origin?.name ?? '—'}</div>
                      <div className="text-[12.5px] flex items-center gap-1" style={{ color:'var(--text3)' }}>
                        <span>→</span><span>{destLoc?.name ?? '—'}</span>
                        <span className="ml-1 px-1 py-0.5 rounded text-[8px] font-bold" style={{ background:'var(--bg2)' }}>{s.route?.stops?.length ?? 0} stops</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>{vendor?.name ?? (s.transporterMode === 'rfq' ? 'Via RFQ' : '—')}</span></td>
                    {/* Pipeline (overall status) */}
                    <td className="px-4 py-3">
                      {(() => {
                        const overall = deriveOverallStatus(s)
                        const cfg = OVERALL_STATUS_CFG[overall]
                        return (
                          <div className="inline-flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[12.5px] font-bold rounded-md" style={{ background:`${cfg.color}15`, color: cfg.color, border:`1px solid ${cfg.color}40` }}>
                              <span>{cfg.icon}</span>{cfg.label}
                            </span>
                            <span className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>Step {cfg.step}/6</span>
                          </div>
                        )
                      })()}
                    </td>
                    {/* Dual status — nested col-6/col-6 layout */}
                    <td className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-1.5 min-w-[260px]">
                        <div className="rounded-md border px-2 py-1.5" style={{ background:`${cCfg.color}10`, borderColor:`${cCfg.color}40` }}>
                          <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Creation</div>
                          <div className="text-[12.5px] font-bold flex items-center gap-1 truncate" style={{ color: cCfg.color }}>
                            <span>{cCfg.icon}</span>{cCfg.label}
                          </div>
                        </div>
                        <div className="rounded-md border px-2 py-1.5" style={{ background:`${dCfg.color}10`, borderColor:`${dCfg.color}40` }}>
                          <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Delivery</div>
                          <div className="text-[12.5px] font-bold flex items-center gap-1 truncate" style={{ color: dCfg.color }}>
                            <span>{dCfg.icon}</span>{dCfg.label}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Next Step */}
                    <td className="px-4 py-3">
                      {next.action ? (
                        <div className="rounded-md px-2 py-1.5 inline-block" style={{ background:'var(--primary-light)', border:'1px dashed rgba(37,99,235,.3)' }}>
                          <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--primary)' }}>{next.stage}</div>
                          <div className="text-[12.5px] font-bold" style={{ color:'var(--text)' }}>{next.label}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(5,150,105,.15)', color:'var(--success)' }}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> Closed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions shipment={s}
                        onView={() => navigate(`/shipments/local/${s.id}`)}
                        onEdit={() => navigate(`/shipments/local/${s.id}/edit`)}
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
