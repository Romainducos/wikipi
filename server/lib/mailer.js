import nodemailer from "nodemailer";

// Envoi d'emails via SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
// SMTP_SECURE, MAIL_FROM). Sans SMTP_HOST (développement), l'email est
// affiché dans la console du serveur au lieu d'être envoyé.
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

export const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log(`\n[email non envoyé : SMTP non configuré]\nÀ : ${to}\nSujet : ${subject}\n${text}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};
