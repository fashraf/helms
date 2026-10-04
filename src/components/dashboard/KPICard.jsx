import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── Theme map ─────────────────────────────────────────────────────────────────
const THEMES = {
  amber:   { border: 'border-l-amber-500',   line: '#f59e0b', glow: 'shadow-amber-glow-sm', label: 'text-amber-400', flash: 'bg-amber-500/5'  },
  sky:     { border: 'border-l-sky-500',     line: '#0ea5e9', glow: 'shadow-sky-glow',       label: 'text-sky-400',   flash: 'bg-sky-500/5'    },
  emerald: { border: 'border-l-emerald-500', line: '#10b981', glow: '',                       label: 'text-emerald-400', flash: 'bg-emerald-500/5' },
  red:     { border: 'border-l-red-500',     line: '#ef4444', glow: '',                       label: 'text-red-400',   flash: 'bg-red-500/8'    },
  purple:  { border: 'border-l-purple-500',  line: '#a855f7', glow: '',                       label: 'text-purple-400', flash: 'bg-purple-500/5' },
}

// Minimal sparkline tooltip
function SparkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-helm-750 border border-helm-600 rounded px-2 py-1 text-[12.5px] text-slate-300 shadow">
      {payload[0].value}
    </div>
  )
}

export default function KPICard({
  label,
  value,
  unit     = '',
  delta    = 0,
  history  = [],
  theme    = 'amber',
  icon: Icon,
  subLabel,
  flash    = false,
}) {
  const t = THEMES[theme] ?? THEMES.amber

  const deltaSign = delta > 0 ? '+' : delta < 0 ? '' : ''
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const deltaColor =
    theme === 'red'
      ? delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-red-400'   : 'text-slate-500'
      : delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400'   : 'text-slate-500'

  return (
    <div
      className={`
        relative flex flex-col bg-helm-800 border border-helm-600 border-l-4 ${t.border}
        rounded-xl overflow-hidden transition-all duration-300
        ${flash ? t.flash : ''}
      `}
    >
      {/* Flash ring */}
      {flash && (
        <div className="absolute inset-0 rounded-xl border border-current opacity-20 pointer-events-none animate-pulse" />
      )}

      {/* Top section */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black font-mono tabular-nums leading-none ${flash ? t.label : 'text-slate-100'} transition-colors duration-300`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-slate-500">{unit}</span>
            )}
          </div>
          {subLabel && (
            <p className="text-[12.5px] text-slate-600 mt-0.5">{subLabel}</p>
          )}
        </div>

        {Icon && (
          <div className={`w-8 h-8 rounded-lg bg-helm-700 flex items-center justify-center flex-shrink-0 ${t.label}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Delta row */}
      <div className="px-4 pb-2 flex items-center gap-1">
        <DeltaIcon className={`w-3 h-3 ${deltaColor}`} />
        <span className={`text-[11px] font-semibold font-mono ${deltaColor}`}>
          {deltaSign}{delta}
        </span>
        <span className="text-[12.5px] text-slate-600 ml-1">since last update</span>
      </div>

      {/* Sparkline */}
      {history.length > 0 && (
        <div className="h-12 px-0 pb-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={t.line}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip content={<SparkTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
