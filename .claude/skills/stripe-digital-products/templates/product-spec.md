# Fiche produit — À remplir avant création Stripe

Copier ce fichier, renommer en `[slug]-spec.md`, remplir tous les champs.

---

## Identité du produit

| Champ | Valeur |
|---|---|
| `product_slug` | ex: `tresorerie-electricien-v2` |
| Nom affiché Stripe | ex: "Suivi de trésorerie Électricien - Version complète" |
| Description courte | ex: "Fichier Excel 12 mois, catégories métier, tableaux de bord" |
| Prix (HT = TTC en AE) | ex: 29 € |
| Métier cible | ex: electricien |
| Version | ex: v2.1 |

## Fichier à livrer

| Champ | Valeur |
|---|---|
| Chemin dans R2 | ex: `electricien/tresorerie-v2.zip` |
| `file_key` | (même valeur, utilisée dans les métadonnées Checkout) |
| Contenu du ZIP | ex: fichier vierge + fichier exemple + guide démarrage |
| Taille approximative | ex: 2,3 Mo |

## Page de vente associée

| Champ | Valeur |
|---|---|
| URL sur outils-tpe.fr | ex: `/electricien` |
| Bouton d'achat | Payment Link ou Checkout Session |
| `success_url` | ex: `https://outils-tpe.fr/merci?session_id={CHECKOUT_SESSION_ID}` |
| `cancel_url` | ex: `https://outils-tpe.fr/electricien` |

## Email de livraison

| Champ | Valeur |
|---|---|
| Objet | ex: "Votre fichier Excel Électricien est prêt" |
| Personnalisation | Nom du client depuis `customer_details.name` |
| Validité du lien | 72h (défaut) |

## Notes spécifiques

(Particularités de ce produit, contenu du ZIP, instructions d'utilisation à inclure dans l'email, etc.)
