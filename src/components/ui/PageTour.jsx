// ═══════════════════════════════════════════════════════════════════════════
// PAGE TOUR (request #3)
// Lightweight, dependency-free guided-tour overlay.
//
//   • Activated by the HelpButton in the TopBar.
//   • Discovers every element with `data-tour` and `data-tour-title` on the
//     current page, sorts by optional `data-tour-order`, then walks through
//     them one at a time.
//   • Backdrop fades the page; the active feature gets a cut-out spotlight
//     plus a popover card with the title/description and Prev/Next/Done
//     controls. ESC or "Skip" closes the tour.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, X, ChevronLeft, ChevronRight, Check } from 'lucide-react'

// ─── Floating Help button (mounted in TopBar) ──────────────────────────────
export function HelpButton({ className }) {
  const [active, setActive] = useState(false)
  return (
    <>
      <button onClick={() => setActive(true)}
        className={className ?? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-bold transition-colors'}
        style={{ background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)' }}
        title="Help · tour this page">
        <HelpCircle className="w-3.5 h-3.5" /> Help
      </button>
      {active && <PageTour onClose={() => setActive(false)} />}
    </>
  )
}

// ─── The tour overlay itself ───────────────────────────────────────────────
function PageTour({ onClose }) {
  // Discover tour stops from the current DOM
  const [stops, setStops] = useState([])
  const [idx, setIdx]     = useState(0)
  const [rect, setRect]   = useState(null)

  useLayoutEffect(() => {
    const found = Array.from(document.querySelectorAll('[data-tour]'))
      .filter(el => el.offsetParent !== null) // skip hidden elements
      .map(el => ({
        el,
        title: el.getAttribute('data-tour-title') || el.getAttribute('data-tour') || 'Feature',
        desc:  el.getAttribute('data-tour-desc') || '',
        order: Number(el.getAttribute('data-tour-order') ?? 999),
      }))
      .sort((a, b) => a.order - b.order)
    setStops(found)
  }, [])

  // Recompute the spotlight rect when the index changes (with a small window
  // listener so it stays accurate on scroll/resize during the tour).
  useLayoutEffect(() => {
    if (!stops.length) return
    const update = () => {
      const target = stops[idx]?.el
      if (!target) { setRect(null); return }
      target.scrollIntoView({ behavior:'smooth', block:'center', inline:'nearest' })
      const r = target.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    update()
    // Update on scroll/resize during the tour
    const onScroll = () => {
      const target = stops[idx]?.el
      if (!target) return
      const r = target.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [idx, stops])

  // ESC closes
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, stops.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [stops.length, onClose])

  // No tour stops on the current page — render an inline notice instead
  if (stops.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[9500] flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)' }}>
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4" style={{ border:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5" style={{ color:'#2563EB' }} />
            <h3 className="text-base font-bold" style={{ color:'#0F172A' }}>No tour available for this page</h3>
          </div>
          <p className="text-[12.5px] mb-4" style={{ color:'#475569' }}>
            This page hasn't been annotated with tour stops yet. Try opening a key page like a Shipment Profile, the Quotes tab, or the Customs Queue, then click Help again.
          </p>
          <button onClick={onClose}
            className="w-full px-3 py-2 text-sm font-bold rounded-lg text-white"
            style={{ background:'#2563EB' }}>
            Close
          </button>
        </div>
      </div>,
      document.body,
    )
  }

  const current = stops[idx]
  if (!rect) return null

  // Popover positioning — prefer below the rect; if not enough room, place above
  const popoverWidth = 360
  const popoverEstHeight = 180
  const placeBelow = rect.top + rect.height + popoverEstHeight + 12 < window.innerHeight
  const popTop  = placeBelow ? rect.top + rect.height + 12 : Math.max(8, rect.top - popoverEstHeight - 12)
  const popLeft = Math.max(8, Math.min(window.innerWidth - popoverWidth - 8, rect.left))

  // Backdrop with cutout — implemented as four panels around the rect
  const pad = 6
  const slots = [
    { top: 0,                                    left: 0,                                  width: '100%',                            height: rect.top - pad },
    { top: rect.top - pad,                       left: 0,                                  width: rect.left - pad,                   height: rect.height + pad * 2 },
    { top: rect.top - pad,                       left: rect.left + rect.width + pad,       width: window.innerWidth - rect.left - rect.width - pad, height: rect.height + pad * 2 },
    { top: rect.top + rect.height + pad,         left: 0,                                  width: '100%',                            height: window.innerHeight - rect.top - rect.height - pad },
  ]

  return createPortal(
    <>
      {/* Four backdrop panels around the spotlight */}
      {slots.map((s, i) => (
        <div key={i} className="fixed z-[9400]"
          style={{ ...s, background: 'rgba(15,23,42,0.65)', backdropFilter:'blur(2px)' }}
          onClick={onClose} />
      ))}

      {/* Spotlight ring */}
      <div className="fixed z-[9450] pointer-events-none"
        style={{
          top: rect.top - pad, left: rect.left - pad,
          width: rect.width + pad * 2, height: rect.height + pad * 2,
          borderRadius: 10,
          boxShadow: '0 0 0 3px #2563EB, 0 0 32px 8px rgba(37,99,235,0.4)',
          transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
        }} />

      {/* Popover */}
      <div className="fixed z-[9500] bg-white rounded-xl shadow-2xl"
        style={{
          top: popTop, left: popLeft, width: popoverWidth,
          border: '1px solid #2563EB',
          transition: 'top 0.25s ease, left 0.25s ease',
        }}>
        <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom:'1px solid #E2E8F0', background:'#EFF6FF' }}>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" style={{ color:'#2563EB' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#2563EB' }}>
              Step {idx + 1} of {stops.length}
            </span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100" style={{ color:'#64748B' }} title="Skip tour (Esc)">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 py-3">
          <h3 className="text-sm font-bold mb-1" style={{ color:'#0F172A' }}>{current.title}</h3>
          {current.desc && <p className="text-[12.5px]" style={{ color:'#475569' }}>{current.desc}</p>}
        </div>
        <div className="px-4 py-2 flex items-center gap-2" style={{ borderTop:'1px solid #E2E8F0', background:'#F8FAFC' }}>
          <button onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}
            className="px-2.5 py-1 text-[12.5px] font-bold rounded border disabled:opacity-40 flex items-center gap-1"
            style={{ background:'#fff', borderColor:'#E2E8F0', color:'#475569' }}>
            <ChevronLeft className="w-3 h-3" /> Prev
          </button>
          <div className="flex-1 flex justify-center gap-1">
            {stops.map((_, i) => (
              <span key={i} className="rounded-full"
                style={{
                  width: 5, height: 5,
                  background: i === idx ? '#2563EB' : i < idx ? '#94A3B8' : '#E2E8F0',
                }} />
            ))}
          </div>
          {idx < stops.length - 1 ? (
            <button onClick={() => setIdx(i => Math.min(i + 1, stops.length - 1))}
              className="px-2.5 py-1 text-[12.5px] font-bold rounded text-white flex items-center gap-1"
              style={{ background:'#2563EB' }}>
              Next <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={onClose}
              className="px-2.5 py-1 text-[12.5px] font-bold rounded text-white flex items-center gap-1"
              style={{ background:'#059669' }}>
              <Check className="w-3 h-3" /> Done
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
