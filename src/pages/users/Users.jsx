import { useState, useCallback } from 'react'
import {
  UserCog, Plus, Search, Edit3, Trash2, Lock, Unlock, X,
  ArrowLeft, Shield, Eye, List, ChevronDown, ChevronUp,
} from 'lucide-react'
import useAdminStore from '../../store/adminStore'
import useRBACStore  from '../../store/rbacStore'
import { useToast }  from '../../hooks/useToast'
import { BlockUI }   from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import PermissionMatrix from '../../components/rbac/PermissionMatrix'
import MenuPreview      from '../../components/rbac/MenuPreview'
import NestedGrid       from '../../components/ui/NestedGrid'

const ROLE_COLORS = {
  admin:'text-amber-600 bg-amber-50 border-amber-200',
  manager:'text-blue-600 bg-blue-50 border-blue-200',
  operator:'text-emerald-600 bg-emerald-50 border-emerald-200',
  warehouse_staff:'text-purple-600 bg-purple-50 border-purple-200',
  driver:'text-teal-600 bg-teal-50 border-teal-200',
  viewer:'text-slate-500 bg-slate-50 border-slate-200',
}

function relTime(iso) {
  if (!iso) return 'Never'
  const d = (Date.now()-new Date(iso))/60000
  if (d<60) return Math.floor(d)+'m ago'
  if (d<1440) return Math.floor(d/60)+'h ago'
  return new Date(iso).toLocaleDateString('en-SA',{month:'short',day:'numeric'})
}

