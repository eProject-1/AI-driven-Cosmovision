import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Compass,
  Edit3,
  ExternalLink,
  Heart,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Medal,
  NotebookText,
  Save,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import { Starfield } from "../components/lovable/Starfield";
import {
  addFavorite,
  getImageUploads,
  getRecommendations,
  getSavedEvents,
  getSavedObservatories,
  getUserSummary,
  removeFavorite,
  updatePreferences,
  updateProfile,
} from "../services/user.api";
import { getLocalSavedCosmicKnowledgeItems } from "../services/cosmicKnowledgeSave.api";

const emptyProfile = {
  displayName: "",
  avatarUrl: "",
  bio: "",
  location: "",
  latitude: "",
  longitude: "",
  timezone: "Asia/Ho_Chi_Minh",
  website: "",
};

const emptyPreferences = {
  favoritesPlanets: [],
  favoritesConstellations: [],
  experienceLevel: "beginner",
  emailAlerts: true,
  eventReminders: true,
  temperatureUnit: "celsius",
  distanceUnit: "km",
  timeFormat: "24h",
};

const profileTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "history", label: "History", icon: History },
  { id: "interests", label: "Interests", icon: Heart },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "notes", label: "Notes", icon: NotebookText },
  { id: "settings", label: "Settings", icon: Settings },
];

const PROFILE_DRAFT_KEY = "cosmovision_profile_form_drafts";

function getProfileDraftKey(user) {
  return user?.id || user?.email || user?.username || "current-user";
}

function readProfileDraft(user) {
  if (typeof window === "undefined") return {};

  try {
    const drafts = JSON.parse(window.localStorage.getItem(PROFILE_DRAFT_KEY) || "{}");
    const draft = drafts[getProfileDraftKey(user)];
    return draft && typeof draft === "object" ? draft : {};
  } catch {
    return {};
  }
}

function writeProfileDraft(user, draft) {
  if (typeof window === "undefined") return;

  try {
    const drafts = JSON.parse(window.localStorage.getItem(PROFILE_DRAFT_KEY) || "{}");
    drafts[getProfileDraftKey(user)] = draft;
    window.localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage errors.
  }
}

