import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SaaS Admin',
    short_name: 'SaaS Admin',
    description: 'Admin console for clients, leads, dashboards, and operations.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/svg+xml' }
    ]
  };
}
