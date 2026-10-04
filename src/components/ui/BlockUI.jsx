import { createPortal } from 'react-dom'
import useRBACStore from '../../store/rbacStore'

// ─── Global Block-UI overlay ───────────────────────────────────────────────────
export function BlockUI() {
  const { isLoading, loadingMsg } = useRBACStore()
  if (!isLoading) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
      style={{ background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(3px)' }}
    >
      <div
        className="rounded-2xl px-10 py-8 flex flex-col items-center gap-4 shadow-xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', minWidth: 260 }}
      >
        {/* Animated spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{ borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <div className="absolute inset-2 rounded-full border-4 border-transparent opacity-40"
            style={{ borderTopColor: 'var(--primary)', animation: 'spin 1.4s linear infinite reverse' }} />
        </div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {loadingMsg || 'Loading…'}
        </div>
        <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Please wait</div>
      </div>
    </div>,
    document.body
  )
}

// ─── Inline skeleton row ──────────────────────────────────────────────────────
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded-full animate-pulse" style={{ background: 'var(--bg3)', width: i === 0 ? '60%' : i === 1 ? '80%' : '50%' }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />
        <div className="flex-1">
          <div className="h-3 rounded-full animate-pulse mb-1.5" style={{ background: 'var(--bg3)', width: '60%' }} />
          <div className="h-2 rounded-full animate-pulse" style={{ background: 'var(--bg3)', width: '80%' }} />
        </div>
      </div>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-2.5 rounded-full animate-pulse mb-2" style={{ background: 'var(--bg3)', width: `${70 - i * 10}%` }} />
      ))}
    </div>
  )
}

// ─── Table skeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </tbody>
  )
}
