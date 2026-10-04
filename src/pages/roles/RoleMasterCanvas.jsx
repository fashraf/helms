import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Plus, Search, ArrowLeft, X, Check, ChevronDown, ChevronRight,
  Edit3, Copy, Power, RotateCcw, History, Eye, EyeOff, CheckCircle2, XCircle,
  Layers, AlertTriangle, Save, Lock, Unlock, MoreVertical, Filter, Users, Mail,
} from 'lucide-react'
import useRBACv2Store from '../../store/rbacV2Store'
import useUserStore from '../../store/userStore'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  PERMISSION_TREE, PERM_ACTIONS, permKey, applyDependencies,
  pagePermissionKeys, menuPermissionKeys, permissionSummary, visibleMenusFromPermissions,
} from '../../api/mock/permissionTree'

// ─── Soft UI palette (lighter, more subtle) ──────────────────────────────────
const P = {
  primary:     '#818CF8',  // indigo-400 (was indigo-600 — lighter)
  primaryDeep: '#6366F1',  // indigo-500 (for hover / commit button)
  primarySoft: '#F5F7FF',  // even lighter than indigo-50
  primaryHov:  '#EEF2FF',  // indigo-50
  accent:      '#A78BFA',  // violet-400 (was violet-600 — lighter)
  accentSoft:  '#FAF8FF',  // very pale violet
  border:      '#E2E8F0',  // slate-200
  borderSoft:  '#F1F5F9',  // slate-100
  borderDark:  '#CBD5E1',  // slate-300
  bg:          '#FCFCFD',  // very pale
  bgCanvas:    '#F8FAFC',  // slate-50
  card:        '#FFFFFF',
  text:        '#1E293B',  // slate-800 (lighter than indigo-950)
  text2:       '#64748B',  // slate-500
  text3:       '#94A3B8',  // slate-400
  text4:       '#CBD5E1',  // slate-300
  success:     '#10B981',  // emerald-500
  successSoft: '#ECFDF5',  // emerald-50
  danger:      '#F87171',  // red-400 (softer)
  dangerSoft:  '#FEF2F2',  // red-50
  warning:     '#FBBF24',  // amber-400
  warningSoft: '#FFFBEB',  // amber-50
}

const card = { background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, boxShadow: '0 1px 2px rgba(15,23,42,.04)' }

// Action level colors (granular control tokens)
const ACTION_COLORS = {
  basic:    { bg: P.borderSoft, fg: P.text2,   border: P.border       },
  standard: { bg: P.primarySoft,fg: P.primary, border: '#C7D2FE'      },
  elevated: { bg: P.warningSoft,fg: P.warning, border: '#FDE68A'      },
  admin:    { bg: P.dangerSoft, fg: P.danger,  border: '#FECACA'      },
}

const EMPTY_FORM = {
  name: '', scope: '', description: '', badge: 'NR', color: P.primary, status: 'active', permissions: {}, defaultPage: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'short', day:'numeric' }) }

// ─── Granular control token (Level 4 cell) ───────────────────────────────────
function ControlToken({ action, isOn, onClick, readOnly }) {
  const colors = ACTION_COLORS[action.level] ?? ACTION_COLORS.basic
  return (
    <button type="button" onClick={readOnly ? undefined : onClick} disabled={readOnly}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12.5px] font-semibold transition-all disabled:cursor-not-allowed"
      style={{
        background: isOn ? colors.bg : P.card,
        border: `1px solid ${isOn ? colors.border : P.border}`,
        color: isOn ? colors.fg : P.text3,
      }}>
      <div className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
        style={{ background: isOn ? colors.fg : 'transparent', borderColor: isOn ? colors.fg : P.borderDark }}>
        {isOn && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <span>{action.icon}</span>
      <span>{action.label}</span>
    </button>
  )
}

// ─── Tri-state checkbox ──────────────────────────────────────────────────────
function TriCheck({ state, onClick, readOnly }) {
  const isChecked = state === 'checked'
  const isMixed   = state === 'mixed'
  return (
    <button type="button" onClick={readOnly ? undefined : onClick} disabled={readOnly}
      className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all disabled:cursor-not-allowed"
      style={{
        background: isChecked ? P.primary : isMixed ? P.primarySoft : 'transparent',
        borderColor: isChecked || isMixed ? P.primary : P.borderDark,
      }}>
      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
      {isMixed   && <div className="w-1.5 h-0.5 rounded-full" style={{ background: P.primary }} />}
    </button>
  )
}

