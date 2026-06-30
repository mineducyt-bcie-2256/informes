import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { informe_ids } = await request.json()
    const supabase = await createClient()

    if (!informe_ids || informe_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No se especificaron informes' }), { status: 400 })
    }

    // Obtener informes con datos de escuelas
    const { data: informes } = await supabase
      .from('informes')
      .select('id, periodo_mes, periodo_anio, escuelas(codigo, nombre)')
      .in('id', informe_ids)
      .eq('estado', 'aprobado')

    if (!informes || informes.length === 0) {
      return new Response(JSON.stringify({ error: 'No se encontraron informes aprobados' }), { status: 404 })
    }

    // Retornar lista de informes con URLs de PDF
    const informesConURL = informes.map((inf: any) => ({
      id: inf.id,
      codigo: inf.escuelas?.codigo,
      nombre: inf.escuelas?.nombre,
      periodo_mes: inf.periodo_mes,
      periodo_anio: inf.periodo_anio,
      pdf_url: `/informes/${inf.id}/pdf-download`,
    }))

    return new Response(JSON.stringify(informesConURL), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error en descarga lote:', error)
    return new Response(JSON.stringify({ error: 'Error al procesar solicitud' }), { status: 500 })
  }
}
