import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HyperspaceTransition } from "../components/lovable/HyperspaceTransition";
import { Button } from "../components/ui/button";

import { ArrowRight, FileText, Orbit, Radio, Satellite, Telescope } from "lucide-react";
import { getNewsList } from "../services/news.api";
import { CosmicFieldNoteCard } from "../components/knowledge/CosmicFieldNoteCard";
import { KnowledgeSheetModal } from "../components/knowledge/KnowledgeSheetModal";







const cosmicNoteImageUrls = {
  bigBang: "/images/cosmic-notes/big-bang/cover.jpg",
  bigBangExpansion: "/images/cosmic-notes/big-bang/expansion.jpg",
  bigBangCmb: "/images/cosmic-notes/big-bang/cmb.jpg",
  stellarLife: "/images/cosmic-notes/stellar-life/cover.jpg",
  stellarNebula: "/images/cosmic-notes/stellar-life/nebula.jpg",
  stellarSupernova: "/images/cosmic-notes/stellar-life/supernova.jpg",
  galaxiesNebulae: "/images/cosmic-notes/galaxies-nebulae/cover.jpg",
  andromeda: "/images/cosmic-notes/galaxies-nebulae/andromeda.jpg",
  pillars: "/images/cosmic-notes/galaxies-nebulae/pillars.jpg",
  constellations: "/images/cosmic-notes/constellations/cover.jpg",
  orion: "/images/cosmic-notes/constellations/orion.jpg",
  ancientMap: "/images/cosmic-notes/constellations/ancient-map.jpg",
};

