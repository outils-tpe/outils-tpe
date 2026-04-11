# Concerns — outils-tpe.fr

## Critical Issues

### 1. Legal Pages Have Unfilled Placeholders (LCEN Violation Risk)
- **Files**: `mentions-legales.html`, `politique-confidentialite.html`
- **Problem**: Multiple `<span class="placeholder">[À COMPLÉTER]</span>` for required LCEN fields:
  - Editor name / legal entity name
  - Legal form (Auto-entrepreneur / SASU / SARL)
  - SIRET number
  - Registered address
  - Contact email
  - Publication director name
  - Newsletter email provider
- **Risk**: French LCEN law (art. 6-III) requires publisher identity on all websites. Missing = legal non-compliance.
- **Priority**: HIGH — must be filled before domain goes live

### 2. Canonical URLs Still Point to Vercel Subdomain
- **Files**: `index.html:10`, `mentions-legales.html:9`, `politique-confidentialite.html:9`
- **Problem**: `<link rel="canonical" href="https://outils-tpe.vercel.app/..." />`
- **Impact**: When domain switches to `outils-tpe.fr`, search engines will still see Vercel URLs as canonical — duplicate content risk, SEO confusion
- **Also**: `robots.txt:20` — Sitemap URL also points to vercel subdomain
- **Priority**: HIGH — must update before SEO indexing

### 3. OG/Twitter Image Missing
- **File**: `index.html:19,28`
- **Problem**: Both OG and Twitter card images reference `/assets/img/og-image.jpg` which does not exist
- **Impact**: Social media previews will show broken image or default fallback
- **Priority**: HIGH — affects sharing/click-through on social

### 4. Sitemap Only Contains Home Page
- **File**: `sitemap.xml`
- **Problem**: Only `https://outils-tpe.vercel.app/` listed; all sub-pages missing
- **Impact**: Search engines can't discover sub-pages via sitemap
- **Priority**: HIGH — update as pages are built

## Major Issues

### 5. Six Pages Missing (All Linked in Nav)
- `tresorerie.html`, `devis.html`, `calculateurs.html`, `gestion.html`, `blog.html`, `sur-mesure.html`
- All nav and footer links are dead — will 404 if visited
- **Priority**: HIGH — core product pages

### 6. Newsletter Form Not Wired Up
- **File**: `assets/js/main.js:44`
- **Problem**: `// TODO : appel API vers le service d'emailing` — form collects email but sends nowhere
- **Impact**: Email capture is completely non-functional; users who subscribe get no confirmation and are not added to any list
- **Priority**: MEDIUM — no email service chosen yet

### 7. No Analytics
- **Problem**: No tracking — no Vercel Analytics, no Plausible, no GA4
- **Impact**: Zero visibility into traffic, page views, conversion, or user behavior
- **Priority**: MEDIUM — needed to validate growth

## Minor Issues

### 8. Footer Year JS Dependency
- **File**: `assets/js/main.js:4`, `index.html:316`
- **Problem**: `<span id="year"></span>` is empty without JS; falls back to nothing
- **Impact**: Copyright notice shows "© outils-tpe.fr" without the year if JS disabled
- **Fix**: Hardcode the year as fallback in HTML: `<span id="year">2026</span>`
- **Priority**: LOW

### 9. Mobile Nav Missing From Legal Pages
- **Files**: `mentions-legales.html:32`, `politique-confidentialite.html:35`
- **Problem**: Nav has `style="display:flex"` hardcoded — hamburger toggle is absent, mobile users can't collapse nav
- **Impact**: Poor UX on mobile for legal pages
- **Priority**: LOW — legal pages get little traffic

### 10. Header/Footer Duplication
- Each HTML page repeats the full header and footer markup manually
- **Impact**: Risk of inconsistency across pages as nav items change; no single source of truth
- **Note**: Acceptable for static site at this scale, but becomes painful at 6+ pages
- **Priority**: LOW (track when >5 pages)

### 11. claude-seo/ Nested Git Repo in Project Root
- `claude-seo/` contains its own `.git` — it's a separate repository nested inside the project
- **Risk**: Can confuse git operations; accidentally committing its internals to main repo
- **Mitigation**: Add to `.gitignore` or configure as proper git submodule
- **Priority**: LOW — currently harmless but should be clarified

### 12. No Error Pages
- No `404.html` or custom error page configured in `vercel.json`
- **Impact**: Users who hit dead links (the 6 missing pages) see Vercel's default 404
- **Priority**: LOW

## SEO Gaps Summary

| Issue | Severity |
|-------|---------|
| Canonical URLs wrong domain | Critical |
| OG image missing | High |
| Sitemap incomplete | High |
| 6 pages missing (no indexable content) | High |
| No analytics to measure SEO performance | Medium |
| No hreflang (French-only — low risk) | Low |
| Schema.org uses final domain (outils-tpe.fr) but canonical uses vercel — inconsistency | Medium |

## Performance Notes

- No JavaScript bundles → fast load
- Google Fonts loaded non-blocking → good
- CSS preloaded → good
- No images except favicon (OG image missing) → fast by default
- No third-party scripts → excellent privacy + performance
- Vercel CDN handles caching
