import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'

/**
 * Select2 — searchable single-select dropdown
 *
 * Props:
 *   options:     Array<any>
 *   value:       any (the selected key)
 *   onChange:    (key) => void
 *   getLabel:    (opt) => string                 (defaults to opt.label || opt)
 *   getKey:      (opt) => string                 (defaults to opt.id || opt.code || opt)
 *   getIcon:     (opt) => string | ReactNode     (optional)
 *   getSubLabel: (opt) => string                 (optional second line)
 *   placeholder: string
 *   disabled:    boolean
 *   error:       boolean
 *   clearable:   boolean (show ✕ to clear)
 *   size:        'sm' | 'md'
 */
export default function Select2({
  options = [],
  value,
  onChange,
  getLabel    = (o) => o?.label ?? String(o),
  getKey      = (o) => o?.id ?? o?.code ?? o,
  getIcon,
  getSubLabel,
  placeholder = 'Select…',
  disabled    = false,
  error       = false,
  clearable   = false,
  size        = 'md',
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [highlight, setHL]  = useState(0)
  const wrap  = useRef(null)
  const input = useRef(null)

  const selected = options.find(o => getKey(o) === value)

  // ─── Outside click close ──────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ─── Focus search on open ─────────────────────────────────────────────
  useEffect(() => {
    if (open) { setSearch(''); setHL(0); setTimeout(() => input.current?.focus(), 30) }
  }, [open])

  // ─── Filter ───────────────────────────────────────────────────────────
  const filtered = options.filter(o => {
    const q = search.toLowerCase()
    if (!q) return true
    return getLabel(o).toLowerCase().includes(q) ||
      (getSubLabel?.(o)?.toLowerCase().includes(q) ?? false) ||
      String(getKey(o)).toLowerCase().includes(q)
  })

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHL(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setHL(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && filtered[highlight]) { onChange(getKey(filtered[highlight])); setOpen(false) }
    else if (e.key === 'Escape') setOpen(false)
  }

  const heights = size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'

  // ─── Highlight matching text ──────────────────────────────────────────
  const renderHighlight = (text) => {
    if (!search) return text
    const idx = text.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return text
    return <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(37,99,235,.2)', color: 'var(--primary)', padding: 0 }}>{text.slice(idx, idx + search.length)}</mark>
      {text.slice(idx + search.length)}
    </>
  }

  return (
    <div ref={wrap} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3.5 ${heights} rounded-xl border focus:outline-none transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{
          background: 'var(--bg2)',
          borderColor: error ? 'var(--danger)' : open ? 'var(--primary)' : 'var(--border)',
          color: 'var(--text)',
          boxShadow: open ? '0 0 0 2px rgba(37,99,235,.15)' : 'none',
        }}
      >
        {selected ? (
          <>
            {getIcon && <span className="flex-shrink-0">{getIcon(selected)}</span>}
            <span className="flex-1 truncate">{getLabel(selected)}</span>
          </>
        ) : (
          <span className="flex-1 truncate" style={{ color: 'var(--text3)' }}>{placeholder}</span>
        )}
        {clearable && selected && (
          <X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text3)' }}
            onClick={(e) => { e.stopPropagation(); onChange(null) }} />
        )}
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text3)' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden animate-fade-in"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
              <input
                ref={input}
                value={search}
                onChange={e => { setSearch(e.target.value); setHL(0) }}
                onKeyDown={handleKey}
                placeholder="Type to search…"
                className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: 'var(--text3)' }}>
                No matches for "<strong>{search}</strong>"
              </div>
            ) : (
              filtered.map((opt, i) => {
                const key      = getKey(opt)
                const isSel    = key === value
                const isHL     = i === highlight
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseEnter={() => setHL(i)}
                    onClick={() => { onChange(key); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                    style={{
                      background: isSel ? 'var(--primary-light)' : isHL ? 'var(--bg2)' : 'transparent',
                      color: isSel ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    {getIcon && <span className="flex-shrink-0">{getIcon(opt)}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{renderHighlight(getLabel(opt))}</div>
                      {getSubLabel && (
                        <div className="text-[12.5px] truncate" style={{ color: 'var(--text3)' }}>{getSubLabel(opt)}</div>
                      )}
                    </div>
                    {isSel && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t text-[12.5px] flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg2)', color: 'var(--text3)' }}>
            <span>↑↓ Navigate · Enter Select · Esc Close</span>
            <span>{filtered.length} of {options.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
