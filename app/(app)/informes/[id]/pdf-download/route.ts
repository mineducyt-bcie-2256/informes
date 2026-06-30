import { redirect } from 'next/navigation'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Redirigir al endpoint que genera PDF binario
  redirect(`/api/informes/${id}/pdf`)
}
