'use client'

import React from 'react'
import { Download } from 'lucide-react'

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
      const payload: any = { periodo: periodoLabel }
      if (empresa) payload.empresa = empresa
      if (escuela_id) payload.escuela_id = escuela_id

      const response = await fetch('/api/dashboard/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Error al generar reporte')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reporte-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generarReporte}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Descargar reporte del dashboard en PDF"
    >
      <Download size={16} />
      {loading ? 'Generando...' : 'Generar Reporte'}
    </button>
  )
}
