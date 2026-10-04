// Waiting Charges — delay logging + financial penalty tracking
// A waiting charge is incurred when a shipment / site event runs beyond the
// allotted free hours. It can be entered from a shipment context or as a
// standalone log.

import { PROJECTS, PEOPLE } from './projectData'

export const DELAY_REASONS = [
  { id: 'engineer_late',     label: 'Engineer Was Late',    icon: '👷',  color: '#DC2626', kind: 'hourly' },
  { id: 'supervisor_late',   label: 'Supervisor Was Late',  icon: '👨‍💼', color: '#DC2626', kind: 'hourly' },
  { id: 'no_parking',        label: 'No Parking Allocated', icon: '🅿️',  color: '#D97706', kind: 'hourly' },
  { id: 'labor_late',        label: 'Labor Was Late',       icon: '🧰',  color: '#D97706', kind: 'hourly' },
  { id: 'demurrage_charges', label: 'Demurrage Charges',    icon: '🚢',  color: '#7C3AED', kind: 'per_diem' },
  { id: 'other',             label: 'Other',                icon: '📝',  color: '#6B7280', kind: 'hourly' },
]

// System key for the demurrage category — referenced when filtering / routing
export const DEMURRAGE_CHARGES = 'demurrage_charges'

// Default demurrage rate (SAR per day per container). Configurable later.
export const DEFAULT_DEMURRAGE_RATE_PER_DAY = 200

// Per-diem demurrage calculation per spec:
//   Free Window      = 2 days (Day 1 & Day 2 from gate-in)
//   Chargeable Trigger = Day 3 onwards
//   Calculation Unit = per diem (NOT hourly)
//   Fractional days  = ceiling
export const DEMURRAGE_FREE_DAYS = 2

export function computeDemurrageDays(dischargeDate, gateOutDate) {
  if (!dischargeDate || !gateOutDate) return 0
  const a = new Date(dischargeDate)
  const b = new Date(gateOutDate)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const ms = b.getTime() - a.getTime()
  if (ms <= 0) return 0
  const elapsedDays = Math.ceil(ms / 86400000)   // fractional days ⇒ ceiling
  return elapsedDays <= DEMURRAGE_FREE_DAYS ? 0 : elapsedDays - DEMURRAGE_FREE_DAYS
}

export function computeDemurrageTotal({ dischargeDate, gateOutDate, ratePerDay = DEFAULT_DEMURRAGE_RATE_PER_DAY, containers = 1 }) {
  const days = computeDemurrageDays(dischargeDate, gateOutDate)
  return { days, total: days * Number(ratePerDay || 0) * Number(containers || 1) }
}

export const FREE_HOURS_OPTIONS = [
  { id: 1, label: '1 Hour'  },
  { id: 2, label: '2 Hours' },
  { id: 3, label: '3 Hours' },
]

export const DEFAULT_PENALTY_RATE = 50   // SAR per hour

// Compute elapsed hours between arrival and end. If end < arrival assume same-day overflow.
export function computeElapsedHours(arrivalTime, endTime) {
  if (!arrivalTime || !endTime) return 0
  const [ah, am] = arrivalTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let a = ah + am / 60
  let e = eh + em / 60
  if (e < a) e += 24
  return Math.max(0, +(e - a).toFixed(2))
}

// Compute chargeable hours = max(0, elapsed - freeHours)
export function computeChargedHours(elapsedHours, freeHours) {
  return Math.max(0, +(Number(elapsedHours) - Number(freeHours)).toFixed(2))
}

// Compute total amount = chargedHours * penaltyRate
export function computeTotalAmount(chargedHours, penaltyRate) {
  return +(Number(chargedHours) * Number(penaltyRate)).toFixed(2)
}

// Site metrics for the verification banner
export function getSiteMetrics(projectId) {
  const proj = PROJECTS.find(p => p.id === projectId)
  if (!proj) return null
  const coordId = proj.coordinators?.[0]
  const coord = PEOPLE.find(p => p.id === coordId)
  return {
    siteLocation: `${proj.city}, ${proj.address?.split(',').slice(0, 1)[0] || 'Hub A'}`,
    supervisor:   coord?.name ?? '—',
    supervisorRole: coord?.role ?? '',
  }
}

