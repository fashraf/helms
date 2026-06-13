// ─── Utility ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ─── Static fixtures ─────────────────────────────────────────────────────────
const DRIVERS = [
  'Mohammed Al-Ghamdi', 'Khalid Al-Mutairi', 'Faisal Al-Dosari',
  'Omar Al-Qahtani', 'Nasser Al-Harbi', 'Tariq Al-Shammari',
  'Sami Al-Otaibi', 'Walid Al-Zahrani', 'Rami Al-Rashid',
]
const SITES = [
  'Riyadh Industrial City', 'Jeddah Port', 'Dammam Depot',
  'Khobar Logistics Hub', 'Abha Yard', 'Tabuk Site 12',
  'Medina Site 9', 'Jubail Site 2', 'Jizan Site 15', 'Eastern Region Site 3',
]
const EQUIPMENT = [
  'CAT 390F Excavator', 'Liebherr LTM 1200', 'Komatsu D375A Dozer',
  'Terex RT130 Crane', 'Volvo EC750E Excavator', 'John Deere 870G Grader',
  'Hitachi EX1200 Excavator', 'Grove GMK5130-2 Crane',
]
const FLEET_UNITS = [
  'HX-2291', 'HX-1103', 'TR-0442', 'CR-7781', 'DZ-3310',
  'TR-0221', 'EX-5590', 'HX-4432', 'CR-2298', 'GR-1120',
]
const WAREHOUSE_SITES = ['Site-1 (Riyadh)', 'Site-2 (Jeddah)', 'Site-3 (Dammam)', 'Site-4 (Khobar)', 'Site-5 (Abha)']
const DELAY_REASONS = [
  'GPS signal blackout', 'Road closure — Highway 40', 'Customs inspection hold',
  'Weather advisory issued', 'Driver rest stop — regulation compliance',
  'Mechanical inspection required', 'Border checkpoint delay',
]
const WORKFLOW_TYPES = ['route change', 'cost overrun', 'urgent delivery', 'border clearance', 'equipment swap']
const APPROVERS       = ['Abdullah Al-Rashid', 'Fatima Al-Zahrani', 'Hamad Al-Saud', 'Reema Al-Otaibi']

let shipmentCounter = 891

