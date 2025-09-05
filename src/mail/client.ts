import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const smtpOptions: SMTPTransport.Options = {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: (process.env.SMTP_PORT ?? "") === "465", // true se usar 465
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
};

export const mailer = nodemailer.createTransport(smtpOptions);
