// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)]
const past  = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

// ─── Vendor types & services ──────────────────────────────────────────────────
export const VENDOR_TYPES    = ['Freight Forwarder', 'Air Cargo', 'Sea Freight', 'Ground Transport', 'Maintenance', 'Customs Broker', 'Warehousing', 'Full Logistics']
export const SERVICE_TYPES   = ['Air Freight', 'Sea Freight', 'Ground Delivery', 'Air Cargo', 'Rail Freight', 'Multi-modal', 'Customs Clearance', 'Warehousing', 'Heavy Equipment Maintenance', 'Installation Support']
export const TRANSPORT_MODES = ['Air', 'Sea', 'Ground', 'Rail', 'Multi-modal']

export const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia',  flag: '🇸🇦', region: 'Middle East' },
  { code: 'IN', name: 'India',         flag: '🇮🇳', region: 'South Asia'  },
  { code: 'AE', name: 'UAE',           flag: '🇦🇪', region: 'Middle East' },
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America' },
  { code: 'DE', name: 'Germany',       flag: '🇩🇪', region: 'Europe'      },
  { code: 'CN', name: 'China',         flag: '🇨🇳', region: 'Asia Pacific' },
  { code: 'GB', name: 'United Kingdom',flag: '🇬🇧', region: 'Europe'      },
  { code: 'SG', name: 'Singapore',     flag: '🇸🇬', region: 'Asia Pacific' },
  { code: 'QA', name: 'Qatar',         flag: '🇶🇦', region: 'Middle East' },
  { code: 'KW', name: 'Kuwait',        flag: '🇰🇼', region: 'Middle East' },
  { code: 'PK', name: 'Pakistan',      flag: '🇵🇰', region: 'South Asia'  },
  { code: 'TR', name: 'Turkey',        flag: '🇹🇷', region: 'Europe/Asia' },
]

// ─── Real vendor seed data ────────────────────────────────────────────────────
const VENDOR_SEEDS = [
  { id:'VEN001', name:'FedEx Saudi',         country:'SA', type:'Air Cargo',        service:'Air Freight',             sla:94, risk:'low',    active:12, modes:['Air'],              ports:['Jeddah Airport','Riyadh KKIA'] },
  { id:'VEN002', name:'India Post Logistics', country:'IN', type:'Ground Transport', service:'Ground Delivery',         sla:88, risk:'medium', active:6,  modes:['Ground'],           ports:['Mumbai Central','Delhi Hub']   },
  { id:'VEN003', name:'Indian Sea Limit',    country:'IN', type:'Sea Freight',       service:'Sea Freight',             sla:81, risk:'medium', active:8,  modes:['Sea'],              ports:['Mumbai Port','Chennai Port','JNPT'] },
  { id:'VEN004', name:'Vistara Cargo Ltd',   country:'IN', type:'Air Cargo',         service:'Air Cargo',               sla:92, risk:'low',    active:14, modes:['Air'],              ports:['Delhi IGI','Mumbai BOM']       },
  { id:'VEN005', name:'DHL Saudi Arabia',    country:'SA', type:'Full Logistics',    service:'Multi-modal',             sla:96, risk:'low',    active:22, modes:['Air','Ground'],     ports:['All KSA Ports']               },
  { id:'VEN006', name:'Maersk Gulf',         country:'AE', type:'Sea Freight',       service:'Sea Freight',             sla:89, risk:'low',    active:18, modes:['Sea','Ground'],     ports:['Jebel Ali','KAP Jeddah']      },
  { id:'VEN007', name:'Emirates SkyCargo',   country:'AE', type:'Air Cargo',         service:'Air Freight',             sla:97, risk:'low',    active:31, modes:['Air'],              ports:['DXB Cargo','AUH Cargo']        },
  { id:'VEN008', name:'Al-Faris Engineering',country:'SA', type:'Maintenance',       service:'Heavy Equipment Maintenance', sla:90, risk:'low', active:5, modes:['Ground'],          ports:['Riyadh Workshop','Dammam Svc'] },
  { id:'VEN009', name:'Siemens Logistics DE',country:'DE', type:'Full Logistics',    service:'Multi-modal',             sla:93, risk:'low',    active:9,  modes:['Air','Sea','Rail'], ports:['Hamburg Port','Frankfurt Air'] },
  { id:'VEN010', name:'Hapag-Lloyd',         country:'DE', type:'Sea Freight',       service:'Sea Freight',             sla:91, risk:'low',    active:15, modes:['Sea'],              ports:['Hamburg','Rotterdam','Suez']   },
  { id:'VEN011', name:'CEVA Logistics KSA',  country:'SA', type:'Full Logistics',    service:'Multi-modal',             sla:85, risk:'medium', active:11, modes:['Air','Ground'],    ports:['Riyadh','Jeddah','Dammam']    },
  { id:'VEN012', name:'Agility GIL',         country:'KW', type:'Freight Forwarder', service:'Customs Clearance',       sla:87, risk:'medium', active:7,  modes:['Air','Ground'],    ports:['Kuwait City','Doha']           },
  { id:'VEN013', name:'GAC Shipping KSA',    country:'SA', type:'Freight Forwarder', service:'Sea Freight',             sla:86, risk:'medium', active:10, modes:['Sea','Ground'],    ports:['Jeddah Port','Dammam Port']   },
  { id:'VEN014', name:'Toll Group Asia',     country:'SG', type:'Full Logistics',    service:'Multi-modal',             sla:91, risk:'low',    active:13, modes:['Air','Sea'],        ports:['Singapore','Port Klang']       },
  { id:'VEN015', name:'GEFCO Middle East',   country:'AE', type:'Ground Transport',  service:'Ground Delivery',         sla:83, risk:'medium', active:4,  modes:['Ground'],           ports:['Dubai','Abu Dhabi','Sharjah']  },
]

