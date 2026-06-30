import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { generatePDF } from '@/lib/pdf/generatePDF'

export async function POST(request: Request) {
  try {
    const { informe_ids } = await request.json()
    const supabase = await createClient()

    if (!informe_ids || informe_ids.length === 0) {
      return new Response('No se especificaron informes', { status: 400 })
    }

    // Obtener informes con datos de escuelas
    const { data: informes } = await supabase
      .from('informes')
      .select('id, periodo_mes, periodo_anio, escuelas(codigo, nombre)')
      .in('id', informe_ids)

    if (!informes || informes.length === 0) {
      return new Response('No se encontraron informes', { status: 404 })
    }

    // Crear ZIP
    const zip = new JSZip()

    // Generar PDF para cada informe
    for (const informe of informes) {
      try {
        // Cargar los 12 formularios
        const [
          { data: portada },
          { data: c1317 },
          { data: hsso },
          { data: garo },
          { data: pgr },
          { data: mcear },
          { data: pppi },
          { data: maqr },
          { data: prt },
          { data: cct },
          { data: cumplimientoAmbiental },
          { data: casosEspeciales },
        ] = await Promise.all([
          supabase.from('informe_portada').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_c1317').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_hsso').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_garo').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_pgr').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_mcear').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_pppi').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_maqr').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_prt').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_cct').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_cumplimiento_ambiental').select('*').eq('informe_id', informe.id).single(),
          supabase.from('informe_casos_especiales').select('*').eq('informe_id', informe.id).single(),
        ])

        // Cargar quejas de MAQR si existe
        let maqrQuejas: any[] = []
        if (maqr?.id) {
          const { data: quejas } = await supabase
            .from('informe_maqr_quejas')
            .select('*')
            .eq('informe_maqr_id', maqr.id)
          maqrQuejas = quejas || []
        }

        // Generar PDF
        const pdfBuffer = await generatePDF({
          informe,
          portada,
          c1317,
          hsso,
          garo,
          pgr,
          mcear,
          pppi,
          maqr,
          maqrQuejas,
          prt,
          cct,
          cumplimientoAmbiental,
          casosEspeciales,
        })

        // Nombre del archivo
        const mes = String(informe.periodo_mes).padStart(2, '0')
        const nombre = `Informe_${informe.periodo_anio}${mes}_${informe.escuelas?.codigo}_${informe.escuelas?.nombre}.pdf`

        // Agregar al ZIP
        zip.file(nombre, pdfBuffer)
      } catch (err) {
        console.error(`Error generando PDF para ${informe.id}:`, err)
        // Continuar con el siguiente informe
      }
    }

    // Generar ZIP
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    // Enviar respuesta
    const timestamp = new Date().toISOString().split('T')[0]
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Informes_${timestamp}.zip"`,
      },
    })
  } catch (error) {
    console.error('Error en descarga lote:', error)
    return new Response('Error al generar descarga', { status: 500 })
  }
}
