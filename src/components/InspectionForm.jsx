import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const UNIDADES = ['m³', 'L', 'dm³','kg', 'g', 'tonelada', 'unidades']

const CORRIENTES = [
  { value: 'Y1',      label: 'Y1 — Desechos clínicos y farmacéuticos' },
  { value: 'Y2-Y3',   label: 'Y2-Y3 — Medicamentos y productos farmacéuticos' },
  { value: 'Y4',      label: 'Y4 — Biocidas y productos fitosanitarios' },
  { value: 'Y5',      label: 'Y5 — Preservantes de la madera' },
  { value: 'Y6',      label: 'Y6 — Disolventes orgánicos' },
  { value: 'Y7',      label: 'Y7 — Cianuros (tratamiento térmico y galvanoplastia)' },
  { value: 'Y8-Y9',   label: 'Y8-Y9 — Aceites minerales e hidrocarburos' },
  { value: 'Y10',     label: 'Y10 — Sustancias con PCB (bifenilos policlorados)' },
  { value: 'Y11-Y12', label: 'Y11-Y12 — Breas, alquitranes, tintas, colorantes o resinas' },
  { value: 'Y13',     label: 'Y13 — Resinas, látex o plastificantes' },
  { value: 'Y14',     label: 'Y14 — Sustancias químicas no identificadas o nuevas' },
  { value: 'OTRA',    label: 'Otra (especificar)' },
]

const TIPO_STYLES = {
  Peligroso:  { bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800 border border-amber-200' },
  Patologico: { bar: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-800 border border-purple-200' },
  UVA:        { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
}

const CHECKLIST_ITEMS = [
  { key: 'sector_delimitado',       label: 'Sector delimitado y de acceso restringido' },
  { key: 'piso_impermeabilizado',   label: 'Piso impermeabilizado o con pintura epoxi' },
  { key: 'bandejas_antiderrame',    label: 'Bandejas antiderrame o de contención' },
  { key: 'extintor_vigente',        label: 'Extintor vigente' },
  { key: 'material_absorbente',     label: 'Material absorbente disponible para contingencias' },
  { key: 'carteleria_identificatoria', label: 'Cartelería identificatoria clara' },
  { key: 'caracterizacion_residuos',   label: 'Caracterización de los residuos peligrosos según su corriente' },
  { key: 'manifiestos_certificados',   label: 'Manifiestos de retiro y certificados de disposición final' },
]

const EMPTY_CHECKLIST = Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, false]))

const EMPTY = {
  nombre_empresa: '', direccion_empresa: '', rubro_empresa: '',
  volumen_retirado: '', unidad_volumen: 'm³',
  tipo_documento: '',
  numero_manifiesto_remito: '',
  operador: '', transportista: '', numero_certificados_disposicion: '',
  fecha_retiro: new Date().toISOString().split('T')[0],
  observaciones: '', corriente_residuo: '', corriente_otra: '',
  ...EMPTY_CHECKLIST,
}

