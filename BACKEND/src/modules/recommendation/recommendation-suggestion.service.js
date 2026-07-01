import groq from "../../config/groq.js";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export function buildRuleBasedSuggestion({ locationLabel, skyScore, tier, planets, constellations, nasaInfluence }) {
  const firstPlanet = planets[0]?.name || "cac hanh tinh";
  const firstConstellation = constellations[0];
  const nasaNote = nasaInfluence.priorityEvent
    ? ` NASA cung ghi nhan tieu hanh tinh ${nasaInfluence.priorityEvent.name} dang tiep can Trai Dat.`
    : "";

  if (tier.tier === "POOR") {
    return `Dieu kien quan sat tai ${locationLabel} hom nay khong thuan loi (diem ${skyScore}/100 - ${tier.label}). May day hoac do am cao co the che khuat bau troi. Ban co the thu ung dung Stellarium de mo phong bau troi, hoac len ke hoach cho dem troi quang hon.${nasaNote}`;
  }
  if (tier.tier === "BELOW_FAIR") {
    return `Bau troi ${locationLabel} hom nay o muc ${tier.label.toLowerCase()} (diem ${skyScore}/100). Van co the thu quan sat ${firstPlanet} neu tim duoc diem it may, nhung dung ky vong qua cao.${nasaNote}`;
  }
  if (tier.tier === "FAIR") {
    return `Bau troi ${locationLabel} hom nay o muc trung binh (diem ${skyScore}/100). Ban van co the thay ${firstPlanet} neu tim diem it may. Chom sao ${firstConstellation} cung dang thu.${nasaNote}`;
  }
  return `Toi nay bau troi ${locationLabel} kha quang dang (diem ${skyScore}/100 - ${tier.label}) - dieu kien ly tuong de quan sat! Hay de y ${firstPlanet} va chom sao ${firstConstellation}. Thoi diem tot nhat la sau khi troi toi han.${nasaNote}`;
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
      : locationInfo?.displayName || "vi tri cua ban";

  const planetList = planets
    .map((p) => {
      const tags = [];
      if (p.hasRings) tags.push("co vanh dai");
      if (p.numberOfMoons) tags.push(`${p.numberOfMoons} mat trang`);
      const boosted = nasaInfluence.boostedPlanetSlug === p.slug ? " [NASA dang chu y hom nay]" : "";
      return tags.length > 0 ? `${p.name}${boosted} (${tags.join(", ")})` : `${p.name}${boosted}`;
    })
    .join(", ");

  const neoInfo = nasaInfluence.priorityEvent
    ? `${nasaInfluence.priorityEvent.name} (cach Trai Dat ${Math.round(nasaInfluence.priorityEvent.missDistanceKm / 1000)} nghin km${nasaInfluence.priorityEvent.isPotentiallyHazardous ? ", duoc theo doi do tiep can gan" : ""})`
    : null;
  const apodInfo = apod ? `Anh thien van NASA hom nay: "${apod.title}"` : null;
  const observatoryInfo =
    observatories && observatories.length > 0
      ? observatories.map((o) => `${o.name} (${o.distanceKm}km, ${o.city || o.country})`).join("; ")
      : null;
  const sunsetStr = weather.sunset instanceof Date
    ? weather.sunset.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : null;

  const prompt = `Ban la CosmoBot, tro ly thien van cua CosmoVision. Hay tao mot goi y quan sat bau troi ngan gon, than thien va thuc te (4-6 cau) cho nguoi dung tai ${locationLabel}.

DU LIEU THUC TE HOM NAY:
- Thoi tiet: ${weather.label || weather.condition}, ${weather.temperature}C, do am ${weather.humidity}%
- Do phu may: ${weather.cloudCover}%, tam nhin: ${weather.visibility} km, gio: ${weather.windSpeed} km/h
- Diem quan sat bau troi: ${skyScore}/100 (${tier.label})
${sunsetStr ? `- Hoang hon luc: ${sunsetStr}` : ""}
${apodInfo ? `- ${apodInfo}` : ""}
${neoInfo ? `- SU KIEN UU TIEN (NASA): ${neoInfo}` : ""}
${observatoryInfo ? `- Dia diem quan sat gan day: ${observatoryInfo}` : ""}

DOI TUONG CO THE QUAN SAT (da sap xep theo do uu tien tu du lieu NASA):
- Hanh tinh: ${planetList || "khong co thong tin"}
- Chom sao thang nay: ${constellations.join(", ")}

YEU CAU:
- Tra loi BANG TIENG VIET.
- Neu co [NASA dang chu y hom nay] o hanh tinh nao, UU TIEN nhac den hanh tinh do dau tien.
- Neu co SU KIEN UU TIEN (NASA), nhac den ro rang vi day la tin dang chu y nhat hom nay.
- Neu co dia diem quan sat gan day, goi y 1 dia diem cu the.
- Giu duoi 120 tu, giong van than thien va truyen cam hung.`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "Ban la CosmoBot, tro ly thien van cua CosmoVision. Luon tra loi bang tieng Viet, ngan gon va truyen cam hung.",
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
