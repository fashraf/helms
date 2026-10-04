import { create } from 'zustand'
import { MOCK_WORKFLOWS, TEMPLATES, makeStep } from '../api/mock/workflowData'

const deepCopy = (o) => JSON.parse(JSON.stringify(o))

const DRAFT_DEFAULTS = {
  id:          null,
  name:        'Untitled Workflow',
  type:        'local',
  status:      'draft',
  description: '',
  template:    null,
  linkedShipment: null,
  config: {
    vatEnabled: false, vatRate: 15, arabicInvoice: false, branch: 'Riyadh HQ',
    currencies: ['SAR'], primaryTimezone: 'AST', incoterms: 'FOB',
    exportDocs: [], importDocs: [],
  },
  steps:     [],
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  version:   1,
}

const useWorkflowStore = create((set, get) => ({
  // ─── List ────────────────────────────────────────────────────────────
  workflows:    MOCK_WORKFLOWS,
  listFilter:   'all',
  setListFilter:(f) => set({ listFilter: f }),

  filteredWorkflows: () => {
    const { workflows, listFilter } = get()
    if (listFilter === 'all') return workflows
    if (['local', 'international'].includes(listFilter)) return workflows.filter((w) => w.type === listFilter)
    return workflows.filter((w) => w.status === listFilter)
  },

  deleteWorkflow: (id) => set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) })),

  duplicateWorkflow: (id) => {
    const src = get().workflows.find((w) => w.id === id)
    if (!src) return
    const copy = deepCopy(src)
    copy.id     = `WF-${Date.now()}`
    copy.name   = `${src.name} (copy)`
    copy.status = 'draft'
    copy.createdAt = new Date().toISOString()
    copy.steps.forEach((s, i) => { s.id = `step-copy-${Date.now()}-${i}`; s.status = 'pending'; s.completedAt = null })
    set((s) => ({ workflows: [copy, ...s.workflows] }))
    return copy.id
  },

  // ─── Builder draft ────────────────────────────────────────────────────
  draft:           { ...DRAFT_DEFAULTS, steps: [] },
  selectedStepId:  null,
  builderDirty:    false,

  newDraft: (templateKey) => {
    const tmpl = TEMPLATES[templateKey]
    const draft = {
      ...deepCopy(DRAFT_DEFAULTS),
      id:          `WF-${Date.now()}`,
      type:        tmpl?.type  ?? 'local',
      template:    templateKey ?? null,
      description: tmpl?.description ?? '',
      config:      deepCopy(tmpl?.config ?? DRAFT_DEFAULTS.config),
      steps:       tmpl ? tmpl.steps() : [],
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    }
    set({ draft, selectedStepId: null, builderDirty: false })
  },

  loadDraft: (id) => {
    const wf = get().workflows.find((w) => w.id === id)
    if (!wf) return
    set({ draft: deepCopy(wf), selectedStepId: null, builderDirty: false })
  },

  saveDraft: () => {
    const draft = { ...get().draft, updatedAt: new Date().toISOString() }
    set((s) => {
      const exists = s.workflows.some((w) => w.id === draft.id)
      return {
        workflows: exists
          ? s.workflows.map((w) => w.id === draft.id ? draft : w)
          : [draft, ...s.workflows],
        draft,
        builderDirty: false,
      }
    })
    return draft.id
  },

  activateDraft: () => {
    set((s) => ({
      draft:    { ...s.draft, status: 'active', updatedAt: new Date().toISOString() },
      builderDirty: true,
    }))
    get().saveDraft()
  },

  setDraftField: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value }, builderDirty: true })),

  setDraftConfig: (key, value) =>
    set((s) => ({
      draft:       { ...s.draft, config: { ...s.draft.config, [key]: value } },
      builderDirty: true,
    })),

  // ─── Step selection ───────────────────────────────────────────────────
  selectStep: (id)    => set({ selectedStepId: id }),
  deselectStep: ()    => set({ selectedStepId: null }),

  selectedStep: () => {
    const { draft, selectedStepId } = get()
    return draft.steps.find((s) => s.id === selectedStepId) ?? null
  },

  // ─── Step CRUD ────────────────────────────────────────────────────────
  addStep: (type, insertAfterIdx = -1) => {
    const step = makeStep(type)
    set((s) => {
      const steps  = [...s.draft.steps]
      const idx    = insertAfterIdx < 0 ? steps.length : insertAfterIdx + 1
      steps.splice(idx, 0, step)
      return { draft: { ...s.draft, steps }, selectedStepId: step.id, builderDirty: true }
    })
    return step.id
  },

  removeStep: (id) =>
    set((s) => ({
      draft:         { ...s.draft, steps: s.draft.steps.filter((st) => st.id !== id) },
      selectedStepId: s.selectedStepId === id ? null : s.selectedStepId,
      builderDirty:  true,
    })),

  updateStep: (id, patch) =>
    set((s) => ({
      draft: {
        ...s.draft,
        steps: s.draft.steps.map((st) => st.id !== id ? st : { ...st, ...patch }),
      },
      builderDirty: true,
    })),

  moveStep: (draggedId, insertAfterIdx) =>
    set((s) => {
      const steps   = [...s.draft.steps]
      const fromIdx = steps.findIndex((st) => st.id === draggedId)
      if (fromIdx === -1) return s
      const [item] = steps.splice(fromIdx, 1)
      const toIdx  = insertAfterIdx >= fromIdx ? Math.max(0, insertAfterIdx) : insertAfterIdx + 1
      steps.splice(Math.max(0, Math.min(toIdx, steps.length)), 0, item)
      return { draft: { ...s.draft, steps }, builderDirty: true }
    }),

  // ─── Checklist helpers (for QA steps) ────────────────────────────────
  addChecklistItem: (stepId, item) =>
    set((s) => ({
      draft: {
        ...s.draft,
        steps: s.draft.steps.map((st) =>
          st.id !== stepId ? st : { ...st, checklistItems: [...(st.checklistItems ?? []), item] }
        ),
      },
      builderDirty: true,
    })),

  removeChecklistItem: (stepId, idx) =>
    set((s) => ({
      draft: {
        ...s.draft,
        steps: s.draft.steps.map((st) =>
          st.id !== stepId ? st : { ...st, checklistItems: st.checklistItems?.filter((_, i) => i !== idx) }
        ),
      },
      builderDirty: true,
    })),
}))

export default useWorkflowStore
