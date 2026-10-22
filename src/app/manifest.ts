import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gym Logger',
    short_name: 'GymLogger',
    description: 'Personal workout tracker with IST routine splits, PR tracking, and cardio logs',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00f0a0',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
