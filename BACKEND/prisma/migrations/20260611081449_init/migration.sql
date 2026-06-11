-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('LOCAL', 'GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "IntentType" AS ENUM ('PLANET_INFO', 'CONSTELLATION_INFO', 'STARGAZING_RECOMMENDATION', 'WEATHER_CHECK', 'OBSERVATORY_SEARCH', 'GENERAL_ASTRONOMY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('SPACE_EXPLORATION', 'SOLAR_SYSTEM', 'DEEP_SPACE', 'TECHNOLOGY', 'GENERAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('METEOR_SHOWER', 'ECLIPSE', 'PLANET_OPPOSITION', 'CONJUNCTION', 'SUPERMOON', 'COMET', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalyticsEvent" AS ENUM ('PAGE_VIEW', 'PLANET_VIEW', 'CONSTELLATION_VIEW', 'CHATBOT_MESSAGE', 'NEWS_VIEW', 'RECOMMENDATION_REQUEST', 'OBSERVATORY_VIEW', 'IMAGE_UPLOAD', 'SEARCH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "provider" "Provider" NOT NULL DEFAULT 'LOCAL',
    "providerId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT DEFAULT 'UTC',
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoritesPlanets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favoritesConstellations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceLevel" TEXT NOT NULL DEFAULT 'beginner',
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "temperatureUnit" TEXT NOT NULL DEFAULT 'celsius',
    "distanceUnit" TEXT NOT NULL DEFAULT 'km',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "massKg" DOUBLE PRECISION,
    "diameterKm" DOUBLE PRECISION,
    "gravityMs2" DOUBLE PRECISION,
    "distanceFromSunAu" DOUBLE PRECISION,
    "distanceFromEarthLy" DOUBLE PRECISION,
    "orbitalPeriodDays" DOUBLE PRECISION,
    "rotationPeriodHours" DOUBLE PRECISION,
    "avgTempCelsius" DOUBLE PRECISION,
    "atmosphere" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "numberOfMoons" INTEGER DEFAULT 0,
    "hasRings" BOOLEAN NOT NULL DEFAULT false,
    "discoveredBy" TEXT,
    "discoveryYear" INTEGER,
    "aiFunFacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constellations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latinName" TEXT,
    "abbreviation" TEXT,
    "description" TEXT NOT NULL,
    "mythology" TEXT,
    "imageUrl" TEXT,
    "mapImageUrl" TEXT,
    "bestMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "hemisphere" TEXT,
    "rightAscension" TEXT,
    "declination" TEXT,
    "numberOfStars" INTEGER,
    "brightestStar" TEXT,
    "aiFunFacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celestial_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "peakDate" TIMESTAMP(3),
    "visibleFrom" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "celestial_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" "IntentType" NOT NULL DEFAULT 'UNKNOWN',
    "tokensUsed" INTEGER,
    "modelUsed" TEXT DEFAULT 'llama3-8b-8192',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "category" "NewsCategory" NOT NULL DEFAULT 'GENERAL',
    "summary" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weatherCondition" TEXT,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "skyVisibilityScore" INTEGER,
    "bestTimeStart" TIMESTAMP(3),
    "bestTimeEnd" TIMESTAMP(3),
    "visiblePlanets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibleConstellations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiSuggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observatories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "openingHours" TEXT,
    "admission" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observatories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_observatories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "observatoryId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_observatories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "recognizedConstellation" TEXT,
    "constellationId" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "aiAnalysis" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" "AnalyticsEvent" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "planets_name_key" ON "planets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "planets_slug_key" ON "planets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "constellations_name_key" ON "constellations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "constellations_slug_key" ON "constellations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "celestial_events_slug_key" ON "celestial_events"("slug");

-- CreateIndex
CREATE INDEX "celestial_events_startDate_idx" ON "celestial_events"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "saved_events_userId_eventId_key" ON "saved_events"("userId", "eventId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_slug_key" ON "news_articles"("slug");

-- CreateIndex
CREATE INDEX "news_articles_publishedAt_idx" ON "news_articles"("publishedAt");

-- CreateIndex
CREATE INDEX "news_articles_category_idx" ON "news_articles"("category");

-- CreateIndex
CREATE INDEX "recommendations_userId_idx" ON "recommendations"("userId");

-- CreateIndex
CREATE INDEX "recommendations_requestedAt_idx" ON "recommendations"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "observatories_slug_key" ON "observatories"("slug");

-- CreateIndex
CREATE INDEX "observatories_latitude_longitude_idx" ON "observatories"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "saved_observatories_userId_observatoryId_key" ON "saved_observatories"("userId", "observatoryId");

-- CreateIndex
CREATE INDEX "image_uploads_userId_idx" ON "image_uploads"("userId");

-- CreateIndex
CREATE INDEX "analytics_event_idx" ON "analytics"("event");

-- CreateIndex
CREATE INDEX "analytics_userId_idx" ON "analytics"("userId");

-- CreateIndex
CREATE INDEX "analytics_createdAt_idx" ON "analytics"("createdAt");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "celestial_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_observatories" ADD CONSTRAINT "saved_observatories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_observatories" ADD CONSTRAINT "saved_observatories_observatoryId_fkey" FOREIGN KEY ("observatoryId") REFERENCES "observatories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_uploads" ADD CONSTRAINT "image_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_uploads" ADD CONSTRAINT "image_uploads_constellationId_fkey" FOREIGN KEY ("constellationId") REFERENCES "constellations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
