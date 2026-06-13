// Inventory Master · /inventory
import { useState, useMemo } from 'react'
import {
  Boxes, Plus, Search, Filter, X, Edit3, AlertTriangle, Package,
  TrendingUp, TrendingDown, Hash, MapPin, DollarSign, CheckCircle2,
} from 'lucide-react'
import useFinanceStore from '../../store/financeStore'
import useToastStore   from '../../store/toastStore'
import Select2         from '../../components/ui/Select2'
import EnterpriseModal, { ModalBtn } from '../../components/ui/EnterpriseModal'
import { INVENTORY_CATEGORIES } from '../../api/mock/financeData'

const C = { background:'var(--card)', borderColor:'var(--border)', boxShadow:'var(--shadow)' }
const fmtMoney = (n) => (n ?? 0).toLocaleString()
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'

export default function InventoryMaster() {
  const { inventory, addInventoryItem, updateInventoryItem, adjustStock } = useFinanceStore()
  const toast = useToastStore()

  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen]     = useState(null)   // inventory item
  const [adjustOpen, setAdjustOpen] = useState(null)   // inventory item
  const [adjustForm, setAdjustForm] = useState({ delta: 0, reason: '' })
  const [draft, setDraft]           = useState({ sapId:'', name:'', category:'Equipment', unit:'unit', stock:0, minStock:0, location:'', unitCost:0 })

  const filtered = useMemo(() => {
    return inventory.filter(i => {
      if (category !== 'all' && i.category !== category) return false
      if (stockFilter === 'low' && i.stock > i.minStock) return false
      if (stockFilter === 'out' && i.stock > 0) return false
      if (search) {
        const q = search.toLowerCase()
        return i.name.toLowerCase().includes(q) || i.sapId.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
      }
      return true
    })
  }, [inventory, search, category, stockFilter])

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((s, i) => s + i.stock * i.unitCost, 0)
    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length
    const outOfStock = inventory.filter(i => i.stock === 0).length
    return { totalItems: inventory.length, totalValue, lowStock, outOfStock }
  }, [inventory])

  const handleCreate = () => {
    if (!draft.name || !draft.sapId) { toast.warning('Missing fields', 'Name and SAP ID are required.'); return }
    const id = `INV-${String(inventory.length + 1).padStart(4, '0')}`
    addInventoryItem({ ...draft, id, stock: Number(draft.stock), minStock: Number(draft.minStock), unitCost: Number(draft.unitCost), lastUpdated: new Date().toISOString() })
    toast.success('Inventory item added', `${id} · ${draft.name}`)
    setCreateOpen(false); setDraft({ sapId:'', name:'', category:'Equipment', unit:'unit', stock:0, minStock:0, location:'', unitCost:0 })
  }

  const handleEditSave = () => {
    if (!editOpen) return
    updateInventoryItem(editOpen.id, {
      sapId: editOpen.sapId, name: editOpen.name, category: editOpen.category,
      unit: editOpen.unit, minStock: Number(editOpen.minStock),
      location: editOpen.location, unitCost: Number(editOpen.unitCost),
    })
    toast.success('Inventory updated', `${editOpen.name}`)
    setEditOpen(null)
  }

  const handleAdjust = () => {
    if (!adjustOpen || adjustForm.delta === 0) { toast.warning('Enter a value', 'Adjustment cannot be zero.'); return }
    if (!adjustForm.reason?.trim()) { toast.warning('Missing reason', 'Please describe why you\'re adjusting stock.'); return }
    adjustStock(adjustOpen.id, Number(adjustForm.delta), adjustForm.reason)
    toast.success('Stock adjusted', `${adjustOpen.name} · ${adjustForm.delta > 0 ? '+' : ''}${adjustForm.delta}`)
    setAdjustOpen(null); setAdjustForm({ delta: 0, reason: '' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--primary-light)', border:'1px solid rgba(37,99,235,.2)' }}>
            <Boxes className="w-4.5 h-4.5" style={{ color:'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color:'var(--text)' }}>Inventory Master</h2>
            <p className="text-[11px]" style={{ color:'var(--text3)' }}>SAP-synced stock catalog · used by shipment cargo wizard</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="px-3.5 py-2 text-xs font-bold rounded-lg text-white flex items-center gap-1.5" style={{ background:'var(--primary)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Inventory Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total Items',    v: stats.totalItems,            c:'var(--text)',    icon: Package },
          { l:'Total Value',    v:`SAR ${fmtMoney(stats.totalValue)}`, c:'var(--success)', icon: DollarSign },
          { l:'Low Stock',      v: stats.lowStock,              c:'var(--warning)', icon: TrendingDown },
          { l:'Out of Stock',   v: stats.outOfStock,            c:'var(--danger)',  icon: AlertTriangle },
        ].map(({ l, v, c, icon:Icon }) => (
          <div key={l} className="rounded-xl border p-4" style={{ ...C, borderLeft:`3px solid ${c}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: c }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>{l}</span>
            </div>
            <div className="text-xl font-black font-mono" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-2.5 flex items-center gap-2 flex-wrap" style={C}>
        <Filter className="w-3.5 h-3.5 ml-1" style={{ color:'var(--text3)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, SAP ID, item ID…"
            className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
        <div className="w-44">
          <Select2 size="sm" placeholder="Category"
            options={[{ id:'all', label:'All Categories' }, ...INVENTORY_CATEGORIES.map(c => ({ id: c, label: c }))]}
            value={category} onChange={v => setCategory(v ?? 'all')} />
        </div>
        <div className="w-44">
          <Select2 size="sm" placeholder="Stock level"
            options={[{ id:'all', label:'All Stock' }, { id:'low', label:'Low Stock' }, { id:'out', label:'Out of Stock' }]}
            value={stockFilter} onChange={v => setStockFilter(v ?? 'all')} />
        </div>
        {(search || category !== 'all' || stockFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setCategory('all'); setStockFilter('all') }} className="text-[12.5px] font-bold flex items-center gap-1 px-2 py-1 rounded" style={{ color:'var(--danger)' }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Inventory table */}
      <div className="rounded-xl border overflow-hidden" style={C}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background:'var(--bg2)' }}>
              <tr>
                {['Item ID','SAP ID','Name','Category','Stock','Min','Unit Cost','Stock Value','Location','Updated',''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="py-12 text-center" style={{ color:'var(--text3)' }}>No inventory items match filters</td></tr>
              ) : filtered.map(i => {
                const value = i.stock * i.unitCost
                const stockLow = i.stock > 0 && i.stock <= i.minStock
                const stockOut = i.stock === 0
                return (
                  <tr key={i.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--primary)' }}>{i.id}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>
                      <span className="inline-flex items-center gap-1 text-[12.5px] px-1.5 py-0.5 rounded" style={{ background:'var(--bg2)' }}>
                        <Hash className="w-2.5 h-2.5" />{i.sapId}
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ color:'var(--text)' }}>
                      <div className="font-bold">{i.name}</div>
                      <div className="text-[12.5px]" style={{ color:'var(--text3)' }}>per {i.unit}</div>
                    </td>
                    <td className="px-3 py-2"><span className="inline-block px-1.5 py-0.5 text-[12.5px] font-bold rounded" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{i.category}</span></td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: stockOut ? 'var(--danger)' : stockLow ? 'var(--warning)' : 'var(--text)' }}>
                      {i.stock} {stockLow && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text3)' }}>{i.minStock}</td>
                    <td className="px-3 py-2 font-mono" style={{ color:'var(--text2)' }}>SAR {fmtMoney(i.unitCost)}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color:'var(--success)' }}>SAR {fmtMoney(value)}</td>
                    <td className="px-3 py-2 text-[12.5px]" style={{ color:'var(--text3)' }}>
                      <span className="inline-flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{i.location}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color:'var(--text3)' }}>{fmtDate(i.lastUpdated)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAdjustOpen(i)} className="px-2 py-1 text-[12.5px] font-bold rounded border" style={{ background:'var(--card)', color:'var(--primary)', borderColor:'var(--border)' }}>± Adjust</button>
                        <button onClick={() => setEditOpen({ ...i })} className="w-7 h-7 rounded flex items-center justify-center border" style={{ background:'var(--card)', borderColor:'var(--border)' }}><Edit3 className="w-3 h-3" style={{ color:'var(--text3)' }} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <EnterpriseModal open={createOpen} onClose={() => setCreateOpen(false)}
        title="Add Inventory Item" subtitle="New entry in the inventory master"
        icon={<Plus className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</ModalBtn><ModalBtn onClick={handleCreate}>Create Item</ModalBtn></>}>
        <InventoryForm draft={draft} setDraft={setDraft} />
      </EnterpriseModal>

      {/* Edit modal */}
      <EnterpriseModal open={!!editOpen} onClose={() => setEditOpen(null)}
        title="Edit Inventory Item" subtitle={editOpen?.id}
        icon={<Edit3 className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="lg"
        footer={<><ModalBtn variant="secondary" onClick={() => setEditOpen(null)}>Cancel</ModalBtn><ModalBtn onClick={handleEditSave}>Save Changes</ModalBtn></>}>
        {editOpen && <InventoryForm draft={editOpen} setDraft={setEditOpen} isEdit />}
      </EnterpriseModal>

      {/* Adjust modal */}
      <EnterpriseModal open={!!adjustOpen} onClose={() => setAdjustOpen(null)}
        title="Adjust Stock" subtitle={adjustOpen ? `${adjustOpen.name} · current ${adjustOpen.stock} ${adjustOpen.unit}` : ''}
        icon={<TrendingUp className="w-4 h-4" style={{ color:'var(--primary)' }} />} size="md"
        footer={<><ModalBtn variant="secondary" onClick={() => setAdjustOpen(null)}>Cancel</ModalBtn><ModalBtn onClick={handleAdjust}>Confirm Adjustment</ModalBtn></>}>
        {adjustOpen && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 grid grid-cols-3 gap-2 text-xs" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
              <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Current</div><div className="font-mono font-bold" style={{ color:'var(--text)' }}>{adjustOpen.stock}</div></div>
              <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>Adjustment</div><div className="font-mono font-bold" style={{ color: Number(adjustForm.delta) > 0 ? 'var(--success)' : Number(adjustForm.delta) < 0 ? 'var(--danger)' : 'var(--text3)' }}>{Number(adjustForm.delta) > 0 ? '+' : ''}{adjustForm.delta || 0}</div></div>
              <div><div className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text3)' }}>New Stock</div><div className="font-mono font-bold" style={{ color:'var(--primary)' }}>{Math.max(0, adjustOpen.stock + Number(adjustForm.delta || 0))}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAdjustForm({ ...adjustForm, delta: Math.abs(Number(adjustForm.delta) || 0) })} className="px-3 py-2 text-xs font-bold rounded-lg border" style={{ background: Number(adjustForm.delta) > 0 ? 'var(--success)' : 'var(--card)', color: Number(adjustForm.delta) > 0 ? '#fff' : 'var(--text2)', borderColor:'var(--border)' }}>+ Stock In</button>
              <button type="button" onClick={() => setAdjustForm({ ...adjustForm, delta: -Math.abs(Number(adjustForm.delta) || 0) })} className="px-3 py-2 text-xs font-bold rounded-lg border" style={{ background: Number(adjustForm.delta) < 0 ? 'var(--danger)' : 'var(--card)', color: Number(adjustForm.delta) < 0 ? '#fff' : 'var(--text2)', borderColor:'var(--border)' }}>− Stock Out</button>
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Quantity <span style={{ color:'var(--danger)' }}>*</span></label>
              <input type="number" value={Math.abs(adjustForm.delta) || ''} onChange={e => {
                const sign = Number(adjustForm.delta) < 0 ? -1 : 1
                setAdjustForm({ ...adjustForm, delta: sign * Math.abs(Number(e.target.value) || 0) })
              }} placeholder="0"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Reason <span style={{ color:'var(--danger)' }}>*</span></label>
              <textarea value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} rows={2} placeholder="Stock receipt from supplier · damaged goods · inventory count correction…"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none resize-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
            </div>
          </div>
        )}
      </EnterpriseModal>
    </div>
  )
}

function InventoryForm({ draft, setDraft, isEdit }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>SAP ID <span style={{ color:'var(--danger)' }}>*</span></label>
        <input value={draft.sapId} onChange={e => setDraft({ ...draft, sapId: e.target.value })} placeholder="SAP-1000-XXXX"
          className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>
      <div>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Name <span style={{ color:'var(--danger)' }}>*</span></label>
        <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Generator Set 250kVA"
          className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>
      <div>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Category</label>
        <Select2 size="sm" value={draft.category} onChange={v => setDraft({ ...draft, category: v })}
          options={INVENTORY_CATEGORIES.map(c => ({ id: c, label: c }))} />
      </div>
      <div>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Unit</label>
        <Select2 size="sm" value={draft.unit} onChange={v => setDraft({ ...draft, unit: v })}
          options={[{id:'unit', label:'unit'}, {id:'kit', label:'kit'}, {id:'pack', label:'pack'}, {id:'drum', label:'drum'}, {id:'each', label:'each'}, {id:'box', label:'box'}]} />
      </div>
      {!isEdit && (
        <div>
          <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Opening Stock</label>
          <input type="number" value={draft.stock} onChange={e => setDraft({ ...draft, stock: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
        </div>
      )}
      <div className={isEdit ? '' : ''}>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Min Stock</label>
        <input type="number" value={draft.minStock} onChange={e => setDraft({ ...draft, minStock: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>
      <div>
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Unit Cost (SAR)</label>
        <input type="number" value={draft.unitCost} onChange={e => setDraft({ ...draft, unitCost: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>
      <div className="col-span-2">
        <label className="text-[12.5px] font-bold uppercase tracking-widest mb-1 block" style={{ color:'var(--text3)' }}>Warehouse Location</label>
        <input value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} placeholder="Riyadh Warehouse 01"
          className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--text)' }} />
      </div>
    </div>
  )
}
