-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DUENO', 'ENCARGADO', 'LAVADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "OTEstado" AS ENUM ('EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('chico', 'mediano', 'camioneta');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "ComisionEstado" AS ENUM ('PENDIENTE', 'LIQUIDADA');

-- CreateEnum
CREATE TYPE "ComisionModelo" AS ENUM ('POR_ITEM', 'POR_OT');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('CONCESIONARIA', 'WALK_IN');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL,
    "clienteId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "duracionEstimada" INTEGER,
    "tipoVehiculo" "TipoVehiculo",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extras" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "duracionEstimada" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'WALK_IN',
    "telefono" TEXT,
    "email" TEXT,
    "descuentoPorcentaje" DOUBLE PRECISION,
    "trabajoExterno" BOOLEAN NOT NULL DEFAULT false,
    "usaMontosFijos" BOOLEAN NOT NULL DEFAULT false,
    "montosFijosServicios" JSONB,
    "montosFijosExtras" JSONB,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patente" TEXT NOT NULL,
    "tipoVehiculo" "TipoVehiculo",
    "descripcionVehiculo" TEXT,
    "nombreCliente" TEXT,
    "telefonoCliente" TEXT,
    "horarioDeseado" TIMESTAMP(3),
    "esExterna" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" TEXT,
    "servicioId" TEXT NOT NULL,
    "observaciones" TEXT,
    "estado" "OTEstado" NOT NULL DEFAULT 'EN_COLA',
    "total" DECIMAL(12,2) NOT NULL,
    "precioAjustado" DECIMAL(12,2),
    "justificacionPrecio" TEXT,
    "usuarioCreadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_trabajo_empleados" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,

    CONSTRAINT "orden_trabajo_empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_trabajo_extras" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,

    CONSTRAINT "orden_trabajo_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_historial" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "estadoAnterior" "OTEstado" NOT NULL,
    "estadoNuevo" "OTEstado" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estado_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "medioPago" "MedioPago" NOT NULL,
    "referencia" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_caja" (
    "id" TEXT NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEfectivo" DECIMAL(12,2) NOT NULL,
    "totalTransferencia" DECIMAL(12,2) NOT NULL,
    "totalGeneral" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cierres_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierre_caja_ots" (
    "id" TEXT NOT NULL,
    "cierreCajaId" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,

    CONSTRAINT "cierre_caja_ots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comisiones" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "estado" "ComisionEstado" NOT NULL DEFAULT 'PENDIENTE',
    "fechaGeneracion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLiquidacion" TIMESTAMP(3),
    "usuarioLiquidacionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_comisiones" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "modelo" "ComisionModelo" NOT NULL DEFAULT 'POR_ITEM',
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "porcentajePorServicio" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_comision" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3) NOT NULL,
    "fechaLiquidacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidaciones_comision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidacion_comision_comisiones" (
    "id" TEXT NOT NULL,
    "liquidacionId" TEXT NOT NULL,
    "comisionId" TEXT NOT NULL,

    CONSTRAINT "liquidacion_comision_comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "datos" TEXT NOT NULL,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE INDEX "usuarios_clienteId_idx" ON "usuarios"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "extras_nombre_key" ON "extras"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "clientes_tipo_idx" ON "clientes"("tipo");

-- CreateIndex
CREATE INDEX "clientes_activo_idx" ON "clientes"("activo");

-- CreateIndex
CREATE INDEX "clientes_prioridad_idx" ON "clientes"("prioridad");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_estado_idx" ON "ordenes_trabajo"("estado");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_fechaIngreso_idx" ON "ordenes_trabajo"("fechaIngreso");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_usuarioCreadorId_idx" ON "ordenes_trabajo"("usuarioCreadorId");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_clienteId_idx" ON "ordenes_trabajo"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "orden_trabajo_empleados_ordenTrabajoId_empleadoId_key" ON "orden_trabajo_empleados"("ordenTrabajoId", "empleadoId");

-- CreateIndex
CREATE UNIQUE INDEX "orden_trabajo_extras_ordenTrabajoId_extraId_key" ON "orden_trabajo_extras"("ordenTrabajoId", "extraId");

-- CreateIndex
CREATE INDEX "estado_historial_ordenTrabajoId_idx" ON "estado_historial"("ordenTrabajoId");

-- CreateIndex
CREATE INDEX "estado_historial_fechaHora_idx" ON "estado_historial"("fechaHora");

-- CreateIndex
CREATE INDEX "pagos_ordenTrabajoId_idx" ON "pagos"("ordenTrabajoId");

-- CreateIndex
CREATE INDEX "pagos_fechaHora_idx" ON "pagos"("fechaHora");

-- CreateIndex
CREATE INDEX "pagos_medioPago_idx" ON "pagos"("medioPago");

-- CreateIndex
CREATE INDEX "cierres_caja_fechaCierre_idx" ON "cierres_caja"("fechaCierre");

-- CreateIndex
CREATE INDEX "cierres_caja_usuarioId_idx" ON "cierres_caja"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "cierre_caja_ots_cierreCajaId_ordenTrabajoId_key" ON "cierre_caja_ots"("cierreCajaId", "ordenTrabajoId");

-- CreateIndex
CREATE INDEX "comisiones_empleadoId_idx" ON "comisiones"("empleadoId");

-- CreateIndex
CREATE INDEX "comisiones_estado_idx" ON "comisiones"("estado");

-- CreateIndex
CREATE INDEX "comisiones_fechaGeneracion_idx" ON "comisiones"("fechaGeneracion");

-- CreateIndex
CREATE UNIQUE INDEX "config_comisiones_empleadoId_key" ON "config_comisiones"("empleadoId");

-- CreateIndex
CREATE INDEX "liquidaciones_comision_empleadoId_idx" ON "liquidaciones_comision"("empleadoId");

-- CreateIndex
CREATE INDEX "liquidaciones_comision_fechaLiquidacion_idx" ON "liquidaciones_comision"("fechaLiquidacion");

-- CreateIndex
CREATE UNIQUE INDEX "liquidacion_comision_comisiones_liquidacionId_comisionId_key" ON "liquidacion_comision_comisiones"("liquidacionId", "comisionId");

-- CreateIndex
CREATE INDEX "auditoria_logs_fechaHora_idx" ON "auditoria_logs"("fechaHora");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuarioId_idx" ON "auditoria_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_logs_entidad_entidadId_idx" ON "auditoria_logs"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_trabajo_empleados" ADD CONSTRAINT "orden_trabajo_empleados_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_trabajo_empleados" ADD CONSTRAINT "orden_trabajo_empleados_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_trabajo_extras" ADD CONSTRAINT "orden_trabajo_extras_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_trabajo_extras" ADD CONSTRAINT "orden_trabajo_extras_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "extras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_caja" ADD CONSTRAINT "cierres_caja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierre_caja_ots" ADD CONSTRAINT "cierre_caja_ots_cierreCajaId_fkey" FOREIGN KEY ("cierreCajaId") REFERENCES "cierres_caja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierre_caja_ots" ADD CONSTRAINT "cierre_caja_ots_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_comisiones" ADD CONSTRAINT "config_comisiones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_comision" ADD CONSTRAINT "liquidaciones_comision_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_comision" ADD CONSTRAINT "liquidaciones_comision_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidacion_comision_comisiones" ADD CONSTRAINT "liquidacion_comision_comisiones_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "liquidaciones_comision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidacion_comision_comisiones" ADD CONSTRAINT "liquidacion_comision_comisiones_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

