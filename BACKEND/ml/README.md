# Constellation CLIP Classifier

This folder contains the local image-recognition model used by the constellation recognition module.

Dataset layout:

```text
BACKEND/ml/data/constellations/
  orion/
    image-001.jpg
    image-002.png
  virgo/
    image-001.jpg
  ursa-major/
    image-001.jpg
```

Use the same slug values stored in the `constellations.slug` database column.

Install Python dependencies:

```bash
cd BACKEND
python -m venv .venv
.venv\Scripts\activate
pip install -r ml/requirements.txt
```

Download a starter dataset from Wikimedia Commons:

```bash
python ml/download_commons_constellation_images.py --limit 25
```

Review the downloaded folders and remove wrong/ambiguous images before training. Dataset quality matters more than quantity for this classifier.

Generate synthetic constellation diagrams for local training:

```bash
python ml/generate_synthetic_constellation_images.py --count 80
```

Train:

```bash
python ml/train_clip_constellation.py
```

Predict one image:

```bash
python ml/predict_clip_constellation.py --image "src/uploads/constellations/example.jpg"
```

The backend automatically uses this classifier when the artifact folder exists. If the classifier is not trained or Python is unavailable, recognition falls back to the vision API.
