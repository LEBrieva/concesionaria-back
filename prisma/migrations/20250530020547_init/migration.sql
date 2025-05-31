-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'POR_INGRESAR');

-- CreateTable
CREATE TABLE "Auto" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auto_pkey" PRIMARY KEY ("id")
);
