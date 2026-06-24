-- Verificar RLS en informe_casos_especiales
SELECT 
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'informe_casos_especiales') as num_policies
FROM pg_tables 
WHERE tablename = 'informe_casos_especiales';

-- Ver políticas RLS existentes
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'informe_casos_especiales';
