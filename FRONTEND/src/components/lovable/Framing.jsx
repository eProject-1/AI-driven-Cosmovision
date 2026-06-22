const tone = {
  panel: "border-white/10 bg-white/[0.035] shadow-[0_24px_90px_rgba(0,0,0,0.22)]",
  quiet: "border-white/[0.08] bg-white/[0.02]",
  table: "border-white/10 bg-slate-950/35 shadow-[0_20px_70px_rgba(0,0,0,0.2)]",
};

export function SectionPanel({ children, className = "", variant = "panel", ...props }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border ${tone[variant] ?? tone.panel} backdrop-blur-md ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function ContentCard({ children, className = "" }) {
  return (
    <article
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.045] ${className}`}
    >
      {children}
    </article>
  );
}

export function DataGrid({ children, className = "", columns = "sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <SectionPanel variant="table" className={className}>
      <div className={`grid gap-px bg-white/10 ${columns}`}>{children}</div>
    </SectionPanel>
  );
}

export function DividerList({ children, as: Component = "div", className = "" }) {
  return (
    <SectionPanel variant="quiet" className={className}>
      <Component className="divide-y divide-white/10">{children}</Component>
    </SectionPanel>
  );
}
