// ─── Circular risk gauge ──────────────────────────────────────────────────────
export function RiskGauge({ score, label, size = 'md' }) {
  const r   = size === 'lg' ? 38 : size === 'md' ? 28 : 20
  const sw  = size === 'lg' ? 6  : size === 'md' ? 4.5 : 3.5
  const c   = 2 * Math.PI * r
  const dash = (score / 100) * c

  const color = score >= 70 ? '#ef4444'
    : score >= 45            ? '#f59e0b'
    : score >= 25            ? '#f97316'
    : '#10b981'

  const textSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-sm' : 'text-[12.5px]'
  const dim = size === 'lg' ? 92 : size === 'md' ? 68 : 50

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
          <circle
            cx={dim/2} cy={dim/2} r={r}
            fill="none" stroke="var(--border)" strokeWidth={sw}
          />
          <circle
            cx={dim/2} cy={dim/2} r={r}
            fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black font-mono tabular-nums leading-none ${textSize}`} style={{ color }}>
            {score}
          </span>
          {size === 'lg' && <span className="text-[9px] text-slate-500 mt-0.5">/ 100</span>}
        </div>
      </div>
      {label && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center leading-tight max-w-[70px]">
          {label}
        </span>
      )}
    </div>
  )
}

// ─── Linear risk bar ──────────────────────────────────────────────────────────
export function RiskBar({ value, label, icon: Icon, colorClass }) {
  const color = value >= 70 ? 'bg-red-500'
    : value >= 45            ? 'bg-amber-500'
    : value >= 25            ? 'bg-orange-500'
    : 'bg-emerald-500'

  const textColor = value >= 70 ? 'text-red-400'
    : value >= 45              ? 'text-amber-400'
    : value >= 25              ? 'text-orange-400'
    : 'text-emerald-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={`w-3 h-3 ${textColor}`} />}
          <span className="text-[12.5px] font-semibold text-slate-400">{label}</span>
        </div>
        <span className={`text-xs font-black font-mono tabular-nums ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2 bg-helm-700 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ─── Confidence pill ──────────────────────────────────────────────────────────
export function ConfidencePill({ score }) {
  const cls = score >= 85 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : score >= 70          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${cls}`}>
      AI CONFIDENCE: {score}%
    </span>
  )
}

// ─── Risk level label ─────────────────────────────────────────────────────────
export function RiskLevel({ score }) {
  const [label, cls] = score >= 70 ? ['HIGH RISK',     'text-red-400    bg-red-500/10    border-red-500/20    animate-pulse']
    : score >= 45                   ? ['MEDIUM RISK',   'text-amber-400  bg-amber-500/10  border-amber-500/20' ]
    : score >= 25                   ? ['LOW-MED RISK',  'text-orange-400 bg-orange-500/10 border-orange-500/20']
    : ['LOW RISK', 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20']

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest border rounded-md ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
