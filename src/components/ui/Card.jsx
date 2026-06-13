export default function Card({ children, className = '', noPadding = false, ...props }) {
  return (
    <div
      className={`
        bg-helm-800 border border-helm-600 rounded-xl shadow-card
        ${noPadding ? '' : 'p-5'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-5 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-sm font-semibold text-slate-200 ${className}`}>
      {children}
    </h3>
  )
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-amber-400',
  iconBg = 'bg-amber-500/10',
  trend,
  trendPositive,
  className = '',
}) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5 -translate-y-4 translate-x-4">
        {Icon && <Icon className="w-full h-full text-amber-500" />}
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-100 font-mono tabular-nums">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trendPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <span>{trendPositive ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </Card>
  )
}
