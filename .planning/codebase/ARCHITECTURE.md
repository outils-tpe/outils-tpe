# Architecture — outils-tpe.fr

## Pattern

**Static HTML site** — no framework, no SPA, no SSR. Each page is a standalone `.html` file served directly by Vercel. No client-side routing.

## Layers

```
Browser
  └── HTML pages (entry points)
        ├── assets/css/main.css (global styles)
        ├── assets/js/main.js (global interactions)
        └── localStorage (all tool data — user-side only)
```

There is no backend layer. No API. No database. No build pipeline.

## Page Structure

Each HTML page follows the same layout skeleton:

```
<head>
  ├── Meta tags (charset, viewport, description)
  ├── SEO tags (canonical, OG, Twitter Card)
  ├── Schema.org JSON-LD (structured data)
  ├── Font preloading (Google Fonts Inter)
  └── CSS link (main.css)

<body>
  ├── <header class="header"> — sticky nav, hamburger mobile
  ├── <main> — page-specific content
  └── <footer class="footer"> — brand, nav, newsletter
  └── <script src="assets/js/main.js">
```

## Existing Pages

| URL | File | Status |
|-----|------|--------|
| `/` | `index.html` | Complete skeleton |
| `/mentions-legales` | `mentions-legales.html` | Built but has placeholders |
| `/politique-confidentialite` | `politique-confidentialite.html` | Built but has placeholders |

## Planned Pages (not yet built)

| URL | Status |
|-----|--------|
| `/tresorerie` | Missing — links exist, page does not |
| `/devis` | Missing |
| `/calculateurs` | Missing |
| `/gestion` | Missing |
| `/blog` | Missing |
| `/sur-mesure` | Missing |

## URL Routing

Handled by Vercel via `vercel.json`:
- `cleanUrls: true` — `.html` extension removed from URLs automatically
- `trailingSlash: false` — canonical form without trailing slash

So `mentions-legales.html` → served at `/mentions-legales`.

## Data Flow

```
User fills tool form
  → JavaScript reads input
  → Computation happens in browser (no network call)
  → Result stored in localStorage
  → Data never leaves the device
```

## Sub-repository

`claude-seo/` is a **separate git repository** (nested `.git` inside project root). It contains SEO skill definitions for Claude Code. It is **not part of the site** — it's a tooling/meta directory. Should be treated as a dependency, not project code.

## Responsiveness

Three breakpoints:
- Base (mobile-first, <640px): single column, hamburger nav
- Tablet (≥640px): 2-column cards, 2-column footer
- Desktop (≥900px): 4-column cards, 4-column reassurance, horizontal CTA, desktop nav

## Security Headers (via Vercel)

Applied to all responses:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
