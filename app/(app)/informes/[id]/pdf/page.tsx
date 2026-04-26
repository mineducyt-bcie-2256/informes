import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MESES } from '@/types'
import PdfLoader from './PdfLoader'

export default async function PdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: informe } = await supabase
    .from('informes')
    .select('*, escuelas(*, grupos(numero))')
    .eq('id', id)
    .single()

  if (!informe) notFound()

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
  ])

  // Fetch elaborado_por profile name if portada has elaborado_por_id
  let elaboradoPorNombre: string | null = null
  if (portada?.elaborado_por_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', portada.elaborado_por_id)
      .single()
    elaboradoPorNombre = prof?.nombre ?? null
  }

  const esc = informe.escuelas as any
  const periodo = `${MESES[informe.periodo_mes - 1]} ${informe.periodo_anio}`

  console.log('=== CCT Data ===')
  console.log('cct object:', cct)
  if (cct?.secciones) {
    console.log('cct.secciones:', cct.secciones)
    console.log('primer item:', cct.secciones[0]?.items?.[0])
  }
  console.log('Todas las condiciones cargadas:', { c1317, hsso, garo, pgr, mcear, pppi, maqr, prt, cct })

  const reportData = {
    informe, esc, periodo,
    portada: { ...portada, elaborado_por_nombre: elaboradoPorNombre },
    c1317, hsso, garo, pgr, mcear, pppi, maqr, prt, cct,
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Generar PDF</h1>
        <p className="text-slate-500 text-sm mt-1">{esc?.nombre} · {periodo}</p>
      </div>
      <PdfLoader data={reportData} />
    </div>
  )
}
