// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

// ─── Vertical Timeline Events ─────────────────────────────────────────────────
export const TIMELINE_EVENT_TYPES = {
  created:      { icon: 'Package',       color: '#2563EB', bg: '#EFF6FF', label: 'Created'       },
  warehouse:    { icon: 'Warehouse',     color: '#7C3AED', bg: '#F5F3FF', label: 'Warehouse'      },
  qa:           { icon: 'ClipboardCheck',color: '#D97706', bg: '#FFFBEB', label: 'QA Inspection'  },
  customs:      { icon: 'Shield',        color: '#EA580C', bg: '#FFF7ED', label: 'Customs'        },
  departure:    { icon: 'TruckIcon',     color: '#0891B2', bg: '#ECFEFF', label: 'Departed'       },
  arrival:      { icon: 'MapPin',        color: '#059669', bg: '#ECFDF5', label: 'Arrived'        },
  delivered:    { icon: 'CheckCircle2',  color: '#059669', bg: '#ECFDF5', label: 'Delivered'      },
  delayed:      { icon: 'AlertTriangle', color: '#DC2626', bg: '#FEF2F2', label: 'Delayed'        },
  inspection:   { icon: 'Search',        color: '#D97706', bg: '#FFFBEB', label: 'Inspection'     },
  approved:     { icon: 'CheckCircle2',  color: '#059669', bg: '#ECFDF5', label: 'Approved'       },
  assigned:     { icon: 'User',          color: '#2563EB', bg: '#EFF6FF', label: 'Assigned'       },
  maintenance:  { icon: 'Wrench',        color: '#7C3AED', bg: '#F5F3FF', label: 'Maintenance'    },
}

function makeTimelineEvents(shipmentId, status, type) {
  const events = [
    { id: `${shipmentId}-1`, type: 'created',    timestamp: past(rand(48,120)), by: 'Operations Team',  team: 'Logistics',    duration: null,    riskScore: 5,  notes: 'Shipment order created and queued for dispatch',  completed: true  },
    { id: `${shipmentId}-2`, type: 'warehouse',  timestamp: past(rand(36,48)),  by: 'Warehouse Crew',  team: 'Warehouse',    duration: '3h 22m',riskScore: 8,  notes: 'Equipment received at Riyadh depot, inventory updated',completed: true  },
    { id: `${shipmentId}-3`, type: 'qa',         timestamp: past(rand(24,36)),  by: 'QA Inspectors',   team: 'QA Dept',      duration: '1h 45m',riskScore: 12, notes: 'Pre-shipment inspection completed — all checks passed',completed: true  },
    { id: `${shipmentId}-4`, type: 'departure',  timestamp: past(rand(12,24)),  by: 'Mohammed Al-G.',  team: 'Fleet Ops',    duration: null,    riskScore: 18, notes: 'Vehicle HX-2291 departed with escort clearance',     completed: status !== 'pending'  },
    { id: `${shipmentId}-5`, type: status === 'delayed' ? 'delayed' : 'arrival', timestamp: status === 'delivered' ? past(rand(1,12)) : future(rand(4,18)), by: 'Site Engineers', team: 'Site Ops', duration: null, riskScore: status === 'delayed' ? 65 : 22, notes: status === 'delayed' ? 'Delayed — road closure on Highway 40' : 'Estimated arrival at destination', completed: status === 'delivered' },
    { id: `${shipmentId}-6`, type: 'delivered',  timestamp: status === 'delivered' ? past(rand(0,4)) : future(rand(20,48)), by: 'Receiving Team', team: 'Site Ops', duration: null, riskScore: 5, notes: 'Final delivery confirmation required', completed: status === 'delivered' },
  ]
  if (type === 'international') {
    events.splice(3, 0, { id: `${shipmentId}-c`, type: 'customs', timestamp: past(rand(30,40)), by: 'Customs Agents', team: 'Customs & Trade', duration: '4h 10m', riskScore: 35, notes: 'Saudi export customs clearance — SABER certificate verified', completed: true })
  }
  return events
}

