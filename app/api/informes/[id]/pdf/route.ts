// Los PDFs bonitos (React-PDF) se generan en el cliente.
// Este endpoint no genera PDFs actualmente.
// Para descarga en lote, usa el flujo de popup windows que abre /informes/{id}/pdf?download=true

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return new Response(
    JSON.stringify({
      error: 'Este endpoint no está disponible',
      message: 'Use /informes/{id}/pdf para descargar PDFs. La descarga en lote abre ventanas que se auto-descargan.',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