// ─── Sample logs ──────────────────────────────────────────────────────────────
const todayMinus = (d) => new Date(Date.now() - d * 86400000).toISOString()
const dateOnly = (iso) => iso.slice(0, 10)

let _id = 1000
const nextSeq = () => ++_id
export function nextWaitingChargeId(existing = []) {
  const max = existing.reduce((m, x) => {
    const n = Number((x.id || '').replace(/[^0-9]/g, ''))
    return Number.isFinite(n) && n > m ? n : m
  }, _id)
  return `WC-2026-${String(max + 1).padStart(4, '0')}`
}

const make = (projectId, daysAgo, reason, arr, freeHrs, end, rate, shipmentId = null, custom = '') => {
  const elapsed = computeElapsedHours(arr, end)
  const charged = computeChargedHours(elapsed, freeHrs)
  return {
    id: `WC-2026-${String(nextSeq()).padStart(4, '0')}`,
    projectId,
    shipmentId,
    incidentDate: dateOnly(todayMinus(daysAgo)),
    delayReason:  reason,
    customReason: custom,
    arrivalTime:  arr,
    freeHours:    freeHrs,
    endTime:      end,
    elapsedHours: elapsed,
    chargedHours: charged,
    penaltyRate:  rate,
    totalAmount:  computeTotalAmount(charged, rate),
    currency:     'SAR',
    createdAt:    todayMinus(daysAgo),
    createdBy:    'Admin',
    notes:        '',
  }
}

// Demurrage helper — per-diem (used to seed sample international port-storage charges)
const makeDemurrage = (projectId, daysAgo, dischargeDays, gateOutDays, containers, ratePerDay, shipmentId, notes = '') => {
  const discharge = todayMinus(dischargeDays)
  const gateOut   = todayMinus(gateOutDays)
  const days = computeDemurrageDays(discharge, gateOut)
  return {
    id: `WC-2026-${String(nextSeq()).padStart(4, '0')}`,
    projectId,
    shipmentId,
    incidentDate:  dateOnly(gateOut),
    delayReason:   'demurrage_charges',
    customReason:  '',
    dischargeDate: dateOnly(discharge),
    gateOutDate:   dateOnly(gateOut),
    containers,
    demurrageRate: ratePerDay,
    demurrageDays: days,
    chargedHours:  0,
    penaltyRate:   0,
    totalAmount:   days * ratePerDay * containers,
    currency:      'SAR',
    createdAt:     todayMinus(daysAgo),
    createdBy:     'Admin',
    notes,
  }
}

export const SAMPLE_WAITING_CHARGES = [
  make('PRJ-00001', 0,  'no_parking',      '10:00', 3, '14:00', 50,  'SHP-L-2026-0042'),
  make('PRJ-00003', 2,  'labor_late',      '08:30', 2, '12:30', 75,  'SHP-L-2026-0038'),
  make('PRJ-00007', 4,  'engineer_late',   '09:00', 3, '12:00', 60,  null),
  make('PRJ-00002', 5,  'supervisor_late', '07:00', 1, '11:30', 100, 'SHP-L-2026-0031'),
  make('PRJ-00001', 7,  'other',           '13:00', 2, '17:30', 50,  null, 'Material truck blocked main gate'),
  make('PRJ-00005', 10, 'no_parking',      '06:30', 1, '08:15', 80,  null),
  // International — demurrage on SABER-sample shipments to demo Extra Charges tab
  makeDemurrage('PRJ-00007', 6,  10, 5,  2, 200, 'ITS-26-06-4803', 'Containers stuck in port pending SABER docs review'),
  makeDemurrage('PRJ-00007', 14, 18, 11, 1, 250, 'ITS-26-06-4803', 'Customs assessment took longer than the free window'),
  makeDemurrage('PRJ-00002', 30, 35, 28, 3, 200, 'ITS-26-06-4804', 'Released only after duty clearance — 5 chargeable days'),
  // Plus an intl waiting charge so users see both types
  make('PRJ-00007', 4, 'no_parking', '09:00', 2, '15:30', 75, 'ITS-26-06-4803', 'Customs broker arrived late at port gate'),
]