// ─── Local Operations data ────────────────────────────────────────────────────
export const LOCAL_REGIONS = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Medina', 'Tabuk', 'Abha', 'Jubail', 'Hail', 'Qassim']
export const LOCAL_ROUTES  = [
  { id:'LR-001', from:'Riyadh',  to:'Jeddah',  km:950,  eta:'9.5h',  risk:'low'    },
  { id:'LR-002', from:'Riyadh',  to:'Dammam',  km:400,  eta:'4h',    risk:'low'    },
  { id:'LR-003', from:'Riyadh',  to:'Tabuk',   km:1450, eta:'13.5h', risk:'medium' },
  { id:'LR-004', from:'Jeddah',  to:'Makkah',  km:85,   eta:'1h',    risk:'low'    },
  { id:'LR-005', from:'Dammam',  to:'Jubail',  km:90,   eta:'1h',    risk:'low'    },
  { id:'LR-006', from:'Riyadh',  to:'Medina',  km:900,  eta:'9h',    risk:'medium' },
]

const CUSTOMERS = ['Saudi Aramco','SABIC','Neom Project','Red Sea Dev Co.','Maaden Mining','STC Group','Al-Rajhi Infra','Bechtel KSA']
const EQUIPMENT  = ['CAT 390F Excavator','Liebherr LTM 1200','Komatsu D375A','Terex RT130 Crane','Volvo EC750E']
const DRIVERS_L  = ['Mohammed Al-Ghamdi','Khalid Al-Mutairi','Faisal Al-Dosari','Omar Al-Qahtani','Nasser Al-Harbi']

export const LOCAL_SHIPMENTS = Array.from({ length: 18 }, (_, i) => {
  const status = pick(['in_transit','in_transit','pending','delivered','delayed','on_hold'])
  const route  = pick(LOCAL_ROUTES)
  return {
    id:       `LOC-${String(1000 + i).padStart(4,'0')}`,
    customer: pick(CUSTOMERS),
    equipment:pick(EQUIPMENT),
    driver:   pick(DRIVERS_L),
    region:   route.from,
    origin:   route.from + ' Industrial City',
    dest:     route.to   + ' Site',
    route:    route.id,
    distance: route.km,
    status,
    riskScore: status === 'delayed' ? rand(55,85) : rand(5,40),
    eta:      status === 'delivered' ? past(rand(1,24))   : future(rand(2,36)),
    createdAt: past(rand(12,120)),
    updatedAt: past(rand(0,6)),
    priority:  pick(['standard','standard','high','urgent']),
    slaStatus: status === 'delayed' ? 'breached' : Math.random() > 0.15 ? 'on_track' : 'at_risk',
    timeline:  makeTimelineEvents(`LOC-${i}`, status, 'local'),
    checkpoints: [
      { label: 'Departed Origin',    done: status !== 'pending',              time: past(rand(6,24)) },
      { label: 'Midpoint Check',     done: ['in_transit','delivered'].includes(status), time: past(rand(3,12)) },
      { label: 'Approaching Dest',   done: status === 'delivered',            time: past(rand(0,4))  },
      { label: 'Delivered & Signed', done: status === 'delivered',            time: status === 'delivered' ? past(rand(0,2)) : null },
    ],
  }
})

// ─── International Operations data ───────────────────────────────────────────
export const INTL_SHIPMENTS = Array.from({ length: 12 }, (_, i) => {
  const status = pick(['in_transit','in_transit','customs_hold','delivered','delayed','pending'])
  const origins   = ['Saudi Arabia → India','Saudi Arabia → Germany','Saudi Arabia → UAE','Kuwait → Saudi Arabia','UAE → Saudi Arabia']
  const routeName = pick(origins)
  const [from, to] = routeName.split(' → ')
  const customs_status = pick(['pending','in_progress','cleared','hold'])
  return {
    id:           `INT-${String(2000 + i).padStart(4,'0')}`,
    customer:     pick(CUSTOMERS),
    equipment:    pick(EQUIPMENT),
    type:         pick(['export','import']),
    origin:       from,
    destination:  to,
    status:       status === 'customs_hold' ? 'on_hold' : status,
    customsStatus: customs_status,
    incoterms:    pick(['FOB','CIF','DAP','EXW','DDP']),
    riskScore:    status === 'delayed' || customs_status === 'hold' ? rand(50,90) : rand(15,45),
    eta:          status === 'delivered' ? past(rand(1,48)) : future(rand(24,240)),
    createdAt:    past(rand(24,240)),
    portOfLoading:pick(['Jeddah Port (KAP)','Dammam Port','Yanbu Port','Kuwait City Port']),
    portOfDest:   pick(['Mumbai JNPT','Hamburg Port','Jebel Ali','Colombo Port']),
    vendor:       pick(['FedEx Saudi','Maersk Gulf','Emirates SkyCargo','Indian Sea Limit']),
    documents:    { commercialInvoice: true, packingList: true, billOfLading: Math.random() > 0.1, saberCert: Math.random() > 0.2, exportLicense: Math.random() > 0.15 },
    timeline:     makeTimelineEvents(`INT-${i}`, status, 'international'),
    daysInTransit: rand(3, 25),
    customsDaysEst:rand(1, 7),
  }
})

