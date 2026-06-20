import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Cliente admin (service role — solo server side) ───────────────
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Columnas conocidas: encabezado Excel → { campo DB, tipo } ─────
const KNOWN_COLUMNS: Record<string, { field: string; type: 'text' | 'numeric' | 'integer' | 'boolean' | 'date' }> = {
  'Código':                          { field: 'codigo',                  type: 'text'    },
  'Codigo':                          { field: 'codigo',                  type: 'text'    },
  'Centro Educativo':                { field: 'nombre',                  type: 'text'    },
  'Departamento':                    { field: 'departamento',             type: 'text'    },
  'Distrito':                        { field: 'distrito',                 type: 'text'    },
  'Latitud':                         { field: 'latitud',                  type: 'numeric' },
  'Longitud':                        { field: 'longitud',                 type: 'numeric' },
  'Grupo':                           { field: 'grupo_num_raw',            type: 'integer' },
  'Empresa obras':                   { field: 'empresa_obras',            type: 'text'    },
  'Número de contrato':              { field: 'numero_contrato',          type: 'text'    },
  'Numero de contrato':              { field: 'numero_contrato',          type: 'text'    },
  'Empresa supervisión':             { field: 'empresa_supervision',      type: 'text'    },
  'Empresa supervision':             { field: 'empresa_supervision',      type: 'text'    },
  'Administrador de contrato':       { field: 'administrador_contrato',   type: 'text'    },
  'Etapa':                           { field: 'etapa',                    type: 'text'    },
  'Porcentaje de avance':            { field: 'porcentaje_avance',        type: 'text'    },
  'PEGAS Elaboración':               { field: 'pegas_elaboracion',        type: 'text'    },
  'PEGAS Elaboracion':               { field: 'pegas_elaboracion',        type: 'text'    },
  'PEGAS Ejecución':                 { field: 'pegas_ejecucion',          type: 'text'    },
  'PEGAS Ejecucion':                 { field: 'pegas_ejecucion',          type: 'text'    },
  'Accidentes laborales acumulados': { field: 'accidentes_acumulados',    type: 'integer' },
  'Reubicación Temporal':            { field: 'reubicacion_temporal',     type: 'text'    },
  'Reubicacion Temporal':            { field: 'reubicacion_temporal',     type: 'text'    },
  'Resolución Ambiental':            { field: 'resolucion_ambiental',     type: 'text'    },
  'Resolucion Ambiental':            { field: 'resolucion_ambiental',     type: 'text'    },
  'Resolución ambiental':            { field: 'resolucion_ambiental',     type: 'text'    },
  'Resolucion ambiental':            { field: 'resolucion_ambiental',     type: 'text'    },
  'Fechas de RA':                    { field: 'fecha_ra',                  type: 'date'    },
  'Fechas de Ra':                    { field: 'fecha_ra',                  type: 'date'    },
  'Fecha de RA':                     { field: 'fecha_ra',                  type: 'date'    },
  'Fecha de Ra':                     { field: 'fecha_ra',                  type: 'date'    },
  'Fecha RA':                        { field: 'fecha_ra',                  type: 'date'    },
  'Fecha Ra':                        { field: 'fecha_ra',                  type: 'date'    },
  'Fecha Resolución Ambiental':      { field: 'fecha_ra',                  type: 'date'    },
  'Fecha Resolucion Ambiental':      { field: 'fecha_ra',                  type: 'date'    },
}

// ── Columnas con coincidencia parcial (el encabezado cambia con fecha, etc.)
// Si el header EMPIEZA CON alguno de estos prefijos → se mapea al campo indicado
const PARTIAL_COLUMNS: { prefix: string; field: string; type: 'text' | 'numeric' | 'integer' }[] = [
  { prefix: 'Porcentaje de avance', field: 'porcentaje_avance', type: 'text' },
  { prefix: 'Avance al',            field: 'porcentaje_avance', type: 'text' },
  { prefix: 'PEGAS Elaboraci',      field: 'pegas_elaboracion', type: 'text' },
  { prefix: 'PEGAS Ejecuci',        field: 'pegas_ejecucion',   type: 'text' },
]

