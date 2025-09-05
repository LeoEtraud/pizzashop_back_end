import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure:
    (process.env.SMTP_PORT ?? "") === "465" ||
    (process.env.SMTP_SECURE ?? "false") === "true",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
} satisfies SMTPTransport.Options);

// (opcional) manter default para compatibilidade
export default transporter;
