import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const { data: informe, error: informeError } = await supabase
      .from('informes')
      .select(`
        *,
        escuelas(nombre, codigo, grupo_id, grupos(numero), departamento)
      `)
      .eq('id', id)
      .single()

    if (informeError || !informe) {
      return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
    }

    if (userProfile?.rol !== 'administrador' && userProfile?.rol !== 'programador') {
      if (informe.estado !== 'aprobado') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    // Generar PDF COMPLETO
    const pdfDoc = await generarPDFCompleto(informe, supabase)
    const pdfBuffer = pdfDoc.output('arraybuffer')

    const filename = `Informe_SCAS_${informe.escuelas?.codigo || 'CE'}_${informe.periodo_anio}${String(informe.periodo_mes).padStart(2, '0')}.pdf`

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error downloading PDF:', error)
    return NextResponse.json({ error: 'Error al descargar PDF' }, { status: 500 })
  }
}

async function generarPDFCompleto(informe: any, supabase: any): Promise<jsPDF> {
  const doc = new jsPDF()
  const MARGIN = 15
  const PAGE_WIDTH = 210
  const PAGE_HEIGHT = 297
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

  const NAVY = [15, 45, 82] as [number, number, number]
  const GOLD = [200, 169, 81] as [number, number, number]
  const GRAY = [100, 100, 100] as [number, number, number]

  const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
  const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''
  const fecha = new Date().toLocaleDateString('es-SV')

  // Obtener TODOS los datos de TODAS las condiciones
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
    supabase.from('informe_portada').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_c1317').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_hsso').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_garo').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_pgr').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_mcear').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_pppi').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_maqr').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_prt').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_cct').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_cumplimiento_ambiental').select('*').eq('informe_id', informe.id).single(),
    supabase.from('informe_casos_especiales').select('*').eq('informe_id', informe.id).single(),
  ])

  // PÁGINA 1: PORTADA
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PAGE_WIDTH, 80, 'F')

  doc.setTextColor(...GOLD)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PROGRAMA MI NUEVA ESCUELA', PAGE_WIDTH / 2, 25, { align: 'center' })

  doc.setFontSize(12)
  doc.text('INFORME MENSUAL DE SUPERVISIÓN', PAGE_WIDTH / 2, 40, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  let y = 100
  doc.text(escuela?.nombre?.toUpperCase() || 'N/A', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código ${escuela?.codigo || 'N/A'}`, PAGE_WIDTH / 2, y, { align: 'center' })
  y += 6
  doc.text(`${escuela?.departamento || ''} · JOCOAITIQUE`, PAGE_WIDTH / 2, y, { align: 'center' })

  // PÁGINA 2: RESUMEN EJECUTIVO
  doc.addPage()
  y = MARGIN

  doc.setTextColor(...NAVY)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', MARGIN, y)
  y += 12

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  const condicionesData = [
    { key: 'portada', label: 'Portada' },
    { key: 'c1317', label: 'Generales del Informe (C13-17)' },
    { key: 'hsso', label: 'Higiene, Salud y Seguridad (HSSO)' },
    { key: 'garo', label: 'Gestión de Aguas Residuales (GARO)' },
    { key: 'pgr', label: 'Plan de Gestión de Residuos (PGR)' },
    { key: 'mcear', label: 'Monitoreo de Emisiones (MCEAR)' },
    { key: 'pppi', label: 'Partes Interesadas (PPPI)' },
    { key: 'maqr', label: 'Quejas y Reclamos (MAQR)' },
    { key: 'prt', label: 'Reubicación Temporal (PRT)' },
    { key: 'cct', label: 'Código de Conducta (CCT)' },
    { key: 'cumplimientoAmbiental', label: 'Cumplimiento Ambiental' },
    { key: 'casosEspeciales', label: 'Casos Especiales' },
  ]

  const condicionesObj: Record<string, any> = { portada, c1317, hsso, garo, pgr, mcear, pppi, maqr, prt, cct, cumplimientoAmbiental, casosEspeciales }
  const condicionesCompletadas = condicionesData.filter(c => condicionesObj[c.key as keyof typeof condicionesObj]).length

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text(`Total: ${condicionesCompletadas}/${condicionesData.length} condiciones completadas`, MARGIN, y)
  y += 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('ESTADO DE CONDICIONES', MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.setFillColor(...NAVY)
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F')
  doc.text('Condición', MARGIN + 2, y + 4)
  doc.text('Estado', MARGIN + CONTENT_WIDTH - 30, y + 4)
  y += 7

  doc.setTextColor(0, 0, 0)
  condicionesData.forEach(cond => {
    const completado = condicionesObj[cond.key as keyof typeof condicionesObj]
    doc.setFillColor(completado ? 220 : 240, completado ? 250 : 240, completado ? 220 : 240)
    doc.rect(MARGIN, y, CONTENT_WIDTH, 5, 'F')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.text(cond.label, MARGIN + 2, y + 3.5)

    doc.setTextColor(completado ? 76 : 158, completado ? 175 : 158, completado ? 80 : 158)
    doc.setFont('helvetica', 'bold')
    doc.text(completado ? '✓ COMPLETADO' : 'PENDIENTE', MARGIN + CONTENT_WIDTH - 35, y + 3.5)
    doc.setFont('helvetica', 'normal')

    y += 6
  })

  // Agregar detalles de cada condición
  if (c1317) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('C13-17: GENERALES DEL INFORME', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${c1317.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (hsso) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('HSSO: HIGIENE, SALUD Y SEGURIDAD', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${hsso.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (garo) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('GARO: GESTIÓN DE AGUAS RESIDUALES', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${garo.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (pgr) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PGR: PLAN DE GESTIÓN DE RESIDUOS', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${pgr.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (mcear) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('MCEAR: MONITOREO DE EMISIONES', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${mcear.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (pppi) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PPPI: PARTES INTERESADAS', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${pppi.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (maqr) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('MAQR: QUEJAS Y RECLAMOS', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${maqr.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (prt) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PRT: REUBICACIÓN TEMPORAL', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${prt.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (cct) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CCT: CÓDIGO DE CONDUCTA', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${cct.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (cumplimientoAmbiental) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CUMPLIMIENTO AMBIENTAL', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${cumplimientoAmbiental.observaciones || 'N/A'}`, MARGIN, y)
  }

  if (casosEspeciales) {
    doc.addPage()
    y = MARGIN
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CASOS ESPECIALES', MARGIN, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Observaciones: ${casosEspeciales.observaciones || 'N/A'}`, MARGIN, y)
  }

  // Footer en todas las páginas
  const totalPages = (doc as any).internal.getNumberOfPages?.() || 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(`Programa Mi Nueva Escuela | ${fecha}`, MARGIN, PAGE_HEIGHT - 8)
    doc.text(`Página ${i}`, PAGE_WIDTH - MARGIN - 20, PAGE_HEIGHT - 8)
  }

  return doc
}
