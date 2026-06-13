// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const past = (h) => new Date(Date.now() - h * 3600000).toISOString()
const future = (h) => new Date(Date.now() + h * 3600000).toISOString()

// ─── Constants ────────────────────────────────────────────────────────────────
export const PROJECT_SCALES = [
  { id: 'small',  label: 'Small',  desc: 'Single location, short duration',     icon: '🔹' },
  { id: 'medium', label: 'Medium', desc: 'Multi-location or multi-phase',       icon: '🔷' },
  { id: 'large',  label: 'Large',  desc: 'Enterprise / multi-country / strategic', icon: '🔶' },
]

export const PROJECT_OWNERS = [
  { id: 'private',         label: 'Private',          icon: '🏢' },
  { id: 'government',      label: 'Government',       icon: '🏛️' },
  { id: 'semi_government', label: 'Semi Government',  icon: '🏤' },
]

export const PROJECT_STATUSES = {
  draft:        { label: 'Draft',                  cls: 'text-slate-500 bg-slate-50 border-slate-200'       },
  pending:      { label: 'Pending Approval',       cls: 'text-amber-600 bg-amber-50 border-amber-200'        },
  in_review:    { label: 'Under Review',           cls: 'text-blue-600 bg-blue-50 border-blue-200'           },
  active:       { label: 'Active',                 cls: 'text-emerald-600 bg-emerald-50 border-emerald-200'   },
  on_hold:      { label: 'On Hold',                cls: 'text-amber-600 bg-amber-50 border-amber-200'        },
  completed:    { label: 'Completed',              cls: 'text-emerald-700 bg-emerald-50 border-emerald-300'   },
  inactive:     { label: 'Inactive',               cls: 'text-slate-500 bg-slate-50 border-slate-200'         },
  returned:     { label: 'Returned For Recheck',   cls: 'text-orange-600 bg-orange-50 border-orange-200'      },
  rejected:     { label: 'Rejected',               cls: 'text-red-600 bg-red-50 border-red-200'               },
}

export const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia',  flag: '🇸🇦', cities: ['Riyadh','Jeddah','Dammam','Jubail','Khobar','Makkah','Medina','Tabuk','Yanbu','Abha','Hail','Qassim'] },
  { code: 'AE', name: 'UAE',           flag: '🇦🇪', cities: ['Dubai','Abu Dhabi','Sharjah','Ajman'] },
  { code: 'KW', name: 'Kuwait',        flag: '🇰🇼', cities: ['Kuwait City','Hawalli','Salmiya'] },
  { code: 'QA', name: 'Qatar',         flag: '🇶🇦', cities: ['Doha','Al Wakrah','Al Khor'] },
  { code: 'IN', name: 'India',         flag: '🇮🇳', cities: ['Mumbai','Delhi','Chennai','Bangalore'] },
  { code: 'OM', name: 'Oman',          flag: '🇴🇲', cities: ['Muscat','Salalah','Sohar'] },
]

