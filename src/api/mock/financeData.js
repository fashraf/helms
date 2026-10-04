// Finance & Inventory mock data — customers, customer invoices, receipts, inventory
// Vendor invoices live on each shipment (existing). This file adds the customer-side
// (accounts receivable) plus the inventory master.

// ─── INVENTORY MASTER (with SAP IDs) ──────────────────────────────────
export const INVENTORY_MASTER = [
  { id:'INV-0001', sapId:'SAP-1000-2401', name:'Generator Set 250kVA',         category:'Equipment',     unit:'unit', stock: 12, minStock: 3, location:'Riyadh Warehouse 01',   unitCost: 18500, lastUpdated:'2026-05-12T10:00:00Z' },
  { id:'INV-0002', sapId:'SAP-1000-2402', name:'Generator Set 500kVA',         category:'Equipment',     unit:'unit', stock: 6,  minStock: 2, location:'Riyadh Warehouse 01',   unitCost: 32000, lastUpdated:'2026-05-08T10:00:00Z' },
  { id:'INV-0003', sapId:'SAP-2100-5512', name:'Spare Parts Kit · Engine',     category:'Spare Parts',   unit:'kit',  stock: 28, minStock: 8, location:'Jeddah Warehouse',      unitCost: 2800,  lastUpdated:'2026-05-30T14:22:00Z' },
  { id:'INV-0004', sapId:'SAP-2100-5513', name:'Spare Parts Kit · Hydraulics', category:'Spare Parts',   unit:'kit',  stock: 14, minStock: 5, location:'Jeddah Warehouse',      unitCost: 1900,  lastUpdated:'2026-06-01T09:10:00Z' },
  { id:'INV-0005', sapId:'SAP-3300-1101', name:'Tools Pack · Heavy',           category:'Tools',         unit:'pack', stock: 42, minStock: 10,location:'Riyadh Warehouse 02',   unitCost: 750,   lastUpdated:'2026-06-05T11:33:00Z' },
  { id:'INV-0006', sapId:'SAP-3300-1102', name:'Tools Pack · Light',           category:'Tools',         unit:'pack', stock: 60, minStock: 15,location:'Riyadh Warehouse 02',   unitCost: 320,   lastUpdated:'2026-06-05T11:33:00Z' },
  { id:'INV-0007', sapId:'SAP-4400-9001', name:'Industrial Pump 5HP',          category:'Equipment',     unit:'unit', stock: 4,  minStock: 2, location:'Dammam Warehouse',      unitCost: 8400,  lastUpdated:'2026-05-22T08:00:00Z' },
  { id:'INV-0008', sapId:'SAP-4400-9002', name:'Industrial Pump 10HP',         category:'Equipment',     unit:'unit', stock: 3,  minStock: 2, location:'Dammam Warehouse',      unitCost: 14200, lastUpdated:'2026-05-22T08:00:00Z' },
  { id:'INV-0009', sapId:'SAP-5500-3301', name:'Welding Set · MIG',            category:'Equipment',     unit:'unit', stock: 9,  minStock: 3, location:'Riyadh Warehouse 01',   unitCost: 5600,  lastUpdated:'2026-06-08T16:00:00Z' },
  { id:'INV-0010', sapId:'SAP-5500-3302', name:'Welding Set · TIG',            category:'Equipment',     unit:'unit', stock: 5,  minStock: 2, location:'Riyadh Warehouse 01',   unitCost: 7200,  lastUpdated:'2026-06-08T16:00:00Z' },
  { id:'INV-0011', sapId:'SAP-6600-2202', name:'Cable Drum 100m · 4mm²',       category:'Cables',        unit:'drum', stock: 22, minStock: 8, location:'Jeddah Warehouse',      unitCost: 950,   lastUpdated:'2026-06-02T13:10:00Z' },
  { id:'INV-0012', sapId:'SAP-6600-2203', name:'Cable Drum 100m · 10mm²',      category:'Cables',        unit:'drum', stock: 18, minStock: 6, location:'Jeddah Warehouse',      unitCost: 1850,  lastUpdated:'2026-06-02T13:10:00Z' },
  { id:'INV-0013', sapId:'SAP-7700-0001', name:'Safety Helmet · White',        category:'Safety',        unit:'each', stock: 240,minStock: 50,location:'Riyadh Warehouse 02',   unitCost: 45,    lastUpdated:'2026-05-19T10:00:00Z' },
  { id:'INV-0014', sapId:'SAP-7700-0002', name:'Safety Vest · Hi-Viz',         category:'Safety',        unit:'each', stock: 180,minStock: 50,location:'Riyadh Warehouse 02',   unitCost: 35,    lastUpdated:'2026-05-19T10:00:00Z' },
  { id:'INV-0015', sapId:'SAP-8800-1100', name:'Hydraulic Hose · 5m',          category:'Spare Parts',   unit:'each', stock: 36, minStock: 10,location:'Dammam Warehouse',      unitCost: 280,   lastUpdated:'2026-06-09T09:00:00Z' },
]

