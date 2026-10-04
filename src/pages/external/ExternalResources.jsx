// External Resources — single list page (no tabs)
// Embeds equipment search + KPI strip + assignment cards
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Filter, X, ChevronRight, AlertCircle, CheckCircle2,
  Clock, MapPin, Briefcase, TrendingUp, Truck, FileText, DollarSign,
} from 'lucide-react'
import useExternalResourceStore from '../../store/externalResourceStore'
import Select2 from '../../components/ui/Select2'
import {
  EQUIPMENT_TYPES, ASSIGNMENT_STATUSES, PROJECTS,
  daysBetween, totalDaysOf, todaysAttendance,
} from '../../api/mock/externalResourceData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtMoney = (n) => (Number(n) || 0).toLocaleString()

export default function ExternalResources() {
  const navigate = useNavigate()
  const { assignments } = useExternalResourceStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [equipmentFilter, setEquipmentFilter] = useState('all')

  // Module-level KPIs
  const kpis = useMemo(() => {
    const activeResources = assignments.filter(a => a.status === 'active').length
    const totalEquipment  = assignments.filter(a => ['active','upcoming','delayed'].includes(a.status)).length
    const today = todaysAttendance(assignments)
    const totalCost = assignments.filter(a => a.status !== 'completed').reduce((s, a) => s + (a.cost?.totalAmount ?? 0), 0)
    return { activeResources, totalEquipment, ...today, totalCost }
  }, [assignments])

  const filtered = useMemo(() => assignments.filter(a => {
    if (statusFilter    !== 'all' && a.status        !== statusFilter)    return false
    if (projectFilter   !== 'all' && a.projectId     !== projectFilter)   return false
    if (equipmentFilter !== 'all' && a.equipment?.type !== equipmentFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.id.toLowerCase().includes(q)
        || (a.projectName ?? '').toLowerCase().includes(q)
        || (a.resource?.name ?? '').toLowerCase().includes(q)
        || (a.resource?.iqama ?? '').includes(q)
        || (a.equipment?.name ?? '').toLowerCase().includes(q)
        || (a.equipment?.numberPlate ?? '').toLowerCase().includes(q)
    }
    return true
  }), [assignments, search, statusFilter, projectFilter, equipmentFilter])

  const anyFilter = statusFilter !== 'all' || projectFilter !== 'all' || equipmentFilter !== 'all' || search

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.2)' }}>
            <Users className="w-4.5 h-4.5" style={{ color:'#8B5CF6' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>External Resource Assignments</h2>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>1 equipment + 1 worker per assignment · auto-generated manpower PO · attendance tracking</p>
          </div>
        </div>
        <button onClick={() => navigate('/external-resources/create')}
          className="px-3.5 py-2 text-xs font-bold rounded-lg text-white flex items-center gap-1.5" style={{ background:'#8B5CF6' }}>
          <Plus className="w-3.5 h-3.5" /> New Assignment
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-3">
        <KPI label="Active"        value={kpis.activeResources}                    icon={Users}        color="#2563EB" />
        <KPI label="Equipment"     value={kpis.totalEquipment}                     icon={Truck}        color="#06B6D4" />
        <KPI label="Present Today" value={kpis.present}                            icon={CheckCircle2} color="#059669" />
        <KPI label="Absent Today"  value={kpis.absent}                             icon={AlertCircle}  color="#DC2626" highlight={kpis.absent > 0} />
        <KPI label="Late Today"    value={kpis.late}                               icon={Clock}        color="#D97706" />
        <KPI label="Open Cost"     value={`SAR ${fmtMoney(kpis.totalCost)}`}       icon={DollarSign}   color="#8B5CF6" small />
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search assignment ID, project, worker, Iqama, equipment, number plate…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-36">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatusFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Status' }, ...Object.entries(ASSIGNMENT_STATUSES).map(([k, v]) => ({ id: k, label: v.label }))]} />
        </div>
        <div className="w-44">
          <Select2 size="sm" value={equipmentFilter} onChange={v => setEquipmentFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Equipment Types' }, ...EQUIPMENT_TYPES.map(t => ({ id: t.id, label: `${t.icon} ${t.label}` }))]} />
        </div>
        <div className="w-52">
          <Select2 size="sm" value={projectFilter} onChange={v => setProjectFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Projects' }, ...PROJECTS.map(p => ({ id: p.id, label: p.name }))]} />
        </div>
        {anyFilter && (
          <button onClick={() => { setStatusFilter('all'); setProjectFilter('all'); setEquipmentFilter('all'); setSearch('') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="text-[12.5px] ml-auto" style={{ color:'var(--text3)' }}>
          <strong style={{ color:'var(--text2)' }}>{filtered.length}</strong> of {assignments.length}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={C}>
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold" style={{ color:'var(--text2)' }}>No assignments match these filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => <AssignmentCard key={a.id} a={a} onOpen={() => navigate(`/external-resources/${a.id}`)} />)}
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, icon: Icon, color, highlight, small }) {
  return (
    <div className="rounded-xl border p-3" style={{ ...C, borderLeft: `3px solid ${color}`, background: highlight ? `${color}10` : 'var(--card)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className={`font-black font-mono ${small ? 'text-sm' : 'text-xl'}`} style={{ color }}>{value}</div>
    </div>
  )
}

function AssignmentCard({ a, onOpen }) {
  const status = ASSIGNMENT_STATUSES[a.status] ?? ASSIGNMENT_STATUSES.active
  const eq = a.equipment
  const t = EQUIPMENT_TYPES.find(x => x.id === eq?.type)
  const totalDays = totalDaysOf(a.shift?.startDate, a.shift?.endDate)
  const elapsed = Math.max(0, Math.min(totalDays, (daysBetween(a.shift?.startDate, new Date().toISOString()) ?? 0) + 1))
  const pct = totalDays > 0 ? Math.round(elapsed / totalDays * 100) : 0

  return (
    <button onClick={onOpen} className="w-full text-left rounded-xl border transition-all hover:-translate-y-0.5"
      style={{ ...C, borderLeft: `4px solid ${status.c}` }}>
      <div className="p-3 grid grid-cols-12 gap-3 items-center">
        {/* ID + status + project */}
        <div className="col-span-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: status.bg, color: status.c }}>{a.id}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: status.bg, color: status.c }}>{status.label}</span>
          </div>
          <div className="text-xs font-bold mt-1" style={{ color:'var(--text)' }}>{a.projectName}</div>
          <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color:'var(--text3)' }}>
            <MapPin className="w-2.5 h-2.5" />{a.projectLocation}
          </div>
        </div>

        {/* Equipment */}
        <div className="col-span-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background:`${t?.color}15` }}>{t?.icon}</div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{eq?.name}</div>
            <div className="text-[10px] flex items-center gap-1.5" style={{ color:'var(--text3)' }}>
              <span className="font-mono font-bold px-1 py-0.5 rounded" style={{ background:'var(--bg2)', color: t?.color }}>{eq?.numberPlate ?? '—'}</span>
              <span>·</span><span>{t?.label}</span>
            </div>
          </div>
        </div>

        {/* Worker */}
        <div className="col-span-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-bold text-white flex-shrink-0" style={{ background:'#2563EB' }}>
            {a.resource?.name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{a.resource?.name}</div>
            <div className="text-[10px] font-mono truncate" style={{ color:'var(--text3)' }}>{a.resource?.iqama}</div>
          </div>
        </div>

        {/* Duration + progress */}
        <div className="col-span-2">
          <div className="text-[10px] font-mono font-bold" style={{ color:'var(--text)' }}>{fmtDate(a.shift?.startDate)} → {fmtDate(a.shift?.endDate)}</div>
          <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg2)' }}>
            <div className="h-full" style={{ width:`${pct}%`, background: status.c }} />
          </div>
          <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>Day {elapsed}/{totalDays} · {pct}%</div>
        </div>

        {/* Cost + PO */}
        <div className="col-span-1.5 text-right">
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Manpower</div>
          <div className="text-xs font-mono font-bold" style={{ color:'#8B5CF6' }}>{a.cost?.currency} {fmtMoney(a.cost?.totalAmount)}</div>
          <div className="text-[9px] flex items-center justify-end gap-1 mt-0.5" style={{ color:'var(--text3)' }}>
            <FileText className="w-2.5 h-2.5" />
            <span className="font-mono">{a.cost?.poId}</span>
          </div>
        </div>

        <div className="col-span-0.5 flex justify-end">
          <ChevronRight className="w-4 h-4" style={{ color:'var(--text3)' }} />
        </div>
      </div>
    </button>
  )
}
