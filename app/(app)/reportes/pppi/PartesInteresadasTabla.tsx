'use client'
import { Download } from 'lucide-react'

interface PartesInteresadasTablaProps {
  supervision?: string
  empresaObras?: string
  busqueda?: string
  mesDesde?: string
  mesHasta?: string
}

export default function PartesInteresadasTabla({
  supervision,
  empresaObras,
  busqueda,
  mesDesde,
  mesHasta,
}: PartesInteresadasTablaProps) {
  const registros: any[] = []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Detalle por Centro Educativo ({registros.length})
        </h3>
        {registros.length > 0 && (
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            <Download size={14} />
            Descargar Excel
          </button>
        )}
      </div>

      {/* Tabla */}
      {registros.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No hay registros para los filtros seleccionados</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Código</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Centro Educativo</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Estudiantes Niños</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Niñas</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Total</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Maestros Hombres</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Mujeres</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                  <td className="px-3 py-2">{registro.codigo}</td>
                  <td className="px-3 py-2">{registro.nombre}</td>
                  <td className="px-3 py-2 text-center">{registro.estudiantes_ninos}</td>
                  <td className="px-3 py-2 text-center">{registro.estudiantes_ninas}</td>
                  <td className="px-3 py-2 text-center">{registro.estudiantes_total}</td>
                  <td className="px-3 py-2 text-center">{registro.maestros_hombres}</td>
                  <td className="px-3 py-2 text-center">{registro.maestros_mujeres}</td>
                  <td className="px-3 py-2 text-center">{registro.maestros_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
