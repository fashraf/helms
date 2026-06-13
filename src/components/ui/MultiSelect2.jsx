import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'

/**
 * MultiSelect2 — searchable multi-select dropdown with chips.
 *
 * Props:
 *   options:     Array<any>
 *   selected:    Array<key>
 *   onChange:    (newKeys[]) => void
 *   getLabel, getKey, getSubLabel, getIcon
 *   placeholder, disabled, error, size
 */
export default function MultiSelect2({
  options = [],
  selected = [],
  onChange,
  getLabel    = (o) => o?.label ?? String(o),
  getKey      = (o) => o?.id ?? o?.code ?? o,
  getIcon,
  getSubLabel,
  placeholder = 'Select…',
  disabled    = false,
  error       = false,
  size        = 'md',
  maxChips    = 4,
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const wrap  = useRef(null)
  const input = useRef(null)

  const selectedOpts = options.filter(o => selected.includes(getKey(o)))

  useEffect(() => {
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { if (open) { setSearch(''); setTimeout(() => input.current?.focus(), 30) } }, [open])

  const filtered = options.filter(o => {
    const q = search.toLowerCase()
    if (!q) return true
    return getLabel(o).toLowerCase().includes(q) ||
      (getSubLabel?.(o)?.toLowerCase().includes(q) ?? false)
  })

  const toggle = (key) => {
    onChange(selected.includes(key) ? selected.filter(x => x !== key) : [...selected, key])
  }

  const remove = (e, key) => {
    e.stopPropagation()
    onChange(selected.filter(x => x !== key))
  }

  const heights = size === 'sm' ? 'py-1.5 min-h-[34px] text-xs' : 'py-2 min-h-[42px] text-sm'
  const visibleChips = selectedOpts.slice(0, maxChips)
  const overflowCount = selectedOpts.length - visibleChips.length

  return (
    <div ref={wrap} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-2.5 ${heights} rounded-xl border focus:outline-none transition-all text-left disabled:opacity-50`}
        style={{
          background: 'var(--bg2)',
          borderColor: error ? 'var(--danger)' : open ? 'var(--primary)' : 'var(--border)',
          color: 'var(--text)',
          boxShadow: open ? '0 0 0 2px rgba(37,99,235,.15)' : 'none',
        }}
      >
        <div className="flex-1 flex items-center gap-1 flex-wrap">
          {selectedOpts.length === 0 && (
            <span className="px-1" style={{ color: 'var(--text3)' }}>{placeholder}</span>
          )}
          {visibleChips.map(opt => (
            <span key={getKey(opt)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12.5px] font-semibold"
              style={{ background: 'rgba(37,99,235,.12)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,.25)' }}>
              {getIcon && <span>{getIcon(opt)}</span>}
              {getLabel(opt)}
              <span onClick={(e) => remove(e, getKey(opt))} className="hover:opacity-70 cursor-pointer ml-0.5"><X className="w-3 h-3" /></span>
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="text-[12.5px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>+{overflowCount} more</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text3)' }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden animate-fade-in"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
              <input
                ref={input}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type to search…"
                className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: 'var(--text3)' }}>No matches</div>
            ) : filtered.map(opt => {
              const key = getKey(opt)
              const isSel = selected.includes(key)
              return (
                <button key={key} type="button" onClick={() => toggle(key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{ background: isSel ? 'var(--primary-light)' : 'transparent', color: isSel ? 'var(--primary)' : 'var(--text)' }}
                  onMouseEnter={e => !isSel && (e.currentTarget.style.background = 'var(--bg2)')}
                  onMouseLeave={e => !isSel && (e.currentTarget.style.background = 'transparent')}>
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isSel ? 'var(--primary)' : 'var(--border2)', background: isSel ? 'var(--primary)' : 'transparent' }}>
                    {isSel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {getIcon && <span className="flex-shrink-0">{getIcon(opt)}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{getLabel(opt)}</div>
                    {getSubLabel && <div className="text-[12.5px] truncate" style={{ color: 'var(--text3)' }}>{getSubLabel(opt)}</div>}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="px-3 py-1.5 border-t text-[12.5px] flex items-center justify-between"
            style={{ borderColor: 'var(--border)', background: 'var(--bg2)', color: 'var(--text3)' }}>
            <span><strong style={{ color: 'var(--primary)' }}>{selected.length}</strong> selected</span>
            <span>{filtered.length} of {options.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
