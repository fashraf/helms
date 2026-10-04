// Purchase Order mock data + lifecycle config
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()
const daysAhead = (n) => new Date(Date.now() + n * 86400000).toISOString()

export const PO_TYPES = [
  { id:'manufacturing', label:'Manufacturing',           icon:'🏭', color:'#8B5CF6' },
  { id:'international', label:'International Shipment',  icon:'✈️', color:'#06B6D4' },
  { id:'local',         label:'Local Shipment',          icon:'🚚', color:'#059669' },
  { id:'manpower',      label:'External Manpower',       icon:'👷', color:'#D97706' },
]

export const INCOTERMS = [
  { id:'EXW',   label:'EXW · Ex Works' },
  { id:'FOB',   label:'FOB · Free on Board' },
  { id:'CIF',   label:'CIF · Cost, Insurance & Freight' },
  { id:'DDP',   label:'DDP · Delivered Duty Paid' },
  { id:'DAP',   label:'DAP · Delivered at Place' },
  { id:'CPT',   label:'CPT · Carriage Paid To' },
  { id:'FCA',   label:'FCA · Free Carrier' },
  { id:'OTHER', label:'Other' },
]

export const CURRENCIES = [
  { id:'SAR', label:'SAR · Saudi Riyal' },
  { id:'USD', label:'USD · US Dollar' },
  { id:'EUR', label:'EUR · Euro' },
  { id:'AED', label:'AED · UAE Dirham' },
  { id:'GBP', label:'GBP · British Pound' },
]

export const PAYMENT_PRESETS = [
  { id:'25_75',     label:'25% on Approval · 75% after 20 days',  type:'percentage' },
  { id:'25_75_dsp', label:'25% After Dispatch · 75% after 20 days',type:'percentage' },
  { id:'50_50',     label:'50% After Delivery · 50% after agreed period', type:'percentage' },
  { id:'100_adv',   label:'100% Advance Payment',                type:'advance' },
  { id:'custom',    label:'Custom Payment Schedule',             type:'percentage' },
]

export const PAYMENT_TRIGGERS = [
  { id:'approval',     label:'On Approval' },
  { id:'dispatch',     label:'After Dispatch' },
  { id:'delivery',     label:'After Delivery' },
  { id:'agreed_date',  label:'On Agreed Date' },
  { id:'milestone',    label:'On Milestone' },
  { id:'completion',   label:'On Completion' },
]

export const PAYMENT_STATUS_CFG = {
  pending:  { label:'Pending',  c:'#64748B', bg:'rgba(100,116,139,.12)' },
  upcoming: { label:'Upcoming', c:'#2563EB', bg:'rgba(37,99,235,.12)' },
  paid:     { label:'Paid',     c:'#059669', bg:'rgba(5,150,105,.12)' },
  overdue:  { label:'Overdue',  c:'#DC2626', bg:'rgba(220,38,38,.12)' },
}

// Lifecycle stages for the PO horizontal timeline
export const PO_STAGES = [
  { id:'created',      label:'Created',           icon:'📋', color:'#64748B' },
  { id:'approved',     label:'Approved',          icon:'✓',  color:'#2563EB' },
  { id:'dispatched',   label:'Dispatched',        icon:'🚚', color:'#06B6D4' },
  { id:'delivered',    label:'Delivered',         icon:'📦', color:'#8B5CF6' },
  { id:'pay_done',     label:'Payment Completed', icon:'💰', color:'#059669' },
  { id:'closed',       label:'Closed',            icon:'🔒', color:'#1F2937' },
]

