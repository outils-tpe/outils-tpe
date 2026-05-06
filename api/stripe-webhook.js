// Vercel Serverless Function — Stripe Webhook
// Route : POST /api/stripe-webhook
//
// Flux : checkout.session.completed
//   → génère URL signée R2 (72h)
//   → envoie email de livraison via Resend

import Stripe from 'stripe';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resend } from 'resend';

// Désactiver le body parsing Vercel — obligatoire pour la vérification de signature Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialisation des clients (variables d'env, jamais de clé en dur)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Durée de validité du lien de téléchargement : 72h
const DOWNLOAD_TTL = 72 * 60 * 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Lire le body brut (nécessaire pour constructEvent)
  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];

  // Vérification de signature — rejette toute requête non signée par Stripe
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook invalide :', err.message);
    return res.status(400).json({ error: 'Signature invalide' });
  }

  // Répondre 200 immédiatement pour éviter les retentatives Stripe
  res.status(200).json({ received: true });

  // Traitement asynchrone après la réponse
  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object).catch((err) => {
      console.error('Erreur livraison :', err);
    });
  }
}

async function handleCheckoutCompleted(session) {
  const { product_slug, file_key } = session.metadata ?? {};
  const email = session.customer_details?.email;
  const nom = session.customer_details?.name ?? 'client';

  if (!file_key || !email) {
    console.error('Métadonnées manquantes dans la session :', session.id, { file_key, email });
    return;
  }

  // Générer l'URL signée R2
  const downloadUrl = await genererUrlSignee(file_key);

  // Envoyer l'email de livraison
  await envoyerEmailLivraison({ email, nom, productSlug: product_slug, downloadUrl });

  console.log(`Livraison OK — ${email} — ${product_slug} — session ${session.id}`);
}

async function genererUrlSignee(fileKey) {
  const commande = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
  });

  return getSignedUrl(r2, commande, { expiresIn: DOWNLOAD_TTL });
}

async function envoyerEmailLivraison({ email, nom, productSlug, downloadUrl }) {
  const nomProduit = formatNomProduit(productSlug);

  const { error } = await resend.emails.send({
    from: 'outils-tpe.fr <contact@outils-tpe.fr>',
    to: email,
    subject: `Votre fichier ${nomProduit} est prêt`,
    html: buildEmailHtml({ nom, nomProduit, downloadUrl }),
  });

  if (error) {
    throw new Error(`Resend : ${error.message}`);
  }
}

function formatNomProduit(slug) {
  if (!slug) return 'Excel';
  // "tresorerie-electricien-v2" → "Trésorerie Électricien"
  return slug
    .replace(/-v\d+(\.\d+)?$/, '')
    .split('-')
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(' ');
}

function buildEmailHtml({ nom, nomProduit, downloadUrl }) {
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
            Votre fichier est prêt, ${escapeHtml(nom)} !
          </h1>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Merci pour votre achat. Voici votre lien de téléchargement pour
            <strong>${escapeHtml(nomProduit)}</strong>.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="background:#22c55e;border-radius:6px;padding:14px 28px;">
              <a href="${escapeHtml(downloadUrl)}"
                 style="color:#fff;font-size:16px;font-weight:700;text-decoration:none;">
                Télécharger mon fichier
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Ce lien est valable <strong>72 heures</strong>. Passé ce délai,
            contactez-nous à <a href="mailto:contact@outils-tpe.fr" style="color:#1e3a5f;">contact@outils-tpe.fr</a>.
          </p>
          <p style="margin:0 0 32px;color:#6b7280;font-size:13px;word-break:break-all;">
            Si le bouton ne fonctionne pas, copiez ce lien :<br>
            <span style="color:#1e3a5f;">${escapeHtml(downloadUrl)}</span>
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
            Le fichier contient un onglet "Démarrage rapide". Des questions ?
            Répondez directement à cet email.
          </p>
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
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Lit le body brut depuis la requête (Vercel désactive le parsing)
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
