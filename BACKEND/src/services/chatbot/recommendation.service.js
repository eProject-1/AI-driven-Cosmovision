/**
 * recommendation.service.js
 * - Tạo recommendation cho user dựa theo message, intent hoặc dữ liệu planet.
 * - Hiện tại dùng rule-based recommendation để dễ chạy.
 * - Sau này có thể nâng cấp bằng database + AI embedding.
 */


import { INTENT_TYPES } from "./intent.service.js";


const defaultRecommendations = [
  {
    title: "Explore Mars",
    type: "planet",
    reason: "Mars is one of the most studied planets and has many active and past missions.",
  },
  {
    title: "Learn about Jupiter",
    type: "planet",
    reason: "Jupiter is the largest planet in the Solar System and has many fascinating moons.",
  },
  {
    title: "Read the latest astronomy news",
    type: "news",
    reason: "Astronomy news helps users stay updated with missions, discoveries, and space events.",
  },
];


const beginnerRecommendations = [
  {
    title: "Start with the Solar System",
    type: "learning",
    reason: "The Solar System is the best starting point for understanding planets, orbits, moons, and basic astronomy.",
  },
  {
    title: "Compare Earth and Mars",
    type: "learning",
    reason: "Earth and Mars are useful for learning about rocky planets, atmosphere, temperature, and habitability.",
  },
];


const weatherRecommendations = [
  {
    title: "Check local sky conditions",
    type: "weather",
    reason: "Weather conditions strongly affect stargazing and sky observation.",
  },
  {
    title: "Look for a clear-night forecast",
    type: "weather",
    reason: "Clear skies are ideal for observing planets, stars, and constellations.",
  },
];


const newsRecommendations = [
  {
    title: "Read recent NASA mission updates",
    type: "news",
    reason: "NASA mission updates are reliable sources for space exploration and astronomy discoveries.",
  },
  {
    title: "Summarize current space headlines",
    type: "ai",
    reason: "AI summaries help users understand long articles faster.",
  },
];


function normalizeText(text = "") {
  return text.toString().toLowerCase().trim();
}


function getRuleBasedRecommendations(message = "", intentType = INTENT_TYPES.GENERAL) {
  const normalizedMessage = normalizeText(message);


  if (
    normalizedMessage.includes("beginner") ||
    normalizedMessage.includes("basic") ||
    normalizedMessage.includes("start") ||
    normalizedMessage.includes("new to astronomy")
  ) {
    return beginnerRecommendations;
  }


  if (intentType === INTENT_TYPES.WEATHER) {
    return weatherRecommendations;
  }


  if (intentType === INTENT_TYPES.NEWS) {
    return newsRecommendations;
  }


  if (intentType === INTENT_TYPES.PLANET) {
    return [
      {
        title: "Compare similar planets",
        type: "planet",
        reason: "Comparing planets helps users understand size, temperature, atmosphere, and orbit more clearly.",
      },
      {
        title: "View planet facts",
        type: "planet",
        reason: "Planet facts are useful for quick learning and dashboard display.",
      },
      {
        title: "Ask for habitability analysis",
        type: "ai",
        reason: "AI can explain whether a planet could support life based on known conditions.",
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


export {
  getRuleBasedRecommendations,
  getPersonalizedRecommendations,
  formatRecommendationsForPrompt,
};
