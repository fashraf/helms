// External Resource Management — 1 equipment + 1 worker per request
// Manpower contracts auto-generate a PO entry that closes with the assignment.
const daysAgo   = (n) => new Date(Date.now() - n * 86400000).toISOString()
const daysAhead = (n) => new Date(Date.now() + n * 86400000).toISOString()

export const EQUIPMENT_TYPES = [
  { id:'crane',         label:'Crane',          icon:'🏗️', color:'#DC2626' },
  { id:'tempo',         label:'Tempo',          icon:'🚚', color:'#06B6D4' },
  { id:'pickup',        label:'Pickup',         icon:'🛻', color:'#0EA5E9' },
  { id:'bulldozer',     label:'Bulldozer',      icon:'🚜', color:'#EA580C' },
  { id:'excavator',     label:'Excavator',      icon:'⛏️', color:'#D97706' },
  { id:'forklift',      label:'Forklift',       icon:'🚧', color:'#CA8A04' },
  { id:'loader',        label:'Loader',         icon:'🛠️', color:'#65A30D' },
  { id:'generator',     label:'Generator',      icon:'⚡', color:'#FACC15' },
  { id:'truck',         label:'Truck',          icon:'🚛', color:'#2563EB' },
  { id:'trailer',       label:'Trailer',        icon:'🚐', color:'#7C3AED' },
  { id:'water_tanker',  label:'Water Tanker',   icon:'💧', color:'#0891B2' },
  { id:'other',         label:'Other',          icon:'🔧', color:'#64748B' },
]

export const ASSIGNMENT_STATUSES = {
  active:    { label:'Active',    c:'#2563EB', bg:'rgba(37,99,235,.12)' },
  completed: { label:'Completed', c:'#059669', bg:'rgba(5,150,105,.12)' },
  delayed:   { label:'Delayed',   c:'#DC2626', bg:'rgba(220,38,38,.12)' },
  upcoming:  { label:'Upcoming',  c:'#06B6D4', bg:'rgba(6,182,212,.12)' },
}

export const ATTENDANCE_STATUSES = {
  present:  { label:'Present',  c:'#059669', bg:'rgba(5,150,105,.12)', icon:'✓' },
  absent:   { label:'Absent',   c:'#DC2626', bg:'rgba(220,38,38,.12)', icon:'✗' },
  late:     { label:'Late',     c:'#D97706', bg:'rgba(217,119,6,.12)', icon:'⏰' },
  overtime: { label:'Overtime', c:'#8B5CF6', bg:'rgba(139,92,246,.12)', icon:'⚡' },
  holiday:  { label:'Holiday',  c:'#64748B', bg:'rgba(100,116,139,.12)', icon:'🌙' },
}

export const ATTENDANCE_MANAGERS = [
  { id:'site_supervisor',  label:'Site Supervisor'      },
  { id:'project_manager',  label:'Project Manager'      },
  { id:'resource_coord',   label:'Resource Coordinator' },
]

export const NATIONALITIES = [
  'Saudi Arabia','India','Pakistan','Bangladesh','Egypt','Yemen','Philippines','Nepal','Sri Lanka','Sudan','Indonesia','Ethiopia',
]

export const PROJECTS = [
  { id:'PRJ-001', name:'NEOM Solar Farm Phase 2',         client:'NEOM',    location:'Tabuk' },
  { id:'PRJ-002', name:'Aramco Pipeline Maintenance',     client:'Aramco',  location:'Dhahran' },
  { id:'PRJ-003', name:'Red Sea Resort Construction',     client:'Red Sea Global', location:'Umluj' },
  { id:'PRJ-004', name:'Riyadh Metro Expansion · Line 4', client:'RPCT',    location:'Riyadh' },
  { id:'PRJ-005', name:'SABIC Jubail Plant Shutdown',     client:'SABIC',   location:'Jubail' },
  { id:'PRJ-006', name:'King Salman Park · Phase 1',      client:'PIF',     location:'Riyadh' },
]

