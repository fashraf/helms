// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT REQUEST — ACT-FRM-001 (rev 02)
// Faithful reproduction of the Hulul/Gas Solutions payment request form.
// Bilingual labels (Arabic + English) per the original template.
// ═══════════════════════════════════════════════════════════════════════════

import { BrandHeader, PrintPage, BRAND_NAVY } from './BrandChrome'

const HEADER_BG = '#1B3699'
const FIELD_BG  = '#F1F5F9'

function fmtDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '' }
}
function fmtMoney(n) {
  if (n == null || n === '') return ''
  const v = Number(n)
  if (Number.isNaN(v)) return ''
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PaymentRequest({ data = {} }) {
  const {
    paymentMethod = 'bank_transfer',   // bank_transfer | due_amount | cash | cheque
    supplierName, supplierSapId,
    projectId, projectName,
    advancePaid = 0, advancePaidAmount = 0,
    poValue = 0, poNumber, poDate,
    description, typeOfService, invoiceNumber, remarks,
    amount = 0, withholdingTax = 0, vat = 0,
    issueDate, currency = 'SAR',
    preparedBy = 'Khizar Hayat',
    lineManager = 'Khizar Hayat',
    finance = {},   // { checkedBy, reviewedBy, approvedBy }
  } = data

  const total = Number(amount || 0) + Number(vat || 0) - Number(withholdingTax || 0)
  const balancePayable = Number(poValue || 0) - Number(advancePaidAmount || 0)

  const Check = ({ on }) => (
    <span style={{
      display: 'inline-block', width: '11pt', height: '11pt',
      border: '1pt solid #0F172A', textAlign: 'center', lineHeight: '11pt',
      fontSize: '11pt', verticalAlign: 'middle', marginRight: '3pt',
    }}>{on ? '✓' : ''}</span>
  )

  return (
    <PrintPage>
      {/* Custom header — payment request has a two-row title block */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1pt solid #0F172A' }}>
        <div style={{ flex: '0 0 110px', display: 'flex', alignItems: 'center', padding: '4pt 0' }}>
          <img src="/brand/hulul-logo.jpg" alt="Hulul" style={{ width: '95px', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: '#fff', color: BRAND_NAVY, padding: '6pt 12pt', textAlign: 'center',
            fontWeight: 700, fontSize: '14pt', borderBottom: '0.5pt solid #94A3B8',
          }}>
            <span dir="rtl">طلب صرف</span> - PAYMENT REQUEST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: 'none' }}>
            <div style={{ ...hdrCell, color: BRAND_NAVY, fontWeight: 700 }}>ACT-FRM-001</div>
            <div style={hdrCell}>Revision 02</div>
            <div style={hdrCell}>Issue Date: {fmtDate(issueDate) || '23-Jun-26'}</div>
          </div>
        </div>
      </div>

      {/* Payment method checkboxes */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4mm', border: '0.5pt solid #0F172A' }}>
        <tbody>
          <tr>
            {[
              { id: 'bank_transfer', en: 'Bank Transfer', ar: 'تحويل بنكي' },
              { id: 'due_amount',    en: 'Due Amount',    ar: 'سداد' },
              { id: 'cash',          en: 'Cash',          ar: 'نقداً' },
              { id: 'cheque',        en: 'Cheque',        ar: 'شيك' },
            ].map((m, idx, arr) => (
              <td key={m.id} style={{
                padding: '4pt 8pt', textAlign: 'center', verticalAlign: 'middle',
                borderRight: idx < arr.length - 1 ? '0.5pt solid #0F172A' : 'none',
                fontSize: '9.5pt',
              }}>
                <div dir="rtl" style={{ fontSize: '9pt', color: '#475569' }}>{m.ar}</div>
                <div style={{ marginTop: '2pt' }}>
                  <Check on={paymentMethod === m.id} />
                  <strong>{m.en}</strong>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Supplier row */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0', border: '0.5pt solid #0F172A', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4pt 8pt', borderBottom: '0.5pt solid #0F172A' }}>
              <span style={{ fontWeight: 700, fontSize: '9.5pt' }} dir="rtl">أسم المورد </span>
              <span style={{ fontWeight: 700, fontSize: '9.5pt' }}>(Supplier Name):</span>
              <span style={{ marginLeft: '8pt', fontSize: '9.5pt' }}>{supplierName || ''}</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4pt 8pt' }}>
              <span style={{ fontWeight: 700, fontSize: '9.5pt' }} dir="rtl">رقم المورد في ساب </span>
              <span style={{ fontWeight: 700, fontSize: '9.5pt' }}>(SAP ID):</span>
              <span style={{ marginLeft: '8pt', fontSize: '9.5pt', fontFamily: 'monospace' }}>{supplierSapId || ''}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Project / PO info block */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0', border: '0.5pt solid #0F172A', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ ...projCell, width: '40%' }}>
              <div style={{ marginBottom: '8pt' }}><strong>Project ID:</strong> <span style={{ marginLeft: '4pt' }}>{projectId || ''}</span></div>
              <div><strong>Proj Name:</strong> <span style={{ marginLeft: '4pt' }}>{projectName || ''}</span></div>
            </td>
            <td style={projLabelCell}>Advance Paid:</td>
            <td style={{ ...projValCell, width: '8%' }}>{Number(advancePaid || 0).toFixed(0)}%</td>
            <td style={projValCell}>{currency} {fmtMoney(advancePaidAmount)}</td>
            <td rowSpan={3} style={{ ...projCell, width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ fontWeight: 700, fontSize: '9pt' }}>Balance<br />Payable</div>
              <div style={{ marginTop: '6pt', fontSize: '12pt', fontWeight: 700, color: BRAND_NAVY }}>
                {fmtMoney(balancePayable)}
              </div>
            </td>
          </tr>
          <tr>
            <td style={projLabelCell}>PO Value</td>
            <td colSpan={2} style={projValCell}>{currency} {fmtMoney(poValue)}</td>
          </tr>
          <tr>
            <td colSpan={1} style={{ ...projCell, width: '40%', borderTop: '0.5pt solid #0F172A' }}>
              <div><strong>PO/Contract #:</strong> <span style={{ marginLeft: '4pt' }}>{poNumber || ''}</span></div>
              <div style={{ marginTop: '6pt' }}><strong>PO Date:</strong> <span style={{ marginLeft: '4pt' }}>{fmtDate(poDate)}</span></div>
            </td>
            <td colSpan={3} style={{ background: FIELD_BG, borderTop: '0.5pt solid #0F172A' }}></td>
          </tr>
        </tbody>
      </table>

      {/* Line item table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4mm', border: '0.5pt solid #0F172A' }}>
        <thead>
          <tr style={{ background: HEADER_BG, color: '#fff' }}>
            <th style={lineHead}>
              <div dir="rtl" style={{ fontSize: '9pt' }}>البند</div>
              <div style={{ fontSize: '10pt' }}>Item</div>
            </th>
            <th style={lineHead}>
              <div dir="rtl" style={{ fontSize: '9pt' }}>البيـــــــــــان</div>
              <div style={{ fontSize: '10pt' }}>Description</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            { ar: 'وصف لنوع التعاقد /التوريد /الخدمة المقدمة', en: 'Type of Service Provided', v: typeOfService },
            { ar: 'رقم فاتورة المورد', en: 'Invoice Number', v: invoiceNumber },
            { ar: 'ملاحظات', en: 'Remarks/Comments/Notes', v: remarks },
            { ar: 'المبلغ المستحق', en: 'Amount', v: amount != null ? `${currency} ${fmtMoney(amount)}` : '' },
            { ar: 'ضريبة الاستقطاع', en: 'Withholding Tax', v: withholdingTax != null ? `${currency} ${fmtMoney(withholdingTax)}` : '' },
            { ar: 'الضريبة المضافة', en: 'VAT', v: vat != null ? `${currency} ${fmtMoney(vat)}` : '' },
            { ar: 'الإجمالي', en: 'Total', v: `${currency} ${fmtMoney(total)}`, totalRow: true },
          ].map((row, idx) => (
            <tr key={idx}>
              <td style={{
                ...lineLabel,
                background: row.totalRow ? '#FEF3C7' : (idx % 2 === 0 ? '#fff' : '#F8FAFC'),
              }}>
                <div dir="rtl" style={{ fontSize: '8.5pt', color: '#334155' }}>{row.ar}</div>
                <div style={{ fontWeight: 700, fontSize: '9.5pt' }}>{row.en}</div>
              </td>
              <td style={{
                ...lineValue,
                fontWeight: row.totalRow ? 700 : 400,
                fontSize: row.totalRow ? '11pt' : '9.5pt',
                color: row.totalRow ? BRAND_NAVY : '#0F172A',
                background: row.totalRow ? '#FEF3C7' : '#fff',
              }}>{row.v || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Preparer / Line Manager row */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4mm', border: '0.5pt solid #0F172A' }}>
        <tbody>
          <tr>
            <td style={prepLabel}><span dir="rtl">مقدم الطلب </span>Prepared By</td>
            <td style={prepValue}>{preparedBy}</td>
            <td style={prepLabel}>(Line Manager) <span dir="rtl">المدير المباشر</span></td>
            <td style={prepValue}>{lineManager}</td>
          </tr>
          <tr>
            <td style={prepLabel}><span dir="rtl">التوقيع </span>Sign</td>
            <td style={prepValue}></td>
            <td style={prepLabel}>Sign <span dir="rtl">التوقيع</span></td>
            <td style={prepValue}></td>
          </tr>
          <tr>
            <td style={prepLabel}>Checked By:</td>
            <td style={prepValue}>{finance.checkedBy || ''}</td>
            <td style={prepLabel}><span dir="rtl">المرفقات بعدد</span></td>
            <td style={prepValue}></td>
          </tr>
          <tr>
            <td style={prepLabel}>Approved By:</td>
            <td style={prepValue}>{finance.approvedBy || ''}</td>
            <td style={prepLabel}><span dir="rtl">تفاصيل المرفقات</span></td>
            <td style={prepValue}></td>
          </tr>
        </tbody>
      </table>

      {/* For Finance Use Only — approval signatures */}
      <div style={{ marginTop: '4mm', textAlign: 'center', fontWeight: 700, fontSize: '10pt' }}>
        <span dir="rtl">معتمد الدفع حسب الصلاحيات </span>(For Finance Use Only)
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2mm', border: '0.5pt solid #0F172A' }}>
        <tbody>
          <tr>
            <td style={apprHead}><div dir="rtl">توقيع معتمد الطلب</div><div>Approved By</div></td>
            <td style={apprHead}><div dir="rtl">توقيع مؤيد الطلب</div><div>Reviewed By</div></td>
            <td style={apprHead}><div dir="rtl">توقيع مراجع الطلب</div><div>Checked By</div></td>
            <td style={{ ...apprHead, width: '28%' }}>
              <div dir="rtl">الاعتماد حسب الصلاحيات</div>
            </td>
          </tr>
          <tr>
            <td style={apprSig}>{finance.approvedBy && (<span style={sigStyle}>{finance.approvedBy}</span>)}</td>
            <td style={apprSig}>{finance.reviewedBy && (<span style={sigStyle}>{finance.reviewedBy}</span>)}</td>
            <td style={apprSig}>{finance.checkedBy  && (<span style={sigStyle}>{finance.checkedBy}</span>)}</td>
            <td style={apprSig}></td>
          </tr>
        </tbody>
      </table>

      {/* Form footer band */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4mm', border: '0.5pt solid #0F172A' }}>
        <tbody>
          <tr>
            <td style={fmtCell}><strong style={{ color: BRAND_NAVY }}>Page 1 of 1</strong></td>
            <td style={fmtCell}><strong>Issued date:</strong> <span style={{ color: BRAND_NAVY }}>24-Jul-24</span></td>
            <td style={fmtCell}><strong>Rev:</strong> <span style={{ color: BRAND_NAVY }}>00</span></td>
            <td style={fmtCell}><strong style={{ color: BRAND_NAVY }}>ACT-FRM-001</strong></td>
          </tr>
        </tbody>
      </table>
    </PrintPage>
  )
}

const hdrCell  = { padding: '3pt 8pt', textAlign: 'center', fontSize: '10pt', borderRight: '0.5pt solid #94A3B8' }
const projCell = { padding: '5pt 8pt', verticalAlign: 'top', fontSize: '9.5pt', borderRight: '0.5pt solid #0F172A' }
const projLabelCell = { padding: '4pt 8pt', fontWeight: 700, fontSize: '9.5pt', borderRight: '0.5pt solid #0F172A', verticalAlign: 'middle', background: '#fff' }
const projValCell   = { padding: '4pt 8pt', fontSize: '9.5pt', borderRight: '0.5pt solid #0F172A', verticalAlign: 'middle', background: FIELD_BG, fontFamily: 'monospace' }
const lineHead  = { padding: '4pt', textAlign: 'center', borderRight: '0.5pt solid #fff' }
const lineLabel = { padding: '4pt 8pt', textAlign: 'right', borderBottom: '0.5pt solid #94A3B8', borderRight: '0.5pt solid #94A3B8', width: '40%', verticalAlign: 'middle' }
const lineValue = { padding: '4pt 10pt', borderBottom: '0.5pt solid #94A3B8', verticalAlign: 'middle', fontFamily: 'monospace' }
const prepLabel = { padding: '4pt 8pt', fontWeight: 700, fontSize: '9pt', borderRight: '0.5pt solid #0F172A', borderBottom: '0.5pt solid #94A3B8', verticalAlign: 'middle', background: '#fff' }
const prepValue = { padding: '4pt 8pt', fontSize: '9.5pt', borderRight: '0.5pt solid #0F172A', borderBottom: '0.5pt solid #94A3B8', verticalAlign: 'middle', background: FIELD_BG, minHeight: '14pt' }
const apprHead  = { padding: '4pt 6pt', textAlign: 'center', fontSize: '9pt', borderRight: '0.5pt solid #0F172A', borderBottom: '0.5pt solid #0F172A', verticalAlign: 'middle', background: '#fff' }
const apprSig   = { padding: '6pt 8pt', textAlign: 'center', borderRight: '0.5pt solid #0F172A', minHeight: '40pt', verticalAlign: 'middle', background: FIELD_BG, height: '70pt' }
const sigStyle  = { fontFamily: '"Segoe Script","Brush Script MT", cursive', fontSize: '14pt', color: BRAND_NAVY }
const fmtCell   = { padding: '4pt 8pt', textAlign: 'center', fontSize: '9.5pt', borderRight: '0.5pt solid #0F172A', background: '#fff' }
