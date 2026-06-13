import { useState } from 'react'
import { X, Plus, Trash2, ChevronDown, ChevronUp, Globe, Flag } from 'lucide-react'
import useWorkflowStore from '../../store/workflowStore'
import { ROLES, CURRENCIES, TIMEZONES, INCOTERMS, EXPORT_DOCS, IMPORT_DOCS, SA_BRANCHES, LOCATIONS_POOL, STEP_TYPES } from '../../api/mock/workflowData'
import { StepIcon, getStepColors, SLABadge } from './WorkflowBadges'

// ─── Field primitives ─────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">{children}</div>
)
const Field = ({ label, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}><Label>{label}</Label>{children}</div>
)
const SI = ({ value, onChange, className = '' }) => (
  <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
    className={`w-full bg-helm-750 border border-helm-600 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all ${className}`} />
)
const NI = ({ value, onChange, min = 1 }) => (
  <input type="number" value={value} min={min} onChange={(e) => onChange(Number(e.target.value))}
    className="w-full bg-helm-750 border border-helm-600 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 transition-all font-mono" />
)
const Sel = ({ value, onChange, options, children }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-helm-750 border border-helm-600 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 transition-all">
    {children ?? options?.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
)
const Toggle = ({ value, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer group py-1">
    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
    <div onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-amber-500' : 'bg-helm-600'}`}>
      <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform shadow ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
  </label>
)

// ─── Collapsible section ──────────────────────────────────────────────────────
function PanelSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-helm-700/60 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-helm-750/30 transition-colors">
        <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
      </button>
      {open && <div className="px-4 pb-3 space-y-3 animate-fade-in">{children}</div>}
    </div>
  )
}

// ─── Checklist editor ─────────────────────────────────────────────────────────
function ChecklistEditor({ stepId, items = [] }) {
  const { addChecklistItem, removeChecklistItem } = useWorkflowStore()
  const [newItem, setNewItem] = useState('')

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 group">
          <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
          <span className="flex-1 text-[11px] text-slate-400 truncate">{item}</span>
          <button onClick={() => removeChecklistItem(stepId, idx)}
            className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-all">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5 mt-2">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { addChecklistItem(stepId, newItem.trim()); setNewItem('') }}}
          placeholder="Add check item…"
          className="flex-1 bg-helm-750 border border-helm-600 rounded-md px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/40" />
        <button onClick={() => { if (newItem.trim()) { addChecklistItem(stepId, newItem.trim()); setNewItem('') } }}
          className="px-2 py-1 bg-helm-700 hover:bg-helm-600 rounded-md text-slate-300 transition-colors">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Doc multi-select ─────────────────────────────────────────────────────────
