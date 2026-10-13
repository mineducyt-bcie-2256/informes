'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESES } from '@/types'
import { Building2, Filter } from 'lucide-react'
import Link from 'next/link'

interface FiltrosDashboardProps {
  empresasUnicas: string[]
  escuelasDeEmpresa: { id: string; nombre: string }[]
  esRestringido: boolean
  empresaEfectiva: string | null
  filtrosActuales: {
    empresa?: string
    escuela_id?: string
    mes?: string
    mes_desde?: string
    mes_hasta?: string
  }
}

export default function FiltrosDashboard({
  empresasUnicas,
  escuelasDeEmpresa,
  esRestringido,
  empresaEfectiva,
  filtrosActuales,
}: FiltrosDashboardProps) {
  const router = useRouter()

  const [empresa, setEmpresa] = useState(filtrosActuales.empresa ?? '')
  const [escuelaId, setEscuelaId] = useState(filtrosActuales.escuela_id ?? '')
  const [mes, setMes] = useState(filtrosActuales.mes ?? '')
  const [mesDesde, setMesDesde] = useState(filtrosActuales.mes_desde ?? '')
  const [mesHasta, setMesHasta] = useState(filtrosActuales.mes_hasta ?? '')

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (empresa) params.append('empresa', empresa)
    if (escuelaId) params.append('escuela_id', escuelaId)
    if (mes) params.append('mes', mes)
    if (mesDesde) params.append('mes_desde', mesDesde)
    if (mesHasta) params.append('mes_hasta', mesHasta)

    router.push(`/dashboard?${params.toString()}`)
  }

  const handleLimpiar = () => {
    setEmpresa('')
    setEscuelaId('')
    setMes('')
    setMesDesde('')
    setMesHasta('')
    router.push('/dashboard')
  }

  return (
    <div className="rounded-2xl border p-4 flex flex-wrap items-end gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      {/* Empresa */}
      {esRestringido ? (
        <>
          <div className="flex items-center gap-2 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 text-sm text-blue-800 dark:text-blue-300 min-w-[220px]">
            <Building2 size={14} className="text-blue-500 shrink-0" />
            <span className="font-medium truncate">{empresaEfectiva}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Empresa supervisora
          </label>
          <select
            value={empresa}
            onChange={(e) => {
              setEmpresa(e.target.value)
              setEscuelaId('')
            }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[220px]"
          >
            <option value="">— Todas las empresas —</option>
            {empresasUnicas.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
        </div>
      )}

      {/* Escuela (solo si hay empresa) */}
      {(empresa || esRestringido) && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Escuela
          </label>
          <select
            value={escuelaId}
            onChange={(e) => setEscuelaId(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[280px]"
          >
            <option value="">— Todas las escuelas —</option>
            {escuelasDeEmpresa.map(esc => (
              <option key={esc.id} value={esc.id}>{esc.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mes */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mes</label>
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">—</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Mes desde */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Desde</label>
        <select
          value={mesDesde}
          onChange={(e) => setMesDesde(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">—</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Mes hasta */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hasta</label>
        <select
          value={mesHasta}
          onChange={(e) => setMesHasta(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">—</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Botón filtrar */}
      <button
        onClick={handleFiltrar}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Filter size={15} />
        Filtrar
      </button>

      {/* Limpiar filtros */}
      <button
        onClick={handleLimpiar}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
      >
        Limpiar filtros
      </button>
    </div>
  )
}
