// ═══════════════════════════════════════════════════════════════════════════
// QUOTATIONS COMPARISON FORM — GS-SC-FRM (v03)
// Faithful reproduction of the Hulul supply-chain comparison sheet.
// Compares up to 3 supplier quotes side-by-side; auto-fills selected supplier.
// ═══════════════════════════════════════════════════════════════════════════

import { BrandHeader, PrintPage, BRAND_NAVY } from './BrandChrome'

const SECTION_BG = '#E8EAF6'   // Soft lavender — matches PDF section headers
const SUPPLIER_BG = '#E1E5F2'  // Section row with supplier names
const FIELD_BG   = '#F1F5F9'

function fmtMoney(n) {
  if (n == null || n === '') return ''
  const v = Number(n)
  if (Number.isNaN(v)) return ''
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '' }
}

export default function ComparisonSheet({ data = {} }) {
  const {
    prNumber, prApprovedDate, poNumber, poDate, project, currency = 'SAR',
    poType, leadTime, comparisonPeriod, validTill,
    suppliers = [{}, {}, {}],
    selectedSupplierIndex = 0,
    costReduction,
    justification = {},
    approvals = {},
  } = data

  // Always have 3 supplier columns
  const cols = [...suppliers]
  while (cols.length < 3) cols.push({})

  const Section = ({ title }) => (
    <tr><td colSpan={4} style={{
      background: SECTION_BG, padding: '4pt 8pt', fontWeight: 700,
      fontSize: '10.5pt', textAlign: 'center', border: '0.5pt solid #94A3B8',
    }}>{title}</td></tr>
  )

  const InfoRow = ({ label, value }) => (
    <tr>
      <td style={infoLabel}>{label}</td>
      <td style={infoValue}>{value || ''}</td>
    </tr>
  )

  const CompareRow = ({ label, render }) => (
    <tr>
      <td style={compareLabel}>{label}</td>
      {cols.map((s, i) => <td key={i} style={compareCell}>{render(s, i)}</td>)}
    </tr>
  )

  const justFlag = (key) => justification[key] ? '☑' : '☐'

  return (
    <PrintPage>
      <BrandHeader docNo="GS-SC-FRM" implementation="05/02/2024" version="03" page="1 of 1" />
      <div style={{ marginTop: '2mm', fontWeight: 700, fontSize: '10.5pt', borderBottom: '0.75pt solid #0F172A', paddingBottom: '2pt' }}>
        Title: Quotations Comparison Form
      </div>

      {/* PR / PO INFO */}
      <table style={tbl}>
        <tbody>
          <Section title="PR / PO information" />
          <tr>
            <td style={infoLabel}>PR #</td>
            <td style={infoValue}>{prNumber || ''}</td>
            <td style={infoLabel}>PR Approved Date</td>
            <td style={infoValue}>{fmtDate(prApprovedDate)}</td>
          </tr>
          <tr>
            <td style={infoLabel}>PO #</td>
            <td style={infoValue}>{poNumber || ''}</td>
            <td style={infoLabel}>PO date</td>
            <td style={infoValue}>{fmtDate(poDate)}</td>
          </tr>
          <tr>
            <td style={infoLabel}>Project</td>
            <td style={infoValue}>{project || ''}</td>
            <td style={infoLabel}>Currency</td>
            <td style={infoValue}>{currency || ''}</td>
          </tr>
          <tr>
            <td style={infoLabel}>PO Type</td>
            <td style={infoValue}>{poType || ''}</td>
            <td style={infoLabel}>Lead Time</td>
            <td style={infoValue}>{leadTime || ''}</td>
          </tr>
          <tr>
            <td style={infoLabel}>Comparison Period</td>
            <td style={infoValue}>{comparisonPeriod ? `${comparisonPeriod} months` : ''}</td>
            <td style={infoLabel}>Valid till</td>
            <td style={infoValue}>{fmtDate(validTill)}</td>
          </tr>
        </tbody>
      </table>

      {/* COMPARISON GRID */}
      <table style={tbl}>
        <tbody>
          <Section title="Comparison" />
          {/* Header rows — Supplier # / Name */}
          <tr>
            <td style={compareLabel}>Comparison Criteria</td>
            {cols.map((_, i) => (
              <td key={i} style={{ ...supplierHeadCell }}>{`Supplier # ${i + 1}`}</td>
            ))}
          </tr>
          <tr>
            <td style={{ ...compareLabel, background: '#fff' }}></td>
            {cols.map((s, i) => (
              <td key={i} style={{ ...supplierNameCell, background: i === selectedSupplierIndex ? '#FEF3C7' : SUPPLIER_BG }}>
                {s.name || ''}
              </td>
            ))}
          </tr>
          <CompareRow label="1- Quoted items" render={(s) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt', alignItems: 'flex-start', paddingLeft: '4pt' }}>
              <span style={{ fontSize: '8pt' }}>{s.quotedItems === 'partial' ? '☑' : '☐'} Partially Quoted</span>
              <span style={{ fontSize: '8pt' }}>{s.quotedItems === 'full' ? '☑' : '☐'} Fully Quoted</span>
            </div>
          )} />
          <CompareRow label="2- Incoterms"          render={(s) => s.incoterms || ''} />
          <CompareRow label="3- Payment Terms"      render={(s) => s.paymentTerms || ''} />
          <CompareRow label="4- Delivery Lead Time" render={(s) => s.deliveryLeadTime || ''} />
          <CompareRow label="5- Quality / Brand"    render={(s) => s.qualityBrand || ''} />
          <CompareRow label="Total Price without VAT" render={(s) => s.totalPriceWithoutVat != null ? fmtMoney(s.totalPriceWithoutVat) : ''} />
          <tr>
            <td colSpan={3} style={{ ...compareLabel, fontStyle: 'italic', fontSize: '9pt', textAlign: 'center' }}>
              Total cost reduction achieved through comparison and/or negotiation (Without VAT)
            </td>
            <td style={{ ...compareCell, fontWeight: 700, fontSize: '11pt', textAlign: 'center', background: FIELD_BG }}>
              {currency} {fmtMoney(costReduction ?? 0)}
            </td>
          </tr>
          <tr>
            <td style={compareLabel}>Selected Supplier</td>
            {cols.map((s, i) => (
              <td key={i} style={{ ...compareCell, fontWeight: 700, fontSize: '14pt', color: BRAND_NAVY, textAlign: 'center' }}>
                {i === selectedSupplierIndex ? '✓' : ''}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* JUSTIFICATION */}
      <table style={tbl}>
        <tbody>
          <Section title="Justification:" />
          <tr><td colSpan={4} style={{ padding: '5pt 8pt', fontSize: '8.5pt', border: '0.5pt solid #94A3B8' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3pt 16pt' }}>
              <span>{justFlag('singleSource')} Single source due to high urgency</span>
              <span>{justFlag('preQualified')} Pre-qualifications / Material submittal approved by project</span>
              <span>{justFlag('exclusiveAgent')} Exclusive agent / distributor for the requested brand</span>
              <span>{justFlag('onlyOneQuote')} Only 1 quotation received after several days of waiting</span>
              <span>{justFlag('aramcoApproved')} Aramco Approved</span>
              <span>{justFlag('geoLack')} Lack of suppliers in certain geographical area</span>
              <span>{justFlag('contractual')} Contractual / Exclusive Agreement</span>
              <span>{justFlag('other')} Other reason (Specify below) :</span>
            </div>
            <div style={{ marginTop: '6pt', minHeight: '10mm', fontSize: '9pt', color: '#334155' }}>
              {justification.otherText || ''}
            </div>
          </td></tr>
        </tbody>
      </table>

      {/* APPROVALS */}
      <table style={tbl}>
        <tbody>
          <Section title="Approvals" />
          {[
            { id: 'evaluatedBy',   label: 'Evaluated by:' },
            { id: 'reviewedBy',    label: 'Reviewed by:' },
            { id: 'supplyChainMgr',label: 'Reviewed by:', sub: 'Supply Chain Manager' },
            { id: 'ceo',           label: 'Approved by:', sub: 'CEO' },
          ].map((row) => (
            <tr key={row.id}>
              <td style={apprLabel}>
                <div style={{ fontWeight: 700 }}>{row.label}</div>
                {row.sub && <div style={{ fontWeight: 700 }}>{row.sub}</div>}
              </td>
              <td style={apprName}>{approvals[row.id]?.name || ''}</td>
              <td style={apprLabel}>Signature</td>
              <td style={apprSig}>
                {approvals[row.id]?.signature && (
                  <span style={{ fontFamily: '"Segoe Script","Brush Script MT", cursive', fontSize: '14pt', color: BRAND_NAVY }}>
                    {approvals[row.id].signature}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PrintPage>
  )
}

const tbl = { width: '100%', borderCollapse: 'collapse', marginTop: '3mm', fontSize: '9.5pt' }
const infoLabel = {
  width: '22%', padding: '4pt 8pt', fontWeight: 700, fontSize: '9.5pt',
  border: '0.5pt solid #94A3B8', background: '#fff',
}
const infoValue = {
  width: '28%', padding: '4pt 8pt', border: '0.5pt solid #94A3B8',
  background: FIELD_BG, minHeight: '14pt',
}
const compareLabel = {
  width: '22%', padding: '4pt 8pt', fontWeight: 700, fontSize: '9.5pt',
  border: '0.5pt solid #94A3B8', verticalAlign: 'middle', background: '#fff',
}
const compareCell = {
  padding: '4pt 6pt', border: '0.5pt solid #94A3B8',
  background: FIELD_BG, fontSize: '9pt', verticalAlign: 'middle', minHeight: '20pt',
}
const supplierHeadCell = {
  padding: '4pt 8pt', textAlign: 'center', fontWeight: 700,
  background: SUPPLIER_BG, border: '0.5pt solid #94A3B8', fontSize: '10pt',
}
const supplierNameCell = {
  padding: '4pt 8pt', textAlign: 'center', fontWeight: 700,
  border: '0.5pt solid #94A3B8', fontSize: '9.5pt',
}
const apprLabel = {
  width: '20%', padding: '5pt 8pt', fontWeight: 700, fontSize: '9.5pt',
  border: '0.5pt solid #94A3B8', verticalAlign: 'middle', background: '#fff',
}
const apprName = {
  width: '30%', padding: '5pt 8pt', border: '0.5pt solid #94A3B8',
  background: FIELD_BG, minHeight: '18pt', verticalAlign: 'middle',
}
const apprSig = {
  width: '30%', padding: '5pt 8pt', border: '0.5pt solid #94A3B8',
  background: FIELD_BG, minHeight: '18pt', verticalAlign: 'middle',
}
