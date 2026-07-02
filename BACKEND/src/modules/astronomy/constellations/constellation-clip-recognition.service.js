import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, "../../../..");

const CLIP_ARTIFACT_DIR = path.join(BACKEND_ROOT, "ml", "artifacts", "constellation_clip");
const CLIP_PREDICT_SCRIPT = path.join(BACKEND_ROOT, "ml", "predict_clip_constellation.py");
const LOCAL_VENV_PYTHON = process.platform === "win32"
  ? path.join(BACKEND_ROOT, ".venv", "Scripts", "python.exe")
  : path.join(BACKEND_ROOT, ".venv", "bin", "python");
const DEFAULT_TIMEOUT_MS = Number(process.env.CLIP_RECOGNITION_TIMEOUT_MS || 45000);

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parsePrediction(stdout) {
  const lines = String(stdout || "").trim().split(/\r?\n/).filter(Boolean);
  const raw = lines.at(-1) || "{}";
  const parsed = JSON.parse(raw);
  if (!parsed.success || !parsed.slug) return null;

  return {
    slug: String(parsed.slug),
    confidence: clampConfidence(parsed.confidence),
    source: "clip",
    top: Array.isArray(parsed.top)
      ? parsed.top.map((item) => ({
        slug: String(item.slug || ""),
        confidence: clampConfidence(item.confidence),
      })).filter((item) => item.slug)
      : [],
    analysis: `CLIP classifier matched ${parsed.slug} with confidence ${clampConfidence(parsed.confidence).toFixed(3)}.`,
  };
}

export async function runClipRecognition({ file }) {
  const classifierPath = path.join(CLIP_ARTIFACT_DIR, "classifier.joblib");
  const hasClassifier = await pathExists(classifierPath);
  const hasPredictScript = await pathExists(CLIP_PREDICT_SCRIPT);
  if (!hasClassifier || !hasPredictScript) return null;

  const pythonBin = process.env.PYTHON_BIN || ((await pathExists(LOCAL_VENV_PYTHON)) ? LOCAL_VENV_PYTHON : "python");
  const args = [
    CLIP_PREDICT_SCRIPT,
    "--image",
    file.path,
    "--artifact",
    CLIP_ARTIFACT_DIR,
  ];

  try {
    const { stdout } = await execFileAsync(pythonBin, args, {
      cwd: BACKEND_ROOT,
      timeout: DEFAULT_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return parsePrediction(stdout);
  } catch (error) {
    console.error("[constellation-recognition] CLIP classifier failed:", error.message);
    return null;
  }
}
