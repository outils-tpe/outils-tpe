/* ============================================================
   outils-tpe.fr – Comparateur micro / EURL / SASU (net en poche)
   Vanilla JS, zéro backend, calcul instantané.

   RÈGLES VÉRIFIÉES SUR SOURCES OFFICIELLES (juin 2026) :
   - Micro : cotisations sociales sur le CA – vente BIC 12,3 %,
     services BIC 21,2 %, libéral BNC (régime général) 25,6 %
     (hausse +1 pt au 01/01/2026), CIPAV 23,2 %. Abattement IR
     71 % (vente) / 50 % (services BIC) / 34 % (BNC). Charges réelles
     NON déductibles. Plafonds 2026 : 203 100 € (vente), 83 600 €
     (services/BNC). Franchise TVA 2026 : 85 000 € (vente) /
     37 500 € (services). Sources : URSSAF, bpifrance, economie.gouv.
   - IS : 15 % jusqu'à 42 500 € de bénéfice (sous conditions),
     25 % au-delà. Dividendes : PFU 30 % (12,8 % IR + 17,2 % PS).
   - IMPORTANT – modélisation des charges sociales société :
     les cotisations TNS (EURL) et assimilé-salarié (SASU) ne sont
     PAS des pourcentages fixes. Comme tout simulateur grand public,
     on les ESTIME par des coefficients (ci-dessous). C'est une
     estimation pédagogique, pas un calcul comptable. À faire valider
     par un expert-comptable.
       · SASU : net rémunération ≈ 55 % du coût total employeur.
       · EURL : cotisations TNS ≈ 45 % de la rémunération nette.
       · EURL : dividendes > 10 % du capital social soumis aux
         cotisations TNS ; en deçà, PFU.
   - IR sur rémunération : appliqué à la tranche marginale (TMI)
     choisie par l'utilisateur, identiquement pour les 3 statuts.
   ============================================================ */

