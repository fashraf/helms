// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

// ─── Reference data ───────────────────────────────────────────────────────────
export const INCOTERMS = [
  { id: 'EXW', label: 'EXW — Ex Works'              },
  { id: 'FCA', label: 'FCA — Free Carrier'          },
  { id: 'FOB', label: 'FOB — Free On Board'         },
  { id: 'CIF', label: 'CIF — Cost Insurance Freight'},
  { id: 'DAP', label: 'DAP — Delivered At Place'    },
  { id: 'DDP', label: 'DDP — Delivered Duty Paid'   },
  { id: 'CFR', label: 'CFR — Cost & Freight'        },
  { id: 'CIP', label: 'CIP — Carriage & Insurance Paid' },
]

export const SHIPMENT_MODES = [
  { id: 'air',  label: 'Air Freight',      icon: '✈️' },
  { id: 'sea',  label: 'Sea Freight',      icon: '🚢' },
  { id: 'land', label: 'Land / Road',      icon: '🚛' },
  { id: 'rail', label: 'Rail',             icon: '🚂' },
  { id: 'multi',label: 'Multi-modal',      icon: '🔄' },
]

export const CURRENCIES = [
  { id: 'SAR', label: 'SAR — Saudi Riyal'    },
  { id: 'USD', label: 'USD — US Dollar'      },
  { id: 'EUR', label: 'EUR — Euro'            },
  { id: 'INR', label: 'INR — Indian Rupee'    },
  { id: 'AED', label: 'AED — UAE Dirham'      },
  { id: 'GBP', label: 'GBP — British Pound'  },
]

export const FREIGHT_TERMS    = ['Prepaid', 'Collect', 'Third Party']
export const PAYMENT_TERMS    = ['Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Letter of Credit', 'Advance Payment']
export const DIMENSION_UNITS  = ['CM', 'M', 'INCH', 'FT']
export const WEIGHT_UNITS     = ['KG', 'LB', 'TON']
export const CARGO_TYPES      = ['General', 'Fragile', 'Hazardous', 'Heavy Equipment', 'Oversized', 'Temperature-controlled']
export const SHIPMENT_TYPES_LOCAL = ['New Material', 'Returned Material']
export const TRANSPORTER_ASSIGN   = [
  { id: 'rfq',         label: 'Request Quotations (RFQ)' },
  { id: 'contracted',  label: 'Contracted Supplier'      },
]

export const REQUESTED_EQUIPMENT = [
  { id: 'flatbed',     label: 'Flatbed Trailer',     icon: '🚛' },
  { id: 'lowbed',      label: 'Low Bed Trailer',     icon: '🚚' },
  { id: 'crane',       label: 'Crane',                icon: '🏗️' },
  { id: 'forklift',    label: 'Forklift',            icon: '🚜' },
  { id: 'escort',      label: 'Escort Vehicle',       icon: '🚨' },
  { id: 'modular',     label: 'Modular Transporter', icon: '🚛' },
  { id: 'stepdeck',    label: 'Step-deck Trailer',   icon: '🚚' },
  { id: 'reefer',      label: 'Reefer Trailer',       icon: '❄️' },
]

export const FINAL_DEST_TYPES = [
  { id: 'warehouse',    label: 'Warehouse'    },
  { id: 'project_site', label: 'Project Site' },
  { id: 'other',        label: 'Other'        },
]

export const SHIPMENT_STATUSES_INTL = {
  draft:             { label: 'Draft',                cls: 'text-slate-500 bg-slate-50 border-slate-200'        },
  pending_approval:  { label: 'Pending Approval',     cls: 'text-blue-700 bg-blue-50 border-blue-200'           },
  submitted:         { label: 'Submitted',            cls: 'text-blue-600 bg-blue-50 border-blue-200'           },
  assigned:          { label: 'Vendor Assigned',      cls: 'text-indigo-600 bg-indigo-50 border-indigo-200'     },
  pickup_scheduled:  { label: 'Pickup Scheduled',     cls: 'text-indigo-600 bg-indigo-50 border-indigo-200'     },
  in_progress:       { label: 'In Transit',           cls: 'text-amber-600 bg-amber-50 border-amber-200'        },
  dispatched:        { label: 'Dispatched',           cls: 'text-amber-600 bg-amber-50 border-amber-200'        },
  customs:           { label: 'At Customs',           cls: 'text-orange-600 bg-orange-50 border-orange-200'     },
  customs_clearance: { label: 'Customs Clearance',    cls: 'text-orange-600 bg-orange-50 border-orange-200'     },
  pending_customs:   { label: 'Pending Customs',      cls: 'text-orange-600 bg-orange-50 border-orange-200'     },
  delivered:         { label: 'Delivered',            cls: 'text-emerald-600 bg-emerald-50 border-emerald-200'  },
  completed:         { label: 'Completed',            cls: 'text-emerald-700 bg-emerald-50 border-emerald-300'  },
  closed:            { label: 'Closed',               cls: 'text-emerald-700 bg-emerald-50 border-emerald-300'  },
  cancelled:         { label: 'Cancelled',            cls: 'text-red-600 bg-red-50 border-red-200'              },
}

