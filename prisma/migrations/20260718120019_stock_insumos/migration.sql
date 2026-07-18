-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateTable
CREATE TABLE "productos_stock" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'unidad',
    "stockActual" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "costoUnitario" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(12,2),
    "motivo" TEXT,
    "usuarioId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productos_stock_empresaId_idx" ON "productos_stock"("empresaId");

-- CreateIndex
CREATE INDEX "productos_stock_sucursalId_idx" ON "productos_stock"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "productos_stock_sucursalId_nombre_key" ON "productos_stock"("sucursalId", "nombre");

-- CreateIndex
CREATE INDEX "movimientos_stock_empresaId_idx" ON "movimientos_stock"("empresaId");

-- CreateIndex
CREATE INDEX "movimientos_stock_sucursalId_idx" ON "movimientos_stock"("sucursalId");

-- CreateIndex
CREATE INDEX "movimientos_stock_productoId_idx" ON "movimientos_stock"("productoId");

-- CreateIndex
CREATE INDEX "movimientos_stock_fechaHora_idx" ON "movimientos_stock"("fechaHora");

-- AddForeignKey
ALTER TABLE "productos_stock" ADD CONSTRAINT "productos_stock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_stock" ADD CONSTRAINT "productos_stock_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
