'use client'

interface FiltrosPRTProps {
  filtros: Record<string, string>
  setFiltros: (filtros: Record<string, string>) => void
  datos: any[]
}

export default function FiltrosPRT({ filtros, setFiltros, datos }: FiltrosPRTProps) {
  // Extraer valores únicos de los datos para los selectores
  const mesesUnicos = [5, 6, 7, 8, 9, 10, 11, 12]
  const mesesNombres: Record<number, string> = {
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Septiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre',
  }

  const supervisiones = Array.from(
    new Set(datos.map(d => d.supervision).filter(Boolean))
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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Mes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Mes
        </label>
        <select
          value={filtros.mes}
          onChange={(e) => handleChange('mes', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="">Todos los meses</option>
          {mesesUnicos.map((mes) => (
            <option key={mes} value={mes}>
              {mesesNombres[mes]}
            </option>
          ))}
        </select>
      </div>

      {/* Supervisión */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Supervisión
        </label>
        <input
          type="text"
          placeholder="Buscar..."
          value={filtros.supervision}
          onChange={(e) => handleChange('supervision', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
        />
        {filtros.supervision && supervisiones.filter(s =>
          s.toLowerCase().includes(filtros.supervision.toLowerCase())
        ).length > 0 && (
          <div className="absolute bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded mt-1 max-h-32 overflow-y-auto w-48 shadow-lg z-50">
            {supervisiones
              .filter(s => s.toLowerCase().includes(filtros.supervision.toLowerCase()))
              .map((s) => (
                <button
                  key={s}
                  onClick={() => handleChange('supervision', s)}
                  className="block w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
                >
                  {s}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Centro */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Centro Educativo
        </label>
        <input
          type="text"
          placeholder="Buscar..."
          value={filtros.centro}
          onChange={(e) => handleChange('centro', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Modalidad */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Modalidad
        </label>
        <select
          value={filtros.modalidad}
          onChange={(e) => handleChange('modalidad', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="">Todas</option>
          {modalidades.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Condición */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Condición de Uso
        </label>
        <select
          value={filtros.condicion}
          onChange={(e) => handleChange('condicion', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="">Todas</option>
          {condiciones.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
