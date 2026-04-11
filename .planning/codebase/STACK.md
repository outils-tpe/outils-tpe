# Stack — outils-tpe.fr

## Language & Runtime

- **HTML5** — semantic markup, `lang="fr"`, WCAG-aware structure
- **CSS3** — custom properties, grid, flexbox, clamp(), `@media` breakpoints
- **Vanilla JavaScript (ES6+)** — no frameworks, no bundler, no transpilation
- **No build step** — files served as-is; no npm, no package.json, no node_modules

## Deployment & Hosting

- **Vercel** — static site hosting, configured via `vercel.json`
  - `cleanUrls: true` — `/mentions-legales.html` → `/mentions-legales`
  - `trailingSlash: false`
  - Security headers applied globally: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
  - Asset caching: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`
- **Current domain**: `outils-tpe.vercel.app` (temporary — to be migrated to `outils-tpe.fr`)

## Fonts

- **Inter** (Google Fonts) — weights 400, 500, 600, 700
  - Loaded non-blocking via `onload` trick + `<noscript>` fallback
  - `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`
  - CSS stack fallback: `system-ui, -apple-system, sans-serif`

## CSS Architecture

- Single file: `assets/css/main.css` (~634 lines)
- CSS custom properties in `:root` — color palette, font, radii, shadows, transitions, layout
- Mobile-first responsive: base → 640px → 900px breakpoints
- No CSS preprocessor (no Sass/Less)

## JavaScript

- Single file: `assets/js/main.js` (~50 lines)
- Responsibilities: footer year auto-update, mobile nav toggle, newsletter form basic handler
- No external libraries, no module system
- Newsletter TODO: API call to emailing service (Brevo/Mailchimp) not yet implemented

## Icons & Images

- SVG icons inline in HTML (no icon library)
- `assets/img/favicon.svg` — SVG favicon
- `assets/img/og-image.jpg` — **referenced but missing** (OG/Twitter card image)

## Data Storage

- **localStorage** — all tool data stays in the user's browser; no backend, no database
- No cookies, no server-side sessions

## SEO & Structured Data

- Schema.org JSON-LD in `<head>`: Organization, WebSite, ItemList
- `robots.txt` — allows all crawlers including AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.)
- `sitemap.xml` — minimal, only home page listed
- `llms.txt` — LLM-optimized site description present

## Configuration Files

| File | Purpose |
|------|---------|
| `vercel.json` | Hosting config, headers, URL rewrites |
| `robots.txt` | Crawler access rules + sitemap pointer |
| `sitemap.xml` | XML sitemap (currently only home) |
| `llms.txt` | AI-readable site description |
