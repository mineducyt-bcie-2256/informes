import { createClient } from '@/lib/supabase/client'

export async function fetchPRTData() {
  const supabase = createClient()

  try {
    // Obtener todos los informes con datos de escuelas
    const { data: informes, error: infError } = await supabase
      .from('informes')
      .select('id, periodo_mes, escuela_id, escuelas!inner(codigo, nombre)')

    if (infError) throw infError

    if (!informes || informes.length === 0) return []

    // Obtener todas las escuelas para mapear empresa de supervisión y empresa de obras
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
      const empresaData = escuelaMap[informe.escuela_id] || { supervision: '', obras: '' }

      if (prt?.lugares && Array.isArray(prt.lugares)) {
        const datosVirtual = prt.virtual || {}

        for (const lugar of prt.lugares) {
          const escuelaData = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas
          resultado.push({
            codigo: escuelaData?.codigo || '',
            centro: escuelaData?.nombre || '',
            supervision: empresaData.supervision,
            empresa_obras: empresaData.obras,
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
