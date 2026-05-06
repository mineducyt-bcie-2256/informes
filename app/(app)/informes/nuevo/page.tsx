'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'
import { UserPlus, Trash2, Star } from 'lucide-react'

interface Elaborador {
  id:               string   // profile id
  nombre:           string
  cargo:            string
  aparece_portada:  boolean
}

export default function NuevoInformePage() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const supabase      = createClient()

  const [supervisiones,    setSupervisiones]    = useState<string[]>([])
  const [supervision,      setSupervision]      = useState('')
  const [escuelas,         setEscuelas]         = useState<any[]>([])
  const [escuelaId,        setEscuelaId]        = useState(searchParams.get('escuela_id') ?? '')
  const [mes,              setMes]              = useState(searchParams.get('mes') ?? String(new Date().getMonth() + 1))
  const [anio,             setAnio]             = useState(searchParams.get('anio') ?? String(new Date().getFullYear()))
  const [perfiles,         setPerfiles]         = useState<any[]>([])
  const [elaboradores,     setElaboradores]     = useState<Elaborador[]>([])
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [miEmpresa,        setMiEmpresa]        = useState<string | null>(null) // empresa fija del usuario

  const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  // ── Cargar perfil del usuario logueado ───────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('rol, empresa_supervision')
        .eq('id', user.id).single()
        .then(({ data: p }) => {
          if (p?.rol === 'usuario' && p?.empresa_supervision) {
            setMiEmpresa(p.empresa_supervision)
            setSupervision(p.empresa_supervision)
          }
        })
    })
  }, [])

  // ── Cargar empresas de supervisión (solo Construcción + con contrato) ──
  useEffect(() => {
    supabase
      .from('escuelas')
      .select('empresa_supervision')
      .eq('activa', true)
      .eq('etapa', 'Construcción')
      .neq('numero_contrato', 'SIN ADJUDICAR')
      .not('numero_contrato', 'is', null)
      .order('empresa_supervision')
      .then(({ data }) => {
        const unicas = [...new Set(data?.map(e => e.empresa_supervision).filter(Boolean))] as string[]
        setSupervisiones(unicas)
      })
  }, [])

  // ── Cargar CEs según supervisión seleccionada ─────────────────────────
  useEffect(() => {
    if (!supervision) { setEscuelas([]); setEscuelaId(''); return }
    supabase
      .from('escuelas')
      .select('id, nombre, codigo, grupos(numero)')
      .eq('activa', true)
      .eq('etapa', 'Construcción')
      .eq('empresa_supervision', supervision)
      .neq('numero_contrato', 'SIN ADJUDICAR')
      .not('numero_contrato', 'is', null)
      .order('nombre')
      .then(({ data }) => {
        setEscuelas(data ?? [])
        setEscuelaId('')
      })
  }, [supervision])

  // ── Cargar perfiles filtrados por empresa de supervisión seleccionada ──
  useEffect(() => {
    if (!supervision) { setPerfiles([]); return }
    supabase
      .from('profiles')
      .select('id, nombre, cargo')
      .eq('activo', true)
      .eq('empresa_supervision', supervision)
      .order('nombre')
      .then(({ data }) => setPerfiles(data ?? []))
  }, [supervision])

  // ── Agregar elaborador ────────────────────────────────────────────────
  function agregarElaborador() {
    setElaboradores(p => [...p, { id: '', nombre: '', cargo: '', aparece_portada: true }])
  }

  function actualizarElaborador(idx: number, changes: Partial<Elaborador>) {
    setElaboradores(p => p.map((e, i) => i === idx ? { ...e, ...changes } : e))
  }

  function seleccionarPerfil(idx: number, perfilId: string) {
    const perfil = perfiles.find(p => p.id === perfilId)
    if (perfil) {
      actualizarElaborador(idx, {
        id:    perfil.id,
        nombre: perfil.nombre,
        cargo:  perfil.cargo ?? '',
      })
    } else {
      actualizarElaborador(idx, { id: '', nombre: '', cargo: '' })
    }
  }

  function eliminarElaborador(idx: number) {
    setElaboradores(p => p.filter((_, i) => i !== idx))
  }

  // ── Crear informe ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supervision) { setError('Selecciona una empresa de supervisión.'); return }
    if (!escuelaId)   { setError('Selecciona un centro educativo.'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase.from('informes').insert({
      escuela_id:   parseInt(escuelaId),
      periodo_mes:  parseInt(mes),
      periodo_anio: parseInt(anio),
      creado_por:   user?.id,
      estado:       'borrador',
      elaboradores: elaboradores.filter(e => e.id), // solo los que tienen perfil seleccionado
    }).select().single()

    if (err) {
      setError(err.code === '23505'
        ? 'Ya existe un informe para esta escuela en ese periodo.'
        : err.message)
      setLoading(false)
    } else {
      router.push(`/informes/${data.id}`)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Nuevo informe</h1>
      <p className="text-slate-500 text-sm mb-6">Selecciona la escuela y el periodo mensual</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Empresa de Supervisión ────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa de Supervisión</label>
            {miEmpresa ? (
              // Usuario restringido: empresa fija, no editable
              <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="font-medium">{miEmpresa}</span>
              </div>
            ) : (
              <select value={supervision} onChange={e => setSupervision(e.target.value)} required className={inp}>
                <option value="">Seleccionar empresa...</option>
                {supervisiones.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {/* ── Centro Educativo (solo si hay supervisión) ───── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Centro Educativo</label>
            <select
              value={escuelaId}
              onChange={e => setEscuelaId(e.target.value)}
              required
              disabled={!supervision}
              className={`${inp} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
            >
              <option value="">
                {supervision ? 'Seleccionar centro educativo...' : 'Selecciona primero una empresa'}
              </option>
              {escuelas.map((esc: any) => (
                <option key={esc.id} value={esc.id}>
                  [{esc.grupos?.numero ? `G${esc.grupos.numero}` : '?'}] {esc.nombre}
                </option>
              ))}
            </select>
            {supervision && escuelas.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">No hay centros educativos en construcción para esta empresa.</p>
            )}
          </div>

          {/* ── Periodo ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
              <select value={mes} onChange={e => setMes(e.target.value)} className={inp}>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
              <input type="number" value={anio} onChange={e => setAnio(e.target.value)}
                min={2024} max={2030} className={inp} />
            </div>
          </div>

          {/* ── Elaborado por ────────────────────────────────── */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Elaborado por</p>
              <button
                type="button"
                onClick={agregarElaborador}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus size={13} /> Agregar especialista
              </button>
            </div>

            {elaboradores.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-3 border-2 border-dashed border-slate-200 rounded-xl">
                Haz clic en "Agregar especialista" para incluir elaboradores del informe
              </p>
            )}

            <div className="space-y-3">
              {elaboradores.map((elab, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Header tarjeta */}
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Especialista {idx + 1}</span>
                    <button type="button" onClick={() => eliminarElaborador(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Selector de perfil */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Seleccionar usuario del sistema</label>
                      <select
                        value={elab.id}
                        onChange={e => seleccionarPerfil(idx, e.target.value)}
                        className={inp}
                      >
                        <option value="">Seleccionar...</option>
                        {perfiles.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}{p.cargo ? ` — ${p.cargo}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cargo (editable, auto-llenado desde perfil) */}
                    {elab.id && (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Cargo</label>
                        <input
                          value={elab.cargo}
                          onChange={e => actualizarElaborador(idx, { cargo: e.target.value })}
                          placeholder="Cargo del especialista"
                          className={inp}
                        />
                      </div>
                    )}

                    {/* Checkbox aparecer en portada */}
                    {elab.id && (
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => actualizarElaborador(idx, { aparece_portada: !elab.aparece_portada })}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            elab.aparece_portada
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-slate-300 group-hover:border-blue-400'
                          }`}
                        >
                          {elab.aparece_portada && (
                            <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current">
                              <path d="M1 6l3.5 3.5L11 2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className="text-sm text-slate-700 font-medium flex items-center gap-1">
                            <Star size={11} className="text-amber-400" />
                            Aparecer en portada
                          </span>
                          <span className="text-xs text-slate-400">
                            {elab.aparece_portada
                              ? 'Aparecerá como elaborador en la portada del informe'
                              : 'No aparecerá en la portada'}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear informe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
