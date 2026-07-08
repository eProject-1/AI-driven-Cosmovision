import { findMatchedKeywords, hasKeyword } from "../../utils/fuzzy.match.util.js";
import { normalizeText } from "../../utils/normalize.util.js";

const INTENT_TYPES = {
  GENERAL: "general",
  WEATHER: "weather",
  NEWS: "news",
  PLANET: "planet",
  CONSTELLATION: "constellation",
  RECOMMENDATION: "recommendation",
  ASTRONOMY: "astronomy",
  GUIDE: "guide",
  RECOGNITION: "recognition",
  FAVORITE: "favorite",
};

const PERSISTED_INTENT_TYPES = {
  [INTENT_TYPES.PLANET]: "PLANET_INFO",
  [INTENT_TYPES.CONSTELLATION]: "CONSTELLATION_INFO",
  [INTENT_TYPES.RECOMMENDATION]: "STARGAZING_RECOMMENDATION",
  [INTENT_TYPES.WEATHER]: "WEATHER_CHECK",
  [INTENT_TYPES.ASTRONOMY]: "GENERAL_ASTRONOMY",
  [INTENT_TYPES.GENERAL]: "GENERAL_ASTRONOMY",
  [INTENT_TYPES.NEWS]: "NEWS",
  [INTENT_TYPES.GUIDE]: "GUIDE",
  [INTENT_TYPES.RECOGNITION]: "IMAGE_RECOGNITION",
  [INTENT_TYPES.FAVORITE]: "FAVORITE",
};

const VIETNAMESE_HINTS = [
  "toi", "ban", "minh", "hay", "la", "gi",
  "vi sao", "nhu the nao", "khi nao", "o dau", "co gi",
  "quan sat", "chom sao", "hanh tinh", "bau troi", "dem nay", "thoi tiet",
];

const intentConfig = [
  {
    type: INTENT_TYPES.WEATHER,
    keywords: ["thoi tiet", "nhiet do", "mua", "nang", "may", "gio", "weather", "temperature", "rain", "sunny", "humidity", "forecast", "cloud", "wind"],
    baseConfidence: 0.88,
  },
  {
    type: INTENT_TYPES.NEWS,
    keywords: ["tin tuc", "moi nhat", "tom tat", "kham pha", "news", "latest", "summary", "nasa", "mission", "discovery"],
    baseConfidence: 0.86,
  },
  {
    type: INTENT_TYPES.PLANET,
    keywords: ["hanh tinh", "sao thuy", "sao kim", "trai dat", "sao hoa", "sao moc", "sao tho", "planet", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"],
    baseConfidence: 0.87,
  },
  {
    type: INTENT_TYPES.CONSTELLATION,
    keywords: ["chom sao", "ban do sao", "ngoi sao", "constellation", "orion", "ursa", "scorpio", "gemini", "taurus", "leo"],
    baseConfidence: 0.85,
  },
  {
    type: INTENT_TYPES.RECOMMENDATION,
    keywords: ["goi y", "nen ngam", "quan sat", "phu hop", "dem nay", "recommend", "best time", "stargazing", "personalized"],
    baseConfidence: 0.84,
  },
  {
    type: INTENT_TYPES.ASTRONOMY,
    keywords: ["thien van", "sao choi", "vu tru", "astronomy", "universe", "galaxy", "black hole", "meteor", "eclipse"],
    baseConfidence: 0.82,
  },
  {
    type: INTENT_TYPES.GUIDE,
    keywords: ["huong dan", "lam sao", "dung website", "how to", "help", "tutorial"],
    baseConfidence: 0.83,
  },
  {
    type: INTENT_TYPES.RECOGNITION,
    keywords: ["nhan dien", "anh bau troi", "chup sao", "recognize", "upload anh", "identify constellation"],
    baseConfidence: 0.8,
  },
  {
    type: INTENT_TYPES.FAVORITE,
    keywords: ["yeu thich", "thich", "luu", "danh dau", "favorite", "save"],
    baseConfidence: 0.75,
  },
];

function detectIntent(message = "") {
  const normalizedMessage = normalizeForIntent(message);

  if (!normalizedMessage) {
    return {
      type: INTENT_TYPES.GENERAL,
      confidence: 0,
      reason: "Empty message.",
      intents: [],
    };
  }

  const messageWords = normalizedMessage.split(/\s+/);
  const detectedIntents = intentConfig
    .map((config) => buildIntentMatch(config, normalizedMessage, messageWords))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  const primaryIntent =
    detectedIntents[0] || {
      type: INTENT_TYPES.GENERAL,
      confidence: 0.52,
      reason: "No specific intent matched.",
    };

  return {
    type: primaryIntent.type,
    confidence: primaryIntent.confidence,
    reason: primaryIntent.reason,
    intents: detectedIntents,
    primaryIntent,
  };
}

function extractPlanetName(message = "") {
  const normalized = normalizeForIntent(message);
  const planetMap = {
    mercury: ["mercury", "sao thuy"],
    venus: ["venus", "sao kim"],
    earth: ["earth", "trai dat"],
    mars: ["mars", "sao hoa"],
    jupiter: ["jupiter", "sao moc"],
    saturn: ["saturn", "sao tho"],
    uranus: ["uranus"],
    neptune: ["neptune"],
  };

  for (const [planet, keywords] of Object.entries(planetMap)) {
    if (hasKeyword(normalized, keywords)) return planet;
  }

  return null;
}

function detectResponseLanguage(message = "") {
  const raw = String(message);
  if (/[à-ỹđ]/i.test(raw)) return "vi";

  const normalized = normalizeForIntent(raw);
  return VIETNAMESE_HINTS.some((hint) => hasPhrase(normalized, hint)) ? "vi" : "en";
}

function toPersistenceIntentType(intent) {
  const type = intent?.primaryIntent?.type || intent?.type || INTENT_TYPES.GENERAL;
  return PERSISTED_INTENT_TYPES[type] || "UNKNOWN";
}

function buildIntentMatch(config, normalizedMessage, messageWords) {
  const matchedKeywords = findMatchedKeywords(normalizedMessage, config.keywords);
  if (!matchedKeywords.length) return null;

  let confidence = config.baseConfidence;
  if (matchedKeywords.length > 1) confidence += (matchedKeywords.length - 1) * 0.035;
  if (normalizedMessage.length > 45) confidence += 0.04;
  if (messageWords.length < 4) confidence -= 0.07;
  if (messageWords.length > 12) confidence += 0.02;

  confidence = Math.min(0.98, Math.max(0.65, confidence));

  return {
    type: config.type,
    confidence: Number(confidence.toFixed(2)),
    reason: `Matched ${matchedKeywords.length} keyword(s): [${matchedKeywords.join(", ")}]`,
    matchedKeywords,
  };
}

function normalizeForIntent(text = "") {
  return normalizeText(stripVietnameseTone(text));
}

function stripVietnameseTone(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasPhrase(text, phrase) {
  return new RegExp(`(^|\\s)${phrase.replace(/\s+/g, "\\s+")}(\\s|$)`, "i").test(text);
}

export {
  INTENT_TYPES,
  detectIntent,
  detectResponseLanguage,
  extractPlanetName,
  normalizeForIntent,
  toPersistenceIntentType,
};
