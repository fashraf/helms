// HELMS Shipment Calendar + Gantt — month/week views with filters and time-axis Gantt
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, ChevronLeft, ChevronRight, Plane, Truck, BarChart3,
  Filter, X, Clock, MapPin, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useVendorV2Store   from '../../store/vendorV2Store'
import Select2 from '../../components/ui/Select2'
import {
  SHIPMENT_STATUSES_INTL, SHIPMENT_STATUSES_LOCAL, LOCATION_MASTER,
} from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function locName(id) { return LOCATION_MASTER.find(l => l.id === id)?.name ?? id ?? '—' }
function dayDiff(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000) }

// ─── Status → Gantt bar color ───────────────────────────────────────────────
function statusColor(s) {
  const st = s.status ?? ''
  if (['delivered','completed','closed'].includes(st))                                return 'var(--success)'
  if (['cancelled','rejected'].includes(st))                                          return 'var(--text3)'
  if (['customs','customs_clearance','pending_customs','pending_modification'].includes(st)) return '#8B5CF6'
  if (['in_progress','dispatched'].includes(st))                                      return 'var(--primary)'
  if (['assigned','pickup_scheduled','submitted'].includes(st))                       return 'var(--cyan)'
  if (s._delayDays && s._delayDays > 0)                                                return 'var(--danger)'
  return 'var(--text3)'
}

