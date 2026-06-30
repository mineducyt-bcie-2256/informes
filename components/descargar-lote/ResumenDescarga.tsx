'use client'
import { useState } from 'react'
import { Download, ChevronLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { MESES } from '@/types'

interface ResumenDescargaProps {
  informes: any[]
  filtros: any
  onBack: () => void
  onClose: () => void
}

export default function ResumenDescarga({ informes, filtros, onBack, onClose }: ResumenDescargaProps) {
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  const handleDescargar = async () => {
    setDescargando(true)
    setError(null)
    setExito(false)

    try {
      // Obtener lista de informes a descargar
      const response = await fetch('/api/informes/descargar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          informe_ids: informes.map(i => i.id),
          filtros,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al obtener informes')
      }

      const informesConURL = await response.json()

      // Importar JSZip dinámicamente
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Descargar cada PDF directamente del servidor
      for (const informe of informesConURL) {
        try {
          // Usar el endpoint que genera PDF binario
          const pdfResponse = await fetch(`/api/informes/${informe.id}/pdf`)
          if (!pdfResponse.ok) throw new Error(`Error descargando ${informe.nombre}`)

          const pdfBlob = await pdfResponse.blob()
          const mes = String(informe.periodo_mes).padStart(2, '0')
          const nombre = `Informe_${informe.periodo_anio}${mes}_${informe.codigo}_${informe.nombre}.pdf`

          zip.file(nombre, pdfBlob)
        } catch (err) {
          console.error(`Error descargando ${informe.nombre}:`, err)
          // Continuar con el siguiente
        }
      }

      // Generar ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Descargar ZIP
      const url = window.URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Informes_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExito(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error(err)
    } finally {
      setDescargando(false)
    }
  }

  const getTipoDescripcion = () => {
    switch (filtros.tipo) {
      case 'todo':
        return 'Todos los informes aprobados'
      case 'periodo':
        return `Período: ${filtros.periodoDesde} a ${filtros.periodoHasta}`
      case 'supervision':
        return `Supervisión: ${filtros.supervision}`
      default:
        return ''
    }
  }

  if (exito) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex justify-center">
          <CheckCircle size={64} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold mb-2 text-green-600">¡Descarga Completada!</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Tu archivo ZIP está siendo descargado con {informes.length} informe{informes.length !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-slate-500">Cerrando en unos momentos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ChevronLeft size={18} />
        Volver
      </button>

      <h3 className="text-xl font-bold">Resumen de Descarga</h3>

      {/* Info del Filtro */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Criterios:</strong> {getTipoDescripcion()}
        </p>
      </div>

      {/* Informes a Descargar */}
      <div>
        <h4 className="font-semibold mb-3">Informes a Descargar ({informes.length})</h4>
        <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
          {informes.length > 0 ? (
            <div className="space-y-1">
              {informes.map((inf, idx) => (
                <div
                  key={inf.id}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    idx % 2 === 0
                      ? 'bg-white dark:bg-slate-800'
                      : 'bg-slate-50 dark:bg-slate-700'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-500 min-w-fit">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {inf.escuelas?.nombre}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      {inf.escuelas?.codigo} · {MESES[inf.periodo_mes - 1]} {inf.periodo_anio}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-1 rounded-full">
                    {inf.estado}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-600 dark:text-slate-400">
              No hay informes que coincidan con tus criterios
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-900 dark:text-green-100">
          📦 Se generará un ZIP con {informes.length} informe{informes.length !== 1 ? 's' : ''} en formato PDF,
          nombrados automáticamente
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Atrás
        </button>
        <button
          onClick={handleDescargar}
          disabled={descargando || informes.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition flex items-center gap-2"
        >
          {descargando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generando ZIP...
            </>
          ) : (
            <>
              <Download size={18} />
              Descargar ({informes.length})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