const detailedCosmicFieldNotes = [
  {
    title: "Big Bang & Early Universe",
    slug: "big-bang-early-universe",
    category: "Early Universe",
    subtitle: "From hot beginnings to a clear, expanding sky",
    description:
      "From the hot, dense beginning to the first atoms, this chapter traces how the early cosmos expanded and cooled into a transparent universe.",
    body:
      "From the hot, dense beginning to the first atoms, this chapter traces how the early cosmos expanded and cooled into a transparent universe.",
    imageSrc: cosmicNoteImageUrls.bigBang,
    imageUrl: cosmicNoteImageUrls.bigBang,
    galleryImages: [
      cosmicNoteImageUrls.bigBangExpansion,
      cosmicNoteImageUrls.bigBangCmb,
      cosmicNoteImageUrls.bigBang,
    ],
    detailIntro:
      "You will learn why the universe expands and why the light we see has been traveling for billions of years.",
    timeline: [
      {
        year: "Very early",
        title: "The very beginning",
        description: "The universe was hot and dense, with energy dominating.",
      },
      {
        year: "A few hundred thousand years",
        title: "Expansion and cooling",
        description: "Matter cooled enough to form stable atoms.",
      },
      {
        year: "Early",
        title: "Becoming transparent",
        description: "Light escaped freely, so we can observe the sky.",
      },
    ],
    keyFacts: [
      {
        title: "Observable universe",
        text: "The visible universe is limited by how far light has traveled since the early cosmos.",
      },
      {
        title: "Cosmic background",
        text: "The cosmic microwave background is the oldest light we can map in detail.",
      },
    ],
    interestingFact:
      "Looking farther into space also means looking backward in time, because ancient light needs time to reach us.",
    ctaLabel: "Discover More",
  },
  {
    title: "Life Cycle of Stars",
    slug: "life-cycle-of-stars",
    category: "Stellar Evolution",
    subtitle: "How stars form, shine, collapse, and seed new worlds",
    description:
      "Stars are born in nebulae, fuse elements in stable phases, and end their lives in spectacular transformations, seeding new generations.",
    body:
      "Stars are born in nebulae, fuse elements in stable phases, and end their lives in spectacular transformations, seeding new generations.",
    imageSrc: cosmicNoteImageUrls.stellarLife,
    imageUrl: cosmicNoteImageUrls.stellarLife,
    galleryImages: [
      cosmicNoteImageUrls.stellarLife,
      cosmicNoteImageUrls.stellarNebula,
      cosmicNoteImageUrls.stellarSupernova,
    ],
    detailIntro:
      "Follow a star from its quiet birth cloud to the final stage that returns heavy elements to space.",
    timeline: [
      {
        year: "Nebula",
        title: "A cold cloud collapses",
        description: "Gas and dust gather under gravity until a protostar begins to heat up.",
      },
      {
        year: "Main sequence",
        title: "Fusion stabilizes the star",
        description: "Hydrogen fusion balances gravity and powers the star for most of its life.",
      },
      {
        year: "Final stage",
        title: "Remnant or explosion",
        description: "The ending depends on mass: white dwarf, neutron star, black hole, or supernova.",
      },
    ],
    keyFacts: [
      {
        title: "Mass matters",
        text: "A star's mass is the strongest clue to its brightness, lifetime, and final fate.",
      },
      {
        title: "Element factories",
        text: "Stars forge many elements, and supernovae spread them into future star systems.",
      },
    ],
    interestingFact:
      "Most atoms heavier than helium in your body were formed inside stars or in stellar explosions.",
    ctaLabel: "Discover More",
  },
  {
    title: "Galaxies & Nebulae",
    slug: "galaxies-nebulae",
    category: "Deep Space",
    subtitle: "The large structures and glowing clouds that shape the cosmos",
    description:
      "Galaxies gather billions of stars, while nebulae shape the raw material that paints the long arc of cosmic structure.",
    body:
      "Galaxies gather billions of stars, while nebulae shape the raw material that paints the long arc of cosmic structure.",
    imageSrc: cosmicNoteImageUrls.galaxiesNebulae,
    imageUrl: cosmicNoteImageUrls.galaxiesNebulae,
    galleryImages: [
      cosmicNoteImageUrls.galaxiesNebulae,
      cosmicNoteImageUrls.andromeda,
      cosmicNoteImageUrls.pillars,
    ],
    detailIntro:
      "Explore how gravity builds galaxies, how nebulae become star nurseries, and why deep space is full of structure.",
    timeline: [
      {
        year: "Gas clouds",
        title: "Raw material collects",
        description: "Hydrogen-rich regions gather into clouds where stars can begin forming.",
      },
      {
        year: "Galactic growth",
        title: "Stars and clusters assemble",
        description: "Gravity binds stars, dust, gas, and dark matter into galaxies.",
      },
      {
        year: "Interaction",
        title: "Galaxies reshape each other",
        description: "Mergers and close passes trigger new star formation and change galaxy shapes.",
      },
    ],
    keyFacts: [
      {
        title: "Many scales",
        text: "Nebulae can span light-years, while galaxies can contain hundreds of billions of stars.",
      },
      {
        title: "Living systems",
        text: "Galaxies evolve as gas is consumed, recycled, heated, or pulled in from surroundings.",
      },
    ],
    interestingFact:
      "The Milky Way and Andromeda are moving toward a future merger over billions of years.",
    ctaLabel: "Discover More",
  },
  {
    title: "Constellations as Sky Maps",
    slug: "constellations-sky-maps",
    category: "Sky Cartography",
    subtitle: "Patterns that turn the night sky into a navigable map",
    description:
      "Constellations help us navigate the night, connecting observation, seasons, and storytelling across cultures.",
    body:
      "Constellations help us navigate the night, connecting observation, seasons, and storytelling across cultures.",
    imageSrc: cosmicNoteImageUrls.constellations,
    imageUrl: cosmicNoteImageUrls.constellations,
    galleryImages: [
      cosmicNoteImageUrls.constellations,
      cosmicNoteImageUrls.orion,
      cosmicNoteImageUrls.ancientMap,
    ],
    detailIntro:
      "Learn how constellations divide the sky, help identify stars, and connect modern astronomy with older sky traditions.",
    timeline: [
      {
        year: "Ancient skywatching",
        title: "Patterns become memory tools",
        description: "People grouped bright stars into shapes to track seasons and directions.",
      },
      {
        year: "Navigation",
        title: "Stars guide travelers",
        description: "Recognizable patterns helped sailors and observers orient themselves at night.",
      },
      {
        year: "Modern astronomy",
        title: "Official sky regions",
        description: "Astronomers use constellation boundaries as a shared coordinate reference.",
      },
    ],
    keyFacts: [
      {
        title: "Not physical groups",
        text: "Stars in one constellation may be very different distances from Earth.",
      },
      {
        title: "Seasonal guide",
        text: "Different constellations are easiest to see at different times of year.",
      },
    ],
    interestingFact:
      "There are 88 official constellations that divide the entire celestial sphere.",
    ctaLabel: "Discover More",
  },
];

