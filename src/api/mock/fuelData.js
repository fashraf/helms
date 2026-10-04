// Fuel Management — master config + sample logs
// Logs are project-scoped; each log records date, fuel type, amount, status.

import { PROJECTS, PEOPLE } from './projectData'

export const FUEL_TYPES = [
  { id: 'diesel', label: 'Diesel', icon: '⛽', color: '#1F2937', bg: 'rgba(31,41,55,.08)' },
  { id: 'petrol', label: 'Petrol', icon: '🛢️', color: '#2563EB', bg: 'rgba(37,99,235,.08)' },
]

export const FUEL_UNITS = [
  { id: 'L',   label: 'Liters'   },
  { id: 'gal', label: 'Gallons'  },
]

export const FUEL_STATUSES = {
  approved: { label: 'Approved', c: '#059669', bg: 'rgba(5,150,105,.08)' },
  pending:  { label: 'Pending',  c: '#D97706', bg: 'rgba(217,119,6,.08)' },
}

// Resolve a project's POC — first manager, with phone fallback
export function getProjectPOC(projectId) {
  const proj = PROJECTS.find(p => p.id === projectId)
  if (!proj) return null
  const managerId = proj.managers?.[0]
  const manager = PEOPLE.find(p => p.id === managerId)
  if (!manager) return null
  // Synthesise a Saudi-format mobile from the manager's id for stable display
  const tail = (manager.id || 'U-000').replace(/[^0-9]/g, '').padEnd(6, '0').slice(0, 6)
  const phone = `+966 5${tail.slice(0, 1)} ${tail.slice(1, 4)} ${tail.slice(4)}`
  return { id: manager.id, name: manager.name, role: manager.role, dept: manager.dept, phone }
}

// Resolve a project's supervisor — first coordinator
export function getProjectSupervisor(projectId) {
  const proj = PROJECTS.find(p => p.id === projectId)
  if (!proj) return null
  const coordId = proj.coordinators?.[0]
  const coord = PEOPLE.find(p => p.id === coordId)
  if (!coord) return null
  return { id: coord.id, name: coord.name, role: coord.role, dept: coord.dept }
}

// Format a project label like "Project Alpha · Riyadh"
export function projectLabel(projectId) {
  const p = PROJECTS.find(x => x.id === projectId)
  if (!p) return projectId ?? ''
  return `${p.name} · ${p.city}`
}

// ─── Sample logs ──────────────────────────────────────────────────────────────
const todayMinus = (d) => {
  const dt = new Date(Date.now() - d * 86400000)
  return dt.toISOString()
}
const dateOnly = (iso) => iso.slice(0, 10)

let _id = 10800
const nextSeq = () => ++_id
export function nextFuelId(existing = []) {
  const max = existing.reduce((m, x) => {
    const n = Number((x.id || '').replace(/[^0-9]/g, ''))
    return Number.isFinite(n) && n > m ? n : m
  }, _id)
  return `FL-${max + 1}`
}

export const SAMPLE_FUEL_LOGS = [
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00001', date: dateOnly(todayMinus(0)),  fuelType: 'diesel', amount: 120, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(0),  notes: 'Site crane fuel refill morning shift'                       },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00001', date: dateOnly(todayMinus(4)),  fuelType: 'petrol', amount:  60, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(4),  notes: 'Support vehicle fleet refuel'                                },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00001', date: dateOnly(todayMinus(9)),  fuelType: 'diesel', amount:  85, unit: 'L', status: 'pending',  loggedBy: 'Site Sup',  loggedAt: todayMinus(9),  notes: 'Awaiting receipt confirmation from vendor'                   },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00002', date: dateOnly(todayMinus(1)),  fuelType: 'petrol', amount:  45, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(1),  notes: 'Pickup truck dispatch'                                       },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00002', date: dateOnly(todayMinus(5)),  fuelType: 'diesel', amount: 210, unit: 'L', status: 'approved', loggedBy: 'Site Sup',  loggedAt: todayMinus(5),  notes: 'Excavator weekly refuel'                                     },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00003', date: dateOnly(todayMinus(2)),  fuelType: 'diesel', amount: 180, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(2),  notes: 'Pipeline equipment'                                          },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00003', date: dateOnly(todayMinus(7)),  fuelType: 'diesel', amount: 240, unit: 'L', status: 'pending',  loggedBy: 'Site Sup',  loggedAt: todayMinus(7),  notes: 'Bulk transfer awaiting QA'                                    },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00004', date: dateOnly(todayMinus(3)),  fuelType: 'petrol', amount:  75, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(3),  notes: 'Site mobilisation vehicles'                                  },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00005', date: dateOnly(todayMinus(6)),  fuelType: 'diesel', amount: 150, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(6),  notes: 'Heavy equipment morning'                                     },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00006', date: dateOnly(todayMinus(2)),  fuelType: 'diesel', amount:  95, unit: 'L', status: 'approved', loggedBy: 'Site Sup',  loggedAt: todayMinus(2),  notes: 'Crane refuel · Dammam Port'                                  },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00007', date: dateOnly(todayMinus(8)),  fuelType: 'diesel', amount: 320, unit: 'L', status: 'approved', loggedBy: 'Admin',     loggedAt: todayMinus(8),  notes: 'Petrochem site bulk'                                         },
  { id: `FL-${nextSeq()}`, projectId: 'PRJ-00008', date: dateOnly(todayMinus(11)), fuelType: 'petrol', amount:  55, unit: 'L', status: 'pending',  loggedBy: 'Site Sup',  loggedAt: todayMinus(11), notes: 'Mall construction · pending receipt'                         },
]
