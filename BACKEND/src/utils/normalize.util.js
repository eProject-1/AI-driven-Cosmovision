export function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
