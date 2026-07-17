'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'

interface FiltrosDescargaLoteProps {
  filtros: {
    tipo: 'todos' | 'periodo-todos' | 'periodo-supervision'
    mesDesde: number
    mesHasta: number
    anio: number
    supervision: string
    soloAprobados: boolean
  }
  onChange: (filtros: any) => void
}

export default function FiltrosDescargaLote({ filtros, onChange }: FiltrosDescargaLoteProps) {
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [cargandoSupervision, setCargandoSupervision] = useState(false)
  const anioActual = new Date().getFullYear()

  // Cargar supervisiones únicas
  useEffect(() => {
    const cargarSupervisions = async () => {
      setCargandoSupervision(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('informes')
          .select('escuelas(empresa_supervision)')
          .eq('estado', 'aprobado')

        if (data) {
          const unique = Array.from(
            new Set(
              data
                .map((inf: any) => inf.escuelas?.empresa_supervision)
                .filter(Boolean)
            )
          ).sort() as string[]
          setSupervisiones(unique)
        }
      } catch (error) {
        console.error('Error cargando supervisiones:', error)
      } finally {
        setCargandoSupervision(false)
      }
    }

    cargarSupervisions()
  }, [])

  const handleChange = (key: string, value: any) => {
    onChange({
      ...filtros,
      [key]: value,
    })
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Selecciona los filtros</h3>

      {/* PASO 1: Período (Obligatorio) */}
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
          📅 Paso 1: Selecciona el Período
        </h4>
        <p className="text-sm text-green-800 dark:text-green-200 mb-3">
          Elige los meses de inicio y fin para filtrar los informes
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Mes Inicio
            </label>
            <select
              value={filtros.mesDesde}
              onChange={(e) => handleChange('mesDesde', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
            >
              {MESES.map((mes, idx) => (
                <option key={idx} value={idx + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Mes Fin
            </label>
            <select
              value={filtros.mesHasta}
              onChange={(e) => handleChange('mesHasta', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
            >
              {MESES.map((mes, idx) => (
                <option key={idx} value={idx + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Año
          </label>
          <select
            value={filtros.anio}
            onChange={(e) => handleChange('anio', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
          >
            {[anioActual, anioActual - 1, anioActual - 2].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PASO 2: Tipo de Descarga */}
      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
          📦 Paso 2: Selecciona qué descargar
        </h4>

        <div className="space-y-2">
          {/* Todos del período */}
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
            style={{borderColor: filtros.tipo === 'periodo-todos' ? '#22c55e' : undefined, backgroundColor: filtros.tipo === 'periodo-todos' ? '#f0fdf4' : undefined}}>
            <input
              type="radio"
              name="tipo"
              value="periodo-todos"
              checked={filtros.tipo === 'periodo-todos'}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="w-4 h-4"
            />
            <div>
              <p className="font-medium text-sm text-slate-900 dark:text-white">Todos los informes del período</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Descarga todos los informes aprobados en el período seleccionado</p>
            </div>
          </label>

          {/* Por supervisión */}
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
            style={{borderColor: filtros.tipo === 'periodo-supervision' ? '#22c55e' : undefined, backgroundColor: filtros.tipo === 'periodo-supervision' ? '#f0fdf4' : undefined}}>
            <input
              type="radio"
              name="tipo"
              value="periodo-supervision"
              checked={filtros.tipo === 'periodo-supervision'}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <p className="font-medium text-sm text-slate-900 dark:text-white">Por supervisión del período</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Descarga solo los informes de una supervisión específica</p>
              {filtros.tipo === 'periodo-supervision' && (
                <select
                  value={filtros.supervision}
                  onChange={(e) => handleChange('supervision', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 text-sm"
                  disabled={cargandoSupervision}
                >
                  <option value="">
                    {cargandoSupervision ? 'Cargando...' : 'Selecciona una supervisión'}
                  </option>
                  {supervisiones.map((sup) => (
                    <option key={sup} value={sup}>
                      {sup}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Info Final */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-900 dark:text-green-100">
          📦 <strong>Resultado:</strong> Un archivo ZIP con los PDFs de todos los informes seleccionados,
          nombrados como: <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">
            Informe_202406_10399_CENTRO EDUCATIVO.pdf
          </code>
        </p>
      </div>
    </div>
  )
}
