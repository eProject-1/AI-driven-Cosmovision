import { useEffect, useState } from "react";
import { PageShell } from "../components/lovable/PageShell";
import { DataGrid } from "../components/lovable/Framing";
import { getConstellations } from "../services/astronomy.api";

export default function LovableConstellations() {
  const [constellations, setConstellations] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    getConstellations()
      .then((items) => {
        if (!active) return;
        setConstellations(items);
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
    <PageShell
      eyebrow="Chapter II"
      title="Constellations"
      lead="Eighty-eight patterns drawn in starlight - humanity's oldest stories, still shining above us tonight."
    >
      {status === "loading" && (
        <p className="text-sm font-light text-foreground/55">Loading constellations from database...</p>
      )}

      {status === "error" && (
        <p className="text-sm font-light text-red-200/80">Could not load constellations from the backend.</p>
      )}

      <DataGrid columns="sm:grid-cols-2 lg:grid-cols-3" className="mt-6">
        {constellations.map((c) => (
          <article key={c.slug || c.name} className="bg-background/70 p-8 backdrop-blur-sm">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-light tracking-tight">{c.name}</h2>
              <span className="text-[10px] font-light tracking-[0.3em] uppercase text-foreground/40">
                {c.bestSeason || c.quadrant || "Sky"}
              </span>
            </div>
            <p className="mt-6 text-sm font-light leading-relaxed text-foreground/55">
              {c.description ||
                `${c.name} belongs to the ${c.family || "night sky"} family and is best viewed around ${c.bestMonth || "its season"}.`}
            </p>
            <p className="mt-8 text-[10px] font-light tracking-[0.3em] uppercase text-foreground/35">
              {c.mainStars ? `${c.mainStars} main stars` : `${c.areaSqDeg ?? "Known"} sq deg`}
            </p>
          </article>
        ))}
      </DataGrid>
    </PageShell>
  );
}
