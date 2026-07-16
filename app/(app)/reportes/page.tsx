'use client'
import { useRouter } from 'next/navigation'
import { FileText, BarChart3, ChevronRight } from 'lucide-react'

type TipoReporte = 'hsso' | 'maqr' | 'pppi'

const TIPOS_REPORTES = [
  {
    id: 'hsso' as TipoReporte,
    nombre: 'HSSO - Higiene y Seguridad',
    descripcion: 'Condiciones de higiene y seguridad ocupacional',
    icon: '⚠️',
    color: 'from-orange-500 to-orange-600',
    disponible: true,
  },
  {
    id: 'maqr' as TipoReporte,
    nombre: 'MAQR - Mecanismo de Atención de Quejas y Reclamos',
    descripcion: 'Análisis sistematizado de quejas y reclamos',
    icon: '📋',
    color: 'from-purple-500 to-purple-600',
    disponible: true,
  },
  {
    id: 'pppi' as TipoReporte,
    nombre: 'PPPI - Participación de Partes Interesadas',
    descripcion: 'Participación de Partes Interesadas',
    icon: '🏗️',
    color: 'from-green-500 to-green-600',
    disponible: true,
  },
]

export default function ReportesPage() {
  const router = useRouter()

  const handleSelectReporte = (tipo: TipoReporte) => {
    if (tipo === 'hsso') {
      router.push('/reportes/hsso')
    } else if (tipo === 'maqr') {
      router.push('/reportes/maqr')
    } else if (tipo === 'pppi') {
      router.push('/reportes/pppi')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={32} />
            <h1 className="text-4xl font-bold">Dashboard de Reportes</h1>
          </div>
          <p className="text-blue-100">Genera análisis detallados y exporta datos personalizados</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Selecciona el tipo de reporte</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TIPOS_REPORTES.map((reporte) => (
            <div
              key={reporte.id}
              className={`rounded-lg border-2 overflow-hidden transition-all ${
                reporte.disponible
                  ? 'border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg cursor-pointer'
                  : 'border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => reporte.disponible && handleSelectReporte(reporte.id)}
            >
              {/* Gradient Background */}
              <div className={`h-20 bg-gradient-to-r ${reporte.color} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">
                  {reporte.icon}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl">{reporte.icon}</span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {reporte.nombre.split(' - ')[0]}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {reporte.descripcion}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  {reporte.disponible ? (
                    <>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Disponible
                      </span>
                      <ChevronRight size={18} className="text-blue-600 dark:text-blue-400" />
                    </>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Próximamente</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-blue-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Reportes Disponibles</p>
            </div>
            <p className="text-3xl font-bold">3</p>
            <p className="text-xs text-slate-500 mt-1">HSSO, MAQR y PPPI disponibles</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={24} className="text-green-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Gráficas Incluidas</p>
            </div>
            <p className="text-3xl font-bold">5+</p>
            <p className="text-xs text-slate-500 mt-1">Análisis visuales interactivos</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-purple-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Exportación</p>
            </div>
            <p className="text-3xl font-bold">Excel</p>
            <p className="text-xs text-slate-500 mt-1">Datos con formato profesional</p>
          </div>
        </div>
      </div>
    </div>
  )
}
