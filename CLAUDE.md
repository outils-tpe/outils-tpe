# CLAUDE.md - Projet outils-tpe.fr

## Contexte du projet

outils-tpe.fr est un site web proposant des outils de gestion gratuits (calculateurs interactifs) et des templates Excel payants, ciblés par métier pour les TPE françaises (4,3 millions d'entreprises, 96% du tissu entrepreneurial).

Le site est opéré sous un nom de marque anonyme, sans lien avec Solumatic. Le statut juridique est auto-entrepreneur.

## Stack technique

- **Site** : HTML/CSS/JS statique, hébergé sur Vercel
- **Paiement** : Stripe (Payment Links + Checkout + Invoicing)
- **Email** : Sender (gratuit jusqu'à 2 500 contacts, 15 000 emails/mois)
- **Automatisations** : Make (phase 2)
- **Analytics** : Plausible ou Umami (RGPD-friendly)
- **Domaine** : outils-tpe.fr
- **Repo** : GitHub, déploiement auto via Vercel sur chaque push

## Architecture du site : modèle par type d'outil (pivot contenu + affiliation)

> Source de vérité : page Notion « 🧭 Architecture cible du site (hub outils + guides + boutique) ». Le site a pivoté d'un modèle centré métier vers un hub d'outils + guides avec une petite boutique de modèles Excel. Principe : on garde le socle technique, on change le centre de gravité.

### Principe fondamental
L'entrée se fait par le TYPE d'outil, pas par le métier. Quatre familles, clairement séparées dans la navigation :
1. **Calculateurs** (gratuits) : porte d'entrée du trafic SEO, monétisée par affiliation. C'est le moteur.
2. **Comparateurs** (gratuits) : comparatifs de services (comptes pro, outils de gestion), à forte intention transactionnelle, monétisés par affiliation.
3. **Modèles Excel** (version gratuite + version complète payante) : boutique, ligne secondaire.
4. **Guides** : contenu SEO informationnel qui alimente calculateurs, comparateurs et modèles.

Le métier n'est PLUS une entrée de navigation. Beaucoup d'outils sont universels (ex. le calculateur de TJM). Le métier reste une couche d'agrégation SEO **secondaire**, créée au cas par cas uniquement quand il existe du contenu réellement spécifique au métier. On ne compte donc PAS sur le menu pour guider le visiteur : il arrive par le SEO sur une page profonde, qu'on rend **auto-suffisante** (bon CTA + maillage interne contextuel). Le menu sert surtout à rassurer et à donner une structure lisible à Google.

### Structure des URLs

```
outils-tpe.fr/
├── / (accueil) — oriente vers les 4 familles + outils phares
├── /calculateurs                (hub) liste des calculateurs
│   └── /calculateur-[sujet]     ex. /calculateur-tjm-freelance
├── /comparateurs                (hub) liste des comparatifs
│   └── /comparateur-[sujet]     ex. /comparateur-comptes-pro
├── /modeles                     (hub boutique) liste des modèles Excel
│   ├── /electricien             page produit (suivi trésorerie) — slug conservé
│   ├── /plombier
│   ├── /coiffeur
│   └── /auto-entrepreneur
├── /guides                      (hub) liste des guides
│   └── /guides/[slug]
├── /sur-mesure
├── /mentions-legales, /cgv, /politique-confidentialite
```

Note : les pages métier existantes (`/electricien`, `/plombier`, `/coiffeur`, `/auto-entrepreneur`) **gardent leur slug** (elles rankent) et sont rattachées à la boutique « Modèles ». On ne les réécrit pas, on les relie à la nouvelle nav.

### Page d'accueil
Oriente vers les 4 familles (cartes Calculateurs / Comparateurs / Modèles / Guides) + une section « les plus utilisés » mettant en avant 2-3 outils concrets. Pas de surcharge de CTA.

### Règle d'or : un objectif par page
Chaque page poursuit un seul objectif primaire (empiler achat Excel + liens affiliés + capture email tue les trois conversions) :
- **Calculateur** → clic affilié (ou capture email) : 1 CTA hub comparateur compte pro + 1-2 CTA affiliés contextuels + lien vers le guide. Pas de bouton d'achat Excel.
- **Comparateur** → clic affilié : liens affiliés vers les services comparés (compte pro, etc.) + maillage vers calculateurs/guides. Pas de bouton d'achat Excel.
- **Guide** → envoyer vers l'outil/produit pertinent : 1 CTA principal (calculateur OU modèle) + affiliés contextuels.
- **Modèle Excel (produit)** → vendre le fichier : bouton Stripe + lien vers le guide associé. Pas de liens affiliés concurrents du produit.
- **Accueil** → orienter vers les 4 familles.

### Pages produit (modèles Excel — pages de conversion)
Structure type d'une page produit (ex. /electricien) :
1. Titre et sous-titre orientés produit (« Suivi de trésorerie [métier] »)
2. Section version gratuite : description, screenshots, bouton télécharger (capture email)
3. Section version complète : screenshots, bouton acheter (Stripe Payment Link)
4. Comparatif gratuit/complet
5. FAQ
6. Liens vers les métiers proches (maillage contextuel) + retour vers le hub /modeles

## Règles de design

- **Langue** : Français uniquement
- **Mobile-first** : Toutes les pages doivent être responsive, mobile en priorité
- **Couleurs** : Bleu foncé (#1e3a5f) + blanc (#ffffff) + vert accent (#22c55e)
- **Typographie** : Clean, sans-serif (Inter ou similaire via Google Fonts)
- **Ton éditorial** : Simple, direct, pas de jargon technique. On s'adresse à des artisans et petits patrons, pas à des développeurs.
- **Pas de design générique "template AI"** : chaque page doit sembler professionnelle et soignée

## Navigation

### Header (toutes les pages)
```
[Logo outils-tpe.fr]  Calculateurs  Modèles  Guides  Sur mesure
```
L'entrée se fait par type d'outil. « Guides » est déjà dans le menu mais pointe pour l'instant vers une page « bientôt » (premier guide en préparation).

### Footer (toutes les pages)
```
Outils : Calculateurs | Modèles Excel | Guides
Le site : Sur mesure | Mentions légales | CGV | Confidentialité
```
Pas encore de mention d'affiliation globale dans le footer (aucun programme partenaire actif). À ajouter quand l'affiliation sera en place.

## Règles SEO (IMPORTANT)

### Balises
- Chaque page a un `<title>` unique, format : "Outils de gestion [Métier] - Trésorerie, devis, calcul gratuit | outils-tpe.fr"
- Chaque page a une `<meta description>` unique (150-160 caractères)
- Chaque page a une balise `<link rel="canonical">` pointant vers elle-même
- Structure de headings : un seul H1 par page, puis H2, H3 en hiérarchie logique

### Schema markup
- JSON-LD sur chaque page métier : FAQPage schema pour la FAQ, Product schema pour le template payant
- JSON-LD sur la page d'accueil : WebSite schema + Organization schema

### Sitemap
- Générer un sitemap.xml à la racine, mis à jour à chaque ajout de page
- Fichier robots.txt autorisant tout le crawl sauf /files/

### Maillage interne
- **Calculateur > guide + hub comparateur** : chaque calculateur renvoie vers son guide et (à terme) vers le hub comparateur de comptes pro
- **Guide > calculateur/modèle** : chaque guide renvoie vers l'outil ou le modèle pertinent
- **Modèle Excel > guide + calculateur** : cross-sell vers le guide et le calculateur associés
- **Hubs (/calculateurs, /modeles, /guides)** : listent les pages de leur famille
- **Footer** : liens vers les 3 familles + pages légales

### Performance
- Le site est statique, donc naturellement rapide
- Optimiser les images (WebP, lazy loading, alt text descriptif)
- Pas de JS bloquant le rendu

## Calculateurs

Les calculateurs sont en JavaScript côté client (pas de backend). Ils doivent :
- Afficher le résultat instantanément (pas de bouton "Calculer" si possible)
- Être mobile-first
- Utiliser des champs de formulaire clairs avec des labels en français
- Afficher les résultats de manière visuelle (graphiques simples si pertinent)
- Être intégrés directement dans la page métier correspondante (pas sur une page séparée)
- Inclure un CTA en bas du résultat : "Téléchargez le fichier Excel complet pour suivre ça tous les mois"

## Monétisation

### Templates Excel - Livraison
Pour chaque métier, le client reçoit 2 fichiers :
- `Suivi_Tresorerie_[Metier]_VOTRE_FICHIER.xlsx` : fichier vierge, catégories pré-paramétrées selon le métier
- `Suivi_Tresorerie_[Metier]_EXEMPLE.xlsx` : fichier identique pré-rempli avec 12 mois de données réalistes du métier

Le fichier vierge contient un onglet "Démarrage rapide" avec 5 lignes fictives pour que les récaps ne soient pas vides à l'ouverture.

### Pricing
- Version light gratuite : contre email (via formulaire Sender)
- Version complète payante : via Stripe Payment Link (19-39 euros)
- Bundles par métier : 59-89 euros

### Dans les fichiers Excel gratuits
- Inclure des onglets avec des screenshots du fichier payant + lien d'achat direct
- Dernier onglet : mention "Besoin d'un fichier adapté ?" + lien vers /sur-mesure

### Affiliation
- Section "Outils recommandés" sur chaque page métier avec liens affiliés (Qonto, Shine, Pennylane, Indy, etc.)
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
├── CLAUDE.md                     (ce fichier)
├── PLANNING.md                   (architecture et décisions)
├── TASK.md                       (tâches en cours)
├── README.md
├── vercel.json
├── public/                       (le site, déployé par Vercel)
│   ├── index.html                (page d'accueil - grille de métiers)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── calculateurs/
│   ├── images/
│   ├── electricien/
│   │   └── index.html            (page métier complète)
│   ├── plombier/
│   │   └── index.html
│   ├── auto-entrepreneur/
│   │   └── index.html
│   ├── coiffeur/
│   │   └── index.html
│   ├── restaurant/
│   │   └── index.html
│   ├── blog/
│   ├── sur-mesure/
│   │   └── index.html
│   ├── a-propos/
│   │   └── index.html
│   ├── mentions-legales.html
│   ├── politique-confidentialite.html
│   └── files/                    (fichiers Excel téléchargeables, chemin non devinable)
│       └── dl-ae-treso-[hash].xlsx
└── templates-excel/              (fichiers Excel source, PAS en ligne)
    ├── tresorerie-electricien.xlsx
    └── ...
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
- Messages de commit en français, descriptifs (ex: "Ajout page métier électricien avec trésorerie")
- Push sur main, Vercel déploie automatiquement

## Règles de comportement

- **Toujours vérifier** les barèmes fiscaux et sociaux avant de les coder dans un calculateur (les taux changent chaque année)
- **Ne jamais inventer** de données chiffrées
- **Demander** si un choix de design ou d'architecture n'est pas clair
- **Ne pas supprimer** de fichiers existants sans demander
- **Toujours maintenir** le sitemap.xml à jour quand une page est ajoutée
- **Toujours maintenir la cohérence** entre toutes les pages (header, footer, design, navigation)
- **Vérifier le maillage interne** à chaque ajout de page (liens entre pages métier, blog, footer)

## Mémoire et continuité des sessions

L'utilisateur travaille depuis VS Code et chaque conversation repart de zéro. Pour éviter de perdre le contexte :

- **Après chaque réponse où du code a été modifié ou une décision prise**, mettre à jour le fichier mémoire concerné dans `C:\Users\Thomas\.claude\projects\D--Professionnel-Projets-divers-VS-Code-Outils-TPE-outils-tpe\memory\`
- Mettre à jour en priorité `project_stripe_module.md` : section "Ce qui vient d'être fait" et "Prochaine étape immédiate"
- **En début de session** : lire les fichiers mémoire et faire un résumé de l'état actuel sans attendre que l'utilisateur demande
- L'utilisateur peut dire "reprends la conversation" pour déclencher ce résumé explicitement