(function () {
  'use strict';

  // --- Config par année (à revérifier chaque année) ---
  const CFG = {
    annee: 2026,
    micro: {
      cotis:      { venteBIC: 0.123, servicesBIC: 0.212, liberalBNC: 0.256, cipav: 0.232 },
      abattement: { venteBIC: 0.71,  servicesBIC: 0.50,  liberalBNC: 0.34,  cipav: 0.34 },
      plafond:    { venteBIC: 203100, servicesBIC: 83600, liberalBNC: 83600, cipav: 83600 },
      seuilTVA:   { venteBIC: 85000,  servicesBIC: 37500, liberalBNC: 37500, cipav: 37500 }
    },
    is: { seuilReduit: 42500, tauxReduit: 0.15, tauxNormal: 0.25 },
    pfu: 0.30,
    ratioNetCoutSASU: 0.55, // net rémunération / coût total employeur (assimilé salarié)
    tauxCotisTNS: 0.45,     // cotisations TNS / rémunération nette (EURL gérant majoritaire)
    seuilDivCapital: 0.10   // part des dividendes EURL > 10 % du capital soumise au TNS
  };

  const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmt = (n) => eur.format(Math.round(n));

  // --- IS (15 % jusqu'à 42 500 €, 25 % au-delà ; conditions du taux réduit supposées remplies) ---
  function impotSociete(benefice) {
    if (benefice <= 0) return 0;
    const s = CFG.is.seuilReduit;
    if (benefice <= s) return benefice * CFG.is.tauxReduit;
    return s * CFG.is.tauxReduit + (benefice - s) * CFG.is.tauxNormal;
  }

  // --- MICRO ---
  function calcMicro(CA, act, charges, tmi) {
    const cotis = CA * CFG.micro.cotis[act];
    const baseIR = CA * (1 - CFG.micro.abattement[act]);
    const ir = baseIR * tmi;
    const net = CA - cotis - ir - charges; // charges réelles non déductibles
    const horsPlafond = CA > CFG.micro.plafond[act];
    return { statut: 'micro', net, cotis, ir, baseIR, horsPlafond, prelevements: cotis + ir };
  }

  // --- SASU (IS), président assimilé salarié ---
  function calcSASU(CA, charges, remunCible, tmi) {
    const dispo = Math.max(0, CA - charges);
    let coutRemun = remunCible / CFG.ratioNetCoutSASU;
    let remunNette = remunCible;
    if (coutRemun > dispo) { coutRemun = dispo; remunNette = dispo * CFG.ratioNetCoutSASU; }
    const benefice = Math.max(0, dispo - coutRemun);
    const is = impotSociete(benefice);
    const dividendesBruts = benefice - is;
    const dividendesNets = dividendesBruts * (1 - CFG.pfu);
    const irRemun = remunNette * tmi;
    const net = (remunNette - irRemun) + dividendesNets;
    return {
      statut: 'sasu', net, remunNette, cotisSociales: coutRemun - remunNette,
      is, dividendesBruts, dividendesNets, prelevements: dispo - net
    };
  }

  // --- EURL (IS), gérant TNS ---
  function calcEURL(CA, charges, remunCible, tmi, capital) {
    const dispo = Math.max(0, CA - charges);
    let coutRemun = remunCible * (1 + CFG.tauxCotisTNS);
    let remunNette = remunCible;
    if (coutRemun > dispo) { coutRemun = dispo; remunNette = dispo / (1 + CFG.tauxCotisTNS); }
    const benefice = Math.max(0, dispo - coutRemun);
    const is = impotSociete(benefice);
    const dividendesBruts = benefice - is;
    // Dividendes : part > 10 % du capital soumise aux cotisations TNS, reste au PFU
    const seuil = CFG.seuilDivCapital * (capital || 0);
    const partPFU = Math.min(dividendesBruts, seuil);
    const partTNS = Math.max(0, dividendesBruts - seuil);
    const divNet = partPFU * (1 - CFG.pfu) + partTNS * (1 - CFG.tauxCotisTNS) * (1 - tmi);
    const irRemun = remunNette * tmi;
    const net = (remunNette - irRemun) + divNet;
    return {
      statut: 'eurl', net, remunNette, cotisSociales: coutRemun - remunNette,
      is, dividendesBruts, dividendesNets: divNet, prelevements: dispo - net
    };
  }

  function calcTous(CA, act, charges, remunCible, tmi, capital) {
    return {
      micro: calcMicro(CA, act, charges, tmi),
      eurl: calcEURL(CA, charges, remunCible, tmi, capital),
      sasu: calcSASU(CA, charges, remunCible, tmi)
    };
  }

  // --- Point de bascule : plus petit CA (pas de 1 000 €) où une société dépasse la micro ---
  function pointBascule(act, charges, remunCible, tmi, capital) {
    const max = CFG.micro.plafond[act];
    for (let CA = 1000; CA <= 300000; CA += 1000) {
      const r = calcTous(CA, act, charges, remunCible, tmi, capital);
      const meilleureSociete = Math.max(r.eurl.net, r.sasu.net);
      // Au-delà du plafond micro, la micro n'est plus disponible : bascule de fait
      if (CA > max || meilleureSociete > r.micro.net) return Math.min(CA, max < CA ? max : CA);
    }
    return null;
  }

  // --- Données de la courbe (net en poche selon le CA) ---
  function courbe(act, charges, remunCible, tmi, capital) {
    const max = CFG.micro.plafond[act];
    const caMax = Math.min(Math.max(max, 120000), 220000);
    const pts = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const CA = Math.round((caMax / n) * i / 1000) * 1000;
      const r = calcTous(CA, act, charges, remunCible, tmi, capital);
      pts.push({
        CA,
        micro: CA > max ? null : r.micro.net, // micro indisponible au-delà du plafond
        eurl: r.eurl.net,
        sasu: r.sasu.net
      });
    }
    return { pts, caMax, plafond: max };
  }

  // ============================================================
  //  UI
  // ============================================================
  const $ = (id) => document.getElementById(id);
  const els = {
    ca: $('s-ca'), act: $('s-act'), charges: $('s-charges'), remun: $('s-remun'),
    tmi: $('s-tmi'), capital: $('s-capital'),
    // colonnes
    netMicro: $('s-net-micro'), netEurl: $('s-net-eurl'), netSasu: $('s-net-sasu'),
    prMicro: $('s-pr-micro'), prEurl: $('s-pr-eurl'), prSasu: $('s-pr-sasu'),
    colMicro: $('s-col-micro'), colEurl: $('s-col-eurl'), colSasu: $('s-col-sasu'),
    tagMicro: $('s-tag-micro'), tagEurl: $('s-tag-eurl'), tagSasu: $('s-tag-sasu'),
    // bascule + alertes
    bascule: $('s-bascule'),
    alertTVA: $('s-alert-tva'), alertPlafond: $('s-alert-plafond'), alertCharges: $('s-alert-charges'),
    plot: $('s-plot'), svg: $('s-svg'), marker: $('s-marker'), tip: $('s-tip'), chartCard: $('s-chart-card')
  };

  // Géométrie + données du dernier rendu de courbe (pour le survol)
  let chartState = null;

  function render() {
    const CA = Math.max(0, parseFloat(els.ca.value) || 0);
    const act = els.act.value;
    const charges = Math.max(0, parseFloat(els.charges.value) || 0);
    const remun = Math.max(0, parseFloat(els.remun.value) || 0);
    const tmi = parseFloat(els.tmi.value) || 0;
    const capital = Math.max(0, parseFloat(els.capital.value) || 0);

    const r = calcTous(CA, act, charges, remun, tmi, capital);

    els.netMicro.textContent = r.micro.horsPlafond ? 'indispo.' : fmt(r.micro.net);
    els.netEurl.textContent = fmt(r.eurl.net);
    els.netSasu.textContent = fmt(r.sasu.net);
    els.prMicro.textContent = r.micro.horsPlafond ? '–' : fmt(r.micro.prelevements);
    els.prEurl.textContent = fmt(r.eurl.prelevements);
    els.prSasu.textContent = fmt(r.sasu.prelevements);

    // Gagnant (micro écartée si hors plafond)
    const candidats = [
      { col: els.colMicro, tag: els.tagMicro, net: r.micro.horsPlafond ? -Infinity : r.micro.net },
      { col: els.colEurl, tag: els.tagEurl, net: r.eurl.net },
      { col: els.colSasu, tag: els.tagSasu, net: r.sasu.net }
    ];
    const best = Math.max(...candidats.map((c) => c.net));
    candidats.forEach((c) => {
      const win = c.net === best && isFinite(c.net);
      c.col.classList.toggle('stat-col--win', win);
    });

    // Point de bascule
    const pb = pointBascule(act, charges, remun, tmi, capital);
    if (pb && pb < CFG.micro.plafond[act]) {
      els.bascule.innerHTML = 'À charges constantes (' + fmt(charges) + '), la société (EURL ou SASU) '
        + 'devient plus avantageuse que la micro à partir d\'environ <b>' + fmt(pb) + '</b> de chiffre d\'affaires.';
    } else if (charges === 0) {
      els.bascule.innerHTML = 'Avec <b>zéro charge réelle</b>, la micro reste plus avantageuse jusqu\'à son '
        + 'plafond (' + fmt(CFG.micro.plafond[act]) + ') : c\'est tout l\'intérêt du régime quand on a peu de frais.';
    } else {
      els.bascule.innerHTML = 'Dans cette configuration, la micro reste compétitive jusqu\'à son plafond ('
        + fmt(CFG.micro.plafond[act]) + '). Augmentez les charges réelles ou la rémunération pour voir le point de bascule.';
    }

    // Alertes
    els.alertTVA.hidden = !(CA > CFG.micro.seuilTVA[act]);
    els.alertPlafond.hidden = !r.micro.horsPlafond;
    els.alertCharges.hidden = !(charges >= 0.15 * CA && CA > 0);

    dessinerCourbe(act, charges, remun, tmi, capital);
  }

  // --- Courbe SVG (3 lignes : micro / EURL / SASU) ---
  function dessinerCourbe(act, charges, remun, tmi, capital) {
    const { pts, caMax } = courbe(act, charges, remun, tmi, capital);
    const W = 640, H = 280, padL = 64, padR = 12, padT = 16, padB = 28;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const vals = [];
    pts.forEach((p) => { [p.micro, p.eurl, p.sasu].forEach((v) => { if (v != null) vals.push(v); }); });
    const maxV = Math.max(1, ...vals);
    const minV = Math.min(0, ...vals);
    const x = (ca) => padL + (ca / caMax) * innerW;
    const y = (v) => padT + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;

    function path(key) {
      let d = '', started = false;
      pts.forEach((p) => {
        if (p[key] == null) { started = false; return; }
        d += (started ? ' L' : 'M') + x(p.CA).toFixed(1) + ' ' + y(p[key]).toFixed(1);
        started = true;
      });
      return d;
    }

    let svg = '';
    // Lignes de repère horizontales + étiquettes en € (axe des ordonnées)
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = minV + ((maxV - minV) * i) / steps;
      const yy = y(val);
      const cls = Math.abs(val) < 1 ? 'sc-zero' : 'sc-grid';
      svg += '<line class="' + cls + '" x1="' + padL + '" y1="' + yy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + yy.toFixed(1) + '"/>';
      svg += '<text class="sc-grid-label" x="' + (padL - 6) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end">' + fmt(val) + '</text>';
    }
    svg += '<path class="sc-line sc-line--micro" d="' + path('micro') + '"/>';
    svg += '<path class="sc-line sc-line--eurl" d="' + path('eurl') + '"/>';
    svg += '<path class="sc-line sc-line--sasu" d="' + path('sasu') + '"/>';
    // étiquettes axe X (0 et caMax)
    svg += '<text class="sc-axis" x="' + padL + '" y="' + (H - 8) + '">0 €</text>';
    svg += '<text class="sc-axis" x="' + (W - padR) + '" y="' + (H - 8) + '" text-anchor="end">' + fmt(caMax) + ' de CA</text>';
    els.plot.innerHTML = svg;

    chartState = { pts, caMax, padL, padR, innerW, x, y, W };
    masquerMarqueur();
  }

  // --- Survol : marqueur vertical + points + infobulle ---
  function masquerMarqueur() {
    if (els.marker) els.marker.innerHTML = '';
    if (els.tip) { els.tip.hidden = true; }
  }

  function surMouvement(clientX) {
    if (!chartState || !els.svg) return;
    const cs = chartState;
    const rect = els.svg.getBoundingClientRect();
    if (rect.width === 0) return;
    // position pointeur -> coordonnées viewBox -> CA
    const vbX = ((clientX - rect.left) / rect.width) * cs.W;
    let ca = ((vbX - cs.padL) / cs.innerW) * cs.caMax;
    ca = Math.max(0, Math.min(cs.caMax, ca));
    // point le plus proche
    let best = cs.pts[0], dmin = Infinity;
    cs.pts.forEach((p) => { const d = Math.abs(p.CA - ca); if (d < dmin) { dmin = d; best = p; } });

    // marqueur vertical + points
    const mx = cs.x(best.CA);
    let mk = '<line class="sc-marker-line" x1="' + mx.toFixed(1) + '" y1="' + 16 + '" x2="' + mx.toFixed(1) + '" y2="' + (280 - 28) + '"/>';
    let topY = Infinity;
    [['micro', best.micro], ['eurl', best.eurl], ['sasu', best.sasu]].forEach(([k, v]) => {
      if (v == null) return;
      const cy = cs.y(v);
      if (cy < topY) topY = cy;
      mk += '<circle class="sc-dot sc-dot--' + k + '" cx="' + mx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4"/>';
    });
    els.marker.innerHTML = mk;

    // infobulle (positionnée en pixels, relative à la carte)
    const rowMicro = best.micro == null
      ? '<div class="sc-tip__row"><span class="sc-tip__dot sc-tip__dot--micro"></span>Micro<span>indispo.</span></div>'
      : '<div class="sc-tip__row"><span class="sc-tip__dot sc-tip__dot--micro"></span>Micro<span>' + fmt(best.micro) + '</span></div>';
    els.tip.innerHTML =
      '<div class="sc-tip__ca">' + fmt(best.CA) + ' de CA</div>' +
      rowMicro +
      '<div class="sc-tip__row"><span class="sc-tip__dot sc-tip__dot--eurl"></span>EURL<span>' + fmt(best.eurl) + '</span></div>' +
      '<div class="sc-tip__row"><span class="sc-tip__dot sc-tip__dot--sasu"></span>SASU<span>' + fmt(best.sasu) + '</span></div>';

    const cardRect = els.chartCard.getBoundingClientRect();
    const pxX = (rect.left - cardRect.left) + (mx / cs.W) * rect.width;
    const pxY = (rect.top - cardRect.top) + (topY / 280) * rect.height;
    els.tip.style.left = pxX.toFixed(1) + 'px';
    els.tip.style.top = pxY.toFixed(1) + 'px';
    els.tip.hidden = false;
  }

  function bind() {
    [els.ca, els.act, els.charges, els.remun, els.tmi, els.capital].forEach((el) => {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    // Survol du graphique (souris + tactile)
    if (els.svg) {
      els.svg.addEventListener('pointermove', (e) => surMouvement(e.clientX));
      els.svg.addEventListener('pointerdown', (e) => surMouvement(e.clientX));
      els.svg.addEventListener('pointerleave', masquerMarqueur);
    }
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  window.__statuts = { CFG, calcMicro, calcEURL, calcSASU, impotSociete, pointBascule };
})();
