import type { Metadata, Viewport } from 'next'
import { Titillium_Web, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'

const titilliumWeb = Titillium_Web({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-titillium-web',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Gym Logger',
    template: '%s · Gym Logger',
  },
  description: 'Personal single-user workout and progress tracker',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00f0a0' },
    { media: '(prefers-color-scheme: dark)', color: '#090a0f' },
  ],
}

// Inline script to prevent theme flash (FOUT) before React hydrates
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('gym_theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${titilliumWeb.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-canvas text-ink transition-colors duration-150"
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
