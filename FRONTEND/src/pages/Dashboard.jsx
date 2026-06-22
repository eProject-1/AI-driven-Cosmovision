
import { PageShell } from "../components/lovable/PageShell";
import { DataGrid, DividerList } from "../components/lovable/Framing";

export default function LovableDashboard() {
  const stats = [
    { label: "Planets explored", value: "6", of: "of 8" },
    { label: "Constellations traced", value: "14", of: "of 88" },
    { label: "Hours observing", value: "42.5", of: "this year" },
    { label: "Objects logged", value: "127", of: "all time" },
  ];

  const recent = [
    { when: "Last night", what: "Observed Jupiter and the Galilean moons" },
    { when: "3 days ago", what: "Traced Cassiopeia from the northern horizon" },
    { when: "1 week ago", what: "Completed the Inner Planets chapter" },
    { when: "2 weeks ago", what: "First successful Saturn ring observation" },
  ];

  return (
    <PageShell eyebrow="Mission Log" title="Dashboard" lead="A quiet record of your journey through the cosmos.">
      <DataGrid columns="sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background/70 p-8 backdrop-blur-sm">
            <p className="text-[10px] font-light tracking-[0.3em] uppercase text-foreground/40">{s.label}</p>
            <p className="mt-6 font-display text-5xl font-light tracking-tight tabular-nums">{s.value}</p>
            <p className="mt-2 text-[10px] font-light tracking-[0.2em] uppercase text-foreground/35">{s.of}</p>
          </div>
        ))}
      </DataGrid>

      <div className="mt-20">
        <h2 className="font-sans text-[10px] font-light tracking-[0.45em] uppercase text-foreground/40">Recent activity</h2>
        <DividerList as="ul" className="mt-6">
          {recent.map((r) => (
            <li key={r.what} className="flex items-baseline gap-8 px-6 py-5 sm:px-8">
              <span className="w-32 text-[11px] font-light tracking-[0.3em] uppercase text-foreground/45">{r.when}</span>
              <span className="text-sm font-light text-foreground/70">{r.what}</span>
            </li>
          ))}
        </DividerList>
      </div>
    </PageShell>
  );
}

