/**
 * Utilitaire d'envoi d'email de livraison — Resend
 * Fichier de référence — le code réel est dans le repo outils-tpe.fr
 *
 * Dépendance : npm install resend
 */

import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface DeliveryEmailParams {
  to: string;
  customerName: string;
  productName: string;
  downloadUrl: string;
  siret?: string;
}

/**
 * Envoie l'email de livraison avec le lien de téléchargement signé.
 * Utilise le template HTML dans templates/email-livraison.html.
 */
export async function sendDeliveryEmail(
  params: DeliveryEmailParams
): Promise<void> {
  const { to, customerName, productName, downloadUrl, siret = "" } = params;

  const html = loadEmailTemplate({
    customer_name: customerName,
    product_name: productName,
    download_url: downloadUrl,
    siret,
  });

  const { error } = await resend.emails.send({
    from: "outils-tpe.fr <contact@outils-tpe.fr>",
    to,
    subject: `Votre fichier ${productName} est prêt — outils-tpe.fr`,
    html,
  });

  if (error) {
    throw new Error(`Resend error : ${error.message}`);
  }
}

/**
 * Charge et hydrate le template HTML de livraison.
 * Les variables sont au format {{variable_name}}.
 */
function loadEmailTemplate(variables: Record<string, string>): string {
  // En production, le template est inline ou dans un assets bundle
  // Ici, chargement depuis le fichier de référence
  let template = readFileSync(
    join(__dirname, "../templates/email-livraison.html"),
    "utf-8"
  );

  for (const [key, value] of Object.entries(variables)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }

  return template;
}
