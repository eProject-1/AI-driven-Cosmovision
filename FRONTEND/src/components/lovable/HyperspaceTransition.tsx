import { useEffect, useRef } from "react";

/**
 * Full-screen canvas overlay that renders a forward star-streak warp:
 * stars emerge from the center and stretch into long radial trails, evoking
 * a jump through space. Auto-completes after `durationMs` and calls onDone.
 */
export function HyperspaceTransition({
  active,
  durationMs = 2600,
  onDone,
}: {
  active: boolean;
  durationMs?: number;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 420;
    type Star = { x: number; y: number; z: number; pz: number };
    const stars: Star[] = [];
    const reset = (s: Star) => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.4 + 0.02;
      s.x = Math.cos(a) * r;
      s.y = Math.sin(a) * r;
      s.z = Math.random();
      s.pz = s.z;
    };
    for (let i = 0; i < COUNT; i++) {
      const s = { x: 0, y: 0, z: 0, pz: 0 };
      reset(s);
      s.z = Math.random();
      s.pz = s.z;
      stars.push(s);
    }

    startRef.current = performance.now();
    let finished = false;

    const tick = () => {
      const now = performance.now();
      const t = Math.min(1, (now - startRef.current) / durationMs);
      // ease-in then plateau then ease-out
      const accel =
        t < 0.55 ? Math.pow(t / 0.55, 2.2) : 1 - Math.pow((t - 0.55) / 0.45, 2);
      const speed = 0.004 + accel * 0.05;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // background fade-in deep navy
      ctx.fillStyle = `rgba(5, 8, 22, ${0.35 + accel * 0.4})`;
      ctx.fillRect(0, 0, w, h);

      ctx.lineCap = "round";
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 0.001) {
          reset(s);
          continue;
        }
        const k = 0.5 * Math.min(w, h);
        const sx = cx + (s.x / s.z) * k;
        const sy = cy + (s.y / s.z) * k;
        const px = cx + (s.x / s.pz) * k;
        const py = cy + (s.y / s.pz) * k;
        if (sx < 0 || sx > w || sy < 0 || sy > h) {
          reset(s);
          continue;
        }
        const len = Math.hypot(sx - px, sy - py);
        const alpha = Math.min(1, 0.25 + accel * 0.9);
        const width = Math.max(0.6, (1 - s.z) * 2.2 * dpr);
        // warm-cool gradient as we accelerate
        const hue = 210 - accel * 30;
        ctx.strokeStyle = `hsla(${hue}, 70%, ${75 + accel * 15}%, ${alpha})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        // bright tip
        if (len > 4) {
          ctx.fillStyle = `hsla(${hue}, 90%, 95%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, width * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (t >= 1 && !finished) {
        finished = true;
        onDone();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, durationMs, onDone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 z-[60] pointer-events-none transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
}
