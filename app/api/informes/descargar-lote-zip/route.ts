import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function generarPDFCompleto(informe: any): Buffer {
  try {
    const doc = new jsPDF()
    const MARGIN = 20
    const PAGE_WIDTH = 210
    const PAGE_HEIGHT = 297
    const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
    let y = MARGIN

    // Colores
    const NAVY = [15, 45, 82] as [number, number, number]
    const GOLD = [200, 169, 81] as [number, number, number]
    const GRAY = [100, 100, 100] as [number, number, number]

    // Header
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, PAGE_WIDTH, 40, 'F')

    doc.setTextColor(...GOLD)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PROGRAMA MI NUEVA ESCUELA', MARGIN, 15)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('INFORME MENSUAL DE SUPERVISIÓN', MARGIN, 28)

    y = 55

    // Título sección
    doc.setTextColor(...NAVY)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMACIÓN DEL INFORME', MARGIN, y)
    y += 10

    // Línea decorativa
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y - 2, MARGIN + CONTENT_WIDTH, y - 2)

    y += 8

    // Datos del informe
    const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
    const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const datos = [
      [`Centro Educativo: ${escuela?.nombre || 'N/A'}`, ''],
      [`Código: ${escuela?.codigo || 'N/A'}`, `Departamento: ${escuela?.departamento || 'N/A'}`],
      [`Período: ${mes} ${informe.periodo_anio}`, `Estado: ${informe.estado.toUpperCase()}`],
      [`Empresa Contratista: ${escuela?.empresa_obras || 'N/A'}`, `ID: ${informe.id}`],
    ]

    datos.forEach((row) => {
      doc.text(row[0], MARGIN, y)
      if (row[1]) {
        doc.text(row[1], MARGIN + CONTENT_WIDTH / 2, y)
      }
      y += 7
    })

    y += 10

    // Nota final
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...GRAY)
    doc.text('El PDF contiene un resumen del informe mensual de supervisión.', MARGIN, y)

    // Footer
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    const fecha = new Date().toLocaleDateString('es-SV')
    doc.text(`Generado: ${fecha}`, MARGIN, PAGE_HEIGHT - 10)
    doc.text(`Página 1`, PAGE_WIDTH / 2 - 10, PAGE_HEIGHT - 10)

    const pdfOutput = doc.output('arraybuffer') as ArrayBuffer
    return Buffer.from(pdfOutput)
  } catch (err) {
    console.error(`[PDF] Error generando PDF:`, err)
    throw err
  }
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
      .select('id, periodo_mes, periodo_anio, estado, escuelas(codigo, nombre, empresa_supervision)')
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
        const pdfBuffer = generarPDFCompleto(informe)

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
