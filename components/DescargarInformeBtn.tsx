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
      const response = await fetch(`/api/informes/${informeId}/pdf/data`)
      if (!response.ok) throw new Error('Error al obtener datos del informe')
      const data = await response.json()

      const [{ pdf }, { InformePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/app/(app)/informes/[id]/pdf/PdfViewer'),
      ])
      const blob = await pdf(<InformePDF data={data} />).toBlob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const codigo = data.esc?.codigo || 'CENTRO'
      const mes = String(data.informe.periodo_mes).padStart(2, '0')
      a.href = url
      a.download = `Informe_SCAS_${codigo}_${data.informe.periodo_anio}${mes}.pdf`
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
