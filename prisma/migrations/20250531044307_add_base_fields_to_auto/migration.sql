/*
  Warnings:

  - Added the required column `createdBy` to the `Auto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Auto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Auto" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;
