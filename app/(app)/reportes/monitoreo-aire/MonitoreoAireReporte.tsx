'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

interface MedicionAire {
  clasificacion: string
  actividades?: string[]
  actividades_otro?: string
  no_registrado?: boolean
  motivo_no_registro?: string
  pm10?: string; pm25?: string; ica?: string; co2?: string
  equipo_tecnica?: string; medidas_ambientales?: string
}
interface MedicionAcustica {
  clasificacion: string
  fuentes?: string[]
  db?: string
  equipo_tecnica?: string; medidas_ambientales?: string
  no_registrado?: boolean; motivo_no_registro?: string
}
interface EscuelaRef { codigo: string; nombre: string; empresa_supervision: string | null }
interface InformeRef {
  id: string
  periodo_mes: number
  periodo_anio: number
  escuelas: EscuelaRef | EscuelaRef[] | null
}
interface McearRow {
  informe_id: string
  mediciones_aire: MedicionAire[] | null
  mediciones_acustica: MedicionAcustica[] | null
}
interface FilaMedicion {
  escuela: string
  periodo: string
  componente: string
  actividad: string
  pm10: string; pm25: string; ica: string; co2: string; db: string
  estado: string
  equipo: string
  medidas: string
}

const ETIQUETA_CLASIF: Record<string, string> = {
  material_particulado: 'Material particulado',
  emisiones: 'Emisiones y fuentes móviles',
  cov: 'Compuestos orgánicos volátiles',
  acustica_general: 'Contaminación acústica',
}

const selectCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white'
const anioActual = new Date().getFullYear()

const num = (v: string | undefined | null) => {
  const n = parseFloat(String(v ?? ''))
  return isNaN(n) || n <= 0 ? null : n
}
const fmt2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const promedio = (vals: (number | null)[]) => {
  const v = vals.filter((x): x is number => x !== null)
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null
}
const txtPromedio = (vals: (number | null)[], unidad: string) => {
  const p = promedio(vals)
  return p === null ? '—' : `${fmt2(p)} ${unidad}`
}

