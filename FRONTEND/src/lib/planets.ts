import earth from "../assets/earth.png";
import mercury from "../assets/mercury.png";
import venus from "../assets/venus.png";
import mars from "../assets/mars.png";
import jupiter from "../assets/jupiter.png";
import saturn from "../assets/saturn.png";
import uranus from "../assets/uranus.png";
import neptune from "../assets/neptune.png";

export type Planet = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  accent: string;
  diameter: string;
  day: string;
  year: string;
  moons: number;
  distance: string;
};

export const planets: Planet[] = [
  { slug: "earth", name: "Earth", tagline: "Home. Pale Blue Dot.", description: "The only known world that harbors life. Oceans cover 71% of its surface, an atmosphere of nitrogen and oxygen, one natural satellite.", image: earth, accent: "from-sky-400 to-blue-600", diameter: "12,742 km", day: "24 hours", year: "365.25 days", moons: 1, distance: "149.6M km" },
  { slug: "mercury", name: "Mercury", tagline: "The Swift Messenger.", description: "Closest to the Sun, smallest of the planets. A scorched, cratered world with no atmosphere and the most extreme temperature swings in the solar system.", image: mercury, accent: "from-zinc-400 to-zinc-700", diameter: "4,879 km", day: "59 days", year: "88 days", moons: 0, distance: "57.9M km" },
  { slug: "venus", name: "Venus", tagline: "Earth's Twisted Twin.", description: "Shrouded in thick sulfuric clouds, surface temperatures hotter than Mercury. A runaway greenhouse, slowly rotating backward.", image: venus, accent: "from-amber-300 to-orange-600", diameter: "12,104 km", day: "243 days", year: "225 days", moons: 0, distance: "108.2M km" },
  { slug: "mars", name: "Mars", tagline: "The Red Frontier.", description: "Rust-red deserts, polar ice, the tallest mountain and deepest canyon in the solar system. Humanity's next destination.", image: mars, accent: "from-orange-500 to-red-700", diameter: "6,779 km", day: "24.6 hours", year: "687 days", moons: 2, distance: "227.9M km" },
  { slug: "jupiter", name: "Jupiter", tagline: "King of the Planets.", description: "A gas giant so massive it could swallow 1,300 Earths. Storms that have raged for centuries, including the Great Red Spot.", image: jupiter, accent: "from-amber-200 to-orange-700", diameter: "139,820 km", day: "9.9 hours", year: "11.9 years", moons: 95, distance: "778.5M km" },
  { slug: "saturn", name: "Saturn", tagline: "The Jeweled Giant.", description: "Crowned by a breathtaking system of icy rings spanning 282,000 km. The lightest planet — it would float on water.", image: saturn, accent: "from-yellow-200 to-amber-600", diameter: "116,460 km", day: "10.7 hours", year: "29.5 years", moons: 146, distance: "1.43B km" },
  { slug: "uranus", name: "Uranus", tagline: "The Sideways World.", description: "An ice giant tipped on its side, rolling through space. Pale cyan from methane in its atmosphere. Coldest planetary atmosphere known.", image: uranus, accent: "from-cyan-200 to-teal-600", diameter: "50,724 km", day: "17 hours", year: "84 years", moons: 28, distance: "2.87B km" },
  { slug: "neptune", name: "Neptune", tagline: "The Distant Storm.", description: "Deep azure ice giant with the fastest winds in the solar system — over 2,000 km/h. The last sentinel of the planetary system.", image: neptune, accent: "from-blue-400 to-indigo-800", diameter: "49,244 km", day: "16 hours", year: "165 years", moons: 16, distance: "4.5B km" },
];

export const getPlanet = (slug: string) => planets.find((p) => p.slug === slug);

const localPlanetBySlug = new Map(planets.map((planet) => [planet.slug, planet]));

const formatNumber = (value?: number | null) =>
  typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : null;

const formatDay = (hours?: number | null) => {
  if (typeof hours !== "number") return null;
  if (hours >= 48) return `${formatNumber(Math.round(hours / 24))} days`;
  return `${formatNumber(hours)} hours`;
};

const formatYear = (days?: number | null) => {
  if (typeof days !== "number") return null;
  if (days >= 3650) return `${formatNumber(Number((days / 365.25).toFixed(1)))} years`;
  return `${formatNumber(days)} days`;
};

const formatDistance = (au?: number | null) => {
  if (typeof au !== "number") return null;
  const km = au * 149_597_870.7;
  if (km >= 1_000_000_000) return `${Number((km / 1_000_000_000).toFixed(2))}B km`;
  return `${Number((km / 1_000_000).toFixed(1))}M km`;
};

const taglineFor = (planet: any, local?: Planet) => {
  if (local?.tagline) return local.tagline;
  if (planet.hasRings) return "Ringed world.";
  if (planet.type) return planet.type.replace(/_/g, " ");
  return "A world in the Solar System.";
};

export const mergePlanetFromApi = (planet: any): Planet => {
  const local = localPlanetBySlug.get(planet.slug);

  return {
    slug: planet.slug,
    name: planet.name,
    tagline: taglineFor(planet, local),
    description: planet.description || local?.description || "",
    image: local?.image || planet.imageUrl || "",
    accent: local?.accent || "from-sky-400 to-blue-700",
    diameter: planet.diameterKm ? `${formatNumber(planet.diameterKm)} km` : local?.diameter || "Unknown",
    day: formatDay(planet.rotationPeriodHours) || local?.day || "Unknown",
    year: formatYear(planet.orbitalPeriodDays) || local?.year || "Unknown",
    moons: planet.numberOfMoons ?? local?.moons ?? 0,
    distance: formatDistance(planet.distanceFromSunAu) || local?.distance || "Unknown",
  };
};

export const mergePlanetsFromApi = (apiPlanets: any[] = []) => {
  const merged = apiPlanets.map(mergePlanetFromApi);
  return merged.length ? merged : planets;
};
