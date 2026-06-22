/*
  Warnings:

  - You are about to drop the column `admissionFee` on the `observatories` table. All the data in the column will be lost.
  - You are about to drop the column `altitude` on the `observatories` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `observatories` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `observatories` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `observatories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `observatories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `province` to the `observatories` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `observatories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `observatories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `observatories` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ObservatoryType" AS ENUM ('PUBLIC', 'PRIVATE', 'UNIVERSITY');

-- DropIndex
DROP INDEX "observatories_city_idx";

-- DropIndex
DROP INDEX "observatories_country_idx";

-- AlterTable
ALTER TABLE "observatories" DROP COLUMN "admissionFee",
DROP COLUMN "altitude",
DROP COLUMN "currency",
DROP COLUMN "isPublic",
DROP COLUMN "state",
ADD COLUMN     "elevation" DOUBLE PRECISION,
ADD COLUMN     "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "type" "ObservatoryType" NOT NULL DEFAULT 'PUBLIC',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'Vietnam';

-- CreateIndex
CREATE UNIQUE INDEX "observatories_name_key" ON "observatories"("name");

-- CreateIndex
CREATE INDEX "observatories_province_idx" ON "observatories"("province");

-- CreateIndex
CREATE INDEX "saved_observatories_userId_idx" ON "saved_observatories"("userId");

-- CreateIndex
CREATE INDEX "saved_observatories_observatoryId_idx" ON "saved_observatories"("observatoryId");
