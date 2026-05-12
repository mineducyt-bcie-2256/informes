import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Informes BCIE - SCAS',
  description: 'Sistema de informes de condiciones ambientales y sociales',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica el tema guardado antes de que renderice */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e){}
          })();
        `}} />
      </head>
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
