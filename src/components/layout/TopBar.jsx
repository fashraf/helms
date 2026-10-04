import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, LogOut, ChevronDown, User, Settings,
  CheckCheck, AlertTriangle, Info, XCircle, Sun, Moon, Shield, Lock,
  Eye, Briefcase, Mail,
  Zap, Plus, Truck, Plane, FileText, Users, ShoppingCart, Building2, ClipboardList, Calendar,
  Fuel, Clock, ScrollText, Send, List, Search,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore   from '../../store/uiStore'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useAuth      from '../../hooks/useAuth'
import useRBACv2Store from '../../store/rbacV2Store'
import { HelpButton } from '../ui/PageTour'
import EnterpriseModal, { ModalBtn } from '../ui/EnterpriseModal'
import { PERMISSION_TREE, PERM_ACTIONS, permKey, permissionSummary } from '../../api/mock/permissionTree'
import { SmartSearchBar } from '../ui/EnterpriseWidgets'

const PAGE_TITLES = {
  '/dashboard':                  { title: 'Dashboard',                   sub: 'Shipment visibility & priority'    },
  '/logistics':                  { title: 'Logistics Module',            sub: 'Fulfillment · packing · release · KPIs' },
  '/accounts':                   { title: 'Accounts',                    sub: 'Invoices · payments · receipts · sales orders' },
  '/inventory':                  { title: 'Inventory Master',            sub: 'SAP-synced stock catalog' },
  '/po':                         { title: 'Purchase Orders',             sub: 'Supplier POs · payment milestones · lifecycle tracking' },
  '/po/create':                  { title: 'Create Purchase Order',       sub: 'Vendor · commercial terms · payment schedule' },
  '/external-resources':         { title: 'External Resource Management', sub: 'External manpower & equipment · shifts · attendance · utilization' },
  '/external-resources/create':  { title: 'New Resource Assignment',     sub: '4-step wizard · project · equipment · workers · shifts' },
  '/external-resources/attendance': { title: 'Attendance',               sub: 'Per-worker monthly calendar · mark / edit days · view stats' },
  '/fuel':                       { title: 'Fuel Logs',                   sub: 'Centralized fuel transaction repository · project-scoped logs' },
  '/fuel/log':                   { title: 'Log Fuel',                    sub: 'Record a fuel transaction · select project for context + history' },
  '/waiting-charges':            { title: 'Charges',                     sub: 'Multi-project shipment delay penalties · auditing ledger' },
  '/waiting-charges/create':     { title: 'Add Charges',                 sub: 'Log a delay · compute chargeable hours · apply penalty' },
  '/locations':                  { title: 'Location Master',             sub: 'Central master for pickup & destination locations' },
  '/shipments':                  { title: 'Shipments',                   sub: 'Track active shipments'            },
  '/local-operations':           { title: 'Local Operations',            sub: 'Domestic logistics'                },
  '/international-operations':   { title: 'International Operations',    sub: 'Cross-border logistics'            },
  '/workflow':                   { title: 'Workflow Engine',             sub: 'Process automation'                },
  '/fleet':                      { title: 'Fleet Management',            sub: 'Vehicle registry & tracking'       },
  '/drivers':                    { title: 'Drivers',                     sub: 'Driver roster & assignments'       },
  '/maintenance':                { title: 'Maintenance',                 sub: 'Scheduled & corrective maintenance'},
  '/warehouse':                  { title: 'Warehouse',                   sub: 'Inventory & capacity'              },
  '/incidents':                  { title: 'Incident Management',         sub: 'Breakdowns, delays & damage'       },
  '/routes':                     { title: 'Route Planning',              sub: 'Distance & route assignment'       },
  '/vendors':                    { title: 'Vendor Master',               sub: 'Logistics & maintenance vendors'   },
  '/vendor-maintenance':         { title: 'Outsourced Maintenance',      sub: 'External repair & service vendors' },
  '/vendor-partners':            { title: 'Global Partners',             sub: 'International logistics network'   },
  '/vendor-sla':                 { title: 'SLA Tracking',                sub: 'Vendor performance & SLA metrics'  },
  '/vendor-sla-heatmap':         { title: 'Vendor SLA Heatmap',          sub: 'Performance grid · vendor × month' },
  '/vendors-v2':                 { title: 'Vendor List',                 sub: 'Service providers & business partners' },
  '/vendors-v2/create':          { title: 'Create Vendor',               sub: 'Register a new vendor'             },
  '/vendors-recommend':          { title: 'AI Vendor Recommendation',    sub: 'Smart vendor selection'            },
  '/projects':                   { title: 'Projects',                     sub: 'Customer projects, installations & site work' },
  '/projects/create':            { title: 'Create Project',               sub: 'New project wizard'                },
  '/shipments/intl':             { title: 'International Shipments',      sub: 'Cross-border / multi-country shipments' },
  '/shipments/intl/create':      { title: 'Create International Shipment', sub: '7-step wizard'                    },
  '/shipments/local':            { title: 'Local Shipments',              sub: 'Inside Saudi Arabia'                },
  '/shipments/local/create':     { title: 'Create Local Shipment',        sub: '6-step wizard'                     },
  '/tracking':                   { title: 'Shipment Tracking',            sub: 'Live status across all shipments'  },
  '/shipment-calendar':          { title: 'Shipment Calendar',            sub: 'Scheduled shipments by date'       },
  '/workflows':                  { title: 'Workflow Templates',           sub: 'Approval workflow designer'         },
  '/workflows/create':           { title: 'Create Workflow',              sub: 'Configure approval steps & SLAs'    },
  '/workflows/requests':         { title: 'Workflow Requests',            sub: 'Approval inbox'                     },
  '/roles':                      { title: 'Role Master Canvas',           sub: 'Unified role specification workspace' },
  '/roles/audit':                { title: 'Role Audit Trail',             sub: 'All role change history'             },
  '/ai-analytics':               { title: 'AI Shipment Intelligence',    sub: 'Risk scoring & ETA prediction'     },
  '/users':                      { title: 'User Management',             sub: 'Users, roles & access control'      },
  '/users/create':               { title: 'Create User',                 sub: 'New user wizard with live menu preview' },
  '/roles_old_disabled':                      { title: 'Roles & Permissions',         sub: 'Access control'                    },
  '/settings':                   { title: 'Settings',                    sub: 'System configuration'              },
  '/tc-templates':               { title: 'T&C Template Manager',        sub: '6-slot matrix · RFQ / Contract / Invoice × Local / International' },
  '/audit-logs':                 { title: 'Audit Logs',                  sub: 'Activity trail'                    },
  '/reports':                    { title: 'Reports',                     sub: 'Analytics & exports'               },
  '/email-communication':        { title: 'Email Communication',         sub: 'Log received emails against projects & POCs' },
}

