/*
  Warnings:

  - The `estado` column on the `Auto` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EstadoAuto" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'POR_INGRESAR');

-- AlterTable
ALTER TABLE "Auto" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoAuto" NOT NULL DEFAULT 'DISPONIBLE';

-- DropEnum
DROP TYPE "Estado";