// ─── Mode A: Role List Registry Grid ─────────────────────────────────────────
function ListMode({ roles, users, onEdit, onAddNew, onClone, onDeactivate, onActivate, onAudit }) {
  const [search, setSearch] = useState('')
  const [hoverRole, setHoverRole] = useState(null)  // { role, anchor } for user popup

  const filtered = roles.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
  })

  return (
    <div style={card} className="overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: P.primary }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: P.text }}>Role Registry</h3>
          <span className="text-[12.5px] font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: P.primarySoft, color: P.primary, border: `1px solid #C7D2FE` }}>
            {filtered.length} of {roles.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: P.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search roles…"
              className="rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-56"
              style={{ background: P.card, borderColor: P.border, color: P.text }} />
          </div>
          <button onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all"
            style={{ background: P.primary, boxShadow: '0 2px 4px rgba(79,70,229,.25)' }}>
            <Plus className="w-3.5 h-3.5" /> Add New Role
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
            <tr>
              {['Role & Scope','Users','Permissions','Created By','Last Updated','Status',''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: P.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-sm" style={{ color: P.text3 }}>No roles match your search</td></tr>
            ) : filtered.map(r => {
              const sum = permissionSummary(r.permissions)
              const isActive = r.status === 'active'
              return (
                <tr key={r.id} className="transition-colors" style={{ borderTop: `1px solid ${P.borderSoft}` }}
                  onMouseEnter={e => e.currentTarget.style.background = P.bgCanvas}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background: r.color || P.primary }}>
                        {r.badge ?? r.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight" style={{ color: P.text }}>{r.name}</div>
                        <div className="text-[12.5px] truncate max-w-[280px]" style={{ color: P.text3 }}>{r.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button"
                      onMouseEnter={() => setHoverRole(r)}
                      onMouseLeave={() => setHoverRole(null)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-bold transition-all"
                      style={{
                        background: (r.userCount ?? 0) > 0 ? P.primarySoft : 'transparent',
                        color: (r.userCount ?? 0) > 0 ? P.primaryDeep : P.text3,
                        border: `1px solid ${(r.userCount ?? 0) > 0 ? P.primarySoft : 'transparent'}`,
                      }}>
                      <Users className="w-3 h-3" />
                      {r.userCount ?? 0}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono font-bold" style={{ color: P.success }}>{sum.granted}</span>
                      <span className="text-[12.5px]" style={{ color: P.text3 }}>/ {sum.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[11px]" style={{ color: P.text2 }}>{r.createdBy ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: P.text3 }}>{fmtDate(r.updatedAt)}</span></td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                      style={{
                        background: isActive ? P.successSoft : P.borderSoft,
                        color: isActive ? P.success : P.text3,
                        border: `1px solid ${isActive ? '#A7F3D0' : P.border}`,
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(r)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: P.text3 }}
                        title="Edit" onMouseEnter={e => { e.currentTarget.style.background = P.primarySoft; e.currentTarget.style.color = P.primary }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = P.text3 }}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onClone(r)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: P.text3 }}
                        title="Clone" onMouseEnter={e => { e.currentTarget.style.background = P.accentSoft; e.currentTarget.style.color = P.accent }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = P.text3 }}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => isActive ? onDeactivate(r) : onActivate(r)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: P.text3 }}
                        title={isActive ? 'Archive' : 'Reactivate'}
                        onMouseEnter={e => { e.currentTarget.style.background = isActive ? P.dangerSoft : P.successSoft; e.currentTarget.style.color = isActive ? P.danger : P.success }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = P.text3 }}>
                        {isActive ? <Power className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => onAudit(r)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: P.text3 }}
                        title="Audit Ledger"
                        onMouseEnter={e => { e.currentTarget.style.background = P.borderSoft; e.currentTarget.style.color = P.text }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = P.text3 }}>
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Hover popover — users assigned to the role, anchored at top of the table */}
      {hoverRole && (() => {
        const assigned = (users ?? []).filter(u => u.status === 'active').slice(0, hoverRole.userCount ?? 0)
        const ROW_H = 40  // pixel height of one user row
        const maxH  = ROW_H * 5 + 8  // 5 rows + padding
        return (
          <div
            className="absolute inset-0 z-30 flex justify-center items-start pt-4 pointer-events-none animate-fade-in"
            style={{ background: 'rgba(15,23,42,.20)', backdropFilter: 'blur(2px)' }}>
            <div
              onMouseEnter={() => setHoverRole(hoverRole)}
              onMouseLeave={() => setHoverRole(null)}
              className="rounded-xl pointer-events-auto"
              style={{ width: 420, background: P.card, border: `1px solid ${P.border}`, boxShadow: '0 16px 48px rgba(15,23,42,.18)' }}>
              <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}`, borderRadius: '12px 12px 0 0' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12.5px] font-black text-white" style={{ background: hoverRole.color || P.primary }}>
                  {hoverRole.badge ?? hoverRole.name.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: P.text }}>{hoverRole.name}</div>
                  <div className="text-[12.5px]" style={{ color: P.text3 }}>
                    {hoverRole.userCount ?? 0} user{(hoverRole.userCount ?? 0) === 1 ? '' : 's'} assigned
                    {assigned.length > 5 && <span className="ml-1" style={{ color: P.primaryDeep }}>· scroll for more</span>}
                  </div>
                </div>
                <Users className="w-4 h-4" style={{ color: P.primary }} />
              </div>
              <div className="p-2 overflow-y-auto" style={{ maxHeight: maxH }}>
                {assigned.length === 0 ? (
                  <div className="py-6 text-center text-[11px]" style={{ color: P.text3 }}>
                    No users currently assigned to this role.
                  </div>
                ) : assigned.map(u => (
                  <div key={u.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md" style={{ minHeight: ROW_H }}
                    onMouseEnter={e => e.currentTarget.style.background = P.bgCanvas}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0"
                      style={{ background: P.primary }}>
                      {(u.name ?? '?').split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: P.text }}>{u.name}</div>
                      <div className="flex items-center gap-1 text-[12.5px]" style={{ color: P.text3 }}>
                        <Mail className="w-2.5 h-2.5" />
                        <span className="truncate">{u.email ?? '—'}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: P.bgCanvas, color: P.text2, border: `1px solid ${P.border}` }}>
                      {u.dept ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
function MatrixMode({ permissions, onChange }) {
  const [search, setSearch] = useState('')

  const updatePerms = (next) => onChange(applyDependencies(next))

  const togglePerm = (m, s, p, actionId) => {
    const key = permKey(m.id, s.id, p.id, actionId)
    updatePerms({ ...permissions, [key]: !permissions[key] })
  }

  const filtered = useMemo(() => {
    if (!search) return PERMISSION_TREE
    const q = search.toLowerCase()
    return PERMISSION_TREE.map(m => ({
      ...m,
      submenus: m.submenus.map(s => ({
        ...s,
        pages: s.pages.filter(p =>
          m.label.toLowerCase().includes(q) ||
          p.label.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q)
        ),
      })).filter(s => s.pages.length > 0),
    })).filter(m => m.submenus.length > 0)
  }, [search])

  return (
    <div style={card} className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: P.primary }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: P.text }}>Module Tree Specification Matrix</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: P.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter modules / pages…"
              className="rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-56"
              style={{ background: P.card, borderColor: P.border, color: P.text }} />
          </div>
          <button onClick={() => updatePerms({})} className="text-[12.5px] font-bold px-2 py-1 rounded border" style={{ background: P.card, borderColor: P.border, color: P.danger }}>Clear All</button>
        </div>
      </div>

      {/* Content — flows naturally to bottom of page, no inner scrollbar */}
      <div className="p-3 space-y-3" style={{ background: P.bg }}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: P.text3 }}>No modules match the filter</div>
        ) : filtered.map(mod => {
          // Flatten every page under this module so the layout is Page → Function with no submenu collapse layer
          const flatPages = mod.submenus.flatMap(s => s.pages.map(p => ({ ...p, submenu: s })))
          const modGranted = menuPermissionKeys(mod.id).filter(k => permissions[k]).length
          const modTotal   = menuPermissionKeys(mod.id).length

          return (
            <div key={mod.id} className="rounded-xl overflow-hidden" style={{ background: P.card, border: `1px solid ${P.border}` }}>
              {/* ─── LEVEL 1: Main Menu Block (anchor banner) ─── */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: P.primarySoft, borderBottom: '1px solid #C7D2FE' }}>
                <div className="flex items-center gap-2">
                  <span className="block w-1 h-5 rounded-full" style={{ background: P.primary }} />
                  <span className="text-base">{mod.icon}</span>
                  <span className="text-sm font-bold" style={{ color: P.text }}>{mod.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-mono px-2 py-0.5 rounded" style={{ background: P.card, color: P.text2, border: `1px solid #C7D2FE` }}>
                    {modGranted} / {modTotal}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded tracking-widest" style={{ background: P.primary, color: '#fff' }}>
                    MENU ANCHOR
                  </span>
                </div>
              </div>

              {/* ─── LEVELS 2/3: Page → Function pairing, flat list ─── */}
              <div className="divide-y" style={{ borderColor: P.borderSoft }}>
                {flatPages.map(page => {
                  const isViewOnly = page.actions.length === 1 && page.actions[0] === 'view'
                  const functionLabel = isViewOnly ? 'View' : 'Controls'
                  return (
                    <div key={page.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-start">
                      {/* Page → Function label cell (left) */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📄</span>
                          <span className="text-xs font-bold leading-tight" style={{ color: P.text }}>{page.label}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[12.5px] font-mono pl-1" style={{ color: P.text3 }}>
                          <span>└─►</span>
                          <span>Function:</span>
                          <span className="font-bold" style={{ color: isViewOnly ? P.text2 : P.primary }}>{functionLabel}</span>
                        </div>
                      </div>

                      {/* ─── LEVEL 4: Granular action cells (right) ─── */}
                      <div className="col-span-9">
                        <div className="flex flex-wrap gap-1.5">
                          {page.actions.map(actionId => {
                            const action = PERM_ACTIONS.find(a => a.id === actionId)
                            if (!action) return null
                            const isOn = !!permissions[permKey(mod.id, page.submenu.id, page.id, action.id)]
                            return (
                              <ControlToken key={action.id} action={action} isOn={isOn}
                                onClick={() => togglePerm(mod, page.submenu, page, action.id)} />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Right Sidebar: Navigation Blueprint + Commit ────────────────────────────
function RightSidebar({ permissions, mode, form, onDiscard, onCommit, saving }) {
  if (mode === 'list') return null  // Per spec: hide right panel entirely when in registry mode

  const visible = useMemo(() => visibleMenusFromPermissions(permissions), [permissions])

  return (
    <div className="space-y-3">
      {/* ── Navigation Panel Blueprint (LIVE PREVIEW) ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: P.card, border: `1px solid ${P.border}` }}>
        <div className="px-4 py-2.5" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: P.text }}>Navigation Panel Blueprint</h3>
          <p className="text-[12.5px] leading-relaxed" style={{ color: P.text3 }}>
            Exactly what the user with this role will see in the sidebar after login. Updates live as you toggle.
          </p>
        </div>
        <div className="p-2">
          {visible.length === 0 ? (
            <div className="py-8 text-center text-[11px]" style={{ color: P.text3 }}>
              Toggle actions in the matrix to populate the navigation preview.
            </div>
          ) : visible.map(m => {
            const grantedPages = m.submenus.flatMap(s =>
              s.pages
                .map(p => ({ ...p, submenu: s }))
                .filter(p => pagePermissionKeys(m.id, s.id, p.id).some(k => permissions[k]))
            )
            return (
              <div key={m.id} className="mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md" style={{ background: P.successSoft }}>
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: P.success }} />
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-xs font-bold flex-1 truncate" style={{ color: P.text }}>{m.label}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: P.card, color: P.success, border: `1px solid #A7F3D0` }}>
                    {grantedPages.length} page{grantedPages.length === 1 ? '' : 's'}
                  </span>
                </div>
                {grantedPages.map((p, idx) => {
                  const pageKeys = pagePermissionKeys(m.id, p.submenu.id, p.id)
                  const grantedActions = pageKeys.filter(k => permissions[k]).length
                  const totalActions   = p.actions.length
                  return (
                    <div key={p.id} className="flex items-center gap-1 ml-5 mt-0.5 text-[12.5px]" style={{ color: P.text2 }}>
                      <span className="font-mono" style={{ color: P.text4 }}>{idx === grantedPages.length - 1 ? '└─►' : '├─►'}</span>
                      <span className="truncate flex-1">{p.label}</span>
                      <span className="font-mono text-[9px] flex-shrink-0" style={{ color: grantedActions === totalActions ? P.success : P.text3 }}>
                        {grantedActions}/{totalActions}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* Default landing chip */}
        {form.defaultPage && (
          <div className="px-4 py-2 border-t flex items-center justify-between" style={{ background: P.primarySoft, borderColor: P.border }}>
            <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: P.text3 }}>Default Landing</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: P.primaryDeep }}>{form.defaultPage}</span>
          </div>
        )}
      </div>

      {/* ── Commit / Discard ── */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onDiscard}
          className="px-3 py-2.5 text-xs font-bold rounded-lg border transition-all"
          style={{ background: P.card, borderColor: P.border, color: P.text2 }}>
          Discard Alterations
        </button>
        <button onClick={onCommit} disabled={saving}
          className="px-3 py-2.5 text-xs font-bold rounded-lg text-white disabled:opacity-50 transition-all"
          style={{ background: P.primaryDeep }}>
          {saving ? 'Committing…' : 'Commit Layer Baseline'}
        </button>
      </div>

      {/* ── Footer chips ── */}
      <div className="flex items-center justify-between text-[9px] font-mono px-1" style={{ color: P.text3 }}>
        <span>[RBAC ENGINE V4]</span>
        <span>[SECURED DATA LAYER]</span>
      </div>
    </div>
  )
}

// ─── Inline confirmation strip (no modals) ───────────────────────────────────
function InlineConfirm({ open, type, role, onCancel, onConfirm }) {
  if (!open) return null
  const cfg = {
    deactivate: { label: 'Archive this role?',     desc: 'Users assigned to it will lose its permissions on next sign-in. No data is deleted; the role can be reactivated. Recorded in the audit ledger.', color: P.danger,  cta: 'Yes, Archive Role' },
    activate:   { label: 'Reactivate this role?',  desc: 'The role will be reactivated and assigned users will regain its permissions on next sign-in.', color: P.success, cta: 'Yes, Reactivate' },
    clone:      { label: 'Clone this role?',       desc: 'A new role will be created with all permissions copied. You will be switched to edit the new role.', color: P.accent, cta: 'Yes, Clone Role' },
  }[type]
  return (
    <div className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: P.card, border: `2px solid ${cfg.color}40`, boxShadow: `0 4px 16px ${cfg.color}15` }}>
      <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />
      <div className="flex-1">
        <div className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label} <span style={{ color: P.text }}>"{role?.name}"</span></div>
        <div className="text-[11px]" style={{ color: P.text2 }}>{cfg.desc}</div>
      </div>
      <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg border" style={{ background: P.card, borderColor: P.border, color: P.text2 }}>Cancel</button>
      <button onClick={onConfirm} className="px-4 py-1.5 text-xs font-bold rounded-lg text-white" style={{ background: cfg.color }}>{cfg.cta}</button>
    </div>
  )
}

// ─── Assigned Users tab ──────────────────────────────────────────────────────
function UsersTab({ role, users, editingId }) {
  const [search, setSearch] = useState('')

  // Determine which users belong to this role.
  // Mock-data linkage: match by role.name fragments against user.role string.
  const assignedAll = useMemo(() => {
    if (!editingId) return []
    const roleName = (role?.name ?? '').toLowerCase()
    // Slice deterministically by userCount so the tab matches the popup
    const byCount = (users ?? []).filter(u => u.status === 'active').slice(0, role?.userCount ?? 0)
    // Light-touch refinement: if role name strongly hints a department/title, prefer those users
    const refined = byCount.filter(u =>
      !roleName ||
      (u.dept ?? '').toLowerCase().includes(roleName.split(' ')[0]) ||
      (u.designation ?? '').toLowerCase().includes(roleName.split(' ')[0])
    )
    return refined.length > 0 ? refined : byCount
  }, [users, role, editingId])

  const filtered = assignedAll.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.dept ?? '').toLowerCase().includes(q)
  })

  if (!editingId) {
    return (
      <div style={card} className="overflow-hidden">
        <div className="py-16 text-center">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: P.text4 }} />
          <p className="text-sm font-semibold mb-1" style={{ color: P.text2 }}>No users yet</p>
          <p className="text-[11px]" style={{ color: P.text3 }}>
            Save this role first, then assign it to users from the User Management page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={card} className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: P.primary }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: P.text }}>Assigned Users</h3>
          <span className="text-[12.5px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: P.primarySoft, color: P.primaryDeep, border: `1px solid ${P.border}` }}>
            {assignedAll.length} active
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: P.text3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="rounded-lg pl-8 pr-3 py-1.5 text-xs border focus:outline-none w-56"
            style={{ background: P.card, borderColor: P.border, color: P.text }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: P.text4 }} />
          <p className="text-sm" style={{ color: P.text3 }}>
            {search ? 'No users match your search' : 'No users are currently assigned to this role'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
              <tr>
                {['User','Email','Department','Designation','Status','Last Login'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: P.text3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderTop: `1px solid ${P.borderSoft}` }}
                  onMouseEnter={e => e.currentTarget.style.background = P.bgCanvas}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12.5px] font-black text-white flex-shrink-0" style={{ background: P.primary }}>
                        {(u.name ?? '?').split(' ').map(w => w[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight" style={{ color: P.text }}>{u.name}</div>
                        <div className="text-[12.5px] font-mono" style={{ color: P.text3 }}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[11px] font-mono" style={{ color: P.text2 }}>{u.email ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[11px]" style={{ color: P.text2 }}>{u.dept ?? '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-[11px]" style={{ color: P.text2 }}>{u.designation ?? '—'}</span></td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                      style={{ background: P.successSoft, color: P.success, border: `1px solid #A7F3D0` }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />Active
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: P.text3 }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-SA', { month:'short', day:'numeric' }) : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main: Role Master Canvas ────────────────────────────────────────────────
export default function RoleMasterCanvas() {
  const navigate = useNavigate()
  const { roles, createRole, updateRole, cloneRole, deactivateRole, activateRole } = useRBACv2Store()
  const { users } = useUserStore()
  const { toast } = useToast()

  const [mode, setMode]               = useState('list')       // 'list' | 'matrix'
  const [form, setForm]               = useState(EMPTY_FORM)
  const [editingId, setEditingId]     = useState(null)         // null = new role
  const [confirm, setConfirm]         = useState(null)         // { type, role }
  const [reviewOpen, setReviewOpen]   = useState(false)        // commit review modal
  const [matrixTab, setMatrixTab]     = useState('matrix')     // 'matrix' | 'users'
  const [saving, setSaving]           = useState(false)
  const [errors, setErrors]           = useState({})

  const sum = permissionSummary(form.permissions)

  // ─── Actions ──────────────────────────────────────────────────────────
  const swapToMatrix = (role = null) => {
    if (role) {
      setForm({ ...EMPTY_FORM, ...role, scope: role.scope ?? role.description?.slice(0, 80) ?? '' })
      setEditingId(role.id)
    } else {
      setForm(EMPTY_FORM)
      setEditingId(null)
    }
    setErrors({})
    setMatrixTab('matrix')
    setMode('matrix')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const swapToList = () => {
    setMode('list')
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
  }

  // Step 1: validate, then open the review modal
  const handleCommit = () => {
    const e = {}
    if (!form.name?.trim())                            e.name = 'Role name is required'
    if (Object.values(form.permissions).filter(Boolean).length === 0) e.permissions = 'Grant at least one permission'
    setErrors(e)
    if (Object.keys(e).length) { toast.warning('Validation', 'Provide a role name and grant ≥ 1 permission.'); return }
    setReviewOpen(true)
  }

  // Step 2: actually persist (called from inside the review modal)
  const doSubmit = () => {
    setSaving(true)
    setTimeout(() => {
      if (editingId) { updateRole(editingId, form); toast.success('Committed', `${form.name} has been updated.`) }
      else           { createRole(form);            toast.success('Committed', `${form.name} has been created.`) }
      setSaving(false)
      setReviewOpen(false)
      swapToList()
    }, 400)
  }

  const performConfirm = () => {
    if (!confirm) return
    const { type, role } = confirm
    if (type === 'deactivate') { deactivateRole(role.id); toast.warning('Archived', `${role.name} archived.`) }
    if (type === 'activate')   { activateRole(role.id);   toast.success('Reactivated', `${role.name} reactivated.`) }
    if (type === 'clone')      {
      const newId = cloneRole(role.id)
      toast.success('Cloned', `Cloned from ${role.name}`)
      const cloned = roles.find(r => r.id === newId) ?? { ...role, id: newId, name: role.name + ' (Copy)' }
      setConfirm(null)
      swapToMatrix(cloned)
      return
    }
    setConfirm(null)
  }

  return (
    <div className="space-y-3 pb-8" style={{ background: P.bg }}>
      <BlockUI />

      {/* Header Bar */}
      <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => mode === 'matrix' ? swapToList() : navigate('/roles')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ color: P.text2, background: P.bgCanvas, border: `1px solid ${P.border}` }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: P.primarySoft, border: '1px solid #C7D2FE' }}>
              <Shield className="w-4.5 h-4.5" style={{ color: P.primary }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: P.text }}>HELMS Enterprise // Role Specification Canvas</h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: P.primarySoft, color: P.primary, border: '1px solid #C7D2FE' }}>
                  MODE: {mode === 'list' ? 'REGISTRY GRID' : 'NESTED MATRIX'}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: P.text3 }}>
                {mode === 'list'
                  ? 'Single-screen role lifecycle workspace · No modals, no popups'
                  : editingId ? `Editing: ${form.name || '—'}` : 'Defining new role permissions across 4 grid levels'}
              </p>
            </div>
          </div>
        </div>
        {mode === 'matrix' && (
          <div className="flex items-center gap-2">
            <button onClick={swapToList} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border"
              style={{ background: P.card, borderColor: P.border, color: P.text2 }}>
              <X className="w-3.5 h-3.5" /> Cancel Level
            </button>
            <span className="text-[12.5px] font-mono px-2 py-1 rounded" style={{ background: P.bgCanvas, color: P.text3, border: `1px solid ${P.border}` }}>
              Commit lives in side panel →
            </span>
          </div>
        )}
      </div>

      {/* Inline confirm strip */}
      <InlineConfirm
        open={!!confirm} type={confirm?.type} role={confirm?.role}
        onCancel={() => setConfirm(null)} onConfirm={performConfirm}
      />

      {/* Profile inputs (Matrix Mode only) */}
      {mode === 'matrix' && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: P.card, border: `1px solid ${P.border}` }}>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color: P.text3 }}>
                Role Blueprint Name <span style={{ color: P.danger }}>*</span>
              </label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Operations Manager"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: P.bgCanvas, border: `1px solid ${errors.name ? P.danger : P.border}`, color: P.text }} />
              {errors.name && <div className="text-[12.5px] mt-1" style={{ color: P.danger }}>{errors.name}</div>}
            </div>
            <div className="col-span-5">
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color: P.text3 }}>Security Clearance / Scope</label>
              <input value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                placeholder="e.g. Tier-2 Regional Logistical Clearance Authorization Token"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: P.bgCanvas, border: `1px solid ${P.border}`, color: P.text }} />
            </div>
            <div className="col-span-1">
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color: P.text3 }}>Badge</label>
              <input value={form.badge} maxLength={2} onChange={e => setForm(f => ({ ...f, badge: e.target.value.toUpperCase() }))}
                placeholder="OM"
                className="w-full rounded-lg px-3 py-2 text-sm font-bold font-mono text-center focus:outline-none"
                style={{ background: P.bgCanvas, border: `1px solid ${P.border}`, color: P.text }} />
            </div>
            <div className="col-span-1">
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color: P.text3 }}>Status</label>
              <button onClick={() => setForm(f => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))}
                className="w-full rounded-lg px-2 py-2 text-xs font-bold"
                style={{
                  background: form.status === 'active' ? P.successSoft : P.borderSoft,
                  color: form.status === 'active' ? P.success : P.text3,
                  border: `1px solid ${form.status === 'active' ? '#A7F3D0' : P.border}`,
                }}>
                {form.status === 'active' ? 'Active' : 'Archived'}
              </button>
            </div>
          </div>
          {/* Default Landing Page selector — destination after login */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: P.text3 }}>
                <span>Default Landing Page</span>
                <span className="text-[9px] font-normal normal-case tracking-normal" style={{ color: P.text3 }}>(where users land after login)</span>
              </label>
              {(() => {
                // Build list of pages the role has 'view' permission on
                const opts = []
                PERMISSION_TREE.forEach(m => m.submenus.forEach(s => s.pages.forEach(p => {
                  const k = permKey(m.id, s.id, p.id, 'view')
                  if (form.permissions[k]) {
                    opts.push({ id: p.menuPath || `/${m.id}`, label: p.label, sublabel: `${m.icon} ${m.label} · ${s.label}`, icon: m.icon })
                  }
                })))
                return (
                  <Select2
                    options={opts.length === 0 ? [{ id:'', label:'Grant at least one View permission first' }] : opts}
                    value={form.defaultPage}
                    onChange={(v) => setForm(f => ({ ...f, defaultPage: v ?? '' }))}
                    getSubLabel={o => o.sublabel}
                    getIcon={o => o.icon}
                    placeholder="Select default landing page…"
                    size="sm"
                  />
                )
              })()}
            </div>
            <div className="col-span-4 flex items-end">
              <div className="text-[12.5px] rounded-lg px-3 py-2 w-full" style={{ background: P.primarySoft, color: P.text2, border: `1px solid ${P.border}` }}>
                {form.defaultPage
                  ? <>After login → <strong className="font-mono" style={{ color: P.primaryDeep }}>{form.defaultPage}</strong></>
                  : <>No landing page set — defaults to <strong>/dashboard</strong></>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 70/30 Split */}
      <div className={mode === 'list' ? '' : 'grid grid-cols-12 gap-3'}>
        {/* COL-8 (matrix) or full width (list): primary canvas */}
        <div className={mode === 'list' ? '' : 'col-span-12 lg:col-span-8'}>
          {mode === 'list'
            ? <ListMode
                roles={roles}
                users={users}
                onAddNew={() => swapToMatrix(null)}
                onEdit={(r) => swapToMatrix(r)}
                onClone={(r) => setConfirm({ type: 'clone', role: r })}
                onDeactivate={(r) => setConfirm({ type: 'deactivate', role: r })}
                onActivate={(r) => setConfirm({ type: 'activate', role: r })}
                onAudit={(r) => navigate(`/roles/audit?role=${r.id}`)}
              />
            : <>
                {errors.permissions && (
                  <div className="rounded-lg p-2.5 mb-2 flex items-center gap-2 text-[11px]" style={{ background: P.dangerSoft, color: P.danger, border: `1px solid #FECACA` }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.permissions}
                  </div>
                )}
                {/* Tab bar */}
                <div className="flex items-center gap-0.5 mb-2 rounded-xl p-1" style={{ background: P.bgCanvas, border: `1px solid ${P.border}` }}>
                  {[
                    { id: 'matrix', label: 'Permissions Matrix', icon: Layers },
                    { id: 'users',  label: editingId ? `Assigned Users (${roles.find(r => r.id === editingId)?.userCount ?? 0})` : 'Assigned Users', icon: Users },
                  ].map(({ id, label, icon: Icon }) => {
                    const active = matrixTab === id
                    return (
                      <button key={id} type="button" onClick={() => setMatrixTab(id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center"
                        style={active
                          ? { background: P.card, color: P.primaryDeep, boxShadow: '0 1px 2px rgba(15,23,42,.05)' }
                          : { background: 'transparent', color: P.text3 }}>
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    )
                  })}
                </div>
                {matrixTab === 'matrix'
                  ? <MatrixMode permissions={form.permissions} onChange={(p) => setForm(f => ({ ...f, permissions: p }))} />
                  : <UsersTab role={editingId ? roles.find(r => r.id === editingId) : { ...form, userCount: 0 }} users={users} editingId={editingId} />
                }
              </>
          }
        </div>

        {/* COL-4: Right Sidebar (matrix mode only — hidden in list mode) */}
        {mode === 'matrix' && (
          <div className="col-span-12 lg:col-span-4">
            <RightSidebar
              permissions={form.permissions} mode={mode} form={form}
              onDiscard={swapToList} onCommit={handleCommit} saving={saving}
            />
          </div>
        )}
      </div>

      {/* Commit Review Modal — shown when user clicks Commit Layer Baseline */}
      <EnterpriseModal
        open={reviewOpen}
        onClose={() => !saving && setReviewOpen(false)}
        title={editingId ? 'Review & Update Role' : 'Review & Create Role'}
        subtitle={form.name || 'Unnamed Role'}
        icon={<Shield className="w-4 h-4" style={{ color: P.primaryDeep }} />}
        size="xl"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setReviewOpen(false)} disabled={saving}>Back to Editor</ModalBtn>
          <ModalBtn onClick={doSubmit} loading={saving}>
            {editingId ? 'Submit Update' : 'Submit & Create'}
          </ModalBtn>
        </>}>
        <div className="grid grid-cols-12 gap-3" style={{ maxHeight: '60vh' }}>
          {/* LEFT: Role profile + stats + landing */}
          <div className="col-span-4 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
            {/* Role chip */}
            <div className="rounded-xl overflow-hidden" style={{ background: P.bgCanvas, border: `1px solid ${P.border}` }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: form.color || P.primary }}>
                  {form.badge || form.name?.slice(0,2).toUpperCase() || 'NR'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: P.text }}>{form.name}</div>
                  <div className="text-[11px] truncate" style={{ color: P.text3 }}>{form.scope || 'No scope defined'}</div>
                </div>
              </div>
              <div className="px-4 pb-3 flex items-center justify-between">
                <span className="text-[12.5px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: form.status === 'active' ? P.successSoft : P.borderSoft,
                    color: form.status === 'active' ? P.success : P.text3,
                  }}>
                  {form.status === 'active' ? 'Active' : 'Archived'}
                </span>
                <span className="text-[9px] font-mono" style={{ color: P.text3 }}>{editingId ? `Editing ${editingId}` : 'New role'}</span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              {(() => {
                const s = permissionSummary(form.permissions)
                return [
                  { l:'Modules',     v:`${s.menus} / ${PERMISSION_TREE.length}`, c:P.primaryDeep },
                  { l:'Pages',       v:`${s.pages} / ${s.totalPages}`,           c:P.accent      },
                  { l:'Permissions', v:`${s.granted} / ${s.total}`,              c:P.success     },
                ].map(({ l, v, c }) => (
                  <div key={l} className="rounded-lg p-2.5 text-center" style={{ background: P.bgCanvas, border: `1px solid ${P.border}` }}>
                    <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: P.text3 }}>{l}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: c }}>{v}</div>
                  </div>
                ))
              })()}
            </div>

            {/* Default landing */}
            <div className="rounded-xl overflow-hidden" style={{ background: P.card, border: `1px solid ${P.border}` }}>
              <div className="px-4 py-2" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
                <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: P.text3 }}>Default Landing Page</span>
              </div>
              <div className="px-4 py-3">
                {form.defaultPage ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.success }} />
                    <span className="text-xs font-mono font-bold" style={{ color: P.primaryDeep }}>{form.defaultPage}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.warning }} />
                    <span className="text-[11px]" style={{ color: P.text2 }}>None set — will default to <strong className="font-mono">/dashboard</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-lg p-2.5 flex items-start gap-2 text-[11px]" style={{ background: P.primarySoft, color: P.text2, border: `1px solid ${P.border}` }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: P.primaryDeep }} />
              <p>
                {editingId
                  ? <>Changes take effect on each assigned user's next sign-in. Recorded in the audit trail with timestamp, IP and device.</>
                  : <>The role becomes available immediately. All granted permissions are recorded in the audit trail.</>}
              </p>
            </div>
          </div>

          {/* RIGHT: Full visible-menu map with per-page actions, scrollable */}
          <div className="col-span-8">
            <div className="rounded-xl overflow-hidden h-full flex flex-col" style={{ background: P.card, border: `1px solid ${P.border}`, maxHeight: '60vh' }}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: P.bgCanvas, borderBottom: `1px solid ${P.border}` }}>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: P.text }}>Menu Visible to This Role</h3>
                  <p className="text-[12.5px]" style={{ color: P.text3 }}>Exactly what users with this role will see in the sidebar after sign-in</p>
                </div>
                {(() => {
                  const vis = visibleMenusFromPermissions(form.permissions)
                  return (
                    <span className="text-[12.5px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: P.successSoft, color: P.success, border: `1px solid #A7F3D0` }}>
                      {vis.length} / {PERMISSION_TREE.length} menus
                    </span>
                  )
                })()}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {(() => {
                  const vis = visibleMenusFromPermissions(form.permissions)
                  const visIdSet = new Set(vis.map(m => m.id))
                  const hid = PERMISSION_TREE.filter(m => !visIdSet.has(m.id))
                  if (vis.length === 0) return (
                    <div className="py-12 text-center text-sm" style={{ color: P.text3 }}>
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      No menus would be visible. Grant at least one action.
                    </div>
                  )
                  return (
                    <>
                      {vis.map(m => {
                        const grantedPages = m.submenus.flatMap(s =>
                          s.pages.map(p => ({ ...p, submenu: s }))
                            .filter(p => pagePermissionKeys(m.id, s.id, p.id).some(k => form.permissions[k]))
                        )
                        const isLanding = form.defaultPage && grantedPages.some(p => p.menuPath === form.defaultPage)
                        return (
                          <div key={m.id} className="rounded-lg overflow-hidden" style={{ background: P.card, border: `1px solid ${P.border}` }}>
                            <div className="flex items-center gap-2 px-3 py-2" style={{ background: P.successSoft }}>
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.success }} />
                              <span className="text-base">{m.icon}</span>
                              <span className="text-sm font-bold flex-1" style={{ color: P.text }}>{m.label}</span>
                              {isLanding && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: P.primaryDeep, color: '#fff' }}>
                                  LANDING ↪
                                </span>
                              )}
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: P.card, color: P.text2, border: `1px solid ${P.border}` }}>
                                {grantedPages.length} page{grantedPages.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="px-3 py-2 divide-y" style={{ borderColor: P.borderSoft }}>
                              {grantedPages.map(p => {
                                const grantedActionIds = p.actions.filter(aId => form.permissions[permKey(m.id, p.submenu.id, p.id, aId)])
                                const isPageLanding = form.defaultPage === p.menuPath
                                return (
                                  <div key={p.id} className="py-2 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs">📄</span>
                                      <span className="text-xs font-bold flex-1" style={{ color: P.text }}>{p.label}</span>
                                      {isPageLanding && <span className="text-[9px] font-mono" style={{ color: P.primaryDeep }}>↪ default</span>}
                                      <span className="text-[9px] font-mono" style={{ color: P.text3 }}>{p.menuPath ?? '—'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 ml-5">
                                      {grantedActionIds.map(aId => {
                                        const a = PERM_ACTIONS.find(x => x.id === aId)
                                        if (!a) return null
                                        return (
                                          <span key={aId} className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded"
                                            style={{ background: P.primarySoft, color: P.primaryDeep, border: `1px solid ${P.border}` }}>
                                            <span>{a.icon}</span>{a.label}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}

                      {hid.length > 0 && (
                        <div className="rounded-lg overflow-hidden mt-3" style={{ background: P.bgCanvas, border: `1px dashed ${P.border}` }}>
                          <div className="px-3 py-2">
                            <span className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color: P.text3 }}>Hidden from sidebar ({hid.length})</span>
                          </div>
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {hid.map(m => (
                              <span key={m.id} className="inline-flex items-center gap-1 text-[12.5px] px-1.5 py-0.5 rounded" style={{ background: P.card, color: P.text3, border: `1px solid ${P.border}` }}>
                                <XCircle className="w-2.5 h-2.5" />
                                <span>{m.icon}</span>
                                {m.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}
