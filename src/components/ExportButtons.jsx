import { exportCSV, exportExcel, exportPDF } from '../utils/exportUtils'

const EXPORTS = [
  {
    id: 'csv',
    label: 'CSV',
    desc: 'Texto plano',
    fn: exportCSV,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'hover:bg-slate-50 border-slate-200 text-slate-700',
  },
  {
    id: 'excel',
    label: 'Excel',
    desc: '.xlsx',
    fn: exportExcel,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h.008v.008h-.008V8.25zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: 'hover:bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    id: 'pdf',
    label: 'PDF',
    desc: 'Imprimible',
    fn: exportPDF,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'hover:bg-red-50 border-red-200 text-red-700',
  },
]

export default function ExportButtons({ registros, disabled }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-400 font-medium mr-1">Exportar:</span>
      {EXPORTS.map(exp => (
        <button
          key={exp.id}
          disabled={disabled || !registros?.length}
          onClick={() => exp.fn(registros)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${exp.color}`}
        >
          {exp.icon}
          {exp.label}
          <span className="hidden sm:inline text-current opacity-60">{exp.desc}</span>
        </button>
      ))}
    </div>
  )
}
