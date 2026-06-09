/**
 * recommendation.service.js
 * - Tạo recommendation cho user dựa theo message, intent hoặc dữ liệu planet.
 * - Hiện tại dùng rule-based recommendation để dễ chạy.
 * - Sau này có thể nâng cấp bằng database + AI embedding.
 */

const { INTENT_TYPES } = require("./intent.service");

const defaultRecommendations = [
  {
    title: "Explore Mars",
    type: "planet",
    reason: "Mars is one of the most popular planets for exploration and has many NASA missions.",
  },
  {
    title: "Learn about Jupiter",
    type: "planet",
    reason: "Jupiter is the largest planet in the Solar System and has fascinating moons.",
  },
  {
    title: "Check today's astronomy news",
    type: "news",
    reason: "Space news helps you stay updated with NASA missions and discoveries.",
  },
];

const beginnerRecommendations = [
  {
    title: "Start with the Solar System",
    type: "learning",
    reason: "This gives you a strong overview of planets, orbits, moons and basic astronomy.",
  },
  {
    title: "Compare Earth and Mars",
    type: "learning",
    reason: "Earth and Mars are easy to compare because both are rocky planets.",
  },
];

const weatherRecommendations = [
  {
    title: "Check local sky condition",
    type: "weather",
    reason: "Weather affects sky observation, stargazing and astronomy activities.",
  },
  {
    title: "Look for clear-night forecast",
    type: "weather",
    reason: "Clear skies are best for observing planets, stars and constellations.",
  },
];

function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim();
}

function getRuleBasedRecommendations(message = "", intentType = INTENT_TYPES.GENERAL) {
  const normalizedMessage = normalizeText(message);

  if (
    normalizedMessage.includes("beginner") ||
    normalizedMessage.includes("cơ bản") ||
    normalizedMessage.includes("người mới") ||
    normalizedMessage.includes("bắt đầu")
  ) {
    return beginnerRecommendations;
  }

  if (intentType === INTENT_TYPES.WEATHER) {
    return weatherRecommendations;
  }

  if (intentType === INTENT_TYPES.PLANET) {
    return [
      {
        title: "Compare similar planets",
        type: "planet",
        reason: "Comparing planets helps users understand size, temperature, atmosphere and orbit better.",
      },
      {
        title: "View planet facts",
        type: "planet",
        reason: "Planet facts are useful for quick learning and dashboard display.",
      },
      {
        title: "Ask AI for habitability analysis",
        type: "ai",
        reason: "AI can explain whether a planet is suitable for life based on known conditions.",
      },
    ];
  }

  if (intentType === INTENT_TYPES.NEWS) {
    return [
      {
        title: "Read latest NASA updates",
        type: "news",
        reason: "NASA updates are reliable sources for astronomy and mission information.",
      },
      {
        title: "Summarize this space news",
        type: "ai",
        reason: "AI summaries help users understand long articles faster.",
      },
    ];
  }

  return defaultRecommendations;
}

async function getPersonalizedRecommendations({
  userId,
  message,
  intent,
  prisma,
}) {
  try {
    const baseRecommendations = getRuleBasedRecommendations(
      message,
      intent?.type
    );

    if (!userId || !prisma) {
      return baseRecommendations;
    }

    /**
     * Nếu sau này database có bảng userPreference hoặc favoritePlanet,
     * có thể mở phần này.
     *
     * Ví dụ:
     * const favorites = await prisma.favoritePlanet.findMany({
     *   where: { userId },
     *   include: { planet: true },
     * });
     */

    return baseRecommendations;
  } catch (error) {
    console.error("Get personalized recommendations error:", error.message);
    return defaultRecommendations;
  }
}

function formatRecommendationsForPrompt(recommendations = []) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return "No recommendations available.";
  }

  return recommendations
    .map((item, index) => {
      return `${index + 1}. ${item.title} - ${item.reason}`;
    })
    .join("\n");
}

module.exports = {
  getRuleBasedRecommendations,
  getPersonalizedRecommendations,
  formatRecommendationsForPrompt,
};
