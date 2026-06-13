// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]
const past  = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

// ─── Fleet Constants ──────────────────────────────────────────────────────────
export const VEHICLE_TYPES = ['Low-bed Trailer', 'Flatbed Trailer', 'Modular Transporter', 'Step-deck Trailer', 'Tanker', 'Box Truck', 'Crane Carrier', 'Reach Stacker', 'Forklift']
export const VEHICLE_MAKES = {
  'Low-bed Trailer':     ['Goldhofer', 'Cometto', 'Nicolas', 'Scheuerle'],
  'Flatbed Trailer':     ['Schmitz Cargobull', 'Krone', 'Wielton', 'Kogel'],
  'Modular Transporter': ['Goldhofer SPMT', 'Scheuerle SPMT', 'Cometto MSPE'],
  'Step-deck Trailer':   ['Fontaine', 'Talbert', 'Landoll', 'XL Specialized'],
  'Tanker':              ['Heil', 'Brenner', 'Stokota', 'Magyar'],
  'Box Truck':           ['Volvo FH', 'Scania R580', 'Mercedes Actros', 'IVECO Stralis'],
  'Crane Carrier':       ['Liebherr LTM 1200', 'Grove GMK5130', 'Manitowoc 18000'],
  'Reach Stacker':       ['Kalmar DRF450', 'Hyster RS46-36CH', 'Linde C4531TL'],
  'Forklift':            ['Toyota 8FGF35', 'Hyster H6.0FT', 'Crown C-5'],
}
export const FUEL_TYPES  = ['Diesel', 'Diesel', 'Diesel', 'Electric', 'LNG']
export const SA_LOCATIONS = [
  'Riyadh Industrial City', 'Jeddah Port (KAP)', 'Dammam Depot D-7',
  'Khobar Logistics Hub', 'Jubail Complex', 'Tabuk Site 12',
  'Medina Yard', 'Neom Main Gate', 'Yanbu Port',
  'Abha Regional', 'In Transit - Hwy 40', 'In Transit - Hwy 65',
]

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const VEHICLE_STATUSES = ['active', 'active', 'active', 'idle', 'maintenance', 'maintenance']

function makeVehicle(n) {
  const type   = pick(VEHICLE_TYPES)
  const models = VEHICLE_MAKES[type] ?? ['Generic Unit']
  const status = pick(VEHICLE_STATUSES)
  const fuel   = pick(FUEL_TYPES)
  return {
    id:           `HX-${String(2200 + n).padStart(4, '0')}`,
    type,
    model:        pick(models),
    year:         rand(2018, 2024),
    status,
    fuelType:     fuel,
    fuelLevel:    fuel === 'Electric' ? rand(20, 100) : rand(10, 95),
    fuelCapacity: fuel === 'Electric' ? 100 : rand(600, 1200),
    mileage:      rand(12000, 280000),
    payload:      rand(20, 250) + 'T',
    licensePlate: `${pick(['A','B','C','D'])} ${rand(1000,9999)} ${pick(['KSA','RA','JD'])}`,
    lastService:  past(rand(100, 2400)),
    nextService:  future(rand(200, 1200)),
    assignedDriver: status === 'active' ? pick(['DRV-001','DRV-002','DRV-003','DRV-004','DRV-005','DRV-006']) : null,
    currentLocation: status === 'maintenance' ? pick(['Riyadh Workshop', 'Jeddah Service Center']) : pick(SA_LOCATIONS),
    assignedShipment: status === 'active' ? `SHP-${String(rand(860,891)).padStart(5,'0')}` : null,
    fuelHistory: Array.from({ length: 14 }, (_, i) => ({ day: `D-${13-i}`, level: rand(20, 95) })),
    serviceHistory: [
      { date: past(rand(500,1500)), type: 'Preventive PM', tech: 'Al-Hajri Auto', cost: rand(800,3500), notes: 'Oil, filters, brake inspection' },
      { date: past(rand(1500,4000)), type: '500h Service',  tech: 'OEM Dealer',   cost: rand(2000,8000), notes: 'Full inspection + parts replacement' },
      { date: past(rand(4000,8000)), type: 'Corrective',    tech: 'Field Tech',   cost: rand(500,2000),  notes: 'Hydraulic seal replacement' },
    ],
    gpsCoords: { lat: 24.6877 + (Math.random() - 0.5) * 2, lng: 46.7219 + (Math.random() - 0.5) * 4 },
    documents: { registration: future(rand(200,800)), insurance: future(rand(100,600)), roadworthiness: future(rand(50,400)) },
    incidents: rand(0, 4),
  }
}

