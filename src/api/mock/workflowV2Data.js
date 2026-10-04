// ─── Status configurations ────────────────────────────────────────────────────
export const WORKFLOW_STATUSES = {
  draft:                 { label: 'Draft',                 cls: 'text-slate-500 bg-slate-50 border-slate-200',       color: '#64748B' },
  pending_approval:      { label: 'Pending Approval',      cls: 'text-amber-600 bg-amber-50 border-amber-200',       color: '#D97706' },
  pending_recheck:       { label: 'Pending Recheck',       cls: 'text-orange-600 bg-orange-50 border-orange-200',    color: '#EA580C' },
  pending_modification:  { label: 'Pending Modification',  cls: 'text-yellow-700 bg-yellow-50 border-yellow-200',    color: '#CA8A04' },
  reassigned:            { label: 'Reassigned',            cls: 'text-cyan-600 bg-cyan-50 border-cyan-200',          color: '#0891B2' },
  approved:              { label: 'Approved',              cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', color: '#059669' },
  rejected:              { label: 'Rejected',              cls: 'text-red-600 bg-red-50 border-red-200',             color: '#DC2626' },
  cancelled:             { label: 'Cancelled',             cls: 'text-slate-500 bg-slate-50 border-slate-200',       color: '#64748B' },
  expired:               { label: 'Expired',               cls: 'text-red-500 bg-red-50 border-red-200',             color: '#EF4444' },
  closed:                { label: 'Closed',                cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', color: '#047857' },
}

// ─── Action definitions (Approve / Reject / Return / Modify / Reassign) ──────
export const WORKFLOW_ACTIONS = {
  approve:    { id: 'approve',    label: 'Approve',              icon: 'CheckCircle2', color: '#059669', requiresComment: true,  next: 'forward'  },
  reject:     { id: 'reject',     label: 'Reject',               icon: 'XCircle',      color: '#DC2626', requiresComment: true,  next: 'close'    },
  return:     { id: 'return',     label: 'Return for Recheck',   icon: 'CornerUpLeft', color: '#EA580C', requiresComment: true,  next: 'recheck'  },
  modify:     { id: 'modify',     label: 'Request Modification', icon: 'Edit3',        color: '#CA8A04', requiresComment: true,  next: 'modify'   },
  reassign:   { id: 'reassign',   label: 'Reassign',             icon: 'UserSwitch',   color: '#0891B2', requiresComment: true,  next: 'reassign' },
}

export const ESCALATION_ACTIONS = [
  { id: 'next',      label: 'Move To Next Approver',   icon: '⏭️', desc: 'Auto-advance to next approver when SLA expires' },
  { id: 'auto_app',  label: 'Auto Approve',            icon: '✅', desc: 'Automatically approve at this step on SLA expiry' },
  { id: 'auto_rej',  label: 'Auto Reject',             icon: '❌', desc: 'Automatically reject and close workflow' },
  { id: 'remind',    label: 'Reminder Only',           icon: '🔔', desc: 'Send reminders but do not advance' },
]

export const APPROVER_TYPES = [
  { id: 'role',    label: 'By Role',           desc: 'Anyone with this role can approve' },
  { id: 'user',    label: 'Specific User',     desc: 'Only this user can approve'       },
  { id: 'manager', label: 'Project Manager',   desc: 'The project\'s assigned manager'  },
  { id: 'final',   label: 'Final Approver',    desc: 'Designated final approver only'   },
]

export const ROLES_FOR_APPROVAL = [
  'Project Creator', 'Project Manager', 'Operations Manager', 'Finance Officer',
  'COO', 'CEO', 'CFO', 'Compliance Officer', 'Department Head',
]

export const ENTITY_TYPES = [
  { id: 'project',     label: 'Project Approval',        icon: '📋' },
  { id: 'shipment',    label: 'Shipment Approval',       icon: '📦' },
  { id: 'vendor',      label: 'Vendor Onboarding',       icon: '🏢' },
  { id: 'rfq',         label: 'RFQ Approval',            icon: '📝' },
  { id: 'closure',     label: 'Project Closure',         icon: '🏁' },
  { id: 'budget',      label: 'Budget Approval',         icon: '💰' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const past   = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

// ─── Seed Workflow Definitions ────────────────────────────────────────────────
export const WORKFLOW_DEFS = [
  {
    id: 'WF-001', name: 'Standard Project Approval', entityType: 'project',
    description: 'Default 3-step approval for all new projects.',
    status: 'active', maxDays: 15, expiryAction: 'auto_rej',
    actionsEnabled: { approve: true, reject: true, return: true, modify: true, reassign: true },
    steps: [
      { id: 'S1', seq: 1, role: 'Project Manager',  approverType: 'manager', slaDays: 5, escalationAction: 'next' },
      { id: 'S2', seq: 2, role: 'COO',              approverType: 'role',    slaDays: 5, escalationAction: 'remind' },
      { id: 'S3', seq: 3, role: 'CEO',              approverType: 'final',   slaDays: 5, escalationAction: 'remind' },
    ],
    createdAt: past(24 * 200), updatedAt: past(24 * 7), createdBy: 'Khalid Salman', version: 3,
  },
  {
    id: 'WF-002', name: 'Express Project Approval', entityType: 'project',
    description: 'Fast-track for small projects (< 100k SAR).',
    status: 'active', maxDays: 7, expiryAction: 'auto_rej',
    actionsEnabled: { approve: true, reject: true, return: true, modify: false, reassign: true },
    steps: [
      { id: 'S1', seq: 1, role: 'Project Manager', approverType: 'manager', slaDays: 2, escalationAction: 'next'     },
      { id: 'S2', seq: 2, role: 'COO',             approverType: 'role',    slaDays: 5, escalationAction: 'auto_app' },
    ],
    createdAt: past(24 * 150), updatedAt: past(24 * 14), createdBy: 'Khalid Salman', version: 2,
  },
  {
    id: 'WF-003', name: 'Mega Project Approval', entityType: 'project',
    description: '5-step approval for projects > 5M SAR including CFO and compliance review.',
    status: 'active', maxDays: 30, expiryAction: 'remind',
    actionsEnabled: { approve: true, reject: true, return: true, modify: true, reassign: true },
    steps: [
      { id: 'S1', seq: 1, role: 'Project Manager',     approverType: 'manager', slaDays: 5, escalationAction: 'remind' },
      { id: 'S2', seq: 2, role: 'Compliance Officer',  approverType: 'role',    slaDays: 7, escalationAction: 'remind' },
      { id: 'S3', seq: 3, role: 'Operations Manager',  approverType: 'role',    slaDays: 5, escalationAction: 'next'   },
      { id: 'S4', seq: 4, role: 'CFO',                 approverType: 'role',    slaDays: 5, escalationAction: 'remind' },
      { id: 'S5', seq: 5, role: 'CEO',                 approverType: 'final',   slaDays: 5, escalationAction: 'remind' },
    ],
    createdAt: past(24 * 90), updatedAt: past(24 * 3), createdBy: 'Khalid Salman', version: 1,
  },
  {
    id: 'WF-004', name: 'Vendor Onboarding', entityType: 'vendor',
    description: 'New vendor registration approval flow.',
    status: 'active', maxDays: 10, expiryAction: 'next',
    actionsEnabled: { approve: true, reject: true, return: true, modify: false, reassign: false },
    steps: [
      { id: 'S1', seq: 1, role: 'Vendor Manager',      approverType: 'role', slaDays: 3, escalationAction: 'next'    },
      { id: 'S2', seq: 2, role: 'Compliance Officer',  approverType: 'role', slaDays: 5, escalationAction: 'remind'  },
      { id: 'S3', seq: 3, role: 'Operations Manager',  approverType: 'role', slaDays: 2, escalationAction: 'auto_app'},
    ],
    createdAt: past(24 * 120), updatedAt: past(24 * 21), createdBy: 'Khalid Salman', version: 1,
  },
  {
    id: 'WF-005', name: 'Project Closure Workflow', entityType: 'closure',
    description: 'Mandatory closure flow with images, signature & OTP verification.',
    status: 'active', maxDays: 7, expiryAction: 'remind',
    actionsEnabled: { approve: true, reject: true, return: true, modify: true, reassign: false },
    steps: [
      { id: 'S1', seq: 1, role: 'Project Manager', approverType: 'manager', slaDays: 2, escalationAction: 'remind' },
      { id: 'S2', seq: 2, role: 'Operations Manager', approverType: 'role',  slaDays: 3, escalationAction: 'next'  },
      { id: 'S3', seq: 3, role: 'CEO',             approverType: 'final',   slaDays: 2, escalationAction: 'remind' },
    ],
    createdAt: past(24 * 80), updatedAt: past(24 * 5), createdBy: 'Khalid Salman', version: 1,
  },
  {
    id: 'WF-006', name: 'Shipment Approval', entityType: 'shipment',
    description: 'Approval for international shipments above 500k SAR.',
    status: 'inactive', maxDays: 10, expiryAction: 'auto_rej',
    actionsEnabled: { approve: true, reject: true, return: true, modify: false, reassign: true },
    steps: [
      { id: 'S1', seq: 1, role: 'Operations Manager', approverType: 'role',  slaDays: 3, escalationAction: 'remind' },
      { id: 'S2', seq: 2, role: 'CFO',                approverType: 'role',  slaDays: 5, escalationAction: 'next'   },
    ],
    createdAt: past(24 * 60), updatedAt: past(24 * 30), createdBy: 'Khalid Salman', version: 1,
  },
]

// ─── Seed Workflow Requests (in-flight + completed) ───────────────────────────
const REQUESTERS = ['Abdullah Al-Rashid', 'Fatima Al-Zahrani', 'Khalid Al-Mutairi', 'Hessa Al-Enazi', 'Hamad Al-Saud']
const PROJECTS   = [
  { id: 'PRJ-00001', name: 'ARAMCO Expansion Project' },
  { id: 'PRJ-00002', name: 'Jubail Pipeline Upgrade'  },
  { id: 'PRJ-00003', name: 'NEOM Site Mobilization'   },
  { id: 'PRJ-00004', name: 'Red Sea Resort Phase 2'   },
  { id: 'PRJ-00007', name: 'SABIC Plant Maintenance'  },
]

function buildRequestHistory(workflow, currentStep, status, createdAt) {
  const history = [{
    id: 'H0', step: 0, action: 'submitted', actor: REQUESTERS[0], actorRole: 'Project Creator',
    timestamp: createdAt, comment: 'Workflow submitted for approval.',
  }]
  for (let i = 0; i < currentStep; i++) {
    history.push({
      id: `H${i + 1}`, step: workflow.steps[i].seq,
      action: 'approve', actor: REQUESTERS[(i + 1) % REQUESTERS.length],
      actorRole: workflow.steps[i].role,
      timestamp: new Date(new Date(createdAt).getTime() + (i + 1) * 86400000).toISOString(),
      comment: 'Reviewed and approved. Moving to next step.',
    })
  }
  if (status === 'rejected') {
    history.push({
      id: `H_R`, step: workflow.steps[currentStep]?.seq,
      action: 'reject', actor: REQUESTERS[(currentStep + 1) % REQUESTERS.length],
      actorRole: workflow.steps[currentStep]?.role,
      timestamp: new Date(new Date(createdAt).getTime() + (currentStep + 1) * 86400000).toISOString(),
      comment: 'Project scope insufficient. Recommend re-scoping with finance team.',
    })
  }
  if (status === 'pending_recheck') {
    history.push({
      id: `H_RC`, step: workflow.steps[currentStep]?.seq,
      action: 'return', actor: REQUESTERS[(currentStep + 1) % REQUESTERS.length],
      actorRole: workflow.steps[currentStep]?.role,
      timestamp: new Date(new Date(createdAt).getTime() + (currentStep + 1) * 86400000).toISOString(),
      comment: 'Please clarify schedule overlap with parallel project.',
    })
  }
  return history
}

let _reqCounter = 1
function nextReqId() { return `REQ-2026-${String(_reqCounter++).padStart(4, '0')}` }

const REQ_SEEDS = [
  { wf: 'WF-001', proj: 'PRJ-00001', step: 1, status: 'pending_approval',     hoursAgo: 18  },
  { wf: 'WF-001', proj: 'PRJ-00002', step: 2, status: 'pending_approval',     hoursAgo: 96  },
  { wf: 'WF-001', proj: 'PRJ-00003', step: 0, status: 'pending_recheck',      hoursAgo: 240 },
  { wf: 'WF-002', proj: 'PRJ-00004', step: 0, status: 'pending_approval',     hoursAgo: 6   },
  { wf: 'WF-003', proj: 'PRJ-00007', step: 3, status: 'pending_approval',     hoursAgo: 360 },
  { wf: 'WF-001', proj: 'PRJ-00001', step: 3, status: 'approved',             hoursAgo: 480 },
  { wf: 'WF-002', proj: 'PRJ-00002', step: 0, status: 'rejected',             hoursAgo: 720 },
  { wf: 'WF-001', proj: 'PRJ-00003', step: 1, status: 'reassigned',           hoursAgo: 240 },
  { wf: 'WF-003', proj: 'PRJ-00004', step: 4, status: 'pending_approval',     hoursAgo: 600 },
  { wf: 'WF-005', proj: 'PRJ-00007', step: 0, status: 'pending_modification', hoursAgo: 120 },
  { wf: 'WF-001', proj: 'PRJ-00001', step: 3, status: 'closed',               hoursAgo: 1100},
  { wf: 'WF-002', proj: 'PRJ-00007', step: 1, status: 'pending_approval',     hoursAgo: 48  },
]

export const WORKFLOW_REQUESTS = REQ_SEEDS.map((seed, i) => {
  const wf = WORKFLOW_DEFS.find(w => w.id === seed.wf)
  const project = PROJECTS[i % PROJECTS.length]
  const createdAt = past(seed.hoursAgo)
  const currentStepDef = wf.steps[seed.step] ?? wf.steps[wf.steps.length - 1]
  return {
    id: nextReqId(),
    workflowId: seed.wf,
    workflowName: wf.name,
    entityType: wf.entityType,
    projectId: project.id,
    projectName: project.name,
    requestedBy: REQUESTERS[i % REQUESTERS.length],
    currentStep: seed.step,
    currentApprover: REQUESTERS[(seed.step + 1) % REQUESTERS.length],
    currentRole: currentStepDef?.role,
    status: seed.status,
    createdAt,
    updatedAt: past(Math.max(1, seed.hoursAgo - 24)),
    slaDeadline: future((currentStepDef?.slaDays ?? 5) * 24 - seed.hoursAgo),
    maxDeadline: future(wf.maxDays * 24 - seed.hoursAgo),
    comments: [
      { id: 'C1', author: REQUESTERS[i % REQUESTERS.length], date: createdAt, text: 'Initial submission with all required documentation attached.' },
    ],
    attachments: [
      { id: 'A1', name: 'Project_Charter.pdf',     size: '1.2 MB', uploadedAt: createdAt },
      { id: 'A2', name: 'Budget_Approval.xlsx',    size: '85 KB',  uploadedAt: createdAt },
    ],
    history: buildRequestHistory(wf, seed.step, seed.status, createdAt),
  }
})

// ─── Audit log (workflow events) ──────────────────────────────────────────────
const AUDIT_ACTIONS = ['Workflow Created','Workflow Updated','Workflow Cloned','Step Added','Step Removed','Step Reordered','SLA Changed','Workflow Activated','Workflow Deactivated','Request Submitted','Request Approved','Request Rejected','Request Returned','Request Reassigned']
const AUDIT_USERS = ['Abdullah Al-Rashid', 'Fatima Al-Zahrani', 'Khalid Al-Mutairi']

export const WORKFLOW_AUDIT_LOG = Array.from({ length: 40 }, (_, i) => ({
  id: `WA-${String(i + 1).padStart(4, '0')}`,
  timestamp: past(i * 8 + 1),
  actor:     AUDIT_USERS[i % AUDIT_USERS.length],
  actorRole: 'System Administrator',
  action:    AUDIT_ACTIONS[i % AUDIT_ACTIONS.length],
  workflowId:   WORKFLOW_DEFS[i % WORKFLOW_DEFS.length].id,
  workflowName: WORKFLOW_DEFS[i % WORKFLOW_DEFS.length].name,
  requestId:    i % 4 === 0 ? `REQ-2026-${String((i % 12) + 1).padStart(4, '0')}` : null,
  oldValue:  i % 5 === 0 ? '5 days' : null,
  newValue:  i % 5 === 0 ? '7 days' : null,
  ipAddress: `10.${1 + (i % 9)}.${1 + (i % 20)}.${1 + (i % 99)}`,
  device:    i % 3 === 0 ? 'Mobile (iOS)' : 'Web (Chrome)',
}))

// ─── SLA / age computation helpers ────────────────────────────────────────────
export function slaRemaining(req) {
  const ms   = new Date(req.slaDeadline).getTime() - Date.now()
  const days = ms / 86400000
  return { days: Math.floor(days), hours: Math.floor(ms / 3600000), expired: ms < 0 }
}

export function workflowAge(req) {
  return Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 86400000)
}
