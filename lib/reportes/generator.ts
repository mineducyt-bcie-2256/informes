import { createClient } from '@/lib/supabase/client'

const XLSX = require('xlsx')

interface GenerateReportExcelParams {
  section: string
  columns: string[]
  filters: Record<string, string>
}

export async function generateReportExcel({
  section,
  columns,
  filters,
}: GenerateReportExcelParams) {
  const supabase = createClient()

  // Obtener datos según la sección
  let data: any[] = []

  if (section === 'prt') {
    data = await fetchPRTData(supabase, filters)
  } else if (section === 'ppi') {
    data = await fetchPPIData(supabase, filters)
  } else if (section === 'hsso') {
    data = await fetchHSSOData(supabase, filters)
  } else if (section === 'garo') {
    data = await fetchGAROData(supabase, filters)
  } else if (section === 'pgr') {
    data = await fetchPGRData(supabase, filters)
  } else if (section === 'cumplimiento') {
    data = await fetchCumplimientoData(supabase, filters)
  }

  // Filtrar columnas
  const filteredData = data.map(row => {
    const filtered: Record<string, any> = {}
    columns.forEach(col => {
      filtered[col] = row[col]
    })
    return filtered
  })

  // Crear Excel
  const ws = XLSX.utils.json_to_sheet(filteredData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, section.toUpperCase())

  // Ajustar ancho de columnas
  const colWidths = columns.map(() => ({ wch: 20 }))
  ws['!cols'] = colWidths

  // Generar nombre del archivo
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `Reporte_${section.toUpperCase()}_${timestamp}.xlsx`

  // Descargar
  XLSX.writeFile(wb, filename)
}

async function fetchPRTData(supabase: any, filters: Record<string, string>) {
  const { mes, supervision, escuela } = filters

  // Obtener informes
  let query = supabase
    .from('informes')
    .select('id, periodo_mes, escuela_id, escuelas(codigo, nombre)')

  if (mes) {
    query = query.eq('periodo_mes', parseInt(mes))
  }

  const { data: informes } = await query

  if (!informes || informes.length === 0) return []

  // Obtener todas las escuelas
  const { data: allEscuelas } = await supabase
    .from('escuelas')
    .select('id, empresa_supervision')

  const escuelaMap: Record<string, string> = {}
  allEscuelas?.forEach((esc: any) => {
    escuelaMap[esc.id] = esc.empresa_supervision
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
    const empresaSupervision = escuelaMap[informe.escuela_id] || ''

    // Filtros adicionales
    if (supervision && !empresaSupervision.toLowerCase().includes(supervision.toLowerCase())) {
      continue
    }
    if (escuela && !informe.escuelas?.nombre.toLowerCase().includes(escuela.toLowerCase())) {
      continue
    }

    if (prt?.lugares && Array.isArray(prt.lugares)) {
      const datosVirtual = prt.virtual || {}

      for (const lugar of prt.lugares) {
        resultado.push({
          codigo: informe.escuelas?.codigo || '',
          centro: informe.escuelas?.nombre || '',
          supervision: empresaSupervision,
          modalidad: Array.isArray(prt.modalidad) ? prt.modalidad.join(', ') : prt.modalidad || '',
          sitio_reubicacion: lugar.direccion || lugar.nombre || '',
          ninos: lugar.est_ninos || 0,
          ninas: lugar.est_ninas || 0,
          total_estudiantes: (lugar.est_ninos || 0) + (lugar.est_ninas || 0),
          docentes_hombres: lugar.doc_hombres || 0,
          docentes_mujeres: lugar.doc_mujeres || 0,
          total_docentes: (lugar.doc_hombres || 0) + (lugar.doc_mujeres || 0),
          estudiantes_virtual_ninos: datosVirtual.est_ninos || 0,
          estudiantes_virtual_ninas: datosVirtual.est_ninas || 0,
          docentes_virtual_hombres: datosVirtual.doc_hombres || 0,
          docentes_virtual_mujeres: datosVirtual.doc_mujeres || 0,
          condicion_uso: lugar.condicion_uso || '',
        })
      }
    }
  }

  return resultado
}

async function fetchPPIData(supabase: any, filters: Record<string, string>) {
  // Implementar según estructura de PPI en BD
  return []
}

async function fetchHSSOData(supabase: any, filters: Record<string, string>) {
  // Implementar según estructura de HSSO en BD
  return []
}

async function fetchGAROData(supabase: any, filters: Record<string, string>) {
  // Implementar según estructura de GARO en BD
  return []
}

async function fetchPGRData(supabase: any, filters: Record<string, string>) {
  // Implementar según estructura de PGR en BD
  return []
}

async function fetchCumplimientoData(supabase: any, filters: Record<string, string>) {
  // Implementar según estructura de Cumplimiento en BD
  return []
}
