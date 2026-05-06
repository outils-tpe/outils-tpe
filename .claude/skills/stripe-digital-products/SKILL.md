# Skill : stripe-digital-products

Skill local au projet outils-tpe.fr pour mettre en vente un produit numérique téléchargeable via Stripe, de la création produit jusqu'à la livraison sécurisée au client.

> **Note** : Ce SKILL.md est un draft de référence. La version définitive sera finalisée après le premier produit témoin de bout en bout.

---

## Quand utiliser ce skill

- Créer un nouveau produit numérique à vendre sur outils-tpe.fr
- Implémenter ou modifier le webhook Stripe
- Vérifier la conformité d'une Checkout Session (invoice, TVA, métadonnées)
- Déboguer un problème de livraison (email non reçu, lien expiré, R2 inaccessible)

---

## Architecture : Checkout + Webhook + Email (Approche 3)

```
[outils-tpe.fr]
   │  bouton "Acheter"
   ▼
[Stripe Checkout]
   │  paiement OK
   ▼
[Webhook Stripe → /api/stripe-webhook]
   │  événement : checkout.session.completed
   ▼
[Vercel Serverless Function]
   ├─ vérification signature (whsec_*)
   ├─ génère URL signée R2 (validité 72h)
   ├─ envoie email via Resend
   └─ (optionnel) enregistre la commande
```

---

## Variables d'environnement requises

| Variable | Côté | Environnement | Description |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Serveur | Test + Prod | Clé restreinte webhook (lecture seule) |
| `STRIPE_WEBHOOK_SECRET` | Serveur | Test + Prod | `whsec_*` depuis Stripe Dashboard |
| `R2_ACCOUNT_ID` | Serveur | Test + Prod | ID compte Cloudflare |
| `R2_ACCESS_KEY_ID` | Serveur | Test + Prod | Token R2 scopé sur le bucket |
| `R2_SECRET_ACCESS_KEY` | Serveur | Test + Prod | Secret R2 (jamais en clair) |
| `R2_BUCKET_NAME` | Serveur | Test + Prod | `solumatic-products` |
| `RESEND_API_KEY` | Serveur | Test + Prod | Clé Resend (domaine vérifié) |

**Jamais de préfixe `NEXT_PUBLIC_*` sur ces variables.**

---

## Paramètres Stripe obligatoires (Checkout Session)

Voir `templates/checkout-session.json` pour le template complet. Points non négociables :

- `invoice_creation.enabled: true` — sans ça, pas de facture PDF
- `invoice_data.footer: "TVA non applicable, art. 293 B du CGI"` — mention légale AE
- `invoice_data.custom_fields[0]: { name: "SIRET", value: process.env.SIRET }` — identification
- `customer_creation: "always"` — crée un Customer Stripe pour chaque achat
- `metadata.product_slug` — identifiant du produit (ex: `tresorerie-electricien-v2`)
- `metadata.file_key` — chemin du fichier dans R2 (ex: `electricien/tresorerie-v2.zip`)

---

## Règles de sécurité absolues

1. **Aucune clé en clair** dans le code, le chat, les fichiers `.claude/`
2. **Vérification signature webhook** obligatoire via `stripe.webhooks.constructEvent()`
3. **Restricted API Keys** : clé webhook ≠ clé admin (principe du moindre privilège)
4. **R2 token** scopé sur le bucket `solumatic-products` uniquement
5. **URLs signées R2** avec TTL 72h max, jamais URLs publiques permanentes
6. **Mode test** en dev/preview, mode live uniquement sur Vercel Production

Voir `references/securite-secrets.md` pour le détail complet.

---

## Checklist avant mise en vente

Voir `references/checklist-mise-en-vente.md`.

---

## Fichiers de référence

| Fichier | Contenu |
|---|---|
| `templates/product-spec.md` | Fiche à remplir pour chaque nouveau produit |
| `templates/checkout-session.json` | Paramètres Stripe standardisés |
| `templates/email-livraison.html` | Template email Resend |
| `references/stack.md` | URLs, conventions, noms de variables |
| `references/facturation-AE.md` | Mentions légales, seuils TVA, alertes |
| `references/securite-secrets.md` | Synthèse sécurité |
| `references/checklist-mise-en-vente.md` | Checklist complète |
| `code/webhook.ts` | Squelette Vercel Function (référence) |
| `code/send-email.ts` | Squelette envoi Resend (référence) |
