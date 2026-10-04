import { create } from 'zustand'
import { PROJECTS, APPROVAL_DEFAULT_FLOW } from '../api/mock/projectData'

let _counter = PROJECTS.length

const useProjectStore = create((set, get) => ({
  projects: PROJECTS,
  filter:   { search: '', status: 'all', scale: 'all', country: 'all', city: 'all', manager: 'all' },
  viewMode: 'list',

  setFilter:   (k, v) => set(s => ({ filter: { ...s.filter, [k]: v } })),
  setViewMode: (m) => set({ viewMode: m }),

  filteredProjects: () => {
    const { projects, filter: f } = get()
    return projects.filter(p => {
      if (f.status  !== 'all' && p.status  !== f.status)  return false
      if (f.scale   !== 'all' && p.scale   !== f.scale)   return false
      if (f.country !== 'all' && p.country !== f.country) return false
      if (f.city    !== 'all' && p.city    !== f.city)    return false
      if (f.manager !== 'all' && !p.managers.includes(f.manager)) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  },

  getProject: (id) => get().projects.find(p => p.id === id),

  createProject: (data) => {
    const id = `PRJ-${String(++_counter).padStart(5, '0')}`
    const newProject = {
      id,
      status: 'draft',
      approvalFlow: APPROVAL_DEFAULT_FLOW.map(s => ({ ...s, status: 'waiting', actor: null, actedAt: null, comment: null, action: null })),
      hierarchy: [],
      auditHistory: [
        { id: `${id}-AUD-1`, date: new Date().toISOString(), user: 'Ahmed Ali', action: 'Project Created', field: null, old: null, new: null },
      ],
      createdAt: new Date().toISOString(),
      createdBy: 'Ahmed Ali',
      updatedAt: new Date().toISOString(),
      ...data,
    }
    set(s => ({ projects: [newProject, ...s.projects] }))
    return id
  },

  updateProject: (id, patch) =>
    set(s => ({
      projects: s.projects.map(p => p.id !== id ? p : {
        ...p, ...patch,
        updatedAt: new Date().toISOString(),
        auditHistory: [{
          id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Ahmed Ali',
          action: 'Project Updated', field: 'Profile', old: null, new: null,
        }, ...p.auditHistory],
      }),
    })),

  cloneProject: (id) => {
    const src = get().getProject(id)
    if (!src) return null
    const newId = `PRJ-${String(++_counter).padStart(5, '0')}`
    const clone = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      name: src.name + ' (Copy)',
      status: 'draft',
      approvalFlow: APPROVAL_DEFAULT_FLOW.map(s => ({ ...s, status: 'waiting', actor: null, actedAt: null, comment: null, action: null })),
      auditHistory: [{
        id: `${newId}-AUD-1`, date: new Date().toISOString(), user: 'Ahmed Ali',
        action: 'Project Cloned', field: 'Source', old: null, new: src.id,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ projects: [clone, ...s.projects] }))
    return newId
  },

  deactivateProject: (id) =>
    set(s => ({
      projects: s.projects.map(p => p.id !== id ? p : {
        ...p, status: 'inactive', updatedAt: new Date().toISOString(),
        auditHistory: [{
          id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Ahmed Ali',
          action: 'Project Deactivated', field: 'Status', old: p.status, new: 'inactive',
        }, ...p.auditHistory],
      }),
    })),

  activateProject: (id) =>
    set(s => ({
      projects: s.projects.map(p => p.id !== id ? p : {
        ...p, status: 'active', updatedAt: new Date().toISOString(),
        auditHistory: [{
          id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Ahmed Ali',
          action: 'Project Activated', field: 'Status', old: p.status, new: 'active',
        }, ...p.auditHistory],
      }),
    })),

  // ─── Approval workflow ────────────────────────────────────────────────
  performApprovalAction: ({ projectId, stepIdx, action, actor, comment }) =>
    set(s => ({
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p
        const flow = [...p.approvalFlow]
        const step = flow[stepIdx]
        if (!step) return p

        // Apply action
        if (action === 'approve') {
          flow[stepIdx] = { ...step, status: 'approved', actor, comment, actedAt: new Date().toISOString(), action }
          // Forward: open next step
          if (flow[stepIdx + 1]) flow[stepIdx + 1] = { ...flow[stepIdx + 1], status: 'pending' }
        } else if (action === 'reject') {
          flow[stepIdx] = { ...step, status: 'rejected', actor, comment, actedAt: new Date().toISOString(), action }
        } else if (action === 'return') {
          // Backward: send to previous step
          flow[stepIdx] = { ...step, status: 'waiting', actor, comment, actedAt: new Date().toISOString(), action }
          if (flow[stepIdx - 1]) flow[stepIdx - 1] = { ...flow[stepIdx - 1], status: 'pending' }
        } else if (action === 'modify') {
          flow[stepIdx] = { ...step, status: 'returned', actor, comment, actedAt: new Date().toISOString(), action }
        }

        // Update project status based on flow state
        let newStatus = p.status
        if (action === 'reject')      newStatus = 'rejected'
        else if (action === 'return') newStatus = 'returned'
        else if (action === 'modify') newStatus = 'returned'
        else if (action === 'approve' && stepIdx === flow.length - 1) newStatus = 'active'
        else if (action === 'approve') newStatus = 'in_review'

        const auditEntry = {
          id: `${projectId}-AUD-${Date.now()}`,
          date: new Date().toISOString(),
          user: actor?.name ?? 'Unknown',
          action: `Approval: ${action}`,
          field: step.label,
          old: p.status,
          new: newStatus,
        }

        return { ...p, approvalFlow: flow, status: newStatus, updatedAt: new Date().toISOString(), auditHistory: [auditEntry, ...p.auditHistory] }
      }),
    })),

  submitForApproval: (id) =>
    set(s => ({
      projects: s.projects.map(p => {
        if (p.id !== id) return p
        const flow = [...p.approvalFlow]
        // Mark step 0 (creator) approved automatically, step 1 pending
        if (flow[0]) flow[0] = { ...flow[0], status: 'approved', actedAt: new Date().toISOString(), action: 'submit' }
        if (flow[1]) flow[1] = { ...flow[1], status: 'pending' }
        return {
          ...p, status: 'pending', approvalFlow: flow, updatedAt: new Date().toISOString(),
          auditHistory: [{
            id: `${id}-AUD-${Date.now()}`, date: new Date().toISOString(), user: 'Ahmed Ali',
            action: 'Submitted for Approval', field: 'Status', old: 'draft', new: 'pending',
          }, ...p.auditHistory],
        }
      }),
    })),
}))

export default useProjectStore
