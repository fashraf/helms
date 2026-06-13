// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]
const future = (hoursFromNow) => new Date(Date.now() + hoursFromNow * 3600000).toISOString()
const past   = (hoursAgo)     => new Date(Date.now() - hoursAgo * 3600000).toISOString()

// ─── Reference data ───────────────────────────────────────────────────────────
export const CUSTOMERS = [
  'Saudi Aramco', 'SABIC', 'Neom Project', 'Red Sea Development Co.',
  'Saudi Vision 2030', 'Maaden Mining', 'STC Group', 'Al-Rajhi Infrastructure',
  'Bechtel KSA', 'Fluor Arabia', 'Samsung Engineering', 'Consolidated Contractors',
]
export const REGIONS = ['Riyadh', 'Makkah', 'Eastern Province', 'Tabuk', 'Jizan', 'Medina', 'Hail', 'Qassim', 'Asir', 'International']
export const EQUIPMENT_TYPES = [
  'Excavator', 'Bulldozer', 'Crane', 'Grader', 'Compactor',
  'Dump Truck', 'Concrete Mixer', 'Piling Rig', 'Trencher', 'Scraper',
]
export const EQUIPMENT_MODELS = {
  Excavator: ['CAT 390F', 'Komatsu PC800', 'Hitachi EX1200', 'Liebherr R 9400'],
  Bulldozer:  ['CAT D11', 'Komatsu D475A', 'John Deere 1050K'],
  Crane:      ['Liebherr LTM 1200', 'Grove GMK5130', 'Manitowoc 18000'],
  Grader:     ['CAT 24M', 'John Deere 870G', 'Volvo G990'],
  Compactor:  ['CAT CS64B', 'Hamm HD+120i', 'Dynapac CA6000PD'],
  'Dump Truck':['Komatsu 830E', 'CAT 797F', 'Liebherr T 284'],
  'Concrete Mixer':['CIFA K33L', 'Putzmeister 38-4Z'],
  'Piling Rig':['Liebherr LB 44', 'Bauer BG 40'],
  Trencher:   ['Vermeer T1255 Commander', 'Ditch Witch RT115'],
  Scraper:    ['CAT 637K', 'Volvo C314'],
}
export const FLEET_UNITS = [
  { id: 'HX-2291', type: 'Low-bed Trailer',    capacity: '150T' },
  { id: 'HX-1103', type: 'Flatbed Trailer',    capacity: '80T'  },
  { id: 'TR-0442', type: 'Modular Transporter', capacity: '200T' },
  { id: 'CR-7781', type: 'Low-bed Trailer',    capacity: '120T' },
  { id: 'DZ-3310', type: 'Flatbed Trailer',    capacity: '60T'  },
  { id: 'TR-0221', type: 'Step-deck Trailer',  capacity: '90T'  },
  { id: 'EX-5590', type: 'Low-bed Trailer',    capacity: '180T' },
  { id: 'HX-4432', type: 'Modular Transporter', capacity: '250T' },
  { id: 'CR-2298', type: 'Flatbed Trailer',    capacity: '75T'  },
  { id: 'GR-1120', type: 'Step-deck Trailer',  capacity: '85T'  },
]
export const DRIVERS = [
  { id: 'DRV-001', name: 'Mohammed Al-Ghamdi',  phone: '+966 50 111 2233', license: 'KSA-HDL-8821', experience: '12y' },
  { id: 'DRV-002', name: 'Khalid Al-Mutairi',   phone: '+966 55 222 3344', license: 'KSA-HDL-4412', experience: '8y'  },
  { id: 'DRV-003', name: 'Faisal Al-Dosari',    phone: '+966 56 333 4455', license: 'KSA-HDL-6630', experience: '15y' },
  { id: 'DRV-004', name: 'Omar Al-Qahtani',     phone: '+966 59 444 5566', license: 'KSA-HDL-3318', experience: '6y'  },
  { id: 'DRV-005', name: 'Nasser Al-Harbi',     phone: '+966 50 555 6677', license: 'KSA-HDL-9905', experience: '10y' },
  { id: 'DRV-006', name: 'Tariq Al-Shammari',   phone: '+966 55 666 7788', license: 'KSA-HDL-2247', experience: '9y'  },
  { id: 'DRV-007', name: 'Sami Al-Otaibi',      phone: '+966 56 777 8899', license: 'KSA-HDL-7761', experience: '7y'  },
  { id: 'DRV-008', name: 'Walid Al-Zahrani',    phone: '+966 59 888 9900', license: 'KSA-HDL-5539', experience: '11y' },
]
export const STOP_TEAMS = ['Logistics Team', 'Warehouse Crew', 'QA Inspectors', 'Customs Agents', 'Site Engineers', 'Security Team']
export const SA_LOCATIONS = [
  'Riyadh Industrial City', 'Jeddah Port (KAP)', 'Dammam Depot (D-7)',
  'Khobar Logistics Hub', 'Abha Yard', 'Tabuk Site 12', 'Medina Site 9',
  'Jubail Industrial City', 'Jizan Port', 'Neom Main Site', 'SABIC Jubail Complex',
  'Yanbu Industrial City', 'Makkah Ring Road Depot', 'Hail Yard B', 'Qassim Logistics Park',
]

