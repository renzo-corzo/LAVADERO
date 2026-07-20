-- ============================================================
-- Catálogo por sucursal
-- El nombre de un servicio/extra pasa a ser único POR SUCURSAL (o una vez
-- como "compartido", con sucursalId NULL). Así una empresa puede tener el
-- mismo servicio en dos sedes con precio propio.
--
-- Backfill: los servicios/extras existentes (hoy con sucursalId NULL) se
-- asignan a la sucursal ORIGINAL de su empresa (la más antigua), de modo que
-- una sucursal nueva arranque con el catálogo vacío.
-- ============================================================

-- ---------- servicios ----------
DROP INDEX "servicios_empresaId_nombre_key";

UPDATE "servicios" s
SET "sucursalId" = (
    SELECT x."id" FROM "sucursales" x
    WHERE x."empresaId" = s."empresaId"
    ORDER BY x."createdAt" ASC, x."id" ASC
    LIMIT 1
)
WHERE s."sucursalId" IS NULL;

CREATE UNIQUE INDEX "servicios_empresaId_sucursalId_nombre_key"
    ON "servicios"("empresaId", "sucursalId", "nombre");

-- ---------- extras ----------
DROP INDEX "extras_empresaId_nombre_key";

UPDATE "extras" e
SET "sucursalId" = (
    SELECT x."id" FROM "sucursales" x
    WHERE x."empresaId" = e."empresaId"
    ORDER BY x."createdAt" ASC, x."id" ASC
    LIMIT 1
)
WHERE e."sucursalId" IS NULL;

CREATE UNIQUE INDEX "extras_empresaId_sucursalId_nombre_key"
    ON "extras"("empresaId", "sucursalId", "nombre");
