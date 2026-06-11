import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const HEADERS = [
  '#Reg', 'Inspector', 'Email inspector', 'Tipo de residuo', 'Corriente',
  'Empresa', 'Dirección', 'Rubro',
  'Volumen', 'Unidad', 'N° Manifiesto / Remito',
  'Fecha de retiro', 'Observaciones', 'Registrado el',
]

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
    r.numero_manifiesto_remito    ?? '',
    r.fecha_retiro                ?? '',
    r.observaciones               ?? '',
    r.fecha_hora_registro
      ? new Date(r.fecha_hora_registro).toLocaleString('es-AR')
      : '',
  ])
}

export function exportCSV(registros, filename = 'registros_residuos') {
  const rows = [HEADERS, ...toRows(registros)]
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}.csv`)
}

export function exportExcel(registros, filename = 'registros_residuos') {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...toRows(registros)])
  ws['!cols'] = [18,22,18,18,24,26,18,10,8,22,14,32,22].map(w => ({ wch: w }))
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

  autoTable(doc, {
    head: [HEADERS],
    body: toRows(registros),
    startY: 25,
    styles: { fontSize: 6.5, cellPadding: 1.8 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    columnStyles: {
      0: { cellWidth: 22 }, 2: { cellWidth: 18 }, 3: { cellWidth: 22 },
      4: { cellWidth: 26 }, 11: { cellWidth: 35 },
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
