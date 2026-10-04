// Email Communication log — request #12
// Stores received-email records that operators log against a project + POC.
// Each entry: project, POC (or "Other" with manual name), free-text body,
// optional multiple attachments (kept as in-memory metadata only).
import { create } from 'zustand'

const SAMPLE_EMAILS = [
  {
    id: 'EML-2026-001',
    projectId: 'PRJ-00007',
    pocType:   'manager',
    pocId:     'U-101',
    pocName:   'Ahmed Ali',
    subject:   'Quarterly SABER renewal — reminder',
    body:      'Hello team,\n\nJust a reminder that our SABER certificate for the SABIC Petrochem batch expires next month. Please initiate the renewal process this week.\n\nThanks,\nAhmed',
    attachments: [
      { name: 'SABER-cert-Q4.pdf', size: 184320 },
      { name: 'renewal-checklist.docx', size: 28160 },
    ],
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    submittedBy: 'Khalid Salman',
  },
  {
    id: 'EML-2026-002',
    projectId: 'PRJ-00002',
    pocType:   'other',
    pocId:     null,
    pocName:   'David Mitchell · ARAMCO Procurement',
    subject:   'Revised PO acceptance',
    body:      'Hi,\n\nWe accept the revised PO terms. Please proceed with shipment ITS-26-06-4803 under the updated Incoterms.\n\nRegards,\nDavid',
    attachments: [
      { name: 'PO-acceptance-signed.pdf', size: 95232 },
    ],
    submittedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    submittedBy: 'Sara Al-Otaibi',
  },
]

const useEmailLogStore = create((set, get) => ({
  emails: SAMPLE_EMAILS,

  addEmail: (draft) => {
    const id = `EML-${new Date().getFullYear()}-${String(get().emails.length + 1).padStart(3, '0')}`
    const newEmail = {
      id,
      submittedAt: new Date().toISOString(),
      submittedBy: 'Khalid Salman',
      ...draft,
    }
    set(s => ({ emails: [newEmail, ...s.emails] }))
    return id
  },

  getForProject: (projectId) => get().emails.filter(e => e.projectId === projectId),
}))

export default useEmailLogStore
