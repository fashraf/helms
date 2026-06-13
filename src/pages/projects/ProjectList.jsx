import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Plus, Search, LayoutGrid, List, Download, Eye, Edit3,
  Copy, Power, MoreVertical, ChevronLeft, ChevronRight, AlertTriangle,
  MapPin, Users, Calendar,
} from 'lucide-react'
import useProjectStore from '../../store/projectStore'
import { useToast } from '../../hooks/useToast'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import Select2 from '../../components/ui/Select2'
import {
  PROJECT_SCALES, PROJECT_OWNERS, PROJECT_STATUSES, COUNTRIES, PEOPLE,
} from '../../api/mock/projectData'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
const PAGE_SIZE = 15

function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' }) }
function flag(code)   { return COUNTRIES.find(c => c.code === code)?.flag ?? '🌐' }
function countryName(code) { return COUNTRIES.find(c => c.code === code)?.name ?? code }
function ownerLabel(id) { return PROJECT_OWNERS.find(o => o.id === id)?.label ?? id }
function ownerIcon(id)  { return PROJECT_OWNERS.find(o => o.id === id)?.icon ?? '🏢' }

function StatusBadge({ status }) {
  const cfg = PROJECT_STATUSES[status] ?? PROJECT_STATUSES.draft
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border rounded-md ${cfg.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}
  </span>
}

function ScaleBadge({ scale }) {
  const cfg = PROJECT_SCALES.find(s => s.id === scale)
  const colors = {
    small:  { bg: 'rgba(5,150,105,.08)',  border: 'rgba(5,150,105,.25)',  text: 'var(--success)' },
    medium: { bg: 'rgba(37,99,235,.08)',  border: 'rgba(37,99,235,.25)',  text: 'var(--primary)' },
    large:  { bg: 'rgba(217,119,6,.08)',  border: 'rgba(217,119,6,.25)',  text: 'var(--warning)' },
  }
  const c = colors[scale] ?? colors.small
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md"
    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
    {cfg?.icon} {cfg?.label?.toUpperCase()}
  </span>
}

function getPerson(id) { return PEOPLE.find(p => p.id === id) }

