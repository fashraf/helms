// ═══════════════════════════════════════════════════════════════════════════
// HULUL BRAND CHROME
// Shared header (logo + title) and footer (CR + capital + addresses) used by
// all printable forms so the corporate identity stays consistent.
// Uses table layout for maximum print-engine compatibility (flexbox can be
// quirky in some print drivers).
// ═══════════════════════════════════════════════════════════════════════════

const BRAND_NAVY = '#0033A0'
const TEXT_NAVY  = '#1E3A8A'

export function BrandHeader({ title, docNo, version, implementation, page = '1 of 1' }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }}>
      <tbody>
        <tr>
          <td style={{ verticalAlign: 'top', width: '50%' }}>
            <img src="/brand/hulul-logo.jpg" alt="Hulul" style={{ width: '110px', height: 'auto', display: 'block' }} />
            {docNo && (
              <div style={{ fontFamily: 'monospace', fontSize: '8pt', marginTop: '4pt', color: '#0F172A', lineHeight: 1.4 }}>
                Doc. No. <span style={{ fontWeight: 600 }}>{docNo}</span>
                {implementation && <span>&nbsp;&nbsp;Implementation: <span style={{ fontWeight: 600 }}>{implementation}</span></span>}
                {version && <span>&nbsp;&nbsp;Version: <span style={{ fontWeight: 600 }}>{version}</span></span>}
                {page && <span>&nbsp;&nbsp;Page <span style={{ fontWeight: 600 }}>{page}</span></span>}
              </div>
            )}
          </td>
          <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
            {title && (
              <div style={{ color: BRAND_NAVY, fontSize: '26pt', fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
                {title}
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function BrandFooter() {
  // Five rows, each English on the left and Arabic on the right.
  // Stacking same-statement pairs in a row prevents any RTL/LTR collision
  // in older print engines while still presenting bilingual layout cleanly.
  const lines = [
    { en: 'Gas Solutions Company is a Saudi company for one person with limited liability',
      ar: 'شركة الحلول للغاز شركة سعودية لشخص واحد ذات مسؤولية محدودة' },
    { en: 'The paid capital is 50,000,000 SAR',
      ar: 'رأس المال المدفوع 50,000,000 ريال سعودي' },
    { en: 'Kingdom of Saudi Arabia',
      ar: 'المملكة العربية السعودية' },
    { en: 'Commercial Registration No. 1010693275',
      ar: 'السجل التجاري' },
    { en: '8001240000',
      ar: 'الرقم الموحد' },
  ]
  return (
    <div style={{ marginTop: '6mm', paddingTop: '3mm', borderTop: '0.5pt solid #CBD5E1', fontSize: '7.5pt', color: '#475569' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', lineHeight: 1.55 }}>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ width: '55%', textAlign: 'left', padding: '1pt 4pt 1pt 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{l.en}</td>
              <td style={{ width: '45%', textAlign: 'right', padding: '1pt 0 1pt 4pt', verticalAlign: 'top', whiteSpace: 'nowrap' }} dir="rtl" lang="ar">{l.ar}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Common page wrapper — A4 padding, font stack, base styles
export function PrintPage({ children }) {
  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 14mm 8mm',
      fontFamily: 'Calibri, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: '10pt',
      color: '#0F172A',
      background: '#fff',
      boxSizing: 'border-box',
    }}>
      <div>{children}</div>
      <BrandFooter />
    </div>
  )
}

export { BRAND_NAVY, TEXT_NAVY }
