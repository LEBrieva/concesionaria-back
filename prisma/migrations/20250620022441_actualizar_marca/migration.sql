/*
  Warnings:

  - Changed the type of `marca` on the `Auto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Marca" AS ENUM ('TOYOTA', 'HONDA', 'FORD', 'CHEVROLET', 'NISSAN', 'HYUNDAI', 'KIA', 'MAZDA', 'SUBARU', 'MITSUBISHI', 'SUZUKI', 'VOLKSWAGEN', 'BMW', 'MERCEDES_BENZ', 'AUDI', 'LEXUS', 'ACURA', 'INFINITI', 'VOLVO', 'JEEP', 'DODGE', 'CHRYSLER', 'CADILLAC', 'BUICK', 'GMC', 'LINCOLN', 'JAGUAR', 'LAND_ROVER', 'PORSCHE', 'FERRARI', 'LAMBORGHINI', 'MASERATI', 'BENTLEY', 'ROLLS_ROYCE', 'TESLA', 'PEUGEOT', 'RENAULT', 'CITROEN', 'FIAT', 'ALFA_ROMEO', 'SKODA', 'SEAT', 'OPEL', 'MINI', 'SMART', 'OTRO');

-- AlterTable
ALTER TABLE "Auto" DROP COLUMN "marca",
ADD COLUMN     "marca" "Marca" NOT NULL;
