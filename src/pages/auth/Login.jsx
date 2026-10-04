import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, Zap, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import useAuth        from '../../hooks/useAuth'
import useAuthStore   from '../../store/authStore'
import useUIStore     from '../../store/uiStore'
import useRBACv2Store from '../../store/rbacV2Store'
import { DEMO_CREDENTIALS } from '../../utils/constants'

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth()
  const { isAuthenticated, user } = useAuthStore()
  const { roles }   = useRBACv2Store()
  const setTheme    = useUIStore(s => s.setTheme)

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors,     setErrors]     = useState({})

  // Force light theme styling on the login page (independent of saved pref)
  useEffect(() => {
    const html = document.documentElement
    const prev = html.className
    html.classList.remove('dark')
    html.classList.add('light')
    return () => { html.className = prev }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('helms-remember-email')
    if (saved) { setEmail(saved); setRememberMe(true) }
  }, [])
  useEffect(() => { if (error) clearError() }, [email, password])
  useEffect(() => { if (isAuthenticated) setTheme('light') }, [isAuthenticated, setTheme])

  if (isAuthenticated) {
    const matchedRole = roles.find(r =>
      r.name?.toLowerCase().includes((user?.role ?? '').toLowerCase()) && r.status === 'active'
    )
    return <Navigate to={matchedRole?.defaultPage || '/dashboard'} replace />
  }

  const validate = () => {
    const errs = {}
    if (!email.trim())                     errs.email    = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email))  errs.email    = 'Enter a valid email address'
    if (!password)                          errs.password = 'Password is required'
    else if (password.length < 6)           errs.password = 'Password must be at least 6 characters'
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
    <div className="h-screen w-screen flex relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F8FAFC 100%)' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          Decorative background — thin slate lines with localised light flow
          (light theme version)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft colored gradient washes */}
        <div className="absolute -top-1/3 -left-1/3 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent 60%)' }} />
        <div className="absolute -bottom-1/3 -right-1/3 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06), transparent 60%)' }} />

        {/* Horizontal lines */}
        <div className="login-line-light login-line-light-h" style={{ top: '12%', animationDuration: '11s' }} />
        <div className="login-line-light login-line-light-h" style={{ top: '32%', animationDuration: '14s', animationDelay: '-4s' }} />
        <div className="login-line-light login-line-light-h" style={{ top: '58%', animationDuration: '17s', animationDelay: '-9s' }} />
        <div className="login-line-light login-line-light-h" style={{ top: '79%', animationDuration: '13s', animationDelay: '-2s' }} />
        <div className="login-line-light login-line-light-h" style={{ top: '92%', animationDuration: '15s', animationDelay: '-6s' }} />

        {/* Vertical lines */}
        <div className="login-line-light login-line-light-v" style={{ left: '8%',  animationDuration: '13s', animationDelay: '-1s' }} />
        <div className="login-line-light login-line-light-v" style={{ left: '28%', animationDuration: '17s', animationDelay: '-8s' }} />
        <div className="login-line-light login-line-light-v" style={{ left: '52%', animationDuration: '15s', animationDelay: '-3s' }} />
        <div className="login-line-light login-line-light-v" style={{ left: '74%', animationDuration: '19s', animationDelay: '-11s' }} />
        <div className="login-line-light login-line-light-v" style={{ left: '93%', animationDuration: '12s', animationDelay: '-6s' }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT — Branding panel (light theme)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[55%] relative z-10">
        <div className="relative flex flex-col h-full px-14 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-slate-900 text-base font-light tracking-[0.3em] leading-none">HELMS</div>
              <div className="text-slate-500 text-[10px] font-mono mt-1 tracking-widest uppercase">v1.0.0 · Hulul</div>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-auto">
            <div className="inline-flex items-center gap-2 mb-7">
              <span className="w-6 h-px bg-amber-500/60" />
              <span className="text-[10px] text-amber-700 font-light uppercase tracking-[0.4em]">Enterprise · KSA</span>
            </div>
            <h1 className="text-[56px] font-extralight text-slate-900 leading-[1.05] tracking-tight mb-6">
              Heavy Equipment<br />
              <span className="font-light" style={{
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Logistics
              </span><br />
              <span className="text-slate-600 font-extralight">Redefined.</span>
            </h1>
            <p className="text-slate-500 text-sm font-light leading-relaxed max-w-md tracking-wide">
              Unified command platform for tracking, managing, and optimising
              heavy equipment across all logistics operations in the Kingdom.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-14 flex items-stretch divide-x divide-slate-200">
            {[
              { v: '1,200+', l: 'Fleet Units' },
              { v: '24/7',   l: 'Operations'  },
              { v: '99.8%',  l: 'Uptime SLA'  },
            ].map((s) => (
              <div key={s.l} className="flex-1 px-4 first:pl-0">
                <div className="text-2xl font-extralight font-mono text-slate-900 tracking-tight">{s.v}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-light uppercase tracking-[0.25em]">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Footer rail */}
          <div className="mt-auto pt-8 flex items-center justify-between text-[10px] font-light text-slate-500 tracking-wider">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SOC 2 · ZATCA-Compliant · TLS 1.3
            </span>
            <span className="font-mono">© {new Date().getFullYear()} HELMS PLATFORM</span>
          </div>
        </div>

        {/* Panel separator hairline */}
        <div className="absolute top-0 bottom-0 right-0 w-px overflow-hidden">
          <div className="login-line-light login-line-light-v-divider" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT — Form (clean white card, light theme)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">

        <div className="w-full max-w-[400px] relative">
          {/* Soft halo behind card */}
          <div className="absolute -inset-8 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.10), rgba(245,158,11,0.06) 60%, transparent 80%)', filter: 'blur(24px)' }} />

          <div className="relative bg-white rounded-2xl p-7 login-card-light"
            style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.10), 0 4px 16px rgba(15,23,42,0.06)' }}>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-slate-900 text-sm font-light tracking-[0.25em]">HELMS</div>
            </div>

            {/* Heading */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 mb-3">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                </span>
                <span className="text-[9px] text-emerald-700 font-medium uppercase tracking-[0.3em]">Secure Channel</span>
              </div>
              <h2 className="text-2xl font-light text-slate-900 tracking-tight leading-tight">Welcome back</h2>
              <p className="text-slate-500 text-[12.5px] font-light mt-1 tracking-wide">Sign in to your HELMS account to continue.</p>
            </div>

            {/* API error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg px-3 py-2 mb-4 text-[12.5px] font-light"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {/* Email */}
              <FormField label="Email Address" required error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@helms.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-light rounded-lg border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    style={{ borderColor: errors.email ? '#FECACA' : '#E2E8F0' }}
                  />
                </div>
              </FormField>

              {/* Password */}
              <FormField label="Password" required error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm font-light rounded-lg border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    style={{ borderColor: errors.password ? '#FECACA' : '#E2E8F0' }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </FormField>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(v => !v)}
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all duration-150 ${
                      rememberMe
                        ? 'bg-amber-500 border-amber-500'
                        : 'border-slate-300 bg-white group-hover:border-amber-400'
                    }`}>
                    {rememberMe && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M1 6l3.5 3.5L11 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12.5px] text-slate-600 font-light group-hover:text-slate-900 select-none tracking-wide">Remember me</span>
                </label>
                <button type="button" className="text-[12.5px] text-amber-600 font-light hover:text-amber-700 transition-colors tracking-wide">
                  Forgot password?
                </button>
              </div>

              {/* Sign In button */}
              <button type="submit" disabled={isLoading}
                className="w-full mt-3 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                style={{
                  background: isLoading ? '#94A3B8' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: isLoading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                }}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2 tracking-wider font-light">
                    <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 tracking-wider font-light">
                    Sign In <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>
            </form>

            {/* Hairline divider with traveling light */}
            <div className="relative my-5 h-px overflow-hidden">
              <div className="login-line-light login-line-light-h-divider" />
            </div>

            {/* Demo accounts */}
            <div>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.3em] mb-2.5">Demo Accounts · Tap to Fill</p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => fillDemo(cred)}
                    className="text-left px-2.5 py-1.5 rounded-md transition-all duration-150 group"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0' }}>
                    <div className="text-[11px] font-medium text-slate-700 group-hover:text-blue-700 capitalize transition-colors tracking-wide">
                      {cred.label}
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate mt-px font-mono">{cred.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact form-field wrapper with thin label + error
function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-700 mb-1.5 tracking-wide">
        {label}
        {required && <span className="text-amber-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-600 font-light flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  )
}
