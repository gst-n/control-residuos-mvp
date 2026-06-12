import { useState, useEffect, useCallback, useTransition } from 'react'
import { supabase } from '../lib/supabaseClient'
import { exportCSV, exportExcel, exportPDF } from '../utils/exportUtils'

const CHECKLIST_LABELS = [
  { key: 'sector_delimitado',          label: 'Sector delimitado y de acceso restringido' },
  { key: 'piso_impermeabilizado',      label: 'Piso impermeabilizado o con pintura epoxi' },
  { key: 'bandejas_antiderrame',       label: 'Bandejas antiderrame o de contención' },
  { key: 'extintor_vigente',           label: 'Extintor vigente' },
  { key: 'material_absorbente',        label: 'Material absorbente disponible para contingencias' },
  { key: 'carteleria_identificatoria', label: 'Cartelería identificatoria clara' },
  { key: 'caracterizacion_residuos',   label: 'Caracterización de los residuos peligrosos según su corriente' },
  { key: 'manifiestos_certificados',   label: 'Manifiestos de retiro y certificados de disposición final' },
]

const TIPO_BADGE = {
  Peligroso:  'bg-amber-100 text-amber-700 border border-amber-200',
  Patologico: 'bg-purple-100 text-purple-700 border border-purple-200',
  UVA:        'bg-emerald-100 text-emerald-700 border border-emerald-200',
}
const TIPO_LABEL = { Peligroso: 'Peligroso', Patologico: 'Patológico', UVA: 'UVA' }
const PAGE_SIZE = 15

function Field({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  )
}

function CheckItem({ label, checked }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
        checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'
      }`}>
        {checked
          ? <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          : <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        }
      </span>
      <span className={`text-sm leading-snug ${checked ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}

