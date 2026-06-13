import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, MapPin, Globe, GitBranch,
  Truck, Users, Wrench, Warehouse, UserCog, Shield,
  Settings, FileText, BarChart3, ChevronLeft, ChevronRight,
  Zap, AlertOctagon, Navigation, Brain, Building2, Plus, Ban, Briefcase,
  Plane, Inbox, Calendar, Grid3x3, Boxes, DollarSign,
} from 'lucide-react'
import useUIStore   from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import { ROLES }   from '../../utils/constants'

const NAV_GROUPS = [
  {
    label: 'Daily Work',
    items: [
      { to: '/dashboard',                 label: 'Dashboard',              icon: LayoutDashboard },
      { to: '/logistics',                 label: 'Logistics',              icon: Boxes          },
      { to: '/inventory',                 label: 'Inventory',              icon: Warehouse      },
      { to: '/tracking',                  label: 'Tracking',               icon: Navigation     },
      { to: '/shipment-calendar',         label: 'Calendar & Gantt',       icon: Calendar       },
    ],
  },
  {
    label: 'Shipments',
    items: [
      { to: '/shipments/local',           label: 'Local Shipments',        icon: Truck          },
      { to: '/shipments/intl',            label: 'International Shipments',icon: Plane          },
    ],
  },
  {
    label: 'Approvals & Workflows',
    items: [
      { to: '/workflows/requests',        label: 'Requests',               icon: Inbox          },
      { to: '/workflows',                 label: 'Workflow Templates',     icon: GitBranch      },
    ],
  },
  {
    label: 'Projects',
    items: [
      { to: '/projects',         label: 'Project List',   icon: Briefcase },
      { to: '/projects/create',  label: 'Create Project', icon: Plus      },
    ],
  },
  {
    label: 'Vendors',
    items: [
      { to: '/vendors-v2',          label: 'Vendor List',           icon: Building2 },
      { to: '/vendors-v2/create',   label: 'Create Vendor',         icon: Plus      },
      { to: '/vendor-sla',          label: 'Vendor Performance',    icon: BarChart3 },
      { to: '/vendor-sla-heatmap',  label: 'SLA Heatmap',           icon: Grid3x3   },
      { to: '/vendors-recommend',   label: 'AI Recommendation',     icon: Brain     },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/accounts',     label: 'Accounts',                 icon: DollarSign },
    ],
  },
  {
    label: 'Intelligence & Reports',
    items: [
      { to: '/ai-analytics', label: 'AI Shipment Intelligence', icon: Brain     },
      { to: '/reports',      label: 'Reports',                  icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    items: [
      { to: '/users',      label: 'Users',       icon: UserCog, roles: [ROLES.ADMIN, ROLES.MANAGER] },
      { to: '/roles',      label: 'Roles',       icon: Shield,  roles: [ROLES.ADMIN] },
      { to: '/locations',  label: 'Location Master', icon: MapPin },
      { to: '/settings',   label: 'Settings',    icon: Settings },
      { to: '/audit-logs', label: 'Audit Logs',  icon: FileText, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    ],
  },
]

function NavItem({ item, collapsed }) {
  const { to, label, icon: Icon } = item
  return (
    <NavLink to={to} title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
      }>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="truncate text-sm">{label}</span>}
    </NavLink>
  )
}

function UserAvatar({ name }) {
  const initials = name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() ?? '??'
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,.2)' }}>
      {initials}
    </div>
  )
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const collapsed = sidebarCollapsed

  return (
    <aside className={`relative flex flex-col shadow-sidebar flex-shrink-0 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className={`flex items-center h-14 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--primary)' }}>
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>HELMS</div>
            <div className="text-[12.5px] leading-tight font-medium uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              Logistics Platform
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(item => {
            if (!item.roles) return true
            return item.roles.includes(user?.role)
          })
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <div className="section-label px-3 mb-1 mt-4 first:mt-0 text-[12.5px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: 'var(--text3)' }}>
                  {group.label}
                </div>
              )}
              {collapsed && <div className="my-2 mx-2 border-t" style={{ borderColor: 'var(--border)' }} />}
              <div className="space-y-0.5">
                {visibleItems.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className={`flex-shrink-0 p-3 ${collapsed ? 'flex justify-center' : ''}`}
        style={{ borderTop: '1px solid var(--border)' }}>
        {collapsed
          ? <UserAvatar name={user?.name} />
          : (
            <div className="flex items-center gap-2.5">
              <UserAvatar name={user?.name} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name ?? 'User'}</div>
                <div className="text-[12.5px] capitalize" style={{ color: 'var(--text3)' }}>{user?.role}</div>
              </div>
            </div>
          )
        }
      </div>

      {/* Collapse toggle */}
      <button onClick={toggleSidebar}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all duration-200"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text3)', boxShadow: 'var(--shadow)' }}>
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
