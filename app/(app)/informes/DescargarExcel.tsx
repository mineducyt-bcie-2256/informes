'use client'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { MESES } from '@/types'

interface DescargarExcelProps {
  informes: any[]
  filtros: {
    mes?: string
    anio?: string
    estado?: string
    supervision?: string
  }
}

export default function DescargarExcel({ informes, filtros }: DescargarExcelProps) {
  const [descargando, setDescargando] = useState(false)

  const handleDescargar = async () => {
    setDescargando(true)
    try {
      const XLSX = await import('xlsx')

      // Preparar datos para Excel
      const datosExcel = informes.map((inf: any) => ({
        'Centro Educativo': inf.escuelas?.nombre ?? '-',
        'Código': inf.escuelas?.codigo ?? '-',
        'Supervisión': inf.escuelas?.empresa_supervision ?? '-',
        'Grupo': inf.escuelas?.grupos?.numero ?? '?',
        'Período': `${MESES[inf.periodo_mes - 1]} ${inf.periodo_anio}`,
        'Estado': inf.estado,
      }))

      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(datosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Informes')

      // Ajustar ancho de columnas
      const maxWidth = (str: string) => Math.min(str.length + 2, 50)
      ws['!cols'] = [
        { wch: maxWidth('Centro Educativo') },
        { wch: maxWidth('Código') },
        { wch: maxWidth('Supervisión') },
        { wch: maxWidth('Grupo') },
        { wch: maxWidth('Período') },
        { wch: maxWidth('Estado') },
      ]

      // Generar nombre de archivo
      let nombreArchivo = 'Informes'
      if (filtros.mes) nombreArchivo += `_${MESES[parseInt(filtros.mes) - 1]}`
      if (filtros.anio) nombreArchivo += `_${filtros.anio}`
      if (filtros.supervision) nombreArchivo += `_${filtros.supervision.substring(0, 10)}`
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
      disabled={descargando || informes.length === 0}
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
