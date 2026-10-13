import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { MESES } from '@/types'
import { ShieldAlert, CheckCircle } from 'lucide-react'
import PersonalDonut from '@/components/dashboard/PersonalDonut'
import { ReubicacionCard } from '@/app/(app)/dashboard/ReubicacionCard'
import { PrintButton } from '@/app/(app)/dashboard/PrintButton'
import FiltrosDashboard from '@/app/(app)/dashboard/FiltrosDashboard'

// ── Tipos internos ─────────────────────────────────────────────────
type Escuela = {
  id: string
  nombre: string
  empresa_supervision: string | null
  numero_contrato: string | null
  etapa: string | null
  activa: boolean
  grupos: { numero: number }[] | null
}

type Informe = {
  id: string
  escuela_id: string
  estado: 'borrador' | 'enviado' | 'aprobado'
  periodo_mes: number
  periodo_anio: number
}

type AccidenteItem = {
  tipo: 'Incidente' | 'Accidente'
  gravedad: 'Sin daño' | 'Leve' | 'Grave (incapacitante)' | 'Mortal'
  causa?: string
  tipo_lesion?: string
}

type InformeHsso = {
  informe_id: string
  personal_hombres: number | null
  personal_mujeres: number | null
  personal_total: number | null
  tiene_accidentes: 'Sí' | 'No' | null
  accidentes: AccidenteItem[] | null
}

// ── Helpers ────────────────────────────────────────────────────────
function esConstruccion(e: Escuela) {
  return e.etapa?.toLowerCase().includes('construcci') ?? false
}


