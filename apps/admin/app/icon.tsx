export default function Icon() {
  const svg = `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="192" height="192" rx="42" fill="#020617" />
      <rect x="28" y="28" width="136" height="136" rx="34" fill="url(#g)" opacity="0.16" />
      <path d="M60 124V68h18l18 34 18-34h18v56h-16V92l-20 36h-2L74 92v32H60z" fill="#e2e8f0" />
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
