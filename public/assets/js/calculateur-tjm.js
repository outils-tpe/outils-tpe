/* outils-tpe.fr — Calculateur de TJM freelance
   Calcul 100 % côté client, aucune donnée envoyée.
   Les taux sont isolés par année dans `rates2026` (maintenance ~5 min/an). */

(function () {
  'use strict';

  // --- Config des taux par activité (année 2026) ---
  // Source : fiche produit. À dupliquer en rates2027 le moment venu.
  const rates2026 = {
    bnc:         { cotis: 0.256, cfp: 0.002, vl: 0.022, plafondMicro: 83600,  seuilTVA: 37500 },
    servicesBIC: { cotis: 0.212, cfp: 0.003, vl: 0.017, plafondMicro: 83600,  seuilTVA: 37500 },
    venteBIC:    { cotis: 0.123, cfp: 0.001, vl: 0.010, plafondMicro: 203100, seuilTVA: 85000 }
  };

  const form = document.getElementById('calc-tjm');
  if (!form) return;

  // --- Helpers ---
  // Lit un champ numérique, renvoie un nombre >= 0 (0 si vide ou invalide)
  function num(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseFloat(String(el.value).replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : 0;
  }

  function bool(id) {
    const el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function euros(n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €';
  }

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  // --- Calcul ---
  function calculer() {
    const activite = (document.getElementById('activite') || {}).value || 'bnc';
    const rate = rates2026[activite] || rates2026.bnc;

    const revenuNetMensuel = num('revenu-net');
    const fraisMensuels     = num('frais');
    const provisionMensuelle = num('provision');
    const semainesConges    = num('conges');
    const partNonFac        = num('non-fac');     // %
    const joursFeries       = num('feries');
    const marge             = num('marge');       // %
    const versementLib      = bool('vl');
    const acre              = bool('acre');

    // Taux prélevés sur le chiffre d'affaires
    const cotis = acre ? rate.cotis * 0.5 : rate.cotis;       // ACRE : exonération 50 %
    const tauxSurCA = cotis + rate.cfp + (versementLib ? rate.vl : 0);

    const netCibleAnnuel = revenuNetMensuel * 12;
    const fraisAnnuels    = (fraisMensuels + provisionMensuelle) * 12;

    // CA nécessaire pour que (CA − prélèvements sur CA − frais) = net cible
    const caPlancher = (1 - tauxSurCA) > 0
      ? (netCibleAnnuel + fraisAnnuels) / (1 - tauxSurCA)
      : 0;

    // Jours facturables dans l'année (arrondi pour un décompte lisible)
    const joursTravailles = 365 - 104 - joursFeries - (semainesConges * 5);
    let joursFacturables = Math.round(joursTravailles * (1 - partNonFac / 100));
    if (joursFacturables < 1) joursFacturables = 0;

    const tjmPlancher   = joursFacturables > 0 ? caPlancher / joursFacturables : 0;
    const tjmRecommande = tjmPlancher * (1 + marge / 100);
    const caAnnuel      = tjmRecommande * joursFacturables;
    const caMensuel     = caAnnuel / 12;

    // --- Décomposition d'une journée facturée au TJM recommandé ---
    const partCotis  = tjmRecommande * cotis;
    const partCfp    = tjmRecommande * rate.cfp;
    const partImpot  = tjmRecommande * (versementLib ? rate.vl : 0);
    const partFrais  = joursFacturables > 0 ? fraisAnnuels / joursFacturables : 0;
    const partNet    = tjmRecommande - partCotis - partCfp - partImpot - partFrais;

    afficher({
      tjmRecommande, tjmPlancher, caAnnuel, caMensuel, joursFacturables,
      partNet, partCotis, partCfp, partImpot, partFrais,
      caAlerteTVA: caAnnuel > rate.seuilTVA,
      caAlertePlafond: caAnnuel > rate.plafondMicro,
      activite, versementLib
    });
  }

  // --- Affichage ---
  function afficher(r) {
    setText('r-tjm-reco', euros(r.tjmRecommande));
    setText('r-tjm-plancher', euros(r.tjmPlancher));
    setText('r-ca-annuel', euros(r.caAnnuel));
    setText('r-ca-mensuel', euros(r.caMensuel));
    setText('r-jours-fac', String(r.joursFacturables));

    // Barre de décomposition (largeurs en % du TJM recommandé)
    const total = r.tjmRecommande > 0 ? r.tjmRecommande : 1;
    const pct = (v) => Math.max(0, (v / total) * 100).toFixed(1) + '%';

    setWidth('bd-net', pct(r.partNet));
    setWidth('bd-cotis', pct(r.partCotis));
    setWidth('bd-cfp', pct(r.partCfp + r.partImpot));   // CFP + impôt regroupés visuellement
    setWidth('bd-frais', pct(r.partFrais));

    setText('bdv-net', euros(r.partNet));
    setText('bdv-cotis', euros(r.partCotis));
    setText('bdv-cfp', euros(r.partCfp + r.partImpot));
    setText('bdv-frais', euros(r.partFrais));

    // Alertes
    toggle('alerte-tva', r.caAlerteTVA);
    toggle('alerte-plafond', r.caAlertePlafond);

    // CTA contextuels (liens d'affiliation à brancher — voir HTML)
    const estService = r.activite === 'servicesBIC' || r.activite === 'bnc';
    toggle('cta-service', estService);
    toggle('cta-tva', r.caAlerteTVA || r.caAlertePlafond);
  }

  function setWidth(id, w) {
    const el = document.getElementById(id);
    if (el) el.style.width = w;
  }

  function toggle(id, show) {
    const el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  // Recalcul instantané à chaque changement, sans bouton « Calculer »
  form.addEventListener('input', calculer);
  form.addEventListener('change', calculer);

  // Premier rendu
  calculer();
})();
