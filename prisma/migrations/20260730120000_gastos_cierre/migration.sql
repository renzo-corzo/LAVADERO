-- ============================================================
-- Gastos de caja en el cierre
-- Permite registrar salidas de efectivo (insumos, adelantos, retiros…) al
-- cerrar la caja. El neto del cierre = ingresos − gastos.
-- Migración aditiva: agrega una columna y una tabla nueva; no toca datos.
-- ============================================================

-- Total de gastos del cierre (materializado; los cierres previos quedan en 0)
ALTER TABLE "cierres_caja" ADD COLUMN "totalGastos" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Detalle de cada gasto del cierre
CREATE TABLE "gastos_cierre" (
    "id" TEXT NOT NULL,
    "cierreCajaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_cierre_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gastos_cierre_cierreCajaId_idx" ON "gastos_cierre"("cierreCajaId");

ALTER TABLE "gastos_cierre" ADD CONSTRAINT "gastos_cierre_cierreCajaId_fkey"
    FOREIGN KEY ("cierreCajaId") REFERENCES "cierres_caja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
