import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { bdPizzaShop } from "../database/prismaClient";
import { UserRole } from "@prisma/client";

export const authLinksRouter = Router();

authLinksRouter.get(
  "/auth-links/authenticate",
  async (req: Request, res: Response) => {
    const isProd = process.env.NODE_ENV === "production";
    const FRONTEND_URL = (
      process.env.AUTH_REDIRECT_URL ?? "https://pizzashop-three.vercel.app/app"
    ).replace(/\/$/, "");

    const code = String(req.query.code ?? "");
    const rawRedirect = String(req.query.redirect ?? ""); // <- só lê 1 vez

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

    // garante manager
    const user =
      link.user.role === "manager"
        ? link.user
        : await bdPizzaShop.user.update({
            where: { id: link.user.id },
            data: { role: UserRole.manager }, // tipado
          });

    // garante restaurante
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

    // JWT + cookie
    const secret = (process.env.JWT_SECRET_KEY ??
      process.env.JWT_SECRET) as string;
    const token = jwt.sign(
      { id: user.id, email: user.email, restaurantId: restaurant.id },
      secret,
      { expiresIn: "30d" }
    );

    res.cookie("auth", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // resolve redirecionamento (sem redeclarar)
    const redirectUrl = rawRedirect || `${FRONTEND_URL}/app`;
    return res.redirect(302, redirectUrl);
  }
);
