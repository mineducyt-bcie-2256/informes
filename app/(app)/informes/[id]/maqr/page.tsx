'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import RegistroFotografico, { type Foto } from '@/components/forms/RegistroFotografico'
import {
  Plus, Trash2, Mailbox, AlertCircle, Mail, Phone, MessageCircle,
  Info, ChevronDown, ChevronUp, Clock, BarChart2, PlusCircle, X, History,
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════
// TIPOS — MEDIOS DE RECEPCIÓN
// ════════════════════════════════════════════════════════════════
type MediosBuzon    = { activo: boolean; direccion: string; responsable_llave: string; frecuencia_dias: number; custodia: string }
type MediosRotulos  = { activo: boolean; estado: string }
type MediosCorreo   = { activo: boolean; correo: string; responsable: string }
type MediosTelefono = { activo: boolean; numero: string; responsable: string }
type MediosWhatsapp = { activo: boolean; numero: string; responsable: string }
type MediosRecepcion = { buzon: MediosBuzon; rotulos: MediosRotulos; correo: MediosCorreo; telefono: MediosTelefono; whatsapp: MediosWhatsapp }

const MEDIOS_INIT: MediosRecepcion = {
  buzon:    { activo: false, direccion: '', responsable_llave: '', frecuencia_dias: 7, custodia: '' },
  rotulos:  { activo: false, estado: '' },
  correo:   { activo: false, correo: '', responsable: '' },
  telefono: { activo: false, numero: '', responsable: '' },
  whatsapp: { activo: false, numero: '', responsable: '' },
}

// ════════════════════════════════════════════════════════════════
// TIPOS — QUEJAS
// ════════════════════════════════════════════════════════════════
type Medida = { id: string; medida: string; fecha: string; resultados: string }
type Queja  = {
  id:              string
  numero_queja:    number
  medio:           string
  medio_otro:      string
  fecha_recepcion: string
  fecha_resolucion:string
  fecha_cierre:    string
  tipo_queja:      string
  tipo_queja_otro: string
  origen:          string
  origen_otro:     string
  nivel_gravedad:  string
  descripcion:     string
  medidas:         Medida[]
  estado:          string
  arrastrada?:     boolean   // true si viene de un periodo anterior sin resolver
}

const QUEJA_INIT: Queja = {
  id: '', numero_queja: 1,
  medio: '', medio_otro: '',
  fecha_recepcion: '', fecha_resolucion: '', fecha_cierre: '',
  tipo_queja: '', tipo_queja_otro: '',
  origen: '', origen_otro: '',
  nivel_gravedad: '',
  descripcion: '',
  medidas: [],
  estado: '',
  arrastrada: false,
}

// ── Catálogos ────────────────────────────────────────────────────
const MEDIOS_QUEJA  = ['Buzón', 'Correo electrónico', 'Teléfono', 'WhatsApp', 'Otro']
const TIPOS_QUEJA   = ['Laboral (personal o condiciones)', 'Ambiental', 'Social', 'Seguridad', 'Otro']
const ORIGENES      = ['Comunidad directa', 'Trabajador', 'Institución', 'Otro']
const NIVELES       = ['Nivel 1 (Bajo)', 'Nivel 2 (Medio)', 'Nivel 3 (Alto)']

// ── Helpers de fecha ─────────────────────────────────────────────
function diasEntre(desde: string, hasta?: string): number {
  if (!desde) return 0
  const d1 = new Date(desde + 'T00:00:00')
  const d2 = hasta ? new Date(hasta + 'T00:00:00') : new Date()
  return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / 86_400_000))
}
function hoy(): string { return new Date().toISOString().split('T')[0] }

// ── Estilos compartidos ──────────────────────────────────────────
const inputCls  = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const numCls    = `${inputCls} [appearance:textfield]`
const selectCls = inputCls
const taCls     = `${inputCls} resize-none`

