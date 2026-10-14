'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

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
  const [partes, setPartes] = useState<{ label: string; hombres: number; mujeres: number }[]>([])
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
      const sumaPartes: Record<string, { label: string; hombres: number; mujeres: number }> = {}
      const out: FilaEscuela[] = []

      for (const p of (pppi ?? []) as PppiRow[]) {
        const inf = porInforme.get(p.informe_id)
        if (!inf) continue
        const esc = Array.isArray(inf.escuelas) ? inf.escuelas[0] : inf.escuelas

        for (const [key, val] of Object.entries(p.partes_interesadas ?? {})) {
          if (!val?.activa) continue
          const label = val.label?.trim() || PARTES_LABELS[key] || key
          if (!sumaPartes[label]) sumaPartes[label] = { label, hombres: 0, mujeres: 0 }
          sumaPartes[label].hombres += toNum(val.hombres)
          sumaPartes[label].mujeres += toNum(val.mujeres)
        }

        const ind = p.indicadores_impacto ?? {}
        const ultimaMatricula = [...(ind.matricula ?? [])].sort((a, b) => b.anio - a.anio)[0]
        out.push({
          escuela: esc ? `${esc.nombre} (${esc.codigo})` : '—',
          periodo: `${MESES[inf.periodo_mes - 1]} ${inf.periodo_anio}`,
          soc1: fechaCorta(p.socializacion1_fecha),
          soc2: fechaCorta(p.socializacion2_fecha),
          soc3: fechaCorta(p.socializacion3_fecha),
          comentarios: p.comentarios_socializacion ?? '',
          matricula: ultimaMatricula ? toNum(ultimaMatricula.ninos) + toNum(ultimaMatricula.ninas) : 0,
          asistencia: (ind.asistencia ?? []).reduce((s, a) => s + toNum(a.ninos) + toNum(a.ninas), 0),
          inasistencias: sumar(ind.inasistencias, 'cantidad'),
          deserciones: sumar(ind.deserciones, 'cantidad'),
          empDirH: sumar(ind.empleos_directos, 'hombres'),
          empDirM: sumar(ind.empleos_directos, 'mujeres'),
          empIndH: sumar(ind.empleos_indirectos, 'hombres'),
          empIndM: sumar(ind.empleos_indirectos, 'mujeres'),
          diasEscolares: (ind.dias_escolares ?? []).reduce((s, d) => s + toNum(d.dias), 0),
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

  const totales = useMemo(() => {
    const t = { matricula: 0, asistencia: 0, inasistencias: 0, deserciones: 0, empDirH: 0, empDirM: 0, empIndH: 0, empIndM: 0 }
    for (const f of filas) {
      t.matricula += f.matricula
      t.asistencia += f.asistencia
      t.inasistencias += f.inasistencias
      t.deserciones += f.deserciones
      t.empDirH += f.empDirH; t.empDirM += f.empDirM
      t.empIndH += f.empIndH; t.empIndM += f.empIndM
    }
    return t
  }, [filas])

  const exportarExcel = () => {
    const libro = XLSX.utils.book_new()
    const hojaPartes = partes.map(p => ({ 'Parte interesada': p.label, 'Hombres': p.hombres, 'Mujeres': p.mujeres, 'Total': p.hombres + p.mujeres }))
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
                      <th className="px-3 py-2 text-right">Hombres</th>
                      <th className="px-3 py-2 text-right">Mujeres</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partes.map(p => (
                      <tr key={p.label} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">{p.label}</td>
                        <td className="px-3 py-2 text-right">{fmtN(p.hombres)}</td>
                        <td className="px-3 py-2 text-right">{fmtN(p.mujeres)}</td>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi titulo="Matrícula (último año)" valor={fmtN(totales.matricula)} color="bg-sky-50 border-sky-200 text-sky-800" />
              <Kpi titulo="Asistencia registrada" valor={fmtN(totales.asistencia)} color="bg-sky-50 border-sky-200 text-sky-800" />
              <Kpi titulo="Inasistencias" valor={fmtN(totales.inasistencias)} color="bg-amber-50 border-amber-200 text-amber-800" />
              <Kpi titulo="Deserciones" valor={fmtN(totales.deserciones)} color="bg-red-50 border-red-200 text-red-800" />
              <Kpi titulo="Empleos directos (H / M)" valor={`${fmtN(totales.empDirH)} / ${fmtN(totales.empDirM)}`} color="bg-emerald-50 border-emerald-200 text-emerald-800" />
              <Kpi titulo="Empleos indirectos (H / M)" valor={`${fmtN(totales.empIndH)} / ${fmtN(totales.empIndM)}`} color="bg-emerald-50 border-emerald-200 text-emerald-800" />
            </div>
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
