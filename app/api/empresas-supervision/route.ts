import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await adminClient
    .from('escuelas')
    .select('empresa_supervision')
    .eq('activa', true)
    .eq('etapa', 'Construcción')
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('empresa_supervision')

  const empresas = [...new Set(
    (data ?? []).map((e: any) => e.empresa_supervision).filter(Boolean)
  )] as string[]

  return NextResponse.json({ empresas })
}