function clearProfileDraft(user) {
  if (typeof window === "undefined") return;

  try {
    const drafts = JSON.parse(window.localStorage.getItem(PROFILE_DRAFT_KEY) || "{}");
    delete drafts[getProfileDraftKey(user)];
    window.localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage errors.
  }
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getLevelLabel(level) {
  const labels = {
    beginner: "Star Seeker",
    intermediate: "Orbit Explorer",
    advanced: "Deep Sky Navigator",
  };
  return labels[level] || "Star Seeker";
}

export default function LovableProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [preferencesForm, setPreferencesForm] = useState(emptyPreferences);
  const [recommendations, setRecommendations] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [savedObservatories, setSavedObservatories] = useState([]);
  const [savedCosmicKnowledge, setSavedCosmicKnowledge] = useState([]);
  const [imageUploads, setImageUploads] = useState([]);
  const [favoriteInput, setFavoriteInput] = useState("");
  const [favoriteType, setFavoriteType] = useState("planets");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    try {
      const [summaryData, recs, events, observatories, uploads] = await Promise.all([
        getUserSummary(),
        getRecommendations(4),
        getSavedEvents(),
        getSavedObservatories(),
        getImageUploads(8),
      ]);

      const nextUser = summaryData.user;
      setSummary(summaryData);
      setUser(nextUser);
      setRecommendations(recs || []);
      setSavedEvents(events || []);
      setSavedObservatories(observatories || []);
      setSavedCosmicKnowledge(getLocalSavedCosmicKnowledgeItems());
      setImageUploads(uploads || []);
      const serverProfileForm = {
        displayName: nextUser.displayName || "",
        avatarUrl: nextUser.avatarUrl || "",
        bio: nextUser.profile?.bio || "",
        location: nextUser.profile?.location || "",
        latitude: nextUser.profile?.latitude ?? "",
        longitude: nextUser.profile?.longitude ?? "",
        timezone: nextUser.profile?.timezone || "Asia/Ho_Chi_Minh",
        website: nextUser.profile?.website || "",
      };
      setProfileForm({ ...serverProfileForm, ...readProfileDraft(nextUser) });
      setPreferencesForm({
        ...emptyPreferences,
        ...(nextUser.preferences || {}),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProfile().catch(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const initials = useMemo(() => {
    return (user?.displayName || user?.username || "U").slice(0, 2).toUpperCase();
  }, [user]);

  const displayName = user?.displayName || user?.username || "Explorer";
  const savedTotal =
    (summary?.counts?.savedEvents || 0) +
    (summary?.counts?.savedObservatories || 0) +
    savedCosmicKnowledge.length;
  const contributionCount = (summary?.counts?.imageUploads || 0) + (summary?.counts?.recommendations || 0);

  function updateProfileForm(updater) {
    setProfileForm((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeProfileDraft(user, next);
      return next;
    });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSaving("profile");
    setMessage("");

    try {
      const updated = await updateProfile({
        ...profileForm,
        avatarUrl: profileForm.avatarUrl || null,
        website: profileForm.website || null,
        latitude: toNumberOrNull(profileForm.latitude),
        longitude: toNumberOrNull(profileForm.longitude),
      });
      setUser(updated);
      localStorage.setItem("cosmovision_user", JSON.stringify(updated));
      clearProfileDraft(user);
      clearProfileDraft(updated);
      setMessage("Profile updated.");
    } finally {
      setSaving("");
    }
  }

  async function handlePreferencesSubmit(event) {
    event.preventDefault();
    setSaving("preferences");
    setMessage("");

    try {
      const updated = await updatePreferences(preferencesForm);
      setPreferencesForm({ ...emptyPreferences, ...updated });
      setMessage("Preferences updated.");
      await loadProfile();
    } finally {
      setSaving("");
    }
  }

  async function handleAddFavorite(event) {
    event.preventDefault();
    if (!favoriteInput.trim()) return;

    setSaving("favorite");
    setMessage("");

    try {
      const updated = await addFavorite(favoriteType, favoriteInput.trim());
      setPreferencesForm({ ...emptyPreferences, ...updated });
      setFavoriteInput("");
      setMessage("Favorite added.");
      await loadProfile();
    } finally {
      setSaving("");
    }
  }

  async function handleRemoveFavorite(type, name) {
    setSaving(`favorite-${name}`);
    setMessage("");

    try {
      const updated = await removeFavorite(type, name);
      setPreferencesForm({ ...emptyPreferences, ...updated });
      setMessage("Favorite removed.");
      await loadProfile();
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return (
      <>
        <Starfield />
        <main className="grid min-h-screen place-items-center px-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-100" />
          <p className="mt-4 text-sm text-foreground/60">Loading your explorer profile...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Starfield />
      <main className="min-h-screen px-4 pb-10 pt-24 md:px-6 lg:pt-28">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden min-h-[calc(100vh-8rem)] flex-col rounded-[8px] border border-white/10 bg-[#07111f]/82 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:flex">
            <nav className="grid gap-2">
              {profileTabs.map((tab) => (
                <SideButton
                  key={tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>

            <div className="mt-auto rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-medium text-foreground">Keep exploring the universe</p>
              <Link
                to="/dashboard"
                className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-violet-500/20 text-violet-100 hover:bg-violet-500/30"
                aria-label="Open dashboard"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </aside>

          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto rounded-[8px] border border-white/10 bg-[#07111f]/82 p-2">
              {profileTabs.map((tab) => (
                <SideButton
                  key={tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <ProfileHero
              activeTab={activeTab}
              displayName={displayName}
              initials={initials}
              profileForm={profileForm}
              preferencesForm={preferencesForm}
              savedTotal={savedTotal}
              user={user}
              onEdit={() => setActiveTab("settings")}
            />

            {message ? (
              <div className="rounded-[8px] border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100">
                {message}
              </div>
            ) : null}

            {activeTab === "overview" ? (
              <OverviewPage
                summary={summary}
                savedTotal={savedTotal}
                contributionCount={contributionCount}
                recommendations={recommendations}
                imageUploads={imageUploads}
              />
            ) : null}

            {activeTab === "saved" ? (
              <SavedPage
                savedCosmicKnowledge={savedCosmicKnowledge}
                savedObservatories={savedObservatories}
                savedEvents={savedEvents}
              />
            ) : null}

            {activeTab === "history" ? (
              <HistoryPage recommendations={recommendations} imageUploads={imageUploads} />
            ) : null}

            {activeTab === "interests" ? (
              <InterestsPage
                favoriteInput={favoriteInput}
                favoriteType={favoriteType}
                preferencesForm={preferencesForm}
                saving={saving}
                onAddFavorite={handleAddFavorite}
                onFavoriteInput={setFavoriteInput}
                onFavoriteType={setFavoriteType}
                onRemoveFavorite={handleRemoveFavorite}
              />
            ) : null}

            {activeTab === "achievements" ? (
              <AchievementsPage savedTotal={savedTotal} contributionCount={contributionCount} />
            ) : null}

            {activeTab === "notes" ? <NotesPage imageUploads={imageUploads} /> : null}

            {activeTab === "settings" ? (
              <SettingsPage
                profileForm={profileForm}
                preferencesForm={preferencesForm}
                saving={saving}
                setProfileForm={updateProfileForm}
                setPreferencesForm={setPreferencesForm}
                onProfileSubmit={handleProfileSubmit}
                onPreferencesSubmit={handlePreferencesSubmit}
              />
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

function ProfileHero({ activeTab, displayName, initials, profileForm, preferencesForm, savedTotal, user, onEdit }) {
  const title = profileTabs.find((tab) => tab.id === activeTab)?.label || "Overview";

  return (
    <section className="overflow-hidden rounded-[8px] border border-white/10 bg-[#07111f]/82 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="relative p-5 md:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(900px circle at 20% 10%, rgba(139,92,246,0.24), transparent 42%), radial-gradient(700px circle at 72% 20%, rgba(56,189,248,0.18), transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.05), transparent)",
          }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative shrink-0">
              {profileForm.avatarUrl ? (
                <img
                  src={profileForm.avatarUrl}
                  alt={displayName}
                  className="h-24 w-24 rounded-full border-2 border-violet-300/70 object-cover md:h-28 md:w-28"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-violet-300/70 bg-gradient-to-br from-violet-500/45 via-sky-500/30 to-slate-950 text-3xl font-bold md:h-28 md:w-28">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={onEdit}
                className="absolute bottom-2 right-1 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-[#111827] text-foreground/80"
                aria-label="Edit profile"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/70">{title}</p>
              <h1 className="mt-1 truncate font-display text-3xl font-semibold text-foreground md:text-4xl">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-foreground/62">Stargazer - Explorer - Dreamer</p>
              <p className="mt-2 line-clamp-2 text-sm italic text-foreground/52">
                "{profileForm.bio || "The cosmos is within us."}"
              </p>
              <div className="mt-5 grid gap-3 text-sm text-foreground/70 sm:grid-cols-3">
                <MiniBadge icon={User} label="Member since" value={formatDate(user?.createdAt)} />
                <MiniBadge icon={Sparkles} label="Level" value={getLevelLabel(preferencesForm.experienceLevel)} />
                <MiniBadge icon={Star} label="Points" value={String(2450 + savedTotal * 25)} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 text-sm text-foreground/78 hover:bg-white/[0.1]"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 hover:bg-white/[0.09]"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewPage({ summary, savedTotal, contributionCount, recommendations, imageUploads }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Compass} label="Recommendations" value={summary?.counts?.recommendations || 0} delta="+20 this week" />
        <StatCard icon={Bookmark} label="Saved Items" value={savedTotal} delta="+8 this week" />
        <StatCard icon={ImageIcon} label="Image Scans" value={summary?.counts?.imageUploads || 0} delta="+4 this week" />
        <StatCard icon={Medal} label="Contributions" value={contributionCount} delta="+3 this week" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Exploration Activity" subtitle="Your activity in the last 30 days">
          <ActivityChart />
        </Panel>
        <Panel title="Top Categories" subtitle="Your most explored categories">
          <CategoryBar label="Planets" value={42} icon="Saturn" />
          <CategoryBar label="Constellations" value={28} icon="Stars" />
          <CategoryBar label="Cosmic Knowledge" value={20} icon="Notes" />
          <CategoryBar label="Observatory" value={10} icon="Scope" />
        </Panel>
      </section>

      <Panel title="Recent Activity" subtitle="Latest saved and explored items">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.slice(0, 3).map((item) => (
            <CompactItem
              key={item.id}
              image={null}
              title={item.aiSuggestion || "Sky recommendation"}
              subtitle={`${item.locationName || "Saved location"} / Score ${item.skyVisibilityScore ?? "N/A"}`}
            />
          ))}
          {imageUploads.slice(0, 3).map((item) => (
            <CompactItem
              key={item.id}
              image={item.originalUrl}
              title={item.constellation?.name || item.recognizedConstellation || "Constellation scan"}
              subtitle={`${Math.round((item.confidenceScore || 0) * 100)}% confidence`}
            />
          ))}
          {!recommendations.length && !imageUploads.length ? <EmptyText>No recent activity yet.</EmptyText> : null}
        </div>
      </Panel>
    </>
  );
}

function SavedPage({ savedCosmicKnowledge, savedObservatories, savedEvents }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Cosmic Knowledge" subtitle="Field notes saved from Home">
        <ItemGrid empty="No saved cosmic knowledge yet.">
          {savedCosmicKnowledge.map((item) => (
            <CompactItem
              key={item.slug}
              image={item.imageUrl}
              title={item.title}
              subtitle={item.category || "Cosmic Knowledge"}
              trailing={<Bookmark className="h-4 w-4 text-violet-300" />}
            />
          ))}
        </ItemGrid>
      </Panel>
      <Panel title="Saved Observatories" subtitle="Observatories bookmarked by you">
        <ItemGrid empty="No saved observatories yet.">
          {savedObservatories.map((item) => (
            <CompactItem
              key={item.id}
              image={item.observatory?.imageUrl}
              title={item.observatory?.name || "Observatory"}
              subtitle={item.observatory?.city || "Location unavailable"}
              trailing={<Bookmark className="h-4 w-4 text-violet-300" />}
            />
          ))}
        </ItemGrid>
      </Panel>
      <Panel title="Saved Events" subtitle="Celestial events you kept">
        <ItemGrid empty="No saved events yet.">
          {savedEvents.map((item) => (
            <CompactItem
              key={item.id}
              image={item.event?.imageUrl}
              title={item.event?.title || "Celestial event"}
              subtitle={formatDate(item.event?.startDate || item.savedAt)}
              trailing={<Bookmark className="h-4 w-4 text-violet-300" />}
            />
          ))}
        </ItemGrid>
      </Panel>
    </div>
  );
}

function HistoryPage({ recommendations, imageUploads }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Panel title="Recommendation History" subtitle="Recent stargazing planner outputs">
        <ItemGrid empty="No recommendations yet.">
          {recommendations.map((item) => (
            <CompactItem
              key={item.id}
              image={null}
              title={item.aiSuggestion || "Sky recommendation"}
              subtitle={`${item.locationName || "Saved location"} / Score ${item.skyVisibilityScore ?? "N/A"}`}
            />
          ))}
        </ItemGrid>
      </Panel>
      <Panel title="Scan History" subtitle="Recent constellation recognition uploads">
        <ItemGrid empty="No scans yet.">
          {imageUploads.map((item) => (
            <CompactItem
              key={item.id}
              image={item.originalUrl}
              title={item.constellation?.name || item.recognizedConstellation || "Unrecognized"}
              subtitle={`${Math.round((item.confidenceScore || 0) * 100)}% confidence`}
            />
          ))}
        </ItemGrid>
      </Panel>
    </div>
  );
}

function InterestsPage({
  favoriteInput,
  favoriteType,
  preferencesForm,
  saving,
  onAddFavorite,
  onFavoriteInput,
  onFavoriteType,
  onRemoveFavorite,
}) {
  return (
    <Panel title="Interests" subtitle="Favorite planets and constellations">
      <form onSubmit={onAddFavorite} className="grid gap-3 md:grid-cols-[170px_1fr_auto]">
        <select value={favoriteType} onChange={(event) => onFavoriteType(event.target.value)} className="min-h-11 rounded-[8px] border border-white/10 bg-slate-950/70 px-4 text-sm">
          <option value="planets">Planet</option>
          <option value="constellations">Constellation</option>
        </select>
        <input value={favoriteInput} onChange={(event) => onFavoriteInput(event.target.value)} placeholder="Mars, Saturn, Orion..." className="min-h-11 rounded-[8px] border border-white/10 bg-white/[0.035] px-4 text-sm outline-none focus:border-violet-300/60" />
        <button className="min-h-11 rounded-[8px] bg-violet-500/22 px-5 text-sm text-violet-50 hover:bg-violet-500/32">Add</button>
      </form>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <FavoriteList title="Planets" type="planets" items={preferencesForm.favoritesPlanets} onRemove={onRemoveFavorite} saving={saving} />
        <FavoriteList title="Constellations" type="constellations" items={preferencesForm.favoritesConstellations} onRemove={onRemoveFavorite} saving={saving} />
      </div>
    </Panel>
  );
}

function AchievementsPage({ savedTotal, contributionCount }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="First Steps" subtitle="Explore core astronomy pages">
        <Achievement icon={Star} title="First Steps" body="Explore 10 pages" tone="violet" />
      </Panel>
      <Panel title="Deep Explorer" subtitle="Use planners, scans, and observatory tools">
        <Achievement icon={Compass} title="Deep Explorer" body={`${contributionCount} recorded contributions`} tone="sky" />
      </Panel>
      <Panel title="Cosmic Collector" subtitle="Build a library of saved items">
        <Achievement icon={Trophy} title="Cosmic Collector" body={`${savedTotal} saved items`} tone="amber" />
      </Panel>
    </div>
  );
}

function NotesPage({ imageUploads }) {
  return (
    <Panel title="Notes" subtitle="Recognition notes generated from image scans">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {imageUploads.map((item) => (
          <CompactItem
            key={item.id}
            image={item.originalUrl}
            title={item.constellation?.name || item.recognizedConstellation || "Unrecognized"}
            subtitle={`${Math.round((item.confidenceScore || 0) * 100)}% confidence`}
          />
        ))}
        {!imageUploads.length ? <EmptyText>No constellation scan notes yet.</EmptyText> : null}
      </div>
    </Panel>
  );
}

function SettingsPage({
  profileForm,
  preferencesForm,
  saving,
  setProfileForm,
  setPreferencesForm,
  onProfileSubmit,
  onPreferencesSubmit,
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Panel title="Profile & Location" subtitle="Update account details used by recommendations">
        <form onSubmit={onProfileSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display name" value={profileForm.displayName} onChange={(value) => setProfileForm((prev) => ({ ...prev, displayName: value }))} />
            <Field label="Avatar URL" value={profileForm.avatarUrl} onChange={(value) => setProfileForm((prev) => ({ ...prev, avatarUrl: value }))} placeholder="https://..." />
            <Field label="Location" value={profileForm.location} onChange={(value) => setProfileForm((prev) => ({ ...prev, location: value }))} placeholder="Hanoi, Vietnam" />
            <Field label="Timezone" value={profileForm.timezone} onChange={(value) => setProfileForm((prev) => ({ ...prev, timezone: value }))} />
            <Field label="Latitude" value={profileForm.latitude} onChange={(value) => setProfileForm((prev) => ({ ...prev, latitude: value }))} placeholder="21.0285" />
            <Field label="Longitude" value={profileForm.longitude} onChange={(value) => setProfileForm((prev) => ({ ...prev, longitude: value }))} placeholder="105.8542" />
            <Field label="Website" value={profileForm.website} onChange={(value) => setProfileForm((prev) => ({ ...prev, website: value }))} placeholder="https://..." />
          </div>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">Bio</span>
            <textarea
              value={profileForm.bio}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
              className="min-h-28 rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-violet-300/60"
              placeholder="What kind of sky watcher are you?"
            />
          </label>
          <ActionButton loading={saving === "profile"} icon={Save} label="Save profile" />
        </form>
      </Panel>

      <Panel title="Learning Preferences" subtitle="Customize how CosmoVision guides you">
        <form onSubmit={onPreferencesSubmit} className="grid gap-4">
          <SelectField label="Experience" value={preferencesForm.experienceLevel} options={["beginner", "intermediate", "advanced"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, experienceLevel: value }))} />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Temperature" value={preferencesForm.temperatureUnit} options={["celsius", "fahrenheit"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, temperatureUnit: value }))} />
            <SelectField label="Distance" value={preferencesForm.distanceUnit} options={["km", "mi"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, distanceUnit: value }))} />
            <SelectField label="Time" value={preferencesForm.timeFormat} options={["24h", "12h"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, timeFormat: value }))} />
          </div>
          <ToggleRow label="Email alerts" checked={Boolean(preferencesForm.emailAlerts)} onChange={(checked) => setPreferencesForm((prev) => ({ ...prev, emailAlerts: checked }))} />
          <ToggleRow label="Event reminders" checked={Boolean(preferencesForm.eventReminders)} onChange={(checked) => setPreferencesForm((prev) => ({ ...prev, eventReminders: checked }))} />
          <ActionButton loading={saving === "preferences"} icon={Save} label="Save preferences" />
        </form>
      </Panel>
    </div>
  );
}

function SideButton({ icon: Icon, label, active = false, onClick, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 shrink-0 items-center gap-4 rounded-[6px] px-5 text-left text-base font-semibold transition md:text-lg ${
        compact ? "w-auto" : "w-full"
      } ${
        active ? "bg-violet-500/28 text-foreground shadow-[inset_3px_0_0_rgba(167,139,250,0.9)]" : "text-foreground/72 hover:bg-white/[0.055] hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function MiniBadge({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[8px] bg-white/[0.035] px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-violet-200" />
      <span className="min-w-0">
        <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-foreground/42">{label}</span>
        <span className="block truncate text-sm text-foreground/82">{value}</span>
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-[#07111f]/82 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-violet-500/16 text-violet-100">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <p className="truncate text-sm text-foreground/58">{label}</p>
          <p className="font-display text-2xl leading-tight text-foreground">{value}</p>
          <p className="mt-1 truncate text-xs font-medium text-emerald-300/85">{delta}</p>
        </span>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-[#07111f]/82 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-foreground/52">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ActivityChart() {
  const points = [28, 36, 50, 40, 47, 37, 66, 51, 35, 67, 55, 70];
  const max = Math.max(...points);
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - (value / max) * 86;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="h-52 rounded-[8px] border border-white/10 bg-white/[0.02] p-4">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="activityLine" x1="0" x2="1">
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#7dd3fc" />
          </linearGradient>
          <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#8b5cf6" stopOpacity="0.32" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        ))}
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#activityFill)" />
        <path d={path} fill="none" stroke="url(#activityLine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function CategoryBar({ icon, label, value }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex min-w-0 items-center gap-3 text-foreground/78">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-white/[0.045] text-xs">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-foreground/62">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ItemGrid({ children, empty }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return <div className="grid gap-3">{items.length ? items : <EmptyText>{empty}</EmptyText>}</div>;
}

function CompactItem({ image, title, subtitle, trailing }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
      {image ? (
        <img src={image} alt={title} className="h-12 w-12 shrink-0 rounded-[6px] object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[6px] bg-violet-500/16 text-violet-100">
          <Sparkles className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-foreground/52">{subtitle}</p>
      </div>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  );
}

function Achievement({ icon: Icon, title, body, tone }) {
  const toneClass = {
    violet: "bg-violet-500/18 text-violet-100",
    sky: "bg-sky-500/18 text-sky-100",
    amber: "bg-amber-500/18 text-amber-100",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[8px] ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-foreground/52">{body}</p>
      </span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">{label}</span>
      <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 rounded-[8px] border border-white/10 bg-white/[0.035] px-4 text-sm outline-none focus:border-violet-300/60" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-[8px] border border-white/10 bg-slate-950/80 px-4 text-sm outline-none focus:border-violet-300/60">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-2">
        <Bell className="h-4 w-4 text-violet-200" />
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function ActionButton({ loading, icon: Icon, label }) {
  return (
    <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[8px] bg-violet-500/22 px-5 text-sm text-violet-50 hover:bg-violet-500/32 disabled:opacity-60" disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function FavoriteList({ title, type, items = [], onRemove, saving }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
            {item}
            <button type="button" onClick={() => onRemove(type, item)} disabled={saving === `favorite-${item}`} className="text-foreground/45 hover:text-white" aria-label={`Remove ${item}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        )) : <EmptyText>No favorites yet.</EmptyText>}
      </div>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="text-sm text-foreground/50">{children}</p>;
}
