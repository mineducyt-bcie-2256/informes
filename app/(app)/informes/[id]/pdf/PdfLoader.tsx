'use client'
import dynamic from 'next/dynamic'

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p className="text-slate-500 text-sm">Preparando generador de PDF...</p>
    </div>
  ),
})

export default function PdfLoader({ data }: { data: any }) {
  return <PdfViewer data={data} />
}
