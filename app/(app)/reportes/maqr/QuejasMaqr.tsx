'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Loader2, ChevronUp, ChevronDown } from 'lucide-react'

interface Queja {
  id: string
  numero_queja: number
  medio: string
  fecha_recepcion: string
  fecha_resolucion: string
  dias_proceso: number
  tipo_queja: string
  origen: string
  nivel_gravedad: string
  estado: string
  descripcion: string
  medidas: any
  escuela_codigo: string
  escuela_nombre: string
  empresa_obras: string
}

interface QuejasMaqrProps {
  supervision?: string
  empresaObras?: string
  escuela?: string
  mesDesde?: string
  mesHasta?: string
}

export default function QuejasMaqr({
  supervision,
  empresaObras,
  escuela,
  mesDesde,
  mesHasta,
}: QuejasMaqrProps) {
  const supabase = createClient()
  const [quejas, setQuejas] = useState<Queja[]>([])
  const [cargando, setCargando] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'numero_queja',
    direction: 'asc',
  })

  useEffect(() => {
    cargarQuejas()
  }, [supervision, empresaObras, escuela, mesDesde, mesHasta])

  const cargarQuejas = async () => {
    setCargando(true)
    try {
      // Obtener informes y MAQR según filtros
      let query = supabase
        .from('informes')
        .select(
          `id, periodo_mes, periodo_anio,
           escuela_id,
           escuelas(id, codigo, nombre, empresa_obras, empresa_supervision),
           informe_maqr(id)`
        )

      if (supervision) {
        query = query.eq('escuelas.empresa_supervision', supervision)
      }

      if (empresaObras) {
        query = query.eq('escuelas.empresa_obras', empresaObras)
      }

      if (escuela) {
        query = query.eq('escuela_id', parseInt(escuela))
      }

      const { data: informes } = await query

      if (!informes || informes.length === 0) {
        setQuejas([])
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

      // Obtener IDs de MAQR
      const maqrIds = informesFiltrados
        .map((inf: any) => inf.informe_maqr?.[0]?.id)
        .filter(Boolean)

      if (maqrIds.length === 0) {
        setQuejas([])
        setCargando(false)
        return
      }

      // Obtener quejas con toda la información
      const { data: quejasData } = await supabase
        .from('informe_maqr_quejas')
        .select('*')
        .in('maqr_id', maqrIds)
        .order('numero_queja', { ascending: true })

      // Mapear datos con información de escuela
      const quejasConEscuela: Queja[] = (quejasData || []).map((queja: any) => {
        const informe = informesFiltrados.find(
          (inf: any) => inf.informe_maqr?.[0]?.id === queja.maqr_id
        )
        const esc = informe?.escuelas as any

        // Calcular días entre fechas
        const calcularDias = () => {
          if (!queja.fecha_recepcion) return 0
          const from = new Date(queja.fecha_recepcion)
          const to = queja.fecha_resolucion
            ? new Date(queja.fecha_resolucion)
            : new Date()
          return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
        }

        return {
          id: queja.id,
          numero_queja: queja.numero_queja,
          medio: queja.medio || '-',
          fecha_recepcion: queja.fecha_recepcion || '-',
          fecha_resolucion: queja.fecha_resolucion || '-',
          dias_proceso: calcularDias(),
          tipo_queja: queja.tipo_queja || '-',
          origen: queja.origen || '-',
          nivel_gravedad: queja.nivel_gravedad || '-',
          estado: queja.estado || '-',
          descripcion: queja.descripcion || '-',
          medidas: queja.medidas,
          escuela_codigo: esc?.codigo || '-',
          escuela_nombre: esc?.nombre || '-',
          empresa_obras: esc?.empresa_obras || '-',
        }
      })

      setQuejas(quejasConEscuela)
    } catch (error) {
      console.error('Error cargando quejas:', error)
      setQuejas([])
    } finally {
      setCargando(false)
    }
  }

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const quejasOrdenadas = [...quejas].sort((a, b) => {
    const aVal = (a as any)[sortConfig.key]
    const bVal = (b as any)[sortConfig.key]

    if (typeof aVal === 'string') {
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
  })

  const handleDescargarExcel = async () => {
    setDescargando(true)
    try {
      const XLSX = await import('xlsx')

      const datosExcel = quejasOrdenadas.map((q) => ({
        'Código Escuela': q.escuela_codigo,
        'Centro Educativo': q.escuela_nombre,
        'Empresa Obras': q.empresa_obras,
        'Nº Queja': q.numero_queja,
        'Medio Utilizado': q.medio,
        'Fecha Recepción': q.fecha_recepcion,
        'Fecha Resolución': q.fecha_resolucion,
        'Días para Resolver': q.dias_proceso,
        'Tipo de Queja': q.tipo_queja,
        'Origen': q.origen,
        'Nivel Gravedad': q.nivel_gravedad,
        'Estado': q.estado,
        'Descripción': q.descripcion,
        'Medidas': Array.isArray(q.medidas)
          ? q.medidas.join('; ')
          : typeof q.medidas === 'object' && q.medidas
            ? JSON.stringify(q.medidas)
            : '-',
      }))

      const ws = XLSX.utils.json_to_sheet(datosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Quejas MAQR')

      ws['!cols'] = [
        { wch: 15 },
        { wch: 35 },
        { wch: 25 },
        { wch: 10 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 25 },
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
        { wch: 40 },
        { wch: 40 },
      ]

      XLSX.writeFile(wb, 'Quejas_MAQR.xlsx')
    } catch (error) {
      console.error('Error descargando Excel:', error)
    } finally {
      setDescargando(false)
    }
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    )
  }

  const getNivelColor = (nivel: string) => {
    if (nivel.includes('Bajo')) return 'bg-green-100 text-green-800'
    if (nivel.includes('Medio')) return 'bg-yellow-100 text-yellow-800'
    if (nivel.includes('Alto')) return 'bg-red-100 text-red-800'
    return 'bg-slate-100 text-slate-800'
  }

  const getEstadoColor = (estado: string) => {
    if (estado === 'En proceso') return 'bg-blue-100 text-blue-800'
    if (estado === 'Resuelto') return 'bg-green-100 text-green-800'
    if (estado === 'Cerrado') return 'bg-slate-100 text-slate-800'
    return 'bg-slate-100 text-slate-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registro de Quejas y Reclamos</h2>
          <p className="text-slate-500 text-sm mt-1">{quejas.length} queja(s) registrada(s)</p>
        </div>
        <button
          onClick={handleDescargarExcel}
          disabled={descargando || quejas.length === 0}
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
      ) : quejas.length === 0 ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          <p>No hay quejas registradas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="text-left px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('escuela_codigo')}
                  >
                    <div className="flex items-center gap-2">
                      Código
                      {getSortIcon('escuela_codigo')}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('escuela_nombre')}
                  >
                    <div className="flex items-center gap-2">
                      Centro Educativo
                      {getSortIcon('escuela_nombre')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa Obras</th>
                  <th
                    className="text-center px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('numero_queja')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Nº Queja
                      {getSortIcon('numero_queja')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Medio</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">
                    Fecha Recepción
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">
                    Fecha Resolución
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">
                    Días para Resolver
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Origen</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Gravedad</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quejasOrdenadas.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-700 text-xs">{q.escuela_codigo}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium text-sm">{q.escuela_nombre}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{q.empresa_obras}</td>
                    <td className="px-4 py-3 text-center font-medium">{q.numero_queja}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{q.medio}</td>
                    <td className="px-4 py-3 text-center text-slate-600 text-xs">
                      {q.fecha_recepcion}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 text-xs">
                      {q.fecha_resolucion}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {q.dias_proceso} días
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{q.tipo_queja}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{q.origen}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getNivelColor(q.nivel_gravedad)}`}>
                        {q.nivel_gravedad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEstadoColor(q.estado)}`}>
                        {q.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">
                      {q.descripcion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
