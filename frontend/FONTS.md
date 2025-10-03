# Custom Fonts Guide

This project now includes a comprehensive set of custom fonts that you can use throughout your application.

## Available Fonts

### Primary Fonts (Currently Active)

- **Plus Jakarta Sans** - Primary sans-serif font
- **Inter** - Secondary fallback font
- **JetBrains Mono** - Monospace font for code

### New Custom Fonts

#### Modern & Clean

- **Outfit** (`font-modern`) - Great for headings and UI elements
- **Manrope** (`font-friendly`) - Friendly and approachable, perfect for body text
- **Sora** (`font-elegant`) - Premium and elegant, great for sophisticated designs
- **Geist** (`font-vercel`) - Vercel's modern font, clean and professional
- **Geist Mono** (`font-vercel-mono`) - Vercel's monospace font

#### Display & Specialized

- **Playfair Display** (`font-serif`) - Elegant serif for headings and special text
- **Bebas Neue** (`font-condensed`) - Strong and condensed, perfect for titles
- **Orbitron** (`font-futuristic`) - Modern and tech-focused, great for Web3/blockchain themes

## Usage Examples

### In Tailwind Classes

```jsx
// Modern and clean
<h1 className="font-modern text-4xl">Modern Heading</h1>

// Friendly and approachable
<p className="font-friendly text-lg">Friendly body text</p>

// Elegant and sophisticated
<h2 className="font-elegant text-2xl">Elegant Subheading</h2>

// Futuristic for Web3 themes
<div className="font-futuristic text-xl">Blockchain Event</div>

// Serif for special occasions
<h3 className="font-serif text-3xl">Special Event Title</h3>

// Condensed for impact
<h4 className="font-condensed text-2xl">IMPACT TITLE</h4>
```

### In CSS

```css
.custom-heading {
  font-family: var(--font-outfit);
}

.friendly-text {
  font-family: var(--font-manrope);
}

.futuristic-text {
  font-family: var(--font-orbitron);
}
```

## Font Combinations

### For Web3/Blockchain Events

- Headers: `font-futuristic` or `font-condensed`
- Body: `font-modern` or `font-friendly`
- Code: `font-mono` (JetBrains Mono)

### For Elegant Events

- Headers: `font-serif` (Playfair Display)
- Body: `font-elegant` (Sora)
- Accents: `font-modern` (Outfit)

### For Modern UI

- Headers: `font-modern` (Outfit)
- Body: `font-friendly` (Manrope)
- Code: `font-vercel-mono` (Geist Mono)

## Font Weights Available

All fonts support various weights:

- `font-thin` (100)
- `font-extralight` (200)
- `font-light` (300)
- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)
- `font-extrabold` (800)
- `font-black` (900)

## Performance

All fonts are optimized with:

- `display: 'swap'` for better loading performance
- Proper fallbacks to system fonts
- Subset loading (latin only) for smaller bundle size

## Switching Primary Font

To change your primary font, update the `fontConfig.primary` in `/lib/fonts.ts`:

```typescript
// Change from Plus Jakarta Sans to Outfit
primary: outfit, // instead of plusJakarta
```

Then update the Tailwind config's `sans` family to use the new primary font.