// ════════════════════════════════════════════════════════════════
// SECCIÓN MEDIOS DE RECEPCIÓN (sin cambios)
// ════════════════════════════════════════════════════════════════
function SeccionMedios({ medios, onChange }: { medios: MediosRecepcion; onChange: (v: MediosRecepcion) => void }) {
  function toggle<K extends keyof MediosRecepcion>(key: K) {
    onChange({ ...medios, [key]: { ...medios[key], activo: !(medios[key] as any).activo } })
  }
  function upd<K extends keyof MediosRecepcion>(key: K, field: string, value: any) {
    onChange({ ...medios, [key]: { ...medios[key], [field]: value } })
  }
  const activeCount = Object.values(medios).filter((m: any) => m.activo).length

  return (
    <section>
      <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Medios habilitados para la recepción de quejas y reclamos</h3>
        {activeCount > 0 && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">{activeCount} medio{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}</span>}
      </div>
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">Esta información es permanente y se cargará automáticamente en los siguientes informes. Si se actualiza, solo afecta el informe actual.</p>
      </div>
      <div className="space-y-3">
        {/* Buzón físico */}
        <div className={`rounded-xl border overflow-hidden transition-all ${medios.buzon.activo ? 'border-blue-300' : 'border-slate-200'}`}>
          <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${medios.buzon.activo ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
            <input type="checkbox" checked={medios.buzon.activo} onChange={() => toggle('buzon')} className="w-4 h-4 text-blue-600 rounded shrink-0" />
            <Mailbox size={15} className={medios.buzon.activo ? 'text-blue-600' : 'text-slate-400'} />
            <span className={`text-sm font-medium ${medios.buzon.activo ? 'text-blue-900' : 'text-slate-700'}`}>Buzón físico</span>
          </label>
          {medios.buzon.activo && (
            <div className="border-t border-blue-100 bg-white px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="text-xs font-medium text-slate-600 mb-1 block">Dirección / Ubicación del buzón</label>
                <input value={medios.buzon.direccion} onChange={e => upd('buzon', 'direccion', e.target.value)} placeholder="Ej: Entrada principal, costado norte..." className={inputCls} /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Responsable de la llave</label>
                <input value={medios.buzon.responsable_llave} onChange={e => upd('buzon', 'responsable_llave', e.target.value)} placeholder="Nombre del responsable..." className={inputCls} /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Frecuencia de revisión <span className="font-normal text-slate-400">(días)</span></label>
                <input type="number" min={1} value={medios.buzon.frecuencia_dias} onChange={e => upd('buzon', 'frecuencia_dias', parseInt(e.target.value) || 1)} className={numCls} /></div>
              <div className="md:col-span-2"><label className="text-xs font-medium text-slate-600 mb-1 block">Custodia del mecanismo</label>
                <input value={medios.buzon.custodia} onChange={e => upd('buzon', 'custodia', e.target.value)} placeholder="Persona o área responsable..." className={inputCls} /></div>
            </div>
          )}
        </div>
        {/* Rótulos */}
        <div className={`rounded-xl border overflow-hidden transition-all ${medios.rotulos.activo ? 'border-amber-300' : 'border-slate-200'}`}>
          <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${medios.rotulos.activo ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'}`}>
            <input type="checkbox" checked={medios.rotulos.activo} onChange={() => toggle('rotulos')} className="w-4 h-4 text-amber-500 rounded shrink-0" />
            <AlertCircle size={15} className={medios.rotulos.activo ? 'text-amber-500' : 'text-slate-400'} />
            <span className={`text-sm font-medium ${medios.rotulos.activo ? 'text-amber-900' : 'text-slate-700'}`}>Rótulos informativos</span>
          </label>
          {medios.rotulos.activo && (
            <div className="border-t border-amber-100 bg-white px-4 py-4">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Estado de los rótulos</label>
              <textarea value={medios.rotulos.estado} onChange={e => upd('rotulos', 'estado', e.target.value)} rows={2} placeholder="Describa el estado actual..." className={taCls} />
            </div>
          )}
        </div>
        {/* Correo */}
        <div className={`rounded-xl border overflow-hidden transition-all ${medios.correo.activo ? 'border-violet-300' : 'border-slate-200'}`}>
          <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${medios.correo.activo ? 'bg-violet-50' : 'bg-white hover:bg-slate-50'}`}>
            <input type="checkbox" checked={medios.correo.activo} onChange={() => toggle('correo')} className="w-4 h-4 text-violet-600 rounded shrink-0" />
            <Mail size={15} className={medios.correo.activo ? 'text-violet-500' : 'text-slate-400'} />
            <span className={`text-sm font-medium ${medios.correo.activo ? 'text-violet-900' : 'text-slate-700'}`}>Correo electrónico</span>
          </label>
          {medios.correo.activo && (
            <div className="border-t border-violet-100 bg-white px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Correo electrónico</label>
                <input type="email" value={medios.correo.correo} onChange={e => upd('correo', 'correo', e.target.value)} placeholder="quejas@ejemplo.com" className={inputCls} /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Responsable de responder</label>
                <input value={medios.correo.responsable} onChange={e => upd('correo', 'responsable', e.target.value)} placeholder="Nombre..." className={inputCls} /></div>
            </div>
          )}
        </div>
        {/* Teléfono */}
        <div className={`rounded-xl border overflow-hidden transition-all ${medios.telefono.activo ? 'border-green-300' : 'border-slate-200'}`}>
          <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${medios.telefono.activo ? 'bg-green-50' : 'bg-white hover:bg-slate-50'}`}>
            <input type="checkbox" checked={medios.telefono.activo} onChange={() => toggle('telefono')} className="w-4 h-4 text-green-600 rounded shrink-0" />
            <Phone size={15} className={medios.telefono.activo ? 'text-green-600' : 'text-slate-400'} />
            <span className={`text-sm font-medium ${medios.telefono.activo ? 'text-green-900' : 'text-slate-700'}`}>Teléfono</span>
          </label>
          {medios.telefono.activo && (
            <div className="border-t border-green-100 bg-white px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Número <span className="font-normal text-slate-400">(8 dígitos)</span></label>
                <input type="tel" maxLength={8} value={medios.telefono.numero} onChange={e => upd('telefono', 'numero', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" className={inputCls} /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Responsable</label>
                <input value={medios.telefono.responsable} onChange={e => upd('telefono', 'responsable', e.target.value)} placeholder="Nombre..." className={inputCls} /></div>
            </div>
          )}
        </div>
        {/* WhatsApp */}
        <div className={`rounded-xl border overflow-hidden transition-all ${medios.whatsapp.activo ? 'border-emerald-300' : 'border-slate-200'}`}>
          <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${medios.whatsapp.activo ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'}`}>
            <input type="checkbox" checked={medios.whatsapp.activo} onChange={() => toggle('whatsapp')} className="w-4 h-4 text-emerald-600 rounded shrink-0" />
            <MessageCircle size={15} className={medios.whatsapp.activo ? 'text-emerald-600' : 'text-slate-400'} />
            <span className={`text-sm font-medium ${medios.whatsapp.activo ? 'text-emerald-900' : 'text-slate-700'}`}>WhatsApp</span>
          </label>
          {medios.whatsapp.activo && (
            <div className="border-t border-emerald-100 bg-white px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Número <span className="font-normal text-slate-400">(8 dígitos)</span></label>
                <input type="tel" maxLength={8} value={medios.whatsapp.numero} onChange={e => upd('whatsapp', 'numero', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" className={inputCls} /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Responsable</label>
                <input value={medios.whatsapp.responsable} onChange={e => upd('whatsapp', 'responsable', e.target.value)} placeholder="Nombre..." className={inputCls} /></div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// CONTADOR / PANEL DE ESTADÍSTICAS — tarjetas
// ════════════════════════════════════════════════════════════════
function PanelEstadisticas({ quejas, acum }: { quejas: Queja[]; acum: { total: number; abiertas: number; resueltas: number } }) {
  if (quejas.length === 0) return null

  const total = quejas.length

  function contarPor(campo: keyof Queja): [string, number][] {
    const mapa: Record<string, number> = {}
    quejas.forEach(q => {
      const val = (q[campo] as string) || 'Sin especificar'
      mapa[val] = (mapa[val] || 0) + 1
    })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }

  const ESTADO_DOT: Record<string, string> = {
    'En proceso':       'bg-blue-500',
    'En investigación': 'bg-amber-500',
    'Resuelto':         'bg-green-500',
    'Cerrado':          'bg-slate-400',
  }
  const NIVEL_DOT: Record<string, string> = {
    'Nivel 1 (Bajo)':  'bg-green-500',
    'Nivel 2 (Medio)': 'bg-amber-500',
    'Nivel 3 (Alto)':  'bg-red-500',
  }
  const NIVEL_BAR: Record<string, string> = {
    'Nivel 1 (Bajo)':  'bg-green-400',
    'Nivel 2 (Medio)': 'bg-amber-400',
    'Nivel 3 (Alto)':  'bg-red-500',
  }
  const ESTADO_BAR: Record<string, string> = {
    'En proceso':       'bg-blue-500',
    'En investigación': 'bg-amber-400',
    'Resuelto':         'bg-green-500',
    'Cerrado':          'bg-slate-400',
  }

  // Tarjeta genérica con barras de proporción
  function TarjetaGrupo({
    titulo, items, dotMap, barMap, accent,
  }: {
    titulo: string
    items: [string, number][]
    dotMap?: Record<string, string>
    barMap?: Record<string, string>
    accent: string   // color clase bg para la barra default
  }) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{titulo}</p>
        <div className="space-y-2.5">
          {items.map(([label, n]) => {
            const pct = Math.round((n / total) * 100)
            const bar = barMap?.[label] ?? accent
            const dot = dotMap?.[label]
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {dot && <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />}
                    <span className="text-xs text-slate-700 truncate">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-xs font-bold text-slate-800">{n}</span>
                    <span className="text-xs text-slate-400">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Quejas resueltas vs abiertas
  const resueltas = quejas.filter(q => q.estado === 'Resuelto' || q.estado === 'Cerrado').length
  const abiertas  = total - resueltas

  return (
    <div className="space-y-4">
      {/* Fila superior: totales grandes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 bg-blue-600 text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Total quejas de este periodo</p>
          <p className="text-4xl font-black mt-1">{total}</p>
          {acum.total > 0
            ? <p className="text-xs opacity-70 mt-1">Acumulado total: <span className="font-bold">{acum.total}</span></p>
            : <p className="text-xs opacity-70 mt-1">sin datos acumulados aún</p>
          }
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Abiertas</p>
          <p className={`text-3xl font-black mt-1 ${abiertas > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{abiertas}</p>
          <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${total ? (abiertas / total) * 100 : 0}%` }} />
          </div>
          {acum.total > 0 && (
            <p className="text-xs text-slate-400 mt-1.5">Acumulado: <span className="font-semibold text-amber-600">{acum.abiertas}</span></p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resueltas</p>
          <p className={`text-3xl font-black mt-1 ${resueltas > 0 ? 'text-green-600' : 'text-slate-300'}`}>{resueltas}</p>
          <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${total ? (resueltas / total) * 100 : 0}%` }} />
          </div>
          {acum.total > 0 && (
            <p className="text-xs text-slate-400 mt-1.5">Acumulado: <span className="font-semibold text-green-600">{acum.resueltas}</span></p>
          )}
        </div>
      </div>

      {/* Grid de tarjetas de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TarjetaGrupo titulo="Por estado"  items={contarPor('estado')}         dotMap={ESTADO_DOT} barMap={ESTADO_BAR} accent="bg-slate-400" />
        <TarjetaGrupo titulo="Por nivel"   items={contarPor('nivel_gravedad')} dotMap={NIVEL_DOT}  barMap={NIVEL_BAR} accent="bg-slate-300" />
        <TarjetaGrupo titulo="Por medio"   items={contarPor('medio')}          accent="bg-blue-400" />
        <TarjetaGrupo titulo="Por tipo"    items={contarPor('tipo_queja')}     accent="bg-violet-400" />
        <TarjetaGrupo titulo="Por origen"  items={contarPor('origen')}         accent="bg-teal-400" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TARJETA DE QUEJA
// ════════════════════════════════════════════════════════════════
function TarjetaQueja({
  queja, index, onChange, onDelete,
}: {
  queja: Queja; index: number
  onChange: (q: Queja) => void
  onDelete: () => void
}) {
  const [expandida,    setExpandida]    = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [guardada,     setGuardada]     = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [diasLive, setDiasLive] = useState(0)

  // Contador de días en vivo
  useEffect(() => {
    function calcular() {
      if (!queja.fecha_recepcion) { setDiasLive(0); return }
      if (queja.fecha_resolucion) {
        // Pausado: usa fecha de resolución
        setDiasLive(diasEntre(queja.fecha_recepcion, queja.fecha_resolucion))
        return
      }
      setDiasLive(diasEntre(queja.fecha_recepcion))
    }
    calcular()
    timerRef.current = setInterval(calcular, 60_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [queja.fecha_recepcion, queja.fecha_resolucion])

  function upd(field: keyof Queja, value: any) {
    let next: Queja = { ...queja, [field]: value }

    // Auto-estado cuando se ingresa fecha de recepción
    if (field === 'fecha_recepcion' && value && !queja.estado) {
      next.estado = 'En proceso'
    }
    // Fecha cierre = fecha resolución automáticamente
    if (field === 'fecha_resolucion' && value) {
      next.fecha_cierre = value
    }
    onChange(next)
  }

  // Opciones de estado según fechas
  const opcionesEstado = (() => {
    if (!queja.fecha_recepcion) return ['En proceso']
    const base = ['En proceso', 'En investigación', 'Resuelto']
    if (queja.fecha_resolucion) return [...base, 'Cerrado']
    return base
  })()

  // Medidas
  function addMedida() {
    upd('medidas', [...queja.medidas, { id: String(Date.now()), medida: '', fecha: '', resultados: '' }])
  }
  function updMedida(mi: number, field: keyof Medida, value: string) {
    upd('medidas', queja.medidas.map((m, i) => i === mi ? { ...m, [field]: value } : m))
  }
  function delMedida(mi: number) {
    upd('medidas', queja.medidas.filter((_, i) => i !== mi))
  }

  const ESTADO_STYLE: Record<string, string> = {
    'En proceso':       'bg-blue-100 text-blue-700 border-blue-200',
    'En investigación': 'bg-amber-100 text-amber-700 border-amber-200',
    'Resuelto':         'bg-green-100 text-green-700 border-green-200',
    'Cerrado':          'bg-slate-100 text-slate-600 border-slate-300',
  }
  const NIVEL_STYLE: Record<string, string> = {
    'Nivel 1 (Bajo)':  'bg-green-100 text-green-700',
    'Nivel 2 (Medio)': 'bg-amber-100 text-amber-700',
    'Nivel 3 (Alto)':  'bg-red-100 text-red-700',
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase">#{index + 1}</span>
          {queja.arrastrada && (
            <span className="flex items-center gap-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
              <History size={10} /> Arrastrada del periodo anterior
            </span>
          )}
          {queja.medio && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{queja.medio === 'Otro' && queja.medio_otro ? queja.medio_otro : queja.medio}</span>}
          {queja.estado && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ESTADO_STYLE[queja.estado] ?? 'bg-slate-100 text-slate-600'}`}>{queja.estado}</span>}
          {queja.nivel_gravedad && <span className={`text-xs px-2 py-0.5 rounded-full ${NIVEL_STYLE[queja.nivel_gravedad] ?? ''}`}>{queja.nivel_gravedad}</span>}
          {queja.fecha_recepcion && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              {diasLive} día{diasLive !== 1 ? 's' : ''}
              {!queja.fecha_resolucion && <span className="text-blue-500 font-medium"> (en curso)</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setExpandida(p => !p)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors">
            {expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Confirmación eliminar */}
      {confirmDelete && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 font-medium">¿Eliminar esta queja?</p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="button" onClick={onDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
          </div>
        </div>
      )}

      {/* Formulario expandido */}
      {expandida && (
        <div className="bg-white px-4 py-5 space-y-5">

          {/* Fila 1: Medio + Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Medio utilizado para la queja</label>
              <select value={queja.medio} onChange={e => upd('medio', e.target.value)} className={selectCls}>
                <option value="">Seleccionar medio...</option>
                {MEDIOS_QUEJA.map(m => <option key={m}>{m}</option>)}
              </select>
              {queja.medio === 'Otro' && (
                <input value={queja.medio_otro} onChange={e => upd('medio_otro', e.target.value)}
                  placeholder="Especifique el medio..." className={`${inputCls} mt-2`} />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha de recepción de la queja</label>
              <input type="date" value={queja.fecha_recepcion} onChange={e => upd('fecha_recepcion', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha de resolución</label>
              <input type="date" value={queja.fecha_resolucion}
                min={queja.fecha_recepcion || undefined}
                onChange={e => upd('fecha_resolucion', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Fila 2: Fecha cierre + Tiempo resolver + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Fecha de cierre
                <span className="ml-1 font-normal text-slate-400 text-[11px]">(auto desde resolución, editable 10 días)</span>
              </label>
              <input type="date" value={queja.fecha_cierre}
                min={queja.fecha_resolucion || undefined}
                onChange={e => upd('fecha_cierre', e.target.value)}
                className={`${inputCls} ${!queja.fecha_resolucion ? 'bg-slate-50 text-slate-400' : ''}`}
                disabled={!queja.fecha_resolucion} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Tiempo para resolver
                {!queja.fecha_resolucion && queja.fecha_recepcion && <span className="ml-1 text-blue-500 text-[11px] font-normal">en curso</span>}
              </label>
              <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm ${queja.fecha_resolucion ? 'border-green-300 bg-green-50 text-green-800' : queja.fecha_recepcion ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                <Clock size={14} className="shrink-0" />
                <span className="font-semibold">{diasLive}</span>
                <span className="text-xs">{diasLive === 1 ? 'día' : 'días'}</span>
                {!queja.fecha_resolucion && queja.fecha_recepcion && <span className="ml-auto text-xs animate-pulse">⟳</span>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
              <select value={queja.estado} onChange={e => upd('estado', e.target.value)} className={selectCls}
                disabled={!queja.fecha_recepcion}>
                <option value="">Seleccionar...</option>
                {opcionesEstado.map(op => <option key={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {/* Fila 3: Tipo + Origen + Nivel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo de queja</label>
              <select value={queja.tipo_queja} onChange={e => upd('tipo_queja', e.target.value)} className={selectCls}>
                <option value="">Seleccionar...</option>
                {TIPOS_QUEJA.map(t => <option key={t}>{t}</option>)}
              </select>
              {queja.tipo_queja === 'Otro' && (
                <input value={queja.tipo_queja_otro} onChange={e => upd('tipo_queja_otro', e.target.value)}
                  placeholder="Especifique el tipo..." className={`${inputCls} mt-2`} />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Origen de la queja</label>
              <select value={queja.origen} onChange={e => upd('origen', e.target.value)} className={selectCls}>
                <option value="">Seleccionar...</option>
                {ORIGENES.map(o => <option key={o}>{o}</option>)}
              </select>
              {queja.origen === 'Otro' && (
                <input value={queja.origen_otro} onChange={e => upd('origen_otro', e.target.value)}
                  placeholder="Especifique el origen..." className={`${inputCls} mt-2`} />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nivel de gravedad</label>
              <select value={queja.nivel_gravedad} onChange={e => upd('nivel_gravedad', e.target.value)} className={selectCls}>
                <option value="">Seleccionar...</option>
                {NIVELES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción de la queja o reclamo</label>
            <textarea value={queja.descripcion} onChange={e => upd('descripcion', e.target.value)} rows={3}
              placeholder="Describa detalladamente la queja o reclamo presentado..." className={taCls} />
          </div>

          {/* Medidas implementadas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Medidas implementadas</label>
              <button type="button" onClick={addMedida}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                <PlusCircle size={13} /> Agregar medida
              </button>
            </div>

            {queja.medidas.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">Sin medidas registradas aún.</p>
            )}

            <div className="space-y-3">
              {queja.medidas.map((m, mi) => (
                <div key={m.id} className="border border-slate-200 rounded-lg bg-slate-50 p-3 relative">
                  <button type="button" onClick={() => delMedida(mi)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={13} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Medida implementada</label>
                      <input value={m.medida} onChange={e => updMedida(mi, 'medida', e.target.value)}
                        placeholder="Describa la acción tomada..." className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Fecha de implementación</label>
                      <input type="date" value={m.fecha} onChange={e => updMedida(mi, 'fecha', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Resultados obtenidos</label>
                      <input value={m.resultados} onChange={e => updMedida(mi, 'resultados', e.target.value)}
                        placeholder="Describa los resultados..." className={inputCls} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Botón guardar queja ── */}
          {(() => {
            const completa = !!(queja.medio && queja.fecha_recepcion && queja.tipo_queja && queja.origen && queja.nivel_gravedad && queja.estado)
            return (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  {completa
                    ? '✓ Todos los campos requeridos completados'
                    : 'Complete: medio, fecha de recepción, tipo, origen, nivel y estado'}
                </p>
                <button
                  type="button"
                  disabled={!completa}
                  onClick={() => { setGuardada(true); setExpandida(false) }}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    completa
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}>
                  Guardar queja
                </button>
              </div>
            )
          })()}

        </div>
      )}

      {/* Indicador de guardado en la cabecera cuando está colapsada */}
      {!expandida && guardada && (
        <div className="bg-green-50 border-t border-green-100 px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs text-green-700 font-medium">✓ Queja registrada — presione el formulario principal "Guardar" para persistir los cambios</span>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function MaqrPage() {
  const { id } = useParams<{ id: string }>()
  const [descripcion,       setDescripcion]       = useState('')
  const [medios,            setMedios]            = useState<MediosRecepcion>(MEDIOS_INIT)
  const [quejas,            setQuejas]            = useState<Queja[]>([])
  const [fotos,             setFotos]             = useState<Foto[]>([])
  const [autoLoaded,        setAutoLoaded]        = useState(false)
  const [autoLoadedQuejas,  setAutoLoadedQuejas]  = useState(false)
  const [statsAcum,         setStatsAcum]         = useState({ total: 0, abiertas: 0, resueltas: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      await fetch('/api/migrate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'informe_maqr' }),
      })
      // Informe header — needed for prev-period lookup and accumulated stats
      const { data: inf } = await supabase.from('informes')
        .select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()

      // Try current maqr record
      const { data: d } = await supabase.from('informe_maqr').select('*').eq('informe_id', id).single()

      if (d) {
        setDescripcion(d.descripcion_condicion ?? '')
        setMedios(d.medios_recepcion ?? MEDIOS_INIT)
        setFotos(d.fotos ?? [])
        const { data: qs } = await supabase.from('informe_maqr_quejas').select('*').eq('maqr_id', d.id).order('numero_queja')
        setQuejas((qs ?? []).map((q: any) => ({ ...QUEJA_INIT, ...q, medidas: q.medidas ?? [] })))
      } else if (inf) {
        // Find most-recent previous informe for this escuela
        const { data: prev } = await supabase.from('informes').select('id')
          .eq('escuela_id', inf.escuela_id).neq('id', id)
          .or(`periodo_anio.lt.${inf.periodo_anio},and(periodo_anio.eq.${inf.periodo_anio},periodo_mes.lt.${inf.periodo_mes})`)
          .order('periodo_anio', { ascending: false }).order('periodo_mes', { ascending: false })
          .limit(1).single()
        if (prev?.id) {
          const { data: pm } = await supabase.from('informe_maqr').select('*').eq('informe_id', prev.id).single()
          // Auto-carry medios
          if (pm?.medios_recepcion) { setMedios(pm.medios_recepcion); setAutoLoaded(true) }
          // Auto-carry quejas still open (En proceso / En investigación)
          if (pm?.id) {
            const { data: prevQs } = await supabase.from('informe_maqr_quejas')
              .select('*').eq('maqr_id', pm.id)
              .in('estado', ['En proceso', 'En investigación'])
              .order('numero_queja')
            if (prevQs && prevQs.length > 0) {
              setQuejas(prevQs.map((q: any, i: number) => ({
                ...QUEJA_INIT, ...q,
                id: `arr-${Date.now()}-${i}`,
                medidas: q.medidas ?? [],
                arrastrada: true,
              })))
              setAutoLoadedQuejas(true)
            }
          }
        }
      }

      // Accumulated stats: all quejas across all periods for this escuela
      if (inf?.escuela_id) {
        const { data: allInfs } = await supabase.from('informes').select('id').eq('escuela_id', inf.escuela_id)
        if (allInfs && allInfs.length > 0) {
          const infIds = allInfs.map((x: any) => x.id)
          const { data: allMaqrs } = await supabase.from('informe_maqr').select('id').in('informe_id', infIds)
          if (allMaqrs && allMaqrs.length > 0) {
            const maqrIds = allMaqrs.map((m: any) => m.id)
            const { data: allQs } = await supabase.from('informe_maqr_quejas').select('estado').in('maqr_id', maqrIds)
            if (allQs) {
              const acumTotal     = allQs.length
              const acumResueltas = allQs.filter((q: any) => q.estado === 'Resuelto' || q.estado === 'Cerrado').length
              setStatsAcum({ total: acumTotal, abiertas: acumTotal - acumResueltas, resueltas: acumResueltas })
            }
          }
        }
      }
    }
    load()
  }, [id])

  function updateQueja(i: number, q: Queja) { setQuejas(p => p.map((x, idx) => idx === i ? q : x)) }
  function deleteQueja(i: number)            { setQuejas(p => p.filter((_, idx) => idx !== i)) }
  function addQueja() {
    setQuejas(p => [...p, { ...QUEJA_INIT, id: String(Date.now()), numero_queja: p.length + 1, estado: 'En proceso' }])
  }

  async function onSave() {
    const { data: maqrData, error: e1 } = await supabase.from('informe_maqr')
      .upsert({ informe_id: id, descripcion_condicion: descripcion, medios_recepcion: medios, cantidad_quejas: quejas.length, fotos }, { onConflict: 'informe_id' })
      .select().single()
    if (e1) throw new Error(e1.message)

    const maqrId = maqrData.id
    await supabase.from('informe_maqr_quejas').delete().eq('maqr_id', maqrId)
    if (quejas.length > 0) {
      const { error: e2 } = await supabase.from('informe_maqr_quejas')
        .insert(quejas.map((q, i) => ({
          maqr_id:         maqrId,
          numero_queja:    i + 1,
          medio:           q.medio,
          medio_otro:      q.medio_otro,
          fecha_recepcion: q.fecha_recepcion || null,
          fecha_resolucion:q.fecha_resolucion || null,
          fecha_cierre:    q.fecha_cierre || null,
          tipo_queja:      q.tipo_queja,
          tipo_queja_otro: q.tipo_queja_otro,
          origen:          q.origen,
          origen_otro:     q.origen_otro,
          nivel_gravedad:  q.nivel_gravedad,
          descripcion:     q.descripcion,
          medidas:         q.medidas,
          estado:          q.estado,
          arrastrada:      q.arrastrada ?? false,
        })))
      if (e2) throw new Error(e2.message)
    }
  }

  return (
    <FormWrapper title="Condición 6 - Mecanismo de Atención de Quejas y Reclamos" short="MAQR" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        {autoLoaded && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg leading-none mt-0.5">↺</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Medios cargados del informe anterior</p>
              <p className="text-xs text-amber-700 mt-0.5">Los medios habilitados se copiaron del mes anterior. Verifique y actualice si corresponde.</p>
            </div>
          </div>
        )}

        {autoLoadedQuejas && (
          <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
            <History size={16} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-800">Quejas arrastradas del periodo anterior</p>
              <p className="text-xs text-violet-700 mt-0.5">Se cargaron automáticamente las quejas que quedaron pendientes (En proceso / En investigación). Actualice su estado y guarde el informe.</p>
            </div>
          </div>
        )}

        <DescripcionCondicion informeId={id} tabla="informe_maqr" value={descripcion} onChange={setDescripcion} />

        <SeccionMedios medios={medios} onChange={setMedios} />

        {/* ── Registro, seguimiento y monitoreo ── */}
        <section>
          <div className="mb-5 pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Registro, seguimiento y monitoreo de quejas
            </h3>
            <button type="button" onClick={addQueja}
              className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
              <Plus size={14} /> Registrar queja
            </button>
          </div>

          <PanelEstadisticas quejas={quejas} acum={statsAcum} />

          {quejas.length > 0 && <div className="mt-5 space-y-4">
            {quejas.map((q, i) => (
              <TarjetaQueja key={q.id || i} queja={q} index={i}
                onChange={nq => updateQueja(i, nq)}
                onDelete={() => deleteQueja(i)} />
            ))}
          </div>}

          {quejas.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 mt-4">
              No hay quejas registradas. Presione <strong>Registrar queja</strong> para agregar una.
            </p>
          )}
        </section>

        <RegistroFotografico
          fotos={fotos}
          onChange={v => setFotos(v)}
        />

      </div>
    </FormWrapper>
  )
}
