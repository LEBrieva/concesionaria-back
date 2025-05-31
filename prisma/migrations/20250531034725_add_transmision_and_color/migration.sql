/*
  Warnings:

  - The `transmision` column on the `Auto` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Transmision" AS ENUM ('MANUAL', 'AUTOMATICA');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('BLANCO', 'NEGRO', 'GRIS', 'ROJO', 'AZUL', 'VERDE', 'AMARILLO', 'OTRO');

-- AlterTable
ALTER TABLE "Auto" ADD COLUMN     "color" "Color" NOT NULL DEFAULT 'BLANCO',
DROP COLUMN "transmision",
ADD COLUMN     "transmision" "Transmision" NOT NULL DEFAULT 'MANUAL';
