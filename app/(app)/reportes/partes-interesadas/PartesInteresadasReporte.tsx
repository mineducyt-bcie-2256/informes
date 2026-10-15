'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

interface ParteVal { activa: boolean; hombres: number | string; mujeres: number | string; label?: string }
interface MatriculaAnio { anio: number; ninos: number; ninas: number }
interface AsistenciaMes { mes: number; anio: number; ninos: number; ninas: number }
interface CantidadMes { mes: number; anio: number; cantidad: number }
interface EmpleoMes { mes: number; anio: number; hombres: number; mujeres: number }
interface Indicadores {
  matricula?: MatriculaAnio[]
  asistencia?: AsistenciaMes[]
  inasistencias?: CantidadMes[]
  deserciones?: CantidadMes[]
  empleos_directos?: EmpleoMes[]
  empleos_indirectos?: EmpleoMes[]
  dias_escolares?: { anio: number; dias: number }[]
}
interface EscuelaRef { codigo: string; nombre: string; empresa_supervision: string | null }
interface InformeRef {
  id: string
  periodo_mes: number
  periodo_anio: number
  escuelas: EscuelaRef | EscuelaRef[] | null
}
interface PppiRow {
  informe_id: string
  partes_interesadas: Record<string, ParteVal> | null
  socializacion1_fecha: string | null
  socializacion2_fecha: string | null
  socializacion3_fecha: string | null
  comentarios_socializacion: string | null
  indicadores_impacto: Indicadores | null
}

type PartePorMes = { label: string; hombres: number; mujeres: number; porMes: Record<number, { hombres: number; mujeres: number }> }

const PARTES_LABELS: Record<string, string> = {
  alumnos: 'Alumnos', profesores: 'Profesores', director: 'Director',
  cde: 'CDE', personal: 'Personal del proyecto / trabajadores',
}

const selectCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white'
const anioActual = new Date().getFullYear()
const fmtN = (n: number) => n.toLocaleString('en-US')
const toNum = (v: unknown) => { const n = parseFloat(String(v ?? '')); return isNaN(n) ? 0 : n }
const fechaCorta = (f: string | null) => (f ? f.split('T')[0] : '—')
const sumar = (arr: object[] | undefined, campo: string) =>
  (arr ?? []).reduce((s, x) => s + toNum((x as Record<string, unknown>)[campo]), 0)

interface FilaEscuela {
  escuela: string
  periodo: string
  mes: number
  soc1: string; soc2: string; soc3: string
  comentarios: string
  matricula: number; asistencia: number; inasistencias: number; deserciones: number
  empDirH: number; empDirM: number; empIndH: number; empIndM: number
  diasEscolares: number
}

