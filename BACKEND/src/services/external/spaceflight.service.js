const LAUNCH_LIBRARY_BASE_URL = "https://ll.thespacedevs.com/2.2.0";
const FETCH_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "CosmoVision-AI/1.0",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function getUpcomingLaunches({ limit = 5 } = {}) {
  const safeLimit = Math.min(10, Math.max(1, Number.parseInt(limit, 10) || 5));
  const params = new URLSearchParams({
    limit: String(safeLimit),
    mode: "list",
    ordering: "net",
  });

  const res = await fetchWithTimeout(`${LAUNCH_LIBRARY_BASE_URL}/launch/upcoming/?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Launch Library API error: HTTP ${res.status}`);
  }

  const data = await res.json();
  const launches = Array.isArray(data.results) ? data.results : [];

  return launches.map((launch) => ({
    id: `launch-${launch.id}`,
    title: launch.name || "Upcoming space launch",
    type: "SPACE_LAUNCH",
    description:
      launch.mission?.description ||
      [
        launch.launch_service_provider?.name,
        launch.rocket?.configuration?.full_name,
        launch.pad?.location?.name,
      ].filter(Boolean).join(" - ") ||
      "Upcoming spaceflight event from Launch Library.",
    imageUrl: launch.image || null,
    startDate: launch.net || launch.window_start || null,
    endDate: launch.window_end || null,
    peakDate: launch.net || null,
    visibleFrom: [launch.pad?.location?.country_code || launch.pad?.location?.name || "Global"],
    aiSummary: launch.status?.description || null,
    source: "Launch Library",
    sourceUrl: launch.url || launch.infoURLs?.[0]?.url || null,
    external: true,
  }));
}
