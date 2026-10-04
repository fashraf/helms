import { Settings as SettingsIcon, Save, RotateCcw, Bell, Brain, GitBranch, Server, Check } from 'lucide-react'
import { useState } from 'react'
import useAdminStore from '../../store/adminStore'
import { useToast } from '../../hooks/useToast'

const Toggle = ({ value, onChange, label, sub }) => (
  <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
    <div>
      <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{label}</div>
      {sub && <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
    <div onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer relative ${value ? '' : ''}`}
      style={{ background: value ? 'var(--primary)' : 'var(--bg3)' }}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
  </div>
)

const Field = ({ label, children, sub }) => (
  <div className="py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{label}</div>
        {sub && <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
      </div>
      <div className="flex-shrink-0 w-48">{children}</div>
    </div>
  </div>
)

const SI = ({ value, onChange, type = 'text' }) => (
  <input type={type} value={value} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    className="w-full rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
    style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
)

const Sel = ({ value, onChange, children }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="w-full rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
    style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
    {children}
  </select>
)

const SectionCard = ({ title, icon: Icon, iconColor, children }) => (
  <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text2)' }}>{title}</span>
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
)

export default function SettingsPage() {
  const { settings, setSetting, setNestedSetting, saveSettings, settingsDirty } = useAdminStore()
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveSettings()
    setSaved(true)
    toast.success('Settings Saved', 'All configuration changes have been applied.')
    setTimeout(() => setSaved(false), 2000)
  }

  const sys  = settings.system
  const notif= settings.notifications
  const ai   = settings.ai
  const wf   = settings.workflow

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
            <SettingsIcon className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>System Settings</h2>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Configure HELMS platform behaviour and integrations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {settingsDirty && <span className="text-[12.5px] text-amber-400">● Unsaved changes</span>}
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* System */}
      <SectionCard title="System Configuration" icon={Server} iconColor="text-sky-400">
        <Field label="Company Name" sub="Appears on reports and invoices">
          <SI value={sys.companyName} onChange={v => setSetting('system','companyName',v)} />
        </Field>
        <Field label="Default Currency">
          <Sel value={sys.currency} onChange={v => setSetting('system','currency',v)}>
            {['SAR','USD','EUR','AED','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
          </Sel>
        </Field>
        <Field label="Timezone">
          <Sel value={sys.timezone} onChange={v => setSetting('system','timezone',v)}>
            {['AST','GST','UTC','EET','PKT'].map(t => <option key={t} value={t}>{t}</option>)}
          </Sel>
        </Field>
        <Field label="Date Format">
          <Sel value={sys.dateFormat} onChange={v => setSetting('system','dateFormat',v)}>
            {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'].map(f => <option key={f} value={f}>{f}</option>)}
          </Sel>
        </Field>
        <Field label="Session Timeout" sub="Minutes of inactivity before logout">
          <SI type="number" value={sys.sessionTimeout} onChange={v => setSetting('system','sessionTimeout',v)} />
        </Field>
        <Toggle value={sys.maintenanceMode} onChange={v => setSetting('system','maintenanceMode',v)}
          label="Maintenance Mode" sub="Blocks all non-admin access when enabled" />
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notification Settings" icon={Bell} iconColor="text-amber-400">
        <Toggle value={notif.emailEnabled}   onChange={v => setSetting('notifications','emailEnabled',v)}   label="Email Notifications"  sub="Send alerts via email" />
        <Toggle value={notif.smsEnabled}     onChange={v => setSetting('notifications','smsEnabled',v)}     label="SMS Notifications"    sub="Send critical alerts via SMS (additional costs)" />
        <Toggle value={notif.pushEnabled}    onChange={v => setSetting('notifications','pushEnabled',v)}     label="Push Notifications"   sub="Browser and mobile push notifications" />
        <Toggle value={notif.delayAlerts}    onChange={v => setSetting('notifications','delayAlerts',v)}    label="Delay Alerts"         sub="Notify when shipment delays are detected" />
        <Toggle value={notif.criticalAlerts} onChange={v => setSetting('notifications','criticalAlerts',v)} label="Critical System Alerts" sub="Always on — cannot be disabled" />
        <Toggle value={notif.weeklyReport}   onChange={v => setSetting('notifications','weeklyReport',v)}   label="Weekly Digest"        sub="Sunday 08:00 AST summary email" />
        <Toggle value={notif.dailyDigest}    onChange={v => setSetting('notifications','dailyDigest',v)}    label="Daily KPI Summary"    sub="Each morning at 07:00 AST" />
        <Field label="Alert Threshold" sub="Risk score % above which alerts fire">
          <SI type="number" value={notif.alertThreshold} onChange={v => setSetting('notifications','alertThreshold',v)} />
        </Field>
      </SectionCard>

      {/* AI Engine */}
      <SectionCard title="AI Engine Configuration" icon={Brain} iconColor="text-purple-400">
        <Toggle value={ai.riskEngineEnabled}      onChange={v => setSetting('ai','riskEngineEnabled',v)}      label="Risk Engine"           sub="Delay, damage, customs and weather scoring" />
        <Toggle value={ai.predictionsEnabled}     onChange={v => setSetting('ai','predictionsEnabled',v)}     label="ETA Predictions"       sub="Min/max ETA with confidence scoring" />
        <Toggle value={ai.recommendationsEnabled} onChange={v => setSetting('ai','recommendationsEnabled',v)} label="AI Recommendations"    sub="Route, vehicle and customs suggestions" />
        <Toggle value={ai.autoEscalate}           onChange={v => setSetting('ai','autoEscalate',v)}           label="Auto-Escalate on Risk" sub="Trigger approval flow when risk exceeds threshold" />
        <Field label="Confidence Threshold %" sub="Minimum confidence to show predictions">
          <SI type="number" value={ai.confidenceThreshold} onChange={v => setSetting('ai','confidenceThreshold',v)} />
        </Field>
        <Field label="Update Interval (mins)" sub="How often the AI refreshes risk scores">
          <SI type="number" value={ai.updateIntervalMins} onChange={v => setSetting('ai','updateIntervalMins',v)} />
        </Field>
        <Field label="Historical Window (days)" sub="How far back route comparison reaches">
          <SI type="number" value={ai.historicalWindowDays} onChange={v => setSetting('ai','historicalWindowDays',v)} />
        </Field>
        {['delay','damage','customs','weather'].map(k => (
          <Field key={k} label={`Model: ${k.charAt(0).toUpperCase()+k.slice(1)} Risk`}>
            <SI value={ai.models[k]} onChange={v => setNestedSetting('ai','models',k,v)} />
          </Field>
        ))}
      </SectionCard>

      {/* Workflow */}
      <SectionCard title="Workflow Defaults" icon={GitBranch} iconColor="text-teal-400">
        <Field label="Default SLA (hours)" sub="Applied to all new workflow steps">
          <SI type="number" value={wf.defaultSLAHours} onChange={v => setSetting('workflow','defaultSLAHours',v)} />
        </Field>
        <Field label="Auto-Approve Below (SAR)" sub="Cost overruns below this value auto-approve">
          <SI type="number" value={wf.autoApproveBelow} onChange={v => setSetting('workflow','autoApproveBelow',v)} />
        </Field>
        <Toggle value={wf.requireDualApproval} onChange={v => setSetting('workflow','requireDualApproval',v)}
          label="Dual Approval" sub="High-value workflows require two approvers" />
        <Field label="Default Branch">
          <Sel value={wf.defaultBranch} onChange={v => setSetting('workflow','defaultBranch',v)}>
            {['Riyadh HQ','Jeddah Branch','Dammam Branch','Khobar Office','Tabuk Field Office'].map(b => <option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        <Field label="Default VAT Rate (%)" sub="Saudi VAT applied to local workflows">
          <SI type="number" value={wf.vatRate} onChange={v => setSetting('workflow','vatRate',v)} />
        </Field>
      </SectionCard>
    </div>
  )
}
