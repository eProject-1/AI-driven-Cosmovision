
import { PageShell } from "../components/lovable/PageShell";
import { DividerList } from "../components/lovable/Framing";

export default function LovableNews() {
  const stories = [
    {
      date: "10 Jun 2026",
      tag: "James Webb",
      title: "New atmospheric signatures detected on TRAPPIST-1e",
      excerpt: "Spectra suggest the presence of water vapor and a thin nitrogen-rich envelope around the temperate exoplanet.",
    },
    {
      date: "07 Jun 2026",
      tag: "Artemis",
      title: "Artemis IV crew enters final integrated training",
      excerpt: "The mission will deliver the first segment of the Gateway station to lunar orbit later this year.",
    },
    {
      date: "02 Jun 2026",
      tag: "Mars",
      title: "Perseverance caches its 24th sample on Jezero's western rim",
      excerpt: "The carbonate-rich tube is considered one of the most promising candidates for future Earth return.",
    },
    {
      date: "28 May 2026",
      tag: "Solar",
      title: "Parker Solar Probe survives closest approach yet",
      excerpt: "At 6.1 million kilometers from the photosphere, the spacecraft returned the sharpest corona imagery to date.",
    },
  ];

  return (
    <PageShell
      eyebrow="Chapter IV"
      title="News"
      lead="Dispatches from observatories, agencies, and missions across the Solar System and beyond."
    >
      <DividerList>
        {stories.map((s) => (
          <article key={s.title} className="px-6 py-8 sm:px-8 md:px-10 md:py-10">
            <div className="flex items-center gap-4 text-[10px] font-light tracking-[0.3em] uppercase text-foreground/40">
              <span>{s.date}</span>
              <span className="h-px w-6 bg-foreground/20" />
              <span>{s.tag}</span>
            </div>
            <h2 className="mt-4 font-display text-2xl md:text-3xl font-light tracking-tight leading-snug">{s.title}</h2>
            <p className="mt-4 max-w-2xl text-sm md:text-base font-light leading-relaxed text-foreground/55">{s.excerpt}</p>
          </article>
        ))}
      </DividerList>
    </PageShell>
  );
}
