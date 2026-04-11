# Structure — outils-tpe.fr

## Root Layout

```
outils-tpe/
├── index.html                        # Home page
├── mentions-legales.html             # Legal notices (LCEN compliance)
├── politique-confidentialite.html    # Privacy policy (RGPD compliance)
├── vercel.json                       # Vercel hosting config
├── robots.txt                        # Crawler rules
├── sitemap.xml                       # XML sitemap (minimal — home only)
├── llms.txt                          # AI-readable site description
│
├── assets/
│   ├── css/
│   │   └── main.css                  # All styles (~634 lines)
│   ├── js/
│   │   └── main.js                   # All interactivity (~50 lines)
│   └── img/
│       └── favicon.svg               # SVG favicon
│
├── claude-seo/                       # Nested git repo — SEO Claude skills (NOT site code)
│   └── ...                           # Ignore for site development purposes
│
└── .planning/                        # GSD planning docs (not deployed)
    └── codebase/                     # This codebase map
```

## Key Locations

| What | Where |
|------|-------|
| Home page | `index.html` |
| All CSS | `assets/css/main.css` |
| All JS | `assets/js/main.js` |
| Favicon | `assets/img/favicon.svg` |
| OG image | `assets/img/og-image.jpg` — **MISSING** |
| Hosting config | `vercel.json` |
| Crawler config | `robots.txt` |
| Sitemap | `sitemap.xml` |
| LLM description | `llms.txt` |
| Legal notices | `mentions-legales.html` |
| Privacy policy | `politique-confidentialite.html` |

## Naming Conventions

### Files
- HTML: `kebab-case.html` (e.g., `mentions-legales.html`, `politique-confidentialite.html`)
- CSS/JS: `main.css`, `main.js` (single shared file per type)
- Images: `kebab-case.ext`

### CSS Classes (BEM-like)
- Block: `.hero`, `.card`, `.footer`, `.nav`
- Element: `.hero__title`, `.card__icon`, `.footer__links`
- Modifier: `.card--featured`, `.nav__link--cta`, `.logo__text--light`
- Utility: `.container`, `.section`, `.sr-only`, `.btn`, `.btn--primary`, `.btn--white`

### HTML IDs
- Used sparingly: `#main-nav`, `#categories`, `#newsletter-email`, `#year`

## What's Missing (planned pages)

These URLs are linked in nav and footer but no `.html` file exists:

```
tresorerie.html    (or tresorerie/index.html)
devis.html
calculateurs.html
gestion.html
blog.html          (or blog/index.html)
sur-mesure.html
```

Vercel's `cleanUrls` means either `tresorerie.html` or `tresorerie/index.html` will work at `/tresorerie`.
