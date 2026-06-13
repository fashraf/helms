import { MapPin, Layers, Flag, Globe } from 'lucide-react'
import { STEP_TYPES, PALETTE_CATEGORIES } from '../../api/mock/workflowData'
import { StepIcon, getStepColors } from './WorkflowBadges'
import useWorkflowStore from '../../store/workflowStore'

const CAT_ICONS = { route: MapPin, core: Layers, local: Flag, intl: Globe }

export default function StepPalette({ workflowType }) {
  const addStep = useWorkflowStore((s) => s.addStep)

  // Filter intl-only steps for local workflows and vice versa
  const visibleTypes = Object.entries(STEP_TYPES).filter(([, cfg]) => {
    if (workflowType === 'local' && cfg.cat === 'intl') return false
    return true
  })

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('newStepType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex flex-col bg-helm-900 border-r border-helm-700 h-full w-[220px] flex-shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-helm-700 flex-shrink-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Step Palette</p>
        <p className="text-[9px] text-slate-700 mt-0.5">Click or drag onto canvas</p>
      </div>

      {/* Categories */}
      {PALETTE_CATEGORIES.map((cat) => {
        const catTypes = visibleTypes.filter(([, cfg]) => cfg.cat === cat.id)
        if (!catTypes.length) return null
        const CatIcon = CAT_ICONS[cat.id] ?? Layers

        return (
          <div key={cat.id} className="border-b border-helm-700/60 last:border-0">
            {/* Category header */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <CatIcon className="w-3 h-3 text-slate-600" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{cat.label}</span>
            </div>

            {/* Step items */}
            <div className="pb-2 px-2 space-y-1">
              {catTypes.map(([type, cfg]) => {
                const colors = getStepColors(type)
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                    onClick={() => addStep(type)}
                    className={`
                      flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer
                      border ${colors.border} ${colors.bg}
                      hover:opacity-90 active:scale-95
                      transition-all duration-100 select-none group
                    `}
                    title={`Add ${cfg.label}`}
                  >
                    <StepIcon type={type} className={`${colors.text} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-semibold ${colors.text} leading-tight`}>{cfg.label}</div>
                    </div>
                    <span className="text-[9px] text-slate-700 group-hover:text-slate-400 transition-colors">+</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Hint */}
      <div className="p-3 mt-auto">
        <p className="text-[9px] text-slate-700 leading-relaxed">
          Drag steps onto the canvas to position them, or click to append.
        </p>
      </div>
    </div>
  )
}
