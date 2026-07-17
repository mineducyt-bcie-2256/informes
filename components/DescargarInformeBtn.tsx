'use client'
import { Download } from 'lucide-react'

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
    <a
      href={`/api/informes/${informeId}/pdf/download`}
      download
      type="button"
      className="text-green-600 hover:text-green-800 font-medium text-xs flex items-center gap-1 whitespace-nowrap"
    >
      <Download size={14} />
      Descargar
    </a>
  )
}
