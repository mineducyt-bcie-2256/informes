import { createClient } from '@/lib/supabase/client'
import XLSX from 'xlsx'

export async function fetchSitiosReubicacionConDetalles() {
  const supabase = createClient()

  try {
    // Obtener todos los informes con datos de escuelas
    const { data: informes, error: infError } = await supabase
      .from('informes')
      .select('id, periodo_mes, escuela_id, escuelas!inner(codigo, nombre, departamento, distrito)')

    if (infError) throw infError
    if (!informes || informes.length === 0) return []

    // Obtener todas las escuelas
    const { data: allEscuelas } = await supabase
      .from('escuelas')
      .select('id, empresa_supervision, empresa_obras')

    const escuelaMap: Record<string, { supervision: string; obras: string }> = {}
    allEscuelas?.forEach((esc: any) => {
      escuelaMap[esc.id] = {
        supervision: esc.empresa_supervision || '',
        obras: esc.empresa_obras || ''
      }
    })

    // Obtener datos PRT
    const informe_ids = informes.map((i: any) => i.id)
    const { data: prtData } = await supabase
      .from('informe_prt')
      .select('*')
      .in('informe_id', informe_ids)

    // Procesar datos
    const resultado: any[] = []

    for (const informe of informes) {
      const prt = prtData?.find((p: any) => p.informe_id === informe.id)
      const escuelaData = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas

      if (prt?.lugares && Array.isArray(prt.lugares)) {
        for (const lugar of prt.lugares) {
          // Extraer información de rubros
          const rubrosMap: Record<string, any> = {}
          if (lugar.rubros && Array.isArray(lugar.rubros)) {
            lugar.rubros.forEach((rubro: any) => {
              rubrosMap[rubro.nombre] = rubro
            })
          }

          // Extraer adecuaciones activas
          const adecuacionesActivas = lugar.adecuaciones
            ? Object.entries(lugar.adecuaciones)
                .filter(([_, adec]: [string, any]) => adec.activa)
                .map(([nombre]) => nombre)
                .join(', ')
            : ''

          // Determinar condición de uso específica
          let condicionUso = lugar.condicion_uso || ''
          let prestamo = ''
          let alquiler = ''
          let energiaElectrica = ''
          let aguaPotable = ''
          let internet = ''
          let serviciosSanitarios = ''

          // Procesar rubros
          if (rubrosMap['Alquiler de lugar']) {
            const rubro = rubrosMap['Alquiler de lugar']
            if (rubro.unidad === 'Alquiler') {
              alquiler = rubro.activo ? 'Sí' : 'No'
            } else if (rubro.unidad === 'Préstamo') {
              prestamo = rubro.activo ? 'Sí' : 'No'
            }
          }

          if (rubrosMap['Energía eléctrica']) {
            energiaElectrica = rubrosMap['Energía eléctrica'].activo ? rubrosMap['Energía eléctrica'].unidad || 'Sí' : 'No'
          }

          if (rubrosMap['Agua potable']) {
            aguaPotable = rubrosMap['Agua potable'].activo ? rubrosMap['Agua potable'].unidad || 'Sí' : 'No'
          }

          if (rubrosMap['Internet']) {
            internet = rubrosMap['Internet'].activo ? rubrosMap['Internet'].unidad || 'Sí' : 'No'
          }

          if (rubrosMap['Servicios sanitarios']) {
            serviciosSanitarios = rubrosMap['Servicios sanitarios'].activo ? rubrosMap['Servicios sanitarios'].unidad || 'Sí' : 'No'
          }

          resultado.push({
            codigo: escuelaData?.codigo || '',
            centro: escuelaData?.nombre || '',
            departamento: escuelaData?.departamento || '',
            distrito: escuelaData?.distrito || '',
            sitio_reubicacion: lugar.direccion || '',
            condicion_uso: condicionUso,
            prestamo,
            alquiler,
            energia_electrica: energiaElectrica,
            agua_potable: aguaPotable,
            internet,
            servicios_sanitarios: serviciosSanitarios,
            adecuaciones: adecuacionesActivas,
            est_ninos: lugar.est_ninos || 0,
            est_ninas: lugar.est_ninas || 0,
            periodo_mes: informe.periodo_mes,
          })
        }
      }
    }

    return resultado
  } catch (error) {
    console.error('Error fetching sitios de reubicación:', error)
    return []
  }
}

export function exportarSitiosReubicacionExcel(datos: any[]) {
  // Preparar datos para Excel
  const datosFormato = datos.map(row => ({
    'Código': row.codigo,
    'Centro Educativo': row.centro,
    'Departamento': row.departamento,
    'Distrito': row.distrito,
    'Sitio de Reubicación': row.sitio_reubicacion,
    'Condición de Uso': row.condicion_uso,
    'Préstamo': row.prestamo,
    'Alquiler': row.alquiler,
    'Energía Eléctrica': row.energia_electrica,
    'Agua Potable': row.agua_potable,
    'Internet': row.internet,
    'Servicios Sanitarios': row.servicios_sanitarios,
    'Adecuaciones': row.adecuaciones,
    'Est. Niños': row.est_ninos,
    'Est. Niñas': row.est_ninas,
  }))

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(datosFormato)

  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 12 }, // Código
    { wch: 25 }, // Centro Educativo
    { wch: 18 }, // Departamento
    { wch: 18 }, // Distrito
    { wch: 35 }, // Sitio de Reubicación
    { wch: 15 }, // Condición de Uso
    { wch: 12 }, // Préstamo
    { wch: 12 }, // Alquiler
    { wch: 18 }, // Energía Eléctrica
    { wch: 15 }, // Agua Potable
    { wch: 12 }, // Internet
    { wch: 18 }, // Servicios Sanitarios
    { wch: 25 }, // Adecuaciones
    { wch: 12 }, // Est. Niños
    { wch: 12 }, // Est. Niñas
  ]
  ws['!cols'] = colWidths

  // Aplicar estilos a encabezados
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1'
    if (!ws[address]) continue
    ws[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0ea5e9' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    }
  }

  // Crear workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sitios de Reubicación')

  // Generar nombre del archivo
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `Sitios_Reubicacion_PRT_${timestamp}.xlsx`

  // Descargar
  XLSX.writeFile(wb, filename)
}
