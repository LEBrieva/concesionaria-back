/*
  Warnings:

  - A unique constraint covering the columns `[matricula]` on the table `Auto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `año` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costo` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kilometraje` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matricula` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observaciones` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmision` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `estado` on the `Auto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Auto" ADD COLUMN     "año" INTEGER NOT NULL,
ADD COLUMN     "caracteristicasGenerales" TEXT[],
ADD COLUMN     "confort" TEXT[],
ADD COLUMN     "costo" INTEGER NOT NULL,
ADD COLUMN     "descripcion" TEXT NOT NULL,
ADD COLUMN     "entretenimiento" TEXT[],
ADD COLUMN     "equipamientoDestacado" TEXT[],
ADD COLUMN     "exterior" TEXT[],
ADD COLUMN     "imagenes" TEXT[],
ADD COLUMN     "interior" TEXT[],
ADD COLUMN     "kilometraje" INTEGER NOT NULL,
ADD COLUMN     "matricula" TEXT NOT NULL,
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "observaciones" TEXT NOT NULL,
ADD COLUMN     "seguridad" TEXT[],
ADD COLUMN     "transmision" TEXT NOT NULL,
ADD COLUMN     "version" TEXT NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Auto_matricula_key" ON "Auto"("matricula");
