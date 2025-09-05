import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const updateProfileRouter = Router();

updateProfileRouter.put("/profile", authentication, async (req, res, next) => {
  try {
    const restaurantId = await getManagedRestaurantId(req);

    const name = String(req.body?.name ?? "").trim();
    const description =
      req.body?.description === undefined || req.body?.description === null
        ? null
        : String(req.body.description).trim();

    if (!name) {
      return res.status(400).json({ message: "name é obrigatório" });
    }

    await bdPizzaShop.restaurant.update({
      where: { id: restaurantId },
      data: { name, description },
    });

    return res.status(204).send();
  } catch (err: any) {
    // Caso o restaurante não exista
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Restaurant not found." });
    }
    next(err);
  }
});
