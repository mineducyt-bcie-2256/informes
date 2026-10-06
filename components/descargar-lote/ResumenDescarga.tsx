'use client'
import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, ChevronLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InformePDF } from '@/app/(app)/informes/[id]/pdf/PdfViewer'
import { MESES } from '@/types'

interface ResumenDescargaProps {
  informes: any[]
  filtros: any
  onBack: () => void
  onClose: () => void
}

export default function ResumenDescarga({ informes, filtros, onBack, onClose }: ResumenDescargaProps) {
  const [error, setError] = useState<string | null>(null)
  const [informeData, setInformeData] = useState<Record<string, any>>({})
  const [cargando, setCargando] = useState<string | null>(null)

  const obtenerDatosInforme = async (informeId: string) => {
    if (informeData[informeId]) return

    setCargando(informeId)
    setError(null)

    try {
      const supabase = createClient()

      const { data: informe } = await supabase
        .from('informes')
        .select('*, escuelas(*, grupos(numero))')
        .eq('id', informeId)
        .single()

      if (!informe) throw new Error('Informe no encontrado')

      const [
        { data: portada },
        { data: c1317 },
        { data: hsso },
        { data: garo },
        { data: pgr },
        { data: mcear },
        { data: pppi },
        { data: maqr },
        { data: prt },
        { data: cct },
        { data: cumplimientoAmbiental },
        { data: casosEspeciales },
      ] = await Promise.all([
        supabase.from('informe_portada').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_c1317').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_hsso').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_garo').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_pgr').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_mcear').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_pppi').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_maqr').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_prt').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_cct').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_cumplimiento_ambiental').select('*').eq('informe_id', informeId).single(),
        supabase.from('informe_casos_especiales').select('*').eq('informe_id', informeId).single(),
      ])

      let maqrQuejas: any[] = []
      if (maqr?.id) {
        const { data } = await supabase.from('informe_maqr_quejas').select('*').eq('maqr_id', maqr.id).order('numero_queja')
        maqrQuejas = data ?? []
      }

      const esc = informe.escuelas as any
      const periodo = `${MESES[informe.periodo_mes - 1]} ${informe.periodo_anio}`

      const reportData = {
        informe,
        esc,
        periodo,
        portada,
        c1317,
        hsso,
        garo,
        pgr,
        mcear,
        pppi,
        maqr: maqr ? { ...maqr, quejas: maqrQuejas } : null,
        prt,
        cct,
        cumplimientoAmbiental,
        casosEspeciales,
        mapImageUrl: c1317?.mapa_url ?? null,
      }

      setInformeData((prev) => ({ ...prev, [informeId]: reportData }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener datos')
      console.error(err)
    } finally {
      setCargando(null)
    }
  }

  const getTipoDescripcion = () => {
    const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const mesDesde = MESES[filtros.mesDesde - 1] || ''
    const mesHasta = MESES[filtros.mesHasta - 1] || ''

    switch (filtros.tipo) {
      case 'periodo-todos':
        return `Período: ${mesDesde} - ${mesHasta} ${filtros.anio}`
      case 'periodo-supervision':
        return `Período: ${mesDesde} - ${mesHasta} ${filtros.anio} | Supervisión: ${filtros.supervision}`
      default:
        return ''
    }
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
                  className={`px-4 py-3 flex items-center gap-3 ${
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
                  {informeData[inf.id] ? (
                    <PDFDownloadLink
                      document={<InformePDF data={informeData[inf.id]} />}
                      fileName={`Informe_SCAS_${inf.escuelas?.codigo || 'CE'}_${inf.periodo_anio}${String(inf.periodo_mes).padStart(2, '0')}.pdf`}
                      className="flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-800 transition text-sm whitespace-nowrap"
                    >
                      {({ loading }) => (
                        <>
                          {loading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              Descargar PDF
                            </>
                          )}
                        </>
                      )}
                    </PDFDownloadLink>
                  ) : (
                    <button
                      onClick={() => obtenerDatosInforme(inf.id)}
                      disabled={cargando === inf.id}
                      className="flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-800 transition text-sm whitespace-nowrap disabled:opacity-60"
                    >
                      {cargando === inf.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Preparando...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Descargar PDF
                        </>
                      )}
                    </button>
                  )}
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
          📥 Se descargarán {informes.length} informe{informes.length !== 1 ? 's' : ''} en formato PDF de forma individual,
          nombrados automáticamente con código y período
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
      </div>
    </div>
  )
}
