"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const WIDTH = 1440;
const HEIGHT = 320;
const STEP = 8;

/**
 * Deterministic ridge silhouette: layered sine waves for the crest line,
 * optional zig-zag "pine fringe" on top. Deterministic so SSR markup and
 * client hydration always match.
 */
function ridgePath({
  seed,
  base,
  amplitude,
  trees,
}: {
  seed: number;
  base: number;
  amplitude: number;
  trees: boolean;
}) {
  const crest = (x: number) =>
    base +
    amplitude * Math.sin(x / 210 + seed * 1.7) +
    amplitude * 0.55 * Math.sin(x / 87 + seed * 3.1) +
    amplitude * 0.25 * Math.sin(x / 41 + seed * 5.3);

  const points: string[] = [`M0 ${HEIGHT}`, `L0 ${crest(0).toFixed(1)}`];

  for (let x = STEP; x <= WIDTH; x += STEP) {
    const y = crest(x);
    if (trees) {
      const treeHeight =
        7 + 4 * Math.sin(x * 0.61 + seed * 2.3) + 2 * Math.sin(x * 1.7 + seed);
      points.push(`L${x - STEP / 2} ${(crest(x - STEP / 2) - treeHeight).toFixed(1)}`);
    }
    points.push(`L${x} ${y.toFixed(1)}`);
  }

  points.push(`L${WIDTH} ${HEIGHT} Z`);
  return points.join(" ");
}

const LAYERS = [
  { seed: 1, base: 150, amplitude: 42, trees: false, opacity: 0.14, factor: 0.06 },
  { seed: 2, base: 190, amplitude: 36, trees: false, opacity: 0.24, factor: 0.12 },
  { seed: 3, base: 228, amplitude: 30, trees: true, opacity: 0.4, factor: 0.2 },
  { seed: 4, base: 265, amplitude: 24, trees: true, opacity: 0.62, factor: 0.32 },
] as const;

const PATHS = LAYERS.map((layer) => ridgePath(layer));

export function TwilightRidges({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const y0 = useTransform(scrollY, [0, 600], [0, 600 * LAYERS[0].factor]);
  const y1 = useTransform(scrollY, [0, 600], [0, 600 * LAYERS[1].factor]);
  const y2 = useTransform(scrollY, [0, 600], [0, 600 * LAYERS[2].factor]);
  const y3 = useTransform(scrollY, [0, 600], [0, 600 * LAYERS[3].factor]);
  const parallax = [y0, y1, y2, y3];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className ?? ""}`}
    >
      {/* Sky band: dusk magenta fading into a warm horizon */}
      <div
        className="absolute inset-x-0 top-0 h-2/5 opacity-25 dark:opacity-55"
        style={{
          background:
            "linear-gradient(to bottom, var(--dusk), color-mix(in srgb, var(--primary) 55%, var(--dusk) 45%) 55%, transparent)",
        }}
      />

      {/* Sun glow */}
      <div className="absolute right-[6%] top-8 size-44 rounded-full bg-primary/25 blur-3xl dark:bg-primary/35 sm:size-64" />
      <div className="absolute right-[11%] top-16 size-20 rounded-full bg-primary/60 blur-lg dark:bg-primary/80 sm:size-28" />

      {/* Ridge layers back to front, fog banks drifting between them */}
      {ridgeLayer(0, parallax, reduceMotion)}
      {ridgeLayer(1, parallax, reduceMotion)}
      <div className="tr-fog bottom-[26%] h-[24%]" style={{ animationDelay: "-6s" }} />
      {ridgeLayer(2, parallax, reduceMotion)}
      <div className="tr-fog bottom-0 h-[22%]" />
      {ridgeLayer(3, parallax, reduceMotion)}
    </div>
  );
}

function ridgeLayer(
  i: number,
  parallax: MotionValue<number>[],
  reduceMotion: boolean | null,
) {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 h-56 sm:h-80"
      style={reduceMotion ? undefined : { y: parallax[i] }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        <path
          d={PATHS[i]}
          fill={
            i >= 2
              ? "var(--foreground)"
              : "color-mix(in srgb, var(--foreground) 75%, var(--mist) 25%)"
          }
          opacity={LAYERS[i].opacity}
        />
      </svg>
    </motion.div>
  );
}
