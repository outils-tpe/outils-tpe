# Checklist mise en vente d'un nouveau produit numérique

Cocher chaque étape avant de passer en mode live.

## Préparation (Thomas uniquement)

- [ ] Bitwarden : créer entrée pour les nouvelles clés si nécessaire
- [ ] Fichier ZIP uploadé dans R2 (`solumatic-products/<metier>/<slug>.zip`)
- [ ] Token R2 scopé sur le bucket (pas un token global)
- [ ] Domaine Resend vérifié (SPF/DKIM/DMARC)

## Stripe (mode test)

- [ ] Produit créé dans Stripe Dashboard (ou via MCP)
- [ ] Prix créé avec le bon montant en centimes (`2900` = 29,00 €)
- [ ] Taux de taxe à 0% sur le produit
- [ ] `invoice_creation.enabled: true` dans la Checkout Session
- [ ] Footer facture : "TVA non applicable, art. 293 B du CGI"
- [ ] Champ SIRET renseigné
- [ ] `customer_creation: "always"`
- [ ] Métadonnées : `product_slug`, `version`, `file_key`
- [ ] `success_url` et `cancel_url` corrects

## Webhook (mode test)

- [ ] Fonction `/api/stripe-webhook` déployée sur Vercel
- [ ] `STRIPE_WEBHOOK_SECRET` en test dans Vercel Preview
- [ ] Vérification signature implémentée (`constructEvent`)
- [ ] Événement `checkout.session.completed` géré
- [ ] URL signée R2 générée avec TTL 72h
- [ ] Email Resend envoyé avec le lien de téléchargement

## Test end-to-end

- [ ] `stripe listen --forward-to localhost:3000/api/stripe-webhook` en local
- [ ] Achat test avec carte `4242 4242 4242 4242`
- [ ] Email reçu dans la boîte de test
- [ ] Lien de téléchargement fonctionnel (fichier correct téléchargé)
- [ ] Facture PDF générée par Stripe avec la bonne mention TVA

## Sécurité

- [ ] `.env.local` dans `.gitignore` (vérifié)
- [ ] GitHub Secret Scanning activé sur outils-tpe.fr
- [ ] Gitleaks pre-commit hook en place
- [ ] Aucune vraie clé dans le code ou le repo

## Page de vente

- [ ] Bouton "Acheter" pointe vers la bonne Checkout Session (ou Payment Link)
- [ ] Page `/merci` existe et affiche un message clair
- [ ] Fil de retour (`cancel_url`) vers la bonne page métier

## Bascule en live

- [ ] Clés live configurées dans Vercel Production (pas Preview/Dev)
- [ ] `STRIPE_WEBHOOK_SECRET` live dans Vercel Production
- [ ] Webhook live enregistré dans Stripe Dashboard
- [ ] Test avec une vraie carte (petit montant, puis remboursement)
- [ ] Numérotation factures : préfixe `SOLU-2026-` configuré dans Stripe
