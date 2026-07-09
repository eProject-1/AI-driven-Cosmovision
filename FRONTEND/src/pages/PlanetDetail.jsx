import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { Starfield } from "../components/lovable/Starfield";
import { PlanetCinematic } from "../components/lovable/PlanetCinematic";
import { useAuth } from "../context/authState";
import { getPlanet } from "../lib/planets";
import { getPlanetBySlug, refreshPlanetFacts } from "../services/planet.api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85";

const PLANET_BRIEFS = {
  mercury: [
    "Mercury is the smallest planet and the closest world to the Sun. Its surface is heavily cratered, its orbit takes only 88 Earth days, and its lack of a real atmosphere lets temperatures swing from intense daytime heat to extreme nighttime cold.",
    "Its oversized metallic core and scarred crust make Mercury a compact record of early inner Solar System formation, impacts, and planetary cooling.",
  ],
  venus: [
    "Venus is similar to Earth in size, but its dense carbon dioxide atmosphere and sulfuric-acid clouds create the hottest planetary surface in the Solar System.",
    "Its slow backward rotation, crushing pressure, and runaway greenhouse climate make Venus one of the strongest comparison worlds for understanding rocky planet evolution.",
  ],
  earth: [
    "Earth is the only known planet with life, stable surface oceans, active plate tectonics, and an atmosphere that supports liquid water across much of the globe.",
    "Its magnetic field, Moon, water cycle, and living biosphere make it the reference world for comparing habitability across planets and exoplanets.",
  ],
  mars: [
    "Mars is a cold desert planet with a thin carbon dioxide atmosphere, polar ice, volcanoes, canyons, dust storms, and clear evidence that liquid water shaped parts of its ancient surface.",
    "Because Mars preserves ancient environments while remaining reachable by orbiters, landers, and rovers, it is a central target for studying past habitability.",
  ],
  jupiter: [
    "Jupiter is the largest planet in the Solar System, a fast-spinning gas giant made mostly of hydrogen and helium with powerful storms, bands, and a vast magnetic environment.",
    "Its large moon system includes worlds such as Europa, Ganymede, Io, and Callisto, turning Jupiter into a miniature planetary system of its own.",
  ],
  saturn: [
    "Saturn is a hydrogen-helium gas giant best known for its broad, bright ring system made of countless icy particles and rocky fragments.",
    "Its moons, including Titan and Enceladus, make the Saturn system especially important for studying atmospheres, subsurface oceans, rings, and outer planet evolution.",
  ],
  uranus: [
    "Uranus is an ice giant with a methane-tinted blue-green atmosphere and an extreme axial tilt that makes the planet rotate almost on its side.",
    "Its long seasons, faint rings, and poorly explored interior leave Uranus as one of the least understood major planets after Voyager 2's single flyby.",
  ],
  neptune: [
    "Neptune is the most distant major planet, a cold ice giant with methane in its atmosphere and some of the fastest winds measured in the Solar System.",
    "Its dynamic storms, faint rings, and captured moon Triton connect Neptune to the wider story of the outer Solar System and Kuiper Belt.",
  ],
};

const PLANET_BRIEF_SOURCES = {
  mercury: "https://science.nasa.gov/mercury/facts/",
  venus: "https://science.nasa.gov/venus/venus-facts/",
  earth: "https://science.nasa.gov/earth/facts/",
  mars: "https://science.nasa.gov/mars/facts/",
  jupiter: "https://science.nasa.gov/jupiter/jupiter-facts/",
  saturn: "https://science.nasa.gov/saturn/facts/",
  uranus: "https://science.nasa.gov/uranus/facts/",
  neptune: "https://science.nasa.gov/neptune/neptune-facts/",
};

function formatNumber(value, options = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return new Intl.NumberFormat("en-US", options).format(numeric);
}

function formatCompact(value, suffix = "") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Unknown";
  return `${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(numeric)}${suffix}`;
}

function formatKm(value) {
  const formatted = formatNumber(value);
  return formatted ? `${formatted} km` : "Unknown";
}

function formatAu(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Unknown";
  return `${formatNumber(numeric, { maximumFractionDigits: 3 })} AU`;
}

function formatBoolean(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}

function localPlanetAsDetail(local) {
  return {
    slug: local.slug,
    name: local.name,
    type: "Planet",
    description: local.description,
    imageUrl: local.image,
    numberOfMoons: local.moons,
    aiFunFacts: [],
    atmosphere: [],
  };
}

