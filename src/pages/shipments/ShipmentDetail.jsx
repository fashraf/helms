import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Truck, Users, Package, MapPin, Clock,
  AlertTriangle, Radio, Zap, FileText, ChevronDown, ChevronUp,
  CheckCircle2, RefreshCw, MoreVertical,
} from 'lucide-react'
import useShipmentStore    from '../../store/shipmentStore'
import RouteTimeline       from '../../components/shipments/RouteTimeline'
import { StatusBadge, TypeBadge, PriorityBadge, RiskScore, ETADisplay } from '../../components/shipments/ShipmentBadges'

// ─── Info Block ───────────────────────────────────────────────────────────────
function InfoBlock({ label, value, mono = false, accent = false }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">{label}</div>
      <div className={`text-xs ${mono ? 'font-mono' : ''} ${accent ? 'text-amber-400 font-semibold' : 'text-slate-200'} leading-snug`}>
        {value || '—'}
      </div>
    </div>
  )
}

// ─── Live Tracking Panel ──────────────────────────────────────────────────────
function LiveTrackingPanel({ shipment }) {
  const activeStop = shipment.stops.find((s) => s.status === 'active' || s.status === 'delayed')
  const completed  = shipment.stops.filter((s) => s.status === 'completed').length
  const total      = shipment.stops.length
  const pct        = Math.round((completed / total) * 100)

  return (
    <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-helm-700">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-300">Live Tracking</span>
        </div>
        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
      </div>

      <div className="p-4 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-[12.5px] mb-1.5">
            <span className="text-slate-500">Route Progress</span>
            <span className="text-amber-400 font-mono font-bold">{completed}/{total} · {pct}%</span>
          </div>
          <div className="h-2 bg-helm-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Current position */}
        <div className="bg-helm-750 rounded-xl p-3 border border-helm-600">
          <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Current Position</div>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">{shipment.currentLocation}</div>
              {activeStop && (
                <div className="text-[12.5px] text-slate-500 mt-0.5">At stop: {activeStop.name}</div>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle + driver */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-helm-750 rounded-lg p-2.5">
            <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-wider">Vehicle</div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-3 h-3 text-sky-400" />
              <span className="text-xs font-mono font-bold text-sky-400">{shipment.vehicle?.id ?? '—'}</span>
            </div>
            <div className="text-[12.5px] text-slate-600 mt-0.5">{shipment.vehicle?.type}</div>
          </div>
          <div className="bg-helm-750 rounded-lg p-2.5">
            <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-wider">Driver</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{shipment.driver?.name?.split(' ')[0] ?? '—'}</div>
            <div className="text-[12.5px] text-slate-600 font-mono mt-0.5">{shipment.driver?.phone?.slice(-8)}</div>
          </div>
        </div>

        {/* ETA */}
        <div className="bg-helm-750 rounded-xl p-3 border border-helm-600">
          <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Final Delivery ETA</div>
          <ETADisplay eta={shipment.eta} />
        </div>

        {/* Risk score */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Risk Score</div>
          <RiskScore score={shipment.riskScore} showBar />
        </div>

        {/* Alerts */}
        {shipment.status === 'delayed' && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-red-400">
              Shipment is delayed. Revised ETA in effect.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-helm-800 border border-helm-600 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-helm-700 hover:bg-helm-750/30 transition-colors"
      >
        <span className="text-[12.5px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      {open && <div className="p-5 animate-fade-in">{children}</div>}
    </div>
  )
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────
export default function ShipmentDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const shipments = useShipmentStore((s) => s.shipments)
  const shipment  = shipments.find((s) => s.id === id)

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Package className="w-12 h-12 text-helm-600" />
        <p className="text-slate-500">Shipment <span className="font-mono text-amber-400">{id}</span> not found.</p>
        <button onClick={() => navigate('/shipments')} className="text-xs text-amber-400 hover:text-amber-300">
          ← Back to Shipments
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shipments')}
            className="w-8 h-8 rounded-lg bg-helm-800 border border-helm-600 hover:border-helm-500 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-white font-mono">{shipment.id}</h2>
              <StatusBadge status={shipment.status} />
              <TypeBadge   type={shipment.type} />
              <PriorityBadge priority={shipment.priority} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {shipment.customer} · {shipment.region} · Created {new Date(shipment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-helm-600 hover:border-helm-500 rounded-lg text-slate-400 hover:text-slate-200 transition-all">
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-200 border border-helm-600 hover:border-helm-500 rounded-lg transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 items-start">

        {/* LEFT: Timeline + Details */}
        <div className="col-span-2 space-y-4">

          {/* Route Timeline */}
          <Section title="Route Timeline" defaultOpen>
            <RouteTimeline stops={shipment.stops} />
          </Section>

          {/* Equipment */}
          <Section title="Equipment Details">
            <div className="grid grid-cols-3 gap-x-8 gap-y-4">
              <InfoBlock label="Type"        value={shipment.equipment?.type} />
              <InfoBlock label="Model"       value={shipment.equipment?.model} accent />
              <InfoBlock label="Serial No"   value={shipment.equipment?.serialNo} mono />
              <InfoBlock label="Weight"      value={shipment.equipment?.weight} />
              <InfoBlock label="Dimensions"  value={shipment.equipment?.dimensions} />
              <InfoBlock label="Condition"   value={shipment.equipment?.condition} />
              <InfoBlock label="Year"        value={shipment.equipment?.year} mono />
              <InfoBlock label="Owner"       value={shipment.equipment?.owner} />
            </div>
          </Section>

          {/* Vehicle & Driver */}
          <Section title="Vehicle & Driver">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[12.5px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-1.5">
                  <Truck className="w-3 h-3" /> Vehicle
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoBlock label="Unit ID"    value={shipment.vehicle?.id} mono accent />
                  <InfoBlock label="Type"       value={shipment.vehicle?.type} />
                  <InfoBlock label="Capacity"   value={shipment.vehicle?.capacity} />
                  <InfoBlock label="Plate"      value={shipment.vehicle?.licensePlate} mono />
                </div>
              </div>
              <div>
                <div className="text-[12.5px] font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Driver
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoBlock label="Name"       value={shipment.driver?.name} />
                  <InfoBlock label="Driver ID"  value={shipment.driver?.id} mono />
                  <InfoBlock label="License"    value={shipment.driver?.license} mono />
                  <InfoBlock label="Phone"      value={shipment.driver?.phone} mono />
                  <InfoBlock label="Experience" value={shipment.driver?.experience} />
                </div>
              </div>
            </div>
          </Section>

          {/* Notes */}
          {shipment.notes && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">{shipment.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Live tracking panel */}
        <div className="col-span-1">
          <LiveTrackingPanel shipment={shipment} />
        </div>
      </div>
    </div>
  )
}