export const MOCK_VEHICLES = Array.from({ length: 24 }, (_, i) => makeVehicle(i))

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const LICENSE_TYPES  = ['CDL-A Heavy', 'CDL-B Commercial', 'Crane Operator', 'Hazmat Endorsed', 'Oversized Load']
export const DRIVER_STATUSES = ['on_duty', 'on_duty', 'available', 'available', 'off_duty', 'on_leave']
const DRIVER_NAMES = [
  ['Mohammed', 'Al-Ghamdi'], ['Khalid', 'Al-Mutairi'], ['Faisal', 'Al-Dosari'],
  ['Omar', 'Al-Qahtani'], ['Nasser', 'Al-Harbi'], ['Tariq', 'Al-Shammari'],
  ['Sami', 'Al-Otaibi'], ['Walid', 'Al-Zahrani'], ['Rami', 'Al-Rashid'],
  ['Hamad', 'Al-Saud'], ['Yazid', 'Al-Enazi'], ['Sultan', 'Al-Dosari'],
  ['Nawaf', 'Al-Ghamdi'], ['Turki', 'Al-Malki'], ['Bandar', 'Al-Rashidi'],
  ['Abdulaziz', 'Al-Harbi'],
]

function makeDriver(i) {
  const [first, last] = DRIVER_NAMES[i % DRIVER_NAMES.length]
  const status = pick(DRIVER_STATUSES)
  const assigned = MOCK_VEHICLES.find((v) => v.assignedDriver === `DRV-${String(i + 1).padStart(3,'0')}`)
  const onTime = rand(78, 99)
  const score  = Math.round((onTime * 0.4) + (rand(70, 99) * 0.35) + (rand(75, 99) * 0.25))
  return {
    id:          `DRV-${String(i + 1).padStart(3,'0')}`,
    name:        `${first} ${last}`,
    phone:       `+966 5${rand(0,9)} ${rand(100,999)} ${rand(1000,9999)}`,
    email:       `${first.toLowerCase()}.${last.toLowerCase()}@helms.sa`,
    status,
    licenseType: pick(LICENSE_TYPES),
    licenseNo:   `KSA-HDL-${rand(1000,9999)}`,
    licenseExpiry: future(rand(200, 1200)),
    experience:  rand(3, 18) + ' years',
    joinDate:    past(rand(500, 3000) * 24),
    baseLocation: pick(['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Jubail']),
    assignedVehicle: assigned?.id ?? null,
    assignedShipment: assigned?.assignedShipment ?? null,
    performance: {
      onTimeRate:       onTime,
      safetyScore:      rand(70, 99),
      customerRating:   (rand(38, 50) / 10).toFixed(1),
      distanceThisMonth: rand(2000, 12000),
      incidentsFY:      rand(0, 3),
      shipmentsCompleted: rand(45, 240),
      avgDeliveryTime:  rand(85, 115) + '%',
    },
    overallScore: score,
    medicalExpiry: future(rand(100, 730)),
    notes: Math.random() > 0.7 ? 'Certified hazmat handler' : '',
    recentActivity: [
      { date: past(rand(1, 48)), action: 'Completed delivery', ref: `SHP-${rand(860,891)}`, location: pick(SA_LOCATIONS) },
      { date: past(rand(48,120)), action: 'Route started',     ref: `SHP-${rand(860,891)}`, location: pick(SA_LOCATIONS) },
      { date: past(rand(120,240)), action: 'Logged vehicle check', ref: assigned?.id ?? 'N/A', location: pick(SA_LOCATIONS) },
    ],
  }
}
export const MOCK_DRIVERS = Array.from({ length: 16 }, (_, i) => makeDriver(i))

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const WAREHOUSE_STATUSES = ['operational', 'operational', 'near_full', 'operational', 'maintenance_partial', 'operational']
const W_NAMES = ['Riyadh Main Hub', 'Jeddah Central', 'Dammam East', 'Khobar Industrial', 'Jubail Complex', 'Yanbu Logistics Park']
const W_COORDS = [
  { lat: 24.7136, lng: 46.6753 }, { lat: 21.4858, lng: 39.1925 },
  { lat: 26.3927, lng: 49.9777 }, { lat: 26.2172, lng: 50.1971 },
  { lat: 26.9239, lng: 49.6558 }, { lat: 24.0889, lng: 38.0635 },
]
const ITEM_CATS = ['Heavy Equipment Parts', 'Hydraulic Components', 'Electrical Systems', 'Structural Steel', 'Safety Equipment', 'Lubricants & Fluids', 'Spare Tires', 'Tools & Machinery']

