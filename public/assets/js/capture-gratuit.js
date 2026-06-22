/* outils-tpe.fr – Formulaire de téléchargement fichier gratuit
   Appelle POST /api/capture-gratuit avec email + métier + token Turnstile */

(function () {
  const form = document.getElementById('form-gratuit');
  if (!form) return;

  const btn = form.querySelector('.form-capture__btn');
  const msg = document.getElementById('form-gratuit-msg');
  const BTN_LABEL = btn.textContent;

  function showMsg(texte, estErreur) {
    msg.textContent = texte;
    msg.className = 'form-capture__msg ' +
      (estErreur ? 'form-capture__msg--erreur' : 'form-capture__msg--succes');
  }

  function setLoading(actif) {
    btn.disabled = actif;
    btn.textContent = actif ? 'Envoi en cours…' : BTN_LABEL;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'form-capture__msg';

    const email         = form.querySelector('[name="email"]').value.trim();
    const metier        = form.querySelector('[name="metier"]').value;
    const tokenInput    = form.querySelector('[name="cf-turnstile-response"]');
    const turnstileToken = tokenInput ? tokenInput.value : '';

    // Validations côté client
    if (!email) {
      showMsg('Veuillez entrer votre adresse email.', true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg('Cette adresse email ne semble pas valide.', true);
      return;
    }
    if (!turnstileToken) {
      showMsg('Veuillez valider le captcha avant d\'envoyer.', true);
      return;
    }

    setLoading(true);

    try {
      const reponse = await fetch('/api/capture-gratuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, metier, turnstileToken }),
      });

      const data = await reponse.json();

      if (!reponse.ok) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      // Succès : masquer le formulaire, afficher le message
      form.reset();
      if (typeof turnstile !== 'undefined') turnstile.reset();
      setLoading(false);
      btn.style.display = 'none';
      form.querySelector('.cf-turnstile').style.display = 'none';
      showMsg(
        'Votre fichier est en route ! Vérifiez votre boîte mail (pensez aux spams si besoin).',
        false
      );

    } catch (err) {
      setLoading(false);
      if (typeof turnstile !== 'undefined') turnstile.reset();
      showMsg(
        err.message || 'Une erreur est survenue, réessayez dans quelques instants.',
        true
      );
    }
  });
})();
