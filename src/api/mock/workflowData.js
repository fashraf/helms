// ─── Step type definitions ────────────────────────────────────────────────────
export const STEP_TYPES = {
  approval:      { label: 'Approval',         icon: 'CheckCircle2',  color: 'emerald', cat: 'core'   },
  qa_check:      { label: 'QA Inspection',    icon: 'ClipboardCheck',color: 'amber',   cat: 'core'   },
  customs:       { label: 'Customs Check',    icon: 'Shield',        color: 'orange',  cat: 'intl'   },
  delivery:      { label: 'Delivery Confirm', icon: 'PackageCheck',  color: 'sky',     cat: 'core'   },
  document:      { label: 'Document Review',  icon: 'FileCheck',     color: 'purple',  cat: 'core'   },
  payment:       { label: 'Payment / VAT',    icon: 'Banknote',      color: 'teal',    cat: 'local'  },
  notification:  { label: 'Notification',     icon: 'Bell',          color: 'slate',   cat: 'core'   },
  inspection:    { label: 'Site Inspection',  icon: 'Search',        color: 'red',     cat: 'core'   },
  location_marker:{ label: 'Location Stop',  icon: 'MapPin',        color: 'sky',     cat: 'route'  },
}

export const PALETTE_CATEGORIES = [
  { id: 'route',  label: 'Route',         icon: 'MapPin'         },
  { id: 'core',   label: 'Core Steps',    icon: 'Layers'         },
  { id: 'local',  label: 'Local (KSA)',   icon: 'Flag'           },
  { id: 'intl',   label: 'International', icon: 'Globe'          },
]

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = [
  'Operations Manager', 'Logistics Director', 'QA Engineer', 'Customs Agent',
  'Finance Controller', 'Branch Manager', 'Site Engineer', 'Compliance Officer',
  'IT Administrator', 'General Manager', 'Driver Supervisor', 'Warehouse Manager',
]
export const TEAMS = ['Logistics Team', 'QA Department', 'Finance Dept', 'Customs & Trade', 'Site Operations', 'Management']

// ─── Currencies + Timezones ───────────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal'  },
  { code: 'USD', symbol: '$',   name: 'US Dollar'     },
  { code: 'EUR', symbol: '€',   name: 'Euro'          },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham'    },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal'  },
  { code: 'GBP', symbol: '£',   name: 'British Pound'  },
]
export const TIMEZONES = [
  { id: 'AST',  label: 'Arabia Standard Time (UTC+3)', country: 'Saudi Arabia'  },
  { id: 'GST',  label: 'Gulf Standard Time (UTC+4)',   country: 'UAE / Oman'   },
  { id: 'UTC',  label: 'UTC',                          country: 'International' },
  { id: 'EET',  label: 'Eastern European (UTC+2)',     country: 'Egypt / Jordan'},
  { id: 'PKT',  label: 'Pakistan Standard (UTC+5)',    country: 'Pakistan'      },
  { id: 'IST',  label: 'India Standard (UTC+5:30)',    country: 'India'         },
]
export const INCOTERMS = ['FOB', 'CIF', 'DDP', 'EXW', 'DAP', 'CPT', 'FCA', 'CFR']
export const EXPORT_DOCS = ['Commercial Invoice', 'Packing List', 'Certificate of Origin', 'Bill of Lading', 'Export Licence', 'Phytosanitary Certificate']
export const IMPORT_DOCS = ['Import Permit', 'Customs Declaration', 'Arrival Notice', 'Delivery Order', 'SABER Certificate', 'SFDA Clearance']
export const SA_BRANCHES  = ['Riyadh HQ', 'Jeddah Branch', 'Dammam Branch', 'Makkah Office', 'Medina Office', 'Tabuk Field Office', 'Abha Regional']
export const LOCATIONS_POOL = [
  'Riyadh Industrial City', 'Jeddah Port (KAP)', 'Dammam Depot D-7',
  'Khobar Logistics Hub', 'Jubail Industrial City', 'Yanbu Port',
  'Tabuk Site 12', 'Neom Main Site', 'SABIC Complex Jubail',
  'Jizan Port', 'Kuwait Border Customs', 'UAE - Jebel Ali Port',
  'Bahrain - KFH Logistics', 'Qatar - Hamad Port', 'Jordan - Aqaba Port',
]

