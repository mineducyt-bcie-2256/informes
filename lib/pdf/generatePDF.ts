import ReactPDF from '@react-pdf/renderer'
import PDFDocument from '@/components/PDFDocument'

export async function generatePDF(data: {
  informe: any
  portada: any
  c1317: any
  hsso: any
  garo: any
  pgr: any
  mcear: any
  pppi: any
  maqr: any
  maqrQuejas: any[]
  prt: any
  cct: any
  cumplimientoAmbiental: any
  casosEspeciales: any
}) {
  try {
    // Crear el documento PDF
    const element = PDFDocument(data)

    // Generar como buffer
    const buffer = await ReactPDF.renderToBuffer(element)
    return Buffer.from(buffer)
  } catch (error) {
    console.error('Error generando PDF:', error)
    throw error
  }
}
