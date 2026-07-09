import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AdminResourceActions } from "../components/admin/AdminResourceActions";
import { planets as localPlanets, getPlanet, mergePlanetsFromApi } from "../lib/planets";
import { SolarSystemStage } from "../components/lovable/SolarSystemStage";
import { Starfield } from "../components/lovable/Starfield";
import { useAuth } from "../context/authState";
import { getPlanets } from "../services/astronomy.api";
import { SmartSearchPanel } from "./SmartSearch";

const planetGroups = [
  {
    eyebrow: "Inner Planets",
    title: "Rocky worlds close to the Sun.",
    description:
      "The first four planets are terrestrial worlds. They have solid surfaces, shorter orbital paths, and preserve the early history of heat, impacts, water, atmosphere, and geology.",
    slugs: ["mercury", "venus", "earth", "mars"],
  },
  {
    eyebrow: "Outer Planets",
    title: "Giant planets beyond the asteroid belt.",
    description:
      "The outer planets are large worlds with deep atmospheres, ring systems, many moons, and some of the most extreme weather and magnetic environments in the Solar System.",
    slugs: ["jupiter", "saturn", "uranus", "neptune"],
  },
];

const dwarfPlanets = [
  {
    slug: "ceres",
    name: "Ceres",
    type: "Dwarf planet",
    description:
      "Ceres is the largest object in the asteroid belt between Mars and Jupiter. NASA's Dawn mission revealed a small world with bright salt deposits and signs of past briny activity.",
    image:
      "https://science.nasa.gov/wp-content/uploads/2023/09/ceres_through_dawn_filter_2-jpg.webp?w=1200",
    url: "https://science.nasa.gov/dwarf-planets/ceres/facts/",
  },
  {
    slug: "pluto",
    name: "Pluto",
    type: "Dwarf planet",
    description:
      "Pluto is a complex icy world with mountains, plains, a thin atmosphere, and five moons. New Horizons showed that it is geologically richer than expected.",
    image:
      "https://science.nasa.gov/wp-content/uploads/2023/09/pluto-mosaic-jpg.webp?w=1200",
    url: "https://science.nasa.gov/dwarf-planets/pluto/facts/",
  },
  {
    slug: "haumea",
    name: "Haumea",
    type: "Dwarf planet",
    description:
      "Haumea is one of the fastest rotating large objects in the Kuiper Belt. Its rapid spin stretches it into an elongated shape and it has a ring system.",
    image:
      "https://science.nasa.gov/wp-content/uploads/2023/09/haumea-artist-concept-jpg.webp?w=1200",
    url: "https://science.nasa.gov/dwarf-planets/haumea/facts/",
  },
  {
    slug: "makemake",
    name: "Makemake",
    type: "Dwarf planet",
    description:
      "Makemake is a bright, cold Kuiper Belt dwarf planet. It helped scientists understand how many icy worlds may populate the outer Solar System.",
    image:
      "https://science.nasa.gov/wp-content/uploads/2023/09/makemake-artist-concept-jpg.webp?w=1200",
    url: "https://science.nasa.gov/dwarf-planets/makemake/facts/",
  },
  {
    slug: "eris",
    name: "Eris",
    type: "Dwarf planet",
    description:
      "Eris is one of the most massive known dwarf planets. Its discovery helped reshape the definition of planet and highlighted the crowded distant frontier.",
    image:
      "https://science.nasa.gov/wp-content/uploads/2023/09/eris-artist-concept-jpg.webp?w=1200",
    url: "https://science.nasa.gov/dwarf-planets/eris/facts/",
  },
];

