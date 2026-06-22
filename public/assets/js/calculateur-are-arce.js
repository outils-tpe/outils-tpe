/* ============================================================
   outils-tpe.fr – Calculateur ARE vs ARCE (créateur d'entreprise)
   Vanilla JS, zéro backend, calcul instantané.

   RÈGLES VÉRIFIÉES SUR SOURCES OFFICIELLES (juin 2026) :
   - ARCE = 60 % du reliquat des droits ARE restants (droits ouverts
     après le 1er juillet 2023), MOINS 3 % de participation au
     financement des retraites complémentaires, versée en 2 fois
     (50 % au démarrage, 50 % six mois plus tard). ACRE obligatoire.
     Sources : France Travail (fiche ARCE), Unédic (fiche ARCE).
   - Maintien de l'ARE (cumul création) : allocation mensuelle réduite.
     Nombre de jours indemnisés = arrondi[(ARE mensuelle − 70 % du
     revenu mensuel brut) / allocation journalière]. Les jours non
     indemnisés ne sont pas perdus (report de la fin des droits).
     DEPUIS LE 1er AVRIL 2025 : le cumul est plafonné à 60 % du
     reliquat des droits à la date de création ; au-delà, les 40 %
     restants ne sont mobilisables que sur demande à l'IPR.
     Sources : France Travail, Unédic (fiche Cumul ARE-rémunération,
     avril 2025).
   - Micro-entrepreneur : la rémunération prise en compte est le
     revenu retenu pour l'impôt sur le revenu, soit le chiffre
     d'affaires APRÈS abattement forfaitaire (71 % vente, 50 %
     services BIC, 34 % libéral BNC).
   ============================================================ */

