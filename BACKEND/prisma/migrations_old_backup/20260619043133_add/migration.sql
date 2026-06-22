-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntentType" ADD VALUE 'NEWS';
ALTER TYPE "IntentType" ADD VALUE 'GUIDE';
ALTER TYPE "IntentType" ADD VALUE 'IMAGE_RECOGNITION';
ALTER TYPE "IntentType" ADD VALUE 'FAVORITE';
