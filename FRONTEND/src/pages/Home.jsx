import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HyperspaceTransition } from "../components/lovable/HyperspaceTransition";
import { Button } from "../components/lovable/ui/button";
import { ArrowRight, CalendarDays, FileText, Orbit, Radio, Satellite, Telescope } from "lucide-react";

const signalCards = [
  {
    label: "Event",
    icon: CalendarDays,
    title: "Lyrids Meteor Shower Peak",
    body: "Peak viewing tonight through April 23. Best observed after midnight with clear skies.",
    time: "Tonight - 23:00 UTC",
  },
  {
    label: "Mission",
    icon: Satellite,
    title: "James Webb Mirror Maintenance",
    body: "Scheduled checkup on primary mirror segments. Part of ongoing observatory optimization.",
    time: "Apr 22 - 14:30 UTC",
  },
  {
    label: "Article",
    icon: FileText,
    title: "New Exoplanet Discovery in Proxima Centauri",
    body: "Terrestrial-mass planet detected in habitable zone. Spectroscopy confirms water signatures.",
    time: "Apr 21 - 09:15 UTC",
  },
  {
    label: "Event",
    icon: Orbit,
    title: "ISS Pass Over North America",
    body: "International Space Station visible across major cities. Duration: 5 minutes. Clear view expected.",
    time: "Tomorrow - 21:45 UTC",
  },
  {
    label: "Discovery",
    icon: Radio,
    title: "Supermassive Black Hole Early Universe",
    body: "Most ancient SMBH found, formed less than 100 million years after the Big Bang. Challenges formation models.",
    time: "Apr 20 - 16:20 UTC",
  },
  {
    label: "Observatory",
    icon: Telescope,
    title: "Chandra X-Ray Observatory Status Update",
    body: "Resumed full operations after scheduled maintenance. New observations of Cassiopeia A underway.",
    time: "Apr 19 - 11:00 UTC",
  },
];

