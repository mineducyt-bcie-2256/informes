'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

export function PendientesModal({
  escuelas,
  ceConInforme,
  mes,
  pendientes,
  MESES
}: {
  escuelas: any[]
  ceConInforme: Set<number>
  mes: string
  pendientes: number
  MESES: string[]
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Escuelas que NO tienen informe
  const escuelasPendientes = escuelas.filter(esc => !ceConInforme.has(esc.id))

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white rounded-lg border border-red-200 p-4 cursor-pointer hover:shadow-md hover:border-red-300 transition-all w-full"
      >
        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Pendientes Enviar</p>
        <p className="text-2xl font-bold text-red-600">{pendientes}</p>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-red-700">Centros Educativos Pendientes</h3>
                    <p className="text-sm text-red-600 mt-1">{pendientes} escuelas sin informe {mes ? `en ${MESES[parseInt(mes) - 1]}` : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xl font-bold hover:opacity-70"
                  style={{ color: 'var(--foreground)' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {escuelasPendientes.length > 0 ? (
                <div className="space-y-2">
                  {escuelasPendientes.map((esc, idx) => (
                    <div
                      key={esc.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border border-red-100"
                    >
                      <span className="text-sm font-bold text-red-600 mt-0.5 min-w-6">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800">{esc.nombre}</p>
                        <p className="text-xs text-slate-500">Código: {esc.codigo} | Grupo: G{esc.grupos?.numero || '?'}</p>
                        <p className="text-xs text-slate-500">Supervisión: {esc.empresa_supervision}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-slate-500">
                  ¡Excelente! Todos los centros educativos han presentado su informe.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
