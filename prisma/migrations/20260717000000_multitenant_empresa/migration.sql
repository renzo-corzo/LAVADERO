-- ============================================================
-- Multi-tenant: modelo Empresa (tenant) + scoping por empresa
-- Backfill: crea la empresa por defecto y asigna todo lo existente,
-- de modo que una instalación mono-empresa sigue funcionando igual.
-- ============================================================

-- CreateTable: empresas
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "empresas_nombre_key" ON "empresas"("nombre");

-- Empresa por defecto para instalaciones existentes (renombrable desde el panel)
INSERT INTO "empresas" ("id", "nombre", "activo", "createdAt", "updatedAt")
VALUES ('emp_default', 'Mi Lavadero', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------- sucursales ----------
ALTER TABLE "sucursales" ADD COLUMN "empresaId" TEXT;
UPDATE "sucursales" SET "empresaId" = 'emp_default';
ALTER TABLE "sucursales" ALTER COLUMN "empresaId" SET NOT NULL;
DROP INDEX "sucursales_nombre_key";
CREATE UNIQUE INDEX "sucursales_empresaId_nombre_key" ON "sucursales"("empresaId", "nombre");
CREATE INDEX "sucursales_empresaId_idx" ON "sucursales"("empresaId");
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- usuarios (nullable: ADMIN de plataforma sin empresa) ----------
ALTER TABLE "usuarios" ADD COLUMN "empresaId" TEXT;
UPDATE "usuarios" SET "empresaId" = 'emp_default' WHERE "rol" <> 'ADMIN';
CREATE INDEX "usuarios_empresaId_idx" ON "usuarios"("empresaId");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- clientes ----------
ALTER TABLE "clientes" ADD COLUMN "empresaId" TEXT;
UPDATE "clientes" SET "empresaId" = 'emp_default';
ALTER TABLE "clientes" ALTER COLUMN "empresaId" SET NOT NULL;
DROP INDEX "clientes_nombre_key";
CREATE UNIQUE INDEX "clientes_empresaId_nombre_key" ON "clientes"("empresaId", "nombre");
CREATE INDEX "clientes_empresaId_idx" ON "clientes"("empresaId");
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- servicios ----------
ALTER TABLE "servicios" ADD COLUMN "empresaId" TEXT;
UPDATE "servicios" SET "empresaId" = 'emp_default';
ALTER TABLE "servicios" ALTER COLUMN "empresaId" SET NOT NULL;
DROP INDEX "servicios_nombre_key";
CREATE UNIQUE INDEX "servicios_empresaId_nombre_key" ON "servicios"("empresaId", "nombre");
CREATE INDEX "servicios_empresaId_idx" ON "servicios"("empresaId");
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- extras ----------
ALTER TABLE "extras" ADD COLUMN "empresaId" TEXT;
UPDATE "extras" SET "empresaId" = 'emp_default';
ALTER TABLE "extras" ALTER COLUMN "empresaId" SET NOT NULL;
DROP INDEX "extras_nombre_key";
CREATE UNIQUE INDEX "extras_empresaId_nombre_key" ON "extras"("empresaId", "nombre");
CREATE INDEX "extras_empresaId_idx" ON "extras"("empresaId");
ALTER TABLE "extras" ADD CONSTRAINT "extras_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- ordenes_trabajo ----------
ALTER TABLE "ordenes_trabajo" ADD COLUMN "empresaId" TEXT;
UPDATE "ordenes_trabajo" SET "empresaId" = 'emp_default';
ALTER TABLE "ordenes_trabajo" ALTER COLUMN "empresaId" SET NOT NULL;
CREATE INDEX "ordenes_trabajo_empresaId_idx" ON "ordenes_trabajo"("empresaId");
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- cierres_caja ----------
ALTER TABLE "cierres_caja" ADD COLUMN "empresaId" TEXT;
UPDATE "cierres_caja" SET "empresaId" = 'emp_default';
ALTER TABLE "cierres_caja" ALTER COLUMN "empresaId" SET NOT NULL;
CREATE INDEX "cierres_caja_empresaId_idx" ON "cierres_caja"("empresaId");
ALTER TABLE "cierres_caja" ADD CONSTRAINT "cierres_caja_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