// ─── Stop type definitions ────────────────────────────────────────────────────
export const STOP_TYPES = {
  pickup:      { label: 'Pickup',          color: 'sky',     icon: 'Package' },
  warehouse:   { label: 'Warehouse',       color: 'purple',  icon: 'Warehouse' },
  qa:          { label: 'QA Inspection',   color: 'amber',   icon: 'ClipboardCheck' },
  customs:     { label: 'Customs',         color: 'orange',  icon: 'Shield' },
  showroom:    { label: 'Showroom',        color: 'teal',    icon: 'Building2' },
  delivery:    { label: 'Final Delivery',  color: 'emerald', icon: 'CheckCircle2' },
  waypoint:    { label: 'Waypoint',        color: 'slate',   icon: 'MapPin' },
}

export const STOP_STATUSES = {
  pending:    { label: 'Pending',     color: 'slate'   },
  active:     { label: 'In Progress', color: 'amber'   },
  completed:  { label: 'Completed',   color: 'emerald' },
  delayed:    { label: 'Delayed',     color: 'red'     },
  skipped:    { label: 'Skipped',     color: 'slate'   },
}

// ─── Route builder ────────────────────────────────────────────────────────────
function buildRoute(type, activeStopIdx, locationPool) {
  const locs = [...locationPool].sort(() => Math.random() - 0.5)

  const localStops = [
    { type: 'pickup',    team: 'Logistics Team',  requiresApproval: false },
    { type: 'warehouse', team: 'Warehouse Crew',  requiresApproval: false },
    { type: 'qa',        team: 'QA Inspectors',   requiresApproval: true  },
    { type: 'delivery',  team: 'Site Engineers',  requiresApproval: false },
  ]
  const intlStops = [
    { type: 'pickup',    team: 'Logistics Team',  requiresApproval: false },
    { type: 'warehouse', team: 'Warehouse Crew',  requiresApproval: false },
    { type: 'qa',        team: 'QA Inspectors',   requiresApproval: true  },
    { type: 'customs',   team: 'Customs Agents',  requiresApproval: true  },
    { type: 'waypoint',  team: 'Security Team',   requiresApproval: false },
    { type: 'delivery',  team: 'Site Engineers',  requiresApproval: false },
  ]
  const template = type === 'international' ? intlStops : localStops

  return template.map((s, i) => {
    let status = 'pending'
    if (i < activeStopIdx)        status = 'completed'
    else if (i === activeStopIdx) status = Math.random() > 0.2 ? 'active' : 'delayed'

    const etaOffset = (i - activeStopIdx) * rand(4, 12)
    return {
      id:              `stop-${i + 1}`,
      sequence:        i + 1,
      type:            s.type,
      name:            STOP_TYPES[s.type].label,
      location:        locs[i % locs.length] ?? SA_LOCATIONS[i],
      eta:             etaOffset < 0 ? past(-etaOffset) : future(etaOffset),
      actualArrival:   status === 'completed' ? past(rand(2, 20)) : null,
      status,
      team:            s.team,
      requiresApproval:s.requiresApproval,
      approved:        status === 'completed' ? true : (s.requiresApproval && Math.random() > 0.5),
      notes:           status === 'delayed' ? 'Delayed due to road conditions' : null,
    }
  })
}

// ─── Risk calculator ──────────────────────────────────────────────────────────
function calcRisk(s) {
  let score = 0
  if (s.type === 'international')                 score += 25
  if (s.status === 'delayed')                     score += 30
  if (s.status === 'on_hold')                     score += 20
  if (s.stops?.some((st) => st.status === 'delayed')) score += 15
  score += rand(0, 20)
  return Math.min(score, 100)
}

