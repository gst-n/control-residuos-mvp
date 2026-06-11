export default function SuccessScreen({ tipoSeleccionado, numeroRegistro, onNuevo, onSalir, isAdmin }) {
  const nro = numeroRegistro ? String(numeroRegistro).padStart(4, '0') : null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        {nro && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Registro <span className="font-mono text-brand-700">#{nro}</span>
          </p>
        )}

        <h2 className="text-xl font-semibold text-slate-800 mb-2">Registro guardado</h2>
        <p className="text-sm text-slate-500 mb-8">
          El registro de <strong className="font-medium text-slate-700">{tipoSeleccionado?.label}</strong> fue guardado correctamente.
        </p>

        <div className="flex flex-col gap-3">
          <button onClick={onNuevo} className="btn-primary w-full">
            Registrar otro residuo
          </button>
          <button onClick={onSalir} className="btn-secondary w-full">
            {isAdmin ? '← Volver al panel' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
