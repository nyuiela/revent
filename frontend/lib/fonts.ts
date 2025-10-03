import { Plus_Jakarta_Sans, Inter, JetBrains_Mono, Poppins, Space_Grotesk, DM_Sans, Outfit, Manrope, Sora, Geist, Geist_Mono, Playfair_Display, Bebas_Neue, Orbitron } from 'next/font/google'

// Primary Font - Plus Jakarta Sans (Current)
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic']
})

// Secondary Font - Inter (Fallback)
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic']
})

// Monospace Font - JetBrains Mono
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic']
})

// Display Font - Poppins (Placeholder for headings)
export const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic']
})

// Alternative Sans - Space Grotesk (Placeholder for modern look)
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal']
})

// Alternative Sans - DM Sans (Placeholder for clean look)
export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic']
})

// Modern Sans - Outfit (Great for headings and UI)
export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal']
})

// Rounded Sans - Manrope (Friendly and approachable)
export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  style: ['normal']
})

// Premium Sans - Sora (Elegant and modern)
export const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: ['normal']
})

// Vercel's Geist - Modern and clean
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal']
})

// Vercel's Geist Mono - Modern monospace
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal']
})

// Display Font - Playfair Display (Elegant serif for headings)
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic']
})

// Bold Display - Bebas Neue (Strong and condensed)
export const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
  weight: ['400'],
  style: ['normal']
})

// Futuristic - Orbitron (Modern and tech-focused)
export const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal']
})

// Font configuration object for easy management
export const fontConfig = {
  // Primary fonts (currently active)
  primary: plusJakarta,
  secondary: inter,
  mono: jetbrainsMono,

  // Placeholder fonts (ready to be activated)
  display: poppins,
  alternative: spaceGrotesk,
  clean: dmSans,

  // New custom fonts
  modern: outfit,
  friendly: manrope,
  elegant: sora,
  vercel: geist,
  vercelMono: geistMono,
  serif: playfairDisplay,
  condensed: bebasNeue,
  futuristic: orbitron,

  // Font variables for CSS
  variables: {
    primary: plusJakarta.variable,
    secondary: inter.variable,
    mono: jetbrainsMono.variable,
    display: poppins.variable,
    alternative: spaceGrotesk.variable,
    clean: dmSans.variable,
    modern: outfit.variable,
    friendly: manrope.variable,
    elegant: sora.variable,
    vercel: geist.variable,
    vercelMono: geistMono.variable,
    serif: playfairDisplay.variable,
    condensed: bebasNeue.variable,
    futuristic: orbitron.variable,
  },

  // Font families for Tailwind config
  families: {
    sans: [
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    display: [
      'var(--font-poppins)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    mono: [
      'var(--font-jetbrains-mono)',
      'Fira Code',
      'monospace'
    ],
    alternative: [
      'var(--font-space-grotesk)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    clean: [
      'var(--font-dm-sans)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    modern: [
      'var(--font-outfit)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    friendly: [
      'var(--font-manrope)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    elegant: [
      'var(--font-sora)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    vercel: [
      'var(--font-geist)',
      'var(--font-plus-jakarta)',
      'var(--font-inter)',
      'system-ui',
      'sans-serif'
    ],
    serif: [
      'var(--font-playfair-display)',
      'var(--font-poppins)',
      'var(--font-plus-jakarta)',
      'serif'
    ],
    condensed: [
      'var(--font-bebas-neue)',
      'var(--font-poppins)',
      'var(--font-plus-jakarta)',
      'system-ui',
      'sans-serif'
    ],
    futuristic: [
      'var(--font-orbitron)',
      'var(--font-space-grotesk)',
      'var(--font-plus-jakarta)',
      'system-ui',
      'sans-serif'
    ]
  }
}

// Font weight utilities
export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
} as const

// Font size utilities
export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem',    // 128px
} as const

// Line height utilities
export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const

// Letter spacing utilities
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const

export default fontConfig

