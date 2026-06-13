// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()
const money = (a, b) => rand(a, b) * 1000

// ─── Service categories ───────────────────────────────────────────────────────
export const SERVICE_CATEGORIES = [
  { id: 'transportation',    label: 'Transportation',          icon: '🚛' },
  { id: 'heavy_transport',   label: 'Heavy Equipment Transport',icon: '🏗️' },
  { id: 'air_freight',       label: 'Air Freight',             icon: '✈️' },
  { id: 'sea_freight',       label: 'Sea Freight',             icon: '🚢' },
  { id: 'customs_broker',    label: 'Customs Broker',          icon: '🛂' },
  { id: 'warehousing',       label: 'Warehousing',             icon: '🏭' },
  { id: 'maintenance',       label: 'Maintenance Services',    icon: '🔧' },
  { id: 'installation',      label: 'Installation Services',   icon: '🔩' },
  { id: 'crane',             label: 'Crane Services',          icon: '🏗️' },
  { id: 'last_mile',         label: 'Last Mile Delivery',      icon: '📦' },
  { id: 'freight_forward',   label: 'Freight Forwarding',      icon: '🌐' },
  { id: 'project_logistics', label: 'Project Logistics',       icon: '📋' },
]

export const VENDOR_TYPES = ['Freight Forwarder', 'Carrier', 'Customs Broker', 'Warehouse Operator', '3PL Provider', 'Maintenance Contractor', 'Crane Service', 'Last Mile']

