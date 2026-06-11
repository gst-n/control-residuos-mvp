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

const EMPTY = {
  nombre_empresa: '', direccion_empresa: '', rubro_empresa: '',
  volumen_retirado: '', unidad_volumen: 'm³',
  numero_manifiesto_remito: '',
  fecha_retiro: new Date().toISOString().split('T')[0],
  observaciones: '', corriente_residuo: '', corriente_otra: '',
}

export default function InspectionForm({ profile, tipoSeleccionado, onBack, onSuccess }) {
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const styles = TIPO_STYLES[tipoSeleccionado?.id] ?? TIPO_STYLES['Peligroso']

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

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
      numero_manifiesto_remito: form.numero_manifiesto_remito.trim() || null,
      fecha_retiro:             form.fecha_retiro || null,
      observaciones:            form.observaciones.trim() || null,
      corriente_residuo:        corrienteValue,
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
              <label className="label">N° Manifiesto / Remito</label>
              <input name="numero_manifiesto_remito" value={form.numero_manifiesto_remito} onChange={handleChange}
                className="input-field" placeholder="Ej: MAN-2024-00123" />
            </div>
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
