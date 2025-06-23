-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'RESTAURAR', 'CAMBIO_ESTADO');

-- CreateEnum
CREATE TYPE "TipoEntidad" AS ENUM ('AUTO', 'USUARIO');

-- CreateTable
CREATE TABLE "historial" (
    "id" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "tipoEntidad" "TipoEntidad" NOT NULL,
    "tipoAccion" "TipoAccion" NOT NULL,
    "campoAfectado" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "observaciones" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "historial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_entidadId_tipoEntidad_idx" ON "historial"("entidadId", "tipoEntidad");

-- CreateIndex
CREATE INDEX "historial_tipoAccion_idx" ON "historial"("tipoAccion");

-- CreateIndex
CREATE INDEX "historial_createdAt_idx" ON "historial"("createdAt");
