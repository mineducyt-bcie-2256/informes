'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'
import { Loader2 } from 'lucide-react'

interface Material { nombre: string; peso_kg: number; unidad?: string; manejo?: string }
interface ResiduoReg {
  categoria: string
  tipo_residuo: string
  materiales: Material[]
  lugar_acopio?: string
  sitio_recepcion?: string
}
interface EscuelaRef { codigo: string; nombre: string; empresa_supervision: string | null }
interface InformeRef {
  id: string
  periodo_mes: number
  periodo_anio: number
  escuelas: EscuelaRef | EscuelaRef[] | null
}
interface PgrRow {
  informe_id: string
  residuos_demolicion: ResiduoReg[] | null
  residuos_construccion: ResiduoReg[] | null
}
interface FilaResiduo {
  escuela: string
  periodo: string
  categoria: string
  tipo: string
  material: string
  cantidad: number
  unidad: string
  manejo: string
  acopio: string
  recepcion: string
}

const CATEGORIAS = ['Inertes', 'No Peligrosos', 'Peligrosos'] as const
const COLOR_CAT: Record<string, string> = {
  'Inertes': 'text-slate-500 bg-slate-100 border-slate-200',
  'No Peligrosos': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Peligrosos': 'text-red-700 bg-red-50 border-red-200',
}

const selectCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white'
const anioActual = new Date().getFullYear()

