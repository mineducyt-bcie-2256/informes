'use client'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface GraficasPRTProps {
  datos: any[]
}

const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function GraficasPRT({ datos }: GraficasPRTProps) {
  // Datos para gráfica de estudiantes vs docentes
  const datosEstudiantesDocentes = [
    {
      nombre: 'Presencial',
      estudiantes: datos.reduce((sum, d) => sum + (d.total_estudiantes || 0), 0),
      docentes: datos.reduce((sum, d) => sum + (d.total_docentes || 0), 0),
    },
    {
      nombre: 'Virtual',
      estudiantes: datos.reduce((sum, d) => sum + ((d.estudiantes_virtual_ninos || 0) + (d.estudiantes_virtual_ninas || 0)), 0),
      docentes: datos.reduce((sum, d) => sum + ((d.docentes_virtual_hombres || 0) + (d.docentes_virtual_mujeres || 0)), 0),
    },
  ]

  // Datos por supervisión
  const datosSupervision = Object.entries(
    datos.reduce((acc: Record<string, any>, d) => {
      const supervision = d.supervision || 'Sin asignar'
      if (!acc[supervision]) {
        acc[supervision] = { nombre: supervision, cantidad: 0, estudiantes: 0 }
      }
      acc[supervision].cantidad += 1
      acc[supervision].estudiantes += d.total_estudiantes || 0
      return acc
    }, {})
  ).map(([_, data]) => data)

  // Datos por modalidad
  const datosModalidad = Object.entries(
    datos.reduce((acc: Record<string, number>, d) => {
      const modalidad = Array.isArray(d.modalidad) ? d.modalidad.join(', ') : d.modalidad || 'No especificada'
      acc[modalidad] = (acc[modalidad] || 0) + 1
      return acc
    }, {})
  ).map(([nombre, value]) => ({ nombre, value }))

  // Datos por condición
  const datosCondicion = Object.entries(
    datos.reduce((acc: Record<string, number>, d) => {
      const condicion = d.condicion_uso || 'No especificada'
      acc[condicion] = (acc[condicion] || 0) + 1
      return acc
    }, {})
  ).map(([nombre, value]) => ({ nombre, value }))

  // Distribución de estudiantes por género (presencial)
  const datosGenero = [
    {
      nombre: 'Niños',
      value: datos.reduce((sum, d) => sum + (d.ninos || 0), 0),
    },
    {
      nombre: 'Niñas',
      value: datos.reduce((sum, d) => sum + (d.ninas || 0), 0),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Centros Educativos</p>
          <p className="text-3xl font-bold text-blue-600">
            {new Set(datos.map(d => d.codigo)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Estudiantes (Presencial)</p>
          <p className="text-3xl font-bold text-green-600">
            {datos.reduce((sum, d) => sum + (d.total_estudiantes || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Docentes (Presencial)</p>
          <p className="text-3xl font-bold text-purple-600">
            {datos.reduce((sum, d) => sum + (d.total_docentes || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Sitios de Reubicación</p>
          <p className="text-3xl font-bold text-orange-600">{datos.length}</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estudiantes vs Docentes */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Estudiantes vs Docentes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosEstudiantesDocentes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="estudiantes" fill="#3b82f6" name="Estudiantes" />
              <Bar dataKey="docentes" fill="#10b981" name="Docentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Modalidad */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Distribución por Modalidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosModalidad}
                dataKey="value"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {datosModalidad.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sitios por Supervisión */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Sitios por Supervisión</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={datosSupervision.slice(0, 8)}
              layout="vertical"
              margin={{ left: 150 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={140} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Condición */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Condición de Uso</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosCondicion}
                dataKey="value"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {datosCondicion.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Género */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Estudiantes por Género (Presencial)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosGenero}
                dataKey="value"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Cell fill="#ec4899" />
                <Cell fill="#3b82f6" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
