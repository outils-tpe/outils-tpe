# Testing — outils-tpe.fr

## Current State

**No automated testing exists.**

- No test framework (no Jest, Vitest, Cypress, Playwright, etc.)
- No test files
- No CI pipeline with test steps
- No linting configuration (no ESLint, no Stylelint)
- No type checking (no TypeScript)

## What Exists

Manual verification only:
- Visual inspection in browser
- Checking links work (nav, footer, CTAs)
- Checking mobile menu opens/closes

## Rationale

The site is a static HTML/CSS/JS skeleton at MVP stage. With no complex business logic, no backend, and no build step, the testing surface is minimal:
- HTML validity can be checked with W3C validator
- CSS correctness is verified visually
- JS has ~50 lines with no complex logic

## Recommended Testing When Features Are Built

As tool pages get built (trésorerie, devis, calculateurs, gestion), these testing approaches become relevant:

### For tool logic (calculator functions, data manipulation)
- Unit tests with **Vitest** or **Jest** (zero-config for vanilla JS)
- Test pure functions extracted from localStorage manipulation

### For UI/interaction testing
- **Playwright** — browser automation for mobile nav, form submission, localStorage persistence
- Useful once actual tool UIs exist

### For HTML quality
- W3C HTML validator
- `axe-core` for accessibility auditing

### For visual regression
- Manual review at 375px (mobile) and 1280px (desktop) minimum

## CI

No CI currently. If added, recommended checks:
1. HTML validation (htmlhint or w3c-validator)
2. Broken link check
3. Lighthouse CI (performance, accessibility, SEO scores)
