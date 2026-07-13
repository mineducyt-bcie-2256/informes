import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import FiltrosHSSO from './FiltrosHSSO'
import PersonalEnObra from './PersonalEnObra'
import AccidentesEnProyecto from './AccidentesEnProyecto'

export default async function HSSORuportePage({
  searchParams,
}: {
  searchParams: Promise<{ supervision?: string; escuela?: string; mes_desde?: string; mes_hasta?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Obtener opciones para filtros
  const { data: supervisiones } = await supabase
    .from('escuelas')
    .select('empresa_supervision')
    .eq('activa', true)
    .eq('etapa', 'Construcción')
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('empresa_supervision')

  const empresasUnicas = [...new Set((supervisiones ?? []).map(e => e.empresa_supervision).filter(Boolean))] as string[]

  // Obtener escuelas según supervisión
  let escuelasQuery = supabase
    .from('escuelas')
    .select('id, nombre, codigo, empresa_supervision')
    .eq('activa', true)
    .eq('etapa', 'Construcción')
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('nombre')

  if (params.supervision) {
    escuelasQuery = escuelasQuery.eq('empresa_supervision', params.supervision)
  }

  const { data: escuelas } = await escuelasQuery

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
        <h1 className="text-3xl font-bold text-slate-900">HSSO - Higiene, Salud y Seguridad Ocupacional</h1>
        <p className="text-slate-500 text-sm mt-2">
          Análisis sistematizado de condiciones de higiene, salud y seguridad en los centros educativos
        </p>
      </div>

      {/* Filtros */}
      <FiltrosHSSO
        empresasUnicas={empresasUnicas}
        escuelas={escuelas ?? []}
        filtrosActuales={params}
      />

      {/* Secciones de Reportes */}
      <div className="mt-8 space-y-12">
        {/* Personal en Obra */}
        <PersonalEnObra
          supervision={params.supervision}
          escuela={params.escuela}
          mesDesde={params.mes_desde}
          mesHasta={params.mes_hasta}
        />

        {/* Accidentes registrados en el proyecto */}
        <div className="border-t-2 border-slate-200 pt-12">
          <AccidentesEnProyecto
            supervision={params.supervision}
            escuela={params.escuela}
            mesDesde={params.mes_desde}
            mesHasta={params.mes_hasta}
          />
        </div>
      </div>
    </div>
  )
}
