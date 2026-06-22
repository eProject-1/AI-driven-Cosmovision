import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlanet, mergePlanetFromApi, planets } from "../lib/planets";
import { Starfield } from "../components/lovable/Starfield";
import { PlanetCinematic } from "../components/lovable/PlanetCinematic";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getPlanetById } from "../services/astronomy.api";

export default function LovablePlanetDetail() {
  const { slug } = useParams();
  const [remotePlanet, setRemotePlanet] = useState(null);
  const localPlanet = getPlanet(slug);
  const planet = useMemo(
    () => (remotePlanet ? mergePlanetFromApi(remotePlanet) : localPlanet),
    [remotePlanet, localPlanet]
  );

  useEffect(() => {
    let active = true;

    if (slug) {
      getPlanetById(slug)
        .then((data) => {
          if (active) setRemotePlanet(data);
        })
        .catch(() => {
          if (active) setRemotePlanet(null);
        });
    }

    return () => {
      active = false;
    };
  }, [slug]);

  if (!planet) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-4">
        <div>
          <h1 className="text-2xl font-display">Planet not found</h1>
          <Link to="/" className="mt-4 inline-block text-foreground/70 underline">Return to the Solar System</Link>
        </div>
      </div>
    );
  }

  const idx = planets.findIndex((p) => p.slug === planet.slug);
  const prev = planets[(idx - 1 + planets.length) % planets.length];
  const next = planets[(idx + 1) % planets.length];

  return (
    <>
      <Starfield />
      <PlanetCinematic planet={planet} />

      <div aria-hidden className="fixed inset-0 z-10 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, oklch(0 0 0 / 0.5) 80%, oklch(0 0 0 / 0.95) 100%)" }} />

      <div className="fixed top-6 left-6 right-6 z-30 flex items-center justify-between text-[10px] tracking-[0.5em] uppercase text-foreground/55">
        <Link to="/" className="inline-flex items-center gap-2 hover:text-foreground/90 transition-colors"><ArrowLeft className="w-3 h-3" /> Solar System</Link>
        <span className="text-foreground/35">{String(idx + 1).padStart(2, "0")} / {String(planets.length).padStart(2, "0")}</span>
      </div>

      <main className="relative z-20 min-h-screen flex items-center px-6 md:px-16 pointer-events-none">
        <div className="max-w-xl">
          <div className="font-display text-[10px] tracking-[0.6em] uppercase text-foreground/50">{planet.distance} from the Sun</div>
          <h1 className="mt-4 font-display font-extralight leading-[0.85] tracking-[-0.05em] text-foreground/95" style={{ fontSize: "clamp(4rem, 11vw, 9rem)", textShadow: "0 4px 60px oklch(0 0 0 / 0.7)" }}>{planet.name}</h1>
          <p className="mt-4 font-display italic text-lg text-foreground/65" style={{ textShadow: "0 2px 30px oklch(0 0 0 / 0.7)" }}>{planet.tagline}</p>
          <p className="mt-8 text-base leading-relaxed text-foreground/70 max-w-lg" style={{ textShadow: "0 2px 30px oklch(0 0 0 / 0.7)" }}>{planet.description}</p>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {[ ["Diameter", planet.diameter], ["Day", planet.day], ["Year", planet.year] ].map(([k, v]) => (
              <div key={k}>
                <div className="font-display text-[9px] tracking-[0.4em] uppercase text-foreground/40">{k}</div>
                <div className="mt-1 font-display text-sm text-foreground/85">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-6 pointer-events-auto">
            <Link to="/planets" className="group inline-flex items-center gap-3 rounded-full border border-foreground/30 px-6 py-3 text-[11px] tracking-[0.4em] uppercase text-foreground/90 hover:border-foreground/80 hover:bg-foreground/5 transition-all duration-500">Explore {planet.name} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <Link to={`/planets/${prev.slug}`} className="pointer-events-auto inline-flex items-center gap-2 text-[10px] tracking-[0.5em] uppercase text-foreground/45 hover:text-foreground/90 transition-colors"><ArrowLeft className="w-3 h-3" /> {prev.name}</Link>
        <Link to={`/planets/${next.slug}`} className="pointer-events-auto inline-flex items-center gap-2 text-[10px] tracking-[0.5em] uppercase text-foreground/45 hover:text-foreground/90 transition-colors">{next.name} <ArrowRight className="w-3 h-3" /></Link>
      </div>
    </>
  );
}
