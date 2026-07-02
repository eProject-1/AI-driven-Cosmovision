import argparse
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


PATTERNS = {
    "orion": {
        "points": [(0.28, 0.18), (0.68, 0.2), (0.42, 0.42), (0.5, 0.43), (0.58, 0.44), (0.25, 0.78), (0.72, 0.76)],
        "edges": [(0, 2), (1, 4), (2, 3), (3, 4), (2, 5), (4, 6)],
    },
    "ursa-major": {
        "points": [(0.18, 0.55), (0.32, 0.48), (0.48, 0.5), (0.58, 0.62), (0.7, 0.55), (0.78, 0.42), (0.88, 0.34)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 0), (2, 4), (4, 5), (5, 6)],
    },
    "scorpius": {
        "points": [(0.2, 0.22), (0.32, 0.32), (0.42, 0.44), (0.5, 0.58), (0.56, 0.72), (0.68, 0.82), (0.8, 0.72), (0.72, 0.6)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7)],
    },
    "aries": {
        "points": [(0.2, 0.48), (0.42, 0.38), (0.62, 0.45), (0.78, 0.58)],
        "edges": [(0, 1), (1, 2), (2, 3)],
    },
    "cancer": {
        "points": [(0.5, 0.18), (0.5, 0.42), (0.28, 0.62), (0.72, 0.64), (0.5, 0.82)],
        "edges": [(0, 1), (1, 2), (1, 3), (1, 4)],
    },
    "capricornus": {
        "points": [(0.16, 0.56), (0.32, 0.35), (0.58, 0.28), (0.82, 0.48), (0.7, 0.72), (0.38, 0.75)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0)],
    },
    "aquarius": {
        "points": [(0.22, 0.32), (0.38, 0.42), (0.52, 0.3), (0.66, 0.42), (0.8, 0.34), (0.48, 0.58), (0.6, 0.72)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (2, 5), (5, 6)],
    },
    "gemini": {
        "points": [(0.28, 0.18), (0.7, 0.2), (0.3, 0.38), (0.68, 0.4), (0.25, 0.6), (0.64, 0.64), (0.2, 0.82), (0.62, 0.84)],
        "edges": [(0, 2), (2, 4), (4, 6), (1, 3), (3, 5), (5, 7), (2, 3), (4, 5)],
    },
    "leo": {
        "points": [(0.18, 0.58), (0.32, 0.42), (0.42, 0.24), (0.52, 0.36), (0.45, 0.52), (0.64, 0.64), (0.82, 0.58), (0.72, 0.76)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (4, 5), (5, 6), (5, 7)],
    },
    "libra": {
        "points": [(0.28, 0.28), (0.68, 0.32), (0.76, 0.62), (0.34, 0.72), (0.48, 0.5)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 0), (0, 4), (4, 2)],
    },
    "pisces": {
        "points": [(0.18, 0.28), (0.32, 0.22), (0.42, 0.34), (0.28, 0.46), (0.5, 0.55), (0.68, 0.44), (0.82, 0.52), (0.76, 0.72), (0.6, 0.7)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 0), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 5)],
    },
    "sagittarius": {
        "points": [(0.28, 0.62), (0.42, 0.4), (0.58, 0.38), (0.72, 0.58), (0.56, 0.74), (0.36, 0.78), (0.48, 0.22), (0.78, 0.34)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0), (1, 6), (2, 6), (2, 7), (3, 7)],
    },
    "cassiopeia": {
        "points": [(0.16, 0.32), (0.34, 0.66), (0.5, 0.34), (0.66, 0.64), (0.84, 0.28)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4)],
    },
    "taurus": {
        "points": [(0.2, 0.34), (0.42, 0.48), (0.62, 0.35), (0.44, 0.66), (0.24, 0.78), (0.72, 0.72), (0.82, 0.2)],
        "edges": [(0, 1), (1, 2), (1, 3), (3, 4), (3, 5), (2, 6)],
    },
    "virgo": {
        "points": [(0.18, 0.26), (0.34, 0.38), (0.5, 0.34), (0.62, 0.5), (0.78, 0.6), (0.5, 0.68), (0.36, 0.82)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (3, 5), (5, 6)],
    },
    "lyra": {
        "points": [(0.24, 0.18), (0.46, 0.44), (0.68, 0.4), (0.74, 0.68), (0.5, 0.74)],
        "edges": [(0, 1), (1, 2), (2, 3), (3, 4), (4, 1)],
    },
}


def parse_args():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Generate synthetic constellation training images.")
    parser.add_argument("--output", default=str(root / "data" / "constellations"))
    parser.add_argument("--count", type=int, default=80)
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def transform(points, size):
    angle = random.uniform(-math.pi, math.pi)
    scale = random.uniform(0.72, 0.96) * size
    cx = random.uniform(0.42, 0.58) * size
    cy = random.uniform(0.42, 0.58) * size
    transformed = []

    for x, y in points:
        px = (x - 0.5) * scale
        py = (y - 0.5) * scale
        rx = px * math.cos(angle) - py * math.sin(angle)
        ry = px * math.sin(angle) + py * math.cos(angle)
        transformed.append((cx + rx, cy + ry))

    return transformed


def draw_background(draw, size):
    for _ in range(random.randint(80, 180)):
        x = random.randrange(size)
        y = random.randrange(size)
        brightness = random.randint(45, 180)
        radius = random.choice([1, 1, 1, 2])
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(brightness, brightness, brightness + random.randint(0, 45)))


def render(pattern, size):
    image = Image.new("RGB", (size, size), (4, 7, 18))
    draw = ImageDraw.Draw(image)
    draw_background(draw, size)
    points = transform(pattern["points"], size)

    if random.random() < 0.92:
        line_color = random.choice([(210, 230, 255), (160, 210, 255), (255, 255, 245)])
        for start, end in pattern["edges"]:
            draw.line((points[start], points[end]), fill=line_color, width=random.randint(2, 5))

    for index, (x, y) in enumerate(points):
        radius = random.randint(4, 8) if index == 0 or random.random() < 0.25 else random.randint(3, 6)
        glow = radius * random.randint(3, 5)
        glow_box = (x - glow, y - glow, x + glow, y + glow)
        draw.ellipse(glow_box, fill=(30, 65, 120))
        star_box = (x - radius, y - radius, x + radius, y + radius)
        draw.ellipse(star_box, fill=(245, 250, 255))

    if random.random() < 0.65:
        image = image.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.15, 0.65)))

    return image


def main():
    args = parse_args()
    random.seed(args.seed)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    for slug, pattern in PATTERNS.items():
        class_dir = output / slug
        class_dir.mkdir(parents=True, exist_ok=True)
        for index in range(args.count):
            image = render(pattern, args.size)
            image.save(class_dir / f"synthetic-{index + 1:03d}.jpg", quality=90)

    print(f"generated {len(PATTERNS) * args.count} images in {output}")


if __name__ == "__main__":
    main()
