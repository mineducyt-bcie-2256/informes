'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Accidente {
  id: string
  tipo: 'Incidente' | 'Accidente'
  gravedad: string
  causa: string
  tipo_lesion: string
  descripcion: string
}

interface AccidenteData {
  id: string
  codigo: string
  centro: string
  empresa_obras: string
  empresa_supervision: string
  accidentes: Accidente[]
}

interface AccidentesEnProyectoProps {
  supervision?: string
  escuela?: string
  mesDesde?: string
  mesHasta?: string
}

export default function AccidentesEnProyecto({
  supervision,
  escuela,
  mesDesde,
  mesHasta,
}: AccidentesEnProyectoProps) {
  const supabase = createClient()
  const [datos, setDatos] = useState<AccidenteData[]>([])
  const [cargando, setCargando] = useState(false)

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
          `id, periodo_mes, periodo_anio, escuelas(id, codigo, nombre, empresa_obras, empresa_supervision)`
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
        .select('informe_id, accidentes')
        .in('informe_id', informeIds)

      // Combinar datos y filtrar solo los que tienen accidentes
      const datosAccidentes: AccidenteData[] = informesFiltrados
        .map((inf: any) => {
          const hsso = hssoData?.find((h: any) => h.informe_id === inf.id)
          const esc = inf.escuelas as any

          return {
            id: inf.id,
            codigo: esc?.codigo ?? '-',
            centro: esc?.nombre ?? '-',
            empresa_obras: esc?.empresa_obras ?? '-',
            empresa_supervision: esc?.empresa_supervision ?? '-',
            accidentes: (hsso?.accidentes ?? []) as Accidente[],
          }
        })
        .filter((d) => d.accidentes.length > 0) // Solo centros con accidentes

      setDatos(datosAccidentes)
    } catch (error) {
      console.error('Error cargando datos:', error)
      setDatos([])
    } finally {
      setCargando(false)
    }
  }

  // Calcular estadísticas
  const totalAccidentes = datos.reduce((sum, d) => sum + d.accidentes.filter(a => a.tipo === 'Accidente').length, 0)
  const totalIncidentes = datos.reduce((sum, d) => sum + d.accidentes.filter(a => a.tipo === 'Incidente').length, 0)
  const totalEventos = totalAccidentes + totalIncidentes

  // Contar por gravedad
  const porGravedad: Record<string, number> = {}
  datos.forEach((d) => {
    d.accidentes.forEach((a) => {
      porGravedad[a.gravedad] = (porGravedad[a.gravedad] || 0) + 1
    })
  })

  // Contar por causa
  const porCausa: Record<string, number> = {}
  datos.forEach((d) => {
    d.accidentes.forEach((a) => {
      porCausa[a.causa] = (porCausa[a.causa] || 0) + 1
    })
  })

  // Contar por tipo de lesión
  const porLesion: Record<string, number> = {}
  datos.forEach((d) => {
    d.accidentes.forEach((a) => {
      porLesion[a.tipo_lesion] = (porLesion[a.tipo_lesion] || 0) + 1
    })
  })

  // Colores por gravedad
  const GRAVEDAD_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
    'Sin daño': { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
    'Leve': { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' },
    'Grave (incapacitante)': { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
    'Mortal': { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <h2 className="text-2xl font-bold text-slate-900">Accidentes registrados en el proyecto</h2>

      {cargando ? (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-slate-500">Cargando datos...</p>
        </div>
      ) : totalEventos === 0 ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          <p>No hay accidentes ni incidentes registrados en los centros educativos</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accidentes */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">ACCIDENTES</p>
                  <p className="text-3xl font-bold mt-2">{totalAccidentes}</p>
                  <p className="text-xs opacity-75 mt-1">registrados en el periodo</p>
                </div>
                <span className="text-4xl opacity-20">⚠️</span>
              </div>
            </div>

            {/* Total Eventos */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">TOTAL EVENTOS</p>
                  <p className="text-3xl font-bold mt-2">{totalEventos}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs">{totalAccidentes} Accidentes</p>
                  <p className="text-xs">{totalIncidentes} Incidentes</p>
                </div>
              </div>
            </div>

            {/* Incidentes */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">INCIDENTES</p>
                  <p className="text-3xl font-bold mt-2">{totalIncidentes}</p>
                </div>
                <span className="text-4xl opacity-20">📋</span>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gravedad */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Por Gravedad</h3>
              <div className="space-y-3">
                {Object.entries(porGravedad).map(([gravedad, count]) => {
                  const max = Math.max(...Object.values(porGravedad))
                  const percent = (count / max) * 100
                  const colors = GRAVEDAD_COLOR[gravedad] || GRAVEDAD_COLOR['Sin daño']

                  return (
                    <div key={gravedad}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{gravedad}</span>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}>
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors.bar}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Causa Principal */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Causas Principales</h3>
              <div className="space-y-2">
                {Object.entries(porCausa)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([causa, count]) => (
                    <div key={causa} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span className="text-sm text-slate-700">{causa}</span>
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Tabla de Accidentes */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Centro Educativo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa Obras</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa Supervisión</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Tipo</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Gravedad</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Causa</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipo de Lesión</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.map((centro) =>
                    centro.accidentes.map((accidente, idx) => (
                      <tr
                        key={`${centro.id}-${idx}`}
                        className={`hover:bg-slate-50 transition ${
                          accidente.tipo === 'Accidente' ? 'bg-red-50' : 'bg-yellow-50'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {idx === 0 ? centro.codigo : ''}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-medium">
                          {idx === 0 ? centro.centro : ''}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {idx === 0 ? centro.empresa_obras : ''}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {idx === 0 ? centro.empresa_supervision : ''}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              accidente.tipo === 'Accidente'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {accidente.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              GRAVEDAD_COLOR[accidente.gravedad]?.bg || 'bg-slate-100'
                            } ${GRAVEDAD_COLOR[accidente.gravedad]?.text || 'text-slate-700'}`}
                          >
                            {accidente.gravedad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{accidente.causa}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{accidente.tipo_lesion}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm max-w-xs truncate">
                          {accidente.descripcion}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
