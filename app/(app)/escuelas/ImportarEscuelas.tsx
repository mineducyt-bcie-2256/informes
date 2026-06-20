'use client'
import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, Sparkles, AlertTriangle, Wrench } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Resultado {
  ok:      number
  err:     number
  creadas: string[]   // columnas nuevas creadas automáticamente
  errores: string[]   // primeros errores de fila
}

export default function ImportarEscuelas() {
  const [open,      setOpen]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [progreso,  setProgreso]  = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function cerrar() {
    setOpen(false)
    setResultado(null)
    setProgreso('')
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    setResultado(null)
    setProgreso('Leyendo archivo Excel...')

    try {
      // 1. Parsear Excel en el cliente
      const buffer = await file.arrayBuffer()
      const wb     = XLSX.read(buffer)
      const ws     = wb.Sheets[wb.SheetNames[0]]
      const rows   = XLSX.utils.sheet_to_json(ws) as Record<string, any>[]

      if (!rows.length) {
        setProgreso('El archivo no tiene filas.')
        setLoading(false)
        return
      }

      setProgreso(`${rows.length} filas detectadas. Enviando al servidor...`)

      // 2. Enviar al API route (server-side con service role)
      const res  = await fetch('/api/import-escuelas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows }),
      })

      const data: Resultado & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setProgreso(`Error: ${data.error ?? 'Error desconocido'}`)
        setLoading(false)
        return
      }

      setResultado(data)
    } catch (ex: any) {
      setProgreso(`Error inesperado: ${ex.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition"
      >
        <Upload size={16} />
        Importar Excel
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <h2 className="font-bold text-lg text-slate-800">Importar escuelas</h2>
              <button onClick={cerrar}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 min-h-0">

              {/* ── Resultado ── */}
              {resultado ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center py-2">
                    <CheckCircle className="text-green-500 mb-2" size={40} />
                    <p className="font-semibold text-slate-700 text-lg">
                      {resultado.ok} escuela{resultado.ok !== 1 ? 's' : ''} importada{resultado.ok !== 1 ? 's' : ''}
                    </p>
                    {resultado.err > 0 && (
                      <p className="text-sm text-red-500 mt-1">{resultado.err} filas con error</p>
                    )}
                  </div>

                  {/* Columnas nuevas detectadas */}
                  {resultado.creadas.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          Columnas nuevas detectadas y creadas automáticamente
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {resultado.creadas.map((c, i) => (
                          <li key={i} className="text-xs text-blue-800 font-mono bg-blue-100 rounded px-2 py-1">
                            ✓ {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Errores de fila */}
                  {resultado.errores.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-600" />
                        <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                          Errores en filas
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {resultado.errores.map((e, i) => (
                          <li key={i} className="text-xs text-red-700 font-mono">{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => { cerrar(); window.location.reload() }}
                    className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800"
                  >
                    Cerrar y actualizar
                  </button>
                </div>

              ) : (
                /* ── Formulario ── */
                <form onSubmit={handleImport} className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Sube el archivo <strong>bdatos_bcie.xlsx</strong>. Las escuelas existentes se actualizan por código.
                    <br />
                    <span className="text-blue-600 font-medium">
                      Las columnas nuevas se agregan automáticamente a la base de datos.
                    </span>
                  </p>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="text-sm text-slate-600"
                      required
                    />
                  </div>

                  {progreso && (
                    <p className="text-xs text-blue-600 animate-pulse text-center">{progreso}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importando...</>
                    ) : (
                      <><Upload size={15} /> Importar</>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
