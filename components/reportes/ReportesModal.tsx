'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import ReportesConfig from './ReportesConfig'

interface ReportesModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function ReportesModal({ isOpen, setIsOpen }: ReportesModalProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-bold">Generador de Reportes</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedSection ? (
            <SectionSelector setSelectedSection={setSelectedSection} />
          ) : (
            <ReportesConfig
              section={selectedSection}
              onBack={() => setSelectedSection(null)}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const SECTIONS = [
  {
    id: 'prt',
    name: 'PRT - Plan de Reubicación Temporal',
    description: 'Reportes sobre reubicación temporal de estudiantes y docentes',
    icon: '📍',
    fields: ['codigo', 'centro', 'supervision', 'modalidad', 'sitio_reubicacion', 'ninos', 'ninas', 'total_estudiantes', 'docentes_hombres', 'docentes_mujeres', 'total_docentes', 'estudiantes_virtual_ninos', 'estudiantes_virtual_ninas', 'docentes_virtual_hombres', 'docentes_virtual_mujeres', 'condicion_uso']
  },
  {
    id: 'ppi',
    name: 'PPI - Plan de Protección Integral',
    description: 'Reportes sobre protección integral de estudiantes',
    icon: '🛡️',
    fields: ['codigo', 'centro', 'supervision', 'descripciones', 'acciones', 'responsables']
  },
  {
    id: 'hsso',
    name: 'HSSO - Higiene y Seguridad',
    description: 'Reportes sobre condiciones de higiene y seguridad',
    icon: '⚠️',
    fields: ['codigo', 'centro', 'supervision', 'condiciones', 'riesgos', 'medidas']
  },
  {
    id: 'maqr',
    name: 'MAQR - Mecanismo de Atención de Quejas y Reclamos',
    description: 'Reportes sobre quejas y reclamos de la comunidad',
    icon: '📋',
    fields: ['codigo', 'centro', 'supervision', 'medios', 'tipo_queja', 'origen', 'gravedad']
  },
  {
    id: 'garo',
    name: 'GARO - Gestión Ambiental',
    description: 'Reportes sobre gestión ambiental',
    icon: '🌱',
    fields: ['codigo', 'centro', 'supervision', 'aspectos', 'impactos', 'planes_accion']
  },
  {
    id: 'pgr',
    name: 'PGR - Plan de Gestión de Residuos',
    description: 'Reportes sobre gestión de residuos',
    icon: '♻️',
    fields: ['codigo', 'centro', 'supervision', 'tipos_residuos', 'cantidades', 'destino_final']
  },
  {
    id: 'cumplimiento',
    name: 'Cumplimiento Ambiental',
    description: 'Reportes de cumplimiento ambiental',
    icon: '✅',
    fields: ['codigo', 'centro', 'supervision', 'indicadores', 'cumplimiento', 'evidencias']
  },
]

interface SectionSelectorProps {
  setSelectedSection: (section: string) => void
}

function SectionSelector({ setSelectedSection }: SectionSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">Selecciona la sección del reporte</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            className="p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{section.icon}</span>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{section.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{section.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
