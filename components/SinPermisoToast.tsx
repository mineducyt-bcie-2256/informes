'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'

function Toast() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'sin_permiso') {
      setVisible(true)
      // Limpiar el param de la URL sin recargar
      router.replace(pathname, { scroll: false })
      // Auto-dismiss después de 4 segundos
      const t = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  if (!visible) return null

  return (
    <div className="mx-6 mt-4 flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="shrink-0" />
        <span>No tienes permiso para acceder a esa sección.</span>
      </div>
      <button onClick={() => setVisible(false)} className="text-amber-500 hover:text-amber-700">
        <X size={15} />
      </button>
    </div>
  )
}

export default function SinPermisoToast() {
  return <Suspense><Toast /></Suspense>
}
