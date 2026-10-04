import { useState, useCallback } from 'react'
import {
  Shield, Plus, Search, Copy, Trash2, Edit3, ChevronRight,
  ArrowLeft, Users, Calendar, CheckCircle2, X, AlertTriangle,
} from 'lucide-react'
import useRBACStore  from '../../store/rbacStore'
import { useToast }  from '../../hooks/useToast'
import { BlockUI }   from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import PermissionMatrix from '../../components/rbac/PermissionMatrix'
import MenuPreview      from '../../components/rbac/MenuPreview'
import { PERMISSION_AUDIT_LOG, PERM_TYPES } from '../../api/mock/rbacData'

const ROLE_COLOR_CFG = {
  amber:  { ring:'rgba(180,83,9,.3)',  bg:'rgba(251,191,36,.08)',  text:'#B45309'  },
  blue:   { ring:'rgba(29,78,216,.3)', bg:'rgba(37,99,235,.06)',   text:'#1D4ED8'  },
  purple: { ring:'rgba(124,58,237,.3)',bg:'rgba(124,58,237,.06)',  text:'#7C3AED'  },
  teal:   { ring:'rgba(13,148,136,.3)',bg:'rgba(13,148,136,.06)',  text:'#0D9488'  },
  orange: { ring:'rgba(234,88,12,.3)', bg:'rgba(234,88,12,.06)',   text:'#EA580C'  },
  green:  { ring:'rgba(5,150,105,.3)', bg:'rgba(5,150,105,.06)',   text:'#059669'  },
  indigo: { ring:'rgba(67,56,202,.3)', bg:'rgba(67,56,202,.06)',   text:'#4338CA'  },
  slate:  { ring:'rgba(71,85,105,.3)', bg:'rgba(71,85,105,.06)',   text:'#475569'  },
}

function relTime(iso) {
  const d = (Date.now()-new Date(iso).getTime())/86400000
  if (d<1) return 'today'
  if (d<7) return Math.floor(d)+'d ago'
  return new Date(iso).toLocaleDateString('en-SA',{month:'short',day:'numeric',year:'numeric'})
}

