// ═══════════════════════════════════════════════════════════════════════════
// MODULE 3 — T&C TEMPLATE ENGINE · seed data
// 6-slot matrix: { RFQ | Contract | Invoice } × { Local | International }
// Every cell stores body text, active flag, version, and audit history.
// ═══════════════════════════════════════════════════════════════════════════

export const TC_DOC_TYPES = [
  { id: 'rfq',      label: 'RFQ (Request for Quote)' },
  { id: 'contract', label: 'Contract'                 },
  { id: 'invoice',  label: 'Invoice'                  },
]

export const TC_SCOPES = [
  { id: 'local',         label: 'Local Scope'         },
  { id: 'international', label: 'International Scope' },
]

const now = () => new Date().toISOString()
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString()

const TEMPLATE_BODIES = {
  'rfq-local': `LOCAL RFQ — TERMS & CONDITIONS

1. SUBMISSION DEADLINE
   Quotes must be submitted within seven (7) calendar days of receipt of this RFQ. Late submissions may be excluded at Hulul's sole discretion.

2. PRICE VALIDITY
   All quoted prices must remain valid for a minimum of thirty (30) days from the submission date. Currency: Saudi Riyals (SAR), inclusive of VAT where applicable per Saudi GAZT regulations.

3. VAT & TAXES
   All applicable taxes including 15% VAT must be itemised on the response. Hulul reserves the right to withhold payment on any quote that fails to itemise VAT correctly.

4. DELIVERY TERMS
   Standard delivery terms apply: DAP (Delivered At Place) to the Hulul designated site within the Kingdom of Saudi Arabia. Deviations must be explicitly noted.

5. PERFORMANCE STANDARDS
   Quoted services must comply with Saudi Standards (SASO) and applicable industry codes. Hulul reserves the right to reject non-compliant deliveries.

6. CONFIDENTIALITY
   This RFQ contains confidential pricing and operational data. Recipients must not disclose contents to any third party without written consent.

Hulul Logistics · Gas Solutions Company KSA · CR 1010693275`,

  'rfq-international': `INTERNATIONAL RFQ — TERMS & CONDITIONS (INCOTERMS 2020 APPLICABLE)

1. INCOTERMS
   Quotes must specify the Incoterms 2020 designation (e.g., FOB, CIF, CIP, DAP, DDP). Where Incoterms are not explicitly stated, CIF Jeddah/Dammam will be assumed.

2. CURRENCY & PRICING
   Pricing in vendor's quoted currency. Conversion to SAR at the published SAMA reference rate on the date of invoice issuance. Multi-currency disclaimers apply per Section 7.

3. CUSTOMS & DUTY HANDLING
   Vendor shall provide full HS-code classification, country-of-origin declaration, and commercial invoice supporting Saudi Customs (ZATCA) clearance. SABER conformity certificates required for regulated cargo.

4. SHIPMENT LEAD TIME
   Quotes must include manufacturing lead time, transit lead time (port-to-port), and customs clearance buffer. Lead-time slippage may trigger demurrage cost recovery.

5. INSURANCE
   For CIF/CIP shipments, insurance must cover minimum 110% of invoice value, all-risks, warehouse-to-warehouse, with Hulul named as loss payee.

6. PERFORMANCE BANK GUARANTEE
   For orders exceeding USD 250,000, a performance bank guarantee (PBG) of 10% may be required.

7. DISPUTE RESOLUTION & GOVERNING LAW
   Disputes resolved under Saudi law, jurisdiction Riyadh. International arbitration optional under ICC Rules where mutually agreed.

Hulul Logistics · Gas Solutions Company KSA · CR 1010693275`,

  'contract-local': `LOCAL TRANSPORT SERVICE LEVEL AGREEMENT (SLA)

1. SCOPE OF SERVICE
   Contractor shall provide transport, handling, and last-mile delivery services for cargo originating and terminating within the Kingdom of Saudi Arabia, per the specifications attached at Schedule A.

2. SERVICE LEVELS
   • Pickup punctuality: within ±60 minutes of agreed window — minimum 95% compliance
   • On-time delivery: minimum 96% within agreed delivery window
   • Cargo integrity: 99.5% — damages/shortages exceeding this threshold trigger penalty per Schedule B

3. PRICING & PAYMENT
   Pre-negotiated lane rates as per Schedule C. Invoices payable within 30 days of receipt subject to delivery verification and signed delivery notes.

4. INSURANCE
   Contractor shall maintain Goods-In-Transit (GIT) insurance covering 100% of cargo value with minimum SAR 2,000,000 single-incident limit.

5. PENALTIES & WAITING CHARGES
   Waiting charges apply per Hulul's published Demurrage & Detention Schedule. Standard free time: 2 hours from arrival. Late-pickup penalty: SAR 50/hour.

6. CONTRACT TERM
   Initial term: twelve (12) months from effective date. Auto-renewal for successive 12-month terms subject to 60-day prior written notice.

7. TERMINATION
   Either party may terminate for material breach with 30 days' cure period.

Hulul Logistics · Gas Solutions Company KSA · CR 1010693275`,

  'contract-international': `INTERNATIONAL CROSS-BORDER TRANSPORTATION AGREEMENT

1. SCOPE & ROUTING
   Carrier shall provide multi-modal international transportation services per the routing instructions attached at Schedule A. Acceptable modes: ocean, air, road (cross-border).

2. INCOTERMS APPLICABILITY
   Each shipment shall be governed by the Incoterms 2020 designation specified on the corresponding shipping order. Risk and title transfer per the agreed Incoterm.

3. DOCUMENTATION
   Carrier shall produce and maintain: Bill of Lading / Air Waybill, Commercial Invoice, Packing List, Certificate of Origin, SABER certificate (for regulated cargo), and all customs declarations required by Saudi Customs.

4. CUSTOMS COMPLIANCE
   Carrier acknowledges its obligation to comply with Saudi Customs (ZATCA), SABER conformity, and SFDA requirements where applicable. Customs duties and clearance fees are pass-through unless otherwise agreed.

5. LIMITATION OF LIABILITY
   Per Hague-Visby Rules for ocean shipments; Montreal Convention for air; CMR Convention for road. Higher liability limits available with additional declared value.

6. CURRENCY & PAYMENT
   Invoicing in USD or EUR per the agreed schedule. Payment within 45 days from the Bill of Lading / AWB date.

7. DEMURRAGE & DETENTION
   Free time at port of discharge: 2 days. Day 3 onwards at the published per-diem demurrage rate, calculated to the nearest whole day.

8. GOVERNING LAW & JURISDICTION
   Governed by the laws of the Kingdom of Saudi Arabia. Disputes resolved through arbitration under the ICC Rules, seat Riyadh, language English.

Hulul Logistics · Gas Solutions Company KSA · CR 1010693275`,

  'invoice-local': `LOCAL INVOICE — VAT & PAYMENT TERMS (GAZT COMPLIANT)

1. VAT TREATMENT
   This invoice is issued in compliance with the Saudi Arabian Value Added Tax (VAT) Implementing Regulations issued by ZATCA (formerly GAZT). All amounts denominated in Saudi Riyals (SAR) and include 15% standard VAT unless explicitly exempt.

2. ZATCA E-INVOICE
   This invoice complies with the ZATCA Phase 2 (Integration Phase) e-invoicing requirements: includes the UUID, cryptographic stamp, and previous hash where applicable.

3. PAYMENT TERMS
   Net 30 days from invoice date. Late payments incur 0.5% per-month financing charge.

4. BANKING INSTRUCTIONS
   Payment by bank transfer (SARIE / IBAN) only. Cheque payments accepted only by prior written arrangement.

5. WITHHOLDING TAX
   Withholding tax not applicable on Saudi-to-Saudi transactions between VAT-registered entities.

6. DISPUTE WINDOW
   Invoice queries must be raised in writing within 14 days of receipt. Beyond this window, the invoice is deemed accepted as billed.

Hulul Logistics · Gas Solutions Company KSA · CR 1010693275 · VAT 300000000000003`,

  'invoice-international': `INTERNATIONAL INVOICE — MULTI-CURRENCY & DUTY DISCLAIMER

1. CURRENCY OF INVOICE
   This invoice is denominated in the currency stated on the invoice header. For accounting in SAR, the SAMA reference exchange rate on the invoice date applies.

2. INCOTERMS & RISK
   Title and risk of loss transfer per the Incoterms 2020 designation indicated on the invoice. Where DDP applies, all import duties and taxes are pre-paid by the seller and reflected in the invoice total.

3. DUTIES, TARIFFS & ZATCA VAT
   Where Incoterms allocate import duties to the buyer (DAP, CIF, etc.), the buyer (Hulul) shall settle duties directly with Saudi Customs. Such duties are NOT included in this invoice.

4. SABER & CONFORMITY
   For SABER-regulated goods, the seller warrants that valid SABER Certificates of Conformity were uploaded to the SABER platform prior to shipment. Penalties for non-compliance are recoverable from this invoice.

5. WITHHOLDING TAX
   Saudi withholding tax may apply on services rendered by non-resident parties (typically 5% on freight, 15% on royalties, 20% on management fees). Tax certificates required for treaty relief.

6. PAYMENT METHOD
   International wire transfer (SWIFT). Letter of Credit acceptable where pre-agreed under separate documentary credit terms.

7. PAYMENT TERMS
   Net 45 days from invoice date or per the underlying purchase order, whichever is later.

8. CURRENCY FLUCTUATION DISCLAIMER
   Exchange-rate variances between invoice date and payment date are borne by the paying party unless otherwise stipulated.

Hulul Logistics · Gas Solutions Company KSA · CR 1010693275`,
}

