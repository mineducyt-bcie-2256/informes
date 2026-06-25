#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://niiogsqmoiendycgxamx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paW9nc3Ftb2llbmR5Y2d4YW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMTg2NSwiZXhwIjoyMDkxNDk3ODY1fQ.FfLezVIBGTLM9Nr86j7MPS6yE7hMG9nQWA-EMMRGf7E'
);

async function extractPRTData() {
  try {
    console.log('Extrayendo datos de PRT para mayo...\n');

    // 1. Obtener informes de mayo (periodo_mes = 5)
    const { data: informes, error: infError } = await supabase
      .from('informes')
      .select('id, periodo_mes, escuela_id, escuelas(codigo, nombre)')
      .eq('periodo_mes', 5);

    if (infError) throw infError;
    console.log(`✓ Encontrados ${informes.length} informes para mayo\n`);

    if (informes.length === 0) {
      console.log('No hay informes para mayo');
      return;
    }

    // 2. Obtener todas las escuelas para mapear empresa de supervisión
    const { data: allEscuelas, error: escError } = await supabase
      .from('escuelas')
      .select('id, empresa_supervision');

    if (escError) console.log('⚠️ Error al obtener escuelas:', escError.message);

    const escuelaMap = {};
    if (allEscuelas) {
      allEscuelas.forEach(esc => {
        escuelaMap[esc.id] = esc.empresa_supervision;
      });
    }

    // 3. Obtener datos PRT para estos informes (completos)
    const informe_ids = informes.map(i => i.id);
    const { data: prtData, error: prtError } = await supabase
      .from('informe_prt')
      .select('*')
      .in('informe_id', informe_ids);

    if (prtError) throw prtError;
    console.log(`✓ Encontrados ${prtData.length} registros PRT\n`);

    // 4. Combinar datos y procesar
    const resultado = [];

    for (const informe of informes) {
      const prt = prtData.find(p => p.informe_id === informe.id);
      const empresaSupervision = escuelaMap[informe.escuela_id] || '';

      if (prt && prt.lugares && Array.isArray(prt.lugares) && prt.lugares.length > 0) {
        for (const lugar of prt.lugares) {
          // Datos de modalidad virtual (desde el objeto virtual de PRT)
          const datosVirtual = prt.virtual || {};
          const estudiantes_virtual_ninos = datosVirtual.est_ninos || 0;
          const estudiantes_virtual_ninas = datosVirtual.est_ninas || 0;
          const docentes_virtual_hombres = datosVirtual.doc_hombres || 0;
          const docentes_virtual_mujeres = datosVirtual.doc_mujeres || 0;

          resultado.push({
            codigo: informe.escuelas?.codigo || '',
            centro: informe.escuelas?.nombre || '',
            supervision: empresaSupervision,
            modalidad: prt.modalidad || '',
            sitio_reubicacion: lugar.direccion || lugar.nombre || '',
            ninos: lugar.est_ninos || 0,
            ninas: lugar.est_ninas || 0,
            total_estudiantes: (lugar.est_ninos || 0) + (lugar.est_ninas || 0),
            docentes_hombres: lugar.doc_hombres || 0,
            docentes_mujeres: lugar.doc_mujeres || 0,
            total_docentes: (lugar.doc_hombres || 0) + (lugar.doc_mujeres || 0),
            condicion_uso: lugar.condicion_uso || '',
            // Datos de modalidad virtual
            estudiantes_virtual_ninos: estudiantes_virtual_ninos,
            estudiantes_virtual_ninas: estudiantes_virtual_ninas,
            docentes_virtual_hombres: docentes_virtual_hombres,
            docentes_virtual_mujeres: docentes_virtual_mujeres,
            rubros: lugar.rubros ? JSON.stringify(lugar.rubros) : '',
            adecuaciones_costo: lugar.adec_costo || 0,
          });
        }
      }
    }

    console.log(`✓ Total de filas procesadas: ${resultado.length}\n`);
    console.log('Primeros datos extraídos (con datos virtuales):');
    console.log(JSON.stringify(resultado.slice(0, 1), null, 2));

    // Guardar a JSON
    const fs = require('fs');
    fs.writeFileSync('prt-data-mayo.json', JSON.stringify(resultado, null, 2));
    console.log(`\n✓ Datos guardados en prt-data-mayo.json`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extractPRTData();
