import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function generarPDFCompleto(informe: any, supabase: any): Promise<Buffer> {
  const doc = new jsPDF()
  const MARGIN = 15
  const PAGE_WIDTH = 210
  const PAGE_HEIGHT = 297
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

  const NAVY = [15, 45, 82] as [number, number, number]
  const GOLD = [200, 169, 81] as [number, number, number]
  const GRAY = [100, 100, 100] as [number, number, number]
  const GREEN = [76, 175, 80] as [number, number, number]

  const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
  const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''
  const fecha = new Date().toLocaleDateString('es-SV')

  // ===== OBTENER TODOS LOS DATOS DE TODAS LAS CONDICIONES =====
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

  // ===== PÁGINA 1: PORTADA =====
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

  // ===== PÁGINA 2: RESUMEN EJECUTIVO =====
  doc.addPage()
  y = MARGIN

  doc.setTextColor(...NAVY)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', MARGIN, y)
  y += 12

  // Datos principales
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

  // Métrica
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text(`Total: ${condicionesCompletadas}/${condicionesData.length} condiciones completadas`, MARGIN, y)
  y += 12

  // Tabla de estado
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
    if (completado) {
      doc.setFillColor(220, 250, 220)
    } else {
      doc.setFillColor(240, 240, 240)
    }
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

  // Pie de página
  const addFooter = () => {
    const totalPages = (doc as any).internal.getNumberOfPages?.() || 2
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...GRAY)
      doc.text(`Programa Mi Nueva Escuela | ${fecha}`, MARGIN, PAGE_HEIGHT - 8)
      doc.text(`Página ${i}`, PAGE_WIDTH - MARGIN - 20, PAGE_HEIGHT - 8)
    }
  }

  addFooter()

  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput as ArrayBuffer)
}

export async function POST(request: Request) {
  try {
    const { informe_ids } = await request.json()

    if (!informe_ids || !Array.isArray(informe_ids) || informe_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Se requiere una lista de IDs de informes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[ZIP] Generando ZIP con ${informe_ids.length} informes`)

    const supabase = await createClient()

    const { data: informes, error } = await supabase
      .from('informes')
      .select('id, periodo_mes, periodo_anio, estado, escuelas(codigo, nombre, empresa_supervision, departamento)')
      .in('id', informe_ids)

    if (error || !informes || informes.length === 0) {
      throw new Error(`No se encontraron informes: ${error?.message}`)
    }

    const zip = new JSZip()
    let generados = 0
    let fallidos = 0

    for (const informe of informes) {
      try {
        const pdfBuffer = await generarPDFCompleto(informe, supabase)

        const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
        const mes = String(informe.periodo_mes).padStart(2, '0')
        const nombre = `Informe_SCAS_${escuela?.codigo || 'CENTRO'}_${MESES_ARRAY[informe.periodo_mes - 1]}_${informe.periodo_anio}.pdf`

        zip.file(nombre, pdfBuffer)
        generados++
      } catch (err) {
        console.error(`Error generando PDF para ${informe.id}:`, err)
        fallidos++
      }
    }

    if (generados === 0) {
      throw new Error('No se pudieron generar PDFs')
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    console.log(`[ZIP] ZIP generado: ${generados} PDFs, ${fallidos} fallidos`)

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Informes_${new Date().toISOString().split('T')[0]}.zip"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error(`[ZIP] Error:`, error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({
        error: 'Error al generar ZIP',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
