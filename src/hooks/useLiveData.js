import { useEffect } from 'react'
import useDashboardStore from '../store/dashboardStore'
import { useToast } from './useToast'
import { generateEvent, getRandomKPIUpdate } from '../api/mock/liveData'

const rand = (min, max) => min + Math.random() * (max - min)

/**
 * useLiveData — attaches real-time simulation to the dashboard store.
 * Starts timers when mounted, cleans up on unmount.
 * Call once from the Dashboard page component.
 */
export function useLiveData() {
  const { pushEvent, tickKPI, setServiceStatus } = useDashboardStore()
  const { toast } = useToast()

  useEffect(() => {
    const timers = []

    // ── Activity event loop (every 6–11s) ──────────────────────────────────
    const scheduleActivityEvent = () => {
      const delay = rand(6000, 11000)
      const t = setTimeout(() => {
        const event = generateEvent()
        pushEvent(event)

        if (event.showToast) {
          toast[event.toastType]?.(
            event.toastTitle,
            event.message,
          )
        }

        scheduleActivityEvent()
      }, delay)
      timers.push(t)
    }

    // ── KPI tick loop (every 5–9s) ─────────────────────────────────────────
    const scheduleKPITick = () => {
      const delay = rand(5000, 9000)
      const t = setTimeout(() => {
        const { key, delta } = getRandomKPIUpdate()
        tickKPI(key, delta)
        scheduleKPITick()
      }, delay)
      timers.push(t)
    }

    // ── System status flicker (every 30–60s) ──────────────────────────────
    const scheduleStatusFlicker = () => {
      const delay = rand(30000, 60000)
      const t = setTimeout(() => {
        // Occasionally degrade/restore GPS
        const roll = Math.random()
        if (roll < 0.3) {
          setServiceStatus('gps', { status: 'degraded', detail: 'Signal noise ±12m' })
          toast.warning('GPS Degraded', 'Telemetry accuracy reduced in northern corridor.')
        } else if (roll < 0.5) {
          setServiceStatus('gps', { status: 'ok', detail: '±2m' })
        }
        // Rare: API latency spike
        if (Math.random() < 0.15) {
          setServiceStatus('api', { detail: `${Math.floor(rand(80, 220))}ms` })
          setTimeout(() => setServiceStatus('api', { detail: `${Math.floor(rand(30, 55))}ms` }), 8000)
        }
        scheduleStatusFlicker()
      }, delay)
      timers.push(t)
    }

    // ── Critical alert toast (every 45–90s) ───────────────────────────────
    const scheduleCriticalAlert = () => {
      const delay = rand(45000, 90000)
      const criticals = [
        () => toast.error('Fleet Alert', 'Unit HX-1103 — GPS signal lost near Dammam Highway.'),
        () => toast.warning('Capacity Warning', 'Warehouse Site-4 now at 94% capacity.'),
        () => toast.error('Driver Safety', 'Driver fatigue alert — DRV-044 exceeded 8h drive.'),
        () => toast.warning('Maintenance Critical', 'Unit TR-0221 — hydraulic pressure below threshold.'),
      ]
      const t = setTimeout(() => {
        const fn = criticals[Math.floor(Math.random() * criticals.length)]
        fn()
        scheduleCriticalAlert()
      }, delay)
      timers.push(t)
    }

    // Start all loops with staggered initial delays
    scheduleActivityEvent()
    setTimeout(scheduleKPITick, 2000)
    setTimeout(scheduleStatusFlicker, 15000)
    setTimeout(scheduleCriticalAlert, 20000)

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

export default useLiveData
