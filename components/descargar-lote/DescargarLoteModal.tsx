'use client'
import { useState, useEffect } from 'react'
import { X, Download, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import FiltrosDescargaLote from './FiltrosDescargaLote'
import ResumenDescarga from './ResumenDescarga'

interface DescargarLoteModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function DescargarLoteModal({ isOpen, setIsOpen }: DescargarLoteModalProps) {
  const [paso, setPaso] = useState<'filtros' | 'resumen'>('filtros')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filtros, setFiltros] = useState<{
    tipo: 'todo' | 'periodo' | 'supervision'
    periodoDesde: string
    periodoHasta: string
    supervision: string
    soloAprobados: boolean
  }>({
    tipo: 'todo',
    periodoDesde: '',
    periodoHasta: '',
    supervision: '',
    soloAprobados: true,
  })

  const [informesSeleccionados, setInformesSeleccionados] = useState<any[]>([])

  const handleFiltrosChange = (nuevosFiltros: any) => {
    setFiltros(nuevosFiltros)
  }

  const handleSiguiente = async () => {
    setCargando(true)
    setError(null)
    try {
      // Obtener informes con los filtros
      const supabase = createClient()

      let query = supabase
        .from('informes')
        .select('id, periodo_mes, periodo_anio, estado, escuelas(codigo, nombre, empresa_supervision)')
        .eq('estado', 'aprobado')

      // Aplicar filtros
      if (filtros.tipo === 'periodo') {
        // Convertir fechas a período (mes-año)
        const desdeDate = new Date(filtros.periodoDesde)
        const hastaDate = new Date(filtros.periodoHasta)

        // Obtener todos y filtrar en memoria
        const { data: allInformes } = await query

        if (allInformes) {
          const filtered = allInformes.filter((inf: any) => {
            const infDate = new Date(inf.periodo_anio, inf.periodo_mes - 1)
            return infDate >= desdeDate && infDate <= hastaDate
          })
          setInformesSeleccionados(filtered)
        }
      } else if (filtros.tipo === 'supervision') {
        const { data } = await query
        if (data) {
          const filtered = data.filter((inf: any) =>
            inf.escuelas?.empresa_supervision?.toLowerCase().includes(filtros.supervision.toLowerCase())
          )
          setInformesSeleccionados(filtered)
        }
      } else {
        // Todo
        const { data } = await query
        setInformesSeleccionados(data || [])
      }

      setPaso('resumen')
    } catch (err) {
      setError('Error al obtener informes. Intenta de nuevo.')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-bold">Descargar Informes en Lote</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paso === 'filtros' ? (
            <>
              <FiltrosDescargaLote
                filtros={filtros}
                onChange={handleFiltrosChange}
              />

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSiguiente}
                  disabled={cargando}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition flex items-center gap-2"
                >
                  {cargando ? 'Obteniendo informes...' : 'Siguiente'}
                </button>
              </div>
            </>
          ) : (
            <ResumenDescarga
              informes={informesSeleccionados}
              filtros={filtros}
              onBack={() => setPaso('filtros')}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
