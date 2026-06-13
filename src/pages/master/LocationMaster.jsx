// HELMS Location Master — central CRUD for all pickup/destination locations
// Origins and Destinations in shipments pick from here and auto-fill country/city/map/landmark
import { useState, useMemo } from 'react'
import {
  MapPin, Plus, Search, Edit3, Power, X, Filter, Globe, Building2,
  CheckCircle2, AlertCircle, ExternalLink, Map,
} from 'lucide-react'
import useShipmentV2Store from '../../store/shipmentV2Store'
import useToastStore       from '../../store/toastStore'
import Select2             from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }

// Saudi cities for the dropdown when type === 'local'
const SAUDI_CITIES = [
  'Riyadh','Jeddah','Dammam','Khobar','Jubail','Yanbu','Tabuk','Hail',
  'Makkah','Medina','Abha','Najran','Jizan','Buraidah','Qassim','Al-Ahsa','NEOM',
]

// Common international countries (ISO codes)
const COUNTRIES = [
  { code:'AE', name:'United Arab Emirates' },
  { code:'IN', name:'India' },
  { code:'KW', name:'Kuwait' },
  { code:'BH', name:'Bahrain' },
  { code:'OM', name:'Oman' },
  { code:'QA', name:'Qatar' },
  { code:'EG', name:'Egypt' },
  { code:'IQ', name:'Iraq' },
  { code:'JO', name:'Jordan' },
  { code:'CN', name:'China' },
  { code:'DE', name:'Germany' },
  { code:'TR', name:'Turkey' },
  { code:'US', name:'United States' },
  { code:'GB', name:'United Kingdom' },
  { code:'SG', name:'Singapore' },
  { code:'FR', name:'France' },
  { code:'IT', name:'Italy' },
  { code:'JP', name:'Japan' },
  { code:'KR', name:'South Korea' },
  { code:'PK', name:'Pakistan' },
]

const EMPTY = {
  type: 'local',
  country: 'SA',
  city: '',
  name: '',
  mapLink: '',
  address: '',
  landmark: '',
  description: '',
  active: true,
}

