import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Shield, ArrowLeft, Save, X, AlertCircle, Eye, CheckCircle2, XCircle,
  Layers, Lock, AlertTriangle,
} from 'lucide-react'
import useRBACv2Store from '../../store/rbacV2Store'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import PermissionMatrix from '../../components/rbac/PermissionMatrix'
import {
  PERMISSION_TREE, permissionSummary, visibleMenusFromPermissions,
} from '../../api/mock/permissionTree'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

const COLOR_OPTS = [
  { id: '#DC2626', label: 'Red'    },
  { id: '#D97706', label: 'Amber'  },
  { id: '#059669', label: 'Green'  },
  { id: '#0891B2', label: 'Cyan'   },
  { id: '#2563EB', label: 'Blue'   },
  { id: '#7C3AED', label: 'Purple' },
  { id: '#DB2777', label: 'Pink'   },
  { id: '#475569', label: 'Slate'  },
]

const EMPTY = {
  name: '', description: '', color: '#2563EB', badge: 'NR', status: 'active', permissions: {},
}

// ─── Atoms ───────────────────────────────────────────────────────────────────
function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color:'var(--text3)' }}>
        {label} {required && <span style={{ color:'var(--danger)' }}>*</span>}
      </label>
      {children}
      {error && <div className="flex items-center gap-1 mt-1 text-[12.5px]" style={{ color:'var(--danger)' }}><AlertCircle className="w-3 h-3" /> {error}</div>}
      {hint && !error && <div className="text-[12.5px] mt-1" style={{ color:'var(--text3)' }}>{hint}</div>}
    </div>
  )
}
function Input(props) {
  return <input {...props}
    className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
    style={{ background:'var(--bg2)', borderColor: props.error ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
}

// ─── Live Menu Preview ────────────────────────────────────────────────────────
function MenuPreview({ permissions }) {
  const visibleMenuIds = useMemo(() => visibleMenusFromPermissions(permissions), [permissions])
  const visible = PERMISSION_TREE.filter(m => visibleMenuIds.includes(m.id))
  const hidden  = PERMISSION_TREE.filter(m => !visibleMenuIds.includes(m.id))
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Live Menu Preview</h3>
        </div>
        <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>What this role can see</p>
      </div>
      <div className="px-4 py-2 flex items-center justify-between text-[12.5px]" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <span style={{ color:'var(--text3)' }}>Menus visible</span>
        <span className="font-mono font-bold" style={{ color:'var(--primary)' }}>{visible.length} / {PERMISSION_TREE.length}</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-2">
        {visible.length > 0 && (
          <div className="mb-3">
            <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5" style={{ color:'var(--success)' }}>✓ Visible</div>
            {visible.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs animate-fade-in"
                style={{ background:'rgba(5,150,105,.04)', color:'var(--text)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-base">{m.icon}</span>
                <span className="font-medium truncate">{m.label}</span>
              </div>
            ))}
          </div>
        )}
        {hidden.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5" style={{ color:'var(--text3)' }}>✗ Hidden</div>
            {hidden.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs opacity-50">
                <XCircle className="w-3.5 h-3.5 text-red-300 flex-shrink-0" />
                <span className="text-base">{m.icon}</span>
                <span style={{ color:'var(--text3)' }}>{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AccessStats({ permissions }) {
  const sum = permissionSummary(permissions)
  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-3 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Access Summary</h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {[
          { l:'Menus',       v:`${sum.menus} / ${PERMISSION_TREE.length}`,     c:'var(--primary)' },
          { l:'Submenus',    v:`${sum.submenus} / ${sum.totalSubmenus}`,       c:'var(--purple)'  },
          { l:'Pages',       v:`${sum.pages} / ${sum.totalPages}`,             c:'var(--cyan)'    },
          { l:'Permissions', v:`${sum.granted} / ${sum.total}`,                c:'var(--success)' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-lg p-2.5 text-center" style={{ background:'var(--bg2)' }}>
            <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-sm font-bold font-mono" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RoleCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { createRole, updateRole, getRole, cloneRole } = useRBACv2Store()
  const { toast } = useToast()

  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const r = getRole(id)
      if (r) setForm({ ...EMPTY, ...r })
    }
  }, [id, isEdit, getRole])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = 'Role name is required'
    if (!form.description?.trim()) e.description = 'Description is required'
    if (Object.values(form.permissions).filter(Boolean).length === 0) e.permissions = 'Grant at least one permission'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) { toast.warning('Validation', 'Fix highlighted fields.'); setConfirmOpen(false); return }
    setSaving(true)
    setTimeout(() => {
      if (isEdit) {
        updateRole(id, form)
        toast.success('Role Updated', `${form.name} has been saved.`)
      } else {
        const newId = createRole(form)
        toast.success('Role Created', `${form.name} created (${newId}).`)
      }
      setSaving(false); setConfirmOpen(false)
      navigate('/roles')
    }, 400)
  }

  return (
    <div className="space-y-4 pb-8">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/roles')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <Shield className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>{isEdit ? 'Edit Role' : 'Create Role'}</h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>{isEdit ? form.name : 'Define permissions for a new system role'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/roles')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={() => setConfirmOpen(true)} className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>

      {/* 70/30 layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT — Permission Matrix (70%) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Role information */}
          <div className="rounded-xl border p-5" style={C}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color:'var(--text)' }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--primary)' }}>1</span>
              Role Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role Name" required error={errors.name}>
                <Input value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="e.g. Senior Project Manager" />
              </Field>
              <Field label="Status">
                <Select2 options={[{ id:'active', label:'Active' },{ id:'inactive', label:'Inactive' }]} value={form.status} onChange={v => set('status', v)} />
              </Field>
              <div className="col-span-2">
                <Field label="Description" required error={errors.description}>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
                    style={{ background:'var(--bg2)', borderColor: errors.description ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }}
                    placeholder="What this role does and who it's for…" />
                </Field>
              </div>
              <Field label="Badge (2 letters)">
                <Input value={form.badge} maxLength={2} onChange={e => set('badge', e.target.value.toUpperCase())} placeholder="PM" />
              </Field>
              <Field label="Color">
                <Select2 options={COLOR_OPTS} value={form.color} onChange={v => set('color', v)} getIcon={o => <span className="w-3 h-3 rounded-full inline-block" style={{ background:o.id }} />} />
              </Field>
            </div>
          </div>

          {/* Matrix */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background:'var(--primary)' }}>2</span>
              <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>Permission Matrix</h3>
              {errors.permissions && <span className="text-[12.5px] font-bold" style={{ color:'var(--danger)' }}>· {errors.permissions}</span>}
            </div>
            <PermissionMatrix permissions={form.permissions} onChange={p => set('permissions', p)} />
          </div>
        </div>

        {/* RIGHT — Preview + Stats (30%) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="sticky top-4 space-y-4">
            {/* Role preview card */}
            <div className="rounded-xl border p-4" style={C}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white"
                  style={{ background: form.color || 'var(--primary)' }}>
                  {form.badge || form.name.slice(0,2).toUpperCase() || 'NR'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color:'var(--text)' }}>{form.name || 'New Role'}</div>
                  <div className="text-[12.5px] truncate" style={{ color:'var(--text3)' }}>{form.description || 'No description yet'}</div>
                </div>
              </div>
            </div>
            <AccessStats permissions={form.permissions} />
            <MenuPreview permissions={form.permissions} />
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <EnterpriseModal open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)}
        title={isEdit ? 'Confirm Save Changes' : 'Confirm Create Role'}
        subtitle={form.name || 'New Role'}
        icon={<Shield className="w-4 h-4" style={{ color:'var(--primary)' }} />}
        size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Review Again</ModalBtn>
          <ModalBtn onClick={handleSave} loading={saving}>{isEdit ? 'Yes, Save Changes' : 'Yes, Create Role'}</ModalBtn>
        </>}>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
            <p className="text-xs" style={{ color:'var(--text2)' }}>
              {isEdit
                ? <>Changes to this role take effect on each assigned user's next sign-in. The change is recorded in the audit trail.</>
                : <>The role will be created and become available immediately for user assignment. All permissions are recorded in the audit trail.</>}
            </p>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
            <div className="px-4 py-2 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Summary</span>
            </div>
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {(() => {
                const sum = permissionSummary(form.permissions)
                return [
                  ['Role Name',     form.name],
                  ['Status',        form.status],
                  ['Menus',         `${sum.menus} of ${PERMISSION_TREE.length}`],
                  ['Permissions',   `${sum.granted} granted`],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center px-4 py-2.5">
                    <span className="text-[12.5px] font-bold uppercase tracking-wider w-40 flex-shrink-0" style={{ color:'var(--text3)' }}>{l}</span>
                    <span className="text-sm font-medium" style={{ color:'var(--text)' }}>{v}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
