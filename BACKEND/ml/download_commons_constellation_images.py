import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


COMMONS_API = "https://commons.wikimedia.org/w/api.php"
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


def parse_args():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Download free constellation images from Wikimedia Commons.")
    parser.add_argument("--output", default=str(root / "data" / "constellations"))
    parser.add_argument("--classes", nargs="*", default=sorted(DEFAULT_QUERIES.keys()))
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--delay", type=float, default=0.25)
    return parser.parse_args()


def safe_name(value):
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()[:80] or "image"


def request_json(params):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{COMMONS_API}?{query}",
        headers={"User-Agent": "CosmoVisionAI/1.0 constellation classifier training"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


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


def download_file(url, target_path):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "CosmoVisionAI/1.0 constellation classifier training"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        target_path.write_bytes(response.read())


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    args = parse_args()
    output_root = Path(args.output)
    output_root.mkdir(parents=True, exist_ok=True)
    summary = {}

    for slug in args.classes:
        search_text = DEFAULT_QUERIES.get(slug, f"{slug} constellation stars")
        class_dir = output_root / slug
        class_dir.mkdir(parents=True, exist_ok=True)
        downloaded = 0
        sources = []

        for page in search_images(search_text, args.limit * 3):
            image_info = (page.get("imageinfo") or [{}])[0]
            mime = image_info.get("mime")
            url = image_info.get("thumburl") or image_info.get("url")
            if mime not in IMAGE_MIME_EXTENSIONS or not url:
                continue

            extension = IMAGE_MIME_EXTENSIONS[mime]
            title = page.get("title", f"{slug}-{downloaded + 1}")
            target_path = class_dir / f"{downloaded + 1:03d}-{safe_name(title)}{extension}"
            if target_path.exists():
                downloaded += 1
                continue

            try:
                download_file(url, target_path)
                sources.append({
                    "file": target_path.name,
                    "title": title,
                    "url": url,
                    "license": image_info.get("extmetadata", {}).get("LicenseShortName", {}).get("value"),
                    "artist": image_info.get("extmetadata", {}).get("Artist", {}).get("value"),
                })
                downloaded += 1
                time.sleep(args.delay)
            except Exception as error:
                print(f"skip {title}: {error}")

            if downloaded >= args.limit:
                break

        (class_dir / "sources.json").write_text(json.dumps(sources, indent=2), encoding="utf-8")
        summary[slug] = downloaded

    print(json.dumps({"success": True, "output": str(output_root), "counts": summary}, ensure_ascii=False))


if __name__ == "__main__":
    main()
