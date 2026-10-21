export function Ikurrina({ className = 'w-7 h-3.5' }: { className?: string }) {
  // Authentic Ikurriña — proportions 28:14 (2:1).
  // Red field (#D52B1E), green saltire (#009B48), white cross (#FFFFFF) on top.
  // The saltire band width is 1/6 of the flag height; the white cross width is
  // also 1/6 of the height, centered. The saltire arms run corner to corner.
  return (
    <svg
      viewBox="0 0 28 14"
      className={className}
      aria-label="Ikurriña"
      role="img"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
    >
      {/* Red field */}
      <rect width="28" height="14" fill="#D52B1E" />
      {/* Green saltire (St. Andrew's cross) — two diagonal bands */}
      <path d="M0,0 L4.31,0 L28,9.69 L28,14 L23.69,14 L0,4.31 Z" fill="#009B48" />
      <path d="M23.69,0 L28,0 L28,4.31 L4.31,14 L0,14 L0,9.69 Z" fill="#009B48" />
      {/* White cross overlaying the saltire, centered */}
      <rect x="11.33" width="5.33" height="14" fill="#FFFFFF" />
      <rect y="4.33" width="28" height="5.33" fill="#FFFFFF" />
    </svg>
  );
}
