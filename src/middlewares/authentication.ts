import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { bdPizzaShop } from "../database/prismaClient"; // 👈 importe o client

export function authentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = (req as any).cookies?.auth;
  if (!token)
    return res.status(401).json({ message: "Usuário não está autenticado!" });

  try {
    const rawSecret = (process.env.JWT_SECRET_KEY ?? process.env.JWT_SECRET)!;
    const payload = jwt.verify(token, rawSecret);
    (req as any).user =
      typeof payload === "string" ? { sub: payload } : payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido!" });
  }
}

export async function getCurrentUser(req: Request) {
  const user = (req as any).user;
  if (!user) throw new Error("Unauthorized");
  return user as {
    id?: string;
    sub?: string;
    restaurantId?: string;
  } & jwt.JwtPayload;
}

/**
 * Retorna o restaurantId do manager autenticado.
 * 1) Se vier no token, usa;
 * 2) Senão, busca no banco pelo managerId = user.id|sub
 */
export async function getManagedRestaurantId(req: Request) {
  const user = await getCurrentUser(req);

  if (user.restaurantId) return user.restaurantId;

  const userId = user.id ?? user.sub; // alguns tokens usam 'sub'
  if (!userId) throw new Error("User id not present in token.");

  const restaurant = await bdPizzaShop.restaurant.findFirst({
    where: { managerId: userId },
    select: { id: true },
  });

  if (!restaurant) {
    throw new Error("User is not a restaurant manager.");
  }

  // opcional: “enriquece” o req.user para próximas chamadas
  (req as any).user = { ...user, restaurantId: restaurant.id };

  return restaurant.id;
}
