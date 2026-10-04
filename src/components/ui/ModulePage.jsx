import Button from '../../components/ui/Button'
import { Plus } from 'lucide-react'

/**
 * ModulePage — consistent empty-state shell for all module pages.
 * Used during initial build. Replace children with real content.
 */
export default function ModulePage({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  stats = [],
  children,
}) {
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Module header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {Icon && <Icon className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {actionLabel && (
          <Button icon={Plus} size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>

      {/* ── Quick stats (optional) ─────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-helm-800 border border-helm-600 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-100 font-mono">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content or empty state ────────────────────────────────── */}
      {children ?? (
        <div className="bg-helm-800 border border-dashed border-helm-600 rounded-2xl p-16 text-center">
          {Icon && <Icon className="w-14 h-14 text-helm-600 mx-auto mb-4" />}
          <h3 className="text-slate-400 font-semibold mb-1.5">Module Under Development</h3>
          <p className="text-slate-600 text-sm max-w-xs mx-auto">
            Full {title} functionality will be available in the next sprint.
          </p>
          {actionLabel && (
            <Button icon={Plus} size="sm" className="mt-5" variant="outline" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