// ─── Step defaults factory ────────────────────────────────────────────────────
let _stepCounter = 1000
export function makeStep(type, overrides = {}) {
  return {
    id:            `step-${++_stepCounter}`,
    type,
    name:          STEP_TYPES[type]?.label ?? 'Step',
    status:        'pending',
    assignedRole:  'Operations Manager',
    assignedTeam:  'Logistics Team',
    slaHours:      24,
    escalationHours: 48,
    escalationRole:  'Logistics Director',
    notifyOnStart:    true,
    notifyOnComplete: true,
    notifyOnEscalate: true,
    autoEscalate:     true,
    requiresApproval: type === 'approval',
    // type-specific extras
    customsType:    type === 'customs'  ? 'export' : undefined,
    incoterms:      type === 'customs'  ? 'FOB'    : undefined,
    currency:       type === 'payment'  ? 'SAR'    : undefined,
    vatEnabled:     type === 'payment'  ? true     : undefined,
    vatRate:        type === 'payment'  ? 15       : undefined,
    arabicInvoice:  type === 'payment'  ? false    : undefined,
    checklistItems: type === 'qa_check' ? ['Equipment condition verified', 'Documentation complete', 'Safety compliance checked'] : undefined,
    requiredDocs:   type === 'document' ? ['Commercial Invoice', 'Packing List'] : undefined,
    // location marker extras
    locationName:   type === 'location_marker' ? 'New Location' : undefined,
    locationCountry:type === 'location_marker' ? 'Saudi Arabia' : undefined,
    locationType:   type === 'location_marker' ? 'waypoint'     : undefined,
    completedAt:    null,
    completedBy:    null,
    notes:          '',
    ...overrides,
  }
}

