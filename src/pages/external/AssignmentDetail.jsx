// External Resource Assignment · Detail page
// No timeline · clear 1-to-1 nested view (Equipment + Worker) · cost + linked PO
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, Truck, Calendar, Clock, CheckCircle2, AlertTriangle,
  Lock, Send, Phone, User, Sun, Moon, FileText, DollarSign, ExternalLink,
  Check, History, MapPin, ChevronRight,
} from 'lucide-react'
import useExternalResourceStore from '../../store/externalResourceStore'
import usePoStore from '../../store/poStore'
import useToastStore from '../../store/toastStore'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import {
  EQUIPMENT_TYPES, ASSIGNMENT_STATUSES, ATTENDANCE_STATUSES, ATTENDANCE_MANAGERS,
  daysBetween, totalDaysOf, equipmentProgress, attendanceStats,
} from '../../api/mock/externalResourceData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-SA', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
const fmtMoney = (n) => (Number(n) || 0).toLocaleString()

export default function AssignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignments, markAttendance, completeAssignment, setStatus } = useExternalResourceStore()
  const { pos } = usePoStore()
  const toast = useToastStore()
  const a = assignments.find(x => x.id === id)

  const [attDraft, setAttDraft] = useState({ status:'present', hours: 9, startTime: '', endTime: '' })
  const [attOpen, setAttOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeRemarks, setCompleteRemarks] = useState('')

  if (!a) {
    return (
      <div className="rounded-xl border p-8 text-center" style={C}>
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-bold" style={{ color:'var(--text)' }}>Assignment Not Found</p>
        <button onClick={() => navigate('/external-resources')} className="mt-3 text-xs font-bold underline" style={{ color:'#8B5CF6' }}>← Back</button>
      </div>
    )
  }

  const status = ASSIGNMENT_STATUSES[a.status]
  const isCompleted = a.status === 'completed'
  const eq = a.equipment
  const r = a.resource
  const t = EQUIPMENT_TYPES.find(x => x.id === eq?.type)
  const prog = equipmentProgress(eq)
  const stats = attendanceStats(a.attendance ?? [])
  const linkedPo = pos.find(p => p.id === a.cost?.poId)
  const poStageColor = linkedPo?.currentStage === 'closed' ? '#059669' : linkedPo?.currentStage === 'pay_done' ? '#06B6D4' : '#D97706'

  const doMarkAttendance = () => {
    const noTimes = attDraft.status === 'absent' || attDraft.status === 'holiday'
    markAttendance(
      a.id,
      attDraft.status,
      attDraft.hours,
      noTimes ? null : (attDraft.startTime || null),
      noTimes ? null : (attDraft.endTime   || null),
    )
    toast.success('Attendance recorded', `${r.name} · ${ATTENDANCE_STATUSES[attDraft.status]?.label}`)
    setAttOpen(false)
    setAttDraft({ status:'present', hours: 9, startTime: '', endTime: '' })
  }

  const doComplete = () => {
    completeAssignment(a.id, 'Fahad Al-Ghamdi', completeRemarks)
    toast.success('Assignment completed', `${a.id} · ${a.cost?.poId} closed`)
    setCompleteOpen(false)
    setCompleteRemarks('')
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/external-resources')} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={{ ...C }}>
            <ArrowLeft className="w-3.5 h-3.5" style={{ color:'var(--text2)' }} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold font-mono" style={{ color:'var(--text)' }}>{a.id}</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: status.bg, color: status.c }}>{status.label}</span>
              {isCompleted && <span className="text-[10px] font-bold inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background:'rgba(31,41,55,.08)', color:'#1F2937' }}><Lock className="w-3 h-3" />Immutable</span>}
            </div>
            <p className="text-[12.5px]" style={{ color:'var(--text3)' }}>
              <strong style={{ color:'var(--text2)' }}>{a.projectName}</strong> · <MapPin className="w-2.5 h-2.5 inline" /> {a.projectLocation} · Created {fmtDate(a.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <>
              {a.status !== 'active' && (
                <button onClick={() => { setStatus(a.id, 'active', 'Fahad Al-Ghamdi', 'Started'); toast.success('Status updated', 'Active') }}
                  className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg border flex items-center gap-1"
                  style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
                  <Send className="w-3 h-3" /> Mark Active
                </button>
              )}
              <button onClick={() => setCompleteOpen(true)}
                className="px-2.5 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1"
                style={{ background:'var(--success)' }}>
                <CheckCircle2 className="w-3 h-3" /> Mark Complete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-6 gap-2">
        <SummaryCard label="Duration"     value={`${prog.total}d`}                                  sub={`Day ${prog.elapsed} · ${prog.pct}%`} icon={Calendar} color="#8B5CF6" />
        <SummaryCard label="Shift Hours"  value={`${a.shift?.startTime}–${a.shift?.endTime}`}       sub={a.shift?.nightShift ? '🌙 Night' : '☀️ Day'} icon={Clock} color="#D97706" />
        <SummaryCard label="Attendance"   value={`${stats.rating ?? '—'}${stats.rating != null ? '%' : ''}`} sub={`${stats.present}✓ ${stats.absent}✗ ${stats.late}⏰`} icon={CheckCircle2} color="#059669" />
        <SummaryCard label="Daily Rate"   value={`${a.cost?.currency} ${fmtMoney(a.cost?.dailyRate)}`} sub={`× ${a.cost?.totalDays}d`} icon={DollarSign} color="#2563EB" />
        <SummaryCard label="Total Cost"   value={`${a.cost?.currency} ${fmtMoney(a.cost?.totalAmount)}`} sub={a.cost?.poStatus === 'closed' ? 'Closed' : 'Open'} icon={FileText} color="#8B5CF6" />
        <SummaryCard label="Pass"         value={a.passRequired ? a.passNumber : 'Not required'}    sub={a.passRequired ? `Exp ${fmtDate(a.passExpiry)}` : ''} icon={FileText} color="#06B6D4" />
      </div>

      {/* The Pair: Equipment + Worker side-by-side */}
      <div className="rounded-xl border" style={C}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Equipment ⟶ Operator</h3>
          <span className="text-[10px]" style={{ color:'var(--text3)' }}>1 equipment paired with 1 worker</span>
        </div>
        <div className="p-3 grid grid-cols-12 gap-3 items-stretch">
          {/* Equipment card */}
          <div className="col-span-5 rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)', borderTop:`3px solid ${t?.color}` }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl" style={{ background:`${t?.color}15` }}>{t?.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t?.color }}>{t?.label}</div>
                <div className="text-sm font-bold mt-0.5" style={{ color:'var(--text)' }}>{eq?.name}</div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border-2" style={{ background:'var(--card)', borderColor: t?.color, color: t?.color }}>{eq?.numberPlate}</span>
                  <span className="text-[10px]" style={{ color:'var(--text3)' }}>{ASSIGNMENT_STATUSES[eq?.status]?.label}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
              <KV k="Start" v={fmtDate(eq?.startDate)} mono />
              <KV k="End"   v={fmtDate(eq?.endDate)}   mono />
            </div>
            <div className="mt-2">
              <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--card)' }}>
                <div className="h-full" style={{ width:`${prog.pct}%`, background: t?.color }} />
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span style={{ color:'var(--text3)' }}>Day <strong style={{ color:'var(--text2)' }}>{prog.elapsed}</strong>/{prog.total}</span>
                <span className="font-mono font-bold" style={{ color: t?.color }}>{prog.pct}%</span>
              </div>
            </div>
          </div>

          {/* Pairing arrow */}
          <div className="col-span-2 flex flex-col items-center justify-center gap-2">
            <div className="w-full h-0.5" style={{ background:`linear-gradient(to right, ${t?.color}, #2563EB)` }} />
            <ChevronRight className="w-5 h-5" style={{ color:'#8B5CF6' }} />
            <div className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color:'#8B5CF6' }}>Operated By</div>
            <div className="w-full h-0.5" style={{ background:`linear-gradient(to right, ${t?.color}, #2563EB)` }} />
          </div>

          {/* Worker card */}
          <div className="col-span-5 rounded-lg border p-3" style={{ background:'var(--bg2)', borderColor:'var(--border)', borderTop:'3px solid #2563EB' }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-white" style={{ background:'#2563EB' }}>
                {r?.name?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'#2563EB' }}>Worker</div>
                <div className="text-sm font-bold mt-0.5" style={{ color:'var(--text)' }}>{r?.name}</div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[12.5px] px-2 py-0.5 rounded border-2" style={{ background:'var(--card)', borderColor:'#2563EB', color:'#2563EB' }}>{r?.iqama}</span>
                  <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{r?.nationality}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
              <KV k="Mobile"          v={r?.mobile}        mono icon={Phone} />
              <KV k="Manager"         v={r?.manager}       icon={User} />
              <KV k="Manager Contact" v={r?.managerPhone}  mono icon={Phone} />
              <KV k="Attendance"      v={`${stats.workdays}d tracked`} />
            </div>
            {/* Add Attendance button — primary action */}
            {!isCompleted && (
              <button onClick={() => { setAttDraft({ status:'present', hours: 9, startTime: a.shift?.startTime ?? '07:00', endTime: a.shift?.endTime ?? '17:00' }); setAttOpen(true) }}
                className="mt-3 w-full px-3 py-2 text-[12.5px] font-bold rounded-lg text-white flex items-center justify-center gap-1.5"
                style={{ background:'#8B5CF6' }}>
                <Calendar className="w-3.5 h-3.5" /> Add Attendance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cost + Linked PO row */}
      <div className="grid grid-cols-12 gap-3">
        {/* Linked PO card */}
        <div className="col-span-5 rounded-xl border overflow-hidden" style={C}>
          <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" style={{ color:'#D97706' }} />
              <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Linked Manpower PO</h3>
            </div>
            {linkedPo && (
              <button onClick={() => navigate(`/po/${linkedPo.id}`)} className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--primary)' }}>
                <ExternalLink className="w-3 h-3" /> Open PO
              </button>
            )}
          </div>
          <div className="p-3">
            {linkedPo ? (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-sm font-bold" style={{ color:'var(--text)' }}>{linkedPo.id}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${poStageColor}20`, color: poStageColor }}>{linkedPo.currentStage?.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background:'rgba(217,119,6,.12)', color:'var(--warning)' }}>👷 Manpower</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                  <KV k="Vendor"      v={linkedPo.vendorName} />
                  <KV k="Total"       v={<span className="font-mono font-bold" style={{ color:'#8B5CF6' }}>{linkedPo.currency} {fmtMoney(linkedPo.totalAmount)}</span>} />
                  <KV k="Reference"   v={<span className="font-mono">{linkedPo.referenceNumber}</span>} />
                  <KV k="Due"         v={<span className="font-mono">{fmtDate(linkedPo.expectedCompletionDate)}</span>} />
                </div>
                <div className="mt-2 pt-2" style={{ borderTop:'1px solid var(--border)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--text3)' }}>Milestone</div>
                  {linkedPo.milestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-[12.5px]">
                      <span style={{ color:'var(--text2)' }}>{m.label}</span>
                      <span className="font-bold" style={{ color: m.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                        {m.status === 'paid' ? `Paid · ${fmtDate(m.paidDate)}` : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-center py-4" style={{ color:'var(--text3)' }}>PO not found · may have been removed</p>
            )}
          </div>
        </div>

        {/* Shift Details */}
        <div className="col-span-7 rounded-xl border" style={C}>
          <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Shift Details</h3>
          </div>
          <div className="p-3 grid grid-cols-4 gap-3 text-[12.5px]">
            <KV k="Period"        v={`${fmtDate(a.shift?.startDate)} → ${fmtDate(a.shift?.endDate)}`} mono />
            <KV k="Working Hours" v={`${a.shift?.startTime} → ${a.shift?.endTime}`} mono />
            <KV k="Break"         v={`${a.shift?.breakHours}h`} mono />
            <KV k="Min Hours"     v={`${a.shift?.minHours}h`} mono />
            <KV k="Type"          v={a.shift?.nightShift ? <span><Moon className="w-3 h-3 inline mr-1" />Night</span> : <span><Sun className="w-3 h-3 inline mr-1" />Day</span>} />
            <KV k="Friday Work"   v={a.shift?.fridayWork ? `Yes${a.shift?.fridayOvertime ? ' · OT' : ''}` : 'No'} />
            <KV k="Attendance"    v={a.shift?.needAttendance ? 'Required' : 'Not required'} />
            <KV k="Managed By"    v={ATTENDANCE_MANAGERS.find(m => m.id === a.shift?.attendanceManagedBy)?.label ?? '—'} />
          </div>
        </div>
      </div>

      {/* Recent attendance + Audit row */}
      <div className="grid grid-cols-12 gap-3">
        {/* Last 14 days */}
        <div className="col-span-7 rounded-xl border" style={C}>
          <div className="px-3 py-2 flex items-center justify-between" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <h3 className="text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Recent Attendance · Last 14 Days</h3>
            <button onClick={() => navigate(`/external-resources/attendance?worker=${encodeURIComponent(r?.iqama)}`)} className="text-[10px] font-bold flex items-center gap-1" style={{ color:'var(--primary)' }}>
              Open calendar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              <MiniStat label="Present"  value={stats.present}  color="var(--success)" />
              <MiniStat label="Absent"   value={stats.absent}   color="var(--danger)" />
              <MiniStat label="Late"     value={stats.late}     color="var(--warning)" />
              <MiniStat label="Overtime" value={stats.overtime} color="#8B5CF6" />
              <MiniStat label="Avg Hrs"  value={`${stats.avgHours}h`} color="#06B6D4" mono />
            </div>
            {(a.attendance ?? []).length === 0 ? (
              <p className="text-[12.5px] text-center py-3" style={{ color:'var(--text3)' }}>No attendance records yet</p>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                {(a.attendance ?? []).slice(-14).map((rec, i) => {
                  const cfg = ATTENDANCE_STATUSES[rec.status]
                  const timeStr = rec.startTime && rec.endTime ? ` · ${rec.startTime}–${rec.endTime}` : ''
                  return (
                    <div key={i} className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.c }} title={`${fmtDate(rec.date)} · ${cfg.label}${timeStr} · ${rec.hours}h`}>
                      {cfg.icon}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="col-span-5 rounded-xl border" style={C}>
          <div className="px-3 py-2" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            <h3 className="text-[12.5px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color:'var(--text)' }}>
              <History className="w-3.5 h-3.5" style={{ color:'#06B6D4' }} /> Audit Log
            </h3>
          </div>
          <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
            {(a.auditLog ?? []).slice().reverse().map((entry, i) => {
              const actionCfg = {
                create:        { c:'#8B5CF6', icon:'📋' },
                update:        { c:'#06B6D4', icon:'✏️' },
                status_change: { c:'#D97706', icon:'🔄' },
                attendance:    { c:'#059669', icon:'📆' },
              }[entry.action] ?? { c:'var(--text3)', icon:'•' }
              return (
                <div key={i} className="flex items-start gap-2 text-[12.5px] pb-1.5" style={{ borderBottom:'1px dotted var(--border)' }}>
                  <span style={{ color: actionCfg.c }}>{actionCfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold" style={{ color:'var(--text2)' }}>{entry.summary}</div>
                    <div className="text-[9px] flex items-center gap-1.5" style={{ color:'var(--text3)' }}>
                      <span>{entry.by}</span><span>·</span><span className="font-mono">{fmtDateTime(entry.date)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Attendance modal */}
      <EnterpriseModal open={attOpen} onClose={() => setAttOpen(false)}
        title="Add Today's Attendance" subtitle={r?.name} icon={<Calendar className="w-4 h-4" style={{ color:'#8B5CF6' }} />} size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setAttOpen(false)}>Cancel</ModalBtn>
          <ModalBtn onClick={doMarkAttendance}>Save Attendance</ModalBtn>
        </>}>
        <div className="space-y-3">
          {/* Expected work line */}
          <div className="rounded-lg p-2.5 flex items-center justify-between" style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.3)' }}>
            <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
              <strong style={{ color:'#8B5CF6' }}>Suppose to work</strong>
              <span className="ml-2 font-mono">{a.shift?.startTime} – {a.shift?.endTime} · {(() => {
                const [sh, sm] = (a.shift?.startTime ?? '0:0').split(':').map(Number)
                const [eh, em] = (a.shift?.endTime   ?? '0:0').split(':').map(Number)
                let s = sh + sm / 60, e = eh + em / 60
                if (a.shift?.nightShift && e < s) e += 24
                return Math.max(0, e - s - (Number(a.shift?.breakHours) || 0)).toFixed(1)
              })()}h</span>
            </div>
            <div className="text-[12.5px]" style={{ color:'var(--text2)' }}>
              <strong>Min:</strong> <span className="font-mono">{a.shift?.minHours}h</span>
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Status</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(ATTENDANCE_STATUSES).filter(([k]) => k !== 'holiday').map(([k, v]) => (
                <button key={k} type="button" onClick={() => {
                  const noTimes = k === 'absent'
                  setAttDraft({
                    status: k,
                    hours: noTimes ? 0 : k === 'overtime' ? 11 : 9,
                    startTime: noTimes ? '' : (a.shift?.startTime ?? '07:00'),
                    endTime:   noTimes ? '' : (a.shift?.endTime   ?? '17:00'),
                  })
                }}
                  className="px-2 py-2 text-[12.5px] font-bold rounded-lg border-2 flex flex-col items-center gap-0.5"
                  style={{
                    background: attDraft.status === k ? v.bg : 'var(--card)',
                    borderColor: attDraft.status === k ? v.c : 'var(--border)',
                    color: attDraft.status === k ? v.c : 'var(--text2)',
                  }}>
                  <span>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times for non-absent */}
          {attDraft.status !== 'absent' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual Start</label>
                  <input type="time" value={attDraft.startTime ?? ''} onChange={e => setAttDraft({ ...attDraft, startTime: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual End</label>
                  <input type="time" value={attDraft.endTime ?? ''} onChange={e => setAttDraft({ ...attDraft, endTime: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual Hours</label>
                  <input type="number" step="0.5" min="0" max="16" value={attDraft.hours} onChange={e => setAttDraft({ ...attDraft, hours: Number(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono font-bold"
                    style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                </div>
              </div>

              {/* Expected vs Actual comparison */}
              {(() => {
                const expected = (() => {
                  const [sh, sm] = (a.shift?.startTime ?? '0:0').split(':').map(Number)
                  const [eh, em] = (a.shift?.endTime   ?? '0:0').split(':').map(Number)
                  let s = sh + sm / 60, e = eh + em / 60
                  if (a.shift?.nightShift && e < s) e += 24
                  return Math.max(0, e - s - (Number(a.shift?.breakHours) || 0))
                })()
                const pct = expected > 0 ? Math.round((attDraft.hours / expected) * 100) : 0
                const color = pct >= 85 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <div className="rounded-lg p-2.5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                      <span style={{ color:'var(--text3)' }}>Expected <strong className="font-mono" style={{ color:'var(--text2)' }}>{expected.toFixed(1)}h</strong> · Actual <strong className="font-mono" style={{ color:'var(--text2)' }}>{(attDraft.hours || 0).toFixed(1)}h</strong></span>
                      <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--card)' }}>
                      <div className="h-full transition-all" style={{ width:`${Math.min(100, pct)}%`, background: color }} />
                    </div>
                    <div className="flex items-center justify-between text-[12.5px] mt-1">
                      <button type="button" onClick={() => {
                        if (!attDraft.startTime || !attDraft.endTime) return
                        const [sh, sm] = attDraft.startTime.split(':').map(Number)
                        const [eh, em] = attDraft.endTime.split(':').map(Number)
                        let s = sh + sm / 60, end = eh + em / 60
                        if (end < s) end += 24
                        const breakHrs = Number(a.shift?.breakHours ?? 0)
                        const computed = Math.max(0, +(end - s - breakHrs).toFixed(1))
                        setAttDraft({ ...attDraft, hours: computed })
                      }}
                        className="font-bold flex items-center gap-1" style={{ color:'#8B5CF6' }}>
                        ↻ Recompute hours from times
                      </button>
                      {attDraft.hours < (a.shift?.minHours ?? 0) && (
                        <span className="font-bold flex items-center gap-1" style={{ color:'var(--warning)' }}>
                          <AlertTriangle className="w-3 h-3" />Below min {a.shift?.minHours}h
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

      {/* Complete modal */}
      <EnterpriseModal open={completeOpen} onClose={() => setCompleteOpen(false)}
        title="Complete Assignment" subtitle="Linked PO will also be closed"
        icon={<CheckCircle2 className="w-4 h-4" style={{ color:'var(--success)' }} />} size="md"
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</ModalBtn>
          <ModalBtn onClick={doComplete}><Check className="w-3 h-3 mr-1" />Confirm Complete</ModalBtn>
        </>}>
        <div className="space-y-2">
          <div className="rounded-lg p-2.5" style={{ background:'rgba(217,119,6,.06)', border:'1px solid rgba(217,119,6,.3)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color:'var(--warning)' }} />
              <span className="text-[12.5px] font-bold" style={{ color:'var(--warning)' }}>
                Completing the assignment marks <strong>{a.cost?.poId}</strong> as paid + closed. This is immutable.
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Closing Remarks (optional)</label>
            <textarea value={completeRemarks} onChange={e => setCompleteRemarks(e.target.value)} rows={3}
              placeholder="Final notes · handover · deliverables…"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
          </div>
        </div>
      </EnterpriseModal>
    </div>
  )
}

function SummaryCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-lg border p-2.5" style={{ ...C, borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</span>
      </div>
      <div className="text-sm font-black font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function KV({ k, v, mono, icon: Icon }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{k}</div>
      <div className={`text-[12.5px] font-semibold flex items-center gap-1 ${mono ? 'font-mono' : ''}`} style={{ color:'var(--text)' }}>
        {Icon && <Icon className="w-3 h-3" style={{ color:'var(--text3)' }} />}
        {v ?? '—'}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color, mono }) {
  return (
    <div className="rounded p-1.5 text-center" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{label}</div>
      <div className={`text-sm font-bold ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</div>
    </div>
  )
}
