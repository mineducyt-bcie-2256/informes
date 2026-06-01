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
      // Cargar html2pdf
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'

      script.onload = () => {
        const dashboardElement = document.getElementById('dashboard-completo')

        if (!dashboardElement) {
          console.error('Dashboard element not found')
          setLoading(false)
          return
        }

        // Clonar el elemento
        const clone = dashboardElement.cloneNode(true) as HTMLElement

        // Remover solo filtros y botones, mantener todo lo visual
        clone.querySelectorAll('form, .no-pdf').forEach(el => el.remove())

        // Configurar opciones del PDF
        const opt = {
          margin: 10,
          filename: `Reporte-Dashboard-${periodoLabel.split(' ')[0]}-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        }

        window.html2pdf().set(opt).from(clone).save()
        setLoading(false)
      }

      document.head.appendChild(script)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar reporte')
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
