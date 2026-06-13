import { Star } from 'lucide-react'
import { VENDOR_STATUSES, COUNTRIES, SERVICE_CATEGORIES } from '../../api/mock/vendorV2Data'

export function VendorStatusBadge({ status, sm }) {
  const cfg = VENDOR_STATUSES[status] ?? VENDOR_STATUSES.inactive
  return (
    <span className={`inline-flex items-center gap-1 font-bold border rounded-md ${cfg.cls} ${sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[12.5px] px-2 py-0.5'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  )
}

export function StarRating({ value, size = 14, showValue = true }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[0,1,2,3,4].map(i => (
          <Star key={i} width={size} height={size}
            className={i < full ? 'text-amber-400 fill-amber-400' : (i === full && half) ? 'text-amber-400' : ''}
            style={i >= full && !(i === full && half) ? { color: 'var(--border2)' } : {}}
            fill={i < full ? 'currentColor' : (i === full && half) ? 'url(#half)' : 'none'}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-bold font-mono" style={{ color: 'var(--text)' }}>{value.toFixed(1)}</span>}
    </div>
  )
}

export function CountryFlag({ code, showName = true }) {
  const c = COUNTRIES.find(x => x.code === code)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
      <span className="text-base">{c?.flag ?? '🌐'}</span>
      {showName && (c?.name ?? code)}
    </span>
  )
}

export function ServiceChip({ serviceId }) {
  const s = SERVICE_CATEGORIES.find(x => x.id === serviceId)
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] px-2 py-1 rounded-lg font-medium"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
      <span>{s?.icon ?? '•'}</span> {s?.label ?? serviceId}
    </span>
  )
}

export function relTime(iso) {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000
  if (diff < 1) return 'today'
  if (diff < 30) return Math.floor(diff) + 'd ago'
  return new Date(iso).toLocaleDateString('en-SA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fmtMoney(n) {
  return 'SAR ' + (n ?? 0).toLocaleString()
}
