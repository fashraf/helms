// Attendance Page — pick a worker, see calendar (col-8) + details (col-4)
import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar, ChevronLeft, ChevronRight, Search, User, Phone, MapPin, Briefcase,
  CheckCircle2, AlertCircle, Clock, TrendingUp, X, FileText, ExternalLink, Users,
} from 'lucide-react'
import useExternalResourceStore from '../../store/externalResourceStore'
import useToastStore from '../../store/toastStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  EQUIPMENT_TYPES, ATTENDANCE_STATUSES, attendanceStats,
} from '../../api/mock/externalResourceData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const monthName = (d) => d.toLocaleDateString('en-SA', { month:'long', year:'numeric' })

export default function AttendancePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { assignments, markAttendanceOnDate } = useExternalResourceStore()
  const toast = useToastStore()

  // Workers = each active/upcoming/delayed assignment's resource
  const workers = useMemo(() =>
    assignments
      .filter(a => ['active','upcoming','delayed','completed'].includes(a.status))
      .map(a => ({
        assignmentId: a.id,
        iqama: a.resource?.iqama,
        name: a.resource?.name,
        nationality: a.resource?.nationality,
        mobile: a.resource?.mobile,
        manager: a.resource?.manager,
        managerPhone: a.resource?.managerPhone,
        projectName: a.projectName,
        projectLocation: a.projectLocation,
        equipment: a.equipment,
        shift: a.shift,
        attendance: a.attendance ?? [],
        status: a.status,
        cost: a.cost,
        passNumber: a.passNumber,
        passExpiry: a.passExpiry,
      }))
  , [assignments])

  const initialIqama = params.get('worker')
  const initialAssignment = workers.find(w => w.iqama === initialIqama)
  const [selectedId, setSelectedId] = useState(initialAssignment?.assignmentId ?? workers[0]?.assignmentId ?? null)
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [editModal, setEditModal] = useState(null) // { dateISO, current }
  const [editDraft, setEditDraft] = useState({ status:'present', hours: 9 })

  const filteredWorkers = useMemo(() => workers.filter(w => {
    if (!search) return true
    const q = search.toLowerCase()
    return (w.name ?? '').toLowerCase().includes(q) || (w.iqama ?? '').includes(q) || (w.projectName ?? '').toLowerCase().includes(q)
  }), [workers, search])

  const selected = workers.find(w => w.assignmentId === selectedId)
  const stats = useMemo(() => selected ? attendanceStats(selected.attendance) : null, [selected])

  // Build monthly calendar grid for cursor month
  const monthGrid = useMemo(() => {
    if (!selected) return []
    const y = cursor.getFullYear(), m = cursor.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startWeekday = first.getDay() // 0 = Sunday
    const totalCells = Math.ceil((startWeekday + last.getDate()) / 7) * 7
    const cells = []
    // Build map of attendance by date prefix
    const attMap = {}
    ;(selected.attendance ?? []).forEach(rec => {
      if (rec.date) attMap[rec.date.slice(0, 10)] = rec
    })
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startWeekday + 1
      if (dayNum < 1 || dayNum > last.getDate()) {
        cells.push({ blank: true })
      } else {
        const d = new Date(y, m, dayNum)
        const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        const inRange = d >= new Date(selected.shift?.startDate) && d <= new Date(selected.shift?.endDate)
        cells.push({
          date: d, iso, dayNum,
          dow: d.getDay(),
          inRange,
          isFriday: d.getDay() === 5,
          isToday: d.toDateString() === new Date().toDateString(),
          isFuture: d > new Date(),
          record: attMap[iso] ?? null,
        })
      }
    }
    return cells
  }, [cursor, selected])

  const openEdit = (cell) => {
    if (!cell?.iso || !cell.inRange || cell.isFuture || selected?.status === 'completed') return
    const status = cell.record?.status ?? 'present'
    const defaultStart = selected?.shift?.startTime ?? '07:00'
    const defaultEnd   = selected?.shift?.endTime   ?? '17:00'
    setEditDraft({
      status,
      hours: cell.record?.hours ?? (status === 'absent' || status === 'holiday' ? 0 : status === 'overtime' ? 11 : 9),
      startTime: cell.record?.startTime ?? (status === 'absent' || status === 'holiday' ? '' : defaultStart),
      endTime:   cell.record?.endTime   ?? (status === 'absent' || status === 'holiday' ? '' : defaultEnd),
    })
    setEditModal({ dateISO: cell.iso, current: cell.record })
  }

  const saveEdit = () => {
    if (!editModal || !selected) return
    const noTimes = editDraft.status === 'absent' || editDraft.status === 'holiday'
    markAttendanceOnDate(
      selected.assignmentId,
      editModal.dateISO,
      editDraft.status,
      editDraft.hours,
      noTimes ? null : (editDraft.startTime || null),
      noTimes ? null : (editDraft.endTime   || null),
    )
    toast.success('Attendance updated', `${selected.name} · ${fmtDate(editModal.dateISO)} · ${ATTENDANCE_STATUSES[editDraft.status]?.label}`)
    setEditModal(null)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.2)' }}>
            <Calendar className="w-4.5 h-4.5" style={{ color:'#8B5CF6' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Attendance</h2>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>Per-worker monthly calendar · click any in-range day to mark/edit</p>
          </div>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search worker, Iqama, project…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      </div>

      {/* Worker picker strip */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" style={{ color:'#8B5CF6' }} />
            <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Select Worker</h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:'var(--card)', color:'var(--primary)' }}>{filteredWorkers.length}</span>
          </div>
        </div>
        {filteredWorkers.length === 0 ? (
          <div className="py-6 text-center text-xs" style={{ color:'var(--text3)' }}>No workers match</div>
        ) : (
          <div className="p-2 flex items-center gap-2 overflow-x-auto">
            {filteredWorkers.map(w => {
              const active = w.assignmentId === selectedId
              return (
                <button key={w.assignmentId} onClick={() => setSelectedId(w.assignmentId)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border whitespace-nowrap transition-all"
                  style={{
                    background: active ? 'rgba(139,92,246,.12)' : 'var(--card)',
                    borderColor: active ? '#8B5CF6' : 'var(--border)',
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: active ? '#8B5CF6' : '#2563EB' }}>
                    {w.name?.[0] ?? '?'}
                  </div>
                  <div className="text-left">
                    <div className="text-[12.5px] font-bold" style={{ color: active ? '#8B5CF6' : 'var(--text)' }}>{w.name}</div>
                    <div className="text-[9px] font-mono" style={{ color:'var(--text3)' }}>{w.iqama} · {w.assignmentId}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!selected ? (
        <div className="rounded-xl border p-12 text-center" style={C}>
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold" style={{ color:'var(--text2)' }}>Select a worker to view attendance</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          {/* CALENDAR · col-8 */}
          <div className="col-span-8 rounded-xl border" style={C}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" style={{ color:'#8B5CF6' }} />
                <h3 className="text-sm font-bold" style={{ color:'var(--text)' }}>{monthName(cursor)}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="w-7 h-7 rounded flex items-center justify-center border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}
                  className="text-[10px] font-bold px-2 py-1 rounded border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
                  Today
                </button>
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  className="w-7 h-7 rounded flex items-center justify-center border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--text2)' }}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="px-3 py-1.5 flex items-center justify-end gap-3 text-[10px]" style={{ borderBottom:'1px solid var(--border)' }}>
              {Object.entries(ATTENDANCE_STATUSES).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm flex items-center justify-center text-[9px]" style={{ background: v.bg, color: v.c }}>{v.icon}</span>
                  <span style={{ color:'var(--text3)' }}>{v.label}</span>
                </span>
              ))}
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-px" style={{ background:'var(--border)' }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest" style={{ background:'var(--bg2)', color: d === 'Fri' ? 'var(--warning)' : 'var(--text3)' }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-px" style={{ background:'var(--border)' }}>
              {monthGrid.map((cell, i) => {
                if (cell.blank) return <div key={i} style={{ background:'var(--bg2)', minHeight: 100 }} />
                const cfg = cell.record ? ATTENDANCE_STATUSES[cell.record.status] : null
                const clickable = cell.inRange && !cell.isFuture && selected.status !== 'completed'
                // Compute expected hours from selected shift
                const expectedHours = (() => {
                  const [sh, sm] = (selected?.shift?.startTime ?? '0:0').split(':').map(Number)
                  const [eh, em] = (selected?.shift?.endTime   ?? '0:0').split(':').map(Number)
                  let s = sh + sm / 60, e = eh + em / 60
                  if (selected?.shift?.nightShift && e < s) e += 24
                  return Math.max(0, e - s - (Number(selected?.shift?.breakHours) || 0))
                })()
                const actualHours = cell.record?.hours ?? 0
                const pct = expectedHours > 0 && cell.record && cell.record.status !== 'absent' && cell.record.status !== 'holiday'
                  ? Math.round((actualHours / expectedHours) * 100) : null
                const pctColor = pct == null ? null : pct >= 85 ? '#059669' : pct >= 70 ? '#D97706' : '#DC2626'

                // Time bar: render a 24h timeline with start–end shaded
                const renderTimeBar = () => {
                  if (!cell.record?.startTime || !cell.record?.endTime) return null
                  const [sh, sm] = cell.record.startTime.split(':').map(Number)
                  const [eh, em] = cell.record.endTime.split(':').map(Number)
                  let s = sh + sm / 60, e = eh + em / 60
                  const crosses = e < s
                  if (crosses) e += 24
                  const startPct = (s / 24) * 100
                  const widthPct = Math.min(100 - startPct, ((e - s) / 24) * 100)
                  // If crosses midnight, draw two segments
                  return (
                    <div className="relative h-1 rounded-full overflow-hidden mt-1" style={{ background:'var(--card)' }}>
                      <div className="absolute top-0 h-full rounded-full" style={{ left:`${startPct}%`, width:`${widthPct}%`, background: cfg?.c ?? '#8B5CF6' }} />
                      {crosses && (
                        <div className="absolute top-0 left-0 h-full rounded-full" style={{ width:`${((e - 24) / 24) * 100}%`, background: cfg?.c ?? '#8B5CF6' }} />
                      )}
                    </div>
                  )
                }

                return (
                  <button key={i} disabled={!clickable} onClick={() => openEdit(cell)}
                    className={`p-1.5 text-left transition-colors ${clickable ? 'hover:bg-[var(--bg2)] cursor-pointer' : 'cursor-default'}`}
                    style={{
                      background: !cell.inRange ? 'var(--bg2)' :
                                  cell.isToday ? 'rgba(139,92,246,.06)' :
                                  cfg ? cfg.bg : 'var(--card)',
                      minHeight: 100,
                      opacity: !cell.inRange ? 0.45 : 1,
                      border: cell.isToday ? '2px solid #8B5CF6' : 'none',
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-bold font-mono" style={{ color: cfg ? cfg.c : cell.isFriday ? 'var(--warning)' : 'var(--text2)' }}>{cell.dayNum}</span>
                      {cfg && <span className="text-[12.5px]" style={{ color: cfg.c }}>{cfg.icon}</span>}
                      {!cfg && cell.isFriday && <span className="text-[10px]" style={{ color:'var(--warning)' }}>Fri</span>}
                    </div>
                    {cfg && (
                      <div className="mt-0.5 leading-tight">
                        <div className="text-[10px] font-bold" style={{ color: cfg.c }}>{cfg.label}</div>
                        {cell.record?.startTime && cell.record?.endTime && (
                          <>
                            <div className="text-[10px] font-mono mt-0.5" style={{ color:'var(--text2)' }}>
                              {cell.record.startTime}–{cell.record.endTime}
                            </div>
                            {renderTimeBar()}
                          </>
                        )}
                        {pct != null && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{actualHours}h</span>
                            <span className="text-[10px] font-mono font-bold px-1 rounded" style={{ background:`${pctColor}20`, color: pctColor }}>{pct}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    {!cfg && cell.inRange && !cell.isFuture && !cell.isFriday && (
                      <div className="text-[10px] mt-1 italic" style={{ color:'var(--text3)' }}>Not marked</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* DETAILS · col-4 */}
          <div className="col-span-4 space-y-3">
            {/* Worker card */}
            <div className="rounded-xl border" style={C}>
              <div className="p-3 flex items-start gap-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0" style={{ background:'#8B5CF6' }}>
                  {selected.name?.[0] ?? '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold" style={{ color:'var(--text)' }}>{selected.name}</div>
                  <div className="text-[10px] font-mono" style={{ color:'var(--text3)' }}>{selected.iqama}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>{selected.nationality}</div>
                </div>
              </div>
              <div className="p-3 grid grid-cols-1 gap-2 text-[12.5px]">
                <KV k="Mobile"          v={selected.mobile}        icon={Phone} mono />
                <KV k="Manager"         v={selected.manager}       icon={User} />
                <KV k="Manager Contact" v={selected.managerPhone}  icon={Phone} mono />
              </div>
            </div>

            {/* Assignment card */}
            <div className="rounded-xl border" style={C}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" style={{ color:'#8B5CF6' }} />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Assignment</h4>
                </div>
                <button onClick={() => navigate(`/external-resources/${selected.assignmentId}`)} className="text-[10px] font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}>
                  Open <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="p-3 space-y-1.5 text-[12.5px]">
                <KV k="Assignment"      v={<span className="font-mono font-bold">{selected.assignmentId}</span>} />
                <KV k="Project"         v={selected.projectName} />
                <KV k="Location"        v={selected.projectLocation} icon={MapPin} />
                <KV k="Equipment"       v={<>{EQUIPMENT_TYPES.find(t => t.id === selected.equipment?.type)?.icon} {selected.equipment?.name}</>} />
                <KV k="Number Plate"    v={<span className="font-mono font-bold">{selected.equipment?.numberPlate}</span>} />
                <KV k="Period"          v={`${fmtDate(selected.shift?.startDate)} → ${fmtDate(selected.shift?.endDate)}`} mono />
                <KV k="Shift Hours"     v={`${selected.shift?.startTime} – ${selected.shift?.endTime}`} mono />
                {selected.cost?.poId && (
                  <KV k="Manpower PO" v={
                    <button onClick={() => navigate(`/po/${selected.cost.poId}`)} className="font-mono font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}>
                      {selected.cost.poId} <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  } />
                )}
              </div>
            </div>

            {/* Stats card */}
            {stats && (
              <div className="rounded-xl border" style={C}>
                <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
                    <TrendingUp className="w-3 h-3" style={{ color:'var(--success)' }} /> Attendance Stats
                  </h4>
                </div>
                <div className="p-3 grid grid-cols-2 gap-1.5">
                  <Stat label="Present"  value={stats.present}  color="var(--success)" icon={CheckCircle2} />
                  <Stat label="Absent"   value={stats.absent}   color="var(--danger)"  icon={AlertCircle} />
                  <Stat label="Late"     value={stats.late}     color="var(--warning)" icon={Clock} />
                  <Stat label="Overtime" value={stats.overtime} color="#8B5CF6"       icon={TrendingUp} />
                  <div className="col-span-2 rounded-lg p-2 text-center" style={{ background:'var(--bg2)' }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Overall Rating</div>
                    <div className="text-xl font-black font-mono" style={{ color: stats.rating == null ? 'var(--text3)' : stats.rating >= 90 ? 'var(--success)' : stats.rating >= 75 ? 'var(--warning)' : 'var(--danger)' }}>
                      {stats.rating != null ? `${stats.rating}%` : '—'}
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>Avg <strong>{stats.avgHours}h</strong>/day · {stats.totalHours}h total</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <EnterpriseModal open={!!editModal} onClose={() => setEditModal(null)}
        title="Mark Attendance" subtitle={editModal ? `${selected?.name} · ${fmtDate(editModal.dateISO)}` : ''}
        icon={<Calendar className="w-4 h-4" style={{ color:'#8B5CF6' }} />} size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setEditModal(null)}>Cancel</ModalBtn>
          <ModalBtn onClick={saveEdit}>Save Attendance</ModalBtn>
        </>}>
        <div className="space-y-3">
          {/* Expected work line */}
          <div className="rounded-lg p-2.5 flex items-center justify-between" style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.3)' }}>
            <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
              <strong style={{ color:'#8B5CF6' }}>Suppose to work</strong>
              <span className="ml-2 font-mono">{selected?.shift?.startTime} – {selected?.shift?.endTime} · {(() => {
                const [sh, sm] = (selected?.shift?.startTime ?? '0:0').split(':').map(Number)
                const [eh, em] = (selected?.shift?.endTime   ?? '0:0').split(':').map(Number)
                let s = sh + sm / 60, e = eh + em / 60
                if (selected?.shift?.nightShift && e < s) e += 24
                return Math.max(0, e - s - (Number(selected?.shift?.breakHours) || 0)).toFixed(1)
              })()}h</span>
            </div>
            <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
              <strong>Min:</strong> <span className="font-mono">{selected?.shift?.minHours}h</span>
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Status</label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(ATTENDANCE_STATUSES).map(([k, v]) => (
                <button key={k} type="button" onClick={() => {
                  const defaultStart = selected?.shift?.startTime ?? '07:00'
                  const defaultEnd   = selected?.shift?.endTime   ?? '17:00'
                  const noTimes = k === 'absent' || k === 'holiday'
                  setEditDraft({
                    status: k,
                    hours: noTimes ? 0 : k === 'overtime' ? 11 : 9,
                    startTime: noTimes ? '' : defaultStart,
                    endTime:   noTimes ? '' : defaultEnd,
                  })
                }}
                  className="px-2 py-2 text-[12.5px] font-bold rounded-lg border-2 flex flex-col items-center gap-0.5"
                  style={{
                    background: editDraft.status === k ? v.bg : 'var(--card)',
                    borderColor: editDraft.status === k ? v.c : 'var(--border)',
                    color: editDraft.status === k ? v.c : 'var(--text2)',
                  }}>
                  <span>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times — hidden for absent/holiday */}
          {editDraft.status !== 'absent' && editDraft.status !== 'holiday' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual Start</label>
                  <input type="time" value={editDraft.startTime ?? ''} onChange={e => setEditDraft({ ...editDraft, startTime: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual End</label>
                  <input type="time" value={editDraft.endTime ?? ''} onChange={e => setEditDraft({ ...editDraft, endTime: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual Hours</label>
                  <input type="number" step="0.5" min="0" max="16" value={editDraft.hours} onChange={e => setEditDraft({ ...editDraft, hours: Number(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono font-bold"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
              </div>

              {/* Expected vs Actual comparison */}
              {(() => {
                const expected = (() => {
                  const [sh, sm] = (selected?.shift?.startTime ?? '0:0').split(':').map(Number)
                  const [eh, em] = (selected?.shift?.endTime   ?? '0:0').split(':').map(Number)
                  let s = sh + sm / 60, e = eh + em / 60
                  if (selected?.shift?.nightShift && e < s) e += 24
                  return Math.max(0, e - s - (Number(selected?.shift?.breakHours) || 0))
                })()
                const pct = expected > 0 ? Math.round(((editDraft.hours || 0) / expected) * 100) : 0
                const color = pct >= 85 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                      <span style={{ color:'var(--text3)' }}>Expected <strong className="font-mono" style={{ color:'var(--text2)' }}>{expected.toFixed(1)}h</strong> · Actual <strong className="font-mono" style={{ color:'var(--text2)' }}>{(editDraft.hours || 0).toFixed(1)}h</strong></span>
                      <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--card)' }}>
                      <div className="h-full transition-all" style={{ width:`${Math.min(100, pct)}%`, background: color }} />
                    </div>
                    <div className="flex items-center justify-between text-[12.5px] mt-1">
                      <button type="button" onClick={() => {
                        if (!editDraft.startTime || !editDraft.endTime) return
                        const [sh, sm] = editDraft.startTime.split(':').map(Number)
                        const [eh, em] = editDraft.endTime.split(':').map(Number)
                        let s = sh + sm / 60, end = eh + em / 60
                        if (end < s) end += 24
                        const breakHrs = Number(selected?.shift?.breakHours ?? 0)
                        const computed = Math.max(0, +(end - s - breakHrs).toFixed(1))
                        setEditDraft({ ...editDraft, hours: computed })
                      }}
                        className="font-bold flex items-center gap-1" style={{ color:'#8B5CF6' }}>
                        ↻ Recompute hours from times
                      </button>
                      {selected?.shift?.minHours != null && editDraft.hours < selected.shift.minHours && (
                        <span className="font-bold flex items-center gap-1" style={{ color:'var(--warning)' }}>
                          <AlertCircle className="w-2.5 h-2.5" /> Below min {selected.shift.minHours}h
                        </span>
                      )}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </EnterpriseModal>
    </div>
  )
}

function KV({ k, v, mono, icon: Icon }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0 w-24 pt-0.5" style={{ color:'var(--text3)' }}>{k}</div>
      <div className={`text-[12.5px] font-semibold flex items-center gap-1 ${mono ? 'font-mono' : ''}`} style={{ color:'var(--text)' }}>
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text3)' }} />}
        {v ?? '—'}
      </div>
    </div>
  )
}

function Stat({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded p-1.5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className="text-base font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  )
}
