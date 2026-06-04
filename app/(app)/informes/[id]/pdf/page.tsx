import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MESES } from '@/types'
import PdfLoader from './PdfLoader'
import { FileText, ChevronLeft } from 'lucide-react'

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
    { data: cumplimientoAmbiental },
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
  ])

  // Cargar quejas de MAQR si existe
  let maqrQuejas: any[] = []
  if (maqr?.id) {
    const { data } = await supabase.from('informe_maqr_quejas').select('*').eq('maqr_id', maqr.id).order('numero_queja')
    maqrQuejas = data ?? []
  }

  // Fetch elaborado_por profile name if portada has elaborado_por_id
  let elaboradoPorNombre: string | null = null
  if (portada?.elaborado_por_id) {
    console.log('🔍 Buscando nombre para elaborado_por_id:', portada.elaborado_por_id)
    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', portada.elaborado_por_id)
      .single()
    console.log('📋 Perfil encontrado:', prof)
    console.log('❌ Error al buscar perfil:', profError)
    elaboradoPorNombre = prof?.nombre ?? null
    console.log('✓ Nombre final:', elaboradoPorNombre)
  } else {
    console.log('⚠️ No hay elaborado_por_id en portada')
  }

  const esc = informe.escuelas as any
  const periodo = `${MESES[informe.periodo_mes - 1]} ${informe.periodo_anio}`

  // La URL del mapa se pasa directamente — la conversión a base64 se hace en el cliente
  const mapImageUrl: string | null = c1317?.mapa_url ?? null

  console.log('=== MAQR Data ===')
  console.log('maqr object:', maqr)
  console.log('maqrQuejas:', maqrQuejas)
  console.log('maqr.id:', maqr?.id)

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
    c1317, hsso, garo, pgr, mcear, pppi, maqr: maqr ? { ...maqr, quejas: maqrQuejas } : null, prt, cct, cumplimientoAmbiental,
    mapImageUrl,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Generar PDF</h1>
          <p className="text-slate-500 text-sm mt-1">{esc?.nombre} · {periodo}</p>
        </div>
        <Link
          href={`/informes/${id}`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          <FileText size={16} />
          Formularios de informe
        </Link>
      </div>
      <PdfLoader data={reportData} />
    </div>
  )
}
