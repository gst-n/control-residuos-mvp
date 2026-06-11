import { useState } from 'react'

const ERRORS = {
  'Invalid login credentials':                   'Email o contraseña incorrectos.',
  'Email not confirmed':                         'Confirmá tu email antes de ingresar.',
  'User already registered':                     'Ya existe una cuenta con ese email. Iniciá sesión.',
  'Password should be at least 6 characters':    'La contraseña debe tener al menos 6 caracteres.',
}

function friendlyError(msg = '') {
  for (const [key, val] of Object.entries(ERRORS)) {
    if (msg.includes(key)) return val
  }
  return msg || 'Ocurrió un error. Intentá de nuevo.'
}

export default function LoginScreen({ onSignIn, onSignUp, onGoogle }) {
  const [mode, setMode]         = useState('login')
  const [nombre, setNombre]     = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)

  function switchMode(m) {
    setMode(m); setError(null); setSuccess(null)
    setNombre(''); setEmail(''); setPassword(''); setConfirm('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setSuccess(null)

    if (mode === 'register') {
      if (!nombre.trim())        { setError('El nombre es obligatorio.'); return }
      if (password !== confirm)  { setError('Las contraseñas no coinciden.'); return }
      if (password.length < 6)   { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await onSignIn(email.trim(), password)
      } else {
        await onSignUp(email.trim(), password, nombre.trim())
        setSuccess('Cuenta creada. Revisá tu email para confirmar y luego iniciá sesión.')
        switchMode('login')
      }
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoad(true)
    try {
      await onGoogle()
    } catch (err) {
      setError(friendlyError(err.message))
      setGoogleLoad(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-700 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Fiscalización de Residuos</h1>
          <p className="mt-1 text-sm text-slate-500">Sistema de registro para inspectores</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-5">
          {[['login','Iniciar sesión'],['register','Crear cuenta']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-150 ${
                mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="card flex flex-col gap-4">

          {/* Mensajes */}
          {success && (
            <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoad || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-sm font-medium text-slate-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoad ? (
              <svg className="w-4 h-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">o con email</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Formulario email */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <div>
                <label className="label">Nombre completo</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="input-field" placeholder="Ej: María González"
                  autoComplete="name" required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="inspector@organismo.gob.ar"
                autoComplete="email" required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="label">Confirmar contraseña</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="input-field" placeholder="Repetí la contraseña"
                  autoComplete="new-password" required />
              </div>
            )}
            <button type="submit" disabled={loading || googleLoad} className="btn-primary w-full mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {mode === 'login' ? 'Ingresando…' : 'Creando cuenta…'}
                </span>
              ) : (
                mode === 'login' ? 'Ingresar' : 'Crear cuenta'
              )}
            </button>
          </form>

        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Solo para uso interno del equipo de inspectores.
        </p>
      </div>
    </div>
  )
}
