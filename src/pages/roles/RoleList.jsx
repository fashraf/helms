import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Plus, Search, LayoutGrid, List, Download, Eye, Edit3, Copy,
  Power, History, MoreVertical, ChevronLeft, ChevronRight, AlertTriangle,
  Users, Layers, Lock, RotateCcw,
} from 'lucide-react'
import useRBACv2Store from '../../store/rbacV2Store'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import { permissionSummary } from '../../api/mock/permissionTree'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 15

const STATUS_CFG = {
  active:   { label: 'Active',   cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  inactive: { label: 'Inactive', cls: 'text-slate-500 bg-slate-50 border-slate-200'       },
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' })
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.inactive
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function RowActions({ role, onView, onEdit, onClone, onDeactivate, onActivate, onAudit }) {
  const [open, setOpen] = useState(false)
  const isInactive = role.status === 'inactive'

  const items = [
    { icon: Eye,    label: 'View',         fn: onView,   color: 'var(--text2)' },
    { icon: Edit3,  label: 'Edit',         fn: onEdit,   color: 'var(--text2)' },
    { icon: Copy,   label: 'Clone',        fn: onClone,  color: 'var(--primary)' },
    { icon: History,label: 'Audit History',fn: onAudit,  color: 'var(--text2)' },
    isInactive
      ? { icon: RotateCcw, label: 'Activate',   fn: onActivate,   color: 'var(--success)' }
      : { icon: Power,     label: 'Deactivate', fn: onDeactivate, color: 'var(--danger)'  },
  ]
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color:'var(--text3)' }}
        onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
        onMouseLeave={e => e.currentTarget.style.background=''}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-44 rounded-xl border z-30 overflow-hidden animate-fade-in"
            style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow-md)' }}>
            {items.map(({ icon:Icon, label, fn, color }) => (
              <button key={label} onClick={() => { fn(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors" style={{ color }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background=''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RoleCard({ role, onView, count }) {
  return (
    <div onClick={onView} className="rounded-xl border overflow-hidden cursor-pointer transition-all" style={C}
      onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>
      <div className="h-1" style={{ background: role.color || 'var(--primary)' }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white"
              style={{ background: role.color || 'var(--primary)' }}>
              {role.badge ?? role.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{role.name}</div>
              <div className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{role.id}</div>
            </div>
          </div>
          <StatusBadge status={role.status} />
        </div>
        <p className="text-[11px] mb-3 line-clamp-2" style={{ color:'var(--text2)' }}>{role.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { l:'Users',  v: role.userCount,  c:'var(--primary)' },
            { l:'Perms',  v: count.granted,   c:'var(--success)' },
            { l:'Menus',  v: count.menus,     c:'var(--purple)'  },
          ].map(({l,v,c}) => (
            <div key={l} className="rounded-lg px-2 py-1.5 text-center" style={{ background:'var(--bg2)' }}>
              <div className="text-sm font-bold font-mono" style={{ color:c }}>{v}</div>
              <div className="text-[8px] uppercase tracking-wide" style={{ color:'var(--text3)' }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t text-[12.5px]" style={{ borderColor:'var(--border)', color:'var(--text3)' }}>
          <span>Created {fmtDate(role.createdAt)}</span>
          <span>Updated {fmtDate(role.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange, total, showing }) {
  let pages = []
  if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  else if (page <= 4)              pages = [1,2,3,4,5,'…',totalPages]
  else if (page >= totalPages - 3) pages = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
  else                             pages = [1,'…',page-1,page,page+1,'…',totalPages]
  return (
    <div className="flex items-center justify-between gap-3 px-2">
      <div className="text-[11px]" style={{ color:'var(--text3)' }}>Showing <strong style={{ color:'var(--text)' }}>{showing}</strong> of <strong style={{ color:'var(--text)' }}>{total}</strong></div>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}><ChevronLeft className="w-3.5 h-3.5" /></button>
        {pages.map((p,i) => p === '…' ? <span key={i} className="px-1.5 text-xs" style={{ color:'var(--text3)' }}>…</span>
          : <button key={i} onClick={() => onChange(p)} className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border"
              style={p === page ? { background:'var(--primary)', color:'#fff', borderColor:'var(--primary)' } : { background:'var(--card)', color:'var(--text2)', borderColor:'var(--border)' }}>{p}</button>)}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

export default function RoleList() {
  const navigate = useNavigate()
  const { filteredRoles, filter, setFilter, viewMode, setViewMode, roles, cloneRole, deactivateRole, activateRole } = useRBACv2Store()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)

  const fullList = filteredRoles()
  useEffect(() => { setPage(1) }, [filter.search, filter.status, viewMode])

  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const cp = Math.min(page, totalPages)
  const list = fullList.slice((cp - 1) * PAGE_SIZE, cp * PAGE_SIZE)

  const stats = {
    total:    roles.length,
    active:   roles.filter(r => r.status === 'active').length,
    inactive: roles.filter(r => r.status === 'inactive').length,
    users:    roles.reduce((s, r) => s + (r.userCount || 0), 0),
  }

  const askConfirm = (type, role) => setConfirmAction({ type, role })
  const performAction = () => {
    if (!confirmAction) return
    const { type, role } = confirmAction
    if (type === 'deactivate') { deactivateRole(role.id); toast.warning('Deactivated', `Role ${role.name} deactivated.`) }
    else if (type === 'activate'){ activateRole(role.id); toast.success('Activated', `Role ${role.name} is now active.`) }
    else if (type === 'clone')   {
      const newId = cloneRole(role.id)
      toast.success('Cloned', `Created copy of ${role.name}. Open to edit.`)
      navigate(`/roles/${newId}/edit`)
    }
    setConfirmAction(null)
  }

  const statusOpts = [
    { id: 'all',      label: 'All Status' },
    { id: 'active',   label: 'Active'     },
    { id: 'inactive', label: 'Inactive'   },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Shield className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Role Management</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>{fullList.length} of {stats.total} roles · {stats.users} users assigned</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
            {[['list','List',List],['card','Cards',LayoutGrid]].map(([v,l,Icon]) => (
              <button key={v} onClick={() => setViewMode(v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-bold transition-all"
                style={viewMode === v ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text3)' }}>
                <Icon className="w-3.5 h-3.5" />{l}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/roles/audit')} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <History className="w-3.5 h-3.5" /> Audit History
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/roles/create')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background:'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create Role
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Roles',    v:stats.total,    c:'var(--text)'    },
          { l:'Active',         v:stats.active,   c:'var(--success)' },
          { l:'Inactive',       v:stats.inactive, c:'var(--text3)'   },
          { l:'Users Assigned', v:stats.users,    c:'var(--primary)' },
        ].map(({ l, v, c }) => (
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
          <input value={filter.search} onChange={e => setFilter('search', e.target.value)}
            placeholder="Search role name, description, ID…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-72"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-48">
          <Select2 options={statusOpts} value={filter.status} onChange={v => setFilter('status', v ?? 'all')} placeholder="Filter status…" size="sm" />
        </div>
      </div>

      {/* List view */}
      {viewMode === 'list' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <tr>
                  {['Role','Description','Users','Permissions','Menus','Status','Created','Updated',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
                {list.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No roles match your filters</td></tr>
                ) : list.map(r => {
                  const sum = permissionSummary(r.permissions)
                  return (
                    <tr key={r.id} className="cursor-pointer transition-colors" onClick={() => navigate(`/roles/${r.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background: r.color || 'var(--primary)' }}>
                            {r.badge ?? r.name.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{r.name}</div>
                            <div className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs truncate max-w-[280px] inline-block" style={{ color:'var(--text2)' }}>{r.description}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color:'var(--text)' }}>{r.userCount ?? 0}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color:'var(--success)' }}>{sum.granted}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:'var(--purple)' }}>{sum.menus}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(r.createdAt)}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDate(r.updatedAt)}</span></td>
                      <td className="px-4 py-3">
                        <RowActions role={r}
                          onView={() => navigate(`/roles/${r.id}`)}
                          onEdit={() => navigate(`/roles/${r.id}/edit`)}
                          onClone={() => askConfirm('clone', r)}
                          onDeactivate={() => askConfirm('deactivate', r)}
                          onActivate={() => askConfirm('activate', r)}
                          onAudit={() => navigate(`/roles/audit?role=${r.id}`)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2.5" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
            <Pagination page={cp} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
          </div>
        </div>
      )}

      {viewMode === 'card' && (
        <>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {list.map(r => {
              const sum = permissionSummary(r.permissions)
              return <RoleCard key={r.id} role={r} count={sum} onView={() => navigate(`/roles/${r.id}`)} />
            })}
          </div>
          <div className="rounded-xl border px-3 py-2.5" style={C}>
            <Pagination page={cp} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
          </div>
        </>
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <EnterpriseModal open={true} onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === 'deactivate' ? 'Confirm Deactivate Role'
            : confirmAction.type === 'activate' ? 'Confirm Activate Role'
            : 'Confirm Clone Role'
          }
          subtitle={confirmAction.role.name}
          icon={
            confirmAction.type === 'deactivate' ? <Power className="w-4 h-4" style={{ color:'var(--danger)' }} />
            : confirmAction.type === 'activate' ? <Power className="w-4 h-4" style={{ color:'var(--success)' }} />
            : <Copy className="w-4 h-4" style={{ color:'var(--primary)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={confirmAction.type === 'deactivate' ? 'danger' : confirmAction.type === 'activate' ? 'success' : 'primary'}
              onClick={performAction}>
              {confirmAction.type === 'deactivate' ? 'Yes, Deactivate'
                : confirmAction.type === 'activate' ? 'Yes, Activate'
                : 'Yes, Clone Role'}
            </ModalBtn>
          </>}>
          <div className="space-y-3">
            <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{
              background: confirmAction.type === 'deactivate' ? 'var(--danger-light)' : 'var(--bg2)',
              borderColor: confirmAction.type === 'deactivate' ? 'rgba(220,38,38,.3)' : 'var(--border)',
            }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: confirmAction.type === 'deactivate' ? 'var(--danger)' : 'var(--text3)' }} />
              <p className="text-xs" style={{ color:'var(--text2)' }}>
                {confirmAction.type === 'deactivate' && <>This role will become inactive — users currently assigned to it will lose those permissions on next sign-in. <strong>No data will be deleted</strong>; the role can be reactivated and its audit history is preserved.</>}
                {confirmAction.type === 'activate'   && <>This role will be reactivated. Users assigned to it will regain its permissions on next sign-in.</>}
                {confirmAction.type === 'clone'      && <>A new role will be created with all permissions copied from <strong>{confirmAction.role.name}</strong>. You will be redirected to edit the new role.</>}
              </p>
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ background:'var(--bg2)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: confirmAction.role.color || 'var(--primary)' }}>
                  {confirmAction.role.badge ?? confirmAction.role.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{confirmAction.role.name}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{confirmAction.role.userCount ?? 0} users · {permissionSummary(confirmAction.role.permissions).granted} permissions</div>
                </div>
              </div>
            </div>
          </div>
        </EnterpriseModal>
      )}
    </div>
  )
}