// ─── Calendar view (the existing month grid) ─────────────────────────────────
function CalendarView({ shipments, cursor, setCursor, onOpen }) {
  const events = useMemo(() => {
    const map = new Map()
    const push = (iso, item) => {
      if (!iso) return
      const k = iso.slice(0, 10)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(item)
    }
    shipments.forEach(s => push(s._kind === 'international' ? (s.readyDate ?? s.createdAt) : (s.shipmentDate ?? s.createdAt), s))
    return map
  }, [shipments])

  const year  = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, key, items: events.get(key) ?? [] })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="grid grid-cols-7 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        {DAYS.map(d => (
          <div key={d} className="px-3 py-2 text-[12.5px] font-bold uppercase tracking-widest text-center" style={{ color:'var(--text3)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="border-r border-b" style={{ borderColor:'var(--border)', background:'var(--bg2)', minHeight: 110 }} />
          const today = isToday(cell.day)
          return (
            <div key={i} className="border-r border-b p-1.5"
              style={{ borderColor:'var(--border)', minHeight: 110, background: today ? 'var(--primary-light)' : 'var(--card)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: today ? 'var(--primary)' : 'var(--text2)' }}>{cell.day}</span>
                {cell.items.length > 0 && (
                  <span className="text-[9px] font-mono font-bold px-1 rounded" style={{ background:'var(--primary)', color:'#fff' }}>
                    {cell.items.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {cell.items.slice(0, 3).map(s => {
                  const isIntl = s._kind === 'international'
                  return (
                    <button key={s.id} onClick={() => onOpen(s)}
                      className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left truncate transition-colors"
                      style={{ background:'var(--bg2)' }}>
                      {isIntl ? <Plane className="w-2.5 h-2.5 flex-shrink-0" style={{ color:'var(--primary)' }} /> : <Truck className="w-2.5 h-2.5 flex-shrink-0" style={{ color:'var(--success)' }} />}
                      <span className="text-[9px] font-mono font-bold truncate" style={{ color:'var(--text)' }}>{s.id}</span>
                    </button>
                  )
                })}
                {cell.items.length > 3 && (
                  <div className="text-[9px] text-center font-semibold" style={{ color:'var(--text3)' }}>+ {cell.items.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Gantt view (horizontal time bars) ───────────────────────────────────────
function GanttView({ shipments, cursor, onOpen }) {
  const [hoverShip, setHoverShip] = useState(null)

  // Time window: 6 weeks centered on the cursor month
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const monthEnd   = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  // Extend to ±2 weeks for context
  const windowStart = new Date(monthStart.getTime() - 14 * 86400000)
  const windowEnd   = new Date(monthEnd.getTime()   + 14 * 86400000)
  const totalDays   = dayDiff(windowStart, windowEnd) + 1
  const today       = new Date()

  // Build rows: each shipment with start, end, delay
  const rows = useMemo(() => {
    return shipments
      .map(s => {
        const isIntl = s._kind === 'international'
        const startIso = s.createdAt ?? (isIntl ? s.readyDate : s.shipmentDate)
        const endIso   = s.actualDeliveryDate ?? s.eta ?? startIso
        if (!startIso) return null
        const start = new Date(startIso)
        const end   = new Date(endIso)
        // Skip if completely outside the window
        if (end < windowStart || start > windowEnd) return null
        const sClamped = start < windowStart ? windowStart : start
        const eClamped = end   > windowEnd   ? windowEnd   : end
        const startOffset = dayDiff(windowStart, sClamped)
        const duration    = Math.max(1, dayDiff(sClamped, eClamped) + 1)
        const delayDays   = s._delayDays ?? null
        return { shipment: s, start, end, startOffset, duration, delayDays }
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start)
  }, [shipments, windowStart, windowEnd])

  // Build month headers (each ~30 days wide)
  const monthLabels = []
  let walker = new Date(windowStart)
  while (walker <= windowEnd) {
    const monthStartDay = new Date(walker.getFullYear(), walker.getMonth(), 1)
    const monthEndDay   = new Date(walker.getFullYear(), walker.getMonth() + 1, 0)
    const clampS = monthStartDay < windowStart ? windowStart : monthStartDay
    const clampE = monthEndDay   > windowEnd   ? windowEnd   : monthEndDay
    monthLabels.push({
      label: walker.toLocaleString('en-SA', { month:'short', year:'2-digit' }),
      offset: dayDiff(windowStart, clampS),
      span:   dayDiff(clampS, clampE) + 1,
    })
    walker = new Date(walker.getFullYear(), walker.getMonth() + 1, 1)
  }

  const todayOffset = dayDiff(windowStart, today)
  const pct = (n) => (n / totalDays) * 100

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      {/* Header with month labels */}
      <div className="relative h-9 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <div className="absolute left-0 top-0 bottom-0" style={{ width: 200, borderRight:'1px solid var(--border)', background:'var(--bg2)' }}>
          <div className="px-3 py-2 text-[12.5px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Shipment</div>
        </div>
        <div className="absolute right-0 top-0 bottom-0" style={{ left: 200 }}>
          <div className="relative h-full">
            {monthLabels.map((m, i) => (
              <div key={i} className="absolute top-0 bottom-0 flex items-center px-2 border-r"
                style={{ left: `${pct(m.offset)}%`, width: `${pct(m.span)}%`, borderColor:'var(--border)' }}>
                <span className="text-[12.5px] font-bold" style={{ color:'var(--text2)' }}>{m.label}</span>
              </div>
            ))}
            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <div className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{ left: `${pct(todayOffset)}%`, width: 1, background:'var(--danger)' }}>
                <span className="absolute -top-0 left-1 text-[9px] font-bold px-1 rounded" style={{ background:'var(--danger)', color:'#fff' }}>TODAY</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body rows */}
      <div className="max-h-[600px] overflow-y-auto">
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-2" style={{ color:'var(--text3)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color:'var(--text2)' }}>No shipments in this window</p>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>Change filters or navigate to another month.</p>
          </div>
        ) : rows.map(({ shipment: s, startOffset, duration, delayDays }) => {
          const isIntl = s._kind === 'international'
          const color  = statusColor(s)
          const origin = isIntl ? (s.originCountry ?? s.origins?.[0]?.country ?? '—') : locName(s.route?.origin?.locationId)
          const dest   = isIntl ? (s.destinations?.[0]?.country ?? locName(s.deliveryLocation)) : locName(s.route?.stops?.[s.route?.stops?.length - 1]?.locationId)
          return (
            <div key={s.id} className="relative h-10 border-b transition-colors"
              style={{ borderColor:'var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg2)'; setHoverShip(s.id) }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; setHoverShip(null) }}>
              {/* Label column */}
              <div className="absolute left-0 top-0 bottom-0 flex items-center gap-1.5 px-3" style={{ width: 200, borderRight:'1px solid var(--border)' }}>
                {isIntl ? <Plane className="w-3 h-3 flex-shrink-0" style={{ color:'var(--primary)' }} /> : <Truck className="w-3 h-3 flex-shrink-0" style={{ color:'var(--success)' }} />}
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[12.5px] font-bold truncate" style={{ color:'var(--primary)' }}>{s.id}</div>
                  <div className="text-[9px] truncate" style={{ color:'var(--text3)' }}>{origin} → {dest}</div>
                </div>
              </div>

              {/* Gantt bar */}
              <div className="absolute right-0 top-0 bottom-0" style={{ left: 200 }}>
                <div className="relative h-full">
                  {/* Today line vertical */}
                  {todayOffset >= 0 && todayOffset <= totalDays && (
                    <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pct(todayOffset)}%`, width: 1, background:'rgba(220,38,38,.35)' }} />
                  )}
                  <button onClick={() => onOpen(s)}
                    className="absolute top-1/2 -translate-y-1/2 rounded transition-all hover:brightness-110"
                    style={{
                      left:   `${pct(startOffset)}%`,
                      width:  `${pct(duration)}%`,
                      height: 22,
                      background: color,
                      minWidth: 4,
                      boxShadow: hoverShip === s.id ? '0 0 0 2px rgba(37,99,235,.4)' : 'none',
                    }}
                    title={`${s.id} · ${s.status} · ${duration} days`}>
                    <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-bold text-white truncate">
                      {duration}d
                      {delayDays > 0 && <span className="ml-1 px-1 rounded" style={{ background:'rgba(0,0,0,.25)' }}>+{delayDays}d late</span>}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap px-4 py-2 border-t text-[12.5px]" style={{ borderColor:'var(--border)', background:'var(--bg2)', color:'var(--text3)' }}>
        <span className="font-bold uppercase tracking-widest">Legend:</span>
        {[
          { label:'Active',     c:'var(--primary)' },
          { label:'Assigned',   c:'var(--cyan)' },
          { label:'Customs',    c:'#8B5CF6' },
          { label:'Delivered',  c:'var(--success)' },
          { label:'Delayed',    c:'var(--danger)' },
          { label:'Cancelled',  c:'var(--text3)' },
        ].map(({ label, c }) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ background: c }} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ShipmentCalendar() {
  const navigate = useNavigate()
  const { intlShipments, localShipments } = useShipmentV2Store()
  const { vendors } = useVendorV2Store()

  const [view, setView]       = useState('calendar')  // calendar | gantt
  const [cursor, setCursor]   = useState(() => new Date())
  const [typeFilter, setType] = useState('all')
  const [statusFilter, setStatus] = useState('active')
  const [vendorFilter, setVendor] = useState('all')
  const [search, setSearch]   = useState('')

  // Combine and annotate
  const all = useMemo(() => {
    const annotate = (s, kind) => {
      const today = new Date()
      const eta = s.eta ?? s.actualDeliveryDate
      const delay = eta ? Math.round((today - new Date(eta)) / 86400000) : null
      return { ...s, _kind: kind, _delayDays: delay }
    }
    return [
      ...(intlShipments ?? []).map(s => annotate(s, 'international')),
      ...(localShipments ?? []).map(s => annotate(s, 'local')),
    ]
  }, [intlShipments, localShipments])

  const filtered = useMemo(() => {
    return all.filter(s => {
      if (typeFilter !== 'all' && s._kind !== typeFilter) return false
      if (statusFilter === 'active'    && ['delivered','completed','closed','cancelled'].includes(s.status)) return false
      if (statusFilter === 'completed' && !['delivered','completed','closed'].includes(s.status))            return false
      if (statusFilter === 'delayed'   && !((s._delayDays ?? 0) > 0 && !['delivered','completed','closed','cancelled'].includes(s.status))) return false
      if (vendorFilter !== 'all' && (s.vendor ?? s.supplier) !== vendorFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.id.toLowerCase().includes(q) && !(s.poNumber ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [all, typeFilter, statusFilter, vendorFilter, search])

  const monthLabel = cursor.toLocaleString('en-SA', { month: 'long', year: 'numeric' })
  const goPrev   = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const goNext   = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  const goToday  = () => setCursor(new Date())

  const onOpen = (s) => navigate(`/shipments/${s._kind === 'international' ? 'intl' : 'local'}/${s.id}`)

  // Vendor options
  const vendorOpts = useMemo(() => [
    { id:'all', label:'All Vendors' },
    ...(vendors ?? []).map(v => ({ id: v.id, label: v.name ?? v.id })),
  ], [vendors])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            {view === 'calendar' ? <Calendar className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} /> : <BarChart3 className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />}
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Shipment {view === 'calendar' ? 'Calendar' : 'Gantt'}</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>
              {filtered.length} shipment{filtered.length === 1 ? '' : 's'} · {monthLabel}
            </p>
          </div>
        </div>

        {/* View toggle + nav */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5" style={C}>
            {['calendar','gantt'].map(v => {
              const active = view === v
              return (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all"
                  style={active
                    ? { background:'var(--primary)', color:'#fff' }
                    : { color:'var(--text2)' }}>
                  {v === 'calendar' ? <Calendar className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
                  {v === 'calendar' ? 'Calendar' : 'Gantt'}
                </button>
              )
            })}
          </div>
          <button onClick={goPrev} className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ ...C, color:'var(--text2)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-semibold rounded-lg border" style={{ ...C, color:'var(--text2)' }}>Today</button>
          <button onClick={goNext} className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ ...C, color:'var(--text2)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[180px]">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipment # or PO…"
            className="w-full rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={typeFilter} onChange={v => setType(v ?? 'all')}
            options={[{ id:'all', label:'All Types' }, { id:'international', label:'International' }, { id:'local', label:'Local' }]} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={statusFilter} onChange={v => setStatus(v ?? 'active')}
            options={[
              { id:'all',       label:'All Statuses' },
              { id:'active',    label:'Active Only' },
              { id:'delayed',   label:'Delayed Only' },
              { id:'completed', label:'Completed Only' },
            ]} />
        </div>
        <div className="w-48">
          <Select2 size="sm" value={vendorFilter} onChange={v => setVendor(v ?? 'all')} options={vendorOpts} placeholder="All Vendors" />
        </div>
        {(typeFilter !== 'all' || statusFilter !== 'active' || vendorFilter !== 'all' || search) && (
          <button
            onClick={() => { setType('all'); setStatus('active'); setVendor('all'); setSearch('') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* The view */}
      {view === 'calendar'
        ? <CalendarView shipments={filtered} cursor={cursor} setCursor={setCursor} onOpen={onOpen} />
        : <GanttView    shipments={filtered} cursor={cursor} onOpen={onOpen} />
      }
    </div>
  )
}
