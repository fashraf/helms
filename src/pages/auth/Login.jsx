import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, Zap, Package, Truck, Globe, AlertCircle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useAuthStore from '../../store/authStore'
import useRBACv2Store from '../../store/rbacV2Store'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { DEMO_CREDENTIALS } from '../../utils/constants'

// ── Feature highlights ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Package, label: 'Shipment Tracking',   desc: 'Real-time tracking across all logistics channels' },
  { icon: Truck,   label: 'Fleet Intelligence',   desc: 'Live telemetry and predictive maintenance' },
  { icon: Globe,   label: 'Global Operations',    desc: 'Domestic & international logistics management' },
]

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth()
  const { isAuthenticated, user } = useAuthStore()
  const { roles } = useRBACv2Store()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors,     setErrors]     = useState({})

  // Pre-fill remembered email
  useEffect(() => {
    const saved = localStorage.getItem('helms-remember-email')
    if (saved) { setEmail(saved); setRememberMe(true) }
  }, [])

  // Clear API error when user types
  useEffect(() => { if (error) clearError() }, [email, password])

  if (isAuthenticated) {
    // Resolve the user's role and look up its defaultPage (set in Role Master Canvas)
    const userRoleStr = user?.role ?? ''
    const matchedRole = roles.find(r =>
      r.name?.toLowerCase().includes(userRoleStr.toLowerCase()) && r.status === 'active'
    )
    const landing = matchedRole?.defaultPage || '/dashboard'
    return <Navigate to={landing} replace />
  }

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!email.trim())           errs.email    = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address'
    if (!password)               errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setErrors({})
    await login({ email: email.trim().toLowerCase(), password, rememberMe })
  }

  const fillDemo = (cred) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setErrors({})
    clearError()
  }

  return (
    <div className="min-h-screen flex bg-helm-950 helm-grid-bg">

      {/* ── LEFT: Branding panel ───────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[55%] relative bg-gradient-to-br from-helm-900 via-helm-850 to-helm-800 border-r border-helm-700 overflow-hidden">

        {/* Decorative amber gradient blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-amber-glow">
              <Zap className="w-5 h-5 text-helm-900" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">HELMS</div>
              <div className="text-slate-500 text-xs font-medium">v1.0.0</div>
            </div>
          </div>

          {/* Main headline */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
              Heavy Equipment<br />
              <span className="text-gradient-amber">Logistics</span><br />
              Redefined.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              Unified command platform for tracking, managing, and optimizing
              heavy equipment across all logistics operations in the Kingdom.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { value: '1,200+', label: 'Fleet Units' },
              { value: '24/7',   label: 'Operations' },
              { value: '99.8%',  label: 'Uptime SLA' },
            ].map((s) => (
              <div key={s.label} className="bg-helm-800/60 border border-helm-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-amber-400 font-mono">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 text-xs text-slate-600">
            © {new Date().getFullYear()} HELMS Platform. Enterprise Edition.
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-amber-glow">
            <Zap className="w-5 h-5 text-helm-900" strokeWidth={2.5} />
          </div>
          <div className="text-white font-bold text-lg">HELMS</div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-[400px]">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your HELMS account to continue.</p>
          </div>

          {/* API error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@helms.sa"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              autoComplete="current-password"
            />

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center transition-all duration-150
                  ${rememberMe
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-helm-500 bg-helm-750 group-hover:border-amber-500/50'
                  }
                `}
                  onClick={() => setRememberMe((v) => !v)}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-helm-900" fill="none" viewBox="0 0 12 12">
                      <path d="M1 6l3.5 3.5L11 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-300 select-none">
                  Remember me
                </span>
              </label>
              <button type="button" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="md"
              loading={isLoading}
              className="w-full mt-1"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-helm-700">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillDemo(cred)}
                  className="text-left px-3 py-2.5 bg-helm-800 hover:bg-helm-750 border border-helm-600 hover:border-amber-500/40 rounded-lg transition-all duration-150 group"
                >
                  <div className="text-xs font-semibold text-slate-300 group-hover:text-amber-400 capitalize transition-colors">
                    {cred.label}
                  </div>
                  <div className="text-[12.5px] text-slate-600 truncate mt-0.5">{cred.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
