import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const dispatchOrderRouter = Router();

dispatchOrderRouter.patch(
  "/orders/:id/dispatch",
  authentication,
  async (req, res, next) => {
    try {
      const { id: orderId } = req.params;
      const restaurantId = await getManagedRestaurantId(req);

      const order = await bdPizzaShop.order.findFirst({
        where: { id: orderId, restaurantId },
        select: { id: true, status: true },
      });
      if (!order) return res.status(401).json({ message: "Unauthorized" });

      if (order.status !== "processing") {
        return res
          .status(400)
          .json({ message: "O pedido já foi enviado ao cliente." });
      }

      await bdPizzaShop.order.update({
        where: { id: orderId },
        data: { status: "delivering" },
      });

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
