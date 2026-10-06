import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function generarPDFCompleto(informe: any, supabase: any): Promise<Buffer> {
  try {
    const doc = new jsPDF()
    const MARGIN = 15
    const PAGE_WIDTH = 210
    const PAGE_HEIGHT = 297
    const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
    let y = MARGIN

    const NAVY = [15, 45, 82] as [number, number, number]
    const GOLD = [200, 169, 81] as [number, number, number]
    const GRAY = [100, 100, 100] as [number, number, number]

    const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
    const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''
    const fecha = new Date().toLocaleDateString('es-SV')

    // Portada ejecutiva
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, PAGE_WIDTH, 50, 'F')

    doc.setTextColor(...GOLD)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('PROGRAMA MI NUEVA ESCUELA', PAGE_WIDTH / 2, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text('INFORME MENSUAL DE SUPERVISIÓN', PAGE_WIDTH / 2, 32, { align: 'center' })

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    y = 65

    doc.text(`Centro Educativo: ${escuela?.nombre || 'N/A'}`, MARGIN, y)
    y += 8
    doc.text(`Código: ${escuela?.codigo || 'N/A'} | Período: ${mes} ${informe.periodo_anio}`, MARGIN, y)
    y += 8
    doc.text(`Estado: ${informe.estado.charAt(0).toUpperCase() + informe.estado.slice(1)} | Generado: ${fecha}`, MARGIN, y)

    // Obtener datos de todas las condiciones
    const condiciones = ['c1317', 'hsso', 'garo', 'pgr', 'mcear', 'pppi', 'maqr', 'prt', 'cct', 'cumplimiento_ambiental', 'casos_especiales']
    const datosCondiciones: Record<string, any> = {}

    for (const cond of condiciones) {
      const tabla = cond === 'c1317' ? 'informe_c1317' : `informe_${cond}`
      const { data } = await supabase.from(tabla).select('*').eq('informe_id', informe.id).single()
      if (data) datosCondiciones[cond] = data
    }

    // Agregar sección de resumen de condiciones completadas
    y += 15
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('RESUMEN DE CONDICIONES', MARGIN, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let condicionesCompletadas = 0
    const condicionesLabels: Record<string, string> = {
      'c1317': 'Generales del Informe', 'hsso': 'Higiene y Seguridad',
      'garo': 'Aguas Residuales', 'pgr': 'Gestión de Residuos',
      'mcear': 'Emisiones y Ruido', 'pppi': 'Partes Interesadas',
      'maqr': 'Mecanismo de Quejas', 'prt': 'Plan de Reubicación',
      'cct': 'Código de Conducta', 'cumplimiento_ambiental': 'Cumplimiento Ambiental',
      'casos_especiales': 'Casos Especiales'
    }

    Object.keys(datosCondiciones).forEach(cond => {
      if (datosCondiciones[cond]) {
        doc.text(`✓ ${condicionesLabels[cond] || cond}`, MARGIN + 5, y)
        condicionesCompletadas++
        y += 6
      }
    })

    doc.setTextColor(...GRAY)
    doc.setFontSize(8)
    y += 5
    doc.text(`Total: ${condicionesCompletadas}/${condiciones.length} condiciones completadas`, MARGIN, y)

    // Footer
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.text(`Página 1 | ${fecha}`, MARGIN, PAGE_HEIGHT - 8)

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
        const pdfBuffer = await generarPDFCompleto(informe, supabase)

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