// ── Colores de estado ──────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    empresa?: string
    escuela_id?: string
    mes?: string
    mes_desde?: string
    mes_hasta?: string
    detalle?: string
  }>
}) {
  const params = await searchParams

  const supabase = await createClient()
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Usuario y perfil ───────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  let miRol: string = 'programador'
  let miEmpresa: string | null = null
  if (user) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('rol, empresa_supervision')
      .eq('id', user.id)
      .single()
    miRol     = perfil?.rol ?? 'programador'
    miEmpresa = perfil?.empresa_supervision ?? null
  }

  const esRestringido = miRol === 'usuario' && !!miEmpresa
  const esVisitante   = miRol === 'visitante'

  // ── Visitante: buscar escuela demo ─────────────────────────────
  let escuelaDemoId: string | null = null
  if (esVisitante) {
    const { data: demoEsc } = await admin
      .from('escuelas')
      .select('id')
      .eq('es_demo', true)
      .limit(1)
      .single()
    escuelaDemoId = demoEsc?.id ?? null
  }

  // ── Periodo y año ──────────────────────────────────────────────
  const hoy         = new Date()
  const anio        = esVisitante ? 2026 : hoy.getFullYear()
  const mesDefault  = esVisitante ? 3 : (hoy.getMonth() === 0 ? 12 : hoy.getMonth())

  const mesSel     = esVisitante ? 3     : (params.mes      ? parseInt(params.mes)      : mesDefault)
  const mesDesde   = esVisitante ? null  : (params.mes_desde ? parseInt(params.mes_desde) : null)
  const mesHasta   = esVisitante ? null  : (params.mes_hasta ? parseInt(params.mes_hasta) : null)

  // ── Filtros de empresa / escuela ───────────────────────────────
  const empresaParam  = params.empresa    ? decodeURIComponent(params.empresa)    : null
  const escuelaParam  = params.escuela_id ? decodeURIComponent(params.escuela_id) : null

  const empresaEfectiva   = esRestringido ? miEmpresa : (esVisitante ? null : empresaParam)
  const escuelaIdEfectiva = esVisitante ? escuelaDemoId : escuelaParam

  // ── Queries en paralelo ────────────────────────────────────────
  // Escuelas activas
  let escuelasQuery = admin
    .from('escuelas')
    .select('id, nombre, empresa_supervision, numero_contrato, etapa, activa, grupos(numero)')
    .eq('activa', true)

  if (esVisitante && escuelaDemoId) {
    escuelasQuery = escuelasQuery.eq('id', escuelaDemoId)
  }

  // Empresas para selector (escuelas en construcción)
  const empresasQuery = admin
    .from('escuelas')
    .select('empresa_supervision')
    .eq('activa', true)
    .ilike('etapa', '%construcci%')

  // Informes del periodo
  const periodoMesMin = mesDesde ?? mesSel
  const periodoMesMax = mesHasta ?? mesSel

  let informesQuery = admin
    .from('informes')
    .select('id, escuela_id, estado, periodo_mes, periodo_anio')
    .eq('periodo_anio', anio)
    .gte('periodo_mes', periodoMesMin)
    .lte('periodo_mes', periodoMesMax)

  const [
    { data: rawEscuelas },
    { data: rawEmpresas },
    { data: rawInformes },
  ] = await Promise.all([
    escuelasQuery,
    empresasQuery,
    informesQuery,
  ])

  const todasEscuelas = (rawEscuelas ?? []) as Escuela[]
  const todosInformes = (rawInformes ?? []) as Informe[]

  // Empresas únicas para selector
  const empresasUnicas = Array.from(
    new Set((rawEmpresas ?? []).map((e: any) => e.empresa_supervision).filter(Boolean))
  ).sort() as string[]

  // ── Filtrar escuelas base (en construcción) ────────────────────
  let escuelasBase = todasEscuelas.filter(esConstruccion)

  // Escuelas disponibles para selector de escuela (por empresa)
  const escuelasDeEmpresa = empresaEfectiva
    ? escuelasBase.filter(e => e.empresa_supervision === empresaEfectiva)
    : escuelasBase

  // Escuelas activas para KPIs
  let escuelasFiltradas: Escuela[]
  if (escuelaIdEfectiva) {
    escuelasFiltradas = escuelasBase.filter(e => e.id === escuelaIdEfectiva)
  } else if (empresaEfectiva) {
    escuelasFiltradas = escuelasBase.filter(e => e.empresa_supervision === empresaEfectiva)
  } else {
    escuelasFiltradas = escuelasBase
  }

  const escuelaIds = new Set(escuelasFiltradas.map(e => e.id))

  // Informes filtrados al scope actual
  const informesFiltrados = todosInformes.filter(i => escuelaIds.has(i.escuela_id))


  // ── HSSO: datos de personal y accidentes ───────────────────────
  const informeIds = informesFiltrados.map(i => i.id)
  let hssoData: InformeHsso[] = []

  if (informeIds.length > 0) {
    const { data: rawHsso } = await admin
      .from('informe_hsso')
      .select('informe_id, personal_hombres, personal_mujeres, personal_total, tiene_accidentes, accidentes, tiene_enfermedades_profesionales, enfermedades_profesionales')
      .in('informe_id', informeIds)
    hssoData = (rawHsso ?? []) as InformeHsso[]
  }

  // Totales de personal
  const totalHombres = hssoData.reduce((s, h) => s + (h.personal_hombres ?? 0), 0)
  const totalMujeres = hssoData.reduce((s, h) => s + (h.personal_mujeres ?? 0), 0)
  const totalPersonal = hssoData.reduce((s, h) => s + (h.personal_total ?? 0), 0)

  // Todos los eventos de accidentes/incidentes
  const todosEventos: AccidenteItem[] = hssoData.flatMap(h => h.accidentes ?? [])
  const totalEventos    = todosEventos.length
  const totalIncidentes = todosEventos.filter(a => a.tipo === 'Incidente').length
  const totalAccidentes = todosEventos.filter(a => a.tipo === 'Accidente').length

  // Por gravedad
  const gravedades: Record<string, number> = {}
  for (const ev of todosEventos) {
    const g = ev.gravedad ?? 'Sin especificar'
    gravedades[g] = (gravedades[g] ?? 0) + 1
  }

  // Por causa (top causas)
  const causas: Record<string, number> = {}
  for (const ev of todosEventos) {
    if (ev.causa) causas[ev.causa] = (causas[ev.causa] ?? 0) + 1
  }
  const topCausas = Object.entries(causas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  // Por tipo de lesión
  const lesiones: Record<string, number> = {}
  for (const ev of todosEventos) {
    if (ev.tipo_lesion) lesiones[ev.tipo_lesion] = (lesiones[ev.tipo_lesion] ?? 0) + 1
  }
  const topLesiones = Object.entries(lesiones).sort(([, a], [, b]) => b - a)

  // ── Enfermedades profesionales ─────────────────────────────────
  interface EnfItem { grupo_agente: string; enfermedad: string; actividad_riesgo: string }
  const todasEnfermedades: EnfItem[] = hssoData.flatMap(h =>
    (h as any).tiene_enfermedades_profesionales === 'Sí'
      ? ((h as any).enfermedades_profesionales ?? [])
      : []
  )
  // Agrupar por grupo_agente
  const enfermedadesPorGrupo: Record<string, EnfItem[]> = {}
  for (const enf of todasEnfermedades) {
    const g = enf.grupo_agente || 'Otro'
    if (!enfermedadesPorGrupo[g]) enfermedadesPorGrupo[g] = []
    enfermedadesPorGrupo[g].push(enf)
  }
  const hayEnfermedades = todasEnfermedades.length > 0

  // ── GARO: unidades sanitarias ─────────────────────────────────
  interface UnidadSanitaria { tipo: string; hombres: number; mujeres: number; total: number }
  interface UsoAgua { procedencia: string; procedencia_otro: string; volumen_litros: number }
  let garoData: { unidades_sanitarias: UnidadSanitaria[]; usos_agua: UsoAgua[] }[] = []
  if (informeIds.length > 0) {
    const { data: rawGaro } = await admin
      .from('informe_garo')
      .select('unidades_sanitarias, usos_agua')
      .in('informe_id', informeIds)
    garoData = (rawGaro ?? []) as any[]
  }
  const todasUnidades: UnidadSanitaria[] = garoData.flatMap(g => g.unidades_sanitarias ?? [])
  const todosUsosAgua: UsoAgua[] = garoData.flatMap(g => g.usos_agua ?? [])
  const totalVolumenAgua = todosUsosAgua.reduce((s, u) => s + (Number(u.volumen_litros) || 0), 0)
  const volumenPorProcedencia: Record<string, number> = {}
  for (const u of todosUsosAgua) {
    const p = (u.procedencia === 'Otros' ? u.procedencia_otro : u.procedencia) || 'Sin especificar'
    volumenPorProcedencia[p] = (volumenPorProcedencia[p] ?? 0) + (Number(u.volumen_litros) || 0)
  }
  const totalUnidades  = todasUnidades.reduce((s, u) => s + (parseInt(String(u.total)) || 0), 0)
  const totalUnidadesH = todasUnidades.reduce((s, u) => s + (parseInt(String(u.hombres)) || 0), 0)
  const totalUnidadesM = todasUnidades.reduce((s, u) => s + (parseInt(String(u.mujeres)) || 0), 0)
  // Agrupado por tipo
  const unidadesPorTipo: Record<string, { hombres: number; mujeres: number; total: number }> = {}
  for (const u of todasUnidades) {
    const t = u.tipo || 'Sin tipo'
    if (!unidadesPorTipo[t]) unidadesPorTipo[t] = { hombres: 0, mujeres: 0, total: 0 }
    unidadesPorTipo[t].hombres += parseInt(String(u.hombres)) || 0
    unidadesPorTipo[t].mujeres += parseInt(String(u.mujeres)) || 0
    unidadesPorTipo[t].total   += parseInt(String(u.total))   || 0
  }
  // Criterio: 1 unidad por cada 20 personas (usando personal HSSO)
  const personalTotal   = totalPersonal || 0
  const unidadesMinimas = Math.ceil(personalTotal / 20)
  const cumpleCriterio  = totalUnidades >= unidadesMinimas && totalUnidadesH > 0 && totalUnidadesM > 0

  // ── PGR: residuos ─────────────────────────────────────────────
  interface MaterialResiduos { nombre: string; peso_kg: number; unidad?: string; manejo?: string }
  interface ResiduoReg {
    categoria: string; tipo_residuo: string; materiales: MaterialResiduos[]
    lugar_acopio?: string; sitio_recepcion?: string
  }
  let pgrData: { residuos_demolicion: ResiduoReg[]; residuos_construccion: ResiduoReg[] }[] = []
  if (informeIds.length > 0) {
    const { data: rawPgr } = await admin
      .from('informe_pgr')
      .select('residuos_demolicion, residuos_construccion')
      .in('informe_id', informeIds)
    pgrData = (rawPgr ?? []) as any[]
  }

  const CATEGORIAS_PGR = ['Inertes', 'No Peligrosos', 'Peligrosos'] as const

  function resumenResiduos(regs: ResiduoReg[]) {
    const porCategoria: Record<string, { kg: number; nMat: number }> = {}
    for (const c of CATEGORIAS_PGR) porCategoria[c] = { kg: 0, nMat: 0 }
    const otrasUnidades: Record<string, number> = {}
    const porTipo: Record<string, { categoria: string; kg: number; nMat: number }> = {}
    const materiales: { nombre: string; categoria: string; tipo: string; peso: number; unidad: string; manejo: string }[] = []
    const acopio = new Set<string>()
    const recepcion = new Set<string>()

    for (const r of regs) {
      const cat = r.categoria || 'Sin categoría'
      if (!porCategoria[cat]) porCategoria[cat] = { kg: 0, nMat: 0 }
      const tipoKey = `${cat}|${r.tipo_residuo || 'Sin tipo'}`
      if (!porTipo[tipoKey]) porTipo[tipoKey] = { categoria: cat, kg: 0, nMat: 0 }
      if (r.lugar_acopio?.trim()) acopio.add(r.lugar_acopio.trim())
      if (r.sitio_recepcion?.trim()) recepcion.add(r.sitio_recepcion.trim())

      for (const m of r.materiales ?? []) {
        const peso = parseFloat(String(m.peso_kg)) || 0
        const unidad = m.unidad || 'kg'
        porCategoria[cat].nMat++
        porTipo[tipoKey].nMat++
        if (unidad === 'kg') {
          porCategoria[cat].kg += peso
          porTipo[tipoKey].kg += peso
        } else {
          otrasUnidades[unidad] = (otrasUnidades[unidad] ?? 0) + peso
        }
        materiales.push({ nombre: m.nombre, categoria: cat, tipo: r.tipo_residuo || 'Sin tipo', peso, unidad, manejo: m.manejo ?? '' })
      }
    }

    const totalKg = Object.values(porCategoria).reduce((s, v) => s + v.kg, 0)
    return {
      porCategoria, otrasUnidades, totalKg,
      porTipo: Object.entries(porTipo).map(([k, v]) => ({ tipo: k.split('|')[1], ...v })),
      materiales,
      acopio: Array.from(acopio),
      recepcion: Array.from(recepcion),
    }
  }

  const regsDemolicion   = pgrData.flatMap(p => p.residuos_demolicion ?? [])
  const regsConstruccion = pgrData.flatMap(p => p.residuos_construccion ?? [])
  const resDemolicion    = resumenResiduos(regsDemolicion)
  const resConstruccion  = resumenResiduos(regsConstruccion)
  const hayPgr = regsDemolicion.length > 0 || regsConstruccion.length > 0

  const COLOR_CAT_PGR: Record<string, { text: string; bg: string; border: string; bar: string }> = {
    'Inertes':       { text: '#94a3b8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', bar: 'rgba(100,116,139,0.7)' },
    'No Peligrosos': { text: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  bar: 'rgba(16,185,129,0.7)' },
    'Peligrosos':    { text: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   bar: 'rgba(239,68,68,0.7)' },
  }
  const colorCat = (cat: string) => COLOR_CAT_PGR[cat] ?? { text: 'var(--muted)', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', bar: 'rgba(100,116,139,0.7)' }

  function renderEtapaResiduos(titulo: string, res: ReturnType<typeof resumenResiduos>) {
    const cardStyle = { background: 'var(--card-bg)', border: '1px solid var(--card-border)' }
    const sectionTitle = 'text-xs font-semibold uppercase tracking-wide mb-2'
    const chip = (texto: string, key: string, cat?: string) => {
      const c = cat ? colorCat(cat) : { text: 'var(--foreground)', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)', bar: '' }
      return (
        <span key={key} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>{texto}</span>
      )
    }
    const otrasUnidadesTxt = Object.entries(res.otrasUnidades).map(([u, v]) => `${v.toLocaleString()} ${u}`)

    return (
      <div key={titulo} className="rounded-2xl p-5 flex flex-col gap-5" style={cardStyle}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{titulo}</p>
          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
            {res.totalKg.toLocaleString()} kg
          </span>
        </div>

        <div>
          <p className={sectionTitle} style={{ color: 'var(--muted)' }}>Categorías</p>
          <div className="space-y-2">
            {CATEGORIAS_PGR.map(cat => {
              const { kg, nMat } = res.porCategoria[cat] ?? { kg: 0, nMat: 0 }
              const pct = res.totalKg > 0 ? Math.round((kg / res.totalKg) * 100) : 0
              const c = colorCat(cat)
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-28 shrink-0" style={{ color: c.text }}>{cat}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: c.bg }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.bar }} />
                  </div>
                  <span className="text-xs font-bold w-44 text-right" style={{ color: 'var(--foreground)' }}>
                    {kg.toLocaleString()} kg · {nMat} material{nMat !== 1 ? 'es' : ''}
                  </span>
                </div>
              )
            })}
            {otrasUnidadesTxt.length > 0 && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Otras unidades: {otrasUnidadesTxt.join(' · ')}</p>
            )}
          </div>
        </div>

        {res.porTipo.length > 0 && (
          <div>
            <p className={sectionTitle} style={{ color: 'var(--muted)' }}>Tipo de residuo</p>
            <div className="space-y-2">
              {res.porTipo.map(t => (
                <div key={`${t.categoria}-${t.tipo}`} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl" style={{ background: colorCat(t.categoria).bg, border: `1px solid ${colorCat(t.categoria).border}` }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ color: colorCat(t.categoria).text, border: `1px solid ${colorCat(t.categoria).border}` }}>{t.categoria}</span>
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{t.tipo}</span>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: 'var(--foreground)' }}>{t.kg.toLocaleString()} kg · {t.nMat} mat.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {res.materiales.length > 0 && (
          <div>
            <p className={sectionTitle} style={{ color: 'var(--muted)' }}>Materiales presentes en la obra</p>
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--card-border)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(100,116,139,0.08)', color: 'var(--muted)' }}>
                    <th className="text-left font-semibold px-3 py-2">Material</th>
                    <th className="text-left font-semibold px-3 py-2">Categoría</th>
                    <th className="text-left font-semibold px-3 py-2">Tipo</th>
                    <th className="text-right font-semibold px-3 py-2">Cantidad</th>
                    <th className="text-left font-semibold px-3 py-2">Manejo</th>
                  </tr>
                </thead>
                <tbody>
                  {res.materiales.map((m, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
                      <td className="px-3 py-2 font-medium">{m.nombre}</td>
                      <td className="px-3 py-2"><span style={{ color: colorCat(m.categoria).text }}>{m.categoria}</span></td>
                      <td className="px-3 py-2">{m.tipo}</td>
                      <td className="px-3 py-2 text-right font-bold">{m.peso.toLocaleString()} {m.unidad}</td>
                      <td className="px-3 py-2">{m.manejo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className={sectionTitle} style={{ color: 'var(--muted)' }}>Lugares de acopio</p>
            {res.acopio.length > 0
              ? <div className="flex flex-wrap gap-2">{res.acopio.map((a, i) => chip(a, `ac-${i}`))}</div>
              : <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin lugares de acopio registrados</p>}
          </div>
          <div>
            <p className={sectionTitle} style={{ color: 'var(--muted)' }}>Sitios de recepción temporal</p>
            {res.recepcion.length > 0
              ? <div className="flex flex-wrap gap-2">{res.recepcion.map((r, i) => chip(r, `rc-${i}`))}</div>
              : <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin sitios de recepción registrados</p>}
          </div>
        </div>
      </div>
    )
  }

  // ── MCEAR: calidad de aire y emisiones ────────────────────────
  interface MedicionAire    { clasificacion: string; actividades: string[]; no_registrado: boolean; pm10: string; pm25: string; ica: string; co2: string }
  interface MedicionAcustica { clasificacion: string; fuentes: string[]; db: string; no_registrado: boolean }
  let mcearData: { mediciones_aire: MedicionAire[]; mediciones_acustica: MedicionAcustica[] }[] = []
  if (informeIds.length > 0) {
    const { data: rawMcear } = await admin
      .from('informe_mcear')
      .select('mediciones_aire, mediciones_acustica')
      .in('informe_id', informeIds)
    mcearData = (rawMcear ?? []) as any[]
  }

  const todasMedAire     = mcearData.flatMap(m => m.mediciones_aire     ?? [])
  const todasMedAcustica = mcearData.flatMap(m => m.mediciones_acustica ?? [])

  // Helper: promedio de campo numérico
  function promedio(items: MedicionAire[], key: 'pm10' | 'pm25' | 'ica' | 'co2') {
    const vals = items.map(m => parseFloat(m[key])).filter(v => !isNaN(v) && v > 0)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }

  // Calidad de aire por clasificación
  const aireMp  = todasMedAire.filter(m => m.clasificacion === 'material_particulado' && !m.no_registrado)
  const aireEm  = todasMedAire.filter(m => m.clasificacion === 'emisiones'            && !m.no_registrado)
  const aireCov = todasMedAire.filter(m => m.clasificacion === 'cov')

  const mpPm10 = promedio(aireMp, 'pm10'); const mpPm25 = promedio(aireMp, 'pm25'); const mpIca = promedio(aireMp, 'ica')
  const emCo2  = promedio(aireEm, 'co2');  const emIca  = promedio(aireEm, 'ica')

  // Actividades por clasificación (únicas)
  const actMp  = Array.from(new Set(aireMp.flatMap(m => m.actividades ?? [])))
  const actEm  = Array.from(new Set(aireEm.flatMap(m => m.actividades ?? [])))
  const covRegistrado = aireCov.some(m => !m.no_registrado)

  // Acústica
  const acGeneral = todasMedAcustica.filter(m => m.clasificacion === 'acustica_general' && !m.no_registrado)
  const fuentesUnicas = Array.from(new Set(acGeneral.flatMap(m => m.fuentes ?? [])))
  const dbVals = acGeneral.map(m => parseFloat(m.db)).filter(v => !isNaN(v) && v > 0)
  const dbPromedio = dbVals.length > 0 ? dbVals.reduce((s, v) => s + v, 0) / dbVals.length : null

  function clasificarRuidoDash(v: number) {
    if (v <= 40)  return { label: 'Muy silencioso',                color: '#10b981' }
    if (v <= 50)  return { label: 'Silencioso',                    color: '#84cc16' }
    if (v <= 60)  return { label: 'Nivel aceptable',               color: '#eab308' }
    if (v <= 70)  return { label: 'Algo molesto',                  color: '#f97316' }
    if (v <= 85)  return { label: 'Molesto / Riesgo prolongado',   color: '#ef4444' }
    if (v <= 100) return { label: 'Riesgo para la salud auditiva', color: '#a855f7' }
    return               { label: 'Dolor / Daño inmediato',        color: '#78716c' }
  }
  function clasificarIcaDash(v: number) {
    if (v <= 50)  return { label: 'Buena',                         color: '#10b981' }
    if (v <= 100) return { label: 'Moderada',                      color: '#eab308' }
    if (v <= 150) return { label: 'No saludable sensibles',        color: '#f97316' }
    if (v <= 200) return { label: 'No saludable',                  color: '#ef4444' }
    if (v <= 300) return { label: 'Muy no saludable',              color: '#a855f7' }
    return               { label: 'Peligrosa',                     color: '#78716c' }
  }

  const hayMcear = todasMedAire.length > 0 || todasMedAcustica.length > 0

  // ── PPPI: partes interesadas, socializaciones, indicadores ────
  interface PppiRow {
    informe_id: string
    partes_interesadas: Record<string, { activa: boolean; hombres: number; mujeres: number; label?: string }>
    socializacion1_fecha: string | null
    socializacion2_fecha: string | null
    socializacion3_fecha: string | null
    indicadores_impacto: {
      matricula:          { anio: number; ninos: number; ninas: number }[]
      inasistencias:      { mes: number; anio: number; cantidad: number }[]
      deserciones:        { mes: number; anio: number; cantidad: number }[]
      empleos_directos:   { mes: number; anio: number; hombres: number; mujeres: number }[]
      empleos_indirectos: { mes: number; anio: number; hombres: number; mujeres: number }[]
    } | null
  }
  let pppiData: PppiRow[] = []
  if (informeIds.length > 0) {
    const { data: rawPppi } = await admin
      .from('informe_pppi')
      .select('informe_id, partes_interesadas, socializacion1_fecha, socializacion2_fecha, socializacion3_fecha, indicadores_impacto')
      .in('informe_id', informeIds)
    pppiData = (rawPppi ?? []) as any[]
  }

  // Partes interesadas: sumar H/M por parte fija + customs
  const PARTES_FIJAS_DASH = ['alumnos','profesores','director','cde','personal'] as const
  const PARTES_LABELS: Record<string, string> = {
    alumnos: 'Alumnos', profesores: 'Profesores', director: 'Director',
    cde: 'CDE', personal: 'Personal del proyecto',
  }
  interface ParteSuma { hombres: number; mujeres: number }
  const partesTotales: Record<string, ParteSuma> = {}
  for (const row of pppiData) {
    const pm = row.partes_interesadas ?? {}
    for (const [key, val] of Object.entries(pm)) {
      if (!val?.activa) continue
      if (!partesTotales[key]) partesTotales[key] = { hombres: 0, mujeres: 0 }
      partesTotales[key].hombres += parseInt(String(val.hombres)) || 0
      partesTotales[key].mujeres += parseInt(String(val.mujeres)) || 0
    }
  }

  // Socializaciones: cuántos informes tienen fecha registrada
  const soc1Count = pppiData.filter(r => r.socializacion1_fecha).length
  const soc2Count = pppiData.filter(r => r.socializacion2_fecha).length
  const soc3Count = pppiData.filter(r => r.socializacion3_fecha).length
  const totalPppiInformes = pppiData.length

  // Socializaciones atrasadas: cruzar con avance de escuela
  // Necesitamos avance por informe_id → escuela_id → porcentaje_avance
  const informeEscuelaMap = Object.fromEntries(informesFiltrados.map(i => [i.id, i.escuela_id]))
  const escuelaAvanceMap: Record<string, number> = {}
  for (const e of escuelasFiltradas) {
    // porcentaje_avance viene como string "0.85" o "85"
    const raw = (e as any).porcentaje_avance
    if (raw == null) continue
    const n = parseFloat(raw)
    escuelaAvanceMap[e.id] = isNaN(n) ? 0 : (n <= 1 ? Math.round(n * 100) : Math.round(n))
  }
  // Atrasadas: avance > umbral Y fecha no registrada
  const soc2Atrasadas = pppiData.filter(r => {
    const esc = informeEscuelaMap[r.informe_id]
    return escuelaAvanceMap[esc] > 90 && !r.socializacion2_fecha
  }).length
  const soc3Atrasadas = pppiData.filter(r => {
    const esc = informeEscuelaMap[r.informe_id]
    return escuelaAvanceMap[esc] > 90 && !r.socializacion3_fecha
  }).length

  // Indicadores: matricula, inasistencias, deserciones, empleos por año
  const ANIOS_IND = [2024, 2025, 2026]

  function sumIndicadorAnio<T extends { anio: number }>(
    arr: T[], anio: number, field: keyof T
  ): number {
    return arr.filter(r => r.anio === anio).reduce((s, r) => s + (Number(r[field]) || 0), 0)
  }

  // Matrícula por año
  const matriculaPorAnio = ANIOS_IND.map(anio => {
    const ninos = pppiData.reduce((s, r) => {
      const rows = r.indicadores_impacto?.matricula ?? []
      return s + sumIndicadorAnio(rows, anio, 'ninos')
    }, 0)
    const ninas = pppiData.reduce((s, r) => {
      const rows = r.indicadores_impacto?.matricula ?? []
      return s + sumIndicadorAnio(rows, anio, 'ninas')
    }, 0)
    return { anio, ninos, ninas, total: ninos + ninas }
  })

  // Inasistencias por año (suma del periodo)
  const inasistenciasPorAnio = ANIOS_IND.map(anio => {
    const total = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.inasistencias ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (Number(x.cantidad) || 0), 0)
    }, 0)
    return { anio, total }
  })

  // Deserciones por año (suma del periodo)
  const desercionesPorAnio = ANIOS_IND.map(anio => {
    const total = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.deserciones ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (Number(x.cantidad) || 0), 0)
    }, 0)
    return { anio, total }
  })

  // Empleos directos + indirectos por año
  const empleosPorAnio = ANIOS_IND.map(anio => {
    const directosH = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_directos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (Number(x.hombres) || 0), 0)
    }, 0)
    const directosM = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_directos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (Number(x.mujeres) || 0), 0)
    }, 0)
    const indirectosH = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_indirectos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (Number(x.hombres) || 0), 0)
    }, 0)
    const indirectosM = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_indirectos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (Number(x.mujeres) || 0), 0)
    }, 0)
    return { anio, directos: directosH + directosM, indirectos: indirectosH + indirectosM, total: directosH + directosM + indirectosH + indirectosM }
  })

  const hayPppi = pppiData.length > 0

  // ── MAQR: quejas y reclamos ───────────────────────────────────
  interface QuejaRow {
    medio: string; medio_otro: string
    tipo_queja: string; tipo_queja_otro: string
    origen: string; origen_otro: string
    nivel_gravedad: string
    estado: string
    fecha_recepcion: string | null
    fecha_resolucion: string | null
  }
  let todasQuejas: QuejaRow[] = []
  {
    const escuelaIdsArr = Array.from(escuelaIds)
    if (escuelaIdsArr.length > 0) {
      const { data: todosInformesMaqr } = await admin
        .from('informes')
        .select('id')
        .in('escuela_id', escuelaIdsArr)

      const todosInformeIdsMaqr = (todosInformesMaqr ?? []).map((r: any) => r.id)

      if (todosInformeIdsMaqr.length > 0) {
        const { data: rawMaqr } = await admin
          .from('informe_maqr')
          .select('id')
          .in('informe_id', todosInformeIdsMaqr)

        const maqrIds = (rawMaqr ?? []).map((m: any) => m.id)

        if (maqrIds.length > 0) {
          const { data: rawQuejas } = await admin
            .from('informe_maqr_quejas')
            .select('medio, medio_otro, tipo_queja, tipo_queja_otro, origen, origen_otro, nivel_gravedad, estado, fecha_recepcion, fecha_resolucion')
            .in('maqr_id', maqrIds)
          todasQuejas = (rawQuejas ?? []) as QuejaRow[]
        }
      }
    }

    // Filtrar por período si está especificado
    if (mesDesde || mesHasta) {
      todasQuejas = todasQuejas.filter(q => {
        if (!q.fecha_recepcion) return false
        const parts = q.fecha_recepcion.split('-')
        const mesQueja = parseInt(parts[1])
        if (mesDesde && mesQueja < mesDesde) return false
        if (mesHasta && mesQueja > mesHasta) return false
        return true
      })
    }
  }

  const totalQuejas = todasQuejas.length

  // Por estado
  const quejasPorEstado: Record<string, number> = {}
  for (const q of todasQuejas) {
    const e = q.estado || 'Sin estado'
    quejasPorEstado[e] = (quejasPorEstado[e] ?? 0) + 1
  }

  // Por medio
  const quejasPorMedio: Record<string, number> = {}
  for (const q of todasQuejas) {
    const m = q.medio === 'Otro' && q.medio_otro ? q.medio_otro : (q.medio || 'Sin medio')
    quejasPorMedio[m] = (quejasPorMedio[m] ?? 0) + 1
  }

  // Por tipo
  const quejasPorTipo: Record<string, number> = {}
  for (const q of todasQuejas) {
    const t = q.tipo_queja === 'Otro' && q.tipo_queja_otro ? q.tipo_queja_otro : (q.tipo_queja || 'Sin tipo')
    quejasPorTipo[t] = (quejasPorTipo[t] ?? 0) + 1
  }

  // Por origen
  const quejasPorOrigen: Record<string, number> = {}
  for (const q of todasQuejas) {
    const o = q.origen === 'Otro' && q.origen_otro ? q.origen_otro : (q.origen || 'Sin origen')
    quejasPorOrigen[o] = (quejasPorOrigen[o] ?? 0) + 1
  }

  // Por nivel
  const NIVELES_QUEJA = ['Nivel 1 (Bajo)', 'Nivel 2 (Medio)', 'Nivel 3 (Alto)']
  const quejasPorNivel: Record<string, number> = {}
  for (const q of todasQuejas) {
    const n = q.nivel_gravedad || 'Sin nivel'
    quejasPorNivel[n] = (quejasPorNivel[n] ?? 0) + 1
  }

  // Tiempo promedio de resolución por nivel (solo quejas resueltas con ambas fechas)
  function diasEntreFechas(desde: string, hasta: string): number {
    const d1 = new Date(desde + 'T00:00:00')
    const d2 = new Date(hasta + 'T00:00:00')
    return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / 86_400_000))
  }
  const tiempoPromedioNivel: Record<string, number | null> = {}
  for (const nivel of NIVELES_QUEJA) {
    const resueltas = todasQuejas.filter(q =>
      q.nivel_gravedad === nivel && q.fecha_recepcion && q.fecha_resolucion
    )
    if (resueltas.length === 0) { tiempoPromedioNivel[nivel] = null; continue }
    const suma = resueltas.reduce((s, q) => s + diasEntreFechas(q.fecha_recepcion!, q.fecha_resolucion!), 0)
    tiempoPromedioNivel[nivel] = Math.round(suma / resueltas.length)
  }

  const hayMaqr = totalQuejas > 0

  // ── PRT: placeholder (pendiente) ──────────────────────────────
  interface RubroRow { activo: boolean; unidad: string; cantidad: number; costo_unitario: number; nombre: string }
  interface LugarDash {
    est_ninos: number; est_ninas: number
    doc_hombres: number; doc_mujeres: number
    condicion_uso: string; condicion_otros: string
    rubros: RubroRow[]
    adec_tiene: string
    adecuaciones: Record<string, { activa: boolean }>
    costos_incluidos?: string
  }
  interface PrtRow {
    modalidad: string[]
    tipo_continuidad: string | null
    lugares: LugarDash[]
    virtual: LugarDash | null
    est_ninos: number; est_ninas: number
    num_estudiantes: number | null
    doc_hombres: number; doc_mujeres: number
    num_maestros: number | null
    historial_costos: { total: number }[] | null
  }
  let prtData: PrtRow[] = []
  {
    // PRT: traemos el informe más reciente por escuela (no filtrado por periodo)
    const escuelaIdsArr = Array.from(escuelaIds)
    if (escuelaIdsArr.length > 0) {
      const { data: todosInformesPrt } = await admin
        .from('informes')
        .select('id, escuela_id, periodo_anio, periodo_mes')
        .in('escuela_id', escuelaIdsArr)
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes',  { ascending: false })

      // Quedarse solo con el informe más reciente por escuela
      const latestPorEscuela = new Map<string, string>()
      for (const inf of (todosInformesPrt ?? []) as any[]) {
        if (!latestPorEscuela.has(inf.escuela_id)) {
          latestPorEscuela.set(inf.escuela_id, inf.id)
        }
      }
      const latestInformeIds = Array.from(latestPorEscuela.values())

      if (latestInformeIds.length > 0) {
        const { data: rawPrt } = await admin
          .from('informe_prt')
          .select('modalidad, tipo_continuidad, lugares, virtual, est_ninos, est_ninas, num_estudiantes, doc_hombres, doc_mujeres, num_maestros, historial_costos')
          .in('informe_id', latestInformeIds)
        prtData = (rawPrt ?? []) as any[]
        console.log('[PRT DEBUG]', JSON.stringify(prtData.map((r:any) => ({
          tipo_continuidad: r.tipo_continuidad,
          modalidad: r.modalidad,
          num_estudiantes: r.num_estudiantes,
          est_ninos: r.est_ninos,
          est_ninas: r.est_ninas,
          num_maestros: r.num_maestros,
          lugares_count: r.lugares?.length,
        })), null, 2))
      }
    }
  }



  // Sitios presenciales: cantidad de lugares[] por escuela

  // Escuelas que implementan virtualidad (Virtual solo o Multimodal)

  // Estudiantes: usar num_estudiantes guardado, o sumar est_ninos+est_ninas como respaldo

  // Docentes: usar num_maestros guardado, o sumar como respaldo

  // Todos los lugares (presenciales) de todos los informes
  const todosLugares: LugarDash[] = prtData.flatMap(r => r.lugares ?? [])

  // Condición de uso
  const prtCondicion: Record<string, number> = {}
  for (const l of todosLugares) {
    const c = l.condicion_uso === 'Otros' && l.condicion_otros ? l.condicion_otros : (l.condicion_uso || 'Sin especificar')
    prtCondicion[c] = (prtCondicion[c] ?? 0) + 1
  }

  // Estimado mensual: rubros activos con costo numérico

  // Estimado acumulado: suma de historial_costos
  // Adecuaciones
  const prtAdecItems: Record<string, number> = {}
  for (const l of todosLugares.filter(l => l.adec_tiene === 'Sí')) {
    for (const [key, val] of Object.entries(l.adecuaciones ?? {})) {
      if ((val as any)?.activa) prtAdecItems[key] = (prtAdecItems[key] ?? 0) + 1
    }
  }


  // ── Reubicación Temporal: Modalidad de continuidad educativa ────
  interface ReubicacionRow {
    escuela_id: string
    escuela_nombre: string
    modalidad: string[]
    tipo_continuidad: string | null
  }
  let reubicacionData: ReubicacionRow[] = []
  {
    // Reubicación: traemos el informe más reciente por escuela (con PRT data)
    const escuelaIdsArr = Array.from(escuelaIds)
    if (escuelaIdsArr.length > 0) {
      // Obtener informes más recientes por escuela (sin filtro de estado)
      const { data: todosInformesReub } = await admin
        .from('informes')
        .select('id, escuela_id, periodo_anio, periodo_mes, estado')
        .in('escuela_id', escuelaIdsArr)
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes',  { ascending: false })

      // Quedarse solo con el informe más reciente por escuela
      const latestPorEscuela = new Map<string, string>()
      for (const inf of (todosInformesReub ?? []) as any[]) {
        if (!latestPorEscuela.has(inf.escuela_id)) {
          latestPorEscuela.set(inf.escuela_id, inf.id)
        }
      }
      const latestInformeIds = Array.from(latestPorEscuela.values())

      if (latestInformeIds.length > 0) {
        // Obtener PRT data
        const { data: rawReub } = await admin
          .from('informe_prt')
          .select('informe_id, modalidad, tipo_continuidad')
          .in('informe_id', latestInformeIds)

        // Mapear informe_id a escuela_id
        const informeToEscuelaMap = Object.fromEntries(
          (todosInformesReub ?? []).map((r: any) => [r.id, r.escuela_id])
        )

        // Agrupar por escuela y obtener nombre
        for (const prtRow of (rawReub ?? []) as any[]) {
          const escuelaId = informeToEscuelaMap[prtRow.informe_id]
          if (escuelaId) {
            const escuela = todasEscuelas.find(e => e.id === escuelaId)
            if (escuela) {
              reubicacionData.push({
                escuela_id: escuelaId,
                escuela_nombre: escuela.nombre,
                modalidad: prtRow.modalidad,
                tipo_continuidad: prtRow.tipo_continuidad,
              })
            }
          }
        }
      }
    }
  }

  // Categorizar por modalidad
  function tieneModalReub(r: ReubicacionRow, m: string): boolean {
    if (r.tipo_continuidad) return r.tipo_continuidad.includes(m)
    if (!r.modalidad) return false
    if (Array.isArray(r.modalidad)) return r.modalidad.includes(m)
    return (r.modalidad as unknown as string).includes(m)
  }

  const reubPresencial = reubicacionData.filter(r => tieneModalReub(r, 'Presencial') && !tieneModalReub(r, 'Virtual'))
  const reubVirtual = reubicacionData.filter(r => tieneModalReub(r, 'Virtual') && !tieneModalReub(r, 'Presencial'))
  const reubMultimodal = reubicacionData.filter(r => tieneModalReub(r, 'Presencial') && tieneModalReub(r, 'Virtual'))

  const hayReubicacion = reubicacionData.length > 0

  console.log('[REUBICACION DEBUG]', {
    reubicacionDataLength: reubicacionData.length,
    reubPresencialLength: reubPresencial.length,
    reubVirtualLength: reubVirtual.length,
    reubMultimodalLength: reubMultimodal.length,
    hayReubicacion,
    reubicacionDataSample: reubicacionData.slice(0, 2),
  })

  // ── Periodo label ──────────────────────────────────────────────
  let periodoLabel: string
  if (mesDesde && mesHasta && mesDesde !== mesHasta) {
    periodoLabel = `${MESES[mesDesde - 1]} – ${MESES[mesHasta - 1]} ${anio}`
  } else {
    periodoLabel = `${MESES[mesSel - 1]} ${anio}`
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div id="dashboard-completo" className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2a45] dark:text-white">Condiciones detalladas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {periodoLabel} — Programa Mi Nueva Escuela BCIE
          </p>
        </div>
        <PrintButton periodoLabel={periodoLabel} empresa={empresaEfectiva ?? undefined} escuela_id={escuelaIdEfectiva ?? undefined} />
      </div>

      {/* ── Bloque 1: Filtros ── */}
      {!esVisitante && (
        <FiltrosDashboard
          basePath="/reportes/condiciones"
          empresasUnicas={empresasUnicas}
          escuelasDeEmpresa={escuelasDeEmpresa}
          esRestringido={esRestringido}
          empresaEfectiva={empresaEfectiva}
          filtrosActuales={{
            empresa: empresaParam ?? undefined,
            escuela_id: escuelaParam ?? undefined,
            mes: mesSel !== mesDefault ? String(mesSel) : undefined,
            mes_desde: mesDesde ? String(mesDesde) : undefined,
            mes_hasta: mesHasta ? String(mesHasta) : undefined,
          }}
        />
      )}

      {/* ── Bloque 3: HSSO consolidado ── */}
      {hssoData.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <ShieldAlert size={13} className="text-slate-400" />
            Condición 1 — Implementación del Plan de Higiene, Salud y Seguridad Ocupacional · {periodoLabel}
          </h2>

          {/* Dos columnas: Personal | Accidentes e incidentes */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">

            {/* ── Columna izquierda: Personal en obra ── */}
            <PersonalDonut hombres={totalHombres} mujeres={totalMujeres} total={totalPersonal} />

            {/* ── Columna derecha: Accidentes e incidentes ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>

              {/* Título */}
              <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Accidentes e incidentes</p>
              </div>

              <div className="p-4">
                <div className="flex gap-4 items-stretch">

                  {/* ── Bloque izquierdo: Accidentes + 3 subcols ── */}
                  <div className="flex-1 min-w-0 space-y-4">

                    {/* Contador Accidentes — gradiente llamativo */}
                    <div className="flex items-center gap-4 rounded-2xl px-5 py-4" style={{
                      background: 'linear-gradient(135deg, #f97316, #ef4444)',
                      boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
                    }}>
                      <p className="text-5xl font-black text-white leading-none">{totalAccidentes}</p>
                      <div>
                        <p className="text-white font-bold text-sm uppercase tracking-widest">Accidentes</p>
                        <p className="text-white/70 text-xs mt-0.5">registrados en el periodo</p>
                      </div>
                    </div>

                    {/* Tres columnas */}
                    <div className="grid grid-cols-3 gap-3">

                      {/* Gravedad */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Gravedad</p>
                        <div className="space-y-1.5">
                          {([
                            { label: 'Sin daño', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
                            { label: 'Leve',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
                            { label: 'Grave',    color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
                            { label: 'Mortal',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)'  },
                          ]).map(({ label, color, bg, border }) => {
                            const key = label === 'Grave' ? 'Grave (incapacitante)' : label
                            return (
                              <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
                                </div>
                                <span className="text-sm font-bold shrink-0" style={{ color }}>{gravedades[key] ?? 0}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Causas */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Causas</p>
                        <div className="space-y-1.5">
                          {topCausas.length > 0 ? topCausas.map(([causa, count]) => (
                            <div key={causa} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                              <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{causa}</span>
                              <span className="text-sm font-bold ml-2 shrink-0" style={{ color: '#818cf8' }}>{count}</span>
                            </div>
                          )) : (
                            <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin datos</p>
                          )}
                        </div>
                      </div>

                      {/* Tipo de lesión */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Tipo de lesión</p>
                        <div className="space-y-1.5">
                          {topLesiones.length > 0 ? topLesiones.map(([lesion, count]) => (
                            <div key={lesion} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
                              <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{lesion}</span>
                              <span className="text-sm font-bold ml-2 shrink-0" style={{ color: '#f472b6' }}>{count}</span>
                            </div>
                          )) : (
                            <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin datos</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ── Columna derecha: Total + Incidentes ── */}
                  <div className="flex flex-col gap-3 w-32 shrink-0">
                    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl px-3 py-4" style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    }}>
                      <p className="text-4xl font-black text-white leading-none">{totalEventos}</p>
                      <p className="text-[10px] font-semibold text-white/80 mt-1.5 uppercase tracking-wide text-center leading-tight">Total<br/>eventos</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl px-3 py-4" style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
                    }}>
                      <p className="text-4xl font-black text-white leading-none">{totalIncidentes}</p>
                      <p className="text-[10px] font-semibold text-white/80 mt-1.5 uppercase tracking-wide text-center leading-tight">Incidentes</p>
                    </div>
                  </div>

                </div>

                {/* Mensaje sin eventos */}
                {totalEventos === 0 && (
                  <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2.5 mt-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                    <CheckCircle size={13} className="shrink-0" />
                    Sin accidentes ni incidentes reportados en el periodo
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Enfermedades Profesionales ── */}
          <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: 'var(--card-border)' }}>
              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Enfermedades Profesionales</p>
            </div>

            <div className="p-4">
              {hayEnfermedades ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(enfermedadesPorGrupo).map(([grupo, enfs]) => {
                    const colores: Record<string, { bg: string; border: string; dot: string; text: string }> = {
                      'Químicos':      { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)',  dot: '#f97316', text: '#f97316' },
                      'Físicos':       { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  dot: '#3b82f6', text: '#3b82f6' },
                      'Biológicos':    { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  dot: '#10b981', text: '#10b981' },
                      'Psicosociales': { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', dot: '#8b5cf6', text: '#8b5cf6' },
                      'Carcinógenos':  { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   dot: '#ef4444', text: '#ef4444' },
                    }
                    const c = colores[grupo] ?? { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', dot: '#64748b', text: '#64748b' }
                    return (
                      <div key={grupo} className="rounded-xl p-3 space-y-2" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                          <p className="text-xs font-bold" style={{ color: c.text }}>{grupo}</p>
                          <span className="ml-auto text-xs font-bold" style={{ color: c.text }}>{enfs.length}</span>
                        </div>
                        <div className="space-y-1">
                          {enfs.map((enf, i) => (
                            <p key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-tight">• {enf.enfermedad}</p>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 py-1">
                  <span className="text-green-500">✓</span>
                  En este mes no se reportan enfermedades profesionales.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Bloque 4: GARO — Unidades Sanitarias ── */}
      {todasUnidades.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span>🚽</span>
            Condición 2 — Implementación de la Gestión de Aguas Residuales Ordinarias · {periodoLabel}
          </h2>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Unidades Sanitarias</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Tarjeta 1: Total instaladas */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total instaladas</p>
              <p className="text-5xl font-black" style={{ color: 'var(--foreground)' }}>{totalUnidades}</p>
              <div className="flex gap-3 mt-auto">
                <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-xs text-blue-400 font-medium">Hombres</p>
                  <p className="text-lg font-bold text-blue-500">{totalUnidadesH}</p>
                </div>
                <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <p className="text-xs text-purple-400 font-medium">Mujeres</p>
                  <p className="text-lg font-bold text-purple-500">{totalUnidadesM}</p>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Criterio */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{
              background: cumpleCriterio
                ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))',
              border: `1px solid ${cumpleCriterio ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Criterio 1 ud / 20 personas</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cumpleCriterio ? '✅' : '⚠️'}</span>
                <div>
                  <p className={`text-sm font-bold ${cumpleCriterio ? 'text-green-400' : 'text-red-400'}`}>
                    {cumpleCriterio ? 'Cumple' : 'No cumple'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {personalTotal > 0
                      ? `${totalUnidades} uds. para ${personalTotal} personas (mín. ${unidadesMinimas})`
                      : 'Sin datos de personal HSSO'}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${totalUnidadesH > 0 && totalUnidadesM > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Separación H/M: {totalUnidadesH > 0 && totalUnidadesM > 0 ? 'Sí' : 'No registrada'}
                </p>
              </div>
            </div>

            {/* Tarjeta 3: Por tipo */}
            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Por tipo</p>
              {Object.entries(unidadesPorTipo).map(([tipo, vals]) => (
                <div key={tipo} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{tipo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400">H:{vals.hombres}</span>
                    <span className="text-xs text-purple-400">M:{vals.mujeres}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{vals.total}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {todosUsosAgua.length > 0 && (
            <>
              <p className="text-sm font-semibold mt-6 mb-3" style={{ color: 'var(--foreground)' }}>Manejo de aguas residuales en las actividades del proyecto</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Registros de uso de agua</p>
                  <p className="text-5xl font-black" style={{ color: 'var(--foreground)' }}>{todosUsosAgua.length}</p>
                  <div className="mt-auto rounded-xl px-3 py-2" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <p className="text-xs text-sky-400 font-medium">Volumen total</p>
                    <p className="text-lg font-bold text-sky-500">{totalVolumenAgua.toLocaleString('es-SV')} L</p>
                  </div>
                </div>

                <div className="rounded-2xl p-5 flex flex-col gap-2 md:col-span-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Volumen por procedencia</p>
                  {Object.entries(volumenPorProcedencia).map(([proc, litros]) => (
                    <div key={proc} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{proc}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{litros.toLocaleString('es-SV')} L</span>
                    </div>
                  ))}
                </div>

              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bloque 5: PGR — Plan de Gestión de Residuos ── */}
      {hayPgr && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span>♻️</span>
            Condición 3 — Implementación del Plan de Gestión de Residuos · {periodoLabel}
          </h2>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Implementación del plan de gestión de residuos</p>

          <div className="flex flex-col gap-4">
            {renderEtapaResiduos('Etapa de demolición y desmontaje', resDemolicion)}
            {renderEtapaResiduos('Etapa de construcción', resConstruccion)}
          </div>
        </div>
      )}

      {/* ── Bloque 6: MCEAR — Calidad del Aire y Emisiones ── */}
      {hayMcear && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span>🌬️</span>
            Condición 4 — Monitoreo de Calidad del Aire y Emisiones · {periodoLabel}
          </h2>

          {/* Calidad del aire */}
          <p className="text-sm font-semibold mb-3 mt-1" style={{ color: 'var(--foreground)' }}>Calidad del aire</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Tarjeta: Material particulado */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Material particulado</p>
              {aireMp.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin registros en el periodo</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'PM10', val: mpPm10, unit: 'µg/m³' },
                      { label: 'PM2.5', val: mpPm25, unit: 'µg/m³' },
                      { label: 'ICA', val: mpIca, unit: '' },
                    ].map(({ label, val, unit }) => (
                      <div key={label} className="rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <p className="text-xs font-medium text-blue-400">{label}</p>
                        <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                          {val !== null ? val.toFixed(1) : '—'}
                        </p>
                        {unit && <p className="text-xs" style={{ color: 'var(--muted)' }}>{unit}</p>}
                        {label === 'ICA' && val !== null && (
                          <p className="text-xs font-semibold mt-0.5" style={{ color: clasificarIcaDash(val).color }}>
                            {clasificarIcaDash(val).label}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {actMp.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {actMp.map(a => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>{a}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tarjeta: Emisiones y fuentes móviles */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Emisiones y fuentes móviles</p>
              {aireEm.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin registros en el periodo</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'ICA', val: emIca },
                      { label: 'CO₂ (ppm)', val: emCo2 },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                        <p className="text-xs font-medium text-yellow-400">{label}</p>
                        <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                          {val !== null ? val.toFixed(1) : '—'}
                        </p>
                        {label === 'ICA' && val !== null && (
                          <p className="text-xs font-semibold mt-0.5" style={{ color: clasificarIcaDash(val).color }}>
                            {clasificarIcaDash(val).label}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {actEm.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {actEm.map(a => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24' }}>{a}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tarjeta: COV */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Compuestos orgánicos volátiles</p>
              {aireCov.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin registros en el periodo</p>
              ) : covRegistrado ? (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Registrado</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Se registraron COV en el periodo</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-bold text-green-400">No registrado</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin emisiones de COV en el periodo</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Contaminación acústica */}
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Contaminación acústica</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Tarjeta: Fuentes generadoras */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Fuentes generadoras</p>
              {fuentesUnicas.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin registros en el periodo</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {fuentesUnicas.map(f => (
                    <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc' }}>{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Tarjeta: Nivel de ruido promedio */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Nivel de ruido promedio</p>
              {dbPromedio === null ? (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin mediciones en el periodo</p>
              ) : (
                <>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black" style={{ color: clasificarRuidoDash(dbPromedio).color }}>
                      {dbPromedio.toFixed(1)}
                    </span>
                    <span className="text-lg font-semibold mb-1" style={{ color: 'var(--muted)' }}>dB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: clasificarRuidoDash(dbPromedio).color }} />
                    <span className="text-sm font-semibold" style={{ color: clasificarRuidoDash(dbPromedio).color }}>
                      {clasificarRuidoDash(dbPromedio).label}
                    </span>
                  </div>
                  {dbVals.length > 1 && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Promedio de {dbVals.length} mediciones</p>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Bloque 7: PPPI — Partes Interesadas ── */}
      {hayPppi && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span>🤝</span>
            Condición 5 — Partes Interesadas · {periodoLabel}
          </h2>

          {/* ── Fila: Partes interesadas | Socializaciones | Socializaciones atrasadas ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 mt-1">

            {/* Columna 1: Partes interesadas */}
            <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: '1px solid var(--card-border)' }}>
              <div className="grid grid-cols-[1fr_56px_56px_56px] px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ background: 'var(--card-bg)', color: 'var(--muted)', borderBottom: '1px solid var(--card-border)' }}>
                <span>Partes interesadas</span>
                <span className="text-center">H</span>
                <span className="text-center">M</span>
                <span className="text-center">Total</span>
              </div>
              {PARTES_FIJAS_DASH.map(key => {
                const vals = partesTotales[key]
                const h = vals?.hombres ?? 0; const m = vals?.mujeres ?? 0; const t = h + m
                return (
                  <div key={key} className="grid grid-cols-[1fr_56px_56px_56px] px-3 py-2 items-center" style={{ borderBottom: '1px solid var(--card-border)', background: t > 0 ? 'var(--card-bg)' : 'transparent' }}>
                    <span className="text-xs font-medium" style={{ color: t > 0 ? 'var(--foreground)' : 'var(--muted)' }}>{PARTES_LABELS[key]}</span>
                    <span className="text-xs text-center" style={{ color: 'var(--foreground)' }}>{t > 0 ? h : '—'}</span>
                    <span className="text-xs text-center" style={{ color: 'var(--foreground)' }}>{t > 0 ? m : '—'}</span>
                    <span className="text-xs font-bold text-center" style={{ color: t > 0 ? '#60a5fa' : 'var(--muted)' }}>{t > 0 ? t : '—'}</span>
                  </div>
                )
              })}
              {Object.entries(partesTotales)
                .filter(([k]) => !PARTES_FIJAS_DASH.includes(k as any))
                .map(([key, vals]) => {
                  const h = vals.hombres; const m = vals.mujeres; const t = h + m
                  return (
                    <div key={key} className="grid grid-cols-[1fr_56px_56px_56px] px-3 py-2 items-center" style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                      <span className="text-xs font-medium italic" style={{ color: 'var(--foreground)' }}>{key}</span>
                      <span className="text-xs text-center" style={{ color: 'var(--foreground)' }}>{h}</span>
                      <span className="text-xs text-center" style={{ color: 'var(--foreground)' }}>{m}</span>
                      <span className="text-xs font-bold text-center text-blue-400">{t}</span>
                    </div>
                  )
                })}
              {(() => {
                const th = Object.values(partesTotales).reduce((s, v) => s + v.hombres, 0)
                const tm = Object.values(partesTotales).reduce((s, v) => s + v.mujeres, 0)
                return (
                  <div className="grid grid-cols-[1fr_56px_56px_56px] px-3 py-2 items-center mt-auto" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>Total</span>
                    <span className="text-xs font-bold text-center text-blue-400">{th}</span>
                    <span className="text-xs font-bold text-center text-purple-400">{tm}</span>
                    <span className="text-xs font-bold text-center text-blue-300">{th + tm}</span>
                  </div>
                )
              })()}
            </div>

            {/* Columna 2: Socializaciones realizadas */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Socializaciones · {totalPppiInformes} informes</p>
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[
                  { label: '1ª Social.', count: soc1Count, color: '#10b981' },
                  { label: '2ª Social.', count: soc2Count, color: '#60a5fa' },
                  { label: '3ª Social.', count: soc3Count, color: '#a78bfa' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="rounded-xl px-2 py-3 flex flex-col items-center gap-1" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
                    <span className="text-2xl font-black" style={{ color }}>{count}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>de {totalPppiInformes}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna 3: Socializaciones atrasadas */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{
              background: (soc2Atrasadas + soc3Atrasadas) > 0
                ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.06))'
                : 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.06))',
              border: `1px solid ${(soc2Atrasadas + soc3Atrasadas) > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Socializaciones atrasadas</p>
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[
                  { label: '1ª Social.', count: 0, note: 'Sin umbral' },
                  { label: '2ª Social.', count: soc2Atrasadas, note: '>70% sin registrar' },
                  { label: '3ª Social.', count: soc3Atrasadas, note: '>90% sin registrar' },
                ].map(({ label, count, note }) => (
                  <div key={label} className="rounded-xl px-2 py-3 flex flex-col items-center gap-1" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
                    <span className="text-2xl font-black" style={{ color: count > 0 ? '#f87171' : '#34d399' }}>{count}</span>
                    <span className="text-xs text-center" style={{ color: 'var(--muted)' }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Indicadores de impacto ── */}
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Indicadores de impacto</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Matrícula escolar */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Matrícula escolar</p>
              <div className="space-y-2">
                {matriculaPorAnio.map(({ anio, ninos, ninas, total }) => (
                  <div key={anio} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-10 shrink-0" style={{ color: 'var(--muted)' }}>{anio}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: total > 0 ? '100%' : '0%', background: 'rgba(99,102,241,0.6)' }} />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: total > 0 ? 'var(--foreground)' : 'var(--muted)' }}>
                      {total > 0 ? total : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <div>Niños: {matriculaPorAnio.reduce((s, r) => s + r.ninos, 0)}</div>
                <div>Niñas: {matriculaPorAnio.reduce((s, r) => s + r.ninas, 0)}</div>
              </div>
            </div>

            {/* Inasistencias */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Inasistencias</p>
              <div className="space-y-2">
                {inasistenciasPorAnio.map(({ anio, total }) => (
                  <div key={anio} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-10 shrink-0" style={{ color: 'var(--muted)' }}>{anio}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(234,179,8,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: total > 0 ? '100%' : '0%', background: 'rgba(234,179,8,0.6)' }} />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: total > 0 ? '#fbbf24' : 'var(--muted)' }}>
                      {total > 0 ? total : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deserciones */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Deserciones</p>
              <div className="space-y-2">
                {desercionesPorAnio.map(({ anio, total }) => (
                  <div key={anio} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-10 shrink-0" style={{ color: 'var(--muted)' }}>{anio}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: total > 0 ? '100%' : '0%', background: 'rgba(239,68,68,0.6)' }} />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: total > 0 ? '#f87171' : 'var(--muted)' }}>
                      {total > 0 ? total : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Empleos directos e indirectos */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Empleos generados</p>
              <div className="space-y-2">
                {empleosPorAnio.map(({ anio, directos, indirectos, total }) => (
                  <div key={anio} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-10 shrink-0" style={{ color: 'var(--muted)' }}>{anio}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: total > 0 ? '100%' : '0%', background: 'rgba(16,185,129,0.6)' }} />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: total > 0 ? '#34d399' : 'var(--muted)' }}>
                      {total > 0 ? total : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto space-y-1">
                {empleosPorAnio.filter(e => e.total > 0).map(({ anio, directos, indirectos }) => (
                  <div key={anio} className="flex gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                    <span className="font-bold" style={{ color: 'var(--foreground)' }}>{anio}:</span>
                    <span>Directos {directos}</span>
                    <span>Indirectos {indirectos}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Bloque 8: MAQR — Quejas y Reclamos ── */}
      {hayMaqr && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span>📋</span>
            Condición 6 — Mecanismo de Atención de Quejas y Reclamos · {periodoLabel}
          </h2>
          <p className="text-sm font-semibold mb-3 mt-1" style={{ color: 'var(--foreground)' }}>Registro de quejas</p>

          {/* Fila 1: Total | Por estado | Por medio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Total quejas */}
            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total quejas reportadas</p>
              <p className="text-6xl font-black mt-1" style={{ color: 'var(--foreground)' }}>{totalQuejas}</p>
              <div className="flex gap-3 mt-auto flex-wrap">
                {[
                  { label: 'Abiertas', count: (quejasPorEstado['En proceso'] ?? 0) + (quejasPorEstado['En investigación'] ?? 0), color: '#f97316' },
                  { label: 'Resueltas', count: (quejasPorEstado['Resuelto'] ?? 0) + (quejasPorEstado['Cerrado'] ?? 0), color: '#10b981' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs font-semibold" style={{ color }}>{count} {label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por estado */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Por estado</p>
              <div className="space-y-2">
                {([
                  { estado: 'En proceso',       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
                  { estado: 'En investigación',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
                  { estado: 'Resuelto',          color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
                  { estado: 'Cerrado',           color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
                ] as const).map(({ estado, color, bg }) => {
                  const count = quejasPorEstado[estado] ?? 0
                  const pct   = totalQuejas > 0 ? Math.round((count / totalQuejas) * 100) : 0
                  return (
                    <div key={estado} className="flex items-center gap-2">
                      <span className="text-xs w-28 shrink-0 font-medium" style={{ color }}>{estado}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: bg }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-xs font-bold w-6 text-right" style={{ color: 'var(--foreground)' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Por medio */}
            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Medio utilizado</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(quejasPorMedio)
                  .sort(([, a], [, b]) => b - a)
                  .map(([medio, count]) => (
                    <div key={medio} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                      <span>{medio}</span>
                      <span className="font-black text-indigo-300">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>

          {/* Fila 2: Por tipo | Por origen | Por nivel | Tiempo promedio */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Por tipo */}
            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Tipo de queja</p>
              <div className="space-y-2">
                {Object.entries(quejasPorTipo)
                  .sort(([, a], [, b]) => b - a)
                  .map(([tipo, count]) => {
                    const pct = totalQuejas > 0 ? Math.round((count / totalQuejas) * 100) : 0
                    return (
                      <div key={tipo} className="flex items-center gap-2">
                        <span className="text-xs flex-1 font-medium truncate" style={{ color: 'var(--foreground)' }} title={tipo}>{tipo}</span>
                        <div className="w-12 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(234,179,8,0.15)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#fbbf24' }} />
                        </div>
                        <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#fbbf24' }}>{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Por origen */}
            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Origen de la queja</p>
              <div className="space-y-2">
                {Object.entries(quejasPorOrigen)
                  .sort(([, a], [, b]) => b - a)
                  .map(([origen, count]) => {
                    const pct = totalQuejas > 0 ? Math.round((count / totalQuejas) * 100) : 0
                    return (
                      <div key={origen} className="flex items-center gap-2">
                        <span className="text-xs flex-1 font-medium truncate" style={{ color: 'var(--foreground)' }} title={origen}>{origen}</span>
                        <div className="w-12 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#c084fc' }} />
                        </div>
                        <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#c084fc' }}>{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Por nivel de gravedad */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Nivel de gravedad</p>
              <div className="space-y-3">
                {([
                  { nivel: 'Nivel 1 (Bajo)',  color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
                  { nivel: 'Nivel 2 (Medio)', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
                  { nivel: 'Nivel 3 (Alto)',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                ] as const).map(({ nivel, color, bg }) => {
                  const count = quejasPorNivel[nivel] ?? 0
                  const pct   = totalQuejas > 0 ? Math.round((count / totalQuejas) * 100) : 0
                  return (
                    <div key={nivel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color }}>{nivel}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{count}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: bg }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tiempo promedio por nivel */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Tiempo prom. resolución</p>
              <div className="space-y-3 mt-1">
                {([
                  { nivel: 'Nivel 1 (Bajo)',  color: '#34d399' },
                  { nivel: 'Nivel 2 (Medio)', color: '#fbbf24' },
                  { nivel: 'Nivel 3 (Alto)',  color: '#f87171' },
                ] as const).map(({ nivel, color }) => {
                  const dias = tiempoPromedioNivel[nivel]
                  return (
                    <div key={nivel} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                      <span className="text-xs font-medium" style={{ color }}>{nivel}</span>
                      <div className="text-right">
                        {dias !== null
                          ? <><span className="text-lg font-black" style={{ color }}>{dias}</span><span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>días</span></>
                          : <span className="text-xs italic" style={{ color: 'var(--muted)' }}>Sin datos</span>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Bloque 9: Reubicación Temporal — Continuidad Educativa ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
          <span>🏫</span>
          Reubicación Temporal — Modalidad de Continuidad Educativa
        </h2>

        {hayReubicacion ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Presencial */}
            <ReubicacionCard
              modalidad="Presencial"
              color="bg-blue-50 dark:bg-blue-950"
              borderColor="border-blue-200 dark:border-blue-700"
              textColor="text-blue-700 dark:text-blue-300"
              iconColor="text-blue-600"
              count={reubPresencial.length}
              centros={reubPresencial.map(r => r.escuela_nombre)}
            />

            {/* Virtual */}
            <ReubicacionCard
              modalidad="Virtual"
              color="bg-purple-50 dark:bg-purple-950"
              borderColor="border-purple-200 dark:border-purple-700"
              textColor="text-purple-700 dark:text-purple-300"
              iconColor="text-purple-600"
              count={reubVirtual.length}
              centros={reubVirtual.map(r => r.escuela_nombre)}
            />

            {/* Multimodal */}
            <ReubicacionCard
              modalidad="Multimodal"
              color="bg-amber-50 dark:bg-amber-950"
              borderColor="border-amber-200 dark:border-amber-700"
              textColor="text-amber-700 dark:text-amber-300"
              iconColor="text-amber-600"
              count={reubMultimodal.length}
              centros={reubMultimodal.map(r => r.escuela_nombre)}
            />

          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin datos de Reubicación Temporal disponibles</p>
          </div>
        )}
      </div>

      </div>
    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────

// Colores hardcodeados para evitar purge de Tailwind en clases dinámicas



