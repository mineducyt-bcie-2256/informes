import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/server'
import { MESES } from '@/types'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

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
      .select(`
        id, periodo_mes, periodo_anio, estado,
        escuelas(codigo, nombre, empresa_supervision),
        informe_c1317(descripcion_condicion),
        informe_hsso(descripcion_condicion),
        informe_prt(descripcion_condicion)
      `)
      .eq('id', id)
      .single()

    if (informeError || !informe) {
      throw new Error(`Informe no encontrado: ${informeError?.message}`)
    }

    // Crear PDF mejorado con jsPDF
    const pdf = new jsPDF()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pageWidth = pdf.internal.pageSize.getWidth()
    let yPosition = 20

    const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
    const mesNombre = MESES_ARRAY[informe.periodo_mes - 1] || `Mes ${informe.periodo_mes}`

    // ═══════════════════════════════════════════════════════════════
    // PORTADA
    // ═══════════════════════════════════════════════════════════════
    pdf.setFont('Helvetica', 'bold')
    pdf.setFontSize(24)
    pdf.setTextColor(15, 45, 82)
    pdf.text('INFORME TÉCNICO', pageWidth / 2, 40, { align: 'center' })

    pdf.setFont('Helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(64, 64, 64)
    pdf.text(`Plan Específico de Gestión Ambiental y Social - PEGAS`, pageWidth / 2, 55, { align: 'center' })

    // Línea divisora
    pdf.setDrawColor(200, 169, 81)
    pdf.setLineWidth(2)
    pdf.line(40, 65, pageWidth - 40, 65)

    yPosition = 85

    // Información del proyecto
    pdf.setFont('Helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(15, 45, 82)
    pdf.text('INFORMACIÓN DEL PROYECTO', 20, yPosition)
    yPosition += 10

    pdf.setFont('Helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(64, 64, 64)

    const projectInfo = [
      `Centro Educativo: ${escuela?.nombre || 'N/A'}`,
      `Código: ${escuela?.codigo || 'N/A'}`,
      `Supervisión: ${escuela?.empresa_supervision || 'N/A'}`,
      ``,
      `Período de Reporte: ${mesNombre} ${informe.periodo_anio}`,
      `Estado: ${informe.estado?.toUpperCase() || 'N/A'}`,
      ``,
      `Identificador: ${informe.id}`,
      `Generado: ${new Date().toLocaleString('es-SV')}`,
    ]

    projectInfo.forEach((line) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
      }
      if (line === '') {
        yPosition += 3
      } else {
        pdf.text(line, 20, yPosition)
        yPosition += 6
      }
    })

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN DE MÓDULOS
    // ═══════════════════════════════════════════════════════════════
    pdf.addPage()
    yPosition = 20

    pdf.setFont('Helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(15, 45, 82)
    pdf.text('MÓDULOS INCLUIDOS EN ESTE INFORME', 20, yPosition)
    yPosition += 12

    pdf.setFont('Helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(64, 64, 64)

    const modulos = [
      { nombre: 'Condiciones Generales', dato: informe.informe_c1317 },
      { nombre: 'Higiene y Seguridad Ocupacional (HSSO)', dato: informe.informe_hsso },
      { nombre: 'Plan de Reubicación Temporal (PRT)', dato: informe.informe_prt },
    ]

    modulos.forEach((mod) => {
      const status = mod.dato ? '✓ Completo' : '○ Pendiente'
      if (mod.dato) {
        pdf.setTextColor(22, 163, 74)
      } else {
        pdf.setTextColor(148, 163, 176)
      }
      pdf.text(`${status} - ${mod.nombre}`, 25, yPosition)
      yPosition += 7
    })

    // Footer en todas las páginas
    pdf.setFont('Helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(128, 128, 128)

    const totalPages = (pdf as any).internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      )
    }

    // Obtener PDF como buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    console.log(`[PDF] PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`)

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Informe_${informe.periodo_anio}${String(informe.periodo_mes).padStart(2, '0')}_${escuela?.codigo || 'CENTRO'}.pdf"`,
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