export default function MonitoreoAireReporte() {
  const supabase = createClient()
  const [anio, setAnio] = useState(anioActual)
  const [mesDesde, setMesDesde] = useState(1)
  const [mesHasta, setMesHasta] = useState(12)
  const [supervision, setSupervision] = useState('')
  const [escuelaId, setEscuelaId] = useState('')
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [escuelas, setEscuelas] = useState<{ id: string; nombre: string; empresa_supervision: string | null }[]>([])
  const [filas, setFilas] = useState<FilaMedicion[]>([])
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
        if (activo) { setFilas([]); setCargando(false) }
        return
      }

      const { data: mcear } = await supabase
        .from('informe_mcear')
        .select('informe_id, mediciones_aire, mediciones_acustica')
        .in('informe_id', lista.map(i => i.id))

      const porInforme = new Map(lista.map(i => [i.id, i]))
      const out: FilaMedicion[] = []

      for (const m of (mcear ?? []) as McearRow[]) {
        const inf = porInforme.get(m.informe_id)
        if (!inf) continue
        const esc = Array.isArray(inf.escuelas) ? inf.escuelas[0] : inf.escuelas
        const base = {
          escuela: esc ? `${esc.nombre} (${esc.codigo})` : '—',
          periodo: `${MESES[inf.periodo_mes - 1]} ${inf.periodo_anio}`,
        }

        for (const a of m.mediciones_aire ?? []) {
          const actividades = (a.actividades ?? []).map(x => (x === 'Otros' && a.actividades_otro ? a.actividades_otro : x))
          out.push({
            ...base,
            componente: ETIQUETA_CLASIF[a.clasificacion] ?? a.clasificacion,
            actividad: actividades.join(', ') || '—',
            pm10: a.pm10 ?? '', pm25: a.pm25 ?? '', ica: a.ica ?? '', co2: a.co2 ?? '', db: '',
            estado: a.no_registrado ? `No registrado${a.motivo_no_registro ? `: ${a.motivo_no_registro}` : ''}` : 'Registrado',
            equipo: a.equipo_tecnica ?? '',
            medidas: a.medidas_ambientales ?? '',
          })
        }

        for (const a of m.mediciones_acustica ?? []) {
          const fuentes = (a.fuentes ?? []).join(', ')
          out.push({
            ...base,
            componente: ETIQUETA_CLASIF[a.clasificacion] ?? a.clasificacion,
            actividad: fuentes || '—',
            pm10: '', pm25: '', ica: '', co2: '', db: a.db ?? '',
            estado: a.no_registrado ? `No registrado${a.motivo_no_registro ? `: ${a.motivo_no_registro}` : ''}` : 'Registrado',
            equipo: a.equipo_tecnica ?? '',
            medidas: a.medidas_ambientales ?? '',
          })
        }
      }

      if (activo) { setFilas(out); setCargando(false) }
    }
    cargar()
    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mesDesde, mesHasta, supervision, escuelaId])

  const aire = filas.filter(f => f.componente !== ETIQUETA_CLASIF.acustica_general)
  const acustica = filas.filter(f => f.componente === ETIQUETA_CLASIF.acustica_general)
  const aireMp = aire.filter(f => f.componente === ETIQUETA_CLASIF.material_particulado)
  const aireEm = aire.filter(f => f.componente === ETIQUETA_CLASIF.emisiones)
  const aireCov = aire.filter(f => f.componente === ETIQUETA_CLASIF.cov)
  const covRegistrado = aireCov.some(f => f.estado === 'Registrado')

  const actividadesUnicas = (lista: FilaMedicion[]) => [...new Set(lista.map(f => f.actividad).filter(a => a && a !== '—').flatMap(a => a.split(', ')))]

  const exportarExcel = () => {
    const libro = XLSX.utils.book_new()
    const hojaAire = filas.filter(f => f.componente !== ETIQUETA_CLASIF.acustica_general).map(f => ({
      'Centro escolar': f.escuela, 'Periodo': f.periodo, 'Componente': f.componente,
      'Actividad / fuente': f.actividad, 'PM10 (µg/m³)': f.pm10, 'PM2.5 (µg/m³)': f.pm25,
      'ICA': f.ica, 'CO₂ (ppm)': f.co2, 'Estado': f.estado, 'Equipo técnico': f.equipo, 'Medidas ambientales': f.medidas,
    }))
    const hojaAcustica = acustica.map(f => ({
      'Centro escolar': f.escuela, 'Periodo': f.periodo, 'Fuentes generadoras': f.actividad,
      'Nivel de ruido (dB)': f.db, 'Estado': f.estado, 'Equipo técnico': f.equipo, 'Medidas ambientales': f.medidas,
    }))
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaAire.length ? hojaAire : [{ 'Sin registros': '' }]), 'Calidad del aire')
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaAcustica.length ? hojaAcustica : [{ 'Sin registros': '' }]), 'Acústica')
    const periodo = mesDesde === mesHasta ? `${MESES[mesDesde - 1]}_${anio}` : `${MESES[mesDesde - 1]}-${MESES[mesHasta - 1]}_${anio}`
    XLSX.writeFile(libro, `Monitoreo_Aire_${periodo}.xlsx`)
  }

  const Kpi = ({ titulo, valor, color }: { titulo: string; valor: string; color: string }) => (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <p className="text-xs font-semibold opacity-80">{titulo}</p>
      <p className="text-lg font-bold">{valor}</p>
    </div>
  )

  const Lista = ({ items, vacio }: { items: string[]; vacio: string }) =>
    items.length > 0
      ? <div className="flex flex-wrap gap-2">{items.map(i => <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">{i}</span>)}</div>
      : <p className="text-sm text-slate-500">{vacio}</p>

  const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2'

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
          No hay monitoreos de calidad del aire aprobados para los filtros seleccionados.
        </div>
      )}

      {!cargando && aire.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Calidad del aire</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className={sectionTitle}>Material particulado</h3>
              <div className="grid grid-cols-3 gap-2">
                <Kpi titulo="PM10 promedio" valor={txtPromedio(aireMp.map(f => num(f.pm10)), 'µg/m³')} color="bg-sky-50 border-sky-200 text-sky-800" />
                <Kpi titulo="PM2.5 promedio" valor={txtPromedio(aireMp.map(f => num(f.pm25)), 'µg/m³')} color="bg-sky-50 border-sky-200 text-sky-800" />
                <Kpi titulo="ICA promedio" valor={txtPromedio(aireMp.map(f => num(f.ica)), '')} color="bg-sky-50 border-sky-200 text-sky-800" />
              </div>
              <p className="text-xs text-slate-500 mt-2">{aireMp.filter(f => f.estado === 'Registrado').length} medición(es) registradas</p>
            </div>
            <div>
              <h3 className={sectionTitle}>Emisiones y fuentes móviles</h3>
              <div className="grid grid-cols-2 gap-2">
                <Kpi titulo="ICA promedio" valor={txtPromedio(aireEm.map(f => num(f.ica)), '')} color="bg-amber-50 border-amber-200 text-amber-800" />
                <Kpi titulo="CO₂ promedio" valor={txtPromedio(aireEm.map(f => num(f.co2)), 'ppm')} color="bg-amber-50 border-amber-200 text-amber-800" />
              </div>
              <p className="text-xs text-slate-500 mt-2">{aireEm.filter(f => f.estado === 'Registrado').length} medición(es) registradas</p>
            </div>
            <div>
              <h3 className={sectionTitle}>Compuestos orgánicos volátiles</h3>
              <Kpi
                titulo="Estado"
                valor={covRegistrado ? 'Registrado' : 'No registrado'}
                color={covRegistrado ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}
              />
            </div>
          </div>

          <div>
            <h3 className={sectionTitle}>Actividades que generan material particulado y emisiones</h3>
            <Lista items={actividadesUnicas(aire)} vacio="Sin actividades registradas" />
          </div>

          <div>
            <h3 className={sectionTitle}>Detalle de mediciones</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2">Centro escolar</th>
                    <th className="px-3 py-2">Periodo</th>
                    <th className="px-3 py-2">Componente</th>
                    <th className="px-3 py-2">Actividad / fuente</th>
                    <th className="px-3 py-2 text-right">PM10</th>
                    <th className="px-3 py-2 text-right">PM2.5</th>
                    <th className="px-3 py-2 text-right">ICA</th>
                    <th className="px-3 py-2 text-right">CO₂ (ppm)</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {aire.map((f, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2">{f.escuela}</td>
                      <td className="px-3 py-2">{f.periodo}</td>
                      <td className="px-3 py-2">{f.componente}</td>
                      <td className="px-3 py-2">{f.actividad}</td>
                      <td className="px-3 py-2 text-right">{num(f.pm10) !== null ? fmt2(num(f.pm10)!) : '—'}</td>
                      <td className="px-3 py-2 text-right">{num(f.pm25) !== null ? fmt2(num(f.pm25)!) : '—'}</td>
                      <td className="px-3 py-2 text-right">{num(f.ica) !== null ? fmt2(num(f.ica)!) : '—'}</td>
                      <td className="px-3 py-2 text-right">{num(f.co2) !== null ? fmt2(num(f.co2)!) : '—'}</td>
                      <td className="px-3 py-2">{f.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {!cargando && acustica.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Contaminación acústica</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Kpi titulo="Nivel de ruido promedio" valor={txtPromedio(acustica.map(f => num(f.db)), 'dB')} color="bg-orange-50 border-orange-200 text-orange-800" />
            <Kpi titulo="Mediciones registradas" valor={String(acustica.filter(f => f.estado === 'Registrado').length)} color="bg-slate-50 border-slate-200 text-slate-700" />
          </div>

          <div>
            <h3 className={sectionTitle}>Fuentes generadoras</h3>
            <Lista items={actividadesUnicas(acustica)} vacio="Sin fuentes registradas" />
          </div>

          <div>
            <h3 className={sectionTitle}>Detalle de mediciones</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2">Centro escolar</th>
                    <th className="px-3 py-2">Periodo</th>
                    <th className="px-3 py-2">Fuentes generadoras</th>
                    <th className="px-3 py-2 text-right">Nivel (dB)</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {acustica.map((f, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2">{f.escuela}</td>
                      <td className="px-3 py-2">{f.periodo}</td>
                      <td className="px-3 py-2">{f.actividad}</td>
                      <td className="px-3 py-2 text-right">{num(f.db) !== null ? fmt2(num(f.db)!) : '—'}</td>
                      <td className="px-3 py-2">{f.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