export const SHIPMENT_STATUSES_LOCAL = {
  draft:      { label: 'Draft',       cls: 'text-slate-500 bg-slate-50 border-slate-200' },
  assigned:   { label: 'Assigned',    cls: 'text-blue-600 bg-blue-50 border-blue-200'    },
  dispatched: { label: 'Dispatched',  cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  delivered:  { label: 'Delivered',   cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  closed:     { label: 'Closed',      cls: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  cancelled:  { label: 'Cancelled',   cls: 'text-red-600 bg-red-50 border-red-200'       },
}

export const LOCATION_MASTER = [
  { id: 'LOC-001', name: 'Riyadh Industrial City',    city: 'Riyadh',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=24.7136,46.6753', description:'Primary industrial hub in central KSA — heavy equipment, construction, manufacturing.' },
  { id: 'LOC-002', name: 'Jeddah Port (KAP)',         city: 'Jeddah',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=21.4858,39.1925', description:'King Abdulaziz Port — main sea gateway on the Red Sea coast.' },
  { id: 'LOC-003', name: 'Dammam Depot D-7',          city: 'Dammam',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=26.3927,49.9777', description:'Eastern Province logistics depot — Saudi Aramco corridor.' },
  { id: 'LOC-004', name: 'Khobar Logistics Hub',      city: 'Khobar',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=26.2172,50.1971', description:'Cross-dock and transhipment for Eastern Province operations.' },
  { id: 'LOC-005', name: 'Jubail Industrial City',    city: 'Jubail',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=27.0046,49.6622', description:'Petrochemical and SABIC heavy-industry zone.' },
  { id: 'LOC-006', name: 'Yanbu Industrial City',     city: 'Yanbu',     country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=24.0867,38.0608', description:'Red Sea industrial city — refining and petrochemicals.' },
  { id: 'LOC-007', name: 'Tabuk Site 12 (NEOM)',      city: 'Tabuk',     country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=28.3998,36.5700', description:'NEOM mega-project construction site cluster.' },
  { id: 'LOC-008', name: 'Hail Yard B',               city: 'Hail',      country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=27.5219,41.6907', description:'Northern KSA equipment yard — link to Iraq/Jordan corridor.' },
  { id: 'LOC-009', name: 'Makkah Depot',              city: 'Makkah',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=21.3891,39.8579', description:'Western depot serving Holy City projects.' },
  { id: 'LOC-010', name: 'Medina Site 9',             city: 'Medina',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=24.4709,39.6111', description:'Medina region site — infrastructure and civil works.' },
  { id: 'LOC-011', name: 'SABIC Jubail Complex',      city: 'Jubail',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=27.0046,49.6622', description:'SABIC dedicated complex — petrochemical and polymers.' },
  { id: 'LOC-018', name: 'QA Holding Warehouse',      city: 'Riyadh',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=24.7136,46.6753', description:'Quality inspection warehouse — pre-dispatch hold area.' },
  { id: 'LOC-019', name: 'Temporary Storage Zone A',  city: 'Dammam',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=26.3927,49.9777', description:'Temp storage zone — transit holding for staged dispatch.' },
  { id: 'LOC-020', name: 'Customs Bonded Yard',       city: 'Jeddah',    country: 'SA', type:'local',         mapLink:'https://maps.google.com/?q=21.4858,39.1925', description:'Customs bonded yard — duty-suspended cargo holding.' },
  { id: 'LOC-012', name: 'Mumbai Port (JNPT)',        city: 'Mumbai',    country: 'IN', type:'international', mapLink:'https://maps.google.com/?q=18.9389,72.9522', description:'Jawaharlal Nehru Port Trust — India\'s largest container port.' },
  { id: 'LOC-013', name: 'Delhi IGI Cargo Terminal',  city: 'Delhi',     country: 'IN', type:'international', mapLink:'https://maps.google.com/?q=28.5562,77.1000', description:'IGI Airport cargo terminal — main air-freight gateway.' },
  { id: 'LOC-014', name: 'Dubai Jebel Ali Port',      city: 'Dubai',     country: 'AE', type:'international', mapLink:'https://maps.google.com/?q=24.9806,55.0590', description:'Largest port in the Middle East — strategic Gulf hub.' },
  { id: 'LOC-015', name: 'Hamburg Port',              city: 'Hamburg',   country: 'DE', type:'international', mapLink:'https://maps.google.com/?q=53.5511,9.9937',  description:'Germany\'s largest port — European gateway.' },
  { id: 'LOC-016', name: 'Singapore Port',            city: 'Singapore', country: 'SG', type:'international', mapLink:'https://maps.google.com/?q=1.2645,103.8200', description:'Singapore Port — Asia-Pacific transhipment hub.' },
  { id: 'LOC-017', name: 'Kuwait City Port',          city: 'Kuwait',    country: 'KW', type:'international', mapLink:'https://maps.google.com/?q=29.3759,47.9774', description:'Kuwait Shuwaikh Port — northern Gulf gateway.' },
]

// ─── ID generators ────────────────────────────────────────────────────────────
let _intlCounter  = 4724
let _localCounter = 2500
function pad2(n) { return String(n).padStart(2, '0') }

export function nextShipmentId(type) {
  const d = new Date()
  const yy = pad2(d.getFullYear() % 100)
  const mm = pad2(d.getMonth() + 1)
  if (type === 'international') return `ITS-${yy}-${mm}-${++_intlCounter}`
  return `LTS-${yy}-${mm}-${++_localCounter}`
}

// ─── Shareable Secret Key ────────────────────────────────────────────────
// Format: GS-INT-XXXX or GS-LCL-XXXX where XXXX is 4 random uppercase chars.
// This is the key the dispatcher shares with the assigned vendor as a
// confidential reference distinct from the internal shipment ID.
const _secretSeen = new Set()
export function nextShipmentSecretKey(type = 'international') {
  const prefix = type === 'international' ? 'GS-INT' : 'GS-LCL'
  // Avoid collision against any already-issued key
  for (let tries = 0; tries < 50; tries++) {
    let body = ''
    // 4 chars from the unambiguous alphabet (no O/0/I/1)
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 4; i++) body += alphabet[Math.floor(Math.random() * alphabet.length)]
    const key = `${prefix}-${body}`
    if (!_secretSeen.has(key)) {
      _secretSeen.add(key)
      return key
    }
  }
  // Fallback timestamp suffix on the freak chance of repeated collisions
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}`
}

// ─── Build a sample empty Origin → Destinations tree ─────────────────────────
export function emptyRouteTree() {
  return {
    origin: { locationId: null, contact: '', address: '', notes: '' },
    stops:  [],
  }
}

// ─── Build a sample destination stop ──────────────────────────────────────────
export function newStop() {
  return {
    id:         `STP-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    locationId: null,
    type:       'transit',
    eta:        '',
    contact:    '',
    address:    '',
    notes:      '',
  }
}

// New origin row (multi-origin support in create wizards)
export function newOrigin() {
  return {
    id:         `ORG-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    locationId: null,
    contact:    '',
    mobile:     '',
    email:      '',
    address:    '',
    landmark:   '',
    mapLink:    '',
    readyDate:  '',
    notes:      '',
  }
}

// ─── Empty cargo / item rows ──────────────────────────────────────────────────
export function newCargoRow() {
  return {
    id:         `CRG-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name:       '',
    packages:   1,
    weight:     '',
    weightUnit: 'KG',
    volume:     '',
    length:     '',
    width:      '',
    height:     '',
    unit:       'CM',
    notes:      '',
    active:     true,
  }
}

export function newItemRow() {
  return {
    id:          `ITM-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    materialCode:'',
    hsCode:      '',
    description: '',
    quantity:    1,
    unit:        'EA',
    origin:      'SA',
    notes:       '',
    active:      true,
  }
}

// ─── Build seed shipments ─────────────────────────────────────────────────────
const SAMPLE_VENDORS = [
  { id: 'VEN-1001', name: 'FedEx Saudi Arabia',  country: 'SA', services: ['air','land'] },
  { id: 'VEN-1004', name: 'Vistara Cargo Ltd',    country: 'IN', services: ['air'] },
  { id: 'VEN-1005', name: 'Maersk Gulf',          country: 'AE', services: ['sea','land'] },
  { id: 'VEN-1006', name: 'Bahri Logistics',      country: 'SA', services: ['sea','land'] },
  { id: 'VEN-1003', name: 'India Post Logistics', country: 'IN', services: ['land'] },
]

const PROJECTS_REF = [
  { id: 'PRJ-00001', name: 'ARAMCO Expansion Project' },
  { id: 'PRJ-00002', name: 'Site A Installation'      },
  { id: 'PRJ-00003', name: 'Jubail Pipeline Upgrade'   },
  { id: 'PRJ-00004', name: 'Neom Logistics Hub'        },
  { id: 'PRJ-00007', name: 'SABIC Petrochem Phase 3'   },
]

const OWNERS = ['EMP-00001','EMP-00002','EMP-00003','EMP-00008']

// Build int'l shipments
const intlSeeds = [
  { po: 'PO-2026-001', vendor: 'VEN-1004', incoterm: 'CIF', mode: 'air',  origin: 'IN', destLoc: 'LOC-001', project: 'PRJ-00001', status: 'in_progress' },
  { po: 'PO-2026-002', vendor: 'VEN-1005', incoterm: 'FOB', mode: 'sea',  origin: 'AE', destLoc: 'LOC-002', project: 'PRJ-00007', status: 'submitted'   },
  { po: 'PO-2026-003', vendor: 'VEN-1001', incoterm: 'DAP', mode: 'air',  origin: 'SA', destLoc: 'LOC-013', project: 'PRJ-00003', status: 'completed'   },
  { po: 'PO-2026-004', vendor: 'VEN-1003', incoterm: 'CIF', mode: 'land', origin: 'IN', destLoc: 'LOC-001', project: 'PRJ-00002', status: 'draft'       },
  { po: 'PO-2026-005', vendor: 'VEN-1005', incoterm: 'DDP', mode: 'sea',  origin: 'AE', destLoc: 'LOC-011', project: 'PRJ-00007', status: 'in_progress' },
  { po: 'PO-2026-006', vendor: 'VEN-1006', incoterm: 'FOB', mode: 'sea',  origin: 'SA', destLoc: 'LOC-014', project: 'PRJ-00004', status: 'in_progress' },
]

const localSeeds = [
  { project: 'PRJ-00001', type: 'New Material',      mode: 'contracted', vendor: 'VEN-1001', origin: 'LOC-001', dest: 'LOC-007', status: 'dispatched' },
  { project: 'PRJ-00002', type: 'New Material',      mode: 'rfq',         vendor: null,       origin: 'LOC-003', dest: 'LOC-005', status: 'assigned'   },
  { project: 'PRJ-00003', type: 'Returned Material', mode: 'contracted', vendor: 'VEN-1006', origin: 'LOC-005', dest: 'LOC-001', status: 'delivered'  },
  { project: 'PRJ-00004', type: 'New Material',      mode: 'contracted', vendor: 'VEN-1001', origin: 'LOC-002', dest: 'LOC-007', status: 'closed'     },
  { project: 'PRJ-00007', type: 'New Material',      mode: 'rfq',         vendor: null,       origin: 'LOC-003', dest: 'LOC-011', status: 'draft'      },
]

const INTL_SHIPMENTS_BASE = intlSeeds.map((seed, i) => {
  const id = `ITS-26-06-${4700 + i}`
  return {
    id,
    type: 'international',
    poNumber:  seed.po,
    supplier:  seed.vendor,
    incoterm:  seed.incoterm,
    mode:      seed.mode,
    project:   seed.project,
    owner:     pick(OWNERS),
    status:    seed.status,
    originCountry: seed.origin,
    originCity:    seed.origin === 'IN' ? 'Mumbai' : seed.origin === 'AE' ? 'Dubai' : 'Riyadh',
    pickupLocation: `https://maps.google.com/?q=${seed.origin}`,
    readyDate:      future(rand(48, 480)),
    deliveryLocation: seed.destLoc,
    finalDestType:    pick(['warehouse','project_site']),
    finalDestNotes:   '',
    route: {
      origin: { locationId: seed.destLoc, contact: 'Logistics Lead', address: '', notes: '' },
      stops:  [],
    },
    estValue:  rand(50, 800) * 1000,
    currency:  'SAR',
    insuranceValue:    rand(1000, 50000),
    insuranceRequired: true,
    freightTerms:      pick(FREIGHT_TERMS),
    paymentTerms:      pick(PAYMENT_TERMS),
    cargo: [
      { id: `CRG-${id}-1`, name: 'Generator Set', packages: 5, weight: 2500, weightUnit: 'KG', volume: 12, length: 300, width: 180, height: 200, unit: 'CM', notes: 'Heavy lift required', active: true },
      { id: `CRG-${id}-2`, name: 'Spare Parts',   packages: 12, weight: 850, weightUnit: 'KG', volume: 6,  length: 120, width: 80, height: 100, unit: 'CM', notes: '', active: true },
    ],
    items: [
      { id: `ITM-${id}-1`, materialCode: 'SAP-1001', hsCode: '850110', description: 'Generator Set 500kVA',   quantity: 5, unit: 'EA', origin: 'IN', notes: '', active: true },
      { id: `ITM-${id}-2`, materialCode: 'SAP-2003', hsCode: '730890', description: 'Mounting frame steel',   quantity: 12,unit: 'EA', origin: 'IN', notes: '', active: true },
    ],
    documents: [
      { id: 'D1', type: 'PO',                fileName: 'PO-2026.pdf',           uploadedAt: past(rand(50, 200)), version: 1, status: 'valid' },
      { id: 'D2', type: 'Commercial Invoice', fileName: 'invoice.pdf',           uploadedAt: past(rand(20, 80)),  version: 1, status: 'valid' },
      { id: 'D3', type: 'Packing List',       fileName: 'packing-list.pdf',      uploadedAt: past(rand(20, 80)),  version: 1, status: 'valid' },
    ],
    createdAt: past(rand(48, 720)),
    createdBy: 'Khalid Salman',
    updatedAt: past(rand(1, 24)),
  }
})

const LOCAL_SHIPMENTS_BASE = localSeeds.map((seed, i) => {
  const id = `LTS-26-06-${2400 + i}`
  return {
    id,
    type: 'local',
    project:   seed.project,
    shipmentType: seed.type,
    transporterMode: seed.mode,
    supplier:  seed.vendor,
    operatedBy: pick(OWNERS),
    reference: seed.type === 'Returned Material' ? `OLD-2024-${rand(100,999)}` : '',
    poNumbers: [`PO-${rand(2024,2026)}-${rand(100,999)}`, `PO-${rand(2024,2026)}-${rand(100,999)}`],
    status: seed.status,
    route: {
      origin: { locationId: seed.origin, contact: 'Warehouse Supervisor', address: '', notes: '' },
      stops:  [
        { id: `STP-${id}-1`, locationId: 'LOC-018', type: 'qa',       eta: future(24),  contact: 'QA Inspector',      address: '', notes: 'QA inspection required' },
        { id: `STP-${id}-2`, locationId: 'LOC-019', type: 'transit',  eta: future(48),  contact: 'Site Coordinator',  address: '', notes: 'Temporary storage'      },
        { id: `STP-${id}-3`, locationId: seed.dest,  type: 'final',    eta: future(72),  contact: 'Site Manager',      address: '', notes: 'Final delivery'        },
      ],
    },
    shipmentDate:       past(rand(24, 200)),
    eta:                future(rand(4, 96)),
    actualDeliveryDate: seed.status === 'delivered' || seed.status === 'closed' ? past(rand(1, 48)) : null,
    deliveryNoteNumber: seed.status !== 'draft' ? `DN-${rand(10000, 99999)}` : '',
    requestedEquipment: ['lowbed','escort'],
    cargoType:    'Heavy Equipment',
    cargoDesc:    'Construction equipment for site mobilization',
    specialInstr: 'Requires crane on arrival · Handle with care',
    documents: [
      { id: 'D1', type: 'Delivery Note',  fileName: 'DN-' + id + '.pdf', uploadedAt: past(rand(20, 80)), version: 1, status: 'valid' },
      { id: 'D2', type: 'Gate Pass',       fileName: 'GP-' + id + '.pdf', uploadedAt: past(rand(20, 80)), version: 1, status: 'valid' },
      { id: 'D3', type: 'Transport Permit',fileName: 'TP-' + id + '.pdf', uploadedAt: past(rand(20, 80)), version: 1, status: 'valid' },
    ],
    createdAt: past(rand(48, 720)),
    createdBy: 'Khalid Salman',
    updatedAt: past(rand(1, 24)),
  }
})

// ─── Timeline events (horizontal) ─────────────────────────────────────────────
export function buildShipmentTimeline(shipment) {
  const events = []
  events.push({
    id: 'E1', type: 'created', label: 'Shipment Created',
    actor: shipment.createdBy, date: shipment.createdAt, completed: true,
  })
  if (['submitted','in_progress','assigned','dispatched','delivered','closed','completed'].includes(shipment.status)) {
    events.push({
      id: 'E2', type: 'submitted', label: shipment.type === 'international' ? 'Submitted for Approval' : 'Vendor Assigned',
      actor: shipment.createdBy, date: new Date(new Date(shipment.createdAt).getTime() + 3600000).toISOString(), completed: true,
    })
  }
  if (['in_progress','dispatched','delivered','closed','completed'].includes(shipment.status)) {
    events.push({
      id: 'E3', type: 'in_progress',
      label: shipment.type === 'international' ? 'Customs Clearance Started' : 'Dispatched',
      actor: 'Logistics Team', date: past(72), completed: true, duration: '3h 22m',
    })
  }
  if (['delivered','closed','completed'].includes(shipment.status)) {
    events.push({
      id: 'E4', type: 'delivered', label: 'Delivered to Destination',
      actor: 'Site Receiving Team', date: shipment.actualDeliveryDate ?? past(12), completed: true,
    })
  }
  if (['closed','completed'].includes(shipment.status)) {
    events.push({
      id: 'E5', type: 'closed', label: 'Shipment Closed', actor: shipment.createdBy, date: past(2), completed: true,
    })
  } else {
    // Show pending next step
    const nextLabel = shipment.status === 'draft'      ? 'Awaiting Submission'
                    : shipment.status === 'submitted'  ? 'Awaiting Approval'
                    : shipment.status === 'in_progress'? (shipment.type === 'international' ? 'Awaiting Customs Clearance' : 'Awaiting Delivery')
                    : shipment.status === 'assigned'   ? 'Awaiting Dispatch'
                    : shipment.status === 'dispatched' ? 'In Transit'
                    : 'Pending'
    events.push({ id: 'EN', type: 'pending', label: nextLabel, actor: null, date: null, completed: false })
  }
  return events
}

// ─── Realistic Historical Dataset (for AI learning) ──────────────────────────
// Vendors have characteristic delay profiles so vendor risk scoring works.
// Routes have characteristic delay profiles so route performance works.
const VENDOR_DELAY_PROFILE = {
  'VEN-1001': { mean: -0.5, jitter: 1.5 },  // Reliable
  'VEN-1003': { mean: 1.2,  jitter: 2.0 },  // Slight delay
  'VEN-1004': { mean: 3.5,  jitter: 2.5 },  // Often late
  'VEN-1005': { mean: 0.0,  jitter: 1.8 },  // On time
  'VEN-1006': { mean: 4.8,  jitter: 3.0 },  // High risk
  'VEN-1007': { mean: -0.2, jitter: 1.0 },  // Very reliable
}
const ROUTE_EXTRA_DELAY = {
  // origin → destLoc: extra customs/border delay
  'IN-LOC-001': 1.5,  // India → Riyadh
  'AE-LOC-002': 0.8,  // UAE → Jeddah
  'AE-LOC-011': 1.0,  // UAE → Neom
  'SA-LOC-013': 0,    // Domestic Aramco
  'SA-LOC-014': 0.5,  // KSA → Doha (export)
  'KW-LOC-001': 2.0,  // Kuwait → Riyadh
  'BH-LOC-002': 0.6,  // Bahrain → Jeddah
  'OM-LOC-001': 2.4,  // Oman → Riyadh
}

function gaussian(mean, jitter) {
  // Box-Muller style approximation
  const u1 = Math.random(), u2 = Math.random()
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.round((mean + z * jitter) * 10) / 10
}

// Generate 30 historical international shipments
const HISTORICAL_INTL_VENDORS = ['VEN-1001','VEN-1003','VEN-1004','VEN-1005','VEN-1006','VEN-1007']
const HISTORICAL_INTL_ORIGINS = [
  { country: 'AE', city: 'Dubai',  dest: 'LOC-001' },  // Dubai → Riyadh
  { country: 'AE', city: 'Dubai',  dest: 'LOC-002' },  // Dubai → Jeddah
  { country: 'IN', city: 'Mumbai', dest: 'LOC-001' },  // Mumbai → Riyadh
  { country: 'IN', city: 'Mumbai', dest: 'LOC-002' },  // Mumbai → Jeddah
  { country: 'KW', city: 'Kuwait City', dest: 'LOC-001' },  // Kuwait → Riyadh
  { country: 'BH', city: 'Manama', dest: 'LOC-002' },  // Bahrain → Jeddah
  { country: 'OM', city: 'Muscat', dest: 'LOC-001' },  // Oman → Riyadh
  { country: 'SA', city: 'Riyadh', dest: 'LOC-014' },  // KSA → Doha
  { country: 'SA', city: 'Jeddah', dest: 'LOC-011' },  // KSA → Neom
  { country: 'AE', city: 'Dubai',  dest: 'LOC-011' },  // Dubai → Neom
]

export const HISTORICAL_INTL = Array.from({ length: 30 }, (_, i) => {
  const route   = HISTORICAL_INTL_ORIGINS[i % HISTORICAL_INTL_ORIGINS.length]
  const vendor  = HISTORICAL_INTL_VENDORS[i % HISTORICAL_INTL_VENDORS.length]
  const profile = VENDOR_DELAY_PROFILE[vendor] ?? { mean: 0, jitter: 2 }
  const baseDelay = gaussian(profile.mean, profile.jitter)
  const extra     = ROUTE_EXTRA_DELAY[`${route.country}-${route.dest}`] ?? 0
  const delayDays = Math.max(-3, Math.round((baseDelay + extra) * 10) / 10)

  // ETA was N days ago, actual delivery offset by delayDays
  const daysBack       = 30 + i * 8  // spread across last ~270 days
  const etaTime        = Date.now() - daysBack * 86400000
  const actualTime     = etaTime + delayDays * 86400000
  const createdAtTime  = etaTime - 14 * 86400000
  const id             = `ITS-25-${String(Math.floor(i / 5) + 1).padStart(2,'0')}-${5000 + i}`

  return {
    id, type: 'international',
    poNumber:  `PO-HIST-${1000 + i}`,
    supplier:  vendor, vendor,
    incoterm:  pick(['CIF','FOB','DAP','DDP']),
    mode:      pick(['air','sea','land']),
    project:   pick(['PRJ-00001','PRJ-00002','PRJ-00003','PRJ-00004','PRJ-00007']),
    owner:     pick(OWNERS),
    status:    delayDays > 5 ? 'completed' : 'delivered',
    originCountry: route.country,
    originCity:    route.city,
    pickupLocation:`https://maps.google.com/?q=${route.city}`,
    readyDate:     new Date(createdAtTime).toISOString(),
    deliveryLocation: route.dest,
    destinations: [{ id: `DST-HIST-${i}`, country: route.dest.startsWith('LOC-01') ? 'SA' : 'SA', address: '', mapLink: '', landmark: '', contact: 'Receiver', email: 'a@b.c', mobile: '+966500000000', notes: '' }],
    finalDestType: 'warehouse',
    route: { origin: { locationId: route.dest, contact: 'Logistics Lead', address: '', notes: '' }, stops: [] },
    estValue:  rand(50, 800) * 1000,
    currency:  'SAR',
    insuranceValue:    rand(5000, 80000),
    insuranceRequired: true,
    cargoType:      pick(['Heavy Equipment','Electronics','Chemicals','Construction Materials','Spare Parts']),
    specialHandling: i % 7 === 0 ? 'Fragile · Handle with care' : i % 11 === 0 ? 'Hazardous Material' : '',
    cargo: [{ id:`CRG-H${i}-1`, name:'Cargo lot', packages: rand(2, 20), weight: rand(500, 8000), weightUnit:'KG', volume: rand(5, 60), length: 200, width: 150, height: 180, unit:'CM', hazardous: i % 11 === 0, specialHandling: i % 7 === 0 ? 'Fragile' : '', notes:'', active:true }],
    items: [],
    documents: [
      { id:'D1', type:'PO',                fileName:'po.pdf',      uploadedAt: new Date(createdAtTime).toISOString(), version:1, status:'valid' },
      { id:'D2', type:'Commercial Invoice', fileName:'inv.pdf',     uploadedAt: new Date(createdAtTime + 86400000).toISOString(), version:1, status:'valid' },
      { id:'D3', type:'Packing List',       fileName:'pl.pdf',      uploadedAt: new Date(createdAtTime + 86400000).toISOString(), version:1, status:'valid' },
    ],
    eta:                new Date(etaTime).toISOString(),
    actualDeliveryDate: new Date(actualTime).toISOString(),
    createdAt: new Date(createdAtTime).toISOString(),
    createdBy: 'Khalid Salman',
    updatedAt: new Date(actualTime).toISOString(),
  }
})

// Generate 25 historical local shipments
const HISTORICAL_LOCAL_VENDORS = ['VEN-1001','VEN-1003','VEN-1004','VEN-1006','VEN-1007']
const HISTORICAL_LOCAL_ROUTES = [
  { origin:'LOC-001', dest:'LOC-007' },  // Riyadh → Jubail
  { origin:'LOC-001', dest:'LOC-002' },  // Riyadh → Jeddah
  { origin:'LOC-001', dest:'LOC-011' },  // Riyadh → Neom
  { origin:'LOC-002', dest:'LOC-001' },  // Jeddah → Riyadh
  { origin:'LOC-003', dest:'LOC-007' },  // Dammam → Jubail
  { origin:'LOC-003', dest:'LOC-005' },  // Dammam → Yanbu
  { origin:'LOC-005', dest:'LOC-001' },  // Yanbu → Riyadh
  { origin:'LOC-007', dest:'LOC-011' },  // Jubail → Neom
]
export const HISTORICAL_LOCAL = Array.from({ length: 25 }, (_, i) => {
  const route   = HISTORICAL_LOCAL_ROUTES[i % HISTORICAL_LOCAL_ROUTES.length]
  const vendor  = HISTORICAL_LOCAL_VENDORS[i % HISTORICAL_LOCAL_VENDORS.length]
  const profile = VENDOR_DELAY_PROFILE[vendor] ?? { mean: 0, jitter: 2 }
  const delayDays = Math.max(-2, Math.round(gaussian(profile.mean * 0.7, profile.jitter * 0.7) * 10) / 10)

  const daysBack      = 20 + i * 10
  const etaTime       = Date.now() - daysBack * 86400000
  const actualTime    = etaTime + delayDays * 86400000
  const createdAtTime = etaTime - 5 * 86400000
  const id            = `LTS-25-${String(Math.floor(i / 4) + 1).padStart(2,'0')}-${3000 + i}`

  return {
    id, type: 'local',
    project:   pick(['PRJ-00001','PRJ-00002','PRJ-00003','PRJ-00004','PRJ-00007']),
    shipmentType: pick(['New Material','Returned Material']),
    transporterMode: pick(['contracted','rfq']),
    supplier:  vendor, vendor,
    operatedBy: pick(OWNERS),
    reference: '',
    poNumbers: [`PO-${rand(2024,2026)}-${rand(100,999)}`],
    status:    delayDays > 4 ? 'closed' : 'delivered',
    route: {
      origin: { locationId: route.origin, contact: 'Warehouse Supervisor', address:'', mapLink:'', landmark:'', email:'', mobile:'', notes:'' },
      stops:  [{ id:`STP-H${i}-1`, locationId: route.dest, type:'final', eta: new Date(etaTime).toISOString(), contact:'Site Manager', address:'', mapLink:'', landmark:'', email:'', mobile:'+966500000000', notes:'Final delivery' }],
    },
    shipmentDate:       new Date(createdAtTime).toISOString(),
    eta:                new Date(etaTime).toISOString(),
    actualDeliveryDate: new Date(actualTime).toISOString(),
    deliveryNoteNumber: `DN-${rand(10000, 99999)}`,
    cargoType:    pick(['Heavy Equipment','Construction Materials','Spare Parts','Pipes']),
    cargoDesc:    'Site mobilization cargo',
    cargo: [{ id:`CRG-H${i}-1`, length: rand(100,400), width: rand(100,250), height: rand(100,250), weight: rand(500, 8000), quantity: rand(1, 15), packageType:'Pallet', hazardous: false, specialHandling:'' }],
    insuranceRequired: i % 3 === 0, insuranceValue: i % 3 === 0 ? rand(5000, 50000) : '',
    waitingRequired:   i % 5 === 0, waitingAmount:   i % 5 === 0 ? rand(500, 5000)  : '',
    documents: [
      { id:'D1', type:'Delivery Note',  fileName: 'DN-' + id + '.pdf', uploadedAt: new Date(createdAtTime).toISOString(), version:1, status:'valid' },
    ],
    createdAt: new Date(createdAtTime).toISOString(),
    createdBy: 'Khalid Salman',
    updatedAt: new Date(actualTime).toISOString(),
  }
})

// ─── Augment local shipments with quotes / checklist / dual-status / invoice ──
const LOCAL_VENDOR_POOL = ['VEN-1001','VEN-1003','VEN-1004','VEN-1006','VEN-1007']

function buildLocalAugment(s) {
  const isDelivered = ['delivered','closed','completed'].includes(s.status)
  const isInTransit = ['in_progress','dispatched'].includes(s.status)
  const isAssigned  = ['assigned','pickup_scheduled'].includes(s.status)
  const isSubmitted = ['submitted','pending_approval'].includes(s.status)
  const isDraft     = s.status === 'draft'

  // ── Multi-origin support (default to 1; ~30% of shipments get 2 origins) ──
  const NAMES   = ['Khalid Al-Rashid','Ahmed Mohammed','Fahad Ibrahim','Saud Al-Otaibi','Omar Bin Salim','Rakan Al-Harbi']
  const numOrigins = (Math.random() < 0.3 && !isDraft) ? 2 : 1
  const localLocs = ['LOC-001','LOC-002','LOC-003','LOC-004','LOC-005','LOC-006','LOC-008','LOC-011']
  const originLocs = [s.route?.origin?.locationId ?? localLocs[Math.floor(Math.random() * localLocs.length)]]
  while (originLocs.length < numOrigins) {
    const cand = localLocs[Math.floor(Math.random() * localLocs.length)]
    if (!originLocs.includes(cand)) originLocs.push(cand)
  }
  const origins = originLocs.map((locId, i) => ({
    id: `ORG-${s.id}-${i + 1}`,
    locationId: locId,
    contact: {
      name:   NAMES[Math.floor(Math.random() * NAMES.length)],
      mobile: `+9665${rand(10000000, 99999999)}`,
      email:  `pickup-${i + 1}@helms.sa`,
    },
    readyDate: future(rand(24, 120)),
    notes: i === 0 ? 'Primary pickup point' : 'Secondary pickup — sequenced after primary',
  }))

  // ── Augment each stop's contact to structured POC ──
  const stops = (s.route?.stops ?? []).map((stop, i) => ({
    ...stop,
    contactPoc: {
      name:   typeof stop.contact === 'string' ? stop.contact : NAMES[Math.floor(Math.random() * NAMES.length)],
      mobile: `+9665${rand(10000000, 99999999)}`,
      email:  `dest-${i + 1}@helms.sa`,
    },
  }))

  // Generate 2-3 quotes; mark one approved if past the quote stage
  const numQuotes = isDraft ? 0 : (Math.random() < 0.4 ? 3 : 2)
  const quoteVendors = []
  while (quoteVendors.length < numQuotes) {
    const v = LOCAL_VENDOR_POOL[Math.floor(Math.random() * LOCAL_VENDOR_POOL.length)]
    if (!quoteVendors.includes(v)) quoteVendors.push(v)
  }
  const baseAmt = 18000 + Math.floor(Math.random() * 22000)
  const quoteApproved = isDelivered || isInTransit || isAssigned
  const quotes = quoteVendors.map((vId, i) => {
    const amt = baseAmt + (i - 1) * 2500 + Math.floor(Math.random() * 1500)
    const approved = quoteApproved && i === 0   // first one wins
    return {
      id: `QTE-${s.id}-${i + 1}`,
      vendorId: vId,
      amount: amt,
      currency: 'SAR',
      reason: i === 0
        ? 'Best rate + previously delivered on time'
        : (i === 1 ? 'Lower bid but new vendor — risk profile unknown'
                   : 'Premium rate, 3-day faster ETA'),
      deliveryDate: future(rand(48, 120)),
      status: approved ? 'approved' : (quoteApproved ? 'rejected' : 'pending'),
      createdAt: past(rand(72, 240)),
      createdBy: 'Khalid Salman',
      approvedAt: approved ? past(rand(48, 200)) : null,
      approvedBy: approved ? 'Operations Manager' : null,
    }
  })
  const approvedQuote = quotes.find(q => q.status === 'approved')

  // Invoice: auto-generated from approved quote
  const invoice = approvedQuote ? {
    id: `INV-${s.id}`,
    quoteId: approvedQuote.id,
    vendorId: approvedQuote.vendorId,
    amount: approvedQuote.amount,
    vat: Math.round(approvedQuote.amount * 0.15),
    total: Math.round(approvedQuote.amount * 1.15),
    issuedDate: approvedQuote.approvedAt,
    dueDate: future(30 * 24),
    status: isDelivered ? 'paid' : (isInTransit ? 'sent' : 'draft'),
    sentAt: isDelivered || isInTransit ? past(rand(24, 120)) : null,
    poNumber: s.poNumbers?.[0] ?? '',
  } : null

  // ── Sales Order link + packing / release / KPI timestamps ──
  const salesOrderNumber = !isDraft ? `SO-${2026}-${rand(1000, 9999)}` : null
  const packedAt   = (isInTransit || isDelivered || isAssigned) ? past(rand(48, 200))  : null
  const releasedAt = (isInTransit || isDelivered)               ? past(rand(24, 120))  : null
  const packedBy   = packedAt   ? pick(['Warehouse Lead', 'Packing Supervisor', 'Logistics Coordinator']) : null
  const releasedBy = releasedAt ? pick(['Dispatch Officer', 'Logistics Manager', 'Operations Lead']) : null
  const packingRemarks  = packedAt   ? pick(['All items secured with edge protection', 'Sealed crates · ready for pickup', 'Heavy items braced; lighter items on top']) : ''
  const releaseRemarks  = releasedAt ? pick(['Gate pass issued; convoy departed', 'Signed off by site security', 'Released with escort vehicle']) : ''

  // ── Vendor invoices (submitted BY vendor for payment) ──
  // Seed 1-2 invoices for shipments past 'in_progress'; partial payments are common.
  const vendorInvoices = []
  if (isInTransit || isDelivered) {
    const approvedQ = approvedQuote
    if (approvedQ) {
      const invAmt = approvedQ.amount
      const fullyPaid = isDelivered && Math.random() < 0.6
      const partiallyPaid = !fullyPaid && Math.random() < 0.55
      const payments = []
      if (fullyPaid) {
        payments.push({ id:`PAY-${s.id}-1`, amount: Math.round(invAmt * 0.5), date: past(rand(96, 240)), referenceNumber:`BANK-${rand(100000,999999)}`, proofFile:`receipt-1-${s.id}.pdf`, recordedBy:'Khalid Salman', recordedAt: past(rand(96, 240)) })
        payments.push({ id:`PAY-${s.id}-2`, amount: Math.round(invAmt * 0.5), date: past(rand(24, 72)),  referenceNumber:`BANK-${rand(100000,999999)}`, proofFile:`receipt-2-${s.id}.pdf`, recordedBy:'Khalid Salman', recordedAt: past(rand(24, 72)) })
      } else if (partiallyPaid) {
        payments.push({ id:`PAY-${s.id}-1`, amount: Math.round(invAmt * 0.5), date: past(rand(48, 120)), referenceNumber:`BANK-${rand(100000,999999)}`, proofFile:`receipt-1-${s.id}.pdf`, recordedBy:'Khalid Salman', recordedAt: past(rand(48, 120)) })
      }
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const invStatus = totalPaid >= invAmt ? 'paid' : (totalPaid > 0 ? 'partially_paid' : 'pending')
      const closure   = invStatus === 'paid' && fullyPaid ? {
        date: past(rand(12, 36)), remarks:'Payment fully cleared · documents archived.',
        finalReference:`CLR-${rand(10000,99999)}`,
        supportingDocs:[`tax-invoice-${s.id}.pdf`, `delivery-conf-${s.id}.pdf`],
        finalReceipt:`final-receipt-${s.id}.pdf`, closedBy:'Finance Manager',
      } : null
      vendorInvoices.push({
        id: `VINV-${s.id}-1`,
        invoiceNumber:  `INV-${rand(100000, 999999)}`,
        invoiceDate:    past(rand(96, 200)),
        amount:         invAmt,
        vendorId:       approvedQ.vendorId,
        vendorName:     approvedQ.vendorId,
        shipmentRef:    s.id,
        attachment:     `vendor-invoice-${s.id}.pdf`,
        status:         invStatus,
        payments,
        closure,
        submittedAt:    past(rand(96, 200)),
      })
    }
  }

  const reachedDone = isInTransit || isDelivered

  const checklist = {
    loaded: {
      done: !isDraft && !isSubmitted,
      vehicleNumber: !isDraft && !isSubmitted ? `KSA-${rand(1000,9999)}` : '',
      items: !isDraft && !isSubmitted ? ['Generator Set', 'Spare Parts Kit', 'Tools Pack'] : [],
      images: [],
      completedAt: !isDraft && !isSubmitted ? past(rand(168, 360)) : null,
    },
    pickup: {
      done: isAssigned || isInTransit || isDelivered,
      driverName: isAssigned || isInTransit || isDelivered ? pick(['Ahmed Khalid','Mohammed Ali','Faisal Saud','Ibrahim Omar']) : '',
      driverContact: isAssigned || isInTransit || isDelivered ? `+9665${rand(10000000,99999999)}` : '',
      dateTime: isAssigned || isInTransit || isDelivered ? past(rand(96, 240)) : '',
      images: [],
      completedAt: isAssigned || isInTransit || isDelivered ? past(rand(96, 240)) : null,
    },
    reachedDestinations: stops.map((stop, i) => ({
      stopId: stop.id,
      locationId: stop.locationId,
      done: reachedDone && i < stops.length - 1 ? true : (isDelivered ? true : false),
      dateTime: reachedDone ? past(rand(24, 96)) : '',
      images: [],
      completedAt: reachedDone ? past(rand(24, 96)) : null,
    })),
    delivered: {
      done: isDelivered,
      deliveryNoteAttached: isDelivered,
      deliveryNoteFile: isDelivered ? `DN-${s.id}.pdf` : null,
      images: [],
      completedAt: isDelivered ? past(rand(1, 48)) : null,
    },
  }

  // Dual statuses
  const creationStatus = isDraft ? 'created'
                       : isSubmitted ? 'quote_created'
                       : 'quote_approved'
  const deliveryStatus = !checklist.loaded.done   ? 'pending'
                       : !checklist.pickup.done   ? 'loaded'
                       : !checklist.reachedDestinations.every(r => r.done) ? 'pickup_complete'
                       : !checklist.delivered.done ? 'reached_destination'
                       : 'delivered'

  // Costs (mirror invoice)
  const costs = approvedQuote ? [
    { id: `CST-${s.id}-1`, type: 'Transportation', amount: approvedQuote.amount, vat: invoice.vat, total: invoice.total, vendorId: approvedQuote.vendorId, notes: 'Primary transport cost' },
  ] : []

  // Approvals log
  const approvals = []
  if (creationStatus !== 'created') approvals.push({ id: `APR-${s.id}-1`, action: 'Shipment Submitted', actor: 'Khalid Salman', date: past(rand(240, 480)), notes: 'Awaiting quote collection' })
  if (creationStatus === 'quote_approved' && approvedQuote) {
    approvals.push({ id: `APR-${s.id}-2`, action: 'Quote Approved', actor: 'Operations Manager', date: approvedQuote.approvedAt, notes: approvedQuote.reason })
  }

  // Audit log
  const auditLog = [
    { id: `AUD-${s.id}-1`, actor: 'System', action: 'Shipment created',  date: s.createdAt,  meta: {} },
    ...(creationStatus !== 'created' ? [{ id: `AUD-${s.id}-2`, actor: 'Khalid Salman', action: 'Quote process started', date: past(rand(240, 480)), meta: { quotes: quotes.length } }] : []),
    ...(approvedQuote ? [{ id: `AUD-${s.id}-3`, actor: 'Operations Manager', action: 'Quote approved', date: approvedQuote.approvedAt, meta: { vendorId: approvedQuote.vendorId, amount: approvedQuote.amount } }] : []),
    ...(invoice ? [{ id: `AUD-${s.id}-4`, actor: 'System', action: 'Invoice generated', date: invoice.issuedDate, meta: { invoiceId: invoice.id } }] : []),
    ...(checklist.loaded.done    ? [{ id: `AUD-${s.id}-5`, actor: checklist.pickup.driverName || 'Operator', action: 'Loading completed', date: checklist.loaded.completedAt, meta: { vehicle: checklist.loaded.vehicleNumber } }] : []),
    ...(checklist.pickup.done    ? [{ id: `AUD-${s.id}-6`, actor: checklist.pickup.driverName || 'Driver',   action: 'Pickup completed',  date: checklist.pickup.completedAt }] : []),
    ...(checklist.delivered.done ? [{ id: `AUD-${s.id}-7`, actor: 'Site Manager', action: 'Delivered',           date: checklist.delivered.completedAt }] : []),
  ]

  // Auto-generate a per-shipment vendor evaluation for ~70% of delivered
  // shipments so the SLA dashboard has signal on first load.
  const vendorEvaluation = (checklist?.delivered?.done && approvedQuote && Math.random() > 0.30)
    ? (() => {
        const seed = (s.id?.charCodeAt(s.id.length - 1) ?? 0) % 5
        const base = 3 + (seed % 3)        // 3, 4, or 5
        const jitter = () => Math.max(2, Math.min(5, base + (Math.random() > 0.5 ? 0 : -1) + (Math.random() > 0.7 ? 1 : 0)))
        const c = jitter(); const o = jitter(); const p = jitter()
        return {
          communication: c, onTime: o, pricing: p,
          overall: +((c + o + p) / 3).toFixed(2),
          notes: '',
          reviewer: 'Khalid Salman',
          submittedAt: checklist.delivered.completedAt ?? new Date().toISOString(),
        }
      })()
    : null

  return {
    quotes, approvedQuoteId: approvedQuote?.id ?? null, invoice, checklist,
    creationStatus, deliveryStatus, costs, approvals, auditLog,
    origins, route: { ...s.route, stops },
    salesOrderNumber, vendorInvoices,
    packedAt, packedBy, packingRemarks,
    releasedAt, releasedBy, releaseRemarks,
    vendor: approvedQuote?.vendorId ?? s.vendor,
    vendorEvaluation,
  }
}

const LOCAL_SHIPMENTS_BASE_AUG = LOCAL_SHIPMENTS_BASE.map(s => ({ ...s, secretKey: s.secretKey ?? nextShipmentSecretKey('local'),         ...buildLocalAugment(s) }))
const HISTORICAL_LOCAL_AUG     = HISTORICAL_LOCAL.map(s => ({ ...s,     secretKey: s.secretKey ?? nextShipmentSecretKey('local'),         ...buildLocalAugment(s) }))

// ─── Augment international shipments with packing/release + per-item tracking ──
function buildIntlAugment(s) {
  const isDelivered = ['delivered','completed','closed'].includes(s.status)
  const isInTransit = ['in_progress','dispatched','customs','customs_clearance','pending_customs'].includes(s.status)
  const isAssigned  = ['assigned','pickup_scheduled','submitted','pending_approval'].includes(s.status)
  const isDraft     = s.status === 'draft'

  const packedAt    = (isInTransit || isDelivered || isAssigned) ? past(rand(72, 360))   : null
  const releasedAt  = (isInTransit || isDelivered)               ? past(rand(48, 240))   : null
  const packedBy    = packedAt   ? pick(['Warehouse Lead', 'Export Coordinator', 'Logistics Officer']) : null
  const releasedBy  = releasedAt ? pick(['Dispatch Manager', 'Export Officer', 'Operations Lead']) : null
  const packingRemarks = packedAt   ? pick(['Sealed containers ready for port', 'Pallet wrap + edge protection · LCL', 'Hazmat documentation attached']) : ''
  const releaseRemarks = releasedAt ? pick(['Released to freight forwarder', 'Containers loaded onto vessel', 'Air waybill issued; cargo tendered']) : ''

  const salesOrderNumber = !isDraft ? `SO-${2026}-${rand(1000, 9999)}` : null

  // Per-item packing/release tracking
  const items = (s.items ?? []).map(it => ({
    ...it,
    packed:     packedAt   ? true : false,
    packedAt:   packedAt,
    released:   releasedAt ? true : false,
    releasedAt: releasedAt,
  }))
  const cargo = (s.cargo ?? []).map(c => ({
    ...c,
    packed:     packedAt   ? true : false,
    packedAt:   packedAt,
    released:   releasedAt ? true : false,
    releasedAt: releasedAt,
  }))

  return { packedAt, packedBy, packingRemarks, releasedAt, releasedBy, releaseRemarks, salesOrderNumber, items, cargo }
}

// Also add per-item packing flags to local shipments' checklist items
const LOCAL_SHIPMENTS_BASE_AUG2 = LOCAL_SHIPMENTS_BASE_AUG.map(s => {
  if (!s.packedAt) return s
  // Promote checklist.loaded.items to richer per-item objects when packing exists
  const loadedItems = s.checklist?.loaded?.items ?? []
  if (loadedItems.length === 0 || typeof loadedItems[0] === 'object') return s
  return {
    ...s,
    checklist: {
      ...s.checklist,
      loaded: {
        ...s.checklist.loaded,
        items: loadedItems.map((name, i) => ({
          id: `ITM-${s.id}-${i + 1}`,
          name,
          quantity: rand(1, 5),
          packed: s.packedAt ? true : false,
          packedAt: s.packedAt,
          released: s.releasedAt ? true : false,
          releasedAt: s.releasedAt,
        })),
      },
    },
  }
})
const HISTORICAL_LOCAL_AUG2 = HISTORICAL_LOCAL_AUG.map(s => {
  if (!s.packedAt) return s
  const loadedItems = s.checklist?.loaded?.items ?? []
  if (loadedItems.length === 0 || typeof loadedItems[0] === 'object') return s
  return {
    ...s,
    checklist: {
      ...s.checklist,
      loaded: {
        ...s.checklist.loaded,
        items: loadedItems.map((name, i) => ({
          id: `ITM-${s.id}-${i + 1}`,
          name,
          quantity: rand(1, 5),
          packed: s.packedAt ? true : false,
          packedAt: s.packedAt,
          released: s.releasedAt ? true : false,
          releasedAt: s.releasedAt,
        })),
      },
    },
  }
})

const INTL_SHIPMENTS_BASE_AUG  = INTL_SHIPMENTS_BASE.map(s => ({ ...s,  secretKey: s.secretKey ?? nextShipmentSecretKey('international'), ...buildIntlAugment(s) }))
const HISTORICAL_INTL_AUG      = HISTORICAL_INTL.map(s => ({ ...s,      secretKey: s.secretKey ?? nextShipmentSecretKey('international'), ...buildIntlAugment(s) }))

// ─── SABER-flagged international shipments ───────────────────────────────────
// Five shipments with regulated cargo (per-item saberRequired flag), each in a
// different stage of SABER + customs compliance so the UI can showcase the
// full lifecycle from "draft, docs pending" through "everything cleared".
const SABER_SAMPLE_SHIPMENTS = [
  {
    // Stage A: brand new — items flagged, NO docs uploaded yet
    id: 'ITS-26-06-4801',
    type: 'international',
    poNumber: 'PO-2026-101',
    supplier: 'VEN-1004',
    incoterm: 'CIF',
    mode: 'air',
    project: 'PRJ-00001',
    owner: 'EMP-00001',
    status: 'submitted',
    originCountry: 'CN',
    originCity: 'Shenzhen',
    portOfLoading: 'Shenzhen Port',
    portOfDischarge: 'Dammam Port',
    pickupLocation: 'https://maps.google.com/?q=Shenzhen',
    readyDate: future(rand(120, 480)),
    eta: future(rand(96, 200)),
    deliveryLocation: 'LOC-002',
    finalDestType: 'project_site',
    finalDestNotes: 'SABER-regulated industrial equipment · escort required',
    route: {
      origin: { locationId: 'LOC-002', contact: 'Logistics Lead', address: 'Dammam Industrial Zone', notes: '' },
      stops: [],
    },
    estValue: 425000, currency: 'SAR',
    insuranceValue: 21000, insuranceRequired: true,
    freightTerms: 'Prepaid', paymentTerms: 'NET 30',
    cargo: [
      { id: 'CRG-SBR-1', cargoNumber: 'CN-CRG-001', name: 'Industrial Valves (45 units)', packages: 6, weight: 1200, weightUnit: 'KG', volume: 18, length: 300, width: 200, height: 180, unit: 'CM', notes: 'SABER cert required prior to clearance', active: true },
    ],
    items: [
      { id: 'ITM-SBR-1', materialCode: 'SAP-VAL-450', hsCode: '848180', description: 'Industrial Pressure Valve, 4-inch', quantity: 45, unit: 'EA', origin: 'CN', notes: 'Regulated under SABER', active: true, saberRequired: true },
      { id: 'ITM-SBR-2', materialCode: 'SAP-VAL-451', hsCode: '848180', description: 'Valve Mounting Brackets', quantity: 90, unit: 'EA', origin: 'CN', notes: '', active: true, saberRequired: false },
    ],
    documents: [
      { id: 'D1', type: 'PO', fileName: 'PO-2026-101.pdf', uploadedAt: past(48), version: 1, status: 'valid' },
      { id: 'D2', type: 'Commercial Invoice', fileName: 'CI-101.pdf', uploadedAt: past(24), version: 1, status: 'valid' },
    ],
    saberDocs: {},
    customsDoc: null,
    customsChecklist: {},
    reminderDays: 5,
    createdAt: past(120), createdBy: 'Khalid Salman', updatedAt: past(2),
  },
  {
    // Stage B: AWB + B/L uploaded, SABER cert still missing
    id: 'ITS-26-06-4802',
    type: 'international',
    poNumber: 'PO-2026-102',
    supplier: 'VEN-1005',
    incoterm: 'FOB',
    mode: 'sea',
    project: 'PRJ-00007',
    owner: 'EMP-00002',
    status: 'in_progress',
    originCountry: 'DE',
    originCity: 'Hamburg',
    portOfLoading: 'Hamburg Port',
    portOfDischarge: 'Jeddah Islamic Port',
    pickupLocation: 'https://maps.google.com/?q=Hamburg',
    readyDate: future(rand(48, 200)),
    eta: future(rand(48, 168)),
    deliveryLocation: 'LOC-011',
    finalDestType: 'warehouse',
    finalDestNotes: '',
    route: {
      origin: { locationId: 'LOC-011', contact: 'Receiving Manager', address: 'Jubail Storage Yard', notes: '' },
      stops: [],
    },
    estValue: 680000, currency: 'SAR',
    insuranceValue: 34000, insuranceRequired: true,
    freightTerms: 'Collect', paymentTerms: 'LC at sight',
    cargo: [
      { id: 'CRG-SBR-2A', cargoNumber: 'DE-CRG-001', name: 'Compressor Units (3 units)', packages: 3, weight: 4500, weightUnit: 'KG', volume: 24, length: 400, width: 220, height: 250, unit: 'CM', notes: '', active: true },
      { id: 'CRG-SBR-2B', cargoNumber: 'DE-CRG-002', name: 'Spare Parts Crate', packages: 8, weight: 920, weightUnit: 'KG', volume: 5, length: 150, width: 100, height: 110, unit: 'CM', notes: '', active: true },
    ],
    items: [
      { id: 'ITM-SBR-3', materialCode: 'SAP-CMP-300', hsCode: '841480', description: 'Reciprocating Air Compressor 30HP', quantity: 3, unit: 'EA', origin: 'DE', notes: 'SABER-regulated', active: true, saberRequired: true },
      { id: 'ITM-SBR-4', materialCode: 'SAP-CMP-301', hsCode: '848390', description: 'Compressor Spare Filters', quantity: 48, unit: 'EA', origin: 'DE', notes: '', active: true, saberRequired: true },
      { id: 'ITM-SBR-5', materialCode: 'SAP-CMP-302', hsCode: '731815', description: 'Mounting Bolts (M16)', quantity: 200, unit: 'EA', origin: 'DE', notes: '', active: true, saberRequired: false },
    ],
    documents: [
      { id: 'D1', type: 'PO', fileName: 'PO-2026-102.pdf', uploadedAt: past(96), version: 1, status: 'valid' },
      { id: 'D2', type: 'Commercial Invoice', fileName: 'CI-102.pdf', uploadedAt: past(72), version: 1, status: 'valid' },
      { id: 'D3', type: 'Packing List', fileName: 'PL-102.pdf', uploadedAt: past(72), version: 1, status: 'valid' },
    ],
    saberDocs: {
      awb: { name: 'AWB-DE-2026-1102.pdf', size: 245000, type: 'application/pdf', uploadedAt: past(48) },
      bol: { name: 'BL-MSK-2026-552.pdf', size: 312000, type: 'application/pdf', uploadedAt: past(48) },
    },
    customsDoc: null,
    customsChecklist: {},
    reminderDays: 7,
    createdAt: past(168), createdBy: 'Khalid Salman', updatedAt: past(6),
  },
  {
    // Stage C: SABER fully uploaded, customs doc uploaded, checklist mid-way
    id: 'ITS-26-06-4803',
    type: 'international',
    poNumber: 'PO-2026-103',
    supplier: 'VEN-1001',
    incoterm: 'DAP',
    mode: 'air',
    project: 'PRJ-00003',
    owner: 'EMP-00003',
    status: 'in_progress',
    originCountry: 'IT',
    originCity: 'Milan',
    portOfLoading: 'Milan Malpensa',
    portOfDischarge: 'King Khalid Intl Airport',
    pickupLocation: 'https://maps.google.com/?q=Milan',
    readyDate: future(rand(24, 120)),
    eta: future(rand(24, 72)),
    deliveryLocation: 'LOC-013',
    finalDestType: 'project_site',
    finalDestNotes: 'Pipeline upgrade site · special handling',
    route: {
      origin: { locationId: 'LOC-013', contact: 'Site Engineer', address: 'Jubail Pipeline Yard 7', notes: '' },
      stops: [],
    },
    estValue: 920000, currency: 'SAR',
    insuranceValue: 46000, insuranceRequired: true,
    freightTerms: 'Prepaid', paymentTerms: 'NET 45',
    cargo: [
      { id: 'CRG-SBR-3', cargoNumber: 'IT-CRG-001', name: 'Custom Steel Fittings (120 units)', packages: 12, weight: 2800, weightUnit: 'KG', volume: 14, length: 250, width: 150, height: 160, unit: 'CM', notes: 'Pipeline-grade · pressure-rated', active: true },
    ],
    items: [
      { id: 'ITM-SBR-6', materialCode: 'SAP-FIT-700', hsCode: '730792', description: 'Stainless Steel Pipe Fittings 6-inch', quantity: 120, unit: 'EA', origin: 'IT', notes: 'SABER + customs cleared', active: true, saberRequired: true },
      { id: 'ITM-SBR-7', materialCode: 'SAP-FIT-701', hsCode: '730793', description: 'Pipe Gaskets', quantity: 240, unit: 'EA', origin: 'IT', notes: '', active: true, saberRequired: false },
    ],
    documents: [
      { id: 'D1', type: 'PO', fileName: 'PO-2026-103.pdf', uploadedAt: past(120), version: 1, status: 'valid' },
      { id: 'D2', type: 'Commercial Invoice', fileName: 'CI-103.pdf', uploadedAt: past(96), version: 1, status: 'valid' },
      { id: 'D3', type: 'Packing List', fileName: 'PL-103.pdf', uploadedAt: past(96), version: 1, status: 'valid' },
    ],
    saberDocs: {
      awb: { name: 'AWB-IT-2026-4471.pdf', size: 198000, type: 'application/pdf', uploadedAt: past(72) },
      bol: { name: 'BL-IT-2026-203.pdf', size: 287000, type: 'application/pdf', uploadedAt: past(72) },
      saberCert: { name: 'SABER-CERT-IT-2026-887.pdf', size: 412000, type: 'application/pdf', uploadedAt: past(48) },
    },
    customsDoc: { name: 'CUSTOMS-CLEAR-DMM-2026-991.pdf', size: 543000, type: 'application/pdf', uploadedAt: past(24) },
    customsChecklist: {
      docReview:  { completed: true, completedAt: past(20), completedBy: 'Compliance — Yousef A.', notes: 'All pages legible, officer signature on page 4' },
      dutyAssess: { completed: true, completedAt: past(16), completedBy: 'Compliance — Yousef A.', notes: 'HS 730792 matched. Duties SAR 18,400.' },
    },
    customsPayment: {
      dutyPercent: 5, foreignCurrency: 'EUR', ksaRate: 4.05, invoiceValue: 92000,
      reminderDays: 5, paid: false,
      customsSAR: +(92000 * 4.05 * 0.05).toFixed(2),
      savedAt: past(24),
    },
    reminderDays: 3,
    createdAt: past(240), createdBy: 'Khalid Salman', updatedAt: past(4),
  },
  {
    // Stage D: ALL docs uploaded + customs checklist FULLY complete
    id: 'ITS-26-06-4804',
    type: 'international',
    poNumber: 'PO-2026-104',
    supplier: 'VEN-1005',
    incoterm: 'DDP',
    mode: 'sea',
    project: 'PRJ-00007',
    owner: 'EMP-00008',
    status: 'in_progress',
    originCountry: 'JP',
    originCity: 'Yokohama',
    portOfLoading: 'Yokohama Port',
    portOfDischarge: 'Jeddah Islamic Port',
    pickupLocation: 'https://maps.google.com/?q=Yokohama',
    readyDate: future(rand(12, 96)),
    eta: future(rand(24, 96)),
    deliveryLocation: 'LOC-011',
    finalDestType: 'warehouse',
    finalDestNotes: '',
    route: {
      origin: { locationId: 'LOC-011', contact: 'Warehouse Lead', address: 'SABIC Yard 12', notes: '' },
      stops: [],
    },
    estValue: 540000, currency: 'SAR',
    insuranceValue: 27000, insuranceRequired: true,
    freightTerms: 'Prepaid', paymentTerms: 'LC at sight',
    cargo: [
      { id: 'CRG-SBR-4', cargoNumber: 'JP-CRG-001', name: 'Hydraulic Pumps (8 units)', packages: 4, weight: 1850, weightUnit: 'KG', volume: 9, length: 200, width: 140, height: 130, unit: 'CM', notes: 'High-pressure rated', active: true },
    ],
    items: [
      { id: 'ITM-SBR-8', materialCode: 'SAP-PMP-100', hsCode: '841320', description: 'Hydraulic Pump 250 bar', quantity: 8, unit: 'EA', origin: 'JP', notes: 'SABER + customs cleared', active: true, saberRequired: true },
      { id: 'ITM-SBR-9', materialCode: 'SAP-PMP-101', hsCode: '841391', description: 'Pump Seal Kits', quantity: 16, unit: 'EA', origin: 'JP', notes: '', active: true, saberRequired: true },
    ],
    documents: [
      { id: 'D1', type: 'PO', fileName: 'PO-2026-104.pdf', uploadedAt: past(180), version: 1, status: 'valid' },
      { id: 'D2', type: 'Commercial Invoice', fileName: 'CI-104.pdf', uploadedAt: past(160), version: 1, status: 'valid' },
      { id: 'D3', type: 'Packing List', fileName: 'PL-104.pdf', uploadedAt: past(160), version: 1, status: 'valid' },
    ],
    saberDocs: {
      awb: { name: 'AWB-JP-2026-8821.pdf', size: 221000, type: 'application/pdf', uploadedAt: past(120) },
      bol: { name: 'BL-MSK-JP-2026-114.pdf', size: 298000, type: 'application/pdf', uploadedAt: past(120) },
      saberCert: { name: 'SABER-CERT-JP-2026-552.pdf', size: 387000, type: 'application/pdf', uploadedAt: past(96) },
    },
    customsDoc: { name: 'CUSTOMS-CLEAR-JED-2026-2241.pdf', size: 612000, type: 'application/pdf', uploadedAt: past(72) },
    customsChecklist: {
      docReview:  { completed: true, completedAt: past(60), completedBy: 'Compliance — Mariam K.', notes: 'Officer stamp verified.' },
      dutyAssess: { completed: true, completedAt: past(48), completedBy: 'Compliance — Mariam K.', notes: 'Duties SAR 22,800 paid.' },
      inspection: { completed: true, completedAt: past(36), completedBy: 'Customs Officer 4421', notes: 'Physical inspection — no exceptions.' },
      release:    { completed: true, completedAt: past(24), completedBy: 'Customs Officer 4421', notes: 'Release ref CR-2026-99812.' },
    },
    customsPayment: {
      dutyPercent: 6, foreignCurrency: 'JPY', ksaRate: 0.025, invoiceValue: 18500000,
      reminderDays: 5, paid: true,
      customsSAR: +(18500000 * 0.025 * 0.06).toFixed(2),
      savedAt: past(72), paidAt: past(48),
    },
    reminderDays: 5,
    createdAt: past(320), createdBy: 'Khalid Salman', updatedAt: past(2),
  },
  {
    // Stage E: Draft — items flagged but everything still pending
    id: 'ITS-26-06-4805',
    type: 'international',
    poNumber: 'PO-2026-105',
    supplier: 'VEN-1004',
    incoterm: 'CIF',
    mode: 'air',
    project: 'PRJ-00004',
    owner: 'EMP-00001',
    status: 'draft',
    originCountry: 'IN',
    originCity: 'Mumbai',
    portOfLoading: 'Mumbai Intl Airport',
    portOfDischarge: 'King Abdulaziz Intl Airport',
    pickupLocation: 'https://maps.google.com/?q=Mumbai',
    readyDate: future(rand(360, 720)),
    eta: future(rand(360, 720)),
    deliveryLocation: 'LOC-014',
    finalDestType: 'project_site',
    finalDestNotes: 'Neom hub · advance booking',
    route: {
      origin: { locationId: 'LOC-014', contact: 'Hub Coordinator', address: 'Neom Logistics Hub', notes: '' },
      stops: [],
    },
    estValue: 285000, currency: 'SAR',
    insuranceValue: 14000, insuranceRequired: true,
    freightTerms: 'Prepaid', paymentTerms: 'NET 30',
    cargo: [
      { id: 'CRG-SBR-5', cargoNumber: 'IN-CRG-001', name: 'Electrical Switchgear', packages: 2, weight: 980, weightUnit: 'KG', volume: 7, length: 220, width: 140, height: 180, unit: 'CM', notes: '', active: true },
    ],
    items: [
      { id: 'ITM-SBR-10', materialCode: 'SAP-ELC-220', hsCode: '853710', description: 'Low-Voltage Switchgear Panel', quantity: 2, unit: 'EA', origin: 'IN', notes: 'SABER-regulated', active: true, saberRequired: true },
      { id: 'ITM-SBR-11', materialCode: 'SAP-ELC-221', hsCode: '854430', description: 'Power Cables (50m rolls)', quantity: 8, unit: 'EA', origin: 'IN', notes: '', active: true, saberRequired: false },
    ],
    documents: [
      { id: 'D1', type: 'PO', fileName: 'PO-2026-105.pdf', uploadedAt: past(12), version: 1, status: 'valid' },
    ],
    saberDocs: {},
    customsDoc: null,
    customsChecklist: {},
    reminderDays: 5,
    createdAt: past(24), createdBy: 'Khalid Salman', updatedAt: past(1),
  },
]

const SABER_SHIPMENTS_AUG = SABER_SAMPLE_SHIPMENTS.map(s => ({ ...s, secretKey: s.secretKey ?? nextShipmentSecretKey('international'), ...buildIntlAugment(s) }))

// Export combined arrays (active seeds + rich historical pool + SABER samples)
export const INTL_SHIPMENTS  = [...SABER_SHIPMENTS_AUG, ...INTL_SHIPMENTS_BASE_AUG, ...HISTORICAL_INTL_AUG]
export const LOCAL_SHIPMENTS = [...LOCAL_SHIPMENTS_BASE_AUG2, ...HISTORICAL_LOCAL_AUG2]

// Helpers exposed for the UI
export const CREATION_STATUS_CFG = {
  created:        { label:'Created',         color:'var(--text3)',   icon:'📝' },
  quote_created:  { label:'Quote Created',   color:'var(--warning)', icon:'💬' },
  quote_approved: { label:'Quote Approved',  color:'var(--success)', icon:'✓'  },
}
export const DELIVERY_STATUS_CFG = {
  pending:              { label:'Pending Loading',     color:'var(--text3)',   icon:'⏳' },
  loaded:               { label:'Loaded',              color:'var(--cyan)',    icon:'📦' },
  pickup_complete:      { label:'Picked Up',           color:'var(--primary)', icon:'🚛' },
  reached_destination:  { label:'Reached Destination', color:'#8B5CF6',        icon:'📍' },
  delivered:            { label:'Delivered',           color:'var(--success)', icon:'✓'  },
}
export function nextLocalStep(s) {
  if (s.creationStatus === 'created')       return { stage:'creation', label:'Create a quote',          action:'create_quote' }
  if (s.creationStatus === 'quote_created') return { stage:'creation', label:'Compare & approve quote', action:'approve_quote' }
  if (s.deliveryStatus === 'pending')             return { stage:'delivery', label:'Complete loading checklist',  action:'checklist_loaded' }
  if (s.deliveryStatus === 'loaded')              return { stage:'delivery', label:'Confirm pickup',              action:'checklist_pickup' }
  if (s.deliveryStatus === 'pickup_complete')     return { stage:'delivery', label:'Mark destination reached',    action:'checklist_reached' }
  if (s.deliveryStatus === 'reached_destination') return { stage:'delivery', label:'Confirm delivery + DN',       action:'checklist_delivered' }
  return { stage:'done', label:'Closed', action:null }
}

// ─── Overall Shipment Status Flow (end-to-end pipeline) ──────────────────────
// Created → Vendor Allocated → Packed → Released/Sent → Delivered → Closed
// All transitions are timestamped + auditable.
export const OVERALL_STATUS_CFG = {
  created:           { label:'Created',          color:'var(--text3)',    icon:'📝', step: 1 },
  vendor_allocated:  { label:'Vendor Allocated', color:'var(--warning)',  icon:'🤝', step: 2 },
  packed:            { label:'Packed',           color:'var(--cyan)',     icon:'📦', step: 3 },
  released:          { label:'Released',         color:'var(--primary)',  icon:'🚛', step: 4 },
  delivered:         { label:'Delivered',        color:'var(--success)',  icon:'✓',  step: 5 },
  closed:            { label:'Closed',           color:'#8B5CF6',         icon:'🔒', step: 6 },
}

// Derive overall status from sub-statuses
export function deriveOverallStatus(s) {
  if (s.invoice && s.vendorInvoices?.some(v => v.status === 'paid' && v.closure)) return 'closed'
  if (['delivered','closed','completed'].includes(s.status))                     return 'delivered'
  if (s.releasedAt)                                                              return 'released'
  if (s.packedAt)                                                                return 'packed'
  if (s.creationStatus === 'quote_approved')                                     return 'vendor_allocated'
  return 'created'
}

// KPI: compute processing-time milestones
export function computeKPIs(s) {
  const created   = s.createdAt ? new Date(s.createdAt)   : null
  const packed    = s.packedAt   ? new Date(s.packedAt)   : null
  const released  = s.releasedAt ? new Date(s.releasedAt) : null
  const delivered = s.actualDeliveryDate ? new Date(s.actualDeliveryDate) : null
  const hours = (a, b) => (!a || !b) ? null : Math.round((b - a) / 36e5)
  return {
    createdToPacked:   hours(created, packed),
    packedToReleased:  hours(packed, released),
    releasedToDelivered: hours(released, delivered),
    totalProcessing:   hours(created, delivered ?? released ?? packed),
  }
}
// Reads through all completed local shipments to build per-vendor stats:
// total jobs, on-time %, avg delay days, avg cost (when quotes exist).
export function getVendorHistory(allLocalShipments, vendorId) {
  const jobs = allLocalShipments.filter(s =>
    (s.supplier === vendorId || s.vendor === vendorId || s.approvedQuoteId?.includes(vendorId))
    && ['delivered','closed','completed'].includes(s.status)
  )
  if (jobs.length === 0) {
    return { vendorId, jobs: 0, onTimePct: null, avgDelay: null, avgCost: null, hasHistory: false }
  }
  let onTime = 0, totalDelay = 0, totalCost = 0, costCount = 0
  jobs.forEach(s => {
    if (s.eta && s.actualDeliveryDate) {
      const d = Math.round((new Date(s.actualDeliveryDate) - new Date(s.eta)) / 86400000)
      if (d <= 0) onTime++
      totalDelay += Math.max(0, d)
    }
    const approved = s.quotes?.find(q => q.status === 'approved')
    if (approved) { totalCost += approved.amount; costCount++ }
  })
  return {
    vendorId,
    jobs: jobs.length,
    onTimePct: Math.round((onTime / jobs.length) * 100),
    avgDelay: Math.round((totalDelay / jobs.length) * 10) / 10,
    avgCost: costCount > 0 ? Math.round(totalCost / costCount) : null,
    hasHistory: true,
  }
}

// Compute a recommendation score for a vendor's quote given their history.
// Lower amount + higher on-time % + more jobs = better score (0-100).
export function scoreQuote(quote, history, lowestAmount, highestAmount) {
  const range = Math.max(1, highestAmount - lowestAmount)
  const costScore   = 100 - Math.round(((quote.amount - lowestAmount) / range) * 100)   // 100 = cheapest
  const onTimeScore = history.hasHistory ? history.onTimePct : 50                       // unknown vendor = 50
  const experienceBoost = Math.min(20, history.jobs * 2)                                // up to +20 for experience
  const total = Math.round((costScore * 0.4) + (onTimeScore * 0.5) + experienceBoost * 0.5)
  return Math.max(0, Math.min(100, total))
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNATIONAL SHIPMENT — Transit reasons + Checklist steps
// ═══════════════════════════════════════════════════════════════════════════
export const TRANSIT_REASONS = [
  { id:'payment_pending',     label:'Payment Pending',         color:'#D97706' },
  { id:'customs_clearance',   label:'Customs Clearance',       color:'#8B5CF6' },
  { id:'document_pending',    label:'Document Pending',        color:'#06B6D4' },
  { id:'vehicle_arrangement', label:'Vehicle Arrangement',     color:'#2563EB' },
  { id:'weather_hold',        label:'Weather Hold',            color:'#EA580C' },
  { id:'port_congestion',     label:'Port Congestion',         color:'#DC2626' },
  { id:'inspection_pending',  label:'Inspection / Survey',     color:'#059669' },
  { id:'other',               label:'Other',                   color:'#64748B' },
]

// Checklist phases for international shipments — each can be expanded for sub-tasks
// requiredDocs: list of documents that must be uploaded before the step can be marked done
export const INTL_CHECKLIST_STEPS = [
  { id:'order_placed',     label:'Order Placed',          icon:'📋', desc:'Shipment created · vendor assigned',
    requiredDocs: [
      { id:'po',           label:'Purchase Order',           required: true  },
      { id:'commercial',   label:'Commercial Invoice',       required: false },
    ] },
  { id:'docs_prepared',    label:'Documents Prepared',    icon:'📄', desc:'PO, invoice, packing list, BOL ready',
    requiredDocs: [
      { id:'pi',           label:'Pro-forma Invoice',        required: true  },
      { id:'packing',      label:'Packing List',             required: true  },
      { id:'msds',         label:'MSDS (if hazardous)',      required: false },
    ] },
  { id:'pickup_arranged',  label:'Pickup Arranged',       icon:'🚚', desc:'Origin pickup scheduled with vendor',
    requiredDocs: [
      { id:'pickup_order', label:'Pickup Order / Booking',   required: true  },
    ] },
  { id:'origin_loaded',    label:'Origin Loaded',         icon:'📦', desc:'Goods loaded at origin warehouse',
    requiredDocs: [
      { id:'bol',          label:'Bill of Lading (BOL/AWB)', required: true  },
      { id:'loading_photo',label:'Loading Photos',           required: true  },
    ] },
  { id:'in_transit',       label:'In Transit',            icon:'✈️', desc:'Departed origin · en route to destination',
    requiredDocs: [
      { id:'transit_doc',  label:'Transit Doc / Tracking',   required: false },
    ] },
  { id:'customs_origin',   label:'Customs Origin',        icon:'🛃', desc:'Export customs clearance at origin',
    requiredDocs: [
      { id:'export_decl',  label:'Export Declaration',       required: true  },
      { id:'origin_cert',  label:'Certificate of Origin',    required: true  },
    ] },
  { id:'customs_dest',     label:'Customs Destination',   icon:'🛃', desc:'Import customs clearance at destination',
    requiredDocs: [
      { id:'import_decl',  label:'Import Declaration',       required: true  },
      { id:'duty_receipt', label:'Duty / VAT Receipt',       required: true  },
      { id:'clearance',    label:'Customs Release',          required: true  },
    ] },
  { id:'arrived_port',     label:'Arrived at Port',       icon:'⚓', desc:'Reached destination port',
    requiredDocs: [
      { id:'arrival_notice',label:'Arrival Notice',          required: true  },
    ] },
  { id:'last_mile',        label:'Last Mile',             icon:'🛣️', desc:'Final leg to delivery address',
    requiredDocs: [
      { id:'delivery_order',label:'Delivery Order',          required: true  },
    ] },
  { id:'delivered',        label:'Delivered',             icon:'✅', desc:'Goods received by consignee',
    requiredDocs: [
      { id:'pod',          label:'Proof of Delivery (POD)',  required: true  },
      { id:'pod_photo',    label:'Delivery Photos',          required: false },
    ] },
]
