// Export helpers for finance dashboard sections
// Excel via xlsx (already installed). PDF via simple print-window approach.
import * as XLSX from 'xlsx'

export function exportToExcel(filename, sheets) {
  // sheets: [{ name, rows: [{ col: value, ... }] }]
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows ?? [])
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 30))
  })
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportToPDF(title, sectionEl) {
  // Open a print-ready window with the section HTML
  if (!sectionEl) {
    window.print()
    return
  }
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body { font-family: -apple-system, sans-serif; padding: 20px; color: #1F2937; }
      h1 { font-size: 18px; margin-bottom: 8px; }
      .meta { color: #6B7280; font-size: 11px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 12px 0; }
      th, td { padding: 6px 8px; border: 1px solid #E5E7EB; text-align: left; }
      th { background: #F9FAFB; font-weight: 700; text-transform: uppercase; font-size: 9px; }
      .kpi { display: inline-block; padding: 8px 12px; margin: 4px; border: 1px solid #E5E7EB; border-radius: 6px; min-width: 140px; }
      .kpi .label { font-size: 9px; color: #6B7280; font-weight: 700; text-transform: uppercase; }
      .kpi .value { font-size: 16px; font-weight: 800; font-family: ui-monospace, monospace; }
    </style></head><body>
    <h1>${title}</h1>
    <div class="meta">Generated ${new Date().toLocaleString('en-SA')} · HELMS Finance Export</div>
    ${sectionEl.outerHTML}
    <script>setTimeout(() => window.print(), 200)</script>
  </body></html>`)
  w.document.close()
}

// Format helpers reused across sections
export const fmtMoney = (n) => (n ?? 0).toLocaleString()
export const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
export const isInMonth = (iso, year, month) => {
  if (!iso) return false
  const d = new Date(iso)
  return d.getFullYear() === year && d.getMonth() === month
}

// Generate last N months for trend charts
export function lastNMonths(n) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString('en-SA', { month:'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return out
}