const CONTACT_NAMES = ['Mohammed Al-Harbi','Rajesh Kumar','Ali Hassan','Stefan Müller','Sarah Chen','Ahmed Al-Mansour','Priya Patel','Klaus Weber']
const HQ_CITIES     = { SA:'Riyadh', IN:'Mumbai', AE:'Dubai', DE:'Hamburg', US:'Chicago', CN:'Shanghai', GB:'London', SG:'Singapore', QA:'Doha', KW:'Kuwait City', PK:'Karachi', TR:'Istanbul' }

function buildVendorPerf(seed) {
  const base = seed.sla
  return {
    onTimeRate:       base,
    avgDeliveryDays:  seed.modes.includes('Air') ? rand(2,5) : seed.modes.includes('Sea') ? rand(8,21) : rand(1,4),
    damageRate:       +(Math.random() * 2.5).toFixed(1),
    delayRate:        +(100 - base + Math.random() * 5).toFixed(1),
    customsClearDays: seed.type.includes('Custom') ? rand(1,3) : rand(2,6),
    incidents12mo:    rand(0, 6),
    shipmentsDone:    rand(80, 800),
    reliabilityScore: Math.min(98, base + rand(-3, 4)),
    trendData: Array.from({ length: 8 }, (_, i) => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
      sla:   Math.min(100, base + (Math.random() - 0.4) * 8),
      shipments: rand(10, 60),
    })),
  }
}

export const MOCK_VENDORS = VENDOR_SEEDS.map(seed => ({
  ...seed,
  status:       rand(0, 10) > 1 ? 'active' : 'inactive',
  hq:           HQ_CITIES[seed.country] ?? 'Unknown',
  contactPerson: pick(CONTACT_NAMES),
  email:        `contact@${seed.name.toLowerCase().replace(/\s/g,'-')}.com`,
  phone:        `+${rand(1,99)} ${rand(100,999)} ${rand(1000,9999)}`,
  regions:      seed.ports,
  capabilities: {
    airFreight:         seed.modes.includes('Air'),
    seaFreight:         seed.modes.includes('Sea'),
    groundTransport:    seed.modes.includes('Ground'),
    customsClearance:   seed.type.includes('Customs') || seed.type.includes('Full') || rand(0,1) > 0,
    heavyEquipment:     seed.type.includes('Maintenance') || rand(0,1) > 0,
    warehousing:        seed.type.includes('Warehousing') || seed.type.includes('Full'),
    installSupport:     seed.type.includes('Maintenance'),
  },
  delayed:       rand(0, 3),
  pending:       rand(0, 4),
  performance:   buildVendorPerf(seed),
  contract: {
    start:    past(rand(200, 1000) * 24),
    end:      future(rand(100, 600) * 24),
    slaDoc:   'SLA-' + seed.id + '.pdf',
    insurance:future(rand(50, 400) * 24),
    compliance: Math.random() > 0.15 ? 'verified' : 'pending',
    value:    rand(200, 5000) * 1000,
  },
}))

