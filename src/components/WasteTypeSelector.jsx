const TIPOS = [
  {
    id: 'Peligroso',
    label: 'Residuos Peligrosos',
    desc: 'Solventes, pinturas, baterías, productos químicos.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    bg:      'bg-amber-50 hover:bg-amber-100 border-amber-200 active:bg-amber-100',
    iconBg:  'bg-amber-100 text-amber-700',
  },
  {
    id: 'Patologico',
    label: 'Residuos Patológicos',
    desc: 'Material biológico, hospitalario y sanitario.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    bg:      'bg-purple-50 hover:bg-purple-100 border-purple-200 active:bg-purple-100',
    iconBg:  'bg-purple-100 text-purple-700',
  },
  {
    id: 'UVA',
    label: 'Aceites Vegetales Usados',
    desc: 'Aceites de cocina, freidoras y uso doméstico.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 2.311L18 20.25H6l-2.25-2.939a2.25 2.25 0 01.45-2.311m15.6 0L5.25 14.5" />
      </svg>
    ),
    bg:      'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 active:bg-emerald-100',
    iconBg:  'bg-emerald-100 text-emerald-700',
  },
]

export default function WasteTypeSelector({ profile, onSelect, onSignOut, onBack }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-700 truncate">{profile?.nombre}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {onBack && (
            <button onClick={onBack} className="text-xs text-brand-700 hover:text-brand-900 font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-brand-50">
              ← Panel
            </button>
          )}
          <button onClick={onSignOut} className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-7">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-1">Nuevo registro</p>
          <h2 className="text-xl font-semibold text-slate-800 leading-snug">¿Qué tipo de residuo estás fiscalizando?</h2>
        </div>

        <div className="flex flex-col gap-3">
          {TIPOS.map(tipo => (
            <button
              key={tipo.id}
              onClick={() => onSelect(tipo)}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] ${tipo.bg}`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${tipo.iconBg}`}>
                {tipo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{tipo.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{tipo.desc}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export { TIPOS }
