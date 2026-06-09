/**
 * intent.service.js
 * - Phân loại ý định câu hỏi của user trước khi gọi AI.
 * - Giúp chatbot biết nên lấy dữ liệu planet, weather, recommendation hay trả lời general.
 */

const INTENT_TYPES = {
  PLANET: "planet",
  WEATHER: "weather",
  RECOMMENDATION: "recommendation",
  NEWS: "news",
  GENERAL: "general",
};

const planetKeywords = [
  "planet",
  "hành tinh",
  "sao thủy",
  "mercury",
  "sao kim",
  "venus",
  "trái đất",
  "earth",
  "sao hỏa",
  "mars",
  "sao mộc",
  "jupiter",
  "sao thổ",
  "saturn",
  "sao thiên vương",
  "uranus",
  "sao hải vương",
  "neptune",
  "solar system",
  "hệ mặt trời",
];

const weatherKeywords = [
  "weather",
  "thời tiết",
  "nhiệt độ",
  "mưa",
  "nắng",
  "humidity",
  "forecast",
  "dự báo",
  "khí hậu",
];

const recommendationKeywords = [
  "recommend",
  "recommendation",
  "gợi ý",
  "đề xuất",
  "nên xem",
  "nên học",
  "phù hợp",
  "suggest",
];

const newsKeywords = [
  "news",
  "tin tức",
  "mới nhất",
  "latest",
  "sự kiện",
  "space news",
  "nasa news",
];

function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim();
}

function hasKeyword(message, keywords) {
  return keywords.some((keyword) => message.includes(keyword));
}

function detectIntent(message = "") {
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) {
    return {
      type: INTENT_TYPES.GENERAL,
      confidence: 0,
      reason: "Empty message",
    };
  }

  if (hasKeyword(normalizedMessage, weatherKeywords)) {
    return {
      type: INTENT_TYPES.WEATHER,
      confidence: 0.85,
      reason: "Message contains weather-related keywords",
    };
  }

  if (hasKeyword(normalizedMessage, planetKeywords)) {
    return {
      type: INTENT_TYPES.PLANET,
      confidence: 0.85,
      reason: "Message contains planet-related keywords",
    };
  }

  if (hasKeyword(normalizedMessage, recommendationKeywords)) {
    return {
      type: INTENT_TYPES.RECOMMENDATION,
      confidence: 0.8,
      reason: "Message contains recommendation-related keywords",
    };
  }

  if (hasKeyword(normalizedMessage, newsKeywords)) {
    return {
      type: INTENT_TYPES.NEWS,
      confidence: 0.8,
      reason: "Message contains news-related keywords",
    };
  }

  return {
    type: INTENT_TYPES.GENERAL,
    confidence: 0.5,
    reason: "No specific intent matched",
  };
}

function extractPlanetName(message = "") {
  const normalizedMessage = normalizeText(message);

  const planetMap = {
    mercury: ["mercury", "sao thủy"],
    venus: ["venus", "sao kim"],
    earth: ["earth", "trái đất"],
    mars: ["mars", "sao hỏa"],
    jupiter: ["jupiter", "sao mộc"],
    saturn: ["saturn", "sao thổ"],
    uranus: ["uranus", "sao thiên vương"],
    neptune: ["neptune", "sao hải vương"],
  };

  for (const [planetName, keywords] of Object.entries(planetMap)) {
    if (keywords.some((keyword) => normalizedMessage.includes(keyword))) {
      return planetName;
    }
  }

  return null;
}

module.exports = {
  INTENT_TYPES,
  detectIntent,
  extractPlanetName,
};




