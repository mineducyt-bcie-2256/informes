'use client'

import React from 'react'
import { Download } from 'lucide-react'

declare global {
  interface Window {
    html2canvas: any
    jsPDF: any
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
        console.error('❌ Dashboard element not found')
        alert('Error: No se encontró el contenido del dashboard.')
        setLoading(false)
        return
      }

      console.log('✓ Dashboard element found, loading libraries...')

      // Cargar html2canvas y jsPDF
      const html2canvasScript = document.createElement('script')
      html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      html2canvasScript.crossOrigin = 'anonymous'

      const jsPDFScript = document.createElement('script')
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      jsPDFScript.crossOrigin = 'anonymous'

      let scriptsLoaded = 0
      const checkBothLoaded = () => {
        scriptsLoaded++
        if (scriptsLoaded === 2) {
          generatePDF()
        }
      }

      html2canvasScript.onload = checkBothLoaded
      jsPDFScript.onload = checkBothLoaded

      html2canvasScript.onerror = () => {
        console.error('❌ Failed to load html2canvas')
        alert('Error cargando librería de captura.')
        setLoading(false)
      }

      jsPDFScript.onerror = () => {
        console.error('❌ Failed to load jsPDF')
        alert('Error cargando librería de PDF.')
        setLoading(false)
      }

      document.head.appendChild(html2canvasScript)
      document.head.appendChild(jsPDFScript)

      const generatePDF = async () => {
        try {
          console.log('✓ Libraries loaded, capturing dashboard...')

          const dashboardElement = document.getElementById('dashboard-completo')
          if (!dashboardElement) {
            alert('Error: elemento no encontrado')
            setLoading(false)
            return
          }

          // Crear un contenedor temporal sin formularios
          const tempContainer = document.createElement('div')
          const clone = dashboardElement.cloneNode(true) as HTMLElement
          clone.querySelectorAll('form, .no-pdf').forEach(el => el.remove())
          tempContainer.appendChild(clone)
          tempContainer.style.position = 'absolute'
          tempContainer.style.left = '-9999px'
          tempContainer.style.width = dashboardElement.offsetWidth + 'px'
          document.body.appendChild(tempContainer)

          // Reemplazar colores LAB() con equivalentes RGB para compatibilidad
          console.log('✓ Fixing LAB colors...')
          const allElements = clone.querySelectorAll('*')
          allElements.forEach((el: any) => {
            const style = window.getComputedStyle(el)
            const bgColor = style.backgroundColor
            const color = style.color
            const borderColor = style.borderColor

            // Reemplazar colores LAB en background
            if (bgColor && bgColor.includes('lab(')) {
              ;(el as HTMLElement).style.backgroundColor = '#f5f5f5'
            }
            // Reemplazar colores LAB en text
            if (color && color.includes('lab(')) {
              ;(el as HTMLElement).style.color = '#333333'
            }
            // Reemplazar colores LAB en border
            if (borderColor && borderColor.includes('lab(')) {
              ;(el as HTMLElement).style.borderColor = '#cccccc'
            }
          })

          // Capturar con html2canvas
          const canvas = await window.html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff',
            foreignObjectRendering: true,
          })

          console.log('✓ Dashboard captured, generating PDF...')

          // Crear PDF con jsPDF
          const { jsPDF } = window
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          })

          const imgData = canvas.toDataURL('image/jpeg', 0.98)
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const imgWidth = pageWidth - 20 // 10mm margen en cada lado
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 10 // margen superior

          // Primera página
          pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
          heightLeft -= pageHeight - 20

          // Páginas adicionales si es necesario
          while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10
            pdf.addPage()
            pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
            heightLeft -= pageHeight - 20
          }

          // Descargar
          const filename = `Reporte-Dashboard-${periodoLabel.split(' ')[0]}-${new Date().toISOString().split('T')[0]}.pdf`
          pdf.save(filename)

          console.log('✓ PDF generated and download initiated')

          // Limpiar
          document.body.removeChild(tempContainer)
          setLoading(false)
        } catch (err) {
          console.error('❌ Error generating PDF:', err)
          alert('Error al generar el PDF. Intenta de nuevo.')
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('Error al generar reporte.')
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
