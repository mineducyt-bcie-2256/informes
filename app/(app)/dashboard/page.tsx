import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { MESES } from '@/types'
import {
  Building2, School, FileText, CheckCircle, Clock,
  HardHat, Users, AlertTriangle, Filter, ChevronRight,
  UserCheck, UserX, Activity, ShieldAlert,
} from 'lucide-react'
import Link from 'next/link'

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
  aprobado: 'bg-green-100 text-green-700',
  enviado:  'bg-blue-100 text-blue-700',
  borrador: 'bg-amber-100 text-amber-700',
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
      .select('informe_id, personal_hombres, personal_mujeres, personal_total, tiene_accidentes, accidentes')
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
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-xl mx-auto">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {periodoLabel} — Programa Mi Nueva Escuela BCIE
        </p>
      </div>

      {/* ── Bloque 1: Filtros ── */}
      {!esVisitante && (
        <form method="GET" className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
          {/* Empresa */}
          {esRestringido ? (
            <>
              <input type="hidden" name="empresa" value={empresaEfectiva ?? ''} />
              <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800 min-w-[220px]">
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
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[220px]"
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
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[280px]"
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
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 self-center"
          >
            Limpiar filtros
          </Link>
        </form>
      )}

      {/* ── Bloque 2: Tarjetas de resumen ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
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
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Escuela</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Empresa supervisora</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Etapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detalleEscuelas.map(esc => (
                  <tr key={esc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{esc.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{esc.empresa_supervision ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{esc.etapa ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Tabla de informes */}
          {detalleInformes.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Escuela</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Período</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detalleInformes.map(inf => (
                  <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {escuelaNombreMap[inf.escuela_id] ?? inf.escuela_id}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <ShieldAlert size={14} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
              HSSO consolidado — {periodoLabel}
            </h2>
          </div>

          <div className="p-5 space-y-5">

            {/* Personal + Accidentes en una sola fila */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <MiniStat label="Hombres"       value={totalHombres}   color="blue"   />
              <MiniStat label="Mujeres"        value={totalMujeres}   color="violet" />
              <MiniStat label="Total personal" value={totalPersonal}  color="slate"  />
              <MiniStat label="Total eventos"  value={totalEventos}   color="slate"  />
              <MiniStat label="Accidentes"     value={totalAccidentes} color="orange" />
              <MiniStat label="Incidentes"     value={totalIncidentes} color="amber"  />
            </div>

            {totalEventos > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Gravedad */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gravedad</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Sin daño', 'Leve', 'Grave (incapacitante)', 'Mortal'] as const).map(grav => (
                      <div key={grav} className={`rounded-lg px-3 py-2 flex items-center justify-between ${
                        grav === 'Mortal'                ? 'bg-red-50 border border-red-100'    :
                        grav === 'Grave (incapacitante)' ? 'bg-orange-50 border border-orange-100' :
                        grav === 'Leve'                  ? 'bg-amber-50 border border-amber-100'  :
                                                           'bg-green-50 border border-green-100'
                      }`}>
                        <span className="text-xs text-slate-600">{grav}</span>
                        <span className={`text-sm font-bold ${
                          grav === 'Mortal'                ? 'text-red-700'    :
                          grav === 'Grave (incapacitante)' ? 'text-orange-700' :
                          grav === 'Leve'                  ? 'text-amber-700'  : 'text-green-700'
                        }`}>{gravedades[grav] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Causa */}
                {topCausas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Causa</p>
                    <div className="space-y-1">
                      {topCausas.map(([causa, count]) => (
                        <div key={causa} className="flex items-center justify-between px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                          <span className="text-xs text-slate-600 truncate">{causa}</span>
                          <span className="text-xs font-bold text-orange-700 ml-2 shrink-0">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tipo de lesión */}
                {topLesiones.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tipo de lesión</p>
                    <div className="space-y-1">
                      {topLesiones.map(([lesion, count]) => (
                        <div key={lesion} className="flex items-center justify-between px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                          <span className="text-xs text-slate-600 truncate">{lesion}</span>
                          <span className="text-xs font-bold text-red-700 ml-2 shrink-0">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {totalEventos === 0 && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle size={13} className="shrink-0" />
                Sin accidentes ni incidentes reportados en el periodo
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string; ring: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-200',   ring: 'ring-blue-400'   },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-200',  ring: 'ring-green-400'  },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-200',  ring: 'ring-amber-400'  },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-400' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200', ring: 'ring-violet-400' },
  slate:  { bg: 'bg-slate-50',  icon: 'text-slate-600',  border: 'border-slate-200',  ring: 'ring-slate-400'  },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-200',    ring: 'ring-red-400'    },
}

function StatCard({ icon: Icon, color, value, label }: {
  icon: React.ElementType
  color: string
  value: number
  label: string
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
        <Icon size={20} className={c.icon} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} px-3 py-2 text-center`}>
      <p className={`text-lg font-bold ${c.icon} leading-none`}>{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
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
      className={`bg-white rounded-xl border p-4 flex flex-col gap-2 hover:shadow-md transition-all cursor-pointer ${
        active ? `${c.border} ring-2 ${c.ring}` : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
      </div>
      {active && (
        <div className={`text-[10px] font-semibold ${c.icon} flex items-center gap-0.5`}>
          Ver listado <ChevronRight size={11} />
        </div>
      )}
    </Link>
  )
}
