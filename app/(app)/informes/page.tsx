import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, HardHat, FileText, CheckCircle, Clock, AlertTriangle, CircleCheck } from 'lucide-react'
import BorrarInforme from './BorrarInforme'
import { MESES } from '@/types'
import PendienteCell from './PendienteCell'

const ANIO_ACTUAL = new Date().getFullYear()

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mes?: string; anio?: string; estado?: string; supervision?: string; vista?: string; mes_desde?: string; mes_hasta?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // ── Perfil del usuario logueado ──────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  let perfil: { rol: string; empresa_supervision: string | null } | null = null
  if (user) {
    const { data } = await supabase.from('profiles')
      .select('rol, empresa_supervision').eq('id', user.id).single()
    perfil = data
  }
  // Si es "usuario" con empresa asignada → forzar su empresa, ignorar param
  // Solo rol 'usuario' queda restringido — administrador ve todo libremente
  const esUsuarioRestringido = perfil?.rol === 'usuario' && !!perfil?.empresa_supervision
  const esProgramador = perfil?.rol === 'programador'
  const esVisitante = perfil?.rol === 'visitante'

  const q = params.q ?? ''
  const mes = params.mes ?? ''
  const anio = params.anio ?? String(ANIO_ACTUAL)
  const estado = params.estado ?? ''
  // Supervisión: si es usuario restringido, siempre su empresa
  const supervision = esUsuarioRestringido
    ? (perfil!.empresa_supervision ?? '')
    : (params.supervision ?? '')
  const vista = params.vista ?? 'lista'
  const mesDesde = parseInt(params.mes_desde ?? '1')
  const mesHasta = parseInt(params.mes_hasta ?? '12')

  const mesActual  = new Date().getMonth() + 1
  const anioActual = new Date().getFullYear()

  // Visitante: solo escuelas demo
  if (esVisitante) {
    let escuelasDemo = await supabase.from('escuelas')
      .select('id, nombre, codigo, grupo_id, empresa_supervision, empresa_obras, numero_contrato, grupos(numero)')
      .eq('es_demo', true).eq('activa', true).order('nombre')
    const escuelasDemoList = escuelasDemo.data ?? []
    const escuelaDemoIds = escuelasDemoList.map((e: any) => e.id)

    const { data: informesDemo } = await supabase
      .from('informes').select('*, escuelas(nombre, codigo, grupo_id, empresa_supervision, grupos(numero))')
      .in('escuela_id', escuelaDemoIds.length > 0 ? escuelaDemoIds : ['no-id'])
      .eq('periodo_mes', 3).eq('periodo_anio', 2026)
      .order('periodo_anio', { ascending: false }).order('periodo_mes', { ascending: false })

    const idsDemo = informesDemo?.map(i => i.id) ?? []
    const obsEstadosMapDemo: Record<string, Set<string>> = {}
    if (idsDemo.length > 0) {
      const { data: obsData } = await supabase.from('informe_observaciones')
        .select('informe_id, estado').in('informe_id', idsDemo).neq('observacion', '')
      obsData?.forEach(o => {
        if (!obsEstadosMapDemo[o.informe_id]) obsEstadosMapDemo[o.informe_id] = new Set()
        obsEstadosMapDemo[o.informe_id].add(o.estado)
      })
    }

    function getEstadoVisualDemo(inf: any): 'borrador'|'enviado'|'observado'|'resuelto'|'aprobado' {
      if (inf.estado === 'borrador') return 'borrador'
      if (inf.estado === 'aprobado') return 'aprobado'
      const estados = obsEstadosMapDemo[inf.id]
      if (!estados || estados.size === 0) return 'enviado'
      if (estados.has('pendiente')) return 'observado'
      return 'resuelto'
    }

    const ESTADO_VISUAL_STYLES: Record<string, { label: string; cls: string }> = {
      borrador:  { label: 'Borrador',  cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
      enviado:   { label: 'Enviado',   cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
      observado: { label: 'Observado', cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
      resuelto:  { label: 'Resuelto',  cls: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
      aprobado:  { label: 'Aprobado',  cls: 'bg-green-100 text-green-700 border border-green-200' },
    }

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Informes — Vista de demostración</h1>
          <p className="text-slate-500 text-sm mt-1">Acceso de solo lectura · Escuela demo</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
          Estás en modo <strong>visitante</strong>. Solo puedes visualizar los informes de la escuela de demostración.
        </div>
        {(informesDemo ?? []).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No hay informes demo disponibles aún.</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Centro Educativo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Período</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(informesDemo ?? []).map((inf: any) => {
                  const esc = inf.escuelas as any
                  const ev = getEstadoVisualDemo(inf)
                  const es = ESTADO_VISUAL_STYLES[ev]
                  return (
                    <tr key={inf.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{esc?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{MESES[inf.periodo_mes - 1]} {inf.periodo_anio}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${es.cls}`}>{es.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/informes/${inf.id}`}
                          className="text-blue-700 hover:underline text-xs font-medium">Ver informe →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // Base de escuelas habilitadas (si usuario restringido → solo su empresa)
  const baseEscuelas = supabase.from('escuelas').select('*', { count: 'exact', head: true })
    .eq('activa', true).eq('etapa', 'Construcción')
    .neq('numero_contrato', 'SIN ADJUDICAR').not('numero_contrato', 'is', null)

  // Base de informes del mes actual (joined con escuelas para filtrar por empresa si aplica)
  const baseInformesCount = (estado_val: string) => {
    let q = supabase.from('informes')
      .select('*, escuelas!inner(empresa_supervision)', { count: 'exact', head: true })
      .eq('periodo_mes', mesActual).eq('periodo_anio', anioActual)
    if (estado_val) q = q.eq('estado', estado_val)
    if (esUsuarioRestringido && supervision) q = q.eq('escuelas.empresa_supervision', supervision)
    return q
  }

  const [
    { data: supervisiones },
    { count: totalHabilitadas },
    { count: informesMesActual },
    { count: informesAprobados },
    { count: informesBorrador },
  ] = await Promise.all([
    supabase.from('escuelas').select('empresa_supervision')
      .eq('activa', true).eq('etapa', 'Construcción')
      .neq('numero_contrato', 'SIN ADJUDICAR').not('numero_contrato', 'is', null)
      .order('empresa_supervision'),
    esUsuarioRestringido && supervision
      ? baseEscuelas.eq('empresa_supervision', supervision)
      : baseEscuelas,
    baseInformesCount(''),
    baseInformesCount('aprobado'),
    baseInformesCount('borrador'),
  ])

  const empresasUnicas = [...new Set((supervisiones ?? []).map((e: any) => e.empresa_supervision).filter(Boolean))] as string[]

  let escuelasQuery = supabase
    .from('escuelas')
    .select('id, nombre, codigo, grupo_id, empresa_supervision, empresa_obras, numero_contrato, grupos(numero)')
    .eq('activa', true)
    .eq('etapa', 'Construcción')
    .neq('numero_contrato', 'SIN ADJUDICAR')
    .not('numero_contrato', 'is', null)
    .order('grupo_id').order('nombre')
  if (supervision) escuelasQuery = escuelasQuery.eq('empresa_supervision', supervision)
  const { data: escuelas } = await escuelasQuery

  const { data: informesAnio } = await supabase
    .from('informes').select('id, escuela_id, periodo_mes, periodo_anio, estado')
    .eq('periodo_anio', parseInt(anio))

  const mapaInformes: Record<string, { id: string; estado: string }> = {}
  informesAnio?.forEach(inf => {
    mapaInformes[`${inf.escuela_id}-${inf.periodo_mes}`] = { id: inf.id, estado: inf.estado }
  })

  function getCeldaStatus(escuelaId: number, m: number) {
    const inf = mapaInformes[`${escuelaId}-${m}`]
    if (inf) return inf
    const mesVencido = parseInt(anio) < anioActual || (parseInt(anio) === anioActual && m < mesActual)
    if (mesVencido) return { id: null, estado: 'pendiente' }
    return { id: null, estado: 'futuro' }
  }

  let listaQuery = supabase
    .from('informes')
    .select('*, escuelas(nombre, codigo, grupo_id, empresa_supervision, grupos(numero))')
    .order('periodo_anio', { ascending: false }).order('periodo_mes', { ascending: false })
  if (anio) listaQuery = listaQuery.eq('periodo_anio', anio)
  if (mes)  listaQuery = listaQuery.eq('periodo_mes', mes)
  if (estado) listaQuery = listaQuery.eq('estado', estado)
  const { data: informes } = await listaQuery

  const informesFiltrados = informes?.filter(inf => {
    const esc = inf.escuelas as any
    if (q && !esc?.nombre?.toLowerCase().includes(q.toLowerCase())) return false
    if (supervision && esc?.empresa_supervision !== supervision) return false
    return true
  })

  // Placeholder para estadísticas (será recalculado después de cargar observaciones)
  let estadisticasLista = {
    totalEmpresas: 0,
    totalInformes: 0,
    borrador: 0,
    aprobado: 0,
    enviado: 0,
    observado: 0,
    pendientes: 0,
  }

  // Cargar observaciones para determinar estado visual de cada informe
  const idsLista = informesFiltrados?.map(i => i.id) ?? []
  // informe_id → Set de estados de sus observaciones
  const obsEstadosMap: Record<string, Set<string>> = {}
  if (idsLista.length > 0) {
    const { data: obsData } = await supabase
      .from('informe_observaciones')
      .select('informe_id, estado')
      .in('informe_id', idsLista)
      .neq('observacion', '')
    obsData?.forEach(o => {
      if (!obsEstadosMap[o.informe_id]) obsEstadosMap[o.informe_id] = new Set()
      obsEstadosMap[o.informe_id].add(o.estado)
    })
  }

  // Helpers: un informe está "observado" si tiene obs pendientes
  // y "resuelto" si tiene obs pero todas atendidas
  function getEstadoVisual(inf: any): 'borrador' | 'enviado' | 'observado' | 'resuelto' | 'aprobado' {
    if (inf.estado === 'borrador')  return 'borrador'
    if (inf.estado === 'aprobado')  return 'aprobado'
    // enviado → revisar observaciones
    const estados = obsEstadosMap[inf.id]
    if (!estados || estados.size === 0) return 'enviado'
    if (estados.has('pendiente'))       return 'observado'
    return 'resuelto'  // tiene obs pero todas atendidas
  }

  // Recalcular estadísticas DESPUÉS de cargar observaciones
  if (vista === 'lista' && informesFiltrados) {
    const conFiltros = informesFiltrados.filter((inf: any) => {
      if (mes && inf.periodo_mes !== parseInt(mes)) return false
      if (estado && inf.estado !== estado) return false
      return true
    })

    const empresas = new Set(conFiltros.map((inf: any) => inf.escuelas?.empresa_supervision).filter(Boolean))

    // Contar por estado visual
    const estadoVisualCounts: Record<string, number> = {
      borrador: 0,
      enviado: 0,
      observado: 0,
      resuelto: 0,
      aprobado: 0,
    }
    conFiltros.forEach((inf: any) => {
      const ev = getEstadoVisual(inf)
      estadoVisualCounts[ev]++
    })

    estadisticasLista = {
      totalEmpresas: empresas.size,
      totalInformes: conFiltros.length,
      borrador: estadoVisualCounts.borrador,
      aprobado: estadoVisualCounts.aprobado,
      enviado: estadoVisualCounts.enviado + estadoVisualCounts.resuelto, // Enviados + Resueltos
      observado: estadoVisualCounts.observado,
      pendientes: estadoVisualCounts.borrador, // Pendientes = Borradores no enviados
    }
  }

  const totalEmpresasLista = estadisticasLista.totalEmpresas
  const totalInformesLista = estadisticasLista.totalInformes
  const informesBorradorLista = estadisticasLista.borrador
  const informesAprobadoLista = estadisticasLista.aprobado
  const informesEnviadoLista = estadisticasLista.enviado
  const informesObservadoLista = estadisticasLista.observado
  const informesPendientesLista = estadisticasLista.pendientes

  const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  // Meses visibles según el rango seleccionado (1-based)
  const mesesVisibles = Array.from({ length: 12 }, (_, i) => i + 1).filter(m => m >= mesDesde && m <= mesHasta)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Informes mensuales de condiciones ambientales y sociales</h1>
          <p className="text-slate-500 text-sm mt-1">Supervision SCAS - BCIE</p>
        </div>
        <Link href="/informes/nuevo"
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
          <Plus size={16} /> Nuevo informe
        </Link>
      </div>

      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {[{key:'lista',label:'Lista de informes'},{key:'control',label:'Control mensual'}].map(tab => (
          <Link key={tab.key}
            href={`/informes?vista=${tab.key}&anio=${anio}${supervision ? `&supervision=${encodeURIComponent(supervision)}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vista === tab.key ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>{tab.label}</Link>
        ))}
      </div>

      <form method="GET" className="flex flex-wrap gap-3 mb-5 bg-white border border-slate-200 rounded-xl p-4">
        <input type="hidden" name="vista" value={vista} />
        {esUsuarioRestringido ? (
          // Usuario restringido: muestra su empresa fija, no puede cambiarla
          <>
            <input type="hidden" name="supervision" value={supervision} />
            <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800 min-w-72">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-medium truncate">{supervision}</span>
            </div>
          </>
        ) : (
          <select name="supervision" defaultValue={supervision}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-72">
            <option value="">Todas las empresas de supervision</option>
            {empresasUnicas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
        <input name="anio" type="number" defaultValue={anio} placeholder="Año"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {vista === 'control' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">Periodo:</span>
            <select name="mes_desde" defaultValue={mesDesde}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <span className="text-slate-400 text-sm">—</span>
            <select name="mes_hasta" defaultValue={mesHasta}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
        )}
        {vista === 'lista' && (
          <>
            <input name="q" defaultValue={q} placeholder="Buscar escuela..."
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select name="mes" defaultValue={mes} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">Todos los meses</option>
              {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select name="estado" defaultValue={estado} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aprobado">Aprobado</option>
            </select>
          </>
        )}
        <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
          Filtrar
        </button>
      </form>

      {vista === 'lista' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-orange-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">CE Habilitados</p>
              <p className="text-2xl font-bold text-orange-600">{totalHabilitadas ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Empresas</p>
              <p className="text-2xl font-bold text-slate-800">{totalEmpresasLista}</p>
            </div>
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600">{totalInformesLista}</p>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Borrador</p>
              <p className="text-2xl font-bold text-amber-600">{informesBorradorLista}</p>
            </div>
            <div className="bg-white rounded-lg border border-sky-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Enviado</p>
              <p className="text-2xl font-bold text-sky-600">{informesEnviadoLista}</p>
            </div>
            <div className="bg-white rounded-lg border border-orange-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Observado</p>
              <p className="text-2xl font-bold text-orange-600">{informesObservadoLista}</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Aprobado</p>
              <p className="text-2xl font-bold text-green-600">{informesAprobadoLista}</p>
            </div>
          </div>

          {(() => {
            const informesParaMostrar = (informesFiltrados ?? []).filter((inf: any) => {
              if (mes && inf.periodo_mes !== parseInt(mes)) return false
              if (estado && inf.estado !== estado) return false
              return true
            })
            return (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Centro Educativo</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Supervision</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Grupo</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Periodo</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {informesParaMostrar.map((inf: any) => (
                <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{inf.escuelas?.nombre ?? '-'}</p>
                    <p className="text-xs text-slate-400">{inf.escuelas?.codigo}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-40 truncate">{inf.escuelas?.empresa_supervision ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      G{inf.escuelas?.grupos?.numero ?? '?'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{MESES[inf.periodo_mes - 1]} {inf.periodo_anio}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const ev = getEstadoVisual(inf)
                      return (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit flex items-center gap-1 ${
                          ev === 'aprobado'  ? 'bg-green-100 text-green-700' :
                          ev === 'enviado'   ? 'bg-blue-100 text-blue-700' :
                          ev === 'observado' ? 'bg-amber-100 text-amber-700' :
                          ev === 'resuelto'  ? 'bg-purple-100 text-purple-700' :
                                              'bg-slate-100 text-slate-600'
                        }`}>
                          {ev === 'observado' && <AlertTriangle size={10} />}
                          {ev === 'resuelto'  && <CircleCheck size={10} />}
                          {ev === 'aprobado'  ? 'Aprobado'  :
                           ev === 'enviado'   ? 'Enviado'   :
                           ev === 'observado' ? 'Observado' :
                           ev === 'resuelto'  ? 'Resuelto'  : 'Borrador'}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/informes/${inf.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                        Ver / Editar
                      </Link>
                      {esProgramador && (
                        <BorrarInforme
                          informeId={inf.id}
                          nombre={inf.escuelas?.nombre ?? ''}
                          periodo={`${MESES[inf.periodo_mes - 1]} ${inf.periodo_anio}`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
                    ))}
                    {informesParaMostrar.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">No se encontraron informes con los filtros aplicados</td></tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {vista === 'control' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="text-center px-2 py-3 font-medium w-8 border-r border-slate-700">G</th>
                  <th className="text-left px-3 py-3 font-medium w-16 border-r border-slate-700">Codigo</th>
                  <th className="text-left px-3 py-3 font-medium min-w-52 border-r border-slate-700">Centro Educativo</th>
                  <th className="text-left px-3 py-3 font-medium min-w-36 border-r border-slate-700">Empresa Obras</th>
                  <th className="text-left px-3 py-3 font-medium w-20 border-r border-slate-700">Contrato</th>
                  <th className="text-left px-3 py-3 font-medium min-w-36 border-r border-slate-700">Empresa Supervision</th>
                  {mesesVisibles.map(m => (
                    <th key={m} className="text-center px-1 py-3 font-medium w-14 border-r border-slate-700 last:border-0">
                      {MESES_CORTOS[m-1]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {escuelas?.map((esc: any) => (
                  <tr key={esc.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-2 py-2 text-center font-bold text-blue-700 border-r border-slate-100">{esc.grupos?.numero}</td>
                    <td className="px-3 py-2 font-mono text-slate-500 border-r border-slate-100">{esc.codigo}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-100">{esc.nombre}</td>
                    <td className="px-3 py-2 text-slate-500 border-r border-slate-100">{esc.empresa_obras}</td>
                    <td className="px-3 py-2 text-slate-500 border-r border-slate-100">{esc.numero_contrato}</td>
                    <td className="px-3 py-2 text-slate-500 border-r border-slate-100">{esc.empresa_supervision}</td>
                    {mesesVisibles.map(m => {
                      const cel = getCeldaStatus(esc.id, m)
                      return (
                        <td key={m} className="px-1 py-2 text-center border-r border-slate-100 last:border-0">
                          {cel.id ? (
                            <Link href={`/informes/${cel.id}`}>
                              <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${
                                cel.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                                cel.estado === 'enviado'  ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'}`}>
                                {cel.estado === 'aprobado' ? 'Aprobado' :
                                 cel.estado === 'enviado'  ? 'Entregado' : 'Borrador'}
                              </span>
                            </Link>
                          ) : cel.estado === 'pendiente' ? (
                            <PendienteCell
                              escuelaId={esc.id}
                              escuelaNombre={esc.nombre}
                              mes={m}
                              anio={parseInt(anio)}
                            />
                          ) : (
                            <span className="text-slate-200">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {!escuelas?.length && (
                  <tr>
                    <td colSpan={6 + mesesVisibles.length} className="text-center py-12 text-slate-400">
                      {supervision
                        ? 'No hay centros educativos en etapa de Construccion para esta supervision'
                        : 'Selecciona una empresa de supervision para ver sus centros educativos en construccion'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-5 px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-600">
            <span className="font-semibold">Leyenda:</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-300 inline-block"/>Aprobado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-300 inline-block"/>Entregado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-300 inline-block"/>Borrador</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-300 inline-block"/>Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="text-slate-300 font-bold">-</span>Sin iniciar</span>
          </div>
        </div>
      )}
    </div>
  )
}
