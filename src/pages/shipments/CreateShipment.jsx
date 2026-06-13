import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Package, MapPin, Truck, CheckCircle2,
  ChevronLeft, ChevronRight, X, Zap,
} from 'lucide-react'
import useShipmentStore from '../../store/shipmentStore'
import { useToast }     from '../../hooks/useToast'
import {
  Step1BasicInfo,
  Step2Equipment,
  Step3Route,
  Step4Assignment,
  Step5Review,
} from '../../components/shipments/WizardSteps'

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Basic Info',    icon: ClipboardList, component: Step1BasicInfo },
  { num: 2, label: 'Equipment',     icon: Package,       component: Step2Equipment },
  { num: 3, label: 'Route Builder', icon: MapPin,        component: Step3Route     },
  { num: 4, label: 'Assignment',    icon: Truck,         component: Step4Assignment },
  { num: 5, label: 'Review',        icon: CheckCircle2,  component: Step5Review    },
]

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isActive    = step.num === currentStep
        const isCompleted = step.num < currentStep
        const isLast      = idx === STEPS.length - 1
        const Icon        = step.icon

        return (
          <div key={step.num} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive    ? 'bg-amber-500 shadow-amber-glow-sm'                : ''}
                  ${isCompleted ? 'bg-emerald-600'                                    : ''}
                  ${!isActive && !isCompleted ? 'bg-helm-700 border border-helm-600' : ''}
                `}
              >
                {isCompleted
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : <Icon className={`w-4 h-4 ${isActive ? 'text-helm-900' : 'text-slate-500'}`} />
                }
              </div>
              <div className={`mt-1.5 text-[12.5px] font-bold whitespace-nowrap transition-colors
                ${isActive ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-600'}`}>
                {step.label}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div className={`w-16 h-0.5 -mt-4 mx-1 transition-colors ${isCompleted ? 'bg-emerald-600' : 'bg-helm-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Create Shipment Wizard ────────────────────────────────────────────────────
export default function CreateShipment() {
  const navigate       = useNavigate()
  const { toast }      = useToast()
  const {
    wizard, setWizardStep, createShipment, resetWizard,
  } = useShipmentStore()

  const currentStep    = wizard.step
  const stepConfig     = STEPS.find((s) => s.num === currentStep)
  const StepComponent  = stepConfig?.component

  const handleNext = () => {
    if (currentStep < 5) setWizardStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setWizardStep(currentStep - 1)
  }

  const handleCancel = () => {
    resetWizard()
    navigate('/shipments')
  }

  const handleSubmit = () => {
    // Validate minimums
    const { basic, equipment, assignment } = wizard
    if (!basic.customer || !basic.region || !equipment.equipmentType || !assignment.vehicleId || !assignment.driverId) {
      toast.warning('Missing Fields', 'Please complete all required fields before submitting.')
      return
    }

    const newId = createShipment(wizard)
    resetWizard()
    toast.success('Shipment Created', `${newId} has been created and queued for dispatch.`)
    navigate(`/shipments/${newId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Create New Shipment</h2>
            <p className="text-xs text-slate-500">Step {currentStep} of {STEPS.length} — {stepConfig?.label}</p>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-helm-600 hover:border-helm-500 rounded-lg transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step card */}
      <div className="bg-helm-800 border border-helm-600 rounded-2xl overflow-hidden shadow-card">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-helm-700 bg-helm-850/50">
          {stepConfig && (
            <>
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                {stepConfig.icon && <stepConfig.icon className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">{stepConfig.label}</h3>
                <p className="text-[12.5px] text-slate-500">
                  {currentStep === 1 && 'Customer details, shipment type, and priority'}
                  {currentStep === 2 && 'Equipment specifications and condition'}
                  {currentStep === 3 && 'Define pickup, waypoints, and final delivery'}
                  {currentStep === 4 && 'Assign transport vehicle and driver'}
                  {currentStep === 5 && 'Review all details before submission'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Step content */}
        <div className="p-6 animate-fade-in">
          {StepComponent && <StepComponent />}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-helm-700 bg-helm-850/30">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-helm-600 hover:border-helm-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className={`h-1 rounded-full transition-all ${
                  s.num === currentStep ? 'w-6 bg-amber-500' : s.num < currentStep ? 'w-2 bg-emerald-500' : 'w-2 bg-helm-600'
                }`}
              />
            ))}
          </div>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-helm-900 rounded-lg transition-all shadow-amber-glow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Create Shipment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
