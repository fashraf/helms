// Waiting Charges List — financial ledger grid
// Filters: project, delay reason. Each row → View modal / Edit (navigates to create with editId).

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Plus, Eye, Pencil, Filter, X, Calendar, Search, AlertTriangle, MapPin, User, DollarSign,
} from 'lucide-react'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import useWaitingChargeStore from '../../store/waitingChargeStore'
import { DELAY_REASONS, getSiteMetrics } from '../../api/mock/waitingChargeData'
import { PROJECTS } from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function WaitingChargesList() {
  const navigate = useNavigate()
  const { charges } = useWaitingChargeStore()

  const [filterProject, setFilterProject] = useState('all')
  const [filterReason, setFilterReason] = useState('all')
  const [search, setSearch] = useState('')
  const [viewModal, setViewModal] = useState(null)

  const projectOptions = useMemo(() => [
    { id: 'all', label: 'All Projects' },
    ...PROJECTS.map(p => ({ id: p.id, label: p.name, sublabel: p.city })),
  ], [])

  const filtered = useMemo(() => charges
    .filter(c => filterProject === 'all' || c.projectId === filterProject)
    .filter(c => filterReason === 'all' || c.delayReason === filterReason)
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return (c.id || '').toLowerCase().includes(q)
          || (c.shipmentId || '').toLowerCase().includes(q)
          || (c.customReason || '').toLowerCase().includes(q)
    })
    .sort((a, b) => new Date(b.incidentDate) - new Date(a.incidentDate))
  , [charges, filterProject, filterReason, search])

  const totals = useMemo(() => {
    const totalFine = filtered.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0)
    const totalHrs  = filtered.reduce((s, c) => s + (Number(c.chargedHours) || 0), 0)
    return { count: filtered.length, totalFine, totalHrs }
  }, [filtered])

  const clearFilters = () => { setFilterProject('all'); setFilterReason('all'); setSearch('') }
  const hasFilters = filterProject !== 'all' || filterReason !== 'all' || search

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Clock className="w-4 h-4" style={{ color: '#DC2626' }} /> Charges
          </h2>
          <p className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Multi-project shipment delay penalties · auditing ledger</p>
        </div>
        <button onClick={() => navigate('/waiting-charges/create')}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5"
          style={{ background: '#DC2626' }}>
          <Plus className="w-3.5 h-3.5" /> Add New Charge
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Incidents"      value={totals.count}                                              color="#2563EB" />
        <StatTile label="Hours Charged"  value={`${totals.totalHrs.toFixed(1)} h`}                         color="#D97706" />
        <StatTile label="Total Fines"    value={`SAR ${fmtMoney(totals.totalFine)}`}                       color="#DC2626" />
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-3" style={C}>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 md:col-span-4">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Project</label>
            <Select2 size="sm" value={filterProject} onChange={v => setFilterProject(v ?? 'all')} options={projectOptions} getSubLabel={o => o.sublabel} />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Delay Trigger</label>
            <Select2 size="sm" value={filterReason} onChange={v => setFilterReason(v ?? 'all')}
              options={[{ id: 'all', label: 'All Reasons' }, ...DELAY_REASONS.map(r => ({ id: r.id, label: `${r.icon} ${r.label}` }))]} />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID, shipment, custom reason…"
                className="w-full rounded-lg pl-7 pr-3 py-1.5 text-[12.5px] border focus:outline-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>
          {hasFilters && (
            <div className="col-span-12 flex items-center justify-end">
              <button onClick={clearFilters} className="px-2.5 py-1 text-[12.5px] font-bold rounded-lg flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                <X className="w-3 h-3" /> Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ledger table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead style={{ background: 'var(--bg2)' }}>
              <tr>
                {['ID', 'Incident Date', 'Project', 'Delay Reason', 'Hours Charged', 'Total Fine', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-[12.5px]" style={{ color: 'var(--text3)' }}>
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No waiting charges match the current filters
                </td></tr>
              ) : filtered.map(c => {
                const reason = DELAY_REASONS.find(r => r.id === c.delayReason)
                const proj = PROJECTS.find(p => p.id === c.projectId)
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }} className="hover:bg-[var(--bg2)]">
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: 'var(--primary)' }}>{c.id}</td>
                    <td className="px-3 py-2 font-mono">{fmtDate(c.incidentDate)}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold" style={{ color: 'var(--text)' }}>{proj?.name ?? '—'}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{proj?.city}{c.shipmentId && ` · ${c.shipmentId}`}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${reason?.color ?? '#6B7280'}15`, color: reason?.color ?? '#6B7280' }}>
                        {reason?.icon} {reason?.label}
                      </span>
                      {c.delayReason === 'other' && c.customReason && (
                        <div className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text3)' }}>"{c.customReason}"</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: c.chargedHours > 0 ? '#D97706' : '#059669' }}>
                      {c.chargedHours} h
                      <div className="text-[10px] font-normal" style={{ color: 'var(--text3)' }}>{c.elapsedHours}h − {c.freeHours}h free</div>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: c.totalAmount > 0 ? '#DC2626' : '#059669' }}>
                      {c.currency} {fmtMoney(c.totalAmount)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewModal(c)} className="px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-1" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--primary)' }}>
                          <Eye className="w-3 h-3" />View
                        </button>
                        <button onClick={() => navigate(`/waiting-charges/create?editId=${c.id}`)} className="px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-1" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--warning)' }}>
                          <Pencil className="w-3 h-3" />Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View modal */}
      {viewModal && (
        <ChargeViewModal open={!!viewModal} onClose={() => setViewModal(null)} charge={viewModal}
          onEdit={() => { const id = viewModal.id; setViewModal(null); navigate(`/waiting-charges/create?editId=${id}`) }} />
      )}
    </div>
  )
}