const buildTemplate = (docType, scope) => {
  const key = `${docType}-${scope}`
  return {
    id:        `TCT-${docType.toUpperCase()}-${scope.toUpperCase()}`,
    docType,
    scope,
    body:      TEMPLATE_BODIES[key] ?? '',
    active:    true,
    version:   1,
    updatedAt: daysAgo(scope === 'international' ? 7 : 14),
    updatedBy: 'Abdullah Al-Hulul',
    audit:     [
      { id: `${docType}-${scope}-a1`, actor: 'Abdullah Al-Hulul', action: 'Template created',
        at: daysAgo(120), meta: { version: 1 } },
      { id: `${docType}-${scope}-a2`, actor: 'Sara Al-Otaibi',   action: 'Activated',
        at: daysAgo(115), meta: { active: true } },
    ],
  }
}

export const TC_TEMPLATES_INITIAL = TC_DOC_TYPES.flatMap(d =>
  TC_SCOPES.map(s => buildTemplate(d.id, s.id))
)

// Look up the ACTIVE template for a given (docType, scope) pair. Used by the
// document-generation engine to inject T&C text into the footer/appendix of
// any RFQ / Contract / Invoice produced by the system.
export function getActiveTemplate(templates, docType, scope) {
  return templates.find(t => t.docType === docType && t.scope === scope && t.active) ?? null
}
