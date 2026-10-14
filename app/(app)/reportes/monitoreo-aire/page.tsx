import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MonitoreoAireReporte from './MonitoreoAireReporte'

export default function MonitoreoAireReportePage() {
  return (
    <div className="p-8 w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reportes" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ArrowLeft size={18} />
          <span className="text-sm">Volver a Reportes</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Monitoreo de Calidad del Aire y Emisiones</h1>
        <p className="text-slate-500 text-sm mt-2">
          Mediciones de material particulado, emisiones, compuestos orgánicos volátiles y contaminación acústica por centro escolar
        </p>
      </div>

      <MonitoreoAireReporte />
    </div>
  )
}
