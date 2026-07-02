import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Atom,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Cloud,
  Gauge,
  Globe2,
  Loader2,
  Orbit,
  RotateCcw,
  Ruler,
  Satellite,
  Sparkles,
  Sun,
  Thermometer,
  Weight,
} from "lucide-react";
import { Starfield } from "../components/lovable/Starfield";
import { PlanetCinematic } from "../components/lovable/PlanetCinematic";
import { getPlanet } from "../lib/planets";
import { getPlanetBySlug } from "../services/planet.api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85";

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

function normalizePlanet(raw, slug) {
  const local = getPlanet(slug);
  if (!raw) return null;

  return {
    ...raw,
    slug: raw.slug || slug,
    name: raw.name || local?.name || "Unknown planet",
    description: raw.description || local?.description || "No description is available for this planet yet.",
    imageUrl: raw.imageUrl || local?.image || FALLBACK_IMAGE,
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

function PlanetHero({ planet }) {
  return (
    <header className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-[#3fa9f5]/30 bg-[#3fa9f5]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#9bd5ff]">
          {planet.type || "Planet"}
        </span>
        {planet.hasRings ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-foreground/55">
            Ring system
          </span>
        ) : null}
      </div>
      <h1 className="mt-6 font-display text-5xl font-light tracking-tight text-white md:text-7xl">
        {planet.name}
      </h1>
      <p className="mt-6 max-w-3xl text-base font-light leading-relaxed text-slate-200/75 md:text-lg">
        {planet.description}
      </p>
    </header>
  );
}

function PlanetImage({ planet }) {
  const [src, setSrc] = useState(planet.imageUrl || FALLBACK_IMAGE);

  useEffect(() => {
    setSrc(planet.imageUrl || FALLBACK_IMAGE);
  }, [planet.imageUrl]);

  return (
    <aside className="order-first lg:order-none">
      <div className="lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1b2a]/80 shadow-[0_28px_120px_rgba(63,169,245,0.18)] backdrop-blur-xl">
          <div className="aspect-square bg-[radial-gradient(circle_at_50%_45%,rgba(63,169,245,0.22),transparent_58%),#08111f] p-8">
            <img
              src={src}
              alt={planet.name}
              onError={() => setSrc(FALLBACK_IMAGE)}
              className="h-full w-full rounded-2xl object-contain drop-shadow-[0_24px_45px_rgba(0,0,0,0.55)] transition duration-500 hover:scale-[1.03]"
            />
          </div>
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Image source</p>
            <p className="mt-1 truncate text-sm text-slate-200/75">{planet.imageUrl ? "Backend imageUrl" : "Fallback image"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="group grid gap-3 border-b border-white/10 px-5 py-4 transition-colors hover:bg-white/[0.04] sm:grid-cols-[1fr_1.2fr]">
      <div className="flex items-center gap-3 text-slate-300">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#3fa9f5]/20 bg-[#3fa9f5]/10 text-[#9bd5ff]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-100/80 sm:text-right">{value}</p>
    </div>
  );
}

function PlanetStats({ planet }) {
  const rows = [
    { icon: Ruler, label: "Diameter", value: formatKm(planet.diameterKm) },
    { icon: Weight, label: "Mass", value: formatCompact(planet.massKg, " kg") },
    { icon: Gauge, label: "Gravity", value: planet.gravityMs2 != null ? `${formatNumber(planet.gravityMs2, { maximumFractionDigits: 2 })} m/s2` : "Unknown" },
    { icon: Thermometer, label: "Average temperature", value: planet.avgTempCelsius != null ? `${formatNumber(planet.avgTempCelsius)} C` : "Unknown" },
    { icon: Sun, label: "Distance from Sun", value: formatAu(planet.distanceFromSunAu) },
    { icon: Globe2, label: "Distance from Earth", value: formatKm(planet.distanceFromEarthKm) },
    { icon: Orbit, label: "Orbital period", value: planet.orbitalPeriodDays != null ? `${formatNumber(planet.orbitalPeriodDays)} days` : "Unknown" },
    { icon: RotateCcw, label: "Rotation period", value: planet.rotationPeriodHours != null ? `${formatNumber(planet.rotationPeriodHours, { maximumFractionDigits: 2 })} hours` : "Unknown" },
    { icon: Satellite, label: "Number of moons", value: planet.numberOfMoons ?? "Unknown" },
    { icon: planet.hasRings ? CheckCircle2 : CircleOff, label: "Has rings", value: formatBoolean(planet.hasRings) },
    { icon: CalendarDays, label: "Discovery year", value: planet.discoveryYear ?? "Unknown" },
    { icon: Atom, label: "Discovered by", value: planet.discoveredBy || "Unknown" },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1b2a]/70 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-white/[0.035] px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Reference table</p>
        <h2 className="mt-2 font-display text-2xl font-light text-white">Planet Statistics</h2>
      </div>
      <div>
        {rows.map((row) => (
          <StatRow key={row.label} {...row} />
        ))}
      </div>
    </section>
  );
}

function AtmosphereBadges({ atmosphere }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Cloud className="h-5 w-5 text-[#9bd5ff]" />
        <h2 className="font-display text-2xl font-light text-white">Atmosphere</h2>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {atmosphere.length ? (
          atmosphere.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#3fa9f5]/25 bg-[#3fa9f5]/10 px-4 py-2 text-sm font-medium text-[#b9e2ff] shadow-[0_10px_30px_rgba(63,169,245,0.12)]"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-300/70">No atmosphere data available.</span>
        )}
      </div>
    </section>
  );
}

function PlanetFacts({ facts }) {
  if (!facts?.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[#9bd5ff]" />
        <h2 className="font-display text-2xl font-light text-white">✨ AI Interesting Facts</h2>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {facts.map((fact, index) => (
          <article
            key={`${fact}-${index}`}
            className="rounded-2xl border border-white/10 bg-[#132238]/65 p-5 text-sm font-light leading-relaxed text-slate-100/80 transition duration-300 hover:-translate-y-1 hover:border-[#3fa9f5]/35 hover:bg-[#132238]"
          >
            {fact}
          </article>
        ))}
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
  const [planet, setPlanet] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const localPlanet = useMemo(() => getPlanet(slug), [slug]);

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
      setError(err.response?.data?.message || err.message || "Could not load this planet.");
      setStatus(statusCode === 404 ? "not-found" : "error");
    }
  }

  useEffect(() => {
    loadPlanet();
  }, [slug]);

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08111f] text-white">
      <Starfield />
      <PlanetCinematic planet={cinematicPlanet} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(63,169,245,0.18),transparent_32%),linear-gradient(180deg,rgba(8,17,31,0.35),#08111f_82%)]" />

      <section className="relative z-10 flex min-h-screen items-center px-6 pt-24 md:px-16">
        <div className="max-w-xl">
          <Link
            to="/planets"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-slate-200/80 backdrop-blur-sm transition hover:border-[#3fa9f5]/35 hover:bg-[#3fa9f5]/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Planets
          </Link>
          <p className="mt-10 font-display text-[10px] uppercase tracking-[0.55em] text-slate-300/65">
            {cinematicPlanet.distance} from the Sun
          </p>
          <h1 className="mt-4 font-display text-6xl font-extralight leading-[0.88] tracking-[-0.05em] text-white md:text-8xl">
            {viewPlanet.name}
          </h1>
          <p className="mt-5 font-display text-lg italic text-slate-200/65">
            {cinematicPlanet.tagline}
          </p>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-slate-200/72">
            {viewPlanet.description}
          </p>
          <a
            href="#planet-profile"
            className="mt-10 inline-flex rounded-full border border-[#3fa9f5]/30 bg-[#3fa9f5]/12 px-6 py-3 text-xs uppercase tracking-[0.28em] text-[#d6efff] transition hover:bg-[#3fa9f5]/22"
          >
            View full profile
          </a>
        </div>
      </section>

      <section id="planet-profile" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 pb-24 pt-10 md:px-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="grid gap-8">
          <PlanetHero planet={viewPlanet} />
          <AtmosphereBadges atmosphere={viewPlanet.atmosphere} />
          <PlanetStats planet={viewPlanet} />
          <PlanetFacts facts={viewPlanet.aiFunFacts} />
        </div>

        <PlanetImage planet={viewPlanet} />
      </section>
    </main>
  );
}