const compareRows = [
  {
    label: "Size",
    title: "Jupiter dominates the planetary scale.",
    body:
      "Jupiter is so large that the other planets look like a family of smaller worlds beside it. Earth is the largest rocky planet, but it is tiny compared with the gas giants.",
  },
  {
    label: "Temperature",
    title: "Distance from the Sun is not the whole story.",
    body:
      "Venus is hotter than Mercury because its thick atmosphere traps heat. Atmospheric chemistry matters as much as location when comparing planets.",
  },
  {
    label: "Orbit",
    title: "A year changes dramatically across the system.",
    body:
      "Mercury completes a year in 88 Earth days, while Neptune needs about 165 Earth years. Time stretches with distance from the Sun.",
  },
  {
    label: "Moons",
    title: "The giant planets become systems of their own.",
    body:
      "Jupiter, Saturn, Uranus, and Neptune have families of moons, rings, and complex gravitational environments. Some moons are major exploration targets.",
  },
  {
    label: "Rotation",
    title: "Planets spin with surprising variety.",
    body:
      "Venus rotates backward, Uranus spins on its side, and Jupiter has the shortest day. Rotation shapes winds, magnetic fields, seasons, and storms.",
  },
  {
    label: "Atmosphere",
    title: "Air, clouds, and chemistry define the visible planet.",
    body:
      "Some worlds have almost no atmosphere, while gas and ice giants are mostly atmosphere. This changes weather, surface conditions, and how missions observe them.",
  },
];

const explorationStats = [
  { value: "4.5B", label: "Years since the Solar System formed from a collapsing cloud of gas and dust." },
  { value: "8", label: "Primary planets orbiting the Sun in the modern planetary classification." },
  { value: "5+", label: "Recognized dwarf planets, with more candidates in the outer Solar System." },
  { value: "30 AU", label: "Neptune's average distance from the Sun, marking the far planetary frontier." },
];

const factsRows = [
  {
    title: "Saturn would float in water",
    body:
      "Saturn's average density is lower than water. The idea is impossible to test literally, but it is a useful way to understand how light the gas giant is for its size.",
  },
  {
    title: "A Venus day is longer than its year",
    body:
      "Venus rotates so slowly that one day-night cycle takes longer than one orbit around the Sun. It also rotates backward compared with most planets.",
  },
  {
    title: "Mars preserves ancient water clues",
    body:
      "Dry river valleys, deltas, minerals, and polar ice show that Mars changed over time and may once have had environments more favorable to liquid water.",
  },
  {
    title: "Mercury can hide ice",
    body:
      "Even though Mercury is closest to the Sun, permanently shadowed polar craters can remain cold enough for water ice to survive.",
  },
];

function imageFallbackGradient(slug) {
  const gradients = {
    ceres: "radial-gradient(circle at 42% 38%, #d8d8d4 0 24%, #7f827d 54%, #111 74%)",
    pluto: "radial-gradient(circle at 40% 42%, #d9b98f 0 20%, #916b50 54%, #111 75%)",
    haumea: "radial-gradient(circle at 45% 45%, #f4f4f0 0 10%, #5b5c63 20%, #08080d 62%)",
    makemake: "radial-gradient(circle at 44% 45%, #b97965 0 26%, #4b2431 62%, #09090f 78%)",
    eris: "radial-gradient(circle at 45% 45%, #c6d6df 0 24%, #42505c 60%, #090a10 78%)",
  };
  return gradients[slug] || "radial-gradient(circle, #8aa0b7, #090a10)";
}

function DwarfVisual({ item }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="aspect-[4/3] bg-black" style={{ background: imageFallbackGradient(item.slug) }} />;
  }

  return (
    <img
      src={item.image}
      alt={item.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full bg-black object-cover"
    />
  );
}

const planetCreateTemplate = {
  name: "New Planet",
  slug: "new-planet",
  tagline: "Short educational tagline.",
  type: "Planet",
  description: "Write a clear planet description.",
  distance: "0 million km",
  image: "https://example.com/planet.jpg",
};

