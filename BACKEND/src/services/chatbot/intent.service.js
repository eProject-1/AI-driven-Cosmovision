
// service/chatbot/intent.service.js

import { hasKeyword, findMatchedKeywords } from '../../utils/fuzzyMatch.js';
import { normalizeText } from '../../utils/normalize.js';

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

const intentConfig = [
  {
    type: INTENT_TYPES.WEATHER,
    keywords: ["thời tiết", "weather", "nhiệt độ", "temperature", "mưa", "rain", "nắng", "sunny", "humidity", "forecast", "mây", "cloud", "gió", "wind"],
    baseConfidence: 0.88,
  },
  {
    type: INTENT_TYPES.NEWS,
    keywords: ["tin tức", "news", "mới nhất", "latest", "tóm tắt", "summary", "nasa", "mission", "khám phá", "discovery"],
    baseConfidence: 0.86,
  },
  {
    type: INTENT_TYPES.PLANET,
    keywords: ["hành tinh", "planet", "sao thủy", "mercury", "sao kim", "venus", "trái đất", "earth", "sao hỏa", "mars", "sao mộc", "jupiter", "sao thổ", "saturn"],
    baseConfidence: 0.87,
  },
  {
    type: INTENT_TYPES.CONSTELLATION,
    keywords: ["chòm sao", "constellation", "orion", "ursa", "scorpio", "gemini", "bản đồ sao", "ngôi sao"],
    baseConfidence: 0.85,
  },
  {
    type: INTENT_TYPES.RECOMMENDATION,
    keywords: ["gợi ý", "recommend", "nên ngắm", "best time", "quan sát", "stargazing", "phù hợp", "personalized", "đêm nay"],
    baseConfidence: 0.84,
  },
  {
    type: INTENT_TYPES.ASTRONOMY,
    keywords: ["thiên văn", "astronomy", "universe", "galaxy", "black hole", "sao chổi", "meteor", "eclipse", "vũ trụ"],
    baseConfidence: 0.82,
  },
  {
    type: INTENT_TYPES.GUIDE,
    keywords: ["hướng dẫn", "how to", "dùng website", "làm sao", "help", "tutorial", "hỏi đáp"],
    baseConfidence: 0.83,
  },
  {
    type: INTENT_TYPES.RECOGNITION,
    keywords: ["nhận diện", "recognize", "upload ảnh", "ảnh bầu trời", "identify constellation", "chụp sao"],
    baseConfidence: 0.80,
  },
  {
    type: INTENT_TYPES.FAVORITE,
    keywords: ["yêu thích", "favorite", "thích", "lưu", "save", "đánh dấu"],
    baseConfidence: 0.75,
  },
];

export function detectIntent(message = "") {
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) {
    return {
      type: INTENT_TYPES.GENERAL,
      confidence: 0,
      reason: "Empty message.",
      intents: [],
    };
  }

  const messageWords = normalizedMessage.split(/\s+/);
  const detectedIntents = [];

  for (const config of intentConfig) {
    const matchedKeywords = findMatchedKeywords(normalizedMessage, config.keywords);

    if (matchedKeywords.length > 0) {
      let confidence = config.baseConfidence;

      if (matchedKeywords.length > 1) {
        confidence += (matchedKeywords.length - 1) * 0.035;
      }
      if (normalizedMessage.length > 45) confidence += 0.04;
      if (messageWords.length < 4) confidence -= 0.07;
      if (messageWords.length > 12) confidence += 0.02;

      confidence = Math.min(0.98, Math.max(0.65, confidence));

      detectedIntents.push({
        type: config.type,
        confidence: parseFloat(confidence.toFixed(2)),
        reason: `Matched ${matchedKeywords.length} keyword(s): [${matchedKeywords.join(", ")}]`,
        matchedKeywords
      });
    }
  }

  detectedIntents.sort((a, b) => b.confidence - a.confidence);

  const primaryIntent = detectedIntents.length > 0
    ? detectedIntents[0]
    : {
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
  const normalized = normalizeText(message);
  const planetMap = {
    mercury: ["mercury", "sao thủy"],
    venus: ["venus", "sao kim"],
    earth: ["earth", "trái đất"],
    mars: ["mars", "sao hỏa"],
    jupiter: ["jupiter", "sao mộc"],
    saturn: ["saturn", "sao thổ"],
    uranus: ["uranus"],
    neptune: ["neptune"],
  };

  for (const [planet, keywords] of Object.entries(planetMap)) {
    if (hasKeyword(normalized, keywords)) {
      return planet;
    }
  }
  return null;
}

function extractConstellationName(message = "") {
  const normalized = normalizeText(message);
  const commonConstellations = ["orion", "ursa", "scorpio", "gemini", "taurus", "leo", "chòm sao"];

  for (const name of commonConstellations) {
    if (hasKeyword(normalized, [name])) {
      return name;
    }
  }
  return null;
}

export {
  INTENT_TYPES,
  extractPlanetName,
  extractConstellationName,
};