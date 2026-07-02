import { Link } from "react-router-dom";

const sections = [
  { to: "/planets", label: "Planets" },
  { to: "/constellations", label: "Constellations" },
  { to: "/observatory", label: "Observatory" },
  { to: "/news", label: "News" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assistant", label: "Assistant" },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-foreground/10 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-8 md:px-14 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-display text-[11px] font-medium tracking-[0.4em] uppercase text-foreground/80">SPACEVERSE</Link>
            <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-foreground/50">A cinematic field guide to the Solar System and the sky above it.</p>
          </div>

          <div>
            <p className="text-[10px] font-light tracking-[0.4em] uppercase text-foreground/40">Explore</p>
            <ul className="mt-6 space-y-3">
              {sections.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="text-sm font-light text-foreground/60 hover:text-foreground transition-colors duration-500">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-light tracking-[0.4em] uppercase text-foreground/40">Signal</p>
            <p className="mt-6 text-sm font-light leading-relaxed text-foreground/55">Built with curiosity. Imagery courtesy of NASA, ESA, and the open-source astronomy community.</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-foreground/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-light tracking-[0.3em] uppercase text-foreground/35">&copy; {new Date().getFullYear()} SPACEVERSE</p>
          <p className="text-[10px] font-light tracking-[0.3em] uppercase text-foreground/35">Made under a quiet sky</p>
        </div>
      </div>
    </footer>
  );
}
