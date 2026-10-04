// Fuel Entry — split layout: log form on the left, project history on the right.
// Selecting a project on the left reveals project info card AND populates the
// right-side history list dynamically.

import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Fuel, MapPin, Phone, User, Calendar, AlertCircle, Check, Inbox, Briefcase,
} from 'lucide-react'
import Select2 from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import useFuelStore from '../../store/fuelStore'
import useToastStore from '../../store/toastStore'
import { FUEL_TYPES, FUEL_UNITS, FUEL_STATUSES, getProjectPOC, projectLabel } from '../../api/mock/fuelData'
import { PROJECTS } from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function FuelEntry() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { logs, getLogsForProject, addLog } = useFuelStore()
  const toast = useToastStore()

  const presetProject = params.get('projectId') || ''
  const [draft, setDraft] = useState({
    projectId: presetProject,
    date: todayISO(),
    fuelType: 'diesel',
    amount: '',
    unit: 'L',
  })
  const [confirmOpen, setConfirmOpen] = useState(false)

  const projectOptions = useMemo(() =>
    PROJECTS.filter(p => p.status === 'active' || p.status === 'in_review' || p.status === 'pending')
      .map(p => ({ id: p.id, label: p.name, sublabel: `${p.city} · ${p.country}` })),
    [])

  const selectedProject = PROJECTS.find(p => p.id === draft.projectId)
  const poc = useMemo(() => getProjectPOC(draft.projectId), [draft.projectId])
  const history = useMemo(() => draft.projectId ? getLogsForProject(draft.projectId) : [], [draft.projectId, logs])

  const errors = useMemo(() => {
    const e = {}
    if (!draft.projectId) e.projectId = 'Select a project'
    if (!draft.date) e.date = 'Date required'
    if (!draft.fuelType) e.fuelType = 'Fuel type required'
    const n = Number(draft.amount)
    if (!(n > 0)) e.amount = 'Amount must be greater than zero'
    return e
  }, [draft])
  const valid = Object.keys(errors).length === 0

  const handleSubmit = () => {
    if (!valid) {
      toast.warning('Cannot submit', Object.values(errors)[0], { position: 'bottom-center', variant: 'fuel' })
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    // Capture submission context BEFORE async/state changes
    const submittedAmount = draft.amount
    const submittedUnit = draft.unit
    const submittedType = FUEL_TYPES.find(t => t.id === draft.fuelType)?.label
    const submittedProject = projectLabel(draft.projectId)

    // Close modal immediately — don't wait on backend
    setConfirmOpen(false)
    // Reset amount + date so the next entry is clean
    setDraft(d => ({ ...d, amount: '', date: todayISO() }))

    // Fire-and-forget the persistence (sync in mock, but treats async semantics)
    try {
      addLog({ ...draft, status: 'pending', loggedBy: 'Admin' })
      toast.success(
        'Fuel data added successfully.',
        `${submittedAmount}${submittedUnit} of ${submittedType} · ${submittedProject}`,
        { position: 'bottom-center', variant: 'fuel' },
      )
    } catch (err) {
      toast.error(
        'Failed to add fuel log',
        err?.message || 'Could not commit to the server. Please retry.',
        { position: 'bottom-center', variant: 'fuel' },
      )
    }
  }

  const fuelTypeCfg = FUEL_TYPES.find(t => t.id === draft.fuelType)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/fuel')} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={C}>
            <ArrowLeft className="w-3.5 h-3.5" style={{ color: 'var(--text2)' }} />
          </button>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Fuel className="w-4 h-4" style={{ color: '#D97706' }} /> Log Fuel
            </h2>
            <p className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Record a fuel transaction · select project to see context and history</p>
          </div>
        </div>
        <button onClick={() => navigate('/fuel')} className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1.5" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--primary)' }}>
          <Inbox className="w-3 h-3" /> View All Fuel Logs
        </button>
      </div>

      {/* Split layout: 6 + 6 */}
      <div className="grid grid-cols-12 gap-3">
        {/* LEFT — FORM */}
        <div className="col-span-12 md:col-span-6 rounded-xl border p-4 space-y-3" style={C}>
          <div className="flex items-center gap-1.5 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Fuel className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Fuel Request Form</h3>
          </div>

          {/* Project */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: errors.projectId ? 'var(--danger)' : 'var(--text3)' }}>
              Project <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Select2 value={draft.projectId} onChange={v => setDraft(d => ({ ...d, projectId: v ?? '' }))} placeholder="Select Project…"
              options={projectOptions} getSubLabel={o => o.sublabel} />
            {/* Dynamic info card */}
            {selectedProject && (
              <div className="mt-2 rounded-lg p-2.5 animate-fade-in" style={{ background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.25)' }}>
                <div className="flex items-start gap-2">
                  <Briefcase className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#2563EB' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold" style={{ color: '#2563EB' }}>{selectedProject.name}</div>
                    <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text2)' }}>{selectedProject.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[12.5px]" style={{ color: 'var(--text3)' }}>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedProject.city}, {selectedProject.country}</span>
                      {poc && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /><strong>POC:</strong> {poc.name}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 font-mono"><Phone className="w-3 h-3" />{poc.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {errors.projectId && <p className="text-[10px] mt-1 font-bold" style={{ color: 'var(--danger)' }}>{errors.projectId}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: errors.date ? 'var(--danger)' : 'var(--text3)' }}>
              Date <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-[12.5px] border focus:outline-none font-mono"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>

          {/* Fuel Type segmented */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text3)' }}>
              Fuel Type <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FUEL_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setDraft(d => ({ ...d, fuelType: t.id }))}
                  className="px-3 py-2.5 text-[12.5px] font-bold rounded-lg border-2 flex items-center justify-center gap-1.5"
                  style={{
                    background: draft.fuelType === t.id ? t.bg : 'var(--card)',
                    borderColor: draft.fuelType === t.id ? t.color : 'var(--border)',
                    color: draft.fuelType === t.id ? t.color : 'var(--text2)',
                  }}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Unit */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: errors.amount ? 'var(--danger)' : 'var(--text3)' }}>
              Amount <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div className="flex gap-2">
              <input type="number" step="0.1" min="0" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))}
                placeholder="Enter amount in Liters/Gallons"
                className="flex-1 rounded-lg px-3 py-2 text-[12.5px] border focus:outline-none font-mono"
                style={{ background: 'var(--bg2)', borderColor: errors.amount ? 'var(--danger)' : 'var(--border)', color: 'var(--text)' }} />
              <div className="w-32">
                <Select2 size="sm" value={draft.unit} onChange={v => setDraft(d => ({ ...d, unit: v ?? 'L' }))}
                  options={FUEL_UNITS.map(u => ({ id: u.id, label: u.label }))} />
              </div>
            </div>
            {errors.amount && <p className="text-[10px] mt-1 font-bold" style={{ color: 'var(--danger)' }}>{errors.amount}</p>}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!valid}
            className="w-full px-4 py-2.5 text-[12.5px] font-bold rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'var(--primary)' }}>
            <Check className="w-3.5 h-3.5" /> Submit Log
          </button>
        </div>

        {/* RIGHT — HISTORY */}
        <div className="col-span-12 md:col-span-6 rounded-xl border p-4" style={C}>
          <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Project Fuel History</h3>
            </div>
            {selectedProject && <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{history.length} entr{history.length === 1 ? 'y' : 'ies'}</span>}
          </div>

          {!selectedProject ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--border2)' }}>
              <Inbox className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text3)' }} />
              <p className="text-[12.5px] font-bold" style={{ color: 'var(--text2)' }}>No project selected</p>
              <p className="text-[12.5px] mt-1" style={{ color: 'var(--text3)' }}>Please select a project on the left to view its historical fuel logs.</p>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--border2)' }}>
              <AlertCircle className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text3)' }} />
              <p className="text-[12.5px] font-bold" style={{ color: 'var(--text2)' }}>No logs yet</p>
              <p className="text-[12.5px] mt-1" style={{ color: 'var(--text3)' }}>Submit the form on the left to create the first log for {selectedProject.name}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0" style={{ background: 'var(--bg2)' }}>
                  <tr>
                    {['Date', 'Type', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(l => {
                    const tcfg = FUEL_TYPES.find(t => t.id === l.fuelType)
                    const scfg = FUEL_STATUSES[l.status]
                    return (
                      <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }} className="hover:bg-[var(--bg2)]">
                        <td className="px-2 py-1.5 font-mono">{fmtDate(l.date)}</td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: tcfg?.bg, color: tcfg?.color }}>
                            {tcfg?.icon} {tcfg?.label}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: 'var(--text)' }}>{l.amount} {l.unit}</td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: scfg?.bg, color: scfg?.c }}>
                            {scfg?.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      <EnterpriseModal open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="Confirm Fuel Log Details"
        subtitle={selectedProject?.name}
        icon={<Fuel className="w-4 h-4" style={{ color: '#D97706' }} />} size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</ModalBtn>
          <ModalBtn onClick={handleConfirm}><Check className="w-3 h-3 mr-1" />Confirm & Submit</ModalBtn>
        </>}>
        <div className="space-y-2 text-[12.5px]">
          <p style={{ color: 'var(--text2)' }}>
            Are you sure you want to log <strong>{draft.amount}{draft.unit}</strong> of <strong style={{ color: fuelTypeCfg?.color }}>{fuelTypeCfg?.label}</strong> for <strong>{selectedProject?.name}</strong> on <strong className="font-mono">{fmtDate(draft.date)}</strong>?
          </p>
          <div className="rounded-lg p-2.5 grid grid-cols-2 gap-1.5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div><span style={{ color: 'var(--text3)' }}>Project Target:</span> <strong style={{ color: 'var(--text)' }}>{selectedProject?.name}</strong></div>
            <div><span style={{ color: 'var(--text3)' }}>Log Date:</span> <strong className="font-mono" style={{ color: 'var(--text)' }}>{fmtDate(draft.date)}</strong></div>
            <div><span style={{ color: 'var(--text3)' }}>Fuel Allocation:</span> <strong style={{ color: fuelTypeCfg?.color }}>{draft.amount}{draft.unit} {fuelTypeCfg?.label}</strong></div>
            <div><span style={{ color: 'var(--text3)' }}>Status:</span> <strong style={{ color: FUEL_STATUSES.pending.c }}>Pending</strong></div>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
