# CLAUDE.md - Projet outils-tpe.fr

## Contexte du projet

outils-tpe.fr est un site web proposant des outils de gestion gratuits (calculateurs interactifs) et des templates Excel payants, ciblés par métier pour les TPE françaises (4,3 millions d'entreprises, 96% du tissu entrepreneurial).

Le site est opéré sous un nom de marque anonyme, sans lien avec Solumatic. Le statut juridique est auto-entrepreneur.

## Stack technique

- **Site** : HTML/CSS/JS statique, hébergé sur Vercel
- **Paiement** : Stripe (Payment Links + Checkout + Invoicing)
- **Email** : Mailerlite (capture, séquences)
- **Automatisations** : Make (phase 2)
- **Analytics** : Plausible ou Umami (RGPD-friendly)
- **Domaine** : outils-tpe.fr
- **Repo** : GitHub, déploiement auto via Vercel sur chaque push

## Architecture du site : modèle Hub & Spoke

### Structure des URLs

```
outils-tpe.fr/
├── / (accueil)
├── /tresorerie (hub)
│   ├── /tresorerie/electricien (LP métier)
│   ├── /tresorerie/plombier
│   ├── /tresorerie/coiffeur
│   ├── /tresorerie/restaurant
│   └── /tresorerie/auto-entrepreneur
├── /devis (hub)
│   ├── /devis/electricien
│   └── /devis/plombier
├── /calculateurs (hub)
│   ├── /calculateurs/charges-auto-entrepreneur
│   ├── /calculateurs/marge-artisan
│   └── /calculateurs/cout-revient-restaurant
├── /gestion (hub)
│   ├── /gestion/salon-coiffure
│   └── /gestion/restaurant
├── /blog
├── /sur-mesure
└── /a-propos
```

### Pages hub
Pages de navigation, pas de vente. Elles présentent le problème + grille de cartes par métier avec un bouton "Voir l'outil".

### Landing pages métier (LP)
Pages de conversion. Chaque LP contient :
1. Un calculateur interactif intégré (JS côté client, résultat instantané)
2. Du contenu SEO (800-1200 mots)
3. Des screenshots du template Excel
4. Un CTA vers le template gratuit (contre email) et le template payant (Stripe Payment Link)
5. Une FAQ en bas (cible les "People Also Ask" de Google)
6. Des liens vers les métiers proches ("Vous êtes plombier ?")
7. Une section "Autres outils pour les [métier]" (ventes croisées)
8. Un lien retour vers le hub parent
9. Une section "Outils recommandés" avec liens affiliés

## Règles de design

- **Langue** : Français uniquement
- **Mobile-first** : Toutes les pages doivent être responsive, mobile en priorité
- **Couleurs** : Bleu foncé (#1e3a5f) + blanc (#ffffff) + vert accent (#22c55e)
- **Typographie** : Clean, sans-serif (Inter ou similaire via Google Fonts)
- **Ton éditorial** : Simple, direct, pas de jargon technique. On s'adresse à des artisans et petits patrons, pas à des développeurs. Tutoiement ou vouvoiement formel selon le contexte.
- **Pas de design générique "template AI"** : chaque page doit sembler professionnelle et soignée

## Règles SEO (IMPORTANT)

### Balises
- Chaque page a un `<title>` unique, format : "[Sujet] [Métier] - Outil gratuit + Fichier Excel | outils-tpe.fr"
- Chaque page a une `<meta description>` unique (150-160 caractères)
- Chaque page a une balise `<link rel="canonical">` pointant vers elle-même
- Structure de headings : un seul H1 par page, puis H2, H3 en hiérarchie logique

### Schema markup
- JSON-LD sur chaque LP : FAQPage schema pour la FAQ, Product schema pour le template payant
- JSON-LD sur la page d'accueil : WebSite schema + Organization schema

### Sitemap
- Générer un sitemap.xml à la racine, mis à jour à chaque ajout de page
- Fichier robots.txt autorisant tout le crawl

### Maillage interne
- **Vertical** : chaque hub lie vers ses LP, chaque LP lie vers son hub parent
- **Horizontal** : chaque LP lie vers les LP du même métier (ex: /tresorerie/electricien → /devis/electricien)
- **Blog → LP** : chaque article de blog contient 2-3 liens vers des LP pertinentes
- **LP → Blog** : section "Articles liés" en bas de chaque LP

### Performance
- Le site est statique, donc naturellement rapide
- Optimiser les images (WebP, lazy loading, alt text descriptif)
- Pas de JS bloquant le rendu

## Navigation

### Header (toutes les pages)
```
[Logo outils-tpe.fr]  Trésorerie  Devis  Calculateurs  Gestion  Blog  [Bouton: Sur mesure]
```
5-6 liens max. Pas de méga-menu.

### Footer (toutes les pages)
```
Trésorerie : Électricien | Plombier | Coiffeur | Restaurant | Auto-entrepreneur
Devis : Électricien | Plombier | ...
Calculateurs : Charges AE | Marge artisan | Coût de revient | ...
[Newsletter] [Sur mesure] [À propos] [Mentions légales]
```

## Calculateurs

Les calculateurs sont en JavaScript côté client (pas de backend). Ils doivent :
- Afficher le résultat instantanément (pas de bouton "Calculer" si possible)
- Être mobile-first
- Utiliser des champs de formulaire clairs avec des labels en français
- Afficher les résultats de manière visuelle (graphiques simples si pertinent)
- Inclure un CTA en bas du résultat : "Téléchargez le fichier Excel complet pour suivre ça tous les mois"

## Monétisation

### Templates Excel
- Version light gratuite : contre email (via formulaire Mailerlite)
- Version complète payante : via Stripe Payment Link (19-39€)
- Bundles par métier : 59-89€

### Dans les fichiers Excel gratuits
- Inclure des onglets avec des screenshots du fichier payant + lien d'achat direct
- Dernier onglet : mention "Besoin d'un fichier adapté ?" + lien vers /sur-mesure

### Affiliation
- Section "Outils recommandés" sur chaque LP avec liens affiliés (Qonto, Shine, Pennylane, Indy, etc.)
- Intégration naturelle, pas de pub agressive

## Métiers cibles (par priorité)

1. Artisans BTP : électricien, plombier, peintre, maçon, menuisier, carreleur, couvreur
2. Restauration : restaurant, boulanger, traiteur
3. Coiffure / Esthétique : coiffeur, esthéticienne
4. Auto-entrepreneurs : services, commerce, libéral
5. Commerces de proximité

## Structure des fichiers du projet

```
outils-tpe/
├── index.html                    (page d'accueil)
├── CLAUDE.md                     (ce fichier)
├── PLANNING.md                   (architecture et décisions)
├── TASK.md                       (tâches en cours)
├── sitemap.xml                   (sitemap SEO)
├── robots.txt
├── css/
│   └── style.css                 (styles globaux)
├── js/
│   └── calculateurs/             (JS des calculateurs)
├── images/
├── tresorerie/
│   ├── index.html                (hub trésorerie)
│   ├── electricien/index.html    (LP métier)
│   ├── plombier/index.html
│   └── ...
├── devis/
│   ├── index.html                (hub devis)
│   └── ...
├── calculateurs/
│   ├── index.html                (hub calculateurs)
│   └── ...
├── gestion/
│   ├── index.html                (hub gestion)
│   └── ...
├── blog/
│   └── ...
├── sur-mesure/
│   └── index.html
└── a-propos/
    └── index.html
```

## Conventions de code

- HTML sémantique (header, nav, main, section, article, footer)
- CSS : pas de framework, CSS custom avec variables CSS pour les couleurs/typo
- JS : vanilla JS, pas de framework (le site doit rester léger et statique)
- Nommage des fichiers : kebab-case (ex: charges-auto-entrepreneur.js)
- Indentation : 2 espaces
- Commentaires en français dans le code

## Workflow Git

- Commit après chaque changement significatif
- Messages de commit en français, descriptifs (ex: "Ajout LP trésorerie électricien avec calculateur")
- Push sur main, Vercel déploie automatiquement

## Règles de comportement

- **Toujours vérifier** les barèmes fiscaux et sociaux avant de les coder dans un calculateur (les taux changent chaque année)
- **Ne jamais inventer** de données chiffrées
- **Demander** si un choix de design ou d'architecture n'est pas clair
- **Ne pas supprimer** de fichiers existants sans demander
- **Toujours maintenir** le sitemap.xml à jour quand une page est ajoutée
