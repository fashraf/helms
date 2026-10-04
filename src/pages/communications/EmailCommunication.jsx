// ═══════════════════════════════════════════════════════════════════════════
// EMAIL COMMUNICATION (request #12)
// Form-driven page that logs received emails against a project + POC.
//   Step 1: pick project
//   Step 2: pick POC (manager/coordinator/etc.) OR "Other" with manual name
//   Step 3: subject + free-text body
//   Step 4: multiple attachments
//   Step 5: Confirm + Submit
// Submitted entries appear in the "Logged Emails" table on the same page.
// ═══════════════════════════════════════════════════════════════════════════
import { useMemo, useState, useRef } from 'react'
import { Mail, Send, Paperclip, X, Check, Search, FileText, AlertCircle, User, Briefcase } from 'lucide-react'
import useProjectStore from '../../store/projectStore'
import useEmailLogStore from '../../store/emailLogStore'
import { PEOPLE } from '../../api/mock/projectData'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const POC_ROLES = [
  { key: 'managers',       label: 'Project Manager',     icon: '👷' },
  { key: 'docControllers', label: 'Document Controller', icon: '📋' },
  { key: 'coordinators',   label: 'Project Coordinator', icon: '🗂️' },
  { key: 'finalApprover',  label: 'Final Approver',      icon: '✅' },
]

function fmtSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function EmailCommunication() {
  const projects = useProjectStore(s => s.projects)
  const { emails, addEmail } = useEmailLogStore()
  const { toast } = useToast()

  // ─── Form state ──────────────────────────────────────────────────────────
  const [draft, setDraft] = useState({
    projectId:   '',
    pocType:     '',
    pocId:       '',
    pocName:     '',
    subject:     '',
    body:        '',
    attachments: [],  // { name, size }
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileRef = useRef(null)

  const project = useMemo(() => projects.find(p => p.id === draft.projectId), [projects, draft.projectId])

  // POC candidates from the chosen project
  const pocOptions = useMemo(() => {
    if (!project) return []
    const opts = []
    POC_ROLES.forEach(role => {
      const ids = project[role.key]
      if (!ids) return
      const idArr = Array.isArray(ids) ? ids : [ids]
      idArr.forEach(id => {
        const person = PEOPLE.find(p => p.id === id)
        if (person) opts.push({ id: `${role.key}|${person.id}`, person, role })
      })
    })
    return opts
  }, [project])

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).map(f => ({ name: f.name, size: f.size }))
    setDraft(d => ({ ...d, attachments: [...d.attachments, ...files] }))
  }

  const removeAttachment = (i) => setDraft(d => ({ ...d, attachments: d.attachments.filter((_, idx) => idx !== i) }))

  // Validation
  const errors = {}
  if (!draft.projectId) errors.projectId = 'Project required'
  if (!draft.pocType)   errors.pocType   = 'POC selection required'
  if (draft.pocType === 'other' && !draft.pocName.trim()) errors.pocName = 'Person name required when POC is Other'
  if (draft.pocType !== 'other' && draft.pocType && !draft.pocId) errors.pocId = 'Pick a specific POC'
  if (!draft.subject.trim()) errors.subject = 'Subject required'
  if (!draft.body.trim())    errors.body    = 'Email content required'

  const canSubmit = Object.keys(errors).length === 0
  const submit = () => { if (canSubmit) setConfirmOpen(true) }

  const finalizeSubmit = () => {
    // Resolve POC display
    let pocName = draft.pocName
    let pocId = null
    let pocType = draft.pocType
    if (draft.pocType !== 'other') {
      const [, personId] = draft.pocType.split('|')
      pocId = personId
      const person = PEOPLE.find(p => p.id === personId)
      const role = POC_ROLES.find(r => r.key === draft.pocType.split('|')[0])
      pocName = `${person?.name ?? personId} · ${role?.label ?? ''}`
    }
    const id = addEmail({
      projectId: draft.projectId,
      pocType,
      pocId,
      pocName,
      subject: draft.subject.trim(),
      body: draft.body.trim(),
      attachments: draft.attachments,
    })
    toast.success('Email logged', `${id} · linked to ${project?.name ?? draft.projectId}`)
    setConfirmOpen(false)
    setDraft({ projectId:'', pocType:'', pocId:'', pocName:'', subject:'', body:'', attachments:[] })
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3"
        data-tour="email-header" data-tour-order="10"
        data-tour-title="Email Communication Log"
        data-tour-desc="Track every received email that relates to a project. Pick the project, identify who sent it, paste the content + any attachments, and confirm. The log feeds the project audit trail.">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
          <Mail className="w-4 h-4" style={{ color:'var(--primary)' }} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Email Communication Log</h2>
          <p className="text-[11px]" style={{ color:'var(--text3)' }}>
            Record received emails against a project &amp; point-of-contact · {emails.length} email{emails.length === 1 ? '' : 's'} logged
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">

        {/* ─── Log Email Form ──────────────────────────────────────────── */}
        <div className="col-span-7 space-y-3">
          <div className="rounded-xl border p-4 space-y-3" style={C}>
            <h3 className="text-xs font-bold uppercase tracking-widest pb-1.5" style={{ color:'var(--text)', borderBottom:'1px solid var(--border)' }}>
              Log Received Email
            </h3>

            {/* Project */}
            <Field label="Project" required error={errors.projectId} sub="Pick the project the email relates to">
              <Select2 size="sm" value={draft.projectId} onChange={v => set('projectId', v)}
                options={projects.filter(p => p.status !== 'cancelled').map(p => ({ id: p.id, label: p.name, sublabel: `${p.id} · ${p.city ?? ''}` }))}
                getSubLabel={o => o.sublabel}
                placeholder="Choose project…" />
            </Field>

            {/* POC */}
            {draft.projectId && (
              <>
                <Field label="Point of Contact" required error={errors.pocType || errors.pocId} sub="Pick from project team — or use Others to log a non-team contact">
                  <div className="space-y-1.5">
                    {pocOptions.map(o => {
                      const active = draft.pocType === o.id
                      return (
                        <button key={o.id} onClick={() => set('pocType', o.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-colors"
                          style={{
                            background: active ? 'var(--primary-light)' : 'var(--bg2)',
                            borderColor: active ? 'var(--primary)' : 'var(--border)',
                          }}>
                          <span className="text-sm">{o.role.icon}</span>
                          <div className="flex-1">
                            <div className="text-[12.5px] font-bold" style={{ color: active ? 'var(--primary)' : 'var(--text)' }}>{o.person.name}</div>
                            <div className="text-[10px]" style={{ color:'var(--text3)' }}>{o.role.label} · {o.person.dept}</div>
                          </div>
                          {active && <Check className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />}
                        </button>
                      )
                    })}
                    {/* "Other" option */}
                    <button onClick={() => set('pocType', 'other')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-colors"
                      style={{
                        background: draft.pocType === 'other' ? 'var(--primary-light)' : 'var(--bg2)',
                        borderColor: draft.pocType === 'other' ? 'var(--primary)' : 'var(--border)',
                      }}>
                      <span className="text-sm">📨</span>
                      <div className="flex-1">
                        <div className="text-[12.5px] font-bold" style={{ color: draft.pocType === 'other' ? 'var(--primary)' : 'var(--text)' }}>Other (external)</div>
                        <div className="text-[10px]" style={{ color:'var(--text3)' }}>Person not on the project team — enter the name manually</div>
                      </div>
                      {draft.pocType === 'other' && <Check className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />}
                    </button>
                  </div>
                </Field>

                {draft.pocType === 'other' && (
                  <Field label="Person Name" required error={errors.pocName} sub="Free-text — e.g. 'David Mitchell · ARAMCO Procurement'">
                    <input value={draft.pocName} onChange={e => set('pocName', e.target.value)}
                      placeholder="Full name & affiliation"
                      className="w-full rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none"
                      style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                  </Field>
                )}

                <Field label="Subject" required error={errors.subject}>
                  <input value={draft.subject} onChange={e => set('subject', e.target.value)}
                    placeholder="Subject of the received email"
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm border focus:outline-none"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </Field>

                <Field label="Email Content" required error={errors.body} sub="Paste or transcribe the body of the email">
                  <textarea value={draft.body} onChange={e => set('body', e.target.value)} rows={6}
                    placeholder="What did the email say?"
                    className="w-full rounded-lg px-2.5 py-2 text-sm border focus:outline-none resize-none"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)', lineHeight: 1.5 }} />
                </Field>

                {/* Attachments */}
                <Field label="Attachments" sub="Add multiple files — references stored against this email log">
                  <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
                    onChange={e => handleFiles(e.target.files)} />
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-[var(--bg2)]"
                    style={{ borderColor:'var(--border2)', color:'var(--text2)', background:'var(--card)' }}>
                    <Paperclip className="w-3.5 h-3.5" /> Add Attachment(s)
                  </button>
                  {draft.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {draft.attachments.map((a, i) => (
                        <div key={i} className="rounded-lg px-2 py-1.5 flex items-center gap-2 text-[12.5px]" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--primary)' }} />
                          <span className="flex-1 truncate font-mono" style={{ color:'var(--text)' }}>{a.name}</span>
                          <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{fmtSize(a.size)}</span>
                          <button onClick={() => removeAttachment(i)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-50" style={{ color:'#DC2626' }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>

                {/* Submit */}
                <button onClick={submit} disabled={!canSubmit}
                  className="w-full px-3 py-2.5 text-sm font-bold rounded-lg text-white transition-opacity flex items-center justify-center gap-2"
                  style={{ background:'var(--primary)', opacity: canSubmit ? 1 : 0.5 }}>
                  <Send className="w-4 h-4" /> Confirm &amp; Submit
                </button>

                {Object.keys(errors).length > 0 && (
                  <div className="rounded-lg p-2 flex items-start gap-2 text-[11px]" style={{ background:'rgba(220,38,38,.06)', border:'1px solid rgba(220,38,38,.3)', color:'var(--danger)' }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Cannot submit:</strong> {Object.values(errors).join(' · ')}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── Logged Emails table ─────────────────────────────────────── */}
        <div className="col-span-5">
          <div className="rounded-xl border overflow-hidden" style={C}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <FileText className="w-3.5 h-3.5" style={{ color:'var(--text2)' }} />
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Logged Emails</h3>
              <span className="ml-auto text-[10px] font-mono" style={{ color:'var(--text3)' }}>{emails.length} entries</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-2 space-y-1.5">
              {emails.length === 0 ? (
                <div className="text-center py-10 text-xs" style={{ color:'var(--text3)' }}>
                  <Mail className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No emails logged yet
                </div>
              ) : emails.map(e => {
                const proj = projects.find(p => p.id === e.projectId)
                return (
                  <div key={e.id} className="rounded-lg p-2.5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] font-bold" style={{ color:'var(--primary)' }}>{e.id}</span>
                      <span className="text-[10px] font-mono ml-auto" style={{ color:'var(--text3)' }}>{fmtDateTime(e.submittedAt)}</span>
                    </div>
                    <div className="text-[12.5px] font-bold mb-0.5" style={{ color:'var(--text)' }}>{e.subject}</div>
                    <div className="text-[11px] mb-1.5" style={{ color:'var(--text2)' }}>
                      <span style={{ color:'var(--text3)' }}>From:</span> {e.pocName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]" style={{ color:'var(--text3)' }}>
                      <Briefcase className="w-3 h-3" />
                      <span>{proj?.name ?? e.projectId}</span>
                      {e.attachments?.length > 0 && (
                        <>
                          <span className="mx-1">·</span>
                          <Paperclip className="w-3 h-3" />
                          <span>{e.attachments.length} attachment{e.attachments.length === 1 ? '' : 's'}</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Confirm modal ──────────────────────────────────────────────── */}
      <EnterpriseModal open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="Confirm Email Log"
        subtitle={project ? `${project.name} · ${project.id}` : ''}
        icon={<Mail className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="lg"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)}>Back to Edit</ModalBtn>
          <ModalBtn onClick={finalizeSubmit}>
            <Check className="w-3.5 h-3.5" /> Confirm &amp; Submit
          </ModalBtn>
        </>}>
        <div className="space-y-3 text-[12.5px]">
          <Row label="Project" value={project?.name ?? '—'} />
          <Row label="POC" value={(() => {
            if (draft.pocType === 'other') return draft.pocName
            const [, personId] = draft.pocType.split('|')
            const person = PEOPLE.find(p => p.id === personId)
            const role = POC_ROLES.find(r => r.key === draft.pocType.split('|')[0])
            return `${person?.name ?? personId} · ${role?.label ?? ''}`
          })()} />
          <Row label="Subject" value={draft.subject} />
          <Row label="Content" value={draft.body} multiline />
          <Row label="Attachments" value={draft.attachments.length > 0
            ? draft.attachments.map(a => `${a.name} (${fmtSize(a.size)})`).join(' · ')
            : 'None'} />
        </div>
      </EnterpriseModal>
    </div>
  )
}

function Field({ label, required, error, sub, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>
        {label} {required && <span style={{ color:'var(--danger)' }}>*</span>}
      </label>
      {sub && <div className="text-[10px] mb-1" style={{ color:'var(--text3)' }}>{sub}</div>}
      {children}
      {error && <div className="text-[10px] mt-1" style={{ color:'var(--danger)' }}>{error}</div>}
    </div>
  )
}

function Row({ label, value, multiline }) {
  return (
    <div className="rounded-lg p-2" style={{ background:'var(--bg2)' }}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{label}</div>
      <div className={multiline ? 'whitespace-pre-wrap' : 'truncate'} style={{ color:'var(--text)' }}>{value}</div>
    </div>
  )
}
