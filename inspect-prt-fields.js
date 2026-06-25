const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://niiogsqmoiendycgxamx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paW9nc3Ftb2llbmR5Y2d4YW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMTg2NSwiZXhwIjoyMDkxNDk3ODY1fQ.FfLezVIBGTLM9Nr86j7MPS6yE7hMG9nQWA-EMMRGf7E'
);

async function inspectData() {
  try {
    // Obtener un informe de mayo
    const { data: informes } = await supabase
      .from('informes')
      .select('id')
      .eq('periodo_mes', 5)
      .limit(1);

    if (!informes || informes.length === 0) {
      console.log('No hay informes de mayo');
      return;
    }

    const informe_id = informes[0].id;

    // Obtener datos PRT completos
    const { data: prtData } = await supabase
      .from('informe_prt')
      .select('*')
      .eq('informe_id', informe_id);

    if (!prtData || prtData.length === 0) {
      console.log('No hay PRT para este informe');
      return;
    }

    console.log('Estructura completa de un registro PRT:\n');
    console.log(JSON.stringify(prtData[0], null, 2));

    // Inspeccionar lugares específicamente
    if (prtData[0].lugares && Array.isArray(prtData[0].lugares)) {
      console.log('\n\nEstructura del primer LUGAR:\n');
      console.log(JSON.stringify(prtData[0].lugares[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectData();
