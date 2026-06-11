export const detectIntent = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes("hành tinh") || msg.includes("planet"))
    return { type: "planet", keyword: msg };

  if (msg.includes("chòm sao") || msg.includes("constellation"))
    return { type: "constellation", keyword: msg };

  if (msg.includes("thời tiết") || msg.includes("weather"))
    return { type: "weather", keyword: msg };

  return { type: "general", keyword: msg };
};