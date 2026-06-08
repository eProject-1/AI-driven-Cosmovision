export const detectIntent = (message) => {
  const text = message.toLowerCase();

  if (
    text.includes("planet") ||
    text.includes("mars") ||
    text.includes("jupiter") ||
    text.includes("saturn")
  ) {
    return "PLANET";
  }

  if (
    text.includes("constellation") ||
    text.includes("orion")
  ) {
    return "CONSTELLATION";
  }

  if (
    text.includes("weather")
  ) {
    return "WEATHER";
  }

  return "GENERAL";
};