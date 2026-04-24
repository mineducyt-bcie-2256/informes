'use client'
import { useRef, useState } from 'react'
import { Camera, Trash2, Upload, Loader2 } from 'lucide-react'

export interface Foto {
  id: string
  url: string
  descripcion: string
}

interface Props {
  fotos: Foto[]
  onChange: (fotos: Foto[]) => void
}

const CLOUD     = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const PRESET    = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
const MAX_FOTOS = 20
const MAX_PX    = 1600   // ancho/alto máximo en píxeles
const QUALITY   = 0.80   // calidad JPEG (0–1)

/** Comprime una imagen usando Canvas antes de subir */
function comprimirImagen(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      // Escalar manteniendo proporción si supera MAX_PX
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else                  { width  = Math.round(width  * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', QUALITY)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function RegistroFotografico({ fotos, onChange }: Props) {
  const [subiendo, setSubiendo]   = useState(false)
  const [progreso, setProgreso]   = useState('')
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (fotos.length + files.length > MAX_FOTOS) {
      setError(`Máximo ${MAX_FOTOS} fotos por formulario.`)
      return
    }
    setError('')
    setSubiendo(true)

    const nuevas: Foto[] = []
    const total = files.length
    for (let idx = 0; idx < total; idx++) {
      const file = files[idx]
      setProgreso(`${idx + 1} / ${total}`)
      try {
        const blob = await comprimirImagen(file)
        const fd = new FormData()
        fd.append('file', blob, file.name.replace(/\.[^.]+$/, '.jpg'))
        fd.append('upload_preset', PRESET)
        fd.append('folder', 'informes')

        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
          method: 'POST', body: fd,
        })
        const json = await res.json()
        if (json.secure_url) {
          nuevas.push({ id: crypto.randomUUID(), url: json.secure_url, descripcion: '' })
        }
      } catch {
        // Si falla la compresión sube el original
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', PRESET)
        fd.append('folder', 'informes')
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd })
        const json = await res.json()
        if (json.secure_url) nuevas.push({ id: crypto.randomUUID(), url: json.secure_url, descripcion: '' })
      }
    }

    onChange([...fotos, ...nuevas])
    setSubiendo(false)
    setProgreso('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function updateDesc(id: string, descripcion: string) {
    onChange(fotos.map(f => f.id === id ? { ...f, descripcion } : f))
  }

  function eliminar(id: string) {
    onChange(fotos.filter(f => f.id !== id))
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <Camera size={14} /> Registro Fotográfico
      </h3>

      {/* Botón subir */}
      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={subiendo || fotos.length >= MAX_FOTOS}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
        >
          {subiendo
            ? <><Loader2 size={15} className="animate-spin" /> Subiendo{progreso ? ` ${progreso}` : ''}...</>
            : <><Upload size={15} /> Agregar fotografías</>
          }
        </button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <p className="text-xs text-slate-400 mt-1">{fotos.length}/{MAX_FOTOS} fotos · Puedes seleccionar varias a la vez</p>
      </div>

      {/* Grid de fotos */}
      {fotos.length === 0 ? (
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer hover:border-blue-300 hover:text-blue-400 transition"
          onClick={() => fileRef.current?.click()}
        >
          <Camera size={28} className="text-slate-300" />
          <p className="text-sm">Sin fotografías. Haz clic para agregar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map(foto => (
            <div key={foto.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {/* Imagen */}
              <div className="relative group">
                <img
                  src={foto.url}
                  alt={foto.descripcion || 'Fotografía'}
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => eliminar(foto.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  title="Eliminar foto"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {/* Descripción */}
              <div className="p-2">
                <input
                  type="text"
                  value={foto.descripcion}
                  onChange={e => updateDesc(foto.id, e.target.value)}
                  placeholder="Descripción de la foto..."
                  maxLength={120}
                  className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
