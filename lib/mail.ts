import type { ContactFormValues } from "@/types";

const DEFAULT_SENDER = process.env.EMAIL_FROM ?? "hello@pida.app";
const DEFAULT_RECIPIENT = process.env.EMAIL_TO ?? process.env.SMTP_USER ?? "hello@pida.app";

export async function sendContactEmail(data: ContactFormValues) {
    const subject = `[Contact] ${data.sujet}`;
    const html = `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.6;">
    <h2>Demande de contact</h2>
    <p><strong>Prénom:</strong> ${data.prenom}</p>
    <p><strong>Nom:</strong> ${data.nom}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, "<br />")}</p>
  </div>`;

    if (process.env.RESEND_API_KEY) {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: DEFAULT_SENDER,
                to: [DEFAULT_RECIPIENT],
                subject,
                html,
            }),
        });

        if (!response.ok) {
            throw new Error(`Resend error: ${response.statusText}`);
        }

        return;
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error("Configuration d'e-mail manquante : définissez RESEND_API_KEY ou SMTP_HOST, SMTP_USER et SMTP_PASS.");
    }

    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: DEFAULT_SENDER,
        to: DEFAULT_RECIPIENT,
        subject,
        text: `${data.message}\n\n${data.prenom} ${data.nom} – ${data.email}`,
        html,
    });
}
