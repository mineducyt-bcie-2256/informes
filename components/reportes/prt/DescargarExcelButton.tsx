'use client'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { fetchSitiosReubicacionConDetalles, exportarSitiosReubicacionExcel } from '@/lib/reportes/exportarSitiosReubicacion'

interface DescargarExcelButtonProps {
  supervision?: string
  empresaObras?: string
  mesDesde?: string
  mesHasta?: string
  codigo?: string
  centro?: string
}

export default function DescargarExcelButton({
  supervision = '',
  empresaObras = '',
  mesDesde = '',
  mesHasta = '',
  codigo = '',
  centro = ''
}: DescargarExcelButtonProps) {
  const [descargando, setDescargando] = useState(false)

  const handleDescargar = async () => {
    try {
      setDescargando(true)
      const datosCompletos = await fetchSitiosReubicacionConDetalles()

      let datosFiltrados = datosCompletos

      if (supervision) {
        datosFiltrados = datosFiltrados.filter(d =>
          d.supervision?.toLowerCase().includes(supervision.toLowerCase())
        )
      }
      if (empresaObras) {
        datosFiltrados = datosFiltrados.filter(d =>
          d.empresa_obras?.toLowerCase().includes(empresaObras.toLowerCase())
        )
      }
      if (mesDesde) {
        datosFiltrados = datosFiltrados.filter(d => d.periodo_mes >= parseInt(mesDesde))
      }
      if (mesHasta) {
        datosFiltrados = datosFiltrados.filter(d => d.periodo_mes <= parseInt(mesHasta))
      }
      if (codigo) {
        datosFiltrados = datosFiltrados.filter(d =>
          d.codigo?.toLowerCase().includes(codigo.toLowerCase())
        )
      }
      if (centro) {
        datosFiltrados = datosFiltrados.filter(d =>
          d.centro?.toLowerCase().includes(centro.toLowerCase())
        )
      }

      await exportarSitiosReubicacionExcel(datosFiltrados)
    } catch (error) {
      console.error('Error al descargar Excel:', error)
      alert('Error al descargar el archivo')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <button
      onClick={handleDescargar}
      disabled={descargando}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={18} />
      {descargando ? 'Descargando...' : 'Descargar Excel'}
    </button>
  )
}