/* ── Role Card ───────────────────────────────────────────────────────────────── */
function RoleCard({ role, onEdit, onClone, onDelete, onSelect }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cfg = ROLE_COLOR_CFG[role.color] ?? ROLE_COLOR_CFG.slate
  const totalPerms = Object.values(role.permissions).flat().length
  const modules    = Object.keys(role.permissions).filter(m=>role.permissions[m]?.length>0).length

  return (
    <div className="rounded-2xl border overflow-hidden transition-all cursor-pointer group"
      style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow)'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.borderColor=cfg.ring}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow)';e.currentTarget.style.borderColor='var(--border)'}}
      onClick={()=>onSelect(role.id)}>
      {/* Accent bar */}
      <div className="h-1 w-full" style={{background:cfg.text}} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:cfg.bg,border:`1.5px solid ${cfg.ring}`}}>
              <Shield className="w-5 h-5" style={{color:cfg.text}} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{color:'var(--text)'}}>{role.name}</div>
              <div className="text-[12.5px] font-mono mt-0.5" style={{color:'var(--text3)'}}>{role.id}</div>
            </div>
          </div>
          {/* Action menu */}
          <div className="relative" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setMenuOpen(v=>!v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              style={{color:'var(--text3)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
              onMouseLeave={e=>e.currentTarget.style.background=''}>
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-40 rounded-xl border z-20 overflow-hidden animate-fade-in"
                style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow-md)'}}>
                {[
                  {icon:Edit3,  label:'Edit Role',   fn:()=>{onEdit(role); setMenuOpen(false)}, color:'var(--text2)' },
                  {icon:Copy,   label:'Clone Role',   fn:()=>{onClone(role.id);setMenuOpen(false)}, color:'var(--text2)' },
                  {icon:Users,  label:'View Users',   fn:()=>{setMenuOpen(false)},color:'var(--text2)' },
                  {icon:Trash2, label:'Delete Role',  fn:()=>{onDelete(role.id);setMenuOpen(false)}, color:'var(--danger)' },
                ].map(({icon:Icon,label,fn,color})=>(
                  <button key={label} onClick={fn}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
                    style={{color}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs mb-4 leading-relaxed" style={{color:'var(--text2)'}}>{role.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {l:'Users',   v:role.userCount,  c:'var(--text)'   },
            {l:'Modules', v:modules,          c:'var(--primary)'},
            {l:'Perms',   v:totalPerms,       c:cfg.text       },
          ].map(({l,v,c})=>(
            <div key={l} className="rounded-lg px-2.5 py-2 text-center"
              style={{background:'var(--bg2)',border:'1px solid var(--border)'}}>
              <div className="text-lg font-black font-mono" style={{color:c}}>{v}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{color:'var(--text3)'}}>{l}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12.5px]" style={{color:'var(--text3)'}}>
            <Calendar className="w-3 h-3" />
            Created {relTime(role.createdAt)}
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border
            ${role.status==='active'?'text-emerald-600 bg-emerald-50 border-emerald-200':'text-slate-500 bg-slate-50 border-slate-200'}`}>
            {role.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Create / Edit Role Modal ────────────────────────────────────────────────── */
function RoleFormModal({ open, onClose, roleData }) {
  const { createRole, updateRole } = useRBACStore()
  const { toast } = useToast()
  const [form, setForm] = useState(roleData ?? {name:'',description:'',color:'blue',status:'active'})
  const isEdit = !!roleData?.id

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.warning('Required','Role name is required.'); return }
    if (isEdit) { updateRole(roleData.id, form); toast.success('Role Updated','Changes saved.') }
    else        { createRole(form);              toast.success('Role Created',`${form.name} created.`) }
    onClose()
  }

  const COLORS = Object.keys(ROLE_COLOR_CFG)
  return (
    <EnterpriseModal open={open} onClose={onClose}
      title={isEdit?'Edit Role':'Create New Role'}
      subtitle={isEdit?`Editing: ${roleData.name}`:'Define a new access control role'}
      icon={<Shield className="w-4 h-4" style={{color:'var(--primary)'}} />}
      size="sm"
      footer={<><ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn><ModalBtn onClick={handleSubmit}>{isEdit?'Save Changes':'Create Role'}</ModalBtn></>}>
      <div className="space-y-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--text3)'}}>Role Name *</div>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            placeholder="e.g. Logistics Manager"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
            style={{background:'var(--bg2)',borderColor:'var(--border)',color:'var(--text)'}} />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--text3)'}}>Description</div>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
            placeholder="Brief description of this role's responsibilities…" rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none"
            style={{background:'var(--bg2)',borderColor:'var(--border)',color:'var(--text)'}} />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{color:'var(--text3)'}}>Role Color</div>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c=>{
              const cfg = ROLE_COLOR_CFG[c]
              return (
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{background:cfg.text,borderColor:form.color===c?cfg.text:'transparent',
                    boxShadow:form.color===c?`0 0 0 3px ${cfg.ring}`:'none'}} />
              )
            })}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--text3)'}}>Status</div>
          <div className="flex gap-2">
            {['active','inactive'].map(s=>(
              <button key={s} onClick={()=>setForm(f=>({...f,status:s}))}
                className="flex-1 py-2 text-xs font-bold rounded-xl border capitalize transition-all"
                style={form.status===s
                  ?{background:'var(--primary)',color:'#fff',borderColor:'var(--primary)'}
                  :{background:'var(--card)',color:'var(--text2)',borderColor:'var(--border)'}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </EnterpriseModal>
  )
}

/* ── Role Detail (permission editor) ─────────────────────────────────────────── */
function RoleDetail({ roleId, onBack }) {
  const { roles, togglePermission, toggleModuleAll, toggleAllPermissions, cloneRole, deleteRole, auditLog } = useRBACStore()
  const { toast } = useToast()
  const role = roles.find(r=>r.id===roleId)
  const [tab, setTab] = useState('matrix')
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!role) return null

  const cfg = ROLE_COLOR_CFG[role.color] ?? ROLE_COLOR_CFG.slate
  const visibleMenus = useRBACStore.getState().getVisibleMenus(roleId)
  const roleAudit    = auditLog.filter(l=>l.targetRole===role.name).slice(0,15)

  const handleMatrixChange = (moduleId, permOrAll, enabled) => {
    if (moduleId==='__all') { toggleAllPermissions(roleId, true);  return }
    if (moduleId==='__none'){ toggleAllPermissions(roleId, false); return }
    if (typeof enabled === 'boolean' && typeof permOrAll === 'boolean') {
      toggleModuleAll(roleId, moduleId, permOrAll); return
    }
    togglePermission(roleId, moduleId, permOrAll)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text2)'}}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:cfg.bg,border:`1.5px solid ${cfg.ring}`}}>
          <Shield className="w-5 h-5" style={{color:cfg.text}} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{color:'var(--text)'}}>{role.name}</h2>
          <div className="text-xs" style={{color:'var(--text3)'}}>
            {Object.values(role.permissions).flat().length} permissions · {visibleMenus.length} menus visible
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={()=>{cloneRole(roleId);toast.info('Cloned',`${role.name} (Copy) created.`)}}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{background:'var(--card)',borderColor:'var(--border)',color:'var(--text2)'}}>
            <Copy className="w-3.5 h-3.5" />Clone
          </button>
          <button onClick={()=>setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all text-red-600"
            style={{background:'var(--card)',borderColor:'var(--border)'}}>
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b" style={{borderColor:'var(--border)'}}>
        {[['matrix','Permissions'],['menu','Menu Preview'],['audit','Audit Trail']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px"
            style={tab===t?{borderColor:'var(--primary)',color:'var(--primary)'}:{borderColor:'transparent',color:'var(--text3)'}}>
            {l}
          </button>
        ))}
      </div>

      {tab==='matrix' && (
        <PermissionMatrix
          roleId={roleId}
          permissions={role.permissions}
          onChange={handleMatrixChange}
        />
      )}

      {tab==='menu' && (
        <div className="grid grid-cols-2 gap-4">
          <MenuPreview permissions={role.permissions} />
          <div className="space-y-3">
            <div className="rounded-xl border p-4" style={{background:'var(--card)',borderColor:'var(--border)'}}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'var(--text2)'}}>Role Summary</div>
              <div className="space-y-2">
                {[
                  {l:'Role Name',     v:role.name                                   },
                  {l:'Description',   v:role.description                            },
                  {l:'Users Assigned',v:role.userCount                              },
                  {l:'Created By',    v:role.createdBy                              },
                  {l:'Last Updated',  v:relTime(role.updatedAt)                     },
                  {l:'Total Permissions',v:Object.values(role.permissions).flat().length},
                ].map(({l,v})=>(
                  <div key={l} className="flex justify-between text-xs py-1.5 border-b last:border-0" style={{borderColor:'var(--border)'}}>
                    <span style={{color:'var(--text3)'}}>{l}</span>
                    <span className="font-medium" style={{color:'var(--text)'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* AI suggestion */}
            <div className="rounded-xl border p-4" style={{background:'rgba(124,58,237,.05)',borderColor:'rgba(124,58,237,.2)'}}>
              <div className="flex items-center gap-2 mb-2">
                <span>🤖</span>
                <span className="text-xs font-bold" style={{color:'#7C3AED'}}>AI Permission Suggestions</span>
              </div>
              <p className="text-xs leading-relaxed" style={{color:'var(--text2)'}}>
                Users in <strong>{role.name}</strong> typically also need:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['View AI Analytics','Export Reports','Assign Vendors'].map(s=>(
                  <span key={s} className="text-[12.5px] px-2 py-0.5 rounded-md font-medium"
                    style={{background:'rgba(124,58,237,.1)',color:'#7C3AED',border:'1px solid rgba(124,58,237,.2)'}}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='audit' && (
        <div className="rounded-xl border overflow-hidden" style={{background:'var(--card)',borderColor:'var(--border)'}}>
          <div className="px-4 py-3 border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--text2)'}}>Permission Change Log — {role.name}</h3>
          </div>
          {roleAudit.length===0
            ? <div className="py-12 text-center text-sm" style={{color:'var(--text3)'}}>No audit entries for this role</div>
            : (
              <table className="w-full">
                <thead className="border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                  <tr>
                    {['Timestamp','Actor','Action','Module','Permission','Old','New'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--text3)'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{borderColor:'var(--border)'}}>
                  {roleAudit.map(log=>(
                    <tr key={log.id}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td className="px-4 py-2.5"><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{new Date(log.timestamp).toLocaleString('en-SA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span></td>
                      <td className="px-4 py-2.5"><span className="text-xs" style={{color:'var(--text)'}}>{log.actor.split(' ')[0]}</span></td>
                      <td className="px-4 py-2.5"><span className="text-xs" style={{color:'var(--text2)'}}>{log.action}</span></td>
                      <td className="px-4 py-2.5"><span className="text-xs" style={{color:'var(--text2)'}}>{log.module}</span></td>
                      <td className="px-4 py-2.5"><span className="text-xs font-mono" style={{color:'var(--primary)'}}>{log.permission}</span></td>
                      <td className="px-4 py-2.5"><span className="text-[12.5px]" style={{color:'var(--danger)'}}>{log.oldValue??'—'}</span></td>
                      <td className="px-4 py-2.5"><span className="text-[12.5px]" style={{color:'var(--success)'}}>{log.newValue??'—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* Delete confirm modal */}
      <EnterpriseModal open={confirmDelete} onClose={()=>setConfirmDelete(false)}
        title="Delete Role"
        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        size="sm"
        footer={<>
          <ModalBtn variant="secondary" onClick={()=>setConfirmDelete(false)}>Cancel</ModalBtn>
          <ModalBtn variant="danger" onClick={()=>{deleteRole(roleId);toast.warning('Deleted',`${role.name} deleted.`);onBack()}}>Delete Role</ModalBtn>
        </>}>
        <p className="text-sm" style={{color:'var(--text)'}}>
          Are you sure you want to delete <strong>{role.name}</strong>? This will affect <strong>{role.userCount} users</strong>.
        </p>
        <p className="text-xs mt-2" style={{color:'var(--text3)'}}>This action cannot be undone.</p>
      </EnterpriseModal>
    </div>
  )
}

/* ── Main Roles Page ──────────────────────────────────────────────────────────── */
export default function Roles() {
  const { roles, cloneRole, deleteRole } = useRBACStore()
  const { toast } = useToast()
  const [selectedId,  setSelectedId]  = useState(null)
  const [search,      setSearch]      = useState('')
  const [formModal,   setFormModal]   = useState(null) // null | 'create' | roleObj

  const filtered = roles.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  )

  if (selectedId) return <RoleDetail roleId={selectedId} onBack={()=>setSelectedId(null)} />

  return (
    <div className="space-y-5">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{background:'var(--primary-light)',border:'1px solid rgba(37,99,235,.2)'}}>
            <Shield className="w-4.5 h-4.5" style={{color:'var(--primary)'}} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{color:'var(--text)'}}>Roles & Permissions</h2>
            <p className="text-[11px]" style={{color:'var(--text3)'}}>
              {roles.length} roles · RBAC permission engine · Click a role to manage
            </p>
          </div>
        </div>
        <button onClick={()=>setFormModal('create')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white"
          style={{background:'var(--primary)'}}>
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'Total Roles',   v:roles.length,                                     c:'var(--text)'    },
          {l:'Total Users',   v:roles.reduce((a,r)=>a+r.userCount,0),             c:'var(--primary)' },
          {l:'Active Roles',  v:roles.filter(r=>r.status==='active').length,      c:'var(--success)' },
          {l:'Total Permissions', v:roles.reduce((a,r)=>a+Object.values(r.permissions).flat().length,0), c:'var(--warning)' },
        ].map(({l,v,c})=>(
          <div key={l} className="rounded-xl border p-4" style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow)'}}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text3)'}} />
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search roles…"
          className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border focus:outline-none"
          style={{background:'var(--card)',borderColor:'var(--border)',color:'var(--text)'}} />
      </div>

      {/* Role grid */}
      <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(role=>(
          <RoleCard key={role.id} role={role}
            onSelect={setSelectedId}
            onEdit={r=>setFormModal(r)}
            onClone={id=>{cloneRole(id);toast.info('Cloned','Role copy created as draft.')}}
            onDelete={id=>{deleteRole(id);toast.warning('Deleted','Role removed.')}} />
        ))}
      </div>

      <p className="text-[11px] text-center" style={{color:'var(--text3)'}}>
        Select a role to view and edit its full permission matrix
      </p>

      {/* Form modal */}
      <RoleFormModal
        open={!!formModal}
        onClose={()=>setFormModal(null)}
        roleData={formModal==='create'?null:formModal}
      />
    </div>
  )
}
