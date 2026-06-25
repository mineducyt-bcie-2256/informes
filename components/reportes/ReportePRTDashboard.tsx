'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, Download, Filter, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TablaPRT from './prt/TablaPRT'
import GraficasPRT from './prt/GraficasPRT'
import FiltrosPRT from './prt/FiltrosPRT'
import { fetchPRTData } from '@/lib/reportes/fetchPRT'

interface ReportePRTDashboardProps {
  onBack: () => void
}

export default function ReportePRTDashboard({ onBack }: ReportePRTDashboardProps) {
  const [datos, setDatos] = useState<any[]>([])
  const [datosFiltrados, setDatosFiltrados] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtrosActivos, setFiltrosActivos] = useState({
    mes: '',
    supervision: '',
    centro: '',
    modalidad: '',
    condicion: '',
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true)
      try {
        const datosObtenidos = await fetchPRTData()
        setDatos(datosObtenidos)
        setDatosFiltrados(datosObtenidos)
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

    if (filtrosActivos.mes) {
      resultado = resultado.filter(d => d.periodo_mes === parseInt(filtrosActivos.mes))
    }

    if (filtrosActivos.supervision) {
      resultado = resultado.filter(d =>
        d.supervision?.toLowerCase().includes(filtrosActivos.supervision.toLowerCase())
      )
    }

    if (filtrosActivos.centro) {
      resultado = resultado.filter(d =>
        d.centro?.toLowerCase().includes(filtrosActivos.centro.toLowerCase())
      )
    }

    if (filtrosActivos.modalidad) {
      resultado = resultado.filter(d => {
        const modalidad = Array.isArray(d.modalidad) ? d.modalidad.join(', ') : d.modalidad
        return modalidad?.toLowerCase().includes(filtrosActivos.modalidad.toLowerCase())
      })
    }

    if (filtrosActivos.condicion) {
      resultado = resultado.filter(d =>
        d.condicion_uso?.toLowerCase().includes(filtrosActivos.condicion.toLowerCase())
      )
    }

    setDatosFiltrados(resultado)
  }, [filtrosActivos, datos])

  const limpiarFiltros = () => {
    setFiltrosActivos({
      mes: '',
      supervision: '',
      centro: '',
      modalidad: '',
      condicion: '',
    })
  }

  const tieneFiltros = Object.values(filtrosActivos).some(v => v !== '')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-blue-500 rounded-lg transition"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold">PRT - Plan de Reubicación Temporal</h1>
                <p className="text-blue-100 text-sm mt-1">
                  {datosFiltrados.length} registros {tieneFiltros && '(filtrados)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                mostrarFiltros
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Filter size={18} />
              Filtros {tieneFiltros && `(${Object.values(filtrosActivos).filter(v => v).length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Panel */}
      {mostrarFiltros && (
        <div className="bg-blue-50 dark:bg-slate-800 border-b border-blue-200 dark:border-slate-700 p-6">
          <div className="max-w-7xl mx-auto">
            <FiltrosPRT
              filtros={filtrosActivos}
              setFiltros={(nuevosFiltros) => setFiltrosActivos(nuevosFiltros as typeof filtrosActivos)}
              datos={datos}
            />
            {tieneFiltros && (
              <button
                onClick={limpiarFiltros}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <X size={16} />
                Limpiar filtros
              </button>
            )}
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
            {/* Gráficas */}
            <GraficasPRT datos={datosFiltrados} />

            {/* Tabla */}
            <TablaPRT datos={datosFiltrados} />
          </>
        )}
      </div>
    </div>
  )
}
