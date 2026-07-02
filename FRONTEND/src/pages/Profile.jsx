import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Camera, Compass, Loader2, MapPin, Save, Sparkles, Star, Trash2 } from "lucide-react";
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

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function LovableProfile() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [preferencesForm, setPreferencesForm] = useState(emptyPreferences);
  const [recommendations, setRecommendations] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [savedObservatories, setSavedObservatories] = useState([]);
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
        getImageUploads(6),
      ]);

      const nextUser = summaryData.user;
      setSummary(summaryData);
      setUser(nextUser);
      setRecommendations(recs || []);
      setSavedEvents(events || []);
      setSavedObservatories(observatories || []);
      setImageUploads(uploads || []);
      setProfileForm({
        displayName: nextUser.displayName || "",
        avatarUrl: nextUser.avatarUrl || "",
        bio: nextUser.profile?.bio || "",
        location: nextUser.profile?.location || "",
        latitude: nextUser.profile?.latitude ?? "",
        longitude: nextUser.profile?.longitude ?? "",
        timezone: nextUser.profile?.timezone || "Asia/Ho_Chi_Minh",
        website: nextUser.profile?.website || "",
      });
      setPreferencesForm({
        ...emptyPreferences,
        ...(nextUser.preferences || {}),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile().catch(() => setLoading(false));
  }, []);

  const initials = useMemo(() => {
    return (user?.displayName || user?.username || "U").slice(0, 2).toUpperCase();
  }, [user]);

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
      <main className="min-h-screen px-6 pb-24 pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground shadow-[0_18px_55px_rgba(14,165,233,0.22)]">
                {initials}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Explorer Profile</p>
                <h1 className="mt-1 text-4xl font-bold">
                  <span className="text-aurora">{user?.displayName || user?.username || "Explorer"}</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.profile?.location ? `From ${user.profile.location}` : "Set a location for better sky recommendations"}
                </p>
              </div>
            </div>
            <Link to="/dashboard" className="glass rounded-full px-5 py-3 text-sm hover:bg-white/10">
              Open dashboard
            </Link>
          </div>

          {message ? (
            <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100">
              {message}
            </div>
          ) : null}

          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Sparkles} label="Recommendations" value={summary?.counts?.recommendations || 0} />
            <StatCard icon={Bookmark} label="Saved observatories" value={summary?.counts?.savedObservatories || 0} />
            <StatCard icon={Camera} label="Image scans" value={summary?.counts?.imageUploads || 0} />
            <StatCard icon={Star} label="Favorites" value={(summary?.counts?.favoritePlanets || 0) + (summary?.counts?.favoriteConstellations || 0)} />
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <form onSubmit={handleProfileSubmit} className="glass rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-cyan-100" />
                <h2 className="font-display text-xl">Profile & location</h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Display name" value={profileForm.displayName} onChange={(value) => setProfileForm((prev) => ({ ...prev, displayName: value }))} />
                <Field label="Location" value={profileForm.location} onChange={(value) => setProfileForm((prev) => ({ ...prev, location: value }))} placeholder="Hanoi, Vietnam" />
                <Field label="Latitude" value={profileForm.latitude} onChange={(value) => setProfileForm((prev) => ({ ...prev, latitude: value }))} placeholder="21.0285" />
                <Field label="Longitude" value={profileForm.longitude} onChange={(value) => setProfileForm((prev) => ({ ...prev, longitude: value }))} placeholder="105.8542" />
                <Field label="Timezone" value={profileForm.timezone} onChange={(value) => setProfileForm((prev) => ({ ...prev, timezone: value }))} />
                <Field label="Website" value={profileForm.website} onChange={(value) => setProfileForm((prev) => ({ ...prev, website: value }))} placeholder="https://..." />
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Bio</span>
                  <textarea
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                    className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-cyan-200/50"
                    placeholder="What kind of sky watcher are you?"
                  />
                </label>
              </div>
              <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-cyan-200/12 px-5 text-sm text-cyan-50 hover:bg-cyan-200/18" disabled={saving === "profile"}>
                {saving === "profile" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </button>
            </form>

            <form onSubmit={handlePreferencesSubmit} className="glass rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-cyan-100" />
                <h2 className="font-display text-xl">Learning preferences</h2>
              </div>
              <div className="mt-6 grid gap-4">
                <SelectField label="Experience" value={preferencesForm.experienceLevel} options={["beginner", "intermediate", "advanced"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, experienceLevel: value }))} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField label="Temperature" value={preferencesForm.temperatureUnit} options={["celsius", "fahrenheit"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, temperatureUnit: value }))} />
                  <SelectField label="Distance" value={preferencesForm.distanceUnit} options={["km", "mi"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, distanceUnit: value }))} />
                  <SelectField label="Time" value={preferencesForm.timeFormat} options={["24h", "12h"]} onChange={(value) => setPreferencesForm((prev) => ({ ...prev, timeFormat: value }))} />
                </div>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
                  Email alerts
                  <input type="checkbox" checked={Boolean(preferencesForm.emailAlerts)} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, emailAlerts: event.target.checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
                  Event reminders
                  <input type="checkbox" checked={Boolean(preferencesForm.eventReminders)} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, eventReminders: event.target.checked }))} />
                </label>
                <p className="rounded-2xl border border-cyan-200/15 bg-cyan-950/20 px-4 py-3 text-sm font-light leading-relaxed text-cyan-50/75">
                  Saved dashboard events queue a browser notification when allowed, plus a mock email alert when email alerts are enabled.
                </p>
              </div>
              <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-cyan-200/12 px-5 text-sm text-cyan-50 hover:bg-cyan-200/18" disabled={saving === "preferences"}>
                {saving === "preferences" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save preferences
              </button>
            </form>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-3xl p-6">
              <h2 className="font-display text-xl">Favorites</h2>
              <form onSubmit={handleAddFavorite} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <select value={favoriteType} onChange={(event) => setFavoriteType(event.target.value)} className="min-h-11 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm">
                  <option value="planets">Planet</option>
                  <option value="constellations">Constellation</option>
                </select>
                <input value={favoriteInput} onChange={(event) => setFavoriteInput(event.target.value)} placeholder="Mars, Saturn, Orion..." className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm outline-none focus:border-cyan-200/50" />
                <button className="min-h-11 rounded-2xl bg-cyan-200/12 px-5 text-sm text-cyan-50 hover:bg-cyan-200/18">Add</button>
              </form>
              <FavoriteList title="Planets" type="planets" items={preferencesForm.favoritesPlanets} onRemove={handleRemoveFavorite} saving={saving} />
              <FavoriteList title="Constellations" type="constellations" items={preferencesForm.favoritesConstellations} onRemove={handleRemoveFavorite} saving={saving} />
            </div>

            <ListPanel title="Recent recommendations" empty="No recommendations yet.">
              {recommendations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm">{item.aiSuggestion || "Sky observation recommendation"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.locationName || "Saved location"} / Score {item.skyVisibilityScore ?? "N/A"}</p>
                </div>
              ))}
            </ListPanel>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            <ListPanel title="Saved observatories" empty="No saved observatories yet.">
              {savedObservatories.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="font-display">{item.observatory?.name || "Observatory"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.observatory?.city || "Location unavailable"}</p>
                </div>
              ))}
            </ListPanel>

            <ListPanel title="Saved events" empty="No saved events yet.">
              {savedEvents.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="font-display">{item.event?.title || "Celestial event"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.event?.startDate || item.savedAt)}</p>
                </div>
              ))}
            </ListPanel>

            <ListPanel title="Image scans" empty="No constellation scans yet.">
              {imageUploads.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <img src={item.originalUrl} alt={item.fileName} className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.constellation?.name || item.recognizedConstellation || "Unrecognized"}</p>
                    <p className="text-xs text-muted-foreground">{Math.round((item.confidenceScore || 0) * 100)}% confidence</p>
                  </div>
                </div>
              ))}
            </ListPanel>
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-3xl p-5">
      <Icon className="h-5 w-5 text-cyan-100" />
      <p className="mt-4 text-3xl font-display">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</span>
      <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm outline-none focus:border-cyan-200/50" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm outline-none focus:border-cyan-200/50">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function FavoriteList({ title, type, items = [], onRemove, saving }) {
  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
            {item}
            <button type="button" onClick={() => onRemove(type, item)} disabled={saving === `favorite-${item}`} className="text-muted-foreground hover:text-white" aria-label={`Remove ${item}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        )) : <span className="text-sm text-muted-foreground">No favorites yet.</span>}
      </div>
    </div>
  );
}

function ListPanel({ title, empty, children }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-5 grid gap-3">
        {hasChildren ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </section>
  );
}