export default function InspectionForm({ profile, tipoSeleccionado, onBack, onSuccess }) {
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const styles = TIPO_STYLES[tipoSeleccionado?.id] ?? TIPO_STYLES['Peligroso']

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const checkedCount = CHECKLIST_ITEMS.filter(i => form[i.key]).length
  const esApto = checkedCount === CHECKLIST_ITEMS.length

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre_empresa.trim() || !form.direccion_empresa.trim()) {
      setError('El nombre y la dirección de la empresa son obligatorios.')
      return
    }
    setSaving(true); setError(null)

    const corrienteValue = form.corriente_residuo === 'OTRA'
      ? form.corriente_otra.trim() || null
      : form.corriente_residuo || null

    const { data: saved, error: sbError } = await supabase.from('registros_fiscalizacion').insert({
      inspector_id:             profile.id,
      tipo_residuo:             tipoSeleccionado.id,
      nombre_empresa:           form.nombre_empresa.trim(),
      direccion_empresa:        form.direccion_empresa.trim(),
      rubro_empresa:            form.rubro_empresa.trim() || null,
      volumen_retirado:         form.volumen_retirado ? parseFloat(form.volumen_retirado) : null,
      unidad_volumen:           form.unidad_volumen,
      tipo_documento:           form.tipo_documento || null,
      numero_manifiesto_remito: form.numero_manifiesto_remito.trim() || null,
      operador:                 form.tipo_documento === 'Manifiesto' ? form.operador.trim() || null : null,
      transportista:            form.tipo_documento === 'Manifiesto' ? form.transportista.trim() || null : null,
      numero_certificados_disposicion: form.tipo_documento === 'Manifiesto' ? form.numero_certificados_disposicion.trim() || null : null,
      fecha_retiro:             form.fecha_retiro || null,
      observaciones:            form.observaciones.trim() || null,
      corriente_residuo:        corrienteValue,
      sector_delimitado:        form.sector_delimitado,
      piso_impermeabilizado:    form.piso_impermeabilizado,
      bandejas_antiderrame:     form.bandejas_antiderrame,
      extintor_vigente:         form.extintor_vigente,
      material_absorbente:      form.material_absorbente,
      carteleria_identificatoria: form.carteleria_identificatoria,
      caracterizacion_residuos:   form.caracterizacion_residuos,
      manifiestos_certificados:   form.manifiestos_certificados,
      sector_acopio_apto:         esApto,
    }).select('numero_registro').maybeSingle()

    setSaving(false)
    if (sbError) { setError(`Error al guardar: ${sbError.message}`); return }
    onSuccess(saved?.numero_registro)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`h-1 w-full ${styles.bar}`} />

      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack}
          className="text-slate-400 hover:text-slate-600 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-semibold text-slate-800">Nuevo registro</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
              {tipoSeleccionado?.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">{profile?.nombre}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Empresa */}
          <section className="card flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Datos de la empresa</h2>
            <div>
              <label className="label">Nombre de la empresa *</label>
              <input name="nombre_empresa" value={form.nombre_empresa} onChange={handleChange}
                className="input-field" placeholder="Ej: Frigorífico El Sur S.A." required />
            </div>
            <div>
              <label className="label">Dirección *</label>
              <input name="direccion_empresa" value={form.direccion_empresa} onChange={handleChange}
                className="input-field" placeholder="Ej: Av. Costanera 1500" required />
            </div>
            <div>
              <label className="label">Rubro</label>
              <input name="rubro_empresa" value={form.rubro_empresa} onChange={handleChange}
                className="input-field" placeholder="Ej: Industria alimentaria" />
            </div>
          </section>

          {/* Corriente — visible en todos los tipos */}
          <section className="card flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Corriente de residuo</h2>
            <div>
              <label className="label">Corriente clasificada</label>
              <select name="corriente_residuo" value={form.corriente_residuo} onChange={handleChange}
                className="input-field">
                <option value="">— Seleccionar corriente —</option>
                {CORRIENTES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {form.corriente_residuo === 'OTRA' && (
              <div>
                <label className="label">Especificar corriente</label>
                <input name="corriente_otra" value={form.corriente_otra} onChange={handleChange}
                  className="input-field" placeholder="Descripción de la corriente…" />
              </div>
            )}
          </section>

          {/* Checklist sector de acopio — Disp. 185/12 */}
          <section className="card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Estado del sector de acopio
              </h2>
              {checkedCount > 0 && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  esApto
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {esApto ? 'Apto' : `${checkedCount}/${CHECKLIST_ITEMS.length}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 -mt-2">Disposición 185/12 — Provincia de Chubut</p>
            <div className="flex flex-col gap-3">
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name={item.key}
                    checked={form[item.key]}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 flex-shrink-0 cursor-pointer"
                  />
                  <span className={`text-sm leading-snug transition-colors ${
                    form[item.key] ? 'text-slate-700' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            {checkedCount === 0 && (
              <p className="text-xs text-slate-400 italic">Marcá los ítems presentes en el sector.</p>
            )}
          </section>

          {/* Retiro */}
          <section className="card flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Datos del retiro</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Volumen retirado</label>
                <input name="volumen_retirado" type="number" min="0" step="any"
                  value={form.volumen_retirado} onChange={handleChange}
                  className="input-field" placeholder="0.00" />
              </div>
              <div className="w-24">
                <label className="label">Unidad</label>
                <select name="unidad_volumen" value={form.unidad_volumen} onChange={handleChange} className="input-field">
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Tipo de documento</label>
              <div className="flex gap-2">
                {['Manifiesto', 'Remito'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipo_documento: prev.tipo_documento === tipo ? '' : tipo }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.tipo_documento === tipo
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {form.tipo_documento && (
              <div>
                <label className="label">N° de {form.tipo_documento}</label>
                <input name="numero_manifiesto_remito" value={form.numero_manifiesto_remito} onChange={handleChange}
                  className="input-field" placeholder={form.tipo_documento === 'Manifiesto' ? 'Ej: MAN-2024-00123' : 'Ej: REM-2024-00456'} />
              </div>
            )}

            {form.tipo_documento === 'Manifiesto' && (
              <>
                <div>
                  <label className="label">Operador</label>
                  <input name="operador" value={form.operador} onChange={handleChange}
                    className="input-field" placeholder="Nombre del operador autorizado" />
                </div>
                <div>
                  <label className="label">Transportista</label>
                  <input name="transportista" value={form.transportista} onChange={handleChange}
                    className="input-field" placeholder="Empresa transportista" />
                </div>
                <div>
                  <label className="label">N° Certificado de disposición final</label>
                  <input name="numero_certificados_disposicion" value={form.numero_certificados_disposicion} onChange={handleChange}
                    className="input-field" placeholder="Ej: CERT-2024-00789" />
                </div>
              </>
            )}
            <div>
              <label className="label">Fecha de retiro</label>
              <input name="fecha_retiro" type="date" value={form.fecha_retiro} onChange={handleChange}
                className="input-field" />
            </div>
          </section>

          {/* Observaciones */}
          <section className="card">
            <label className="label">Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange}
              rows={4} className="input-field resize-none"
              placeholder="Condiciones del retiro, estado del residuo, anomalías…" />
          </section>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-8">
            <button type="button" onClick={onBack} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>Guardando…
                  </span>
                : 'Guardar registro'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
