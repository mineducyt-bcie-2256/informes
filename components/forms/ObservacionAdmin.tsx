'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquareText, Save, CheckCircle, Loader2,
  Clock, CircleCheck, ShieldCheck, ChevronDown, ChevronUp,
} from 'lucide-react'

interface Props {
  informeId: string
  seccion:   string
}

type Estado = 'pendiente' | 'atendido' | 'aprobado'

const ESTADO_CONFIG: Record<Estado, { label: string; color: string; icon: any }> = {
  pendiente: { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700 border-amber-300',  icon: Clock        },
  atendido:  { label: 'Atendido',   color: 'bg-blue-100  text-blue-700  border-blue-300',   icon: CircleCheck  },
  aprobado:  { label: 'Aprobado',   color: 'bg-green-100 text-green-700 border-green-300',  icon: ShieldCheck  },
}

export default function ObservacionAdmin({ informeId, seccion }: Props) {
  const supabase = createClient()

  const [rol,        setRol]        = useState<string | null>(null)
  const [rowId,      setRowId]      = useState<string | null>(null)

  // Campos de la observación
  const [observacion, setObservacion] = useState('')
  const [respuesta,   setRespuesta]   = useState('')
  const [estado,      setEstado]      = useState<Estado>('pendiente')

  // Snapshots para detectar cambios
  const [origObs,  setOrigObs]  = useState('')
  const [origResp, setOrigResp] = useState('')

  const [loading,    setLoading]    = useState(true)
  const [savingObs,  setSavingObs]  = useState(false)
  const [savingResp, setSavingResp] = useState(false)
  const [savingEst,  setSavingEst]  = useState(false)
  const [savedObs,   setSavedObs]   = useState(false)
  const [savedResp,  setSavedResp]  = useState(false)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [expanded,   setExpanded]   = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase
          .from('profiles').select('rol').eq('id', user.id).single()
        setRol(perfil?.rol ?? 'usuario')
      }
      // Solo mostrar si el informe fue enviado o aprobado (no en borrador)
      const { data: inf } = await supabase
        .from('informes').select('estado').eq('id', informeId).single()
      if (inf?.estado === 'borrador') {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('informe_observaciones')
        .select('id, observacion, respuesta, estado')
        .eq('informe_id', informeId)
        .eq('seccion', seccion)
        .single()

      if (data) {
        setRowId(data.id)
        setObservacion(data.observacion ?? '')
        setRespuesta(data.respuesta   ?? '')
        setEstado((data.estado as Estado) ?? 'pendiente')
        setOrigObs(data.observacion   ?? '')
        setOrigResp(data.respuesta    ?? '')
      }
      setLoading(false)
    }
    init()
  }, [informeId, seccion])

  const esEditor   = rol === 'administrador' || rol === 'programador'
  const esUsuario  = rol === 'usuario'
  const tieneObs   = observacion.trim().length > 0
  const hayCambObs  = observacion !== origObs
  const hayCambResp = respuesta   !== origResp

  // No mostrar nada si no hay observación y el usuario no es admin/programador
  if (loading) return null
  if (!esEditor && !tieneObs) return null

  async function upsert(fields: Record<string, any>) {
    if (rowId) {
      return supabase.from('informe_observaciones')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', rowId)
    }
    const { data, error } = await supabase.from('informe_observaciones')
      .upsert(
        { informe_id: informeId, seccion, ...fields, updated_at: new Date().toISOString() },
        { onConflict: 'informe_id,seccion' }
      )
      .select('id').single()
    if (data) setRowId(data.id)
    return { error }
  }

  async function guardarObservacion() {
    setSavingObs(true); setErrorMsg('')
    const { error } = await upsert({ observacion, estado: 'pendiente' })
    if (error) { setErrorMsg(error.message) }
    else { setOrigObs(observacion); setEstado('pendiente'); setSavedObs(true); setTimeout(() => setSavedObs(false), 3000) }
    setSavingObs(false)
  }

  async function guardarRespuesta() {
    setSavingResp(true); setErrorMsg('')
    const { error } = await upsert({ respuesta })
    if (error) { setErrorMsg(error.message) }
    else { setOrigResp(respuesta); setSavedResp(true); setTimeout(() => setSavedResp(false), 3000) }
    setSavingResp(false)
  }

  async function marcarAtendido() {
    setSavingEst(true); setErrorMsg('')
    const { error } = await upsert({ estado: 'atendido', respuesta })
    if (error) { setErrorMsg(error.message) }
    else { setEstado('atendido'); setOrigResp(respuesta) }
    setSavingEst(false)
  }

  async function marcarAprobado() {
    setSavingEst(true); setErrorMsg('')
    const { error } = await upsert({ estado: 'aprobado' })
    if (error) { setErrorMsg(error.message) }
    else { setEstado('aprobado') }
    setSavingEst(false)
  }

  async function reabrirObservacion() {
    setSavingEst(true); setErrorMsg('')
    const { error } = await upsert({ estado: 'pendiente' })
    if (error) { setErrorMsg(error.message) }
    else { setEstado('pendiente') }
    setSavingEst(false)
  }

  const cfg = ESTADO_CONFIG[estado]
  const EstIcon = cfg.icon

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={`mt-6 rounded-xl border-2 overflow-hidden ${
      estado === 'aprobado' ? 'border-green-300' :
      estado === 'atendido' ? 'border-blue-300'  :
      tieneObs              ? 'border-amber-300'  :
                              'border-slate-200'
    }`}>

      {/* ── Cabecera ── */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${
          estado === 'aprobado' ? 'bg-green-50' :
          estado === 'atendido' ? 'bg-blue-50'  :
          tieneObs              ? 'bg-amber-50'  :
                                  'bg-slate-50'
        }`}
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-2">
          <MessageSquareText size={15} className={
            estado === 'aprobado' ? 'text-green-600' :
            estado === 'atendido' ? 'text-blue-600'  :
            tieneObs              ? 'text-amber-600'  :
                                    'text-slate-400'
          } />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Observaciones del Administrador
          </span>
          {/* Badge estado */}
          {tieneObs && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
              <EstIcon size={11} />
              {cfg.label}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </div>

      {/* ── Contenido expandible ── */}
      {expanded && (
        <div className="p-4 space-y-4">

          {/* ── BLOQUE OBSERVACIÓN (admin/programador) ── */}
          {esEditor && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                Observación general del módulo
              </label>
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                rows={3}
                placeholder="Escribe observaciones sobre este módulo..."
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-amber-600">
                  {hayCambObs ? 'Cambios sin guardar' : ''}
                </span>
                <div className="flex items-center gap-2">
                  {savedObs && (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle size={12} /> Guardado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={guardarObservacion}
                    disabled={savingObs || !hayCambObs}
                    className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
                  >
                    {savingObs
                      ? <><Loader2 size={11} className="animate-spin" /> Guardando...</>
                      : <><Save size={11} /> Guardar observación</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── OBSERVACIÓN visible para el usuario (solo lectura) ── */}
          {esUsuario && tieneObs && (
            <div className={`rounded-lg px-4 py-3 border ${
              estado === 'aprobado' ? 'bg-green-50 border-green-200' :
              estado === 'atendido' ? 'bg-blue-50  border-blue-200'  :
                                      'bg-amber-50 border-amber-200'
            }`}>
              <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Observación</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{observacion}</p>
            </div>
          )}

          {/* ── Separador ── */}
          {tieneObs && <hr className="border-slate-100" />}

          {/* ── BLOQUE RESPUESTA DEL USUARIO ── */}
          {tieneObs && estado !== 'aprobado' && (
            <div>
              {/* El usuario puede escribir su respuesta */}
              {esUsuario && (
                <>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                    Tu respuesta / acción tomada
                  </label>
                  <textarea
                    value={respuesta}
                    onChange={e => setRespuesta(e.target.value)}
                    rows={2}
                    placeholder="Describe qué acciones tomaste para subsanar esta observación..."
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      {estado === 'atendido' ? '✓ Marcado como atendido' : 'Sin atender aún'}
                    </span>
                    <div className="flex items-center gap-2">
                      {savedResp && (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle size={12} /> Guardado
                        </span>
                      )}
                      {hayCambResp && estado === 'atendido' && (
                        <button
                          type="button"
                          onClick={guardarRespuesta}
                          disabled={savingResp}
                          className="flex items-center gap-1.5 bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                        >
                          {savingResp
                            ? <><Loader2 size={11} className="animate-spin" /> Guardando...</>
                            : <><Save size={11} /> Guardar respuesta</>
                          }
                        </button>
                      )}
                      {estado !== 'atendido' && (
                        <button
                          type="button"
                          onClick={marcarAtendido}
                          disabled={savingEst}
                          className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {savingEst
                            ? <><Loader2 size={11} className="animate-spin" /> Procesando...</>
                            : <><CircleCheck size={13} /> Marcar como Atendido</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* El admin ve la respuesta del usuario */}
              {esEditor && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Respuesta del usuario
                  </p>
                  {respuesta ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
                      {respuesta}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin respuesta aún.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Botón APROBAR (admin, cuando está atendido) ── */}
          {esEditor && estado === 'atendido' && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-blue-600 font-medium">
                El usuario marcó esta observación como atendida.
              </p>
              <button
                type="button"
                onClick={marcarAprobado}
                disabled={savingEst}
                className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {savingEst
                  ? <><Loader2 size={11} className="animate-spin" /> Procesando...</>
                  : <><ShieldCheck size={13} /> Aprobar</>
                }
              </button>
            </div>
          )}

          {/* ── Estado APROBADO ── */}
          {tieneObs && estado === 'aprobado' && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-green-700">
                <ShieldCheck size={16} />
                <span className="text-sm font-semibold">Observación aprobada por el administrador</span>
              </div>
              {esEditor && (
                <button
                  type="button"
                  onClick={reabrirObservacion}
                  disabled={savingEst}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Reabrir
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
