import { useState, useMemo } from 'react'
import {
  ChevronRight, ChevronDown, Check, Square, Minus, Search, Filter, Layers,
} from 'lucide-react'
import {
  PERMISSION_TREE, PERM_ACTIONS, permKey, applyDependencies, pagePermissionKeys, menuPermissionKeys,
} from '../../api/mock/permissionTree'

/**
 * PermissionMatrix — expandable tree
 *
 * Props:
 *   permissions:  { 'menu:submenu:page:action': true }
 *   onChange:     (newPermissionsObj) => void
 *   readOnly:     boolean
 */

const LEVEL_COLOR = {
  basic:    'var(--text3)',
  standard: 'var(--primary)',
  elevated: 'var(--warning)',
  admin:    'var(--danger)',
}

function Checkbox({ state, onClick, label, level, action, readOnly }) {
  // state: 'checked' | 'unchecked' | 'mixed'
  const isChecked = state === 'checked'
  const isMixed   = state === 'mixed'
  const color     = action ? LEVEL_COLOR[level] : 'var(--primary)'
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      disabled={readOnly}
      className="inline-flex items-center gap-1.5 transition-all disabled:cursor-not-allowed"
    >
      <div className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: isChecked ? color : isMixed ? color + '30' : 'transparent',
          borderColor: isChecked || isMixed ? color : 'var(--border2)',
        }}>
        {isChecked && <Check className="w-3 h-3 text-white" />}
        {isMixed   && <Minus className="w-3 h-3" style={{ color }} />}
      </div>
      {label && <span className="text-xs" style={{ color: 'var(--text2)' }}>{label}</span>}
    </button>
  )
}

