import groq from "../../config/groq.js";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export function buildRuleBasedSuggestion({ locationLabel, skyScore, tier, planets, constellations, nasaInfluence }) {
  const firstPlanet = planets[0]?.name || "the visible planets";
  const firstConstellation = constellations[0];
  const nasaNote = nasaInfluence.priorityEvent
    ? ` NASA also reports that asteroid ${nasaInfluence.priorityEvent.name} is making a close approach to Earth.`
    : "";

  if (tier.tier === "POOR") {
    return `Stargazing conditions in ${locationLabel} are poor today (${skyScore}/100 - ${tier.label}). Thick clouds or high humidity may obscure the sky. Try a sky simulator such as Stellarium, or plan for a clearer night.${nasaNote}`;
  }
  if (tier.tier === "BELOW_FAIR") {
    return `The sky over ${locationLabel} is ${tier.label.toLowerCase()} today (${skyScore}/100). You may still catch ${firstPlanet} from a less cloudy spot, but expectations should stay modest.${nasaNote}`;
  }
  if (tier.tier === "FAIR") {
    return `The sky over ${locationLabel} is fair today (${skyScore}/100). You may be able to see ${firstPlanet} from a clearer patch of sky. ${firstConstellation} is also worth checking.${nasaNote}`;
  }
  return `Tonight looks promising in ${locationLabel} (${skyScore}/100 - ${tier.label}). Watch for ${firstPlanet} and the constellation ${firstConstellation}. The best window is after the sky gets fully dark.${nasaNote}`;
}

export async function generateAiSuggestion({
  locationInfo,
  weather,
  skyScore,
  tier,
  planets,
  constellations,
  apod,
  nasaInfluence,
  observatories,
}) {
  const locationLabel =
    locationInfo?.city
      ? `${locationInfo.city}${locationInfo.country ? ", " + locationInfo.country : ""}`
      : locationInfo?.displayName || "your location";

  const planetList = planets
    .map((p) => {
      const tags = [];
      if (p.hasRings) tags.push("has rings");
      if (p.numberOfMoons) tags.push(`${p.numberOfMoons} moons`);
      const boosted = nasaInfluence.boostedPlanetSlug === p.slug ? " [NASA focus today]" : "";
      return tags.length > 0 ? `${p.name}${boosted} (${tags.join(", ")})` : `${p.name}${boosted}`;
    })
    .join(", ");

  const neoInfo = nasaInfluence.priorityEvent
    ? `${nasaInfluence.priorityEvent.name} (${Math.round(nasaInfluence.priorityEvent.missDistanceKm / 1000)} thousand km from Earth${nasaInfluence.priorityEvent.isPotentiallyHazardous ? ", monitored because of its close approach" : ""})`
    : null;
  const apodInfo = apod ? `NASA astronomy image of the day: "${apod.title}"` : null;
  const observatoryInfo =
    observatories && observatories.length > 0
      ? observatories.map((o) => `${o.name} (${o.distanceKm}km, ${o.city || o.country})`).join("; ")
      : null;
  const sunsetStr = weather.sunset instanceof Date
    ? weather.sunset.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  const prompt = `You are CosmoBot, the astronomy assistant for CosmoVision. Create a short, friendly, practical observing suggestion (4-6 sentences) for the user in ${locationLabel}.

TODAY'S REAL DATA:
- Weather: ${weather.label || weather.condition}, ${weather.temperature}C, humidity ${weather.humidity}%
- Cloud cover: ${weather.cloudCover}%, visibility: ${weather.visibility} km, wind: ${weather.windSpeed} km/h
- Sky visibility score: ${skyScore}/100 (${tier.label})
${sunsetStr ? `- Sunset: ${sunsetStr}` : ""}
${apodInfo ? `- ${apodInfo}` : ""}
${neoInfo ? `- PRIORITY NASA EVENT: ${neoInfo}` : ""}
${observatoryInfo ? `- Nearby observing sites: ${observatoryInfo}` : ""}

VISIBLE TARGETS (ranked using NASA data):
- Planets: ${planetList || "no data available"}
- Constellations this month: ${constellations.join(", ")}

REQUIREMENTS:
- Answer in English.
- If a planet has [NASA focus today], mention that planet first.
- If there is a PRIORITY NASA EVENT, mention it clearly as today's notable signal.
- If nearby observing sites are available, suggest one specific site.
- Keep it under 120 words, friendly, practical, and lightly inspiring.`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are CosmoBot, the astronomy assistant for CosmoVision. Always answer in English, concise and inspiring.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.75,
      max_tokens: 350,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("[recommendation] Groq suggestion error:", error.message);
    return buildRuleBasedSuggestion({ locationLabel, skyScore, tier, planets, constellations, nasaInfluence });
  }
}
