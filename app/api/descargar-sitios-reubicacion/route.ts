import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { supervision, empresaObras, mesDesde, mesHasta, codigo, centro } = body

    const supabase = await createClient()

    // Obtener datos de sitios de reubicación
    const { data: informes } = await supabase
      .from('informes')
      .select('id, periodo_mes, escuela_id, escuelas!inner(codigo, nombre, departamento, distrito)')

    if (!informes || informes.length === 0) {
      return NextResponse.json({ error: 'No hay datos' }, { status: 404 })
    }

    const escuelaMap: Record<string, any> = {}
    const { data: allEscuelas } = await supabase
      .from('escuelas')
      .select('id, empresa_supervision, empresa_obras')

    allEscuelas?.forEach((esc: any) => {
      escuelaMap[esc.id] = {
        supervision: esc.empresa_supervision || '',
        obras: esc.empresa_obras || '',
      }
    })

    const informe_ids = informes.map((i: any) => i.id)
    const { data: prtData } = await supabase
      .from('informe_prt')
      .select('*')
      .in('informe_id', informe_ids)

    const datos: any[] = []

    for (const informe of informes) {
      const prt = prtData?.find((p: any) => p.informe_id === informe.id)
      const escuelaData = Array.isArray(informe.escuelas) ? informe.escuelas[0] : informe.escuelas

      if (prt?.lugares && Array.isArray(prt.lugares)) {
        for (const lugar of prt.lugares) {
          let prestamo = ''
          let alquiler = ''

          if (lugar.rubros && Array.isArray(lugar.rubros)) {
            lugar.rubros.forEach((rubro: any) => {
              if (rubro.nombre === 'Alquiler de lugar') {
                if (rubro.unidad === 'Alquiler') alquiler = rubro.activo ? 'Sí' : 'No'
                else if (rubro.unidad === 'Préstamo') prestamo = rubro.activo ? 'Sí' : 'No'
              }
            })
          }

          const adecuacionesActivas = lugar.adecuaciones
            ? Object.entries(lugar.adecuaciones)
                .filter(([_, adec]: [string, any]) => adec.activa)
                .map(([nombre]) => nombre)
                .join(', ')
            : ''

          datos.push({
            codigo: escuelaData?.codigo || '',
            centro: escuelaData?.nombre || '',
            departamento: escuelaData?.departamento || '',
            distrito: escuelaData?.distrito || '',
            sitio_reubicacion: lugar.direccion || '',
            prestamo,
            alquiler,
            adecuaciones: adecuacionesActivas,
            est_ninos: lugar.est_ninos || 0,
            est_ninas: lugar.est_ninas || 0,
            periodo_mes: informe.periodo_mes,
            supervision: escuelaMap[informe.escuela_id]?.supervision || '',
            empresa_obras: escuelaMap[informe.escuela_id]?.obras || '',
          })
        }
      }
    }

    // Aplicar filtros
    let datosFiltrados = datos

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
      datosFiltrados = datosFiltrados.filter(d => d.periodo_mes >= mesDesde)
    }
    if (mesHasta) {
      datosFiltrados = datosFiltrados.filter(d => d.periodo_mes <= mesHasta)
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

    // Generar Excel
    const XLSX = await import('xlsx')

    const datosFormato = datosFiltrados.map(row => ({
      'Código': row.codigo,
      'Centro Educativo': row.centro,
      'Departamento': row.departamento,
      'Distrito': row.distrito,
      'Sitio de Reubicación': row.sitio_reubicacion,
      'Préstamo': row.prestamo,
      'Alquiler': row.alquiler,
      'Adecuaciones': row.adecuaciones,
      'Est. Niños': row.est_ninos,
      'Est. Niñas': row.est_ninas,
    }))

    const ws = XLSX.utils.json_to_sheet(datosFormato)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sitios de Reubicación')

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Sitios_Reubicacion_PRT_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al generar Excel' }, { status: 500 })
  }
}
