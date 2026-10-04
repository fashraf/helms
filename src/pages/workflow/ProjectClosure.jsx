import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Upload, Camera, X, Image as ImageIcon, Edit3, RotateCcw, Check,
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, XCircle, FileSignature,
  MapPin, Clock, Eye, Send, Briefcase, Trash2,
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { BlockUI } from '../../components/ui/BlockUI'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const MIN_IMAGES = 5  // Configurable by administrator (would come from settings)

function fmtDT(iso) { return new Date(iso).toLocaleString('en-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) }

// ─── Signature pad ─────────────────────────────────────────────────────────────
function SignaturePad({ onChange, signature }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(!!signature)
  const [mode, setMode] = useState(signature?.type === 'upload' ? 'upload' : 'draw')

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.strokeStyle = '#1F2937'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [mode])

  const start = (e) => {
    setDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
    ctx.moveTo(x, y)
  }
  const move = (e) => {
    if (!drawing) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasContent(true)
  }
  const end = () => {
    setDrawing(false)
    if (hasContent && canvasRef.current) {
      onChange({ type: 'drawn', dataUrl: canvasRef.current.toDataURL(), drawnAt: new Date().toISOString() })
    }
  }
  const clear = () => {
    const c = canvasRef.current
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setHasContent(false)
    onChange(null)
  }
  const onUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange({ type: 'upload', dataUrl: ev.target.result, fileName: file.name, uploadedAt: new Date().toISOString() })
      setHasContent(true)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <FileSignature className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
        <h4 className="text-xs font-bold uppercase tracking-widest flex-1" style={{ color:'var(--text2)' }}>Digital Signature *</h4>
        <div className="flex items-center rounded-lg border p-0.5 gap-0.5" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          {[['draw','Draw'],['upload','Upload']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => { setMode(k); clear() }}
              className="px-2.5 py-1 rounded-md text-[12.5px] font-bold transition-all"
              style={mode === k ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text3)' }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {mode === 'draw' ? (
          <div className="rounded-lg border-2 border-dashed" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
            <canvas ref={canvasRef} width={520} height={140}
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={move} onTouchEnd={end}
              className="w-full cursor-crosshair touch-none" style={{ height: 140 }} />
            <div className="flex items-center justify-between px-3 py-1.5 border-t" style={{ borderColor:'var(--border)' }}>
              <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>{hasContent ? '✓ Signature captured' : 'Sign with your mouse or finger'}</span>
              <button type="button" onClick={clear} className="text-[12.5px] font-semibold flex items-center gap-1" style={{ color:'var(--text2)' }}>
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {signature?.dataUrl ? (
              <div className="rounded-lg border p-3 flex items-center gap-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <img src={signature.dataUrl} alt="signature" className="w-32 h-16 object-contain bg-white rounded" />
                <div className="flex-1">
                  <div className="text-xs font-semibold" style={{ color:'var(--text)' }}>{signature.fileName}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>Uploaded {fmtDT(signature.uploadedAt)}</div>
                </div>
                <button type="button" onClick={clear} className="text-[12.5px]" style={{ color:'var(--danger)' }}><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer block" style={{ borderColor:'var(--border2)', background:'var(--bg2)' }}>
                <Upload className="w-6 h-6 mx-auto mb-1.5" style={{ color:'var(--text3)' }} />
                <p className="text-xs" style={{ color:'var(--text2)' }}>Click to upload signature image (PNG/JPG)</p>
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Image gallery upload ──────────────────────────────────────────────────────
function ImageGallery({ images, onAdd, onRemove, readOnly = false, minRequired = MIN_IMAGES }) {
  const fileRef = useRef(null)
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onAdd({
          id: `IMG-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          dataUrl: ev.target.result,
          ts: new Date().toISOString(),
          gps: '24.7136°N 46.6753°E',  // placeholder for future GPS support
        })
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={C}>
      <div className="px-4 py-2.5 border-b" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
            <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>Closure Images *</h4>
          </div>
          <span className="text-[12.5px] font-mono px-2 py-0.5 rounded font-bold"
            style={{
              background: images.length >= minRequired ? 'rgba(5,150,105,.1)' : 'rgba(217,119,6,.1)',
              color:      images.length >= minRequired ? 'var(--success)'    : 'var(--warning)',
            }}>
            {images.length} / {minRequired} required
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {!readOnly && (
          <>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-sm font-medium"
                style={{ borderColor:'var(--border2)', background:'var(--bg2)', color:'var(--text2)' }}>
                <Upload className="w-4 h-4" /> Drag & Drop or Click to Upload
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-sm font-medium"
                style={{ borderColor:'var(--border2)', background:'var(--bg2)', color:'var(--text2)' }}>
                <Camera className="w-4 h-4" /> Mobile Camera
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
          </>
        )}

        {images.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color:'var(--text3)' }}>
            No images yet — upload at least {minRequired} to proceed
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <div key={img.id} className="rounded-lg border overflow-hidden relative" style={C}>
                {img.dataUrl ? (
                  <img src={img.dataUrl} alt={img.name} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center" style={{ background:'var(--bg2)' }}>
                    <ImageIcon className="w-6 h-6" style={{ color:'var(--text3)' }} />
                  </div>
                )}
                <div className="p-2">
                  <div className="text-[12.5px] font-semibold truncate" style={{ color:'var(--text)' }}>{img.name}</div>
                  <div className="flex items-center gap-1 text-[9px] mt-0.5" style={{ color:'var(--text3)' }}>
                    <Clock className="w-2.5 h-2.5" /> {fmtDT(img.ts)}
                  </div>
                  {img.gps && (
                    <div className="flex items-center gap-1 text-[9px]" style={{ color:'var(--text3)' }}>
                      <MapPin className="w-2.5 h-2.5" /> {img.gps}
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <button type="button" onClick={() => onRemove(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── OTP modal ─────────────────────────────────────────────────────────────────
function OTPModal({ open, onClose, onVerify, saving }) {
  const [otp, setOtp]     = useState(['','','','','',''])
  const [error, setError] = useState('')
  const inputsRef = useRef([])

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val
    setOtp(next); setError('')
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus()
  }
  const handleVerify = () => {
    const code = otp.join('')
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    // Mock: accept any 6 digits
    onVerify(code)
  }

  return (
    <EnterpriseModal open={open} onClose={() => !saving && onClose()}
      title="OTP Verification Required" subtitle="Verify your identity to complete closure"
      icon={<ShieldCheck className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="sm"
      footer={<>
        <ModalBtn variant="secondary" onClick={onClose} disabled={saving}>Cancel</ModalBtn>
        <ModalBtn onClick={handleVerify} loading={saving}>Verify & Submit</ModalBtn>
      </>}>
      <div className="space-y-3">
        <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ background:'var(--primary-light)', borderColor:'rgba(37,99,235,.2)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
          <p className="text-xs" style={{ color:'var(--text2)' }}>
            A 6-digit OTP has been sent to your registered mobile <strong>+966 5X XXX 4567</strong>. Enter it below to confirm project closure.
          </p>
        </div>
        <div>
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-2 block" style={{ color:'var(--text3)' }}>Enter 6-Digit OTP</label>
          <div className="flex items-center gap-2 justify-center">
            {otp.map((d, i) => (
              <input key={i} ref={el => inputsRef.current[i] = el}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && inputsRef.current[i - 1]?.focus()}
                maxLength={1}
                className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border focus:outline-none"
                style={{ background:'var(--bg2)', borderColor: error ? 'var(--danger)' : 'var(--border)', color:'var(--text)' }} />
            ))}
          </div>
          {error && <div className="text-center text-[12.5px] mt-1.5" style={{ color:'var(--danger)' }}>{error}</div>}
          <div className="text-center text-[12.5px] mt-2" style={{ color:'var(--text3)' }}>
            Didn't receive the code? <button className="font-semibold" style={{ color:'var(--primary)' }}>Resend</button>
          </div>
        </div>
      </div>
    </EnterpriseModal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProjectClosure() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const reviewerMode = params.get('mode') === 'review'
  const { toast } = useToast()

  const [notes,     setNotes]     = useState('')
  const [images,    setImages]    = useState([])
  const [signature, setSignature] = useState(null)
  const [otpOpen,   setOtpOpen]   = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [reviewerDecision, setReviewerDecision] = useState(null)
  const [reviewerComment,  setReviewerComment]  = useState('')

  const canSubmit = notes.trim().length >= 20 && images.length >= MIN_IMAGES && !!signature

  const handleSubmit = () => {
    if (!canSubmit) { toast.warning('Incomplete', 'Add notes (≥20 chars), images and signature first.'); return }
    setOtpOpen(true)
  }

  const handleVerifyOTP = () => {
    setSaving(true)
    setTimeout(() => {
      setOtpVerified(true); setOtpOpen(false); setSaving(false)
      toast.success('Closure Submitted', 'Project closure submitted for approval.')
      setTimeout(() => navigate('/workflows/requests'), 800)
    }, 600)
  }

  const handleReviewerDecision = (decision) => {
    if (!reviewerComment.trim()) { toast.warning('Comment Required', 'Add a comment explaining your decision.'); return }
    toast.success(
      decision === 'approve' ? 'Closure Approved' : decision === 'reject' ? 'Closure Rejected' : 'Evidence Requested',
      `Decision recorded for ${id ?? 'project closure'}.`
    )
    navigate('/workflows/requests')
  }

  return (
    <div className="space-y-4 pb-8 max-w-5xl mx-auto">
      <BlockUI />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={C}>
            <ArrowLeft className="w-4 h-4" style={{ color:'var(--text2)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: reviewerMode ? 'rgba(217,119,6,.1)' : 'var(--primary-light)', border: `1px solid ${reviewerMode ? 'rgba(217,119,6,.2)' : 'rgba(37,99,235,.2)'}` }}>
              <Briefcase className="w-4.5 h-4.5" style={{ color: reviewerMode ? 'var(--warning)' : 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>
                {reviewerMode ? 'Closure Review' : 'Project Closure'}
              </h2>
              <p className="text-[11px]" style={{ color:'var(--text3)' }}>
                {reviewerMode ? `Reviewing closure submission for ${id ?? 'project'}` : 'Submit project closure with evidence and signature'}
              </p>
            </div>
          </div>
        </div>
        {!reviewerMode && (
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-bold px-2 py-1 rounded" style={{
              background: canSubmit ? 'rgba(5,150,105,.1)' : 'rgba(217,119,6,.1)',
              color:      canSubmit ? 'var(--success)'     : 'var(--warning)'
            }}>
              {canSubmit ? '✓ READY TO SUBMIT' : '⚠ INCOMPLETE'}
            </span>
            {otpVerified && (
              <span className="text-[12.5px] font-bold px-2 py-1 rounded inline-flex items-center gap-1" style={{ background:'rgba(5,150,105,.1)', color:'var(--success)' }}>
                <ShieldCheck className="w-3 h-3" /> OTP VERIFIED
              </span>
            )}
          </div>
        )}
      </div>

      {/* Project info card (placeholder — would load from project store) */}
      <div className="rounded-xl border p-4" style={C}>
        <div className="grid grid-cols-4 gap-4">
          {[
            ['Project ID',   id ?? 'PRJ-00007'],
            ['Project Name', 'Yanbu Refinery Maintenance'],
            ['Phase',        'Phase 3 — Demobilization'],
            ['Status',       reviewerMode ? 'Pending Closure Approval' : 'Active'],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--text3)' }}>{l}</div>
              <div className="text-sm font-medium" style={{ color:'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border p-4" style={C}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text2)' }}>
            Closure Notes <span style={{ color:'var(--danger)' }}>*</span>
          </label>
          <span className="text-[12.5px] font-mono" style={{ color: notes.length >= 20 ? 'var(--success)' : 'var(--text3)' }}>
            {notes.length} / 20 min
          </span>
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={4} disabled={reviewerMode}
          placeholder="Describe project completion: deliverables, final status, demobilization, client sign-off…"
          className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none disabled:cursor-not-allowed"
          style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>

      {/* Images + Signature */}
      <ImageGallery images={images} onAdd={(img) => setImages(s => [...s, img])} onRemove={(id) => setImages(s => s.filter(i => i.id !== id))}
        readOnly={reviewerMode} minRequired={MIN_IMAGES} />

      {!reviewerMode && (
        <SignaturePad signature={signature} onChange={setSignature} />
      )}

      {/* Submitter side: status + submit */}
      {!reviewerMode && (
        <div className="rounded-xl border p-4" style={C}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { l:'Notes',     ok: notes.trim().length >= 20, txt: `${notes.length}/20 chars` },
              { l:'Images',    ok: images.length >= MIN_IMAGES, txt: `${images.length}/${MIN_IMAGES} required` },
              { l:'Signature', ok: !!signature, txt: signature ? `${signature.type === 'drawn' ? 'Drawn' : 'Uploaded'} ✓` : 'Required' },
            ].map(({ l, ok, txt }) => (
              <div key={l} className="rounded-lg p-3 flex items-center gap-3" style={{ background: ok ? 'rgba(5,150,105,.05)' : 'var(--bg2)', border:`1px solid ${ok ? 'rgba(5,150,105,.25)' : 'var(--border)'}` }}>
                {ok ? <CheckCircle2 className="w-5 h-5" style={{ color:'var(--success)' }} /> : <XCircle className="w-5 h-5" style={{ color:'var(--text3)' }} />}
                <div>
                  <div className="text-xs font-bold" style={{ color: ok ? 'var(--success)' : 'var(--text2)' }}>{l}</div>
                  <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{txt}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background:'var(--primary)' }}>
            <Send className="w-4 h-4" /> Submit Closure Request (OTP Required)
          </button>
        </div>
      )}

      {/* Reviewer side: decision panel */}
      {reviewerMode && (
        <div className="rounded-xl border p-4" style={C}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text2)' }}>Closure Review Decision</h4>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { l:'Notes',     ok: true, icon: CheckCircle2 },
              { l:'Images',    ok: true, icon: CheckCircle2, txt: `${images.length} uploaded` },
              { l:'Signature', ok: true, icon: CheckCircle2 },
              { l:'OTP Verified', ok: true, icon: ShieldCheck },
            ].map(({ l, ok, icon: Icon, txt }) => (
              <div key={l} className="rounded-lg p-3 flex items-center gap-2" style={{ background:'rgba(5,150,105,.05)', border:'1px solid rgba(5,150,105,.25)' }}>
                <Icon className="w-4 h-4" style={{ color:'var(--success)' }} />
                <div>
                  <div className="text-xs font-bold" style={{ color:'var(--success)' }}>{l}</div>
                  {txt && <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>{txt}</div>}
                </div>
              </div>
            ))}
          </div>

          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>
            Reviewer Comment <span style={{ color:'var(--danger)' }}>*</span>
          </label>
          <textarea value={reviewerComment} onChange={e => setReviewerComment(e.target.value)} rows={2}
            placeholder="Required — explain your decision…"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none resize-none mb-3"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleReviewerDecision('approve')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg text-white"
              style={{ background:'var(--success)' }}>
              <CheckCircle2 className="w-4 h-4" /> Approve Closure
            </button>
            <button onClick={() => handleReviewerDecision('reject')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg text-white"
              style={{ background:'var(--danger)' }}>
              <XCircle className="w-4 h-4" /> Reject Closure
            </button>
            <button onClick={() => handleReviewerDecision('request_evidence')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg border-2"
              style={{ borderColor:'var(--warning)', color:'var(--warning)', background:'var(--card)' }}>
              <AlertTriangle className="w-4 h-4" /> Request More Evidence
            </button>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      <OTPModal open={otpOpen} onClose={() => setOtpOpen(false)} onVerify={handleVerifyOTP} saving={saving} />
    </div>
  )
}
