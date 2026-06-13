// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]
const past  = (h) => new Date(Date.now() - h * 3600000).toISOString()

// ─── Risk categories ──────────────────────────────────────────────────────────
export const RISK_FACTORS = {
  delay:   { label: 'Delay Risk',    icon: 'Clock',        color: 'amber'   },
  damage:  { label: 'Damage Risk',   icon: 'AlertTriangle',color: 'orange'  },
  customs: { label: 'Customs Risk',  icon: 'Shield',       color: 'purple'  },
  weather: { label: 'Weather Risk',  icon: 'CloudRain',    color: 'sky'     },
}

export const DELAY_REASONS = [
  'Traffic congestion — Highway 40 near Riyadh',
  'Border checkpoint backlog — 3h average wait',
  'Port congestion at Jeddah KAP',
  'Driver rest regulation — mandatory 8h stop',
  'Customs document review pending',
  'Equipment size triggers escort requirement',
  'Seasonal weather — sandstorm risk',
  'Road works — Highway 65 km 280–320',
  'High cargo volume period — weekend surcharge',
]

export const BOTTLENECK_TYPES = [
  'Customs clearance',
  'Port loading queue',
  'Driver availability',
  'Vehicle capacity mismatch',
  'Documentation gap',
  'Warehouse receiving backlog',
  'Road escort coordination',
  'GPS dead zone (Tabuk corridor)',
]

export const RECOMMENDATION_TYPES = {
  route:     { label: 'Change Route',      icon: 'Navigation', color: 'sky'     },
  vehicle:   { label: 'Change Vehicle',    icon: 'Truck',      color: 'amber'   },
  warehouse: { label: 'Change Warehouse',  icon: 'Warehouse',  color: 'purple'  },
  customs:   { label: 'Pre-clear Customs', icon: 'Shield',     color: 'emerald' },
  driver:    { label: 'Reassign Driver',   icon: 'User',       color: 'teal'    },
}

// ─── Route historical data ────────────────────────────────────────────────────
const ROUTES_HISTORY = {
  'Riyadh → Jeddah':        { base: 9.5,  variance: 2.5, trips: 247 },
  'Riyadh → Dammam':        { base: 4.0,  variance: 1.2, trips: 389 },
  'Riyadh → Tabuk':         { base: 13.5, variance: 4.0, trips: 84  },
  'Jeddah → Makkah':        { base: 1.0,  variance: 0.4, trips: 512 },
  'Dammam → Jubail':        { base: 1.0,  variance: 0.3, trips: 634 },
  'Riyadh → Medina':        { base: 9.0,  variance: 3.0, trips: 142 },
  'Riyadh → Neom':          { base: 18.0, variance: 6.0, trips: 38  },
  'Jeddah → Jizan':         { base: 7.0,  variance: 2.5, trips: 93  },
}

function buildRouteHistory(routeName) {
  const cfg = ROUTES_HISTORY[routeName] ?? { base: 8, variance: 3, trips: 50 }
  const { base, variance, trips } = cfg
  const fastest = +(base - variance * 0.7 + Math.random() * 0.5).toFixed(1)
  const slowest = +(base + variance + Math.random() * 1.5).toFixed(1)
  const avg     = +(base + (Math.random() - 0.4) * variance * 0.5).toFixed(1)
  const current = +(base + (Math.random() - 0.3) * variance).toFixed(1)
  const dev     = Math.round(((current - avg) / avg) * 100)
  return {
    routeName,
    totalTrips:  trips,
    fastest,
    slowest,
    average:     avg,
    current,
    deviation:   dev,
    recent: Array.from({ length: 8 }, (_, i) => ({
      id:       `H-${trips - i}`,
      date:     past((i + 1) * 24 * rand(1, 5)),
      hours:    +(base + (Math.random() - 0.5) * variance).toFixed(1),
      status:   pick(['on_time', 'on_time', 'delayed', 'early']),
    })),
  }
}

// ─── AI risk scorer ───────────────────────────────────────────────────────────
function scoreRisks(shipment) {
  const isIntl     = shipment?.type === 'international'
  const isDelayed  = shipment?.status === 'delayed'
  const isOnHold   = shipment?.status === 'on_hold'
  const hasCustoms = shipment?.stops?.some((s) => s.type === 'customs')

  const delay   = Math.min(98, rand(8, 30) + (isDelayed ? 35 : 0) + (isOnHold ? 20 : 0))
  const damage  = Math.min(90, rand(3, 20) + (isIntl ? 10 : 0))
  const customs = Math.min(95, rand(2, 15) + (isIntl ? 25 : 0) + (hasCustoms ? 10 : 0))
  const weather = Math.min(80, rand(5, 35))
  const overall = Math.round(delay * 0.4 + damage * 0.2 + customs * 0.25 + weather * 0.15)

  return { delay, damage, customs, weather, overall }
}

// ─── ETA predictor ────────────────────────────────────────────────────────────
function predictETA(shipment) {
  const baseHours   = rand(4, 36)
  const variance    = rand(1, 8)
  const confidence  = Math.min(97, Math.max(55, 90 - variance * 3))
  const etaMin      = new Date(Date.now() + (baseHours - variance) * 3600000).toISOString()
  const etaMax      = new Date(Date.now() + (baseHours + variance) * 3600000).toISOString()
  const etaBest     = new Date(Date.now() + baseHours * 3600000).toISOString()
  const bottleneck  = Math.random() > 0.4 ? pick(BOTTLENECK_TYPES) : null
  const reasons     = Array.from({ length: rand(1, 3) }, () => pick(DELAY_REASONS))
  const uniqueReasons = [...new Set(reasons)]

  return { etaMin, etaMax, etaBest, confidence, bottleneck, reasons: uniqueReasons }
}

