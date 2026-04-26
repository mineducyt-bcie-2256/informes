'use client'
import { TrendingDown, GraduationCap, Building2, Briefcase, Calendar, Users } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// TIPOS EXPORTADOS
// ═══════════════════════════════════════════════════════════════════
export type MatriculaAnio     = { anio: number; ninos: number; ninas: number }
export type AsistenciaMes     = { mes: number; anio: number; ninos: number; ninas: number }
export type InasistenciaMes   = { mes: number; anio: number; cantidad: number; motivos: string }
export type DesercionMes      = { mes: number; anio: number; cantidad: number; motivos: string }
export type EmpleoMes         = { mes: number; anio: number; hombres: number; mujeres: number; tipos?: string }
export type DiasEscolaresAnio = { anio: number; dias: number }

export type Infraestructura = {
  descripcion: string
  // Agua, saneamiento e higiene
  agua_potable: string; frecuencia_agua: string; tanque_cisterna: string
  num_sanitarios: number; sanitarios_funcionales: number; sanitarios_separados: string
  lavamanos_funcionales: number; manejo_aguas_residuales: string; manejo_basura: string
  // Hacinamiento
  aulas_en_uso: number; turnos_compartidos: string; deficit_aulas: number; estado_estructural: string
  // Tecnología
  energia_electrica: string; estado_instalacion_electrica: string
  internet: string; velocidad_internet: string
  computadoras_disponibles: number; computadoras_funcionales: number
}

export type IndicadoresImpacto = {
  matricula: MatriculaAnio[]
  asistencia: AsistenciaMes[]
  inasistencias: InasistenciaMes[]
  deserciones: DesercionMes[]
  infraestructura: Infraestructura
  dias_escolares: DiasEscolaresAnio[]
  empleos_directos: EmpleoMes[]
  empleos_indirectos: EmpleoMes[]
}

export const INFRA_INIT: Infraestructura = {
  descripcion: '',
  agua_potable: '', frecuencia_agua: '', tanque_cisterna: '',
  num_sanitarios: 0, sanitarios_funcionales: 0, sanitarios_separados: '',
  lavamanos_funcionales: 0, manejo_aguas_residuales: '', manejo_basura: '',
  aulas_en_uso: 0, turnos_compartidos: '', deficit_aulas: 0, estado_estructural: '',
  energia_electrica: '', estado_instalacion_electrica: '',
  internet: '', velocidad_internet: '',
  computadoras_disponibles: 0, computadoras_funcionales: 0,
}

