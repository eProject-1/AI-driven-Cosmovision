import { Link } from "react-router-dom";
import { Starfield } from "../components/lovable/Starfield";
import { planets } from "../lib/planets";
import { Award, Compass, Rocket } from "lucide-react";

export default function LovableProfile() {
  const visited = ["earth", "mars", "jupiter", "saturn"];
  const achievements = [
    { icon: Rocket, title: "First Launch", desc: "Began your journey from Earth." },
    { icon: Compass, title: "Inner Explorer", desc: "Visited all four inner planets." },
    { icon: Award, title: "Quiz Apprentice", desc: "Scored 3/5 on the astronomy quiz." },
  ];

  const progress = Math.round((visited.length / planets.length) * 100);

  return (
    <>
      <Starfield />
      <main className="min-h-screen pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center glow-ring text-2xl font-display font-bold text-primary-foreground">AS</div>
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Explorer</p>
                <h1 className="mt-1 text-4xl font-bold"><span className="text-aurora">Astra Stellaris</span></h1>
                <p className="text-sm text-muted-foreground">Joined 2026 · Sector 7G</p>
              </div>
            </div>
            <Link to="/" className="glass rounded-full px-5 py-3 text-sm hover:bg-white/10">Resume journey</Link>
          </div>

          <div className="mt-10 glass rounded-3xl p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-display">Solar System Progress</span>
              <span className="text-muted-foreground">{visited.length} / {planets.length} planets · {progress}%</span>
            </div>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-display mb-4">Visited Worlds</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {planets.map((p) => {
                const isVisited = visited.includes(p.slug);
                return (
                  <Link key={p.slug} to={`/planets/${p.slug}`} className={`glass rounded-2xl p-4 text-center transition hover:bg-white/10 ${isVisited ? "" : "opacity-40"}`}>
                    <img src={p.image} alt={p.name} loading="lazy" className="w-20 h-20 mx-auto object-contain animate-spin-slow" />
                    <div className="mt-2 text-sm font-display">{p.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{isVisited ? "Visited" : "Locked"}</div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-display mb-4">Achievements</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {achievements.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-ring">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="mt-4 font-display">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