function PlanetListItem({ planet, onOpen, adminActions }) {
  return (
    <article className="grid gap-4">
      <button
        type="button"
        onClick={() => onOpen(planet.slug)}
        className="group grid gap-4 text-left"
      >
        <span className="block overflow-hidden bg-black">
          <img
            src={planet.image}
            alt={planet.name}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </span>
        <span>
          <span className="block text-xl font-bold text-white">{planet.name} Facts</span>
          <span className="mt-3 block text-base leading-7 text-slate-300/78">{planet.description}</span>
          <span className="mt-5 inline-flex items-center gap-2 text-base font-bold text-white">
            Explore {planet.name}
            <span className="grid size-4 place-items-center rounded-full bg-[#fc3d21] text-[10px] text-white">
              +
            </span>
          </span>
        </span>
      </button>
      {adminActions}
    </article>
  );
}

function DwarfListItem({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group grid gap-4">
      <span className="block overflow-hidden bg-black">
        <DwarfVisual item={item} />
      </span>
      <span>
        <span className="block text-xl font-bold text-white">{item.name} Facts</span>
        <span className="mt-3 block text-base leading-7 text-slate-300/78">{item.description}</span>
        <span className="mt-5 inline-flex items-center gap-2 text-base font-bold text-white">
          Explore {item.name}
          <span className="grid size-4 place-items-center rounded-full bg-[#fc3d21] text-[10px] text-white">
            +
          </span>
        </span>
      </span>
    </a>
  );
}

