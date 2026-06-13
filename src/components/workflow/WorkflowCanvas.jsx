import { useState, useRef } from 'react'
import { ChevronRight, Plus, MapPin, GripVertical, Zap } from 'lucide-react'
import useWorkflowStore from '../../store/workflowStore'
import { STEP_TYPES } from '../../api/mock/workflowData'
import { StepIcon, getStepColors, StepStatusDot, SLABadge } from './WorkflowBadges'

// ─── Location Marker node ─────────────────────────────────────────────────────
function LocationMarkerNode({ step, isSelected, onClick, isDragging, onDragStart, onDragEnd, insertBefore }) {
  const TYPE_LABEL = { origin: '📦 ORIGIN', waypoint: '📍 TRANSIT', destination: '🏁 DEST' }

  return (
    <div className="flex items-center flex-shrink-0">
      {insertBefore && <InsertionLine />}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`
          flex flex-col items-center cursor-pointer transition-all duration-200 select-none
          ${isDragging ? 'opacity-30' : 'opacity-100'}
          ${isSelected ? 'scale-105' : 'hover:scale-102'}
        `}
      >
        {/* Location node circle */}
        <div className={`
          w-10 h-10 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${isSelected
            ? 'border-amber-500 bg-amber-500/20 shadow-amber-glow-sm'
            : 'border-sky-500/50 bg-sky-500/10 hover:border-sky-400'
          }
        `}>
          <MapPin className="w-4 h-4 text-sky-400" />
        </div>

        {/* Labels */}
        <div className="mt-1.5 text-center" style={{ width: '100px' }}>
          <div className="text-[9px] font-bold text-sky-400 tracking-widest">
            {TYPE_LABEL[step.locationType] ?? '📍 STOP'}
          </div>
          <div className="text-[12.5px] font-semibold text-slate-200 leading-tight mt-0.5 break-words text-center">
            {step.locationName ?? 'Location'}
          </div>
          {step.locationCountry && (
            <div className="text-[9px] text-slate-600">{step.locationCountry}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Insertion indicator ──────────────────────────────────────────────────────
function InsertionLine() {
  return (
    <div className="flex items-center flex-shrink-0 mx-1">
      <div className="w-0.5 h-16 bg-amber-500 rounded-full shadow-amber-glow-sm" />
    </div>
  )
}

// ─── Arrow connector ──────────────────────────────────────────────────────────
function Arrow({ dim = false }) {
  return (
    <div className="flex items-center flex-shrink-0 mx-0.5">
      <ChevronRight className={`w-4 h-4 ${dim ? 'text-helm-600' : 'text-helm-500'}`} />
    </div>
  )
}

// ─── Regular step card ────────────────────────────────────────────────────────
function StepCard({ step, isSelected, isDragging, insertBefore, onClick, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const colors = getStepColors(step.type)

  const statusBg = step.status === 'completed' ? 'border-emerald-500/40 bg-emerald-500/5'
    : step.status === 'active'    ? 'border-amber-500/50 bg-amber-500/8 shadow-amber-glow-sm'
    : step.status === 'failed'    ? 'border-red-500/40 bg-red-500/5'
    : isSelected                  ? `${colors.border} ${colors.bg}`
    : 'border-helm-600 bg-helm-800 hover:border-helm-500'

  return (
    <div className="flex items-center flex-shrink-0">
      {insertBefore && <InsertionLine />}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        style={{ width: '130px', minHeight: '88px' }}
        className={`
          relative flex flex-col rounded-xl border cursor-pointer
          transition-all duration-200 select-none p-2.5
          ${statusBg}
          ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}
          ${isSelected && step.status === 'pending' ? 'scale-105' : 'hover:scale-102'}
        `}
      >
        {/* Drag handle */}
        <div className="absolute top-1.5 right-1.5 text-slate-700 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Icon + type */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${colors.bg} border ${colors.border}`}>
            <StepIcon type={step.type} className={colors.text} />
          </div>
          <span className={`text-[8px] font-bold uppercase tracking-widest ${colors.text} leading-tight`}>
            {STEP_TYPES[step.type]?.label ?? step.type}
          </span>
        </div>

        {/* Name */}
        <div className="text-[11px] font-semibold text-slate-200 leading-tight flex-1 mb-1.5 break-words">
          {step.name}
        </div>

        {/* Footer: status + SLA */}
        <div className="flex items-center justify-between mt-auto">
          <StepStatusDot status={step.status} />
          <SLABadge hours={step.slaHours} compact />
        </div>

        {/* Approval badge */}
        {step.requiresApproval && (
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-helm-900 flex items-center justify-center">
            <span className="text-[8px] text-helm-900 font-black">A</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Canvas row helper (wrapping not used — horizontal scroll) ────────────────
function GroupedSteps({ steps, dndState, setDndState, selectedStepId, selectStep, addStep }) {
  const moveStep = useWorkflowStore((s) => s.moveStep)

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => setDndState((s) => ({ ...s, draggedId: id })), 0)
  }

  const handleDragEnd = () => setDndState({ draggedId: null, insertAfterIdx: -1 })

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const isRight = e.clientX > rect.left + rect.width / 2
    setDndState((s) => ({ ...s, insertAfterIdx: isRight ? idx : idx - 1 }))
  }

  const handleDrop = (e, idx) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    const newType   = e.dataTransfer.getData('newStepType')

    if (newType) {
      addStep(newType, dndState.insertAfterIdx)
    } else if (draggedId) {
      moveStep(draggedId, dndState.insertAfterIdx)
    }
    setDndState({ draggedId: null, insertAfterIdx: -1 })
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    const newType = e.dataTransfer.getData('newStepType')
    if (newType) addStep(newType)
    setDndState({ draggedId: null, insertAfterIdx: -1 })
  }

  return (
    <div
      className="flex items-center py-8 px-6 min-w-max gap-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
    >
      {/* Insertion at position 0 */}
      {dndState.draggedId && dndState.insertAfterIdx === -1 && <InsertionLine />}

      {steps.map((step, idx) => {
        const isSelected  = selectedStepId === step.id
        const isDragging  = dndState.draggedId === step.id
        const insertBefore = dndState.insertAfterIdx === idx && !isDragging

        const commonProps = {
          step, isSelected, isDragging, insertBefore,
          onClick: () => selectStep(isSelected ? null : step.id),
          onDragStart: (e) => handleDragStart(e, step.id),
          onDragEnd: handleDragEnd,
        }

        return (
          <div key={step.id} className="flex items-center">
            {/* Arrow connector (skip first and after location markers) */}
            {idx > 0 && !insertBefore && !isDragging && (
              steps[idx - 1]?.type === 'location_marker'
                ? <div className="w-6" />
                : <Arrow dim={dndState.draggedId !== null} />
            )}

            {step.type === 'location_marker' ? (
              <LocationMarkerNode
                {...commonProps}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
              />
            ) : (
              <StepCard
                {...commonProps}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
              />
            )}
          </div>
        )
      })}

      {/* Add step button at end */}
      <div className="flex items-center ml-2">
        <Arrow dim />
        <button
          onClick={() => addStep('approval')}
          className="w-10 h-10 rounded-full border-2 border-dashed border-helm-600 hover:border-amber-500/60 flex items-center justify-center text-slate-600 hover:text-amber-400 transition-all flex-shrink-0"
          title="Add step"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main WorkflowCanvas ──────────────────────────────────────────────────────
export default function WorkflowCanvas() {
  const steps         = useWorkflowStore((s) => s.draft.steps)
  const selectedStepId = useWorkflowStore((s) => s.selectedStepId)
  const selectStep    = useWorkflowStore((s) => s.selectStep)
  const addStep       = useWorkflowStore((s) => s.addStep)
  const workflowType  = useWorkflowStore((s) => s.draft.type)

  const [dndState, setDndState] = useState({ draggedId: null, insertAfterIdx: -1 })
  const scrollRef = useRef(null)

  // Empty state
  if (!steps.length) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-helm-700 rounded-2xl m-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const t = e.dataTransfer.getData('newStepType')
          if (t) addStep(t)
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-helm-800 border border-helm-700 flex items-center justify-center">
          <Zap className="w-6 h-6 text-helm-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500">Canvas is empty</p>
          <p className="text-xs text-slate-600 mt-1">Drag steps from the palette or click them to add</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Progress indicator */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {steps.filter((s) => s.type !== 'location_marker').map((step, i) => (
            <div key={step.id} className="flex items-center gap-0.5">
              {i > 0 && <div className="w-2 h-px bg-helm-700" />}
              <div className={`w-2 h-2 rounded-full transition-all
                ${step.status === 'completed' ? 'bg-emerald-500'
                : step.status === 'active'    ? 'bg-amber-500 animate-pulse'
                : step.status === 'failed'    ? 'bg-red-500'
                : 'bg-helm-600'}`} />
            </div>
          ))}
        </div>
        <span className="text-[12.5px] text-slate-600 font-mono ml-auto">
          {steps.filter((s) => s.type !== 'location_marker').length} steps ·{' '}
          {steps.filter((s) => s.type === 'location_marker').length} locations
        </span>
      </div>

      {/* Horizontal scrollable canvas area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto bg-grid-pattern bg-grid-md"
        style={{ cursor: dndState.draggedId ? 'grabbing' : 'default' }}
      >
        <GroupedSteps
          steps={steps}
          dndState={dndState}
          setDndState={setDndState}
          selectedStepId={selectedStepId}
          selectStep={selectStep}
          addStep={addStep}
        />
      </div>

      {/* Canvas legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-helm-700/50 flex-shrink-0">
        {[
          { cls: 'bg-slate-600',   label: 'Pending'   },
          { cls: 'bg-amber-500',   label: 'Active'    },
          { cls: 'bg-emerald-500', label: 'Completed' },
          { cls: 'bg-red-500',     label: 'Failed'    },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-[9px] text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full ${l.cls}`} />
            {l.label}
          </div>
        ))}
        <span className="ml-auto text-[9px] text-slate-700">A = Requires Approval</span>
      </div>
    </div>
  )
}
