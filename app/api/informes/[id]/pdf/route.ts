import puppeteer from 'puppeteer'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let browser
  try {
    const { id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de informe requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[PDF] Iniciando generación de PDF para informe: ${id}`)

    const browserOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    }

    browser = await puppeteer.launch(browserOptions)
    const page = await browser.newPage()

    // Configurar viewport
    await page.setViewport({ width: 1280, height: 800 })

    // Aumentar timeout de ejecución JS
    page.setDefaultTimeout(90000)
    page.setDefaultNavigationTimeout(90000)

    console.log(`[PDF] Navegando a ${baseUrl}/informes/${id}/pdf`)

    // Navegar a la página PDF del informe
    let response
    try {
      response = await page.goto(`${baseUrl}/informes/${id}/pdf`, {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      })
    } catch (navError) {
      console.error(`[PDF] Error de navegación:`, navError)
      throw new Error(`No se pudo cargar la página: ${navError instanceof Error ? navError.message : String(navError)}`)
    }

    if (!response) {
      throw new Error('No response from page.goto')
    }

    console.log(`[PDF] Página cargada, status: ${response.status()}`)

    // Esperar un poco a que se cargue todo el contenido
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generar PDF
    console.log(`[PDF] Generando PDF...`)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm',
      },
      timeout: 30000,
    })

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generado está vacío')
    }

    console.log(`[PDF] PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`)

    await browser.close()

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe_${id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error(`[PDF] Error generando PDF:`, error)
    if (browser) {
      await browser.close().catch((e) => console.error('[PDF] Error cerrando browser:', e))
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[PDF] Mensaje de error: ${errorMessage}`)

    return new Response(
      JSON.stringify({
        error: 'Error al generar PDF',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
