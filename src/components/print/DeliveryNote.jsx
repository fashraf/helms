// ═══════════════════════════════════════════════════════════════════════════
// DELIVERY NOTE — GS-DN2024-01
// Faithful reproduction of the Hulul/Gas Solutions delivery-note template.
// Fills automatically from a shipment object passed in.
// ═══════════════════════════════════════════════════════════════════════════

import { BrandHeader, PrintPage, BRAND_NAVY } from './BrandChrome'

const HEADER_BG = '#1B3699'   // Deep navy — matches PDF
const FIELD_BG  = '#F1F5F9'   // Light gray for field values
const ROW_COUNT = 14          // Match the original PDF row count exactly

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '' }
}

export default function DeliveryNote({ data = {} }) {
  // Defensive defaults — any field can be missing
  const {
    orderDate, purchaseOrder, deliveryNoteNumber, customerId, despatchDate, packingList,
    shippingTo = {},
    items = [],
    specialNotes = '',
    approvedBy = '',
    approverSignature = '',
    receivedByName = '',
    receivedByCompany = '',
  } = data

  // Pad items to fill the table to match the printed form
  const paddedItems = [...items]
  while (paddedItems.length < ROW_COUNT) paddedItems.push(null)

  // Field-value row: label on the left, gray-filled value cell on the right
  const Field = ({ label, value, valueAlign = 'left' }) => (
    <tr>
      <td style={{ padding: '2pt 6pt 2pt 0', textAlign: 'right', fontSize: '9.5pt', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ background: FIELD_BG, height: '14pt', minWidth: '60mm', padding: '1pt 4pt', fontSize: '9.5pt', textAlign: valueAlign }}>{value || ''}</td>
    </tr>
  )

  return (
    <PrintPage>
      {/* Header — logo + title aligned with PDF layout */}
      <BrandHeader title="Delivery Note" docNo="GS-DN2024-01" page="1 of 1" />

      {/* Right-side info block */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6mm' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <Field label="Order Date"        value={fmtDate(orderDate)} />
            <Field label="Purchase Order #"  value={purchaseOrder} />
            <Field label="Delivery Note #"   value={deliveryNoteNumber} />
            <Field label="Customer ID"       value={customerId} />
            <Field label="Despatch Date"     value={fmtDate(despatchDate)} />
            <Field label="Packing List"      value={packingList} />
          </tbody>
        </table>
      </div>

      {/* Shipping address section */}
      <div style={{ marginTop: '6mm' }}>
        <div style={{
          background: HEADER_BG, color: '#fff', padding: '3pt 8pt',
          fontWeight: 700, fontSize: '9.5pt', width: '55mm',
        }}>
          Shipping Address &amp; Details :
        </div>
        <div style={{ minHeight: '14mm', padding: '3pt 8pt', fontSize: '9.5pt', lineHeight: 1.5 }}>
          {shippingTo.name && <div>{shippingTo.name}</div>}
          {shippingTo.address && <div>{shippingTo.address}</div>}
          {shippingTo.city && <div>{shippingTo.city}{shippingTo.country ? `, ${shippingTo.country}` : ''}</div>}
          {shippingTo.contact && <div>Contact: {shippingTo.contact}</div>}
          {shippingTo.phone && <div>Phone: {shippingTo.phone}</div>}
        </div>
      </div>

      {/* Items table — matches PDF column widths */}
      <table style={{
        width: '100%', borderCollapse: 'collapse', marginTop: '4mm',
        border: '0.75pt solid ' + HEADER_BG, fontSize: '9pt',
      }}>
        <thead>
          <tr style={{ background: HEADER_BG, color: '#fff' }}>
            <th style={{ ...colHead, width: '7%'  }}>Sn</th>
            <th style={{ ...colHead, width: '14%' }}>Code</th>
            <th style={{ ...colHead, width: '36%' }}>Descriptions</th>
            <th style={{ ...colHead, width: '10%' }}>Del Qty.</th>
            <th style={{ ...colHead, width: '8%'  }}>UOM</th>
            <th style={{ ...colHead, width: '25%' }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((it, i) => (
            <tr key={i} style={{ height: '14pt' }}>
              <td style={cellBorder}>{it ? i + 1 : ''}</td>
              <td style={cellBorder}>{it?.code ?? ''}</td>
              <td style={{ ...cellBorder, textAlign: 'left', paddingLeft: '5pt' }}>{it?.description ?? ''}</td>
              <td style={cellBorder}>{it?.quantity ?? ''}</td>
              <td style={cellBorder}>{it?.uom ?? ''}</td>
              <td style={{ ...cellBorder, textAlign: 'left', paddingLeft: '5pt' }}>{it?.remarks ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Special Notes */}
      <div style={{
        marginTop: '5mm', border: '0.75pt solid #0F172A', padding: '4pt 6pt',
        minHeight: '24mm', fontSize: '9.5pt',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '4pt' }}>Special Notes:</div>
        <div style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{specialNotes}</div>
      </div>

      {/* T&C inherited from the active template engine */}
      {data.tcAppendix && (
        <div style={{
          marginTop: '4mm', padding: '6pt 8pt',
          background: '#F8FAFC', border: '0.5pt solid #CBD5E1',
          fontSize: '7.5pt', lineHeight: 1.45, color: '#475569',
          whiteSpace: 'pre-wrap',
        }}>
          <div style={{ fontWeight: 700, fontSize: '8pt', color: '#0033A0', marginBottom: '3pt' }}>
            Terms &amp; Conditions Appendix
          </div>
          {data.tcAppendix}
        </div>
      )}

      {/* Signatures */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4mm', border: '0.75pt solid #0F172A', fontSize: '9.5pt' }}>
        <tbody>
          <tr>
            <td style={{ ...sigCell, width: '50%', borderRight: '0.75pt solid #0F172A' }}>
              <div style={{ fontWeight: 700 }}>For Gas Solutions Co.</div>
              <div style={{ marginTop: '10pt', fontWeight: 700 }}>Approved By : Gas Solutions Co.</div>
              <div style={{ marginTop: '4pt', fontWeight: 600, color: '#475569' }}>{approvedBy}</div>
              <div style={{ marginTop: '12pt', fontWeight: 700 }}>Signature :</div>
              {approverSignature && (
                <div style={{ marginTop: '2pt', fontFamily: '"Segoe Script","Brush Script MT", cursive', fontSize: '14pt', color: BRAND_NAVY }}>
                  {approverSignature}
                </div>
              )}
            </td>
            <td style={sigCell}>
              <div style={{ fontWeight: 700 }}>Goods Received By :</div>
              <div style={{ marginTop: '10pt', fontWeight: 700 }}>Name :</div>
              <div style={{ marginTop: '2pt', color: '#475569' }}>{receivedByName}</div>
              <div style={{ marginTop: '8pt', fontWeight: 700 }}>Company Name :</div>
              <div style={{ marginTop: '2pt', color: '#475569' }}>{receivedByCompany}</div>
              <div style={{ marginTop: '8pt', fontWeight: 700 }}>Signature :</div>
            </td>
          </tr>
        </tbody>
      </table>
    </PrintPage>
  )
}

const colHead = {
  padding: '3pt 4pt',
  fontWeight: 700,
  fontSize: '9pt',
  textAlign: 'center',
  border: '0.5pt solid #fff',
}

const cellBorder = {
  border: '0.5pt solid #94A3B8',
  textAlign: 'center',
  padding: '2pt 4pt',
  fontSize: '9pt',
}

const sigCell = {
  verticalAlign: 'top',
  padding: '4pt 8pt 8pt',
  minHeight: '40mm',
}