export default function LovableHome() {
  const [stage, setStage] = useState("hero");
  const navigate = useNavigate();

  const handleLaunch = () => {
    if (stage !== "hero") return;
    setStage("warp");
  };

  return (
    <>
      <section aria-label="Hero" className="relative min-h-screen w-full overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 110%, #10162B 0%, #0B1020 45%, #050816 100%)" }}>
        <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "linear-gradient(to right, rgba(140,170,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(140,170,255,0.08) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)" }} />
        <HeroStars />
        <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(100,140,255,0.18) 0%, transparent 60%)", filter: "blur(40px)" }} />
        <div aria-hidden className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: "-65vw", width: "150vw", height: "150vw", borderRadius: "50%", background: "radial-gradient(circle at 50% 18%, #2a4d8f 0%, #18305f 22%, #0d1a3a 45%, #070c1f 65%, transparent 75%)", boxShadow: "0 -40px 120px rgba(80,140,255,0.35), inset 0 80px 120px rgba(180,210,255,0.12)" }} />
        <div aria-hidden className="absolute left-0 right-0 pointer-events-none" style={{ bottom: "calc(-65vw + 150vw - 8px)", height: "120px", background: "linear-gradient(to top, rgba(120,170,255,0.45), rgba(120,170,255,0.08) 40%, transparent 100%)", filter: "blur(18px)" }} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(120,180,255,0.9)]" />
            <span className="font-display text-[11px] tracking-[0.32em] uppercase text-foreground/70">AI-Driven Astronomy Exploration</span>
          </div>

          <h1 className="mt-8 font-display font-extralight tracking-[-0.035em] text-foreground" style={{ fontSize: "clamp(2.8rem, 7vw, 6.25rem)", lineHeight: 1.02 }}>
            Explore the Universe
            <br />
            <span style={{ backgroundImage: "linear-gradient(180deg, #ffffff 0%, #b9c8ff 60%, #6f8bd8 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Like Never Before</span>
          </h1>

          <p className="mt-7 max-w-xl text-base sm:text-lg font-light leading-relaxed text-foreground/65">Travel through planets, constellations, observatories, and real-time cosmic discoveries.</p>

          <div className="mt-10 flex items-center gap-4">
            <Button onClick={handleLaunch} size="lg" className="group h-12 rounded-full px-7 text-sm font-medium bg-white text-[#050816] hover:bg-white/90 shadow-[0_10px_40px_-10px_rgba(140,180,255,0.6)]">Get Started <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" /></Button>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/40">
            <span className="font-display text-[10px] tracking-[0.4em] uppercase">Scroll to enter</span>
            <span className="h-8 w-px bg-gradient-to-b from-foreground/40 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      <HyperspaceTransition active={stage === "warp"} durationMs={2600} onDone={() => navigate("/planets")} />

      <section className="relative py-28 bg-[#070b1c]" aria-labelledby="stories-title">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-3xl">
            <p className="font-display text-[11px] tracking-[0.4em] uppercase text-foreground/45 mb-4">Chapter II</p>
            <h2 id="stories-title" className="font-display text-4xl md:text-6xl font-light tracking-[-0.025em] leading-tight text-foreground mb-5">
              Stories from the edge of the cosmos
            </h2>
            <p className="text-foreground/58 max-w-2xl text-base font-light leading-relaxed">
              Hand-picked discoveries, missions, and observatories - the moments that are quietly rewriting our map of the universe.
            </p>
          </div>

          <div className="grid gap-24">
            <StoryFeature
              meta="Cosmology - JWST NIRSpec"
              label="Latest discovery"
              title="JWST resolves a galaxy 290M years after the Big Bang."
              body="New deep-field observations push the cosmic frontier earlier than any prior survey, suggesting galaxy formation accelerated within the first 300 million years of cosmic history."
              imageLabel="JWST Deep Field"
              imageClassName="md:h-96"
            />

            <StoryFeature
              reversed
              meta="NASA - JPL - Arrival 2030"
              label="Active mission"
              title="Europa Clipper begins its long cruise to Jupiter."
              body="NASA's flagship ice-moon mission is en route to a world whose subsurface ocean may hold twice the water of all Earth's oceans combined. Arrival: April 2030."
              imageLabel="Europa Clipper Mission"
              textClassName="md:col-start-2"
              layoutClassName="md:grid-cols-[1.15fr_0.9fr] md:gap-16"
            />

            <StoryFeature
              meta="Cerro Pachon - Chile"
              label="Featured observatory"
              title="Vera C. Rubin: a 3.2-gigapixel survey of the southern sky."
              body="Beginning its decade-long Legacy Survey of Space and Time, Rubin will image the entire visible sky every few nights, cataloging billions of moving objects in unprecedented detail."
              imageLabel="Vera C. Rubin Observatory"
              layoutClassName="md:grid-cols-[0.85fr_1.15fr]"
            />

            <StoryFeature
              reversed
              meta="Free - Self-paced - 8 lessons"
              label="Education"
              title="Learn the night sky in eight short chapters."
              body="A guided path through stars, constellations, planetary motion, and the deep sky - designed for curious beginners and seasoned amateurs alike."
              imageLabel="Night Sky Learning Path"
              textClassName="md:col-start-2"
              layoutClassName="md:grid-cols-[1.05fr_0.95fr] md:gap-16"
            />
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-[#050816]" aria-labelledby="signal-title">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between mb-16">
            <div>
              <p className="font-display text-xs tracking-[0.4em] uppercase text-foreground/45 mb-3">Signal</p>
              <h2 id="signal-title" className="font-display text-3xl md:text-4xl font-light tracking-[-0.02em] text-foreground">
                This week
              </h2>
              <p className="text-foreground/55 text-sm font-light mt-2">Latest news & celestial events</p>
            </div>
            <button onClick={() => navigate("/news")} className="hidden md:flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors">
              All news <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signalCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="group min-h-52 border border-white/10 bg-white/[0.025] p-5 transition-colors duration-300 hover:bg-white/[0.04]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-7 h-7 flex items-center justify-center text-foreground/55">
                      <Icon className="w-4 h-4" strokeWidth={1.4} />
                    </div>
                    <p className="text-xs tracking-widest uppercase text-foreground/50">{card.label}</p>
                  </div>
                  <h3 className="font-display text-lg font-light leading-snug text-foreground mb-3">{card.title}</h3>
                  <p className="text-sm text-foreground/56 font-light leading-relaxed">{card.body}</p>
                  <p className="text-[11px] tracking-[0.18em] uppercase text-foreground/38 mt-5">{card.time}</p>
                </article>
              );
            })}
          </div>

          <div className="md:hidden mt-8 text-center">
            <button onClick={() => navigate("/news")} className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors">
              All news <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function StoryFeature({
  meta,
  label,
  title,
  body,
  imageLabel,
  reversed = false,
  layoutClassName = "md:grid-cols-[0.95fr_1.25fr]",
  textClassName = "",
  imageClassName = "",
}) {
  const text = (
    <div className={`relative border-l border-white/12 pl-6 md:pl-8 ${textClassName}`}>
      <p className="font-display text-[11px] tracking-[0.32em] uppercase text-foreground/42 mb-4">{meta}</p>
      <p className="text-[11px] tracking-[0.26em] uppercase text-foreground/36 mb-3">{label}</p>
      <h3 className="font-display text-3xl md:text-4xl font-light tracking-[-0.018em] leading-tight text-foreground mb-5">{title}</h3>
      <p className="text-foreground/60 text-sm md:text-base font-light leading-relaxed">{body}</p>
    </div>
  );

  const image = (
    <div className={`h-72 md:h-88 border border-white/10 bg-white/[0.025] flex items-end justify-start p-7 text-foreground/35 font-display text-sm tracking-[0.18em] uppercase ${imageClassName}`}>
      {imageLabel}
    </div>
  );

  return (
    <article className={`grid gap-8 md:gap-14 items-center md:grid-flow-dense ${layoutClassName}`}>
      {reversed ? (
        <>
          {image}
          {text}
        </>
      ) : (
        <>
          {text}
          {image}
        </>
      )}
    </article>
  );
}

function HeroStars() {
  const stars = Array.from({ length: 110 }).map((_, i) => {
    const seed = i * 9301 + 49297;
    const r1 = (seed % 233280) / 233280;
    const r2 = ((seed * 7) % 233280) / 233280;
    const r3 = ((seed * 13) % 233280) / 233280;
    return {
      left: r1 * 100,
      top: r2 * 70,
      size: 0.6 + r3 * 1.6,
      opacity: 0.3 + r3 * 0.7,
      delay: r1 * 6,
      duration: 3 + r2 * 6,
    };
  });
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-white animate-twinkle-soft" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.opacity, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`, boxShadow: s.size > 1.6 ? "0 0 6px rgba(200,220,255,0.7), 0 0 14px rgba(120,160,255,0.25)" : undefined }} />
      ))}
    </div>
  );
}