export const INVENTORY_CATEGORIES = ['Equipment', 'Spare Parts', 'Tools', 'Cables', 'Safety']

// ─── CUSTOMERS ─────────────────────────────────────────────────────────
export const CUSTOMERS = [
  { id:'CUST-001', name:'Saudi Aramco',          code:'ARM', contact:'Abdullah Al-Rashid',  email:'a.rashid@aramco.com',     phone:'+966 11 555 0101', creditTerm:30, address:'Dhahran, Eastern Province' },
  { id:'CUST-002', name:'SABIC',                 code:'SBC', contact:'Faisal Al-Otaibi',    email:'f.otaibi@sabic.com',      phone:'+966 11 555 0202', creditTerm:45, address:'Riyadh' },
  { id:'CUST-003', name:'NEOM',                  code:'NEO', contact:'Mohammed Al-Qahtani', email:'m.qahtani@neom.com',      phone:'+966 11 555 0303', creditTerm:30, address:'Tabuk Province' },
  { id:'CUST-004', name:'Saudi Electricity Co.', code:'SEC', contact:'Khalid Al-Harbi',     email:'k.harbi@se.com.sa',       phone:'+966 11 555 0404', creditTerm:60, address:'Riyadh' },
  { id:'CUST-005', name:'Ma\'aden',              code:'MAD', contact:'Saud Al-Dossari',     email:'s.dossari@maaden.com.sa', phone:'+966 11 555 0505', creditTerm:30, address:'Riyadh' },
  { id:'CUST-006', name:'STC',                   code:'STC', contact:'Yousef Al-Mutairi',   email:'y.mutairi@stc.com.sa',    phone:'+966 11 555 0606', creditTerm:30, address:'Riyadh' },
]

// ─── CUSTOMER INVOICES (Accounts Receivable) ──────────────────────────
// Distinct from vendor invoices on shipments. These are what HELMS bills
// the end customer for the shipment/contract work.
const today = new Date()
const daysAgo = (n) => new Date(today.getTime() - n * 86400000).toISOString()

