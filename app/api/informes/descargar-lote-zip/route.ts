import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import puppeteer from 'puppeteer'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function generarPDFCompleto(informe: any): Promise<Buffer | null> {
  let browser = null
  try {
    // Generar HTML del informe
    const html = generarHTMLInforme(informe)

    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    })

    const page = await browser.createPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: 20, bottom: 20, left: 20, right: 20 },
      displayHeaderFooter: true,
      footerTemplate: `<div style="font-size: 10px; width: 100%; text-align: center; color: #999;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
    })

    return Buffer.from(pdfBuffer)
  } catch (err) {
    console.error(`[PDF] Error generando PDF:`, err)
    return null
  } finally {
    if (browser) await browser.close()
  }
}

function generarHTMLInforme(informe: any): string {
  const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
  const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''
  const fecha = new Date().toLocaleDateString('es-SV')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .header { background: #0f2d52; color: white; padding: 30px; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { font-size: 12px; color: #c8a951; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: bold; color: #0f2d52; border-bottom: 2px solid #c8a951; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .info-item { border-left: 3px solid #c8a951; padding-left: 10px; }
        .info-label { font-size: 11px; color: #999; font-weight: bold; }
        .info-value { font-size: 13px; color: #333; font-weight: 500; margin-top: 3px; }
        .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
        .status-borrador { background: #fef3c7; color: #92400e; }
        .status-enviado { background: #bfdbfe; color: #1e40af; }
        .status-aprobado { background: #dcfce7; color: #166534; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PROGRAMA MI NUEVA ESCUELA</h1>
        <p>INFORME MENSUAL DE SUPERVISIÓN</p>
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DEL INFORME</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Centro Educativo</div>
            <div class="info-value">${escuela?.nombre || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Código</div>
            <div class="info-value">${escuela?.codigo || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Período</div>
            <div class="info-value">${mes} ${informe.periodo_anio}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Estado</div>
            <div class="info-value">
              <span class="status-badge status-${informe.estado}">
                ${informe.estado.charAt(0).toUpperCase() + informe.estado.slice(1)}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Departamento</div>
            <div class="info-value">${escuela?.departamento || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Empresa Contratista</div>
            <div class="info-value">${escuela?.empresa_obras || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Generado: ${fecha} | ID del Informe: ${informe.id}</p>
        <p>Este PDF contiene un resumen del informe mensual de supervisión del Programa Mi Nueva Escuela.</p>
      </div>
    </body>
    </html>
  `
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
        const pdfBuffer = await generarPDFCompleto(informe)

        if (!pdfBuffer) {
          console.warn(`No se pudo generar PDF para ${informe.id}`)
          fallidos++
          continue
        }

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
