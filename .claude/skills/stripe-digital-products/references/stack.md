# Stack technique — stripe-digital-products

## Services et URLs

| Service | URL dashboard | Usage |
|---|---|---|
| Stripe | https://dashboard.stripe.com | Produits, prix, webhooks, factures |
| Cloudflare R2 | https://dash.cloudflare.com | Stockage fichiers (bucket `solumatic-products`) |
| Resend | https://resend.com/emails | Emails transactionnels |
| Vercel | https://vercel.com/dashboard | Env vars, logs, fonctions |

## Noms des variables d'environnement

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...     # Clé restreinte webhook (lecture sessions/paiements)
STRIPE_WEBHOOK_SECRET=whsec_...   # Secret de signature webhook

# Cloudflare R2 (compatible S3)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=solumatic-products
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Resend
RESEND_API_KEY=re_...

# Société
SIRET=...
```

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| `product_slug` | kebab-case | `tresorerie-electricien-v2` |
| `file_key` R2 | `metier/nom-v{version}.zip` | `electricien/tresorerie-v2.zip` |
| Fonction Vercel | `/api/stripe-webhook` | — |
| Préfixe facture Stripe | `SOLU-{YYYY}-` | `SOLU-2026-0001` |

## Endpoints webhook

- **Local (test)** : `stripe listen --forward-to localhost:3000/api/stripe-webhook`
- **Preview Vercel** : `https://{deployment}.vercel.app/api/stripe-webhook`
- **Production** : `https://outils-tpe.fr/api/stripe-webhook`

## Événements Stripe écoutés

| Événement | Action |
|---|---|
| `checkout.session.completed` | Générer URL signée R2 + envoyer email Resend |
| `payment_intent.payment_failed` | (optionnel) Log pour debug |

## URL signée R2

- Générée via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- TTL : 72h (259200 secondes)
- Endpoint S3-compatible : `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
