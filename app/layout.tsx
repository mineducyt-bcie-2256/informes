import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Informes BCIE - SCAS',
  description: 'Sistema de informes de condiciones ambientales y sociales',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
