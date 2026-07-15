'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESES } from '@/types'
import { Search } from 'lucide-react'

interface FiltrosPppiProps {
  empresasUnicas: string[]
  empresasObrasUnicas: string[]
  escuelas: any[]
  filtrosActuales: Record<string, string | undefined>
}

export default function FiltrosPppi({
  empresasUnicas,
  empresasObrasUnicas,
  escuelas,
  filtrosActuales,
}: FiltrosPppiProps) {
  const router = useRouter()

  const [supervision, setSupervision] = useState(filtrosActuales.supervision ?? '')
  const [empresaObras, setEmpresaObras] = useState(filtrosActuales.empresa_obras ?? '')
  const [busqueda, setBusqueda] = useState(filtrosActuales.busqueda ?? '')
  const [mesDesde, setMesDesde] = useState(String(filtrosActuales.mes_desde ?? ''))
  const [mesHasta, setMesHasta] = useState(String(filtrosActuales.mes_hasta ?? ''))

  const escuelasFiltradasPorSupervision = supervision
    ? escuelas.filter(e => e.empresa_supervision === supervision)
    : escuelas

  const escuelasFiltradasPorEmpresa = empresaObras
    ? escuelasFiltradasPorSupervision.filter(e => e.empresa_obras === empresaObras)
    : escuelasFiltradasPorSupervision

  const escuelasFiltradas = busqueda
    ? escuelasFiltradasPorEmpresa.filter(e =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.codigo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : escuelasFiltradasPorEmpresa

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (supervision) params.append('supervision', supervision)
    if (empresaObras) params.append('empresa_obras', empresaObras)
    if (busqueda) params.append('busqueda', busqueda)
    if (mesDesde) params.append('mes_desde', mesDesde)
    if (mesHasta) params.append('mes_hasta', mesHasta)

    router.push(`/reportes/pppi?${params.toString()}`)
  }

  const handleLimpiar = () => {
    setSupervision('')
    setEmpresaObras('')
    setBusqueda('')
    setMesDesde('')
    setMesHasta('')
    router.push('/reportes/pppi')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
      {/* Fila 1: Filtros principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Supervisión */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Supervisión</label>
          <select
            value={supervision}
            onChange={(e) => {
              setSupervision(e.target.value)
              setEmpresaObras('')
              setBusqueda('')
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
              setBusqueda('')
            }}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {empresasObrasUnicas.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
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
            <option value="">—</option>
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
            <option value="">—</option>
            {MESES.map((mes, idx) => (
              <option key={idx} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: Buscador */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Buscar por código o centro educativo</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: CE-001 o Centro Educativo..."
            className="w-full border border-slate-300 rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {busqueda && escuelasFiltradas.length > 0 && (
          <div className="mt-2 border border-slate-300 rounded max-h-48 overflow-y-auto bg-white">
            {escuelasFiltradas.map(esc => (
              <div
                key={esc.id}
                onClick={() => {
                  setBusqueda(esc.id)
                  router.push(`/reportes/pppi?supervision=${supervision}&empresa_obras=${empresaObras}&busqueda=${esc.id}&mes_desde=${mesDesde}&mes_hasta=${mesHasta}`)
                }}
                className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
              >
                <div className="font-medium">{esc.codigo}</div>
                <div className="text-slate-500 text-[10px]">{esc.nombre}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
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
