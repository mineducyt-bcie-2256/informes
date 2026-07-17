import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

// Helper para generar PDF profesional
function generarPDF(informe: any): jsPDF {
  const doc = new jsPDF()
  const MARGIN = 20
  const PAGE_WIDTH = 210
  const PAGE_HEIGHT = 297
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
  let y = MARGIN

  // Colores
  const NAVY = '#0f2d52'
  const GOLD = '#c8a951'

  // Header
  doc.setFillColor(15, 45, 82)
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F')

  doc.setTextColor(200, 169, 81)
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('PROGRAMA MI NUEVA ESCUELA', MARGIN, 15)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.text('INFORME MENSUAL DE SUPERVISIÓN', MARGIN, 28)

  y = 60

  // Título
  doc.setTextColor(15, 45, 82)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('DATOS DEL INFORME', MARGIN, y)
  y += 15

  // Datos
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  const datos = [
    [`Centro Educativo: ${informe.escuelas?.nombre || 'N/A'}`, ''],
    [`Código: ${informe.escuelas?.codigo || 'N/A'}`, `Estado: ${informe.estado}`],
    [`Período: ${informe.periodo_mes}/${informe.periodo_anio}`, `BCIE Proyecto 7800`],
    [`Informe ID: ${informe.id}`, `Fecha: ${new Date().toLocaleDateString('es-SV')}`],
  ]

  datos.forEach((row) => {
    doc.text(row[0], MARGIN, y)
    if (row[1]) {
      doc.text(row[1], MARGIN + CONTENT_WIDTH / 2, y)
    }
    y += 10
  })

  y += 10

  // Nota
  doc.setFontSize(9)
  doc.setFont(undefined, 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text('El PDF incluye portada ejecutiva, resumen, generales y todas las condiciones registradas.', MARGIN, y)

  // Footer
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleString('es-SV')}`, MARGIN, PAGE_HEIGHT - 10)
  doc.text(`Página 1`, PAGE_WIDTH / 2 - 10, PAGE_HEIGHT - 10)

  return doc
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Obtener informe completo
    const { data: informe, error: informeError } = await supabase
      .from('informes')
      .select(`
        *,
        escuelas(nombre, codigo, grupo_id, grupos(numero))
      `)
      .eq('id', id)
      .single()

    if (informeError || !informe) {
      return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
    }

    // Generar PDF
    const doc = generarPDF(informe)
    const pdfBlob = doc.output('blob')

    const filename = `Informe_${informe.escuelas?.codigo || 'CE'}_${informe.periodo_anio}-${String(informe.periodo_mes).padStart(2, '0')}.pdf`

    return new NextResponse(pdfBlob, {
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