/* ── User form modal with permissions ─────────────────────────────────────────── */
function UserFormModal({ open, onClose, userData }) {
  const { createUser, updateUser }    = useAdminStore()
  const { roles }                     = useRBACStore()
  const { toast }                     = useToast()
  const isEdit = !!userData?.id
  const [form, setForm]   = useState(userData ?? {name:'',email:'',phone:'',role:'operator',dept:'',status:'active'})
  const [tab,  setTab]    = useState('info')

  // Get permissions for selected role
  const matchedRole  = roles.find(r => r.templateKey === form.role || r.name.toLowerCase().includes(form.role))
  const effectivePerms = matchedRole?.permissions ?? {}
  const visibleMenus   = useRBACStore.getState().getVisibleMenus(matchedRole?.id ?? '') ?? []

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = () => {
    if (!form.name||!form.email) { toast.warning('Required','Name and email are required.'); return }
    if (isEdit) { updateUser(userData.id, form); toast.success('Updated',`${form.name} updated.`) }
    else        { createUser(form);              toast.success('Created',`${form.name} added.`)    }
    onClose()
  }

  const TABS = [['info','Basic Info'],['perms','Permissions'],['menu','Menu Preview']]
  return (
    <EnterpriseModal open={open} onClose={onClose}
      title={isEdit?'Edit User':'Create User'}
      subtitle={isEdit?`Editing: ${userData.name}`:'Add a new system user'}
      icon={<UserCog className="w-4 h-4" style={{color:'var(--primary)'}} />}
      size="xl"
      footer={<><ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn><ModalBtn onClick={handleSubmit}>{isEdit?'Save Changes':'Create User'}</ModalBtn></>}>

      {/* Inner tabs */}
      <div className="flex gap-0.5 border-b mb-5 -mx-6 px-6" style={{borderColor:'var(--border)'}}>
        {TABS.map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px"
            style={tab===t?{borderColor:'var(--primary)',color:'var(--primary)'}:{borderColor:'transparent',color:'var(--text3)'}}>
            {l}
          </button>
        ))}
      </div>

      {tab==='info' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            {k:'name',  l:'Full Name *',   ph:'Abdullah Al-Rashid'},
            {k:'email', l:'Email *',       ph:'user@helms.sa'     },
            {k:'phone', l:'Phone',         ph:'+966 5X XXX XXXX'  },
            {k:'dept',  l:'Department',    ph:'Logistics Ops'     },
          ].map(({k,l,ph})=>(
            <div key={k}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--text3)'}}>{l}</div>
              <input value={form[k]??''} onChange={e=>set(k,e.target.value)} placeholder={ph}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
                style={{background:'var(--bg2)',borderColor:'var(--border)',color:'var(--text)'}} />
            </div>
          ))}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--text3)'}}>Role *</div>
            <select value={form.role} onChange={e=>set('role',e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none"
              style={{background:'var(--bg2)',borderColor:'var(--border)',color:'var(--text)'}}>
              {['admin','manager','operator','warehouse_staff','driver','viewer'].map(r=>(
                <option key={r} value={r}>{r.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{color:'var(--text3)'}}>Status</div>
            <div className="flex gap-2">
              {['active','inactive'].map(s=>(
                <button key={s} onClick={()=>set('status',s)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border capitalize transition-all"
                  style={form.status===s?{background:'var(--primary)',color:'#fff',borderColor:'var(--primary)'}:{background:'var(--card)',color:'var(--text2)',borderColor:'var(--border)'}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='perms' && (
        <div>
          {matchedRole ? (
            <PermissionMatrix roleId={matchedRole.id} permissions={effectivePerms} readOnly />
          ) : (
            <div className="py-12 text-center text-sm" style={{color:'var(--text3)'}}>
              No matching role found for <strong>{form.role}</strong>
            </div>
          )}
        </div>
      )}

      {tab==='menu' && (
        <MenuPreview permissions={effectivePerms} />
      )}
    </EnterpriseModal>
  )
}

/* ── Nested grid lazy loader ─────────────────────────────────────────────────── */
const MOCK_SHIPMENTS_FOR_USER = (userId) => [
  { id:`child-${userId}-1`, hasChildren:false, data:{id:`SHP-0088${userId.slice(-1)}`,status:'In Transit',customer:'Saudi Aramco',eta:'2d 4h',risk:'Low'}},
  { id:`child-${userId}-2`, hasChildren:false, data:{id:`SHP-0089${userId.slice(-1)}`,status:'Delivered', customer:'SABIC',          eta:'Done', risk:'—'  }},
]

/* ── Main Users Page ─────────────────────────────────────────────────────────── */
export default function Users() {
  const { filteredUsers, userFilter, setUserFilter, createUser, updateUser, deleteUser, toggleUserStatus, users } = useAdminStore()
  const { toast } = useToast()
  const [modal,     setModal]    = useState(null)
  const [viewMode,  setViewMode] = useState('table') // 'table' | 'nested'
  const filtered = filteredUsers()

  const stats = { total:users.length, active:users.filter(u=>u.status==='active').length, roles:new Set(users.map(u=>u.role)).size, inactive:users.filter(u=>u.status==='inactive').length }

  // Nested grid config
  const columns = [
    { key:'name',      label:'Name / ID',     width:'240px',
      render:(v,row)=>(
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-black flex-shrink-0"
            style={{background:'var(--primary-light)',color:'var(--primary)'}}>
            {v?.split(' ').map(n=>n[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="text-xs font-semibold" style={{color:'var(--text)'}}>{v}</div>
            <div className="text-[9px] font-mono" style={{color:'var(--text3)'}}>{row.data.id}</div>
          </div>
        </div>
      )
    },
    { key:'email',  label:'Email',    width:'200px', render:(v)=><span className="text-xs font-mono" style={{color:'var(--text2)'}}>{v}</span> },
    { key:'role',   label:'Role',     width:'140px',
      render:(v)=><span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md capitalize ${ROLE_COLORS[v]??ROLE_COLORS.viewer}`}>{v?.replace('_',' ')}</span>
    },
    { key:'dept',   label:'Dept',     width:'160px', render:(v)=><span className="text-xs" style={{color:'var(--text2)'}}>{v}</span> },
    { key:'status', label:'Status',   width:'100px',
      render:(v)=><span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${v==='active'?'text-emerald-600 bg-emerald-50 border-emerald-200':'text-slate-500 bg-slate-50 border-slate-200'}`}>{v?.toUpperCase()}</span>
    },
    { key:'lastLogin', label:'Last Login', width:'120px', render:(v)=><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{relTime(v)}</span> },
  ]

  const nestedRows = filtered.map(u=>({
    id: u.id,
    hasChildren: true,
    data: { ...u, name: u.name },
  }))

  const loadChildren = useCallback(async (row) => {
    await new Promise(r=>setTimeout(r,400)) // simulate async
    if (row.data.hasChildren===undefined) return MOCK_SHIPMENTS_FOR_USER(row.id)
    return []
  }, [])

  const USER_GRID_COLS = [
    { key:'id',      label:'Shipment ID', render:(v)=><span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{v}</span> },
    { key:'status',  label:'Status',      render:(v)=><span className="text-xs" style={{color:'var(--text)'}}>{v}</span> },
    { key:'customer',label:'Customer',    render:(v)=><span className="text-xs" style={{color:'var(--text2)'}}>{v}</span> },
    { key:'eta',     label:'ETA',         render:(v)=><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{v}</span> },
    { key:'risk',    label:'Risk',        render:(v)=><span className="text-[12.5px]" style={{color:'var(--text3)'}}>{v}</span> },
  ]

  return (
    <div className="space-y-4">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--primary-light)'}}>
            <UserCog className="w-4.5 h-4.5" style={{color:'var(--primary)'}} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{color:'var(--text)'}}>User Management</h2>
            <p className="text-[11px]" style={{color:'var(--text3)'}}>{filtered.length} of {stats.total} users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{background:'var(--card)',borderColor:'var(--border)'}}>
            {[['table','Table',List],['nested','Nested',ChevronDown]].map(([v,l,Icon])=>(
              <button key={v} onClick={()=>setViewMode(v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-bold transition-all"
                style={viewMode===v?{background:'var(--primary)',color:'#fff'}:{color:'var(--text3)'}}>
                <Icon className="w-3.5 h-3.5" />{l}
              </button>
            ))}
          </div>
          <button onClick={()=>setModal('create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{background:'var(--primary)'}}>
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'Total Users', v:stats.total,    c:'var(--text)'    },
          {l:'Active',      v:stats.active,   c:'var(--success)' },
          {l:'Inactive',    v:stats.inactive, c:'var(--danger)'  },
          {l:'Roles',       v:stats.roles,    c:'var(--purple)'  },
        ].map(({l,v,c})=>(
          <div key={l} className="rounded-xl border p-4" style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow)'}}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text3)'}} />
          <input value={userFilter.search} onChange={e=>setUserFilter('search',e.target.value)}
            placeholder="Search name or email…"
            className="rounded-xl pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-44"
            style={{background:'var(--card)',borderColor:'var(--border)',color:'var(--text)'}} />
        </div>
        {[['all','All'],['admin','Admin'],['manager','Manager'],['operator','Operator'],['viewer','Viewer']].map(([v,l])=>(
          <button key={v} onClick={()=>setUserFilter('role',v)}
            className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
            style={userFilter.role===v?{background:'var(--primary)',color:'#fff',borderColor:'var(--primary)'}:{background:'var(--card)',color:'var(--text2)',borderColor:'var(--border)'}}>
            {l}
          </button>
        ))}
        {[['all','All Status'],['active','Active'],['inactive','Inactive']].map(([v,l])=>(
          <button key={v} onClick={()=>setUserFilter('status',v)}
            className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
            style={userFilter.status===v?{background:'var(--primary)',color:'#fff',borderColor:'var(--primary)'}:{background:'var(--card)',color:'var(--text2)',borderColor:'var(--border)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* View: Table */}
      {viewMode==='table' && (
        <div className="rounded-xl border overflow-hidden" style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow)'}}>
          <table className="w-full text-sm">
            <thead className="border-b" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <tr>
                {['User','Email','Role','Department','Status','Last Login','Actions'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--text3)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{borderColor:'var(--border)'}}>
              {filtered.map(u=>{
                const rc = ROLE_COLORS[u.role]??ROLE_COLORS.viewer
                return (
                  <tr key={u.id} className="transition-colors"
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                          {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold" style={{color:'var(--text)'}}>{u.name}</div>
                          <div className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-mono" style={{color:'var(--text2)'}}>{u.email}</span></td>
                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md capitalize ${rc}`}>{u.role.replace('_',' ')}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{color:'var(--text2)'}}>{u.dept}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${u.status==='active'?'text-emerald-600 bg-emerald-50 border-emerald-200':'text-slate-500 bg-slate-50 border-slate-200'}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{color:'var(--text3)'}}>{relTime(u.lastLogin)}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>setModal(u)} style={{color:'var(--primary)'}}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                          onMouseEnter={e=>e.currentTarget.style.background='var(--primary-light)'}
                          onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={()=>toggleUserStatus(u.id)} style={{color:u.status==='active'?'var(--warning)':'var(--success)'}}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all">
                          {u.status==='active'?<Lock className="w-3.5 h-3.5"/>:<Unlock className="w-3.5 h-3.5"/>}
                        </button>
                        <button onClick={()=>{deleteUser(u.id);toast.warning('Deleted',`${u.name} removed.`)}}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 transition-all"
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,.08)'}
                          onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View: Nested Grid */}
      {viewMode==='nested' && (
        <div>
          <p className="text-xs mb-3" style={{color:'var(--text3)'}}>
            Click ▶ to expand a user and view their assigned shipments. Nested data loads lazily.
          </p>
          <NestedGrid
            columns={columns}
            rows={nestedRows}
            loadChildren={loadChildren}
            maxDepth={2}
          />
        </div>
      )}

      {/* User form modal */}
      {modal && (
        <UserFormModal
          open={!!modal}
          onClose={()=>setModal(null)}
          userData={modal==='create'?null:modal}
        />
      )}
    </div>
  )
}
