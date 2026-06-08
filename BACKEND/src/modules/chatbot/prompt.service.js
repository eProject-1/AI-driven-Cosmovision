export const buildPrompt = (
  message,
  intent
) => {
  return [
    {
      role: "system",
      content: `
      You are CosmoVision AI.

      You are an astronomy assistant.

      Help users learn about:
      - planets
      - constellations
      - galaxies
      - space missions
      - astronomy events

      Explain clearly and simply.
      `,
    },
    {
      role: "user",
      content: message,
    },
  ];
};