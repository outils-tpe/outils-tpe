/* outils-tpe.fr – Script principal */

// Année courante dans le footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menu mobile
const toggle = document.querySelector('.nav-toggle');
const nav    = document.querySelector('.nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('nav--open', !isOpen);
  });

  // Fermer le menu au clic sur un lien
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('nav--open');
    });
  });

  // Fermer le menu si on clique en dehors
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('nav--open');
    }
  });
}

// Newsletter – soumission basique (à brancher sur un service comme Brevo, Mailchimp…)
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value.trim();
    if (!email) return;

    // TODO : appel API vers le service d'emailing
    const btn = newsletterForm.querySelector('button[type="submit"]');
    btn.textContent = 'Merci !';
    btn.disabled = true;
    newsletterForm.querySelector('input[type="email"]').value = '';
  });
}

// Lightbox – agrandissement des screenshots au clic
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lightboxImg   = lightbox.querySelector('.lightbox__img');
  const lightboxClose = lightbox.querySelector('.lightbox__close');

  const openLightbox = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('lightbox--open');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  };

  document.querySelectorAll('.screenshot').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('lightbox--open')) {
      closeLightbox();
    }
  });
}
