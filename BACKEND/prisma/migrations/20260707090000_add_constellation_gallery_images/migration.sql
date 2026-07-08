CREATE TABLE "constellation_images" (
    "id" TEXT NOT NULL,
    "constellationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "source" TEXT,
    "license" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "constellation_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "constellation_images_constellationId_url_key" ON "constellation_images"("constellationId", "url");
CREATE INDEX "constellation_images_constellationId_sortOrder_idx" ON "constellation_images"("constellationId", "sortOrder");

ALTER TABLE "constellation_images"
ADD CONSTRAINT "constellation_images_constellationId_fkey"
FOREIGN KEY ("constellationId") REFERENCES "constellations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
