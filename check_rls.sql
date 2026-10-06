-- Revisar políticas RLS en informe_cct
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'informe_cct'
ORDER BY policyname;
