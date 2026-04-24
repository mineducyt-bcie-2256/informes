'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import RegistroFotografico, { type Foto } from '@/components/forms/RegistroFotografico'
import { Plus, Trash2, CheckCircle, XCircle, Pencil } from 'lucide-react'

// ── Opciones ────────────────────────────────────────────────
const TIPOS_SANITARIO = ['Portátiles', 'Fijos', 'Taza de inodoro', 'Letrina', 'Mixto']

const PROCEDENCIAS_AGUA = ['Agua potable (ANDA)', 'Pozo', 'Abastecimiento externo (pipas)', 'Cuerpos de agua', 'Otros']

const CATEGORIAS_ACTIVIDAD: Record<string, string> = {
  a: 'Actividades de uso de agua en procesos constructivos',
  b: 'Actividades de limpieza y mantenimiento',
  c: 'Actividades domésticas',
  d: 'Actividades auxiliares o complementarias',
  e: 'Otros',
}

const SUB_ACTIVIDADES: Record<string, string[]> = {
  a: ['Preparación de mezclas', 'Curado de concreto', 'Compactación de suelos', 'Lavado de equipos y herramientas', 'Control de polvos', 'Otros'],
  b: ['Limpieza de áreas de trabajo', 'Lavado de vehículos y maquinaria', 'Limpieza de superficies (pisos, estructuras)', 'Pruebas hidráulicas (Tuberías, Tanques)', 'Desinfección de instalaciones provisionales', 'Otros'],
  c: ['Uso de servicios sanitarios (Inodoros, Lavamanos)', 'Duchas (si hay campamento)', 'Cocinas o comedores', 'Lavado de utensilios', 'Lavado de ropa (en campamentos)', 'Otros'],
  d: ['Almacenamiento y manejo de agua potable', 'Riego de áreas verdes provisionales', 'Preparación de soluciones químicas (Aditivos de construcción, Productos de limpieza)'],
  e: [],
}

// ── Infraestructura aguas residuales ─────────────────────────
const INFRAESTRUCTURA_OBRAS: Record<string, string[]> = {
  'Sistema de recolección sanitaria': ['Tuberías PVC sanitario', 'Conexiones internas (inodoros, lavamanos, duchas)', 'Cajas de inspección', 'Pozos de visita'],
  'Unidades sanitarias': ['Inodoros', 'Lavamanos', 'Orinales', 'Duchas (si aplica)', 'Accesorios hidráulicos'],
  'Sistema de tratamiento primario (fosa séptica)': ['Cámara de sedimentación', 'Cámara de digestión', 'Tuberías de entrada/salida', 'Tapaderas herméticas'],
  'Sistema de tratamiento secundario': ['Filtro anaerobio', 'Biofiltro o humedal artificial (según diseño)'],
  'Sistema de disposición final': ['Pozo de absorción', 'Campo de infiltración', 'Drenajes subsuperficiales'],
  'Sistema de aguas residuales de cocina': ['Trampa de grasas', 'Tuberías de conexión'],
  'Sistema de ventilación sanitaria': ['Tuberías de ventilación', 'Salidas en techo'],
  'Infraestructura de inspección y mantenimiento': ['Cajas de registro', 'Tapaderas', 'Accesos a fosa séptica', 'Área de extracción de lodos'],
  'Sistema de abastecimiento de agua asociado': ['Tanques de almacenamiento', 'Tuberías de agua potable', 'Lavamanos'],
}
const INTERVENCIONES = ['Mejoramiento', 'Construcción nueva', 'Sin intervenir']

const OBRA_VACIA = {
  id: '', infraestructura: '', obras_incluidas: [] as string[],
  intervencion: '', porcentaje_avance: 0, descripcion: '',
}

// ── Tipos ────────────────────────────────────────────────────
const UNIDAD_VACIA = { id: '', tipo: '', hombres: 0, mujeres: 0, total: 0 }

const USO_VACIO = {
  id: '',
  procedencia: '', procedencia_otro: '',
  actividad_cat: '', actividad_especifica: '', actividad_especifica_otro: '', actividad_otro_texto: '',
  volumen_litros: 0,
  impacto_potencial: '', medida_prevencion: '', medios_verificacion: '',
}

const INCIDENTE_VACIO = () => ({
  id: crypto.randomUUID(),
  tipo: '', ubicacion: '', fecha_hora: '', descripcion: '', medidas_correctivas: '',
})