// ─── Outsourced maintenance ───────────────────────────────────────────────────
export const MAINT_TIMELINE_STEPS = ['Inspection','Vendor Assignment','Parts Procurement','Repair','QA Testing','Completion']

const EQUIPMENT_ISSUES = [
  'Hydraulic pump failure — pressure loss detected', 'Engine overheating — coolant system fault',
  'Transmission slipping — gear engagement issues', 'Brake system wear — immediate replacement required',
  'Boom extension malfunction — crane unit', 'Track shoe wear beyond limit',
  'Electrical system fault — starter motor', 'Fuel injector clogging',
]

export const MOCK_OUTSOURCED_MAINT = Array.from({ length: 14 }, (_, i) => {
  const vendor  = pick(MOCK_VENDORS.filter(v => v.type === 'Maintenance' || v.capabilities.heavyEquipment))
  const status  = pick(['inspection','vendor_assigned','parts_procurement','repair','qa_testing','completed','completed'])
  const stepIdx = MAINT_TIMELINE_STEPS.findIndex(s => s.toLowerCase().replace(' ','_') === status) ?? 0
  return {
    id:          `OM-${3100 + i}`,
    equipmentId: `HX-${2200 + rand(0,24)}`,
    equipType:   pick(['CAT 390F Excavator','Liebherr LTM Crane','Komatsu D475 Dozer','Volvo EC750 Excavator']),
    issue:       pick(EQUIPMENT_ISSUES),
    priority:    pick(['critical','high','medium','medium','low']),
    vendorId:    vendor.id,
    vendorName:  vendor.name,
    vendorCountry: vendor.country,
    region:      pick(['Riyadh','Jeddah','Dammam','Tabuk','Jubail']),
    status,
    currentStep: Math.max(0, stepIdx),
    estRepairDays: rand(2, 21),
    costEstimate:  rand(5000, 80000),
    actualCost:    status === 'completed' ? rand(4500, 85000) : null,
    requestedAt:  past(rand(1, 240)),
    completedAt:  status === 'completed' ? past(rand(1, 48)) : null,
    aiPrediction: {
      repairDuration: rand(3, 18) + ' days',
      repeatRisk:     rand(8, 45) + '%',
      partsDelay:     rand(0, 10) > 7 ? 'High — parts import from DE' : 'Low — in stock',
      costRange:      `SAR ${rand(6,12)*1000} – ${rand(13,20)*1000}`,
      confidence:     rand(72, 95),
    },
  }
})

