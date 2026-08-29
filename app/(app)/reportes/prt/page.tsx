'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Filter } from 'lucide-react'
import { MESES } from '@/types'
import { fetchPRTData } from '@/lib/reportes/fetchPRT'
import DescargarExcelButton from '@/components/reportes/prt/DescargarExcelButton'

export default function ReportePRTPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [datos, setDatos] = useState<any[]>([])
  const [datosFiltrados, setDatosFiltrados] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Estado de filtros
  const [supervision, setSupervision] = useState(searchParams.get('supervision') || '')
  const [empresaObras, setEmpresaObras] = useState(searchParams.get('empresa_obras') || '')
  const [mesDesde, setMesDesde] = useState(searchParams.get('mes_desde') || '')
  const [mesHasta, setMesHasta] = useState(searchParams.get('mes_hasta') || '')
  const [modalidad, setModalidad] = useState(searchParams.get('modalidad') || '')
  const [codigo, setCodigo] = useState(searchParams.get('codigo') || '')
  const [centro, setCentro] = useState(searchParams.get('centro') || '')

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true)
      try {
        const datosObtenidos = await fetchPRTData()
        setDatos(datosObtenidos)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let resultado = datos

    if (supervision) {
      resultado = resultado.filter(d =>
        d.supervision?.toLowerCase().includes(supervision.toLowerCase())
      )
    }

    if (empresaObras) {
      resultado = resultado.filter(d =>
        d.empresa_obras?.toLowerCase().includes(empresaObras.toLowerCase())
      )
    }

    if (mesDesde) {
      resultado = resultado.filter(d => d.periodo_mes >= parseInt(mesDesde))
    }

    if (mesHasta) {
      resultado = resultado.filter(d => d.periodo_mes <= parseInt(mesHasta))
    }

    if (modalidad) {
      resultado = resultado.filter(d => {
        const modos = Array.isArray(d.modalidad) ? d.modalidad : [d.modalidad]
        return modos.includes(modalidad)
      })
    }

    if (codigo) {
      resultado = resultado.filter(d =>
        d.codigo?.toLowerCase().includes(codigo.toLowerCase())
      )
    }

    if (centro) {
      resultado = resultado.filter(d =>
        d.centro?.toLowerCase().includes(centro.toLowerCase())
      )
    }

    setDatosFiltrados(resultado)
  }, [datos, supervision, empresaObras, mesDesde, mesHasta, modalidad, codigo, centro])

  // Obtener opciones únicas para dropdowns
  const supervisiones = Array.from(new Set(datos.map(d => d.supervision).filter(Boolean))).sort()
  const empresasObrasUnicas = Array.from(new Set(datos.map(d => d.empresa_obras).filter(Boolean))).sort()
  const modalidades = Array.from(
    new Set(datos.map(d => Array.isArray(d.modalidad) ? d.modalidad : [d.modalidad]).flat().filter(Boolean))
  ).sort()

  // Contar escuelas por modalidad
  const escuelasPorModalidad = new Map<string, Set<string>>()
  datosFiltrados.forEach(d => {
    const key = d.centro
    const modos = Array.isArray(d.modalidad) ? d.modalidad : [d.modalidad]
    if (!escuelasPorModalidad.has(key)) {
      escuelasPorModalidad.set(key, new Set())
    }
    modos.forEach((m: string) => {
      if (m) escuelasPorModalidad.get(key)?.add(m)
    })
  })

  let presencial = 0, virtual = 0, hibrida = 0, sinRegistro = 0
  escuelasPorModalidad.forEach((modos) => {
    const tienePresencial = modos.has('Presencial')
    const tieneVirtual = modos.has('Virtual')

    if (tienePresencial && tieneVirtual) {
      hibrida++
    } else if (tienePresencial) {
      presencial++
    } else if (tieneVirtual) {
      virtual++
    } else {
      sinRegistro++
    }
  })

  // Calcular otras métricas
  const sitiosReubicacion = datosFiltrados.length
  const modalidadVirtualCount = new Set(
    datosFiltrados
      .filter(d => Array.isArray(d.modalidad) ? d.modalidad.includes('Virtual') : d.modalidad === 'Virtual')
      .map(d => d.centro)
  ).size
  const totalNinos = datosFiltrados.reduce((sum, d) => sum + (d.ninos || 0), 0)
  const totalNinas = datosFiltrados.reduce((sum, d) => sum + (d.ninas || 0), 0)
  const totalDocentesHombres = datosFiltrados.reduce((sum, d) => sum + (d.docentes_hombres || 0), 0)
  const totalDocentesMujeres = datosFiltrados.reduce((sum, d) => sum + (d.docentes_mujeres || 0), 0)

  const handleAplicarFiltros = () => {
    const params = new URLSearchParams()
    if (supervision) params.append('supervision', supervision)
    if (empresaObras) params.append('empresa_obras', empresaObras)
    if (mesDesde) params.append('mes_desde', mesDesde)
    if (mesHasta) params.append('mes_hasta', mesHasta)
    if (modalidad) params.append('modalidad', modalidad)
    if (codigo) params.append('codigo', codigo)
    if (centro) params.append('centro', centro)

    router.push(`/reportes/prt?${params.toString()}`)
  }

  const handleLimpiar = () => {
    setSupervision('')
    setEmpresaObras('')
    setMesDesde('')
    setMesHasta('')
    setModalidad('')
    setCodigo('')
    setCentro('')
    router.push('/reportes/prt')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/reportes')}
                className="p-2 hover:bg-blue-500 rounded-lg transition"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold">PRT - Reubicación Temporal</h1>
                <p className="text-blue-100 text-sm mt-1">
                  {datosFiltrados.length} registros
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <DescargarExcelButton
                supervision={supervision}
                empresaObras={empresaObras}
                mesDesde={mesDesde}
                mesHasta={mesHasta}
                codigo={codigo}
                centro={centro}
              />
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  mostrarFiltros
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <Filter size={18} />
                Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="bg-blue-50 dark:bg-slate-800 border-b border-blue-200 dark:border-slate-700 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Fila 1: Filtros principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Supervisión */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Supervisión
                </label>
                <select
                  value={supervision}
                  onChange={(e) => setSupervision(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {supervisiones.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Empresa Obras */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Empresa Obras
                </label>
                <select
                  value={empresaObras}
                  onChange={(e) => setEmpresaObras(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {empresasObrasUnicas.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Período Desde */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Desde
                </label>
                <select
                  value={mesDesde}
                  onChange={(e) => setMesDesde(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  {MESES.map((mes, idx) => (
                    <option key={idx} value={idx + 1}>{mes}</option>
                  ))}
                </select>
              </div>

              {/* Período Hasta */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Hasta
                </label>
                <select
                  value={mesHasta}
                  onChange={(e) => setMesHasta(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  {MESES.map((mes, idx) => (
                    <option key={idx} value={idx + 1}>{mes}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 1.5: Búsqueda */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Código */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Código
                </label>
                <input
                  type="text"
                  placeholder="Buscar por código..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Centro Educativo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Centro Educativo
                </label>
                <input
                  type="text"
                  placeholder="Buscar por centro..."
                  value={centro}
                  onChange={(e) => setCentro(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Fila 2: Especificaciones por Modalidad */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-3">
                Modalidad de Continuidad Educativa
              </label>
              <div className="flex gap-3 flex-wrap">
                {['Presencial', 'Virtual', 'Presencial, Virtual'].map(modo => (
                  <label key={modo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modalidad"
                      value={modo === 'Presencial, Virtual' ? '' : modo}
                      checked={modalidad === (modo === 'Presencial, Virtual' ? '' : modo)}
                      onChange={(e) => setModalidad(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{modo === 'Presencial, Virtual' ? 'Híbrida' : modo}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleLimpiar}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition"
              >
                Limpiar
              </button>
              <button
                onClick={handleAplicarFiltros}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {cargando ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Presencial */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Presencial</p>
                <p className="text-2xl font-bold text-blue-600">{presencial}</p>
                <p className="text-xs text-slate-600 mt-1">Escuelas</p>
              </div>

              {/* Virtual */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Virtual</p>
                <p className="text-2xl font-bold text-purple-600">{virtual}</p>
                <p className="text-xs text-slate-600 mt-1">Escuelas</p>
              </div>

              {/* Híbrida */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs font-semibold text-green-700 uppercase mb-2">Híbrida</p>
                <p className="text-2xl font-bold text-green-600">{hibrida}</p>
                <p className="text-xs text-slate-600 mt-1">Escuelas</p>
              </div>

              {/* Sin Registro */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-xs font-semibold text-orange-700 uppercase mb-2">Sin Registro</p>
                <p className="text-2xl font-bold text-orange-600">{sinRegistro}</p>
                <p className="text-xs text-slate-600 mt-1">Escuelas</p>
              </div>

              {/* Sitios de Reubicación */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-700 uppercase mb-2">Sitios de Reubicación</p>
                <p className="text-2xl font-bold text-indigo-600">{sitiosReubicacion}</p>
                <p className="text-xs text-slate-600 mt-1">Registros</p>
              </div>

              {/* Modalidad Virtual Implementándose */}
              <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                <p className="text-xs font-semibold text-rose-700 uppercase mb-2">Virtual Implementándose</p>
                <p className="text-2xl font-bold text-rose-600">{modalidadVirtualCount}</p>
                <p className="text-xs text-slate-600 mt-1">Escuelas</p>
              </div>

              {/* Total Estudiantes */}
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <p className="text-xs font-semibold text-teal-700 uppercase mb-2">Total Estudiantes</p>
                <p className="text-2xl font-bold text-teal-600">{totalNinos + totalNinas}</p>
                <p className="text-xs text-slate-600 mt-1">
                  👦 {totalNinos} | 👧 {totalNinas}
                </p>
              </div>

              {/* Total Docentes */}
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <p className="text-xs font-semibold text-cyan-700 uppercase mb-2">Total Docentes</p>
                <p className="text-2xl font-bold text-cyan-600">{totalDocentesHombres + totalDocentesMujeres}</p>
                <p className="text-xs text-slate-600 mt-1">
                  👨 {totalDocentesHombres} | 👩 {totalDocentesMujeres}
                </p>
              </div>
            </div>

            {/* Tabla 1: Modalidad de continuidad centros educativos */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">Modalidad de Continuidad Centros Educativos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Código</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Centro Educativo</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Modalidad</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Niños</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Niñas</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          No hay registros para los filtros seleccionados
                        </td>
                      </tr>
                    ) : (() => {
                      const centrosMapa = new Map<string, any>()
                      datosFiltrados.forEach(item => {
                        const actual = centrosMapa.get(item.centro)
                        if (!actual || item.periodo_mes > actual.periodo_mes) {
                          centrosMapa.set(item.centro, item)
                        }
                      })
                      const centrosUnicos = Array.from(centrosMapa.values())
                      return centrosUnicos.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-medium">{item.codigo}</td>
                          <td className="px-4 py-3">{item.centro}</td>
                          <td className="px-4 py-3">
                            {Array.isArray(item.modalidad) ? item.modalidad.join(', ') : item.modalidad}
                          </td>
                          <td className="px-4 py-3 text-right">{item.ninos}</td>
                          <td className="px-4 py-3 text-right">{item.ninas}</td>
                          <td className="px-4 py-3 text-right font-medium">{item.ninos + item.ninas}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