export default function PartesInteresadasReporte() {
  const supabase = createClient()
  const [anio, setAnio] = useState(anioActual)
  const [mesDesde, setMesDesde] = useState(1)
  const [mesHasta, setMesHasta] = useState(12)
  const [supervision, setSupervision] = useState('')
  const [escuelaId, setEscuelaId] = useState('')
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [escuelas, setEscuelas] = useState<{ id: string; nombre: string; empresa_supervision: string | null }[]>([])
  const [partes, setPartes] = useState<PartePorMes[]>([])
  const [filas, setFilas] = useState<FilaEscuela[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    supabase
      .from('escuelas')
      .select('id, nombre, empresa_supervision')
      .eq('activa', true)
      .ilike('etapa', '%construcci%')
      .order('nombre')
      .then(({ data }) => {
        const lista = (data ?? []) as { id: string; nombre: string; empresa_supervision: string | null }[]
        setEscuelas(lista)
        setSupervisiones([...new Set(lista.map(e => e.empresa_supervision).filter(Boolean))] as string[])
      })
  }, [])

  const escuelasFiltro = useMemo(
    () => (supervision ? escuelas.filter(e => e.empresa_supervision === supervision) : escuelas),
    [escuelas, supervision]
  )

  const [socs, setSocs] = useState<{ escuela: string; numero: string; fecha: string; comentarios: string }[]>([])

  useEffect(() => {
    let activo = true
    const cargarSocializaciones = async () => {
      let q = supabase
        .from('informes')
        .select('id, escuelas(codigo, nombre, empresa_supervision)')
        .eq('estado', 'aprobado')
      if (escuelaId) q = q.eq('escuela_id', escuelaId)
      const { data: informes } = await q
      const lista = ((informes ?? []) as unknown as { id: string; escuelas: EscuelaRef | EscuelaRef[] | null }[]).filter(i => {
        if (!supervision) return true
        const esc = Array.isArray(i.escuelas) ? i.escuelas[0] : i.escuelas
        return esc?.empresa_supervision === supervision
      })
      if (lista.length === 0) { if (activo) setSocs([]); return }

      const { data: pppi } = await supabase
        .from('informe_pppi')
        .select('informe_id, socializacion1_fecha, socializacion2_fecha, socializacion3_fecha, comentarios_socializacion')
        .in('informe_id', lista.map(i => i.id))

      const inicio = `${anio}-${String(mesDesde).padStart(2, '0')}-01`
      const ultimoDia = new Date(anio, mesHasta, 0).getDate()
      const fin = `${anio}-${String(mesHasta).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
      const porInforme = new Map(lista.map(i => [i.id, i]))
      const out: { escuela: string; numero: string; fecha: string; comentarios: string }[] = []
      const campos: [string, string][] = [
        ['socializacion1_fecha', 'Primera'], ['socializacion2_fecha', 'Segunda'], ['socializacion3_fecha', 'Tercera'],
      ]

      for (const p of (pppi ?? []) as unknown as Record<string, string | null>[]) {
        const inf = porInforme.get(String(p.informe_id))
        if (!inf) continue
        const esc = Array.isArray(inf.escuelas) ? inf.escuelas[0] : inf.escuelas
        const escuela = esc ? `${esc.nombre} (${esc.codigo})` : '—'
        for (const [campo, numero] of campos) {
          const fecha = p[campo]?.split('T')[0] ?? ''
          if (fecha && fecha >= inicio && fecha <= fin) {
            out.push({ escuela, numero, fecha, comentarios: p.comentarios_socializacion ?? '' })
          }
        }
      }
      out.sort((a, b) => a.fecha.localeCompare(b.fecha))
      if (activo) setSocs(out)
    }
    cargarSocializaciones()
    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mesDesde, mesHasta, supervision, escuelaId])

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      setCargando(true)
      let q = supabase
        .from('informes')
        .select('id, periodo_mes, periodo_anio, escuelas(codigo, nombre, empresa_supervision)')
        .eq('estado', 'aprobado')
        .eq('periodo_anio', anio)
        .gte('periodo_mes', mesDesde)
        .lte('periodo_mes', mesHasta)
      if (escuelaId) q = q.eq('escuela_id', escuelaId)
      const { data: informes } = await q
      const lista = ((informes ?? []) as unknown as InformeRef[]).filter(i => {
        if (!supervision) return true
        const esc = Array.isArray(i.escuelas) ? i.escuelas[0] : i.escuelas
        return esc?.empresa_supervision === supervision
      })

      if (lista.length === 0) {
        if (activo) { setFilas([]); setPartes([]); setCargando(false) }
        return
      }

      const { data: pppi } = await supabase
        .from('informe_pppi')
        .select('informe_id, partes_interesadas, socializacion1_fecha, socializacion2_fecha, socializacion3_fecha, comentarios_socializacion, indicadores_impacto')
        .in('informe_id', lista.map(i => i.id))

      const porInforme = new Map(lista.map(i => [i.id, i]))
      const sumaPartes: Record<string, PartePorMes> = {}
      const out: FilaEscuela[] = []

      for (const p of (pppi ?? []) as PppiRow[]) {
        const inf = porInforme.get(p.informe_id)
        if (!inf) continue
        const esc = Array.isArray(inf.escuelas) ? inf.escuelas[0] : inf.escuelas

        for (const [key, val] of Object.entries(p.partes_interesadas ?? {})) {
          if (!val?.activa) continue
          const label = val.label?.trim() || PARTES_LABELS[key] || key
          if (!sumaPartes[label]) sumaPartes[label] = { label, hombres: 0, mujeres: 0, porMes: {} }
          const mesPart = inf.periodo_mes
          if (!sumaPartes[label].porMes[mesPart]) sumaPartes[label].porMes[mesPart] = { hombres: 0, mujeres: 0 }
          sumaPartes[label].porMes[mesPart].hombres += toNum(val.hombres)
          sumaPartes[label].porMes[mesPart].mujeres += toNum(val.mujeres)
          sumaPartes[label].hombres += toNum(val.hombres)
          sumaPartes[label].mujeres += toNum(val.mujeres)
        }

        const ind = p.indicadores_impacto ?? {}
        const mesInf = inf.periodo_mes
        const anioInf = inf.periodo_anio
        const delMes = <T extends { mes?: number; anio?: number }>(arr: T[] | undefined) =>
          (arr ?? []).filter(x => x.mes === mesInf && (x.anio === undefined || x.anio === anioInf))
        const matriculaAnio = (ind.matricula ?? []).find(m => m.anio === anioInf)
        out.push({
          escuela: esc ? `${esc.nombre} (${esc.codigo})` : '—',
          periodo: `${MESES[mesInf - 1]} ${anioInf}`,
          mes: mesInf,
          soc1: fechaCorta(p.socializacion1_fecha),
          soc2: fechaCorta(p.socializacion2_fecha),
          soc3: fechaCorta(p.socializacion3_fecha),
          comentarios: p.comentarios_socializacion ?? '',
          matricula: matriculaAnio ? toNum(matriculaAnio.ninos) + toNum(matriculaAnio.ninas) : 0,
          asistencia: delMes(ind.asistencia).reduce((s, a) => s + toNum(a.ninos) + toNum(a.ninas), 0),
          inasistencias: sumar(delMes(ind.inasistencias), 'cantidad'),
          deserciones: sumar(delMes(ind.deserciones), 'cantidad'),
          empDirH: sumar(delMes(ind.empleos_directos), 'hombres'),
          empDirM: sumar(delMes(ind.empleos_directos), 'mujeres'),
          empIndH: sumar(delMes(ind.empleos_indirectos), 'hombres'),
          empIndM: sumar(delMes(ind.empleos_indirectos), 'mujeres'),
          diasEscolares: sumar((ind.dias_escolares ?? []).filter(d => d.anio === anioInf), 'dias'),
        })
      }

      if (activo) {
        setPartes(Object.values(sumaPartes).sort((a, b) => a.label.localeCompare(b.label)))
        setFilas(out)
        setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mesDesde, mesHasta, supervision, escuelaId])

  const mesesRango = Array.from({ length: Math.max(0, mesHasta - mesDesde + 1) }, (_, i) => mesDesde + i)
  type Indicador = { matricula: number; asistencia: number; inasistencias: number; deserciones: number; empDirH: number; empDirM: number; empIndH: number; empIndM: number }
  const porMes = useMemo(() => {
    const out: Record<number, Indicador> = {}
    for (const m of mesesRango) {
      out[m] = { matricula: 0, asistencia: 0, inasistencias: 0, deserciones: 0, empDirH: 0, empDirM: 0, empIndH: 0, empIndM: 0 }
    }
    for (const f of filas) {
      const t = out[f.mes]
      if (!t) continue
      t.matricula += f.matricula
      t.asistencia += f.asistencia
      t.inasistencias += f.inasistencias
      t.deserciones += f.deserciones
      t.empDirH += f.empDirH; t.empDirM += f.empDirM
      t.empIndH += f.empIndH; t.empIndM += f.empIndM
    }
    return out
  }, [filas, mesDesde, mesHasta])
  const mesesConDatos = mesesRango.filter(m => filas.some(f => f.mes === m))
  const promedioPeriodo = (campo: keyof Indicador) =>
    mesesConDatos.length ? mesesConDatos.reduce((s, m) => s + porMes[m][campo], 0) / mesesConDatos.length : 0
  const [verPromedio, setVerPromedio] = useState(false)

  const exportarExcel = () => {
    const libro = XLSX.utils.book_new()
    const hojaPartes = partes.map(p => {
      const fila: Record<string, string | number> = { 'Parte interesada': p.label }
      for (const m of mesesRango) fila[`${MESES[m - 1]} H`] = p.porMes[m]?.hombres ?? 0
      for (const m of mesesRango) fila[`${MESES[m - 1]} M`] = p.porMes[m]?.mujeres ?? 0
      fila['Total'] = p.hombres + p.mujeres
      return fila
    })
    const hojaSoc = socs.map(s => ({
      'Centro escolar': s.escuela, 'Socialización': s.numero, 'Fecha': s.fecha,
      'Comentarios': s.comentarios,
    }))
    const hojaInd = filas.map(f => ({
      'Centro escolar': f.escuela, 'Periodo': f.periodo,
      'Matrícula (último año)': f.matricula, 'Asistencia (niños y niñas)': f.asistencia,
      'Inasistencias': f.inasistencias, 'Deserciones': f.deserciones,
      'Empleos directos H': f.empDirH, 'Empleos directos M': f.empDirM,
      'Empleos indirectos H': f.empIndH, 'Empleos indirectos M': f.empIndM,
      'Días escolares': f.diasEscolares,
    }))
    const agregar = (rows: object[], nombre: string) =>
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Sin registros': '' }]), nombre)
    agregar(hojaPartes, 'Partes interesadas')
    agregar(hojaSoc, 'Socializaciones')
    agregar(hojaInd, 'Indicadores de impacto')
    const periodo = mesDesde === mesHasta ? `${MESES[mesDesde - 1]}_${anio}` : `${MESES[mesDesde - 1]}-${MESES[mesHasta - 1]}_${anio}`
    XLSX.writeFile(libro, `Partes_Interesadas_${periodo}.xlsx`)
  }

  const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2'
  const Kpi = ({ titulo, valor, color }: { titulo: string; valor: string; color: string }) => (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <p className="text-xs font-semibold opacity-80">{titulo}</p>
      <p className="text-lg font-bold">{valor}</p>
    </div>
  )

  const totalPartes = partes.reduce((s, p) => s + p.hombres + p.mujeres, 0)

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Año
          <select className={selectCls} value={anio} onChange={e => setAnio(parseInt(e.target.value))}>
            {[anioActual, anioActual - 1, anioActual - 2].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Mes desde
          <select className={selectCls} value={mesDesde} onChange={e => setMesDesde(parseInt(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Mes hasta
          <select className={selectCls} value={mesHasta} onChange={e => setMesHasta(parseInt(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Supervisión
          <select className={selectCls} value={supervision} onChange={e => { setSupervision(e.target.value); setEscuelaId('') }}>
            <option value="">Todas</option>
            {supervisiones.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Centro escolar
          <select className={selectCls} value={escuelaId} onChange={e => setEscuelaId(e.target.value)}>
            <option value="">Todos</option>
            {escuelasFiltro.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportarExcel}
          disabled={cargando || filas.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          <FileSpreadsheet size={16} />
          Descargar Excel
        </button>
      </div>

      {cargando && (
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Cargando…</div>
      )}

      {!cargando && filas.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No hay informes de partes interesadas aprobados para los filtros seleccionados.
        </div>
      )}

      {!cargando && filas.length > 0 && (
        <>
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Partes interesadas</h2>
              <span className="text-sm font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">{fmtN(totalPartes)} personas</span>
            </div>
            {partes.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                    <tr>
                      <th className="px-3 py-2">Parte interesada</th>
                      {mesesRango.map(m => (
                        <th key={m} className="px-3 py-2 text-right">{MESES[m - 1]}<span className="block font-normal text-slate-400">H / M</span></th>
                      ))}
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partes.map(p => (
                      <tr key={p.label} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">{p.label}</td>
                        {mesesRango.map(m => {
                          const v = p.porMes[m]
                          return (
                            <td key={m} className="px-3 py-2 text-right">{v ? `${fmtN(v.hombres)} / ${fmtN(v.mujeres)}` : '—'}</td>
                          )
                        })}
                        <td className="px-3 py-2 text-right font-bold">{fmtN(p.hombres + p.mujeres)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin partes interesadas registradas</p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Socializaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Kpi titulo="Socializaciones en el periodo" valor={fmtN(socs.length)} color="bg-indigo-50 border-indigo-200 text-indigo-800" />
              <Kpi titulo="Centros con socialización" valor={fmtN(new Set(socs.map(s => s.escuela)).size)} color="bg-slate-50 border-slate-200 text-slate-700" />
              <Kpi titulo="Fechas con registro" valor={fmtN(new Set(socs.map(s => s.fecha)).size)} color="bg-slate-50 border-slate-200 text-slate-700" />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2">Centro escolar</th>
                    <th className="px-3 py-2">Socialización</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {socs.map((s, i) => (
                    <tr key={i} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2">{s.escuela}</td>
                      <td className="px-3 py-2">{s.numero}</td>
                      <td className="px-3 py-2">{s.fecha}</td>
                      <td className="px-3 py-2 text-slate-600">{s.comentarios || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Indicadores de impacto</h2>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-slate-600">Valores de cada mes según lo registrado en su informe. No se acumulan entre meses.</p>
              <button
                type="button"
                onClick={() => setVerPromedio(v => !v)}
                disabled={mesesConDatos.length === 0}
                className="border border-slate-300 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {verPromedio ? 'Ocultar promedio del periodo' : 'Calcular promedio del periodo'}
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2">Indicador</th>
                    {mesesConDatos.map(m => <th key={m} className="px-3 py-2 text-right">{MESES[m - 1]}</th>)}
                    {verPromedio && <th className="px-3 py-2 text-right">Promedio del periodo</th>}
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['Matrícula', 'matricula', 'n'],
                    ['Asistencia', 'asistencia', 'n'],
                    ['Inasistencias', 'inasistencias', 'n'],
                    ['Deserciones', 'deserciones', 'n'],
                    ['Empleos directos — hombres', 'empDirH', 'n'],
                    ['Empleos directos — mujeres', 'empDirM', 'n'],
                    ['Empleos indirectos — hombres', 'empIndH', 'n'],
                    ['Empleos indirectos — mujeres', 'empIndM', 'n'],
                  ] as const).map(([label, campo]) => (
                    <tr key={campo} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium">{label}</td>
                      {mesesConDatos.map(m => <td key={m} className="px-3 py-2 text-right">{fmtN(porMes[m][campo])}</td>)}
                      {verPromedio && <td className="px-3 py-2 text-right font-bold">{fmtN(Math.round(promedioPeriodo(campo) * 100) / 100)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mesesConDatos.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Matrícula por mes</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mesesConDatos.map(m => ({ mes: MESES[m - 1], matricula: porMes[m].matricula }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => fmtN(v)} />
                      <Tooltip formatter={(v: number) => fmtN(v)} />
                      <Line type="monotone" dataKey="matricula" name="Matrícula" stroke="#0284c7" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2">Centro escolar</th>
                    <th className="px-3 py-2">Periodo</th>
                    <th className="px-3 py-2 text-right">Matrícula</th>
                    <th className="px-3 py-2 text-right">Asistencia</th>
                    <th className="px-3 py-2 text-right">Inasist.</th>
                    <th className="px-3 py-2 text-right">Deserciones</th>
                    <th className="px-3 py-2 text-right">Emp. directos H/M</th>
                    <th className="px-3 py-2 text-right">Emp. indirectos H/M</th>
                    <th className="px-3 py-2 text-right">Días escolares</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2">{f.escuela}</td>
                      <td className="px-3 py-2">{f.periodo}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.matricula)}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.asistencia)}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.inasistencias)}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.deserciones)}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.empDirH)} / {fmtN(f.empDirM)}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.empIndH)} / {fmtN(f.empIndM)}</td>
                      <td className="px-3 py-2 text-right">{fmtN(f.diasEscolares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
