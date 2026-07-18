-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoMovimientoStock" ADD VALUE 'CONSUMO';
ALTER TYPE "TipoMovimientoStock" ADD VALUE 'DEVOLUCION';

-- AlterTable
ALTER TABLE "movimientos_stock" ADD COLUMN     "ordenTrabajoId" TEXT;

-- CreateTable
CREATE TABLE "recetas_insumo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "servicioId" TEXT,
    "extraId" TEXT,
    "productoStockId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_insumo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recetas_insumo_empresaId_idx" ON "recetas_insumo"("empresaId");

-- CreateIndex
CREATE INDEX "recetas_insumo_sucursalId_idx" ON "recetas_insumo"("sucursalId");

-- CreateIndex
CREATE INDEX "recetas_insumo_servicioId_idx" ON "recetas_insumo"("servicioId");

-- CreateIndex
CREATE INDEX "recetas_insumo_extraId_idx" ON "recetas_insumo"("extraId");

-- CreateIndex
CREATE INDEX "recetas_insumo_productoStockId_idx" ON "recetas_insumo"("productoStockId");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_insumo_servicioId_productoStockId_key" ON "recetas_insumo"("servicioId", "productoStockId");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_insumo_extraId_productoStockId_key" ON "recetas_insumo"("extraId", "productoStockId");

-- CreateIndex
CREATE INDEX "movimientos_stock_ordenTrabajoId_idx" ON "movimientos_stock"("ordenTrabajoId");

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_insumo" ADD CONSTRAINT "recetas_insumo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_insumo" ADD CONSTRAINT "recetas_insumo_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_insumo" ADD CONSTRAINT "recetas_insumo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_insumo" ADD CONSTRAINT "recetas_insumo_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "extras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_insumo" ADD CONSTRAINT "recetas_insumo_productoStockId_fkey" FOREIGN KEY ("productoStockId") REFERENCES "productos_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
