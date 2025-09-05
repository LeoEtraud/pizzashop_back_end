import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getCurrentUser,
} from "../../middlewares/authentication";

export const getProfileRouter = Router();

/**
 * GET /me
 * - precisa estar autenticado
 * - busca usuário pelo id/sub do token
 */
getProfileRouter.get("/me", authentication, async (req, res, next) => {
  try {
    const { id, sub } = await getCurrentUser(req);
    const userId = (id as string | undefined) ?? (sub as string | undefined);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await bdPizzaShop.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json(user);
  } catch (err) {
    next(err);
  }
});