// ─── AI recommendations ───────────────────────────────────────────────────────
function generateRecommendations(risks) {
  const recs = []
  if (risks.delay > 40) {
    recs.push({
      type:    'route',
      priority:'high',
      title:   'Switch to Highway 65 bypass',
      reason:  `Delay risk ${risks.delay}% — alternate route saves ~2.5h based on current traffic`,
      saving:  '2.5h · SAR 1,200',
      confidence: rand(78, 94),
    })
  }
  if (risks.customs > 35) {
    recs.push({
      type:    'customs',
      priority:'high',
      title:   'Pre-clear customs documentation',
      reason:  `Customs risk ${risks.customs}% — submit HS codes and SABER certs now to avoid 24–48h delay`,
      saving:  '24–48h · SAR 3,800',
      confidence: rand(85, 96),
    })
  }
  if (risks.damage > 25) {
    recs.push({
      type:    'vehicle',
      priority:'medium',
      title:   'Upgrade to enclosed low-bed trailer',
      reason:  `Damage risk ${risks.damage}% — open flatbed exposes equipment to weather and road debris`,
      saving:  'Reduced claim risk · SAR 800',
      confidence: rand(70, 88),
    })
  }
  if (risks.weather > 45) {
    recs.push({
      type:    'warehouse',
      priority:'medium',
      title:   'Stage at Tabuk Depot overnight',
      reason:  `Weather risk ${risks.weather}% — sandstorm advisory in northern corridor 18:00–06:00`,
      saving:  'Cargo protection · rescheduled delivery',
      confidence: rand(65, 82),
    })
  }
  if (recs.length < 2) {
    recs.push({
      type:    'driver',
      priority:'low',
      title:   'Assign senior driver for oversized load',
      reason:  'Equipment weight exceeds 80T — CDL-A Heavy with oversized certification required',
      saving:  'Compliance · avoid SAR 15,000 fine',
      confidence: rand(88, 98),
    })
  }
  return recs
}

// ─── Build full AI profile for a shipment ────────────────────────────────────
export function buildAIProfile(shipment) {
  const risks   = scoreRisks(shipment)
  const eta     = predictETA(shipment)
  const recs    = generateRecommendations(risks)
  const routeHist = buildRouteHistory(
    `${shipment?.origin?.split(' ')[0]} → ${shipment?.destination?.split(' ')[0]}` in ROUTES_HISTORY
      ? `${shipment.origin.split(' ')[0]} → ${shipment.destination.split(' ')[0]}`
      : pick(Object.keys(ROUTES_HISTORY))
  )
  return { risks, eta, recommendations: recs, routeHistory: routeHist, generatedAt: new Date().toISOString() }
}

// ─── Mock audit log ───────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = [
  'Created shipment', 'Updated shipment status', 'Approved maintenance request',
  'Rejected maintenance request', 'Assigned driver', 'Changed vehicle assignment',
  'Updated workflow step', 'Activated workflow', 'Created user', 'Updated user role',
  'Deleted user', 'Approved route change', 'Generated report', 'Exported data',
  'Updated system settings', 'Changed notification settings', 'Reset user password',
  'Locked user account', 'Resolved incident', 'Created incident report',
  'Updated warehouse inventory', 'Approved cost overrun', 'Changed AI settings',
]
export const AUDIT_MODULES = ['Shipments', 'Fleet', 'Drivers', 'Workflow', 'Maintenance', 'Warehouse', 'Incidents', 'Users', 'Settings', 'Reports', 'AI Engine']
const AUDIT_USERS = ['Abdullah Al-Rashid', 'Fatima Al-Zahrani', 'Khalid Al-Mutairi', 'Omar Al-Qahtani', 'Nasser Al-Harbi']
const AUDIT_ROLES = ['admin', 'manager', 'operator', 'operator', 'viewer']

function makeAuditEntry(n) {
  const uIdx  = rand(0, AUDIT_USERS.length - 1)
  const action = pick(AUDIT_ACTIONS)
  const module = pick(AUDIT_MODULES)
  const method = action.startsWith('Created') || action.startsWith('Generated') ? 'POST'
    : action.startsWith('Deleted') || action.startsWith('Locked') ? 'DELETE'
    : action.startsWith('Updated') || action.startsWith('Changed') || action.startsWith('Reset') ? 'PUT'
    : 'POST'

  return {
    id:         `LOG-${String(10000 + n).padStart(5, '0')}`,
    timestamp:  past(n * 0.3 + Math.random() * 2),
    user:       AUDIT_USERS[uIdx],
    userId:     `USR-${String(uIdx + 1).padStart(3, '0')}`,
    role:       AUDIT_ROLES[uIdx],
    action,
    module,
    method,
    target:     action.includes('shipment') ? `SHP-${rand(860,891)}`
      : action.includes('user') ? `USR-${rand(1,16)}`
      : action.includes('maintenance') ? `MR-${rand(3000,3028)}`
      : action.includes('workflow') ? `WF-${rand(2800,2810)}`
      : module,
    ip:         `10.${rand(1,254)}.${rand(1,254)}.${rand(1,254)}`,
    status:     Math.random() > 0.06 ? 'success' : 'failed',
    details:    `${action} — automated audit trail`,
  }
}

export const MOCK_AUDIT_LOGS = Array.from({ length: 120 }, (_, i) => makeAuditEntry(i))
