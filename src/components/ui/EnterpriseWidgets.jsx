import { useState, useRef, useEffect, useCallback } from 'react'
import { List, LayoutGrid, Clock, Map, TrendingUp, TrendingDown, Minus, Search, X, ArrowRight, Package, Users, Truck, Building2, Warehouse, GitBranch } from 'lucide-react'
import { SEARCH_INDEX } from '../../api/mock/phase7Data'

// ─── ViewModeSwitcher ─────────────────────────────────────────────────────────
const VIEW_ICONS = { list: List, card: LayoutGrid, timeline: Clock, map: Map }
const VIEW_LABELS = { list: 'List', card: 'Cards', timeline: 'Timeline', map: 'Map' }

export function ViewModeSwitcher({ modes = ['list','card','timeline'], value, onChange }) {
  return (
    <div className="flex items-center rounded-lg border p-0.5 gap-0.5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {modes.map((mode) => {
        const Icon = VIEW_ICONS[mode]
        const active = value === mode
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            title={VIEW_LABELS[mode]}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-bold tracking-wide transition-all"
            style={active
              ? { background: 'var(--primary)', color: '#fff' }
              : { color: 'var(--text3)' }
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{VIEW_LABELS[mode]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── KPIWidget ────────────────────────────────────────────────────────────────
export function KPIWidget({ label, value, unit='', delta, deltaLabel='vs last month', icon: Icon, color='var(--primary)', bg, trend='neutral', compact=false, sub }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text3)'

  if (compact) {
    return (
      <div className="rounded-xl border p-3.5 transition-all" style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</span>
          {Icon && <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: bg ?? color + '15' }}><Icon className="w-3.5 h-3.5" style={{ color }} /></div>}
        </div>
        <div className="text-2xl font-black font-mono tabular-nums" style={{ color }}>
          {value}<span className="text-sm font-semibold ml-0.5" style={{ color: 'var(--text3)' }}>{unit}</span>
        </div>
        {sub && <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
        {delta !== undefined && (
          <div className="flex items-center gap-1 mt-1.5">
            <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
            <span className="text-[12.5px] font-semibold" style={{ color: trendColor }}>{delta > 0 ? '+' : ''}{delta}</span>
            <span className="text-[12.5px]" style={{ color: 'var(--text3)' }}>{deltaLabel}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-5 transition-all" style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[12.5px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono tabular-nums" style={{ color }}>{value}</span>
            {unit && <span className="text-base font-semibold" style={{ color: 'var(--text3)' }}>{unit}</span>}
          </div>
          {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg ?? color + '15' }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
          <span className="text-xs font-semibold" style={{ color: trendColor }}>{delta > 0 ? '+' : ''}{delta}</span>
          <span className="text-xs" style={{ color: 'var(--text3)' }}>{deltaLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── SmartSearchBar ───────────────────────────────────────────────────────────
const TYPE_ICONS = { shipment: Package, driver: Users, vehicle: Truck, vendor: Building2, warehouse: Warehouse, workflow: GitBranch }
const TYPE_COLORS = { shipment:'var(--primary)', driver:'#0891B2', vehicle:'#D97706', vendor:'#7C3AED', warehouse:'#059669', workflow:'#EA580C' }

const CATEGORIES = ['shipment','driver','vehicle','vendor','warehouse','workflow']

export function SmartSearchBar({ placeholder = 'Search shipments, drivers, vendors, vehicles…', onNavigate }) {
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [results, setResults] = useState([])
  const [history, setHistory] = useState(['SHP-00891','FedEx Saudi','Mohammed Al-Ghamdi'])
  const [filter,  setFilter]  = useState('all')
  const ref   = useRef(null)
  const input = useRef(null)

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    const filtered = SEARCH_INDEX.filter(item => {
      if (filter !== 'all' && item.type !== filter) return false
      return item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    }).slice(0, 8)
    setResults(filtered)
  }, [query, filter])

  const handleSelect = (item) => {
    setHistory(h => [item.label, ...h.filter(x => x !== item.label)].slice(0, 5))
    setQuery('')
    setOpen(false)
    if (onNavigate) onNavigate(item.url)
  }

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text3)' }} />
        <input
          ref={input}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none transition-all"
          style={{
            background: 'var(--card)',
            borderColor: open ? 'var(--primary)' : 'var(--border)',
            color: 'var(--text)',
            boxShadow: open ? '0 0 0 2px ' + 'rgba(37,99,235,.15)' : 'var(--shadow)',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border overflow-hidden z-50 animate-fade-in"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)', maxHeight: '70vh', overflowY: 'auto' }}>

          {/* Category filter */}
          <div className="flex items-center gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
            {['all', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className="px-2.5 py-1 text-[12.5px] font-bold rounded-md whitespace-nowrap flex-shrink-0 transition-all capitalize"
                style={filter === cat
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--bg2)', color: 'var(--text3)', border: '1px solid var(--border)' }
                }>
                {cat === 'all' ? 'All' : cat + 's'}
              </button>
            ))}
          </div>

          {/* History (no query) */}
          {!query && history.length > 0 && (
            <div className="p-2">
              <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5" style={{ color: 'var(--text3)' }}>Recent Searches</div>
              {history.map((h, i) => (
                <button key={i} onClick={() => { setQuery(h); input.current?.focus() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  style={{ color: 'var(--text2)' }}>
                  <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text3)' }} />
                  {h}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {query && (
            results.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>
                No results for "<strong>{query}</strong>"
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedResults).map(([type, items]) => {
                  const Icon = TYPE_ICONS[type] ?? Package
                  const color = TYPE_COLORS[type] ?? 'var(--primary)'
                  return (
                    <div key={type} className="mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-1" style={{ color: 'var(--text3)' }}>
                        <Icon className="w-3 h-3" style={{ color }} />
                        <span className="text-[9px] font-bold uppercase tracking-widest capitalize">{type}s</span>
                      </div>
                      {items.map(item => (
                        <button key={item.id} onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: color + '15' }}>
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.label}</div>
                            <div className="text-[12.5px] truncate" style={{ color: 'var(--text3)' }}>{item.sub}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text3)' }} />
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t text-[12.5px]" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
            <span>↑↓ Navigate · Enter Select · Esc Close</span>
            {results.length > 0 && <span>{results.length} results</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AIAnalyticsCard ──────────────────────────────────────────────────────────
const SEVERITY_CFG = {
  warning: { border:'rgba(217,119,6,.3)', bg:'rgba(217,119,6,.06)', icon:'⚠', textColor:'#B45309' },
  danger:  { border:'rgba(220,38,38,.3)', bg:'rgba(220,38,38,.06)', icon:'🔴', textColor:'#DC2626' },
  info:    { border:'rgba(37,99,235,.3)', bg:'rgba(37,99,235,.06)', icon:'ℹ', textColor:'#2563EB' },
  success: { border:'rgba(5,150,105,.3)', bg:'rgba(5,150,105,.06)', icon:'✅', textColor:'#059669' },
}

export function AIAnalyticsCard({ insight }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CFG[insight.severity] ?? SEVERITY_CFG.info
  const TYPE_LABELS = { trend:'Trend Analysis', bottleneck:'Bottleneck', prediction:'Prediction', opportunity:'Opportunity' }

  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start gap-3 p-4">
        <span className="text-xl flex-shrink-0">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.textColor }}>
              {TYPE_LABELS[insight.type] ?? 'AI Insight'}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: cfg.border, color: cfg.textColor }}>
              {insight.confidence}% confidence
            </span>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{insight.title}</p>
          {expanded && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{insight.detail}</p>
              <div className="flex items-start gap-1.5 text-xs" style={{ color: cfg.textColor }}>
                <span className="font-bold flex-shrink-0">→ Recommendation:</span>
                <span>{insight.recommendation}</span>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ color: 'var(--text3)', flexShrink: 0 }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// needed import for ChevronUp/Down
import { ChevronDown, ChevronUp } from 'lucide-react'
