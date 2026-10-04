import { COUNTRIES } from '../../api/mock/vendorData'

export const SLA_COLOR = (s) =>
  s >= 94 ? { text: 'text-emerald-600', bg: 'rgba(5,150,105,.1)', bar: '#059669' }
  : s >= 88 ? { text: 'text-blue-600',    bg: 'rgba(37,99,235,.1)', bar: '#2563EB' }
  : s >= 80 ? { text: 'text-amber-600',   bg: 'rgba(217,119,6,.1)', bar: '#D97706' }
  : { text: 'text-red-600', bg: 'rgba(220,38,38,.1)', bar: '#DC2626' }

export const RISK_COLOR = (r) =>
  r === 'low'    ? { label: 'LOW',    cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
  : r === 'medium' ? { label: 'MEDIUM', cls: 'text-amber-600   bg-amber-50   border-amber-200'   }
  : { label: 'HIGH',   cls: 'text-red-600    bg-red-50    border-red-200'    }

export const MODE_COLORS = {
  Air:       { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-200'     },
  Sea:       { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200'    },
  Ground:    { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200'   },
  Rail:      { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200'  },
  'Multi-modal':{ bg:'bg-orange-100', text:'text-orange-700',  border:'border-orange-200'   },
}

export function SLABadge({ sla }) {
  const c = SLA_COLOR(sla)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${sla}%`, background: c.bar }} />
      </div>
      <span className={`text-xs font-bold font-mono tabular-nums ${c.text}`}>{sla}%</span>
    </div>
  )
}

export function RiskBadge({ risk }) {
  const c = RISK_COLOR(risk)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border rounded-md ${c.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  )
}

export function ModeBadge({ mode }) {
  const c = MODE_COLORS[mode] ?? MODE_COLORS.Ground
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold border rounded-md ${c.bg} ${c.text} ${c.border}`}>
      {mode === 'Air' ? '✈' : mode === 'Sea' ? '🚢' : mode === 'Ground' ? '🚛' : mode === 'Rail' ? '🚂' : '🔄'} {mode}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border rounded-md
      ${status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.toUpperCase()}
    </span>
  )
}

export function CountryBadge({ code }) {
  const c = COUNTRIES.find(x => x.code === code)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
      <span className="text-base">{c?.flag ?? '🌐'}</span>
      {c?.name ?? code}
    </span>
  )
}

export function getCountry(code) {
  return COUNTRIES.find(x => x.code === code)
}

export function relTime(iso) {
  if (!iso) return '—'
  const d = (Date.now() - new Date(iso)) / 60000
  if (d < 1) return 'just now'
  if (d < 60) return Math.floor(d) + 'm ago'
  if (d < 1440) return Math.floor(d/60) + 'h ago'
  return Math.floor(d/1440) + 'd ago'
}
