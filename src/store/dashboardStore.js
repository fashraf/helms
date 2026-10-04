import { create } from 'zustand'
import { generateSparkline, INITIAL_EVENTS, INITIAL_APPROVALS } from '../api/mock/liveData'

// ─── Sparkline seeds ──────────────────────────────────────────────────────────
const spark = (base, v) => generateSparkline(base, v)

const useDashboardStore = create((set, get) => ({

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  kpis: {
    totalShipments: {
      value:   1284,
      delta:   +12,
      flash:   false,
      history: spark(1250, 30),
    },
    activeVehicles: {
      value:   89,
      delta:   +3,
      flash:   false,
      history: spark(85, 8),
    },
    activeDrivers: {
      value:   156,
      delta:   -2,
      flash:   false,
      history: spark(155, 6),
    },
    delayedShipments: {
      value:   14,
      delta:   +2,
      flash:   false,
      history: spark(12, 4),
    },
    warehouseLoad: {
      value:   78,
      delta:   +1,
      flash:   false,
      history: spark(75, 5),
    },
  },

  // ─── Tick a KPI (called by real-time simulation) ──────────────────────────
  tickKPI: (key, delta) => {
    if (delta === 0) return
    set((s) => {
      const kpi = s.kpis[key]
      const next = Math.max(0, kpi.value + delta)
      return {
        kpis: {
          ...s.kpis,
          [key]: {
            value:   next,
            delta,
            flash:   true,
            history: [...kpi.history.slice(1), { v: next }],
          },
        },
      }
    })
    // Clear flash after animation
    setTimeout(() => {
      set((s) => ({
        kpis: {
          ...s.kpis,
          [key]: { ...s.kpis[key], flash: false },
        },
      }))
    }, 800)
  },

  // ─── Activity feed ────────────────────────────────────────────────────────
  activityFeed:  INITIAL_EVENTS,
  feedPaused:    false,
  setFeedPaused: (v) => set({ feedPaused: v }),

  pushEvent: (event) => {
    if (get().feedPaused) return
    set((s) => ({
      activityFeed: [
        { ...event, isNew: true },
        ...s.activityFeed.slice(0, 29),
      ],
      lastSync: Date.now(),
    }))
    // Clear isNew after animation
    setTimeout(() => {
      set((s) => ({
        activityFeed: s.activityFeed.map((e) =>
          e.id === event.id ? { ...e, isNew: false } : e
        ),
      }))
    }, 1000)
  },

  // ─── System status ────────────────────────────────────────────────────────
  systemStatus: {
    api:           { label: 'Core API',        status: 'ok',       detail: '42ms',      uptime: '99.98%' },
    gps:           { label: 'GPS Telemetry',   status: 'degraded', detail: 'Dammam ±8m', uptime: '98.21%' },
    notifications: { label: 'Notifications',   status: 'ok',       detail: '0 queued',  uptime: '100%'   },
    database:      { label: 'Data Layer',      status: 'ok',       detail: '24 conns',  uptime: '99.99%' },
    integrations:  { label: 'Integrations',    status: 'ok',       detail: 'SAP/Oracle', uptime: '99.95%' },
  },

  setServiceStatus: (key, patch) =>
    set((s) => ({
      systemStatus: {
        ...s.systemStatus,
        [key]: { ...s.systemStatus[key], ...patch },
      },
    })),

  // Derived: overall health
  overallHealth: () => {
    const services = Object.values(get().systemStatus)
    if (services.some((s) => s.status === 'down'))     return 'critical'
    if (services.some((s) => s.status === 'degraded')) return 'degraded'
    return 'operational'
  },

  // ─── Active alerts ────────────────────────────────────────────────────────
  alerts: [
    { id: 1, severity: 'critical', message: 'Unit HX-2291 maintenance overdue 3 days',   source: 'Fleet',     time: new Date(Date.now() - 3600000).toISOString()  },
    { id: 2, severity: 'warning',  message: 'GPS accuracy degraded — Dammam corridor',   source: 'Telemetry', time: new Date(Date.now() - 7200000).toISOString()  },
    { id: 3, severity: 'warning',  message: 'Warehouse Site-3 at 91% capacity',          source: 'Warehouse', time: new Date(Date.now() - 10800000).toISOString() },
    { id: 4, severity: 'info',     message: 'SHP-00883 customs hold — Kuwait border',    source: 'Intl Ops',  time: new Date(Date.now() - 14400000).toISOString() },
  ],

  dismissAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  // ─── Pending approvals ────────────────────────────────────────────────────
  pendingApprovals: INITIAL_APPROVALS,

  approveItem: (id) =>
    set((s) => ({ pendingApprovals: s.pendingApprovals.filter((a) => a.id !== id) })),

  rejectItem: (id) =>
    set((s) => ({ pendingApprovals: s.pendingApprovals.filter((a) => a.id !== id) })),

  // ─── Timestamps ───────────────────────────────────────────────────────────
  lastSync:  Date.now(),
  startTime: Date.now(),
}))

export default useDashboardStore
