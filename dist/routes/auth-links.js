"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLinksRouter = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("../database/prismaClient");
exports.authLinksRouter = (0, express_1.Router)();
/**
 * GET /auth-links/authenticate?code=...&redirect=...
 * - valida o código
 * - marca como usado
 * - garante restaurante do manager
 * - cria cookie `auth` (JWT)
 * - redireciona para `redirect` (ou /app)
 */
exports.authLinksRouter.get("/auth-links/authenticate", async (req, res) => {
    const code = String(req.query.code ?? "");
    const redirect = String(req.query.redirect ?? "") || "http://localhost:5173/app";
    if (!code)
        return res.status(400).send("Código inválido.");
    const link = await prismaClient_1.bdPizzaShop.authLink.findUnique({
        where: { code },
        include: { user: true },
    });
    if (!link || link.usedAt || link.expiresAt < new Date()) {
        return res.status(401).send("Link inválido ou expirado.");
    }
    // marca como usado
    await prismaClient_1.bdPizzaShop.authLink.update({
        where: { id: link.id },
        data: { usedAt: new Date() },
    });
    // garante que o user é manager
    const user = link.user.role === "manager"
        ? link.user
        : await prismaClient_1.bdPizzaShop.user.update({
            where: { id: link.user.id },
            data: { role: "manager" },
        });
    // garante que existe um restaurante para esse manager
    let restaurant = await prismaClient_1.bdPizzaShop.restaurant.findFirst({
        where: { managerId: user.id },
        select: { id: true },
    });
    if (!restaurant) {
        restaurant = await prismaClient_1.bdPizzaShop.restaurant.create({
            data: { name: "Novo estabelecimento", managerId: user.id },
            select: { id: true },
        });
    }
    // emite JWT
    const secret = (process.env.JWT_SECRET_KEY ??
        process.env.JWT_SECRET);
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, restaurantId: restaurant.id }, secret, { expiresIn: "30d" });
    res.cookie("auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(302, redirect);
});