export const PO_VENDORS = [
  { id:'VEN-001', name:'Al-Faisal Manufacturing Co.',     contact:'Yousef Al-Rashed',   email:'y.rashed@alfaisal.sa',    phone:'+966 11 555 3001', category:'Manufacturing' },
  { id:'VEN-002', name:'Riyadh Industrial Supplies',      contact:'Ahmed Al-Qahtani',   email:'a.qahtani@ris.com.sa',    phone:'+966 11 555 3002', category:'Industrial' },
  { id:'VEN-003', name:'Gulf Freight International',      contact:'Faisal Al-Mutairi',  email:'f.mutairi@gfi.com',       phone:'+966 13 555 3003', category:'International Logistics' },
  { id:'VEN-004', name:'Jeddah Port Logistics',           contact:'Khalid Al-Ghamdi',   email:'k.ghamdi@jpl.com.sa',     phone:'+966 12 555 3004', category:'Port Services' },
  { id:'VEN-005', name:'Saudi Cargo Express',             contact:'Saad Al-Dawsari',    email:'s.dawsari@sce.sa',        phone:'+966 11 555 3005', category:'Local Logistics' },
  { id:'VEN-006', name:'NEOM Construction Materials',     contact:'Omar Al-Shehri',     email:'o.shehri@neomcm.com',     phone:'+966 14 555 3006', category:'Construction' },
  { id:'VEN-007', name:'Dammam Heavy Machinery',          contact:'Bandar Al-Otaibi',   email:'b.otaibi@dhm.sa',         phone:'+966 13 555 3007', category:'Heavy Equipment' },
]

