import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HyperspaceTransition } from "../components/lovable/HyperspaceTransition";
import { Button } from "../components/lovable/ui/button";
import { ArrowRight, CalendarDays, FileText, Orbit, Radio, Satellite, Telescope } from "lucide-react";
import starfieldImage from "../assets/starfield.jpg";
import earthImage from "../assets/earth.png";
import jupiterImage from "../assets/jupiter.png";
import saturnImage from "../assets/saturn.png";

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
      <section aria-label="Hero" className="nasa-grid-bg relative min-h-screen w-full overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 110%, #0b1b35 0%, #07111f 45%, #020712 100%)" }}>
        <div aria-hidden className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: "linear-gradient(to right, rgba(110,203,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(110,203,255,0.08) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse at 50% 40%, black 28%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 28%, transparent 80%)" }} />
        <HeroStars />
        <div aria-hidden className="absolute -top-40 left-1/2 h-[58vh] w-[120vw] -translate-x-1/2 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(11,61,145,0.28) 0%, transparent 62%)", filter: "blur(42px)" }} />
        <div aria-hidden className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: "-65vw", width: "150vw", height: "150vw", borderRadius: "50%", background: "radial-gradient(circle at 50% 18%, #19427d 0%, #102a55 22%, #081b3b 45%, #040a18 66%, transparent 75%)", boxShadow: "0 -40px 120px rgba(11,61,145,0.35), inset 0 80px 120px rgba(210,232,255,0.1)" }} />
        <div aria-hidden className="absolute left-0 right-0 pointer-events-none" style={{ bottom: "calc(-65vw + 150vw - 8px)", height: "120px", background: "linear-gradient(to top, rgba(110,203,255,0.38), rgba(110,203,255,0.07) 40%, transparent 100%)", filter: "blur(18px)" }} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center pt-24">
          <div className="nasa-kicker px-4 py-1.5 backdrop-blur-md">
            <span className="font-display text-[11px] tracking-[0.28em] uppercase text-foreground/76">CosmoVision Public Mission Interface</span>
          </div>

          <h1 className="mt-8 font-display font-extralight tracking-[-0.035em] text-foreground" style={{ fontSize: "clamp(2.8rem, 7vw, 6.25rem)", lineHeight: 1.02 }}>
            Explore verified
            <br />
            <span style={{ backgroundImage: "linear-gradient(180deg, #ffffff 0%, #cfe9ff 58%, #6ecbff 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>astronomy data</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base sm:text-lg font-light leading-relaxed text-foreground/66">
            A mission-control view for planets, constellations, observatories, sky events, and AI-assisted stargazing recommendations.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Button onClick={handleLaunch} size="lg" className="mission-button group h-12 px-7 text-sm font-medium">Open Solar System <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" /></Button>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/38">
            <span className="font-display text-[10px] tracking-[0.36em] uppercase">Scroll for mission brief</span>
            <span className="h-8 w-px bg-gradient-to-b from-foreground/40 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      <HyperspaceTransition active={stage === "warp"} durationMs={2600} onDone={() => navigate("/planets")} />

      <section className="relative border-t border-white/10 bg-[#040b18] py-28" aria-labelledby="stories-title">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-3xl">
            <p className="font-display text-[11px] tracking-[0.34em] uppercase text-[#6ecbff]/70 mb-4">Mission Brief</p>
            <h2 id="stories-title" className="font-display text-4xl md:text-6xl font-light tracking-[-0.025em] leading-tight text-foreground mb-5">
              Signals worth tracking.
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
              imageSrc={starfieldImage}
              imageLabel="JWST Deep Field"
              imageClassName="md:h-96"
            />

            <StoryFeature
              reversed
              meta="NASA - JPL - Arrival 2030"
              label="Active mission"
              title="Europa Clipper begins its long cruise to Jupiter."
              body="NASA's flagship ice-moon mission is en route to a world whose subsurface ocean may hold twice the water of all Earth's oceans combined. Arrival: April 2030."
              imageSrc={jupiterImage}
              imageLabel="Europa Clipper Mission"
              textClassName="md:col-start-2"
              layoutClassName="md:grid-cols-[1.15fr_0.9fr] md:gap-16"
            />

            <StoryFeature
              meta="Cerro Pachon - Chile"
              label="Featured observatory"
              title="Vera C. Rubin: a 3.2-gigapixel survey of the southern sky."
              body="Beginning its decade-long Legacy Survey of Space and Time, Rubin will image the entire visible sky every few nights, cataloging billions of moving objects in unprecedented detail."
              imageSrc={earthImage}
              imageLabel="Vera C. Rubin Observatory"
              layoutClassName="md:grid-cols-[0.85fr_1.15fr]"
            />

            <StoryFeature
              reversed
              meta="Free - Self-paced - 8 lessons"
              label="Education"
              title="Learn the night sky in eight short chapters."
              body="A guided path through stars, constellations, planetary motion, and the deep sky - designed for curious beginners and seasoned amateurs alike."
              imageSrc={saturnImage}
              imageLabel="Night Sky Learning Path"
              textClassName="md:col-start-2"
              layoutClassName="md:grid-cols-[1.05fr_0.95fr] md:gap-16"
            />
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-[#020712] py-24" aria-labelledby="signal-title">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between mb-16">
            <div>
              <p className="font-display text-xs tracking-[0.34em] uppercase text-[#6ecbff]/70 mb-3">Signal</p>
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
                <article key={card.title} className="nasa-card group min-h-52 p-5">
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
  imageSrc,
  imageLabel,
  reversed = false,
  layoutClassName = "md:grid-cols-[0.95fr_1.25fr]",
  textClassName = "",
  imageClassName = "",
}) {
  const text = (
    <div className={`relative border-l border-[#fc3d21]/55 pl-6 md:pl-8 ${textClassName}`}>
      <p className="font-display text-[11px] tracking-[0.28em] uppercase text-[#6ecbff]/65 mb-4">{meta}</p>
      <p className="text-[11px] tracking-[0.24em] uppercase text-foreground/38 mb-3">{label}</p>
      <h3 className="font-display text-3xl md:text-4xl font-light tracking-[-0.018em] leading-tight text-foreground mb-5">{title}</h3>
      <p className="text-foreground/60 text-sm md:text-base font-light leading-relaxed">{body}</p>
    </div>
  );

  const image = (
    <div className={`nasa-card group relative h-72 md:h-88 flex items-end justify-start overflow-hidden p-7 text-foreground/80 font-display text-sm tracking-[0.18em] uppercase ${imageClassName}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageLabel}
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-95"
          loading="lazy"
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-[#020712]/88 via-[#020712]/28 to-transparent" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(110,203,255,0.28),transparent_34%)]" />
      <span className="absolute left-0 top-0 h-1 w-24 bg-[#fc3d21]" />
      <span className="relative z-10">{imageLabel}</span>
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
