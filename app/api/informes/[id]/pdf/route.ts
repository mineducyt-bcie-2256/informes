import puppeteer from 'puppeteer'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Renderizar la página PDF a PDF binario
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Navegar a la página PDF del informe
    await page.goto(`${baseUrl}/informes/${id}/pdf`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

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

    await browser.close()

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="informe.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return new Response(JSON.stringify({ error: 'Error al generar PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
