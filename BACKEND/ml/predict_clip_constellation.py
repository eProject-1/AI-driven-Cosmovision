import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


DEFAULT_MODEL = "openai/clip-vit-base-patch32"


def parse_args():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Predict a constellation with the trained CLIP classifier.")
    parser.add_argument("--image", required=True, help="Image file to classify.")
    parser.add_argument("--artifact", default=str(root / "artifacts" / "constellation_clip"))
    parser.add_argument("--clip-model", default=None)
    parser.add_argument("--top-k", type=int, default=3)
    return parser.parse_args()


def load_rgb_image(path):
    with Image.open(path) as image:
        return image.convert("RGB")


@torch.inference_mode()
def embed_image(image_path, model, processor, device):
    image = load_rgb_image(image_path)
    inputs = processor(images=[image], return_tensors="pt", padding=True).to(device)
    features = model.get_image_features(**inputs)
    if hasattr(features, "image_embeds") and features.image_embeds is not None:
        features = features.image_embeds
    elif hasattr(features, "pooler_output") and features.pooler_output is not None:
        features = features.pooler_output
    elif not torch.is_tensor(features):
        features = features[0]
    features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()


def main():
    args = parse_args()
    image_path = Path(args.image)
    artifact_dir = Path(args.artifact)
    classifier_path = artifact_dir / "classifier.joblib"
    metadata_path = artifact_dir / "metadata.json"

    if not image_path.exists():
        raise SystemExit(json.dumps({"success": False, "error": f"Image not found: {image_path}"}))
    if not classifier_path.exists():
        raise SystemExit(json.dumps({"success": False, "error": f"Classifier not found: {classifier_path}"}))

    metadata = {}
    if metadata_path.exists():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    clip_model_name = args.clip_model or metadata.get("clipModel") or DEFAULT_MODEL
    device = "cuda" if torch.cuda.is_available() else "cpu"

    processor = CLIPProcessor.from_pretrained(clip_model_name, local_files_only=True)
    model = CLIPModel.from_pretrained(clip_model_name, local_files_only=True).to(device)
    model.eval()

    classifier = joblib.load(classifier_path)
    embedding = embed_image(image_path, model, processor, device)

    if hasattr(classifier, "predict_proba"):
        probabilities = classifier.predict_proba(embedding)[0]
        order = np.argsort(probabilities)[::-1]
        top = [
            {
                "slug": str(classifier.classes_[index]),
                "confidence": float(probabilities[index]),
            }
            for index in order[:max(1, args.top_k)]
        ]
    else:
        prediction = classifier.predict(embedding)[0]
        top = [{"slug": str(prediction), "confidence": 1.0}]

    winner = top[0]
    print(json.dumps({
        "success": True,
        "slug": winner["slug"],
        "confidence": winner["confidence"],
        "source": "clip",
        "top": top,
        "artifact": str(artifact_dir),
        "clipModel": clip_model_name,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
