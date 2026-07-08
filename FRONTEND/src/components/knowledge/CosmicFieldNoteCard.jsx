export function CosmicFieldNoteCard({
  title,
  description,
  category,
  imageSrc,
  ctaLabel,
  onExplore,
}) {

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(800px circle at 20% 0%, rgba(120,180,255,0.22), transparent 40%), radial-gradient(600px circle at 100% 30%, rgba(180,120,255,0.14), transparent 45%)",
        }}
      />

      <div className="relative grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:items-stretch md:gap-8">
        <div className="flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(120,180,255,0.9)]" />
              <span className="font-display text-[11px] tracking-[0.32em] uppercase text-foreground/60">
                {category}
              </span>
            </div>

            <h3 className="mt-5 font-display text-3xl md:text-4xl font-light tracking-[-0.02em] leading-tight text-foreground">
              {title}
            </h3>

            <p className="mt-4 text-sm md:text-base font-light leading-relaxed text-foreground/60">
              {description}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/75 transition duration-300 hover:scale-[1.02] hover:border-white/40 hover:bg-white hover:text-black"
            >
              {ctaLabel}
            </button>
            <span className="text-xs font-light tracking-[0.22em] uppercase text-foreground/35">Cosmic Field Notes</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 -top-10 rounded-full bg-gradient-to-b from-sky-500/10 via-purple-500/5 to-transparent blur-2xl" />

          <div className="relative h-56 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] md:h-full">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    "radial-gradient(120% 120% at 10% 0%, rgba(120,180,255,0.26) 0%, transparent 45%), radial-gradient(90% 100% at 90% 40%, rgba(180,120,255,0.18) 0%, transparent 52%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                }}
              />
            )}

            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(5,8,22,0.0) 0%, rgba(5,8,22,0.35) 70%, rgba(5,8,22,0.55) 100%)",
              }}
            />

            <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#050816]/40 px-3 py-1">
              <span className="font-display text-[10px] tracking-[0.35em] uppercase text-foreground/55">Explore</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}



