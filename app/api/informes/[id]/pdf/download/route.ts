import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Obtener informe
    const { data: informe, error: informeError } = await supabase
      .from('informes')
      .select('*, escuelas(nombre, codigo)')
      .eq('id', id)
      .single()

    if (informeError || !informe) {
      return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
    }

    // Generar PDF simple
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('INFORME DE SUPERVISIÓN', 20, 20)

    doc.setFontSize(12)
    doc.text(`Centro: ${informe.escuelas?.nombre || 'N/A'}`, 20, 40)
    doc.text(`Código: ${informe.escuelas?.codigo || 'N/A'}`, 20, 50)
    doc.text(`Período: ${informe.periodo_mes}/${informe.periodo_anio}`, 20, 60)
    doc.text(`Estado: ${informe.estado}`, 20, 70)

    const pdfBlob = doc.output('blob')
    const filename = `Informe_${informe.escuelas?.codigo}_${informe.periodo_anio}-${String(informe.periodo_mes).padStart(2, '0')}.pdf`

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
