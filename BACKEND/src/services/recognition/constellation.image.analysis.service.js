import sharp from "sharp";

const MAX_ANALYSIS_SIZE = 640;
export const MIN_DETECTED_STARS = 5;
const MIN_STAR_AREA = 2;
const MAX_STAR_AREA = 80;
const MAX_STAR_ASPECT_RATIO = 3;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = clamp(Math.floor(sorted.length * ratio), 0, sorted.length - 1);
  return sorted[index];
}

export function summarizeStars(stars) {
  return stars.slice(0, 18).map((star, index) => (
    `${index + 1}: x=${star.x.toFixed(3)}, y=${star.y.toFixed(3)}, brightness=${Math.round(star.brightness)}, area=${star.area}`
  )).join("\n");
}

export async function analyzeStarField(file) {
  const { data, info } = await sharp(file.path)
    .rotate()
    .resize({
      width: MAX_ANALYSIS_SIZE,
      height: MAX_ANALYSIS_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data);
  const mean = pixels.reduce((sum, value) => sum + value, 0) / Math.max(1, pixels.length);
  const variance = pixels.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, pixels.length);
  const stdDev = Math.sqrt(variance);
  const threshold = Math.max(percentile(pixels, 0.985), mean + stdDev * 1.65, 42);
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const stars = [];
  const edgeMargin = Math.max(2, Math.round(Math.min(width, height) * 0.01));
  let rawComponentCount = 0;
  let rejectedComponents = 0;

  function indexOf(x, y) {
    return y * width + x;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const startIndex = indexOf(x, y);
      if (visited[startIndex] || data[startIndex] < threshold) continue;

      rawComponentCount += 1;
      const stack = [[x, y]];
      visited[startIndex] = 1;
      let area = 0;
      let weightedX = 0;
      let weightedY = 0;
      let brightnessTotal = 0;
      let peak = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      while (stack.length) {
        const [cx, cy] = stack.pop();
        const currentIndex = indexOf(cx, cy);
        const brightness = data[currentIndex];
        if (brightness < threshold) continue;

        area += 1;
        weightedX += cx * brightness;
        weightedY += cy * brightness;
        brightnessTotal += brightness;
        peak = Math.max(peak, brightness);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        for (let ny = cy - 1; ny <= cy + 1; ny += 1) {
          for (let nx = cx - 1; nx <= cx + 1; nx += 1) {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const nextIndex = indexOf(nx, ny);
            if (!visited[nextIndex] && data[nextIndex] >= threshold) {
              visited[nextIndex] = 1;
              stack.push([nx, ny]);
            }
          }
        }
      }

      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      const aspectRatio = Math.max(boxWidth / boxHeight, boxHeight / boxWidth);
      const touchesEdge =
        minX <= edgeMargin ||
        minY <= edgeMargin ||
        maxX >= width - edgeMargin ||
        maxY >= height - edgeMargin;
      const isStarLike =
        area >= MIN_STAR_AREA &&
        area <= MAX_STAR_AREA &&
        aspectRatio <= MAX_STAR_ASPECT_RATIO &&
        !touchesEdge &&
        brightnessTotal > 0;

      if (isStarLike) {
        stars.push({
          x: weightedX / brightnessTotal / width,
          y: weightedY / brightnessTotal / height,
          area,
          brightness: peak,
          aspectRatio,
        });
      } else {
        rejectedComponents += 1;
      }
    }
  }

  const brightestStars = stars
    .sort((a, b) => ((b.brightness * Math.sqrt(b.area)) - (a.brightness * Math.sqrt(a.area))))
    .slice(0, 40);

  return {
    width,
    height,
    meanBrightness: mean,
    threshold,
    rawComponentCount,
    rejectedComponents,
    starCount: brightestStars.length,
    stars: brightestStars,
    quality: brightestStars.length >= MIN_DETECTED_STARS ? "usable" : "insufficient-stars",
  };
}
