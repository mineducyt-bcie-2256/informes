'use client'

import React from 'react'

export function ReubicacionCard({ modalidad, color, borderColor, textColor, iconColor, count, centros }: {
  modalidad: string
  color: string
  borderColor: string
  textColor: string
  iconColor: string
  count: number
  centros: string[]
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`rounded-2xl p-6 flex flex-col items-center gap-4 border-2 transition-all hover:shadow-lg ${color} ${borderColor} cursor-pointer`}
      >
        <p className={`text-4xl font-black ${textColor}`}>{count}</p>
        <div className="text-center">
          <p className={`text-sm font-bold ${textColor}`}>{modalidad}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {count === 1 ? 'centro educativo' : 'centros educativos'}
          </p>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${color}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${textColor}`}>{modalidad}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xl font-bold hover:opacity-70"
                  style={{ color: 'var(--foreground)' }}
                >
                  ✕
                </button>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {count} {count === 1 ? 'centro educativo' : 'centros educativos'} con modalidad {modalidad}
              </p>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {centros.length > 0 ? (
                <div className="space-y-2">
                  {centros.map((centro, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                      style={{ background: 'var(--card-bg)' }}
                    >
                      <span className={`text-sm font-bold mt-0.5 ${textColor}`}>{idx + 1}.</span>
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{centro}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
                  Sin centros en esta modalidad
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700">
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
