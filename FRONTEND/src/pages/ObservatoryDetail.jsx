import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CloudSun,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  Star,
  Telescope,
} from "lucide-react";
import { PageShell } from "../components/lovable/PageShell";
import { getObservatoryBySlug, toggleSaveObservatory } from "../services/observatory.api";
import { useAuth } from "../context/authState";
import { getObservatoryImage } from "../utils/observatoryImages";

const mapUrl = (site) =>
  site?.latitude && site?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`
    : null;

const mapEmbedUrl = (site) => {
  if (!site?.latitude || !site?.longitude) return null;
  const lat = Number(site.latitude);
  const lon = Number(site.longitude);
  const delta = 0.06;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lon}`;
};

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-white/10 py-4">
      <dt className="text-[11px] uppercase tracking-[0.25em] text-foreground/35">{label}</dt>
      <dd className="mt-2 text-base leading-relaxed text-foreground/75">{value || "No data available"}</dd>
    </div>
  );
}

function Metric({ label, value, suffix = "" }) {
  return (
    <div className="border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">{label}</div>
      <div className="mt-1 font-display text-2xl text-foreground">
        {value ?? "--"}
        {value != null ? suffix : ""}
      </div>
    </div>
  );
}

export default function ObservatoryDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    let active = true;

    getObservatoryBySlug(slug)
      .then((result) => {
        if (!active) return;
        setSite(result);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const directionsUrl = site?.directionsUrl || mapUrl(site);
  const embedUrl = mapEmbedUrl(site);
  const imageUrl = getObservatoryImage(site);
  const condition = site?.observingCondition;
  const weather = condition?.weather;

  const handleSave = async () => {
    if (!site || !user) return;

    setSaveBusy(true);
    try {
      const result = await toggleSaveObservatory(site.id);
      setSite((current) => ({
        ...current,
        isSaved: result.saved,
        savedCount: Math.max(0, (current.savedCount || 0) + (result.saved ? 1 : -1)),
      }));
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <PageShell
      eyebrow="Observatory"
      title={site?.name || "Observatory Detail"}
      lead={site?.description || "Full observatory profile from the database."}
    >
      <Link to="/observatory" className="mb-6 inline-flex items-center gap-2 text-base text-foreground/60 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to observatories
      </Link>

      {status === "loading" ? <p className="text-sm text-foreground/60">Loading observatory detail...</p> : null}
      {status === "error" ? <p className="text-sm text-red-200/80">Could not load this observatory.</p> : null}

      {site ? (
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="overflow-hidden rounded-xl border border-white/10 bg-background/65">
            <img src={imageUrl} alt={site.name} className="h-96 w-full object-cover" />

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-foreground/65">
                  <Star className="h-4 w-4" />
                  {site.rating ?? "N/A"} rating - {site.reviewCount ?? 0} reviews
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-foreground/65">
                  {site.type}
                </span>
                {site.isFeatured ? (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200">
                    Featured
                  </span>
                ) : null}
              </div>

              <p className="mt-6 text-base leading-relaxed text-foreground/72">{site.description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-base text-foreground/80 transition hover:bg-white/10"
                  >
                    <Navigation className="h-4 w-4" />
                    Directions
                  </a>
                ) : null}
                {site.website ? (
                  <a
                    href={site.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-base text-foreground/80 transition hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Website
                  </a>
                ) : null}
                {user ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveBusy}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base transition ${
                      site.isSaved
                        ? "border-white bg-white text-black"
                        : "border-white/15 text-foreground/80 hover:bg-white/10"
                    } disabled:opacity-60`}
                  >
                    <Heart className={`h-4 w-4 ${site.isSaved ? "fill-current" : ""}`} />
                    {site.isSaved ? "Saved" : "Save"}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-base text-foreground/80 transition hover:bg-white/10"
                  >
                    <Heart className="h-4 w-4" />
                    Login to save
                  </Link>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-8">
            <section className="rounded-xl border border-white/10 bg-background/65 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <CloudSun className="h-5 w-5 text-aurora" />
                <h2 className="text-xs uppercase tracking-[0.35em] text-foreground/45">Observing Conditions</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Score" value={condition?.score} />
                <Metric label="Cloud" value={weather?.cloudCover} suffix="%" />
                <Metric label="Humidity" value={weather?.humidity} suffix="%" />
              </div>
              <p className="mt-5 text-base leading-relaxed text-foreground/70">
                {condition
                  ? `${condition.label}: ${condition.summary}`
                  : "Weather data is not available right now."}
              </p>
              {weather ? (
                <p className="mt-3 text-sm text-foreground/50">
                  {weather.label} - {weather.temperature ?? "--"}C - wind {weather.windSpeed ?? "--"} km/h - visibility {weather.visibility ?? "--"} km
                  {weather.isMock ? " - mock weather" : ""}
                </p>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-xl border border-white/10 bg-background/65">
              {embedUrl ? (
                <iframe title={`${site.name} map`} src={embedUrl} className="h-72 w-full border-0" loading="lazy" />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-foreground/50">Map unavailable</div>
              )}
              <div className="flex items-start gap-3 border-t border-white/10 px-6 py-5">
                <MapPin className="mt-1 h-5 w-5 text-aurora" />
                <div>
                  <div className="text-base text-foreground">{site.address}</div>
                  <div className="text-sm text-foreground/55">{site.city}, {site.province}, {site.country}</div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-background/65 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Telescope className="h-5 w-5 text-aurora" />
                <h2 className="text-xs uppercase tracking-[0.35em] text-foreground/45">Planning Details</h2>
              </div>
              <dl className="mt-4">
                <InfoRow label="Coordinates" value={site.latitude && site.longitude ? `${site.latitude}, ${site.longitude}` : null} />
                <InfoRow label="Elevation" value={site.elevation ? `${site.elevation} m` : null} />
                <InfoRow label="Opening hours" value={site.openingHours} />
                <InfoRow label="Admission / tickets" value="No ticket data in current schema. Check website or contact information." />
                <InfoRow label="Phone" value={site.phone} />
                <InfoRow label="Email" value={site.email} />
                <InfoRow label="Equipment" value={site.equipment?.length ? site.equipment.join(", ") : null} />
                <InfoRow label="Sky quality" value={site.skyQualityScore != null ? `${site.skyQualityScore}/100` : null} />
                <InfoRow label="Light pollution" value={site.lightPollutionScore != null ? `${site.lightPollutionScore}/100` : null} />
                <InfoRow label="Saved by users" value={site.savedCount != null ? `${site.savedCount}` : null} />
              </dl>
            </section>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
