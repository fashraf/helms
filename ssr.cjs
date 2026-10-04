// Server-render the three printable forms to static HTML for visual review.
// Uses esbuild to transpile JSX + bundle, then react-dom/server to stringify.

const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')

const samples = {
  dnSample: {
    orderDate: '2026-06-12',
    purchaseOrder: 'PO-2026-103',
    deliveryNoteNumber: 'DN-55454',
    customerId: 'CUS-1042',
    despatchDate: '2026-06-18',
    packingList: 'PL-103',
    shippingTo: {
      name: 'SABIC Petrochemical Phase 3',
      address: 'Building 4, Industrial City Block 12',
      city: 'Jubail',
      country: 'KSA',
      contact: 'Site Manager — Faisal Al-Rasheed',
      phone: '+966 13 555 0142',
    },
    items: [
      { code: 'SAP-VAL-450', description: 'Industrial Pressure Valve, 4-inch', quantity: 45, uom: 'EA', remarks: 'SABER cleared · pressure-rated' },
      { code: 'SAP-VAL-451', description: 'Valve Mounting Brackets',          quantity: 90, uom: 'EA', remarks: '' },
      { code: 'SAP-FIT-700', description: 'Stainless Steel Pipe Fittings 6-inch', quantity: 120, uom: 'EA', remarks: 'Pipeline-grade' },
      { code: 'SAP-FIT-701', description: 'Pipe Gaskets',                       quantity: 240, uom: 'EA', remarks: '' },
      { code: 'SAP-PMP-100', description: 'Hydraulic Pump 250 bar',              quantity: 8,  uom: 'EA', remarks: '' },
    ],
    specialNotes: 'SABER-compliance certificate attached. Customs cleared Dammam 2026-06-17.', tcAppendix: 'LOCAL TRANSPORT SERVICE LEVEL AGREEMENT (SLA)\n\n1. SCOPE OF SERVICE — Contractor shall provide transport, handling, and last-mile delivery services for cargo originating and terminating within the Kingdom of Saudi Arabia.\n\n2. SERVICE LEVELS — Pickup punctuality within ±60 min · On-time delivery 96%+ · Cargo integrity 99.5%.\n\n3. PRICING — Pre-negotiated lane rates per Schedule C. Net 30 days subject to signed delivery notes.\n\n4. INSURANCE — GIT cover 100% of cargo value · minimum SAR 2M single-incident limit.\n\n5. PENALTIES — Waiting charges per Hulul Demurrage Schedule. Free time 2h. Late-pickup SAR 50/hour.',
    approvedBy: 'Khalid Salman',
    approverSignature: 'K. Salman',
  },
  cmpSample: {
    prNumber: 'PR-2026-187',
    prApprovedDate: '2026-05-22',
    poNumber: 'PO-2026-103',
    poDate: '2026-06-04',
    project: 'SABIC Petrochem Phase 3',
    currency: 'SAR',
    poType: 'Material Supply',
    leadTime: '21 days',
    comparisonPeriod: 3,
    validTill: '2026-09-04',
    suppliers: [
      { name: 'Al Tareek Al Mukhder', quotedItems: 'full', incoterms: 'CIF Dammam', paymentTerms: 'NET 30', deliveryLeadTime: '21 days', qualityBrand: 'OEM · 5-year warranty', totalPriceWithoutVat: 425000 },
      { name: 'Work and Trade',       quotedItems: 'full', incoterms: 'FOB Jeddah', paymentTerms: 'NET 45', deliveryLeadTime: '28 days', qualityBrand: 'OEM · 3-year warranty', totalPriceWithoutVat: 462500 },
      { name: 'Takamol Industrial',   quotedItems: 'partial', incoterms: 'CIF Riyadh', paymentTerms: 'NET 30', deliveryLeadTime: '35 days', qualityBrand: 'Aftermarket',          totalPriceWithoutVat: 401200 },
    ],
    selectedSupplierIndex: 0,
    costReduction: 37500,
    justification: { aramcoApproved: true, preQualified: true },
    approvals: {
      evaluatedBy:    { name: 'Khalid Salman',     signature: 'K. Salman' },
      reviewedBy:     { name: 'Sara Al-Otaibi',    signature: 'S. Otaibi' },
      supplyChainMgr: { name: 'Yousef Al-Harbi',   signature: 'Y. Harbi' },
      ceo:            { name: 'Abdullah Al-Hulul', signature: 'A. Hulul' },
    },
  },
  prSample: {
    paymentMethod: 'bank_transfer',
    supplierName: 'Al Tareek Al Mukhder Trading',
    supplierSapId: 'SAP-VEN-2284',
    projectId: 'PRJ-00007',
    projectName: 'SABIC Petrochem Phase 3',
    advancePaid: 25,
    advancePaidAmount: 106250,
    poValue: 425000,
    poNumber: 'PO-2026-103',
    poDate: '2026-06-04',
    typeOfService: 'Supply of industrial pressure valves and mounting brackets per PO scope',
    invoiceNumber: 'INV-2026-AT-887',
    remarks: 'Final payment release on confirmed delivery and DN sign-off',
    amount: 318750,
    withholdingTax: 0,
    vat: 47812.50,
    currency: 'SAR',
    issueDate: '2026-06-23',
    preparedBy: 'Khizar Hayat',
    lineManager: 'Yousef Al-Harbi',
    finance: { checkedBy: 'Sara Al-Otaibi', reviewedBy: 'Mariam Khalifa', approvedBy: 'Abdullah Al-Hulul' },
  },
}