(function () {
  'use strict';

  // --- Config par année (à revérifier chaque année auprès de France Travail) ---
  const CFG = {
    annee: 2026,
    tauxArce: 0.60,          // 60 % du reliquat
    prelevementArce: 0.03,   // 3 % retraites complémentaires sur le capital ARCE
    tauxCumul: 0.70,         // 70 % du revenu déduit de l'ARE mensuelle
    plafondMaintien: 0.60,   // maintien plafonné à 60 % du reliquat (depuis 01/04/2025)
    joursMois: 30,           // convention « mois plein » pour l'ARE mensuelle
    joursParMois: 30.42,     // 365/12 – conversion reliquat mois <-> jours et horizon
    abattement: {            // abattement forfaitaire micro (part NON prise en compte)
      vente: 0.71,
      servicesBIC: 0.50,
      liberalBNC: 0.34
    }
  };

  const eur = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  });
  const fmt = (n) => eur.format(Math.round(n));

  // --- Récupération des éléments ---
  const $ = (id) => document.getElementById(id);
  const els = {
    are: $('a-are'),
    reliquat: $('a-reliquat'),
    reliquatUnit: $('a-reliquat-unit'),
    statut: $('a-statut'),
    grpMicro: $('a-grp-micro'),
    grpSociete: $('a-grp-societe'),
    ca: $('a-ca'),
    activite: $('a-activite'),
    remu: $('a-remu'),
    unknown: $('a-unknown'),
    grpRevenu: $('a-grp-revenu'),
    horizon: $('a-horizon'),
    // sorties
    reco: $('a-reco'),
    cellArce: $('a-cell-arce'),
    cellMaintien: $('a-cell-maintien'),
    arceVal: $('a-arce-val'),
    maintienVal: $('a-maintien-val'),
    maintienLabel: $('a-maintien-label'),
    rReliquat: $('a-r-reliquat'),
    rEnveloppe: $('a-r-enveloppe'),
    rAreMens: $('a-r-are-mens'),
    rMaintienMens: $('a-r-maintien-mens'),
    rArceV: $('a-r-arce-v'),
    rDuree: $('a-r-duree'),
    alertBas: $('a-alert-bas'),
    alertHaut: $('a-alert-haut'),
    scenarios: $('a-scenarios'),
    scenariosBody: $('a-scenarios-body')
  };

  let horizonTouched = false;

  // --- Lecture des entrées ---
  function lireEntrees() {
    const are = parseFloat(els.are.value) || 0;

    let reliquatJours = parseFloat(els.reliquat.value) || 0;
    if (els.reliquatUnit.value === 'mois') {
      reliquatJours = Math.round(reliquatJours * CFG.joursParMois);
    }

    const statut = els.statut.value; // 'micro' | 'societe'
    const unknown = els.unknown.checked;

    // Revenu mensuel pris en compte par France Travail
    let revenu = 0;
    if (statut === 'micro') {
      const ca = parseFloat(els.ca.value) || 0;
      const ab = CFG.abattement[els.activite.value] ?? 0.50;
      revenu = ca * (1 - ab); // CA après abattement = revenu retenu pour l'IR
    } else {
      revenu = parseFloat(els.remu.value) || 0; // rémunération brute
    }

    return { are, reliquatJours, statut, unknown, revenu };
  }

  // --- ARCE : 60 % du reliquat, moins 3 % ---
  function calcArce(reliquatTotal) {
    const brut = reliquatTotal * CFG.tauxArce;
    const net = brut * (1 - CFG.prelevementArce);
    return { brut, net, versement: net / 2 };
  }

  // --- Maintien ARE : allocation mensuelle réduite ---
  function maintienMensuel(are, revenu) {
    const areMensuelle = are * CFG.joursMois;
    // Formule officielle : jours indemnisés = arrondi[(ARE mens − 0,70×revenu) / AJ]
    let jours = Math.round((areMensuelle - CFG.tauxCumul * revenu) / are);
    jours = Math.max(0, Math.min(CFG.joursMois, jours));
    return { areMensuelle, jours, montant: jours * are };
  }

  function maintienTotal(are, reliquatTotal, revenu, horizonMois) {
    const m = maintienMensuel(are, revenu);
    const enveloppe = reliquatTotal * CFG.plafondMaintien; // plafond 60 %
    const brutHorizon = m.montant * horizonMois;
    const total = Math.min(brutHorizon, enveloppe);
    const plafondAtteint = brutHorizon >= enveloppe && m.montant > 0;
    const moisEnveloppe = m.montant > 0 ? enveloppe / m.montant : Infinity;
    return {
      mensuel: m.montant, jours: m.jours, areMensuelle: m.areMensuelle,
      enveloppe, total, plafondAtteint, moisEnveloppe
    };
  }

  // --- Horizon suggéré (durée du reliquat) ---
  function horizonSuggere(reliquatJours) {
    return Math.max(1, Math.round(reliquatJours / CFG.joursParMois));
  }

  // --- Rendu principal ---
  function render() {
    const e = lireEntrees();

    // Bascule des groupes de saisie
    const micro = e.statut === 'micro';
    els.grpMicro.hidden = !micro;
    els.grpSociete.hidden = micro;
    els.grpRevenu.style.opacity = e.unknown ? '.45' : '1';
    els.ca.disabled = e.unknown;
    els.remu.disabled = e.unknown;
    els.activite.disabled = e.unknown;
    els.scenarios.hidden = !e.unknown;

    // Horizon (auto tant que l'utilisateur n'y a pas touché)
    if (!horizonTouched && e.reliquatJours > 0) {
      els.horizon.value = horizonSuggere(e.reliquatJours);
    }
    const horizonMois = Math.max(1, parseInt(els.horizon.value, 10) || horizonSuggere(e.reliquatJours));

    // Garde-fou : entrées insuffisantes
    if (e.are <= 0 || e.reliquatJours <= 0) {
      els.reco.innerHTML = 'Renseignez votre <b>allocation journalière</b> et votre <b>reliquat de droits</b> pour comparer les deux aides.';
      els.arceVal.textContent = '–';
      els.maintienVal.textContent = '–';
      [els.rReliquat, els.rEnveloppe, els.rAreMens, els.rMaintienMens, els.rArceV, els.rDuree].forEach((x) => { x.textContent = '–'; });
      els.cellArce.classList.remove('calc-duo__cell--reco');
      els.cellMaintien.classList.remove('calc-duo__cell--reco');
      els.alertBas.hidden = true;
      els.alertHaut.hidden = true;
      return;
    }

    const reliquatTotal = e.are * e.reliquatJours;
    const arce = calcArce(reliquatTotal);

    els.maintienLabel.textContent = 'Maintien sur ' + horizonMois + ' mois';

    // Lignes communes
    els.rReliquat.textContent = fmt(reliquatTotal) + ' (' + e.reliquatJours + ' j)';
    els.rEnveloppe.textContent = fmt(reliquatTotal * CFG.plafondMaintien);
    els.rArceV.textContent = '2 × ' + fmt(arce.versement);
    els.arceVal.textContent = fmt(arce.net);

    if (e.unknown) {
      // --- Mode 3 scénarios (revenu inconnu) ---
      renderScenarios(e.are, reliquatTotal, horizonMois);
      // Le duo affiche le scénario « moyen »
      const moyen = maintienTotal(e.are, reliquatTotal, 0.75 * (e.are * CFG.joursMois), horizonMois);
      els.maintienVal.textContent = fmt(moyen.total);
      els.rAreMens.textContent = fmt(e.are * CFG.joursMois);
      els.rMaintienMens.textContent = '≈ ' + fmt(moyen.mensuel) + ' (scénario moyen)';
      els.rDuree.textContent = moyen.plafondAtteint
        ? 'plafond atteint vers ' + Math.round(moyen.moisEnveloppe) + ' mois'
        : 'non atteint sur l\'horizon';
      els.reco.innerHTML = 'Saisissez un revenu pour une comparaison précise. En attendant, voici trois scénarios : '
        + '<strong>plus vos revenus prévisionnels sont bas, plus le maintien est intéressant</strong> '
        + '(il verse davantage chaque mois et préserve un filet de sécurité).';
      majHighlight(arce.net, moyen.total);
      els.alertBas.hidden = false;
      els.alertHaut.hidden = true;
      return;
    }

    // --- Mode revenu connu ---
    const maintien = maintienTotal(e.are, reliquatTotal, e.revenu, horizonMois);
    els.maintienVal.textContent = fmt(maintien.total);
    els.rAreMens.textContent = fmt(maintien.areMensuelle);
    els.rMaintienMens.textContent = maintien.mensuel > 0
      ? '≈ ' + fmt(maintien.mensuel) + ' (' + maintien.jours + ' j/mois)'
      : '0 € (revenus trop élevés)';
    els.rDuree.textContent = (maintien.mensuel <= 0)
      ? '–'
      : (maintien.plafondAtteint
        ? 'plafond 60 % atteint vers ' + Math.round(maintien.moisEnveloppe) + ' mois'
        : 'enveloppe non épuisée sur l\'horizon');

    majHighlight(arce.net, maintien.total);
    renderReco(arce, maintien, horizonMois, e);
  }

  // --- Surligne la cellule la plus avantageuse ---
  function majHighlight(arceNet, maintienTot) {
    const arceMieux = arceNet >= maintienTot;
    els.cellArce.classList.toggle('calc-duo__cell--reco', arceMieux);
    els.cellMaintien.classList.toggle('calc-duo__cell--reco', !arceMieux);
  }

  // --- Recommandation contextualisée ---
  function renderReco(arce, maintien, horizonMois, e) {
    let html;

    if (maintien.mensuel <= 0) {
      html = 'Avec vos revenus prévisionnels, l\'allocation mensuelle tomberait à <b>0 €</b> : '
        + 'le maintien ne vous verserait rien. <strong>L\'ARCE</strong> (capital de '
        + fmt(arce.net) + ') est alors la seule aide qui vous rapporte quelque chose.';
      els.alertBas.hidden = true;
      els.alertHaut.hidden = false;
    } else if (arce.net >= maintien.total) {
      const ecart = arce.net - maintien.total;
      html = 'Sur votre horizon de <b>' + horizonMois + ' mois</b>, l\'<strong>ARCE</strong> '
        + 'rapporte davantage en argent reçu : <b>' + fmt(arce.net) + '</b> contre '
        + fmt(maintien.total) + ' en maintien (écart de ' + fmt(ecart) + '). '
        + 'Intéressant si vous avez besoin de trésorerie pour démarrer. '
        + 'Mais l\'ARCE consomme vos droits en capital, tandis que le maintien garde un filet mensuel.';
      els.alertBas.hidden = true;
      els.alertHaut.hidden = false;
    } else {
      const ecart = maintien.total - arce.net;
      html = 'Sur votre horizon de <b>' + horizonMois + ' mois</b>, le <strong>maintien de l\'ARE</strong> '
        + 'rapporte au moins autant : <b>' + fmt(maintien.total) + '</b> contre '
        + fmt(arce.net) + ' en ARCE (écart de ' + fmt(ecart) + '), '
        + 'tout en préservant un revenu mensuel et vos droits (chaque jour non indemnisé recule la fin de vos droits).';
      els.alertBas.hidden = false;
      els.alertHaut.hidden = true;
    }
    els.reco.innerHTML = html;
  }

  // --- Tableau 3 scénarios ---
  function renderScenarios(are, reliquatTotal, horizonMois) {
    const areMensuelle = are * CFG.joursMois;
    const scen = [
      { nom: 'Revenus bas', revenu: 0.25 * areMensuelle },
      { nom: 'Revenus moyens', revenu: 0.75 * areMensuelle },
      { nom: 'Revenus élevés', revenu: 1.5 * areMensuelle }
    ];
    const arceNet = reliquatTotal * CFG.tauxArce * (1 - CFG.prelevementArce);
    let rows = '';
    scen.forEach((s) => {
      const m = maintienTotal(are, reliquatTotal, s.revenu, horizonMois);
      const gagnant = m.total > arceNet ? 'Maintien' : 'ARCE';
      rows += '<tr><td>' + s.nom + '<br><span style="opacity:.6">≈ ' + fmt(s.revenu) + '/mois</span></td>'
        + '<td><b>' + fmt(m.total) + '</b></td>'
        + '<td>' + gagnant + '</td></tr>';
    });
    els.scenariosBody.innerHTML = rows;
  }

  // --- Écoute ---
  function bind() {
    [els.are, els.reliquat, els.reliquatUnit, els.statut, els.ca, els.activite, els.remu, els.unknown]
      .forEach((el) => {
        el.addEventListener('input', render);
        el.addEventListener('change', render);
      });
    els.horizon.addEventListener('input', function () { horizonTouched = true; render(); });
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Exposé pour tests éventuels (non utilisé en prod)
  window.__areArce = { CFG, calcArce, maintienMensuel, maintienTotal, horizonSuggere };
})();
