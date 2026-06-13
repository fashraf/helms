import { CheckCircle2, AlertTriangle, XCircle, Clock, ChevronRight, Zap } from 'lucide-react'
import useDashboardStore from '../../store/dashboardStore'

// ── Status LED config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ok:       { color: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-400', label: 'OK'       },
  degraded: { color: 'bg-amber-500',   ring: 'ring-amber-500/30',   text: 'text-amber-400',   label: 'DEGRADED' },
  down:     { color: 'bg-red-500',     ring: 'ring-red-500/30',     text: 'text-red-400',     label: 'DOWN'     },
}

const ALERT_CONFIG = {
  critical: { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-l-red-500'    },
  warning:  { icon: AlertTriangle,color: 'text-amber-400',  bg: 'bg-amber-500/5',  border: 'border-l-amber-500'  },
  info:     { icon: CheckCircle2, color: 'text-sky-400',    bg: 'bg-sky-500/5',    border: 'border-l-sky-500'    },
}

const URGENCY_CONFIG = {
  high:   { dot: 'bg-red-500',    text: 'text-red-400'    },
  medium: { dot: 'bg-amber-500',  text: 'text-amber-400'  },
  low:    { dot: 'bg-slate-500',  text: 'text-slate-500'  },
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

// ─── Service Row ──────────────────────────────────────────────────────────────
function ServiceRow({ service }) {
  const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.ok

  return (
    <div className="flex items-center gap-3 py-2 border-b border-helm-700/40 last:border-0">
      {/* LED */}
      <div className={`relative flex-shrink-0`}>
        <div className={`w-2 h-2 rounded-full ${cfg.color} ring-2 ${cfg.ring}`} />
        {service.status === 'ok' && (
          <div className={`absolute inset-0 rounded-full ${cfg.color} animate-ping opacity-40`} />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-300 leading-none">{service.label}</span>
        <span className="block text-[12.5px] text-slate-600 font-mono mt-0.5">{service.detail}</span>
      </div>

      {/* Status label + uptime */}
      <div className="text-right flex-shrink-0">
        <span className={`text-[9px] font-bold tracking-wider ${cfg.text}`}>{cfg.label}</span>
        <span className="block text-[12.5px] text-slate-600 font-mono">{service.uptime}</span>
      </div>
    </div>
  )
}

// ─── Alert Row ────────────────────────────────────────────────────────────────
function AlertRow({ alert }) {
  const dismiss = useDashboardStore((s) => s.dismissAlert)
  const cfg     = ALERT_CONFIG[alert.severity] ?? ALERT_CONFIG.info
  const AIcon   = cfg.icon

  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-lg border-l-2 ${cfg.border} ${cfg.bg} mb-1.5 last:mb-0 group`}>
      <AIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-slate-600 font-mono">{alert.source}</span>
          <span className="text-[9px] text-slate-700">·</span>
          <span className="text-[9px] text-slate-600 font-mono">{relativeTime(alert.time)}</span>
        </div>
      </div>
      <button
        onClick={() => dismiss(alert.id)}
        className="text-slate-700 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
      >
        <XCircle className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Approval Row ─────────────────────────────────────────────────────────────
function ApprovalRow({ item }) {
  const approve = useDashboardStore((s) => s.approveItem)
  const reject  = useDashboardStore((s) => s.rejectItem)
  const urg = URGENCY_CONFIG[item.urgency] ?? URGENCY_CONFIG.low

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-helm-700/40 last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${urg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-bold text-slate-400 font-mono">{item.ref}</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-helm-700 rounded text-slate-500">{item.type}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
        <p className="text-[12.5px] text-slate-600 mt-0.5">{item.requestedBy}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => approve(item.id)}
          className="w-6 h-6 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors"
          title="Approve"
        >
          <CheckCircle2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => reject(item.id)}
          className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center transition-colors"
          title="Reject"
        >
          <XCircle className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Status Panel (main export) ───────────────────────────────────────────────
export default function StatusPanel() {
  const systemStatus    = useDashboardStore((s) => s.systemStatus)
  const alerts          = useDashboardStore((s) => s.alerts)
  const pendingApprovals = useDashboardStore((s) => s.pendingApprovals)
  const overallHealth   = useDashboardStore((s) => s.overallHealth)

  const health    = overallHealth()
  const critCount = alerts.filter((a) => a.severity === 'critical').length
  const warnCount = alerts.filter((a) => a.severity === 'warning').length

  return (
    <div className="flex flex-col gap-3">

      {/* ── System Health ──────────────────────────────────────────────── */}
      <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-helm-700">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-400">System Health</span>
          </div>
          <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded
            ${health === 'operational' ? 'bg-emerald-500/10 text-emerald-400'
            : health === 'degraded'    ? 'bg-amber-500/10 text-amber-400'
            : 'bg-red-500/10 text-red-400 animate-pulse'
            }`}>
            {health.toUpperCase()}
          </span>
        </div>
        <div className="px-4 py-1">
          {Object.entries(systemStatus).map(([key, svc]) => (
            <ServiceRow key={key} service={svc} />
          ))}
        </div>
      </div>

      {/* ── Active Alerts ──────────────────────────────────────────────── */}
      <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-helm-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-400">Active Alerts</span>
          </div>
          <div className="flex items-center gap-1.5">
            {critCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded">
                {critCount} CRIT
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                {warnCount} WARN
              </span>
            )}
            {alerts.length === 0 && (
              <span className="text-[9px] text-emerald-400">All clear</span>
            )}
          </div>
        </div>
        <div className="p-3">
          {alerts.length === 0 ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-[11px] text-slate-600">No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
          )}
        </div>
      </div>

      {/* ── Pending Approvals ──────────────────────────────────────────── */}
      <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-helm-700">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-400">Pending Approvals</span>
          </div>
          {pendingApprovals.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded font-mono">
              {pendingApprovals.length}
            </span>
          )}
        </div>
        <div className="px-4 py-1">
          {pendingApprovals.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[11px] text-slate-600">All approvals cleared</p>
            </div>
          ) : (
            pendingApprovals.map((item) => (
              <ApprovalRow key={item.id} item={item} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
