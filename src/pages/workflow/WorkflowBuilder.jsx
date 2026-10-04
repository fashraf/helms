import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Play, Settings2, X, Globe, Flag,
  Zap, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react'
import useWorkflowStore     from '../../store/workflowStore'
import { useToast }         from '../../hooks/useToast'
import { TEMPLATES, SA_BRANCHES, CURRENCIES, TIMEZONES, INCOTERMS } from '../../api/mock/workflowData'
import StepPalette          from '../../components/workflow/StepPalette'
import WorkflowCanvas       from '../../components/workflow/WorkflowCanvas'
import StepConfigPanel      from '../../components/workflow/StepConfigPanel'
import { WFStatusBadge, WFTypeBadge } from '../../components/workflow/WorkflowBadges'

// ─── Template picker modal ────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-helm-950/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-helm-800 border border-helm-600 rounded-2xl shadow-card-hover w-[520px] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-helm-700">
          <div>
            <h3 className="text-sm font-bold text-white">Start from Template</h3>
            <p className="text-xs text-slate-500 mt-0.5">Choose a pre-configured workflow or start blank</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <button
              key={key}
              onClick={() => { onSelect(key); onClose() }}
              className="flex flex-col items-start gap-2 p-4 bg-helm-750 hover:bg-helm-700 border border-helm-600 hover:border-amber-500/40 rounded-xl transition-all text-left"
            >
              <div className="text-2xl">{tmpl.icon}</div>
              <div>
                <div className="text-sm font-semibold text-slate-200">{tmpl.name}</div>
                <div className={`text-[9px] font-bold tracking-widest mt-0.5 ${tmpl.type === 'international' ? 'text-purple-400' : 'text-teal-400'}`}>
                  {tmpl.type.toUpperCase()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{tmpl.description}</div>
              </div>
              <div className="text-[12.5px] text-slate-600 font-mono">
                {tmpl.steps().filter((s) => s.type !== 'location_marker').length} steps ·{' '}
                {tmpl.steps().filter((s) => s.type === 'location_marker').length} locations
              </div>
            </button>
          ))}
          {/* Blank option */}
          <button
            onClick={() => { onSelect(null); onClose() }}
            className="flex flex-col items-start gap-2 p-4 bg-helm-750 hover:bg-helm-700 border border-dashed border-helm-600 hover:border-helm-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl">📄</div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Blank Workflow</div>
              <div className="text-[9px] font-bold tracking-widest mt-0.5 text-slate-500">CUSTOM</div>
              <div className="text-[11px] text-slate-500 mt-1.5">Start with an empty canvas and build from scratch.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Workflow settings bar ────────────────────────────────────────────────────
