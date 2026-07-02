import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from transformers import CLIPModel, CLIPProcessor


DEFAULT_MODEL = "openai/clip-vit-base-patch32"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Train a constellation classifier on top of CLIP embeddings.")
    parser.add_argument("--dataset", default=str(root / "data" / "constellations"))
    parser.add_argument("--output", default=str(root / "artifacts" / "constellation_clip"))
    parser.add_argument("--clip-model", default=DEFAULT_MODEL)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--min-images-per-class", type=int, default=2)
    return parser.parse_args()


def load_image_paths(dataset_dir, min_images_per_class):
    dataset_path = Path(dataset_dir)
    if not dataset_path.exists():
        raise SystemExit(f"Dataset folder does not exist: {dataset_path}")

    image_paths = []
    labels = []
    skipped = {}

    for class_dir in sorted(path for path in dataset_path.iterdir() if path.is_dir()):
        class_images = [
            path for path in sorted(class_dir.rglob("*"))
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ]
        if len(class_images) < min_images_per_class:
            skipped[class_dir.name] = len(class_images)
            continue

        for image_path in class_images:
            image_paths.append(image_path)
            labels.append(class_dir.name)

    if len(set(labels)) < 2:
        raise SystemExit("Need at least two classes with enough images to train.")

    return image_paths, labels, skipped


def load_rgb_image(path):
    with Image.open(path) as image:
        return image.convert("RGB")


@torch.inference_mode()
def embed_images(image_paths, model, processor, device, batch_size=16):
    embeddings = []

    for start in range(0, len(image_paths), batch_size):
        batch_paths = image_paths[start:start + batch_size]
        images = [load_rgb_image(path) for path in batch_paths]
        inputs = processor(images=images, return_tensors="pt", padding=True).to(device)
        features = model.get_image_features(**inputs)
        if hasattr(features, "image_embeds") and features.image_embeds is not None:
            features = features.image_embeds
        elif hasattr(features, "pooler_output") and features.pooler_output is not None:
            features = features.pooler_output
        elif not torch.is_tensor(features):
            features = features[0]
        features = features / features.norm(dim=-1, keepdim=True)
        embeddings.append(features.cpu().numpy())

    return np.vstack(embeddings)


def train_classifier(embeddings, labels, test_size):
    class_counts = {label: labels.count(label) for label in set(labels)}
    can_stratify = all(count >= 2 for count in class_counts.values()) and len(labels) >= 6

    if can_stratify:
        x_train, x_test, y_train, y_test = train_test_split(
            embeddings,
            labels,
            test_size=test_size,
            random_state=42,
            stratify=labels,
        )
    else:
        x_train, x_test, y_train, y_test = embeddings, embeddings, labels, labels

    candidates = [
        SVC(
            kernel="rbf",
            probability=True,
            class_weight="balanced",
            C=6.0,
            gamma="scale",
            random_state=42,
        ),
        KNeighborsClassifier(n_neighbors=5, weights="distance", metric="cosine"),
    ]
    best_classifier = None
    best_report = None
    best_accuracy = -1

    for classifier in candidates:
        classifier.fit(x_train, y_train)
        report = classification_report(
            y_test,
            classifier.predict(x_test),
            output_dict=True,
            zero_division=0,
        )
        accuracy = report.get("accuracy", 0)
        if accuracy > best_accuracy:
            best_classifier = classifier
            best_report = report
            best_accuracy = accuracy

    return best_classifier, best_report


def main():
    args = parse_args()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    image_paths, labels, skipped = load_image_paths(args.dataset, args.min_images_per_class)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    processor = CLIPProcessor.from_pretrained(args.clip_model)
    model = CLIPModel.from_pretrained(args.clip_model).to(device)
    model.eval()

    embeddings = embed_images(image_paths, model, processor, device)
    classifier, report = train_classifier(embeddings, labels, args.test_size)

    joblib.dump(classifier, output_dir / "classifier.joblib")

    metadata = {
        "clipModel": args.clip_model,
        "classifier": classifier.__class__.__name__,
        "classes": sorted(set(labels)),
        "imageCount": len(image_paths),
        "classCounts": {label: labels.count(label) for label in sorted(set(labels))},
        "skippedClasses": skipped,
        "report": report,
    }
    (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(json.dumps({
        "success": True,
        "artifact": str(output_dir),
        "classes": metadata["classes"],
        "imageCount": metadata["imageCount"],
        "accuracy": report.get("accuracy"),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
