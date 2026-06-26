export default function AppleIcon() {
  const svg = `
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="38" fill="#020617" />
      <rect x="24" y="24" width="132" height="132" rx="30" fill="url(#g2)" opacity="0.16" />
      <path d="M56 118V62h16l18 31 18-31h16v56h-14V87l-18 31h-4L70 87v31H56z" fill="#e2e8f0" />
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
