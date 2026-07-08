import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Planet } from "../../lib/planets";

type Rgb = [number, number, number];

const PLANET_RADIUS: Record<string, number> = {
  mercury: 0.92,
  venus: 1.04,
  earth: 1.06,
  mars: 0.98,
  jupiter: 1.32,
  saturn: 1.2,
  uranus: 1.08,
  neptune: 1.08,
};

type TextureSet = {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  cloudMap?: THREE.Texture;
  ringMap?: THREE.Texture;
  dispose: () => void;
};

type TexturePreset = {
  color: string[];
  normal?: string[];
  clouds?: string[];
  rings?: string[];
};

const LOCAL_TEXTURE_ROOT = "/textures/planets";

const localCandidates = (slug: string, kind: "color" | "normal" | "clouds" | "rings") => [
  `${LOCAL_TEXTURE_ROOT}/${slug}_${kind}.jpg`,
  `${LOCAL_TEXTURE_ROOT}/${slug}_${kind}.webp`,
  `${LOCAL_TEXTURE_ROOT}/${slug}_${kind}.png`,
];

const planetTexturePresets: Record<string, TexturePreset> = {
  mercury: {
    color: [
      ...localCandidates("mercury", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
    ],
  },
  venus: {
    color: [
      ...localCandidates("venus", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg",
    ],
  },
  earth: {
    color: [],
  },
  mars: {
    color: [
      ...localCandidates("mars", "color"),
      "https://threejs.org/examples/textures/planets/mars_1k_color.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_mars.jpg",
    ],
    normal: [
      ...localCandidates("mars", "normal"),
      "https://threejs.org/examples/textures/planets/mars_1k_normal.jpg",
    ],
  },
  jupiter: {
    color: [
      ...localCandidates("jupiter", "color"),
      "https://threejs.org/examples/textures/planets/jupiter2_1024.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg",
    ],
  },
  saturn: {
    color: [
      ...localCandidates("saturn", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_saturn.jpg",
    ],
    rings: [
      ...localCandidates("saturn", "rings"),
      "https://threejs.org/examples/textures/planets/saturnringcolor.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png",
    ],
  },
  uranus: {
    color: [
      ...localCandidates("uranus", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_uranus.jpg",
    ],
  },
  neptune: {
    color: [
      ...localCandidates("neptune", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_neptune.jpg",
    ],
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgba([r, g, b]: Rgb, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hashNoise(x: number, y: number, seed: number) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return v - Math.floor(v);
}

function drawCraters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
  seed: number,
  color = "rgba(20, 20, 25, 0.22)"
) {
  for (let i = 0; i < count; i += 1) {
    const n1 = hashNoise(i, seed, seed);
    const n2 = hashNoise(i + 33, seed + 7, seed);
    const n3 = hashNoise(i + 91, seed + 11, seed);
    const x = n1 * width;
    const y = n2 * height;
    const r = lerp(5, 38, n3);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fill();
  }
}

function drawBands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: Rgb[],
  seed: number,
  strength = 0.16
) {
  for (let y = 0; y < height; y += 1) {
    const lat = y / height;
    const wave = Math.sin(lat * Math.PI * 18 + seed) * 0.5 + 0.5;
    const idx = Math.floor((lat * colors.length + wave * strength) % colors.length);
    const base = colors[idx];
    ctx.fillStyle = rgba(base, 0.18 + wave * 0.16);
    ctx.fillRect(0, y, width, 1);
  }
}

function drawCloudWisps(ctx: CanvasRenderingContext2D, width: number, height: number, count: number, seed: number) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i += 1) {
    const x = hashNoise(i, 2, seed) * width;
    const y = hashNoise(i, 3, seed) * height;
    const rx = lerp(90, 260, hashNoise(i, 4, seed));
    const ry = lerp(10, 34, hashNoise(i, 5, seed));
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, lerp(-0.35, 0.35, hashNoise(i, 6, seed)), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fill();
  }
  ctx.restore();
}

function drawLandMass(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 20; i += 1) {
    const cx = hashNoise(i, 10, seed) * width;
    const cy = hashNoise(i, 11, seed) * height;
    const rx = lerp(34, 120, hashNoise(i, 12, seed));
    const ry = lerp(22, 80, hashNoise(i, 13, seed));
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.22) {
      const wobble = 0.72 + hashNoise(i + Math.cos(a) * 9, i + Math.sin(a) * 9, seed) * 0.65;
      const x = cx + Math.cos(a) * rx * wobble;
      const y = cy + Math.sin(a) * ry * wobble;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    g.addColorStop(0, "rgba(58, 126, 77, 0.82)");
    g.addColorStop(1, "rgba(183, 151, 86, 0.64)");
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
}

function createPlanetTexture(slug: string) {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const seed = slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);

  switch (slug) {
    case "mercury":
      gradient.addColorStop(0, "#a9a49b");
      gradient.addColorStop(0.5, "#6e6b66");
      gradient.addColorStop(1, "#9b9589");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawCraters(ctx, width, height, 260, seed, "rgba(20, 20, 22, 0.25)");
      drawCraters(ctx, width, height, 110, seed + 17, "rgba(255, 255, 255, 0.12)");
      break;

    case "venus":
      gradient.addColorStop(0, "#e7b35d");
      gradient.addColorStop(0.45, "#b87531");
      gradient.addColorStop(1, "#f0c77a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawBands(ctx, width, height, [[234, 187, 102], [191, 113, 45], [248, 215, 136]], seed, 0.22);
      drawCloudWisps(ctx, width, height, 110, seed);
      break;

    case "earth":
      gradient.addColorStop(0, "#1a6ba8");
      gradient.addColorStop(0.5, "#103d78");
      gradient.addColorStop(1, "#1e7fb7");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawLandMass(ctx, width, height, seed);
      drawCloudWisps(ctx, width, height, 95, seed + 20);
      ctx.fillStyle = "rgba(240, 250, 255, 0.78)";
      ctx.fillRect(0, 0, width, 50);
      ctx.fillRect(0, height - 62, width, 62);
      break;

    case "mars":
      gradient.addColorStop(0, "#d07443");
      gradient.addColorStop(0.5, "#9f3f25");
      gradient.addColorStop(1, "#c96239");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawBands(ctx, width, height, [[151, 55, 32], [204, 99, 53], [110, 48, 37], [223, 133, 74]], seed, 0.18);
      drawCraters(ctx, width, height, 130, seed, "rgba(35, 13, 10, 0.18)");
      break;

    case "jupiter":
      gradient.addColorStop(0, "#dcb78b");
      gradient.addColorStop(0.5, "#b87945");
      gradient.addColorStop(1, "#e7caa5");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawBands(ctx, width, height, [[229, 194, 146], [137, 80, 51], [234, 217, 190], [188, 112, 69], [95, 63, 55]], seed, 0.4);
      ctx.beginPath();
      ctx.ellipse(width * 0.68, height * 0.58, 130, 58, -0.12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(169, 62, 42, 0.72)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 218, 174, 0.36)";
      ctx.lineWidth = 9;
      ctx.stroke();
      break;

    case "saturn":
      gradient.addColorStop(0, "#e8d2a0");
      gradient.addColorStop(0.5, "#b89156");
      gradient.addColorStop(1, "#f1dfb7");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawBands(ctx, width, height, [[236, 213, 168], [186, 143, 82], [239, 225, 187], [158, 118, 72]], seed, 0.28);
      break;

    case "uranus":
      gradient.addColorStop(0, "#b7f7f2");
      gradient.addColorStop(0.55, "#5fc6cc");
      gradient.addColorStop(1, "#c5fffa");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawBands(ctx, width, height, [[162, 239, 235], [83, 190, 199], [205, 255, 251]], seed, 0.1);
      break;

    case "neptune":
      gradient.addColorStop(0, "#3968de");
      gradient.addColorStop(0.45, "#17357f");
      gradient.addColorStop(1, "#4b8dff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawBands(ctx, width, height, [[31, 70, 171], [17, 42, 115], [77, 137, 255], [35, 82, 201]], seed, 0.2);
      drawCloudWisps(ctx, width, height, 28, seed);
      break;

    default:
      gradient.addColorStop(0, "#68b7ff");
      gradient.addColorStop(1, "#153b85");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawCloudWisps(ctx, width, height, 40, seed);
      break;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const n = hashNoise(x * 0.013, y * 0.017, seed);
      const vignette = 1 - Math.abs(y / height - 0.5) * 0.18;
      const grain = 0.92 + n * 0.13;
      data[idx] = Math.min(255, data[idx] * grain * vignette);
      data[idx + 1] = Math.min(255, data[idx + 1] * grain * vignette);
      data[idx + 2] = Math.min(255, data[idx + 2] * grain * vignette);
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function loadFirstTexture(urls: string[], linear = false) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  return new Promise<THREE.Texture | undefined>((resolve) => {
    const tryLoad = (index: number) => {
      const url = urls[index];
      if (!url) {
        resolve(undefined);
        return;
      }

      loader.load(
        url,
        (texture) => {
          configureTexture(texture);
          if (linear) texture.colorSpace = THREE.NoColorSpace;
          resolve(texture);
        },
        undefined,
        () => tryLoad(index + 1)
      );
    };

    tryLoad(0);
  });
}

function usePlanetTextureSet(slug: string) {
  const fallbackMap = useMemo(() => createPlanetTexture(slug), [slug]);
  const fallbackRingMap = useMemo(() => createRingTexture(), []);
  const [textureSet, setTextureSet] = useState<TextureSet | null>(null);

  useEffect(() => {
    let active = true;
    const preset = planetTexturePresets[slug];

    setTextureSet(null);

    if (slug === "earth") return undefined;
    if (!preset) return undefined;

    Promise.all([
      loadFirstTexture(preset.color),
      slug !== "earth" && preset.normal ? loadFirstTexture(preset.normal, true) : Promise.resolve(undefined),
      slug !== "earth" && preset.clouds ? loadFirstTexture(preset.clouds) : Promise.resolve(undefined),
      preset.rings ? loadFirstTexture(preset.rings) : Promise.resolve(undefined),
    ]).then(([map, normalMap, cloudMap, ringMap]) => {
      if (!active) {
        map?.dispose();
        normalMap?.dispose();
        cloudMap?.dispose();
        ringMap?.dispose();
        return;
      }

      if (!map) return;

      setTextureSet({
        map,
        normalMap,
        cloudMap,
        ringMap,
        dispose: () => {
          map.dispose();
          normalMap?.dispose();
          cloudMap?.dispose();
          ringMap?.dispose();
        },
      });
    });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    return () => {
      fallbackMap?.dispose();
      fallbackRingMap?.dispose();
    };
  }, [fallbackMap, fallbackRingMap]);

  useEffect(() => () => textureSet?.dispose(), [textureSet]);

  return {
    map: textureSet?.map || fallbackMap || undefined,
    normalMap: textureSet?.normalMap,
    cloudMap: textureSet?.cloudMap,
    ringMap: textureSet?.ringMap || fallbackRingMap || undefined,
    isFallback: !textureSet,
  };
}

function createRingTexture() {
  const width = 2048;
  const height = 64;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.18, "rgba(180, 142, 94, 0.16)");
  grad.addColorStop(0.34, "rgba(231, 205, 151, 0.78)");
  grad.addColorStop(0.48, "rgba(255, 238, 190, 0.92)");
  grad.addColorStop(0.58, "rgba(70, 52, 35, 0.28)");
  grad.addColorStop(0.72, "rgba(221, 190, 131, 0.66)");
  grad.addColorStop(0.92, "rgba(160, 123, 82, 0.14)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 38; i += 1) {
    const x = hashNoise(i, 8, 88) * width;
    ctx.fillStyle = `rgba(255, 250, 220, ${0.04 + hashNoise(i, 4, 88) * 0.12})`;
    ctx.fillRect(x, 0, 1 + hashNoise(i, 3, 88) * 5, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function PlanetCinematic({ planet }: { planet: Planet }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 32, near: 0.1, far: 100, position: [2.2, 0.4, 4.6] }}
      >
        <Suspense fallback={null}>
          <Scene planet={planet} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Scene({ planet }: { planet: Planet }) {
  const { viewport } = useThree();
  const { map, normalMap, cloudMap, ringMap, isFallback } = usePlanetTextureSet(planet.slug);
  const singleTextureMode = planet.slug === "earth";
  const sphereRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const radius = PLANET_RADIUS[planet.slug] ?? 1.08;
  const isSaturn = planet.slug === "saturn";
  const tilt = planet.slug === "uranus" ? 1.28 : planet.slug === "saturn" ? 0.18 : 0.22;
  const xOffset = viewport.width >= 6 ? 1.08 : 0.18;
  const yOffset = viewport.width >= 6 ? -0.02 : -0.12;

  useFrame((state, dt) => {
    if (sphereRef.current) sphereRef.current.rotation.y += dt * 0.09;
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.115;
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.004;
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.025;
      glowRef.current.scale.setScalar(radius * 1.92 * pulse);
    }

    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const orbit = 4.75;
    const ang = Math.sin(t * 0.05) * 0.22;
    cam.position.x += (Math.sin(ang) * orbit - cam.position.x) * Math.min(1, dt * 0.5);
    cam.position.y += (0.38 + Math.sin(t * 0.07) * 0.18 - cam.position.y) * Math.min(1, dt * 0.5);
    cam.position.z += (Math.cos(ang) * orbit - cam.position.z) * Math.min(1, dt * 0.5);
    cam.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.14} color={"#8392ff"} />
      <directionalLight position={[6, 1.8, 4]} intensity={3.1} color={"#fff4e2"} />
      <directionalLight position={[-4, -1, -3]} intensity={0.32} color={"#5a7dff"} />

      <group position={[xOffset, yOffset, 0]}>
        <mesh ref={glowRef} scale={radius * 1.92}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial
            color={planet.slug === "mars" ? "#ff6b45" : planet.slug === "venus" ? "#ffc56d" : "#6b8cff"}
            transparent
            opacity={0.17}
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh ref={sphereRef} rotation={[0, 0, tilt]}>
          <sphereGeometry args={[radius, 128, 128]} />
          <meshStandardMaterial
            map={map}
            normalMap={singleTextureMode ? undefined : normalMap}
            normalScale={!singleTextureMode && normalMap ? new THREE.Vector2(0.42, 0.42) : undefined}
            bumpMap={!singleTextureMode && !normalMap && isFallback ? map : undefined}
            bumpScale={!singleTextureMode && !normalMap && isFallback ? 0.012 : 0}
            roughness={planet.slug === "earth" ? 0.72 : 0.88}
            metalness={0}
            emissive={new THREE.Color("#05070d")}
            emissiveIntensity={0.05}
          />
        </mesh>

        {!singleTextureMode && cloudMap ? (
          <mesh ref={cloudRef} renderOrder={2} rotation={[0, 0, tilt]} scale={1.006}>
            <sphereGeometry args={[radius, 128, 128]} />
            <meshStandardMaterial
              color="#ffffff"
              alphaMap={cloudMap}
              transparent
              opacity={planet.slug === "earth" ? 0.42 : 0.28}
              depthTest
              depthWrite={false}
              roughness={1}
            />
          </mesh>
        ) : null}

        {isSaturn && ringMap ? (
          <mesh ref={ringRef} rotation={[-Math.PI / 2 + 0.42, 0, 0]}>
            <ringGeometry args={[radius * 1.42, radius * 2.48, 192, 1]} />
            <meshBasicMaterial
              map={ringMap}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ) : null}
      </group>
    </>
  );
}
