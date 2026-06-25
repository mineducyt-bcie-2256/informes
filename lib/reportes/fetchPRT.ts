import { createClient } from '@/lib/supabase/client'

export async function fetchPRTData() {
  const supabase = createClient()

  try {
    // Obtener todos los informes con datos de escuelas
    const { data: informes, error: infError } = await supabase
      .from('informes')
      .select('id, periodo_mes, escuela_id, escuelas(codigo, nombre)')

    if (infError) throw infError

    if (!informes || informes.length === 0) return []

    // Obtener todas las escuelas para mapear empresa de supervisión
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

      if (prt?.lugares && Array.isArray(prt.lugares)) {
        const datosVirtual = prt.virtual || {}

        for (const lugar of prt.lugares) {
          resultado.push({
            codigo: informe.escuelas?.codigo || '',
            centro: informe.escuelas?.nombre || '',
            supervision: empresaSupervision,
            modalidad: prt.modalidad || [],
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
            adecuaciones_costo: lugar.adec_costo || 0,
            periodo_mes: informe.periodo_mes,
          })
        }
      }
    }

    return resultado
  } catch (error) {
    console.error('Error fetching PRT data:', error)
    return []
  }
}
