import { useEffect, useRef } from "react";

/**
 * Deep space atmosphere.
 *
 * Design intent: vast emptiness, sparse pinpoint stars, two soft nebula
 * washes, a faint dust haze, and a heavy vignette. Inspired by Interstellar,
 * JWST deep-field plates, and Apple's dark product backdrops. The beauty
 * comes from negative space — keep it quiet.
 */
export function Starfield({ intensity = 1 }: { intensity?: number }) {
  const farStars = useRef<HTMLDivElement>(null);
  const nearStars = useRef<HTMLDivElement>(null);
  const nebula = useRef<HTMLDivElement>(null);
  const dust = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const apply = (y: number) => {
      if (farStars.current) farStars.current.style.transform = `translate3d(0, ${y * -0.04 * intensity}px, 0)`;
      if (nearStars.current) nearStars.current.style.transform = `translate3d(0, ${y * -0.14 * intensity}px, 0)`;
      if (nebula.current) nebula.current.style.transform = `translate3d(0, ${y * -0.06 * intensity}px, 0)`;
      if (dust.current) dust.current.style.transform = `translate3d(0, ${y * -0.02 * intensity}px, 0)`;
    };

    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scroller = document.querySelector<HTMLElement>("[data-scroll-container]");
        const y = scroller ? scroller.scrollTop : window.scrollY;
        apply(y);
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    const obs = new MutationObserver(() => {
      const scroller = document.querySelector<HTMLElement>("[data-scroll-container]");
      if (scroller) {
        scroller.addEventListener("scroll", handler, { passive: true });
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const scroller = document.querySelector<HTMLElement>("[data-scroll-container]");
    scroller?.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => {
      window.removeEventListener("scroll", handler);
      scroller?.removeEventListener("scroll", handler);
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [intensity]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Deep void — near-black, faintest hint of blue. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 40%, oklch(0.09 0.025 265) 0%, oklch(0.05 0.02 270) 45%, oklch(0.02 0.01 270) 100%)",
        }}
      />

      {/* Cosmic dust — very low-frequency noise, barely visible. */}
      <div
        ref={dust}
        className="absolute -inset-[10%] opacity-[0.07] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, oklch(0.6 0.08 260 / 0.4), transparent 55%), radial-gradient(circle at 75% 70%, oklch(0.55 0.06 280 / 0.35), transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      {/* Far star field — sparse, tiny, mostly dim. */}
      <div ref={farStars} className="absolute -inset-[10%]">
        {FAR_STARS.map((s, i) => (
          <span
            key={`f-${i}`}
            className="absolute rounded-full bg-white animate-twinkle-soft"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Near stars — a handful, with gentle bloom. */}
      <div ref={nearStars} className="absolute -inset-[20%]">
        {NEAR_STARS.map((s, i) => (
          <span
            key={`n-${i}`}
            className="absolute rounded-full bg-white animate-twinkle-soft"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              boxShadow: `0 0 ${s.size * 4}px rgba(220,230,255,0.55), 0 0 ${s.size * 9}px rgba(160,180,255,0.18)`,
            }}
          />
        ))}
      </div>

      {/* Volumetric nebula — two distant, soft washes. Subtle. */}
      <div ref={nebula} className="absolute inset-0">
        <div
          className="absolute opacity-[0.32] mix-blend-screen"
          style={{
            left: "-15%",
            top: "10%",
            width: "75vw",
            height: "75vw",
            background:
              "radial-gradient(circle at center, oklch(0.5 0.18 285 / 0.55) 0%, oklch(0.4 0.14 280 / 0.25) 35%, transparent 65%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="absolute opacity-[0.22] mix-blend-screen"
          style={{
            right: "-20%",
            bottom: "5%",
            width: "80vw",
            height: "80vw",
            background:
              "radial-gradient(circle at center, oklch(0.45 0.16 245 / 0.5) 0%, oklch(0.35 0.12 250 / 0.2) 40%, transparent 70%)",
            filter: "blur(110px)",
          }}
        />
        {/* Faint warm core — distant galactic glow */}
        <div
          className="absolute opacity-[0.12] mix-blend-screen"
          style={{
            left: "55%",
            top: "55%",
            width: "30vw",
            height: "30vw",
            background:
              "radial-gradient(circle at center, oklch(0.7 0.12 60 / 0.45) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
      </div>

      {/* Heavy vignette — anchors the eye, deepens the void. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, oklch(0.02 0.01 270 / 0.55) 75%, oklch(0 0 0 / 0.9) 100%)",
        }}
      />

      {/* Film grain — almost imperceptible, kills banding. */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
    </div>
  );
}

// Deterministic, hand-tuned distributions so positions don't shift between renders.
type Star = { x: number; y: number; size: number; opacity: number; delay: number; duration: number };

const seeded = (count: number, opts: { minSize: number; maxSize: number; minOpacity: number; maxOpacity: number; seed: number }): Star[] => {
  const out: Star[] = [];
  let s = opts.seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: rand() * 100,
      y: rand() * 100,
      size: opts.minSize + rand() * (opts.maxSize - opts.minSize),
      opacity: opts.minOpacity + rand() * (opts.maxOpacity - opts.minOpacity),
      delay: rand() * 8,
      duration: 4 + rand() * 8,
    });
  }
  return out;
};

// Sparse — far fewer stars than before. Space should feel empty.
const FAR_STARS = seeded(70, { minSize: 0.6, maxSize: 1.4, minOpacity: 0.25, maxOpacity: 0.7, seed: 17 });
const NEAR_STARS = seeded(18, { minSize: 1.4, maxSize: 2.6, minOpacity: 0.7, maxOpacity: 1, seed: 91 });

export function FloatingParticles({ count = 10 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 41 + 7) % 100;
        const top = (i * 67 + 13) % 100;
        const size = ((i % 2) + 1) * 1.2;
        const dur = 14 + (i % 5) * 3;
        const delay = (i % 5) * 1.1;
        return (
          <span
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              filter: "blur(0.5px)",
              boxShadow: "0 0 10px rgba(180,200,255,0.5)",
              animation: `float-particle ${dur}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
