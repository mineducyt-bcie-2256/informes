import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de informe requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[PDF] Generando PDF para informe: ${id}`)

    // Cargar datos del informe desde Supabase
    const supabase = await createClient()

    const { data: informe, error: informeError } = await supabase
      .from('informes')
      .select('id, periodo_mes, periodo_anio, estado, escuelas(codigo, nombre, empresa_supervision)')
      .eq('id', id)
      .single()

    if (informeError || !informe) {
      throw new Error(`Informe no encontrado: ${informeError?.message}`)
    }

    // Crear PDF simple pero funcional con jsPDF
    const pdf = new jsPDF()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pageWidth = pdf.internal.pageSize.getWidth()
    let yPosition = 20

    const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas

    // Encabezado
    pdf.setFontSize(18)
    pdf.text('INFORME TÉCNICO', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    pdf.text(`Centro Educativo: ${escuela?.nombre || 'N/A'}`, 20, yPosition)
    yPosition += 8

    pdf.text(`Código: ${escuela?.codigo || 'N/A'}`, 20, yPosition)
    yPosition += 8

    pdf.text(`Período: ${informe.periodo_mes}/${informe.periodo_anio}`, 20, yPosition)
    yPosition += 8

    pdf.text(`Estado: ${informe.estado}`, 20, yPosition)
    yPosition += 15

    // Línea divisora
    pdf.setDrawColor(200)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10

    // Información básica
    pdf.setFontSize(12)
    pdf.text('Información General', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(9)
    const info = [
      `Escuela: ${escuela?.nombre || 'N/A'}`,
      `Código: ${escuela?.codigo || 'N/A'}`,
      `Supervisión: ${escuela?.empresa_supervision || 'N/A'}`,
      `Período: ${informe.periodo_mes}/${informe.periodo_anio}`,
      `Estado: ${informe.estado}`,
      `ID: ${informe.id}`,
    ]

    info.forEach((line) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.text(line, 20, yPosition)
      yPosition += 7
    })

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(128)
    pdf.text(
      `Generado: ${new Date().toLocaleString('es-SV')}`,
      20,
      pageHeight - 10
    )

    // Obtener PDF como buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    console.log(`[PDF] PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`)

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe_${id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error(`[PDF] Error:`, error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({
        error: 'Error al generar PDF',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
