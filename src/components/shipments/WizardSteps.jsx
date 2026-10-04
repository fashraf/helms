import { useState } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle, Check,
  Package, Truck, Users, MapPin, ClipboardList,
} from 'lucide-react'
import useShipmentStore from '../../store/shipmentStore'
import {
  CUSTOMERS, REGIONS, EQUIPMENT_TYPES, EQUIPMENT_MODELS,
  FLEET_UNITS, DRIVERS, SA_LOCATIONS, STOP_TYPES,
} from '../../api/mock/shipmentData'
import { StopTypePill, StatusBadge, TypeBadge, ETADisplay } from './ShipmentBadges'

// ─── Shared form primitives ───────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-[12.5px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">
    {children}{required && <span className="text-amber-500 ml-1">*</span>}
  </label>
)
const FieldWrap = ({ children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>{children}</div>
)
const Select = ({ value, onChange, children, className = '' }) => (
  <select
    value={value} onChange={onChange}
    className={`w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all ${className}`}
  >
    {children}
  </select>
)
const TextInput = ({ value, onChange, placeholder, type = 'text', className = '' }) => (
  <input
    type={type} value={value} onChange={onChange} placeholder={placeholder}
    className={`w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all ${className}`}
  />
)
const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className="w-full bg-helm-750 border border-helm-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
  />
)

