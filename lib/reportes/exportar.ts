const XLSX = require('xlsx')

export function exportarExcel(datos: any[], nombreReporte: string) {
  // Preparar datos para Excel
  const datosFormato = datos.map(row => ({
    'Código': row.codigo,
    'Centro Educativo': row.centro,
    'Supervisión': row.supervision,
    'Modalidad': Array.isArray(row.modalidad) ? row.modalidad.join(', ') : row.modalidad,
    'Sitio de Reubicación': row.sitio_reubicacion,
    'Est. Niños (Presencial)': row.ninos,
    'Est. Niñas (Presencial)': row.ninas,
    'Total Est. (Presencial)': row.total_estudiantes,
    'Doc. Hombres (Presencial)': row.docentes_hombres,
    'Doc. Mujeres (Presencial)': row.docentes_mujeres,
    'Total Doc. (Presencial)': row.total_docentes,
    'Est. Niños (Virtual)': row.estudiantes_virtual_ninos,
    'Est. Niñas (Virtual)': row.estudiantes_virtual_ninas,
    'Doc. Hombres (Virtual)': row.docentes_virtual_hombres,
    'Doc. Mujeres (Virtual)': row.docentes_virtual_mujeres,
    'Condición de Uso': row.condicion_uso,
    'Costo Adecuaciones': row.adecuaciones_costo,
  }))

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(datosFormato)

  // Ajustar ancho de columnas
  const maxWidth = 25
  const colWidths = Object.keys(datosFormato[0] || {}).map(() => ({ wch: maxWidth }))
  ws['!cols'] = colWidths

  // Aplicar estilos básicos a encabezados
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1'
    if (!ws[address]) continue
    ws[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0ea5e9' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }

  // Crear workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')

  // Generar nombre del archivo
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `Reporte_${nombreReporte}_${timestamp}.xlsx`

  // Descargar
  XLSX.writeFile(wb, filename)
}
