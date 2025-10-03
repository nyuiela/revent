# Public Fonts Folder

Place your self-hosted font files here (e.g., .woff2, .woff, .ttf).

Recommended structure:

- fonts/
  - Outfit/
    - Outfit-Variable.woff2
    - Outfit-Regular.woff2
  - Manrope/
    - Manrope-Variable.woff2
  - README.md

Notes:

- Prefer .woff2 for best compression and performance.
- Keep file names short and consistent.
- Include licenses for any fonts that require them.

Usage with next/font/local (example):

```ts
import localFont from "next/font/local";

export const myLocalOutfit = localFont({
  src: [
    {
      path: "/fonts/Outfit/Outfit-Variable.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-outfit-local",
  display: "swap",
});
```