function SettingsBar({ draft, type }) {
  const { setDraftField, setDraftConfig } = useWorkflowStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-helm-700 bg-helm-850/50 flex-shrink-0">
      {/* Row 1: Name + type toggle */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <input
          value={draft.name}
          onChange={(e) => setDraftField('name', e.target.value)}
          className="flex-1 bg-transparent text-sm font-bold text-white placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-amber-500/50 pb-0.5 transition-all max-w-xs"
          placeholder="Workflow name…"
        />
        {/* Type switcher */}
        <div className="flex items-center bg-helm-800 border border-helm-600 rounded-lg p-0.5">
          {['local', 'international'].map((t) => (
            <button key={t} onClick={() => setDraftField('type', t)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12.5px] font-bold tracking-wider transition-all
                ${draft.type === t
                  ? (t === 'international' ? 'bg-purple-500/20 text-purple-400' : 'bg-teal-500/20 text-teal-400')
                  : 'text-slate-600 hover:text-slate-300'
                }`}>
              {t === 'international' ? <Globe className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
              {t === 'international' ? 'International' : 'Local'}
            </button>
          ))}
        </div>

        {/* Description */}
        <input
          value={draft.description}
          onChange={(e) => setDraftField('description', e.target.value)}
          className="flex-1 bg-transparent text-xs text-slate-500 placeholder-slate-700 focus:outline-none border-b border-transparent focus:border-helm-600 pb-0.5 transition-all"
          placeholder="Brief description…"
        />

        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-[12.5px] text-slate-500 hover:text-slate-200 transition-colors">
          <Settings2 className="w-3.5 h-3.5" />
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Row 2: Expanded type-specific config */}
      {open && (
        <div className="px-4 pb-3 grid grid-cols-4 gap-3 border-t border-helm-700/50 pt-3 animate-fade-in">
          {type === 'local' ? (
            <>
              <div>
                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest font-bold">Branch</div>
                <select value={draft.config.branch ?? 'Riyadh HQ'} onChange={(e) => setDraftConfig('branch', e.target.value)}
                  className="w-full bg-helm-750 border border-helm-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                  {SA_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 col-span-3 pt-4">
                {[
                  { key: 'vatEnabled', label: 'Saudi VAT (15%)' },
                  { key: 'arabicInvoice', label: 'Arabic Invoice (فاتورة)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <div onClick={() => setDraftConfig(key, !draft.config[key])}
                      className={`w-8 h-4 rounded-full transition-colors ${draft.config[key] ? 'bg-amber-500' : 'bg-helm-600'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full mt-0.5 shadow transition-transform ${draft.config[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest font-bold">Primary Currency</div>
                <select value={draft.config.currencies?.[0] ?? 'SAR'} onChange={(e) => setDraftConfig('currencies', [e.target.value])}
                  className="w-full bg-helm-750 border border-helm-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest font-bold">Timezone</div>
                <select value={draft.config.primaryTimezone ?? 'AST'} onChange={(e) => setDraftConfig('primaryTimezone', e.target.value)}
                  className="w-full bg-helm-750 border border-helm-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                  {TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.id} — {t.country}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest font-bold">Incoterms</div>
                <select value={draft.config.incoterms ?? 'FOB'} onChange={(e) => setDraftConfig('incoterms', e.target.value)}
                  className="w-full bg-helm-750 border border-helm-600 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40">
                  {INCOTERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest font-bold">Linked Shipment</div>
                <input value={draft.linkedShipment ?? ''} onChange={(e) => setDraftField('linkedShipment', e.target.value)}
                  placeholder="SHP-XXXXX"
                  className="w-full bg-helm-750 border border-helm-600 rounded-md px-2 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/40 font-mono" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Builder Page ─────────────────────────────────────────────────────────────
export default function WorkflowBuilder() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { toast }   = useToast()
  const {
    draft, builderDirty, saveDraft, activateDraft,
    newDraft, loadDraft, selectedStepId, deselectStep,
  } = useWorkflowStore()

  const [showTemplates, setShowTemplates] = useState(!id)
  const [configOpen, setConfigOpen] = useState(true)

  // Initialize: load existing or keep what was set from list page
  useState(() => {
    if (id && id !== 'create') loadDraft(id)
  })

  const handleSave = () => {
    const savedId = saveDraft()
    toast.success('Workflow Saved', `${draft.name} saved as ${draft.status}.`)
  }

  const handleActivate = () => {
    activateDraft()
    toast.success('Workflow Activated', `${draft.name} is now active and running.`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 overflow-hidden">

      {/* ── Top toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-helm-850 border-b border-helm-700 flex-shrink-0">
        <button onClick={() => navigate('/workflow')}
          className="w-8 h-8 rounded-lg bg-helm-800 border border-helm-600 hover:border-helm-500 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-white truncate max-w-[200px]">{draft.name || 'Untitled'}</span>
          <WFStatusBadge status={draft.status} />
          <WFTypeBadge type={draft.type} />
        </div>

        {builderDirty && (
          <span className="text-[12.5px] text-amber-400 font-medium">● Unsaved changes</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowTemplates(true)}
            className="px-3 py-1.5 text-xs border border-helm-600 hover:border-helm-500 rounded-lg text-slate-400 hover:text-slate-200 transition-all">
            Templates
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-helm-600 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-amber-400 transition-all">
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          {draft.status !== 'active' && (
            <button onClick={handleActivate}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all">
              <Play className="w-3.5 h-3.5" />
              Activate
            </button>
          )}
          {draft.status === 'active' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/30 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* ── Settings bar ────────────────────────────────────────────────── */}
      <SettingsBar draft={draft} type={draft.type} />

      {/* ── 3-panel builder area ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Step palette */}
        <StepPalette workflowType={draft.type} />

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-helm-900/50">
          <WorkflowCanvas />
        </div>

        {/* Right: Config panel */}
        {(selectedStepId || configOpen) && (
          <div className="w-[280px] flex-shrink-0 bg-helm-900 border-l border-helm-700 flex flex-col overflow-hidden">
            {/* Config panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-helm-700 flex-shrink-0">
              <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-500">
                {selectedStepId ? 'Step Configuration' : 'Properties'}
              </span>
              <button onClick={() => { deselectStep(); setConfigOpen(false) }}
                className="text-slate-600 hover:text-slate-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <StepConfigPanel workflowType={draft.type} />
            </div>
          </div>
        )}
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <TemplatePicker
          onSelect={(key) => newDraft(key)}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}
