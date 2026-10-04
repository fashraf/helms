// Compact badge that displays a shipment's shareable secret key with a
// one-click copy-to-clipboard action. Used on both Local & International
// shipment profiles so the dispatcher can quickly share the reference with
// the assigned vendor as a confidential identifier.

import { useState } from 'react'
import { Key, Copy, Check } from 'lucide-react'

export default function SecretKeyBadge({ secretKey, label = 'Vendor Secret Key' }) {
  const [copied, setCopied] = useState(false)
  if (!secretKey) return null
  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(secretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard may be blocked — silently ignore */ }
  }
  return (
    <button onClick={handleCopy}
      data-tour="secret-key" data-tour-order="10"
      data-tour-title="Vendor Secret Key"
      data-tour-desc="A unique, shareable reference (e.g. GS-INT-A4K7) auto-issued to every shipment. Click to copy and share with the assigned vendor as a confidential identifier separate from the internal Shipment ID."
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-colors group"
      style={{
        background: copied ? 'rgba(5,150,105,.10)' : 'rgba(0,51,153,.06)',
        borderColor: copied ? 'rgba(5,150,105,.4)' : 'rgba(0,51,153,.3)',
      }}
      title={`Click to copy · share with vendor only`}>
      <Key className="w-3 h-3" style={{ color: copied ? '#059669' : '#003399' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: copied ? '#059669' : '#003399' }}>{label}</span>
      <span className="font-mono text-[11px] font-bold" style={{ color: copied ? '#059669' : '#003399' }}>{secretKey}</span>
      {copied
        ? <Check className="w-3 h-3" style={{ color: '#059669' }} />
        : <Copy  className="w-3 h-3 opacity-50 group-hover:opacity-100" style={{ color: '#003399' }} />}
    </button>
  )
}
