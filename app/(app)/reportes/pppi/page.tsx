import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function PppiReportePage() {
  const supabase = await createClient()

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reportes" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ArrowLeft size={18} />
          <span className="text-sm">Volver a Reportes</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">PPPI - Datos y Registros</h1>
        <p className="text-slate-500 text-sm mt-2">
          Registros de protección y prevención de infraestructura
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-slate-600">Reporte en construcción. Pronto disponible con filtros y tabla de datos.</p>
      </div>
    </div>
  )
}
