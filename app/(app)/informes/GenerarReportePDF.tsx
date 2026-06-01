'use client'

import React from 'react'
import { Download } from 'lucide-react'

declare global {
  interface Window {
    html2pdf: any
  }
}

export function GenerarReportePDF({
  mes,
  estado,
  supervision,
  MESES,
}: {
  mes: string
  estado: string
  supervision: string
  MESES: string[]
}) {
  const [loading, setLoading] = React.useState(false)

  const generarPDF = async () => {
    setLoading(true)
    try {
      // Cargar la librería html2pdf
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'

      script.onload = () => {
        const dashboardElement = document.getElementById('dashboard-contenido')

        if (!dashboardElement) {
          console.error('Dashboard element not found')
          setLoading(false)
          return
        }

        // Clonar el elemento para no afectar el DOM original
        const clone = dashboardElement.cloneNode(true) as HTMLElement

        // Remover elementos que no queremos en el PDF (botones, etc)
        clone.querySelectorAll('button, .no-print').forEach(el => el.remove())

        // Configurar opciones del PDF
        const opt = {
          margin: 10,
          filename: `Dashboard-Informes-${mes ? MESES[parseInt(mes) - 1] : 'Todos'}-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        }

        window.html2pdf().set(opt).from(clone).save()
        setLoading(false)
      }

      document.head.appendChild(script)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generarPDF}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={16} />
      {loading ? 'Generando...' : 'Generar PDF'}
    </button>
  )
}
