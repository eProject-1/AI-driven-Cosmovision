import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getSavedCosmicKnowledge,
  saveCosmicKnowledge,
  unsaveCosmicKnowledge,
} from "../../services/cosmicKnowledgeSave.api.js";

export function SaveKnowledgeButton({ slug, title }) {
  const { user } = useAuth();

  const safeSlug = slug ? String(slug) : "";
  const isLoggedIn = Boolean(user?.id);

  const ariaLabel = useMemo(() => {
    if (!safeSlug) return "Save knowledge";
    return `Save knowledge: ${title || safeSlug}`;
  }, [safeSlug, title]);

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authState, setAuthState] = useState(isLoggedIn ? 'ready' : 'signin');

  useEffect(() => {
    setAuthState(isLoggedIn ? 'ready' : 'signin');
  }, [isLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!safeSlug || !isLoggedIn) {
        setIsSaved(false);
        return;
      }

      try {
        const res = await getSavedCosmicKnowledge();
        const slugs = res?.data?.slugs || [];
        if (!cancelled) setIsSaved(Boolean(slugs.includes(safeSlug)));
      } catch (e) {
        // If 401 happens, switch UI state. api.js interceptor may also redirect.
        if (!cancelled) {
          setAuthState('signin');
          setIsSaved(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [safeSlug, isLoggedIn]);

  const onClick = async () => {
    if (!safeSlug) return;

    if (!isLoggedIn) {
      setAuthState('signin');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (!isSaved) {
        await saveCosmicKnowledge(safeSlug);
        setIsSaved(true);
      } else {
        await unsaveCosmicKnowledge(safeSlug);
        setIsSaved(false);
      }
      setAuthState('ready');
    } catch (e) {
      if (e?.response?.status === 401) {
        setAuthState('signin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = !safeSlug || !isLoggedIn || isLoading;

  const label = authState === 'signin' ? 'Sign in to save' : isSaved ? 'Saved' : 'Save';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-3 rounded-full border px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b1c] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
        isSaved
          ? "border-sky-300/60 bg-sky-500/[0.16] text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_18px_40px_-30px_rgba(56,189,248,0.45)] hover:bg-sky-500/[0.22]"
          : "border-white/15 bg-white/[0.03] text-foreground/75 hover:scale-[1.01] hover:border-white/40 hover:bg-white hover:text-black"
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${
          isSaved
            ? "bg-sky-400 shadow-[0_0_12px_rgba(120,180,255,0.95)]"
            : "bg-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
        }`}
      />
    </button>
  );
}



