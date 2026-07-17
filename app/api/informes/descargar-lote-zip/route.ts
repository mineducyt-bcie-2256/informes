import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function generarPDF(informe: any): Buffer {
  const pdf = new jsPDF()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const pageWidth = pdf.internal.pageSize.getWidth()
  let yPosition = 20

  const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
  const mesNombre = MESES_ARRAY[informe.periodo_mes - 1] || `Mes ${informe.periodo_mes}`

  // PORTADA
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(15, 45, 82)
  pdf.text('PROGRAMA MI NUEVA ESCUELA', pageWidth / 2, 30, { align: 'center' })

  pdf.setFontSize(16)
  pdf.text('INFORME MENSUAL DE SUPERVISIÓN', pageWidth / 2, 45, { align: 'center' })

  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(200, 169, 81)
  pdf.text('Implementación de condiciones ambientales y sociales', pageWidth / 2, 58, { align: 'center' })
  pdf.text('Etapa de construcción', pageWidth / 2, 65, { align: 'center' })
  pdf.text('Plan Específico de Gestión Ambiental y Social — PEGAS', pageWidth / 2, 72, { align: 'center' })

  // Línea divisora
  pdf.setDrawColor(200, 169, 81)
  pdf.setLineWidth(2)
  pdf.line(30, 80, pageWidth - 30, 80)

  yPosition = 95

  // INFORMACIÓN DEL CENTRO
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(15, 45, 82)
  pdf.text('Centro Educativo', 20, yPosition)
  yPosition += 8

  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(64, 64, 64)
  pdf.text(escuela?.nombre || 'N/A', 25, yPosition)
  yPosition += 6

  pdf.setFontSize(8)
  pdf.setTextColor(120, 120, 120)
  pdf.text(`Código: ${escuela?.codigo || 'N/A'}`, 25, yPosition)
  yPosition += 5
  pdf.text(`Supervisión: ${escuela?.empresa_supervision || 'N/A'}`, 25, yPosition)
  yPosition += 12

  // Línea
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 8

  // INFORMACIÓN DEL PROYECTO
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(15, 45, 82)
  pdf.text('Información del Proyecto', 20, yPosition)
  yPosition += 8

  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(64, 64, 64)

  const projectInfo = [
    `Proyecto: Préstamo BCIE No. 2256-SV`,
    `Código de proyecto: No. 7800`,
    `Programa: mi Nueva Escuela de El Salvador`,
    `Período: ${mesNombre} ${informe.periodo_anio}`,
    `Estado: ${informe.estado?.toUpperCase() || 'N/A'}`,
  ]

  projectInfo.forEach((line) => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = 20
    }
    pdf.text(line, 25, yPosition)
    yPosition += 5
  })

  // Footer
  yPosition = pageHeight - 10
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(150, 150, 150)
  pdf.text(
    `Generado: ${new Date().toLocaleString('es-SV')} | ID: ${informe.id}`,
    20,
    yPosition
  )

  return Buffer.from(pdf.output('arraybuffer'))
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
        const pdfBuffer = generarPDF(informe)
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