// Helper: build a milestone
function milestone({ label, percentage, trigger, dueDate, reminderDate, status = 'pending', paidDate, paidBy, receipt, remarks }) {
  return {
    id: `MS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    label, percentage, trigger, dueDate, reminderDate,
    status, paidDate, paidBy, receipt, remarks,
  }
}

// Sample POs across all lifecycle states
export const SAMPLE_POS = [
  // 1. Active PO with first milestone paid, second pending
  {
    id: 'PO-2026-001',
    type: 'manufacturing',
    creationDate: daysAgo(45),
    vendorId: 'VEN-1008',
    vendorName: 'Al-Faris Heavy',
    vendorContact: 'Yousef Al-Rashed',
    vendorEmail: 'y.rashed@alfaisal.sa',
    vendorPhone: '+966 11 555 3001',
    referenceNumber: 'ALF-2026-MFG-007',
    incoterm: 'EXW',
    currency: 'SAR',
    totalAmount: 280000,
    paymentPresetId: '25_75',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'Approval Payment', percentage:25, trigger:'approval', dueDate: daysAgo(40), reminderDate: daysAgo(43), status:'paid', paidDate: daysAgo(38), paidBy:'Khalid Salman', receipt:'PO-2026-001-MS1.pdf', remarks:'Wire transfer · Ref WT-2200118' }),
      milestone({ label:'Final Payment',    percentage:75, trigger:'agreed_date', dueDate: daysAhead(10), reminderDate: daysAhead(3), status:'upcoming' }),
    ],
    currentStage: 'dispatched',
    stageHistory: [
      { stage:'created',    date: daysAgo(45), by:'Fahad Al-Ghamdi', remarks:'PO drafted from Q1 plan' },
      { stage:'approved',   date: daysAgo(42), by:'Yousef Al-Mutairi', remarks:'Approved by procurement head' },
      { stage:'dispatched', date: daysAgo(8),  by:'Al-Faisal Mfg.',     remarks:'Goods left vendor warehouse' },
    ],
    expectedCompletionDate: daysAhead(15),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(45), updatedBy: 'Khalid Salman', updatedAt: daysAgo(38),
  },

  // 2. Recently created PO, awaiting approval
  {
    id: 'PO-2026-002',
    type: 'international',
    creationDate: daysAgo(3),
    vendorId: 'VEN-1005',
    vendorName: 'Maersk Gulf',
    vendorContact: 'Faisal Al-Mutairi',
    vendorEmail: 'f.mutairi@gfi.com',
    vendorPhone: '+966 13 555 3003',
    referenceNumber: 'GFI-CN-2026-018',
    incoterm: 'CIF',
    currency: 'USD',
    totalAmount: 145000,
    paymentPresetId: '25_75_dsp',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'After Dispatch', percentage:25, trigger:'dispatch', dueDate: daysAhead(7),  reminderDate: daysAhead(4), status:'pending' }),
      milestone({ label:'Final Payment',  percentage:75, trigger:'agreed_date', dueDate: daysAhead(27), reminderDate: daysAhead(20), status:'pending' }),
    ],
    currentStage: 'created',
    stageHistory: [
      { stage:'created', date: daysAgo(3), by:'Fahad Al-Ghamdi', remarks:'Container shipment from Shanghai' },
    ],
    expectedCompletionDate: daysAhead(45),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(3), updatedBy: 'Fahad Al-Ghamdi', updatedAt: daysAgo(3),
  },

  // 3. Closed PO — fully completed
  {
    id: 'PO-2025-098',
    type: 'local',
    creationDate: daysAgo(120),
    vendorId: 'VEN-1011',
    vendorName: 'CEVA Logistics KSA',
    vendorContact: 'Saad Al-Dawsari',
    vendorEmail: 's.dawsari@sce.sa',
    vendorPhone: '+966 11 555 3005',
    referenceNumber: 'SCE-2025-LCL-204',
    incoterm: 'DDP',
    currency: 'SAR',
    totalAmount: 42500,
    paymentPresetId: '50_50',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'After Delivery', percentage:50, trigger:'delivery', dueDate: daysAgo(80), reminderDate: daysAgo(83), status:'paid', paidDate: daysAgo(78), paidBy:'Khalid Salman', receipt:'PO-2025-098-MS1.pdf' }),
      milestone({ label:'Final Payment',  percentage:50, trigger:'agreed_date', dueDate: daysAgo(50), reminderDate: daysAgo(53), status:'paid', paidDate: daysAgo(48), paidBy:'Khalid Salman', receipt:'PO-2025-098-MS2.pdf' }),
    ],
    currentStage: 'closed',
    stageHistory: [
      { stage:'created',    date: daysAgo(120), by:'Fahad Al-Ghamdi', remarks:'' },
      { stage:'approved',   date: daysAgo(118), by:'Yousef Al-Mutairi', remarks:'' },
      { stage:'dispatched', date: daysAgo(95),  by:'SCE Logistics',     remarks:'Loaded onto truck SCE-44' },
      { stage:'delivered',  date: daysAgo(82),  by:'SCE Driver',        remarks:'POD received at NEOM site' },
      { stage:'pay_done',   date: daysAgo(48),  by:'Khalid Salman',     remarks:'Both milestones cleared' },
      { stage:'closed',     date: daysAgo(40),  by:'Yousef Al-Mutairi', remarks:'PO closed · all docs filed' },
    ],
    expectedCompletionDate: daysAgo(50),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(120), updatedBy: 'Yousef Al-Mutairi', updatedAt: daysAgo(40),
  },

  // 4. Overdue PO — payment is past due
  {
    id: 'PO-2026-003',
    type: 'manufacturing',
    creationDate: daysAgo(60),
    vendorId: 'VEN-1015',
    vendorName: 'Saudi Crane Experts',
    vendorContact: 'Bandar Al-Otaibi',
    vendorEmail: 'b.otaibi@dhm.sa',
    vendorPhone: '+966 13 555 3007',
    referenceNumber: 'DHM-MFG-2026-015',
    incoterm: 'EXW',
    currency: 'SAR',
    totalAmount: 510000,
    paymentPresetId: '25_75',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'Approval Payment', percentage:25, trigger:'approval',   dueDate: daysAgo(55), reminderDate: daysAgo(58), status:'paid', paidDate: daysAgo(54), paidBy:'Khalid Salman', receipt:'PO-2026-003-MS1.pdf' }),
      milestone({ label:'Final Payment',    percentage:75, trigger:'agreed_date', dueDate: daysAgo(5),  reminderDate: daysAgo(12), status:'overdue' }),
    ],
    currentStage: 'delivered',
    stageHistory: [
      { stage:'created',    date: daysAgo(60), by:'Fahad Al-Ghamdi',  remarks:'' },
      { stage:'approved',   date: daysAgo(58), by:'Yousef Al-Mutairi',remarks:'' },
      { stage:'dispatched', date: daysAgo(25), by:'DHM Logistics',    remarks:'' },
      { stage:'delivered',  date: daysAgo(12), by:'Site Foreman',     remarks:'Heavy equipment received' },
    ],
    expectedCompletionDate: daysAgo(3),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(60), updatedBy: 'Khalid Salman', updatedAt: daysAgo(54),
  },

  // 5. 100% advance PO
  {
    id: 'PO-2026-004',
    type: 'international',
    creationDate: daysAgo(18),
    vendorId: 'VEN-1006',
    vendorName: 'Bahri Logistics',
    vendorContact: 'Omar Al-Shehri',
    vendorEmail: 'o.shehri@neomcm.com',
    vendorPhone: '+966 14 555 3006',
    referenceNumber: 'NCM-INT-2026-009',
    incoterm: 'FOB',
    currency: 'EUR',
    totalAmount: 92000,
    paymentPresetId: '100_adv',
    paymentType: 'advance',
    milestones: [
      milestone({ label:'100% Advance Payment', percentage:100, trigger:'approval', dueDate: daysAgo(16), reminderDate: daysAgo(17), status:'paid', paidDate: daysAgo(15), paidBy:'Khalid Salman', receipt:'PO-2026-004-FULL.pdf', remarks:'Advance wire to Italian supplier' }),
    ],
    currentStage: 'dispatched',
    stageHistory: [
      { stage:'created',    date: daysAgo(18), by:'Fahad Al-Ghamdi',  remarks:'' },
      { stage:'approved',   date: daysAgo(17), by:'Yousef Al-Mutairi',remarks:'Pre-paid arrangement' },
      { stage:'dispatched', date: daysAgo(5),  by:'NEOM CM',          remarks:'Container loaded · ETA 14 days' },
    ],
    expectedCompletionDate: daysAhead(20),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(18), updatedBy: 'Khalid Salman', updatedAt: daysAgo(15),
  },

  // 6. Custom 4-milestone PO
  {
    id: 'PO-2026-005',
    type: 'manufacturing',
    creationDate: daysAgo(72),
    vendorId: 'VEN-1009',
    vendorName: 'Almajdouie Logistics',
    vendorContact: 'Ahmed Al-Qahtani',
    vendorEmail: 'a.qahtani@ris.com.sa',
    vendorPhone: '+966 11 555 3002',
    referenceNumber: 'RIS-CSTM-2026-A11',
    incoterm: 'DDP',
    currency: 'SAR',
    totalAmount: 825000,
    paymentPresetId: 'custom',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'Mobilization',     percentage:20, trigger:'approval',  dueDate: daysAgo(68), reminderDate: daysAgo(71), status:'paid', paidDate: daysAgo(67), paidBy:'Khalid Salman', receipt:'PO-2026-005-MS1.pdf' }),
      milestone({ label:'Mid-Production',   percentage:30, trigger:'milestone', dueDate: daysAgo(30), reminderDate: daysAgo(33), status:'paid', paidDate: daysAgo(29), paidBy:'Khalid Salman', receipt:'PO-2026-005-MS2.pdf' }),
      milestone({ label:'On Dispatch',      percentage:30, trigger:'dispatch',  dueDate: daysAhead(15), reminderDate: daysAhead(8),  status:'upcoming' }),
      milestone({ label:'Final Acceptance', percentage:20, trigger:'completion', dueDate: daysAhead(45), reminderDate: daysAhead(38), status:'pending' }),
    ],
    currentStage: 'approved',
    stageHistory: [
      { stage:'created',  date: daysAgo(72), by:'Fahad Al-Ghamdi',  remarks:'' },
      { stage:'approved', date: daysAgo(70), by:'Yousef Al-Mutairi',remarks:'Custom payment schedule approved' },
    ],
    expectedCompletionDate: daysAhead(60),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(72), updatedBy: 'Khalid Salman', updatedAt: daysAgo(29),
  },

  // 7. Draft PO (newly drafted, not yet approved)
  {
    id: 'PO-2026-006',
    type: 'local',
    creationDate: daysAgo(1),
    vendorId: 'VEN-1013',
    vendorName: 'GAC Shipping',
    vendorContact: 'Khalid Al-Ghamdi',
    vendorEmail: 'k.ghamdi@jpl.com.sa',
    vendorPhone: '+966 12 555 3004',
    referenceNumber: '',
    incoterm: 'FOB',
    currency: 'SAR',
    totalAmount: 36000,
    paymentPresetId: '50_50',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'After Delivery', percentage:50, trigger:'delivery',    dueDate: daysAhead(14), reminderDate: daysAhead(11), status:'pending' }),
      milestone({ label:'Final Payment',  percentage:50, trigger:'agreed_date', dueDate: daysAhead(44), reminderDate: daysAhead(37), status:'pending' }),
    ],
    currentStage: 'created',
    stageHistory: [
      { stage:'created', date: daysAgo(1), by:'Fahad Al-Ghamdi', remarks:'Draft for review' },
    ],
    expectedCompletionDate: daysAhead(50),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(1), updatedBy: 'Fahad Al-Ghamdi', updatedAt: daysAgo(1),
  },

  // 8. Payment completed, awaiting closure
  {
    id: 'PO-2026-007',
    type: 'local',
    creationDate: daysAgo(95),
    vendorId: 'VEN-1011',
    vendorName: 'CEVA Logistics KSA',
    vendorContact: 'Saad Al-Dawsari',
    vendorEmail: 's.dawsari@sce.sa',
    vendorPhone: '+966 11 555 3005',
    referenceNumber: 'SCE-2026-LCL-031',
    incoterm: 'DDP',
    currency: 'SAR',
    totalAmount: 67000,
    paymentPresetId: '25_75',
    paymentType: 'percentage',
    milestones: [
      milestone({ label:'Approval Payment', percentage:25, trigger:'approval',   dueDate: daysAgo(90), reminderDate: daysAgo(93), status:'paid', paidDate: daysAgo(89), paidBy:'Khalid Salman', receipt:'PO-2026-007-MS1.pdf' }),
      milestone({ label:'Final Payment',    percentage:75, trigger:'agreed_date', dueDate: daysAgo(20), reminderDate: daysAgo(27), status:'paid', paidDate: daysAgo(18), paidBy:'Khalid Salman', receipt:'PO-2026-007-MS2.pdf' }),
    ],
    currentStage: 'pay_done',
    stageHistory: [
      { stage:'created',    date: daysAgo(95), by:'Fahad Al-Ghamdi',  remarks:'' },
      { stage:'approved',   date: daysAgo(93), by:'Yousef Al-Mutairi',remarks:'' },
      { stage:'dispatched', date: daysAgo(60), by:'SCE Logistics',    remarks:'' },
      { stage:'delivered',  date: daysAgo(45), by:'Site Manager',     remarks:'' },
      { stage:'pay_done',   date: daysAgo(18), by:'Khalid Salman',    remarks:'All payments cleared' },
    ],
    expectedCompletionDate: daysAgo(15),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(95), updatedBy: 'Khalid Salman', updatedAt: daysAgo(18),
  },

  // ─── External Manpower POs (linked to External Resource Assignments) ───
  {
    id: 'PO-2026-201', referenceNumber: 'ERA-2026-001', type: 'manpower',
    vendorId: null, vendorName: 'External Manpower · Ahmed Hassan Mahmoud',
    vendorContact: 'Ahmed Hassan Mahmoud', vendorEmail: 'ahmed.hassan@manpower.sa', vendorPhone: '+966 50 234 5678',
    totalAmount: 12750, currency: 'SAR', incoterm: 'OTHER', paymentType: 'percentage',
    creationDate: daysAgo(10),
    milestones: [
      { id:'m1', label:'100% on assignment completion', percentage:100, trigger:'on_delivery', dueDate: daysAhead(7), reminderDate: daysAhead(0), status:'pending', receipt:null, paidDate:null, notes:'Released on assignment completion' },
    ],
    currentStage: 'created',
    stageHistory: [{ stage:'created', date: daysAgo(10), by:'Fahad Al-Ghamdi', remarks:'Auto-generated from ERA-2026-001' }],
    expectedCompletionDate: daysAhead(7),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(10), updatedBy: 'Fahad Al-Ghamdi', updatedAt: daysAgo(10),
    auditLog: [{ action:'create', date: daysAgo(10), by:'Fahad Al-Ghamdi', summary:'Manpower PO auto-created for ERA-2026-001' }],
  },
  {
    id: 'PO-2026-202', referenceNumber: 'ERA-2026-002', type: 'manpower',
    vendorId: null, vendorName: 'External Manpower · Muhammad Tariq Khan',
    vendorContact: 'Muhammad Tariq Khan', vendorEmail: 'muhammad.tariq@manpower.sa', vendorPhone: '+966 55 654 3322',
    totalAmount: 37200, currency: 'SAR', incoterm: 'OTHER', paymentType: 'percentage',
    creationDate: daysAgo(2),
    milestones: [
      { id:'m1', label:'100% on assignment completion', percentage:100, trigger:'on_delivery', dueDate: daysAhead(37), reminderDate: daysAhead(30), status:'pending', receipt:null, paidDate:null, notes:'Released on assignment completion' },
    ],
    currentStage: 'created',
    stageHistory: [{ stage:'created', date: daysAgo(2), by:'Fahad Al-Ghamdi', remarks:'Auto-generated from ERA-2026-002' }],
    expectedCompletionDate: daysAhead(37),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(2), updatedBy: 'Fahad Al-Ghamdi', updatedAt: daysAgo(2),
    auditLog: [{ action:'create', date: daysAgo(2), by:'Fahad Al-Ghamdi', summary:'Manpower PO auto-created for ERA-2026-002' }],
  },
  {
    id: 'PO-2025-198', referenceNumber: 'ERA-2025-098', type: 'manpower',
    vendorId: null, vendorName: 'External Manpower · Mohammed Ali Khan',
    vendorContact: 'Mohammed Ali Khan', vendorEmail: 'mohammed.ali@manpower.sa', vendorPhone: '+966 56 998 1100',
    totalAmount: 29450, currency: 'SAR', incoterm: 'OTHER', paymentType: 'percentage',
    creationDate: daysAgo(80),
    milestones: [
      { id:'m1', label:'100% on assignment completion', percentage:100, trigger:'on_delivery', dueDate: daysAgo(45), reminderDate: daysAgo(50), status:'paid', receipt:'RCP-2025-198.pdf', paidDate: daysAgo(40), notes:'Paid on time' },
    ],
    currentStage: 'closed',
    stageHistory: [
      { stage:'created',    date: daysAgo(80), by:'Fahad Al-Ghamdi',    remarks:'Auto-generated from ERA-2025-098' },
      { stage:'approved',   date: daysAgo(78), by:'Finance Head',       remarks:'' },
      { stage:'dispatched', date: daysAgo(75), by:'HR Operations',      remarks:'Worker mobilized' },
      { stage:'delivered',  date: daysAgo(45), by:'Site Supervisor',    remarks:'Assignment closed' },
      { stage:'pay_done',   date: daysAgo(40), by:'Finance · Khalid',   remarks:'Payment cleared' },
      { stage:'closed',     date: daysAgo(38), by:'Finance · Khalid',   remarks:'PO closed alongside ERA-2025-098' },
    ],
    expectedCompletionDate: daysAgo(45),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(80), updatedBy: 'Finance · Khalid', updatedAt: daysAgo(38),
    auditLog: [
      { action:'create',        date: daysAgo(80), by:'Fahad Al-Ghamdi', summary:'Manpower PO auto-created for ERA-2025-098' },
      { action:'status_change', date: daysAgo(38), by:'Finance · Khalid', summary:'PO closed (assignment completed)' },
    ],
  },
  {
    id: 'PO-2026-203', referenceNumber: 'ERA-2026-003', type: 'manpower',
    vendorId: null, vendorName: 'External Manpower · Jose Reyes Santos',
    vendorContact: 'Jose Reyes Santos', vendorEmail: 'jose.reyes@manpower.sa', vendorPhone: '+966 50 776 5544',
    totalAmount: 11400, currency: 'SAR', incoterm: 'OTHER', paymentType: 'percentage',
    creationDate: daysAgo(25),
    milestones: [
      { id:'m1', label:'100% on assignment completion', percentage:100, trigger:'on_delivery', dueDate: daysAgo(2), reminderDate: daysAgo(8), status:'pending', receipt:null, paidDate:null, notes:'Awaiting completion sign-off (delayed)' },
    ],
    currentStage: 'dispatched',
    stageHistory: [
      { stage:'created',    date: daysAgo(25), by:'Fahad Al-Ghamdi', remarks:'Auto-generated from ERA-2026-003' },
      { stage:'approved',   date: daysAgo(23), by:'Finance Head',    remarks:'' },
      { stage:'dispatched', date: daysAgo(20), by:'HR Operations',   remarks:'Worker mobilized' },
    ],
    expectedCompletionDate: daysAgo(2),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(25), updatedBy: 'Resource Coord.', updatedAt: daysAgo(2),
    auditLog: [{ action:'create', date: daysAgo(25), by:'Fahad Al-Ghamdi', summary:'Manpower PO auto-created for ERA-2026-003' }],
  },
  {
    id: 'PO-2026-204', referenceNumber: 'ERA-2026-004', type: 'manpower',
    vendorId: null, vendorName: 'External Manpower · Rajesh Kumar Verma',
    vendorContact: 'Rajesh Kumar Verma', vendorEmail: 'rajesh.verma@manpower.sa', vendorPhone: '+966 53 234 1122',
    totalAmount: 43920, currency: 'SAR', incoterm: 'OTHER', paymentType: 'percentage',
    creationDate: daysAgo(20),
    milestones: [
      { id:'m1', label:'100% on assignment completion', percentage:100, trigger:'on_delivery', dueDate: daysAhead(45), reminderDate: daysAhead(38), status:'pending', receipt:null, paidDate:null, notes:'Released on assignment completion' },
    ],
    currentStage: 'dispatched',
    stageHistory: [
      { stage:'created',    date: daysAgo(20), by:'Fahad Al-Ghamdi', remarks:'Auto-generated from ERA-2026-004' },
      { stage:'approved',   date: daysAgo(18), by:'Finance Head',    remarks:'' },
      { stage:'dispatched', date: daysAgo(15), by:'HR Operations',   remarks:'Worker mobilized' },
    ],
    expectedCompletionDate: daysAhead(45),
    createdBy: 'Fahad Al-Ghamdi', createdAt: daysAgo(20), updatedBy: 'Project Manager', updatedAt: daysAgo(3),
    auditLog: [{ action:'create', date: daysAgo(20), by:'Fahad Al-Ghamdi', summary:'Manpower PO auto-created for ERA-2026-004' }],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────
export function computePaymentStatus(milestone) {
  if (milestone.status === 'paid') return 'paid'
  const due = new Date(milestone.dueDate)
  const reminder = new Date(milestone.reminderDate)
  const now = new Date()
  if (now > due)      return 'overdue'
  if (now >= reminder) return 'upcoming'
  return 'pending'
}

// Compute days between two ISO dates (positive integer)
export function daysBetween(a, b) {
  if (!a || !b) return null
  return Math.floor((new Date(b) - new Date(a)) / 86400000)
}

// Compute total paid for a PO
export function totalPaidFor(po) {
  return (po.milestones ?? []).filter(m => m.status === 'paid').reduce((s, m) => s + (po.totalAmount * m.percentage / 100), 0)
}

// Compute next payment milestone (the first unpaid one)
export function nextUnpaid(po) {
  return (po.milestones ?? []).find(m => m.status !== 'paid')
}

// Days remaining until next unpaid milestone (negative = overdue)
export function daysUntilNextPayment(po) {
  const next = nextUnpaid(po)
  if (!next) return null
  return daysBetween(new Date().toISOString(), next.dueDate)
}

// PO-level overall payment status
export function poPaymentStatus(po) {
  const ms = po.milestones ?? []
  if (ms.length === 0) return 'pending'
  const paidCount = ms.filter(m => m.status === 'paid').length
  if (paidCount === ms.length) return 'paid'
  if (ms.some(m => computePaymentStatus(m) === 'overdue')) return 'overdue'
  if (ms.some(m => computePaymentStatus(m) === 'upcoming')) return 'upcoming'
  return 'pending'
}

// Generate a new PO ID
export function nextPoId(existing) {
  const year = new Date().getFullYear()
  const existingThisYear = existing.filter(p => p.id.startsWith(`PO-${year}`))
  const n = existingThisYear.length + 1
  return `PO-${year}-${String(n).padStart(3, '0')}`
}

// Generate milestones from a preset
export function generateMilestonesFromPreset(presetId, totalAmount, creationDate = new Date().toISOString()) {
  const created = new Date(creationDate)
  const addDays = (n) => new Date(created.getTime() + n * 86400000).toISOString()
  switch (presetId) {
    case '25_75':
      return [
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'Approval Payment', percentage:25, trigger:'approval', dueDate: addDays(3), reminderDate: addDays(0), reminderDays: 3, status:'pending' },
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'Final Payment',    percentage:75, trigger:'agreed_date', dueDate: addDays(23), reminderDate: addDays(20), reminderDays: 3, status:'pending' },
      ]
    case '25_75_dsp':
      return [
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'After Dispatch',  percentage:25, trigger:'dispatch',     dueDate: addDays(10), reminderDate: addDays(7),  reminderDays: 3, status:'pending' },
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'Final Payment',   percentage:75, trigger:'agreed_date',  dueDate: addDays(30), reminderDate: addDays(23), reminderDays: 7, status:'pending' },
      ]
    case '50_50':
      return [
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'After Delivery',  percentage:50, trigger:'delivery',     dueDate: addDays(15), reminderDate: addDays(12), reminderDays: 3, status:'pending' },
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'Final Payment',   percentage:50, trigger:'agreed_date',  dueDate: addDays(45), reminderDate: addDays(38), reminderDays: 7, status:'pending' },
      ]
    case '100_adv':
      return [
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'100% Advance Payment', percentage:100, trigger:'approval', dueDate: addDays(3), reminderDate: addDays(0), reminderDays: 3, status:'pending' },
      ]
    default:
      return [
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'Payment 1',  percentage:50, trigger:'approval',   dueDate: addDays(5),  reminderDate: addDays(2),  reminderDays: 3, status:'pending' },
        { id:`MS-${Math.random().toString(36).slice(2,7).toUpperCase()}`, label:'Payment 2',  percentage:50, trigger:'completion', dueDate: addDays(30), reminderDate: addDays(23), reminderDays: 7, status:'pending' },
      ]
  }
}

// Recompute reminderDate from dueDate − reminderDays
export function computeReminderDate(dueDate, reminderDays) {
  if (!dueDate || reminderDays == null) return dueDate
  return new Date(new Date(dueDate).getTime() - Math.max(0, Number(reminderDays)) * 86400000).toISOString()
}
