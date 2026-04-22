import { createClient } from '@/lib/supabase/server'
import { FileText, School, CheckCircle, Clock, Building2, HardHat, FolderOpen, PackageCheck } from 'lucide-react'
import { MESES } from '@/types'

const ESTADO_BADGE: Record<string, string> = {
  aprobado: 'bg-green-100 text-green-700',
  enviado:  'bg-blue-100 text-blue-700',
  borrador: 'bg-amber-100 text-amber-700',
}

export default async function DashboardPage() {
  const supabase  = await createClient()
  const hoy       = new Date()
  const mesActual = hoy.getMonth() + 1
  const anio      = hoy.getFullYear()

  // ── Queries paralelas ──────────────────────────────────────────
  const [
    { data: todasEscuelas },
    { data: informesMes },
    { data: informesRecientes },
  ] = await Promise.all([
    supabase.from('escuelas').select('id, empresa_supervision, numero_contrato, etapa').eq('activa', true),
    supabase.from('informes').select('id, escuela_id, estado')
      .eq('periodo_mes', mesActual).eq('periodo_anio', anio),
    supabase.from('informes')
      .select('id, estado, periodo_mes, periodo_anio, escuelas(nombre)')
      .order('created_at', { ascending: false }).limit(8),
  ])

  const escuelas = todasEscuelas ?? []
  const infMes   = informesMes ?? []

  // ── Solo escuelas con contrato adjudicado (numero_contrato != 'SIN ADJUDICAR')
  const conContrato = escuelas.filter(
    e => e.numero_contrato && e.numero_contrato.trim().toUpperCase() !== 'SIN ADJUDICAR'
  )

  const enConstruccion = conContrato.filter(e => e.etapa?.toLowerCase().includes('construcci')).length
  const finalizado     = conContrato.filter(e => e.etapa?.toLowerCase().includes('finalizado')).length
  const disenoCarpeta  = conContrato.filter(e => e.etapa?.toLowerCase().includes('dise')).length

  // ── Cálculos de tarjetas Informes (mes actual) ─────────────────
  const infAprobados = infMes.filter(i => i.estado === 'aprobado').length
  const infBorrador  = infMes.filter(i => i.estado === 'borrador').length
  const infEnviados  = infMes.filter(i => i.estado === 'enviado').length

  // ── Tabla por empresa de supervisión ──────────────────────────
  type EmpresaRow = {
    totalCEs:    number
    informes:    number
    aprobados:   number
    borrador:    number
    enviados:    number
  }

  const porEmpresa: Record<string, EmpresaRow> = {}

  for (const e of conContrato) {
    const emp = e.empresa_supervision!
    if (!porEmpresa[emp]) porEmpresa[emp] = { totalCEs: 0, informes: 0, aprobados: 0, borrador: 0, enviados: 0 }
    porEmpresa[emp].totalCEs++
  }

  for (const inf of infMes) {
    const esc = conContrato.find(e => e.id === inf.escuela_id)
    if (!esc) continue
    const emp = esc.empresa_supervision!
    if (!porEmpresa[emp]) continue
    porEmpresa[emp].informes++
    if (inf.estado === 'aprobado') porEmpresa[emp].aprobados++
    if (inf.estado === 'borrador') porEmpresa[emp].borrador++
    if (inf.estado === 'enviado')  porEmpresa[emp].enviados++
  }

  const tablaEmpresas = Object.entries(porEmpresa)
    .sort(([a], [b]) => a.localeCompare(b))

  const totales = tablaEmpresas.reduce(
    (acc, [, r]) => ({
      totalCEs:  acc.totalCEs  + r.totalCEs,
      informes:  acc.informes  + r.informes,
      aprobados: acc.aprobados + r.aprobados,
      borrador:  acc.borrador  + r.borrador,
      enviados:  acc.enviados  + r.enviados,
    }),
    { totalCEs: 0, informes: 0, aprobados: 0, borrador: 0, enviados: 0 }
  )

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8">

      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {MESES[mesActual - 1]} {anio} — Resumen general del programa Mi Nueva Escuela BCIE
        </p>
      </div>

      {/* ── Tarjetas Centros Educativos ───────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Centros Educativos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={School}      color="blue"   value={conContrato.length} label="Con contrato adjudicado" />
          <StatCard icon={HardHat}     color="orange" value={enConstruccion} label="En construcción" />
          <StatCard icon={PackageCheck} color="green" value={finalizado}     label="Constructivo finalizado" />
          <StatCard icon={FolderOpen}  color="violet" value={disenoCarpeta}  label="Diseño de carpeta" />
        </div>
      </div>

      {/* ── Tarjetas Informes del mes ─────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Informes — {MESES[mesActual - 1]} {anio}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText}    color="slate"  value={infMes.length}  label="Registrados este mes" />
          <StatCard icon={CheckCircle} color="green"  value={infAprobados}   label="Aprobados" />
          <StatCard icon={Clock}       color="amber"  value={infBorrador}    label="En borrador" />
          <StatCard icon={FileText}    color="blue"   value={infEnviados}    label="Enviados / en revisión" />
        </div>
      </div>

      {/* ── Tabla por empresa de supervisión ─────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Resumen por empresa de supervisión — {MESES[mesActual - 1]} {anio}
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Empresa de supervisión</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">CEs</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Total informes</th>
                <th className="text-center px-4 py-3 font-semibold text-green-700">Aprobados</th>
                <th className="text-center px-4 py-3 font-semibold text-blue-700">Enviados</th>
                <th className="text-center px-4 py-3 font-semibold text-amber-700">Borrador</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-500">Sin informe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tablaEmpresas.map(([empresa, row]) => (
                <tr key={empresa} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{empresa}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{row.totalCEs}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.informes}</td>
                  <td className="px-4 py-3 text-center">
                    {row.aprobados > 0
                      ? <Badge value={row.aprobados} cls="bg-green-100 text-green-700" />
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.enviados > 0
                      ? <Badge value={row.enviados} cls="bg-blue-100 text-blue-700" />
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.borrador > 0
                      ? <Badge value={row.borrador} cls="bg-amber-100 text-amber-700" />
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.totalCEs - row.informes > 0
                      ? <Badge value={row.totalCEs - row.informes} cls="bg-slate-100 text-slate-500" />
                      : <span className="text-green-500 text-xs font-medium">✓ Completo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-800">Suma total</td>
                <td className="px-4 py-3 text-center font-bold text-slate-800">{totales.totalCEs}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-800">{totales.informes}</td>
                <td className="px-4 py-3 text-center font-bold text-green-700">{totales.aprobados}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-700">{totales.enviados}</td>
                <td className="px-4 py-3 text-center font-bold text-amber-700">{totales.borrador}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-500">{totales.totalCEs - totales.informes}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Informes recientes ────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Últimos informes registrados
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Centro Educativo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Período</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(informesRecientes ?? []).map((inf: any) => (
                <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{inf.escuelas?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{MESES[inf.periodo_mes - 1]} {inf.periodo_anio}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ESTADO_BADGE[inf.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                      {inf.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {!informesRecientes?.length && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">No hay informes aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

function Badge({ value, cls }: { value: number; cls: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${cls}`}>
      {value}
    </span>
  )
}
