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

  const handleDescargar = () => {
    window.open(`/informes/${informeId}/pdf?download=true`, '_blank', 'width=800,height=600')
  }

  return (
    <button
      onClick={handleDescargar}
      type="button"
      className="text-green-600 hover:text-green-800 font-medium text-xs flex items-center gap-1 whitespace-nowrap"
    >
      <Download size={14} />
      Descargar
    </button>
  )
}
