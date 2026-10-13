import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { MESES } from '@/types'
import {
  FileText, CheckCircle, Clock, HardHat, AlertTriangle, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { PrintButton } from './PrintButton'
import FiltrosDashboard from './FiltrosDashboard'

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
      <div id="dashboard-completo" className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2a45] dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {periodoLabel} — Programa Mi Nueva Escuela BCIE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reportes/condiciones" className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
            Ver detalle en Reportes →
          </Link>
          <PrintButton periodoLabel={periodoLabel} empresa={empresaEfectiva ?? undefined} escuela_id={escuelaIdEfectiva ?? undefined} />
        </div>
      </div>

      {/* ── Bloque 1: Filtros ── */}
      {!esVisitante && (
        <FiltrosDashboard
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

      </div>
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