// ─── Multi-vendor shipment flows ──────────────────────────────────────────────
export const MULTI_VENDOR_FLOWS = [
  {
    id:         'MVF-001',
    shipmentId: 'SHP-00891',
    title:      'Riyadh → Mumbai Heavy Equipment',
    status:     'in_transit',
    steps: [
      { seq:1, location:'Riyadh Industrial City',  vendor:'Internal',      country:'SA', mode:'Ground', status:'completed', eta:past(72),   handoff:'Loaded onto FedEx vehicle' },
      { seq:2, location:'Jeddah Port (KAP)',        vendor:'FedEx Saudi',   country:'SA', mode:'Ground', status:'completed', eta:past(48),   handoff:'Export customs cleared' },
      { seq:3, location:'Export Customs KSA',       vendor:'FedEx Saudi',   country:'SA', mode:null,     status:'completed', eta:past(36),   handoff:'Documents verified — cleared' },
      { seq:4, location:'Sea Transit',              vendor:'Indian Sea Limit',country:'IN',mode:'Sea',   status:'active',    eta:future(96), handoff:'Vessel departed Jeddah' },
      { seq:5, location:'Mumbai Port (JNPT)',        vendor:'Indian Sea Limit',country:'IN',mode:'Sea',  status:'pending',   eta:future(120),handoff:'Import customs pending' },
      { seq:6, location:'Mumbai Customs',           vendor:'India Post',    country:'IN', mode:null,     status:'pending',   eta:future(144),handoff:'Clearance + duties' },
      { seq:7, location:'Final Delivery — Mumbai',  vendor:'India Post',    country:'IN', mode:'Ground', status:'pending',   eta:future(168),handoff:'Last-mile delivery' },
    ],
  },
  {
    id:         'MVF-002',
    shipmentId: 'SHP-00885',
    title:      'Riyadh → Delhi Air Cargo',
    status:     'delayed',
    steps: [
      { seq:1, location:'Riyadh KKIA',              vendor:'Internal',      country:'SA', mode:'Ground', status:'completed', eta:past(24),  handoff:'Cargo loaded'              },
      { seq:2, location:'Riyadh Air Cargo Terminal', vendor:'FedEx Saudi',  country:'SA', mode:'Air',    status:'completed', eta:past(18),  handoff:'Departed Riyadh KKIA'      },
      { seq:3, location:'In Transit — Air',         vendor:'Vistara Cargo', country:'IN', mode:'Air',    status:'delayed',   eta:past(6),   handoff:'Delayed — crew change Dubai' },
      { seq:4, location:'Delhi IGI Cargo',          vendor:'Vistara Cargo', country:'IN', mode:'Air',    status:'pending',   eta:future(8), handoff:'Import clearance'          },
      { seq:5, location:'Delhi Customs',            vendor:'India Post',    country:'IN', mode:null,     status:'pending',   eta:future(16),handoff:'Duties + release'           },
      { seq:6, location:'Final Delivery — Delhi',   vendor:'India Post',    country:'IN', mode:'Ground', status:'pending',   eta:future(24),handoff:'Last-mile delivery'         },
    ],
  },
]

// ─── SLA heatmap data ─────────────────────────────────────────────────────────
export const SLA_HEATMAP = MOCK_VENDORS.slice(0, 8).map(v => ({
  vendor:   v.name.length > 18 ? v.name.slice(0, 17) + '…' : v.name,
  vendorId: v.id,
  country:  v.country,
  Jan: Math.min(100, v.sla + (Math.random()-0.4)*6), Feb: Math.min(100, v.sla + (Math.random()-0.4)*6),
  Mar: Math.min(100, v.sla + (Math.random()-0.4)*6), Apr: Math.min(100, v.sla + (Math.random()-0.4)*6),
  May: Math.min(100, v.sla + (Math.random()-0.4)*6), Jun: Math.min(100, v.sla + (Math.random()-0.4)*6),
}))

// ─── AI vendor recommendations ────────────────────────────────────────────────
export function buildVendorRecommendations(criteria = 'balanced') {
  const scored = MOCK_VENDORS.filter(v => v.status === 'active').map(v => {
    let score = 0
    if (criteria === 'fastest') score = (v.performance.avgDeliveryDays < 5 ? 40 : 20) + v.sla * 0.6
    else if (criteria === 'cheapest') score = 100 - (v.sla - 80) * 0.5 - v.active * 0.3
    else if (criteria === 'safest')   score = v.sla * 0.7 + (100 - v.performance.damageRate * 10) * 0.3
    else score = v.sla * 0.5 + (100 - v.performance.delayRate) * 0.3 + (100 - v.active * 2) * 0.2

    return { ...v, aiScore: Math.min(99, Math.round(score)) }
  }).sort((a, b) => b.aiScore - a.aiScore)

  return scored.slice(0, 4).map((v, i) => ({
    ...v,
    rank: i + 1,
    reasoning: i === 0
      ? [`${v.performance.onTimeRate}% on-time delivery rate`, `Avg ${v.performance.avgDeliveryDays}d transit`, `Only ${v.performance.damageRate}% damage rate`, v.capabilities.heavyEquipment ? 'Certified heavy equipment handler' : 'Wide coverage network']
      : [`${v.sla}% SLA score`, `${v.performance.shipmentsDone} completed shipments`, `${v.performance.reliabilityScore}% reliability`],
    label: i === 0 ? 'Recommended' : i === 1 ? 'Alternative' : i === 2 ? 'Budget Option' : 'Specialist',
  }))
}