// ─── Customs queue ────────────────────────────────────────────────────────────
export const CUSTOMS_QUEUE = INTL_SHIPMENTS.slice(0, 8).map((s, i) => ({
  shipmentId:  s.id,
  type:        s.type,
  status:      pick(['pending','in_progress','cleared','hold','rejected']),
  submittedAt: past(rand(2, 48)),
  officerName: pick(['Ahmed Al-Rashidi','Khalid Customs','Sami Al-Border']),
  docs_missing: Math.random() > 0.7 ? ['SABER Certificate'] : [],
  priority:    i < 2 ? 'urgent' : 'standard',
  estimatedClearance: future(rand(4, 72)),
}))

// ─── Reporting data ───────────────────────────────────────────────────────────
export const REPORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export const SHIPMENT_PERF_DATA = REPORT_MONTHS.slice(0, 8).map(m => ({
  month: m,
  total:     rand(180, 320),
  delivered: rand(150, 290),
  delayed:   rand(8, 35),
  onTime:    rand(84, 97),
  avgHours:  rand(18, 42),
}))

export const FLEET_UTIL_DATA = REPORT_MONTHS.slice(0, 8).map(m => ({
  month: m,
  utilization: rand(62, 88),
  fuelCostK:   rand(45, 120),
  downtime:    rand(2, 12),
  maintenance: rand(3, 15),
}))

export const DRIVER_PERF_DATA = [
  { name: 'Mohammed Al-G.',  onTime: 96, safety: 94, deliveries: 89, score: 95 },
  { name: 'Khalid Al-M.',    onTime: 91, safety: 97, deliveries: 74, score: 92 },
  { name: 'Faisal Al-D.',    onTime: 98, safety: 91, deliveries: 112,score: 94 },
  { name: 'Omar Al-Q.',      onTime: 84, safety: 88, deliveries: 61, score: 84 },
  { name: 'Nasser Al-H.',    onTime: 93, safety: 95, deliveries: 97, score: 93 },
  { name: 'Tariq Al-S.',     onTime: 79, safety: 82, deliveries: 55, score: 79 },
]

export const VENDOR_SLA_TREND = [
  { month:'Jan',fedex:94,dhl:96,maersk:88,india_post:86 },
  { month:'Feb',fedex:92,dhl:95,maersk:90,india_post:84 },
  { month:'Mar',fedex:95,dhl:93,maersk:87,india_post:88 },
  { month:'Apr',fedex:97,dhl:96,maersk:91,india_post:85 },
  { month:'May',fedex:94,dhl:98,maersk:89,india_post:83 },
  { month:'Jun',fedex:96,dhl:95,maersk:92,india_post:87 },
]

export const WAREHOUSE_DATA = [
  { name:'Riyadh Main', capacity:82, avgHold:2.4, dockUtil:78, monthlyFlow:340 },
  { name:'Jeddah Central', capacity:91, avgHold:1.8, dockUtil:84, monthlyFlow:280 },
  { name:'Dammam East', capacity:67, avgHold:3.1, dockUtil:62, monthlyFlow:190 },
  { name:'Khobar Ind.', capacity:74, avgHold:2.2, dockUtil:70, monthlyFlow:155 },
  { name:'Jubail Complex', capacity:58, avgHold:1.9, dockUtil:55, monthlyFlow:210 },
  { name:'Yanbu Park', capacity:45, avgHold:2.8, dockUtil:40, monthlyFlow:88  },
]

