'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition print:hidden"
      title="Imprimir dashboard"
    >
      <Printer size={16} />
      Imprimir
    </button>
  )
}
