# Integrations — outils-tpe.fr

## Active Integrations

### Google Fonts
- **What**: Inter typeface loaded from CDN
- **Where**: `index.html`, `mentions-legales.html`, `politique-confidentialite.html` — all pages
- **How**: Non-blocking `preload` + `onload` pattern + `<noscript>` fallback
- **Privacy impact**: Google sees visitor IPs on font requests (noted; no consent banner currently)

### Vercel (Hosting)
- **What**: Static site deployment and CDN
- **Config**: `vercel.json` — URL normalization, security headers, asset caching
- **Data**: Vercel collects access logs server-side (no user data exposed from the app itself)

## Planned / Unimplemented Integrations

### Email Service (Newsletter)
- **Status**: TODO — form exists in footer, handler fires `e.preventDefault()` but makes no API call
- **Comment in code**: `// TODO : appel API vers le service d'emailing`
- **Candidates mentioned in privacy policy**: Brevo (Sendinblue) or Mailchimp
- **File**: `assets/js/main.js:44`

### Analytics
- **Status**: Not configured — no Google Analytics, no Plausible, no Matomo, no Vercel Analytics
- **Impact**: No traffic data available

### Contact Form (Sur mesure page)
- **Status**: `/sur-mesure/` page not yet built — form referenced in privacy policy but doesn't exist

## External Dependencies (Read-Only)

| Service | Purpose | Privacy concern |
|---------|---------|----------------|
| Google Fonts | Typography | Yes — IP sent to Google |
| Vercel | Hosting/CDN | Low — standard hosting logs |

## No Backend / No Database

The architecture is intentionally zero-backend:
- All tool data is localStorage only
- No API calls for tool data
- No user accounts
- No server-side processing