// ─── Shipment factory ─────────────────────────────────────────────────────────
function makeShipment(idNum, overrides = {}) {
  const type        = overrides.type ?? (Math.random() > 0.35 ? 'local' : 'international')
  const eqType      = pick(EQUIPMENT_TYPES)
  const eqModels    = EQUIPMENT_MODELS[eqType] ?? ['Generic Unit']
  const eqModel     = pick(eqModels)
  const vehicle     = pick(FLEET_UNITS)
  const driver      = pick(DRIVERS)
  const customer    = pick(CUSTOMERS)
  const region      = type === 'international' ? 'International' : pick(REGIONS.filter((r) => r !== 'International'))

  const statusPool  = overrides.status
    ? [overrides.status]
    : ['pending', 'pending', 'in_transit', 'in_transit', 'in_transit', 'delivered', 'delayed', 'on_hold']
  const status = pick(statusPool)

  const locPool = SA_LOCATIONS.filter(() => Math.random() > 0.5).slice(0, 5)
  if (locPool.length < 3) locPool.push(...SA_LOCATIONS.slice(0, 3))
  const activeStop = status === 'pending' ? 0
    : status === 'delivered' ? 99
    : rand(1, 3)

  const stops = buildRoute(type, activeStop, locPool)
  const currentStop = stops.find((s) => s.status === 'active' || s.status === 'delayed') ?? stops[0]

  const shipment = {
    id:              `SHP-${String(idNum).padStart(5, '0')}`,
    customer,
    type,
    status,
    region,
    currentLocation: currentStop?.location ?? pick(SA_LOCATIONS),
    eta:             status === 'delivered' ? past(rand(1, 48)) : future(rand(2, 72)),
    createdAt:       past(rand(12, 240)),
    updatedAt:       past(rand(0, 12)),
    equipment: {
      type:       eqType,
      model:      eqModel,
      serialNo:   `SN-${rand(10000, 99999)}`,
      weight:     rand(15, 120) + 'T',
      dimensions: `${rand(8, 18)}m × ${rand(3, 6)}m × ${rand(3, 5)}m`,
      condition:  pick(['Excellent', 'Good', 'Fair']),
      year:       rand(2018, 2024),
      owner:      customer,
    },
    vehicle: {
      ...vehicle,
      licensePlate: `${pick(['A','B','C','D'])} ${rand(1000, 9999)} ${pick(['KSA','RA','JD','DS'])}`,
    },
    driver,
    stops,
    origin:      stops[0]?.location ?? pick(SA_LOCATIONS),
    destination: stops[stops.length - 1]?.location ?? pick(SA_LOCATIONS),
    notes:       Math.random() > 0.7 ? 'Priority shipment — client SLA applies' : '',
    priority:    pick(['standard', 'standard', 'high', 'urgent']),
    ...overrides,
  }

  shipment.riskScore = calcRisk(shipment)
  return shipment
}

// ─── Generate seed data ───────────────────────────────────────────────────────
export const MOCK_SHIPMENTS = [
  makeShipment(891, { status: 'in_transit', type: 'local', customer: 'Saudi Aramco',   region: 'Eastern Province' }),
  makeShipment(890, { status: 'delivered',  type: 'local', customer: 'SABIC',          region: 'Jubail'           }),
  makeShipment(889, { status: 'pending',    type: 'local', customer: 'Neom Project',   region: 'Tabuk'            }),
  makeShipment(888, { status: 'in_transit', type: 'international', customer: 'Bechtel KSA', region: 'International' }),
  makeShipment(887, { status: 'on_hold',    type: 'local', customer: 'Maaden Mining',  region: 'Hail'             }),
  makeShipment(886, { status: 'delivered',  type: 'local', customer: 'STC Group',      region: 'Riyadh'           }),
  makeShipment(885, { status: 'delayed',    type: 'international', customer: 'Samsung Engineering', region: 'International' }),
  makeShipment(884, { status: 'in_transit', type: 'local', customer: 'Red Sea Development Co.', region: 'Makkah' }),
  makeShipment(883, { status: 'on_hold',    type: 'international', customer: 'Fluor Arabia', region: 'International' }),
  makeShipment(882, { status: 'delivered',  type: 'local', customer: 'Al-Rajhi Infrastructure', region: 'Riyadh' }),
  ...Array.from({ length: 20 }, (_, i) => makeShipment(881 - i)),
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────
export const getShipmentById = (id) => MOCK_SHIPMENTS.find((s) => s.id === id)

export const filterShipments = ({ search, status, region, type } = {}) => {
  return MOCK_SHIPMENTS.filter((s) => {
    if (search  && !s.id.toLowerCase().includes(search.toLowerCase()) &&
                   !s.customer.toLowerCase().includes(search.toLowerCase())) return false
    if (status  && status  !== 'all' && s.status  !== status)  return false
    if (region  && region  !== 'all' && s.region  !== region)  return false
    if (type    && type    !== 'all' && s.type    !== type)     return false
    return true
  })
}

// ─── Delay simulation ─────────────────────────────────────────────────────────
export const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))
export const fetchShipments = async (filters) => { await delay(300); return filterShipments(filters) }
export const fetchShipment  = async (id)      => { await delay(200); return getShipmentById(id) }