function resolveHeader(header: string) {
  // 1. Coincidencia exacta
  if (KNOWN_COLUMNS[header]) return KNOWN_COLUMNS[header]
  // 2. Coincidencia parcial (por prefijo)
  const partial = PARTIAL_COLUMNS.find(p =>
    header.toLowerCase().startsWith(p.prefix.toLowerCase())
  )
  if (partial) return { field: partial.field, type: partial.type }
  return null
}

// ── Sanitizar nombre de columna para PostgreSQL ───────────────────
function sanitize(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // quitar tildes
    .replace(/[^a-z0-9]/g, '_')                          // solo alfanumérico
    .replace(/_+/g, '_')                                 // colapsar __
    .replace(/^_+|_+$/g, '')                             // trim _
    .replace(/^\d/, 'c_$&')                              // si empieza con número
}

// ── Convertir serial de fecha Excel → dd/mm/yyyy ─────────────────
function excelSerialToDate(serial: number): string {
  // Excel cuenta desde 1 ene 1900; ajuste por bug del año bisiesto de Excel
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000))
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = date.getUTCFullYear()
  return `${d}/${m}/${y}`
}

// ── Detectar tipo de dato de la columna ───────────────────────────
function detectType(values: any[]): string {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '')
  if (!nonEmpty.length) return 'TEXT'
  if (nonEmpty.every(v => !isNaN(Number(v)) && !isNaN(parseFloat(String(v))))) {
    return nonEmpty.every(v => Number.isInteger(Number(v))) ? 'INTEGER' : 'NUMERIC'
  }
  return 'TEXT'
}

// ── Obtener columnas existentes via RPC (evita caché de PostgREST) ─
async function getExistingColumns(): Promise<Set<string>> {
  const { data } = await adminClient.rpc('exec_sql_rows', {
    sql: `SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'escuelas'`
  })
  return new Set((data ?? []).map((r: any) => r.column_name))
}

