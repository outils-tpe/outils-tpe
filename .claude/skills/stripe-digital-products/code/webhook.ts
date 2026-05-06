/**
 * Vercel Serverless Function — Stripe Webhook
 * Fichier : /api/stripe-webhook.ts (dans le repo outils-tpe.fr)
 *
 * Ce fichier est un squelette de référence.
 * Le code réel est dans public/api/stripe-webhook.ts du repo outils-tpe.fr.
 *
 * Dépendances :
 *   npm install stripe @aws-sdk/client-s3 @aws-sdk/s3-request-presigner resend
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resend } from "resend";

// Initialisation des clients (sans clés en dur)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const resend = new Resend(process.env.RESEND_API_KEY);

// TTL du lien de téléchargement (72h)
const DOWNLOAD_LINK_TTL_SECONDS = 72 * 60 * 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Uniquement les POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Récupérer le body brut (nécessaire pour la vérification de signature)
  const rawBody = await getRawBody(req);
  const signature = req.headers["stripe-signature"] as string;

  // Vérification de signature — OBLIGATOIRE
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature invalide :", err);
    return res.status(400).json({ error: "Signature invalide" });
  }

  // Traitement de l'événement
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  // Toujours répondre 200 rapidement pour éviter les retentatives Stripe
  return res.status(200).json({ received: true });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { product_slug, file_key } = session.metadata ?? {};
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name ?? "client";

  if (!file_key || !customerEmail) {
    console.error("Métadonnées manquantes :", { file_key, customerEmail });
    return;
  }

  // Générer l'URL signée R2
  const downloadUrl = await generateSignedUrl(file_key);

  // Envoyer l'email de livraison
  await sendDeliveryEmail({
    to: customerEmail,
    customerName,
    productSlug: product_slug ?? "produit",
    downloadUrl,
  });

  console.log(`Livraison OK — ${customerEmail} — ${product_slug}`);
}

async function generateSignedUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileKey,
  });

  return getSignedUrl(r2, command, {
    expiresIn: DOWNLOAD_LINK_TTL_SECONDS,
  });
}

async function sendDeliveryEmail(params: {
  to: string;
  customerName: string;
  productSlug: string;
  downloadUrl: string;
}): Promise<void> {
  const { to, customerName, productSlug, downloadUrl } = params;

  // Charger le template HTML depuis templates/email-livraison.html
  // et remplacer les variables {{...}}
  const html = buildEmailHtml({ customerName, productSlug, downloadUrl });

  await resend.emails.send({
    from: "outils-tpe.fr <contact@outils-tpe.fr>",
    to,
    subject: `Votre fichier ${productSlug} est prêt`,
    html,
  });
}

function buildEmailHtml(params: {
  customerName: string;
  productSlug: string;
  downloadUrl: string;
}): string {
  // Voir templates/email-livraison.html pour le template complet
  // Ici version simplifiée pour le squelette
  return `
    <p>Bonjour ${params.customerName},</p>
    <p>Votre fichier <strong>${params.productSlug}</strong> est prêt :</p>
    <p><a href="${params.downloadUrl}">Télécharger mon fichier</a></p>
    <p>Ce lien est valable 72 heures.</p>
    <p>— outils-tpe.fr</p>
  `;
}

// Utilitaire : lire le body brut depuis la requête Vercel
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
