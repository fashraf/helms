/**
 * HELMS Mock API Handlers
 * Simulates backend responses with artificial delay.
 * Replace individual handlers with real API calls as backend is built.
 */

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms))

// ── Mock users database ───────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    id: 'usr_001',
    email: 'admin@helms.sa',
    password: 'Admin123!',
    name: 'Khalid Salman',
    role: 'admin',
    avatar: null,
    department: 'System Administration',
    phone: '+966 50 123 4567',
    lastLogin: new Date().toISOString(),
    active: true,
  },
  {
    id: 'usr_002',
    email: 'manager@helms.sa',
    password: 'Manager123!',
    name: 'Fatima Al-Zahrani',
    role: 'manager',
    avatar: null,
    department: 'Logistics Operations',
    phone: '+966 55 234 5678',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    active: true,
  },
  {
    id: 'usr_003',
    email: 'operator@helms.sa',
    password: 'Operator123!',
    name: 'Khalid Al-Mutairi',
    role: 'operator',
    avatar: null,
    department: 'Fleet Operations',
    phone: '+966 56 345 6789',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    active: true,
  },
  {
    id: 'usr_004',
    email: 'viewer@helms.sa',
    password: 'Viewer123!',
    name: 'Sara Al-Otaibi',
    role: 'viewer',
    avatar: null,
    department: 'Finance & Analytics',
    phone: '+966 59 456 7890',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    active: true,
  },
]

// ── Mock JWT generator ────────────────────────────────────────────────────────
const generateMockToken = (user) => {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub:  user.id,
    name: user.name,
    role: user.role,
    iat:  Math.floor(Date.now() / 1000),
    exp:  Math.floor(Date.now() / 1000) + 86400,
  }))
  const sig = btoa('mock-signature')
  return `${header}.${payload}.${sig}`
}

// ── Auth Handlers ─────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * @param {{ email: string, password: string, rememberMe?: boolean }} credentials
 */
export const mockLogin = async ({ email, password }) => {
  await delay(800)
  const user = MOCK_USERS.find((u) => u.email === email)
  if (!user) {
    throw new Error('No account found with that email address.')
  }
  if (user.password !== password) {
    throw new Error('Incorrect password. Please try again.')
  }
  if (!user.active) {
    throw new Error('This account has been deactivated. Contact your administrator.')
  }

  const { password: _pw, ...safeUser } = user
  const token = generateMockToken(safeUser)

  return {
    user:    safeUser,
    token,
    expiresIn: 86400,
  }
}

/**
 * GET /auth/me — verify token and return current user
 */
export const mockGetMe = async (token) => {
  await delay(300)
  if (!token) throw new Error('No token provided')
  return MOCK_USERS[0]
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const mockDashboardStats = async () => {
  await delay(400)
  return {
    activeShipments:     247,
    shipmentsChange:     +12,
    fleetOnRoute:        89,
    fleetTotal:          124,
    fleetUtilization:    72,
    maintenanceDue:      14,
    maintenanceCritical: 3,
    warehouseCapacity:   78,
    warehouseSites:      6,
    warehouseNearFull:   2,
  }
}

// ── Recent Shipments ──────────────────────────────────────────────────────────
export const mockRecentShipments = async () => {
  await delay(500)
  return [
    { id: 'SHP-00891', origin: 'Riyadh Industrial City', destination: 'Site 12 — Tabuk', status: 'in_transit',  equipment: 'CAT 390F Excavator',   driver: 'Mohammed Al-Ghamdi', updated: '2 min ago' },
    { id: 'SHP-00890', origin: 'Jeddah Port',            destination: 'Site 7 — Mecca',  status: 'delivered',  equipment: 'Liebherr LTM 1200',    driver: 'Tariq Al-Shammari',  updated: '18 min ago' },
    { id: 'SHP-00889', origin: 'Dammam Depot',           destination: 'Site 3 — Eastern', status: 'pending',   equipment: 'Komatsu D375A Dozer',   driver: 'Pending Assignment', updated: '45 min ago' },
    { id: 'SHP-00888', origin: 'Riyadh Main Yard',       destination: 'Site 9 — Medina', status: 'in_transit', equipment: 'Terex RT130 Crane',     driver: 'Faisal Al-Dosari',   updated: '1 hr ago' },
    { id: 'SHP-00887', origin: 'Khobar Logistics Hub',   destination: 'Site 2 — Jubail', status: 'on_hold',    equipment: 'Volvo EC750E Excavator', driver: 'Nasser Al-Harbi',    updated: '2 hr ago' },
    { id: 'SHP-00886', origin: 'Abha Yard',              destination: 'Site 15 — Jizan', status: 'delivered',  equipment: 'John Deere 870G Grader', driver: 'Omar Al-Qahtani',    updated: '3 hr ago' },
  ]
}

// ── Shipment Timeline Chart Data ──────────────────────────────────────────────
export const mockShipmentChartData = async () => {
  await delay(350)
  return [
    { day: 'Mon', shipments: 38, delivered: 32, inTransit: 6  },
    { day: 'Tue', shipments: 42, delivered: 38, inTransit: 4  },
    { day: 'Wed', shipments: 31, delivered: 28, inTransit: 3  },
    { day: 'Thu', shipments: 55, delivered: 48, inTransit: 7  },
    { day: 'Fri', shipments: 29, delivered: 24, inTransit: 5  },
    { day: 'Sat', shipments: 18, delivered: 16, inTransit: 2  },
    { day: 'Sun', shipments: 47, delivered: 41, inTransit: 6  },
  ]
}
