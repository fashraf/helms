import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  History, ArrowLeft, Search, Filter, Download, User, Shield,
  CheckCircle2, AlertTriangle, Copy, Power, RotateCcw, Edit3, FileText,
  Globe, Smartphone, Calendar, ChevronDown, ChevronRight,
} from 'lucide-react'
import useRBACv2Store from '../../store/rbacV2Store'
import Select2 from '../../components/ui/Select2'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const PAGE_SIZE = 20

const ACTION_ICONS = {
  'Role Created':       { icon: Shield,    color: 'var(--success)' },
  'Role Updated':       { icon: Edit3,     color: 'var(--primary)' },
  'Role Deactivated':   { icon: Power,     color: 'var(--danger)'  },
  'Role Activated':     { icon: RotateCcw, color: 'var(--success)' },
  'Role Cloned':        { icon: Copy,      color: 'var(--purple)'  },
  'Permission Granted': { icon: CheckCircle2, color: 'var(--success)' },
  'Permission Revoked': { icon: AlertTriangle,color: 'var(--warning)' },
  'User Assigned':      { icon: User,      color: 'var(--primary)' },
  'User Removed':       { icon: User,      color: 'var(--text3)'   },
}

function fmtDT(iso) {
  return new Date(iso).toLocaleString('en-SA', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function RoleAudit() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const targetRoleId = params.get('role')
  const { auditLog, roles } = useRBACv2Store()

  const [view, setView]       = useState('timeline') // 'timeline' | 'table'
  const [search, setSearch]   = useState('')
  const [action, setAction]   = useState('all')
  const [page, setPage]       = useState(1)
  const [filterRole, setFilterRole] = useState(targetRoleId ?? 'all')

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      if (filterRole !== 'all' && e.targetRoleId !== filterRole) return false
      if (action !== 'all' && e.action !== action) return false
      if (search) {
        const q = search.toLowerCase()
        return e.action.toLowerCase().includes(q) ||
          e.targetRole.toLowerCase().includes(q) ||
          (e.actor ?? '').toLowerCase().includes(q) ||
          (e.module ?? '').toLowerCase().includes(q)
      }
      return true
    })
  }, [auditLog, search, action, filterRole])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const cp = Math.min(page, totalPages)
  const list = filtered.slice((cp - 1) * PAGE_SIZE, cp * PAGE_SIZE)

  const uniqueActions = [...new Set(auditLog.map(e => e.action))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/roles')} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
              <History className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Role Audit Trail</h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>{filtered.length} of {auditLog.length} audit events</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
            {[['timeline','Timeline'],['table','Table']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)} className="px-2.5 py-1.5 rounded-md text-[12.5px] font-bold transition-all"
                style={view === v ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text3)' }}>{l}</button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border" style={{ ...C, color:'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search action, role, user, module…"
            className="rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none w-80"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-48">
          <Select2 size="sm" placeholder="All actions"
            options={[{ id:'all', label:'All Actions' }, ...uniqueActions.map(a => ({ id:a, label:a }))]}
            value={action} onChange={v => { setAction(v ?? 'all'); setPage(1) }} />
        </div>
        <div className="w-64">
          <Select2 size="sm" placeholder="All roles"
            options={[{ id:'all', label:'All Roles' }, ...roles.map(r => ({ id:r.id, label:r.name }))]}
            value={filterRole} onChange={v => { setFilterRole(v ?? 'all'); setPage(1) }} />
        </div>
      </div>

      {/* Timeline view */}
      {view === 'timeline' && (
        <div className="rounded-xl border p-5" style={C}>
          {list.length === 0
            ? <div className="py-16 text-center text-sm" style={{ color:'var(--text3)' }}>No audit events match filters</div>
            : <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background:'var(--border)' }} />
                <div className="space-y-3">
                  {list.map(e => {
                    const meta = ACTION_ICONS[e.action] ?? { icon: FileText, color: 'var(--text3)' }
                    const Icon = meta.icon
                    return (
                      <div key={e.id} className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background:'var(--card)', border:`2px solid ${meta.color}` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                        </div>
                        <div className="rounded-xl border p-3" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: meta.color }}>{e.action}</span>
                              <span className="text-[12.5px] px-1.5 py-0.5 rounded font-mono" style={{ background:'var(--bg2)', color:'var(--text3)' }}>{e.id}</span>
                            </div>
                            <span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDT(e.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] mb-1.5" style={{ color:'var(--text2)' }}>
                            <span><strong style={{ color:'var(--text)' }}>{e.actor}</strong> ({e.actorRole})</span>
                            <span>·</span>
                            <span>Target: <strong style={{ color:'var(--primary)' }}>{e.targetRole}</strong></span>
                            {e.module    && <><span>·</span><span>Module: <strong>{e.module}</strong></span></>}
                            {e.permission && <><span>·</span><span>Permission: <strong>{e.permission}</strong></span></>}
                          </div>
                          {e.comment && <div className="text-[11px] italic mt-1" style={{ color:'var(--text3)' }}>"{e.comment}"</div>}
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[12.5px] font-mono" style={{ borderColor:'var(--border)', color:'var(--text3)' }}>
                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {e.ipAddress ?? '127.0.0.1'}</span>
                            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {e.device ?? 'Web'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <tr>
                  {['Date','User','Role','Action','Target Role','Module/Perm','IP','Device'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
                {list.map(e => {
                  const meta = ACTION_ICONS[e.action] ?? { icon: FileText, color:'var(--text3)' }
                  return (
                    <tr key={e.id} onMouseEnter={ev => ev.currentTarget.style.background='var(--bg2)'} onMouseLeave={ev => ev.currentTarget.style.background=''}>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{fmtDT(e.timestamp)}</span></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text)' }}>{e.actor}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{e.actorRole}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color: meta.color }}>{e.action}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color:'var(--primary)' }}>{e.targetRole}</span></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color:'var(--text2)' }}>{[e.module, e.permission].filter(Boolean).join(' / ') || '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color:'var(--text3)' }}>{e.ipAddress ?? '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{e.device ?? '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-[11px]" style={{ color:'var(--text3)' }}>Showing {list.length} of {filtered.length}</div>
          <div className="flex items-center gap-1">
            <button disabled={cp === 1} onClick={() => setPage(cp - 1)} className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)' }}>← Prev</button>
            <span className="text-xs px-3" style={{ color:'var(--text2)' }}>Page {cp} of {totalPages}</span>
            <button disabled={cp === totalPages} onClick={() => setPage(cp + 1)} className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40" style={{ background:'var(--card)', borderColor:'var(--border)' }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
