-- ============================================================
-- ROLLBACK de la migración 20260719120000_catalogo_por_sucursal
--
-- Deshace el catálogo por sucursal: vuelve todos los servicios/extras a
-- "compartidos" (sucursalId NULL) y restaura el índice único por empresa.
--
-- ⚠️ Solo usar si hay que volver atrás. Requiere que NO existan dos ítems
-- con el mismo nombre en la misma empresa (si Gastón ya cargó el catálogo
-- de la sucursal nueva con nombres repetidos, primero hay que resolverlos
-- o restaurar directamente el backup).
--
-- Uso:
--   psql "<DATABASE_URL>" -f este_archivo.sql
-- ============================================================

BEGIN;

-- Chequeo previo: si hay nombres repetidos por empresa, aborta con error.
DO $$
DECLARE dup_count INT;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT "empresaId", "nombre" FROM "servicios" GROUP BY 1,2 HAVING COUNT(*) > 1
  ) t;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Hay % nombre(s) de servicio repetidos por empresa. Resolvelos o restaurá el backup.', dup_count;
  END IF;

  SELECT COUNT(*) INTO dup_count FROM (
    SELECT "empresaId", "nombre" FROM "extras" GROUP BY 1,2 HAVING COUNT(*) > 1
  ) t;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Hay % nombre(s) de extra repetidos por empresa. Resolvelos o restaurá el backup.', dup_count;
  END IF;
END $$;

-- ---------- servicios ----------
DROP INDEX IF EXISTS "servicios_empresaId_sucursalId_nombre_key";
UPDATE "servicios" SET "sucursalId" = NULL;
CREATE UNIQUE INDEX "servicios_empresaId_nombre_key" ON "servicios"("empresaId", "nombre");

-- ---------- extras ----------
DROP INDEX IF EXISTS "extras_empresaId_sucursalId_nombre_key";
UPDATE "extras" SET "sucursalId" = NULL;
CREATE UNIQUE INDEX "extras_empresaId_nombre_key" ON "extras"("empresaId", "nombre");

-- Marcar la migración como no aplicada para que Prisma la vuelva a correr
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260719120000_catalogo_por_sucursal';

COMMIT;