function RowActions({ project, onView, onEdit, onClone, onDeactivate, onActivate }) {
  const [open, setOpen] = useState(false)
  const isInactive = project.status === 'inactive'
  const items = [
    { icon: Eye,    label: 'View',          fn: onView,   color: 'var(--text2)' },
    { icon: Edit3,  label: 'Edit',          fn: onEdit,   color: 'var(--text2)' },
    { icon: Copy,   label: 'Clone Project', fn: onClone,  color: 'var(--text2)' },
    isInactive
      ? { icon: Power, label: 'Activate',    fn: onActivate,   color: 'var(--success)' }
      : { icon: Power, label: 'Deactivate',  fn: onDeactivate, color: 'var(--danger)'  },
  ]
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
        style={{ color: 'var(--text3)' }}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-40 rounded-xl border z-30 overflow-hidden animate-fade-in"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
            {items.map(({ icon: Icon, label, fn, color }) => (
              <button key={label} onClick={() => { fn(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
                style={{ color }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProjectCard({ project, onView }) {
  const manager = getPerson(project.managers?.[0])
  return (
    <div onClick={onView} className="rounded-xl border overflow-hidden cursor-pointer transition-all" style={C}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono text-[12.5px] font-bold mb-0.5" style={{ color: 'var(--primary)' }}>{project.id}</div>
            <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>{project.name}</div>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <ScaleBadge scale={project.scale} />
          <span className="text-[12.5px]" style={{ color: 'var(--text2)' }}>
            {ownerIcon(project.owner)} {ownerLabel(project.owner)}
          </span>
        </div>
        <div className="space-y-1.5 text-[11px]" style={{ color: 'var(--text2)' }}>
          <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" style={{ color: 'var(--text3)' }} />{flag(project.country)} {project.city}, {countryName(project.country)}</div>
          {manager && <div className="flex items-center gap-1.5"><Users className="w-3 h-3" style={{ color: 'var(--text3)' }} />{manager.name}</div>}
          <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" style={{ color: 'var(--text3)' }} />Created {fmtDate(project.createdAt)}</div>
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange, total, showing }) {
  let pages = []
  if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  else if (page <= 4) pages = [1, 2, 3, 4, 5, '…', totalPages]
  else if (page >= totalPages - 3) pages = [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  else pages = [1, '…', page - 1, page, page + 1, '…', totalPages]

  return (
    <div className="flex items-center justify-between gap-3 px-2">
      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
        Showing <strong style={{ color: 'var(--text)' }}>{showing}</strong> of <strong style={{ color: 'var(--text)' }}>{total}</strong> projects
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={i} className="px-1.5 text-xs" style={{ color: 'var(--text3)' }}>…</span>
          : <button key={i} onClick={() => onChange(p)}
              className="min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border transition-all"
              style={p === page ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { background: 'var(--card)', color: 'var(--text2)', borderColor: 'var(--border)' }}>
              {p}
            </button>
        )}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function ProjectList() {
  const navigate = useNavigate()
  const { filteredProjects, filter, setFilter, viewMode, setViewMode, projects, cloneProject, deactivateProject, activateProject } = useProjectStore()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => { setPage(1) }, [filter.search, filter.status, filter.scale, filter.country, filter.city, filter.manager])

  const fullList    = filteredProjects()
  const totalPages  = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIdx    = (currentPage - 1) * PAGE_SIZE
  const list        = fullList.slice(startIdx, startIdx + PAGE_SIZE)

  const stats = {
    total:    projects.length,
    active:   projects.filter(p => p.status === 'active').length,
    pending:  projects.filter(p => ['pending', 'in_review'].includes(p.status)).length,
    inactive: projects.filter(p => p.status === 'inactive').length,
  }

  const askConfirm = (type, project) => setConfirmAction({ type, project })

  const performAction = () => {
    if (!confirmAction) return
    const { type, project } = confirmAction
    if (type === 'clone') {
      const newId = cloneProject(project.id)
      toast.success('Cloned', `${project.name} cloned as draft.`)
      navigate(`/projects/${newId}/edit`)
    } else if (type === 'deactivate') {
      deactivateProject(project.id)
      toast.warning('Deactivated', `${project.name} marked inactive.`)
    } else if (type === 'activate') {
      activateProject(project.id)
      toast.success('Activated', `${project.name} is now active.`)
    }
    setConfirmAction(null)
  }

  const statusOpts = [{ id: 'all', label: 'All Status' }, ...Object.entries(PROJECT_STATUSES).map(([k, v]) => ({ id: k, label: v.label }))]
  const scaleOpts  = [{ id: 'all', label: 'All Scales' }, ...PROJECT_SCALES.map(s => ({ id: s.id, label: s.label, icon: s.icon }))]
  const countryOpts = [{ id: 'all', label: 'All Countries', flag: '🌐' }, ...COUNTRIES.map(c => ({ id: c.code, label: c.name, flag: c.flag }))]
  const managerOpts = [{ id: 'all', label: 'All Managers' }, ...PEOPLE.filter(p => p.role === 'Project Manager').map(p => ({ id: p.id, label: p.name }))]
  const selectedCountry = COUNTRIES.find(c => c.code === filter.country)
  const cityOpts = [{ id: 'all', label: 'All Cities' }, ...(selectedCountry?.cities ?? COUNTRIES.flatMap(c => c.cities)).map(c => ({ id: c, label: c }))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,.2)' }}>
            <Briefcase className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Project Management</h2>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{fullList.length} of {stats.total} projects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {[['list', 'List', List], ['card', 'Cards', LayoutGrid]].map(([v, l, Icon]) => (
              <button key={v} onClick={() => setViewMode(v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-bold transition-all"
                style={viewMode === v ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--text3)' }}>
                <Icon className="w-3.5 h-3.5" />{l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/projects/create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: 'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Total Projects',   v: stats.total,    c: 'var(--text)'   },
          { l: 'Active',           v: stats.active,   c: 'var(--success)'},
          { l: 'Pending Approval', v: stats.pending,  c: 'var(--warning)'},
          { l: 'Inactive',         v: stats.inactive, c: 'var(--text3)'  },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl border p-4" style={C}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{l}</div>
            <div className="text-2xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
          <input value={filter.search} onChange={e => setFilter('search', e.target.value)}
            placeholder="Search project number or name…"
            className="w-full rounded-lg pl-8 pr-3 py-2 text-xs border focus:outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="grid grid-cols-5 gap-2">
          <Select2 options={statusOpts}  value={filter.status}  onChange={v => setFilter('status', v ?? 'all')}  placeholder="Status"   size="sm" />
          <Select2 options={scaleOpts}   value={filter.scale}   onChange={v => setFilter('scale', v ?? 'all')}   placeholder="Scale" getIcon={o => o.icon} size="sm" />
          <Select2 options={countryOpts} value={filter.country} onChange={v => { setFilter('country', v ?? 'all'); setFilter('city', 'all') }} placeholder="Country" getIcon={o => o.flag} size="sm" />
          <Select2 options={cityOpts}    value={filter.city}    onChange={v => setFilter('city', v ?? 'all')}    placeholder="City"    size="sm" />
          <Select2 options={managerOpts} value={filter.manager} onChange={v => setFilter('manager', v ?? 'all')} placeholder="Manager" size="sm" />
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="rounded-xl border overflow-hidden" style={C}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <tr>
                  {['Project #', 'Project Name', 'Country', 'City', 'Project Manager', 'Scale', 'Owner Type', 'Status', 'Created', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {list.length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-sm" style={{ color: 'var(--text3)' }}>No projects match your filters</td></tr>
                ) : list.map(p => {
                  const manager = getPerson(p.managers?.[0])
                  return (
                    <tr key={p.id} className="cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td className="px-4 py-3"><span className="font-mono text-[12.5px] font-bold" style={{ color: 'var(--primary)' }}>{p.id}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{p.name}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{(p.hierarchy?.length ?? 0)} phases</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{flag(p.country)} {countryName(p.country)}</span></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{p.city}</span></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{manager?.name ?? '—'}</span></td>
                      <td className="px-4 py-3"><ScaleBadge scale={p.scale} /></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text2)' }}>{ownerIcon(p.owner)} {ownerLabel(p.owner)}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3"><span className="text-[12.5px] font-mono" style={{ color: 'var(--text3)' }}>{fmtDate(p.createdAt)}</span></td>
                      <td className="px-4 py-3">
                        <RowActions project={p}
                          onView={() => navigate(`/projects/${p.id}`)}
                          onEdit={() => navigate(`/projects/${p.id}/edit`)}
                          onClone={() => askConfirm('clone', p)}
                          onDeactivate={() => askConfirm('deactivate', p)}
                          onActivate={() => askConfirm('activate', p)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
          </div>
        </div>
      )}

      {viewMode === 'card' && (
        <>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {list.map(p => <ProjectCard key={p.id} project={p} onView={() => navigate(`/projects/${p.id}`)} />)}
          </div>
          <div className="rounded-xl border px-3 py-2.5" style={C}>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} total={fullList.length} showing={list.length} />
          </div>
        </>
      )}

      {confirmAction && (
        <EnterpriseModal open={true} onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === 'clone'      ? 'Confirm Clone Project'
            : confirmAction.type === 'activate' ? 'Confirm Activate Project'
            : 'Confirm Deactivate Project'
          }
          subtitle={confirmAction.project.name}
          icon={
            confirmAction.type === 'clone'      ? <Copy className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            : confirmAction.type === 'activate' ? <Power className="w-4 h-4" style={{ color: 'var(--success)' }} />
            : <Power className="w-4 h-4" style={{ color: 'var(--danger)' }} />
          }
          size="sm"
          footer={<>
            <ModalBtn variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</ModalBtn>
            <ModalBtn
              variant={confirmAction.type === 'deactivate' ? 'danger' : confirmAction.type === 'activate' ? 'success' : 'primary'}
              onClick={performAction}>
              {confirmAction.type === 'clone'      ? 'Yes, Clone Project'
                : confirmAction.type === 'activate' ? 'Yes, Activate Project'
                : 'Yes, Deactivate Project'}
            </ModalBtn>
          </>}>
          <div className="space-y-3">
            <div className="rounded-lg border p-3 flex items-start gap-2.5"
              style={{
                background: confirmAction.type === 'deactivate' ? 'var(--danger-light)' : confirmAction.type === 'activate' ? 'rgba(5,150,105,.06)' : 'var(--primary-light)',
                borderColor: confirmAction.type === 'deactivate' ? 'rgba(220,38,38,.3)' : confirmAction.type === 'activate' ? 'rgba(5,150,105,.25)' : 'rgba(37,99,235,.25)',
              }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: confirmAction.type === 'deactivate' ? 'var(--danger)' : confirmAction.type === 'activate' ? 'var(--success)' : 'var(--primary)' }} />
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                {confirmAction.type === 'clone' && <>A new draft project will be created with the same configuration. You can edit it before submitting for approval.</>}
                {confirmAction.type === 'deactivate' && <>The project will be marked Inactive. No data is deleted — full audit history is preserved and the project can be reactivated.</>}
                {confirmAction.type === 'activate' && <>The project will be marked Active. All team members will regain access.</>}
              </p>
            </div>
            <div className="rounded-xl border p-3" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="font-mono text-[12.5px] mb-0.5" style={{ color: 'var(--primary)' }}>{confirmAction.project.id}</div>
              <div className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{confirmAction.project.name}</div>
              <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--text3)' }}>
                <ScaleBadge scale={confirmAction.project.scale} /> ·
                <StatusBadge status={confirmAction.project.status} />
              </div>
            </div>
          </div>
        </EnterpriseModal>
      )}
    </div>
  )
}
