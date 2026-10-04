import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCog, Plus, Search, LayoutGrid, List, Download, Eye, Edit3,
  Power, RotateCcw, Key, Unlock, MoreVertical, Mail, Phone,
  ChevronLeft, ChevronRight, AlertTriangle, Clock, ShieldOff,
} from 'lucide-react'
import useUserStore from '../../store/userStore'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  USER_TYPES, USER_STATUSES, DEPARTMENTS, ROLES_OPTIONS,
} from '../../api/mock/userData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

function relTime(iso) {
  if (!iso) return 'Never'
  const d = (Date.now() - new Date(iso).getTime()) / 60000
  if (d < 60)    return Math.floor(d) + 'm ago'
  if (d < 1440)  return Math.floor(d / 60) + 'h ago'
  return new Date(iso).toLocaleDateString('en-SA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }) {
  const cfg = USER_STATUSES[status] ?? USER_STATUSES.inactive
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function TypeBadge({ type }) {
  const t = USER_TYPES[type] ?? USER_TYPES.employee
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md"
    style={{ background: t.color + '15', color: t.color, border: `1px solid ${t.color}30` }}>
    {t.icon} {t.label}
  </span>
}

// ─── Row actions menu (status-aware) ──────────────────────────────────────────
function RowActions({ user, onView, onEdit, onDeactivate, onActivate, onResetPwd, onUnlock }) {
  const [open, setOpen] = useState(false)
  const isInactive = user.status === 'inactive'
  const isLocked   = user.status === 'locked' || user.status === 'expired'

  const items = [
    { icon: Eye,    label: 'View',           fn: onView,     color: 'var(--text2)' },
    { icon: Edit3,  label: 'Edit',           fn: onEdit,     color: 'var(--text2)' },
    isInactive
      ? { icon: Power,   label: 'Activate',   fn: onActivate,    color: 'var(--success)' }
      : { icon: Power,   label: 'Deactivate', fn: onDeactivate,  color: 'var(--danger)'  },
    isLocked
      ? { icon: Unlock,  label: 'Unlock Account', fn: onUnlock,  color: 'var(--success)' }
      : null,
    { icon: Key, label: 'Reset Password', fn: onResetPwd, color: 'var(--warning)' },
  ].filter(Boolean)

  return (
    <div className="relative" onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{color:'var(--text3)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
        onMouseLeave={e=>e.currentTarget.style.background=''}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={()=>setOpen(false)} />
          <div className="absolute right-0 top-8 w-44 rounded-xl border z-30 overflow-hidden animate-fade-in"
            style={{background:'var(--card)',borderColor:'var(--border)',boxShadow:'var(--shadow-md)'}}>
            {items.map(({ icon:Icon, label, fn, color })=>(
              <button key={label} onClick={()=>{fn();setOpen(false)}}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors" style={{color}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Account expiry indicator ─────────────────────────────────────────────────
function ExpiryIndicator({ user }) {
  if (user.neverExpires) return <span className="text-[12.5px]" style={{ color: 'var(--text3)' }}>Never</span>
  const days = Math.floor((new Date(user.accountExpiry) - Date.now()) / 86400000)
  if (days < 0) return <span className="text-[12.5px] font-bold text-red-600">Expired</span>
  const color = days <= 3 ? 'var(--danger)' : days <= 7 ? 'var(--warning)' : days <= 14 ? 'var(--cyan)' : 'var(--text3)'
  return (
    <div className="flex items-center gap-1">
      <Clock className="w-3 h-3" style={{ color }} />
      <span className="text-[12.5px] font-mono font-semibold" style={{ color }}>{days}d</span>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange, total, showing }) {
  let pages = []
  if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  else if (page <= 4)              pages = [1,2,3,4,5,'…',totalPages]
  else if (page >= totalPages - 3) pages = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
  else                             pages = [1,'…',page-1,page,page+1,'…',totalPages]

  return (
    <div className="flex items-center justify-between gap-3 px-2">
      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
        Showing <strong style={{ color: 'var(--text)' }}>{showing}</strong> of <strong style={{ color: 'var(--text)' }}>{total}</strong>
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={i} className="px-1.5 text-xs" style={{ color: 'var(--text3)' }}>…</span>
          : <button key={i} onClick={() => onChange(p)}
              className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border transition-all"
              style={p === page
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : { background: 'var(--card)', color: 'var(--text2)', borderColor: 'var(--border)' }}>
              {p}
            </button>
        )}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserList() {
  const navigate = useNavigate()
  const { filteredUsers, filter, setFilter, viewMode, setViewMode, users,
    deactivateUser, activateUser, resetPassword, unlockAccount } = useUserStore()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)  // { type, user }
  const [resetReason, setResetReason]     = useState('User forgot password')

  const fullList = filteredUsers()
  useEffect(() => { setPage(1) }, [filter.search, filter.type, filter.role, filter.status, filter.dept])

  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const list = fullList.slice(startIdx, startIdx + PAGE_SIZE)

  const stats = {
    total:   users.length,
    active:  users.filter(u => u.status === 'active').length,
    locked:  users.filter(u => u.status === 'locked').length,
    inactive:users.filter(u => u.status === 'inactive').length,
  }

  // Confirmation handler
  const askConfirm = (type, user) => {
    setResetReason('User forgot password')
    setConfirmAction({ type, user })
  }
  const performAction = () => {
    if (!confirmAction) return
    const { type, user } = confirmAction
    if (type === 'deactivate') { deactivateUser(user.id); toast.warning('User Deactivated', `${user.name} has been deactivated.`) }
    else if (type === 'activate'){ activateUser(user.id); toast.success('User Activated', `${user.name} is now active.`) }
    else if (type === 'reset')   { resetPassword(user.id, resetReason); toast.info('Password Reset', `Password reset link sent for ${user.name}.`) }
    else if (type === 'unlock')  { unlockAccount(user.id); toast.success('Account Unlocked', `${user.name}'s account is unlocked.`) }
    setConfirmAction(null)
  }

  // Select2 filter options
  const typeOpts   = [{ id: 'all', label: 'All Types' }, ...Object.values(USER_TYPES).map(t => ({ id: t.id, label: t.label, icon: t.icon }))]
  const roleOpts   = [{ id: 'all', label: 'All Roles' }, ...ROLES_OPTIONS]
  const statusOpts = [{ id: 'all', label: 'All Status' }, ...Object.entries(USER_STATUSES).map(([k,v]) => ({ id: k, label: v.label }))]
  const deptOpts   = [{ id: 'all', label: 'All Departments' }, ...DEPARTMENTS.map(d => ({ id: d, label: d }))]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <UserCog className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>User Management</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{fullList.length} of {stats.total} users · No-delete policy: deactivate only</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
            {[['list','List',List],['card','Cards',LayoutGrid]].map(([v,l,Icon])=>(
              <button key={v} onClick={()=>setViewMode(v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-bold transition-all"
                style={viewMode===v?{background:'var(--primary)',color:'#fff'}:{color:'var(--text3)'}}>
                <Icon className="w-3.5 h-3.5" />{l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={()=>navigate('/users/create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Users', v:stats.total,    c:'var(--text)'    },
          { l:'Active',      v:stats.active,   c:'var(--success)' },
          { l:'Locked',      v:stats.locked,   c:'var(--danger)'  },
          { l:'Inactive',    v:stats.inactive, c:'var(--text3)'   },
        ].map(({ l, v, c })=>(
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={filter.search} onChange={e=>setFilter('search',e.target.value)}
            placeholder="Search name, email, ID, mobile…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-64"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Select2 options={typeOpts}   value={filter.type}   onChange={v => setFilter('type', v ?? 'all')}   getIcon={o=>o.icon} placeholder="Filter type…"   size="sm" />
        <Select2 options={roleOpts}   value={filter.role}   onChange={v => setFilter('role', v ?? 'all')}   placeholder="Filter role…"   size="sm" />
        <Select2 options={statusOpts} value={filter.status} onChange={v => setFilter('status', v ?? 'all')} placeholder="Filter status…" size="sm" />
        <Select2 options={deptOpts}   value={filter.dept}   onChange={v => setFilter('dept', v ?? 'all')}   placeholder="Filter dept…"   size="sm" />
      </div>

      {/* List view */}
      {viewMode === 'list' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <tr>
                  {['User ID','Full Name','Email','Type','Department','Role','Status','Account Expiry','Last Login',''].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
                {list.length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No users match your filters</td></tr>
                ) : list.map(u => {
                  const role = ROLES_OPTIONS.find(r => r.id === u.role)
                  return (
                    <tr key={u.id} className="cursor-pointer transition-colors" onClick={()=>navigate(`/users/${u.id}`)}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td className="px-4 py-3"><span className="font-mono text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>{u.id}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12.5px] font-black flex-shrink-0"
                            style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                            {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{u.name}</div>
                            <div className="text-[9px] truncate max-w-[120px]" style={{ color:'var(--text3)' }}>{u.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--text2)' }}>{u.email}</span></td>
                      <td className="px-4 py-3"><TypeBadge type={u.type} /></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>{u.dept}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color:'var(--text)' }}>{role?.label ?? u.role}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3"><ExpiryIndicator user={u} /></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{relTime(u.lastLogin)}</span></td>
                      <td className="px-4 py-3">
                        <RowActions user={u}
                          onView={()=>navigate(`/users/${u.id}`)}
                          onEdit={()=>navigate(`/users/${u.id}/edit`)}
                          onDeactivate={()=>askConfirm('deactivate', u)}
                          onActivate={()=>askConfirm('activate', u)}
                          onResetPwd={()=>askConfirm('reset', u)}
                          onUnlock={()=>askConfirm('unlock', u)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2.5" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
          </div>
        </div>
      )}

      {/* Card view */}
      {viewMode === 'card' && (
        <>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {list.map(u => {
              const role = ROLES_OPTIONS.find(r => r.id === u.role)
              return (
                <div key={u.id} onClick={()=>navigate(`/users/${u.id}`)}
                  className="rounded-xl border overflow-hidden cursor-pointer transition-all" style={C}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-md)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow)'}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black"
                          style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                          {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{u.name}</div>
                          <div className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>{u.id}</div>
                        </div>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <TypeBadge type={u.type} />
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md border" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text2)' }}>{role?.label}</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]" style={{ color:'var(--text2)' }}>
                      <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} /> {u.email}</div>
                      <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" style={{ color:'var(--text3)' }} /> {u.mobile}</div>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor:'var(--border)' }}>
                      <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>Last login {relTime(u.lastLogin)}</span>
                      <ExpiryIndicator user={u} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="rounded-xl border px-3 py-2.5" style={C}>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <EnterpriseModal
          open={true}
          onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === 'deactivate' ? 'Confirm Deactivate User'
            : confirmAction.type === 'activate' ? 'Confirm Activate User'
            : confirmAction.type === 'reset'    ? 'Confirm Password Reset'
            : 'Confirm Unlock Account'
          }
          subtitle={confirmAction.user.name}
          icon={
            confirmAction.type === 'deactivate' ? <Power className="w-4 h-4" style={{ color:'var(--danger)' }} />
            : confirmAction.type === 'activate' ? <Power className="w-4 h-4" style={{ color:'var(--success)' }} />
            : confirmAction.type === 'reset'    ? <Key   className="w-4 h-4" style={{ color:'var(--warning)' }} />
            : <Unlock className="w-4 h-4" style={{ color:'var(--success)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={confirmAction.type === 'deactivate' ? 'danger' : confirmAction.type === 'reset' ? 'primary' : 'success'}
              onClick={performAction}>
              {confirmAction.type === 'deactivate' ? 'Yes, Deactivate User'
                : confirmAction.type === 'activate' ? 'Yes, Activate User'
                : confirmAction.type === 'reset'    ? 'Yes, Reset Password'
                : 'Yes, Unlock Account'}
            </ModalBtn>
          </>}>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{
              background: confirmAction.type === 'deactivate' ? 'var(--danger-light)' : 'var(--bg2)',
              borderColor: confirmAction.type === 'deactivate' ? 'rgba(220,38,38,.3)' : 'var(--border)',
            }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{
                color: confirmAction.type === 'deactivate' ? 'var(--danger)' : 'var(--text3)' }} />
              <p className="text-xs" style={{ color:'var(--text2)' }}>
                {confirmAction.type === 'deactivate' && <>This user will lose access immediately. <strong>No data will be deleted</strong> — the account can be reactivated later. All audit history is preserved.</>}
                {confirmAction.type === 'activate'   && <>This user will regain access and be able to sign in normally.</>}
                {confirmAction.type === 'reset'      && <>A new temporary password will be issued and the user will be required to change it on next sign-in.</>}
                {confirmAction.type === 'unlock'     && <>The user's account will be unlocked and they will be able to sign in. The unlock action is logged in the audit trail.</>}
              </p>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ background:'var(--bg2)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                  {confirmAction.user.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{confirmAction.user.name}</div>
                  <div className="flex items-center gap-2 text-[12.5px]" style={{ color:'var(--text3)' }}>
                    <span className="font-mono">{confirmAction.user.id}</span> · <TypeBadge type={confirmAction.user.type} /> · <StatusBadge status={confirmAction.user.status} />
                  </div>
                </div>
              </div>
            </div>

            {confirmAction.type === 'reset' && (
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Reason</label>
                <Select2
                  options={['User forgot password','Onboarding','90-day policy rotation','Security breach','Other'].map(r => ({ id: r, label: r }))}
                  value={resetReason}
                  onChange={v => setResetReason(v)}
                />
              </div>
            )}
          </div>
        </EnterpriseModal>
      )}
    </div>
  )
}
