import { create } from 'zustand'
import { WORKFLOW_DEFS, WORKFLOW_REQUESTS, WORKFLOW_AUDIT_LOG } from '../api/mock/workflowV2Data'

let _wfCounter   = WORKFLOW_DEFS.length + 100
let _reqCounter  = WORKFLOW_REQUESTS.length + 100

const useWorkflowV2Store = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────
  workflows:  WORKFLOW_DEFS,
  requests:   WORKFLOW_REQUESTS,
  auditLog:   WORKFLOW_AUDIT_LOG,
  filter:     { search: '', status: 'all', entityType: 'all', workflowId: 'all', assignee: 'all' },

  setFilter:  (k, v) => set(s => ({ filter: { ...s.filter, [k]: v } })),

  // ─── Workflow definitions ─────────────────────────────────────────────
  filteredWorkflows: () => {
    const { workflows, filter: f } = get()
    return workflows.filter(w => {
      if (f.status     !== 'all' && w.status     !== f.status)     return false
      if (f.entityType !== 'all' && w.entityType !== f.entityType) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        if (!w.name.toLowerCase().includes(q) && !w.description.toLowerCase().includes(q)) return false
      }
      return true
    })
  },

  getWorkflow: (id) => get().workflows.find(w => w.id === id),

  createWorkflow: (data) => {
    const id = `WF-${String(++_wfCounter).padStart(3, '0')}`
    const wf = {
      id,
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Abdullah Al-Rashid',
      ...data,
    }
    set(s => ({ workflows: [wf, ...s.workflows] }))
    return id
  },

  updateWorkflow: (id, patch) =>
    set(s => ({
      workflows: s.workflows.map(w => w.id !== id ? w : { ...w, ...patch, updatedAt: new Date().toISOString(), version: (w.version ?? 1) + 1 }),
    })),

  cloneWorkflow: (id) => {
    const src = get().getWorkflow(id)
    if (!src) return null
    const newId = `WF-${String(++_wfCounter).padStart(3, '0')}`
    const wf = {
      ...src,
      id: newId,
      name: src.name + ' (Copy)',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ workflows: [wf, ...s.workflows] }))
    return newId
  },

  deactivateWorkflow: (id) =>
    set(s => ({ workflows: s.workflows.map(w => w.id !== id ? w : { ...w, status: 'inactive' }) })),
  activateWorkflow: (id) =>
    set(s => ({ workflows: s.workflows.map(w => w.id !== id ? w : { ...w, status: 'active' }) })),

  // ─── Requests ─────────────────────────────────────────────────────────
  filteredRequests: () => {
    const { requests, filter: f } = get()
    return requests.filter(r => {
      if (f.status     !== 'all' && r.status     !== f.status)     return false
      if (f.entityType !== 'all' && r.entityType !== f.entityType) return false
      if (f.workflowId !== 'all' && r.workflowId !== f.workflowId) return false
      if (f.assignee   !== 'all' && r.currentApprover !== f.assignee) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        const hit = r.id.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          r.workflowName.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  },

  getRequest: (id) => get().requests.find(r => r.id === id),

  // ─── Approve / Reject / Return / Modify / Reassign ────────────────────
  performAction: (requestId, actionId, payload = {}) => {
    const req = get().getRequest(requestId)
    if (!req) return
    const wf  = get().getWorkflow(req.workflowId)
    if (!wf) return

    let newStep   = req.currentStep
    let newStatus = req.status
    let newApprover = req.currentApprover
    let newRole    = req.currentRole

    if (actionId === 'approve') {
      const nextIdx = req.currentStep + 1
      if (nextIdx >= wf.steps.length) { newStatus = 'approved'; newStep = req.currentStep + 1 }
      else                            { newStep = nextIdx; newRole = wf.steps[nextIdx].role; newStatus = 'pending_approval' }
    } else if (actionId === 'reject') {
      newStatus = 'rejected'
    } else if (actionId === 'return') {
      newStatus = 'pending_recheck'
    } else if (actionId === 'modify') {
      newStatus = 'pending_modification'
    } else if (actionId === 'reassign') {
      newStatus = 'reassigned'
      newApprover = payload.assignTo ?? req.currentApprover
    }

    const historyEntry = {
      id: `H-${Date.now()}`,
      step: wf.steps[req.currentStep]?.seq ?? 0,
      action: actionId,
      actor: 'Abdullah Al-Rashid',
      actorRole: req.currentRole ?? wf.steps[req.currentStep]?.role,
      timestamp: new Date().toISOString(),
      comment: payload.comment ?? '',
      reassignedTo: payload.assignTo,
    }

    set(s => ({
      requests: s.requests.map(r => r.id !== requestId ? r : {
        ...r, currentStep: newStep, status: newStatus,
        currentApprover: newApprover, currentRole: newRole,
        updatedAt: new Date().toISOString(),
        history: [...r.history, historyEntry],
      }),
    }))
  },

  // ─── Closure submission (special) ─────────────────────────────────────
  submitClosure: (requestId, payload) => {
    set(s => ({
      requests: s.requests.map(r => r.id !== requestId ? r : {
        ...r, status: 'pending_approval',
        closurePayload: payload,
        updatedAt: new Date().toISOString(),
        history: [...r.history, {
          id: `H-${Date.now()}`, step: 0, action: 'submit_closure',
          actor: 'Abdullah Al-Rashid', actorRole: 'Project Manager',
          timestamp: new Date().toISOString(),
          comment: payload?.notes ?? 'Closure request submitted with all required artefacts.',
        }],
      }),
    }))
  },
}))

export default useWorkflowV2Store
