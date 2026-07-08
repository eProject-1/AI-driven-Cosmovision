import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, ExternalLink, ImageOff, Menu, Search, Share2 } from "lucide-react";
import { Starfield } from "../components/lovable/Starfield";
import { getPlanet } from "../lib/planets";
import { getNasaPlanetFact } from "../lib/planetFacts";

const makeId = (value) => value.toLowerCase().replaceAll(" ", "-").replace(/[^a-z0-9-]/g, "");
const ringPlanets = new Set(["jupiter", "saturn", "uranus", "neptune"]);
const rockyPlanets = new Set(["mercury", "venus", "earth", "mars"]);
const gasGiants = new Set(["jupiter", "saturn"]);

function moonSummary(planet) {
  if (!planet.moons) return `${planet.name} has no known natural moons.`;
  if (planet.moons === 1) return `${planet.name} has one natural moon.`;
  return `${planet.name} has ${planet.moons} known moons, making its satellite system part of the planet's scientific story.`;
}

function generatedNasaSections(planet) {
  const isRocky = rockyPlanets.has(planet.slug);
  const isGasGiant = gasGiants.has(planet.slug);
  const hasRings = ringPlanets.has(planet.slug);

  return [
    {
      title: "Size and Distance",
      body: [
        `${planet.name} has a diameter of ${planet.diameter} and orbits at an average distance of about ${planet.distance} from the Sun.`,
        `Size and distance shape almost every other fact on this page: sunlight, temperature, orbital speed, and mission design all change with scale.`,
      ],
    },
    {
      title: "Orbit and Rotation",
      body: [
        `A day on ${planet.name} lasts ${planet.day}, while one trip around the Sun takes ${planet.year}.`,
        `NASA separates orbit and rotation because they control the rhythm of daylight, seasons, atmospheric circulation, and how spacecraft plan observations.`,
      ],
    },
    {
      title: "Moons",
      body: [
        moonSummary(planet),
        `Moons can preserve clues about a planet's formation and can also become exploration targets in their own right, especially around the outer planets.`,
      ],
    },
    {
      title: "Rings",
      body: [
        hasRings
          ? `${planet.name} belongs to the group of giant planets with ring systems. Saturn's rings are the brightest and most famous, while the others are fainter.`
          : `${planet.name} does not have a ring system like the giant planets.`,
        `Ring systems are usually made from dust, rock, and ice. They can be shaped by moons, impacts, gravity, and the long-term evolution of material around a planet.`,
      ],
    },
    {
      title: "Formation",
      body: [
        `${planet.name} formed from the same young solar nebula that built the rest of the solar system more than 4.5 billion years ago.`,
        isRocky
          ? `As a rocky planet, it formed closer to the Sun where heavier materials could collect into a solid world.`
          : `As a giant planet, it grew where lighter gases and icy materials could gather into a much larger world.`,
      ],
    },
    {
      title: "Structure",
      body: [
        isRocky
          ? `${planet.name} is a terrestrial planet with a solid body built from rock and metal.`
          : `${planet.name} is a giant planet without a solid surface like Earth, built mostly from deep layers of gas and fluid materials.`,
        isGasGiant
          ? `For gas giants, pressure increases dramatically with depth, creating interiors that cannot be understood by surface geology alone.`
          : `For rocky worlds, the interior structure helps explain craters, volcanoes, tectonics, magnetic fields, and surface evolution.`,
      ],
    },
    {
      title: "Surface",
      body: [
        isRocky
          ? `${planet.name} has a surface shaped by impacts, temperature, volcanism, atmosphere, or erosion depending on the planet.`
          : `${planet.name} has no solid ground for a spacecraft to stand on; its visible surface is the top of a deep atmosphere.`,
        `Surface conditions are one of the first things scientists compare when deciding how a mission could orbit, land, fly through, or observe a planet.`,
      ],
    },
    {
      title: "Atmosphere",
      body: [
        isRocky
          ? `${planet.name}'s atmosphere, or lack of one, strongly controls temperature, weathering, and the visibility of the surface.`
          : `${planet.name}'s atmosphere is the main observable layer, revealing winds, storms, bands, clouds, chemistry, and heat flow.`,
        `NASA studies atmospheres to understand climate, chemistry, weather, escape to space, and how planets change over billions of years.`,
      ],
    },
    {
      title: "Magnetosphere",
      body: [
        `${planet.name}'s interaction with the solar wind is an important part of its space environment.`,
        `A magnetosphere can shield a planet or moon system from charged particles, but it can also create radiation belts and auroras that missions must measure carefully.`,
      ],
    },
  ];
}