export const MOCK_WAREHOUSES = W_NAMES.map((name, i) => {
  const capacity = rand(55, 97)
  const docks    = rand(4, 12)
  const busyDocks = Math.floor(docks * (capacity / 100) * (rand(50, 90) / 100))
  return {
    id:       `WH-${String(i + 1).padStart(3, '0')}`,
    name,
    status:   WAREHOUSE_STATUSES[i],
    city:     name.split(' ')[0],
    coords:   W_COORDS[i],
    capacity,
    totalArea: rand(5000, 25000),
    usedArea:  Math.floor(rand(5000, 25000) * capacity / 100),
    totalDocks: docks,
    activeDocks: busyDocks,
    inventory: ITEM_CATS.map((cat) => ({
      category: cat,
      count:    rand(10, 500),
      value:    rand(50000, 2000000),
      lastUpdated: past(rand(1, 48)),
    })),
    totalItems: rand(200, 3000),
    totalValue: rand(500000, 15000000),
    dockSchedule: Array.from({ length: docks }, (_, d) => ({
      dock:     `Dock-${String(d + 1).padStart(2, '0')}`,
      status:   d < busyDocks ? (Math.random() > 0.5 ? 'loading' : 'unloading') : 'available',
      vehicle:  d < busyDocks ? `HX-${rand(2200, 2224)}` : null,
      shipment: d < busyDocks ? `SHP-${rand(860, 891)}` : null,
      startTime: d < busyDocks ? past(rand(0, 4))  : null,
      endTime:   d < busyDocks ? future(rand(1, 6)) : null,
    })),
    manager:   pick(['Abdullah Al-S.', 'Fatima Al-Z.', 'Khalid Al-M.']),
    alerts:    capacity > 90 ? ['Capacity critical — limit new inbound'] : capacity > 85 ? ['Near full — prioritize outbound'] : [],
  }
})

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const MAINT_TYPES     = ['Preventive PM', 'Corrective', 'Emergency', '500h Service', '1000h Major', 'Tyre Replacement', 'Hydraulic Service', 'Electrical Fault']
export const MAINT_STATUSES  = ['pending', 'approved', 'in_progress', 'completed', 'cancelled']
export const MAINT_PRIORITIES = ['low', 'medium', 'high', 'critical']
const TECHS = ['Ahmed Al-Hajri Auto', 'OEM Dealer Center', 'Riyadh Workshop', 'Al-Faris Engineering', 'Field Tech Team']

