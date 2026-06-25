#!/usr/bin/env node
const fs = require('fs');
const XLSX = require('xlsx');

// Leer datos extraídos
const data = JSON.parse(fs.readFileSync('prt-data-mayo.json', 'utf-8'));

// Procesar datos para Excel
const rows = data.map(item => {
  // Parsear modalidad (es un array)
  let modalidad = '';
  let tieneVirtual = false;
  if (Array.isArray(item.modalidad)) {
    modalidad = item.modalidad.join(', ');
    tieneVirtual = item.modalidad.includes('Virtual');
  } else if (typeof item.modalidad === 'string') {
    modalidad = item.modalidad;
    tieneVirtual = item.modalidad.includes('Virtual');
  }

  // Parsear rubros
  let rubros = '';
  let costo_rubros = 0;
  try {
    const rubrosArray = JSON.parse(item.rubros);
    const rubrosActivos = rubrosArray.filter(r => r.activo);
    if (rubrosActivos.length > 0) {
      rubros = rubrosActivos.map(r => `${r.nombre}: $${r.costo_unitario}`).join(', ');
      costo_rubros = rubrosActivos.reduce((sum, r) => sum + (r.costo_unitario * r.cantidad || 0), 0);
    }
  } catch (e) {
    rubros = '';
  }

  const costo_total = (costo_rubros + (item.adecuaciones_costo || 0));

  const rowData = {
    'Código': item.codigo,
    'Centro Educativo': item.centro,
    'Supervisión': item.supervision,
    'Modalidad': modalidad,
    'Sitio de Reubicación': item.sitio_reubicacion,
    'Est. Presencial Niños': item.ninos,
    'Est. Presencial Niñas': item.ninas,
    'Est. Presencial Total': item.total_estudiantes,
    'Doc. Presencial Hombres': item.docentes_hombres,
    'Doc. Presencial Mujeres': item.docentes_mujeres,
    'Doc. Presencial Total': item.total_docentes,
  };

  // Agregar datos de modalidad virtual si aplica
  if (tieneVirtual) {
    rowData['Est. Virtual Niños'] = item.estudiantes_virtual_ninos;
    rowData['Est. Virtual Niñas'] = item.estudiantes_virtual_ninas;
    rowData['Est. Virtual Total'] = (item.estudiantes_virtual_ninos || 0) + (item.estudiantes_virtual_ninas || 0);
    rowData['Doc. Virtual Hombres'] = item.docentes_virtual_hombres;
    rowData['Doc. Virtual Mujeres'] = item.docentes_virtual_mujeres;
    rowData['Doc. Virtual Total'] = (item.docentes_virtual_hombres || 0) + (item.docentes_virtual_mujeres || 0);
  }

  // Agregar resto de datos
  rowData['Condición de Uso'] = item.condicion_uso;
  rowData['Rubros y Costos'] = rubros;
  rowData['Costo Rubros'] = costo_rubros;
  rowData['Adecuaciones Costo'] = item.adecuaciones_costo;
  rowData['Costo Total Reubicación'] = costo_total;

  return rowData;
});

// Crear workbook
const ws = XLSX.utils.json_to_sheet(rows);

// Ajustar ancho de columnas
ws['!cols'] = [
  { wch: 10 },  // Código
  { wch: 35 },  // Centro Educativo
  { wch: 25 },  // Supervisión
  { wch: 25 },  // Modalidad
  { wch: 35 },  // Sitio de Reubicación
  { wch: 18 },  // Est. Presencial Niños
  { wch: 18 },  // Est. Presencial Niñas
  { wch: 18 },  // Est. Presencial Total
  { wch: 20 },  // Doc. Presencial Hombres
  { wch: 20 },  // Doc. Presencial Mujeres
  { wch: 18 },  // Doc. Presencial Total
  { wch: 18 },  // Est. Virtual Niños (solo si aplica)
  { wch: 18 },  // Est. Virtual Niñas (solo si aplica)
  { wch: 18 },  // Est. Virtual Total (solo si aplica)
  { wch: 20 },  // Doc. Virtual Hombres (solo si aplica)
  { wch: 20 },  // Doc. Virtual Mujeres (solo si aplica)
  { wch: 18 },  // Doc. Virtual Total (solo si aplica)
  { wch: 15 },  // Condición de Uso
  { wch: 40 },  // Rubros y Costos
  { wch: 15 },  // Costo Rubros
  { wch: 15 },  // Adecuaciones Costo
  { wch: 20 },  // Costo Total
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'PRT - Mayo');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const filename = `Reporte_PRT_Mayo_${timestamp}.xlsx`;
XLSX.writeFile(wb, filename);
console.log(`✓ Reporte generado: ${filename}`);
console.log(`✓ Total de registros: ${rows.length}`);
console.log(`✓ Columna "Supervisión" incluida`);
