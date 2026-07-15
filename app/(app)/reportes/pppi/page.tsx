import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import FiltrosPppi from './FiltrosPppi'
import RegistrosPppi from './RegistrosPppi'
import PartesInteresadasCards from './PartesInteresadasCards'
import PartesInteresadasTabla from './PartesInteresadasTabla'

export default async function PppiReportePage({
  searchParams,
}: {
  searchParams: Promise<{
    supervision?: string
    empresa_obras?: string
    busqueda?: string
    mes_desde?: string
    mes_hasta?: string
  }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Obtener opciones para filtros principales
  const { data: supervisiones } = await supabase
    .from('escuelas')
    .select('empresa_supervision')
    .eq('activa', true)
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('empresa_supervision')

  const { data: empresasObras } = await supabase
    .from('escuelas')
    .select('empresa_obras')
    .eq('activa', true)
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('empresa_obras')

  const empresasUnicas = [
    ...new Set((supervisiones ?? []).map(e => e.empresa_supervision).filter(Boolean)),
  ] as string[]

  const empresasObrasUnicas = [
    ...new Set((empresasObras ?? []).map(e => e.empresa_obras).filter(Boolean)),
  ] as string[]

  // Obtener escuelas
  const { data: escuelas } = await supabase
    .from('escuelas')
    .select('id, nombre, codigo, empresa_supervision, empresa_obras')
    .eq('activa', true)
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('nombre')

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
          Registros de protección y prevención de infraestructura en los centros educativos
        </p>
      </div>

      {/* Filtros */}
      <FiltrosPppi
        empresasUnicas={empresasUnicas}
        empresasObrasUnicas={empresasObrasUnicas}
        escuelas={escuelas ?? []}
        filtrosActuales={params}
      />

      {/* Partes Interesadas */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <PartesInteresadasCards
          supervision={params.supervision}
          empresaObras={params.empresa_obras}
          busqueda={params.busqueda}
          mesDesde={params.mes_desde}
          mesHasta={params.mes_hasta}
        />

        <hr className="my-6 border-blue-200" />

        <PartesInteresadasTabla
          supervision={params.supervision}
          empresaObras={params.empresa_obras}
          busqueda={params.busqueda}
          mesDesde={params.mes_desde}
          mesHasta={params.mes_hasta}
        />
      </div>
    </div>
  )
}
