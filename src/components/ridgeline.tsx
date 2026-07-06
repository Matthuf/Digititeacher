export function Ridgeline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0 200 L0 140 L180 60 L340 130 L520 40 L700 120 L900 30 L1100 110 L1280 70 L1440 130 L1440 200 Z"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M0 200 L0 170 L220 110 L420 160 L640 90 L860 150 L1080 80 L1260 140 L1440 100 L1440 200 Z"
        fill="currentColor"
        opacity="0.18"
      />
    </svg>
  );
}