export default function PermissionMatrix({ permissions = {}, onChange, readOnly = false }) {
  const [expanded, setExpanded]   = useState(new Set(['dashboard','projects']))
  const [expandedSub, setExpSub]  = useState(new Set())
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all') // 'all' | 'granted' | 'denied'

  const toggleMenu = (id) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSub  = (id) => setExpSub(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ─── Permission state helpers ──────────────────────────────────────────
  const isGranted = (key) => !!permissions[key]

  const togglePerm = (menuId, subId, pageId, actionId) => {
    const key = permKey(menuId, subId, pageId, actionId)
    const next = { ...permissions, [key]: !permissions[key] }
    // Auto-apply dependencies (e.g. checking Approve also checks View)
    onChange(applyDependencies(next))
  }

  // ─── Page state (mixed/checked/unchecked) ──────────────────────────────
  const pageState = (menu, sub, page) => {
    const keys = pagePermissionKeys(menu.id, sub.id, page.id)
    const granted = keys.filter(k => permissions[k]).length
    if (granted === 0) return 'unchecked'
    if (granted === keys.length) return 'checked'
    return 'mixed'
  }
  const togglePage = (menu, sub, page) => {
    const keys  = pagePermissionKeys(menu.id, sub.id, page.id)
    const state = pageState(menu, sub, page)
    const next  = { ...permissions }
    if (state === 'checked') keys.forEach(k => { delete next[k] })
    else                     keys.forEach(k => { next[k] = true })
    onChange(applyDependencies(next))
  }

  // ─── Submenu state ──────────────────────────────────────────────────────
  const subState = (menu, sub) => {
    const allKeys = sub.pages.flatMap(p => pagePermissionKeys(menu.id, sub.id, p.id))
    const granted = allKeys.filter(k => permissions[k]).length
    if (granted === 0) return 'unchecked'
    if (granted === allKeys.length) return 'checked'
    return 'mixed'
  }
  const toggleSubAll = (menu, sub) => {
    const allKeys = sub.pages.flatMap(p => pagePermissionKeys(menu.id, sub.id, p.id))
    const state   = subState(menu, sub)
    const next    = { ...permissions }
    if (state === 'checked') allKeys.forEach(k => { delete next[k] })
    else                     allKeys.forEach(k => { next[k] = true })
    onChange(applyDependencies(next))
  }

  // ─── Menu state ─────────────────────────────────────────────────────────
  const menuState = (menu) => {
    const allKeys = menuPermissionKeys(menu.id)
    const granted = allKeys.filter(k => permissions[k]).length
    if (granted === 0) return 'unchecked'
    if (granted === allKeys.length) return 'checked'
    return 'mixed'
  }
  const toggleMenuAll = (menu) => {
    const allKeys = menuPermissionKeys(menu.id)
    const state   = menuState(menu)
    const next    = { ...permissions }
    if (state === 'checked') allKeys.forEach(k => { delete next[k] })
    else                     allKeys.forEach(k => { next[k] = true })
    onChange(applyDependencies(next))
  }

  // ─── Filtered tree based on search ─────────────────────────────────────
  const filteredTree = useMemo(() => {
    if (!search && filter === 'all') return PERMISSION_TREE
    return PERMISSION_TREE.map(menu => {
      const submenus = menu.submenus.map(sub => {
        const pages = sub.pages.filter(p => {
          const matchSearch = !search ||
            menu.label.toLowerCase().includes(search.toLowerCase()) ||
            sub.label.toLowerCase().includes(search.toLowerCase()) ||
            p.label.toLowerCase().includes(search.toLowerCase())
          if (!matchSearch) return false
          if (filter === 'granted') return pagePermissionKeys(menu.id, sub.id, p.id).some(k => permissions[k])
          if (filter === 'denied')  return pagePermissionKeys(menu.id, sub.id, p.id).every(k => !permissions[k])
          return true
        })
        return { ...sub, pages }
      }).filter(sub => sub.pages.length > 0)
      return { ...menu, submenus }
    }).filter(menu => menu.submenus.length > 0)
  }, [search, filter, permissions])

  // ─── Bulk toolbar actions ──────────────────────────────────────────────
  const expandAll   = () => setExpanded(new Set(PERMISSION_TREE.map(m => m.id)))
  const collapseAll = () => { setExpanded(new Set()); setExpSub(new Set()) }
  const selectAllGlobal = () => {
    const next = {}
    PERMISSION_TREE.forEach(m => menuPermissionKeys(m.id).forEach(k => { next[k] = true }))
    onChange(next)
  }
  const clearAllGlobal = () => onChange({})

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }}>
      {/* Toolbar */}
      <div className="border-b" style={{ borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background:'var(--bg2)' }}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color:'var(--primary)' }} />
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Permission Matrix</h3>
            <span className="text-[12.5px] font-mono px-2 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text3)', border:'1px solid var(--border)' }}>
              {Object.values(permissions).filter(Boolean).length} granted
            </span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={selectAllGlobal} className="text-[12.5px] font-bold px-2 py-1 rounded border" style={{ borderColor:'var(--border)', color:'var(--success)', background:'var(--card)' }}>Grant All</button>
              <button type="button" onClick={clearAllGlobal}  className="text-[12.5px] font-bold px-2 py-1 rounded border" style={{ borderColor:'var(--border)', color:'var(--danger)',  background:'var(--card)' }}>Clear All</button>
              <span className="w-px h-4" style={{ background:'var(--border)' }} />
              <button type="button" onClick={expandAll}   className="text-[12.5px] px-2 py-1" style={{ color:'var(--text3)' }}>Expand All</button>
              <button type="button" onClick={collapseAll} className="text-[12.5px] px-2 py-1" style={{ color:'var(--text3)' }}>Collapse All</button>
            </div>
          )}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t" style={{ borderColor:'var(--border)' }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search menus, pages, actions…"
              className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
            {[['all','All'],['granted','Granted'],['denied','Denied']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFilter(v)}
                className="px-2.5 py-1 rounded-md text-[12.5px] font-bold transition-all"
                style={filter === v ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="divide-y max-h-[640px] overflow-y-auto" style={{ borderColor:'var(--border)' }}>
        {filteredTree.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color:'var(--text3)' }}>No matches found</div>
        ) : filteredTree.map(menu => {
          const ms       = menuState(menu)
          const isOpen   = expanded.has(menu.id) || !!search
          return (
            <div key={menu.id}>
              {/* Menu row */}
              <div className="flex items-center px-4 py-2.5" style={{ background:'var(--bg2)' }}>
                <button type="button" onClick={() => toggleMenu(menu.id)} className="w-5 h-5 flex items-center justify-center mr-1" style={{ color:'var(--text3)' }}>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <Checkbox state={ms} onClick={() => toggleMenuAll(menu)} readOnly={readOnly} />
                <span className="text-base mx-2">{menu.icon}</span>
                <span className="text-sm font-bold flex-1" style={{ color:'var(--text)' }}>{menu.label}</span>
                <span className="text-[12.5px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--text3)', border:'1px solid var(--border)' }}>
                  {menuPermissionKeys(menu.id).filter(k => permissions[k]).length} / {menuPermissionKeys(menu.id).length}
                </span>
              </div>

              {/* Submenus */}
              {isOpen && menu.submenus.map(sub => {
                const ss        = subState(menu, sub)
                const subOpen   = expandedSub.has(`${menu.id}.${sub.id}`) || !!search
                const subKey    = `${menu.id}.${sub.id}`
                return (
                  <div key={sub.id} className="border-t" style={{ borderColor:'var(--border)' }}>
                    {/* Submenu row */}
                    <div className="flex items-center pl-10 pr-4 py-2">
                      <button type="button" onClick={() => toggleSub(subKey)} className="w-5 h-5 flex items-center justify-center mr-1" style={{ color:'var(--text3)' }}>
                        {subOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <Checkbox state={ss} onClick={() => toggleSubAll(menu, sub)} readOnly={readOnly} />
                      <span className="text-xs font-semibold flex-1 ml-2" style={{ color:'var(--text2)' }}>{sub.label}</span>
                    </div>

                    {/* Pages */}
                    {subOpen && sub.pages.map(page => {
                      const ps = pageState(menu, sub, page)
                      return (
                        <div key={page.id} className="border-t" style={{ borderColor:'var(--border)' }}>
                          {/* Page row */}
                          <div className="flex items-center pl-16 pr-4 py-2">
                            <Checkbox state={ps} onClick={() => togglePage(menu, sub, page)} readOnly={readOnly} />
                            <span className="text-xs flex-1 ml-2" style={{ color:'var(--text2)' }}>{page.label}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)', color:'var(--text3)' }}>
                              {pagePermissionKeys(menu.id, sub.id, page.id).filter(k => permissions[k]).length} / {page.actions.length}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="pl-24 pr-4 pb-3 flex flex-wrap gap-1.5">
                            {page.actions.map(actionId => {
                              const action = PERM_ACTIONS.find(a => a.id === actionId)
                              if (!action) return null
                              const key  = permKey(menu.id, sub.id, page.id, action.id)
                              const isOn = isGranted(key)
                              return (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={readOnly ? undefined : () => togglePerm(menu.id, sub.id, page.id, action.id)}
                                  disabled={readOnly}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12.5px] font-medium transition-all disabled:cursor-not-allowed"
                                  style={{
                                    background: isOn ? LEVEL_COLOR[action.level] + '15' : 'var(--bg2)',
                                    border: `1px solid ${isOn ? LEVEL_COLOR[action.level] + '50' : 'var(--border)'}`,
                                    color: isOn ? LEVEL_COLOR[action.level] : 'var(--text3)',
                                  }}>
                                  <Checkbox state={isOn ? 'checked' : 'unchecked'} action level={action.level} readOnly />
                                  <span>{action.icon}</span>
                                  <span>{action.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="border-t px-4 py-2 flex items-center gap-3 text-[12.5px]" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
        <span style={{ color:'var(--text3)' }}>Action levels:</span>
        {[
          ['basic',    'Basic'],
          ['standard', 'Standard'],
          ['elevated', 'Elevated'],
          ['admin',    'Admin'],
        ].map(([k, l]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLOR[k] }} />
            <span style={{ color:'var(--text2)' }}>{l}</span>
          </div>
        ))}
        <span className="ml-auto" style={{ color:'var(--text3)' }}>
          Checking elevated actions auto-checks "View"
        </span>
      </div>
    </div>
  )
}
