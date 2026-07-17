'use client'
import { Download } from 'lucide-react'
import Link from 'next/link'

interface DescargarInformeBtnProps {
  informeId: string
  estado: string
}

export default function DescargarInformeBtn({ informeId, estado }: DescargarInformeBtnProps) {
  const isAprobado = estado === 'aprobado'

  if (!isAprobado) {
    return null
  }

  return (
    <Link
      href={`/informes/${informeId}/pdf?download=true`}
      className="text-green-600 hover:text-green-800 font-medium text-xs flex items-center gap-1 whitespace-nowrap"
    >
      <Download size={14} />
      Descargar
    </Link>
  )
}
