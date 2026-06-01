import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json()
    const { empresa, escuela_id, periodo } = body

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener datos del dashboard
    const { data: escuelas } = await admin
      .from('escuelas')
      .select('*')
      .eq('etapa', 'Construcción')
      .eq('activa', true)

    const { data: informes } = await admin
      .from('informes')
      .select('*')

    // Filtrar datos según parámetros
    let escuelasFiltradas = escuelas || []
    if (empresa) {
      escuelasFiltradas = escuelasFiltradas.filter((e: any) => e.empresa_supervision === empresa)
    }
    if (escuela_id) {
      escuelasFiltradas = escuelasFiltradas.filter((e: any) => e.id === escuela_id)
    }

    const escuelaIds = new Set(escuelasFiltradas.map((e: any) => e.id))
    let informesFiltrados = (informes || []).filter((i: any) => escuelaIds.has(i.escuela_id))

    // Calcular KPIs
    const kpiConstruccion = escuelasFiltradas.length
    const kpiInformes = informesFiltrados.length
    const kpiPresentados = informesFiltrados.filter(
      (i: any) => i.estado === 'enviado' || i.estado === 'aprobado'
    ).length
    const kpiAprobados = informesFiltrados.filter((i: any) => i.estado === 'aprobado').length

    const escuelasConInforme = new Set(informesFiltrados.map((i: any) => i.escuela_id))
    const escuelasSinInforme = escuelasFiltradas.filter((e: any) => !escuelasConInforme.has(e.id))
    const kpiPendientes = escuelasSinInforme.length

    // Crear PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Encabezado
    doc.setFontSize(24)
    doc.setTextColor(30, 42, 69)
    doc.text('REPORTE DASHBOARD', pageWidth / 2, yPosition, { align: 'center' })

    yPosition += 10
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Período: ${periodo}`, pageWidth / 2, yPosition, { align: 'center' })

    if (empresa) {
      yPosition += 7
      doc.text(`Empresa: ${empresa}`, pageWidth / 2, yPosition, { align: 'center' })
    }

    yPosition += 15

    // Sección de KPIs
    doc.setFontSize(14)
    doc.setTextColor(30, 42, 69)
    doc.text('RESUMEN GENERAL', 20, yPosition)

    yPosition += 10
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    const kpiData = [
      ['Centros en Construcción', kpiConstruccion.toString()],
      ['Informes Total', kpiInformes.toString()],
      ['Informes Presentados', kpiPresentados.toString()],
      ['Informes Aprobados', kpiAprobados.toString()],
      ['Informes Pendientes', kpiPendientes.toString()],
    ]

    kpiData.forEach(([label, value]) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(10)
      doc.text(label as string, 20, yPosition)
      doc.setTextColor(30, 42, 69)
      doc.setFont('helvetica', 'bold')
      doc.text(value as string, pageWidth - 40, yPosition)
      doc.setFont('helvetica', 'normal')
      yPosition += 8
    })

    yPosition += 10

    // Tabla de escuelas pendientes
    if (escuelasSinInforme.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(30, 42, 69)
      doc.text('ESCUELAS SIN INFORME', 20, yPosition)

      yPosition += 10
      doc.setFontSize(9)

      const escuelasParaMostrar = escuelasSinInforme.slice(0, 15)
      escuelasParaMostrar.forEach((esc: any, idx: number) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(`${idx + 1}. ${esc.nombre || '-'}`, 20, yPosition)
        yPosition += 5
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`    ${esc.empresa_supervision || '-'}`, 20, yPosition)
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        yPosition += 5
      })
    }

    // Pie de página
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema SISCAS BCIE`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )

    // Descargar
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const filename = `Reporte-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
