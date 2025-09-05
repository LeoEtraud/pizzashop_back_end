import { Router, type Request, type Response } from "express";
import { bdPizzaShop } from "../database/prismaClient";
import { createId } from "@paralleldrive/cuid2";
import { transporter } from "../mail/client"; // seu transporter nodemailer
import { render } from "@react-email/render";
import { AuthenticationMagicLinkTemplate } from "../mail/templates/authentication-magic-link";
import { URL } from "url";

export const authRouter = Router();

// util simples (minutos em ms)
const minutes = (n: number) => n * 60 * 1000;

authRouter.post("/authenticate", async (req: Request, res: Response) => {
  const email = String(req.body?.email || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "email inválido" });
  }

  // 1) pega usuário pelo e-mail
  const user = await bdPizzaShop.user.findUnique({ where: { email } });

  if (!user) return res.status(401).json({ message: "não autorizado" });

  // 2) gera e salva o código
  const authLinkCode = createId();

  await bdPizzaShop.authLink.create({
    data: {
      userId: user.id,
      code: authLinkCode,
      expiresAt: new Date(Date.now() + minutes(15)),
    },
  });

  // 3) monta o magic link
  const API_BASE_URL = process.env.API_BASE_URL!;
  const AUTH_REDIRECT_URL = process.env.AUTH_REDIRECT_URL!;
  const authLink = new URL("/auth-links/authenticate", API_BASE_URL);
  authLink.searchParams.set("code", authLinkCode);
  authLink.searchParams.set("redirect", AUTH_REDIRECT_URL);

  console.log("Magic link:", authLink.toString());

  // 4) renderiza e-mail (HTML + texto)
  const html = await render(
    AuthenticationMagicLinkTemplate({
      userEmail: email,
      authLink: authLink.toString(),
      appName: "Pizza Shop",
      expiresInMinutes: 15,
    }),
    { pretty: true }
  );
  const text = await render(
    AuthenticationMagicLinkTemplate({
      userEmail: email,
      authLink: authLink.toString(),
      appName: "Pizza Shop",
      expiresInMinutes: 15,
    }),
    { plainText: true }
  );

  // 5) envia e-mail
  await transporter.sendMail({
    from: `"Pizza Shop" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: "[Pizza Shop] Seu link de acesso",
    html,
    text,
  });

  return res.json({
    message: "E-mail enviado. Verifique sua caixa de entrada.",
  });
});
