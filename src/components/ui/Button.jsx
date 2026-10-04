import LoadingSpinner from './LoadingSpinner'

const variants = {
  primary:  'bg-amber-500 hover:bg-amber-400 text-helm-900 font-semibold shadow-amber-glow-sm hover:shadow-amber-glow',
  secondary:'bg-helm-700 hover:bg-helm-600 text-slate-200 border border-helm-500 hover:border-helm-400',
  danger:   'bg-red-600 hover:bg-red-500 text-white font-semibold',
  ghost:    'bg-transparent hover:bg-helm-700 text-slate-400 hover:text-slate-200 border border-transparent hover:border-helm-500',
  outline:  'bg-transparent border border-helm-500 hover:border-amber-500/60 text-slate-300 hover:text-amber-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] ?? variants.primary}
        ${sizes[size] ?? sizes.md}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        Icon && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      {children}
      {!loading && IconRight && <IconRight className="w-4 h-4 flex-shrink-0" />}
    </button>
  )
}
