// ═══════════════════════════════════════════════════════════════════════════
// PRINT FRAME
// Modal wrapper for any printable document (Delivery Note, Comparison Sheet,
// Payment Request). Renders the document at full A4 size inside a scrollable
// modal, with a Print button that uses the browser's native print dialog.
//
// The print CSS hides everything on the page except the .printable-doc-body
// container so the user gets a clean A4 output (auto-saves to PDF on every
// modern browser via the print dialog).
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, Download } from 'lucide-react'

export default function PrintFrame({ open, onClose, title, subtitle, docId, children }) {
  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handlePrint = () => window.print()

  return createPortal(
    <>
      {/* Print-only styles — hide everything except .printable-doc-body */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .printable-doc-body, .printable-doc-body * { visibility: visible !important; }
          .printable-doc-body {
            position: absolute !important;
            left: 0; top: 0;
            width: 210mm !important;
            min-height: 297mm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-[9000] flex items-center justify-center no-print" style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-xl shadow-2xl flex flex-col" style={{ width: '92vw', maxWidth: '900px', maxHeight: '92vh' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748B', letterSpacing: '0.15em' }}>{subtitle ?? 'Printable Document'}</div>
              <div className="text-[15px] font-bold" style={{ color: '#0F172A' }}>{title}</div>
              {docId && <div className="text-[10px] font-mono mt-0.5" style={{ color: '#94A3B8' }}>Doc · {docId}</div>}
            </div>
            <button onClick={handlePrint}
              className="px-3 py-1.5 text-[12.5px] font-bold rounded-lg text-white flex items-center gap-1.5 transition-all hover:brightness-110"
              style={{ background: '#003399' }}>
              <Printer className="w-3.5 h-3.5" />Print / Save as PDF
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-slate-50"
              style={{ borderColor: '#E2E8F0', color: '#64748B' }} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable preview */}
          <div className="flex-1 overflow-auto p-6" style={{ background: '#E2E8F0' }}>
            <div className="mx-auto" style={{ maxWidth: '210mm' }}>
              {/* The .printable-doc-body class is the one shown when printing */}
              <div className="printable-doc-body bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
                {children}
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t text-[11px] flex items-center justify-between" style={{ borderColor: '#E2E8F0', background: '#F8FAFC', color: '#64748B' }}>
            <span className="flex items-center gap-1.5"><Download className="w-3 h-3" /> Use <strong style={{ color: '#0F172A' }}>"Save as PDF"</strong> as the destination in the print dialog to download.</span>
            <span className="font-mono text-[10px]">A4 · Portrait</span>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