function RecordDetailModal({ record: r, onClose }) {
  const regNum = String(r.numero_registro ?? '?').padStart(4, '0')
  const filename = `registro_${regNum}`
  const checkedCount = CHECKLIST_LABELS.filter(i => r[i.key]).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className={`h-1 w-full flex-shrink-0 ${
          r.tipo_residuo === 'Peligroso' ? 'bg-amber-500' :
          r.tipo_residuo === 'Patologico' ? 'bg-purple-500' : 'bg-emerald-500'
        }`} />
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-xs font-mono font-bold text-brand-700">#{regNum}</p>
            <p className="font-semibold text-slate-800 text-base leading-tight">{r.nombre_empresa}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_BADGE[r.tipo_residuo] ?? 'bg-slate-100 text-slate-600'}`}>
                {TIPO_LABEL[r.tipo_residuo] ?? r.tipo_residuo}
              </span>
              {r.sector_acopio_apto != null && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  r.sector_acopio_apto
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  Sector {r.sector_acopio_apto ? 'Apto' : 'No apto'}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-6">

          <Section title="Datos del inspector">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Inspector" value={r.inspectores?.nombre} />
              <Field label="Email" value={r.inspectores?.email} />
              <Field label="Fecha de registro" value={new Date(r.fecha_hora_registro).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })} />
            </div>
          </Section>

          <Section title="Datos de la empresa">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" value={r.nombre_empresa} />
              <Field label="Rubro" value={r.rubro_empresa} />
              <div className="col-span-2"><Field label="Dirección" value={r.direccion_empresa} /></div>
            </div>
          </Section>

          {r.corriente_residuo && (
            <Section title="Corriente de residuo">
              <Field label="Corriente clasificada" value={r.corriente_residuo} />
            </Section>
          )}

          <Section title="Datos del retiro">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de retiro" value={r.fecha_retiro} />
              <Field label="Volumen retirado" value={r.volumen_retirado != null ? `${r.volumen_retirado} ${r.unidad_volumen}` : null} />
              <Field label="Tipo de documento" value={r.tipo_documento} />
              <Field label={`N° ${r.tipo_documento ?? 'Documento'}`} value={r.numero_manifiesto_remito} />
              {r.tipo_documento === 'Manifiesto' && <>
                <Field label="Operador" value={r.operador} />
                <Field label="Transportista" value={r.transportista} />
                <div className="col-span-2"><Field label="N° Certificado de disposición final" value={r.numero_certificados_disposicion} /></div>
              </>}
            </div>
          </Section>

          <Section title={`Estado del sector de acopio — Disp. 185/12 (${checkedCount}/8)`}>
            <div className="flex flex-col gap-2.5">
              {CHECKLIST_LABELS.map(item => (
                <CheckItem key={item.key} label={item.label} checked={!!r[item.key]} />
              ))}
            </div>
          </Section>

          {r.observaciones && (
            <Section title="Observaciones">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.observaciones}</p>
            </Section>
          )}
        </div>

        {/* Footer — exportar */}
        <div className="flex-shrink-0 border-t border-slate-100 px-5 py-4 flex items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Exportar:</span>
          {[
            { label: 'CSV',   fn: () => exportCSV([r], filename),   cls: 'border-slate-200 text-slate-600 hover:bg-slate-50' },
            { label: 'Excel', fn: () => exportExcel([r], filename), cls: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
            { label: 'PDF',   fn: () => exportPDF([r], filename),   cls: 'border-red-200 text-red-600 hover:bg-red-50' },
          ].map(({ label, fn, cls }) => (
            <button key={label} onClick={fn}
              className={`text-xs font-medium px-4 py-2 rounded-lg border transition-all active:scale-95 ${cls}`}>
              {label}
            </button>
          ))}
          <button onClick={onClose} className="ml-auto btn-secondary text-xs py-2 px-4">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

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
        <div>
          <span className="text-slate-400">{r.tipo_documento ?? 'Doc.'}: </span>
          <span className="text-slate-700 font-mono">{r.numero_manifiesto_remito ?? '—'}</span>
        </div>
        {r.corriente_residuo && <div className="col-span-2"><span className="text-slate-400">Corriente: </span><span className="text-slate-700">{r.corriente_residuo}</span></div>}
        {r.tipo_documento === 'Manifiesto' && r.operador && <div className="col-span-2"><span className="text-slate-400">Operador: </span><span className="text-slate-700">{r.operador}</span></div>}
        {r.tipo_documento === 'Manifiesto' && r.transportista && <div className="col-span-2"><span className="text-slate-400">Transportista: </span><span className="text-slate-700">{r.transportista}</span></div>}
      </div>
      {r.sector_acopio_apto != null && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400">Sector acopio:</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            r.sector_acopio_apto
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {r.sector_acopio_apto ? 'Apto' : 'No apto'}
          </span>
        </div>
      )}
      {r.observaciones && <p className="text-xs text-slate-500 line-clamp-2 border-t border-slate-50 pt-2">{r.observaciones}</p>}
      <p className="text-xs text-slate-300">{new Date(r.fecha_hora_registro).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}</p>
    </div>
  )
}

// ─── Tab Registros ─────────────────────────────────────────────────────────
function TabRegistros({ stats }) {
  const [registros, setRegistros]           = useState([])
  const [inspectores, setInspectores]       = useState([])
  const [loading, startLoading]             = useTransition()
  const [exporting, setExporting]           = useState(false)
  const [total, setTotal]                   = useState(0)
  const [page, setPage]                     = useState(0)
  const [showFilters, setShowFilters]       = useState(false)
  const [filters, setFilters]               = useState({ inspector:'', tipo:'', desde:'', hasta:'', busqueda:'' })
  const [selectedRecord, setSelectedRecord] = useState(null)

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
    startLoading(async () => {
      const { data, count } = await buildQuery(false)
      setRegistros(data || [])
      setTotal(count || 0)
    })
  }, [buildQuery])

  function updateFilters(update) {
    setFilters(prev => ({ ...prev, ...update }))
    setPage(0)
  }

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
          onChange={e => updateFilters({ busqueda: e.target.value })}
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
            {hasFilters && <button onClick={() => { setFilters({ inspector:'', tipo:'', desde:'', hasta:'', busqueda:'' }); setPage(0) }} className="text-xs text-brand-700 font-medium">Limpiar</button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={filters.inspector} onChange={e => updateFilters({ inspector: e.target.value })} className="input-field col-span-2 sm:col-span-1">
              <option value="">Todos los inspectores</option>
              {inspectores.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
            <select value={filters.tipo} onChange={e => updateFilters({ tipo: e.target.value })} className="input-field">
              <option value="">Todos los tipos</option>
              <option value="Peligroso">Peligroso</option>
              <option value="Patologico">Patológico</option>
              <option value="UVA">UVA</option>
            </select>
            <div><label className="label">Desde</label><input type="date" value={filters.desde} onChange={e => updateFilters({ desde: e.target.value })} className="input-field" /></div>
            <div><label className="label">Hasta</label><input type="date" value={filters.hasta} onChange={e => updateFilters({ hasta: e.target.value })} className="input-field" /></div>
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
          : registros.map(r => (
            <button key={r.id} onClick={() => setSelectedRecord(r)} className="text-left w-full">
              <RecordCard r={r} />
            </button>
          ))}
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#Reg','Inspector','Tipo','Empresa','Corriente','Volumen','Documento','N° Doc.','Operador','Fecha retiro','Sector acopio','Registrado'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-14 text-slate-400 text-sm">Cargando…</td></tr>
              ) : registros.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-14 text-slate-400 text-sm">Sin registros.</td></tr>
              ) : registros.map((r, i) => (
                <tr key={r.id} onClick={() => setSelectedRecord(r)} className={`border-b border-slate-50 hover:bg-brand-50 transition-colors cursor-pointer ${i % 2 !== 0 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700 whitespace-nowrap">#{String(r.numero_registro ?? '?').padStart(4,'0')}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{r.inspectores?.nombre ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${TIPO_BADGE[r.tipo_residuo] ?? 'bg-slate-100 text-slate-600'}`}>{TIPO_LABEL[r.tipo_residuo] ?? r.tipo_residuo}</span></td>
                  <td className="px-4 py-3 max-w-[160px]"><p className="font-medium text-slate-700 truncate">{r.nombre_empresa}</p>{r.rubro_empresa && <p className="text-xs text-slate-400 truncate">{r.rubro_empresa}</p>}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[130px]"><p className="truncate">{r.corriente_residuo ?? '—'}</p></td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{r.volumen_retirado != null ? `${r.volumen_retirado} ${r.unidad_volumen}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{r.tipo_documento || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{r.numero_manifiesto_remito || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px]"><p className="truncate">{r.operador || '—'}</p></td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{r.fecha_retiro || '—'}</td>
                  <td className="px-4 py-3">
                    {r.sector_acopio_apto != null
                      ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          r.sector_acopio_apto
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>{r.sector_acopio_apto ? 'Apto' : 'No apto'}</span>
                      : <span className="text-slate-300 text-xs">—</span>
                    }
                  </td>
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

      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  )
}

// ─── Tab Usuarios ──────────────────────────────────────────────────────────
function TabUsuarios({ currentAdminId }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null) // id del usuario que se está actualizando

  useEffect(() => {
    supabase.from('inspectores').select('*').order('nombre').then(({ data }) => {
      setUsuarios(data || [])
      setLoading(false)
    })
  }, [])

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