export default function LocationMaster() {
  const { locations, addLocation, updateLocation, toggleLocationActive } = useShipmentV2Store()
  const toast = useToastStore()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [editor, setEditor] = useState(null)  // { mode:'add'|'edit', draft }
  const [confirmToggle, setConfirmToggle] = useState(null)

  // Filtered list
  const list = useMemo(() => {
    return (locations ?? []).filter(l => {
      if (typeFilter !== 'all' && l.type !== typeFilter) return false
      if (activeFilter === 'active'   && l.active === false) return false
      if (activeFilter === 'inactive' && l.active !== false) return false
      if (search) {
        const q = search.toLowerCase()
        if (!l.name?.toLowerCase().includes(q) &&
            !l.city?.toLowerCase().includes(q) &&
            !l.country?.toLowerCase().includes(q) &&
            !l.id?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [locations, search, typeFilter, activeFilter])

  const openAdd  = () => setEditor({ mode:'add',  draft: { ...EMPTY } })
  const openEdit = (l) => setEditor({ mode:'edit', draft: { ...EMPTY, ...l, active: l.active !== false } })

  const handleSave = () => {
    if (!editor) return
    const d = editor.draft
    if (!d.name?.trim())  { toast.warning('Missing', 'Location Name is required.'); return }
    if (!d.country?.trim()){ toast.warning('Missing', 'Country is required.'); return }
    if (!d.city?.trim())   { toast.warning('Missing', 'City is required.'); return }
    if (editor.mode === 'add') {
      const newId = `LOC-${String((locations?.length ?? 0) + 100).padStart(3, '0')}`
      addLocation({ ...d, id: newId, active: true })
      toast.success('Location added', `${newId} · ${d.name}`)
    } else {
      updateLocation(d.id, d)
      toast.success('Location updated', d.name)
    }
    setEditor(null)
  }

  const handleToggle = () => {
    if (!confirmToggle) return
    toggleLocationActive(confirmToggle.id)
    toast.success(confirmToggle.active !== false ? 'Deactivated' : 'Reactivated', confirmToggle.name)
    setConfirmToggle(null)
  }

  // KPI counts
  const totalLocal = (locations ?? []).filter(l => l.type === 'local').length
  const totalIntl  = (locations ?? []).filter(l => l.type === 'international').length
  const totalActive   = (locations ?? []).filter(l => l.active !== false).length
  const totalInactive = (locations ?? []).filter(l => l.active === false).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <MapPin className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Location Master</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>Central master for pickup & destination locations · auto-fills shipment routes</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-white" style={{ background:'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Location
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Local',         v: totalLocal,    c:'var(--success)', icon: Building2 },
          { l:'International', v: totalIntl,     c:'var(--primary)', icon: Globe     },
          { l:'Active',        v: totalActive,   c:'var(--cyan)',    icon: CheckCircle2 },
          { l:'Inactive',      v: totalInactive, c:'var(--text3)',   icon: AlertCircle },
        ].map(({ l, v, c, icon:Icon }) => (
          <div key={l} className="rounded-xl border p-3" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: c }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, city, country or ID…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-40">
          <Select2 size="sm" value={typeFilter} onChange={v => setTypeFilter(v ?? 'all')}
            options={[{ id:'all', label:'All Types' }, { id:'local', label:'Local (KSA)' }, { id:'international', label:'International' }]} />
        </div>
        <div className="w-36">
          <Select2 size="sm" value={activeFilter} onChange={v => setActiveFilter(v ?? 'all')}
            options={[{ id:'all', label:'All' }, { id:'active', label:'Active Only' }, { id:'inactive', label:'Inactive' }]} />
        </div>
        {(search || typeFilter !== 'all' || activeFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setTypeFilter('all'); setActiveFilter('all') }}
            className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Locations table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="px-3 py-2.5" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text)' }}>Locations ({list.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['ID','Type','Name','Country','City','Address','Landmark','Map','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-sm" style={{ color:'var(--text3)' }}>No locations match filters · click <strong>Add Location</strong> to create one</td></tr>
              ) : list.map(l => {
                const isActive = l.active !== false
                return (
                  <tr key={l.id} style={{ borderTop:'1px solid var(--border)', opacity: isActive ? 1 : 0.55 }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{l.id}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: l.type === 'local' ? 'rgba(5,150,105,.15)' : 'var(--primary-light)', color: l.type === 'local' ? 'var(--success)' : 'var(--primary)' }}>
                        {l.type === 'local' ? <Building2 className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                        {l.type === 'local' ? 'Local' : 'Intl'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold" style={{ color:'var(--text)' }}>{l.name}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>{l.country}</td>
                    <td className="px-3 py-2" style={{ color:'var(--text2)' }}>{l.city}</td>
                    <td className="px-3 py-2 text-[12.5px] max-w-[200px] truncate" style={{ color:'var(--text3)' }} title={l.address}>{l.address || '—'}</td>
                    <td className="px-3 py-2 text-[12.5px] max-w-[140px] truncate" style={{ color:'var(--text3)' }} title={l.landmark}>{l.landmark || '—'}</td>
                    <td className="px-3 py-2">
                      {l.mapLink ? (
                        <a href={l.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[12.5px] font-bold" style={{ color:'var(--primary)' }} onClick={e => e.stopPropagation()}>
                          <Map className="w-2.5 h-2.5" /> View <ExternalLink className="w-2 h-2" />
                        </a>
                      ) : <span className="text-[12.5px]" style={{ color:'var(--text3)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: isActive ? 'rgba(5,150,105,.15)' : 'rgba(220,38,38,.15)', color: isActive ? 'var(--success)' : 'var(--danger)' }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => openEdit(l)} title="Edit" className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color:'var(--text2)' }}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmToggle(l)} title={isActive ? 'Deactivate' : 'Reactivate'} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: isActive ? 'var(--warning)' : 'var(--success)' }}>
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      <EnterpriseModal open={!!editor} onClose={() => setEditor(null)}
        title={editor?.mode === 'edit' ? 'Edit Location' : 'Add Location'}
        subtitle={editor?.mode === 'edit' ? `Update ${editor.draft?.name ?? ''}` : 'Add to location master'}
        icon={<MapPin className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setEditor(null)}>Cancel</ModalBtn><ModalBtn onClick={handleSave}>{editor?.mode === 'edit' ? 'Save Changes' : 'Confirm & Add'}</ModalBtn></>}>
        {editor && (() => {
          const d = editor.draft
          const upd = (patch) => setEditor(e => ({ ...e, draft: { ...e.draft, ...patch } }))
          return (
            <div className="space-y-3">
              {/* Type segmented control */}
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color:'var(--text3)' }}>Location Type <span style={{ color:'var(--danger)' }}>*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id:'local',         label:'Local (KSA)',   icon: Building2, c:'var(--success)' },
                    { id:'international', label:'International', icon: Globe,     c:'var(--primary)' },
                  ].map(t => {
                    const active = d.type === t.id
                    return (
                      <button key={t.id} type="button"
                        onClick={() => upd({ type: t.id, country: t.id === 'local' ? 'SA' : '', city: '' })}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all"
                        style={active
                          ? { borderColor: t.c, background:`${t.c}10`, color: t.c }
                          : { borderColor:'var(--border)', background:'var(--bg2)', color:'var(--text2)' }}>
                        <t.icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Country + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Country <span style={{ color:'var(--danger)' }}>*</span></label>
                  {d.type === 'local' ? (
                    <input value="SA · Saudi Arabia" disabled className="w-full rounded-lg px-3 py-2 text-sm border font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text3)' }} />
                  ) : (
                    <select value={d.country} onChange={e => upd({ country: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}>
                      <option value="">Select country…</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>City <span style={{ color:'var(--danger)' }}>*</span></label>
                  {d.type === 'local' ? (
                    <select value={d.city} onChange={e => upd({ city: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }}>
                      <option value="">Select city…</option>
                      {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input value={d.city} onChange={e => upd({ city: e.target.value })} placeholder="e.g. Dubai, Mumbai, Hamburg"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Location Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <input value={d.name} onChange={e => upd({ name: e.target.value })} placeholder="e.g. Riyadh Industrial City, Dubai Jebel Ali Port"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>

              {/* Google Map + Actual Location */}
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Google Map Location <span className="font-normal normal-case" style={{ color:'var(--text3)' }}>(URL)</span></label>
                <input value={d.mapLink} onChange={e => upd({ mapLink: e.target.value })} placeholder="https://maps.google.com/?q=24.7136,46.6753"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Actual Location / Address</label>
                <input value={d.address} onChange={e => upd({ address: e.target.value })} placeholder="Street, district, zip"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Landmark</label>
                <input value={d.landmark} onChange={e => upd({ landmark: e.target.value })} placeholder="Opposite the central mosque · next to Gate 4"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Description</label>
                <textarea value={d.description} onChange={e => upd({ description: e.target.value })} rows={2} placeholder="What kind of location, who operates it, key facts…"
                  className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
              </div>
            </div>
          )
        })()}
      </EnterpriseModal>

      {/* Confirm toggle modal */}
      <EnterpriseModal open={!!confirmToggle} onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.active !== false ? 'Deactivate Location?' : 'Reactivate Location?'}
        subtitle={confirmToggle?.name ?? ''}
        icon={<Power className="w-4 h-4" style={{ color: confirmToggle?.active !== false ? 'var(--warning)' : 'var(--success)' }} />}
        size="sm"
        footer={<><ModalBtn variant="secondary" onClick={() => setConfirmToggle(null)}>Cancel</ModalBtn><ModalBtn onClick={handleToggle}>Confirm</ModalBtn></>}>
        {confirmToggle && (
          <div className="text-xs" style={{ color:'var(--text2)' }}>
            {confirmToggle.active !== false
              ? <>Deactivating <strong>{confirmToggle.name}</strong> will hide it from the location dropdown in new shipments. Existing shipments referencing this location will continue to display correctly.</>
              : <>Reactivating <strong>{confirmToggle.name}</strong> will make it selectable again in shipment routes.</>}
          </div>
        )}
      </EnterpriseModal>
    </div>
  )
}