export const CUSTOMER_INVOICES = [
  { id:'CINV-2026-001', customerId:'CUST-001', contractNumber:'CON-ARM-2026-A12', shipmentRef:'SHIP-LOCAL-001', invoiceDate: daysAgo(85), dueDate: daysAgo(55), amount: 145000, paidAmount: 145000, attachment:'CINV-2026-001.pdf', status:'paid' },
  { id:'CINV-2026-002', customerId:'CUST-002', contractNumber:'CON-SBC-2026-B07', shipmentRef:'SHIP-LOCAL-002', invoiceDate: daysAgo(62), dueDate: daysAgo(17), amount: 88500,  paidAmount: 88500,  attachment:'CINV-2026-002.pdf', status:'paid' },
  { id:'CINV-2026-003', customerId:'CUST-003', contractNumber:'CON-NEO-2026-C04', shipmentRef:'SHIP-LOCAL-003', invoiceDate: daysAgo(48), dueDate: daysAgo(18), amount: 215000, paidAmount: 100000, attachment:'CINV-2026-003.pdf', status:'partially_paid' },
  { id:'CINV-2026-004', customerId:'CUST-004', contractNumber:'CON-SEC-2026-D01', shipmentRef:'SHIP-LOCAL-004', invoiceDate: daysAgo(40), dueDate: daysAgo(-20), amount: 67200,  paidAmount: 0,      attachment:'CINV-2026-004.pdf', status:'pending' },
  { id:'CINV-2026-005', customerId:'CUST-001', contractNumber:'CON-ARM-2026-A13', shipmentRef:'SHIP-LOCAL-005', invoiceDate: daysAgo(35), dueDate: daysAgo(5),  amount: 192000, paidAmount: 0,      attachment:'CINV-2026-005.pdf', status:'overdue' },
  { id:'CINV-2026-006', customerId:'CUST-005', contractNumber:'CON-MAD-2026-E02', shipmentRef:'SHIP-LOCAL-006', invoiceDate: daysAgo(28), dueDate: daysAgo(-2), amount: 54500,  paidAmount: 30000,  attachment:'CINV-2026-006.pdf', status:'partially_paid' },
  { id:'CINV-2026-007', customerId:'CUST-002', contractNumber:'CON-SBC-2026-B08', shipmentRef:'SHIP-LOCAL-007', invoiceDate: daysAgo(20), dueDate: daysAgo(-25), amount: 113000, paidAmount: 0,      attachment:'CINV-2026-007.pdf', status:'pending' },
  { id:'CINV-2026-008', customerId:'CUST-003', contractNumber:'CON-NEO-2026-C05', shipmentRef:'SHIP-LOCAL-008', invoiceDate: daysAgo(15), dueDate: daysAgo(-15), amount: 87900,  paidAmount: 0,      attachment:'CINV-2026-008.pdf', status:'pending' },
  { id:'CINV-2026-009', customerId:'CUST-006', contractNumber:'CON-STC-2026-F01', shipmentRef:'SHIP-LOCAL-009', invoiceDate: daysAgo(10), dueDate: daysAgo(-20), amount: 42700,  paidAmount: 0,      attachment:'CINV-2026-009.pdf', status:'pending' },
  { id:'CINV-2026-010', customerId:'CUST-001', contractNumber:'CON-ARM-2026-A14', shipmentRef:'SHIP-LOCAL-010', invoiceDate: daysAgo(5),  dueDate: daysAgo(-25), amount: 178000, paidAmount: 0,      attachment:'CINV-2026-010.pdf', status:'pending' },
]

// ─── CUSTOMER RECEIPTS ─────────────────────────────────────────────────
export const CUSTOMER_RECEIPTS = [
  { id:'RCPT-001', customerId:'CUST-001', invoiceId:'CINV-2026-001', date: daysAgo(54), amount: 145000, paymentMethod:'Wire Transfer', referenceNumber:'WT-7723910', attachment:'RCPT-001.pdf', status:'verified', createdBy:'Khalid Salman' },
  { id:'RCPT-002', customerId:'CUST-002', invoiceId:'CINV-2026-002', date: daysAgo(16), amount: 88500,  paymentMethod:'Bank Transfer', referenceNumber:'BT-8814022', attachment:'RCPT-002.pdf', status:'verified', createdBy:'Khalid Salman' },
  { id:'RCPT-003', customerId:'CUST-003', invoiceId:'CINV-2026-003', date: daysAgo(17), amount: 100000, paymentMethod:'Wire Transfer', referenceNumber:'WT-9924112', attachment:'RCPT-003.pdf', status:'verified', createdBy:'Khalid Salman' },
  { id:'RCPT-004', customerId:'CUST-005', invoiceId:'CINV-2026-006', date: daysAgo(3),  amount: 30000,  paymentMethod:'Cheque',        referenceNumber:'CHQ-001234',  attachment:'RCPT-004.pdf', status:'pending_verification', createdBy:'Khalid Salman' },
  { id:'RCPT-005', customerId:'CUST-006', invoiceId:'CINV-2026-009', date: daysAgo(1),  amount: 15000,  paymentMethod:'Wire Transfer', referenceNumber:'WT-1102266', attachment:'RCPT-005.pdf', status:'rejected', createdBy:'Khalid Salman', rejectionReason:'Amount mismatch · pending re-issue' },
]

