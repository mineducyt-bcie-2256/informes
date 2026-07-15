'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESES } from '@/types'

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

  // Filtros principales
  const [supervision, setSupervision] = useState(filtrosActuales.supervision ?? '')
  const [empresaObras, setEmpresaObras] = useState(filtrosActuales.empresa_obras ?? '')
  const [escuela, setEscuela] = useState(filtrosActuales.escuela ?? '')
  const [mesDesde, setMesDesde] = useState(String(filtrosActuales.mes_desde ?? ''))
  const [mesHasta, setMesHasta] = useState(String(filtrosActuales.mes_hasta ?? ''))

  // Filtrar escuelas según supervisión y empresa obras
  const escuelasFiltradasPorSupervision = supervision
    ? escuelas.filter(e => e.empresa_supervision === supervision)
    : escuelas

  const escuelasFiltradasPorEmpresa = empresaObras
    ? escuelasFiltradasPorSupervision.filter(e => e.empresa_obras === empresaObras)
    : escuelasFiltradasPorSupervision

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (supervision) params.append('supervision', supervision)
    if (empresaObras) params.append('empresa_obras', empresaObras)
    if (escuela) params.append('escuela', escuela)
    if (mesDesde) params.append('mes_desde', mesDesde)
    if (mesHasta) params.append('mes_hasta', mesHasta)

    router.push(`/reportes/pppi?${params.toString()}`)
  }

  const handleLimpiar = () => {
    setSupervision('')
    setEmpresaObras('')
    setEscuela('')
    setMesDesde('')
    setMesHasta('')
    router.push('/reportes/pppi')
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