// Bootstrap entry file that imports the React forms and renders them
const bootstrapSrc = `
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DeliveryNote    from '/home/claude/helms/src/components/print/DeliveryNote'
import ComparisonSheet from '/home/claude/helms/src/components/print/ComparisonSheet'
import PaymentRequest  from '/home/claude/helms/src/components/print/PaymentRequest'

export function renderAll(samples) {
  return {
    dn:  renderToStaticMarkup(React.createElement(DeliveryNote,    { data: samples.dnSample })),
    cmp: renderToStaticMarkup(React.createElement(ComparisonSheet, { data: samples.cmpSample })),
    pr:  renderToStaticMarkup(React.createElement(PaymentRequest,  { data: samples.prSample })),
  }
}
`

const bootstrapPath = '/tmp/ssr-bootstrap.jsx'
fs.writeFileSync(bootstrapPath, bootstrapSrc)

;(async () => {
  const result = await esbuild.build({
    entryPoints: [bootstrapPath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    jsx: 'automatic',
    loader: { '.jsx': 'jsx', '.js': 'jsx' },
    write: false,
    external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'lucide-react'],
    logLevel: 'silent',
  })
  const bundle = result.outputFiles[0].text
  const mod = { exports: {} }
  // Define require for the bundle
  const requireShim = (id) => {
    if (id === 'react')                return require('react')
    if (id === 'react/jsx-runtime')    return require('react/jsx-runtime')
    if (id === 'react/jsx-dev-runtime') return require('react/jsx-dev-runtime')
    if (id === 'react-dom/server')     return require('react-dom/server')
    if (id === 'react-dom')            return require('react-dom')
    if (id.startsWith('lucide-react')) return require('lucide-react')
    throw new Error('cannot resolve: ' + id)
  }
  const fn = new Function('require', 'module', 'exports', bundle)
  fn(requireShim, mod, mod.exports)

  const { renderAll } = mod.exports
  const out = renderAll(samples)

  const wrap = (title, body, name) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { margin: 0; padding: 20px; background: #E2E8F0; font-family: Calibri, "Segoe UI", Tahoma, Arial, sans-serif; }
  h2 { font-family: sans-serif; }
  .page-wrap { background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.12); width: 210mm; margin: 0 auto; }
  img[alt="Hulul"] { display: block; }
</style>
</head><body>
<h2>${title}</h2>
<div class="page-wrap">${body}</div>
</body></html>`

  fs.writeFileSync('/home/claude/_dn.html',  wrap('Delivery Note',    out.dn,  'dn'))
  fs.writeFileSync('/home/claude/_cmp.html', wrap('Comparison Sheet', out.cmp, 'cmp'))
  fs.writeFileSync('/home/claude/_pr.html',  wrap('Payment Request',  out.pr,  'pr'))

  console.log('Rendered three HTML files.')
})().catch(e => { console.error(e); process.exit(1) })
