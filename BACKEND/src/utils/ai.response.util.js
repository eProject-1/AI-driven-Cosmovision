export function stripJsonFences(raw = "") {
  return String(raw).replace(/```json|```/gi, "").trim();
}

export function stripAiMarkdown(value = "") {
  return String(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/~~/g, "")
    .replace(/`+/g, "")
    .replace(/\r/g, "")
    .trim();
}

export function formatPlainAiResponse(raw = "", { maxLines = 12, fallback = "I do not have enough information to answer that." } = {}) {
  const cleaned = stripAiMarkdown(stripJsonFences(raw));

  const lines = cleaned
    .split(/\n+/)
    .flatMap((line) => String(line).split(/(?=\s[-*.\u2022]\s+)/g))
    .map(normalizePlainLine)
    .filter(Boolean)
    .filter((line) => !/^[\[{ }"':,|=-]+$/.test(line))
    .slice(0, maxLines);

  return lines.length ? lines.join("\n") : fallback;
}

function normalizePlainLine(line = "") {
  const raw = stripAiMarkdown(line)
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/^\s*>\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw || /^[-*_]{3,}$/.test(raw)) return "";

  const text = raw
    .replace(/^\s*[-*+\u2022]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .trim();

  if (!text) return "";
  if (text.endsWith("?")) return text;
  if (/^\.\s+/.test(raw)) return `. ${text.replace(/^\.\s*/, "")}`;
  if (/^[-*+\u2022]\s+/.test(raw) || /^\d+[.)]\s+/.test(raw)) return `- ${text}`;

  return text;
}
