'use client'
import { MESES } from '@/types'

interface FiltrosPRTProps {
  filtros: Record<string, string>
  setFiltros: (filtros: Record<string, string>) => void
  datos: any[]
}

export default function FiltrosPRT({ filtros, setFiltros, datos }: FiltrosPRTProps) {
  const supervisiones = Array.from(
    new Set(datos.map(d => d.supervision).filter(Boolean))
  ).sort() as string[]

  const empresasObras = Array.from(
    new Set(datos.map(d => d.empresa_obras).filter(Boolean))
  ).sort() as string[]

  const centros = Array.from(
    new Set(datos.map(d => d.centro).filter(Boolean))
  ).sort() as string[]

  const modalidades = Array.from(
    new Set(
      datos
        .map(d => (Array.isArray(d.modalidad) ? d.modalidad : [d.modalidad]))
        .flat()
        .filter(Boolean)
    )
  ).sort() as string[]

  const condiciones = Array.from(
    new Set(datos.map(d => d.condicion_uso).filter(Boolean))
  ).sort() as string[]

  const handleChange = (key: string, value: string) => {
    setFiltros({ ...filtros, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Fila 1: Filtros principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Supervisión */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Supervisión</label>
          <select
            value={filtros.supervision || ''}
            onChange={(e) => handleChange('supervision', e.target.value)}
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
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Empresa Obras</label>
          <select
            value={filtros.empresa_obras || ''}
            onChange={(e) => handleChange('empresa_obras', e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {empresasObras.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Mes Desde */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Desde</label>
          <select
            value={filtros.mes_desde || ''}
            onChange={(e) => handleChange('mes_desde', e.target.value)}
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
            value={filtros.mes_hasta || ''}
            onChange={(e) => handleChange('mes_hasta', e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">—</option>
            {MESES.map((mes, idx) => (
              <option key={idx} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: Otros filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Centro Educativo */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Centro Educativo</label>
          <input
            type="text"
            placeholder="Buscar..."
            value={filtros.centro || ''}
            onChange={(e) => handleChange('centro', e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Modalidad */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Modalidad</label>
          <select
            value={filtros.modalidad || ''}
            onChange={(e) => handleChange('modalidad', e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {modalidades.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Condición de Uso */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Condición de Uso</label>
          <select
            value={filtros.condicion || ''}
            onChange={(e) => handleChange('condicion', e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {condiciones.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
