import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlowSpark',
    short_name: 'FlowSpark',
    description: 'Track your daily core actions and goals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981', // emerald-500
    shortcuts: [
      {
        name: 'Today',
        short_name: 'Today',
        description: 'Open today view',
        url: '/today',
      },
      {
        name: 'Goals',
        short_name: 'Goals',
        description: 'Open goals list',
        url: '/goals',
      },
      {
        name: 'AI Coach',
        short_name: 'AI Coach',
        description: 'Jump into AI planning',
        url: '/today',
      },
    ],
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