// Employee history pool — used for Iqama lookup AND the "Pick from modal" picker.
export const EMPLOYEE_POOL = [
  { iqama:'2412345678', name:'Ahmed Hassan Mahmoud',  nationality:'Egypt',      mobile:'+966 50 234 5678', daysWorked: 120, projects:['NEOM Solar Farm Phase 2','Aramco Pipeline Maintenance'], attendanceRating: 95, avgHours: 9 },
  { iqama:'2419988776', name:'Rajesh Kumar Verma',    nationality:'India',      mobile:'+966 53 234 1122', daysWorked: 240, projects:['Red Sea Resort Construction','Riyadh Metro Expansion · Line 4'], attendanceRating: 92, avgHours: 9.5 },
  { iqama:'2422334455', name:'Muhammad Tariq Khan',   nationality:'Pakistan',   mobile:'+966 55 654 3322', daysWorked: 180, projects:['SABIC Jubail Plant Shutdown'], attendanceRating: 88, avgHours: 8.5 },
  { iqama:'2418877665', name:'Mohammed Ali Khan',     nationality:'Bangladesh', mobile:'+966 56 998 1100', daysWorked: 90,  projects:['King Salman Park · Phase 1'], attendanceRating: 97, avgHours: 10 },
  { iqama:'2415544332', name:'Jose Reyes Santos',     nationality:'Philippines',mobile:'+966 50 776 5544', daysWorked: 65,  projects:['NEOM Solar Farm Phase 2'], attendanceRating: 91, avgHours: 9 },
  { iqama:'2426677889', name:'Kishore Bahadur Rai',   nationality:'Nepal',      mobile:'+966 54 332 1100', daysWorked: 45,  projects:['Aramco Pipeline Maintenance'], attendanceRating: 86, avgHours: 8.5 },
  { iqama:'2411122334', name:'Saif Al-Yemeni',        nationality:'Yemen',      mobile:'+966 58 445 5667', daysWorked: 30,  projects:[], attendanceRating: null, avgHours: null },
]

// Build attendance log for a worker
// shiftStart/shiftEnd are HH:MM strings; absent/holiday produce null times.
function buildAttendance(startISO, days, ratingTarget = 95, shiftStart = '07:00', shiftEnd = '17:00') {
  const start = new Date(startISO)
  const out = []
  // Bump end-time for late starts and overtime
  const bumpHHMM = (hhmm, plusMin) => {
    const [h, m] = hhmm.split(':').map(Number)
    const total = (h * 60 + m + plusMin + 1440) % 1440
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    const dow = d.getDay()
    if (dow === 5) {
      out.push({ date: d.toISOString(), status:'holiday', hours: 0, startTime: null, endTime: null })
      continue
    }
    const r = Math.random() * 100
    if (r > 98) {
      out.push({ date: d.toISOString(), status:'absent',   hours: 0,  startTime: null,                       endTime: null })
    } else if (r > ratingTarget) {
      out.push({ date: d.toISOString(), status:'late',     hours: 8,  startTime: bumpHHMM(shiftStart, 60),   endTime: shiftEnd })
    } else if (r > ratingTarget - 8) {
      out.push({ date: d.toISOString(), status:'overtime', hours: 11, startTime: shiftStart,                 endTime: bumpHHMM(shiftEnd, 120) })
    } else {
      out.push({ date: d.toISOString(), status:'present',  hours: 9,  startTime: shiftStart,                 endTime: shiftEnd })
    }
  }
  return out
}

