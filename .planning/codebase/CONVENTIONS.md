# Conventions — outils-tpe.fr

## HTML Conventions

### Document structure
- `<!DOCTYPE html>` + `<html lang="fr">` on all pages
- Consistent `<head>` order: charset → viewport → meta → SEO → schema → fonts → CSS
- Script at end of `<body>` (no `defer`/`async` needed — single file, non-critical)
- French language throughout (`lang="fr"`, French text, French date format)

### Accessibility
- `aria-label` on all icon-only and ambiguous links
- `aria-expanded`/`aria-controls` on hamburger toggle
- `role="navigation"` + `aria-label` on `<nav>` elements
- `.sr-only` utility class for visually hidden text
- `aria-hidden="true"` on decorative SVG icons

### Meta/SEO pattern (every page)
```html
<meta name="description" content="..." />
<title>Page Title — outils-tpe.fr</title>
<link rel="canonical" href="https://..." />
<meta property="og:*" ... />
<meta name="twitter:*" ... />
```

### Schema.org
- Inline JSON-LD `<script type="application/ld+json">` in `<head>`
- `@graph` array pattern used in `index.html`

## CSS Conventions

### Custom properties (CSS variables)
All design tokens defined in `:root`:
```css
--color-navy, --color-green, --color-white, --color-off-white
--color-gray-100, --color-gray-300, --color-gray-500, --color-gray-700
--color-text
--font-base
--radius-sm, --radius-md, --radius-lg
--shadow-card, --shadow-card-hover
--transition: 200ms ease
--max-width: 1100px
--header-height: 64px
```

### Class naming (BEM-like)
- `.block` — component root
- `.block__element` — child of block
- `.block--modifier` — variant of block
- Examples: `.card__icon`, `.nav__link--cta`, `.logo__text--light`

### Responsive approach
- Mobile-first (base styles are mobile)
- Two media query breakpoints:
  ```css
  @media (min-width: 640px) { /* tablet */ }
  @media (min-width: 900px) { /* desktop */ }
  ```
- `clamp()` for fluid typography: `font-size: clamp(1.4rem, 3vw, 2rem)`

### Transitions
- Always use `var(--transition)` (200ms ease)
- Applied to: background, color, border-color, transform, opacity, gap

### Section padding
- `.section { padding-block: 5rem; }` — consistent vertical rhythm

## JavaScript Conventions

### Style
- Vanilla JS, no libraries, no modules
- `const`/`let` only (no `var`)
- Guard clauses before DOM access: `if (toggle && nav) { ... }`
- Comments in French (matching codebase language)

### Pattern
```js
// 1. Get element(s)
const el = document.querySelector('.selector');
// 2. Guard
if (el) {
  // 3. Act
  el.addEventListener('event', handler);
}
```

### Naming
- `camelCase` for variables and functions
- Descriptive: `toggle`, `nav`, `newsletterForm`, `yearEl`

## File Organization

- One CSS file, one JS file — no splitting, no components
- HTML pages are self-contained (repeat header/footer manually)
- No templating — duplication accepted at this stage

## Language & Content

- All content in French
- Informal but professional tone ("Simplifiez votre quotidien")
- Feature copy emphasizes: gratuit, sans inscription, données privées
- Placeholder text uses `<span class="placeholder">` with yellow highlight style