// ─── HELPERS ───────────────────────────────────────────────────────────
export const INVOICE_STATUS_CFG = {
  pending:        { label:'Pending',        c:'#D97706', bg:'rgba(217,119,6,.12)' },
  partially_paid: { label:'Partially Paid', c:'#2563EB', bg:'rgba(37,99,235,.12)' },
  paid:           { label:'Paid',           c:'#059669', bg:'rgba(5,150,105,.12)' },
  overdue:        { label:'Overdue',        c:'#DC2626', bg:'rgba(220,38,38,.12)' },
}

export const RECEIPT_STATUS_CFG = {
  pending_verification: { label:'Pending Verify', c:'#D97706', bg:'rgba(217,119,6,.12)' },
  verified:             { label:'Verified',       c:'#059669', bg:'rgba(5,150,105,.12)' },
  rejected:             { label:'Rejected',       c:'#DC2626', bg:'rgba(220,38,38,.12)' },
}

export const PAYMENT_METHODS = ['Wire Transfer', 'Bank Transfer', 'Cheque', 'Cash', 'Letter of Credit']

// Aging bucket helper — days since invoice/due date
export function agingBucket(invoice) {
  const due = new Date(invoice.dueDate)
  const daysPastDue = Math.floor((today - due) / 86400000)
  if (daysPastDue <= 0)  return 'current'
  if (daysPastDue <= 30) return '0_30'
  if (daysPastDue <= 60) return '31_60'
  if (daysPastDue <= 90) return '61_90'
  return '90_plus'
}

export const AGING_BUCKETS = [
  { id:'0_30',    label:'0–30 Days',    c:'#06B6D4' },
  { id:'31_60',   label:'31–60 Days',   c:'#D97706' },
  { id:'61_90',   label:'61–90 Days',   c:'#EA580C' },
  { id:'90_plus', label:'90+ Days',     c:'#DC2626' },
]

// Revenue category breakdown (for Section 6)
export const REVENUE_CATEGORIES = [
  { id:'local_ship',  label:'Local Shipments',         color:'#2563EB' },
  { id:'intl_ship',   label:'International Shipments', color:'#06B6D4' },
  { id:'customs',     label:'Customs Clearance',       color:'#8B5CF6' },
  { id:'warehousing', label:'Warehousing',             color:'#059669' },
  { id:'other',       label:'Other Services',          color:'#D97706' },
]

// Expense categories (for Section 7)
export const EXPENSE_CATEGORIES = [
  { id:'transport',  label:'Transportation Cost',  color:'#2563EB' },
  { id:'freight',    label:'Freight Charges',      color:'#06B6D4' },
  { id:'customs',    label:'Customs Charges',      color:'#8B5CF6' },
  { id:'fuel',       label:'Fuel Cost',            color:'#D97706' },
  { id:'driver',     label:'Driver Cost',          color:'#059669' },
  { id:'warehouse',  label:'Warehousing Cost',     color:'#EA580C' },
  { id:'admin',      label:'Administrative',       color:'#64748B' },
  { id:'other',      label:'Other Expenses',       color:'#94A3B8' },
]
