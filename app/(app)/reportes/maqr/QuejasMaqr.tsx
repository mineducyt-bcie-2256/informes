'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Loader2, ChevronUp, ChevronDown, X, AlertCircle } from 'lucide-react'

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
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [quejaSeleccionada, setQuejaSeleccionada] = useState<Queja | null>(null)
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
      // Paso 1: Obtener todos los MAQR con sus informes relacionados
      const { data: maqrData, error: maqrError } = await supabase
        .from('informe_maqr')
        .select('id, informe_id, informes(id, periodo_mes, periodo_anio, escuela_id, escuelas(id, codigo, nombre, empresa_obras, empresa_supervision))')

      if (maqrError) throw maqrError
      if (!maqrData || maqrData.length === 0) {
        setQuejas([])
        setCargando(false)
        return
      }

      // Paso 2: Filtrar MAQR según los filtros
      const mesDesdeNum = mesDesde ? parseInt(mesDesde) : 1
      const mesHastaNum = mesHasta ? parseInt(mesHasta) : 12

      const maqrFiltrados = maqrData.filter((maqr: any) => {
        const inf = maqr.informes as any
        if (!inf) return false

        // Filtrar por período
        if (inf.periodo_mes < mesDesdeNum || inf.periodo_mes > mesHastaNum) return false

        // Filtrar por supervisión
        if (supervision && inf.escuelas?.empresa_supervision !== supervision) return false

        // Filtrar por empresa obras
        if (empresaObras && inf.escuelas?.empresa_obras !== empresaObras) return false

        // Filtrar por escuela
        if (escuela && inf.escuela_id !== parseInt(escuela)) return false

        return true
      })

      if (maqrFiltrados.length === 0) {
        setQuejas([])
        setCargando(false)
        return
      }

      // Paso 3: Obtener todas las quejas de los MAQR filtrados
      const maqrIds = maqrFiltrados.map((m: any) => m.id)
      const { data: quejasData, error: quejasError } = await supabase
        .from('informe_maqr_quejas')
        .select('*')
        .in('maqr_id', maqrIds)
        .order('numero_queja', { ascending: true })

      if (quejasError) throw quejasError

      // Paso 4: Mapear datos con información de escuela
      const quejasConEscuela: Queja[] = (quejasData || []).map((queja: any) => {
        const maqr = maqrFiltrados.find((m: any) => m.id === queja.maqr_id)
        const inf = maqr?.informes as any
        const esc = inf?.escuelas as any

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

  // Estadísticas
  const totalQuejas = quejas.length
  const quejasAbiertas = quejas.filter(q => q.estado === 'En proceso' || q.estado === 'En investigación').length
  const quejasResueltas = quejas.filter(q => q.estado === 'Resuelto' || q.estado === 'Cerrado').length
  const quejasEnInvestigacion = quejas.filter(q => q.estado === 'En investigación').length

  // Agrupar por estado
  const porEstado: Record<string, number> = {}
  quejas.forEach(q => {
    porEstado[q.estado] = (porEstado[q.estado] || 0) + 1
  })

  // Agrupar por medio
  const porMedio: Record<string, number> = {}
  quejas.forEach(q => {
    porMedio[q.medio] = (porMedio[q.medio] || 0) + 1
  })

  // Agrupar por tipo
  const porTipo: Record<string, number> = {}
  quejas.forEach(q => {
    porTipo[q.tipo_queja] = (porTipo[q.tipo_queja] || 0) + 1
  })

  // Agrupar por origen
  const porOrigen: Record<string, number> = {}
  quejas.forEach(q => {
    porOrigen[q.origen] = (porOrigen[q.origen] || 0) + 1
  })

  // Agrupar por nivel gravedad
  const porGravedad: Record<string, number> = {}
  quejas.forEach(q => {
    porGravedad[q.nivel_gravedad] = (porGravedad[q.nivel_gravedad] || 0) + 1
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {cargando ? null : quejas.length > 0 ? (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Total Quejas Reportadas</p>
              <p className="text-3xl font-bold text-slate-900">{totalQuejas}</p>
            </div>

            {/* Por Estado */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Por Estado</p>
              <div className="space-y-1 text-xs">
                {Object.entries(porEstado)
                  .sort((a, b) => b[1] - a[1])
                  .map(([estado, count]) => (
                    <div key={estado} className="flex justify-between">
                      <span className="text-slate-600">{estado}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Medio Utilizado */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Medio Utilizado</p>
              <div className="space-y-1 text-xs">
                {Object.entries(porMedio)
                  .sort((a, b) => b[1] - a[1])
                  .map(([medio, count]) => (
                    <div key={medio} className="flex justify-between items-start">
                      <span className="text-slate-600 flex-1">{medio}</span>
                      <span className="font-semibold text-slate-900 ml-2">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tipo de Queja */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Tipo de Queja</p>
              <div className="space-y-1 text-xs">
                {Object.entries(porTipo)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tipo, count]) => (
                    <div key={tipo} className="flex justify-between items-start">
                      <span className="text-slate-600 flex-1">{tipo}</span>
                      <span className="font-semibold text-slate-900 ml-2">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Nivel Gravedad */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">Nivel Gravedad</p>
              <div className="space-y-1 text-xs">
                {Object.entries(porGravedad)
                  .map(([nivel, count]) => (
                    <div key={nivel} className="flex justify-between">
                      <span className={
                        nivel.includes('Bajo') ? 'text-green-600' :
                        nivel.includes('Medio') ? 'text-amber-600' :
                        'text-red-600'
                      }>
                        {nivel}
                      </span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setQuejaSeleccionada(q)}
                        className="text-slate-900 font-medium text-sm hover:text-blue-600 hover:underline transition text-left"
                      >
                        {q.escuela_nombre}
                      </button>
                    </td>
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

      {/* Modal de detalles */}
      {quejaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between border-b">
              <div>
                <h2 className="text-xl font-bold">Queja #{quejaSeleccionada.numero_queja}</h2>
                <p className="text-sm text-blue-100 mt-1">{quejaSeleccionada.escuela_nombre}</p>
              </div>
              <button
                onClick={() => setQuejaSeleccionada(null)}
                className="p-2 hover:bg-blue-500 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Código Escuela</p>
                  <p className="text-sm font-mono text-slate-900">{quejaSeleccionada.escuela_codigo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Empresa Obras</p>
                  <p className="text-sm text-slate-900">{quejaSeleccionada.empresa_obras}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Medio Utilizado</p>
                  <p className="text-sm text-slate-900">{quejaSeleccionada.medio}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Estado</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEstadoColor(quejaSeleccionada.estado)}`}>
                    {quejaSeleccionada.estado}
                  </span>
                </div>
              </div>

              {/* Fechas */}
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Fecha Recepción</p>
                  <p className="text-sm text-slate-900">{quejaSeleccionada.fecha_recepcion}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Fecha Resolución</p>
                  <p className="text-sm text-slate-900">{quejaSeleccionada.fecha_resolucion}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Días para Resolver</p>
                  <p className="text-sm font-bold text-blue-600">{quejaSeleccionada.dias_proceso} días</p>
                </div>
              </div>

              {/* Clasificación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Queja</p>
                  <p className="text-sm text-slate-900">{quejaSeleccionada.tipo_queja}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Origen</p>
                  <p className="text-sm text-slate-900">{quejaSeleccionada.origen}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Nivel Gravedad</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getNivelColor(quejaSeleccionada.nivel_gravedad)}`}>
                    {quejaSeleccionada.nivel_gravedad}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Descripción de la Queja</p>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-900 whitespace-pre-wrap">
                  {quejaSeleccionada.descripcion}
                </div>
              </div>

              {/* Medidas Implementadas */}
              {(() => {
                const medidas = quejaSeleccionada.medidas
                let medidasParsed: any[] = []

                // Intentar parsear las medidas
                if (medidas) {
                  if (typeof medidas === 'string') {
                    try {
                      medidasParsed = JSON.parse(medidas)
                      if (!Array.isArray(medidasParsed)) {
                        medidasParsed = Object.values(medidasParsed)
                      }
                    } catch (e) {
                      medidasParsed = []
                    }
                  } else if (Array.isArray(medidas)) {
                    medidasParsed = medidas
                  } else if (typeof medidas === 'object') {
                    medidasParsed = Object.values(medidas)
                  }
                }

                // Filtrar medidas válidas (con al menos un campo no vacío)
                medidasParsed = medidasParsed.filter((m: any) => {
                  if (typeof m === 'string') return m.trim().length > 0
                  if (typeof m === 'object' && m !== null) {
                    return (m.medida && m.medida.trim().length > 0) ||
                           (m.fecha && m.fecha.trim().length > 0) ||
                           (m.resultados && m.resultados.trim().length > 0)
                  }
                  return false
                })

                if (medidasParsed.length > 0) {
                  return (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Medidas Implementadas</p>
                      <div className="space-y-3">
                        {medidasParsed.map((medida: any, idx: number) => (
                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            {typeof medida === 'string' ? (
                              <p className="text-sm text-slate-900">{medida}</p>
                            ) : (
                              <>
                                {medida.medida && (
                                  <p className="text-sm font-medium text-slate-900 mb-1">{medida.medida}</p>
                                )}
                                {(medida.fecha || medida.resultados) && (
                                  <div className="text-xs text-slate-600 space-y-1 mt-2">
                                    {medida.fecha && medida.fecha.trim() && (
                                      <p>📅 <span className="font-medium">Fecha:</span> {medida.fecha}</p>
                                    )}
                                    {medida.resultados && medida.resultados.trim() && (
                                      <p>✓ <span className="font-medium">Resultados:</span> {medida.resultados}</p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Sin medidas registradas</p>
                        <p className="text-xs text-amber-700 mt-0.5">No hay medidas implementadas registradas aún.</p>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
