import { useState } from 'react'
import { FileText, Search, Filter, Download, CheckCircle2, XCircle, Clock, User } from 'lucide-react'
import useAdminStore from '../../store/adminStore'
import { AUDIT_MODULES } from '../../api/mock/aiData'

const METHOD_CFG = {
  POST:   { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  PUT:    { cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  DELETE: { cls: 'text-red-400    bg-red-500/10    border-red-500/20'    },
  GET:    { cls: 'text-sky-400    bg-sky-500/10    border-sky-500/20'    },
}

function relTime(iso) {
  const d = (Date.now() - new Date(iso)) / 60000
  if (d < 1) return 'just now'
  if (d < 60) return Math.floor(d) + 'm ago'
  if (d < 1440) return Math.floor(d/60) + 'h ago'
  return new Date(iso).toLocaleDateString('en-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AuditLogs() {
  const { filteredAuditLogs, auditFilter, setAuditFilter } = useAdminStore()
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20
  const logs = filteredAuditLogs()
  const paged = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const UNIQUE_USERS = [
    { id: 'all', label: 'All Users' },
    { id: 'USR-001', label: 'Abdullah Al-Rashid' },
    { id: 'USR-002', label: 'Fatima Al-Zahrani'  },
    { id: 'USR-003', label: 'Khalid Al-Mutairi'  },
    { id: 'USR-004', label: 'Omar Al-Qahtani'    },
    { id: 'USR-005', label: 'Nasser Al-Harbi'    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', border: '1px solid color-mix(in srgb,var(--primary) 20%,transparent)' }}>
            <FileText className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Audit Log</h2>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{logs.length} events · Full activity trail</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Total Events', v: logs.length,                          c: 'var(--text)'   },
          { l: 'Success',      v: logs.filter(l => l.status==='success').length, c: 'var(--success)' },
          { l: 'Failed',       v: logs.filter(l => l.status==='failed').length,  c: 'var(--danger)'  },
          { l: 'Active Users', v: new Set(logs.map(l => l.userId)).size,  c: 'var(--primary)' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono tabular-nums" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
          <input value={auditFilter.search} onChange={e => setAuditFilter('search', e.target.value)}
            placeholder="Search action or user…"
            className="rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-48"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>

        {[['24h','24h'],['7d','7 Days'],['30d','30 Days'],['all','All Time']].map(([v,l]) => (
          <button key={v} onClick={() => setAuditFilter('dateRange', v)}
            className="px-3 py-1.5 text-[12.5px] font-bold tracking-wider rounded-lg border transition-all"
            style={auditFilter.dateRange === v ? { background: 'var(--primary-light)', borderColor: 'var(--primary)', color: 'var(--primary)' } : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
            {l}
          </button>
        ))}

        <select value={auditFilter.module} onChange={e => setAuditFilter('module', e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <option value="all">All Modules</option>
          {AUDIT_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={auditFilter.user} onChange={e => setAuditFilter('user', e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          {UNIQUE_USERS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>

        <select value={auditFilter.status} onChange={e => setAuditFilter('status', e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <tr>
                {['Log ID','Timestamp','User','Role','Module','Action','Target','Method','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {paged.map(log => {
                const mc = METHOD_CFG[log.method] ?? METHOD_CFG.GET
                return (
                  <tr key={log.id} className="hover:bg-opacity-50 transition-colors" style={{ '--tw-bg-opacity': 0.5 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="px-4 py-2.5"><span className="font-mono text-[12.5px]" style={{ color: 'var(--primary)' }}>{log.id}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[12.5px] font-mono whitespace-nowrap" style={{ color: 'var(--text2)' }}>{relTime(log.timestamp)}</span></td>
                    <td className="px-4 py-2.5"><span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{log.user.split(' ')[0]}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[9px] capitalize" style={{ color: 'var(--text2)' }}>{log.role}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[12.5px]" style={{ color: 'var(--text2)' }}>{log.module}</span></td>
                    <td className="px-4 py-2.5"><span className="text-xs" style={{ color: 'var(--text)' }}>{log.action}</span></td>
                    <td className="px-4 py-2.5"><span className="font-mono text-[12.5px]" style={{ color: 'var(--text2)' }}>{log.target}</span></td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-black border rounded ${mc.cls}`}>{log.method}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {log.status === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <XCircle      className="w-4 h-4 text-red-400" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
          <span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page+1)*PAGE_SIZE, logs.length)} of {logs.length}
          </span>
          <div className="flex items-center gap-1">
            {[...Array(Math.ceil(logs.length / PAGE_SIZE)).keys()].slice(0, 8).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 text-[12.5px] font-bold rounded-md transition-all"
                style={page === p ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--bg3)', color: 'var(--text2)' }}>
                {p+1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
