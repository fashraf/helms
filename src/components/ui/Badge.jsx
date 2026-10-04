const variants = {
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  sky:     'text-sky-400 bg-sky-500/10 border-sky-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  red:     'text-red-400 bg-red-500/10 border-red-500/20',
  orange:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  yellow:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  slate:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
  purple:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export default function Badge({ children, variant = 'slate', dot = false, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        text-xs font-medium
        rounded-md border
        ${variants[variant] ?? variants.slate}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'amber'   ? 'bg-amber-400'   :
            variant === 'sky'     ? 'bg-sky-400'     :
            variant === 'emerald' ? 'bg-emerald-400' :
            variant === 'red'     ? 'bg-red-400'     :
            variant === 'orange'  ? 'bg-orange-400'  :
            variant === 'yellow'  ? 'bg-yellow-400'  :
            variant === 'purple'  ? 'bg-purple-400'  :
            'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  )
}
