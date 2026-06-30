'use client'
import { useState } from 'react'
import { Download, Filter } from 'lucide-react'
import DescargarLoteModal from '@/components/descargar-lote/DescargarLoteModal'

export default function DescargarLotePage() {
  const [showModal, setShowModal] = useState(true)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Download size={32} />
            <h1 className="text-4xl font-bold">Descargar Informes en Lote</h1>
          </div>
          <p className="text-green-100">Descarga múltiples informes aprobados en un archivo ZIP</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <Filter size={48} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold mb-2">Selecciona tus filtros</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Elige si quieres descargar todos los informes, por período específico o por supervisión
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2"
          >
            <Download size={18} />
            Abrir Descargador
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-bold mb-2">Formato ZIP</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Todos los PDFs comprimidos en un único archivo
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-bold mb-2">Solo Aprobados</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Se descargan únicamente los informes en estado aprobado
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold mb-2">Filtros Flexibles</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Por período, supervisión o descarga todo de una vez
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <DescargarLoteModal isOpen={showModal} setIsOpen={setShowModal} />}
    </div>
  )
}