function makeMaintRequest(n) {
  const veh    = pick(MOCK_VEHICLES)
  const status = pick([...MAINT_STATUSES, 'pending', 'approved', 'in_progress'])
  const prio   = pick(MAINT_PRIORITIES)
  const type   = pick(MAINT_TYPES)
  return {
    id:          `MR-${String(3000 + n).padStart(4,'0')}`,
    vehicleId:   veh.id,
    vehicleModel: veh.model,
    type,
    status,
    priority:    prio,
    description: `${type} required — ${pick(['Scheduled per mileage', 'Operator reported issue', 'Inspection flagged', 'GPS diagnostics alert', 'Preventive schedule'])}`,
    requestedBy: pick(MOCK_DRIVERS).name,
    requestedAt: past(rand(1, 240)),
    approvedBy:  ['approved','in_progress','completed'].includes(status) ? pick(['Abdullah Al-Rashid', 'Fatima Al-Zahrani']) : null,
    approvedAt:  ['approved','in_progress','completed'].includes(status) ? past(rand(1,100)) : null,
    assignedTech: ['in_progress','completed'].includes(status) ? pick(TECHS) : null,
    scheduledDate: status !== 'pending' ? future(rand(-24, 120)) : null,
    completedAt:  status === 'completed' ? past(rand(1, 48)) : null,
    estimatedCost: rand(500, 15000),
    actualCost:    status === 'completed' ? rand(400, 16000) : null,
    parts:         ['Oil Filter', 'Air Filter', 'Hydraulic Fluid', 'Brake Pads', 'Tyres'].filter(() => Math.random() > 0.6),
    slaHours:      prio === 'critical' ? 4 : prio === 'high' ? 24 : prio === 'medium' ? 72 : 168,
    location:      veh.currentLocation,
  }
}
export const MOCK_MAINTENANCE = Array.from({ length: 28 }, (_, i) => makeMaintRequest(i))

// ─── Incidents ────────────────────────────────────────────────────────────────
export const INCIDENT_TYPES      = ['Breakdown', 'Accident', 'Delay', 'Cargo Damage', 'Near Miss', 'Traffic Incident', 'Weather Delay', 'GPS Failure']
export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical']
export const INCIDENT_STATUSES   = ['open', 'investigating', 'resolved', 'closed']

function makeIncident(n) {
  const veh  = pick(MOCK_VEHICLES)
  const drv  = pick(MOCK_DRIVERS)
  const sev  = pick([...INCIDENT_SEVERITIES, 'low', 'medium'])
  const type = pick(INCIDENT_TYPES)
  const status = pick([...INCIDENT_STATUSES, 'open', 'investigating'])
  return {
    id:           `INC-${String(4000 + n).padStart(4,'0')}`,
    type,
    severity:     sev,
    status,
    vehicleId:    veh.id,
    vehicleModel: veh.model,
    driverId:     drv.id,
    driverName:   drv.name,
    shipmentId:   `SHP-${rand(860,891)}`,
    location:     pick([...SA_LOCATIONS, 'Highway 40 km 320', 'Highway 65 km 180', 'Ring Road Exit 7']),
    description:  {
      'Breakdown':        `Vehicle stopped — ${pick(['Engine failure', 'Tyre blowout', 'Fuel system fault', 'Hydraulic failure', 'Electrical short'])}`,
      'Accident':         `Minor collision — ${pick(['Rear-end', 'Side swipe', 'Reversing impact'])} during ${pick(['loading', 'transit', 'parking'])}`,
      'Delay':            `${rand(1, 8)}h delay — ${pick(['Road closure', 'Traffic congestion', 'Border checkpoint', 'Customer not ready'])}`,
      'Cargo Damage':     `${pick(['Partial', 'Minor', 'Significant'])} cargo damage during ${pick(['loading', 'transit', 'unloading'])}`,
      'Near Miss':        `Near miss incident reported at ${pick(['depot entry', 'loading bay', 'intersection', 'fuel station'])}`,
      'Traffic Incident': `Traffic violation — ${pick(['Speeding 12km/h over', 'Illegal lane change', 'Improper signal'])}`,
      'Weather Delay':    `Delay due to ${pick(['sandstorm', 'heavy rain', 'low visibility'])} conditions`,
      'GPS Failure':      `Vehicle GPS signal lost for ${rand(15, 240)} minutes`,
    }[type] ?? 'Incident reported',
    reportedAt:  past(rand(1, 480)),
    resolvedAt:  ['resolved','closed'].includes(status) ? past(rand(1, 100)) : null,
    estimatedDelay: rand(0, 480),
    estimatedCost:  sev === 'critical' ? rand(50000, 500000) : sev === 'high' ? rand(10000, 50000) : rand(0, 10000),
    reportedBy:  drv.name,
    notes:       Math.random() > 0.6 ? 'Follow-up required with operations manager' : '',
    images:      rand(0, 4),
  }
}
export const MOCK_INCIDENTS = Array.from({ length: 22 }, (_, i) => makeIncident(i))

