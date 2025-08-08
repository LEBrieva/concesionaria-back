-- CreateEnum
CREATE TYPE "TipoAuto" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'PICKUP', 'WAGON', 'CROSSOVER', 'OTRO');

-- CreateEnum
CREATE TYPE "PreferenciaContacto" AS ENUM ('EMAIL', 'TELEFONO', 'WHATSAPP', 'NO_CONTACTAR');

-- AlterEnum
ALTER TYPE "TipoEntidad" ADD VALUE 'CLIENTE';

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "password" TEXT,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "tokenVerificacion" TEXT,
    "rangoPresupuestoMin" INTEGER,
    "rangoPresupuestoMax" INTEGER,
    "marcasInteres" "Marca"[],
    "tipoAutoInteres" "TipoAuto"[],
    "suscritoNewsletter" BOOLEAN NOT NULL DEFAULT false,
    "aceptaMarketing" BOOLEAN NOT NULL DEFAULT false,
    "preferenciaContacto" "PreferenciaContacto" NOT NULL DEFAULT 'EMAIL',
    "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVistasAutos" INTEGER NOT NULL DEFAULT 0,
    "totalClicksAutos" INTEGER NOT NULL DEFAULT 0,
    "totalConsultas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");
