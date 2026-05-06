# Facturation auto-entrepreneur — Stripe Invoicing

## Statut : franchise de TVA (art. 293 B CGI)

Tous les produits vendus sur outils-tpe.fr sont **hors TVA** (franchise en base).
- Stripe Tax : **désactivé**
- `automatic_tax.enabled` : **false** (ne pas activer)
- Taux sur tous les produits : **0%**

## Mention obligatoire sur chaque facture

```
TVA non applicable, art. 293 B du CGI
```

À placer dans `invoice_creation.invoice_data.footer` de chaque Checkout Session.

## Seuils 2026 à surveiller

| Type de vente | Seuil franchise | Statut |
|---|---|---|
| Prestations de services électroniques (produits numériques) | 37 500 € HT/an | À surveiller |
| Vente de marchandises | 85 000 € HT/an | N/A pour ce projet |

**Si le seuil de 37 500 € est approché :**
1. Contacter un comptable / AGA
2. Activer Stripe Tax avec le bon taux FR (20% TVA)
3. Modifier le footer facture
4. Déclarer et reverser la TVA collectée

## Réforme facturation B2B (septembre 2026)

- Impact : ventes B2B à des entreprises françaises uniquement
- Pour la vente B2C de produits numériques à des particuliers : **pas d'impact**
- Si volume B2B significatif se développe : étudier intégration PDP (ex: Pennylane)

## Configuration Stripe Invoicing

```json
{
  "invoice_creation": {
    "enabled": true,
    "invoice_data": {
      "footer": "TVA non applicable, art. 293 B du CGI",
      "custom_fields": [
        { "name": "SIRET", "value": "<SIRET_SOLUMATIC>" }
      ],
      "rendering_options": {
        "amount_tax_display": "exclude_tax"
      }
    }
  },
  "customer_creation": "always"
}
```

## Numérotation des factures

Préfixe Stripe configurable : `SOLU-2026-`
→ Dashboard Stripe > Settings > Invoices > Invoice numbering

## Informations société à compléter dans Stripe

- Raison sociale
- SIRET
- Adresse complète
- Email professionnel
- (optionnel) Logo pour les factures PDF