function PlanetGroupSection({ group, planets, onOpen, isAdmin, onReload }) {
  const groupPlanets = group.slugs.map((slug) => planets.find((planet) => planet.slug === slug) || getPlanet(slug)).filter(Boolean);

  return (
    <section className="border-t border-white/10 px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/70">{group.eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            {group.title}
          </h2>
          <p className="mt-6 text-lg leading-9 text-slate-300/78">{group.description}</p>
        </header>

        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {groupPlanets.map((planet) => (
            <PlanetListItem
              key={planet.slug}
              planet={planet}
              onOpen={onOpen}
              adminActions={
                isAdmin ? (
                  <AdminResourceActions
                    resourceName="planet"
                    endpoint="/astronomy/planets"
                    slug={planet.slug}
                    item={planet}
                    onUpdated={onReload}
                    onDeleted={onReload}
                  />
                ) : null
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DwarfPlanetsSection() {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/70">Dwarf Planets</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            Small worlds with planet-scale stories.
          </h2>
          <p className="mt-6 text-lg leading-9 text-slate-300/78">
            Dwarf planets orbit the Sun and are shaped by gravity, but they have not cleared their orbital neighborhoods. They complete the catalog by showing how diverse the Solar System becomes beyond the eight primary planets.
          </p>
        </header>

        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {dwarfPlanets.map((item) => (
            <DwarfListItem key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CompareSection() {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.55fr_1fr]">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/70">Comparative Science</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            Compare the worlds.
          </h2>
        </header>

        <div className="border-y border-white/12">
          {compareRows.map((row) => (
            <article key={row.label} className="grid gap-5 border-b border-white/12 py-7 last:border-b-0 md:grid-cols-[10rem_1fr]">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">{row.label}</p>
              <div>
                <h3 className="text-2xl font-semibold text-white">{row.title}</h3>
                <p className="mt-3 text-lg leading-9 text-slate-300/78">{row.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function NumbersSection() {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/70">Exploration Numbers</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            Numbers that put us in our place.
          </h2>
        </header>

        <div className="mt-12 grid border-y border-white/12 md:grid-cols-4">
          {explorationStats.map((stat) => (
            <div key={stat.value} className="border-b border-white/12 py-7 md:border-b-0 md:border-r md:px-6 md:last:border-r-0">
              <p className="font-display text-5xl font-semibold tracking-[-0.04em] text-white">{stat.value}</p>
              <p className="mt-4 text-base leading-7 text-slate-300/78">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FactsRowsSection() {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.55fr_1fr]">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/70">Did You Know?</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            Facts without the card wall.
          </h2>
        </header>

        <div className="border-y border-white/12">
          {factsRows.map((fact) => (
            <article key={fact.title} className="flex gap-6 border-b border-white/12 py-7 last:border-b-0">
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#6ecbff]" />
              <div>
                <h3 className="text-2xl font-semibold text-white">{fact.title}</h3>
                <p className="mt-3 text-lg leading-9 text-slate-300/78">{fact.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LovablePlanets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planets, setPlanets] = useState(localPlanets);
  const [hoverSlug, setHoverSlug] = useState(null);
  const [focusSlug, setFocusSlug] = useState(null);
  const labelPlanet = (focusSlug ?? hoverSlug) ? planets.find((p) => p.slug === (focusSlug ?? hoverSlug)) || getPlanet(focusSlug ?? hoverSlug) : null;
  const focusing = !!focusSlug;

  const isAdmin = user?.role === "ADMIN";

  const loadPlanets = () => {
    let active = true;

    getPlanets()
      .then((items) => {
        if (!active) return;
        setPlanets(mergePlanetsFromApi(items));
      })
      .catch(() => {
        if (active) setPlanets(localPlanets);
      });

    return () => {
      active = false;
    };
  };

  useEffect(loadPlanets, []);

  return (
    <main className="relative min-h-screen bg-[#020712] text-white">
      <Starfield />

      <section aria-label="Solar System spotlight" className="nasa-grid-bg relative w-full overflow-hidden" style={{ height: "92vh", minHeight: "640px", background: "radial-gradient(ellipse at center, #071a35 0%, #020712 72%, #000 100%)" }}>
        <SolarSystemStage
          contained
          planetList={planets}
          focusSlug={focusSlug}
          onPlanetClick={(slug) => {
            setFocusSlug(slug);
            navigate(`/planets/${slug}`);
          }}
          onFocusComplete={(slug) => navigate(`/planets/${slug}`)}
          onPlanetHover={(slug) => setHoverSlug(slug)}
        />

        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />

        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none transition-opacity duration-500 px-6" style={{ opacity: focusing ? 0 : 1 }}>
          <div className="font-display text-[10px] tracking-[0.45em] uppercase text-[#6ecbff]/70">Solar System Atlas</div>
          <h1 className="mt-4 font-display font-extralight tracking-[-0.035em] text-white/95" style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)", textShadow: "0 4px 60px rgba(0,0,0,0.7)" }}>Select a planetary target.</h1>
          {isAdmin ? (
            <div className="pointer-events-auto mt-6 flex justify-center">
              <AdminResourceActions
                resourceName="planet"
                endpoint="/astronomy/planets"
                createTemplate={planetCreateTemplate}
                onCreated={loadPlanets}
              />
            </div>
          ) : null}
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center transition-all duration-500" style={{ opacity: labelPlanet ? 1 : 0, transform: `translate(-50%, ${labelPlanet ? 0 : 12}px)` }}>
          {labelPlanet && (
            <>
              <div className="font-display text-[10px] tracking-[0.45em] uppercase text-[#6ecbff]/70">{labelPlanet.distance} from the Sun</div>
              <div className="mt-2 font-display font-extralight tracking-[-0.04em] text-white/95" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>{labelPlanet.name}</div>
              <div className="mt-1 font-display italic text-xs text-white/55">{labelPlanet.tagline}</div>
            </>
          )}
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-700" style={{ opacity: focusing ? 0.55 : 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)" }} />
      </section>

      <section aria-label="Planet smart search" className="relative w-full border-t border-white/10 bg-[#020712] py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <header className="mb-10 max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#6ecbff]/70">Planet Module Search</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
              Search the astronomy knowledge base.
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300/78">
              Natural-language search stays available, but the planet catalog below follows the NASA-style educational structure.
            </p>
          </header>
          <SmartSearchPanel />
        </div>
      </section>

      {planetGroups.map((group) => (
        <PlanetGroupSection
          key={group.eyebrow}
          group={group}
          planets={planets}
          isAdmin={isAdmin}
          onReload={loadPlanets}
          onOpen={(slug) => navigate(`/planets/${slug}`)}
        />
      ))}

      <DwarfPlanetsSection />
      <CompareSection />
      <NumbersSection />
      <FactsRowsSection />
    </main>
  );
}
