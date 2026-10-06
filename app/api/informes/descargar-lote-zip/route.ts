import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import puppeteer from 'puppeteer'
import chromium from '@sparticuz/chromium'

const MESES_ARRAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function generarPDFCompleto(informe: any, supabase: any): Promise<Buffer> {
  let browser = null
  try {
    const escuela = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
    const mes = MESES_ARRAY[informe.periodo_mes - 1] || ''
    const fecha = new Date().toLocaleDateString('es-SV')

    // Obtener datos de condiciones
    const condiciones = ['c1317', 'hsso', 'garo', 'pgr', 'mcear', 'pppi', 'maqr', 'prt', 'cct']
    const datosCondiciones: Record<string, any> = {}

    for (const cond of condiciones) {
      const tabla = cond === 'c1317' ? 'informe_c1317' : `informe_${cond}`
      const { data } = await supabase.from(tabla).select('*').eq('informe_id', informe.id).single()
      if (data) datosCondiciones[cond] = data
    }

    // Generar HTML del informe
    const condicionesCompletadas = Object.keys(datosCondiciones).length
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #0f2d52; color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 24px; color: #c8a951; }
          .header h2 { font-size: 14px; margin-top: 10px; }
          .content { padding: 30px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 14px; font-weight: bold; color: #0f2d52; border-bottom: 2px solid #c8a951; padding-bottom: 8px; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .info-item { border-left: 3px solid #c8a951; padding-left: 10px; }
          .info-label { font-size: 10px; color: #999; font-weight: bold; }
          .info-value { font-size: 12px; color: #333; font-weight: 500; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .metric { background: #f0f0f0; padding: 15px; text-align: center; border-left: 3px solid #c8a951; }
          .metric-number { font-size: 24px; font-weight: bold; color: #0f2d52; }
          .metric-label { font-size: 10px; color: #999; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #0f2d52; color: white; padding: 10px; text-align: left; font-size: 11px; }
          td { border-bottom: 1px solid #ddd; padding: 10px; font-size: 10px; }
          .completed { color: #4caf50; font-weight: bold; }
          .pending { color: #999; }
          .footer { text-align: center; margin-top: 20px; font-size: 9px; color: #999; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <!-- PORTADA -->
        <div class="header">
          <h1>PROGRAMA MI NUEVA ESCUELA</h1>
          <h2>INFORME MENSUAL DE SUPERVISIÓN</h2>
        </div>

        <div class="content">
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
                <div class="info-value">${informe.estado.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <!-- RESUMEN EJECUTIVO -->
          <div class="section">
            <div class="section-title">RESUMEN EJECUTIVO</div>

            <div class="metrics">
              <div class="metric">
                <div class="metric-number">${condicionesCompletadas}</div>
                <div class="metric-label">Condiciones completadas</div>
              </div>
              <div class="metric">
                <div class="metric-number">0</div>
                <div class="metric-label">Accidentes registrados</div>
              </div>
              <div class="metric">
                <div class="metric-number">0</div>
                <div class="metric-label">Personas capacitadas</div>
              </div>
              <div class="metric">
                <div class="metric-number">0</div>
                <div class="metric-label">Quejas registradas</div>
              </div>
            </div>

            <div class="section-title">ESTADO DE CONDICIONES</div>
            <table>
              <thead>
                <tr>
                  <th>Condición</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Generales del Informe (C13-17)</td>
                  <td class="${datosCondiciones.c1317 ? 'completed' : 'pending'}">${datosCondiciones.c1317 ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Higiene, Salud y Seguridad (HSSO)</td>
                  <td class="${datosCondiciones.hsso ? 'completed' : 'pending'}">${datosCondiciones.hsso ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Gestión de Aguas Residuales (GARO)</td>
                  <td class="${datosCondiciones.garo ? 'completed' : 'pending'}">${datosCondiciones.garo ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Plan de Gestión de Residuos (PGR)</td>
                  <td class="${datosCondiciones.pgr ? 'completed' : 'pending'}">${datosCondiciones.pgr ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Monitoreo de Emisiones (MCEAR)</td>
                  <td class="${datosCondiciones.mcear ? 'completed' : 'pending'}">${datosCondiciones.mcear ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Partes Interesadas (PPPI)</td>
                  <td class="${datosCondiciones.pppi ? 'completed' : 'pending'}">${datosCondiciones.pppi ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Quejas y Reclamos (MAQR)</td>
                  <td class="${datosCondiciones.maqr ? 'completed' : 'pending'}">${datosCondiciones.maqr ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Reubicación Temporal (PRT)</td>
                  <td class="${datosCondiciones.prt ? 'completed' : 'pending'}">${datosCondiciones.prt ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
                <tr>
                  <td>Código de Conducta (CCT)</td>
                  <td class="${datosCondiciones.cct ? 'completed' : 'pending'}">${datosCondiciones.cct ? '✓ COMPLETADO' : 'PENDIENTE'}</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">DATOS DEL PROYECTO</div>
            <table>
              <tbody>
                <tr>
                  <td><strong>Centro educativo:</strong></td>
                  <td>${escuela?.nombre || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Código CE:</strong></td>
                  <td>${escuela?.codigo || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Departamento:</strong></td>
                  <td>${escuela?.departamento || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Empresa supervisión:</strong></td>
                  <td>${escuela?.empresa_supervision || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Programa Mi Nueva Escuela | ${fecha}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Usar Puppeteer con chromium
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.createPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      printBackground: true,
    })

    await page.close()

    return Buffer.from(pdfBuffer)
  } catch (err) {
    console.error(`[PDF] Error generando PDF:`, err)
    throw err
  } finally {
    if (browser) await browser.close()
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
