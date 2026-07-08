export const categoryMap = {
  Andromeda: "Mythology",
  Aquarius: "Mythology",
  Capricornus: "Mythology",
  Centaurus: "Mythology",
  Cetus: "Mythology",
  Draco: "Mythology",
  Pegasus: "Mythology",
  Phoenix: "Mythology",
  Sagittarius: "Mythology",
  Auriga: "Human",
  Bootes: "Human",
  Cassiopeia: "Human",
  Cepheus: "Human",
  "Coma Berenices": "Human",
  Gemini: "Human",
  Hercules: "Human",
  Indus: "Human",
  Ophiuchus: "Human",
  Orion: "Human",
  Perseus: "Human",
  Virgo: "Human",
  Antlia: "Objects",
  Ara: "Objects",
  Caelum: "Objects",
  Carina: "Objects",
  Circinus: "Objects",
  "Corona Australis": "Objects",
  "Corona Borealis": "Objects",
  Crater: "Objects",
  Crux: "Objects",
  Eridanus: "Objects",
  Fornax: "Objects",
  Libra: "Objects",
  Lyra: "Objects",
  Mensa: "Objects",
  Microscopium: "Objects",
  Norma: "Objects",
  Octans: "Objects",
  Pictor: "Objects",
  Puppis: "Objects",
  Pyxis: "Objects",
  Reticulum: "Objects",
  Sagitta: "Objects",
  Sculptor: "Objects",
  Scutum: "Objects",
  Sextans: "Objects",
  Telescopium: "Objects",
  Triangulum: "Objects",
  "Triangulum Australe": "Objects",
  Vela: "Objects",
};

export function getCategory(constellation) {
  return categoryMap[constellation?.name] || "Animals";
}

export function getHemisphere(constellation) {
  if (constellation?.quadrant?.startsWith("N")) return "Northern";
  if (constellation?.quadrant?.startsWith("S")) return "Southern";
  return "Equatorial";
}

export function safeConstellationValue(value, fallback = "Unknown") {
  return value === null || value === undefined || value === "" ? fallback : value;
}
