/* outils-tpe.fr – Estimateur de trésorerie prévisionnelle (6 mois)
   Projette le solde bancaire mois par mois à partir d'entrées simples,
   trace la courbe en SVG et repère le mois de passage en négatif.
   Calcul 100 % côté client, aucune donnée envoyée ni stockée. */

(function () {
  'use strict';

  // --- Helpers ---
  // Lit un champ numérique. Renvoie le défaut si vide/invalide (les soldes et flux
  // peuvent être négatifs, on n'impose donc pas de minimum ici).
  function num(id, defaut) {
    var el = document.getElementById(id);
    if (!el || el.value === '') return (defaut === undefined ? 0 : defaut);
    var v = parseFloat(String(el.value).replace(',', '.'));
    return Number.isFinite(v) ? v : (defaut === undefined ? 0 : defaut);
  }

  // Lit un champ optionnel : renvoie null si vide (pour la saisonnalité)
  function numOpt(id) {
    var el = document.getElementById(id);
    if (!el || el.value === '') return null;
    var v = parseFloat(String(el.value).replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  }

  function euros(n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €';
  }

  // Format compact pour les graduations de l'axe Y (ex. 4,4 k€)
  function eurosAxe(n) {
    if (Math.abs(n) >= 1000) {
      return (n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' k€';
    }
    return Math.round(n) + ' €';
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  var MOIS = ['Auj.', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

  // ============================================================
  // Calcul du prévisionnel
  // ============================================================
  function calculer() {
    var solde0   = num('t-solde', 0);
    var recettes = num('t-recettes', 0);
    var fixes    = num('t-fixes', 0);
    var variables= num('t-variables', 0);
    var echeance = num('t-echeance', 0);     // échéance trimestrielle (URSSAF…)
    var horizon  = parseInt((document.getElementById('t-horizon') || {}).value, 10) || 6;

    // soldes[0] = solde de départ, puis 1 valeur par mois
    var soldes = [solde0];
    var moisNegatif = 0;                       // 0 = aucun
    for (var m = 1; m <= horizon; m++) {
      var rec = numOpt('t-m' + m);             // surcharge saisonnière éventuelle
      if (rec === null) rec = recettes;
      var ech = (m % 3 === 0) ? echeance : 0;  // mois 3, 6, 9, 12
      var flux = rec - fixes - variables - ech;
      var s = soldes[m - 1] + flux;
      soldes.push(s);
      if (s < 0 && moisNegatif === 0) moisNegatif = m;
    }

    // Statistiques (sur les mois projetés, hors solde de départ)
    var somme = 0, bas = soldes[1], idxBas = 1;
    for (var i = 1; i <= horizon; i++) {
      somme += soldes[i];
      if (soldes[i] < bas) { bas = soldes[i]; idxBas = i; }
    }
    var moyen = somme / horizon;
    var fin = soldes[horizon];

    // Sorties chiffrées
    setText('t-fin', euros(fin));
    setText('t-moyen', euros(moyen));
    setText('t-bas', euros(bas));
    setText('t-bas-mois', 'au mois ' + idxBas);

    // Verdict
    afficherVerdict(moisNegatif, fin);

    // Courbe
    dessinerCourbe(soldes, horizon, moisNegatif);
  }

  // ============================================================
  // Bandeau de verdict
  // ============================================================
  function afficherVerdict(moisNegatif, fin) {
    var box = document.getElementById('t-verdict');
    var txt = document.getElementById('t-verdict-text');
    if (!box || !txt) return;

    if (moisNegatif > 0) {
      box.className = 'tp-verdict tp-verdict--alert';
      txt.innerHTML = 'Attention : passage en négatif prévu dès le <b>mois ' + moisNegatif +
        '</b>. Anticipez dès maintenant pour éviter le découvert.';
    } else {
      box.className = 'tp-verdict tp-verdict--ok';
      txt.innerHTML = 'Trésorerie saine : votre solde reste positif sur toute la période' +
        ' (fin de période : <b>' + euros(fin) + '</b>).';
    }
  }

  // ============================================================
  // Courbe de trésorerie (SVG, tracé à la main)
  // ============================================================
  // Repère du graphe (coordonnées du viewBox)
  var VB_W = 640, VB_H = 300;
  var PAD_L = 52, PAD_R = 16, PAD_T = 18, PAD_B = 34;
  var PLOT_W = VB_W - PAD_L - PAD_R;
  var PLOT_H = VB_H - PAD_T - PAD_B;
  var Y_TOP = PAD_T;
  var Y_BOT = PAD_T + PLOT_H;

  function dessinerCourbe(soldes, horizon, moisNegatif) {
    var plot = document.getElementById('t-plot');
    if (!plot) return;

    // Bornes verticales : on inclut toujours le zéro pour que la ligne rouge soit visible
    var min = Math.min.apply(null, soldes.concat(0));
    var max = Math.max.apply(null, soldes.concat(0));
    var span = max - min || 1;
    var padV = span * 0.12;
    var yMin = min - padV;
    var yMax = max + padV;

    function px(i) { return PAD_L + (i / horizon) * PLOT_W; }
    function py(v) { return Y_BOT - ((v - yMin) / (yMax - yMin)) * PLOT_H; }

    var svgns = 'http://www.w3.org/2000/svg';
    var frag = '';

    // Ligne de zéro (référence du découvert)
    var zeroY = py(0).toFixed(1);
    frag += '<line class="tp-zero" x1="' + PAD_L + '" y1="' + zeroY +
            '" x2="' + (PAD_L + PLOT_W) + '" y2="' + zeroY + '" />';
    frag += '<text class="tp-axis-label" x="' + (PAD_L - 8) + '" y="' + (parseFloat(zeroY) + 3.5) +
            '" text-anchor="end">0 €</text>';

    // Graduations haut / bas
    frag += '<text class="tp-axis-label" x="' + (PAD_L - 8) + '" y="' + (Y_TOP + 4) +
            '" text-anchor="end">' + eurosAxe(yMax) + '</text>';
    frag += '<text class="tp-axis-label" x="' + (PAD_L - 8) + '" y="' + (Y_BOT) +
            '" text-anchor="end">' + eurosAxe(yMin) + '</text>';

    // Points de la courbe
    var pts = [];
    for (var i = 0; i <= horizon; i++) {
      pts.push({ x: px(i), y: py(soldes[i]), v: soldes[i] });
    }

    // Aire sous la courbe (jusqu'à la ligne du bas du graphe)
    var area = 'M ' + pts[0].x.toFixed(1) + ' ' + Y_BOT;
    for (var a = 0; a < pts.length; a++) {
      area += ' L ' + pts[a].x.toFixed(1) + ' ' + pts[a].y.toFixed(1);
    }
    area += ' L ' + pts[pts.length - 1].x.toFixed(1) + ' ' + Y_BOT + ' Z';
    frag += '<path class="tp-area" d="' + area + '" />';

    // Ligne de la courbe
    var line = '';
    for (var l = 0; l < pts.length; l++) {
      line += (l === 0 ? 'M ' : ' L ') + pts[l].x.toFixed(1) + ' ' + pts[l].y.toFixed(1);
    }
    frag += '<path class="tp-line" d="' + line + '" />';

    // Étiquettes de l'axe X + points
    for (var p = 0; p < pts.length; p++) {
      frag += '<text class="tp-axis-label" x="' + pts[p].x.toFixed(1) + '" y="' + (Y_BOT + 18) +
              '" text-anchor="middle">' + MOIS[p] + '</text>';
      var neg = pts[p].v < 0;
      var rayon = (p === 0) ? 3.5 : 4;
      frag += '<circle class="tp-dot' + (neg ? ' tp-dot--neg' : '') + '" cx="' + pts[p].x.toFixed(1) +
              '" cy="' + pts[p].y.toFixed(1) + '" r="' + rayon + '" />';
    }

    // Marqueur vertical sur le mois de bascule en négatif
    if (moisNegatif > 0) {
      var mx = px(moisNegatif).toFixed(1);
      frag += '<line class="tp-marker" x1="' + mx + '" y1="' + Y_TOP + '" x2="' + mx +
              '" y2="' + Y_BOT + '" />';
    }

    plot.innerHTML = frag;
    // Astuce compatibilité : forcer le namespace SVG sur le contenu injecté
    void svgns;
  }

  // ============================================================
  // Saisonnalité : afficher autant de champs que l'horizon choisi
  // ============================================================
  function syncSaisonnalite() {
    var horizon = parseInt((document.getElementById('t-horizon') || {}).value, 10) || 6;
    for (var m = 1; m <= 12; m++) {
      var champ = document.getElementById('t-m' + m);
      if (champ && champ.closest) {
        var wrap = champ.closest('.tp-season-field');
        if (wrap) wrap.hidden = (m > horizon);
      }
    }
  }

  // ============================================================
  // Recalcul instantané
  // ============================================================
  var form = document.getElementById('form-treso');
  if (!form) return;

  var horizonSel = document.getElementById('t-horizon');
  if (horizonSel) {
    horizonSel.addEventListener('change', function () {
      syncSaisonnalite();
      calculer();
    });
  }

  form.addEventListener('input', calculer);
  form.addEventListener('change', calculer);

  // Premier rendu
  syncSaisonnalite();
  calculer();
})();
