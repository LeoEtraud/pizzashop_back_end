import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const getEvaluationsRouter = Router();

function qp(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length ? String(v[0] ?? "") : undefined;
  if (v == null) return undefined;
  return String(v);
}

/**
 * GET /evaluations?pageIndex=0
 * - exige manager
 * - pagina 10 por página, mais recentes primeiro
 * - (segurança) filtra por restaurantId do manager
 */
getEvaluationsRouter.get(
  "/evaluations",
  authentication,
  async (req, res, next) => {
    try {
      const restaurantId = await getManagedRestaurantId(req);

      const pageIndex = Number(qp(req.query.pageIndex) ?? "0");
      if (Number.isNaN(pageIndex) || pageIndex < 0) {
        return res.status(400).json({ message: "pageIndex inválido" });
      }

      const perPage = 10;

      const evaluations = await bdPizzaShop.evaluation.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        skip: pageIndex * perPage,
        take: perPage,
      });

      return res.json(evaluations);
    } catch (err) {
      next(err);
    }
  }
);
