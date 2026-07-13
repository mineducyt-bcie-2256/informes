'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Loader2 } from 'lucide-react'

interface PersonalData {
  id: string
  codigo: string
  centro: string
  empresa_obras: string
  empresa_supervision: string
  hombres: number
  mujeres: number
  total: number
}

interface PersonalEnObraProps {
  supervision?: string
  escuela?: string
  mesDesde?: string
  mesHasta?: string
}

export default function PersonalEnObra({
  supervision,
  escuela,
  mesDesde,
  mesHasta,
}: PersonalEnObraProps) {
  const supabase = createClient()
  const [datos, setDatos] = useState<PersonalData[]>([])
  const [cargando, setCargando] = useState(false)
  const [descargando, setDescargando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [supervision, escuela, mesDesde, mesHasta])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      // Obtener informes según filtros
      let query = supabase
        .from('informes')
        .select(
          `id, periodo_mes, periodo_anio, escuelas(codigo, nombre, empresa_obras, empresa_supervision)`
        )
        .eq('estado', 'aprobado')

      if (supervision) {
        query = query.eq('escuelas.empresa_supervision', supervision)
      }

      if (escuela) {
        query = query.eq('escuela_id', parseInt(escuela))
      }

      const { data: informes } = await query

      if (!informes || informes.length === 0) {
        setDatos([])
        setCargando(false)
        return
      }

      // Filtrar por período
      const mesDesdeNum = mesDesde ? parseInt(mesDesde) : 1
      const mesHastaNum = mesHasta ? parseInt(mesHasta) : 12

      const informesFiltrados = informes.filter((inf: any) => {
        const mes = inf.periodo_mes
        return mes >= mesDesdeNum && mes <= mesHastaNum
      })

      // Obtener datos de HSSO para cada informe
      const informeIds = informesFiltrados.map((inf: any) => inf.id)

      if (informeIds.length === 0) {
        setDatos([])
        setCargando(false)
        return
      }

      const { data: hssoData } = await supabase
        .from('informe_hsso')
        .select('informe_id, personal_hombres, personal_mujeres, personal_total')
        .in('informe_id', informeIds)

      // Combinar datos
      const datosPersonal: PersonalData[] = informesFiltrados
        .map((inf: any) => {
          const hsso = hssoData?.find((h: any) => h.informe_id === inf.id)
          const esc = inf.escuelas as any

          return {
            id: inf.id,
            codigo: esc?.codigo ?? '-',
            centro: esc?.nombre ?? '-',
            empresa_obras: esc?.empresa_obras ?? '-',
            empresa_supervision: esc?.empresa_supervision ?? '-',
            hombres: hsso?.personal_hombres ?? 0,
            mujeres: hsso?.personal_mujeres ?? 0,
            total: hsso?.personal_total ?? 0,
          }
        })
        .filter((d) => d.total > 0) // Solo mostrar registros con personal

      setDatos(datosPersonal)
    } catch (error) {
      console.error('Error cargando datos:', error)
      setDatos([])
    } finally {
      setCargando(false)
    }
  }

  const handleDescargarExcel = async () => {
    setDescargando(true)
    try {
      const XLSX = await import('xlsx')

      const datosExcel = datos.map((d) => ({
        'Código': d.codigo,
        'Centro Educativo': d.centro,
        'Empresa Obras': d.empresa_obras,
        'Empresa Supervisión': d.empresa_supervision,
        'Hombres': d.hombres,
        'Mujeres': d.mujeres,
        'Total': d.total,
      }))

      const ws = XLSX.utils.json_to_sheet(datosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Personal en Obra')

      ws['!cols'] = [
        { wch: 12 },
        { wch: 35 },
        { wch: 25 },
        { wch: 30 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ]

      XLSX.writeFile(wb, 'Personal_en_Obra.xlsx')
    } catch (error) {
      console.error('Error descargando Excel:', error)
    } finally {
      setDescargando(false)
    }
  }

  // Calcular totales
  const totalHombres = datos.reduce((sum, d) => sum + d.hombres, 0)
  const totalMujeres = datos.reduce((sum, d) => sum + d.mujeres, 0)
  const totalPersonal = datos.reduce((sum, d) => sum + d.total, 0)

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Personal en Obra</h2>
        <button
          onClick={handleDescargarExcel}
          disabled={descargando || datos.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition text-sm font-medium"
        >
          {descargando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download size={16} />
              Descargar Excel
            </>
          )}
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-slate-500">Cargando datos...</p>
        </div>
      ) : datos.length === 0 ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          <p>No hay datos disponibles con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Total Personal</p>
              <p className="text-3xl font-bold text-blue-600">{totalPersonal}</p>
            </div>
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👨</span>
                <p className="text-xs text-slate-500 font-medium uppercase">Hombres</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{totalHombres}</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalPersonal > 0 ? Math.round((totalHombres / totalPersonal) * 100) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👩</span>
                <p className="text-xs text-slate-500 font-medium uppercase">Mujeres</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{totalMujeres}</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalPersonal > 0 ? Math.round((totalMujeres / totalPersonal) * 100) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Centros Educativos</p>
              <p className="text-3xl font-bold text-slate-800">{datos.length}</p>
            </div>
          </div>

          {/* Gráfico Donut */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Distribución de Personal</h3>
            <div className="flex items-center justify-center">
              <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
                {/* Círculo de mujeres */}
                <circle
                  cx="100"
                  cy="100"
                  r="60"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="30"
                  strokeDasharray={`${(totalMujeres / totalPersonal) * 376.99} 376.99`}
                  strokeDashoffset="0"
                  transform="rotate(-90 100 100)"
                />
                {/* Círculo de hombres */}
                <circle
                  cx="100"
                  cy="100"
                  r="60"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="30"
                  strokeDasharray={`${(totalHombres / totalPersonal) * 376.99} 376.99`}
                  strokeDashoffset={`${-(totalMujeres / totalPersonal) * 376.99}`}
                  transform="rotate(-90 100 100)"
                />
                {/* Centro */}
                <circle cx="100" cy="100" r="35" fill="white" />
                <text
                  x="100"
                  y="105"
                  textAnchor="middle"
                  fontSize="28"
                  fontWeight="bold"
                  fill="#1e293b"
                >
                  {totalPersonal}
                </text>
                <text
                  x="100"
                  y="125"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  Total
                </text>
              </svg>
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-slate-600">Hombres ({totalHombres})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-slate-600">Mujeres ({totalMujeres})</span>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Centro Educativo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa Obras</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa Supervisión</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Hombres</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Mujeres</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-slate-700">{d.codigo}</td>
                      <td className="px-4 py-3 text-slate-900 font-medium">{d.centro}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{d.empresa_obras}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{d.empresa_supervision}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {d.hombres}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                          {d.mujeres}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium font-bold">
                          {d.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">
                      TOTALES:
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                        {totalHombres}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                        {totalMujeres}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-bold">
                        {totalPersonal}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
