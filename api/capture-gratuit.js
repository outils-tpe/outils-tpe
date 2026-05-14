// Vercel Serverless Function — Capture email + livraison fichier gratuit
// Route : POST /api/capture-gratuit
//
// Flux :
//   1. Vérification Turnstile (anti-bot)
//   2. Validation email + métier
//   3. Génération URL signée R2 (7 jours)
//   4. Envoi email de livraison via Resend

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resend } from 'resend';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Durée de validité du lien gratuit : 7 jours
const DOWNLOAD_TTL = 7 * 24 * 60 * 60;

// Mapping métier → clé exacte du fichier dans le bucket R2
// ⚠️ Mettre à jour si les noms de fichiers dans R2 changent
const FICHIERS_GRATUITS = {
  electricien: 'Trésorerie - Electricien - gratuit.xlsx',
  plombier:    'Trésorerie - Plombier - gratuit.xlsx',
  coiffeur:    'Trésorerie - Coiffeur - gratuit.xlsx',
};

const NOMS_METIERS = {
  electricien: 'Électricien',
  plombier:    'Plombier',
  coiffeur:    'Coiffeur',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, metier, turnstileToken } = req.body ?? {};

  // Vérification Turnstile — rejette les bots avant tout traitement
  const turnstileOk = await verifierTurnstile(
    turnstileToken,
    req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress
  );
  if (!turnstileOk) {
    return res.status(400).json({ error: 'Vérification anti-bot échouée' });
  }

  // Validation email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }

  // Validation métier
  const fileKey = FICHIERS_GRATUITS[metier];
  if (!fileKey) {
    return res.status(400).json({ error: 'Métier non reconnu' });
  }

  try {
    const downloadUrl = await genererUrlSignee(fileKey);
    await envoyerEmailGratuit({ email, metier, downloadUrl });

    console.log(`Capture OK — ${email} — ${metier}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erreur capture-gratuit :', err);
    return res.status(500).json({ error: 'Erreur serveur, réessayez dans quelques instants' });
  }
}

async function verifierTurnstile(token, ip) {
  if (!token) return false;

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });

  const data = await response.json();
  return data.success === true;
}

async function genererUrlSignee(fileKey) {
  const commande = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
  });
  return getSignedUrl(r2, commande, { expiresIn: DOWNLOAD_TTL });
}

async function envoyerEmailGratuit({ email, metier, downloadUrl }) {
  const nomMetier = NOMS_METIERS[metier];

  const { error } = await resend.emails.send({
    from: 'outils-tpe.fr <contact@outils-tpe.fr>',
    to: email,
    subject: `Votre fichier gratuit — Suivi de trésorerie ${nomMetier}`,
    html: buildEmailHtml({ nomMetier, metier, downloadUrl }),
  });

  if (error) {
    throw new Error(`Resend : ${error.message}`);
  }
}

function buildEmailHtml({ nomMetier, metier, downloadUrl }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <tr><td style="background:#1e3a5f;padding:28px 40px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">outils-tpe.fr</p>
        </td></tr>

        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">
            Votre fichier gratuit est prêt !
          </h1>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Voici votre fichier <strong>Suivi de trésorerie — ${escapeHtml(nomMetier)}</strong>
            (version gratuite). Rien à installer, ça marche directement dans Excel ou LibreOffice.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
            <tr><td style="background:#22c55e;border-radius:6px;padding:14px 28px;">
              <a href="${escapeHtml(downloadUrl)}"
                 style="color:#fff;font-size:16px;font-weight:700;text-decoration:none;">
                Télécharger mon fichier gratuit
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 32px;color:#6b7280;font-size:13px;word-break:break-all;">
            Lien de secours : <span style="color:#1e3a5f;">${escapeHtml(downloadUrl)}</span>
          </p>

          <p style="margin:0 0 32px;color:#6b7280;font-size:13px;">
            Ce lien est valable <strong>7 jours</strong>. Passé ce délai, retournez sur la page
            pour en générer un nouveau gratuitement.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

          <p style="margin:0 0 8px;color:#111827;font-size:15px;font-weight:600;">
            Vous voulez aller plus loin ?
          </p>
          <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
            La version complète ajoute le tableau de bord KPI, le prévisionnel 12 mois,
            la gestion TVA, la comparaison N-1 et les scénarios — ainsi qu'un fichier
            d'exemple avec 12 mois de données réalistes du métier.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#1e3a5f;border-radius:6px;padding:12px 24px;">
              <a href="https://outils-tpe.fr/${escapeHtml(metier)}"
                 style="color:#fff;font-size:14px;font-weight:700;text-decoration:none;">
                Voir la version complète — 24,90 €
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            outils-tpe.fr — Outils de gestion pour les petites entreprises françaises<br>
            Auto-entrepreneur — SIRET : ${process.env.SIRET ?? ''}<br>
            <a href="https://outils-tpe.fr/mentions-legales" style="color:#9ca3af;">Mentions légales</a> ·
            <a href="https://outils-tpe.fr/politique-confidentialite" style="color:#9ca3af;">Confidentialité</a>
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
