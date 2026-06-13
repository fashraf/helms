import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Search, RotateCcw, AlertTriangle, Brain, Zap, Award, TrendingUp, ChevronRight } from 'lucide-react'
import useVendorV2Store from '../../store/vendorV2Store'
import { useToast } from '../../hooks/useToast'
import { StarRating, CountryFlag, VendorStatusBadge, fmtDate, ServiceChip } from '../../components/vendors/VendorV2Badges'
import { BLACKLIST_REASONS } from '../../api/mock/vendorV2Data'

const C = { background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }

export function BlacklistedVendors() {
  const navigate = useNavigate()
  const { vendors, reactivateVendor } = useVendorV2Store()
  const { toast } = useToast()
  const [search, setSearch] = useState('')

  const blacklisted = vendors.filter(v => v.status === 'blacklisted' &&
    (!search || v.name.toLowerCase().includes(search.toLowerCase())))

  const byReason = BLACKLIST_REASONS.map(r => ({
    reason: r,
    count: vendors.filter(v => v.status === 'blacklisted' && v.blacklistReason === r).length,
  })).filter(x => x.count > 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,.2)' }}>
          <Ban className="w-4.5 h-4.5" style={{ color: 'var(--danger)' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Blacklisted Vendors</h2>
          <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{blacklisted.length} vendors blocked from RFQs and shipment assignment</p>
        </div>
      </div>

      {/* Reason breakdown */}
      {byReason.length > 0 && (
        <div className="grid grid-cols-6 gap-3">
          {byReason.map(({ reason, count }) => (
            <div key={reason} className="rounded-xl border p-3" style={C}>
              <div className="text-2xl font-black font-mono" style={{ color: 'var(--danger)' }}>{count}</div>
              <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text3)' }}>{reason}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search blacklisted vendors…"
          className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border focus:outline-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
      </div>

      {/* List */}
      {blacklisted.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={C}>
          <Ban className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text3)' }} />
          <p className="text-sm" style={{ color: 'var(--text3)' }}>No blacklisted vendors</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blacklisted.map(v => (
            <div key={v.id} className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'rgba(220,38,38,.3)', boxShadow: 'var(--shadow)' }}>
              <div className="h-1" style={{ background: 'var(--danger)' }} />
              <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                  {v.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{v.name}</span>
                    <span className="font-mono text-[12.5px]" style={{ color: 'var(--text3)' }}>{v.code}</span>
                    <CountryFlag code={v.country} showName={false} />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[12.5px]" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                      <AlertTriangle className="w-3 h-3" /> {v.blacklistReason}
                    </span>
                    <span style={{ color: 'var(--text3)' }}>Since {fmtDate(v.blacklistedAt)} · by {v.blacklistedBy}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/vendors-v2/${v.id}`)}
                    className="px-3 py-1.5 text-xs rounded-lg border transition-all" style={{ ...C, color: 'var(--text2)' }}>
                    View Profile
                  </button>
                  <button onClick={() => { reactivateVendor(v.id); toast.success('Reactivated', `${v.name} is active again.`) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background: 'var(--success)' }}>
                    <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AI Vendor Recommendation ──────────────────────────────────────────────────
const ROUTES = ['Riyadh → Mumbai', 'Jeddah → Hamburg', 'Dammam → Dubai', 'Riyadh → Jeddah', 'Jeddah → Singapore']

export function VendorRecommendation() {
  const navigate = useNavigate()
  const { getRecommendation } = useVendorV2Store()
  const [route, setRoute] = useState(ROUTES[0])
  const rec = getRecommendation(route)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.2)' }}>
          <Brain className="w-4.5 h-4.5" style={{ color: '#7C3AED' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>AI Vendor Recommendation Engine</h2>
          <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Best vendor suggestions based on route, performance, SLA, cost & speed</p>
        </div>
      </div>

      {/* Route selector */}
      <div className="rounded-xl border p-4" style={C}>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text3)' }}>Select Route</label>
        <div className="flex gap-2 flex-wrap">
          {ROUTES.map(r => (
            <button key={r} onClick={() => setRoute(r)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border transition-all"
              style={route === r ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { background: 'var(--card)', color: 'var(--text2)', borderColor: 'var(--border)' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top recommendation */}
      {rec?.vendor && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'rgba(124,58,237,.3)', boxShadow: 'var(--shadow-md)' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(124,58,237,.08)' }}>
            <Award className="w-4 h-4" style={{ color: '#7C3AED' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>Recommended Vendor</span>
            <span className="ml-auto text-[12.5px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(124,58,237,.15)', color: '#7C3AED' }}>
              AI Score: {rec.vendor.score}
            </span>
          </div>
          <div className="p-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              {rec.vendor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{rec.vendor.name}</h3>
                <CountryFlag code={rec.vendor.country} showName={false} />
                <StarRating value={rec.vendor.rating} size={13} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {rec.vendor.services.slice(0, 4).map(s => <ServiceChip key={s} serviceId={s} />)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {rec.reasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text2)' }}>
                    <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#7C3AED' }} /> {reason}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate(`/vendors-v2/${rec.vendor.id}`)}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white flex-shrink-0" style={{ background: 'var(--primary)' }}>
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* Alternatives */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>Alternative Vendors</h3>
        <div className="grid grid-cols-3 gap-3">
          {rec?.alternatives?.map((v, i) => (
            <div key={v.id} className="rounded-xl border p-4 cursor-pointer transition-all" style={C}
              onClick={() => navigate(`/vendors-v2/${v.id}`)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>#{i + 2}</span>
                <span className="text-sm font-black font-mono" style={{ color: 'var(--primary)' }}>{v.score}</span>
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{v.name}</div>
              <div className="flex items-center gap-2 mb-2">
                <CountryFlag code={v.country} showName={false} />
                <StarRating value={v.rating} size={11} />
              </div>
              <div className="flex items-center justify-between text-[12.5px]" style={{ color: 'var(--text3)' }}>
                <span>SLA: {v.slaCompliance}%</span>
                <span>{v.completedShipments} shipments</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
