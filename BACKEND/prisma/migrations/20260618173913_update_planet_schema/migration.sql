/*
  Warnings:

  - You are about to drop the column `distanceFromEarthLy` on the `planets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "planets" DROP COLUMN "distanceFromEarthLy",
ADD COLUMN     "distanceFromEarthKm" DOUBLE PRECISION;
