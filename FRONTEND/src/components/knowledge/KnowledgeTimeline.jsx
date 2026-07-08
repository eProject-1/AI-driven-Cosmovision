import { useMemo } from "react";

export function KnowledgeTimeline({ timeline = [] }) {
  const normalized = useMemo(() => {
    const items = Array.isArray(timeline) ? timeline.filter(Boolean) : [];
    return items.map((it) => {
      const year = it.year ?? it.date ?? "";
      const label = it.label ?? it.title ?? "";
      const text = it.text ?? it.description ?? "";
      return { year, label, text, raw: it };
    });
  }, [timeline]);

  if (!normalized.length) return null;

  return (
    <section aria-label="Timeline">
      <div className="mb-5 flex items-center justify-between">
        <h4 className="font-display text-xs tracking-[0.35em] uppercase text-foreground/45">Timeline</h4>
      </div>

      <div className="relative pl-6 md:pl-8">
        <div
          aria-hidden
          className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-sky-300/60 via-purple-300/30 to-transparent"
        />

        <ol className="space-y-6">
          {normalized.map((it, idx) => {
            const delayMs = idx * 70;
            return (
              <li
                key={`${it.year || it.label || idx}-${idx}`}
                className="relative"
                style={{
                  animation: `timelineIn 520ms ease-out ${delayMs}ms both`,
                }}
              >
                <span
                  aria-hidden
                  className="absolute -left-[14px] top-2 h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(120,180,255,0.85)]"
                />

<div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                  {it.year ? (
                    <p className="font-display text-[11px] tracking-[0.22em] uppercase text-foreground/40 mb-2">
                      {String(it.year)}
                    </p>
                  ) : null}

                  {it.label ? (
                    <p className="font-display text-lg font-light tracking-[-0.01em] leading-tight text-foreground mb-2">
                      {String(it.label)}
                    </p>
                  ) : null}
                  {it.text ? (
                    <p className="text-sm md:text-base font-light leading-relaxed text-foreground/60">
                      {String(it.text)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <style>{`
        @keyframes timelineIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