export default function ResiduosReporte() {
  const supabase = createClient()
  const [anio, setAnio] = useState(anioActual)
  const [mesDesde, setMesDesde] = useState(1)
  const [mesHasta, setMesHasta] = useState(12)
  const [supervision, setSupervision] = useState('')
  const [escuelaId, setEscuelaId] = useState('')
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [escuelas, setEscuelas] = useState<{ id: string; nombre: string; empresa_supervision: string | null }[]>([])
  const [filas, setFilas] = useState<{ etapa: 'Demolición y desmontaje' | 'Construcción'; fila: FilaResiduo }[]>([])
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

      const { data: pgr } = await supabase
        .from('informe_pgr')
        .select('informe_id, residuos_demolicion, residuos_construccion')
        .in('informe_id', lista.map(i => i.id))

      const porInforme = new Map(lista.map(i => [i.id, i]))
      const out: { etapa: 'Demolición y desmontaje' | 'Construcción'; fila: FilaResiduo }[] = []

      for (const p of (pgr ?? []) as PgrRow[]) {
        const inf = porInforme.get(p.informe_id)
        if (!inf) continue
        const esc = Array.isArray(inf.escuelas) ? inf.escuelas[0] : inf.escuelas
        const escuela = esc ? `${esc.nombre} (${esc.codigo})` : '—'
        const periodo = `${MESES[inf.periodo_mes - 1]} ${inf.periodo_anio}`
        const etapas: [('Demolición y desmontaje' | 'Construcción'), ResiduoReg[] | null][] = [
          ['Demolición y desmontaje', p.residuos_demolicion],
          ['Construcción', p.residuos_construccion],
        ]
        for (const [etapa, regs] of etapas) {
          for (const r of regs ?? []) {
            for (const m of r.materiales ?? []) {
              out.push({
                etapa,
                fila: {
                  escuela, periodo,
                  categoria: r.categoria || 'Sin categoría',
                  tipo: r.tipo_residuo || 'Sin tipo',
                  material: m.nombre,
                  cantidad: parseFloat(String(m.peso_kg)) || 0,
                  unidad: m.unidad || 'kg',
                  manejo: m.manejo ?? '',
                  acopio: r.lugar_acopio?.trim() ?? '',
                  recepcion: r.sitio_recepcion?.trim() ?? '',
                },
              })
            }
            if (!(r.materiales ?? []).length) {
              out.push({
                etapa,
                fila: {
                  escuela, periodo,
                  categoria: r.categoria || 'Sin categoría',
                  tipo: r.tipo_residuo || 'Sin tipo',
                  material: '—', cantidad: 0, unidad: 'kg', manejo: '',
                  acopio: r.lugar_acopio?.trim() ?? '',
                  recepcion: r.sitio_recepcion?.trim() ?? '',
                },
              })
            }
          }
        }
      }

      if (activo) { setFilas(out); setCargando(false) }
    }
    cargar()
    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mesDesde, mesHasta, supervision, escuelaId])

  const fmtCant = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const textoUnidades = (unidades: Record<string, number>) => {
    const us = Object.keys(unidades).sort((a, b) => (a === 'kg' ? -1 : b === 'kg' ? 1 : a.localeCompare(b)))
    return us.length > 0 ? us.map(u => `${fmtCant(unidades[u])} ${u}`).join(' · ') : '0.00 kg'
  }

  const resumen = (etapa: 'Demolición y desmontaje' | 'Construcción') => {
    const f = filas.filter(x => x.etapa === etapa).map(x => x.fila)
    const porCat: Record<string, { n: number; unidades: Record<string, number> }> = {}
    for (const c of CATEGORIAS) porCat[c] = { n: 0, unidades: {} }
    const porTipo: Record<string, { categoria: string; tipo: string; n: number; unidades: Record<string, number> }> = {}
    const totalesUnidad: Record<string, number> = {}
    const acopio = new Set<string>()
    const recepcion = new Set<string>()
    for (const r of f) {
      if (!porCat[r.categoria]) porCat[r.categoria] = { n: 0, unidades: {} }
      porCat[r.categoria].n++
      porCat[r.categoria].unidades[r.unidad] = (porCat[r.categoria].unidades[r.unidad] ?? 0) + r.cantidad
      const k = `${r.categoria}|${r.tipo}`
      if (!porTipo[k]) porTipo[k] = { categoria: r.categoria, tipo: r.tipo, n: 0, unidades: {} }
      porTipo[k].n++
      porTipo[k].unidades[r.unidad] = (porTipo[k].unidades[r.unidad] ?? 0) + r.cantidad
      totalesUnidad[r.unidad] = (totalesUnidad[r.unidad] ?? 0) + r.cantidad
      if (r.acopio) acopio.add(r.acopio)
      if (r.recepcion) recepcion.add(r.recepcion)
    }
    const totalesTxt = Object.keys(totalesUnidad).sort((a, b) => (a === 'kg' ? -1 : b === 'kg' ? 1 : a.localeCompare(b)))
      .map(u => `${fmtCant(totalesUnidad[u])} ${u}`)
    return {
      f, porCat, totalesTxt, acopio: [...acopio], recepcion: [...recepcion],
      porTipo: Object.values(porTipo).map(v => ({ ...v, texto: textoUnidades(v.unidades) })),
    }
  }

  const etapas = ['Demolición y desmontaje', 'Construcción'] as const

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-6 gap-4">
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
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 md:col-span-2">
          Centro escolar
          <select className={selectCls} value={escuelaId} onChange={e => setEscuelaId(e.target.value)}>
            <option value="">Todos</option>
            {escuelasFiltro.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
      </div>

      {cargando && (
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Cargando…</div>
      )}

      {!cargando && filas.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No hay planes de gestión de residuos aprobados para los filtros seleccionados.
        </div>
      )}

      {!cargando && filas.length > 0 && etapas.map(etapa => {
        const r = resumen(etapa)
        if (r.f.length === 0) return null
        return (
          <section key={etapa} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Residuos generados en la etapa de {etapa.toLowerCase()}</h2>
              <div className="flex flex-wrap gap-2">{r.totalesTxt.length > 0 ? r.totalesTxt.map(t => <span key={t} className="text-sm font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">{t}</span>) : <span className="text-sm font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">0.00 kg</span>}</div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Categorías</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(r.porCat).map(([cat, v]) => (
                  <div key={cat} className={`rounded-lg border px-4 py-3 ${COLOR_CAT[cat] ?? 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs font-semibold">{cat}</p>
                    <p className="text-lg font-bold">{textoUnidades(v.unidades)}</p>
                    <p className="text-xs opacity-80">{v.n} material{v.n !== 1 ? 'es' : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            {r.porTipo.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Tipo de residuo</h3>
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500 text-xs">
                    <tr><th className="py-2">Categoría</th><th>Tipo</th><th className="text-right">Cantidades</th><th className="text-right">Materiales</th></tr>
                  </thead>
                  <tbody>
                    {r.porTipo.map((t, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2">{t.categoria}</td>
                        <td>{t.tipo}</td>
                        <td className="text-right font-medium">{t.texto}</td>
                        <td className="text-right">{t.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Materiales presentes en la obra</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 text-xs">
                    <tr>
                      <th className="px-3 py-2">Centro escolar</th>
                      <th className="px-3 py-2">Periodo</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2">Manejo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.f.map((x, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2">{x.escuela}</td>
                        <td className="px-3 py-2">{x.periodo}</td>
                        <td className="px-3 py-2">{x.categoria}</td>
                        <td className="px-3 py-2">{x.tipo}</td>
                        <td className="px-3 py-2 font-medium">{x.material}</td>
                        <td className="px-3 py-2 text-right">{x.cantidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {x.unidad}</td>
                        <td className="px-3 py-2">{x.manejo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Lugares de acopio</h3>
                {r.acopio.length > 0
                  ? <ul className="list-disc pl-5 text-sm space-y-1">{r.acopio.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  : <p className="text-sm text-slate-500">Sin lugares de acopio registrados</p>}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Sitios de recepción temporal</h3>
                {r.recepcion.length > 0
                  ? <ul className="list-disc pl-5 text-sm space-y-1">{r.recepcion.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  : <p className="text-sm text-slate-500">Sin sitios de recepción registrados</p>}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
