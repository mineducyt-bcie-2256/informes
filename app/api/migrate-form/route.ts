import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Columnas JSONB que deben existir en cada tabla de formulario
const FOTO_COL = { column: 'fotos', default: "'[]'::jsonb" }

const MIGRATIONS: Record<string, { column: string; default: string }[]> = {
  informe_hsso:  [{ column: 'epp_items', default: "'[]'::jsonb" }, FOTO_COL],
  informe_garo:  [{ column: 'incidentes', default: "'[]'::jsonb" }, FOTO_COL],
  informe_pgr:   [FOTO_COL],
  informe_mcear: [FOTO_COL],
  informe_pppi:  [FOTO_COL, { column: 'indicadores_impacto', default: "'{}' ::jsonb" }],
  informe_maqr:  [FOTO_COL],
  informe_prt:   [FOTO_COL],
  informe_c1317: [FOTO_COL],
  informe_cct:   [FOTO_COL],
}

export async function POST(req: NextRequest) {
  const { table } = await req.json()
  const cols = MIGRATIONS[table]
  if (!cols) return NextResponse.json({ ok: true, msg: 'No migrations for table' })

  for (const { column, default: def } of cols) {
    await adminClient.rpc('exec_sql', {
      sql: `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${column}" JSONB DEFAULT ${def};`
    })
  }

  if (cols.length > 0) {
    await adminClient.rpc('exec_sql', { sql: `NOTIFY pgrst, 'reload schema';` })
    await new Promise(r => setTimeout(r, 800))
  }

  return NextResponse.json({ ok: true })
}
