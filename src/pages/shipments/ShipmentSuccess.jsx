import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, Plane, Truck, ArrowRight, Plus, MapPin, Calendar, Package,
  Sparkles,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import { SHIPMENT_STATUSES_INTL, SHIPMENT_STATUSES_LOCAL } from '../../api/mock/shipmentV2Data'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-SA', { year:'numeric', month:'long', day:'numeric' }) }

export default function ShipmentSuccess() {
  const navigate = useNavigate()
  const { kind, id } = useParams()  // kind: 'intl' | 'local'
  const { getShipment } = useShipmentV2Store()
  const ship = getShipment(id)

  const isIntl = kind === 'intl'
  const statusCfg = ship
    ? (isIntl ? SHIPMENT_STATUSES_INTL : SHIPMENT_STATUSES_LOCAL)[ship.status] ?? { label: ship.status, cls:'text-slate-500 bg-slate-50 border-slate-200' }
    : null

  const destCount = ship?.destinations?.length ?? ship?.route?.stops?.length ?? 0
  const originLabel = ship?.originCountry || ship?.origins?.[0]?.country || ship?.route?.origin?.locationId || ship?.route?.origins?.[0]?.locationId || '—'
  const firstDestLabel = ship?.destinations?.[0]?.country || ship?.route?.stops?.[0]?.locationId || '—'

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-fade-in"
          style={{ background:'rgba(5,150,105,.1)', border:'2px solid var(--success)' }}>
          <CheckCircle2 className="w-10 h-10" style={{ color:'var(--success)' }} />
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color:'var(--text)' }}>
          Shipment Successfully Created
        </h2>
        <p className="text-sm" style={{ color:'var(--text3)' }}>
          Your shipment is now in the system and ready for the next steps.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-6 py-5 flex items-center gap-4" style={{ background:'var(--primary-light)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background:'var(--card)', color:'var(--primary)' }}>
            {isIntl ? <Plane className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="text-[12.5px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'var(--primary)' }}>
              {isIntl ? 'International Shipment' : 'Local Shipment'}
            </div>
            <div className="font-mono text-lg font-black" style={{ color:'var(--text)' }}>{ship?.id ?? id}</div>
          </div>
          {statusCfg && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-[12.5px] font-bold border rounded-md ${statusCfg.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />{statusCfg.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 divide-x" style={{ borderColor:'var(--border)' }}>
          {[
            { l:'Shipment Number', v: ship?.id ?? id, icon: Package },
            { l:'Created',         v: fmtDate(ship?.createdAt ?? new Date().toISOString()), icon: Calendar },
            { l:'Origin',          v: originLabel,    icon: MapPin },
            { l:'Destinations',    v: destCount > 0 ? `${destCount} stop${destCount === 1 ? '' : 's'}` : firstDestLabel, icon: MapPin },
          ].map(({ l, v, icon: Icon }) => (
            <div key={l} className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="w-3 h-3" style={{ color:'var(--text3)' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
              </div>
              <div className="text-xs font-bold truncate" style={{ color:'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate(`/shipments/${kind}/${id}`)}
          className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl text-white"
          style={{ background:'var(--primary)' }}>
          Go To Shipment <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => navigate(`/shipments/${kind}/create`)}
          className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl border-2"
          style={{ background:'var(--card)', borderColor:'var(--primary)', color:'var(--primary)' }}>
          <Plus className="w-4 h-4" /> Create Another Shipment
        </button>
      </div>

      {/* Tips */}
      <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
        <div className="text-xs space-y-1" style={{ color:'var(--text2)' }}>
          <p><strong>Next steps:</strong> documents may still need to be uploaded; the assigned owner will be notified to take action.</p>
          <p>You can track the shipment from <strong>Operations → Tracking</strong> at any time, or view it on the calendar.</p>
        </div>
      </div>
    </div>
  )
}
