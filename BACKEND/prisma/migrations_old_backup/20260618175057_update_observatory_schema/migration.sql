/*
  Warnings:

  - You are about to drop the column `admission` on the `observatories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "observatories" DROP COLUMN "admission",
ADD COLUMN     "admissionFee" DOUBLE PRECISION,
ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "currency" TEXT DEFAULT 'VND',
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lightPollutionScore" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skyQualityScore" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "observatories_city_idx" ON "observatories"("city");

-- CreateIndex
CREATE INDEX "observatories_country_idx" ON "observatories"("country");
