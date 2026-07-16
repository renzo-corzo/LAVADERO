-- CreateTable: sucursales
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sucursales_nombre_key" ON "sucursales"("nombre");

-- Backfill: sucursal por defecto para instalaciones existentes (una sola sede)
INSERT INTO "sucursales" ("id", "nombre", "activo", "createdAt", "updatedAt")
VALUES ('suc_principal', 'Principal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- usuarios.sucursalId (nullable: ADMIN/DUENO sin sucursal = ven todas)
-- Empleados existentes (ENCARGADO/LAVADOR) quedan en la Principal.
ALTER TABLE "usuarios" ADD COLUMN "sucursalId" TEXT;
UPDATE "usuarios" SET "sucursalId" = 'suc_principal' WHERE "rol" IN ('ENCARGADO', 'LAVADOR');
CREATE INDEX "usuarios_sucursalId_idx" ON "usuarios"("sucursalId");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- servicios.sucursalId (null = compartido entre sucursales)
ALTER TABLE "servicios" ADD COLUMN "sucursalId" TEXT;
CREATE INDEX "servicios_sucursalId_idx" ON "servicios"("sucursalId");
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- extras.sucursalId (null = compartido entre sucursales)
ALTER TABLE "extras" ADD COLUMN "sucursalId" TEXT;
CREATE INDEX "extras_sucursalId_idx" ON "extras"("sucursalId");
ALTER TABLE "extras" ADD CONSTRAINT "extras_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ordenes_trabajo.sucursalId (obligatoria; backfill de OTs existentes a Principal)
ALTER TABLE "ordenes_trabajo" ADD COLUMN "sucursalId" TEXT;
UPDATE "ordenes_trabajo" SET "sucursalId" = 'suc_principal';
ALTER TABLE "ordenes_trabajo" ALTER COLUMN "sucursalId" SET NOT NULL;
CREATE INDEX "ordenes_trabajo_sucursalId_idx" ON "ordenes_trabajo"("sucursalId");
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- cierres_caja.sucursalId (obligatoria; el cierre es por sucursal)
ALTER TABLE "cierres_caja" ADD COLUMN "sucursalId" TEXT;
UPDATE "cierres_caja" SET "sucursalId" = 'suc_principal';
ALTER TABLE "cierres_caja" ALTER COLUMN "sucursalId" SET NOT NULL;
CREATE INDEX "cierres_caja_sucursalId_idx" ON "cierres_caja"("sucursalId");
ALTER TABLE "cierres_caja" ADD CONSTRAINT "cierres_caja_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
