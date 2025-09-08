import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { bdPizzaShop } from "../database/prismaClient";

export const authLinksRouter = Router();

/**
 * GET /auth-links/authenticate?code=...&redirect=...
 * - valida o código
 * - marca como usado
 * - garante restaurante do manager
 * - cria cookie `auth` (JWT)
 * - redireciona para `redirect` (ou /app)
 */
authLinksRouter.get(
  "/auth-links/authenticate",
  async (req: Request, res: Response) => {
    const code = String(req.query.code ?? "");
    const redirect =
      String(req.query.redirect ?? "") ||
      "https://pizzashop-three.vercel.app//app";

    if (!code) return res.status(400).send("Código inválido.");

    const link = await bdPizzaShop.authLink.findUnique({
      where: { code },
      include: { user: true },
    });

    if (!link || link.usedAt || link.expiresAt < new Date()) {
      return res.status(401).send("Link inválido ou expirado.");
    }

    // marca como usado
    await bdPizzaShop.authLink.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    // garante que o user é manager
    const user =
      link.user.role === "manager"
        ? link.user
        : await bdPizzaShop.user.update({
            where: { id: link.user.id },
            data: { role: "manager" },
          });

    // garante que existe um restaurante para esse manager
    let restaurant = await bdPizzaShop.restaurant.findFirst({
      where: { managerId: user.id },
      select: { id: true },
    });
    if (!restaurant) {
      restaurant = await bdPizzaShop.restaurant.create({
        data: { name: "Novo estabelecimento", managerId: user.id },
        select: { id: true },
      });
    }

    // emite JWT
    const secret = (process.env.JWT_SECRET_KEY ??
      process.env.JWT_SECRET) as string;
    const token = jwt.sign(
      { id: user.id, email: user.email, restaurantId: restaurant.id },
      secret,
      { expiresIn: "30d" }
    );

    res.cookie("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(302, redirect);
  }
);