const NOTIF_ICONS = {
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  info:    { icon: Info,          color: 'text-blue-500'  },
  error:   { icon: XCircle,       color: 'text-red-500'   },
  success: { icon: CheckCheck,    color: 'text-green-500' },
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getInitials(name) {
  return name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() ?? '??'
}

export default function TopBar() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const { logout } = useAuth()
  const { notifications, markRead, markAllRead, unreadCount, theme, setTheme } = useUIStore()

  const [notifOpen,    setNotifOpen]    = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [accessOpen,   setAccessOpen]   = useState(false)
  const [quickOpen,    setQuickOpen]    = useState(false)
  const [shipOpen,     setShipOpen]     = useState(false)
  const notifRef = useRef(null)
  const userRef  = useRef(null)
  const quickRef = useRef(null)
  const shipRef  = useRef(null)

  // Resolve title — exact match first, then dynamic patterns
  let pageInfo = PAGE_TITLES[location.pathname]
  if (!pageInfo) {
    if (location.pathname.startsWith('/logistics/'))    pageInfo = { title: 'Logistics · Items', sub: 'Per-item packing & release workflow' }
    else if (location.pathname.startsWith('/shipments/local/')) pageInfo = { title: 'Local Shipment',   sub: 'Profile & lifecycle' }
    else if (location.pathname.startsWith('/shipments/intl/'))  pageInfo = { title: 'International Shipment', sub: 'Profile & lifecycle' }
    else if (location.pathname.startsWith('/po/'))               pageInfo = { title: 'Purchase Order',         sub: 'Lifecycle · payments · audit' }
    else if (location.pathname.startsWith('/external-resources/')) pageInfo = { title: 'Resource Assignment', sub: 'Equipment · workers · attendance · timeline' }
    else pageInfo = { title: 'HELMS', sub: '' }
  }
  const unread   = unreadCount()

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.remove('light','dark')
    document.documentElement.classList.add(next)
  }

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserMenuOpen(false)
      if (quickRef.current && !quickRef.current.contains(e.target)) setQuickOpen(false)
      if (shipRef.current  && !shipRef.current.contains(e.target))  setShipOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const topbarStyle = { background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow)' }
  const dropdownStyle = { background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }
  const iconBtn = `w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150`

  return (
    <header className="h-14 flex items-center justify-between px-5 flex-shrink-0 z-20" style={topbarStyle}>

      {/* Page title */}
      <div className="flex-shrink-0">
        <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>{pageInfo.title}</h1>
        {pageInfo.sub && <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{pageInfo.sub}</p>}
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-lg mx-4">
        <SmartSearchBar />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">

        {/* Help / Page Tour */}
        <HelpButton />

        {/* ─── Urgent Actions (replaces Add Shipment) ─────────────── */}
        <UrgentActionsButton open={shipOpen} setOpen={setShipOpen}
          onAnyClick={() => { setQuickOpen(false); setNotifOpen(false); setUserMenuOpen(false) }}
          containerRef={shipRef} />

        {/* Quick Links */}
        <div className="relative" ref={quickRef}>
          <button onClick={() => { setQuickOpen(v => !v); setNotifOpen(false); setUserMenuOpen(false) }}
            className={iconBtn}
            style={{ color: quickOpen ? '#8B5CF6' : 'var(--text3)' }}
            onMouseEnter={e => { if (!quickOpen) { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text)' } }}
            onMouseLeave={e => { if (!quickOpen) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' } }}
            title="Quick links">
            <Zap className="w-4 h-4" />
          </button>
          {quickOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl overflow-hidden z-30"
              style={{ background:'var(--card)', borderColor:'var(--border)' }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <Zap className="w-3.5 h-3.5" style={{ color:'#8B5CF6' }} />
                <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Quick Links</h3>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 px-1.5" style={{ color:'var(--text3)' }}>Create New</div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { to:'/shipments/local/create',     label:'Local Shipment',     icon: Truck,         color:'#059669' },
                    { to:'/shipments/intl/create',      label:'Intl Shipment',      icon: Plane,         color:'#06B6D4' },
                    { to:'/po/create',                  label:'Purchase Order',     icon: FileText,      color:'#2563EB' },
                    { to:'/external-resources/create',  label:'Resource Assignment',icon: Users,         color:'#8B5CF6' },
                    { to:'/vendors/create',             label:'Vendor',             icon: Building2,     color:'#D97706' },
                    { to:'/accounts/sales-orders/create', label:'Sales Order',      icon: ShoppingCart,  color:'#DC2626' },
                    { to:'/fuel/log',                   label:'Fuel Log',           icon: Fuel,          color:'#D97706' },
                    { to:'/waiting-charges/create',     label:'Charge',             icon: Clock,         color:'#DC2626' },
                  ].map(q => {
                    const Icon = q.icon
                    return (
                      <button key={q.to} onClick={() => { navigate(q.to); setQuickOpen(false) }}
                        className="flex items-center gap-2 px-2 py-2 rounded-lg text-[12.5px] transition-colors hover:bg-[var(--bg2)] text-left"
                        style={{ color:'var(--text2)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${q.color}15` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: q.color }} />
                        </div>
                        <span className="font-bold truncate">{q.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="my-2 h-px" style={{ background:'var(--border)' }} />
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 px-1.5" style={{ color:'var(--text3)' }}>Jump To</div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { to:'/dashboard',               label:'Dashboard',         icon: Eye,           color:'#2563EB' },
                    { to:'/external-resources/attendance', label:'Attendance',  icon: Calendar,      color:'#8B5CF6' },
                    { to:'/po',                      label:'Purchase Orders',   icon: FileText,      color:'#2563EB' },
                    { to:'/vendors',                 label:'Vendors',           icon: Building2,     color:'#D97706' },
                    { to:'/external-resources',     label:'External Resources', icon: Users,         color:'#8B5CF6' },
                    { to:'/fuel',                    label:'Fuel Logs',         icon: Fuel,          color:'#D97706' },
                    { to:'/waiting-charges',         label:'Charges',           icon: Clock,         color:'#DC2626' },
                    { to:'/reports',                 label:'Reports',           icon: ClipboardList, color:'#06B6D4' },
                  ].map(q => {
                    const Icon = q.icon
                    return (
                      <button key={q.to} onClick={() => { navigate(q.to); setQuickOpen(false) }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] transition-colors hover:bg-[var(--bg2)] text-left"
                        style={{ color:'var(--text2)' }}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: q.color }} />
                        <span className="truncate">{q.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className={iconBtn}
          style={{ color: 'var(--text3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" style={{ color: 'var(--text3)' }} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(v=>!v); setUserMenuOpen(false) }}
            className={`${iconBtn} relative`}
            style={{ color: 'var(--text3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '' }}>
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2"
                style={{ '--tw-ring-color': 'var(--card)' }} />
            )}
          </button>

          {notifOpen && (
            <NotificationCenter
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button onClick={() => { setUserMenuOpen(v=>!v); setNotifOpen(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,.2)' }}>
              {getInitials(user?.name)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{user?.name ?? 'User'}</div>
              <div className="text-[12.5px] capitalize leading-tight" style={{ color: 'var(--text3)' }}>{user?.role}</div>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text3)' }} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-11 w-60 rounded-xl z-50 overflow-hidden animate-fade-in" style={dropdownStyle}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</div>
                <div className="text-[11px] truncate flex items-center gap-1 mt-0.5" style={{ color: 'var(--text2)' }}>
                  <Briefcase className="w-3 h-3" /> {user?.dept ?? user?.department ?? 'System Administration'}
                </div>
                <div className="text-[11px] capitalize truncate flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                  <Shield className="w-3 h-3" /> {user?.role ?? '—'}
                </div>
              </div>
              <div className="p-1.5">
                {[
                  { icon: User,     label: 'Profile',     onClick: () => setUserMenuOpen(false) },
                  { icon: Settings, label: 'Preferences', onClick: () => setUserMenuOpen(false) },
                  { icon: Lock,     label: 'My Access',   onClick: () => { setUserMenuOpen(false); setAccessOpen(true) } },
                ].map(({ icon: Icon, label, onClick }) => (
                  <button key={label} onClick={onClick}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: 'var(--text2)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text2)' }}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
              <div className="p-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Access modal — permission matrix for the current user's role */}
      <MyAccessModal open={accessOpen} onClose={() => setAccessOpen(false)} user={user} />
    </header>
  )
}

// ─── My Access Modal — permission matrix for the user's role ─────────────────
function MyAccessModal({ open, onClose, user }) {
  const { roles } = useRBACv2Store()
  const [search, setSearch] = useState('')

  // Resolve user's role by name match (best-effort against the role registry)
  const userRole = useMemo(() => {
    if (!user?.role) return null
    const r = user.role.toLowerCase()
    return roles.find(x =>
      x.status === 'active' && (
        x.name?.toLowerCase() === r ||
        x.name?.toLowerCase().includes(r) ||
        (r === 'admin' && x.name?.toLowerCase().includes('admin'))
      )
    ) ?? roles[0]
  }, [roles, user])

  const permissions = userRole?.permissions ?? {}
  const summary     = permissionSummary(permissions)

  // Filter tree by search
  const filteredTree = useMemo(() => {
    if (!search) return PERMISSION_TREE
    const q = search.toLowerCase()
    return PERMISSION_TREE
      .map(m => ({
        ...m,
        submenus: m.submenus
          .map(s => ({
            ...s,
            pages: s.pages.filter(p => p.label.toLowerCase().includes(q) || m.label.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)),
          }))
          .filter(s => s.pages.length > 0),
      }))
      .filter(m => m.submenus.length > 0)
  }, [search])

  if (!open) return null

  return (
    <EnterpriseModal
      open={open}
      onClose={onClose}
      title="My Access"
      subtitle={`${user?.name ?? '—'} · ${userRole?.name ?? 'No role'}`}
      icon={<Lock className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
      size="xl"
      footer={<ModalBtn onClick={onClose}>Close</ModalBtn>}>
      <div className="space-y-3">
        {/* Header: identity + counts */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-5 rounded-xl border p-3 flex items-center gap-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white"
              style={{ background: userRole?.color ?? 'var(--primary)' }}>
              {(user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0,2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{ color:'var(--text)' }}>{user?.name}</div>
              <div className="text-[11px] flex items-center gap-1 truncate" style={{ color:'var(--text2)' }}>
                <Briefcase className="w-2.5 h-2.5" />{user?.dept ?? user?.department ?? 'System Administration'}
              </div>
              <div className="text-[11px] flex items-center gap-1 truncate" style={{ color:'var(--text3)' }}>
                <Mail className="w-2.5 h-2.5" />{user?.email ?? '—'}
              </div>
            </div>
          </div>
          {[
            { l:'Role',        v: userRole?.name ?? '—', icon: Shield },
            { l:'Pages',       v:`${summary.pages} / ${summary.totalPages}` },
            { l:'Permissions', v:`${summary.granted} / ${summary.total}` },
            { l:'Restrictions', v:`${summary.total - summary.granted}` },
          ].map(({ l, v, icon: Icon }) => (
            <div key={l} className="col-span-2 rounded-xl border p-3" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color:'var(--text3)' }}>
                {Icon && <Icon className="w-2.5 h-2.5" />}{l}
              </div>
              <div className="text-sm font-bold font-mono truncate" style={{ color:'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Eye className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter pages / modules…"
            className="w-full rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>

        {/* Permission Matrix (read-only) */}
        <div className="rounded-xl border overflow-hidden" style={{ background:'var(--card)', borderColor:'var(--border)', maxHeight:'48vh' }}>
          <div className="overflow-y-auto" style={{ maxHeight:'48vh' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background:'var(--bg2)' }}>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Module / Page</th>
                  {PERM_ACTIONS.map(a => (
                    <th key={a.id} className="text-center px-2 py-2 text-[9px] font-bold uppercase" style={{ color:'var(--text3)', minWidth:60 }}>
                      <span className="inline-flex items-center gap-1">{a.icon} {a.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTree.length === 0 ? (
                  <tr><td colSpan={PERM_ACTIONS.length + 1} className="text-center py-8" style={{ color:'var(--text3)' }}>No pages match your search</td></tr>
                ) : filteredTree.map(m => (
                  <FragmentRows key={m.id} m={m} permissions={permissions} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[12.5px]" style={{ color:'var(--text3)' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded flex items-center justify-center" style={{ background:'rgba(5,150,105,.15)', border:'1px solid var(--success)' }}>
              <span className="text-[8px]" style={{ color:'var(--success)' }}>✓</span>
            </span>
            Granted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded flex items-center justify-center" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
              <span className="text-[8px]" style={{ color:'var(--text3)' }}>—</span>
            </span>
            Restricted
          </span>
        </div>
      </div>
    </EnterpriseModal>
  )
}

// Helper: render module → page rows. Module row labels group of pages.
function FragmentRows({ m, permissions }) {
  const rows = []
  m.submenus.forEach(s => s.pages.forEach(p => rows.push({ s, p })))
  return (
    <>
      <tr style={{ background:'var(--bg2)' }}>
        <td colSpan={PERM_ACTIONS.length + 1} className="px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-wider" style={{ color:'var(--text)' }}>
          <span className="mr-1.5">{m.icon}</span>{m.label}
        </td>
      </tr>
      {rows.map(({ s, p }) => (
        <tr key={`${m.id}.${s.id}.${p.id}`} style={{ borderTop:'1px solid var(--border)' }}>
          <td className="px-3 py-2">
            <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{p.label}</div>
            <div className="text-[9px]" style={{ color:'var(--text3)' }}>{s.label}{p.menuPath ? ` · ${p.menuPath}` : ''}</div>
          </td>
          {PERM_ACTIONS.map(a => {
            const supports = p.actions.includes(a.id)
            const granted  = supports && !!permissions[permKey(m.id, s.id, p.id, a.id)]
            return (
              <td key={a.id} className="text-center px-2 py-2">
                {!supports ? (
                  <span className="text-[12.5px]" style={{ color:'var(--text4)' }}>—</span>
                ) : granted ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
                    style={{ background:'rgba(5,150,105,.15)', color:'var(--success)' }}>✓</span>
                ) : (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
                    style={{ background:'var(--bg2)', color:'var(--text4)', border:'1px solid var(--border)' }}>—</span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

// ─── Notification Center (tabs + search + bulk) ─────────────────────────────
const NOTIF_TABS = [
  { id: 'all',       label: 'All',        match: () => true },
  { id: 'shipments', label: 'Shipments',  match: (n) => /shipment|track|delay|customs|cargo/i.test(n.category ?? n.title ?? n.message ?? '') || n.type === 'shipment' },
  { id: 'requests',  label: 'Requests',   match: (n) => /request/i.test(n.category ?? n.title ?? n.message ?? '') || n.type === 'request' },
  { id: 'approvals', label: 'Approvals',  match: (n) => /approval|approve|review|escalat/i.test(n.category ?? n.title ?? n.message ?? '') || n.type === 'approval' },
  { id: 'vendors',   label: 'Vendors',    match: (n) => /vendor|supplier|rfq|sla/i.test(n.category ?? n.title ?? n.message ?? '') || n.type === 'vendor' },
  { id: 'system',    label: 'System',     match: (n) => /system|maintenance|backup|update/i.test(n.category ?? n.title ?? n.message ?? '') || n.type === 'system' || n.type === 'info' },
]

function priorityFromType(n) {
  if (n.priority) return n.priority
  if (n.type === 'error' || n.type === 'critical' || /urgent|delay|overdue/i.test(n.title ?? '')) return 'high'
  if (n.type === 'warning')                                                                       return 'medium'
  return 'normal'
}

function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())

  // Filter by tab + search
  const filtered = useMemo(() => {
    const matcher = NOTIF_TABS.find(t => t.id === tab)?.match ?? (() => true)
    const q = search.toLowerCase()
    return notifications.filter(n => {
      if (!matcher(n)) return false
      if (q && !(`${n.title ?? ''} ${n.message ?? ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [notifications, tab, search])

  // Per-tab unread counts
  const tabCounts = useMemo(() => {
    return Object.fromEntries(
      NOTIF_TABS.map(t => [
        t.id,
        notifications.filter(n => !n.read && t.match(n)).length,
      ])
    )
  }, [notifications])

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAllVisible = () => setSelected(new Set(filtered.map(n => n.id)))
  const clearSelection   = () => setSelected(new Set())
  const bulkMarkRead     = () => { selected.forEach(id => onMarkRead(id)); clearSelection() }

  const totalUnread = notifications.filter(n => !n.read).length

  return (
    <div className="absolute right-0 top-11 w-[440px] rounded-xl z-50 overflow-hidden animate-fade-in"
      style={{ background:'var(--card)', border:'1px solid var(--border)', boxShadow:'0 16px 48px rgba(15,23,42,.18)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color:'var(--primary)' }} />
          <span className="text-sm font-bold" style={{ color:'var(--text)' }}>Notifications</span>
          {totalUnread > 0 && (
            <span className="text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--danger)', color:'#fff' }}>
              {totalUnread} unread
            </span>
          )}
        </div>
        {totalUnread > 0 && (
          <button onClick={onMarkAllRead} className="text-[12.5px] font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}>
            <CheckCheck className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto" style={{ borderBottom:'1px solid var(--border)' }}>
        {NOTIF_TABS.map(t => {
          const active = tab === t.id
          const count  = tabCounts[t.id] ?? 0
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all"
              style={active
                ? { background:'var(--primary)', color:'#fff' }
                : { color:'var(--text2)' }}>
              {t.label}
              {count > 0 && (
                <span className="text-[9px] font-mono px-1 rounded"
                  style={{ background: active ? 'rgba(255,255,255,.25)' : 'var(--bg2)', color: active ? '#fff' : 'var(--danger)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search + bulk actions bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom:'1px solid var(--border)', background:'var(--card)' }}>
        <div className="relative flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications…"
            className="w-full rounded-md px-2.5 py-1 text-[11px] border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        {selected.size > 0 ? (
          <>
            <span className="text-[12.5px] font-mono font-bold" style={{ color:'var(--text2)' }}>{selected.size} selected</span>
            <button onClick={bulkMarkRead} className="text-[12.5px] font-bold px-1.5 py-1 rounded" style={{ background:'var(--primary)', color:'#fff' }}>
              <CheckCheck className="w-3 h-3 inline" /> Mark Read
            </button>
            <button onClick={clearSelection} className="text-[12.5px]" style={{ color:'var(--text3)' }}>Clear</button>
          </>
        ) : filtered.length > 0 && (
          <button onClick={selectAllVisible} className="text-[12.5px] font-bold" style={{ color:'var(--primary)' }}>
            Select all
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs" style={{ color:'var(--text3)' }}>
            {search ? 'No notifications match your search' : 'You\'re all caught up — no notifications here.'}
          </div>
        ) : filtered.map(n => {
          const cfg  = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.info
          const NIcon = cfg.icon
          const isSelected = selected.has(n.id)
          const priority = priorityFromType(n)
          const priorityDot =
            priority === 'high'   ? 'var(--danger)' :
            priority === 'medium' ? 'var(--warning)' :
                                    'var(--text3)'
          return (
            <div key={n.id}
              className={`flex items-start gap-2 px-3 py-2.5 transition-colors ${n.read ? 'opacity-60' : ''}`}
              style={{ borderBottom:'1px solid var(--border)', background: isSelected ? 'var(--primary-light)' : '' }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg2)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '' }}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(n.id)}
                className="mt-1 flex-shrink-0" style={{ accentColor:'var(--primary)' }} />
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                <NIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityDot }} title={`Priority: ${priority}`} />
              </div>
              <button onClick={() => onMarkRead(n.id)} className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{n.title}</p>
                <p className="text-[11px] line-clamp-2" style={{ color:'var(--text2)' }}>{n.message}</p>
                <p className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{relativeTime(n.timestamp)} · {(n.category ?? n.type ?? 'general').toUpperCase()}</p>
              </button>
              {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background:'var(--primary)' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// URGENT ACTIONS — replaces the Add Shipment button (request #1).
// Aggregates every action that needs operator attention across the app and
// surfaces them in a single button. The icon slow-blinks (ambulance-light
// style) when the count > 0. Categories: Approvals · Delays · New Requests ·
// Deliveries Pending · Returns Awaiting QA.
// ═══════════════════════════════════════════════════════════════════════════
function UrgentActionsButton({ open, setOpen, onAnyClick, containerRef }) {
  const navigate = useNavigate()
  const intlShipments  = useShipmentV2Store(s => s.intlShipments)
  const localShipments = useShipmentV2Store(s => s.localShipments)

  // Build the urgent-actions inventory
  const groups = useMemo(() => {
    const today = new Date()
    // Approvals — international shipments in submitted/pending_approval state, plus quotes pending approval
    const intlPendingApproval = intlShipments.filter(s => ['submitted','pending_approval'].includes(s.status))
    const quotesPendingApproval = [...localShipments, ...intlShipments].filter(s => (s.quotes ?? []).length > 0 && !s.approvedQuoteId && s.status !== 'cancelled')
    // Delays — shipments whose ETA has passed but they're not yet delivered
    const delayed = [...intlShipments, ...localShipments].filter(s => {
      if (!s.eta) return false
      if (['delivered','completed','closed','cancelled'].includes(s.status)) return false
      return new Date(s.eta) < today
    })
    // New requests — any draft shipments waiting to be picked up
    const newRequests = [...intlShipments, ...localShipments].filter(s => s.status === 'draft')
    // Deliveries pending — assigned/dispatched/in_progress, ETA within 2 days
    const deliveriesPending = [...intlShipments, ...localShipments].filter(s => {
      if (!s.eta) return false
      if (['delivered','completed','closed','cancelled','draft'].includes(s.status)) return false
      const d = Math.ceil((new Date(s.eta) - today) / 86400000)
      return d >= 0 && d <= 2
    })
    // Returns awaiting QA — local shipments with isReturn + arrived but no QA submitted
    const returnsQA = localShipments.filter(s => s.isReturn && s.checklist?.delivered?.done && !s.qa?.submittedAt)
    // Customs overdue
    const customsOverdue = intlShipments.filter(s => s.customsPayment && !s.customsPayment.paid && s.eta && new Date(s.eta) < today)

    return [
      { id:'approvals',          label:'Approvals',           items: [...intlPendingApproval, ...quotesPendingApproval], color:'#DC2626', icon:'🔴', desc:'Shipments + quotes awaiting your sign-off' },
      { id:'delayed',            label:'Delayed Shipments',   items: delayed,                                              color:'#DC2626', icon:'⏰', desc:'ETA passed but not yet delivered' },
      { id:'new_requests',       label:'New Requests',        items: newRequests,                                          color:'#2563EB', icon:'📥', desc:'Draft shipments waiting to be processed' },
      { id:'deliveries_pending', label:'Deliveries Imminent', items: deliveriesPending,                                    color:'#D97706', icon:'🚚', desc:'In transit with ETA in the next 2 days' },
      { id:'returns_qa',         label:'Returns Awaiting QA', items: returnsQA,                                            color:'#7C3AED', icon:'🔄', desc:'Reverse-logistics arrivals pending inspection' },
      { id:'customs_overdue',    label:'Customs Overdue',     items: customsOverdue,                                       color:'#DC2626', icon:'🛃', desc:'ETA passed and customs not yet cleared' },
    ].filter(g => g.items.length > 0)
  }, [intlShipments, localShipments])

  const totalCount = groups.reduce((a, g) => a + g.items.length, 0)
  const hasUrgent = totalCount > 0

  // Goto first matching shipment in a group (or list view if many)
  const goToItem = (s) => {
    setOpen(false)
    if (s.type === 'international' || s.id?.startsWith('ITS-')) navigate(`/shipments/intl/${s.id}`)
    else                                                         navigate(`/shipments/local/${s.id}`)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => { setOpen(v => !v); onAnyClick() }}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-bold transition-all"
        style={{
          background: open ? '#DC2626' : hasUrgent ? 'rgba(220,38,38,.10)' : 'var(--bg2)',
          color: open ? '#fff' : hasUrgent ? '#DC2626' : 'var(--text3)',
          border: `1px solid ${hasUrgent ? '#DC262640' : 'var(--border)'}`,
        }}
        title={hasUrgent ? `${totalCount} urgent action(s) need attention` : 'No urgent actions'}>
        {/* Ambulance-light icon — radial gradient */}
        <span className={`relative inline-flex items-center justify-center w-5 h-5 rounded-full ${hasUrgent ? 'urgent-blink' : ''}`}
          style={{
            background: hasUrgent
              ? 'radial-gradient(circle, #FCA5A5 0%, #DC2626 80%)'
              : 'var(--card)',
            boxShadow: hasUrgent ? '0 0 8px rgba(220,38,38,0.6)' : 'none',
          }}>
          <span style={{ fontSize: 10 }}>{hasUrgent ? '🚨' : '✓'}</span>
        </span>
        Urgent Actions
        {hasUrgent && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-mono font-bold px-1.5"
            style={{ background: open ? '#fff' : '#DC2626', color: open ? '#DC2626' : '#fff' }}>
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border shadow-xl overflow-hidden z-30"
          style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <span className="text-base">🚨</span>
            <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>
              Urgent Actions
            </h3>
            <span className="ml-auto text-[10px] font-mono font-bold" style={{ color: hasUrgent ? '#DC2626' : 'var(--text3)' }}>
              {totalCount} item{totalCount === 1 ? '' : 's'}
            </span>
          </div>
          {!hasUrgent ? (
            <div className="py-10 text-center" style={{ color:'var(--text3)' }}>
              <div className="text-2xl mb-1">✅</div>
              <div className="text-xs">All caught up — nothing needs immediate attention.</div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2 space-y-2.5">
              {groups.map(g => (
                <div key={g.id}>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1.5 flex items-center gap-1.5" style={{ color: g.color }}>
                    <span>{g.icon}</span>
                    {g.label}
                    <span className="ml-auto font-mono font-bold">{g.items.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {g.items.slice(0, 5).map(s => (
                      <button key={`${g.id}-${s.id}`} onClick={() => goToItem(s)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-[var(--bg2)]">
                        <span className="font-mono text-[11px] font-bold" style={{ color: g.color }}>{s.id}</span>
                        <span className="flex-1 text-[11px] truncate" style={{ color:'var(--text2)' }}>
                          {s.project ?? s.projectName ?? s.supplierName ?? '—'}
                        </span>
                        {s.eta && (
                          <span className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>
                            ETA {new Date(s.eta).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                          </span>
                        )}
                      </button>
                    ))}
                    {g.items.length > 5 && (
                      <div className="text-[10px] text-center py-1" style={{ color:'var(--text3)' }}>
                        +{g.items.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-3 py-2 text-[10px] text-center" style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)', color:'var(--text3)' }}>
            Click any item to jump to its shipment profile · use the side-nav <strong style={{ color:'var(--text2)' }}>+ buttons</strong> to create new shipments
          </div>
        </div>
      )}
    </div>
  )
}
