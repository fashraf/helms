import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react'

/**
 * NestedGrid — expandable enterprise grid with lazy-loaded child rows.
 *
 * Props:
 *   columns:      Array<{ key, label, width?, render? }>
 *   rows:         Array<{ id, data, children?: RowConfig }>
 *   depth:        current nesting depth (0 = root)
 *   maxDepth:     max nesting levels (default 4)
 *   onRowClick:   (row) => void
 *   loadChildren: async (row) => Row[]
 */

function GridRow({ row, columns, depth, maxDepth, loadChildren, onRowClick, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [children, setChildren] = useState(null)
  const hasChildren = row.hasChildren !== false && depth < maxDepth

  const handleExpand = useCallback(async (e) => {
    e.stopPropagation()
    if (!hasChildren) return
    if (!expanded && children === null && loadChildren) {
      setLoading(true)
      try {
        const data = await loadChildren(row)
        setChildren(data)
      } finally {
        setLoading(false)
      }
    }
    setExpanded(v => !v)
  }, [expanded, children, hasChildren, loadChildren, row])

  const indent = depth * 24

  return (
    <>
      <tr
        className="transition-colors group cursor-pointer"
        onClick={() => onRowClick?.(row)}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        {columns.map((col, ci) => (
          <td
            key={col.key}
            className="px-4 py-2.5"
            style={{ paddingLeft: ci === 0 ? `${16 + indent}px` : undefined }}
          >
            {ci === 0 ? (
              <div className="flex items-center gap-2">
                {/* Expand toggle */}
                {hasChildren ? (
                  <button
                    onClick={handleExpand}
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}
                  >
                    {loading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : expanded
                        ? <ChevronDown className="w-3.5 h-3.5"  />
                        : <ChevronRight className="w-3.5 h-3.5" />
                    }
                  </button>
                ) : (
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    {/* Leaf indicator */}
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--border2)' }} />
                  </div>
                )}
                {/* Depth indent lines */}
                {depth > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {Array.from({ length: depth }, (_, i) => (
                      <div key={i} className="w-px" style={{ height: 20, background: 'var(--border)' }} />
                    ))}
                  </div>
                )}
                {col.render ? col.render(row.data[col.key], row) : (
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {row.data[col.key] ?? '—'}
                  </span>
                )}
              </div>
            ) : (
              col.render
                ? col.render(row.data[col.key], row)
                : <span className="text-xs" style={{ color: 'var(--text2)' }}>{row.data[col.key] ?? '—'}</span>
            )}
          </td>
        ))}
      </tr>

      {/* Nested children */}
      {expanded && children?.map((child, i) => (
        <GridRow
          key={child.id}
          row={child}
          columns={columns}
          depth={depth + 1}
          maxDepth={maxDepth}
          loadChildren={loadChildren}
          onRowClick={onRowClick}
          isLast={i === children.length - 1}
        />
      ))}
    </>
  )
}

export default function NestedGrid({
  columns,
  rows,
  depth        = 0,
  maxDepth     = 4,
  loadChildren,
  onRowClick,
  stickyHeader = true,
  loading      = false,
  emptyMessage = 'No data',
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: 'var(--text3)', width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ borderColor: 'var(--border)' }}>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {columns.map((_, ci) => (
                    <td key={ci} className="px-4 py-3">
                      <div className="h-3 rounded animate-pulse" style={{ background: 'var(--bg3)', width: ci === 0 ? '60%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-sm" style={{ color: 'var(--text3)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <GridRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  depth={depth}
                  maxDepth={maxDepth}
                  loadChildren={loadChildren}
                  onRowClick={onRowClick}
                  isLast={i === rows.length - 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