const signalIconMap = {

  SPACE_EXPLORATION: Satellite,
  SOLAR_SYSTEM: Orbit,
  DEEP_SPACE: Telescope,
  TECHNOLOGY: Radio,
  GENERAL: FileText,
};

function getSignalIcon(category) {
  return signalIconMap[category] || FileText;
}

function getSignalLabel(category) {
  if (!category) return "News";
  return String(category)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPublishedAt(value) {
  if (!value) return "Recently published";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LovableHome() {
  const [stage, setStage] = useState("hero");
  const [signalItems, setSignalItems] = useState([]);
  const [signalLoading, setSignalLoading] = useState(true);
  const [signalError, setSignalError] = useState("");
  const navigate = useNavigate();

  const [selectedKnowledge, setSelectedKnowledge] = useState(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const discoverBtnRef = useRef(null);


  useEffect(() => {
    let cancelled = false;

    const loadSignals = async () => {
      try {
        setSignalLoading(true);
        setSignalError("");
        const result = await getNewsList({ page: 1, limit: 6 });

        if (!cancelled) {
          setSignalItems(Array.isArray(result?.items) ? result.items : []);
        }
      } catch {
        if (!cancelled) {
          setSignalError("Unable to load the latest news right now.");
        }
      } finally {
        if (!cancelled) {
          setSignalLoading(false);
        }
      }
    };

    loadSignals();

    return () => {
      cancelled = true;
    };
  }, []);


  const handleLaunch = () => {
    if (stage !== "hero") return;
    setStage("warp");
  };

  const fallbackCosmicFieldNotes = [
    {
      title: "Big Bang & Early Universe",
      slug: "big-bang-early-universe",
      category: "Early Universe",
      description:
        "From the hot, dense beginning to the first atoms—this chapter traces how the early cosmos expanded and cooled into a transparent universe.",
      imageSrc: cosmicNoteImageUrls.bigBang,

      ctaLabel: "Discover More",
    },
    {
      title: "Life Cycle of Stars",
      slug: "life-cycle-of-stars",
      category: "Stellar Evolution",
      description:
        "Stars are born in nebulae, fuse elements in stable phases, and end their lives in spectacular transformations—seeding new generations.",
      imageSrc: cosmicNoteImageUrls.stellarLife,

      ctaLabel: "Discover More",
    },
    {
      title: "Galaxies & Nebulae",
      slug: "galaxies-nebulae",
      category: "Deep Space",
      description:
        "Galaxies gather billions of stars, while nebulae shape the raw material—together they paint the long arc of cosmic structure.",
      imageSrc: cosmicNoteImageUrls.galaxiesNebulae,

      ctaLabel: "Discover More",
    },
    {
      title: "Constellations as Sky Maps",
      slug: "constellations-sky-maps",
      category: "Sky Cartography",
      description:
        "Constellations help us navigate the night—patterns of stars that connect imagination to observation across seasons and cultures.",
      imageSrc: cosmicNoteImageUrls.constellations,

      ctaLabel: "Discover More",
    },
  ];

  void fallbackCosmicFieldNotes;

  const [cosmicKnowledgeNotes, setCosmicKnowledgeNotes] = useState([]);
  const [cosmicKnowledgeNotesError, setCosmicKnowledgeNotesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCosmicNotes = async () => {
      try {
        // Dynamic import to avoid bundler issues
        const { getCosmicKnowledgeNotes } = await import("../services/cosmicKnowledgeNotes.api");
        const result = await getCosmicKnowledgeNotes();
        const items = Array.isArray(result?.items) ? result.items : [];

        if (!cancelled) {
          setCosmicKnowledgeNotes(items);
          setCosmicKnowledgeNotesError("");
        }
      } catch {
        if (!cancelled) {
          setCosmicKnowledgeNotesError("Unable to load Cosmic Field Notes right now.");
          setCosmicKnowledgeNotes([]);
        }
      }
    };

    loadCosmicNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  const notesToRender = cosmicKnowledgeNotesError
    ? detailedCosmicFieldNotes
    : cosmicKnowledgeNotes.length
      ? cosmicKnowledgeNotes
      : detailedCosmicFieldNotes;

  const cosmicFieldNotesCards = (
    <div className="grid gap-8 md:gap-10">
      {notesToRender.map((note, idx) => (
        <CosmicFieldNoteCard
          key={note.slug || idx}
          title={note.title}
          category={note.category}
          description={note.body || note.description}
          imageSrc={note.imageUrl ? note.imageUrl : note.imageSrc}
          ctaLabel={note.ctaLabel}
          onExplore={(e) => {
            // Maintain scroll position; modal is overlay only.
            // Also restore focus back to this button when modal closes.
            setSelectedKnowledge(note);
            setIsKnowledgeModalOpen(true);
            // If click provides event target, store it for focus restore.
            if (e?.currentTarget) discoverBtnRef.current = e.currentTarget;
            else discoverBtnRef.current = document.activeElement;
          }}
        />
      ))}
    </div>
  );



  return (
    <>

    <section aria-label="Hero" className="relative min-h-screen w-full overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 110%, #10162B 0%, #0B1020 45%, #050816 100%)" }}>

        <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "linear-gradient(to right, rgba(140,170,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(140,170,255,0.08) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)" }} />
        <HeroStars />
        <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(100,140,255,0.18) 0%, transparent 60%)", filter: "blur(40px)" }} />
        <div aria-hidden className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: "-65vw", width: "150vw", height: "150vw", borderRadius: "50%", background: "radial-gradient(circle at 50% 18%, #2a4d8f 0%, #18305f 22%, #0d1a3a 45%, #070c1f 65%, transparent 75%)", boxShadow: "0 -40px 120px rgba(80,140,255,0.35), inset 0 80px 120px rgba(180,210,255,0.12)" }} />
        <div aria-hidden className="absolute left-0 right-0 pointer-events-none" style={{ bottom: "calc(-65vw + 150vw - 8px)", height: "120px", background: "linear-gradient(to top, rgba(120,170,255,0.45), rgba(120,170,255,0.08) 40%, transparent 100%)", filter: "blur(18px)" }} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(120,180,255,0.9)]" />
            <span className="font-display text-[11px] tracking-[0.32em] uppercase text-foreground/70">AI-Driven Astronomy Exploration</span>
          </div>

          <h1 className="mt-8 font-display font-extralight tracking-[-0.035em] text-foreground" style={{ fontSize: "clamp(2.8rem, 7vw, 6.25rem)", lineHeight: 1.02 }}>
            Explore the Universe
            <br />
            <span style={{ backgroundImage: "linear-gradient(180deg, #ffffff 0%, #b9c8ff 60%, #6f8bd8 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Like Never Before</span>
          </h1>

          <p className="mt-7 max-w-xl text-base sm:text-lg font-light leading-relaxed text-foreground/65">Travel through planets, constellations, observatories, and real-time cosmic discoveries.</p>

          <div className="mt-10 flex items-center gap-4">
            <Button onClick={handleLaunch} size="lg" className="group h-12 rounded-full px-7 text-sm font-medium bg-white text-[#050816] hover:bg-white/90 shadow-[0_10px_40px_-10px_rgba(140,180,255,0.6)]">Get Started <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" /></Button>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/40">
            <span className="font-display text-[10px] tracking-[0.4em] uppercase">Scroll to enter</span>
            <span className="h-8 w-px bg-gradient-to-b from-foreground/40 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      <HyperspaceTransition active={stage === "warp"} durationMs={2600} onDone={() => navigate("/planets")} />

      <section className="relative py-28 bg-[#070b1c]" aria-labelledby="cosmic-field-notes-title">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-3xl">
            <p className="font-display text-[11px] tracking-[0.4em] uppercase text-foreground/45 mb-4">Chapter II</p>
            <h2 id="cosmic-field-notes-title" className="font-display text-4xl md:text-6xl font-light tracking-[-0.025em] leading-tight text-foreground mb-5">
              Cosmic Field Notes
            </h2>
            <p className="text-foreground/58 max-w-2xl text-base font-light leading-relaxed">
              Short explorations designed for curiosity—learn how the universe began, evolved, and organizes its light.
            </p>
          </div>

          {cosmicFieldNotesCards}
        </div>
      </section>

      <KnowledgeSheetModal
        key={selectedKnowledge?.slug || "knowledge-sheet"}
        isOpen={isKnowledgeModalOpen}
        onClose={() => {
          setIsKnowledgeModalOpen(false);
        }}
        knowledge={selectedKnowledge}
        launchButtonRef={discoverBtnRef}
      />




      <section className="relative py-24 bg-[#050816]" aria-labelledby="signal-title">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between mb-16">
            <div>
              <p className="font-display text-xs tracking-[0.4em] uppercase text-foreground/45 mb-3">Signal</p>
              <h2 id="signal-title" className="font-display text-3xl md:text-4xl font-light tracking-[-0.02em] text-foreground">
                This week
              </h2>
              <p className="text-foreground/55 text-sm font-light mt-2">Latest news & celestial events</p>
            </div>
            <button onClick={() => navigate("/news")} className="hidden md:flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors">
              All news <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signalLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="group min-h-52 border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-7 h-7 flex items-center justify-center text-foreground/25">
                      <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
                    </div>
                    <div className="h-3 w-20 rounded-full bg-white/10 animate-pulse" />
                  </div>
                  <div className="h-5 w-3/4 rounded-full bg-white/10 animate-pulse mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-white/10 animate-pulse" />
                    <div className="h-3 w-5/6 rounded-full bg-white/10 animate-pulse" />
                  </div>
                  <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse mt-5" />
                </article>
              ))
            ) : signalError ? (
              <div className="md:col-span-2 lg:col-span-3 rounded border border-white/10 bg-white/[0.025] p-5 text-sm text-foreground/60">
                {signalError}
              </div>
            ) : (
              signalItems.map((item, index) => {
                const Icon = getSignalIcon(item.category);
                return (
                  <article
                    key={item.slug || index}
                    onClick={() => item.slug && navigate(`/news?article=${encodeURIComponent(item.slug)}`)}
                    role={item.slug ? "button" : undefined}
                    tabIndex={item.slug ? 0 : undefined}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (item.slug) navigate(`/news?article=${encodeURIComponent(item.slug)}`);
                      }
                    }}
                    className="group min-h-52 cursor-pointer border border-white/10 bg-white/[0.025] p-5 transition-colors duration-300 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-7 h-7 flex items-center justify-center text-foreground/55">
                        <Icon className="w-4 h-4" strokeWidth={1.4} />
                      </div>
                      <p className="text-xs tracking-widest uppercase text-foreground/50">{getSignalLabel(item.category)}</p>
                    </div>
                    <h3 className="font-display text-lg font-light leading-snug text-foreground mb-3">{item.title || "Untitled update"}</h3>
                    <p className="text-sm text-foreground/56 font-light leading-relaxed">{item.summary || "More details will appear here soon."}</p>
                    <p className="text-[11px] tracking-[0.18em] uppercase text-foreground/38 mt-5">{formatPublishedAt(item.publishedAt)}</p>
                  </article>
                );
              })
            )}
          </div>

          <div className="md:hidden mt-8 text-center">
            <button onClick={() => navigate("/news")} className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors">
              All news <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStars() {
  const stars = Array.from({ length: 110 }).map((_, i) => {
    const seed = i * 9301 + 49297;
    const r1 = (seed % 233280) / 233280;
    const r2 = ((seed * 7) % 233280) / 233280;
    const r3 = ((seed * 13) % 233280) / 233280;
    return {
      left: r1 * 100,
      top: r2 * 70,
      size: 0.6 + r3 * 1.6,
      opacity: 0.3 + r3 * 0.7,
      delay: r1 * 6,
      duration: 3 + r2 * 6,
    };
  });
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-white animate-twinkle-soft" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.opacity, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`, boxShadow: s.size > 1.6 ? "0 0 6px rgba(200,220,255,0.7), 0 0 14px rgba(120,160,255,0.25)" : undefined }} />
      ))}
    </div>
  );
}