// ─── Step 1: Basic Info ────────────────────────────────────────────────────────
export function Step1BasicInfo() {
  const { wizard, setWizardSection } = useShipmentStore()
  const { basic } = wizard
  const set = (k, v) => setWizardSection('basic', { [k]: v })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap>
          <Label required>Customer / Client</Label>
          <Select value={basic.customer} onChange={(e) => set('customer', e.target.value)}>
            <option value="">Select customer…</option>
            {CUSTOMERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap>
          <Label required>Shipment Type</Label>
          <Select value={basic.type} onChange={(e) => set('type', e.target.value)}>
            <option value="local">Local (Domestic)</option>
            <option value="international">International (Cross-border)</option>
          </Select>
        </FieldWrap>
        <FieldWrap>
          <Label required>Region</Label>
          <Select value={basic.region} onChange={(e) => set('region', e.target.value)}>
            <option value="">Select region…</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap>
          <Label>Priority</Label>
          <Select value={basic.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
            <option value="low">Low</option>
          </Select>
        </FieldWrap>
      </div>
      <FieldWrap>
        <Label>Notes / Instructions</Label>
        <Textarea value={basic.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Handling instructions, client requirements, special conditions…" />
      </FieldWrap>
    </div>
  )
}

// ─── Step 2: Equipment Details ─────────────────────────────────────────────────
export function Step2Equipment() {
  const { wizard, setWizardSection } = useShipmentStore()
  const { equipment } = wizard
  const set = (k, v) => setWizardSection('equipment', { [k]: v })
  const models = EQUIPMENT_MODELS[equipment.equipmentType] ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap>
          <Label required>Equipment Type</Label>
          <Select value={equipment.equipmentType} onChange={(e) => set('equipmentType', e.target.value)}>
            <option value="">Select type…</option>
            {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap>
          <Label required>Model</Label>
          <Select value={equipment.model} onChange={(e) => set('model', e.target.value)} disabled={!models.length}>
            <option value="">{models.length ? 'Select model…' : '← Select type first'}</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap>
          <Label>Serial Number</Label>
          <TextInput value={equipment.serialNo} onChange={(e) => set('serialNo', e.target.value)} placeholder="SN-XXXXXX" />
        </FieldWrap>
        <FieldWrap>
          <Label>Year of Manufacture</Label>
          <TextInput type="number" value={equipment.year} onChange={(e) => set('year', e.target.value)} placeholder="2022" />
        </FieldWrap>
        <FieldWrap>
          <Label required>Weight</Label>
          <TextInput value={equipment.weight} onChange={(e) => set('weight', e.target.value)} placeholder="e.g. 45T" />
        </FieldWrap>
        <FieldWrap>
          <Label>Dimensions (L×W×H)</Label>
          <TextInput value={equipment.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder="12m × 4m × 4m" />
        </FieldWrap>
        <FieldWrap>
          <Label>Condition</Label>
          <Select value={equipment.condition} onChange={(e) => set('condition', e.target.value)}>
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
          </Select>
        </FieldWrap>
        <FieldWrap>
          <Label>Equipment Owner</Label>
          <TextInput value={equipment.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Owner entity or same as customer" />
        </FieldWrap>
      </div>
    </div>
  )
}

// ─── Step 3: Route Builder ─────────────────────────────────────────────────────
export function Step3Route() {
  const { wizard, addWizardStop, removeWizardStop, updateWizardStop, moveWizardStop } = useShipmentStore()
  const { stops } = wizard.route

  const INSERTABLE_TYPES = Object.entries(STOP_TYPES).filter(([k]) => k !== 'pickup' && k !== 'delivery')

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-helm-700">
        {Object.entries(STOP_TYPES).map(([key, cfg]) => (
          <StopTypePill key={key} type={key} />
        ))}
      </div>

      {/* Stop rows */}
      <div className="space-y-2">
        {stops.map((stop, idx) => {
          const isFirst = idx === 0
          const isLast  = idx === stops.length - 1
          const locked  = isFirst || isLast

          return (
            <div
              key={stop.id}
              className={`
                flex items-start gap-3 p-3 rounded-xl border transition-all
                ${locked ? 'bg-helm-750/60 border-helm-600' : 'bg-helm-800 border-helm-600 hover:border-helm-500'}
              `}
            >
              {/* Sequence */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                <div className="w-6 h-6 rounded-full bg-helm-700 border border-helm-500 flex items-center justify-center text-[12.5px] font-mono font-bold text-slate-400">
                  {stop.sequence}
                </div>
                {!locked && (
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveWizardStop(stop.id, 'up')} disabled={idx <= 1}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveWizardStop(stop.id, 'down')} disabled={idx >= stops.length - 2}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                <FieldWrap>
                  <Label>Stop Type</Label>
                  <Select value={stop.type} onChange={(e) => {
                    const t = e.target.value
                    updateWizardStop(stop.id, { type: t, name: STOP_TYPES[t]?.label ?? t })
                  }} disabled={locked}>
                    {Object.entries(STOP_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Select>
                </FieldWrap>
                <FieldWrap>
                  <Label>Location</Label>
                  <Select value={stop.location} onChange={(e) => updateWizardStop(stop.id, { location: e.target.value })}>
                    <option value="">Select location…</option>
                    {SA_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </Select>
                </FieldWrap>
                <FieldWrap>
                  <Label>Expected Date/Time</Label>
                  <TextInput type="datetime-local" value={stop.eta?.slice(0, 16) ?? ''}
                    onChange={(e) => updateWizardStop(stop.id, { eta: e.target.value })} />
                </FieldWrap>
                <FieldWrap>
                  <Label>Responsible Team</Label>
                  <Select value={stop.team} onChange={(e) => updateWizardStop(stop.id, { team: e.target.value })}>
                    {['Logistics Team','Warehouse Crew','QA Inspectors','Customs Agents','Site Engineers','Security Team'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </FieldWrap>
              </div>

              {/* Approval toggle + delete */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <div
                    onClick={() => updateWizardStop(stop.id, { requiresApproval: !stop.requiresApproval })}
                    className={`w-8 h-4 rounded-full transition-colors ${stop.requiresApproval ? 'bg-amber-500' : 'bg-helm-600'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${stop.requiresApproval ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[9px] text-slate-500">Approval</span>
                </label>
                {!locked && (
                  <button onClick={() => removeWizardStop(stop.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add stop button */}
      <button
        onClick={addWizardStop}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-helm-600 hover:border-amber-500/50 rounded-xl text-xs text-slate-500 hover:text-amber-400 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add intermediate stop
      </button>
    </div>
  )
}

// ─── Step 4: Vehicle & Driver Assignment ──────────────────────────────────────
export function Step4Assignment() {
  const { wizard, setWizardSection } = useShipmentStore()
  const { assignment } = wizard

  const selectedVehicle = FLEET_UNITS.find((v) => v.id === assignment.vehicleId)
  const selectedDriver  = DRIVERS.find((d) => d.id === assignment.driverId)

  return (
    <div className="space-y-6">
      {/* Vehicle selection */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
          <Truck className="w-3.5 h-3.5" /> Vehicle Selection
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FLEET_UNITS.map((v) => (
            <button
              key={v.id}
              onClick={() => setWizardSection('assignment', { vehicleId: v.id, vehicle: v })}
              className={`
                flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                ${assignment.vehicleId === v.id
                  ? 'border-amber-500/60 bg-amber-500/5 shadow-amber-glow-sm'
                  : 'border-helm-600 bg-helm-800 hover:border-helm-500'
                }
              `}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${assignment.vehicleId === v.id ? 'bg-amber-500/20 text-amber-400' : 'bg-helm-700 text-slate-500'}`}>
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 font-mono">{v.id}</div>
                <div className="text-[12.5px] text-slate-500">{v.type}</div>
                <div className="text-[12.5px] text-slate-600">Cap: {v.capacity}</div>
              </div>
              {assignment.vehicleId === v.id && (
                <Check className="w-3.5 h-3.5 text-amber-400 ml-auto mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Driver selection */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Driver Assignment
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DRIVERS.map((d) => (
            <button
              key={d.id}
              onClick={() => setWizardSection('assignment', { driverId: d.id, driver: d })}
              className={`
                flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                ${assignment.driverId === d.id
                  ? 'border-amber-500/60 bg-amber-500/5 shadow-amber-glow-sm'
                  : 'border-helm-600 bg-helm-800 hover:border-helm-500'
                }
              `}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${assignment.driverId === d.id ? 'bg-amber-500/20 text-amber-400' : 'bg-helm-700 text-slate-400'}`}>
                {d.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{d.name}</div>
                <div className="text-[12.5px] text-slate-500 font-mono">{d.license}</div>
                <div className="text-[12.5px] text-slate-600">{d.experience} exp.</div>
              </div>
              {assignment.driverId === d.id && (
                <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Review & Submit ───────────────────────────────────────────────────
export function Step5Review() {
  const { wizard } = useShipmentStore()
  const { basic, equipment, route, assignment } = wizard
  const vehicle = FLEET_UNITS.find((v) => v.id === assignment.vehicleId)
  const driver  = DRIVERS.find((d)  => d.id === assignment.driverId)

  const Section = ({ label, children }) => (
    <div className="bg-helm-850 border border-helm-700 rounded-xl p-4">
      <div className="text-[12.5px] font-bold uppercase tracking-widest text-slate-500 mb-3">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
  const Row = ({ label, value }) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  )

  const missingFields = []
  if (!basic.customer)            missingFields.push('Customer')
  if (!basic.region)              missingFields.push('Region')
  if (!equipment.equipmentType)   missingFields.push('Equipment type')
  if (!equipment.model)           missingFields.push('Equipment model')
  if (!assignment.vehicleId)      missingFields.push('Vehicle')
  if (!assignment.driverId)       missingFields.push('Driver')
  if (route.stops.some((s) => !s.location)) missingFields.push('Stop locations')

  return (
    <div className="space-y-3">
      {missingFields.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-400">Missing required fields:</p>
            <p className="text-xs text-amber-400/80 mt-0.5">{missingFields.join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Section label="Basic Information">
          <Row label="Customer"  value={basic.customer} />
          <Row label="Type"      value={basic.type === 'international' ? '🌐 International' : '📍 Local'} />
          <Row label="Region"    value={basic.region} />
          <Row label="Priority"  value={basic.priority} />
          {basic.notes && <Row label="Notes" value={basic.notes} />}
        </Section>

        <Section label="Equipment">
          <Row label="Type"       value={equipment.equipmentType} />
          <Row label="Model"      value={equipment.model} />
          <Row label="Serial No"  value={equipment.serialNo} />
          <Row label="Weight"     value={equipment.weight} />
          <Row label="Dimensions" value={equipment.dimensions} />
          <Row label="Condition"  value={equipment.condition} />
        </Section>

        <Section label="Vehicle & Driver">
          <Row label="Vehicle ID"    value={vehicle?.id} />
          <Row label="Vehicle Type"  value={vehicle?.type} />
          <Row label="Capacity"      value={vehicle?.capacity} />
          <Row label="Driver"        value={driver?.name} />
          <Row label="License"       value={driver?.license} />
          <Row label="Experience"    value={driver?.experience} />
        </Section>

        <Section label={`Route (${route.stops.length} stops)`}>
          {route.stops.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-600">#{s.sequence}</span>
              <StopTypePill type={s.type} />
              <span className="text-[11px] text-slate-400 truncate">{s.location || 'No location'}</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}
