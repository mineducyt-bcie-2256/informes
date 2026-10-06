import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function generarPDFProfesional(informe: any, supabase: any): Promise<Buffer> {
  const doc = new jsPDF()
  const MARGIN = 15
  const PAGE_WIDTH = 210
  const PAGE_HEIGHT = 297
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
  let y = MARGIN

  const NAVY = [15, 45, 82] as [number, number, number]
  const GOLD = [200, 169, 81] as [number, number, number]
  const GRAY = [80, 80, 80] as [number, number, number]

  const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
  const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''
  const fecha = new Date().toLocaleDateString('es-SV')

  // ===== PORTADA EJECUTIVA =====
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PAGE_WIDTH, 60, 'F')

  doc.setTextColor(...GOLD)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PROGRAMA MI NUEVA ESCUELA', PAGE_WIDTH / 2, 15, { align: 'center' })

  doc.setFontSize(11)
  doc.text('INFORME MENSUAL DE SUPERVISIÓN', PAGE_WIDTH / 2, 25, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  y = 75

  doc.text(`Centro Educativo: ${escuela?.nombre || 'N/A'}`, MARGIN, y)
  y += 8
  doc.text(`Código: ${escuela?.codigo || 'N/A'}`, MARGIN, y)
  y += 8
  doc.text(`Período: ${mes} ${informe.periodo_anio}`, MARGIN, y)
  y += 8
  doc.text(`Estado: ${informe.estado.charAt(0).toUpperCase() + informe.estado.slice(1)}`, MARGIN, y)
  y += 8
  doc.text(`Generado: ${fecha}`, MARGIN, y)

  // ===== OBTENER DATOS DE CONDICIONES =====
  const condiciones = ['c1317', 'hsso', 'garo', 'pgr', 'mcear', 'pppi', 'maqr', 'prt', 'cct']
  const datosCondiciones: Record<string, any> = {}

  for (const cond of condiciones) {
    const tabla = cond === 'c1317' ? 'informe_c1317' : `informe_${cond}`
    const { data } = await supabase.from(tabla).select('*').eq('informe_id', informe.id).single()
    if (data) datosCondiciones[cond] = data
  }

  // ===== PÁGINA 2: RESUMEN =====
  doc.addPage()
  y = MARGIN

  doc.setFillColor(240, 240, 240)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  doc.setTextColor(...NAVY)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', MARGIN, y)
  y += 10

  // Métricas
  doc.setFontSize(9)
  const condicionesCompletadas = Object.keys(datosCondiciones).length
  doc.text(`Condiciones Completadas: ${condicionesCompletadas}/9`, MARGIN, y)
  y += 6
  doc.text(`Centro: ${escuela?.nombre || 'N/A'}`, MARGIN, y)
  y += 6
  doc.text(`Período: ${mes} ${informe.periodo_anio}`, MARGIN, y)
  y += 6
  doc.text(`Estado: ${informe.estado}`, MARGIN, y)

  // Estado de condiciones
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.text('ESTADO DE CONDICIONES', MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const condicionesLabels: Record<string, string> = {
    'c1317': 'Generales del Informe (C13-17)',
    'hsso': 'Higiene, Salud y Seguridad (HSSO)',
    'garo': 'Gestión de Aguas Residuales (GARO)',
    'pgr': 'Plan de Gestión de Residuos (PGR)',
    'mcear': 'Monitoreo de Emisiones (MCEAR)',
    'pppi': 'Partes Interesadas (PPPI)',
    'maqr': 'Quejas y Reclamos (MAQR)',
    'prt': 'Reubicación Temporal (PRT)',
    'cct': 'Código de Conducta (CCT)'
  }

  condiciones.forEach(cond => {
    const estado = datosCondiciones[cond] ? 'COMPLETADO' : 'PENDIENTE'
    const color = datosCondiciones[cond] ? [76, 175, 80] : [158, 158, 158]
    doc.setTextColor(...color)
    doc.text(`✓ ${condicionesLabels[cond]}: ${estado}`, MARGIN, y)
    y += 5
  })

  // Información del proyecto
  y += 8
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DATOS DEL PROYECTO', MARGIN, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text(`Centro educativo: ${escuela?.nombre || 'N/A'}`, MARGIN, y)
  y += 5
  doc.text(`Código: ${escuela?.codigo || 'N/A'}`, MARGIN, y)
  y += 5
  doc.text(`Departamento: ${escuela?.departamento || 'N/A'}`, MARGIN, y)
  y += 5
  doc.text(`Empresa supervisión: ${escuela?.empresa_supervision || 'N/A'}`, MARGIN, y)

  // Footer en todas las páginas
  doc.setTextColor(...GRAY)
  doc.setFontSize(7)
  const addFooters = () => {
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.text(`Programa Mi Nueva Escuela | ${fecha}`, MARGIN, PAGE_HEIGHT - 8)
      doc.text(`Página ${i}`, PAGE_WIDTH - MARGIN - 20, PAGE_HEIGHT - 8)
    }
  }
  addFooters()

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
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

    // Obtener datos de todos los informes
    const { data: informes, error } = await supabase
      .from('informes')
      .select('id, periodo_mes, periodo_anio, estado, escuelas(codigo, nombre, empresa_supervision, departamento)')
      .in('id', informe_ids)

    if (error || !informes || informes.length === 0) {
      throw new Error(`No se encontraron informes: ${error?.message}`)
    }

    // Crear ZIP
    const zip = new JSZip()
    let generados = 0
    let fallidos = 0

    for (const informe of informes) {
      try {
        const pdfBuffer = await generarPDFProfesional(informe, supabase)

        const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
        const mes = String(informe.periodo_mes).padStart(2, '0')
        const nombre = `Informe_${informe.periodo_anio}${mes}_${escuela?.codigo || 'CENTRO'}_${escuela?.nombre?.substring(0, 20) || 'Educativo'}.pdf`

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

    // Generar ZIP
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    console.log(`[ZIP] ZIP generado: ${generados} PDFs, ${fallidos} fallidos, tamaño: ${zipBuffer.byteLength} bytes`)

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
