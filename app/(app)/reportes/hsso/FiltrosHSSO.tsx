'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MESES } from '@/types'

interface FiltrosHSSO {
  empresasUnicas: string[]
  escuelas: any[]
  filtrosActuales: Record<string, string | undefined>
}

export default function FiltrosHSSO({ empresasUnicas, escuelas, filtrosActuales }: FiltrosHSSO) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [supervision, setSupervision] = useState(filtrosActuales.supervision ?? '')
  const [escuela, setEscuela] = useState(filtrosActuales.escuela ?? '')
  const [mesDesde, setMesDesde] = useState(filtrosActuales.mes_desde ?? '1')
  const [mesHasta, setMesHasta] = useState(filtrosActuales.mes_hasta ?? '12')

  // Filtrar escuelas según supervisión seleccionada
  const escuelasFiltradasPorSupervision = supervision
    ? escuelas.filter(e => e.empresa_supervision === supervision)
    : escuelas

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (supervision) params.append('supervision', supervision)
    if (escuela) params.append('escuela', escuela)
    if (mesDesde) params.append('mes_desde', mesDesde)
    if (mesHasta) params.append('mes_hasta', mesHasta)

    router.push(`/reportes/hsso?${params.toString()}`)
  }

  const handleLimpiar = () => {
    setSupervision('')
    setEscuela('')
    setMesDesde('1')
    setMesHasta('12')
    router.push('/reportes/hsso')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Empresa de Supervisión */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Empresa de Supervisión
          </label>
          <select
            value={supervision}
            onChange={(e) => {
              setSupervision(e.target.value)
              setEscuela('') // Limpiar escuela cuando cambia supervisión
            }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las empresas</option>
            {empresasUnicas.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
        </div>

        {/* Centro Educativo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Centro Educativo
          </label>
          <select
            value={escuela}
            onChange={(e) => setEscuela(e.target.value)}
            disabled={!supervision && escuelas.length > 0}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Todos los centros</option>
            {escuelasFiltradasPorSupervision.map(esc => (
              <option key={esc.id} value={esc.id}>
                {esc.nombre} ({esc.codigo})
              </option>
            ))}
          </select>
          {!supervision && escuelas.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">Selecciona una supervisión primero</p>
          )}
        </div>

        {/* Mes Desde */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Período: Desde
          </label>
          <select
            value={mesDesde}
            onChange={(e) => setMesDesde(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.map((mes, idx) => (
              <option key={idx} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </div>

        {/* Mes Hasta */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Período: Hasta
          </label>
          <select
            value={mesHasta}
            onChange={(e) => setMesHasta(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.map((mes, idx) => (
              <option key={idx} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleLimpiar}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
        >
          Limpiar filtros
        </button>
        <button
          onClick={handleFiltrar}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  )
}
