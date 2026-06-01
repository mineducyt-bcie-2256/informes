'use client'

import React from 'react'
import { Download } from 'lucide-react'

declare global {
  interface Window {
    html2pdf: any
  }
}

export function PrintButton({
  periodoLabel,
  empresa,
  escuela_id,
}: {
  periodoLabel: string
  empresa?: string
  escuela_id?: string
}) {
  const [loading, setLoading] = React.useState(false)

  const generarReporte = async () => {
    setLoading(true)
    try {
      // Verificar que el elemento existe
      const dashboardElement = document.getElementById('dashboard-completo')
      if (!dashboardElement) {
        console.error('❌ Dashboard element with id="dashboard-completo" not found')
        alert('Error: No se encontró el contenido del dashboard. Intenta recargar la página.')
        setLoading(false)
        return
      }

      console.log('✓ Dashboard element found, cloning...')

      // Clonar el elemento
      const clone = dashboardElement.cloneNode(true) as HTMLElement

      // Remover filtros y botones, mantener todo lo visual
      clone.querySelectorAll('form, .no-pdf').forEach(el => el.remove())

      console.log('✓ Element cloned and cleaned')

      // Cargar html2pdf
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.crossOrigin = 'anonymous'

      script.onerror = () => {
        console.error('❌ Failed to load html2pdf.js from CDN')
        alert('Error: No se pudo cargar la librería de generación de PDF. Intenta de nuevo.')
        setLoading(false)
      }

      script.onload = () => {
        console.log('✓ html2pdf.js loaded successfully')

        if (!window.html2pdf) {
          console.error('❌ window.html2pdf is not available')
          alert('Error: Librería de PDF no disponible')
          setLoading(false)
          return
        }

        try {
          // Configurar opciones del PDF
          const opt = {
            margin: 10,
            filename: `Reporte-Dashboard-${periodoLabel.split(' ')[0]}-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
          }

          console.log('✓ Options configured, generating PDF...')

          window.html2pdf()
            .set(opt)
            .from(clone)
            .save()
            .then(() => {
              console.log('✓ PDF generated and download initiated')
              setLoading(false)
            })
            .catch((err: any) => {
              console.error('❌ Error during PDF generation:', err)
              alert('Error al generar el PDF. Intenta de nuevo.')
              setLoading(false)
            })
        } catch (err) {
          console.error('❌ Error in PDF generation process:', err)
          alert('Error al generar el PDF. Intenta de nuevo.')
          setLoading(false)
        }
      }

      document.head.appendChild(script)
      console.log('✓ Script appended to head, waiting for load...')
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('Error al generar reporte. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generarReporte}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Descargar reporte completo del dashboard en PDF"
    >
      <Download size={16} />
      {loading ? 'Generando...' : 'Generar Reporte'}
    </button>
  )
}