export const INDICADORES_INIT: IndicadoresImpacto = {
  matricula: [], asistencia: [], inasistencias: [], deserciones: [],
  infraestructura: { ...INFRA_INIT },
  dias_escolares: [], empleos_directos: [], empleos_indirectos: [],
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const MESES_L = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_C = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function mesLabel(mes: number, anio: number) { return `${MESES_C[mes - 1]} ${anio}` }

function getHistorial<T extends { mes: number; anio: number }>(arr: T[], mes: number, anio: number) {
  return arr
    .filter(r => !(r.mes === mes && r.anio === anio))
    .sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
}

function getMesActual<T extends { mes: number; anio: number }>(arr: T[], mes: number, anio: number): T | undefined {
  return arr.find(r => r.mes === mes && r.anio === anio)
}

function upsertMes<T extends { mes: number; anio: number }>(
  arr: T[], mes: number, anio: number, values: Omit<T, 'mes' | 'anio'>
): T[] {
  const existe = arr.some(r => r.mes === mes && r.anio === anio)
  if (existe) return arr.map(r => (r.mes === mes && r.anio === anio) ? { ...r, ...values } : r)
  return [...arr, { mes, anio, ...values } as T]
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS LOCALES
// ═══════════════════════════════════════════════════════════════════
const icBase = 'border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400'
const ic  = `${icBase} w-full`
const ics = `${icBase} bg-white w-full`
const subsec = 'text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 mt-4 flex items-center gap-1.5'

// ─── Fila de historial (read-only) ─────────────────────────────────
function FilaRO({ mes, anio, children }: { mes: number; anio: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-100">
      <span className="text-xs font-medium text-slate-400 w-20 shrink-0">{mesLabel(mes, anio)}</span>
      {children}
    </div>
  )
}

// ─── Fila del mes actual (editable) ────────────────────────────────
function FilaActual({ mes, anio, children }: { mes: number; anio: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg mt-1">
      <span className="text-xs font-semibold text-blue-600 w-20 shrink-0">
        {mesLabel(mes, anio)}<br/>
        <span className="text-blue-400 font-normal">actual</span>
      </span>
      {children}
    </div>
  )
}

// ─── Bloque de subsección ──────────────────────────────────────────
function SubBloque({ titulo, icon: Icon, children }: {
  titulo: string; icon?: any; children: React.ReactNode
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
        {Icon && <Icon size={13} className="text-slate-500" />}
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{titulo}</span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════
interface Props {
  indicadores: IndicadoresImpacto
  onChange: (v: IndicadoresImpacto) => void
  periodoMes: number
  periodoAnio: number
  hssoHombres?: number
  hssoMujeres?: number
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function SeccionIndicadoresImpacto({
  indicadores: indicadoresRaw, onChange, periodoMes, periodoAnio,
  hssoHombres = 0, hssoMujeres = 0,
}: Props) {
  // Normaliza el objeto por si viene parcial o vacío desde la BD
  const indicadores: IndicadoresImpacto = {
    ...INDICADORES_INIT,
    ...indicadoresRaw,
    matricula:          indicadoresRaw?.matricula          ?? [],
    asistencia:         indicadoresRaw?.asistencia         ?? [],
    inasistencias:      indicadoresRaw?.inasistencias      ?? [],
    deserciones:        indicadoresRaw?.deserciones        ?? [],
    dias_escolares:     indicadoresRaw?.dias_escolares     ?? [],
    empleos_directos:   indicadoresRaw?.empleos_directos   ?? [],
    empleos_indirectos: indicadoresRaw?.empleos_indirectos ?? [],
    infraestructura:    { ...INFRA_INIT, ...(indicadoresRaw?.infraestructura ?? {}) },
  }

  function upd(field: keyof IndicadoresImpacto, value: any) {
    onChange({ ...indicadores, [field]: value })
  }
  function updInfra(field: keyof Infraestructura, value: any) {
    onChange({ ...indicadores, infraestructura: { ...indicadores.infraestructura, [field]: value } })
  }

  const infra = indicadores.infraestructura

  // Matrícula total del año actual
  const matAnio = indicadores.matricula.find(m => m.anio === periodoAnio)
  const matriculaTotal = matAnio ? (matAnio.ninos + matAnio.ninas) : 0

  // Cálculos de infraestructura
  const estudiantesPorAula = infra.aulas_en_uso > 0 && matriculaTotal > 0
    ? (matriculaTotal / infra.aulas_en_uso) : null
  const hayHacinamiento = estudiantesPorAula !== null && estudiantesPorAula > 35

  // IPE
  const ipeIndicadores = [
    { label: 'Sin agua potable',             valor: infra.agua_potable === 'No' ? 1 : (infra.agua_potable ? 0 : null) },
    { label: 'Sin internet',                  valor: infra.internet === 'No' ? 1 : (infra.internet ? 0 : null) },
    { label: 'Hacinamiento (>35 est/aula)',   valor: estudiantesPorAula !== null ? (hayHacinamiento ? 1 : 0) : null },
    { label: 'Estado estructural deficiente', valor: infra.estado_estructural ? (infra.estado_estructural !== 'Bueno' ? 1 : 0) : null },
  ]
  const ipeCompletos = ipeIndicadores.filter(i => i.valor !== null)
  const sumaIPE = ipeCompletos.reduce((s, i) => s + (i.valor as number), 0)
  const ipe = ipeCompletos.length > 0 ? sumaIPE / ipeCompletos.length : null

  // Tasa de deserción mensual
  const desercionActual = getMesActual(indicadores.deserciones, periodoMes, periodoAnio)
  const tasaDesercion = matriculaTotal > 0 && desercionActual?.cantidad
    ? ((desercionActual.cantidad / matriculaTotal) * 100).toFixed(2) : null

  return (
    <section className="space-y-6">
      <div className="pb-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <TrendingDown size={14} className="text-indigo-600" /> Indicadores de Impacto
        </h3>
      </div>

      {/* ════════════════════════════════════════════════════════════
          1. PRIVACIONES ESCOLARES — acceso y permanencia
      ════════════════════════════════════════════════════════════ */}
      <SubBloque titulo="Privaciones escolares — Acceso y permanencia educativa" icon={GraduationCap}>

        {/* Matrícula por año — dinámica */}
        <p className={subsec}>Matrícula escolar</p>
        {indicadores.matricula.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
            <div className="grid grid-cols-[80px_1fr_1fr_72px_32px] gap-0 bg-slate-50 border-b border-slate-200 px-3 py-2">
              <span className="text-xs font-semibold text-slate-500">Año</span>
              <span className="text-xs font-semibold text-slate-500 text-center">Niños</span>
              <span className="text-xs font-semibold text-slate-500 text-center">Niñas</span>
              <span className="text-xs font-semibold text-slate-500 text-center">Total</span>
              <span />
            </div>
            {[...indicadores.matricula].sort((a, b) => a.anio - b.anio).map(reg => {
              const tot = reg.ninos + reg.ninas
              return (
                <div key={reg.anio} className="grid grid-cols-[80px_1fr_1fr_72px_32px] gap-2 items-center px-3 py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-semibold text-slate-700">{reg.anio}</span>
                  <input type="number" min={0} value={reg.ninos || ''}
                    onChange={e => {
                      const ninos = parseInt(e.target.value) || 0
                      upd('matricula', indicadores.matricula.map(m => m.anio === reg.anio ? { ...m, ninos } : m))
                    }}
                    className={icBase + ' w-full text-center'} placeholder="0" />
                  <input type="number" min={0} value={reg.ninas || ''}
                    onChange={e => {
                      const ninas = parseInt(e.target.value) || 0
                      upd('matricula', indicadores.matricula.map(m => m.anio === reg.anio ? { ...m, ninas } : m))
                    }}
                    className={icBase + ' w-full text-center'} placeholder="0" />
                  <span className={`text-center text-sm font-bold rounded px-1 py-1 ${tot > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}>{tot || '—'}</span>
                  <button type="button"
                    onClick={() => upd('matricula', indicadores.matricula.filter(m => m.anio !== reg.anio))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors text-xs">✕</button>
                </div>
              )
            })}
          </div>
        )}
        {/* Agregar año de matrícula */}
        {(() => {
          const usados = indicadores.matricula.map(m => m.anio)
          const opciones = [2023,2024,2025,2026,2027,2028,2029,2030].filter(a => !usados.includes(a))
          if (opciones.length === 0) return null
          return (
            <div className="flex items-center gap-2 mb-4">
              <select id="mat-anio-sel" defaultValue="" className={icBase + ' w-28 bg-white'}>
                <option value="" disabled>Año</option>
                {opciones.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button type="button"
                onClick={() => {
                  const sel = document.getElementById('mat-anio-sel') as HTMLSelectElement
                  const anio = parseInt(sel.value)
                  if (!anio) return
                  upd('matricula', [...indicadores.matricula, { anio, ninos: 0, ninas: 0 }])
                  sel.value = ''
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
                + Agregar año
              </button>
            </div>
          )
        })()}

        {/* Asistencia promedio mensual */}
        <p className={subsec}>Asistencia promedio mensual</p>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 w-20">Mes</span>
            <span className="text-xs font-semibold text-slate-500 flex-1 text-center">Niños</span>
            <span className="text-xs font-semibold text-slate-500 flex-1 text-center">Niñas</span>
            <span className="text-xs font-semibold text-slate-500 w-16 text-center">Total</span>
          </div>
          {getHistorial(indicadores.asistencia, periodoMes, periodoAnio).map(r => (
            <FilaRO key={`${r.mes}-${r.anio}`} mes={r.mes} anio={r.anio}>
              <span className="flex-1 text-center text-sm text-slate-500">{r.ninos}</span>
              <span className="flex-1 text-center text-sm text-slate-500">{r.ninas}</span>
              <span className="w-16 text-center text-sm font-semibold text-slate-600">{r.ninos + r.ninas}</span>
            </FilaRO>
          ))}
          {(() => {
            const cur = getMesActual(indicadores.asistencia, periodoMes, periodoAnio)
            const ninos = cur?.ninos ?? 0; const ninas = cur?.ninas ?? 0
            return (
              <FilaActual mes={periodoMes} anio={periodoAnio}>
                <input type="number" min={0} value={ninos || ''} placeholder="0"
                  onChange={e => upd('asistencia', upsertMes(indicadores.asistencia, periodoMes, periodoAnio,
                    { ninos: parseInt(e.target.value) || 0, ninas }))}
                  className={`${ic} flex-1 text-center`} />
                <input type="number" min={0} value={ninas || ''} placeholder="0"
                  onChange={e => upd('asistencia', upsertMes(indicadores.asistencia, periodoMes, periodoAnio,
                    { ninos, ninas: parseInt(e.target.value) || 0 }))}
                  className={`${ic} flex-1 text-center`} />
                <span className={`w-16 text-center text-sm font-bold rounded px-1 py-1 ${(ninos+ninas) > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}>
                  {(ninos + ninas) || '—'}
                </span>
              </FilaActual>
            )
          })()}
        </div>

        {/* Inasistencias */}
        <p className={subsec}>Inasistencias</p>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 w-20">Mes</span>
            <span className="text-xs font-semibold text-slate-500 w-14">Cantidad</span>
            <span className="text-xs font-semibold text-slate-500 flex-1">Motivos</span>
          </div>
          {getHistorial(indicadores.inasistencias, periodoMes, periodoAnio).map(r => (
            <FilaRO key={`${r.mes}-${r.anio}`} mes={r.mes} anio={r.anio}>
              <span className="w-14 text-sm text-slate-500">{r.cantidad}</span>
              <span className="flex-1 text-sm text-slate-500 italic">{r.motivos || '—'}</span>
            </FilaRO>
          ))}
          {(() => {
            const cur = getMesActual(indicadores.inasistencias, periodoMes, periodoAnio)
            const cantidad = cur?.cantidad ?? 0; const motivos = cur?.motivos ?? ''
            return (
              <FilaActual mes={periodoMes} anio={periodoAnio}>
                <input type="number" min={0} value={cantidad || ''} placeholder="0"
                  onChange={e => upd('inasistencias', upsertMes(indicadores.inasistencias, periodoMes, periodoAnio,
                    { cantidad: parseInt(e.target.value) || 0, motivos }))}
                  className={`${icBase} w-16 text-center`} />
                <input type="text" value={motivos} placeholder="Motivos de inasistencia..."
                  onChange={e => upd('inasistencias', upsertMes(indicadores.inasistencias, periodoMes, periodoAnio,
                    { cantidad, motivos: e.target.value }))}
                  className={`${icBase} flex-1`} />
              </FilaActual>
            )
          })()}
        </div>

        {/* Deserciones */}
        <p className={subsec}>Deserciones</p>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 w-20">Mes</span>
            <span className="text-xs font-semibold text-slate-500 w-14">Cantidad</span>
            <span className="text-xs font-semibold text-slate-500 flex-1">Motivos</span>
            <span className="text-xs font-semibold text-slate-500 w-20 text-center">Tasa</span>
          </div>
          {getHistorial(indicadores.deserciones, periodoMes, periodoAnio).map(r => {
            const tasa = matriculaTotal > 0 && r.cantidad > 0
              ? ((r.cantidad / matriculaTotal) * 100).toFixed(2) : null
            return (
              <FilaRO key={`${r.mes}-${r.anio}`} mes={r.mes} anio={r.anio}>
                <span className="w-14 text-sm text-slate-500">{r.cantidad}</span>
                <span className="flex-1 text-sm text-slate-500 italic">{r.motivos || '—'}</span>
                <span className={`w-20 text-center text-xs font-semibold rounded px-1.5 py-0.5 ${tasa ? 'bg-red-50 text-red-600' : 'text-slate-300'}`}>
                  {tasa ? `${tasa}%` : '—'}
                </span>
              </FilaRO>
            )
          })}
          {(() => {
            const cur = getMesActual(indicadores.deserciones, periodoMes, periodoAnio)
            const cantidad = cur?.cantidad ?? 0; const motivos = cur?.motivos ?? ''
            const tasa = matriculaTotal > 0 && cantidad > 0
              ? ((cantidad / matriculaTotal) * 100).toFixed(2) : null
            return (
              <FilaActual mes={periodoMes} anio={periodoAnio}>
                <input type="number" min={0} value={cantidad || ''} placeholder="0"
                  onChange={e => upd('deserciones', upsertMes(indicadores.deserciones, periodoMes, periodoAnio,
                    { cantidad: parseInt(e.target.value) || 0, motivos }))}
                  className={`${icBase} w-16 text-center`} />
                <input type="text" value={motivos} placeholder="Motivos de deserción..."
                  onChange={e => upd('deserciones', upsertMes(indicadores.deserciones, periodoMes, periodoAnio,
                    { cantidad, motivos: e.target.value }))}
                  className={`${icBase} flex-1`} />
                <span className={`w-20 text-center text-xs font-bold rounded px-1.5 py-0.5 ${tasa ? 'bg-red-100 text-red-700' : 'text-slate-300'}`}>
                  {tasa ? `${tasa}%` : '—'}
                </span>
              </FilaActual>
            )
          })()}
        </div>
        {matriculaTotal === 0 && (
          <p className="text-xs text-amber-600 mt-1">⚠ Ingrese la matrícula del año {periodoAnio} para calcular la tasa de deserción.</p>
        )}
      </SubBloque>

      {/* ════════════════════════════════════════════════════════════
          2. PRIVACIONES POR REUBICACIÓN TEMPORAL
      ════════════════════════════════════════════════════════════ */}
      <SubBloque titulo="Privaciones escolares por reubicación temporal" icon={Building2}>

        {/* Infraestructura general */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Infraestructura disponible (descripción general)</label>
          <textarea value={infra.descripcion}
            onChange={e => updInfra('descripcion', e.target.value)}
            rows={2} placeholder="Describa el estado de la infraestructura utilizada durante la reubicación..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Agua, saneamiento e higiene */}
        <p className={subsec}>Agua, saneamiento e higiene</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Servicio de agua potable</label>
            <select value={infra.agua_potable} onChange={e => updInfra('agua_potable', e.target.value)} className={ics}>
              <option value="">Seleccionar...</option>
              <option>Sí</option><option>No</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Frecuencia del agua</label>
            <input type="text" value={infra.frecuencia_agua}
              onChange={e => updInfra('frecuencia_agua', e.target.value)}
              placeholder="Ej: Diaria, 3 veces/semana..." className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Tanque / cisterna funcional</label>
            <input type="text" value={infra.tanque_cisterna}
              onChange={e => updInfra('tanque_cisterna', e.target.value)}
              placeholder="Sí / No / Descripción..." className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Número de sanitarios</label>
            <input type="number" min={0} value={infra.num_sanitarios || ''}
              onChange={e => updInfra('num_sanitarios', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Sanitarios funcionales</label>
            <input type="number" min={0} value={infra.sanitarios_funcionales || ''}
              onChange={e => updInfra('sanitarios_funcionales', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Sanitarios separados niñas / niños</label>
            <select value={infra.sanitarios_separados} onChange={e => updInfra('sanitarios_separados', e.target.value)} className={ics}>
              <option value="">Seleccionar...</option>
              <option>Sí</option><option>No</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Lavamanos funcionales</label>
            <input type="number" min={0} value={infra.lavamanos_funcionales || ''}
              onChange={e => updInfra('lavamanos_funcionales', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Manejo de aguas residuales</label>
            <input type="text" value={infra.manejo_aguas_residuales}
              onChange={e => updInfra('manejo_aguas_residuales', e.target.value)}
              placeholder="Alcantarillado, fosa séptica..." className={ic} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Manejo de basura</label>
            <input type="text" value={infra.manejo_basura}
              onChange={e => updInfra('manejo_basura', e.target.value)}
              placeholder="Recolección municipal, disposición en sitio..." className={ic} />
          </div>
        </div>

        {/* Hacinamiento y capacidad instalada */}
        <p className={subsec}>Hacinamiento y capacidad instalada</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Número de aulas en uso</label>
            <input type="number" min={0} value={infra.aulas_en_uso || ''}
              onChange={e => updInfra('aulas_en_uso', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Estudiantes por aula
              <span className="ml-1 font-normal text-slate-400">(Matrícula / Aulas en uso)</span>
            </label>
            <div className={`${ic} flex items-center justify-between bg-slate-50 cursor-default`}>
              <span className={`text-sm font-bold ${hayHacinamiento ? 'text-red-600' : estudiantesPorAula ? 'text-green-700' : 'text-slate-400'}`}>
                {estudiantesPorAula ? estudiantesPorAula.toFixed(1) : '—'}
              </span>
              {estudiantesPorAula && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hayHacinamiento ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {hayHacinamiento ? 'Hacinamiento' : 'Aceptable'}
                </span>
              )}
            </div>
            {matriculaTotal === 0 && <p className="text-xs text-amber-500 mt-1">Requiere matrícula {periodoAnio}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Turnos compartidos</label>
            <input type="text" value={infra.turnos_compartidos}
              onChange={e => updInfra('turnos_compartidos', e.target.value)}
              placeholder="Mañana / Tarde / Ambos..." className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Déficit de aulas</label>
            <input type="number" min={0} value={infra.deficit_aulas || ''}
              onChange={e => updInfra('deficit_aulas', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Estado estructural de las instalaciones</label>
            <select value={infra.estado_estructural} onChange={e => updInfra('estado_estructural', e.target.value)} className={ics}>
              <option value="">Seleccionar...</option>
              <option>Bueno</option><option>Regular</option><option>Malo</option>
            </select>
          </div>
        </div>

        {/* Tecnología y conectividad */}
        <p className={subsec}>Tecnología y conectividad</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Energía eléctrica</label>
            <select value={infra.energia_electrica} onChange={e => updInfra('energia_electrica', e.target.value)} className={ics}>
              <option value="">Seleccionar...</option>
              <option>Sí</option><option>No</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Estado de instalación eléctrica</label>
            <input type="text" value={infra.estado_instalacion_electrica}
              onChange={e => updInfra('estado_instalacion_electrica', e.target.value)}
              placeholder="Buena / Regular / Deficiente..." className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Internet</label>
            <select value={infra.internet} onChange={e => updInfra('internet', e.target.value)} className={ics}>
              <option value="">Seleccionar...</option>
              <option>Sí</option><option>No</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Velocidad / utilidad real</label>
            <input type="text" value={infra.velocidad_internet}
              onChange={e => updInfra('velocidad_internet', e.target.value)}
              placeholder="Ej: 10 Mbps, uso limitado..." className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Computadoras disponibles</label>
            <input type="number" min={0} value={infra.computadoras_disponibles || ''}
              onChange={e => updInfra('computadoras_disponibles', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Computadoras funcionales</label>
            <input type="number" min={0} value={infra.computadoras_funcionales || ''}
              onChange={e => updInfra('computadoras_funcionales', parseInt(e.target.value) || 0)}
              placeholder="0" className={ic} />
          </div>
        </div>

      </SubBloque>

      {/* ════════════════════════════════════════════════════════════
          3. DÍAS ESCOLARES
      ════════════════════════════════════════════════════════════ */}
      <SubBloque titulo="Días escolares" icon={Calendar}>
        {/* Filas existentes */}
        {indicadores.dias_escolares.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
            <div className="grid grid-cols-[100px_1fr_32px] gap-0 bg-slate-50 border-b border-slate-200 px-3 py-2">
              <span className="text-xs font-semibold text-slate-500">Año</span>
              <span className="text-xs font-semibold text-slate-500">Días escolares efectivos</span>
              <span />
            </div>
            {[...indicadores.dias_escolares]
              .sort((a, b) => a.anio - b.anio)
              .map(reg => (
                <div key={reg.anio} className="grid grid-cols-[100px_1fr_32px] gap-2 items-center px-3 py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-semibold text-slate-700">{reg.anio}</span>
                  <input
                    type="number" min={0} max={365}
                    value={reg.dias || ''}
                    onChange={e => {
                      const dias = parseInt(e.target.value) || 0
                      upd('dias_escolares', indicadores.dias_escolares.map(d => d.anio === reg.anio ? { ...d, dias } : d))
                    }}
                    placeholder="Ej: 185"
                    className={icBase + ' w-full'}
                  />
                  <button
                    type="button"
                    onClick={() => upd('dias_escolares', indicadores.dias_escolares.filter(d => d.anio !== reg.anio))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >✕</button>
                </div>
              ))
            }
          </div>
        )}

        {/* Agregar año */}
        {(() => {
          const aniosUsados = indicadores.dias_escolares.map(d => d.anio)
          const aniosOpciones = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].filter(a => !aniosUsados.includes(a))
          if (aniosOpciones.length === 0) return null
          return (
            <div className="flex items-center gap-2">
              <select
                id="dias-anio-sel"
                defaultValue=""
                className={icBase + ' w-32 bg-white'}
              >
                <option value="" disabled>Año</option>
                {aniosOpciones.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input
                id="dias-cantidad-inp"
                type="number" min={0} max={365}
                placeholder="Días (ej: 185)"
                className={icBase + ' flex-1'}
              />
              <button
                type="button"
                onClick={() => {
                  const sel = (document.getElementById('dias-anio-sel') as HTMLSelectElement)
                  const inp = (document.getElementById('dias-cantidad-inp') as HTMLInputElement)
                  const anio = parseInt(sel.value)
                  const dias = parseInt(inp.value) || 0
                  if (!anio) return
                  upd('dias_escolares', [...indicadores.dias_escolares, { anio, dias }])
                  sel.value = ''
                  inp.value = ''
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                + Agregar
              </button>
            </div>
          )
        })()}
      </SubBloque>

      {/* ════════════════════════════════════════════════════════════
          4. EMPLEOS DIRECTOS
      ════════════════════════════════════════════════════════════ */}
      <SubBloque titulo="Empleos directos fijos derivados del proyecto" icon={Briefcase}>
        {(hssoHombres > 0 || hssoMujeres > 0) && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
            <Users size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Referencia HSSO del periodo: <strong>{hssoHombres} hombres</strong> y <strong>{hssoMujeres} mujeres</strong> (total {hssoHombres + hssoMujeres}).
              El mes actual se precarga con esos valores si no fue editado.
            </p>
          </div>
        )}
        <TablaEmpleos
          lista={indicadores.empleos_directos}
          periodoMes={periodoMes}
          periodoAnio={periodoAnio}
          defaultHombres={hssoHombres}
          defaultMujeres={hssoMujeres}
          mostrarTipos={false}
          onChange={v => upd('empleos_directos', v)}
        />
      </SubBloque>

      {/* ════════════════════════════════════════════════════════════
          5. EMPLEOS INDIRECTOS
      ════════════════════════════════════════════════════════════ */}
      <SubBloque titulo="Empleos indirectos derivados del proyecto" icon={Briefcase}>
        <TablaEmpleos
          lista={indicadores.empleos_indirectos}
          periodoMes={periodoMes}
          periodoAnio={periodoAnio}
          defaultHombres={0}
          defaultMujeres={0}
          mostrarTipos={true}
          onChange={v => upd('empleos_indirectos', v)}
        />
      </SubBloque>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTE: TABLA DE EMPLEOS
// ═══════════════════════════════════════════════════════════════════
function TablaEmpleos({ lista, periodoMes, periodoAnio, defaultHombres, defaultMujeres, mostrarTipos, onChange }: {
  lista: EmpleoMes[]
  periodoMes: number; periodoAnio: number
  defaultHombres: number; defaultMujeres: number
  mostrarTipos: boolean
  onChange: (v: EmpleoMes[]) => void
}) {
  const ic = icBase + ' w-full'

  const historial = getHistorial(lista, periodoMes, periodoAnio)
  const cur       = getMesActual(lista, periodoMes, periodoAnio)

  const hombres = cur?.hombres ?? defaultHombres
  const mujeres = cur?.mujeres ?? defaultMujeres
  const tipos   = cur?.tipos   ?? ''
  const total   = hombres + mujeres
  const pctH    = total > 0 ? Math.round((hombres / total) * 100) : 0
  const pctM    = total > 0 ? Math.round((mujeres / total) * 100) : 0

  function upsCur(vals: Partial<EmpleoMes>) {
    onChange(upsertMes(lista, periodoMes, periodoAnio, {
      hombres: cur?.hombres ?? defaultHombres,
      mujeres: cur?.mujeres ?? defaultMujeres,
      tipos:   cur?.tipos   ?? '',
      ...vals,
    }))
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className={`flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200 ${mostrarTipos ? 'grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_2fr]' : 'grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]'}`}>
        <span className="text-xs font-semibold text-slate-500">Mes</span>
        <span className="text-xs font-semibold text-slate-500 text-center">Hombres</span>
        <span className="text-xs font-semibold text-slate-500 text-center">Mujeres</span>
        <span className="text-xs font-semibold text-slate-500 text-center">Total</span>
        <span className="text-xs font-semibold text-slate-500 text-center">% H</span>
        <span className="text-xs font-semibold text-slate-500 text-center">% M</span>
        {mostrarTipos && <span className="text-xs font-semibold text-slate-500">Tipo de empleo</span>}
      </div>

      {historial.map(r => {
        const tot  = r.hombres + r.mujeres
        const pH   = tot > 0 ? Math.round((r.hombres / tot) * 100) : 0
        const pM   = tot > 0 ? Math.round((r.mujeres / tot) * 100) : 0
        return (
          <div key={`${r.mes}-${r.anio}`}
            className={`px-3 py-2 bg-slate-50 border-b border-slate-100 ${mostrarTipos ? 'grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_2fr]' : 'grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]'} items-center gap-3`}>
            <span className="text-xs font-medium text-slate-400">{mesLabel(r.mes, r.anio)}</span>
            <span className="text-sm text-slate-500 text-center">{r.hombres}</span>
            <span className="text-sm text-slate-500 text-center">{r.mujeres}</span>
            <span className="text-sm font-semibold text-slate-600 text-center">{tot}</span>
            <span className="text-xs text-center text-blue-600 font-medium">{pH}%</span>
            <span className="text-xs text-center text-pink-600 font-medium">{pM}%</span>
            {mostrarTipos && <span className="text-xs text-slate-400 italic">{r.tipos || '—'}</span>}
          </div>
        )
      })}

      {/* Fila mes actual */}
      <div className={`px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-b-xl ${mostrarTipos ? 'grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_2fr]' : 'grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]'} items-center gap-3 mt-1 mx-1 mb-1`}>
        <span className="text-xs font-semibold text-blue-600">
          {mesLabel(periodoMes, periodoAnio)}<br/>
          <span className="font-normal text-blue-400">actual</span>
        </span>
        <input type="number" min={0} value={hombres || ''} placeholder="0"
          onChange={e => upsCur({ hombres: parseInt(e.target.value) || 0 })}
          className={`${ic} text-center`} />
        <input type="number" min={0} value={mujeres || ''} placeholder="0"
          onChange={e => upsCur({ mujeres: parseInt(e.target.value) || 0 })}
          className={`${ic} text-center`} />
        <span className={`text-center text-sm font-bold rounded px-1 py-1 ${total > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}>
          {total || '—'}
        </span>
        <span className={`text-center text-xs font-bold rounded px-1 py-1 ${pctH > 0 ? 'bg-blue-100 text-blue-700' : 'text-slate-300'}`}>
          {pctH > 0 ? `${pctH}%` : '—'}
        </span>
        <span className={`text-center text-xs font-bold rounded px-1 py-1 ${pctM > 0 ? 'bg-pink-100 text-pink-700' : 'text-slate-300'}`}>
          {pctM > 0 ? `${pctM}%` : '—'}
        </span>
        {mostrarTipos && (
          <input type="text" value={tipos} placeholder="Ej: Proveedores, transporte..."
            onChange={e => upsCur({ tipos: e.target.value })}
            className={ic} />
        )}
      </div>
    </div>
  )
}