// ─── Workflow templates ────────────────────────────────────────────────────────
export const TEMPLATES = {
  local_standard: {
    name:   'Local Standard',
    type:   'local',
    icon:   '📍',
    description: 'Standard domestic transport with QA and delivery confirmation.',
    config: { vatEnabled: false, arabicInvoice: false, branch: 'Riyadh HQ' },
    steps: () => [
      makeStep('location_marker', { locationName: 'Origin',   locationType: 'origin',      locationCountry: 'Saudi Arabia' }),
      makeStep('approval',        { name: 'Operations Approval', slaHours: 4 }),
      makeStep('qa_check',        { name: 'Pre-Departure QA',    slaHours: 8 }),
      makeStep('location_marker', { locationName: 'Destination', locationType: 'destination', locationCountry: 'Saudi Arabia' }),
      makeStep('inspection',      { name: 'Site Arrival Inspection', slaHours: 2 }),
      makeStep('delivery',        { name: 'Delivery Confirmation', slaHours: 2 }),
    ],
  },
  local_vat: {
    name:   'Local + VAT Invoice',
    type:   'local',
    icon:   '🧾',
    description: 'Domestic with Saudi VAT calculation and Arabic invoice generation.',
    config: { vatEnabled: true, vatRate: 15, arabicInvoice: true, branch: 'Riyadh HQ' },
    steps: () => [
      makeStep('location_marker', { locationName: 'Origin', locationType: 'origin', locationCountry: 'Saudi Arabia' }),
      makeStep('approval',        { name: 'Branch Manager Approval', slaHours: 4 }),
      makeStep('document',        { name: 'VAT Invoice Review', requiredDocs: ['Tax Invoice (AR)', 'Delivery Note'] }),
      makeStep('qa_check',        { name: 'Quality Gate',    slaHours: 6 }),
      makeStep('payment',         { name: 'VAT Settlement', vatEnabled: true, vatRate: 15, arabicInvoice: true, currency: 'SAR' }),
      makeStep('location_marker', { locationName: 'Delivery Site', locationType: 'destination', locationCountry: 'Saudi Arabia' }),
      makeStep('delivery',        { name: 'Final Delivery + Receipt', slaHours: 2 }),
    ],
  },
  intl_export: {
    name:   'International Export',
    type:   'international',
    icon:   '✈️',
    description: 'Full export workflow with customs clearance and documentation.',
    config: { currencies: ['SAR', 'USD'], primaryTimezone: 'AST', incoterms: 'FOB', exportDocs: ['Commercial Invoice', 'Certificate of Origin', 'Bill of Lading'] },
    steps: () => [
      makeStep('location_marker', { locationName: 'KSA Origin',    locationType: 'origin',      locationCountry: 'Saudi Arabia' }),
      makeStep('approval',        { name: 'Export Authorization',   slaHours: 8,  assignedRole: 'Logistics Director' }),
      makeStep('document',        { name: 'Export Documentation',   requiredDocs: ['Commercial Invoice', 'Packing List', 'Certificate of Origin'] }),
      makeStep('customs',         { name: 'Saudi Customs Export',   customsType: 'export', incoterms: 'FOB', slaHours: 24 }),
      makeStep('location_marker', { locationName: 'Port of Loading', locationType: 'waypoint',   locationCountry: 'Saudi Arabia' }),
      makeStep('inspection',      { name: 'Port Inspection',        slaHours: 4 }),
      makeStep('location_marker', { locationName: 'Destination',    locationType: 'destination', locationCountry: 'International' }),
      makeStep('customs',         { name: 'Destination Customs',    customsType: 'import', slaHours: 48 }),
      makeStep('delivery',        { name: 'Final Delivery',         slaHours: 4 }),
    ],
  },
  intl_import: {
    name:   'International Import',
    type:   'international',
    icon:   '🚢',
    description: 'Complete import workflow including port clearance and SABER certification.',
    config: { currencies: ['SAR', 'USD', 'EUR'], primaryTimezone: 'AST', incoterms: 'CIF', importDocs: ['Import Permit', 'SABER Certificate', 'Customs Declaration'] },
    steps: () => [
      makeStep('location_marker', { locationName: 'Supplier Origin', locationType: 'origin',    locationCountry: 'International' }),
      makeStep('document',        { name: 'Import Documentation',   requiredDocs: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Import Permit'] }),
      makeStep('location_marker', { locationName: 'Port of Arrival', locationType: 'waypoint',  locationCountry: 'Saudi Arabia' }),
      makeStep('customs',         { name: 'KSA Customs Import',     customsType: 'import', slaHours: 48 }),
      makeStep('inspection',      { name: 'SABER / Conformity',     slaHours: 24 }),
      makeStep('payment',         { name: 'Customs Duties & Fees',  currency: 'SAR', vatEnabled: true }),
      makeStep('location_marker', { locationName: 'Warehouse KSA',  locationType: 'waypoint',   locationCountry: 'Saudi Arabia' }),
      makeStep('qa_check',        { name: 'Receiving Inspection',   slaHours: 8 }),
      makeStep('location_marker', { locationName: 'Final Delivery', locationType: 'destination', locationCountry: 'Saudi Arabia' }),
      makeStep('delivery',        { name: 'Delivery Confirmation',  slaHours: 4 }),
    ],
  },
}

// ─── Seed data helpers ────────────────────────────────────────────────────────
const past   = (h) => new Date(Date.now() - h * 3600000).toISOString()
const USERS  = ['Abdullah Al-Rashid', 'Fatima Al-Zahrani', 'Khalid Al-Mutairi']
const NAMES  = ['Saudi Aramco Export Route', 'SABIC Domestic Delivery', 'Neom Equipment Import', 'Maaden Mining Local', 'Red Sea HVAC Shipment', 'SABIC Jubail Transfer', 'Samsung KSA Equipment', 'Fluor Arabia International', 'STC Fleet Movement', 'Bechtel Import Clearance']

function seedStatus(idx) {
  return ['active', 'active', 'draft', 'completed', 'active', 'paused', 'draft', 'completed', 'active', 'draft'][idx % 10]
}

function seedType(idx) { return idx % 3 === 0 ? 'international' : 'local' }

export const MOCK_WORKFLOWS = Array.from({ length: 10 }, (_, i) => {
  const type     = seedType(i)
  const status   = seedStatus(i)
  const tmplKey  = type === 'international' ? (i % 2 === 0 ? 'intl_export' : 'intl_import') : (i % 2 === 0 ? 'local_standard' : 'local_vat')
  const tmpl     = TEMPLATES[tmplKey]
  const steps    = tmpl.steps()

  // Simulate some completed steps for active workflows
  if (status === 'active') {
    const doneCount = Math.floor(Math.random() * (steps.length - 2)) + 1
    steps.forEach((s, si) => {
      if (s.type === 'location_marker') return
      if (si < doneCount) { s.status = 'completed'; s.completedAt = past(Math.random() * 12 + 1); s.completedBy = USERS[si % 3] }
      else if (si === doneCount) s.status = 'active'
    })
  } else if (status === 'completed') {
    steps.forEach((s) => { if (s.type !== 'location_marker') { s.status = 'completed'; s.completedAt = past(Math.random() * 48); s.completedBy = USERS[0] } })
  }

  return {
    id:          `WF-${2800 + i}`,
    name:        NAMES[i],
    type,
    status,
    description: tmpl.description,
    template:    tmplKey,
    linkedShipment: Math.random() > 0.4 ? `SHP-0${880 + i}` : null,
    config:      { ...tmpl.config },
    steps,
    createdAt:   past(i * 24 + Math.random() * 48),
    updatedAt:   past(Math.random() * 12),
    createdBy:   USERS[i % 3],
    version:     Math.floor(Math.random() * 5) + 1,
  }
})
