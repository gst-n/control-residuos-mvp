import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { exportCSV, exportExcel, exportPDF } from '../utils/exportUtils'

const TIPO_BADGE = {
  Peligroso:  'bg-amber-100 text-amber-700 border border-amber-200',
  Patologico: 'bg-purple-100 text-purple-700 border border-purple-200',
  UVA:        'bg-emerald-100 text-emerald-700 border border-emerald-200',
}
const TIPO_LABEL = { Peligroso: 'Peligroso', Patologico: 'Patológico', UVA: 'UVA' }
const PAGE_SIZE = 15

function StatCard({ label, value, color }) {
  return (
    <div className={`card flex flex-col gap-1 border-l-4 py-4 ${color}`}>
      <span className="text-2xl font-bold text-slate-800">{value ?? '—'}</span>
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide leading-tight">{label}</span>
    </div>
  )
}

function RecordCard({ r }) {
  return (
    <div className="card flex flex-col gap-2 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono font-bold text-brand-700 mb-0.5">#{String(r.numero_registro ?? '?').padStart(4,'0')}</p>
          <p className="font-semibold text-slate-800 truncate">{r.nombre_empresa}</p>
          <p className="text-xs text-slate-400 truncate">{r.direccion_empresa}</p>
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${TIPO_BADGE[r.tipo_residuo] ?? 'bg-slate-100 text-slate-600'}`}>
          {TIPO_LABEL[r.tipo_residuo] ?? r.tipo_residuo}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div><span className="text-slate-400">Inspector: </span><span className="text-slate-700">{r.inspectores?.nombre ?? '—'}</span></div>
        <div><span className="text-slate-400">Retiro: </span><span className="text-slate-700">{r.fecha_retiro ?? '—'}</span></div>
        <div><span className="text-slate-400">Volumen: </span><span className="text-slate-700 font-mono">{r.volumen_retirado != null ? `${r.volumen_retirado} ${r.unidad_volumen}` : '—'}</span></div>
        <div><span className="text-slate-400">Manifiesto: </span><span className="text-slate-700 font-mono text-xs">{r.numero_manifiesto_remito ?? '—'}</span></div>
        {r.corriente_residuo && <div className="col-span-2"><span className="text-slate-400">Corriente: </span><span className="text-slate-700">{r.corriente_residuo}</span></div>}
      </div>
      {r.observaciones && <p className="text-xs text-slate-500 line-clamp-2 border-t border-slate-50 pt-2">{r.observaciones}</p>}
      <p className="text-xs text-slate-300">{new Date(r.fecha_hora_registro).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}</p>
    </div>
  )
}

// ─── Tab Registros ─────────────────────────────────────────────────────────
function TabRegistros({ stats }) {
  const [registros, setRegistros]     = useState([])
  const [inspectores, setInspectores] = useState([])
  const [loading, setLoading]         = useState(true)
  const [exporting, setExporting]     = useState(false)
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ inspector:'', tipo:'', desde:'', hasta:'', busqueda:'' })

  useEffect(() => {
    supabase.from('inspectores').select('id, nombre').order('nombre')
      .then(({ data }) => setInspectores(data || []))
  }, [])

  const buildQuery = useCallback((forExport = false) => {
    let q = supabase
      .from('registros_fiscalizacion')
      .select('*, inspectores(nombre, email)', { count: 'exact' })
      .order('fecha_hora_registro', { ascending: false })
    if (filters.inspector) q = q.eq('inspector_id', filters.inspector)
    if (filters.tipo)       q = q.eq('tipo_residuo', filters.tipo)
    if (filters.desde)      q = q.gte('fecha_retiro', filters.desde)
    if (filters.hasta)      q = q.lte('fecha_retiro', filters.hasta)
    if (filters.busqueda)   q = q.ilike('nombre_empresa', `%${filters.busqueda}%`)
    if (!forExport)         q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    return q
  }, [filters, page])

  useEffect(() => {
    setLoading(true)
    buildQuery(false).then(({ data, count }) => {
      setRegistros(data || [])
      setTotal(count || 0)
      setLoading(false)
    })
  }, [buildQuery])

  useEffect(() => { setPage(0) }, [filters])

  async function handleExport(fn) {
    setExporting(true)
    const { data } = await buildQuery(true)
    fn(data || [])
    setExporting(false)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"       value={stats?.total}      color="border-slate-300" />
        <StatCard label="Peligrosos"  value={stats?.peligroso}  color="border-amber-400" />
        <StatCard label="Patológicos" value={stats?.patologico} color="border-purple-400" />
        <StatCard label="UVA"         value={stats?.uva}        color="border-emerald-400" />
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex items-center gap-2">
        <input value={filters.busqueda}
          onChange={e => setFilters(p => ({ ...p, busqueda: e.target.value }))}
          className="input-field flex-1" placeholder="Buscar empresa…" />
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            hasFilters || showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span className="hidden sm:inline">Filtros</span>
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
        </button>
      </div>

      {showFilters && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Filtros</span>
            {hasFilters && <button onClick={() => setFilters({ inspector:'', tipo:'', desde:'', hasta:'', busqueda:'' })} className="text-xs text-brand-700 font-medium">Limpiar</button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={filters.inspector} onChange={e => setFilters(p => ({ ...p, inspector: e.target.value }))} className="input-field col-span-2 sm:col-span-1">
              <option value="">Todos los inspectores</option>
              {inspectores.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
            <select value={filters.tipo} onChange={e => setFilters(p => ({ ...p, tipo: e.target.value }))} className="input-field">
              <option value="">Todos los tipos</option>
              <option value="Peligroso">Peligroso</option>
              <option value="Patologico">Patológico</option>
              <option value="UVA">UVA</option>
            </select>
            <div><label className="label">Desde</label><input type="date" value={filters.desde} onChange={e => setFilters(p => ({ ...p, desde: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Hasta</label><input type="date" value={filters.hasta} onChange={e => setFilters(p => ({ ...p, hasta: e.target.value }))} className="input-field" /></div>
          </div>
        </div>
      )}

      {/* Barra exportación */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          {loading ? 'Cargando…' : <><span className="font-semibold text-slate-800">{total}</span> {total === 1 ? 'registro' : 'registros'}</>}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Exportar:</span>
          {[
            { label:'CSV',   fn: exportCSV,   cls:'border-slate-200 text-slate-600 hover:bg-slate-50' },
            { label:'Excel', fn: exportExcel, cls:'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
            { label:'PDF',   fn: exportPDF,   cls:'border-red-200 text-red-600 hover:bg-red-50' },
          ].map(({ label, fn, cls }) => (
            <button key={label} disabled={exporting || !registros.length}
              onClick={() => handleExport(fn)}
              className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? <p className="text-center py-10 text-slate-400 text-sm">Cargando…</p>
          : registros.length === 0 ? <p className="text-center py-10 text-slate-400 text-sm">Sin registros.</p>
          : registros.map(r => <RecordCard key={r.id} r={r} />)}
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#Reg','Inspector','Tipo','Empresa','Corriente','Volumen','Manifiesto','Fecha retiro','Registrado'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-14 text-slate-400 text-sm">Cargando…</td></tr>
              ) : registros.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-14 text-slate-400 text-sm">Sin registros.</td></tr>
              ) : registros.map((r, i) => (
                <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700 whitespace-nowrap">#{String(r.numero_registro ?? '?').padStart(4,'0')}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{r.inspectores?.nombre ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${TIPO_BADGE[r.tipo_residuo] ?? 'bg-slate-100 text-slate-600'}`}>{TIPO_LABEL[r.tipo_residuo] ?? r.tipo_residuo}</span></td>
                  <td className="px-4 py-3 max-w-[160px]"><p className="font-medium text-slate-700 truncate">{r.nombre_empresa}</p>{r.rubro_empresa && <p className="text-xs text-slate-400 truncate">{r.rubro_empresa}</p>}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[130px]"><p className="truncate">{r.corriente_residuo ?? '—'}</p></td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{r.volumen_retirado != null ? `${r.volumen_retirado} ${r.unidad_volumen}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{r.numero_manifiesto_remito || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{r.fecha_retiro || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{new Date(r.fecha_hora_registro).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pb-4">
          <p className="text-xs text-slate-400">Página {page + 1}/{Math.ceil(total / PAGE_SIZE)}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-2 px-3 disabled:opacity-40">← Anterior</button>
            <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-2 px-3 disabled:opacity-40">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Usuarios ──────────────────────────────────────────────────────────
function TabUsuarios({ currentAdminId }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null) // id del usuario que se está actualizando

  async function fetchUsuarios() {
    const { data } = await supabase.from('inspectores').select('*').order('nombre')
    setUsuarios(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  async function toggleRol(user) {
    if (user.id === currentAdminId) return // no puede quitarse admin a sí mismo
    const nuevoRol = user.rol === 'admin' ? 'inspector' : 'admin'
    setUpdating(user.id)
    const { error } = await supabase
      .from('inspectores')
      .update({ rol: nuevoRol })
      .eq('id', user.id)
    if (!error) {
      setUsuarios(prev => prev.map(u => u.id === user.id ? { ...u, rol: nuevoRol } : u))
    }
    setUpdating(null)
  }

  if (loading) return <p className="text-center py-12 text-slate-400 text-sm">Cargando usuarios…</p>

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400">Hacé click en el rol para cambiarlo. No podés quitarte admin a vos mismo.</p>
      {usuarios.map(u => (
        <div key={u.id} className="card flex items-center justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="font-medium text-slate-800 truncate">{u.nombre}</p>
            <p className="text-xs text-slate-400 truncate">{u.email}</p>
          </div>
          <button
            onClick={() => toggleRol(u)}
            disabled={updating === u.id || u.id === currentAdminId}
            className={`flex-shrink-0 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 disabled:cursor-not-allowed ${
              u.rol === 'admin'
                ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            } ${u.id === currentAdminId ? 'opacity-50' : ''}`}
          >
            {updating === u.id
              ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <span className={`w-1.5 h-1.5 rounded-full ${u.rol === 'admin' ? 'bg-brand-600' : 'bg-slate-400'}`} />
            }
            {u.rol === 'admin' ? 'Admin' : 'Inspector'}
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Panel principal ───────────────────────────────────────────────────────
export default function AdminPanel({ profile, onSignOut, onNuevoRegistro }) {
  const [tab, setTab]   = useState('registros')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    supabase.from('registros_fiscalizacion').select('tipo_residuo').then(({ data }) => {
      if (!data) return
      setStats({
        total:      data.length,
        peligroso:  data.filter(r => r.tipo_residuo === 'Peligroso').length,
        patologico: data.filter(r => r.tipo_residuo === 'Patologico').length,
        uva:        data.filter(r => r.tipo_residuo === 'UVA').length,
      })
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-slate-800">Panel Admin</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">Admin</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{profile?.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onNuevoRegistro} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Nuevo</span>
            </button>
            <button onClick={onSignOut} className="btn-secondary text-xs py-2 px-3">Salir</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {[['registros','Registros'],['usuarios','Usuarios']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`text-sm font-medium px-4 py-2.5 border-b-2 transition-colors ${
                tab === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        {tab === 'registros'
          ? <TabRegistros stats={stats} />
          : <TabUsuarios currentAdminId={profile?.id} />
        }
      </main>
    </div>
  )
}
