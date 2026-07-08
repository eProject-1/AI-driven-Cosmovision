export function KnowledgeFacts({ keyFacts = [] }) {
  const facts = Array.isArray(keyFacts) ? keyFacts.filter(Boolean) : [];

  const normalized = facts.map((f, idx) => {
    // Support a few possible shapes from API
    const title = f.title ?? f.label ?? f.factTitle ?? "";
    const text = f.text ?? f.description ?? f.factText ?? f.value ?? "";
    return { title, text, idx, raw: f };
  });

  if (!normalized.length) return null;

  return (
    <section aria-label="Key facts">
      <div className="mb-5 flex items-center justify-between">
        <h4 className="font-display text-xs tracking-[0.35em] uppercase text-foreground/45">Key facts</h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
          {normalized.map((fact) => {
            const hasAny = Boolean(fact.title) || Boolean(fact.text);
            if (!hasAny) return null;

            return (
              <div
                key={`${fact.title || "fact"}-${fact.idx}`}
className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-5 md:p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.035] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_18px_50px_-30px_rgba(80,140,255,0.25)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-lg"
                    style={{ boxShadow: "0 0 0 1px rgba(56,189,248,0.15) inset" }}
                  >
                    ✦
                  </span>

                  <div className="min-w-0 flex-1">
                    {fact.title ? (
                      <p className="font-display text-xs tracking-[0.22em] uppercase text-foreground/45 mb-2">
                        {String(fact.title)}
                      </p>
                    ) : null}
                    {fact.text ? (
                      <p className="text-sm md:text-base font-light leading-relaxed text-foreground/65">
                        {String(fact.text)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  aria-hidden
                  className="mt-5 h-px w-full bg-gradient-to-r from-sky-300/20 via-purple-300/10 to-transparent"
                />
              </div>
            );
          })}
      </div>
    </section>
  );
}

