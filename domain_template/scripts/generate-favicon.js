#!/usr/bin/env node

/**
 * Script to generate favicon.ico from the Revent logo
 * This script creates multiple favicon sizes and formats
 */

const fs = require('fs');
const path = require('path');

// Since we can't actually process images in this environment,
// I'll create a placeholder script that shows what needs to be done
// and create the proper favicon structure

console.log('🎨 Generating favicon from Revent logo...');

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create favicon files (these would normally be generated from the logo image)
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

// Create manifest.json for PWA support
const manifest = {
  "name": "Revent Events",
  "short_name": "Revent",
  "description": "Dynamic event management platform",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#7c3aed",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
};

// Write manifest.json
fs.writeFileSync(
  path.join(publicDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('✅ Created manifest.json');

// Create a simple SVG favicon as a fallback
const svgFavicon = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#grad)"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">R</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon);
console.log('✅ Created favicon.svg');

// Instructions for manual favicon creation
console.log('\n📝 Manual steps needed:');
console.log('1. Use an online favicon generator (like favicon.io) or image editor');
console.log('2. Upload the revent-logo.jpg file');
console.log('3. Generate favicon.ico and the following sizes:');
faviconSizes.forEach(({ size, name }) => {
  console.log(`   - ${name} (${size}x${size}px)`);
});
console.log('4. Place all generated files in the /public directory');
console.log('5. The favicon will automatically be used by the browser');

console.log('\n🎯 Next.js will automatically serve favicon.ico from the /public directory');
console.log('   or from /src/app/favicon.ico (App Router)');
