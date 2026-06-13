import { PERMISSION_MODULES } from '../../api/mock/rbacData'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function MenuPreview({ permissions = {}, compact = false }) {
  const visible = PERMISSION_MODULES.filter(m => (permissions[m.id] ?? []).includes('view'))
  const hidden  = PERMISSION_MODULES.filter(m => !(permissions[m.id] ?? []).includes('view'))

  if (compact) {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-2.5 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
            Menu Preview
          </span>
          <span className="ml-2 text-[12.5px] font-mono" style={{ color: 'var(--primary)' }}>
            {visible.length}/{PERMISSION_MODULES.length} visible
          </span>
        </div>
        <div className="grid grid-cols-2 gap-0.5 p-2">
          {PERMISSION_MODULES.map(m => {
            const isVisible = (permissions[m.id] ?? []).includes('view')
            return (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: isVisible ? 'rgba(37,99,235,.05)' : 'transparent' }}>
                <div className="w-4 h-4 flex-shrink-0">
                  {isVisible
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle      className="w-4 h-4"  style={{ color: 'var(--text3)' }} />
                  }
                </div>
                <span className="text-[12.5px] font-medium truncate" style={{ color: isVisible ? 'var(--text)' : 'var(--text3)' }}>
                  {m.icon} {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
            Visible Menu Preview
          </span>
          <span className="text-[12.5px] font-mono px-2 py-0.5 rounded"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            {visible.length} / {PERMISSION_MODULES.length}
          </span>
        </div>
        <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text3)' }}>Updates as permissions change</p>
      </div>

      <div className="p-3 space-y-0.5">
        {PERMISSION_MODULES.map(m => {
          const isVisible = (permissions[m.id] ?? []).includes('view')
          const count     = (permissions[m.id] ?? []).length
          return (
            <div
              key={m.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all"
              style={{ background: isVisible ? 'rgba(37,99,235,.05)' : 'transparent', opacity: isVisible ? 1 : 0.45 }}
            >
              <div className="w-4 h-4 flex-shrink-0">
                {isVisible
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <XCircle      className="w-4 h-4 text-red-300" />
                }
              </div>
              <span className="text-xs" style={{ color: isVisible ? 'var(--text)' : 'var(--text3)' }}>
                {m.icon} {m.label}
              </span>
              {isVisible && count > 1 && (
                <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--primary)' }}>
                  {count} perms
                </span>
              )}
              {!isVisible && (
                <span className="ml-auto text-[9px]" style={{ color: 'var(--text3)' }}>hidden</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
