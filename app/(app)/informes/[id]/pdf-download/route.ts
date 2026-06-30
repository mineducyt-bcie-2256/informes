import { redirect } from 'next/navigation'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Redirigir a la página PDF con un parámetro de descarga
  // El PdfViewer ya maneja la descarga automática
  redirect(`/informes/${id}/pdf?download=true`)
}
