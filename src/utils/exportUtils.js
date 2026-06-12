import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const HEADERS = [
  '#Reg', 'Inspector', 'Email inspector', 'Tipo de residuo', 'Corriente',
  'Empresa', 'Dirección', 'Rubro',
  'Volumen', 'Unidad',
  'Tipo documento', 'N° Manifiesto / Remito', 'Operador', 'Transportista', 'N° Certif. disposición final',
  'Fecha de retiro', 'Observaciones',
  // Checklist Disp. 185/12
  'Sector delimitado', 'Piso impermeabilizado', 'Bandejas antiderrame',
  'Extintor vigente', 'Material absorbente', 'Cartelería identificatoria',
  'Caracterización residuos', 'Manifiestos y certificados',
  'Sector acopio apto',
  'Registrado el',
]

const bool = v => v ? 'Sí' : 'No'

function toRows(registros) {
  return registros.map(r => [
    r.numero_registro != null ? String(r.numero_registro).padStart(4,'0') : '',
    r.inspectores?.nombre         ?? '',
    r.inspectores?.email          ?? '',
    r.tipo_residuo                ?? '',
    r.corriente_residuo           ?? '',
    r.nombre_empresa              ?? '',
    r.direccion_empresa           ?? '',
    r.rubro_empresa               ?? '',
    r.volumen_retirado            ?? '',
    r.unidad_volumen              ?? '',
    r.tipo_documento              ?? '',
    r.numero_manifiesto_remito    ?? '',
    r.operador                    ?? '',
    r.transportista               ?? '',
    r.numero_certificados_disposicion ?? '',
    r.fecha_retiro                ?? '',
    r.observaciones               ?? '',
    bool(r.sector_delimitado),
    bool(r.piso_impermeabilizado),
    bool(r.bandejas_antiderrame),
    bool(r.extintor_vigente),
    bool(r.material_absorbente),
    bool(r.carteleria_identificatoria),
    bool(r.caracterizacion_residuos),
    bool(r.manifiestos_certificados),
    bool(r.sector_acopio_apto),
    r.fecha_hora_registro
      ? new Date(r.fecha_hora_registro).toLocaleString('es-AR')
      : '',
  ])
}

export function exportCSV(registros, filename = 'registros_residuos') {
  const rows = [HEADERS, ...toRows(registros)]
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}.csv`)
}

export function exportExcel(registros, filename = 'registros_residuos') {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...toRows(registros)])
  ws['!cols'] = [8,22,26,14,24,26,22,16,8,8,12,20,22,22,24,14,32,10,10,10,10,10,10,10,10,10,22].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Registros')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportPDF(registros, filename = 'registros_residuos') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFontSize(13); doc.setTextColor(15, 118, 110)
  doc.text('Registros de fiscalización de residuos', 14, 14)
  doc.setFontSize(8); doc.setTextColor(120)
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 20)

  // En PDF usamos columnas reducidas para no saturar — checklist como columna única resumida
  const pdfHeaders = [
    '#Reg', 'Inspector', 'Tipo', 'Empresa', 'Corriente',
    'Volumen', 'Documento', 'N° Doc.', 'Operador', 'Transportista',
    'Fecha retiro', 'Sector apto', 'Observaciones',
  ]
  const pdfRows = registros.map(r => {
    const aptoCount = [
      r.sector_delimitado, r.piso_impermeabilizado, r.bandejas_antiderrame,
      r.extintor_vigente, r.material_absorbente, r.carteleria_identificatoria,
      r.caracterizacion_residuos, r.manifiestos_certificados,
    ].filter(Boolean).length
    return [
      r.numero_registro != null ? String(r.numero_registro).padStart(4,'0') : '',
      r.inspectores?.nombre ?? '',
      r.tipo_residuo ?? '',
      r.nombre_empresa ?? '',
      r.corriente_residuo ?? '',
      r.volumen_retirado != null ? `${r.volumen_retirado} ${r.unidad_volumen}` : '',
      r.tipo_documento ?? '',
      r.numero_manifiesto_remito ?? '',
      r.operador ?? '',
      r.transportista ?? '',
      r.fecha_retiro ?? '',
      r.sector_acopio_apto ? 'Apto' : `${aptoCount}/8`,
      r.observaciones ?? '',
    ]
  })

  autoTable(doc, {
    head: [pdfHeaders],
    body: pdfRows,
    startY: 25,
    styles: { fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    columnStyles: {
      0: { cellWidth: 12 }, 2: { cellWidth: 16 }, 5: { cellWidth: 16 },
      6: { cellWidth: 16 }, 7: { cellWidth: 20 }, 11: { cellWidth: 14 },
    },
  })
  doc.save(`${filename}.pdf`)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
