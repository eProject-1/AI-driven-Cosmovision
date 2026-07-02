import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { planets as localPlanets, getPlanet, mergePlanetsFromApi } from "../lib/planets";
import { SolarSystemStage } from "../components/lovable/SolarSystemStage";
import { Starfield } from "../components/lovable/Starfield";
import { ArrowUpRight } from "lucide-react";
import { getPlanets } from "../services/astronomy.api";
import { SmartSearchPanel } from "./SmartSearch";

export default function LovablePlanets() {
  const navigate = useNavigate();
  const [planets, setPlanets] = useState(localPlanets);
  const [status, setStatus] = useState("loading");
  const [hoverSlug, setHoverSlug] = useState(null);
  const [focusSlug, setFocusSlug] = useState(null);
  const labelPlanet = (focusSlug ?? hoverSlug) ? planets.find((p) => p.slug === (focusSlug ?? hoverSlug)) || getPlanet(focusSlug ?? hoverSlug) : null;
  const focusing = !!focusSlug;

  useEffect(() => {
    let active = true;

    getPlanets()
      .then((items) => {
        if (!active) return;
        setPlanets(mergePlanetsFromApi(items));
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#020712] text-foreground">
      <Starfield />

      <section aria-label="Solar System spotlight" className="nasa-grid-bg relative w-full overflow-hidden" style={{ height: "92vh", minHeight: "640px", background: "radial-gradient(ellipse at center, #071a35 0%, #020712 72%, #000 100%)" }}>
        <SolarSystemStage
          contained
          focusSlug={focusSlug}
          onPlanetClick={(slug) => setFocusSlug(slug)}
          onFocusComplete={(slug) => navigate(`/planets/${slug}`)}
          onPlanetHover={(slug) => setHoverSlug(slug)}
        />

        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />

        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none transition-opacity duration-500 px-6" style={{ opacity: focusing ? 0 : 1 }}>
          <div className="font-display text-[10px] tracking-[0.45em] uppercase text-[#6ecbff]/70">Solar System Atlas</div>
          <h1 className="mt-4 font-display font-extralight tracking-[-0.035em] text-foreground/95" style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)", textShadow: "0 4px 60px rgba(0,0,0,0.7)" }}>Select a planetary target.</h1>
          <p className="mt-3 text-sm text-foreground/55">{planets.length.toString().padStart(2, "0")} worlds / {status === "ready" ? "database linked" : "local orbital simulation"}</p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center transition-all duration-500" style={{ opacity: labelPlanet ? 1 : 0, transform: `translate(-50%, ${labelPlanet ? 0 : 12}px)` }}>
          {labelPlanet && (
            <>
              <div className="font-display text-[10px] tracking-[0.45em] uppercase text-[#6ecbff]/70">{labelPlanet.distance} from the Sun</div>
              <div className="mt-2 font-display font-extralight tracking-[-0.04em] text-foreground/95" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>{labelPlanet.name}</div>
              <div className="mt-1 font-display italic text-xs text-foreground/55">{labelPlanet.tagline}</div>
            </>
          )}
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-700" style={{ opacity: focusing ? 0.55 : 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)" }} />
      </section>

      <section aria-label="Planet smart search" className="relative w-full bg-[#020712] py-24 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <header className="mb-10 max-w-3xl">
            <p className="font-display text-[11px] tracking-[0.34em] uppercase text-[#6ecbff]/70">Planet Module Search</p>
            <h2 className="mt-4 font-display font-extralight tracking-[-0.03em] text-foreground/95" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.05 }}>
              Search the astronomy knowledge base.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-foreground/60">
              Natural-language search is integrated here so planet exploration, observatory links, events, and related sky data stay in one discovery workflow.
            </p>
          </header>
          <SmartSearchPanel />
        </div>
      </section>

      <section aria-label="Planet directory" className="relative w-full bg-[#040b18] py-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <header className="max-w-2xl">
            <p className="font-display text-[11px] tracking-[0.34em] uppercase text-[#6ecbff]/70">Planet Directory</p>
            <h2 className="mt-4 font-display font-extralight tracking-[-0.03em] text-foreground/95" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.05 }}>Eight primary targets.</h2>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-foreground/60">A compact mission catalogue of mass, motion, distance, light, and geological character across the Solar System.</p>
            {status === "error" && (
              <p className="mt-4 text-sm font-light text-red-200/80">Backend unavailable, showing local planet assets.</p>
            )}
          </header>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {planets.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => navigate(`/planets/${p.slug}`)}
                className="nasa-card group relative p-6 text-left backdrop-blur-sm"
              >
                <span className="absolute left-0 top-0 h-1 w-16 bg-[#fc3d21] opacity-70 transition-all duration-300 group-hover:w-28" />
                <div className="aspect-square relative grid place-items-center">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-25 group-hover:opacity-50 transition" style={{ background: "radial-gradient(circle, rgba(110,203,255,0.32), transparent 60%)" }} />
                  <img src={p.image} alt={p.name} loading="lazy" className="relative w-full h-full object-contain" />
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-xl font-light tracking-tight">{p.name}</h3>
                    <p className="mt-1 text-[11px] font-light tracking-[0.15em] uppercase text-foreground/45">{p.tagline}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Planet knowledge" className="relative w-full bg-[#040b18] py-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <header className="max-w-2xl mb-16">
            <p className="font-display text-[11px] tracking-[0.34em] uppercase text-[#6ecbff]/70">Comparative Science</p>
            <h2 className="mt-4 font-display font-extralight tracking-[-0.03em] text-foreground/95" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)", lineHeight: 1.1 }}>Compare the worlds.</h2>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Size */}
            <div className="nasa-card group relative p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                {/* subtle monochrome icon */}
                <div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center text-foreground/55">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M3 21l18-18" />
                    <path d="M7 17l-2-2" />
                    <path d="M17 7l2 2" />
                    <path d="M5 19l-2-2" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-base font-light text-foreground mb-2">Size</h3>
              <p className="text-sm text-foreground/65 leading-relaxed font-light">Jupiter is the largest planet in our solar system. All other planets could fit inside it 1,300 times.</p>
              <p className="text-[11px] text-foreground/45 mt-4 font-display tracking-wide">Jupiter vs the rest</p>
            </div>

            {/* Temperature */}
            <div className="nasa-card group relative p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center text-foreground/55">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M14 14.76V5a1 1 0 0 0-2 0v9.76a3 3 0 1 0 2 0z" />
                    <path d="M9 5h-1" />
                    <path d="M16 5h-1" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-base font-light text-foreground mb-2">Temperature</h3>
              <p className="text-sm text-foreground/65 leading-relaxed font-light">Mercury, closest to the Sun, isn't the hottest. Venus's thick atmosphere traps 462°C, making it the inferno of our system.</p>
              <p className="text-[11px] text-foreground/45 mt-4 font-display tracking-wide">Hottest is not closest</p>
            </div>

            {/* Orbit */}
            <div className="nasa-card group relative p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center text-foreground/55">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <ellipse cx="12" cy="12" rx="3.5" ry="9" />
                    <path d="M12 3a9 9 0 1 0 0 18" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-base font-light text-foreground mb-2">Orbit</h3>
              <p className="text-sm text-foreground/65 leading-relaxed font-light">A year on Neptune is 165 Earth years. On Mercury, it takes just 88 days. Time itself bends across the solar system.</p>
              <p className="text-[11px] text-foreground/45 mt-4 font-display tracking-wide">A year, redefined</p>
            </div>

            {/* Moons */}
            <div className="nasa-card group relative p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center text-foreground/55">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-base font-light text-foreground mb-2">Moons</h3>
              <p className="text-sm text-foreground/65 leading-relaxed font-light">Jupiter commands 95 known moons. Saturn has 146. Mercury and Venus stand alone with none. A cosmic hierarchy of companions.</p>
              <p className="text-[11px] text-foreground/45 mt-4 font-display tracking-wide">A crowded retinue</p>
            </div>

            {/* Rotation */}
            <div className="nasa-card group relative p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center text-foreground/55">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <path d="M21 3v6h-6" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-base font-light text-foreground mb-2">Rotation</h3>
              <p className="text-sm text-foreground/65 leading-relaxed font-light">Uranus spins on its side at 98° tilt. Venus rotates backward, slower than it orbits. The solar system is delightfully asymmetric.</p>
              <p className="text-[11px] text-foreground/45 mt-4 font-display tracking-wide">Sideways and backward</p>
            </div>

            {/* Winds */}
            <div className="nasa-card group relative p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center text-foreground/55">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M3 12h3c2 0 2-3 4-3s2 3 4 3h3" />
                    <path d="M3 18h3c2 0 2-3 4-3s2 3 4 3h3" />
                    <path d="M3 6h3c2 0 2-3 4-3s2 3 4 3h3" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-base font-light text-foreground mb-2">Winds</h3>
              <p className="text-sm text-foreground/65 leading-relaxed font-light">Neptune's winds exceed 2,100 km/h. Jupiter's Great Red Spot storms have lasted over 400 years. Turbulence on a cosmic scale.</p>
              <p className="text-[11px] text-foreground/45 mt-4 font-display tracking-wide">The fastest weather</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Exploration numbers" className="relative w-full bg-[#020712] py-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <header className="max-w-2xl mb-16">
            <p className="font-display text-[11px] tracking-[0.34em] uppercase text-[#6ecbff]/70">Exploration Numbers</p>
            <h2 className="mt-4 font-display font-extralight tracking-[-0.03em] text-foreground/95" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)", lineHeight: 1.1 }}>Numbers that put us in our place.</h2>
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
            {/* 4.5B years */}
            <div className="nasa-card group relative p-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-light text-foreground/85 mb-2">4.5B</p>
              <p className="text-sm text-foreground/65 font-light">Years since our solar system formed from a collapsing nebula.</p>
            </div>

            {/* 8 planets */}
            <div className="nasa-card group relative p-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-light text-foreground/85 mb-2">8</p>
              <p className="text-sm text-foreground/65 font-light">Planets in our solar system, each with a unique story to tell.</p>
            </div>

            {/* 200+ missions */}
            <div className="nasa-card group relative p-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-light text-foreground/85 mb-2">200+</p>
              <p className="text-sm text-foreground/65 font-light">Space missions have explored our cosmic neighborhood.</p>
            </div>

            {/* 30 AU */}
            <div className="nasa-card group relative p-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-light text-foreground/85 mb-2">30 AU</p>
              <p className="text-sm text-foreground/65 font-light">Neptune's average distance from the Sun. The edge of our planetary realm.</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-12">
            <h3 className="font-display text-lg font-light text-foreground/90 mb-6">Did you know?</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Saturn floats */}
              <div className="rounded-xl border border-slate-700/20 bg-white/[0.02] p-5 backdrop-blur-sm">
                <p className="font-display text-sm font-light text-foreground/80 mb-2">Saturn</p>
                <p className="text-sm text-foreground/65 font-light">Saturn is less dense than water. It would float in an ocean if one existed large enough.</p>
              </div>

              {/* Venus day longer than year */}
              <div className="rounded-xl border border-slate-700/20 bg-white/[0.02] p-5 backdrop-blur-sm">
                <p className="font-display text-sm font-light text-foreground/80 mb-2">Venus</p>
                <p className="text-sm text-foreground/65 font-light">A Venusian day (243 Earth days) is longer than its year (225 days). Time runs differently there.</p>
              </div>

              {/* Olympus Mons */}
              <div className="rounded-xl border border-slate-700/20 bg-white/[0.02] p-5 backdrop-blur-sm">
                <p className="font-display text-sm font-light text-foreground/80 mb-2">Mars</p>
                <p className="text-sm text-foreground/65 font-light">Olympus Mons rises 22 km above Mars' surface. The largest volcano in our solar system.</p>
              </div>

              {/* Mercury ice */}
              <div className="rounded-xl border border-slate-700/20 bg-white/[0.02] p-5 backdrop-blur-sm">
                <p className="font-display text-sm font-light text-foreground/80 mb-2">Mercury</p>
                <p className="text-sm text-foreground/65 font-light">Despite its proximity to the Sun, Mercury harbors water ice in shadowed craters. An unexpected treasure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