function mergeSections(baseSections, generatedSections) {
  const seen = new Set(baseSections.map((section) => section.title));
  return [
    ...baseSections,
    ...generatedSections.filter((section) => !seen.has(section.title)),
  ];
}

function FactImage({ src, fallback, alt }) {
  const [imageSrc, setImageSrc] = useState(src || fallback);

  useEffect(() => {
    setImageSrc(src || fallback);
  }, [src, fallback]);

  if (!imageSrc) {
    return (
      <div className="grid aspect-[16/9] place-items-center bg-[#050914] text-slate-400">
        <ImageOff className="h-10 w-10" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={() => setImageSrc(fallback)}
      className="h-full w-full object-cover"
    />
  );
}

function MissingFacts() {
  return (
    <main className="relative min-h-screen bg-[#05070d] px-6 pt-32 text-white">
      <Starfield />
      <div className="relative z-10 mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#6ecbff]/70">Planet facts</p>
        <h1 className="mt-4 font-display text-4xl font-light">Facts not found</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          This planet does not have a NASA fact profile in the CosmoVision dataset yet.
        </p>
        <Link
          to="/planets"
          className="mt-7 inline-flex rounded-full border border-[#6ecbff]/35 bg-[#6ecbff]/10 px-5 py-3 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-[#6ecbff]/16"
        >
          Back to planets
        </Link>
      </div>
    </main>
  );
}

function FactIndex({ sections }) {
  return (
    <div className="grid gap-x-8 md:grid-cols-2">
      {sections.map((section) => (
        <a
          key={section.title}
          href={`#${makeId(section.title)}`}
          className="group flex items-center justify-between border-b border-white/22 py-4 text-lg text-white transition hover:border-[#6ecbff]/65 hover:text-[#d8f2ff]"
        >
          <span>{section.title}</span>
          <ChevronDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
        </a>
      ))}
    </div>
  );
}

function DetailsText({ body, planetName, quickFacts }) {
  const paragraphs = Array.isArray(body) ? body : [body];
  const measurementContext = quickFacts
    .slice(0, 3)
    .map((fact) => `${fact.label.toLowerCase()}: ${fact.value}`)
    .join(", ");
  const expandedParagraphs = paragraphs.length > 1
    ? paragraphs
    : [
        paragraphs[0],
        `For ${planetName}, this topic connects with the planet's measured profile, including ${measurementContext}. These values help explain why the planet behaves differently from Earth and why NASA separates the facts into focused science categories.`,
        `Read this section together with the surrounding facts on orbit, surface, atmosphere, moons, rings, and interior structure. Together they describe not just what ${planetName} looks like, but how it formed, how it changes over time, and what future missions can learn from it.`,
      ];

  return (
    <div className="mt-5 grid gap-4">
      {expandedParagraphs.map((paragraph) => (
        <p key={paragraph} className="max-w-4xl text-lg leading-9 text-slate-200/80 md:text-xl">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function PlanetFacts() {
  const { slug } = useParams();
  const localPlanet = useMemo(() => getPlanet(slug), [slug]);
  const facts = useMemo(() => getNasaPlanetFact(slug), [slug]);

  if (!localPlanet || !facts) return <MissingFacts />;

  const heroImage = facts.nasaImageUrl || localPlanet.image;
  const sourceName = facts.sourceUrl.replace("https://", "").replace(/\/$/, "");
  const sections = mergeSections(facts.sections, generatedNasaSections(localPlanet));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <Starfield intensity={0.55} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.18),#05070d_86%),radial-gradient(circle_at_76%_22%,rgba(110,203,255,0.13),transparent_34rem),radial-gradient(circle_at_12%_12%,rgba(11,61,145,0.24),transparent_28rem)]" />

      <section id="facts-introduction" className="relative z-10 px-6 pb-12 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1fr)] lg:items-start">
          <div>
            <div className="mb-9 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300/70">
              <span>...</span>
              <span>/</span>
              <Link to="/planets" className="transition hover:text-white">Planets</Link>
              <span>/</span>
              <Link to={`/planets/${localPlanet.slug}`} className="transition hover:text-white">{localPlanet.name}</Link>
              <span>/</span>
              <span className="text-white">{localPlanet.name}: Facts</span>
            </div>
            <h1 className="font-display text-6xl font-semibold tracking-[-0.03em] text-white md:text-8xl">
              {localPlanet.name} Facts
            </h1>
            <p className="mt-7 max-w-3xl text-xl font-light leading-9 text-slate-200/84 md:text-2xl">
              {facts.intro}
            </p>
          </div>

          <FactIndex sections={sections} />
        </div>
      </section>

      <section className="relative z-10 px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden border border-white/10 bg-black shadow-[0_28px_120px_rgba(0,0,0,0.5)]">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-md bg-[#23262d]/90 px-2 py-1 text-white/80 backdrop-blur">
              <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs">x</span>
              <span className="grid size-6 place-items-center rounded-full bg-white/10">v</span>
              <span className="grid size-6 place-items-center rounded-full bg-white/10">[]</span>
              <span className="grid size-6 place-items-center rounded-full bg-white/10">&gt;</span>
              <Menu className="h-4 w-4" />
            </div>

            <div className="aspect-[16/9]">
              <FactImage src={heroImage} fallback={localPlanet.image} alt={`${localPlanet.name} from NASA`} />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-7 text-white">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                <span className="grid size-9 place-items-center rounded-full border border-white/40 text-[10px]">NASA</span>
                <span>Eyes on the Solar System</span>
                <span>&gt;</span>
                <span>{localPlanet.name}</span>
              </div>
              <div className="hidden items-center gap-5 text-white/85 md:flex">
                <Search className="h-5 w-5" />
                <Share2 className="h-5 w-5" />
                <span className="font-semibold">Share</span>
                <Menu className="h-5 w-5" />
                <span className="font-semibold">Menu</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full max-w-md border-t border-r border-white/15 bg-[#121417]/92 p-6 backdrop-blur md:bottom-8 md:left-8">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#6ecbff]/80">Info</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">{localPlanet.name}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                <span className="size-2 rounded-full bg-[#4d7dff]" />
                Planet
              </p>
              <div className="mt-5 border-t border-white/10 pt-5">
                <h3 className="text-lg font-semibold text-white">Description</h3>
                <p className="mt-3 text-base leading-8 text-slate-300/88">{facts.intro}</p>
              </div>
              <a
                href="#details"
                className="mt-5 inline-flex w-full justify-center rounded-sm bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/18"
              >
                Read More
              </a>
            </div>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
            Image credit: {facts.imageCredit}
          </p>
        </div>
      </section>

      <section id="details" className="relative z-10 border-t border-white/10 px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6ecbff]/70">Fast Facts</p>
            <div className="mt-5 grid gap-px overflow-hidden border border-white/10 bg-white/10">
              {facts.quickFacts.map((item) => (
                <div key={item.label} className="bg-[#0b101a]/95 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <a
              href={facts.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9bd5ff] transition hover:text-white"
            >
              NASA source
              <ExternalLink className="h-4 w-4" />
            </a>
          </aside>

          <article className="grid gap-12">
            {sections.map((section, index) => (
              <section key={section.title} id={makeId(section.title)} className="scroll-mt-28 border-t border-white/12 pt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6ecbff]/62">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.02em] text-white md:text-6xl">
                  {section.title}
                </h2>
                <DetailsText body={section.body} planetName={localPlanet.name} quickFacts={facts.quickFacts} />
              </section>
            ))}

            <div className="border-t border-white/12 pt-8">
              <p className="text-base leading-8 text-slate-300/76">
                Facts are summarized and paraphrased from NASA Science planet profiles. Source:{" "}
                <a href={facts.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#9bd5ff] underline underline-offset-4">
                  {sourceName}
                </a>
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
