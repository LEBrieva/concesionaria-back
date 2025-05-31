/*
  Warnings:

  - You are about to drop the column `año` on the `Auto` table. All the data in the column will be lost.
  - Added the required column `ano` to the `Auto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Auto" DROP COLUMN "año",
ADD COLUMN     "ano" INTEGER NOT NULL;
