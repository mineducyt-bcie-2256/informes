'use client'
import { Download } from 'lucide-react'
import { useState } from 'react'

interface DescargarInformeBtnProps {
  informeId: string
  estado: string
}

export default function DescargarInformeBtn({ informeId, estado }: DescargarInformeBtnProps) {
  const isAprobado = estado === 'aprobado'
  const [loading, setLoading] = useState(false)

  const handleDescargar = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/informes/${informeId}/pdf/descargar`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Error al descargar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Informe_${informeId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error descargando PDF:', error)
      alert('Error al descargar el PDF')
    } finally {
      setLoading(false)
    }
  }

  if (!isAprobado) {
    return null
  }

  return (
    <button
      onClick={handleDescargar}
      disabled={loading}
      className="text-green-600 hover:text-green-800 font-medium text-xs flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
    >
      <Download size={14} />
      {loading ? 'Descargando...' : 'Descargar'}
    </button>
  )
}