// ─── Event generators ─────────────────────────────────────────────────────────
const EVENT_GENERATORS = [
  // shipment_created ─────────────────────────────────
  () => {
    const id  = `SHP-${String(++shipmentCounter).padStart(5, '0')}`
    const org = pick(SITES)
    const dst = pick(SITES.filter((s) => s !== org))
    return {
      type: 'shipment_created',
      title: id,
      message: `${id} initiated — ${org} → ${dst}`,
      detail: pick(EQUIPMENT),
      showToast: Math.random() > 0.65,
      toastType: 'info',
      toastTitle: 'Shipment Created',
    }
  },

  // shipment_delayed ─────────────────────────────────
  () => {
    const id  = `SHP-${String(rand(800, 891)).padStart(5, '0')}`
    const hrs = rand(1, 6)
    const rsn = pick(DELAY_REASONS)
    return {
      type: 'shipment_delayed',
      title: id,
      message: `${id} delayed ${hrs}h — ${rsn}`,
      detail: `ETA revised by +${hrs} hour${hrs > 1 ? 's' : ''}`,
      showToast: true,
      toastType: 'warning',
      toastTitle: 'Shipment Delayed',
    }
  },

  // shipment_delivered ────────────────────────────────
  () => {
    const id  = `SHP-${String(rand(820, 880)).padStart(5, '0')}`
    const dst = pick(SITES)
    return {
      type: 'shipment_delivered',
      title: id,
      message: `${id} delivered successfully — ${dst}`,
      detail: 'Proof of delivery confirmed',
      showToast: Math.random() > 0.6,
      toastType: 'success',
      toastTitle: 'Delivery Confirmed',
    }
  },

  // driver_assigned ───────────────────────────────────
  () => {
    const id  = `SHP-${String(rand(880, shipmentCounter)).padStart(5, '0')}`
    const drv = pick(DRIVERS)
    return {
      type: 'driver_assigned',
      title: drv.split(' ')[0],
      message: `${drv} assigned to ${id}`,
      detail: `Unit ${pick(FLEET_UNITS)}`,
      showToast: false,
      toastType: 'info',
      toastTitle: 'Driver Assigned',
    }
  },

  // warehouse_updated ─────────────────────────────────
  () => {
    const site = pick(WAREHOUSE_SITES)
    const pct  = rand(55, 96)
    return {
      type: 'warehouse_updated',
      title: site.split(' ')[0],
      message: `${site} capacity updated to ${pct}%`,
      detail: pct > 88 ? '⚠ Approaching maximum' : 'Within normal range',
      showToast: pct > 90,
      toastType: pct > 90 ? 'warning' : 'info',
      toastTitle: 'Warehouse Alert',
    }
  },

  // workflow_approved ─────────────────────────────────
  () => {
    const wfId  = `WF-${rand(2800, 2999)}`
    const type  = pick(WORKFLOW_TYPES)
    const appBy = pick(APPROVERS)
    return {
      type: 'workflow_approved',
      title: wfId,
      message: `${wfId} ${type} approved by ${appBy.split(' ')[0]}`,
      detail: appBy,
      showToast: false,
      toastType: 'success',
      toastTitle: 'Workflow Approved',
    }
  },

  // fleet_alert ───────────────────────────────────────
  () => {
    const unit   = pick(FLEET_UNITS)
    const issues = ['GPS signal lost', 'speed limit exceeded', 'idle >2h', 'engine temp warning', 'fuel level critical']
    const issue  = pick(issues)
    return {
      type: 'fleet_alert',
      title: `Unit ${unit}`,
      message: `Unit ${unit} — ${issue}`,
      detail: 'Monitoring active',
      showToast: true,
      toastType: issue.includes('lost') || issue.includes('warning') || issue.includes('critical') ? 'error' : 'warning',
      toastTitle: 'Fleet Alert',
    }
  },

  // maintenance_alert ────────────────────────────────
  () => {
    const unit = pick(FLEET_UNITS)
    const types = ['PM service due', '500h inspection', 'hydraulic fluid change', 'tire rotation required']
    return {
      type: 'maintenance_alert',
      title: `Unit ${unit}`,
      message: `Unit ${unit} — ${pick(types)}`,
      detail: 'Schedule work order',
      showToast: Math.random() > 0.5,
      toastType: 'warning',
      toastTitle: 'Maintenance Due',
    }
  },
]

// Weighted pick — delays & fleet alerts are more dramatic, create tension
const WEIGHTS = [2, 3, 1.5, 2, 1.5, 1.5, 2, 1.5] // matches EVENT_GENERATORS order
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0)

export function generateEvent() {
  let r = Math.random() * TOTAL_WEIGHT
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i]
    if (r <= 0) return { ...EVENT_GENERATORS[i](), id: Date.now() + Math.random(), timestamp: new Date().toISOString() }
  }
  return { ...EVENT_GENERATORS[0](), id: Date.now(), timestamp: new Date().toISOString() }
}

// ─── KPI update simulator ─────────────────────────────────────────────────────
const KPI_KEYS = ['totalShipments', 'activeVehicles', 'activeDrivers', 'delayedShipments', 'warehouseLoad']
const KPI_DELTAS = {
  totalShipments:   () => pick([-2, -1, 0, 1, 2, 3]),
  activeVehicles:   () => pick([-3, -2, -1, 0, 1, 2]),
  activeDrivers:    () => pick([-2, -1, 0, 1]),
  delayedShipments: () => pick([-1, 0, 0, 1, 1]),
  warehouseLoad:    () => pick([-1, 0, 1]),
}

export function getRandomKPIUpdate() {
  const key = pick(KPI_KEYS)
  return { key, delta: KPI_DELTAS[key]() }
}

