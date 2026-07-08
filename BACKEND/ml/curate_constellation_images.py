import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

KEEP_REAL_IMAGES = {
    "andromeda/001-file-andromeda-annotated-png.png": "annotated constellation chart",
    "aquarius/004-file-aquarius-constellation-map-ru-lite-png.png": "constellation map",
    "aquarius/005-file-aquarius-jamieson-png.png": "historical constellation chart",
    "orion/001-file-orion-constellation-map-ru-lite-png.png": "constellation map",
    "ursa-major/001-file-big-dipper-from-the-kalalau-lookout-at-the-kokee-state-park-in-hawaii-jpg.jpg": "recognizable Big Dipper sky photo",
}


def parse_args():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Move noisy real constellation images out of the training dataset.")
    parser.add_argument("--dataset", default=str(root / "data" / "constellations"))
    parser.add_argument("--rejected", default=str(root / "data" / "rejected_constellations"))
    parser.add_argument("--apply", action="store_true", help="Move rejected files. Without this flag, only prints a dry run.")
    return parser.parse_args()


def iter_real_images(dataset):
    for class_dir in sorted(path for path in dataset.iterdir() if path.is_dir()):
        for image_path in sorted(class_dir.iterdir()):
            if not image_path.is_file():
                continue
            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            if image_path.name.startswith("synthetic-"):
                continue
            yield image_path


def unique_target(path):
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix
    counter = 2
    while True:
        candidate = path.with_name(f"{stem}-{counter}{suffix}")
        if not candidate.exists():
            return candidate
        counter += 1


def relative_key(dataset, image_path):
    return image_path.relative_to(dataset).as_posix()


def main():
    args = parse_args()
    dataset = Path(args.dataset)
    rejected_root = Path(args.rejected)

    if not dataset.exists():
        raise SystemExit(f"Dataset folder does not exist: {dataset}")

    kept = []
    rejected = []

    for image_path in iter_real_images(dataset):
        key = relative_key(dataset, image_path)
        if key in KEEP_REAL_IMAGES:
            kept.append({"file": key, "reason": KEEP_REAL_IMAGES[key]})
            continue

        target = unique_target(rejected_root / key)
        rejected.append({
            "file": key,
            "target": target.relative_to(rejected_root).as_posix(),
            "reason": "not a clear constellation pattern, chart, or class-specific sky photo",
        })

        if args.apply:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(image_path), str(target))

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dataset": str(dataset),
        "rejectedRoot": str(rejected_root),
        "dryRun": not args.apply,
        "keptCount": len(kept),
        "rejectedCount": len(rejected),
        "kept": kept,
        "rejected": rejected,
    }

    if args.apply:
        rejected_root.mkdir(parents=True, exist_ok=True)
        (rejected_root / "curation_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
