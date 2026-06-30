'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FiltrosDescargaLoteProps {
  filtros: {
    tipo: 'todo' | 'periodo' | 'supervision'
    periodoDesde: string
    periodoHasta: string
    supervision: string
    soloAprobados: boolean
  }
  onChange: (filtros: any) => void
}

export default function FiltrosDescargaLote({ filtros, onChange }: FiltrosDescargaLoteProps) {
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [cargandoSupervision, setCargandoSupervision] = useState(false)

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
      <h3 className="text-lg font-semibold">Selecciona cómo descargar</h3>

      {/* Tipo de Descarga */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-green-500 transition"
          style={{borderColor: filtros.tipo === 'todo' ? '#22c55e' : undefined}}>
          <input
            type="radio"
            name="tipo"
            value="todo"
            checked={filtros.tipo === 'todo'}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-5 h-5"
          />
          <div>
            <p className="font-semibold">Todos los Informes</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Descarga todos los informes aprobados</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-green-500 transition"
          style={{borderColor: filtros.tipo === 'periodo' ? '#22c55e' : undefined}}>
          <input
            type="radio"
            name="tipo"
            value="periodo"
            checked={filtros.tipo === 'periodo'}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">Por Período</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Elige un rango de fechas</p>
            {filtros.tipo === 'periodo' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <input
                  type="date"
                  value={filtros.periodoDesde}
                  onChange={(e) => handleChange('periodoDesde', e.target.value)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                  placeholder="Desde"
                />
                <input
                  type="date"
                  value={filtros.periodoHasta}
                  onChange={(e) => handleChange('periodoHasta', e.target.value)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                  placeholder="Hasta"
                />
              </div>
            )}
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-green-500 transition"
          style={{borderColor: filtros.tipo === 'supervision' ? '#22c55e' : undefined}}>
          <input
            type="radio"
            name="tipo"
            value="supervision"
            checked={filtros.tipo === 'supervision'}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-5 h-5"
          />
          <div className="flex-1">
            <p className="font-semibold">Por Supervisión</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Elige una empresa supervisora</p>
            {filtros.tipo === 'supervision' && (
              <select
                value={filtros.supervision}
                onChange={(e) => handleChange('supervision', e.target.value)}
                className="w-full mt-3 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
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

      {/* Filtro Aprobados */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.soloAprobados}
            onChange={(e) => handleChange('soloAprobados', e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Descargar solo informes aprobados
          </span>
        </label>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-8">
          ✓ Siempre activado para garantizar que solo se descargan informes completos
        </p>
      </div>

      {/* Info */}
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
