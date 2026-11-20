import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MESES } from '@/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const { data: informe } = await supabase
    .from('informes')
    .select('*, escuelas(*, grupos(numero))')
    .eq('id', id)
    .single()
  if (!informe) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })

  const [
    { data: portada },
    { data: c1317 },
    { data: hsso },
    { data: garo },
    { data: pgr },
    { data: mcear },
    { data: pppi },
    { data: maqr },
    { data: prt },
    { data: cct },
    { data: cumplimientoAmbiental },
    { data: casosEspeciales },
  ] = await Promise.all([
    supabase.from('informe_portada').select('*').eq('informe_id', id).single(),
    supabase.from('informe_c1317').select('*').eq('informe_id', id).single(),
    supabase.from('informe_hsso').select('*').eq('informe_id', id).single(),
    supabase.from('informe_garo').select('*').eq('informe_id', id).single(),
    supabase.from('informe_pgr').select('*').eq('informe_id', id).single(),
    supabase.from('informe_mcear').select('*').eq('informe_id', id).single(),
    supabase.from('informe_pppi').select('*').eq('informe_id', id).single(),
    supabase.from('informe_maqr').select('*').eq('informe_id', id).single(),
    supabase.from('informe_prt').select('*').eq('informe_id', id).single(),
    supabase.from('informe_cct').select('*').eq('informe_id', id).single(),
    supabase.from('informe_cumplimiento_ambiental').select('*').eq('informe_id', id).single(),
    supabase.from('informe_casos_especiales').select('*').eq('informe_id', id).single(),
  ])

  let maqrQuejas: unknown[] = []
  if (maqr?.id) {
    const { data } = await supabase.from('informe_maqr_quejas').select('*').eq('maqr_id', maqr.id).order('numero_queja')
    maqrQuejas = data ?? []
  }

  let elaboradoPorNombre: string | null = null
  if (portada?.elaborado_por_id) {
    const { data: prof } = await supabase.from('profiles').select('nombre').eq('id', portada.elaborado_por_id).single()
    elaboradoPorNombre = prof?.nombre ?? null
  }

  const esc = informe.escuelas as Record<string, unknown> | null
  const periodo = `${MESES[informe.periodo_mes - 1]} ${informe.periodo_anio}`

  return NextResponse.json({
    informe,
    esc,
    periodo,
    portada: { ...portada, elaborado_por_nombre: elaboradoPorNombre },
    c1317, hsso, garo, pgr, mcear, pppi,
    maqr: maqr ? { ...maqr, quejas: maqrQuejas } : null,
    prt, cct, cumplimientoAmbiental, casosEspeciales,
    mapImageUrl: c1317?.mapa_url ?? null,
  })
}