// ─── Sparkline seed generator ─────────────────────────────────────────────────
export function generateSparkline(base, variance = 20, points = 20) {
  let v = base
  return Array.from({ length: points }, () => {
    v += (Math.random() - 0.48) * variance
    return { v: Math.round(Math.max(0, v)) }
  })
}

// ─── Initial activity feed ────────────────────────────────────────────────────
export const INITIAL_EVENTS = [
  { id: 1,  type: 'shipment_created',   title: 'SHP-00891', message: 'SHP-00891 initiated — Riyadh Industrial City → Tabuk Site 12',       detail: 'CAT 390F Excavator',          timestamp: new Date(Date.now() - 45000).toISOString()  },
  { id: 2,  type: 'fleet_alert',        title: 'Unit HX-2291', message: 'Unit HX-2291 — engine temp warning',                               detail: 'Monitoring active',           timestamp: new Date(Date.now() - 90000).toISOString()  },
  { id: 3,  type: 'shipment_delivered', title: 'SHP-00890', message: 'SHP-00890 delivered successfully — Jeddah Port',                      detail: 'Proof of delivery confirmed',  timestamp: new Date(Date.now() - 150000).toISOString() },
  { id: 4,  type: 'driver_assigned',    title: 'Khalid',    message: 'Khalid Al-Mutairi assigned to SHP-00891',                             detail: 'Unit TR-0442',                timestamp: new Date(Date.now() - 240000).toISOString() },
  { id: 5,  type: 'shipment_delayed',   title: 'SHP-00887', message: 'SHP-00887 delayed 2h — GPS signal blackout',                          detail: 'ETA revised by +2 hours',     timestamp: new Date(Date.now() - 360000).toISOString() },
  { id: 6,  type: 'warehouse_updated',  title: 'Site-3',    message: 'Site-3 (Dammam) capacity updated to 91%',                             detail: '⚠ Approaching maximum',       timestamp: new Date(Date.now() - 480000).toISOString() },
  { id: 7,  type: 'workflow_approved',  title: 'WF-2891',   message: 'WF-2891 route change approved by Abdullah',                           detail: 'Abdullah Al-Rashid',          timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 8,  type: 'maintenance_alert',  title: 'Unit CR-7781', message: 'Unit CR-7781 — 500h inspection',                                   detail: 'Schedule work order',         timestamp: new Date(Date.now() - 720000).toISOString() },
  { id: 9,  type: 'shipment_created',   title: 'SHP-00889', message: 'SHP-00889 initiated — Dammam Depot → Eastern Region Site 3',          detail: 'Komatsu D375A Dozer',         timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 10, type: 'fleet_alert',        title: 'Unit HX-1103', message: 'Unit HX-1103 — GPS signal lost',                                   detail: 'Monitoring active',           timestamp: new Date(Date.now() - 1200000).toISOString() },
]

// ─── Initial pending approvals ────────────────────────────────────────────────
export const INITIAL_APPROVALS = [
  { id: 1, type: 'Route Change',     ref: 'SHP-00891', desc: 'Alternate route via Highway 65', urgency: 'high',   requestedBy: 'Khalid Al-M.' },
  { id: 2, type: 'Cost Overrun',     ref: 'PRJ-0042',  desc: 'Tabuk site fuel surcharge',       urgency: 'medium', requestedBy: 'Omar Al-Q.'   },
  { id: 3, type: 'Border Clearance', ref: 'SHP-00883', desc: 'Kuwait border customs hold',      urgency: 'high',   requestedBy: 'Faisal Al-D.' },
  { id: 4, type: 'Driver OT',        ref: 'DRV-044',   desc: 'Overtime approval for Dammam run',urgency: 'low',    requestedBy: 'Tariq Al-S.'  },
  { id: 5, type: 'Maintenance',      ref: 'HX-2291',   desc: 'Emergency repair authorization',  urgency: 'high',   requestedBy: 'Nasser Al-H.' },
]