export const FINANCIAL_DATA = REPORT_MONTHS.slice(0, 8).map(m => ({
  month: m,
  shipmentCost: rand(800, 1800),
  vendorPayments: rand(400, 900),
  fuelCost: rand(200, 500),
  repairCost: rand(50, 250),
  total: null, // computed
})).map(d => ({ ...d, total: d.shipmentCost + d.vendorPayments + d.fuelCost + d.repairCost }))

// ─── AI report insights ───────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  { id:1, type:'trend',       severity:'warning', title:'Shipment delays up 12%', detail:'Delay incidents increased 12% MoM, primarily on Riyadh→Tabuk corridor. Peak: Thursday 15:00–18:00.', recommendation:'Schedule departures before 13:00 on Thursdays to avoid peak traffic.', confidence:87 },
  { id:2, type:'bottleneck',  severity:'danger',  title:'Riyadh warehouse causing 38% delays', detail:'Receiving backlog averaging 4.2h above SLA threshold. 2 docks operating below capacity.', recommendation:'Assign additional forklift operator during 09:00–14:00 shift.', confidence:91 },
  { id:3, type:'prediction',  severity:'info',    title:'Customs delays predicted next week', detail:'Ramadan period historically increases customs clearance time by 35–50% at Jeddah Port.', recommendation:'Pre-clear high-priority shipments before Thursday. Use alternate via Dammam.', confidence:78 },
  { id:4, type:'opportunity', severity:'success', title:'Route optimization saves 8% cost', detail:'31 shipments on Dammam→Jubail route could be consolidated — saving SAR 42k/month.', recommendation:'Implement batch scheduling for Jubail deliveries: Mon, Wed, Sat.', confidence:84 },
]

// ─── Global Search Index ──────────────────────────────────────────────────────
export const SEARCH_INDEX = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `SHP-${String(891 - i).padStart(5,'0')}`, type: 'shipment', label: `SHP-${String(891-i).padStart(5,'0')}`,
    sub: pick(CUSTOMERS) + ' · ' + pick(['In Transit','Delivered','Delayed']), url: `/shipments/SHP-${String(891-i).padStart(5,'0')}`,
    icon: 'Package',
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `DRV-00${i+1}`, type: 'driver', label: ['Mohammed Al-Ghamdi','Khalid Al-Mutairi','Faisal Al-Dosari','Omar Al-Qahtani','Nasser Al-Harbi'][i],
    sub: 'Driver · ' + ['CDL-A Heavy','CDL-B Commercial','Crane Operator','Hazmat','Oversized'][i], url: `/drivers`,
    icon: 'Users',
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `HX-${2200+i}`, type: 'vehicle', label: `Unit HX-${2200+i}`,
    sub: pick(['Low-bed Trailer','Flatbed','Modular Transporter']) + ' · ' + pick(['Active','Idle','Maintenance']), url: `/fleet`,
    icon: 'Truck',
  })),
  ...['FedEx Saudi','DHL Saudi','Maersk Gulf','Indian Sea Limit','Vistara Cargo'].map((n,i) => ({
    id: `VEN00${i+1}`, type: 'vendor', label: n,
    sub: 'Vendor · ' + pick(['Air Freight','Sea Freight','Ground Transport']), url: `/vendors/VEN00${i+1}`,
    icon: 'Building2',
  })),
  ...['Riyadh Main Hub','Jeddah Central','Dammam East'].map((n,i) => ({
    id: `WH-00${i+1}`, type: 'warehouse', label: n,
    sub: 'Warehouse · ' + [82,91,67][i] + '% capacity', url: `/warehouse`,
    icon: 'Warehouse',
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `WF-${2800+i}`, type: 'workflow', label: ['Saudi Aramco Export Route','SABIC Delivery','Neom Import','Maaden Local'][i],
    sub: 'Workflow · ' + pick(['Active','Draft','Completed']), url: `/workflow`,
    icon: 'GitBranch',
  })),
]
