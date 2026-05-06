# Sécurité des secrets — Synthèse

## Les 4 couches de défense

### 1. Stockage
- **Source de vérité** : Bitwarden, dossier "Solumatic / API keys"
- **Production** : Vercel Environment Variables (Production = live, Preview/Dev = test)
- **Local** : `.env.local` uniquement, avec clés test uniquement (`sk_test_*`)

### 2. Ce qu'il ne faut jamais faire
- Committer `.env` ou `.env.local` dans git
- Coller une clé dans Slack, Discord, email, chat IA (y compris Claude)
- Préfixer une clé secrète par `NEXT_PUBLIC_*` (elle partirait dans le navigateur)
- `console.log(process.env)` ou `console.log(req.body)` en production
- Screenshot avec clé visible dans le terminal

**Règle absolue** : aucune vraie clé dans le code, le repo, les fichiers `.claude/`, les conversations.

### 3. Défenses additionnelles

**Restricted API Keys (principe du moindre privilège) :**
- Clé "admin" (Stripe MCP) : `Products:Write`, `Prices:Write`, `Customers:Write`
- Clé "webhook" (Vercel) : `Checkout Sessions:Read`, `PaymentIntents:Read` uniquement

**Vérification signature webhook :**
```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```
Sans ça, n'importe qui peut POST sur `/api/stripe-webhook` et déclencher des livraisons gratuites.

**GitHub Secret Scanning :**
Settings → Code security → Secret scanning → activer sur le repo outils-tpe.fr.

**Gitleaks pre-commit :**
Voir `.git/hooks/pre-commit` — bloque le commit si un format de clé connu est détecté.

**R2 token scopé :**
Token API Cloudflare scopé sur le bucket `solumatic-products` uniquement, pas un token global.

**Resend domaine vérifié :**
SPF, DKIM, DMARC sur outils-tpe.fr ou solumatic.fr avant le premier envoi.

### 4. En cas de fuite

1. **Rotation immédiate** : Dashboard Stripe → Developers → API keys → Roll (~30 secondes)
2. **Mise à jour Vercel** : remplacer la valeur, redéployer
3. **Audit** : Stripe Dashboard → Logs, chercher IPs inhabituelles
4. **Si transactions frauduleuses** : Stripe Disputes + déclaration

## Clés Stripe : rappel

| Clé | Côté client OK ? |
|---|---|
| `pk_test_*` / `pk_live_*` (publishable) | OUI (conçue pour ça) |
| `sk_test_*` / `sk_live_*` (secret) | NON, jamais |
| `whsec_*` (webhook signing) | NON, jamais |
