import { Resend } from "resend";
import type { ContactFormData } from "@/types";

// Initialisation paresseuse : ne crashe pas au build si la clé est absente.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY manquante : email non envoyé.");
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = "Power Inside Data Academy <no-reply@powerinsidedata.com>";
const TO_EMAIL = process.env.CONTACT_EMAIL ?? "contact@powerinsidedata.com";

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  const subjectLabels: Record<ContactFormData["sujet"], string> = {
    devis: "Demande de devis",
    inscription: "Inscription à une formation",
    financement: "Question sur le financement",
    partenariat: "Proposition de partenariat",
    information: "Demande d'information",
    support: "Support technique",
    autre: "Autre demande",
  };

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    reply_to: data.email,
    subject: `[PIDA] ${subjectLabels[data.sujet]} — ${data.prenom} ${data.nom}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0C0D0F; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: #009BF9; padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Nouveau message — Power Inside Data Academy</h1>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 13px; width: 120px;">Prénom</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.prenom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 13px;">Nom</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 13px;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #009BF9;">${data.email}</a></td>
            </tr>
            ${data.telephone ? `
            <tr>
              <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 13px;">Téléphone</td>
              <td style="padding: 8px 0;">${data.telephone}</td>
            </tr>` : ""}
            <tr>
              <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 13px;">Sujet</td>
              <td style="padding: 8px 0;">${subjectLabels[data.sujet]}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 20px; background: #111316; border-radius: 8px; border-left: 3px solid #009BF9;">
            <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Message</p>
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </div>
        </div>
        <div style="padding: 16px 32px; background: #070809; text-align: center; font-size: 12px; color: rgba(255,255,255,0.35);">
          Power Inside Data Academy — powerinsidedata.com
        </div>
      </div>
    `,
  });
}