function DocSelector({ selected = [], pool, onChange }) {
  const toggle = (doc) => onChange(selected.includes(doc) ? selected.filter((d) => d !== doc) : [...selected, doc])
  return (
    <div className="space-y-1">
      {pool.map((doc) => (
        <label key={doc} className="flex items-center gap-2 cursor-pointer group py-0.5">
          <div onClick={() => toggle(doc)}
            className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all
              ${selected.includes(doc) ? 'bg-amber-500 border-amber-500' : 'border-helm-500 group-hover:border-amber-500/50'}`}>
            {selected.includes(doc) && <span className="text-helm-900 text-[8px] font-black">✓</span>}
          </div>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">{doc}</span>
        </label>
      ))}
    </div>
  )
}

// ─── Main StepConfigPanel ─────────────────────────────────────────────────────
export default function StepConfigPanel({ workflowType }) {
  const { selectedStepId, selectedStep: getSelected, updateStep, removeStep, deselectStep } = useWorkflowStore()
  const step = getSelected()

  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-helm-750 border border-helm-700 flex items-center justify-center mb-3">
          <ChevronDown className="w-5 h-5 text-helm-500 rotate-90" />
        </div>
        <p className="text-xs text-slate-600">Click a step in the canvas to configure it</p>
      </div>
    )
  }

  const upd = (k, v) => updateStep(step.id, { [k]: v })
  const colors = getStepColors(step.type)
  const isLocationMarker = step.type === 'location_marker'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-helm-700 flex-shrink-0 ${colors.bg}`}>
        <div className={`w-8 h-8 rounded-lg border ${colors.border} ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <StepIcon type={step.type} className={colors.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[9px] font-bold uppercase tracking-widest ${colors.text}`}>
            {STEP_TYPES[step.type]?.label ?? 'Step'}
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate">{step.name}</div>
        </div>
        <button onClick={deselectStep} className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable config */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Location Marker Config ──────────────────────────────────── */}
        {isLocationMarker && (
          <PanelSection title="Location Details">
            <Field label="Location Name">
              <SI value={step.locationName ?? ''} onChange={(v) => upd('locationName', v)} />
            </Field>
            <Field label="Location Type">
              <Sel value={step.locationType ?? 'waypoint'} onChange={(v) => upd('locationType', v)}>
                <option value="origin">📦 Origin / Pickup</option>
                <option value="waypoint">📍 Waypoint / Transit</option>
                <option value="destination">🏁 Final Destination</option>
              </Sel>
            </Field>
            <Field label="Location">
              <Sel value={step.locationName} onChange={(v) => upd('locationName', v)}>
                <option value="">Custom name above…</option>
                {LOCATIONS_POOL.map((l) => <option key={l} value={l}>{l}</option>)}
              </Sel>
            </Field>
            <Field label="Country / Region">
              <SI value={step.locationCountry ?? ''} onChange={(v) => upd('locationCountry', v)} />
            </Field>
          </PanelSection>
        )}

        {/* ── General (non-location) ──────────────────────────────────── */}
        {!isLocationMarker && (
          <>
            <PanelSection title="Step Identity">
              <Field label="Step Name">
                <SI value={step.name} onChange={(v) => upd('name', v)} />
              </Field>
              <Field label="Assigned Role">
                <Sel value={step.assignedRole} onChange={(v) => upd('assignedRole', v)}
                  options={ROLES.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Field label="Notes">
                <textarea value={step.notes ?? ''} onChange={(e) => upd('notes', e.target.value)}
                  rows={2} placeholder="Optional step instructions…"
                  className="w-full bg-helm-750 border border-helm-600 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 resize-none" />
              </Field>
            </PanelSection>

            <PanelSection title="SLA & Escalation">
              <div className="grid grid-cols-2 gap-2">
                <Field label="SLA (hours)"><NI value={step.slaHours} onChange={(v) => upd('slaHours', v)} /></Field>
                <Field label="Escalate after"><NI value={step.escalationHours} onChange={(v) => upd('escalationHours', v)} /></Field>
              </div>
              <Field label="Escalate To">
                <Sel value={step.escalationRole} onChange={(v) => upd('escalationRole', v)}
                  options={ROLES.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Toggle value={step.autoEscalate} onChange={(v) => upd('autoEscalate', v)} label="Auto-escalate on SLA breach" />
            </PanelSection>

            <PanelSection title="Notifications">
              <Toggle value={step.notifyOnStart}    onChange={(v) => upd('notifyOnStart', v)}    label="Notify when step starts" />
              <Toggle value={step.notifyOnComplete} onChange={(v) => upd('notifyOnComplete', v)} label="Notify on completion" />
              <Toggle value={step.notifyOnEscalate} onChange={(v) => upd('notifyOnEscalate', v)} label="Notify on escalation" />
            </PanelSection>

            {/* ── Approval-specific ──────────────────────────────── */}
            {step.type === 'approval' && (
              <PanelSection title="Approval Rules">
                <Toggle value={step.requiresApproval} onChange={(v) => upd('requiresApproval', v)} label="Require explicit approval" />
                <Field label="Approval Type">
                  <Sel value={step.approvalType ?? 'single'} onChange={(v) => upd('approvalType', v)}>
                    <option value="single">Single Approver</option>
                    <option value="any">Any Member of Role</option>
                    <option value="all">All Members Required</option>
                  </Sel>
                </Field>
              </PanelSection>
            )}

            {/* ── QA Check ──────────────────────────────────────── */}
            {step.type === 'qa_check' && (
              <PanelSection title="QA Checklist">
                <ChecklistEditor stepId={step.id} items={step.checklistItems} />
              </PanelSection>
            )}

            {/* ── Customs ──────────────────────────────────────── */}
            {step.type === 'customs' && (
              <PanelSection title="Customs Configuration">
                <Field label="Customs Direction">
                  <Sel value={step.customsType ?? 'export'} onChange={(v) => upd('customsType', v)}>
                    <option value="export">📤 Export</option>
                    <option value="import">📥 Import</option>
                    <option value="transit">🔄 Transit</option>
                  </Sel>
                </Field>
                <Field label="Incoterms">
                  <Sel value={step.incoterms ?? 'FOB'} onChange={(v) => upd('incoterms', v)}
                    options={INCOTERMS.map((t) => ({ value: t, label: t }))} />
                </Field>
                <Field label="Required Documents">
                  {(step.customsType === 'import' ? IMPORT_DOCS : EXPORT_DOCS).map((doc) => (
                    <div key={doc} className="text-[11px] text-slate-500 py-0.5">· {doc}</div>
                  ))}
                </Field>
              </PanelSection>
            )}

            {/* ── Payment / VAT ─────────────────────────────────── */}
            {step.type === 'payment' && (
              <PanelSection title="Payment & VAT" defaultOpen={workflowType === 'local'}>
                <Field label="Currency">
                  <Sel value={step.currency ?? 'SAR'} onChange={(v) => upd('currency', v)}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                    ))}
                  </Sel>
                </Field>
                <Toggle value={step.vatEnabled}    onChange={(v) => upd('vatEnabled', v)}    label="Apply Saudi VAT (15%)" />
                <Toggle value={step.arabicInvoice} onChange={(v) => upd('arabicInvoice', v)} label="Generate Arabic Invoice (فاتورة)" />
                {step.vatEnabled && (
                  <Field label="VAT Rate (%)">
                    <NI value={step.vatRate ?? 15} onChange={(v) => upd('vatRate', v)} min={0} />
                  </Field>
                )}
              </PanelSection>
            )}

            {/* ── Document ─────────────────────────────────────── */}
            {step.type === 'document' && (
              <PanelSection title="Required Documents">
                <DocSelector
                  selected={step.requiredDocs ?? []}
                  pool={[...EXPORT_DOCS, ...IMPORT_DOCS.filter((d) => !EXPORT_DOCS.includes(d))]}
                  onChange={(docs) => upd('requiredDocs', docs)}
                />
              </PanelSection>
            )}
          </>
        )}
      </div>

      {/* Footer: delete */}
      <div className="border-t border-helm-700 px-4 py-3 flex-shrink-0">
        <button
          onClick={() => { removeStep(step.id); deselectStep() }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove Step
        </button>
      </div>
    </div>
  )
}
