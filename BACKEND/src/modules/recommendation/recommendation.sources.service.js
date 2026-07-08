import prisma from "../../config/db.js";
import { calculateDistance } from "../../services/external/maps.service.js";

const OBSERVATORY_SEARCH_RADIUS_KM = parseInt(process.env.OBSERVATORY_SEARCH_RADIUS_KM || "150");

const MONTHLY_CONSTELLATIONS = {
  1: ["Orion", "Taurus", "Gemini"],
  2: ["Orion", "Canis Major", "Gemini"],
  3: ["Leo", "Virgo", "Cancer"],
  4: ["Leo", "Virgo", "Hydra"],
  5: ["Virgo", "Scorpius", "Bootes"],
  6: ["Scorpius", "Sagittarius", "Hercules"],
  7: ["Scorpius", "Sagittarius", "Lyra"],
  8: ["Sagittarius", "Aquila", "Cygnus"],
  9: ["Aquarius", "Pisces", "Pegasus"],
  10: ["Pegasus", "Andromeda", "Perseus"],
  11: ["Andromeda", "Perseus", "Aries"],
  12: ["Orion", "Taurus", "Perseus"],
};

export async function getVisiblePlanets() {
  return prisma.planet.findMany({
    where: { isVisible: true, NOT: { slug: "earth" } },
    select: {
      name: true,
      slug: true,
      type: true,
      distanceFromSunAu: true,
      hasRings: true,
      numberOfMoons: true,
    },
    orderBy: { distanceFromSunAu: "asc" },
    take: 5,
  });
}

export function getVisibleConstellations() {
  const month = new Date().getMonth() + 1;
  return MONTHLY_CONSTELLATIONS[month] || ["Orion", "Ursa Major"];
}

export async function getNearbyObservatories(lat, lon, radiusKm = OBSERVATORY_SEARCH_RADIUS_KM) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);

  const candidates = await prisma.observatory.findMany({
    where: {
      isActive: true,
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lon - lonDelta, lte: lon + lonDelta },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      address: true,
      city: true,
      province: true,
      country: true,
      type: true,
      latitude: true,
      longitude: true,
      website: true,
      equipment: true,
      openingHours: true,
      lightPollutionScore: true,
      skyQualityScore: true,
      rating: true,
      isFeatured: true,
    },
    take: 30,
  });

  return candidates
    .map((obs) => ({
      ...obs,
      distanceKm: calculateDistance({ lat, lon }, { lat: obs.latitude, lon: obs.longitude }),
    }))
    .filter((obs) => obs.distanceKm <= radiusKm)
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      const scoreDiff = (b.skyQualityScore ?? 0) - (a.skyQualityScore ?? 0);
      if (Math.abs(scoreDiff) > 5) return scoreDiff;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, 3);
}

export function deriveNasaInfluence({ apod, neoList, planets }) {
  const influence = {
    priorityEvent: null,
    boostedPlanetSlug: null,
    reorderedPlanets: planets,
  };

  if (Array.isArray(neoList) && neoList.length > 0) {
    const closeHazard = neoList
      .filter((n) => n.isPotentiallyHazardous && n.missDistanceKm != null)
      .sort((a, b) => a.missDistanceKm - b.missDistanceKm)[0];

    if (closeHazard && closeHazard.missDistanceKm < 5_000_000) {
      influence.priorityEvent = {
        type: "NEAR_EARTH_ASTEROID",
        name: closeHazard.name,
        missDistanceKm: Math.round(closeHazard.missDistanceKm),
        isPotentiallyHazardous: true,
      };
    } else {
      const nearest = [...neoList].sort(
        (a, b) => (a.missDistanceKm ?? Infinity) - (b.missDistanceKm ?? Infinity)
      )[0];
      if (nearest?.missDistanceKm != null && nearest.missDistanceKm < 1_000_000) {
        influence.priorityEvent = {
          type: "NEAR_EARTH_ASTEROID",
          name: nearest.name,
          missDistanceKm: Math.round(nearest.missDistanceKm),
          isPotentiallyHazardous: false,
        };
      }
    }
  }

  if (apod?.title && Array.isArray(planets) && planets.length > 0) {
    const apodTitleLower = apod.title.toLowerCase();
    const matchedIndex = planets.findIndex((p) =>
      apodTitleLower.includes(p.name.toLowerCase())
    );

    if (matchedIndex > 0) {
      const reordered = [...planets];
      const [matched] = reordered.splice(matchedIndex, 1);
      reordered.unshift(matched);
      influence.boostedPlanetSlug = matched.slug;
      influence.reorderedPlanets = reordered;
    } else if (matchedIndex === 0) {
      influence.boostedPlanetSlug = planets[0].slug;
    }
  }

  return influence;
}