export const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia',  flag: '🇸🇦' },
  { code: 'IN', name: 'India',         flag: '🇮🇳' },
  { code: 'AE', name: 'UAE',           flag: '🇦🇪' },
  { code: 'PK', name: 'Pakistan',      flag: '🇵🇰' },
  { code: 'OM', name: 'Oman',          flag: '🇴🇲' },
  { code: 'DE', name: 'Germany',       flag: '🇩🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'SG', name: 'Singapore',     flag: '🇸🇬' },
  { code: 'KW', name: 'Kuwait',        flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar',         flag: '🇶🇦' },
]

export const SA_REGIONS = ['Riyadh', 'Jeddah', 'Dammam', 'Jubail', 'Khobar', 'Makkah', 'Medina', 'Tabuk', 'Yanbu', 'Abha']

export const VENDOR_STATUSES = {
  active:           { label: 'Active',           cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  inactive:         { label: 'Inactive',         cls: 'text-slate-500 bg-slate-50 border-slate-200'       },
  blacklisted:      { label: 'Blacklisted',      cls: 'text-red-600 bg-red-50 border-red-200'             },
  pending_approval: { label: 'Pending Approval', cls: 'text-amber-600 bg-amber-50 border-amber-200'       },
}

export const DOC_TYPES = [
  'Company Registration Certificate', 'VAT Certificate', 'Insurance Certificate',
  'Trade License', 'ISO Certification', 'Safety Certification', 'Customs License', 'Contract', 'Other',
]

export const BLACKLIST_REASONS = ['Poor Performance', 'Fraud', 'Compliance Failure', 'Repeated Delays', 'Safety Issues', 'Contract Violations']

export const RATING_CATEGORIES = [
  { id: 'service_quality', label: 'Service Quality',     weight: 30 },
  { id: 'reliability',     label: 'Reliability',         weight: 20 },
  { id: 'communication',   label: 'Communication',       weight: 15 },
  { id: 'compliance',      label: 'Compliance',          weight: 15 },
  { id: 'cost',            label: 'Cost Competitiveness', weight: 10 },
  { id: 'documentation',   label: 'Documentation',       weight: 10 },
]

// ─── Seed vendors ─────────────────────────────────────────────────────────────
const VENDOR_SEEDS = [
  { name:'FedEx Saudi Arabia',  legal:'FedEx Express Saudi LLC',  country:'SA', services:['air_freight','customs_broker','warehousing'],          type:'Freight Forwarder' },
  { name:'DHL Saudi Arabia',    legal:'DHL Express KSA Ltd',      country:'SA', services:['air_freight','last_mile','customs_broker'],            type:'3PL Provider'      },
  { name:'India Post Logistics',legal:'India Post Intl Ltd',      country:'IN', services:['last_mile','transportation'],                          type:'Carrier'           },
  { name:'Vistara Cargo Ltd',   legal:'Vistara Cargo Pvt Ltd',    country:'IN', services:['air_freight','freight_forward'],                       type:'Carrier'           },
  { name:'Maersk Gulf',         legal:'Maersk Line Gulf FZE',     country:'AE', services:['sea_freight','freight_forward','project_logistics'],   type:'Carrier'           },
  { name:'Bahri Logistics',     legal:'Bahri National Shipping',  country:'SA', services:['sea_freight','heavy_transport','project_logistics'],   type:'Carrier'           },
  { name:'Emirates SkyCargo',   legal:'Emirates SkyCargo LLC',    country:'AE', services:['air_freight','freight_forward'],                       type:'Carrier'           },
  { name:'Al-Faris Heavy',      legal:'Al-Faris Crane & Heavy',   country:'SA', services:['crane','heavy_transport','installation'],              type:'Crane Service'     },
  { name:'Almajdouie Logistics',legal:'Almajdouie Group KSA',     country:'SA', services:['heavy_transport','warehousing','project_logistics'],   type:'3PL Provider'      },
  { name:'Agility GIL',         legal:'Agility Logistics KW',     country:'KW', services:['customs_broker','warehousing','freight_forward'],      type:'Freight Forwarder' },
  { name:'CEVA Logistics KSA',  legal:'CEVA Logistics Saudi',     country:'SA', services:['transportation','warehousing','last_mile'],            type:'3PL Provider'      },
  { name:'XYZ Maintenance Co.', legal:'XYZ Equipment Services',   country:'SA', services:['maintenance','installation'],                          type:'Maintenance Contractor' },
  { name:'GAC Shipping',        legal:'GAC Saudi Arabia Ltd',     country:'SA', services:['sea_freight','customs_broker'],                        type:'Customs Broker'    },
  { name:'Kuehne+Nagel KSA',    legal:'Kuehne Nagel Saudi',       country:'SA', services:['freight_forward','warehousing','air_freight'],         type:'Freight Forwarder' },
  { name:'Saudi Crane Experts', legal:'SCE Heavy Lifting Co.',    country:'SA', services:['crane','heavy_transport'],                             type:'Crane Service'     },
]

const CONTACT_NAMES = ['Mohammed Al-Harbi','Rajesh Kumar','Ali Hassan','Stefan Müller','Ahmed Al-Mansour','Priya Patel','Faisal Al-Otaibi','Sara Chen']
const JOB_TITLES    = ['Operations Director','Account Manager','Logistics Head','Regional Manager','Business Dev Lead','Key Account Manager']
const CITIES        = { SA:'Riyadh', IN:'Mumbai', AE:'Dubai', PK:'Karachi', OM:'Muscat', DE:'Hamburg', US:'Memphis', SG:'Singapore', KW:'Kuwait City', QA:'Doha' }

function buildRatings() {
  const cats = {}
  RATING_CATEGORIES.forEach(c => { cats[c.id] = +(rand(35, 50) / 10).toFixed(1) })
  const overall = +(RATING_CATEGORIES.reduce((sum, c) => sum + cats[c.id] * c.weight / 100, 0)).toFixed(1)
  return { categories: cats, overall, totalReviews: rand(8, 60), trend: ['Jan','Feb','Mar','Apr','May','Jun'].map(m => ({ month: m, rating: +(rand(38, 49) / 10).toFixed(1) })) }
}

function buildDocuments(vendorId) {
  return DOC_TYPES.slice(0, rand(4, 8)).map((type, i) => {
    const expH = rand(-200, 800) * 24
    return {
      id:        `${vendorId}-DOC-${i}`,
      type,
      fileName:  `${type.replace(/\s/g,'_')}_${vendorId}.pdf`,
      uploadedAt: past(rand(100, 2000)),
      uploadedBy: pick(['Abdullah Al-Rashid','Fatima Al-Zahrani']),
      expiryDate: future(expH),
      version:    rand(1, 4),
      size:       rand(120, 4800) + ' KB',
      status:     expH < 0 ? 'expired' : expH < 720 ? 'expiring_soon' : 'valid',
    }
  })
}

function buildShipments(vendorId, services) {
  return Array.from({ length: rand(4, 12) }, (_, i) => ({
    id:        `SHP-${String(rand(20, 99)).padStart(5,'0')}`,
    customer:  pick(['Saudi Aramco','SABIC','Neom Project','Maaden','Red Sea Dev']),
    route:     pick(['Riyadh → Dubai → Mumbai','Jeddah → Hamburg','Dammam → Jubail','Riyadh → Jeddah','Jeddah → Mumbai']),
    role:      pick(services.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.label ?? s)),
    status:    pick(['Completed','Completed','In Transit','Delayed','Pending']),
    eta:       future(rand(-48, 240)),
    deliveryDate: Math.random() > 0.4 ? past(rand(1, 200)) : null,
    perfScore: rand(72, 99),
  }))
}

function buildRFQs(vendorId) {
  return Array.from({ length: rand(3, 8) }, (_, i) => {
    const awarded = Math.random() > 0.5
    return {
      id:        `RFQ-${rand(1000, 1099)}`,
      date:      past(rand(100, 3000)),
      bidAmount: money(8, 120),
      awarded,
      status:    awarded ? 'Awarded' : pick(['Lost','Pending','Under Review']),
      comments:  awarded ? 'Best value bid' : pick(['Higher than competitor','Late submission','Pending evaluation']),
    }
  })
}

function buildContracts(vendorId) {
  return Array.from({ length: rand(1, 3) }, (_, i) => {
    const endH = rand(-100, 600) * 24
    return {
      id:        `CTR-${rand(2000, 2099)}`,
      number:    `HELMS-CTR-${rand(2024, 2026)}-${rand(100, 999)}`,
      startDate: past(rand(200, 1500) * 24),
      endDate:   future(endH),
      renewalDate: future(endH - 30 * 24),
      value:     money(200, 5000),
      status:    endH < 0 ? 'expired' : endH < 60 * 24 ? 'expiring' : 'active',
    }
  })
}

function buildAudit(vendorId) {
  const actions = [
    { action: 'Vendor Created',     field: null,        old: null,         new: null },
    { action: 'Status Changed',     field: 'Status',    old: 'Pending',    new: 'Active' },
    { action: 'Document Uploaded',  field: 'Documents', old: null,         new: 'Insurance Certificate' },
    { action: 'Contract Updated',   field: 'Contract',  old: 'CTR-2098',   new: 'CTR-2099' },
    { action: 'Rating Updated',     field: 'Rating',    old: '4.2',        new: '4.5' },
    { action: 'Vendor Updated',     field: 'Contact',   old: 'old@x.com',  new: 'new@x.com' },
  ]
  return actions.slice(0, rand(3, 6)).map((a, i) => ({
    id:        `${vendorId}-AUD-${i}`,
    date:      past(rand(1, 2000)),
    user:      pick(['Abdullah Al-Rashid','Fatima Al-Zahrani','Khalid Al-Mutairi']),
    ...a,
  }))
}

export const VENDORS_V2 = VENDOR_SEEDS.map((seed, i) => {
  const status = i === 11 ? 'blacklisted' : i === 13 ? 'pending_approval' : i === 9 ? 'inactive' : 'active'
  const ratings = buildRatings()
  const sla = rand(78, 98)
  return {
    id:          `VEN-${String(1001 + i).padStart(4, '0')}`,
    code:        `VEN${String(1001 + i)}`,
    name:        seed.name,
    legalName:   seed.legal,
    regNumber:   `CR-${rand(1000000000, 9999999999)}`,
    vatNumber:   `${rand(300000000000000, 399999999999999)}`,
    website:     `https://www.${seed.name.toLowerCase().replace(/[^a-z]/g,'')}.com`,
    type:        seed.type,
    country:     seed.country,
    city:        CITIES[seed.country] ?? 'Unknown',
    address:     `${rand(1,999)} Logistics District, ${CITIES[seed.country]}`,
    status,
    services:    seed.services,
    countriesServed: [seed.country, ...pick([['AE','IN'],['IN','PK'],['AE','OM'],['KW','QA']])],
    regionsServed:   SA_REGIONS.slice(0, rand(2, 5)),
    primaryContact: {
      name:   pick(CONTACT_NAMES),
      title:  pick(JOB_TITLES),
      dept:   pick(['Operations','Sales','Logistics','Account Management']),
      email:  `contact@${seed.name.toLowerCase().replace(/[^a-z]/g,'')}.com`,
      mobile: `+${rand(1,99)} ${rand(50,59)} ${rand(100,999)} ${rand(1000,9999)}`,
      office: `+${rand(1,99)} ${rand(11,19)} ${rand(100,999)} ${rand(1000,9999)}`,
    },
    secondaryContact: i % 2 === 0 ? {
      name:   pick(CONTACT_NAMES),
      title:  pick(JOB_TITLES),
      email:  `support@${seed.name.toLowerCase().replace(/[^a-z]/g,'')}.com`,
      mobile: `+${rand(1,99)} ${rand(50,59)} ${rand(100,999)} ${rand(1000,9999)}`,
    } : null,
    rating:        ratings.overall,
    ratings,
    slaCompliance: sla,
    activeShipments:   rand(0, 18),
    completedShipments:rand(40, 600),
    activeRFQs:        rand(0, 5),
    blacklistReason:   status === 'blacklisted' ? pick(BLACKLIST_REASONS) : null,
    blacklistedAt:     status === 'blacklisted' ? past(rand(100, 2000)) : null,
    blacklistedBy:     status === 'blacklisted' ? 'Abdullah Al-Rashid' : null,
    notes: {
      internal:    'Reliable partner for high-priority shipments.',
      risk:        status === 'blacklisted' ? 'Multiple compliance violations recorded.' : 'Low risk — established track record.',
      performance: `Maintains ${sla}% SLA compliance over 12 months.`,
      operational: 'Preferred for ' + seed.services.slice(0,2).map(s=>SERVICE_CATEGORIES.find(c=>c.id===s)?.label).join(' and ') + '.',
    },
    documents:   buildDocuments(`VEN-${1001+i}`),
    shipments:   buildShipments(`VEN-${1001+i}`, seed.services),
    rfqs:        buildRFQs(`VEN-${1001+i}`),
    contracts:   buildContracts(`VEN-${1001+i}`),
    auditHistory:buildAudit(`VEN-${1001+i}`),
    createdAt:   past(rand(500, 4000) * 24),
    createdBy:   'Abdullah Al-Rashid',
  }
})

// ─── AI vendor recommendation ─────────────────────────────────────────────────
export function recommendVendor(route = 'Riyadh → Mumbai') {
  const candidates = VENDORS_V2.filter(v => v.status === 'active')
    .map(v => ({ ...v, score: Math.round(v.slaCompliance * 0.5 + v.rating * 10 + (100 - v.activeShipments * 3) * 0.2) }))
    .sort((a, b) => b.score - a.score)
  const top = candidates[0]
  return {
    vendor: top,
    route,
    reasons: [
      `${top.slaCompliance}% SLA compliance`,
      `12% faster than average on this route`,
      `Lowest delay rate (${(100-top.slaCompliance).toFixed(0)}%)`,
      `${top.rating}★ average rating across ${top.ratings.totalReviews} reviews`,
    ],
    alternatives: candidates.slice(1, 4),
  }
}
