import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError
from pathlib import Path


COMMONS_API = "https://commons.wikimedia.org/w/api.php"
CATALOG_PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "constellations.88.js"
IMAGE_MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
DEFAULT_QUERIES = {
    "orion": "Orion constellation stars",
    "ursa-major": "Ursa Major constellation stars Big Dipper",
    "scorpius": "Scorpius constellation stars",
    "aries": "Aries constellation stars",
    "cancer": "Cancer constellation stars",
    "capricornus": "Capricornus constellation stars",
    "aquarius": "Aquarius constellation stars",
    "gemini": "Gemini constellation stars Castor Pollux",
    "leo": "Leo constellation stars",
    "libra": "Libra constellation stars",
    "pisces": "Pisces constellation stars",
    "sagittarius": "Sagittarius constellation stars teapot",
    "cassiopeia": "Cassiopeia constellation stars W",
    "taurus": "Taurus constellation stars Hyades Pleiades",
    "virgo": "Virgo constellation stars Spica",
    "lyra": "Lyra constellation stars Vega",
}


def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def load_catalog():
    if not CATALOG_PATH.exists():
        return []

    text = CATALOG_PATH.read_text(encoding="utf-8")
    pattern = re.compile(r'^\s*\["([^"]+)",\s*"([^"]+)"', re.MULTILINE)
    catalog = []

    for name, abbreviation in pattern.findall(text):
        catalog.append({
            "name": name,
            "slug": slugify(name),
            "abbreviation": abbreviation,
        })

    return catalog


CATALOG = load_catalog()
CATALOG_BY_SLUG = {item["slug"]: item for item in CATALOG}
DEFAULT_CLASSES = [item["slug"] for item in CATALOG] or sorted(DEFAULT_QUERIES.keys())


def parse_args():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Download free constellation images from Wikimedia Commons.")
    parser.add_argument("--output", default=str(root / "data" / "constellations"))
    parser.add_argument("--classes", nargs="*", default=DEFAULT_CLASSES)
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--delay", type=float, default=0.25)
    return parser.parse_args()


def safe_name(value):
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()[:80] or "image"


def request_json(params, attempts=3):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{COMMONS_API}?{query}",
        headers={"User-Agent": "CosmoVisionAI/1.0 constellation classifier training"},
    )

    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code == 429 and attempt < attempts - 1:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"skip query {params.get('gsrsearch')}: HTTP {error.code} {error.reason}")
            return {}
        except URLError as error:
            print(f"skip query {params.get('gsrsearch')}: {error.reason}")
            return {}

    return {}


def search_images(search_text, limit):
    payload = request_json({
        "action": "query",
        "generator": "search",
        "gsrsearch": search_text,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
        "iiurlwidth": 640,
        "format": "json",
    })
    pages = payload.get("query", {}).get("pages", {})
    return sorted(pages.values(), key=lambda item: item.get("index", 0))


def get_search_text(slug):
    if slug in DEFAULT_QUERIES:
        return DEFAULT_QUERIES[slug]

    catalog_item = CATALOG_BY_SLUG.get(slug)
    if not catalog_item:
        return f"{slug.replace('-', ' ')} constellation stars"

    return f"{catalog_item['name']} constellation stars IAU {catalog_item['abbreviation']}"


def download_file(url, target_path, attempts=3):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "CosmoVisionAI/1.0 constellation classifier training"},
    )
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                target_path.write_bytes(response.read())
                return
        except HTTPError as error:
            if error.code == 429 and attempt < attempts - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    args = parse_args()
    output_root = Path(args.output)
    output_root.mkdir(parents=True, exist_ok=True)
    summary = {}

    for slug in args.classes:
        search_text = get_search_text(slug)
        class_dir = output_root / slug
        class_dir.mkdir(parents=True, exist_ok=True)
        source_path = class_dir / "sources.json"
        sources = []

        if source_path.exists():
            try:
                sources = json.loads(source_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                sources = []

        image_count = len([
            path for path in class_dir.iterdir()
            if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        ])

        if image_count >= args.limit:
            summary[slug] = image_count
            continue

        for page in search_images(search_text, max((args.limit - image_count) * 4, args.limit)):
            image_info = (page.get("imageinfo") or [{}])[0]
            mime = image_info.get("mime")
            url = image_info.get("thumburl") or image_info.get("url")
            if mime not in IMAGE_MIME_EXTENSIONS or not url:
                continue

            extension = IMAGE_MIME_EXTENSIONS[mime]
            title = page.get("title", f"{slug}-{image_count + 1}")
            target_path = class_dir / f"{image_count + 1:03d}-{safe_name(title)}{extension}"
            while target_path.exists():
                image_count += 1
                target_path = class_dir / f"{image_count + 1:03d}-{safe_name(title)}{extension}"

            try:
                download_file(url, target_path)
                sources.append({
                    "file": target_path.name,
                    "title": title,
                    "url": url,
                    "license": image_info.get("extmetadata", {}).get("LicenseShortName", {}).get("value"),
                    "artist": image_info.get("extmetadata", {}).get("Artist", {}).get("value"),
                })
                image_count += 1
                time.sleep(args.delay)
            except Exception as error:
                print(f"skip {title}: {error}")

            if image_count >= args.limit:
                break

        source_path.write_text(json.dumps(sources, indent=2), encoding="utf-8")
        summary[slug] = image_count

    print(json.dumps({"success": True, "output": str(output_root), "counts": summary}, ensure_ascii=False))


if __name__ == "__main__":
    main()