const INIT = {
  descripcion_condicion: '',
  unidades_sanitarias: [] as typeof UNIDAD_VACIA[],
  usos_agua: [] as typeof USO_VACIO[],
  obras_infraestructura: [] as typeof OBRA_VACIA[],
  tiene_incidentes: '',
  incidentes: [] as ReturnType<typeof INCIDENTE_VACIO>[],
  fotos: [] as Foto[],
}

// ── Componente ────────────────────────────────────────────────
export default function GaroPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState(INIT)
  const [personalHsso, setPersonalHsso] = useState<{ hombres: number; mujeres: number; total: number } | null>(null)
  const [autoLoaded, setAutoLoaded] = useState(false)

  // Unidades sanitarias
  const [mostrarFormUS, setMostrarFormUS] = useState(false)
  const [formUS, setFormUS] = useState({ ...UNIDAD_VACIA })
  const [editUS, setEditUS] = useState<number | null>(null)
  const [confirmDeleteUS, setConfirmDeleteUS] = useState<number | null>(null)

  // Usos de agua
  const [mostrarFormUA, setMostrarFormUA] = useState(false)
  const [formUA, setFormUA] = useState({ ...USO_VACIO })
  const [editUA, setEditUA] = useState<number | null>(null)
  const [confirmDeleteUA, setConfirmDeleteUA] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      await fetch('/api/migrate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'informe_garo' }),
      })
      // 1. Cargar datos actuales del informe
      const { data: garoData } = await supabase
        .from('informe_garo').select('*').eq('informe_id', id).single()

      if (garoData) {
        setData({
          ...INIT, ...garoData,
          unidades_sanitarias: garoData.unidades_sanitarias ?? [],
          usos_agua: garoData.usos_agua ?? [],
          obras_infraestructura: garoData.obras_infraestructura ?? [],
        })
      } else {
        // 2. Sin datos en el mes actual → buscar en el informe anterior de la misma escuela
        const { data: infoActual } = await supabase
          .from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()

        if (infoActual) {
          const { data: prevInforme } = await supabase
            .from('informes').select('id')
            .eq('escuela_id', infoActual.escuela_id)
            .neq('id', id)
            .or(`periodo_anio.lt.${infoActual.periodo_anio},and(periodo_anio.eq.${infoActual.periodo_anio},periodo_mes.lt.${infoActual.periodo_mes})`)
            .order('periodo_anio', { ascending: false })
            .order('periodo_mes', { ascending: false })
            .limit(1).single()

          if (prevInforme) {
            const { data: prevGaro } = await supabase
              .from('informe_garo')
              .select('unidades_sanitarias, usos_agua, obras_infraestructura')
              .eq('informe_id', prevInforme.id).single()

            if (prevGaro) {
              setData(prev => ({
                ...prev,
                unidades_sanitarias: prevGaro.unidades_sanitarias ?? [],
                usos_agua: prevGaro.usos_agua ?? [],
                obras_infraestructura: prevGaro.obras_infraestructura ?? [],
              }))
              setAutoLoaded(true)
            }
          }
        }
      }

      // 3. Cargar personal desde HSSO
      const { data: hsso } = await supabase
        .from('informe_hsso').select('personal_hombres, personal_mujeres, personal_total').eq('informe_id', id).single()
      if (hsso) setPersonalHsso({ hombres: hsso.personal_hombres ?? 0, mujeres: hsso.personal_mujeres ?? 0, total: hsso.personal_total ?? 0 })
    }

    load()
  }, [id])

  function set(field: string, value: any) { setData(prev => ({ ...prev, [field]: value })) }

  // ── Unidades sanitarias helpers ──────────────────────────
  function setFUS(field: string, value: any) {
    setFormUS(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'hombres' || field === 'mujeres') {
        const h = field === 'hombres' ? (parseInt(value) || 0) : (parseInt(String(prev.hombres)) || 0)
        const m = field === 'mujeres' ? (parseInt(value) || 0) : (parseInt(String(prev.mujeres)) || 0)
        next.total = h + m
      }
      return next
    })
  }
  function registrarUS() {
    const nueva = { ...formUS, id: editUS !== null ? formUS.id : String(Date.now()) }
    if (editUS !== null) {
      set('unidades_sanitarias', data.unidades_sanitarias.map((u, i) => i === editUS ? nueva : u))
      setEditUS(null)
    } else {
      set('unidades_sanitarias', [...data.unidades_sanitarias, nueva])
    }
    setFormUS({ ...UNIDAD_VACIA }); setMostrarFormUS(false)
  }

  // ── Usos de agua helpers ──────────────────────────────────
  function setFUA(field: string, value: any) {
    setFormUA(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'actividad_cat') {
        next.actividad_especifica = ''
        next.actividad_especifica_otro = ''
        next.actividad_otro_texto = ''
      }
      return next
    })
  }
  function registrarUA() {
    const nuevo = { ...formUA, id: editUA !== null ? formUA.id : String(Date.now()) }
    if (editUA !== null) {
      set('usos_agua', data.usos_agua.map((u, i) => i === editUA ? nuevo : u))
      setEditUA(null)
    } else {
      set('usos_agua', [...data.usos_agua, nuevo])
    }
    setFormUA({ ...USO_VACIO }); setMostrarFormUA(false)
  }

  // ── Obras de infraestructura ─────────────────────────────
  const [mostrarFormOI, setMostrarFormOI] = useState(false)
  const [formOI, setFormOI] = useState({ ...OBRA_VACIA })
  const [editOI, setEditOI] = useState<number | null>(null)
  const [confirmDeleteOI, setConfirmDeleteOI] = useState<number | null>(null)

  function setFOI(field: string, value: any) {
    setFormOI(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'infraestructura') next.obras_incluidas = []
      return next
    })
  }
  function toggleObra(obra: string) {
    setFormOI(prev => ({
      ...prev,
      obras_incluidas: prev.obras_incluidas.includes(obra)
        ? prev.obras_incluidas.filter(o => o !== obra)
        : [...prev.obras_incluidas, obra],
    }))
  }
  function registrarOI() {
    const nueva = { ...formOI, id: editOI !== null ? formOI.id : String(Date.now()) }
    if (editOI !== null) {
      set('obras_infraestructura', data.obras_infraestructura.map((o, i) => i === editOI ? nueva : o))
      setEditOI(null)
    } else {
      set('obras_infraestructura', [...data.obras_infraestructura, nueva])
    }
    setFormOI({ ...OBRA_VACIA }); setMostrarFormOI(false)
  }

  // ── Cumplimiento sanitarios ──────────────────────────────
  const totalSanitariosH = data.unidades_sanitarias.reduce((s, u) => s + (u.hombres || 0), 0)
  const totalSanitariosM = data.unidades_sanitarias.reduce((s, u) => s + (u.mujeres || 0), 0)
  const requeridosH = personalHsso ? Math.ceil(personalHsso.hombres / 20) : 0
  const requeridosM = personalHsso ? Math.ceil(personalHsso.mujeres / 20) : 0
  const cumpleH = totalSanitariosH >= requeridosH
  const cumpleM = totalSanitariosM >= requeridosM
  const cumpleTotal = cumpleH && cumpleM

  async function onSave() {
    const { error } = await supabase.from('informe_garo').upsert({ ...data, informe_id: id }, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const taCls = `${inputCls} resize-none`

  const subOpts = SUB_ACTIVIDADES[formUA.actividad_cat] ?? []
  const mostrarSubEspecifica = formUA.actividad_cat && formUA.actividad_cat !== 'e' && subOpts.length > 0

  return (
    <FormWrapper title="Condición 2 - Gestión de Aguas Residuales Ordinarias" short="GARO" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        {/* Banner: datos auto-cargados del mes anterior */}
        {autoLoaded && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg leading-none mt-0.5">↺</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Datos cargados del informe anterior</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Las unidades sanitarias, usos de agua y obras de infraestructura se copiaron automáticamente del mes anterior.
                Puede actualizar los avances y descripciones sin afectar los informes ya aprobados.
              </p>
            </div>
          </div>
        )}

        <DescripcionCondicion informeId={id} tabla="informe_garo" value={data.descripcion_condicion} onChange={v => set('descripcion_condicion', v)} />

        {/* ── Personal en obra ── */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Personal en obra</h3>
          {personalHsso ? (
            <div className="flex items-center gap-6 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
              {[{ label: 'Hombres', value: personalHsso.hombres }, { label: 'Mujeres', value: personalHsso.mujeres }, { label: 'Total', value: personalHsso.total }]
                .map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              <p className="text-xs text-slate-400 ml-auto italic">Datos tomados de la Condición 1 - HSSO</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
              <p className="text-sm text-amber-700">El personal se obtiene de la Condición 1 (HSSO). Asegúrese de completar primero ese formulario.</p>
            </div>
          )}
        </section>

        {/* ── Unidades Sanitarias ── */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Unidades sanitarias instaladas en el proyecto</h3>

          {personalHsso && data.unidades_sanitarias.length > 0 && (
            <div className={`flex flex-wrap items-center gap-4 rounded-xl border px-5 py-3 mb-4 ${cumpleTotal ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {cumpleTotal ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-500" />}
                <span className={`text-sm font-semibold ${cumpleTotal ? 'text-green-700' : 'text-red-700'}`}>
                  {cumpleTotal ? 'Cumple con el criterio' : 'No cumple con el criterio'}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300 hidden md:block" />
              <div className="flex gap-6 text-sm">
                {[{ label: 'Hombres', cumple: cumpleH, instaladas: totalSanitariosH, requeridas: requeridosH },
                  { label: 'Mujeres', cumple: cumpleM, instaladas: totalSanitariosM, requeridas: requeridosM }].map(({ label, cumple, instaladas, requeridas }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {cumple ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}
                    <span className={cumple ? 'text-green-700' : 'text-red-600'}>{label}: {instaladas} instaladas / {requeridas} requeridas</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 ml-auto hidden md:block">Regla: 1 unidad por cada 20 personas</p>
            </div>
          )}

          <div className="space-y-3">
            {data.unidades_sanitarias.map((u, i) => (
              <div key={u.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                    <span className="text-sm font-semibold text-slate-700">{u.tipo || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setFormUS({ ...u }); setEditUS(i); setMostrarFormUS(true) }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"><Pencil size={12} /> Editar</button>
                    <button type="button" onClick={() => setConfirmDeleteUS(i)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"><Trash2 size={12} /> Eliminar</button>
                  </div>
                </div>
                <div className="px-4 py-3 flex gap-6 text-sm">
                  <span><span className="text-xs text-slate-400 mr-1">Hombres:</span><span className="font-medium">{u.hombres}</span></span>
                  <span><span className="text-xs text-slate-400 mr-1">Mujeres:</span><span className="font-medium">{u.mujeres}</span></span>
                  <span><span className="text-xs text-slate-400 mr-1">Total:</span><span className="font-semibold text-blue-700">{u.total}</span></span>
                </div>
                {confirmDeleteUS === i && (
                  <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-red-700">¿Eliminar esta unidad sanitaria?</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDeleteUS(null)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                      <button type="button" onClick={() => { set('unidades_sanitarias', data.unidades_sanitarias.filter((_, idx) => idx !== i)); setConfirmDeleteUS(null) }}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Sí, eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {mostrarFormUS && (
            <div className="border-2 border-blue-200 rounded-xl bg-blue-50 p-5 space-y-4 mt-3">
              <p className="text-sm font-semibold text-slate-700">{editUS !== null ? `Editando unidad #${editUS + 1}` : 'Nueva unidad sanitaria'}</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
                  <select value={formUS.tipo} onChange={e => setFUS('tipo', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_SANITARIO.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Hombres</label>
                  <input type="number" value={formUS.hombres} onChange={e => setFUS('hombres', e.target.value)} onBlur={e => setFUS('hombres', parseInt(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Mujeres</label>
                  <input type="number" value={formUS.mujeres} onChange={e => setFUS('mujeres', e.target.value)} onBlur={e => setFUS('mujeres', parseInt(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Total</label>
                  <div className="relative">
                    <input type="number" value={formUS.total} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-500 cursor-default" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">auto</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setMostrarFormUS(false); setFormUS({ ...UNIDAD_VACIA }); setEditUS(null) }} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="button" onClick={registrarUS} disabled={!formUS.tipo} className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50">{editUS !== null ? 'Guardar cambios' : 'Registrar'}</button>
              </div>
            </div>
          )}

          {!mostrarFormUS && (
            <button type="button" onClick={() => { setFormUS({ ...UNIDAD_VACIA }); setEditUS(null); setMostrarFormUS(true) }}
              className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all mt-3">
              <Plus size={15} /> Agregar unidad sanitaria
            </button>
          )}
        </section>

        {/* ── Manejo de aguas residuales ── */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
            Manejo de aguas residuales en las actividades del proyecto
          </h3>

          {/* Registros existentes */}
          <div className="space-y-3">
            {data.usos_agua.map((u, i) => (
              <div key={u.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{u.procedencia === 'Otros' ? u.procedencia_otro : u.procedencia}</span>
                    <span className="text-xs text-slate-500">{CATEGORIAS_ACTIVIDAD[u.actividad_cat] ?? ''}</span>
                    {u.actividad_especifica && <span className="text-xs text-slate-400">— {u.actividad_especifica === 'Otros' ? u.actividad_especifica_otro : u.actividad_especifica}</span>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => { setFormUA({ ...u }); setEditUA(i); setMostrarFormUA(true) }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"><Pencil size={12} /> Editar</button>
                    <button type="button" onClick={() => setConfirmDeleteUA(i)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"><Trash2 size={12} /> Eliminar</button>
                  </div>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  {u.volumen_litros > 0 && <p><span className="text-xs text-slate-400 mr-1">Volumen:</span><span className="font-medium">{u.volumen_litros} L</span></p>}
                  {u.impacto_potencial && <p><span className="text-xs text-slate-400 mr-1">Impacto:</span><span className="text-slate-700">{u.impacto_potencial}</span></p>}
                  {u.medida_prevencion && <p><span className="text-xs text-slate-400 mr-1">Prevención:</span><span className="text-slate-700">{u.medida_prevencion}</span></p>}
                  {u.medios_verificacion && <p className="md:col-span-3"><span className="text-xs text-slate-400 mr-1">Verificación:</span><span className="text-slate-700">{u.medios_verificacion}</span></p>}
                </div>
                {confirmDeleteUA === i && (
                  <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-red-700">¿Eliminar este registro de uso de agua?</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDeleteUA(null)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                      <button type="button" onClick={() => { set('usos_agua', data.usos_agua.filter((_, idx) => idx !== i)); setConfirmDeleteUA(null) }}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Sí, eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulario uso de agua */}
          {mostrarFormUA && (
            <div className="border-2 border-blue-200 rounded-xl bg-blue-50 p-5 space-y-4 mt-3">
              <p className="text-sm font-semibold text-slate-700">{editUA !== null ? `Editando registro #${editUA + 1}` : 'Nuevo registro de uso de agua'}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Procedencia */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Uso de agua para la construcción (procedencia)</label>
                  <select value={formUA.procedencia} onChange={e => setFUA('procedencia', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {PROCEDENCIAS_AGUA.map(p => <option key={p}>{p}</option>)}
                  </select>
                  {formUA.procedencia === 'Otros' && (
                    <input value={formUA.procedencia_otro} onChange={e => setFUA('procedencia_otro', e.target.value)}
                      placeholder="Especifique la procedencia..." className={`${inputCls} mt-2`} />
                  )}
                </div>

                {/* Categoría de actividad */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Actividades del proyecto en las que se hace uso de agua</label>
                  <select value={formUA.actividad_cat} onChange={e => setFUA('actividad_cat', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {Object.entries(CATEGORIAS_ACTIVIDAD).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  {/* Categoría e = Otros */}
                  {formUA.actividad_cat === 'e' && (
                    <input value={formUA.actividad_otro_texto} onChange={e => setFUA('actividad_otro_texto', e.target.value)}
                      placeholder="Describa la actividad..." className={`${inputCls} mt-2`} />
                  )}
                </div>

                {/* Sub-actividad específica */}
                {mostrarSubEspecifica && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Actividad específica</label>
                    <select value={formUA.actividad_especifica} onChange={e => setFUA('actividad_especifica', e.target.value)} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {subOpts.map(o => <option key={o}>{o}</option>)}
                    </select>
                    {formUA.actividad_especifica === 'Otros' && (
                      <input value={formUA.actividad_especifica_otro} onChange={e => setFUA('actividad_especifica_otro', e.target.value)}
                        placeholder="Especifique la actividad..." className={`${inputCls} mt-2`} />
                    )}
                  </div>
                )}

                {/* Volumen */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Volumen de agua utilizado (litros)</label>
                  <input type="number" value={formUA.volumen_litros} onChange={e => setFUA('volumen_litros', parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>

                {/* Impacto potencial */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Impacto potencial</label>
                  <textarea value={formUA.impacto_potencial} onChange={e => setFUA('impacto_potencial', e.target.value)}
                    rows={2} placeholder="Describa el impacto potencial..." className={`${taCls}`} />
                </div>

                {/* Medida de prevención */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Medida de prevención</label>
                  <textarea value={formUA.medida_prevencion} onChange={e => setFUA('medida_prevencion', e.target.value)}
                    rows={2} placeholder="Medidas aplicadas para prevenir el impacto..." className={`${taCls}`} />
                </div>

                {/* Medios de verificación */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Medios de verificación</label>
                  <textarea value={formUA.medios_verificacion} onChange={e => setFUA('medios_verificacion', e.target.value)}
                    rows={2} placeholder="Registros, fotografías, documentos..." className={`${taCls}`} />
                </div>
              </div>

<div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setMostrarFormUA(false); setFormUA({ ...USO_VACIO }); setEditUA(null) }}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="button" onClick={registrarUA} disabled={!formUA.procedencia || !formUA.actividad_cat}
                  className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50">
                  {editUA !== null ? 'Guardar cambios' : 'Registrar'}
                </button>
              </div>
            </div>
          )}

          {!mostrarFormUA && (
            <button type="button" onClick={() => { setFormUA({ ...USO_VACIO }); setEditUA(null); setMostrarFormUA(true) }}
              className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all mt-3">
              <Plus size={15} /> Registrar nuevo uso de agua
            </button>
          )}
        </section>

        {/* ── Mejoramiento o construcción de instalaciones ── */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
            Mejoramiento o construcción de instalaciones para la gestión de aguas residuales
          </h3>

          <div className="space-y-3">
            {data.obras_infraestructura.map((o, i) => (
              <div key={o.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{o.infraestructura}</span>
                    {o.intervencion && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      o.intervencion === 'Mejoramiento' ? 'bg-yellow-100 text-yellow-700' :
                      o.intervencion === 'Construcción nueva' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-500'}`}>{o.intervencion}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {o.porcentaje_avance > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${o.porcentaje_avance}%` }} />
                        </div>
                        <span className="font-medium">{o.porcentaje_avance}%</span>
                      </div>
                    )}
                    <button type="button" onClick={() => { setFormOI({ ...o }); setEditOI(i); setMostrarFormOI(true) }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"><Pencil size={12} /> Editar</button>
                    <button type="button" onClick={() => setConfirmDeleteOI(i)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"><Trash2 size={12} /> Eliminar</button>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1 text-sm">
                  {o.obras_incluidas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {o.obras_incluidas.map(ob => (
                        <span key={ob} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ob}</span>
                      ))}
                    </div>
                  )}
                  {o.descripcion && <p className="text-slate-600 text-xs mt-2">{o.descripcion}</p>}
                </div>
                {confirmDeleteOI === i && (
                  <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-red-700">¿Eliminar este registro?</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDeleteOI(null)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                      <button type="button" onClick={() => { set('obras_infraestructura', data.obras_infraestructura.filter((_, idx) => idx !== i)); setConfirmDeleteOI(null) }}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Sí, eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulario */}
          {mostrarFormOI && (
            <div className="border-2 border-blue-200 rounded-xl bg-blue-50 p-5 space-y-4 mt-3">
              <p className="text-sm font-semibold text-slate-700">{editOI !== null ? `Editando registro #${editOI + 1}` : 'Nueva obra de infraestructura'}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Infraestructura */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Infraestructura para la gestión de aguas residuales</label>
                  <select value={formOI.infraestructura} onChange={e => setFOI('infraestructura', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {Object.keys(INFRAESTRUCTURA_OBRAS).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>

                {/* Obras incluidas (checklist) */}
                {formOI.infraestructura && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Obras incluidas</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(INFRAESTRUCTURA_OBRAS[formOI.infraestructura] ?? []).map(obra => (
                        <label key={obra} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                          formOI.obras_incluidas.includes(obra)
                            ? 'border-blue-400 bg-white text-blue-800 font-medium'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}>
                          <input type="checkbox" checked={formOI.obras_incluidas.includes(obra)}
                            onChange={() => toggleObra(obra)} className="w-4 h-4 text-blue-600 rounded" />
                          {obra}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intervención */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Intervención</label>
                  <select value={formOI.intervencion} onChange={e => setFOI('intervencion', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {INTERVENCIONES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>

                {/* Porcentaje de avance */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Porcentaje de avance
                    <span className="ml-2 font-bold text-blue-700">{formOI.porcentaje_avance}%</span>
                  </label>
                  <input type="range" min={0} max={100} step={1}
                    value={formOI.porcentaje_avance}
                    onChange={e => setFOI('porcentaje_avance', parseInt(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>0%</span><span>50%</span><span>100%</span></div>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
                  <textarea value={formOI.descripcion} onChange={e => setFOI('descripcion', e.target.value)}
                    rows={3} placeholder="Describa el estado, avance y observaciones de la obra..."
                    className={`${taCls}`} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setMostrarFormOI(false); setFormOI({ ...OBRA_VACIA }); setEditOI(null) }}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="button" onClick={registrarOI} disabled={!formOI.infraestructura}
                  className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50">
                  {editOI !== null ? 'Guardar cambios' : 'Registrar'}
                </button>
              </div>
            </div>
          )}

          {!mostrarFormOI && (
            <button type="button" onClick={() => { setFormOI({ ...OBRA_VACIA }); setEditOI(null); setMostrarFormOI(true) }}
              className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all mt-3">
              <Plus size={15} /> Agregar nueva obra de infraestructura
            </button>
          )}
        </section>

        {/* ── Reporte de incidentes / incumplimientos ── */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
            Reporte de incidentes / incumplimientos
          </h3>

          {/* Pregunta sí/no */}
          <div className="mb-4">
            <p className="text-sm text-slate-700 mb-2">
              ¿Se identificaron incidentes ambientales relacionados al mal manejo de aguas residuales?
            </p>
            <div className="flex gap-4">
              {['Sí', 'No'].map(op => (
                <label key={op} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
                  data.tiene_incidentes === op
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>
                  <input type="radio" name="tiene_incidentes" value={op}
                    checked={data.tiene_incidentes === op}
                    onChange={() => set('tiene_incidentes', op)}
                    className="accent-blue-600" />
                  {op}
                </label>
              ))}
            </div>
          </div>

          {/* Tabla de incidentes — solo si respondió Sí */}
          {data.tiene_incidentes === 'Sí' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Detalle de incidentes</label>
                <button
                  type="button"
                  onClick={() => set('incidentes', [...(data.incidentes ?? []), INCIDENTE_VACIO()])}
                  className="flex items-center gap-1.5 text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition"
                >
                  <Plus size={13} /> Agregar incidente
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-3 py-2.5 text-left font-semibold w-36">Tipo de incidente</th>
                      <th className="px-3 py-2.5 text-left font-semibold w-32">Ubicación</th>
                      <th className="px-3 py-2.5 text-left font-semibold w-36">Fecha y hora</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Descripción</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Medidas correctivas implementadas</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {(data.incidentes ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">
                          Sin incidentes registrados. Haz clic en "Agregar incidente".
                        </td>
                      </tr>
                    )}
                    {(data.incidentes ?? []).map((item, i) => (
                      <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-2 py-1.5">
                          <input value={item.tipo}
                            onChange={e => set('incidentes', (data.incidentes ?? []).map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))}
                            placeholder="Ej: Derrame, Contaminación..." className="w-full border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.ubicacion}
                            onChange={e => set('incidentes', (data.incidentes ?? []).map((x, j) => j === i ? { ...x, ubicacion: e.target.value } : x))}
                            placeholder="Sector / área..." className="w-full border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="datetime-local" value={item.fecha_hora}
                            onChange={e => set('incidentes', (data.incidentes ?? []).map((x, j) => j === i ? { ...x, fecha_hora: e.target.value } : x))}
                            className="w-full border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <textarea value={item.descripcion} rows={2}
                            onChange={e => set('incidentes', (data.incidentes ?? []).map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))}
                            placeholder="Describa el incidente..." className="w-full border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <textarea value={item.medidas_correctivas} rows={2}
                            onChange={e => set('incidentes', (data.incidentes ?? []).map((x, j) => j === i ? { ...x, medidas_correctivas: e.target.value } : x))}
                            placeholder="Acciones tomadas..." className="w-full border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button type="button"
                            onClick={() => set('incidentes', (data.incidentes ?? []).filter((_, j) => j !== i))}
                            className="text-slate-300 hover:text-red-500 transition">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <RegistroFotografico
          fotos={data.fotos ?? []}
          onChange={v => set('fotos', v)}
        />

      </div>
    </FormWrapper>
  )
}
