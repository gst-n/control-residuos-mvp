import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginScreen       from './components/LoginScreen'
import WasteTypeSelector from './components/WasteTypeSelector'
import InspectionForm    from './components/InspectionForm'
import SuccessScreen     from './components/SuccessScreen'
import AdminPanel        from './components/AdminPanel'

const S = { ADMIN:'admin', SELECT:'select', FORM:'form', SUCCESS:'success' }

export default function App() {
  const { session, profile, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth()
  const [screen, setScreen]           = useState(null)
  const [tipoSeleccionado, setTipo]   = useState(null)
  const [numeroRegistro, setNumeroReg] = useState(null)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <svg className="w-8 h-8 text-brand-600 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  )

  if (!session || !profile) {
    return <LoginScreen onSignIn={signIn} onSignUp={signUp} onGoogle={signInWithGoogle} />
  }

  const isAdmin = profile.rol === 'admin'
  const cur     = screen ?? (isAdmin ? S.ADMIN : S.SELECT)

  if (cur === S.ADMIN) return (
    <AdminPanel profile={profile} onSignOut={signOut}
      onNuevoRegistro={() => setScreen(S.SELECT)} />
  )

  switch (cur) {
    case S.SELECT: return (
      <WasteTypeSelector profile={profile}
        onSelect={tipo => { setTipo(tipo); setScreen(S.FORM) }}
        onSignOut={signOut}
        onBack={isAdmin ? () => setScreen(S.ADMIN) : null} />
    )
    case S.FORM: return (
      <InspectionForm profile={profile} tipoSeleccionado={tipoSeleccionado}
        onBack={() => setScreen(S.SELECT)}
        onSuccess={nro => { setNumeroReg(nro); setScreen(S.SUCCESS) }} />
    )
    case S.SUCCESS: return (
      <SuccessScreen
        tipoSeleccionado={tipoSeleccionado}
        numeroRegistro={numeroRegistro}
        onNuevo={() => { setTipo(null); setNumeroReg(null); setScreen(S.SELECT) }}
        onSalir={isAdmin ? () => setScreen(S.ADMIN) : signOut}
        isAdmin={isAdmin} />
    )
    default: return null
  }
}
