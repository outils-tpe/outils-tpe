/* outils-tpe.fr — Calculateur de taux horaire artisan
   Deux modes : (A) quel taux facturer, (B) votre vrai taux horaire net.
   Calcul 100 % côté client, aucune donnée envoyée.
   Hypothèses de taux isolées dans `defauts2026` (maintenance ~5 min/an). */

(function () {
  'use strict';

  // Taux de charges par défaut (micro 2026, prestations de services artisanales BIC
  // 21,2 % + CFP 0,3 % = 21,5 % prélevés sur le CA). Champ modifiable pour les autres statuts.
  var defauts2026 = { tauxCharges: 21.5 };

  // --- Helpers ---
  // Lit un champ numérique, renvoie un nombre >= 0 (0 si vide ou invalide)
  function num(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(',', '.'));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  function euros(n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €';
  }

  function tauxH(n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €/h';
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function toggle(id, show) {
    var el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  // ============================================================
  // Mode A : du net souhaité vers le taux à facturer
  // ============================================================
  function calculerA() {
    var net      = num('a-net');                 // revenu net mensuel souhaité
    var heures   = num('a-heures');              // heures travaillées / mois
    var nonfac   = num('a-nonfac');              // part non facturable (%)
    var charges  = num('a-charges');             // charges fixes mensuelles
    var taux     = num('a-taux') / 100;          // part prélevée sur le CA
    var marge    = num('a-marge');               // marge de sécurité (%)
    var hj       = num('a-hj') || 7;             // heures par jour (pour le TJM)

    var heuresFac = heures * (1 - nonfac / 100);
    // CA mensuel nécessaire pour que (CA − prélèvements − charges fixes) = net souhaité
    var caNecessaire = (1 - taux) > 0 ? (net + charges) / (1 - taux) : 0;
    var tauxMin  = heuresFac > 0 ? caNecessaire / heuresFac : 0;
    var tauxReco = tauxMin * (1 + marge / 100);
    var tjm      = tauxReco * hj;

    setText('ra-reco', heuresFac > 0 ? tauxH(tauxReco) : '—');
    setText('ra-min', heuresFac > 0 ? tauxH(tauxMin) : '—');
    setText('ra-tjm', heuresFac > 0 ? euros(tjm) : '—');
    setText('ra-heuresfac', Math.round(heuresFac) + ' h / mois');
  }

  // ============================================================
  // Mode B : du CA facturé vers le vrai taux net (angle viral)
  // ============================================================
  var DONUT_C = 2 * Math.PI * 54; // circonférence du cercle r=54

  function calculerB() {
    var ca       = num('b-ca');                  // CA mensuel facturé
    var charges  = num('b-charges');             // charges fixes mensuelles
    var heures   = num('b-heures');              // heures travaillées / mois (dont non facturées)
    var nonfac   = num('b-nonfac');              // part non facturable (%)
    var taux     = num('b-taux') / 100;          // part prélevée sur le CA

    var heuresFac   = heures * (1 - nonfac / 100);
    var cotisations = ca * taux;
    var netReel     = ca - cotisations - charges;
    var tauxFacture = heuresFac > 0 ? ca / heuresFac : 0;     // taux apparent (sur heures facturables)
    var tauxReelNet = heures > 0 ? netReel / heures : 0;      // vrai taux (sur TOUTES les heures)
    var ecart       = tauxFacture - tauxReelNet;

    setText('rb-facture', heuresFac > 0 ? tauxH(tauxFacture) : '—');
    setText('rb-reel', heures > 0 ? tauxH(Math.max(0, tauxReelNet)) : '—');
    setText('rb-ecart', tauxH(Math.max(0, ecart)));

    // Camembert « où passe votre argent » (parts du CA)
    dessinerDonut(cotisations, charges, Math.max(0, netReel), ca);
    setText('rbv-cotis', euros(cotisations));
    setText('rbv-charges', euros(charges));
    setText('rbv-net', euros(netReel));

    // Alerte : les charges « mangent » tout le CA
    toggle('rb-alerte', netReel <= 0 && ca > 0);
  }

  // Trace le donut en pilotant stroke-dasharray / dashoffset de 3 arcs empilés
  function dessinerDonut(cotis, charges, net, total) {
    if (total <= 0) total = 1;
    var segs = [
      { id: 'donut-cotis',   val: cotis },
      { id: 'donut-charges', val: charges },
      { id: 'donut-net',     val: net }
    ];
    var offset = 0;
    for (var i = 0; i < segs.length; i++) {
      var frac = Math.max(0, segs[i].val) / total;
      var len = frac * DONUT_C;
      var el = document.getElementById(segs[i].id);
      if (el) {
        el.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + (DONUT_C - len).toFixed(2));
        el.setAttribute('stroke-dashoffset', (-offset).toFixed(2));
      }
      offset += len;
    }
  }

  // ============================================================
  // Bascule de mode (onglets)
  // ============================================================
  var tabs = document.querySelectorAll('.calc-tab');

  function switchMode(mode) {
    var modes = document.querySelectorAll('.calc-mode');
    for (var i = 0; i < modes.length; i++) {
      modes[i].hidden = modes[i].getAttribute('data-mode') !== mode;
    }
    for (var j = 0; j < tabs.length; j++) {
      var active = tabs[j].getAttribute('data-mode') === mode;
      tabs[j].classList.toggle('calc-tab--active', active);
      tabs[j].setAttribute('aria-selected', active ? 'true' : 'false');
    }
    if (mode === 'b') { calculerB(); } else { calculerA(); }
  }

  for (var k = 0; k < tabs.length; k++) {
    (function (tab) {
      tab.addEventListener('click', function () {
        switchMode(tab.getAttribute('data-mode'));
      });
    })(tabs[k]);
  }

  // ============================================================
  // Partage du résultat (mode B — potentiel viral)
  // ============================================================
  var shareBtn = document.getElementById('rb-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var fac  = (document.getElementById('rb-facture') || {}).textContent || '';
      var reel = (document.getElementById('rb-reel') || {}).textContent || '';
      var url  = 'https://outils-tpe.fr/calculateur-taux-horaire-artisan/';
      var texte = 'Je croyais facturer ' + fac + ', mon vrai taux horaire net est ' + reel +
                  '. Et vous, vous gagnez vraiment combien de l’heure ?';

      if (navigator.share) {
        navigator.share({ title: 'Mon vrai taux horaire', text: texte, url: url }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texte + ' ' + url).then(function () {
          var prev = shareBtn.textContent;
          shareBtn.textContent = 'Copié ✓';
          setTimeout(function () { shareBtn.textContent = prev; }, 2000);
        }).catch(function () {});
      }
    });
  }

  // ============================================================
  // Recalcul instantané (pas de bouton « Calculer »)
  // ============================================================
  var formA = document.getElementById('form-a');
  var formB = document.getElementById('form-b');
  if (!formA && !formB) return;

  if (formA) {
    formA.addEventListener('input', calculerA);
    formA.addEventListener('change', calculerA);
  }
  if (formB) {
    formB.addEventListener('input', calculerB);
    formB.addEventListener('change', calculerB);
  }

  // Premier rendu (mode A par défaut + pré-calcul du mode B)
  calculerA();
  calculerB();
})();
