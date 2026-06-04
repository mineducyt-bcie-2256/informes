'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import { FileText, Building2, User, Briefcase, Hash, Upload, X, ImageIcon, Plus, Trash2 } from 'lucide-react'
import { MESES } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────────
interface EscuelaData {
  nombre: string
  codigo: string
  empresa_supervision: string
  empresa_obras: string
  numero_contrato: string
  periodo_mes: number
  periodo_anio: number
}

interface Especialista {
  id: string
  nombre: string
  cargo: string | null
  rol: string
}

interface Colaborador {
  id:       string
  nombre:   string
  cargo:    string
  firma_url: string
}

const INIT = {
  numero_informe:              '' as string | number,
  nombre_proyecto:             '',
  numero_contrato_supervision: '',
  elaborado_por_id:            '',
  elaborado_por_nombre:        '',
  elaborado_por_cargo:         '',
  firma_url:                   '' as string,
  sello_url:                   '' as string,
  colaboradores:               [] as Colaborador[],
}

const inputCls  = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const autoCls   = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600 cursor-default'
const labelCls  = 'text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block'
const sectionHdr= 'text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100'

// ── Campo de solo lectura (auto) ──────────────────────────────────
function CampoAuto({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className={`${autoCls} flex items-center gap-2`}>
        {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
        <span className={value ? '' : 'text-slate-400 italic'}>{value || 'Sin datos'}</span>
        <span className="ml-auto text-xs text-blue-400 font-medium shrink-0">auto</span>
      </div>
    </div>
  )
}

// ── Uploader de imagen (firma o sello) ────────────────────────────
function ImageUploader({
  label, sublabel, value, onChange, shape = 'rect', informeId, slot,
}: {
  label: string
  sublabel: string
  value: string
  onChange: (url: string) => void
  shape?: 'rect' | 'circle'
  informeId: string
  slot: string   // 'firma' | 'sello'
}) {
  const supabase  = createClient()
  const inputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const ext  = file.name.split('.').pop()
    const path = `informes/${informeId}/${slot}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('firmas-sellos')
      .upload(path, file, { upsert: true })

    if (upErr) { setError(upErr.message); setUploading(false); return }

    const { data } = supabase.storage.from('firmas-sellos').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  function handleRemove() {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const isCircle = shape === 'circle'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Área de imagen / placeholder */}
      <div
        className={`relative border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden transition-colors hover:border-blue-300 ${
          isCircle ? 'rounded-full w-24 h-24' : 'rounded-xl w-full h-28'
        }`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className={`object-contain ${isCircle ? 'w-full h-full' : 'max-h-24 max-w-full p-2'}`}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors p-3"
          >
            {uploading
              ? <span className="text-xs text-blue-500 animate-pulse">Subiendo...</span>
              : <>
                  <ImageIcon size={isCircle ? 22 : 18} />
                  <span className="text-xs text-center leading-tight">Subir imagen</span>
                </>
            }
          </button>
        )}
      </div>

      {/* Botón cambiar si ya hay imagen */}
      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <Upload size={11} /> Cambiar
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Línea de firma (solo rect) */}
      {!isCircle && !value && (
        <div className="w-full border-b-2 border-slate-300" />
      )}

      {/* Nombre y etiqueta */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════════
export default function PortadaPage() {
  const { id } = useParams<{ id: string }>()
  const [form,           setForm]           = useState(INIT)
  const [escuela,        setEscuela]        = useState<EscuelaData | null>(null)
  const [especialistas,  setEspecialistas]  = useState<Especialista[]>([])
  const [autoNumero,     setAutoNumero]     = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // 1. Datos del informe + escuela
      const { data: inf } = await supabase
        .from('informes')
        .select('escuela_id, periodo_mes, periodo_anio')
        .eq('id', id).single()
      if (!inf) return

      const { data: esc } = await supabase
        .from('escuelas')
        .select('nombre, codigo, empresa_supervision, empresa_obras, numero_contrato')
        .eq('id', inf.escuela_id).single()

      if (esc) {
        setEscuela({
          nombre:              esc.nombre,
          codigo:              esc.codigo,
          empresa_supervision: esc.empresa_supervision ?? '',
          empresa_obras:       esc.empresa_obras       ?? '',
          numero_contrato:     esc.numero_contrato     ?? '',
          periodo_mes:         inf.periodo_mes,
          periodo_anio:        inf.periodo_anio,
        })
      }

      // 2. Lista de especialistas — solo los de la empresa supervisora del informe
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, nombre, cargo, rol')
        .in('rol', ['programador', 'administrador', 'usuario'])
        .eq('activo', true)
        .eq('empresa_supervision', esc?.empresa_supervision ?? '')
        .order('nombre')
      setEspecialistas(perfiles ?? [])

      // 3. Portada existente
      const { data: portada } = await supabase
        .from('informe_portada')
        .select('*')
        .eq('informe_id', id).single()

      if (portada) {
        setForm({
          numero_informe:              portada.numero_informe ?? '',
          nombre_proyecto:             portada.nombre_proyecto ?? '',
          numero_contrato_supervision: portada.numero_contrato_supervision ?? '',
          elaborado_por_id:            portada.elaborado_por_id ?? '',
          elaborado_por_nombre:        portada.elaborado_por_nombre ?? '',
          elaborado_por_cargo:         portada.elaborado_por_cargo ?? '',
          firma_url:                   portada.firma_url ?? '',
          sello_url:                   portada.sello_url ?? '',
          colaboradores:               portada.colaboradores ?? [],
        })
      } else {
        // 4. Número correlativo
        const { data: prevInformes } = await supabase
          .from('informes')
          .select('id')
          .eq('escuela_id', inf.escuela_id)
          .neq('id', id)
          .or(`periodo_anio.lt.${inf.periodo_anio},and(periodo_anio.eq.${inf.periodo_anio},periodo_mes.lt.${inf.periodo_mes})`)
          .order('periodo_anio', { ascending: false })
          .order('periodo_mes', { ascending: false })
          .limit(1).single()

        if (prevInformes?.id) {
          const { data: prevPortada } = await supabase
            .from('informe_portada')
            .select('numero_informe')
            .eq('informe_id', prevInformes.id).single()
          if (prevPortada?.numero_informe) {
            const siguiente = (prevPortada.numero_informe as number) + 1
            setAutoNumero(siguiente)
            setForm(p => ({ ...p, numero_informe: siguiente }))
          }
        }
      }
    }
    load()
  }, [id])

  function set<K extends keyof typeof INIT>(f: K, v: (typeof INIT)[K]) {
    setForm(p => ({ ...p, [f]: v }))
  }

  function seleccionarEspecialista(eid: string) {
    const esp = especialistas.find(e => e.id === eid)
    setForm(p => ({
      ...p,
      elaborado_por_id:      eid,
      elaborado_por_nombre:  esp?.nombre ?? '',
      elaborado_por_cargo:   esp?.cargo ?? '',
    }))
  }

  async function onSave() {
    const payload = {
      informe_id:                  id,
      numero_informe:              form.numero_informe ? parseInt(String(form.numero_informe)) : null,
      nombre_proyecto:             form.nombre_proyecto              || null,
      numero_contrato_supervision: form.numero_contrato_supervision  || null,
      elaborado_por_id:            form.elaborado_por_id             || null,
      elaborado_por_nombre:        form.elaborado_por_nombre         || null,
      elaborado_por_cargo:         form.elaborado_por_cargo          || null,
      firma_url:                   form.firma_url                    || null,
      sello_url:                   form.sello_url                    || null,
      colaboradores:               form.colaboradores.length > 0 ? form.colaboradores : null,
    }
    console.log('📤 Guardando portada con payload:', payload)
    const { error, data } = await supabase
      .from('informe_portada')
      .upsert(payload, { onConflict: 'informe_id' })
    console.log('✓ Respuesta del servidor:', { data, error })
    if (error) {
      console.error('❌ Error al guardar portada:', error)
      throw new Error(error.message)
    }
  }

  // ── Colaboradores ─────────────────────────────────────────────
  function agregarColaborador() {
    setForm(p => ({ ...p, colaboradores: [...p.colaboradores, { id: '', nombre: '', cargo: '', firma_url: '' }] }))
  }

  function quitarColaborador(idx: number) {
    setForm(p => ({ ...p, colaboradores: p.colaboradores.filter((_, i) => i !== idx) }))
  }

  function seleccionarColaborador(idx: number, eid: string) {
    const esp = especialistas.find(e => e.id === eid)
    setForm(p => {
      const cols = [...p.colaboradores]
      cols[idx] = { ...cols[idx], id: eid, nombre: esp?.nombre ?? '', cargo: esp?.cargo ?? '' }
      return { ...p, colaboradores: cols }
    })
  }

  function setCargoCola(idx: number, cargo: string) {
    setForm(p => {
      const cols = [...p.colaboradores]
      cols[idx] = { ...cols[idx], cargo }
      return { ...p, colaboradores: cols }
    })
  }

  function setFirmaColaborador(idx: number, url: string) {
    setForm(p => {
      const cols = [...p.colaboradores]
      cols[idx] = { ...cols[idx], firma_url: url }
      return { ...p, colaboradores: cols }
    })
  }

  const espSeleccionado = especialistas.find(e => e.id === form.elaborado_por_id)

  return (
    <FormWrapper title="Portada del Informe" short="PORTADA" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        {/* ── Encabezado tipo documento ──────────────────────── */}
        <div className="bg-blue-900 text-white rounded-xl px-8 py-7 text-center space-y-1 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
            {escuela ? `${MESES[escuela.periodo_mes - 1]} ${escuela.periodo_anio}` : '—'}
          </p>
          <h1 className="text-xl font-black uppercase tracking-wide leading-tight">
            Informe Mensual de Supervisión
          </h1>
          <h2 className="text-sm font-medium text-blue-200 leading-snug mt-1">
            Implementación de condiciones ambientales y sociales de la etapa de construcción
          </h2>
          <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
            Plan Específico de Gestión Ambiental y Social — PEGAS
          </h3>
          {form.numero_informe && (
            <div className="inline-flex items-center gap-2 mt-3 bg-white/10 border border-white/20 rounded-full px-4 py-1">
              <Hash size={13} className="text-blue-300" />
              <span className="text-sm font-bold text-white">Informe N.° {form.numero_informe}</span>
            </div>
          )}
        </div>

        {/* ── N.° de Informe ─────────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>
            <span className="flex items-center gap-2"><Hash size={14} /> Número de Informe</span>
          </h3>
          <div className="max-w-xs">
            <label className={labelCls}>
              N.° de informe
              {autoNumero && <span className="ml-2 text-xs text-blue-500 font-normal normal-case">(correlativo automático del anterior)</span>}
            </label>
            <input
              type="number" min={1}
              value={form.numero_informe}
              onChange={e => set('numero_informe', e.target.value)}
              placeholder="Ej: 1"
              className={inputCls}
            />
          </div>
        </section>

        {/* ── Proyecto ───────────────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>
            <span className="flex items-center gap-2"><FileText size={14} /> Datos del Proyecto</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Nombre del proyecto</label>
              <input value={form.nombre_proyecto}
                onChange={e => set('nombre_proyecto', e.target.value)}
                placeholder="Ingrese el nombre del proyecto..."
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>N.° de contrato de supervisión</label>
              <input value={form.numero_contrato_supervision}
                onChange={e => set('numero_contrato_supervision', e.target.value)}
                placeholder="Número de contrato..."
                className={inputCls} />
            </div>
          </div>
        </section>

        {/* ── Centro Educativo ───────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>
            <span className="flex items-center gap-2"><Building2 size={14} /> Centro Educativo</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <CampoAuto label="Centro educativo" value={escuela?.nombre ?? ''} icon={Building2} />
            </div>
            <div>
              <CampoAuto label="Código" value={escuela?.codigo ?? ''} />
            </div>
          </div>
        </section>

        {/* ── Presentado por ─────────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>
            <span className="flex items-center gap-2"><Building2 size={14} /> Presentado por</span>
          </h3>
          <CampoAuto label="Empresa de supervisión" value={escuela?.empresa_supervision ?? ''} icon={Building2} />
        </section>

        {/* ── Elaborado por ──────────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>
            <span className="flex items-center gap-2"><User size={14} /> Elaborado por</span>
          </h3>
          <div className="space-y-4">

            {/* ── Especialista principal ───────────────────────── */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Especialista</label>
                  <select
                    value={form.elaborado_por_id}
                    onChange={e => seleccionarEspecialista(e.target.value)}
                    className={inputCls}>
                    <option value="">Seleccionar especialista...</option>
                    {especialistas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    Cargo
                    {form.elaborado_por_id && <span className="ml-2 text-xs text-blue-500 font-normal normal-case">automático</span>}
                  </label>
                  <input
                    value={form.elaborado_por_cargo}
                    onChange={e => set('elaborado_por_cargo', e.target.value)}
                    placeholder="Se llena automáticamente al seleccionar especialista..."
                    className={form.elaborado_por_id ? autoCls : inputCls}
                    readOnly={!!form.elaborado_por_id && !!espSeleccionado?.cargo}
                  />
                </div>
              </div>
              {/* Firma principal */}
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 text-center">Firma</p>
                <div className="max-w-xs mx-auto">
                  <ImageUploader
                    label={espSeleccionado?.nombre ?? 'Especialista'}
                    sublabel={form.elaborado_por_cargo || 'Firma del especialista'}
                    value={form.firma_url}
                    onChange={v => set('firma_url', v)}
                    shape="rect"
                    informeId={id}
                    slot="firma"
                  />
                </div>
              </div>
            </div>

            {/* ── Especialistas adicionales ────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Especialista</span>
                <button
                  type="button"
                  onClick={agregarColaborador}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={13} /> Agregar
                </button>
              </div>

              {form.colaboradores.length === 0 && (
                <p className="text-xs text-slate-400 italic">Usa el botón Agregar para incluir otro especialista en la portada.</p>
              )}

              <div className="space-y-3">
                {form.colaboradores.map((col, idx) => {
                  const espCol = especialistas.find(e => e.id === col.id)
                  return (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative space-y-4">
                      <button
                        type="button"
                        onClick={() => quitarColaborador(idx)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Quitar"
                      >
                        <Trash2 size={14} />
                      </button>
                      {/* Especialista + Cargo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                        <div>
                          <label className={labelCls}>Especialista</label>
                          <select
                            value={col.id}
                            onChange={e => seleccionarColaborador(idx, e.target.value)}
                            className={inputCls}>
                            <option value="">Seleccionar especialista...</option>
                            {especialistas.map(e => (
                              <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>
                            Cargo
                            {col.id && <span className="ml-2 text-xs text-blue-500 font-normal normal-case">automático</span>}
                          </label>
                          <input
                            value={col.cargo}
                            onChange={e => setCargoCola(idx, e.target.value)}
                            placeholder="Cargo del especialista..."
                            className={col.id && espCol?.cargo ? autoCls : inputCls}
                            readOnly={!!col.id && !!espCol?.cargo}
                          />
                        </div>
                      </div>
                      {/* Firma */}
                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 text-center">Firma</p>
                        <div className="max-w-xs mx-auto">
                          <ImageUploader
                            label={col.nombre || 'Especialista'}
                            sublabel={col.cargo || 'Firma del especialista'}
                            value={col.firma_url}
                            onChange={url => setFirmaColaborador(idx, url)}
                            shape="rect"
                            informeId={id}
                            slot={`firma-cola-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Logo de la empresa */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5 text-center">
                Logo de la empresa
              </p>
              <div className="max-w-xs mx-auto">
                <ImageUploader
                  label={escuela?.empresa_supervision ?? 'Empresa de supervisión'}
                  sublabel="Logo de la empresa"
                  value={form.sello_url}
                  onChange={v => set('sello_url', v)}
                  shape="rect"
                  informeId={id}
                  slot="sello"
                />
              </div>
              <p className="text-xs text-slate-400 text-center mt-4">
                Formatos aceptados: PNG, JPG, WEBP · Fondo transparente recomendado
              </p>
            </div>
          </div>
        </section>

        {/* ── Empresa Contratista ────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>
            <span className="flex items-center gap-2"><Briefcase size={14} /> Empresa Contratista</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CampoAuto label="Empresa contratista" value={escuela?.empresa_obras ?? ''} icon={Building2} />
            <CampoAuto label="N.° de contrato" value={escuela?.numero_contrato ?? ''} />
          </div>
        </section>

      </div>
    </FormWrapper>
  )
}