function normalizePlanet(raw, slug) {
  const local = getPlanet(slug);
  if (!raw) return null;

  return {
    ...raw,
    slug: raw.slug || slug,
    name: raw.name || local?.name || "Unknown planet",
    description: local?.description || raw.description || "No description is available for this planet yet.",
    imageUrl: local?.image || raw.imageUrl || FALLBACK_IMAGE,
    aiFunFacts: Array.isArray(raw.aiFunFacts) ? raw.aiFunFacts : [],
    atmosphere: Array.isArray(raw.atmosphere) ? raw.atmosphere : [],
  };
}

function formatDay(hours, fallback = "Unknown") {
  const numeric = Number(hours);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric >= 48) return `${formatNumber(Math.round(numeric / 24))} days`;
  return `${formatNumber(numeric, { maximumFractionDigits: 1 })} hours`;
}

function formatYear(days, fallback = "Unknown") {
  const numeric = Number(days);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric >= 3650) return `${formatNumber(Number((numeric / 365.25).toFixed(1)))} years`;
  return `${formatNumber(numeric, { maximumFractionDigits: 1 })} days`;
}

function toCinematicPlanet(planet, local) {
  return {
    slug: planet.slug,
    name: planet.name,
    tagline: local?.tagline || planet.type || "Planetary profile",
    description: planet.description,
    image: local?.image || planet.imageUrl || FALLBACK_IMAGE,
    accent: local?.accent || "from-sky-400 to-blue-700",
    diameter: planet.diameterKm ? formatKm(planet.diameterKm) : local?.diameter || "Unknown",
    day: formatDay(planet.rotationPeriodHours, local?.day || "Unknown"),
    year: formatYear(planet.orbitalPeriodDays, local?.year || "Unknown"),
    moons: planet.numberOfMoons ?? local?.moons ?? 0,
    distance: planet.distanceFromSunAu ? formatAu(planet.distanceFromSunAu) : local?.distance || "Unknown",
  };
}

