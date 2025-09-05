import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getCurrentUser,
} from "../../middlewares/authentication";

export const createEvaluationRouter = Router();

/**
 * POST /evaluations
 * body: { restaurantId: string; rate: 1..5; comment?: string }
 */
createEvaluationRouter.post(
  "/evaluations",
  authentication,
  async (req, res, next) => {
    try {
      const { id, sub } = await getCurrentUser(req);
      const userId = (id as string | undefined) ?? (sub as string | undefined);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const restaurantId = String(req.body?.restaurantId ?? "");
      const rate = Number(req.body?.rate ?? 0);
      const comment =
        req.body?.comment !== undefined && req.body?.comment !== null
          ? String(req.body.comment)
          : undefined;

      if (!restaurantId)
        return res.status(400).json({ message: "restaurantId inválido" });
      if (!Number.isInteger(rate) || rate < 1 || rate > 5) {
        return res
          .status(400)
          .json({ message: "rate deve ser inteiro entre 1 e 5" });
      }

      await bdPizzaShop.evaluation.create({
        data: {
          restaurantId,
          customerId: userId,
          rate,
          comment,
        },
      });

      return res.status(201).send();
    } catch (err) {
      next(err);
    }
  }
);
