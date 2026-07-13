'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESES } from '@/types'

const MEDIOS_QUEJA = ['Buzón', 'Correo electrónico', 'Teléfono', 'WhatsApp', 'Otro']
const TIPOS_QUEJA = ['Ambiental', 'Social y comunitaria', 'Laboral (personal o condiciones)', 'Infraestructura', 'Otro']
const ORIGENES = ['Comunidad directa', 'Trabajador', 'Institución', 'Otro']
const NIVELES = ['Nivel 1 (Bajo)', 'Nivel 2 (Medio)', 'Nivel 3 (Alto)']

interface FiltrosMaqrProps {
  empresasUnicas: string[]
  empresasObrasUnicas: string[]
  escuelas: any[]
  filtrosActuales: Record<string, string | undefined>
}

export default function FiltrosMaqr({
  empresasUnicas,
  empresasObrasUnicas,
  escuelas,
  filtrosActuales,
}: FiltrosMaqrProps) {
  const router = useRouter()

  // Filtros principales
  const [supervision, setSupervision] = useState(filtrosActuales.supervision ?? '')
  const [empresaObras, setEmpresaObras] = useState(filtrosActuales.empresa_obras ?? '')
  const [escuela, setEscuela] = useState(filtrosActuales.escuela ?? '')
  const [mesDesde, setMesDesde] = useState(filtrosActuales.mes_desde ?? '1')
  const [mesHasta, setMesHasta] = useState(filtrosActuales.mes_hasta ?? '12')

  // Filtros de quejas
  const [medios, setMedios] = useState<string[]>(
    filtrosActuales.medios ? filtrosActuales.medios.split(',') : []
  )
  const [tipoQueja, setTipoQueja] = useState(filtrosActuales.tipo_queja ?? '')
  const [origen, setOrigen] = useState(filtrosActuales.origen ?? '')
  const [gravedad, setGravedad] = useState(filtrosActuales.gravedad ?? '')

  // Filtrar escuelas según supervisión y empresa obras
  const escuelasFiltradasPorSupervision = supervision
    ? escuelas.filter(e => e.empresa_supervision === supervision)
    : escuelas

  const escuelasFiltradasPorEmpresa = empresaObras
    ? escuelasFiltradasPorSupervision.filter(e => e.empresa_obras === empresaObras)
    : escuelasFiltradasPorSupervision

  const handleMedioChange = (medio: string) => {
    setMedios(prev =>
      prev.includes(medio) ? prev.filter(m => m !== medio) : [...prev, medio]
    )
  }

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (supervision) params.append('supervision', supervision)
    if (empresaObras) params.append('empresa_obras', empresaObras)
    if (escuela) params.append('escuela', escuela)
    if (mesDesde) params.append('mes_desde', mesDesde)
    if (mesHasta) params.append('mes_hasta', mesHasta)
    if (medios.length > 0) params.append('medios', medios.join(','))
    if (tipoQueja) params.append('tipo_queja', tipoQueja)
    if (origen) params.append('origen', origen)
    if (gravedad) params.append('gravedad', gravedad)

    router.push(`/reportes/maqr?${params.toString()}`)
  }

  const handleLimpiar = () => {
    setSupervision('')
    setEmpresaObras('')
    setEscuela('')
    setMesDesde('1')
    setMesHasta('12')
    setMedios([])
    setTipoQueja('')
    setOrigen('')
    setGravedad('')
    router.push('/reportes/maqr')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      {/* Filtros Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {/* Empresa de Supervisión */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Supervisión</label>
          <select
            value={supervision}
            onChange={(e) => {
              setSupervision(e.target.value)
              setEmpresaObras('')
              setEscuela('')
            }}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {empresasUnicas.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
        </div>

        {/* Empresa Obras */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Empresa Obras</label>
          <select
            value={empresaObras}
            onChange={(e) => {
              setEmpresaObras(e.target.value)
              setEscuela('')
            }}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {empresasObrasUnicas.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
        </div>

        {/* Centro Educativo */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Centro</label>
          <select
            value={escuela}
            onChange={(e) => setEscuela(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {escuelasFiltradasPorEmpresa.map(esc => (
              <option key={esc.id} value={esc.id}>
                {esc.nombre} ({esc.codigo})
              </option>
            ))}
          </select>
        </div>

        {/* Mes Desde */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Desde</label>
          <select
            value={mesDesde}
            onChange={(e) => setMesDesde(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.map((mes, idx) => (
              <option key={idx} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </div>

        {/* Mes Hasta */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Hasta</label>
          <select
            value={mesHasta}
            onChange={(e) => setMesHasta(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.map((mes, idx) => (
              <option key={idx} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros de Quejas - Grid compacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Medios Habilitados - Checkboxes horizontales */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Medios</label>
          <div className="flex flex-wrap gap-1.5">
            {MEDIOS_QUEJA.map(medio => (
              <label key={medio} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medios.includes(medio)}
                  onChange={() => handleMedioChange(medio)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                />
                <span className="text-xs text-slate-700">{medio}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tipo de Queja */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Tipo</label>
          <select
            value={tipoQueja}
            onChange={(e) => setTipoQueja(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {TIPOS_QUEJA.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Origen */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Origen</label>
          <select
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {ORIGENES.map(ori => (
              <option key={ori} value={ori}>{ori}</option>
            ))}
          </select>
        </div>

        {/* Gravedad */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Gravedad</label>
          <select
            value={gravedad}
            onChange={(e) => setGravedad(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {NIVELES.map(nivel => (
              <option key={nivel} value={nivel}>{nivel}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-200">
        <button
          onClick={handleLimpiar}
          className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition"
        >
          Limpiar
        </button>
        <button
          onClick={handleFiltrar}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}
