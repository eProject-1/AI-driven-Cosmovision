import { PageShell } from "../components/lovable/PageShell";

export default function LovableRegister() {
  return (
    <PageShell title="Register" lead="Create an account to save favorites and preferences.">
      <div className="mx-auto max-w-md">
        <form className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <input placeholder="Email" className="w-full rounded-md p-3 bg-background/60 border border-foreground/10" />
          <input placeholder="Password" type="password" className="w-full rounded-md p-3 bg-background/60 border border-foreground/10" />
          <button className="w-full rounded-full bg-foreground/90 p-3 text-background">Create account</button>
        </form>
      </div>
    </PageShell>
  );
}
