"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../database/prismaClient");
const cuid2_1 = require("@paralleldrive/cuid2");
const client_1 = require("../mail/client"); // seu transporter nodemailer
const render_1 = require("@react-email/render");
const authentication_magic_link_1 = require("../mail/templates/authentication-magic-link");
const url_1 = require("url");
exports.authRouter = (0, express_1.Router)();
// util simples (minutos em ms)
const minutes = (n) => n * 60 * 1000;
exports.authRouter.post("/authenticate", async (req, res) => {
    const email = String(req.body?.email || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "email inválido" });
    }
    // 1) pega usuário pelo e-mail
    const user = await prismaClient_1.bdPizzaShop.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ message: "não autorizado" });
    // 2) gera e salva o código
    const authLinkCode = (0, cuid2_1.createId)();
    await prismaClient_1.bdPizzaShop.authLink.create({
        data: {
            userId: user.id,
            code: authLinkCode,
            expiresAt: new Date(Date.now() + minutes(15)),
        },
    });
    // 3) monta o magic link
    const API_BASE_URL = process.env.API_BASE_URL;
    const AUTH_REDIRECT_URL = process.env.AUTH_REDIRECT_URL;
    const authLink = new url_1.URL("/auth-links/authenticate", API_BASE_URL);
    authLink.searchParams.set("code", authLinkCode);
    authLink.searchParams.set("redirect", AUTH_REDIRECT_URL);
    console.log("Magic link:", authLink.toString());
    // 4) renderiza e-mail (HTML + texto)
    const html = await (0, render_1.render)((0, authentication_magic_link_1.AuthenticationMagicLinkTemplate)({
        userEmail: email,
        authLink: authLink.toString(),
        appName: "Pizza Shop",
        expiresInMinutes: 15,
    }), { pretty: true });
    const text = await (0, render_1.render)((0, authentication_magic_link_1.AuthenticationMagicLinkTemplate)({
        userEmail: email,
        authLink: authLink.toString(),
        appName: "Pizza Shop",
        expiresInMinutes: 15,
    }), { plainText: true });
    // 5) envia e-mail
    await client_1.transporter.sendMail({
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
