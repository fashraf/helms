import { useState } from 'react'
import { Shield, Search, Info, Link, Monitor, AlertTriangle, Calendar } from 'lucide-react'
import EnterpriseModal, { ModalBtn } from '../ui/EnterpriseModal'
import { PERMISSION_META, PERM_TYPES, PERMISSION_MODULES } from '../../api/mock/rbacData'

const LEVEL_CFG = {
  basic:     { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200',   label: 'Basic'      },
  standard:  { cls: 'text-blue-600 bg-blue-50 border-blue-200',            label: 'Standard'   },
  elevated:  { cls: 'text-amber-600 bg-amber-50 border-amber-200',         label: 'Elevated'   },
  admin:     { cls: 'text-red-600 bg-red-50 border-red-200',               label: 'Admin Only' },
  'Restricted': { cls: 'text-red-600 bg-red-50 border-red-200',            label: 'Restricted' },
  'Advanced':   { cls: 'text-amber-600 bg-amber-50 border-amber-200',      label: 'Advanced'   },
  'Admin Only': { cls: 'text-red-700 bg-red-100 border-red-300',           label: 'Admin Only' },
  'Critical':   { cls: 'text-red-800 bg-red-200 border-red-400 animate-pulse', label: 'Critical' },
}

const IMPACT_CFG = {
  Low:      'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium:   'text-amber-600 bg-amber-50 border-amber-200',
  High:     'text-red-600 bg-red-50 border-red-200',
  Critical: 'text-red-800 bg-red-200 border-red-400',
}

export default function PermissionDetailModal({ open, onClose, moduleId, permId }) {
  const [search, setSearch] = useState('')

  const module  = PERMISSION_MODULES.find(m => m.id === moduleId)
  const permDef = PERM_TYPES.find(p => p.id === permId)
  const meta    = PERMISSION_META[`${moduleId}.${permId}`]
  const key     = `${moduleId}.${permId}`

  const level  = meta?.accessLevel ?? permDef?.level
  const lvlCfg = LEVEL_CFG[level] ?? LEVEL_CFG.standard

  if (!module || !permDef) return null

  const infoRows = [
    { label: 'Module',           value: module.label,          icon: Shield    },
    { label: 'Permission',       value: permDef.label,         icon: Shield    },
    { label: 'Permission Key',   value: key,                   icon: Info      },
    { label: 'Description',      value: meta?.description ?? `Grants the ability to ${permDef.label.toLowerCase()} in ${module.label}`, icon: Info },
    { label: 'Access Level',     value: level,                 icon: Shield    },
    { label: 'Depends On',       value: meta?.dependsOn?.join(', ') ?? `${moduleId}.view`, icon: Link },
    { label: 'Affected Screens', value: meta?.affectedScreens?.join(', ') ?? module.label, icon: Monitor },
    { label: 'Security Impact',  value: meta?.securityImpact ?? 'Low', icon: AlertTriangle },
    { label: 'Last Updated',     value: new Date().toLocaleDateString('en-SA', { year:'numeric', month:'long', day:'numeric' }), icon: Calendar },
  ]

  return (
    <EnterpriseModal
      open={open}
      onClose={onClose}
      title="Permission Details"
      subtitle={`${module.label} → ${permDef.label}`}
      icon={<Shield className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
      size="md"
      footer={<ModalBtn variant="secondary" onClick={onClose}>Close</ModalBtn>}
    >
      <div className="space-y-5">
        {/* Search within modal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search this permission…"
            className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border focus:outline-none"
            style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Header card */}
        <div className="rounded-xl border p-4 flex items-center gap-4"
          style={{ background: 'var(--primary-light)', borderColor: 'rgba(37,99,235,.2)' }}>
          <span className="text-3xl">{module.icon}</span>
          <div>
            <div className="text-lg font-black" style={{ color: 'var(--text)' }}>{permDef.icon} {permDef.label}</div>
            <div className="text-sm" style={{ color: 'var(--text2)' }}>{module.label}</div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <span className={`text-[12.5px] font-bold px-2.5 py-1 border rounded-lg ${lvlCfg.cls}`}>{lvlCfg.label}</span>
            {meta?.securityImpact && (
              <span className={`text-[12.5px] font-bold px-2.5 py-1 border rounded-lg ${IMPACT_CFG[meta.securityImpact] ?? ''}`}>
                {meta.securityImpact} Impact
              </span>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {infoRows.filter(r =>
            !search || r.label.toLowerCase().includes(search.toLowerCase()) ||
            String(r.value).toLowerCase().includes(search.toLowerCase())
          ).map(({ label, value, icon: Icon }, i, arr) => (
            <div
              key={label}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--card)' : 'var(--bg2)' }}
            >
              <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
              </div>
              <div className="flex-shrink-0 w-36 text-[12.5px] font-bold uppercase tracking-wider pt-0.5" style={{ color: 'var(--text3)' }}>
                {label}
              </div>
              <div className="flex-1 text-sm font-medium leading-relaxed" style={{ color: 'var(--text)' }}>
                {/* Highlight search */}
                {search && String(value).toLowerCase().includes(search.toLowerCase()) ? (
                  <span dangerouslySetInnerHTML={{ __html: String(value).replace(
                    new RegExp(`(${search})`, 'gi'),
                    '<mark style="background:rgba(37,99,235,.2);color:var(--primary);border-radius:2px;padding:0 2px">$1</mark>'
                  )}} />
                ) : String(value)}
              </div>
            </div>
          ))}
        </div>

        {/* AI suggestion hint */}
        <div className="rounded-xl border px-4 py-3 flex items-start gap-2.5"
          style={{ background: 'rgba(124,58,237,.05)', borderColor: 'rgba(124,58,237,.2)' }}>
          <span className="text-base flex-shrink-0">🤖</span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
            <span className="font-bold" style={{ color: '#7C3AED' }}>AI Insight: </span>
            This permission is commonly granted together with{' '}
            <span style={{ color: '#7C3AED' }}>{moduleId}.view</span> and{' '}
            <span style={{ color: '#7C3AED' }}>{moduleId}.edit</span>.
            Roles in Logistics Operations typically require this permission.
          </p>
        </div>
      </div>
    </EnterpriseModal>
  )
}
