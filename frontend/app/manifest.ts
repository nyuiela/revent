import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Revent - Onchain Events Platform',
    short_name: 'Revent',
    description: 'Discover, create, and attend onchain events. Earn tokens by participating in blockchain events, streaming, and contributing to the decentralized ecosystem.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    categories: ['business', 'productivity', 'social'],
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/hero.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Revent homepage showing onchain events'
      },
      {
        src: '/screenshot.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Revent mobile app interface'
      }
    ],
    shortcuts: [
      {
        name: 'Create Event',
        short_name: 'Create',
        description: 'Create a new onchain event',
        url: '/events/create',
        icons: [{ src: '/icon.png', sizes: '96x96' }]
      },
      {
        name: 'Browse Events',
        short_name: 'Events',
        description: 'Discover onchain events',
        url: '/events',
        icons: [{ src: '/icon.png', sizes: '96x96' }]
      },
      {
        name: 'Profile',
        short_name: 'Profile',
        description: 'View your profile and events',
        url: '/profile',
        icons: [{ src: '/icon.png', sizes: '96x96' }]
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    // edge_side_panel: {
    //   preferred_width: 400
    // }
  }
}
