'use client'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { MESES } from '@/types'

interface DescargarExcelControlProps {
  escuelas: any[]
  mapaInformes: Record<string, { id: string; estado: string }>
  mesDesde: number
  mesHasta: number
  anio: string
  supervision?: string
}

export default function DescargarExcelControl({
  escuelas,
  mapaInformes,
  mesDesde,
  mesHasta,
  anio,
  supervision,
}: DescargarExcelControlProps) {
  const [descargando, setDescargando] = useState(false)

  const handleDescargar = async () => {
    setDescargando(true)
    try {
      const XLSX = await import('xlsx')

      // Meses a incluir
      const mesesVisibles = Array.from({ length: 12 }, (_, i) => i + 1).filter(
        m => m >= mesDesde && m <= mesHasta
      )

      // Preparar datos para Excel
      const datosExcel = escuelas.map((esc: any) => {
        const fila: any = {
          'Grupo': esc.grupos?.numero ?? '?',
          'Código': esc.codigo,
          'Centro Educativo': esc.nombre,
          'Empresa Obras': esc.empresa_obras,
          'Contrato': esc.numero_contrato,
          'Empresa Supervisión': esc.empresa_supervision,
        }

        // Agregar columnas de meses
        mesesVisibles.forEach(m => {
          const cel = mapaInformes[`${esc.id}-${m}`]
          fila[MESES[m - 1]] = cel ? cel.estado : '-'
        })

        return fila
      })

      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(datosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Control Mensual')

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 8 },   // Grupo
        { wch: 12 },  // Código
        { wch: 35 },  // Centro Educativo
        { wch: 25 },  // Empresa Obras
        { wch: 12 },  // Contrato
        { wch: 30 },  // Empresa Supervisión
        ...mesesVisibles.map(() => ({ wch: 12 })), // Meses
      ]

      // Generar nombre de archivo
      let nombreArchivo = `Control_${anio}`
      if (mesDesde !== 1 || mesHasta !== 12) {
        nombreArchivo += `_${MESES[mesDesde - 1]}_${MESES[mesHasta - 1]}`
      }
      if (supervision) {
        nombreArchivo += `_${supervision.substring(0, 15)}`
      }
      nombreArchivo += '.xlsx'

      // Descargar
      XLSX.writeFile(wb, nombreArchivo)
    } catch (error) {
      console.error('Error descargando Excel:', error)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <button
      onClick={handleDescargar}
      disabled={descargando || escuelas.length === 0}
      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-slate-400 transition"
    >
      {descargando ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          <Download size={16} />
          Descargar Excel
        </>
      )}
    </button>
  )
}
