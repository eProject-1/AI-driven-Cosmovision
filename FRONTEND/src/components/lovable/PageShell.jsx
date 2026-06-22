import { Starfield } from "./Starfield";

export function PageShell({ eyebrow, title, lead, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Starfield />

      <section className="relative z-10 mx-auto max-w-6xl px-8 md:px-14 pt-40 pb-16">
        {eyebrow ? (
          <p className="font-sans text-[10px] font-light tracking-[0.45em] uppercase text-foreground/40">{eyebrow}</p>
        ) : null}
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-light tracking-tight">{title}</h1>
        {lead ? <p className="mt-6 max-w-xl text-sm md:text-base font-light leading-relaxed text-foreground/60">{lead}</p> : null}
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-8 md:px-14 pb-32">{children}</section>
    </main>
  );
}

export function ContentPlaceholder({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-foreground/15 bg-background/40 px-8 py-16 text-center backdrop-blur-sm">
      <p className="text-[10px] font-light tracking-[0.4em] uppercase text-foreground/35">Placeholder</p>
      <p className="mt-4 font-display text-lg font-light text-foreground/55">{label}</p>
    </div>
  );
}
