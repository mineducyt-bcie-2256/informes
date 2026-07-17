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

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Navegar a la página PDF del informe con timeout mayor
    const response = await page.goto(`${baseUrl}/informes/${id}/pdf`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    })

    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${response?.status()}`)
    }

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
    })

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generado está vacío')
    }

    await browser.close()

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe_${id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error(`Error generando PDF para informe:`, error)
    if (browser) {
      await browser.close().catch(() => {})
    }
    return new Response(
      JSON.stringify({
        error: 'Error al generar PDF',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
