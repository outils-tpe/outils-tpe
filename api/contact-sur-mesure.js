// Vercel Serverless Function — Formulaire de contact sur mesure
// Route : POST /api/contact-sur-mesure
//
// Flux :
//   1. Vérification Turnstile (anti-bot)
//   2. Validation des champs
//   3. Envoi email à contact@outils-tpe.fr via Resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { nom, prenom, email, description, turnstileToken } = req.body ?? {};

  // Vérification Turnstile — rejette les bots avant tout traitement
  const turnstileOk = await verifierTurnstile(
    turnstileToken,
    req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress
  );
  if (!turnstileOk) {
    return res.status(400).json({ error: 'Vérification anti-bot échouée' });
  }

  // Validation des champs
  if (!prenom?.trim()) {
    return res.status(400).json({ error: 'Le prénom est requis' });
  }
  if (!nom?.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }
  if (!description?.trim() || description.trim().length < 20) {
    return res.status(400).json({ error: 'Merci de décrire votre besoin en quelques mots (20 caractères minimum)' });
  }

  try {
    await envoyerEmail({
      nom:         nom.trim(),
      prenom:      prenom.trim(),
      email:       email.trim(),
      description: description.trim(),
    });

    console.log(`Sur mesure — demande reçue de ${email} (${prenom} ${nom})`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erreur contact-sur-mesure :', err);
    return res.status(500).json({ error: 'Erreur serveur, réessayez dans quelques instants' });
  }
}

async function verifierTurnstile(token, ip) {
  if (!token) return false;

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      secret:   process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });

  const data = await response.json();
  return data.success === true;
}

async function envoyerEmail({ nom, prenom, email, description }) {
  const { error } = await resend.emails.send({
    from:    'outils-tpe.fr <contact@outils-tpe.fr>',
    to:      'contact@outils-tpe.fr',
    replyTo: email,
    subject: `Demande sur mesure — ${prenom} ${nom}`,
    html:    buildEmailHtml({ nom, prenom, email, description }),
  });

  if (error) {
    throw new Error(`Resend : ${error.message}`);
  }
}

function buildEmailHtml({ nom, prenom, email, description }) {
  const descHtml = escapeHtml(description).replace(/\n/g, '<br>');
  const dateStr  = new Date().toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <tr><td style="background:#1e3a5f;padding:28px 40px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">outils-tpe.fr</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.6);font-size:13px;">Nouvelle demande sur mesure</p>
        </td></tr>

        <tr><td style="padding:40px;">

          <table width="100%" cellpadding="0" cellspacing="0">

            <tr>
              <td style="padding:0 0 6px;color:#6b7280;font-size:12px;font-weight:700;
                         text-transform:uppercase;letter-spacing:.06em;">Contact</td>
            </tr>
            <tr>
              <td style="padding:0 0 28px;color:#111827;font-size:16px;font-weight:600;">
                ${escapeHtml(prenom)} ${escapeHtml(nom)}
              </td>
            </tr>

            <tr>
              <td style="padding:0 0 6px;color:#6b7280;font-size:12px;font-weight:700;
                         text-transform:uppercase;letter-spacing:.06em;">Email</td>
            </tr>
            <tr>
              <td style="padding:0 0 28px;font-size:15px;">
                <a href="mailto:${escapeHtml(email)}"
                   style="color:#1e3a5f;text-decoration:underline;">${escapeHtml(email)}</a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 0 6px;color:#6b7280;font-size:12px;font-weight:700;
                         text-transform:uppercase;letter-spacing:.06em;">Problématique</td>
            </tr>
            <tr>
              <td style="padding:16px 20px;background:#f9fafb;border:1px solid #e5e7eb;
                         border-radius:6px;color:#374151;font-size:15px;line-height:1.75;">
                ${descHtml}
              </td>
            </tr>

          </table>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 20px;">

          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
            Pour répondre, utilisez la fonction <strong>Répondre</strong> — le message partira
            directement à <a href="mailto:${escapeHtml(email)}" style="color:#9ca3af;">${escapeHtml(email)}</a>.
          </p>

        </td></tr>

        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            outils-tpe.fr — Demande reçue le ${escapeHtml(dateStr)}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