// ════════════════════════════════════════════════════════════════
// POST /api/import-escuelas
// Body: { rows: object[] }  (JSON parseado desde XLSX)
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { rows }: { rows: Record<string, any>[] } = await req.json()
    if (!rows?.length) return NextResponse.json({ error: 'Sin filas' }, { status: 400 })

    // Lookup grupos: numero → id (UUID)
    const { data: gruposData } = await adminClient.from('grupos').select('id, numero')
    const gruposMap: Record<number, string> = {}
    gruposData?.forEach((g: any) => { gruposMap[Number(g.numero)] = g.id })

    // 1. Detectar todas las cabeceras presentes en el Excel
    const allHeaders = Array.from(new Set(rows.flatMap(r => Object.keys(r))))

    // 1b. Migraciones: renombrar columnas mal nombradas + corregir tipos incorrectos
    const RENAMES: { from: string; to: string }[] = [
      { from: 'fechas_de_ra',             to: 'fecha_ra' },
      { from: 'fecha_de_ra',              to: 'fecha_ra' },
      { from: 'fecha_resolucion_ambient', to: 'resolucion_ambiental' },
    ]
    for (const { from, to } of RENAMES) {
      await adminClient.rpc('exec_sql', {
        sql: `DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='escuelas' AND column_name='${from}'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='escuelas' AND column_name='${to}'
          ) THEN
            ALTER TABLE escuelas RENAME COLUMN "${from}" TO "${to}";
          END IF;
        END $$;`
      })
    }

    // Columnas que deben ser TEXT pero pudieron haberse creado como INTEGER/NUMERIC
    const FORCE_TEXT = ['fecha_ra', 'resolucion_ambiental']
    for (const col of FORCE_TEXT) {
      await adminClient.rpc('exec_sql', {
        sql: `DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='escuelas'
              AND column_name='${col}'
              AND data_type IN ('integer','bigint','numeric','double precision','real')
          ) THEN
            ALTER TABLE escuelas ALTER COLUMN "${col}" TYPE TEXT USING "${col}"::TEXT;
          END IF;
        END $$;`
      })
    }

    // 2. Columnas existentes en la BD
    const existing = await getExistingColumns()

    // 3. Identificar columnas que faltan: desconocidas nuevas + conocidas que aún no existen en BD
    const pgTypeMap: Record<string, string> = {
      text: 'TEXT', numeric: 'NUMERIC', integer: 'INTEGER', boolean: 'BOOLEAN', date: 'TEXT',
    }
    const newColumns: { header: string; field: string; pgType: string }[] = []
    const seenFields = new Set<string>()

    for (const header of allHeaders) {
      const known = resolveHeader(header)
      if (known) {
        // Columna conocida: crearla si aún no existe en BD
        if (!existing.has(known.field) && !seenFields.has(known.field)) {
          seenFields.add(known.field)
          newColumns.push({ header, field: known.field, pgType: pgTypeMap[known.type] ?? 'TEXT' })
        }
        continue
      }

      const field = sanitize(header)
      if (!field) continue
      if (existing.has(field)) continue // ya existe en BD
      if (seenFields.has(field)) continue

      // Detectar tipo según los valores de esa columna
      seenFields.add(field)
      const values = rows.map(r => r[header])
      const pgType = detectType(values)
      newColumns.push({ header, field, pgType })
    }

    // 4. Crear columnas nuevas via ALTER TABLE
    const creadas: string[] = []
    for (const col of newColumns) {
      const { error } = await adminClient.rpc('exec_sql', {
        sql: `ALTER TABLE escuelas ADD COLUMN IF NOT EXISTS "${col.field}" ${col.pgType};`
      })
      if (!error) creadas.push(`${col.header} → ${col.field} (${col.pgType})`)
    }

    // Si se crearon columnas nuevas, notificar a PostgREST que recargue
    // el schema cache y esperar un momento antes del upsert
    if (newColumns.length > 0) {
      await adminClient.rpc('exec_sql', { sql: `NOTIFY pgrst, 'reload schema';` })
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    // 5. Refrescar lista de columnas existentes (incluye las recién creadas)
    const existingAfter = await getExistingColumns()

    // 6. Construir records y hacer upsert
    let ok = 0, err = 0
    const errores: string[] = []

    for (const row of rows) {
      const record: Record<string, any> = {}

      for (const header of Object.keys(row)) {
        const rawVal = row[header]

        // Columna conocida (exacta o por prefijo parcial)
        const known = resolveHeader(header)
        if (known) {
          const val = rawVal === '' || rawVal === undefined ? null : rawVal
          if      (known.type === 'integer') record[known.field] = parseInt(String(val))   || null
          else if (known.type === 'numeric') record[known.field] = parseFloat(String(val)) || null
          else if (known.type === 'date') {
            if (!val) { record[known.field] = null }
            else if (!isNaN(Number(val))) { record[known.field] = excelSerialToDate(Number(val)) }
            else { record[known.field] = String(val).trim() }
          }
          else                               record[known.field] = val ? String(val).trim() : null
          continue
        }

        // Columna extra: solo incluir si ya existe confirmado en BD
        const field = sanitize(header)
        if (field && existingAfter.has(field) && rawVal !== undefined) {
          record[field] = rawVal === '' ? null : String(rawVal).trim()
        }
      }

      if (!record.codigo || !record.nombre) { err++; continue }

      // Convertir grupo_num_raw → grupo_id (UUID)
      if (record.grupo_num_raw) {
        record.grupo_id = gruposMap[Number(record.grupo_num_raw)] ?? null
      }
      delete record.grupo_num_raw

      const { error } = await adminClient
        .from('escuelas')
        .upsert(record, { onConflict: 'codigo' })

      if (error) { err++; errores.push(`${record.codigo}: ${error.message}`) }
      else        { ok++ }
    }

    return NextResponse.json({ ok, err, creadas, errores: errores.slice(0, 10) })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
