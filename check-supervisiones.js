const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://niiogsqmoiendycgxamx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paW9nc3Ftb2llbmR5Y2d4YW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMTg2NSwiZXhwIjoyMDkxNDk3ODY1fQ.FfLezVIBGTLM9Nr86j7MPS6yE7hMG9nQWA-EMMRGf7E'
);

async function checkData() {
  try {
    // Obtener una escuela con todos sus campos
    const { data: escuelas } = await supabase
      .from('escuelas')
      .select('*')
      .limit(3);

    console.log('Estructura de escuelas (primeros 3):');
    console.log(JSON.stringify(escuelas, null, 2));

    // Obtener supervisores si existen
    const { data: supervisores } = await supabase
      .from('supervisores')
      .select('*')
      .limit(3);

    console.log('\nEstructura de supervisores (primeros 3):');
    console.log(JSON.stringify(supervisores, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