export const WORK_DAYS = [
  { id: 'sunday',    label: 'Sunday',    short: 'Sun' },
  { id: 'monday',    label: 'Monday',    short: 'Mon' },
  { id: 'tuesday',   label: 'Tuesday',   short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday',  label: 'Thursday',  short: 'Thu' },
  { id: 'friday',    label: 'Friday',    short: 'Fri' },
  { id: 'saturday',  label: 'Saturday',  short: 'Sat' },
]

// ─── Approval workflow steps ──────────────────────────────────────────────────
export const APPROVAL_DEFAULT_FLOW = [
  { id: 'creator',  label: 'Project Creator',  role: 'creator',   order: 1 },
  { id: 'coo',      label: 'COO Review',       role: 'coo',       order: 2 },
  { id: 'ceo',      label: 'CEO Final Approval', role: 'ceo',     order: 3 },
]

export const APPROVAL_ACTIONS = [
  { id: 'approve',  label: 'Approve',              icon: 'CheckCircle2',  color: 'var(--success)', confirmMsg: 'Are you sure you want to approve this project step?' },
  { id: 'reject',   label: 'Reject',               icon: 'XCircle',       color: 'var(--danger)',  confirmMsg: 'Are you sure you want to reject? The project will be marked Rejected.' },
  { id: 'return',   label: 'Return For Recheck',   icon: 'RotateCcw',     color: 'var(--warning)', confirmMsg: 'Send back to previous step for revision?' },
  { id: 'modify',   label: 'Request Modification', icon: 'Edit3',         color: 'var(--cyan)',    confirmMsg: 'Send modification request to project creator?' },
  { id: 'escalate', label: 'Escalate',             icon: 'ArrowUp',       color: 'var(--purple)',  confirmMsg: 'Escalate this step to higher authority?' },
  { id: 'reassign', label: 'Reassign',             icon: 'Users',         color: 'var(--text2)',   confirmMsg: 'Reassign this approval step to another user?' },
]

// ─── People (project team pool) ───────────────────────────────────────────────
export const PEOPLE = [
  { id: 'U-101', name: 'Ahmed Ali',         dept: 'Operations',  role: 'Project Manager'  },
  { id: 'U-102', name: 'Mohammed Khan',     dept: 'Engineering', role: 'Project Manager'  },
  { id: 'U-103', name: 'John Smith',        dept: 'Logistics',   role: 'Project Manager'  },
  { id: 'U-104', name: 'Fatima Al-Zahrani', dept: 'Operations',  role: 'Document Controller' },
  { id: 'U-105', name: 'Khalid Al-Mutairi', dept: 'Logistics',   role: 'Project Coordinator' },
  { id: 'U-106', name: 'Sara Chen',         dept: 'Compliance',  role: 'Document Controller' },
  { id: 'U-107', name: 'Faisal Al-Otaibi',  dept: 'Field Ops',   role: 'Project Coordinator' },
  { id: 'U-108', name: 'Priya Patel',       dept: 'Engineering', role: 'Project Coordinator' },
  { id: 'U-109', name: 'Abdullah Al-Rashid',dept: 'Executive',   role: 'COO'              },
  { id: 'U-110', name: 'Nasser Al-Harbi',   dept: 'Executive',   role: 'CEO'              },
]

// ─── Seed projects ────────────────────────────────────────────────────────────
const PROJECT_SEEDS = [
  { name: 'ARAMCO Expansion Project',     country: 'SA', city: 'Jeddah',    scale: 'large',  owner: 'government'      },
  { name: 'Site A Installation',          country: 'SA', city: 'Riyadh',    scale: 'medium', owner: 'private'         },
  { name: 'Jubail Pipeline Upgrade',      country: 'SA', city: 'Jubail',    scale: 'large',  owner: 'semi_government' },
  { name: 'Neom Logistics Hub',           country: 'SA', city: 'Tabuk',     scale: 'large',  owner: 'government'      },
  { name: 'Red Sea Resort Equipment',     country: 'SA', city: 'Jeddah',    scale: 'medium', owner: 'private'         },
  { name: 'Dammam Port Crane Setup',      country: 'SA', city: 'Dammam',    scale: 'medium', owner: 'semi_government' },
  { name: 'SABIC Petrochem Phase 3',      country: 'SA', city: 'Jubail',    scale: 'large',  owner: 'semi_government' },
  { name: 'Mall of Saudi Construction',   country: 'SA', city: 'Riyadh',    scale: 'medium', owner: 'private'         },
  { name: 'Maaden Mining Equipment Move', country: 'SA', city: 'Hail',      scale: 'medium', owner: 'private'         },
  { name: 'Doha Metro Extension',         country: 'QA', city: 'Doha',      scale: 'large',  owner: 'government'      },
  { name: 'Dubai Logistics Park',         country: 'AE', city: 'Dubai',     scale: 'medium', owner: 'private'         },
  { name: 'Kuwait Refinery Maintenance',  country: 'KW', city: 'Kuwait City',scale: 'large', owner: 'semi_government' },
  { name: 'Yanbu Cement Plant',           country: 'SA', city: 'Yanbu',     scale: 'medium', owner: 'private'         },
  { name: 'Khobar Cold Storage',          country: 'SA', city: 'Khobar',    scale: 'small',  owner: 'private'         },
  { name: 'Hail Solar Farm',              country: 'SA', city: 'Hail',      scale: 'large',  owner: 'government'      },
  { name: 'Abha Tourism Infrastructure',  country: 'SA', city: 'Abha',      scale: 'medium', owner: 'government'      },
  { name: 'Qassim Agri-Logistics',        country: 'SA', city: 'Qassim',    scale: 'small',  owner: 'private'         },
  { name: 'Medina Heavy Lift Project',    country: 'SA', city: 'Medina',    scale: 'medium', owner: 'private'         },
]

// ─── Build approval history per project ───────────────────────────────────────
function buildApprovalHistory(projectId, status) {
  const flow = APPROVAL_DEFAULT_FLOW
  const currentStep =
    status === 'active' || status === 'completed' ? flow.length
    : status === 'draft' || status === 'rejected' ? 0
    : status === 'returned' ? 1
    : status === 'in_review' ? 2
    : 1
  return flow.map((step, i) => ({
    ...step,
    status: i < currentStep ? 'approved' : i === currentStep ? 'pending' : 'waiting',
    actor:  i < currentStep ? PEOPLE[8 + (i % 2)] : i === currentStep ? PEOPLE[8 + (i % 2)] : null,
    actedAt: i < currentStep ? past(rand(1, 200)) : null,
    comment: i < currentStep ? pick(['Approved as per spec','OK','Looks good','Proceed','Approved with conditions']) : null,
    action:  i < currentStep ? 'approve' : null,
  }))
}

// ─── Project hierarchy: phases / work packages / activities ───────────────────
function buildHierarchy(projectId) {
  const phaseCount = rand(2, 4)
  return Array.from({ length: phaseCount }, (_, p) => ({
    id: `${projectId}-PH-${p + 1}`,
    type: 'phase',
    name: pick(['Site Preparation','Equipment Installation','Mobilization','Foundation Works','Commissioning','Handover']),
    progress: rand(15, 95),
    status: pick(['active','completed','pending']),
    workPackages: Array.from({ length: rand(1, 3) }, (_, w) => ({
      id: `${projectId}-PH-${p + 1}-WP-${w + 1}`,
      type: 'work_package',
      name: pick(['Earthworks','Crane Setup','Pipe Laying','Cable Pulling','QA Inspection','Material Handling','Equipment Testing']),
      progress: rand(0, 100),
      status: pick(['active','completed','pending']),
      activities: Array.from({ length: rand(2, 4) }, (_, a) => ({
        id: `${projectId}-PH-${p + 1}-WP-${w + 1}-AC-${a + 1}`,
        type: 'activity',
        name: pick(['Survey','Excavation','Welding','Inspection','Pressure Test','Load Test','Calibration','Documentation']),
        progress: rand(0, 100),
        status: pick(['active','completed','pending']),
      })),
    })),
  }))
}

// ─── Audit history ────────────────────────────────────────────────────────────
function buildAudit(projectId, status) {
  return [
    { id: `${projectId}-AUD-1`, date: past(rand(500, 2000)), user: 'Ahmed Ali',        action: 'Project Created',  field: null,        old: null,      new: null      },
    { id: `${projectId}-AUD-2`, date: past(rand(300, 900)),  user: 'Mohammed Khan',    action: 'Team Assigned',    field: 'Team',      old: null,      new: '3 members' },
    { id: `${projectId}-AUD-3`, date: past(rand(100, 400)),  user: 'Abdullah Al-Rashid',action: 'Approval Started', field: 'Status',   old: 'Draft',   new: 'Pending'  },
    { id: `${projectId}-AUD-4`, date: past(rand(10, 100)),   user: 'Abdullah Al-Rashid',action: 'Status Changed',   field: 'Status',   old: 'Pending', new: PROJECT_STATUSES[status]?.label ?? status },
  ].slice(0, status === 'draft' ? 1 : status === 'pending' ? 2 : status === 'in_review' ? 3 : 4)
}

// ─── Build vendor list ────────────────────────────────────────────────────────
export const PROJECTS = PROJECT_SEEDS.map((seed, i) => {
  const status = pick(['draft','pending','in_review','active','active','active','on_hold','completed','returned'])
  const id = `PRJ-${String(1 + i).padStart(5, '0')}`
  return {
    id,
    name:        seed.name,
    country:     seed.country,
    city:        seed.city,
    scale:       seed.scale,
    owner:       seed.owner,
    status,
    description: `${seed.name} — strategic ${seed.scale} project covering site work and equipment movement.`,
    location:    `https://maps.google.com/?q=${encodeURIComponent(seed.city + ', ' + seed.country)}`,
    address:     `${rand(1,200)} Industrial District, ${seed.city}, ${COUNTRIES.find(c=>c.code===seed.country)?.name}`,
    managers:        [PEOPLE[i % 3].id],
    docControllers:  [PEOPLE[3 + (i % 2)].id],
    coordinators:    [PEOPLE[4 + (i % 3)].id, PEOPLE[6 + (i % 2)].id],
    finalApprover:   PEOPLE[9].id,
    workDays:        ['sunday','monday','tuesday','wednesday','thursday'],
    workFrom:        '07:00',
    workTo:          '17:00',
    gatePass:        i % 3 !== 0,
    approvalFlow:    buildApprovalHistory(id, status),
    hierarchy:       buildHierarchy(id),
    auditHistory:    buildAudit(id, status),
    createdAt:       past(rand(200, 3500) * 24),
    createdBy:       PEOPLE[i % 3].name,
    updatedAt:       past(rand(1, 200)),
  }
})
