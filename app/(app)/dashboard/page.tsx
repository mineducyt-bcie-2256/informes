import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { MESES } from '@/types'
import {
  Building2, School, FileText, CheckCircle, Clock,
  HardHat, BarChart2, Filter, ChevronRight, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

// ── Secciones de formulario ────────────────────────────────────────
const SECCIONES = [
  { key: 'portada',               tabla: 'informe_portada',                short: 'PORTADA' },
  { key: 'c1317',                 tabla: 'informe_c1317',                  short: 'C13-17'  },
  { key: 'hsso',                  tabla: 'informe_hsso',                   short: 'HSSO'    },
  { key: 'garo',                  tabla: 'informe_garo',                   short: 'GARO'    },
  { key: 'pgr',                   tabla: 'informe_pgr',                    short: 'PGR'     },
  { key: 'mcear',                 tabla: 'informe_mcear',                  short: 'MCEAR'   },
  { key: 'pppi',                  tabla: 'informe_pppi',                   short: 'PPPI'    },
  { key: 'maqr',                  tabla: 'informe_maqr',                   short: 'MAQR'    },
  { key: 'prt',                   tabla: 'informe_prt',                    short: 'PRT'     },
  { key: 'cct',                   tabla: 'informe_cct',                    short: 'CCT'     },
  { key: 'cumplimiento_ambiental',tabla: 'informe_cumplimiento_ambiental', short: 'C.AMB'   },
]

const ESTADO_BADGE: Record<string, string> = {
  aprobado: 'bg-green-100 text-green-700',
  enviado:  'bg-blue-100  text-blue-700',
  borrador: 'bg-amber-100 text-amber-700',
}

const ESTADO_LABEL: Record<string, string> = {
  aprobado: 'Aprobado',
  enviado:  'Enviado',
  borrador: 'Borrador',
}

// ── Tipos internos ─────────────────────────────────────────────────
type Escuela = {
  id: string
  nombre: string
  empresa_supervision: string | null
  numero_contrato: string | null
  etapa: string | null
  grupos: { nombre: string }[] | null
}

type Informe = {
  id: string
  escuela_id: string
  estado: string
  periodo_mes: number
  periodo_anio: number
}

// ── Funciones cacheadas (datos que cambian poco) ───────────────────
const adminUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const adminKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const getEscuelas = unstable_cache(
  async (soloDemo: boolean) => {
    const admin = createAdmin(adminUrl, adminKey)
    const q = admin.from('escuelas')
      .select('id, nombre, empresa_supervision, numero_contrato, etapa, grupos(nombre)')
      .eq('activa', true)
    if (soloDemo) q.eq('es_demo', true)
    const { data } = await q
    return (data ?? []) as Escuela[]
  },
  ['escuelas-dashboard'],
  { revalidate: 300 } // 5 minutos
)

const getEmpresas = unstable_cache(
  async () => {
    const admin = createAdmin(adminUrl, adminKey)
    const { data } = await admin.from('escuelas')
      .select('empresa_supervision')
      .eq('activa', true)
      .eq('etapa', 'Construcción')
      .neq('numero_contrato', 'SIN ADJUDICAR')
      .not('numero_contrato', 'is', null)
    return (data ?? []) as { empresa_supervision: string }[]
  },
  ['empresas-dashboard'],
  { revalidate: 300 } // 5 minutos
)

// ── Helpers ────────────────────────────────────────────────────────
function esConContrato(e: Escuela) {
  return e.numero_contrato && e.numero_contrato.trim().toUpperCase() !== 'SIN ADJUDICAR'
}

function esConstruccion(e: Escuela) {
  return e.etapa?.toLowerCase().includes('construcci') ?? false
}

// ─────────────────────────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; escuela_id?: string; mes?: string }>
}) {
  const params     = await searchParams
  const empresaSel  = params.empresa    ? decodeURIComponent(params.empresa)    : null
  const escuelaId  = params.escuela_id ? decodeURIComponent(params.escuela_id) : null

  const supabase   = await createClient()
  // Admin client para consultas de datos (bypasa RLS)
  const admin      = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const hoy        = new Date()
  const mesActual  = hoy.getMonth() + 1

  // ── Perfil del usuario logueado ────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  let miEmpresa: string | null = null
  let miRol: string = 'programador'
  if (user) {
    const { data: perfil } = await supabase.from('profiles')
      .select('rol, empresa_supervision').eq('id', user.id).single()
    miRol     = perfil?.rol ?? 'programador'
    miEmpresa = perfil?.empresa_supervision ?? null
  }

  // Solo el rol 'usuario' queda restringido a su empresa
  const esRestringido = miRol === 'usuario' && !!miEmpresa
  const esVisitante   = miRol === 'visitante'
  const empresaForzada = esRestringido ? miEmpresa : null

  // Visitante: obtener ID de la escuela demo y forzar mes marzo 2026
  let escuelaDemoId: string | null = null
  if (esVisitante) {
    const { data: demoEsc } = await admin.from('escuelas').select('id').eq('es_demo', true).limit(1).single()
    escuelaDemoId = demoEsc?.id ?? null
  }
  const mesSel = esVisitante ? 3 : (params.mes ? parseInt(params.mes) : mesActual)
  const anio   = esVisitante ? 2026 : hoy.getFullYear()

  // Empresa seleccionada: si está restringido usa la suya, sino la del param URL
  const empresaEfectiva = empresaForzada ?? empresaSel

  // Visitante fuerza nivel escuela con la demo
  const escuelaIdEfectivo = esVisitante ? (escuelaDemoId ?? escuelaId) : escuelaId

  // ── Nivel activo ───────────────────────────────────────────────
  const nivel: 'total' | 'empresa' | 'escuela' =
    escuelaIdEfectivo ? 'escuela'  :
    empresaEfectiva   ? 'empresa'  : 'total'

  // Alias para el resto del código
  const empresaEfectiva2 = empresaEfectiva

  // ── Queries base en paralelo ───────────────────────────────────
  const [
    todasEscuelas,
    rawInformesMes,
    rawInformesAnio,
    rawEmpresas,
  ] = await Promise.all([
    // Escuelas — cacheadas 5 minutos
    getEscuelas(esVisitante),

    // Informes del mes seleccionado
    admin
      .from('informes')
      .select('id, escuela_id, estado, periodo_mes, periodo_anio')
      .eq('periodo_mes', mesSel)
      .eq('periodo_anio', anio)
      .then(r => r.data ?? []),

    // Informes del año actual
    nivel === 'escuela'
      ? admin
          .from('informes')
          .select('id, escuela_id, estado, periodo_mes, periodo_anio')
          .eq('escuela_id', escuelaIdEfectivo!)
          .eq('periodo_anio', anio)
          .order('periodo_mes', { ascending: false })
          .then(r => r.data ?? [])
      : admin
          .from('informes')
          .select('id, escuela_id, estado, periodo_mes, periodo_anio')
          .eq('periodo_anio', anio)
          .then(r => r.data ?? []),

    // Empresas — cacheadas 5 minutos
    getEmpresas(),
  ])

  const informesMes  = rawInformesMes  as Informe[]
  const informesAnio = rawInformesAnio as Informe[]

  // Empresas únicas para el selector
  const empresasUnicas = Array.from(
    new Set(rawEmpresas.map((e: any) => e.empresa_supervision).filter(Boolean))
  ).sort() as string[]

  // Filtrar escuelas: activas, con contrato, en construcción
  const escuelasBase = todasEscuelas.filter(e => esConContrato(e) && esConstruccion(e))

  // Escuelas de la empresa seleccionada (si aplica) — solo construcción con contrato
  const escuelasEmpresa = empresaEfectiva
    ? escuelasBase.filter(e => e.empresa_supervision === empresaEfectiva)
    : escuelasBase

  // Escuela seleccionada (si aplica)
  const escuelaSel = escuelaIdEfectivo
    ? todasEscuelas.find(e => e.id === escuelaIdEfectivo)
    : null

  // Escuelas a considerar para KPIs y tabla
  const escuelasFiltradas = nivel === 'escuela'
    ? (escuelaSel ? [escuelaSel] : [])
    : escuelasEmpresa

  const escuelaIds = new Set(escuelasFiltradas.map(e => e.id))

  // Informes del mes filtrados
  const infMesFiltrados = informesMes.filter(i => escuelaIds.has(i.escuela_id))

  // ── KPIs ───────────────────────────────────────────────────────
  const kpiCEs        = escuelasFiltradas.length
  const kpiInformes   = infMesFiltrados.length
  const kpiAprobados  = infMesFiltrados.filter(i => i.estado === 'aprobado').length
  const kpiPendientes = escuelasFiltradas.filter(
    e => !infMesFiltrados.some(i => i.escuela_id === e.id)
  ).length

  // ── Tabla por empresa ──────────────────────────────────────────
  type EmpresaRow = {
    totalCEs: number; informes: number; aprobados: number
    enviados: number; borrador: number
  }
  const porEmpresa: Record<string, EmpresaRow> = {}

  for (const e of escuelasBase) {
    const emp = e.empresa_supervision ?? 'Sin empresa'
    if (!porEmpresa[emp]) porEmpresa[emp] = { totalCEs: 0, informes: 0, aprobados: 0, enviados: 0, borrador: 0 }
    porEmpresa[emp].totalCEs++
  }
  for (const inf of informesMes) {
    const esc = escuelasBase.find(e => e.id === inf.escuela_id)
    if (!esc) continue
    const emp = esc.empresa_supervision ?? 'Sin empresa'
    if (!porEmpresa[emp]) continue
    porEmpresa[emp].informes++
    if (inf.estado === 'aprobado') porEmpresa[emp].aprobados++
    if (inf.estado === 'enviado')  porEmpresa[emp].enviados++
    if (inf.estado === 'borrador') porEmpresa[emp].borrador++
  }
  const tablaEmpresas = Object.entries(porEmpresa).sort(([a], [b]) => a.localeCompare(b))

  const totales = tablaEmpresas.reduce(
    (acc, [, r]) => ({
      totalCEs:  acc.totalCEs  + r.totalCEs,
      informes:  acc.informes  + r.informes,
      aprobados: acc.aprobados + r.aprobados,
      enviados:  acc.enviados  + r.enviados,
      borrador:  acc.borrador  + r.borrador,
    }),
    { totalCEs: 0, informes: 0, aprobados: 0, enviados: 0, borrador: 0 }
  )

  // ── Análisis de formularios ────────────────────────────────────
  // Para los informes relevantes (del año, filtrados por escuelas)
  const informesParaAnalisis = informesAnio.filter(i => escuelaIds.has(i.escuela_id))
  const idsParaAnalisis      = informesParaAnalisis.map(i => i.id)

  // Mapa: informe_id → Set<seccion_key>
  const formulariosMap: Record<string, Set<string>> = {}

  if (idsParaAnalisis.length > 0) {
    const { data: seccionesData } = await admin.rpc('get_secciones_completadas', {
      informe_ids: idsParaAnalisis,
    })
    for (const row of seccionesData ?? []) {
      if (!formulariosMap[row.informe_id]) formulariosMap[row.informe_id] = new Set()
      formulariosMap[row.informe_id].add(row.seccion)
    }
  }

  // Estadísticas por sección
  const statsPorSeccion = SECCIONES.map(sec => {
    const completados = idsParaAnalisis.filter(id => formulariosMap[id]?.has(sec.key)).length
    return { ...sec, completados, total: idsParaAnalisis.length }
  })

  // ── Tabla de escuelas (nivel empresa) ─────────────────────────
  // Informe del mes por escuela
  const informesPorEscuela: Record<string, Informe | null> = {}
  for (const esc of escuelasEmpresa) {
    informesPorEscuela[esc.id] = infMesFiltrados.find(i => i.escuela_id === esc.id) ?? null
  }

  // ── Labels de nivel ───────────────────────────────────────────
  const vistaLabel =
    nivel === 'escuela' ? (escuelaSel?.nombre ?? 'Escuela')  :
    nivel === 'empresa' ? empresaEfectiva!                         : 'Total'

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-xl mx-auto">

      {/* ── Encabezado + barra de filtros ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {MESES[mesSel - 1]} {anio} — Programa Mi Nueva Escuela BCIE
          </p>
        </div>

        {/* Formulario GET de filtros */}
        <form method="GET" className="flex flex-wrap items-end gap-3">
          {/* Select empresa — oculto si el usuario está restringido a su empresa */}
          {esRestringido ? (
            <>
              <input type="hidden" name="empresa" value={empresaEfectiva ?? ''} />
              <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800 min-w-[220px]">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
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
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[220px]"
              >
                <option value="">— Todas las empresas —</option>
                {empresasUnicas.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          )}

          {/* Select escuela (solo si hay empresa seleccionada) */}
          {empresaEfectiva && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Escuela
              </label>
              <select
                name="escuela_id"
                defaultValue={escuelaId ?? ''}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[280px]"
              >
                <option value="">— Todas las escuelas —</option>
                {escuelasEmpresa.map(esc => (
                  <option key={esc.id} value={esc.id}>{esc.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Select mes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Mes
            </label>
            <select
              name="mes"
              defaultValue={mesSel}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
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

          {/* Chip de nivel activo */}
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            nivel === 'total'   ? 'bg-slate-100 text-slate-600 border-slate-200' :
            nivel === 'empresa' ? 'bg-blue-50 text-blue-700 border-blue-200'     :
                                  'bg-violet-50 text-violet-700 border-violet-200'
          }`}>
            {nivel === 'total'   && <BarChart2 size={13} />}
            {nivel === 'empresa' && <Building2 size={13} />}
            {nivel === 'escuela' && <School    size={13} />}
            Vista: {vistaLabel}
          </span>

          {/* Reset link */}
          {nivel !== 'total' && (
            <Link
              href={`/dashboard${mesSel !== mesActual ? `?mes=${mesSel}` : ''}`}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Limpiar filtros
            </Link>
          )}
        </form>
      </div>

      {/* ── KPI Cards ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Resumen — {MESES[mesSel - 1]} {anio}
          {nivel !== 'total' && <span className="ml-2 normal-case font-normal text-slate-400">· {vistaLabel}</span>}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={HardHat}      color="orange" value={kpiCEs}        label="CEs en construcción" />
          <StatCard icon={FileText}     color="slate"  value={kpiInformes}   label="Informes este mes" />
          <StatCard icon={CheckCircle}  color="green"  value={kpiAprobados}  label="Aprobados este mes" />
          <StatCard icon={AlertCircle}  color="amber"  value={kpiPendientes} label="CEs sin informe" />
        </div>
      </div>

      {/* ── NIVEL ESCUELA: Tabla de informes del año ── */}
      {nivel === 'escuela' && escuelaSel && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <School size={14} />
            Informes de {escuelaSel.nombre} — {anio}
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Período</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Formularios completados</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {informesAnio.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No hay informes registrados este año
                    </td>
                  </tr>
                )}
                {informesAnio.map(inf => {
                  const seccCompletas = formulariosMap[inf.id] ?? new Set<string>()
                  return (
                    <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {MESES[inf.periodo_mes - 1]} {inf.periodo_anio}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[inf.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ESTADO_LABEL[inf.estado] ?? inf.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {SECCIONES.map(sec => (
                            <span
                              key={sec.key}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                seccCompletas.has(sec.key)
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {sec.short}
                            </span>
                          ))}
                        </div>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NIVEL EMPRESA: Tabla de escuelas de esa empresa ── */}
      {nivel === 'empresa' && empresaEfectiva && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <School size={14} />
            Escuelas de {empresaEfectiva} — {MESES[mesSel - 1]} {anio}
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Escuela</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Grupo</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Informe este mes</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {escuelasEmpresa.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No hay escuelas en construcción para esta empresa
                    </td>
                  </tr>
                )}
                {escuelasEmpresa.map(esc => {
                  const inf = informesPorEscuela[esc.id]
                  return (
                    <tr key={esc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{esc.nombre}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{esc.grupos?.[0]?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {inf ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[inf.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                            {ESTADO_LABEL[inf.estado] ?? inf.estado}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pendiente</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard?empresa=${encodeURIComponent(empresaEfectiva!)}&escuela_id=${esc.id}&mes=${mesSel}`}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs font-medium"
                        >
                          Detalle <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tabla por empresa (siempre visible) ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Building2 size={14} />
          Resumen por empresa de supervisión — {MESES[mesSel - 1]} {anio}
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Empresa de supervisión</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">CEs</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Informes mes</th>
                <th className="text-center px-4 py-3 font-semibold text-green-700">Aprobados</th>
                <th className="text-center px-4 py-3 font-semibold text-blue-700">Enviados</th>
                <th className="text-center px-4 py-3 font-semibold text-amber-700">Borrador</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-500">Sin informe</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">% Cobertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tablaEmpresas.map(([empresa, row]) => {
                const sinInforme = row.totalCEs - row.informes
                const cobertura = row.totalCEs > 0 ? Math.round((row.informes / row.totalCEs) * 100) : 0
                const isActive  = empresaEfectiva === empresa
                return (
                  <tr
                    key={empresa}
                    className={`hover:bg-slate-50 transition-colors ${isActive ? 'bg-blue-50/60' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <Link
                        href={`/dashboard?empresa=${encodeURIComponent(empresa)}&mes=${mesSel}`}
                        className="hover:text-blue-700 hover:underline underline-offset-2 flex items-center gap-1"
                      >
                        {isActive && <ChevronRight size={13} className="text-blue-500 shrink-0" />}
                        {empresa}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{row.totalCEs}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.informes}</td>
                    <td className="px-4 py-3 text-center">
                      {row.aprobados > 0
                        ? <Pill value={row.aprobados} cls="bg-green-100 text-green-700" />
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.enviados > 0
                        ? <Pill value={row.enviados} cls="bg-blue-100 text-blue-700" />
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.borrador > 0
                        ? <Pill value={row.borrador} cls="bg-amber-100 text-amber-700" />
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sinInforme > 0
                        ? <Pill value={sinInforme} cls="bg-slate-100 text-slate-500" />
                        : <span className="text-green-600 text-xs font-semibold">Completo</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cobertura >= 80 ? 'bg-green-500' : cobertura >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${cobertura}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{cobertura}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-800">Total general</td>
                <td className="px-4 py-3 text-center font-bold text-slate-800">{totales.totalCEs}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-800">{totales.informes}</td>
                <td className="px-4 py-3 text-center font-bold text-green-700">{totales.aprobados}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-700">{totales.enviados}</td>
                <td className="px-4 py-3 text-center font-bold text-amber-700">{totales.borrador}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-500">{totales.totalCEs - totales.informes}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-600">
                  {totales.totalCEs > 0 ? Math.round((totales.informes / totales.totalCEs) * 100) : 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Análisis de completitud de formularios ── */}
      {idsParaAnalisis.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BarChart2 size={14} />
            Análisis de formularios — {anio}
            {nivel !== 'total' && (
              <span className="normal-case font-normal text-slate-400 ml-1">· {vistaLabel}</span>
            )}
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Sección</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Completados</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Total informes</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">%</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsPorSeccion.map(sec => {
                  const pct = sec.total > 0 ? Math.round((sec.completados / sec.total) * 100) : 0
                  return (
                    <tr key={sec.key} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {sec.short}
                          </span>
                          <span className="text-slate-700 capitalize">{sec.key.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">{sec.completados}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{sec.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          pct >= 80 ? 'bg-green-100 text-green-700' :
                          pct >= 50 ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100  text-red-600'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 80 ? 'bg-green-500' :
                              pct >= 50 ? 'bg-amber-400' :
                                          'bg-red-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-200'   },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-200'  },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-200'  },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200' },
  slate:  { bg: 'bg-slate-50',  icon: 'text-slate-600',  border: 'border-slate-200'  },
}

function StatCard({ icon: Icon, color, value, label }: {
  icon: React.ElementType; color: string; value: number; label: string
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${c.bg}`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 leading-tight">{label}</p>
      </div>
    </div>
  )
}

function Pill({ value, cls }: { value: number; cls: string }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] h-7 rounded-full text-xs font-bold px-2 ${cls}`}>
      {value}
    </span>
  )
}