// ─── Routes ───────────────────────────────────────────────────────────────────
export const SA_ROUTES = [
  { id: 'RT-001', name: 'Riyadh → Jeddah',        origin: 'Riyadh Industrial City', dest: 'Jeddah Port (KAP)',    distance: 950,  estHours: 9.5,  road: 'Highway 40',  toll: true,  risk: 'low'    },
  { id: 'RT-002', name: 'Riyadh → Dammam',         origin: 'Riyadh Industrial City', dest: 'Dammam Depot D-7',    distance: 400,  estHours: 4.0,  road: 'Highway 40E', toll: false, risk: 'low'    },
  { id: 'RT-003', name: 'Riyadh → Tabuk',          origin: 'Riyadh Industrial City', dest: 'Tabuk Site 12',       distance: 1450, estHours: 13.5, road: 'Highway 65',  toll: false, risk: 'medium' },
  { id: 'RT-004', name: 'Jeddah → Makkah',         origin: 'Jeddah Port (KAP)',      dest: 'Makkah Ring Depot',   distance: 85,   estHours: 1.0,  road: 'Expressway',  toll: true,  risk: 'low'    },
  { id: 'RT-005', name: 'Dammam → Jubail',         origin: 'Dammam Depot D-7',       dest: 'Jubail Complex',      distance: 90,   estHours: 1.0,  road: 'Highway 614', toll: false, risk: 'low'    },
  { id: 'RT-006', name: 'Riyadh → Medina',         origin: 'Riyadh Industrial City', dest: 'Medina Yard',         distance: 900,  estHours: 9.0,  road: 'Highway 60',  toll: true,  risk: 'medium' },
  { id: 'RT-007', name: 'Riyadh → Neom',           origin: 'Riyadh Industrial City', dest: 'Neom Main Gate',      distance: 1800, estHours: 18.0, road: 'Hwy 65 + 80', toll: false, risk: 'high'   },
  { id: 'RT-008', name: 'Jeddah → Jizan',          origin: 'Jeddah Port (KAP)',      dest: 'Jizan Port',          distance: 650,  estHours: 7.0,  road: 'Coastal Hwy', toll: false, risk: 'medium' },
  { id: 'RT-009', name: 'Khobar → Jubail',         origin: 'Khobar Logistics Hub',   dest: 'Jubail Complex',      distance: 80,   estHours: 0.8,  road: 'Highway 614', toll: false, risk: 'low'    },
  { id: 'RT-010', name: 'Yanbu → Medina',          origin: 'Yanbu Port',             dest: 'Medina Yard',         distance: 220,  estHours: 2.5,  road: 'Highway 60',  toll: false, risk: 'low'    },
  { id: 'RT-011', name: 'Tabuk → Neom',            origin: 'Tabuk Site 12',          dest: 'Neom Main Gate',      distance: 380,  estHours: 4.5,  road: 'Highway 80',  toll: false, risk: 'high'   },
  { id: 'RT-012', name: 'Dammam → Riyadh Exp',     origin: 'Dammam Depot D-7',       dest: 'Riyadh Industrial City', distance: 400, estHours: 3.5, road: 'Highway 40E', toll: false, risk: 'low' },
]

// Assigned routes with shipment + vehicle + driver
export const MOCK_ROUTE_ASSIGNMENTS = SA_ROUTES.slice(0, 8).map((route, i) => ({
  assignmentId: `RA-${5000 + i}`,
  routeId:      route.id,
  route,
  shipmentId:   `SHP-${String(891 - i).padStart(5,'0')}`,
  vehicleId:    MOCK_VEHICLES[i % MOCK_VEHICLES.length].id,
  driverId:     MOCK_DRIVERS[i % MOCK_DRIVERS.length].id,
  driverName:   MOCK_DRIVERS[i % MOCK_DRIVERS.length].name,
  status:       pick(['active','active','completed','pending','active','in_transit']),
  startedAt:    past(rand(1, 24)),
  eta:          future(rand(1, 18)),
  actualHours:  null,
  distanceCovered: rand(0, route.distance),
  fuelConsumed:    rand(50, 400),
  notes: '',
}))
