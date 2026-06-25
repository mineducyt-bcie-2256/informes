'use client'
import { useState } from 'react'
import { ChevronLeft, Download, FileJson } from 'lucide-react'
import { generateReportExcel } from '@/lib/reportes/generator'

interface ReportesConfigProps {
  section: string
  onBack: () => void
  onClose: () => void
}

export default function ReportesConfig({ section, onBack, onClose }: ReportesConfigProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filters, setFilters] = useState({
    mes: '',
    escuela: '',
    supervision: '',
    estado: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const SECTION_INFO: Record<string, any> = {
    prt: {
      name: 'PRT - Plan de Reubicación Temporal',
      columns: [
        { id: 'codigo', label: 'Código', default: true },
        { id: 'centro', label: 'Centro Educativo', default: true },
        { id: 'supervision', label: 'Supervisión', default: true },
        { id: 'modalidad', label: 'Modalidad', default: false },
        { id: 'sitio_reubicacion', label: 'Sitio de Reubicación', default: true },
        { id: 'ninos', label: 'Estudiantes Niños (Presencial)', default: true },
        { id: 'ninas', label: 'Estudiantes Niñas (Presencial)', default: true },
        { id: 'total_estudiantes', label: 'Total Estudiantes (Presencial)', default: false },
        { id: 'docentes_hombres', label: 'Docentes Hombres (Presencial)', default: true },
        { id: 'docentes_mujeres', label: 'Docentes Mujeres (Presencial)', default: true },
        { id: 'total_docentes', label: 'Total Docentes (Presencial)', default: false },
        { id: 'estudiantes_virtual_ninos', label: 'Estudiantes Niños (Virtual)', default: false },
        { id: 'estudiantes_virtual_ninas', label: 'Estudiantes Niñas (Virtual)', default: false },
        { id: 'docentes_virtual_hombres', label: 'Docentes Hombres (Virtual)', default: false },
        { id: 'docentes_virtual_mujeres', label: 'Docentes Mujeres (Virtual)', default: false },
        { id: 'condicion_uso', label: 'Condición de Uso', default: false },
      ]
    },
    ppi: {
      name: 'PPI - Plan de Protección Integral',
      columns: [
        { id: 'codigo', label: 'Código', default: true },
        { id: 'centro', label: 'Centro Educativo', default: true },
        { id: 'supervision', label: 'Supervisión', default: true },
        { id: 'descripciones', label: 'Descripciones', default: true },
        { id: 'acciones', label: 'Acciones', default: true },
        { id: 'responsables', label: 'Responsables', default: false },
      ]
    },
    hsso: {
      name: 'HSSO - Higiene y Seguridad',
      columns: [
        { id: 'codigo', label: 'Código', default: true },
        { id: 'centro', label: 'Centro Educativo', default: true },
        { id: 'supervision', label: 'Supervisión', default: true },
        { id: 'condiciones', label: 'Condiciones', default: true },
        { id: 'riesgos', label: 'Riesgos', default: true },
        { id: 'medidas', label: 'Medidas', default: false },
      ]
    },
    garo: {
      name: 'GARO - Gestión Ambiental',
      columns: [
        { id: 'codigo', label: 'Código', default: true },
        { id: 'centro', label: 'Centro Educativo', default: true },
        { id: 'supervision', label: 'Supervisión', default: true },
        { id: 'aspectos', label: 'Aspectos', default: true },
        { id: 'impactos', label: 'Impactos', default: true },
        { id: 'planes_accion', label: 'Planes de Acción', default: false },
      ]
    },
    pgr: {
      name: 'PGR - Plan de Gestión de Residuos',
      columns: [
        { id: 'codigo', label: 'Código', default: true },
        { id: 'centro', label: 'Centro Educativo', default: true },
        { id: 'supervision', label: 'Supervisión', default: true },
        { id: 'tipos_residuos', label: 'Tipos de Residuos', default: true },
        { id: 'cantidades', label: 'Cantidades', default: true },
        { id: 'destino_final', label: 'Destino Final', default: false },
      ]
    },
    cumplimiento: {
      name: 'Cumplimiento Ambiental',
      columns: [
        { id: 'codigo', label: 'Código', default: true },
        { id: 'centro', label: 'Centro Educativo', default: true },
        { id: 'supervision', label: 'Supervisión', default: true },
        { id: 'indicadores', label: 'Indicadores', default: true },
        { id: 'cumplimiento', label: 'Cumplimiento', default: true },
        { id: 'evidencias', label: 'Evidencias', default: false },
      ]
    }
  }

  const currentSection = SECTION_INFO[section]
  const defaultColumns = currentSection.columns.filter((c: any) => c.default).map((c: any) => c.id)

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const selectAll = () => {
    setSelectedColumns(currentSection.columns.map((c: any) => c.id))
  }

  const clearAll = () => {
    setSelectedColumns([])
  }

  const handlePreview = async () => {
    // Simular preview (en producción, esto traería datos reales)
    setShowPreview(true)
    setPreviewData([
      {
        codigo: '10399',
        centro: 'CENTRO ESCOLAR "INSA"',
        supervision: 'MONFLO INGENIEROS, S.A. DE C.V.',
        modalidad: 'Presencial, Virtual',
        sitio_reubicacion: 'INSA Sur, Santa Ana Centro',
        ninos: 1869,
        ninas: 1745,
        total_estudiantes: 3614,
        docentes_hombres: 93,
        docentes_mujeres: 69,
      },
      {
        codigo: '10572',
        centro: 'CENTRO ESCOLAR "DE ARMENIA"',
        supervision: 'MONFLO INGENIEROS, S.A. DE C.V.',
        modalidad: 'Presencial',
        sitio_reubicacion: 'ex Centro Escolar Juan José Solórzano',
        ninos: 390,
        ninas: 353,
        total_estudiantes: 743,
        docentes_hombres: 9,
        docentes_mujeres: 14,
      },
    ])
  }

  const handleGenerateExcel = async () => {
    setIsGenerating(true)
    try {
      await generateReportExcel({
        section,
        columns: selectedColumns.length > 0 ? selectedColumns : defaultColumns,
        filters,
      })
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const columnsToUse = selectedColumns.length > 0 ? selectedColumns : defaultColumns

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-semibold">{currentSection.name}</h3>
      </div>

      {/* Filters */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <h4 className="font-semibold mb-4">Filtros (Opcional)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mes</label>
            <select
              value={filters.mes}
              onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
            >
              <option value="">Todos</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Supervisión</label>
            <input
              type="text"
              placeholder="Filtrar..."
              value={filters.supervision}
              onChange={(e) => setFilters({ ...filters, supervision: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Escuela</label>
            <input
              type="text"
              placeholder="Filtrar..."
              value={filters.escuela}
              onChange={(e) => setFilters({ ...filters, escuela: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
            >
              <option value="">Todos</option>
              <option value="completado">Completado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Column Selection */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Columnas a incluir</h4>
          <div className="flex gap-2 text-sm">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
            >
              Todas
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
            >
              Ninguna
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {currentSection.columns.map((col: any) => (
            <label key={col.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={columnsToUse.includes(col.id)}
                onChange={() => toggleColumn(col.id)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-4">Vista previa de datos</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columnsToUse.map((colId: string) => {
                    const col = currentSection.columns.find((c: any) => c.id === colId)
                    return (
                      <th key={colId} className="text-left px-3 py-2 font-medium">
                        {col?.label}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 3).map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {columnsToUse.map((colId: string) => (
                      <td key={colId} className="px-3 py-2">
                        {String(row[colId] || '-').substring(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 3 && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              ... y {previewData.length - 3} registros más
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
        >
          <FileJson size={18} />
          Vista Previa
        </button>
        <button
          onClick={handleGenerateExcel}
          disabled={isGenerating || columnsToUse.length === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition flex items-center justify-center gap-2"
        >
          <Download size={18} />
          {isGenerating ? 'Generando...' : 'Descargar Excel'}
        </button>
      </div>
    </div>
  )
}