// Sample assignments — 1 equipment + 1 worker each + linked PO
export const SAMPLE_ASSIGNMENTS = [
  {
    id: 'ERA-2026-001',
    projectId: 'PRJ-001', projectName: 'NEOM Solar Farm Phase 2', projectLocation: 'Tabuk',
    passRequired: true, passNumber: 'NEOM-P-44521', passExpiry: daysAhead(90),
    equipment: { id:'EQ-001', name:'Crane #44 · 60T Crawler', type:'crane', numberPlate:'RUH-7842', startDate: daysAgo(7), endDate: daysAhead(7), status:'active' },
    resource:  { id:'RES-001', name:'Ahmed Hassan Mahmoud', iqama:'2412345678', nationality:'Egypt', mobile:'+966 50 234 5678', manager:'Khalid Al-Rashed', managerPhone:'+966 56 111 2233' },
    shift: {
      startDate: daysAgo(7), endDate: daysAhead(7),
      fridayWork: false, fridayOvertime: false,
      startTime: '07:00', endTime: '17:00', breakHours: 1,
      nightShift: false,
      needAttendance: true, attendanceManagedBy:'site_supervisor', minHours: 8,
    },
    cost: { dailyRate: 850, currency:'SAR', totalDays: 15, totalAmount: 12750, poId: 'PO-2026-201', poStatus:'created' },
    status: 'active',
    attendance: buildAttendance(daysAgo(7), 7, 95, '07:00', '17:00'),
    createdBy:'Fahad Al-Ghamdi', createdAt: daysAgo(10), updatedBy:'Site Supervisor', updatedAt: daysAgo(1),
    auditLog: [
      { action:'create', date: daysAgo(10), by:'Fahad Al-Ghamdi', summary:'Assignment created · PO-2026-201 generated' },
      { action:'status_change', date: daysAgo(7), by:'Site Supervisor', summary:'Equipment started · status → active' },
    ],
  },
  {
    id: 'ERA-2026-002',
    projectId: 'PRJ-004', projectName: 'Riyadh Metro Expansion · Line 4', projectLocation: 'Riyadh',
    passRequired: true, passNumber: 'RPCT-P-78901', passExpiry: daysAhead(180),
    equipment: { id:'EQ-002', name:'Excavator · CAT 390F', type:'excavator', numberPlate:'JED-3391', startDate: daysAhead(7), endDate: daysAhead(37), status:'upcoming' },
    resource:  { id:'RES-002', name:'Muhammad Tariq Khan', iqama:'2422334455', nationality:'Pakistan', mobile:'+966 55 654 3322', manager:'Saif Al-Mutairi', managerPhone:'+966 55 778 9900' },
    shift: {
      startDate: daysAhead(7), endDate: daysAhead(37),
      fridayWork: true, fridayOvertime: true,
      startTime: '06:00', endTime: '18:00', breakHours: 2,
      nightShift: false,
      needAttendance: true, attendanceManagedBy:'project_manager', minHours: 10,
    },
    cost: { dailyRate: 1200, currency:'SAR', totalDays: 31, totalAmount: 37200, poId: 'PO-2026-202', poStatus:'created' },
    status: 'upcoming',
    attendance: [],
    createdBy:'Fahad Al-Ghamdi', createdAt: daysAgo(2), updatedBy:'Fahad Al-Ghamdi', updatedAt: daysAgo(2),
    auditLog: [
      { action:'create', date: daysAgo(2), by:'Fahad Al-Ghamdi', summary:'Assignment created · PO-2026-202 generated' },
    ],
  },
  {
    id: 'ERA-2025-098',
    projectId: 'PRJ-005', projectName: 'SABIC Jubail Plant Shutdown', projectLocation: 'Jubail',
    passRequired: true, passNumber: 'SABIC-P-11234', passExpiry: daysAgo(30),
    equipment: { id:'EQ-003', name:'Bulldozer · D9R', type:'bulldozer', numberPlate:'DAM-5567', startDate: daysAgo(75), endDate: daysAgo(45), status:'completed' },
    resource:  { id:'RES-003', name:'Mohammed Ali Khan', iqama:'2418877665', nationality:'Bangladesh', mobile:'+966 56 998 1100', manager:'Bandar Al-Otaibi', managerPhone:'+966 50 332 4455' },
    shift: {
      startDate: daysAgo(75), endDate: daysAgo(45),
      fridayWork: true, fridayOvertime: true,
      startTime: '22:00', endTime: '06:00', breakHours: 1,
      nightShift: true,
      needAttendance: true, attendanceManagedBy:'site_supervisor', minHours: 7,
    },
    cost: { dailyRate: 950, currency:'SAR', totalDays: 31, totalAmount: 29450, poId: 'PO-2025-198', poStatus:'closed' },
    status: 'completed',
    attendance: buildAttendance(daysAgo(75), 30, 97, '22:00', '06:00'),
    createdBy:'Fahad Al-Ghamdi', createdAt: daysAgo(80), updatedBy:'Site Supervisor', updatedAt: daysAgo(45),
    auditLog: [
      { action:'create',        date: daysAgo(80), by:'Fahad Al-Ghamdi', summary:'Assignment created · PO-2025-198 generated' },
      { action:'status_change', date: daysAgo(75), by:'Site Supervisor', summary:'Equipment started' },
      { action:'status_change', date: daysAgo(45), by:'Site Supervisor', summary:'Completed · PO marked closed' },
    ],
  },
  {
    id: 'ERA-2026-003',
    projectId: 'PRJ-002', projectName: 'Aramco Pipeline Maintenance', projectLocation: 'Dhahran',
    passRequired: true, passNumber: 'ARM-P-55678', passExpiry: daysAhead(45),
    equipment: { id:'EQ-004', name:'Water Tanker · 30K L', type:'water_tanker', numberPlate:'DAM-8923', startDate: daysAgo(20), endDate: daysAgo(2), status:'delayed' },
    resource:  { id:'RES-004', name:'Jose Reyes Santos', iqama:'2415544332', nationality:'Philippines', mobile:'+966 50 776 5544', manager:'Yousef Al-Mutairi', managerPhone:'+966 53 998 7766' },
    shift: {
      startDate: daysAgo(20), endDate: daysAgo(2),
      fridayWork: false, fridayOvertime: false,
      startTime: '08:00', endTime: '18:00', breakHours: 1,
      nightShift: false,
      needAttendance: true, attendanceManagedBy:'site_supervisor', minHours: 9,
    },
    cost: { dailyRate: 600, currency:'SAR', totalDays: 19, totalAmount: 11400, poId: 'PO-2026-203', poStatus:'created' },
    status: 'delayed',
    attendance: buildAttendance(daysAgo(20), 18, 82, '08:00', '18:00'),
    createdBy:'Fahad Al-Ghamdi', createdAt: daysAgo(25), updatedBy:'Resource Coord.', updatedAt: daysAgo(2),
    auditLog: [
      { action:'create',        date: daysAgo(25), by:'Fahad Al-Ghamdi', summary:'Assignment created · PO-2026-203 generated' },
      { action:'status_change', date: daysAgo(20), by:'Site Supervisor', summary:'Equipment started' },
      { action:'status_change', date: daysAgo(3),  by:'Resource Coord.', summary:'Status → delayed (extension pending)' },
    ],
  },
  {
    id: 'ERA-2026-004',
    projectId: 'PRJ-003', projectName: 'Red Sea Resort Construction', projectLocation: 'Umluj',
    passRequired: true, passNumber: 'RSG-P-99887', passExpiry: daysAhead(120),
    equipment: { id:'EQ-005', name:'Forklift · Toyota 3T', type:'forklift', numberPlate:'TBK-2210', startDate: daysAgo(15), endDate: daysAhead(45), status:'active' },
    resource:  { id:'RES-005', name:'Rajesh Kumar Verma', iqama:'2419988776', nationality:'India', mobile:'+966 53 234 1122', manager:'Omar Al-Shehri', managerPhone:'+966 54 887 9988' },
    shift: {
      startDate: daysAgo(15), endDate: daysAhead(45),
      fridayWork: false, fridayOvertime: false,
      startTime: '06:30', endTime: '16:30', breakHours: 1.5,
      nightShift: false,
      needAttendance: true, attendanceManagedBy:'project_manager', minHours: 8,
    },
    cost: { dailyRate: 720, currency:'SAR', totalDays: 61, totalAmount: 43920, poId: 'PO-2026-204', poStatus:'created' },
    status: 'active',
    attendance: buildAttendance(daysAgo(15), 15, 95, '06:30', '16:30'),
    createdBy:'Fahad Al-Ghamdi', createdAt: daysAgo(20), updatedBy:'Project Manager', updatedAt: daysAgo(3),
    auditLog: [
      { action:'create',        date: daysAgo(20), by:'Fahad Al-Ghamdi', summary:'Assignment created · PO-2026-204 generated' },
      { action:'status_change', date: daysAgo(15), by:'Project Manager', summary:'Equipment started' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────
export function nextAssignmentId(existing) {
  const year = new Date().getFullYear()
  const existingThisYear = existing.filter(a => a.id.startsWith(`ERA-${year}`))
  const n = existingThisYear.length + 1
  return `ERA-${year}-${String(n).padStart(3, '0')}`
}

export function nextManpowerPoId(existingPos) {
  const year = new Date().getFullYear()
  const sameYear = (existingPos ?? []).filter(p => p.id?.startsWith(`PO-${year}-2`))
  const max = sameYear.reduce((acc, p) => {
    const n = parseInt(p.id.split('-').pop(), 10)
    return Number.isFinite(n) ? Math.max(acc, n) : acc
  }, 200)
  return `PO-${year}-${max + 1}`
}

export function daysBetween(a, b) {
  if (!a || !b) return null
  return Math.floor((new Date(b) - new Date(a)) / 86400000)
}

export function totalDaysOf(startISO, endISO) {
  const d = daysBetween(startISO, endISO)
  return (d ?? 0) + 1
}

export function findEmployee(iqama) {
  if (!iqama || iqama.length < 6) return null
  return EMPLOYEE_POOL.find(e => e.iqama === iqama) ?? null
}

export function equipmentProgress(eq) {
  const total = totalDaysOf(eq.startDate, eq.endDate)
  const elapsed = daysBetween(eq.startDate, new Date().toISOString()) ?? 0
  return { total, elapsed: Math.max(0, Math.min(total, elapsed)), pct: total > 0 ? Math.round(Math.min(100, Math.max(0, elapsed / total * 100))) : 0 }
}

export function attendanceStats(arr = []) {
  const present  = arr.filter(a => a.status === 'present').length
  const absent   = arr.filter(a => a.status === 'absent').length
  const late     = arr.filter(a => a.status === 'late').length
  const overtime = arr.filter(a => a.status === 'overtime').length
  const holiday  = arr.filter(a => a.status === 'holiday').length
  const workdays = arr.length - holiday
  const totalHours = arr.reduce((s, a) => s + (a.hours ?? 0), 0)
  const avgHours = workdays > 0 ? +(totalHours / workdays).toFixed(1) : 0
  const rating = workdays > 0 ? Math.round((present + overtime) / workdays * 100) : null
  return { present, absent, late, overtime, holiday, totalHours, avgHours, workdays, rating }
}

export function todaysAttendance(assignments) {
  const today = new Date().toISOString().slice(0, 10)
  let present = 0, absent = 0, late = 0, overtime = 0
  ;(assignments ?? []).forEach(a => {
    (a.attendance ?? []).forEach(att => {
      if (!att.date?.startsWith(today)) return
      if (att.status === 'present')   present++
      if (att.status === 'absent')    absent++
      if (att.status === 'late')      late++
      if (att.status === 'overtime')  overtime++
    })
  })
  return { present, absent, late, overtime }
}

// Build unified worker picker pool: EMPLOYEE_POOL + workers from existing assignments
export function buildWorkerPool(existingAssignments) {
  const byIqama = {}
  EMPLOYEE_POOL.forEach(e => { byIqama[e.iqama] = { ...e, source:'history' } })
  ;(existingAssignments ?? []).forEach(a => {
    if (!a.resource?.iqama) return
    const r = a.resource
    const existing = byIqama[r.iqama]
    if (existing) {
      existing.projects = Array.from(new Set([...(existing.projects ?? []), a.projectName])).filter(Boolean)
    } else {
      byIqama[r.iqama] = {
        iqama: r.iqama, name: r.name, nationality: r.nationality, mobile: r.mobile,
        daysWorked: null, attendanceRating: null, avgHours: null,
        projects: [a.projectName].filter(Boolean),
        source: 'assignment',
      }
    }
  })
  return Object.values(byIqama)
}
