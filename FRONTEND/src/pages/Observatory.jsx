import { useEffect, useState } from "react";
import { PageShell } from "../components/lovable/PageShell";
import { SectionPanel } from "../components/lovable/Framing";
import { getObservatories } from "../services/observatory.api";

export default function LovableObservatory() {
  const [observatories, setObservatories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    getObservatories({ limit: 12 })
      .then((result) => {
        if (!active) return;
        setObservatories(result.observatories || []);
        setPagination(result.pagination || null);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const featured = observatories.filter((item) => item.isFeatured).slice(0, 4);
  const featuredSites = featured.length ? featured : observatories.slice(0, 4);

  return (
    <PageShell
      eyebrow="Chapter III"
      title="Observatory"
      lead="Real observing sites from the database - locations, ratings, equipment, and sky quality for planning a night under the stars."
    >
      {status === "loading" && (
        <p className="text-sm font-light text-foreground/55">Loading observatories from database...</p>
      )}

      {status === "error" && (
        <p className="text-sm font-light text-red-200/80">Could not load observatories from the backend.</p>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="font-sans text-[10px] font-light tracking-[0.45em] uppercase text-foreground/40">Featured Sites</h2>
          <SectionPanel variant="table" className="mt-6">
            <dl className="divide-y divide-white/10">
              {featuredSites.map((site) => (
                <div key={site.id} className="flex items-baseline justify-between gap-5 bg-background/65 px-6 py-5 backdrop-blur-sm">
                  <dt className="text-[11px] font-light tracking-[0.3em] uppercase text-foreground/50">{site.city}</dt>
                  <dd className="text-right">
                    <div className="font-display text-lg font-light">{site.name}</div>
                    <div className="text-[10px] font-light tracking-[0.2em] uppercase text-foreground/35">
                      {site.skyQualityScore ?? "?"} sky quality - {site.rating ?? "N/A"} rating
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </SectionPanel>
        </div>

        <div>
          <h2 className="font-sans text-[10px] font-light tracking-[0.45em] uppercase text-foreground/40">Database Observatory List</h2>
          <SectionPanel variant="table" className="mt-6">
            <ol className="divide-y divide-white/10">
              {observatories.map((site) => (
                <li key={site.id} className="grid gap-3 bg-background/65 px-6 py-5 backdrop-blur-sm sm:grid-cols-[1fr_auto] sm:items-baseline">
                  <div>
                    <h3 className="font-display text-lg font-light text-foreground/85">{site.name}</h3>
                    <p className="mt-2 text-sm font-light leading-relaxed text-foreground/55">{site.description}</p>
                    {!!site.equipment?.length && (
                      <p className="mt-3 text-[10px] font-light tracking-[0.2em] uppercase text-foreground/35">
                        {site.equipment.slice(0, 2).join(" - ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-light tracking-[0.25em] uppercase text-foreground/35">
                    {site.province} - {site.type}
                  </span>
                </li>
              ))}
            </ol>
          </SectionPanel>
          {pagination && (
            <p className="mt-5 text-[10px] font-light tracking-[0.25em] uppercase text-foreground/35">
              Showing {observatories.length} of {pagination.total} records
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
