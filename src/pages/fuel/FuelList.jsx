// FuelList — centralized fuel transaction repository.
// Filters: project, fuel type, date range. Row actions: View (read-only modal),
// Edit (same modal with inputs). New: routes to /fuel/log.

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Fuel, Plus, Eye, Pencil, Filter, X, Calendar, User, Check, Search,
} from 'lucide-react'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import useFuelStore from '../../store/fuelStore'
import useToastStore from '../../store/toastStore'
import { FUEL_TYPES, FUEL_UNITS, FUEL_STATUSES, projectLabel, getProjectPOC } from '../../api/mock/fuelData'
import { PROJECTS } from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function FuelList() {
  const navigate = useNavigate()
  const { logs, updateLog, setStatus } = useFuelStore()
  const toast = useToastStore()

  const [filterProject, setFilterProject] = useState('all')
  const [filterFuelType, setFilterFuelType] = useState('all')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)   // { mode: 'view' | 'edit', log }
  const [draft, setDraft] = useState(null)

  const projectOptions = useMemo(() => [
    { id: 'all', label: 'All Projects' },
    ...PROJECTS.map(p => ({ id: p.id, label: p.name, sublabel: `${p.city}` })),
  ], [])

  const filtered = useMemo(() => {
    return logs
      .filter(l => filterProject === 'all' || l.projectId === filterProject)
      .filter(l => filterFuelType === 'all' || l.fuelType === filterFuelType)
      .filter(l => !filterFrom || l.date >= filterFrom)
      .filter(l => !filterTo   || l.date <= filterTo)
      .filter(l => {
        if (!search) return true
        const q = search.toLowerCase()
        return (l.id || '').toLowerCase().includes(q)
            || projectLabel(l.projectId).toLowerCase().includes(q)
            || (l.notes || '').toLowerCase().includes(q)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [logs, filterProject, filterFuelType, filterFrom, filterTo, search])

  // Stats
  const totals = useMemo(() => {
    const sum = filtered.reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const dieselSum = filtered.filter(l => l.fuelType === 'diesel').reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const petrolSum = filtered.filter(l => l.fuelType === 'petrol').reduce((s, l) => s + (Number(l.amount) || 0), 0)
    return { count: filtered.length, sum, dieselSum, petrolSum, pending: filtered.filter(l => l.status === 'pending').length }
  }, [filtered])

  const openView = (log) => setModal({ mode: 'view', log })
  const openEdit = (log) => { setDraft({ ...log }); setModal({ mode: 'edit', log }) }
  const closeModal = () => { setModal(null); setDraft(null) }

  const saveEdit = () => {
    if (!draft) return
    if (!(Number(draft.amount) > 0)) { toast.warning('Cannot save', 'Amount must be greater than zero', { position:'bottom-center', variant:'fuel' }); return }
    updateLog(modal.log.id, draft)
    toast.success('Fuel data updated successfully.', `${draft.id} · ${projectLabel(draft.projectId)}`, { position:'bottom-center', variant:'fuel' })
    closeModal()
  }

  const clearFilters = () => {
    setFilterProject('all'); setFilterFuelType('all'); setFilterFrom(''); setFilterTo(''); setSearch('')
  }
  const hasFilters = filterProject !== 'all' || filterFuelType !== 'all' || filterFrom || filterTo || search

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Fuel className="w-4 h-4" style={{ color: '#D97706' }} /> Fuel Logs
          </h2>
          <p className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Centralized log of all project fuel transactions</p>
        </div>
        <button onClick={() => navigate('/fuel/log')}
          className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Fuel Log
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatTile label="Logs"    value={totals.count}                                           color="#2563EB" />
        <StatTile label="Diesel"  value={`${totals.dieselSum.toLocaleString()} L`} color="#1F2937" />
        <StatTile label="Petrol"  value={`${totals.petrolSum.toLocaleString()} L`} color="#2563EB" />
        <StatTile label="Pending" value={totals.pending}                                         color="#D97706" />
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-3" style={C}>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 md:col-span-3">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Project</label>
            <Select2 size="sm" value={filterProject} onChange={v => setFilterProject(v ?? 'all')} options={projectOptions} getSubLabel={o => o.sublabel} />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Fuel Type</label>
            <Select2 size="sm" value={filterFuelType} onChange={v => setFilterFuelType(v ?? 'all')}
              options={[{ id: 'all', label: 'All Types' }, ...FUEL_TYPES.map(t => ({ id: t.id, label: t.label }))]} />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>To</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID, project, notes…"
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

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead style={{ background: 'var(--bg2)' }}>
              <tr>
                {['ID', 'Date', 'Project', 'Fuel Type', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-[12.5px]" style={{ color: 'var(--text3)' }}>
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No fuel logs match the current filters
                </td></tr>
              ) : filtered.map(l => {
                const tcfg = FUEL_TYPES.find(t => t.id === l.fuelType)
                const scfg = FUEL_STATUSES[l.status]
                const proj = PROJECTS.find(p => p.id === l.projectId)
                return (
                  <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }} className="hover:bg-[var(--bg2)]">
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: 'var(--primary)' }}>{l.id}</td>
                    <td className="px-3 py-2 font-mono">{fmtDate(l.date)}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold" style={{ color: 'var(--text)' }}>{proj?.name ?? '—'}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{proj?.city}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: tcfg?.bg, color: tcfg?.color }}>
                        {tcfg?.icon} {tcfg?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: 'var(--text)' }}>{l.amount} {l.unit}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: scfg?.bg, color: scfg?.c }}>
                        {scfg?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openView(l)} className="px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-1" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--primary)' }}>
                          <Eye className="w-3 h-3" />View
                        </button>
                        <button onClick={() => openEdit(l)} className="px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-1" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--warning)' }}>
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

      {/* View / Edit modal — same layout, fields toggle from static text to inputs */}
      {modal && (
        <FuelLogModal
          open={!!modal}
          onClose={closeModal}
          mode={modal.mode}
          log={modal.log}
          draft={draft}
          setDraft={setDraft}
          onSave={saveEdit}
          onSwitchToEdit={() => { setDraft({ ...modal.log }); setModal({ ...modal, mode: 'edit' }) }}
          onSetStatus={(status) => { setStatus(modal.log.id, status); toast.success('Status updated', `${modal.log.id} · ${FUEL_STATUSES[status]?.label}`, { position:'bottom-center', variant:'fuel' }); closeModal() }}
        />
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

function FuelLogModal({ open, onClose, mode, log, draft, setDraft, onSave, onSwitchToEdit, onSetStatus }) {
  const isEdit = mode === 'edit'
  const projectOptions = useMemo(() =>
    PROJECTS.map(p => ({ id: p.id, label: p.name, sublabel: `${p.city} · ${p.country}` })),
    [])
  const view = isEdit ? draft : log
  const tcfg = FUEL_TYPES.find(t => t.id === view?.fuelType)
  const proj = PROJECTS.find(p => p.id === view?.projectId)
  const poc = getProjectPOC(view?.projectId)
  const scfg = FUEL_STATUSES[view?.status]

  return (
    <EnterpriseModal open={open} onClose={onClose}
      title={`Fuel Log · ${log.id}`}
      subtitle={isEdit ? 'Editing log fields' : 'Read-only view'}
      icon={<Fuel className="w-4 h-4" style={{ color: '#D97706' }} />} size="lg"
      footer={
        isEdit ? (
          <>
            <ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn>
            <ModalBtn onClick={onSave}><Check className="w-3 h-3 mr-1" />Save Changes</ModalBtn>
          </>
        ) : (
          <>
            <ModalBtn variant="secondary" onClick={onClose}>Close</ModalBtn>
            {log.status === 'pending' && (
              <ModalBtn variant="success" onClick={() => onSetStatus('approved')}><Check className="w-3 h-3 mr-1" />Approve</ModalBtn>
            )}
            <ModalBtn onClick={onSwitchToEdit}><Pencil className="w-3 h-3 mr-1" />Edit</ModalBtn>
          </>
        )
      }>
      <div className="space-y-3">
        {/* Metadata */}
        <div className="rounded-lg p-2 text-[10px] flex items-center justify-between flex-wrap gap-1" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text3)' }}>Logged by <strong style={{ color: 'var(--text2)' }}>{log.loggedBy}</strong> · System Timestamp: <strong className="font-mono" style={{ color: 'var(--text2)' }}>{fmtDateTime(log.loggedAt)}</strong></span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: scfg?.bg, color: scfg?.c }}>{scfg?.label}</span>
        </div>

        {/* Project context */}
        <Field label="Target Project Context">
          {isEdit ? (
            <Select2 value={draft.projectId} onChange={v => setDraft(d => ({ ...d, projectId: v }))} options={projectOptions} getSubLabel={o => o.sublabel} />
          ) : (
            <ReadValue value={`${proj?.name ?? log.projectId} · ${proj?.city ?? ''}, ${proj?.country ?? ''}`} />
          )}
          {poc && !isEdit && (
            <div className="mt-1.5 text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text3)' }}>
              <User className="w-3 h-3" /><strong>POC:</strong> {poc.name} · <span className="font-mono">{poc.phone}</span>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-12 gap-2">
          <Field label="Transaction Date" colSpan={6}>
            {isEdit ? (
              <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            ) : <ReadValue mono value={fmtDate(log.date)} />}
          </Field>

          <Field label="Status" colSpan={6}>
            {isEdit ? (
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(FUEL_STATUSES).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setDraft(d => ({ ...d, status: k }))}
                    className="px-2 py-1.5 text-[12.5px] font-bold rounded-lg border-2"
                    style={{
                      background: draft.status === k ? v.bg : 'var(--card)',
                      borderColor: draft.status === k ? v.c : 'var(--border)',
                      color: draft.status === k ? v.c : 'var(--text2)',
                    }}>
                    {v.label}
                  </button>
                ))}
              </div>
            ) : <ReadValue value={scfg?.label} color={scfg?.c} />}
          </Field>

          <Field label="Fuel Type Classification" colSpan={6}>
            {isEdit ? (
              <div className="grid grid-cols-2 gap-1.5">
                {FUEL_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setDraft(d => ({ ...d, fuelType: t.id }))}
                    className="px-2 py-1.5 text-[12.5px] font-bold rounded-lg border-2 flex items-center justify-center gap-1"
                    style={{
                      background: draft.fuelType === t.id ? t.bg : 'var(--card)',
                      borderColor: draft.fuelType === t.id ? t.color : 'var(--border)',
                      color: draft.fuelType === t.id ? t.color : 'var(--text2)',
                    }}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            ) : <ReadValue value={`${tcfg?.icon} ${tcfg?.label}`} color={tcfg?.color} />}
          </Field>

          <Field label="Total Dispensed Volume" colSpan={6}>
            {isEdit ? (
              <div className="flex gap-2">
                <input type="number" step="0.1" min="0" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))}
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none font-mono font-bold"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                <div className="w-24">
                  <Select2 size="sm" value={draft.unit} onChange={v => setDraft(d => ({ ...d, unit: v ?? 'L' }))}
                    options={FUEL_UNITS.map(u => ({ id: u.id, label: u.label }))} />
                </div>
              </div>
            ) : <ReadValue mono value={`${log.amount} ${log.unit}`} />}
          </Field>

          <Field label="Notes" colSpan={12}>
            {isEdit ? (
              <textarea value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={2}
                className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] border focus:outline-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            ) : <ReadValue value={log.notes || '—'} />}
          </Field>
        </div>
      </div>
    </EnterpriseModal>
  )
}

function Field({ label, colSpan = 12, children }) {
  return (
    <div className={`col-span-${colSpan}`}>
      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>{label}</label>
      {children}
    </div>
  )
}
function ReadValue({ value, mono, color }) {
  return <div className="px-2.5 py-1.5 text-[12.5px] rounded-lg border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: color || 'var(--text)', fontFamily: mono ? 'JetBrains Mono, monospace' : undefined, fontWeight: mono ? 700 : 500 }}>{value}</div>
}
