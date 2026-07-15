'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

interface PartesInteresadasTablaProps {
  supervision?: string
  empresaObras?: string
  busqueda?: string
  mesDesde?: string
  mesHasta?: string
}

interface RegistroPartes {
  codigo: string
  nombre: string
  estudiantes_ninos: number
  estudiantes_ninas: number
  estudiantes_total: number
  maestros_hombres: number
  maestros_mujeres: number
  maestros_total: number
}

export default function PartesInteresadasTabla({
  supervision,
  empresaObras,
  busqueda,
  mesDesde,
  mesHasta,
}: PartesInteresadasTablaProps) {
  const supabase = createClient()
  const [registros, setRegistros] = useState<RegistroPartes[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      try {
        // Obtener escuelas según filtros
        let escuelasQuery = supabase
          .from('escuelas')
          .select('id, nombre, codigo')
          .eq('activa', true)
          .neq('numero_contrato', 'SIN ADJUDICAR')
          .not('numero_contrato', 'is', null)

        if (supervision) {
          escuelasQuery = escuelasQuery.eq('empresa_supervision', supervision)
        }

        if (empresaObras) {
          escuelasQuery = escuelasQuery.eq('empresa_obras', empresaObras)
        }

        if (busqueda) {
          escuelasQuery = escuelasQuery.eq('id', busqueda)
        }

        const { data: escuelas } = await escuelasQuery

        if (!escuelas || escuelas.length === 0) {
          setRegistros([])
          setCargando(false)
          return
        }

        const escuelaIds = escuelas.map(e => e.id)

        // Obtener informes
        let informesQuery = supabase
          .from('informes')
          .select('id, escuela_id, periodo_mes')
          .in('escuela_id', escuelaIds)

        const { data: informes } = await informesQuery

        if (!informes || informes.length === 0) {
          setRegistros([])
          setCargando(false)
          return
        }

        const informeIds = informes.map(i => i.id)

        // Obtener datos PPPI
        const { data: pppiData } = await supabase
          .from('informe_pppi')
          .select('informe_id, partes_interesadas')
          .in('informe_id', informeIds)

        // Procesar y agrupar por escuela
        const datosPorEscuela: Record<string, RegistroPartes> = {}

        // Filtrar por período
        const informesFiltrados = informes.filter(inf => {
          if (mesDesde && parseInt(mesDesde) > inf.periodo_mes) return false
          if (mesHasta && parseInt(mesHasta) < inf.periodo_mes) return false
          return true
        })

        informesFiltrados.forEach(inf => {
          const escuelaInfo = escuelas.find(e => e.id === inf.escuela_id)
          if (!escuelaInfo) return

          const key = escuelaInfo.id
          if (!datosPorEscuela[key]) {
            datosPorEscuela[key] = {
              codigo: escuelaInfo.codigo,
              nombre: escuelaInfo.nombre,
              estudiantes_ninos: 0,
              estudiantes_ninas: 0,
              estudiantes_total: 0,
              maestros_hombres: 0,
              maestros_mujeres: 0,
              maestros_total: 0,
            }
          }

          const pppi = pppiData?.find(p => p.informe_id === inf.id)
          if (!pppi) return

          const partes = pppi.partes_interesadas as any
          if (!partes) return

          // Acumular datos
          if (partes.alumnos?.activa) {
            datosPorEscuela[key].estudiantes_ninos += partes.alumnos.hombres || 0
            datosPorEscuela[key].estudiantes_ninas += partes.alumnos.mujeres || 0
          }

          if (partes.profesores?.activa) {
            datosPorEscuela[key].maestros_hombres += partes.profesores.hombres || 0
            datosPorEscuela[key].maestros_mujeres += partes.profesores.mujeres || 0
          }
        })

        // Calcular totales y ordenar
        const registrosFinales = Object.values(datosPorEscuela)
          .map(r => ({
            ...r,
            estudiantes_total: r.estudiantes_ninos + r.estudiantes_ninas,
            maestros_total: r.maestros_hombres + r.maestros_mujeres,
          }))
          .sort((a, b) => a.codigo.localeCompare(b.codigo))

        setRegistros(registrosFinales)
      } catch (error) {
        console.error('Error cargando tabla partes interesadas:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [supervision, empresaObras, busqueda, mesDesde, mesHasta, supabase])

  const handleDescargarExcel = () => {
    if (registros.length === 0) return

    const datos = registros.map(r => ({
      'Código': r.codigo,
      'Centro Educativo': r.nombre,
      'Estudiantes Niños': r.estudiantes_ninos,
      'Estudiantes Niñas': r.estudiantes_ninas,
      'Estudiantes Total': r.estudiantes_total,
      'Maestros Hombres': r.maestros_hombres,
      'Maestros Mujeres': r.maestros_mujeres,
      'Maestros Total': r.maestros_total,
    }))

    const worksheet = XLSX.utils.json_to_sheet(datos)
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Partes Interesadas')
    XLSX.writeFile(workbook, 'PPPI-Partes-Interesadas.xlsx')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Detalle por Centro Educativo ({registros.length})
        </h3>
        {registros.length > 0 && (
          <button
            onClick={handleDescargarExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            <Download size={14} />
            Descargar Excel
          </button>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-8 text-slate-500">Cargando registros...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No hay registros para los filtros seleccionados</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Código</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Centro Educativo</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Estudiantes Niños</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Niñas</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Total</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Maestros Hombres</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Mujeres</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                  <td className="px-3 py-2 font-medium text-slate-900">{registro.codigo}</td>
                  <td className="px-3 py-2 text-slate-700">{registro.nombre}</td>
                  <td className="px-3 py-2 text-center text-slate-700">{registro.estudiantes_ninos}</td>
                  <td className="px-3 py-2 text-center text-slate-700">{registro.estudiantes_ninas}</td>
                  <td className="px-3 py-2 text-center font-semibold text-blue-600">{registro.estudiantes_total}</td>
                  <td className="px-3 py-2 text-center text-slate-700">{registro.maestros_hombres}</td>
                  <td className="px-3 py-2 text-center text-slate-700">{registro.maestros_mujeres}</td>
                  <td className="px-3 py-2 text-center font-semibold text-green-600">{registro.maestros_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
