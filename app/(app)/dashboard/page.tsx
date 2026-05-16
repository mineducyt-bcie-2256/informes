import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { MESES } from '@/types'
import {
  Building2, School, FileText, CheckCircle, Clock,
  HardHat, Users, AlertTriangle, Filter, ChevronRight,
  UserCheck, UserX, Activity, ShieldAlert,
} from 'lucide-react'
import Link from 'next/link'
import PersonalDonut from '@/components/dashboard/PersonalDonut'

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

function buildSearchParams(
  base: Record<string, string | number | null | undefined>,
  override: Record<string, string | number | null | undefined> = {}
) {
  const merged = { ...base, ...override }
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v !== null && v !== undefined && v !== '') params.set(k, String(v))
  }
  const str = params.toString()
  return str ? `?${str}` : ''
}

// ── Colores de estado ──────────────────────────────────────────────
const ESTADO_BADGE: Record<string, string> = {
  aprobado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  enviado:  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  borrador: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
}
const ESTADO_LABEL: Record<string, string> = {
  aprobado: 'Aprobado',
  enviado:  'Enviado',
  borrador: 'Borrador',
}

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
  const detalleSel = params.detalle ?? null

  // ── Filtros de empresa / escuela ───────────────────────────────
  const empresaParam  = params.empresa    ? decodeURIComponent(params.empresa)    : null
  const escuelaParam  = params.escuela_id ? decodeURIComponent(params.escuela_id) : null

  const empresaEfectiva   = esRestringido ? miEmpresa : (esVisitante ? null : empresaParam)
  const escuelaIdEfectiva = esVisitante ? escuelaDemoId : escuelaParam

  // Params activos para construir URLs
  const baseParams: Record<string, string | number | null | undefined> = {
    empresa:    empresaEfectiva   ?? undefined,
    escuela_id: escuelaIdEfectiva ?? undefined,
    mes:        mesSel !== mesDefault ? mesSel : undefined,
    mes_desde:  mesDesde ?? undefined,
    mes_hasta:  mesHasta ?? undefined,
  }

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

  // ── KPIs ───────────────────────────────────────────────────────
  const kpiConstruccion = escuelasFiltradas.length
  const kpiInformes     = informesFiltrados.length
  const kpiPresentados  = informesFiltrados.filter(i => i.estado === 'enviado' || i.estado === 'aprobado').length
  const kpiAprobados    = informesFiltrados.filter(i => i.estado === 'aprobado').length

  // Escuelas sin informe en el periodo
  const escuelasConInforme = new Set(informesFiltrados.map(i => i.escuela_id))
  const escuelasSinInforme = escuelasFiltradas.filter(e => !escuelasConInforme.has(e.id))
  const kpiPendientes = escuelasSinInforme.length

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
  let garoData: { unidades_sanitarias: UnidadSanitaria[] }[] = []
  if (informeIds.length > 0) {
    const { data: rawGaro } = await admin
      .from('informe_garo')
      .select('unidades_sanitarias')
      .in('informe_id', informeIds)
    garoData = (rawGaro ?? []) as any[]
  }
  const todasUnidades: UnidadSanitaria[] = garoData.flatMap(g => g.unidades_sanitarias ?? [])
  const totalUnidades  = todasUnidades.reduce((s, u) => s + (u.total || 0), 0)
  const totalUnidadesH = todasUnidades.reduce((s, u) => s + (u.hombres || 0), 0)
  const totalUnidadesM = todasUnidades.reduce((s, u) => s + (u.mujeres || 0), 0)
  // Agrupado por tipo
  const unidadesPorTipo: Record<string, { hombres: number; mujeres: number; total: number }> = {}
  for (const u of todasUnidades) {
    const t = u.tipo || 'Sin tipo'
    if (!unidadesPorTipo[t]) unidadesPorTipo[t] = { hombres: 0, mujeres: 0, total: 0 }
    unidadesPorTipo[t].hombres += u.hombres || 0
    unidadesPorTipo[t].mujeres += u.mujeres || 0
    unidadesPorTipo[t].total   += u.total   || 0
  }
  // Criterio: 1 unidad por cada 20 personas (usando personal HSSO)
  const personalTotal   = totalPersonal || 0
  const unidadesMinimas = Math.ceil(personalTotal / 20)
  const cumpleCriterio  = totalUnidades >= unidadesMinimas && totalUnidadesH > 0 && totalUnidadesM > 0

  // ── PGR: residuos ─────────────────────────────────────────────
  interface MaterialResiduos { nombre: string; peso_kg: number; unidad?: string }
  interface ResiduoReg { categoria: string; materiales: MaterialResiduos[] }
  let pgrData: { residuos_demolicion: ResiduoReg[]; residuos_construccion: ResiduoReg[] }[] = []
  if (informeIds.length > 0) {
    const { data: rawPgr } = await admin
      .from('informe_pgr')
      .select('residuos_demolicion, residuos_construccion')
      .in('informe_id', informeIds)
    pgrData = (rawPgr ?? []) as any[]
  }

  const CATEGORIAS_PGR = ['Inertes', 'No Peligrosos', 'Peligrosos'] as const
  type CategoriaPgr = typeof CATEGORIAS_PGR[number]

  function sumKg(residuos: ResiduoReg[], cat: string) {
    return residuos
      .filter(r => r.categoria === cat)
      .flatMap(r => r.materiales ?? [])
      .filter(m => !m.unidad || m.unidad === 'kg')
      .reduce((s, m) => s + (m.peso_kg || 0), 0)
  }

  const pgrDemolicion: Record<CategoriaPgr, number> = {
    'Inertes':        pgrData.reduce((s, p) => s + sumKg(p.residuos_demolicion ?? [], 'Inertes'), 0),
    'No Peligrosos':  pgrData.reduce((s, p) => s + sumKg(p.residuos_demolicion ?? [], 'No Peligrosos'), 0),
    'Peligrosos':     pgrData.reduce((s, p) => s + sumKg(p.residuos_demolicion ?? [], 'Peligrosos'), 0),
  }
  const pgrConstruccion: Record<CategoriaPgr, number> = {
    'Inertes':        pgrData.reduce((s, p) => s + sumKg(p.residuos_construccion ?? [], 'Inertes'), 0),
    'No Peligrosos':  pgrData.reduce((s, p) => s + sumKg(p.residuos_construccion ?? [], 'No Peligrosos'), 0),
    'Peligrosos':     pgrData.reduce((s, p) => s + sumKg(p.residuos_construccion ?? [], 'Peligrosos'), 0),
  }
  const totalDemolicion   = Object.values(pgrDemolicion).reduce((s, v) => s + v, 0)
  const totalConstruccion = Object.values(pgrConstruccion).reduce((s, v) => s + v, 0)
  const hayPgr = totalDemolicion > 0 || totalConstruccion > 0

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
  const covNoRegistrado = aireCov.every(m => m.no_registrado)

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
      partesTotales[key].hombres += val.hombres || 0
      partesTotales[key].mujeres += val.mujeres || 0
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
    return arr.filter(r => r.anio === anio).reduce((s, r) => s + ((r[field] as number) || 0), 0)
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
      return s + rows.reduce((ss, x) => ss + (x.cantidad || 0), 0)
    }, 0)
    return { anio, total }
  })

  // Deserciones por año (suma del periodo)
  const desercionesPorAnio = ANIOS_IND.map(anio => {
    const total = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.deserciones ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (x.cantidad || 0), 0)
    }, 0)
    return { anio, total }
  })

  // Empleos directos + indirectos por año
  const empleosPorAnio = ANIOS_IND.map(anio => {
    const directosH = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_directos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (x.hombres || 0), 0)
    }, 0)
    const directosM = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_directos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (x.mujeres || 0), 0)
    }, 0)
    const indirectosH = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_indirectos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (x.hombres || 0), 0)
    }, 0)
    const indirectosM = pppiData.reduce((s, r) => {
      const rows = (r.indicadores_impacto?.empleos_indirectos ?? []).filter(x => x.anio === anio)
      return s + rows.reduce((ss, x) => ss + (x.mujeres || 0), 0)
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
    // Quejas históricas: todas las escuelas filtradas, SIN restricción de periodo
    // (una queja abierta en marzo sigue vigente en abril/mayo)
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
  }

  const totalQuejas = todasQuejas.length

  // Por estado
  const ESTADOS_QUEJA = ['En proceso', 'En investigación', 'Resuelto', 'Cerrado']
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

  // ── Periodo label ──────────────────────────────────────────────
  let periodoLabel: string
  if (mesDesde && mesHasta && mesDesde !== mesHasta) {
    periodoLabel = `${MESES[mesDesde - 1]} – ${MESES[mesHasta - 1]} ${anio}`
  } else {
    periodoLabel = `${MESES[mesSel - 1]} ${anio}`
  }

  // ── Detalle expandido ──────────────────────────────────────────
  let detalleEscuelas: Escuela[] = []
  let detalleInformes: Informe[] = []

  if (detalleSel === 'construccion') detalleEscuelas = escuelasFiltradas
  if (detalleSel === 'informes')     detalleInformes = informesFiltrados
  if (detalleSel === 'presentados')  detalleInformes = informesFiltrados.filter(i => i.estado === 'enviado' || i.estado === 'aprobado')
  if (detalleSel === 'aprobados')    detalleInformes = informesFiltrados.filter(i => i.estado === 'aprobado')
  if (detalleSel === 'pendientes')   detalleEscuelas = escuelasSinInforme

  // Mapa id→nombre para detalles de informes
  const escuelaNombreMap = Object.fromEntries(todasEscuelas.map(e => [e.id, e.nombre]))

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e2a45] dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {periodoLabel} — Programa Mi Nueva Escuela BCIE
        </p>
      </div>

      {/* ── Bloque 1: Filtros ── */}
      {!esVisitante && (
        <form method="GET" className="rounded-2xl border p-4 flex flex-wrap items-end gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          {/* Empresa */}
          {esRestringido ? (
            <>
              <input type="hidden" name="empresa" value={empresaEfectiva ?? ''} />
              <div className="flex items-center gap-2 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 text-sm text-blue-800 dark:text-blue-300 min-w-[220px]">
                <Building2 size={14} className="text-blue-500 shrink-0" />
                <span className="font-medium truncate">{empresaEfectiva}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Empresa supervisora
              </label>
              <select
                name="empresa"
                defaultValue={empresaEfectiva ?? ''}
                className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[220px]"
              >
                <option value="">— Todas las empresas —</option>
                {empresasUnicas.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          )}

          {/* Escuela (solo si hay empresa) */}
          {empresaEfectiva && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Escuela
              </label>
              <select
                name="escuela_id"
                defaultValue={escuelaParam ?? ''}
                className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[280px]"
              >
                <option value="">— Todas las escuelas —</option>
                {escuelasDeEmpresa.map(esc => (
                  <option key={esc.id} value={esc.id}>{esc.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mes</label>
            <select
              name="mes"
              defaultValue={mesSel}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {MESES.map((mes, i) => (
                <option key={i + 1} value={i + 1}>{mes}</option>
              ))}
            </select>
          </div>

          {/* Mes desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Desde</label>
            <select
              name="mes_desde"
              defaultValue={mesDesde ?? ''}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">—</option>
              {MESES.map((mes, i) => (
                <option key={i + 1} value={i + 1}>{mes}</option>
              ))}
            </select>
          </div>

          {/* Mes hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hasta</label>
            <select
              name="mes_hasta"
              defaultValue={mesHasta ?? ''}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">—</option>
              {MESES.map((mes, i) => (
                <option key={i + 1} value={i + 1}>{mes}</option>
              ))}
            </select>
          </div>

          {/* Botón filtrar */}
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter size={15} />
            Filtrar
          </button>

          {/* Limpiar filtros */}
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 self-center"
          >
            Limpiar filtros
          </Link>
        </form>
      )}

      {/* ── Bloque 2: Tarjetas de resumen ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
          Resumen — {periodoLabel}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <DetalleCard
            href={`/dashboard${buildSearchParams(baseParams, { detalle: detalleSel === 'construccion' ? undefined : 'construccion' })}`}
            icon={HardHat}
            color="orange"
            value={kpiConstruccion}
            label="CEs en construcción"
            active={detalleSel === 'construccion'}
          />
          <DetalleCard
            href={`/dashboard${buildSearchParams(baseParams, { detalle: detalleSel === 'informes' ? undefined : 'informes' })}`}
            icon={FileText}
            color="slate"
            value={kpiInformes}
            label="Informes del mes"
            active={detalleSel === 'informes'}
          />
          <DetalleCard
            href={`/dashboard${buildSearchParams(baseParams, { detalle: detalleSel === 'presentados' ? undefined : 'presentados' })}`}
            icon={Clock}
            color="blue"
            value={kpiPresentados}
            label="Presentados"
            active={detalleSel === 'presentados'}
          />
          <DetalleCard
            href={`/dashboard${buildSearchParams(baseParams, { detalle: detalleSel === 'aprobados' ? undefined : 'aprobados' })}`}
            icon={CheckCircle}
            color="green"
            value={kpiAprobados}
            label="Aprobados"
            active={detalleSel === 'aprobados'}
          />
          <DetalleCard
            href={`/dashboard${buildSearchParams(baseParams, { detalle: detalleSel === 'pendientes' ? undefined : 'pendientes' })}`}
            icon={AlertTriangle}
            color="amber"
            value={kpiPendientes}
            label="Sin informe"
            active={detalleSel === 'pendientes'}
          />
        </div>
      </div>

      {/* ── Detalle expandido ── */}
      {detalleSel && (detalleEscuelas.length > 0 || detalleInformes.length > 0) && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="text-sm font-semibold text-[#1e2a45] dark:text-slate-200">
              {detalleSel === 'construccion' && 'Centros escolares en construcción'}
              {detalleSel === 'informes'     && 'Informes del periodo'}
              {detalleSel === 'presentados'  && 'Informes presentados (enviado / aprobado)'}
              {detalleSel === 'aprobados'    && 'Informes aprobados'}
              {detalleSel === 'pendientes'   && 'Centros sin informe en el periodo'}
            </h3>
            <Link
              href={`/dashboard${buildSearchParams(baseParams)}`}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cerrar ✕
            </Link>
          </div>

          {/* Tabla de escuelas */}
          {detalleEscuelas.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Escuela</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Empresa supervisora</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Etapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {detalleEscuelas.map(esc => (
                  <tr key={esc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{esc.nombre}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{esc.empresa_supervision ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{esc.etapa ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Tabla de informes */}
          {detalleInformes.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Escuela</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Período</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {detalleInformes.map(inf => (
                  <tr key={inf.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      {escuelaNombreMap[inf.escuela_id] ?? inf.escuela_id}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                      {MESES[inf.periodo_mes - 1]} {inf.periodo_anio}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[inf.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ESTADO_LABEL[inf.estado] ?? inf.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/informes/${inf.id}`}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs font-medium"
                      >
                        Ver <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Tarjeta: Demolición */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Etapa de demolición y desmontaje
                </p>
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
                  {totalDemolicion.toLocaleString()} kg
                </span>
              </div>
              <div className="space-y-2 mt-1">
                {([
                  { cat: 'Inertes',       color: 'rgba(100,116,139,', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' },
                  { cat: 'No Peligrosos', color: 'rgba(16,185,129,',  border: 'rgba(16,185,129,0.3)',  text: '#10b981' },
                  { cat: 'Peligrosos',    color: 'rgba(239,68,68,',   border: 'rgba(239,68,68,0.3)',   text: '#ef4444' },
                ] as const).map(({ cat, color, border, text }) => {
                  const kg = pgrDemolicion[cat as CategoriaPgr]
                  const pct = totalDemolicion > 0 ? Math.round((kg / totalDemolicion) * 100) : 0
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs font-semibold w-28 shrink-0" style={{ color: text }}>{cat}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${color}0.12)` }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `${color}0.7)` }} />
                      </div>
                      <span className="text-xs font-bold w-20 text-right" style={{ color: 'var(--foreground)' }}>
                        {kg > 0 ? `${kg.toLocaleString()} kg` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tarjeta: Construcción */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Etapa de construcción
                </p>
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
                  {totalConstruccion.toLocaleString()} kg
                </span>
              </div>
              <div className="space-y-2 mt-1">
                {([
                  { cat: 'Inertes',       color: 'rgba(100,116,139,', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' },
                  { cat: 'No Peligrosos', color: 'rgba(16,185,129,',  border: 'rgba(16,185,129,0.3)',  text: '#10b981' },
                  { cat: 'Peligrosos',    color: 'rgba(239,68,68,',   border: 'rgba(239,68,68,0.3)',   text: '#ef4444' },
                ] as const).map(({ cat, color, border, text }) => {
                  const kg = pgrConstruccion[cat as CategoriaPgr]
                  const pct = totalConstruccion > 0 ? Math.round((kg / totalConstruccion) * 100) : 0
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs font-semibold w-28 shrink-0" style={{ color: text }}>{cat}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${color}0.12)` }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `${color}0.7)` }} />
                      </div>
                      <span className="text-xs font-bold w-20 text-right" style={{ color: 'var(--foreground)' }}>
                        {kg > 0 ? `${kg.toLocaleString()} kg` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

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

    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────

// Colores hardcodeados para evitar purge de Tailwind en clases dinámicas
const COLOR_MAP: Record<string, {
  gradient: string    // CSS gradient para el card (ambos modos)
  gradientIcon: string // CSS gradient para el ícono
  ring: string
  textAccent: string
}> = {
  orange: { // CEs en construcción → violeta
    gradient:     'linear-gradient(135deg, #7c3aed, #6d28d9)',
    gradientIcon: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    ring:         '#7c3aed',
    textAccent:   '#c4b5fd',
  },
  slate: { // Informes del mes → cyan
    gradient:     'linear-gradient(135deg, #0891b2, #0e7490)',
    gradientIcon: 'linear-gradient(135deg, #22d3ee, #0891b2)',
    ring:         '#0891b2',
    textAccent:   '#67e8f9',
  },
  blue: { // Presentados → teal/esmeralda
    gradient:     'linear-gradient(135deg, #059669, #0d9488)',
    gradientIcon: 'linear-gradient(135deg, #34d399, #059669)',
    ring:         '#059669',
    textAccent:   '#6ee7b7',
  },
  green: { // Aprobados → verde lima
    gradient:     'linear-gradient(135deg, #16a34a, #15803d)',
    gradientIcon: 'linear-gradient(135deg, #4ade80, #16a34a)',
    ring:         '#16a34a',
    textAccent:   '#86efac',
  },
  amber: { // Sin informe → naranja-rojo
    gradient:     'linear-gradient(135deg, #ea580c, #dc2626)',
    gradientIcon: 'linear-gradient(135deg, #fb923c, #ea580c)',
    ring:         '#ea580c',
    textAccent:   '#fdba74',
  },
  violet: {
    gradient:     'linear-gradient(135deg, #7c3aed, #db2777)',
    gradientIcon: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    ring:         '#7c3aed',
    textAccent:   '#c4b5fd',
  },
  red: {
    gradient:     'linear-gradient(135deg, #dc2626, #be185d)',
    gradientIcon: 'linear-gradient(135deg, #f87171, #dc2626)',
    ring:         '#dc2626',
    textAccent:   '#fca5a5',
  },
}

function StatCard({ icon: Icon, color, value, label }: {
  icon: React.ElementType
  color: string
  value: number
  label: string
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.gradientIcon }}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xl font-bold leading-none" style={{ color: 'var(--foreground)' }}>{value.toLocaleString()}</p>
        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <div className="rounded-xl px-3 py-2 text-center" style={{ background: c.gradient }}>
      <p className="text-lg font-bold text-white leading-none">{value.toLocaleString()}</p>
      <p className="text-xs text-white/80 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function DetalleCard({ href, icon: Icon, color, value, label, active }: {
  href: string
  icon: React.ElementType
  color: string
  value: number
  label: string
  active: boolean
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <Link
      href={href}
      className="rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
      style={{
        background: c.gradient,
        boxShadow: active ? `0 0 0 3px ${c.ring}` : undefined,
      }}
    >
      {/* Ícono blanco semitransparente */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-white/80 mt-1.5 leading-tight font-medium">{label}</p>
      </div>
      {active && (
        <div className="text-[11px] font-semibold flex items-center gap-0.5 text-white/90">
          Ver listado <ChevronRight size={11} />
        </div>
      )}
      {/* Círculo decorativo esquina */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
      <div className="absolute -right-2 -bottom-10 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </Link>
  )
}
