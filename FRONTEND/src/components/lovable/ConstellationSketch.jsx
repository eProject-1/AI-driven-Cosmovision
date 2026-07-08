import { useMemo } from "react";

function seededValue(seed, index) {
  const value = Math.sin(seed * 97.31 + index * 41.73) * 10000;
  return value - Math.floor(value);
}

function constellationPoints(constellation, compact = false) {
  const seed = String(constellation?.slug || constellation?.name || "constellation")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const count = compact ? 6 : 8;

  return Array.from({ length: count }, (_, index) => ({
    x: 14 + seededValue(seed, index) * 72,
    y: 16 + seededValue(seed + 13, index) * 66,
    r: index === 0 || index === count - 1 ? (compact ? 2.4 : 3.8) : compact ? 1.45 : 2.2,
    glow: index === 0 || index === count - 1,
  }));
}

function getFittedViewBox(points, compact) {
  const glowRadius = compact ? 8 : 12;
  const padding = compact ? 6 : 10;
  const minX = Math.min(...points.map((point) => point.x - (point.glow ? glowRadius : point.r))) - padding;
  const maxX = Math.max(...points.map((point) => point.x + (point.glow ? glowRadius : point.r))) + padding;
  const minY = Math.min(...points.map((point) => point.y - (point.glow ? glowRadius : point.r))) - padding;
  const maxY = Math.max(...points.map((point) => point.y + (point.glow ? glowRadius : point.r))) + padding;

  return [minX, minY, maxX - minX, maxY - minY].map((value) => Number(value.toFixed(2))).join(" ");
}

function toSafeId(value) {
  return String(value || "constellation").replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function ConstellationSketch({ constellation, compact = false, className = "" }) {
  const points = useMemo(() => constellationPoints(constellation, compact), [constellation, compact]);
  const linePairs = points.slice(1).map((point, index) => [points[index], point]);
  const extraLines = points.length > 4 ? [[points[0], points[3]], [points[2], points[points.length - 1]]] : [];
  const viewBox = useMemo(() => getFittedViewBox(points, compact), [compact, points]);
  const gradientId = `glow-${toSafeId(constellation?.slug || constellation?.name)}-${compact ? "compact" : "full"}`;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`${constellation?.name || "Constellation"} star pattern`}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dff8ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#6ecbff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[...linePairs, ...extraLines].map(([a, b], index) => (
        <line
          key={`${a.x}-${b.x}-${index}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="#8fcfff"
          strokeWidth={compact ? 0.38 : 0.56}
          strokeOpacity={compact ? 0.28 : 0.5}
        />
      ))}
      {points.map((point, index) => (
        <g key={`${point.x}-${point.y}-${index}`}>
          {point.glow ? <circle cx={point.x} cy={point.y} r={compact ? 8 : 12} fill={`url(#${gradientId})`} opacity={0.85} /> : null}
          <circle cx={point.x} cy={point.y} r={point.r} fill="#e9fbff" opacity={0.92} />
        </g>
      ))}
    </svg>
  );
}