function StatTile({ label, value, color }) {
  return (
    <div className="rounded-lg border p-2.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-base font-mono font-bold mt-0.5" style={{ color }}>{value}</div>
    </div>
  )
}

function ChargeViewModal({ open, onClose, charge, onEdit }) {
  const reason = DELAY_REASONS.find(r => r.id === charge.delayReason)
  const proj = PROJECTS.find(p => p.id === charge.projectId)
  const site = getSiteMetrics(charge.projectId)

  return (
    <EnterpriseModal open={open} onClose={onClose}
      title={`Charge · ${charge.id}`}
      subtitle={proj ? `${proj.name} · ${fmtDate(charge.incidentDate)}` : '—'}
      icon={<Clock className="w-4 h-4" style={{ color: '#DC2626' }} />} size="lg"
      footer={<>
        <ModalBtn variant="secondary" onClick={onClose}>Close</ModalBtn>
        <ModalBtn onClick={onEdit}><Pencil className="w-3 h-3 mr-1" />Edit</ModalBtn>
      </>}>
      <div className="space-y-3 text-[12.5px]">
        {/* Project context */}
        {site && (
          <div className="rounded-lg p-2.5 flex items-center gap-3 flex-wrap" style={{ background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.25)' }}>
            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: '#2563EB' }}>
              <MapPin className="w-3.5 h-3.5" />{site.siteLocation}
            </span>
            <span style={{ color: 'var(--text3)' }}>|</span>
            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: '#2563EB' }}>
              <User className="w-3.5 h-3.5" />Supervisor: <span style={{ color: 'var(--text)' }}>{site.supervisor}</span>
            </span>
            {charge.shipmentId && (
              <>
                <span style={{ color: 'var(--text3)' }}>|</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--card)', color: 'var(--text2)' }}>{charge.shipmentId}</span>
              </>
            )}
          </div>
        )}

        {/* Delay reason */}
        <div className="rounded-lg p-2.5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Delay Reason</div>
          <div className="font-bold flex items-center gap-1.5" style={{ color: reason?.color }}>
            <span className="text-base">{reason?.icon}</span>{reason?.label}
          </div>
          {charge.delayReason === 'other' && charge.customReason && (
            <p className="mt-1 italic" style={{ color: 'var(--text2)' }}>"{charge.customReason}"</p>
          )}
        </div>

        {/* Time matrix */}
        <div className="grid grid-cols-4 gap-2">
          <ReadTile label="Arrival" value={charge.arrivalTime} />
          <ReadTile label="Free Hrs" value={`${charge.freeHours} h`} />
          <ReadTile label="End" value={charge.endTime} />
          <ReadTile label="Charged" value={`${charge.chargedHours} h`} accent={charge.chargedHours > 0 ? '#DC2626' : '#059669'} />
        </div>

        {/* Financial */}
        <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.3)' }}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
            <span className="font-bold" style={{ color: '#DC2626' }}>Total Fine</span>
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>· {charge.chargedHours}h × {charge.currency} {fmtMoney(charge.penaltyRate)}/h</span>
          </div>
          <span className="text-xl font-mono font-black" style={{ color: '#DC2626' }}>{charge.currency} {fmtMoney(charge.totalAmount)}</span>
        </div>

        {charge.notes && (
          <div className="rounded-lg p-2.5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Notes</div>
            <p style={{ color: 'var(--text2)' }}>{charge.notes}</p>
          </div>
        )}

        <div className="text-[10px] flex items-center gap-2" style={{ color: 'var(--text3)' }}>
          <Calendar className="w-3 h-3" /> Created by <strong style={{ color: 'var(--text2)' }}>{charge.createdBy}</strong> on <span className="font-mono">{new Date(charge.createdAt).toLocaleString('en-GB')}</span>
        </div>
      </div>
    </EnterpriseModal>
  )
}

function ReadTile({ label, value, accent }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="font-mono font-bold mt-0.5" style={{ color: accent || 'var(--text)' }}>{value}</div>
    </div>
  )
}
