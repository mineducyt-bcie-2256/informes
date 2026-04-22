import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Convierte serial de Excel a dd/mm/yyyy
function excelSerialToDate(serial: number): string {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000))
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = date.getUTCFullYear()
  return `${d}/${m}/${y}`
}

export async function POST() {
  const pasos: string[] = []
  let errores: string[] = []

  // 1. Renombrar fechas_de_ra → fecha_ra si existe
  const { error: e1 } = await adminClient.rpc('exec_sql', {
    sql: `DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='escuelas' AND column_name='fechas_de_ra'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='escuelas' AND column_name='fecha_ra'
      ) THEN
        ALTER TABLE escuelas RENAME COLUMN "fechas_de_ra" TO "fecha_ra";
      END IF;
    END $$;`
  })
  if (e1) errores.push(`Renombrar columna: ${e1.message}`)
  else pasos.push('Columna fecha_ra verificada / renombrada si era necesario')

  // 2. Crear columna fecha_ra si no existe
  const { error: e2 } = await adminClient.rpc('exec_sql', {
    sql: `ALTER TABLE escuelas ADD COLUMN IF NOT EXISTS fecha_ra TEXT;`
  })
  if (e2) errores.push(`Crear columna: ${e2.message}`)
  else pasos.push('Columna fecha_ra existe en la BD')

  // 3. Recargar schema cache
  await adminClient.rpc('exec_sql', { sql: `NOTIFY pgrst, 'reload schema';` })
  await new Promise(r => setTimeout(r, 1000))

  // 4. Leer todas las filas con fecha_ra
  const { data: filas, error: e3 } = await adminClient
    .from('escuelas')
    .select('id, fecha_ra')
    .not('fecha_ra', 'is', null)

  if (e3) {
    errores.push(`Leer filas: ${e3.message}`)
    return NextResponse.json({ pasos, errores })
  }

  // 5. Convertir seriales de Excel a fecha legible
  let convertidas = 0
  for (const fila of filas ?? []) {
    const val = fila.fecha_ra
    if (!val) continue
    // Solo convertir si es un número (serial de Excel)
    if (/^\d{4,6}$/.test(String(val).trim())) {
      const fechaFormateada = excelSerialToDate(Number(val))
      const { error: eu } = await adminClient
        .from('escuelas')
        .update({ fecha_ra: fechaFormateada })
        .eq('id', fila.id)
      if (eu) errores.push(`Fila ${fila.id}: ${eu.message}`)
      else convertidas++
    }
  }

  pasos.push(`${convertidas} fechas convertidas de serial Excel a dd/mm/yyyy`)

  return NextResponse.json({ pasos, errores, ok: errores.length === 0 })
}