function PlanetSpaceXProfile({ planet, cinematicPlanet, isAdmin, onRefreshFacts, refreshStatus, refreshError }) {
  const aiFacts = Array.isArray(planet.aiFunFacts) ? planet.aiFunFacts : [];
  const missionBrief = PLANET_BRIEFS[planet.slug] || [planet.description];
  const missionBriefSource = PLANET_BRIEF_SOURCES[planet.slug] || "https://science.nasa.gov/solar-system/planets/";
  const stats = [
    { label: "Diameter", value: planet.diameterKm ? formatKm(planet.diameterKm) : cinematicPlanet.diameter },
    { label: "Day", value: cinematicPlanet.day },
    { label: "Year", value: cinematicPlanet.year },
    { label: "Moon", value: `${cinematicPlanet.moons}` },
    { label: "Distance", value: cinematicPlanet.distance },
  ];

  const tableRows = [
    { label: "Mass", value: formatCompact(planet.massKg, " kg") },
    { label: "Gravity", value: planet.gravityMs2 != null ? `${formatNumber(planet.gravityMs2, { maximumFractionDigits: 2 })} m/s2` : "9.81 m/s2" },
    { label: "Average temperature", value: planet.avgTempCelsius != null ? `${formatNumber(planet.avgTempCelsius)} C` : "15 C" },
    { label: "Orbital period", value: cinematicPlanet.year },
    { label: "Rotation period", value: cinematicPlanet.day },
    { label: "Has rings", value: formatBoolean(planet.hasRings) },
  ];

  return (
    <section id="planet-profile" className="relative z-10 border-t border-white/10 bg-[#020712]/72 px-6 py-24 md:px-12 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.72fr)] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#6ecbff]/72">{planet.name} profile</p>
            <h2 className="mt-5 max-w-5xl font-display text-5xl font-semibold uppercase leading-[0.95] tracking-[-0.02em] text-white md:text-7xl">
              Observing {planet.name} as a mission profile.
            </h2>
            <p className="mt-8 max-w-3xl text-lg font-light leading-9 text-slate-200/82 md:text-xl">
              {planet.description}
            </p>
          </div>

          <div className="grid grid-cols-2 border-y border-white/18 md:grid-cols-5 lg:grid-cols-1">
            {stats.map((item) => (
              <div key={item.label} className="border-b border-white/12 py-5 last:border-b-0 md:border-b-0 md:border-r md:border-white/12 md:px-5 md:last:border-r-0 lg:border-r-0 lg:px-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[0.72fr_1fr]">
          <div className="min-h-[520px] overflow-hidden bg-black shadow-[0_28px_120px_rgba(0,0,0,0.45)]">
            <img
              src={planet.imageUrl || cinematicPlanet.image}
              alt={planet.name}
              className="h-full min-h-[520px] w-full object-cover"
            />
          </div>

          <div className="grid content-center gap-10">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/72">AI facts</p>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={onRefreshFacts}
                    disabled={refreshStatus === "refreshing"}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#6ecbff]/35 bg-[#6ecbff]/10 px-4 text-xs font-bold uppercase tracking-[0.18em] text-[#c8f1ff] transition hover:border-[#9ee8ff]/70 hover:bg-[#6ecbff]/16 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {refreshStatus === "refreshing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Refresh
                  </button>
                ) : null}
              </div>
              <h3 className="mt-4 font-display text-4xl font-semibold uppercase tracking-[-0.02em] text-white md:text-6xl">
                Observations worth pausing for.
              </h3>
              {refreshError ? <p className="mt-4 text-sm text-red-200">{refreshError}</p> : null}
              <div className="mt-8 grid gap-4">
                {aiFacts.length ? (
                  aiFacts.slice(0, 4).map((fact, index) => (
                    <article key={`${fact}-${index}`} className="border-t border-white/14 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{String(index + 1).padStart(2, "0")}</p>
                      <p className="mt-2 text-lg leading-8 text-slate-200/82">{fact}</p>
                    </article>
                  ))
                ) : (
                  <p className="border-t border-white/14 pt-4 text-lg leading-8 text-slate-300/72">
                    No AI facts are stored for this planet yet.
                  </p>
                )}
              </div>
            </section>

            <section className="border-t border-white/14 pt-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/72">Mission profile</p>
              <div className="mt-6 grid gap-4">
                {missionBrief.map((line) => (
                  <p key={line} className="max-w-4xl text-lg font-light leading-9 text-slate-200/78">
                    {line}
                  </p>
                ))}
                <a
                  href={missionBriefSource}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#9bd5ff] transition hover:text-white"
                >
                  Source: NASA Science planet facts
                </a>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-[0.9fr_1fr]">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/72">Atmosphere</p>
            <h3 className="mt-4 font-display text-4xl font-semibold uppercase tracking-[-0.02em] text-white md:text-6xl">
              The envelope around the world.
            </h3>
            <div className="mt-7 flex flex-wrap gap-3">
              {(planet.atmosphere?.length ? planet.atmosphere : ["N2", "O2", "Ar", "CO2"]).map((item) => (
                  <span key={item} className="border border-white/18 px-5 py-3 text-base font-semibold uppercase tracking-[0.18em] text-white/82">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/72">Planet data</p>
            <div className="mt-5 border-y border-white/16">
              {tableRows.map((row) => (
                <div key={row.label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/12 py-4 last:border-b-0">
                  <span className="text-base font-semibold uppercase tracking-[0.18em] text-slate-400">{row.label}</span>
                  <span className="text-right text-base font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              to={`/planets/${planet.slug}/facts`}
              className="mt-8 inline-flex border-2 border-[#6ecbff]/60 bg-[#6ecbff]/10 px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:border-[#9bd5ff] hover:bg-[#6ecbff]/20 hover:text-white"
            >
              Read NASA-style facts
            </Link>
          </section>
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <main className="relative grid min-h-screen place-items-center bg-[#08111f] px-6 text-center text-white">
      <Starfield />
      <div className="relative z-10">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#3fa9f5]" />
        <p className="mt-4 text-sm text-slate-300">Loading planet details...</p>
      </div>
    </main>
  );
}

function ErrorState({ title, message, onRetry }) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-[#08111f] px-6 text-center text-white">
      <Starfield />
      <div className="relative z-10 max-w-md rounded-3xl border border-white/10 bg-[#0d1b2a]/75 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#9bd5ff]">Planet detail</p>
        <h1 className="mt-4 font-display text-3xl font-light">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full border border-[#3fa9f5]/30 bg-[#3fa9f5]/15 px-5 py-2 text-sm text-[#d6efff] transition hover:bg-[#3fa9f5]/25"
            >
              Retry
            </button>
          ) : null}
          <Link
            to="/planets"
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to Planets
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PlanetDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [planet, setPlanet] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshStatus, setRefreshStatus] = useState("idle");
  const [refreshError, setRefreshError] = useState("");

  const localPlanet = useMemo(() => getPlanet(slug), [slug]);
  const isAdmin = user?.role === "ADMIN";

  async function loadPlanet() {
    if (!slug) {
      setStatus("not-found");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const data = await getPlanetBySlug(slug);
      setPlanet(normalizePlanet(data, slug));
      setStatus("ready");
    } catch (err) {
      const statusCode = err.response?.status;
      if (statusCode === 404 && localPlanet) {
        setPlanet(localPlanetAsDetail(localPlanet));
        setStatus("ready");
        return;
      }
      setError(err.response?.data?.message || err.message || "Could not load this planet.");
      setStatus(statusCode === 404 ? "not-found" : "error");
    }
  }

  useEffect(() => {
    loadPlanet();
  }, [slug]);

  async function handleRefreshFacts() {
    if (!isAdmin || refreshStatus === "refreshing") return;
    setRefreshStatus("refreshing");
    setRefreshError("");

    try {
      const data = await refreshPlanetFacts(slug);
      setPlanet((current) => normalizePlanet({
        ...(current || {}),
        slug,
        name: data.planetName || current?.name,
        aiFunFacts: Array.isArray(data.facts) ? data.facts : [],
      }, slug));
      setRefreshStatus("ready");
    } catch (err) {
      setRefreshError(err.response?.data?.message || err.message || "Could not refresh AI facts.");
      setRefreshStatus("error");
    }
  }

  if (status === "loading") return <LoadingState />;

  if (status === "not-found") {
    return (
      <ErrorState
        title="Planet not found"
        message="The requested planet could not be found in the CosmoVision database."
      />
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        title="Unable to load planet"
        message={error}
        onRetry={loadPlanet}
      />
    );
  }

  const viewPlanet = normalizePlanet(planet, slug);
  const cinematicPlanet = toCinematicPlanet(viewPlanet, localPlanet);
  const heroKicker = viewPlanet.slug === "earth" ? "The Blue Planet" : cinematicPlanet.tagline;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08111f] text-white">
      <Starfield />
      <PlanetCinematic planet={cinematicPlanet} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_72%_38%,rgba(63,169,245,0.17),transparent_32%),radial-gradient(circle_at_16%_20%,rgba(11,61,145,0.36),transparent_36%),linear-gradient(180deg,rgba(8,17,31,0.14),#08111f_88%)]" />

      <section className="relative z-10 grid min-h-screen items-center px-6 pb-16 pt-28 md:px-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:px-16">
        <div className="max-w-xl">
          <Link
            to="/planets"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-200/78 backdrop-blur-sm transition hover:border-[#6ecbff]/45 hover:bg-[#6ecbff]/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Planets
          </Link>
          <p className="mt-14 font-display text-[11px] uppercase tracking-[0.48em] text-[#cdefff]/72">
            {heroKicker}
          </p>
          <h1 className="mt-3 font-display text-7xl font-light uppercase leading-[0.82] tracking-[0.04em] text-white drop-shadow-[0_18px_70px_rgba(0,0,0,0.75)] md:text-8xl lg:text-9xl">
            {viewPlanet.name}
          </h1>
          <div className="mt-7 h-px w-24 bg-[#6ecbff]/80 shadow-[0_0_18px_rgba(110,203,255,0.55)]" />
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-slate-200/74 md:text-lg">
            {viewPlanet.description}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to={`/planets/${viewPlanet.slug}/facts`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#6ecbff]/35 bg-[#6ecbff]/10 px-7 text-xs font-light uppercase tracking-[0.24em] text-foreground shadow-[0_0_28px_rgba(110,203,255,0.12)] transition hover:-translate-y-0.5 hover:border-[#6ecbff]/55 hover:bg-[#6ecbff]/16"
            >
              Learn more
            </Link>
            <a
              href="#planet-profile"
              aria-label={`Open ${viewPlanet.name} profile`}
              className="inline-flex size-12 items-center justify-center rounded-full border border-[#d6efff]/30 bg-[#d6efff]/12 text-[#eaf6ff] shadow-[0_0_28px_rgba(110,203,255,0.18)] transition hover:-translate-y-0.5 hover:border-[#d6efff]/55 hover:bg-[#d6efff]/20"
            >
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </a>
          </div>
          <p className="mt-8 font-display text-[10px] uppercase tracking-[0.32em] text-slate-300/48">
            {cinematicPlanet.distance} from the Sun
          </p>
        </div>
        <div className="pointer-events-none hidden min-h-[520px] lg:block" aria-hidden="true" />
      </section>

      <PlanetSpaceXProfile
        planet={viewPlanet}
        cinematicPlanet={cinematicPlanet}
        isAdmin={isAdmin}
        onRefreshFacts={handleRefreshFacts}
        refreshStatus={refreshStatus}
        refreshError={refreshError}
      />
    </main>
  );
}
