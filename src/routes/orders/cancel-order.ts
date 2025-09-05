import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getCurrentUser,
} from "../../middlewares/authentication";

export const cancelOrderRouter = Router();

cancelOrderRouter.patch(
  "/orders/:id/cancel",
  authentication,
  async (req, res, next) => {
    try {
      const { id: orderId } = req.params;
      const { restaurantId } = await getCurrentUser(req);
      if (!restaurantId) {
        return res.status(401).json({
          message: "User is not a restaurant manager.",
        });
      }

      const order = await bdPizzaShop.order.findFirst({
        where: { id: orderId, restaurantId },
        select: { id: true, status: true },
      });

      if (!order) {
        return res.status(401).json({
          message: "Order not found under the user managed restaurant.",
        });
      }

      if (!["pending", "processing"].includes(order.status)) {
        return res.status(400).json({
          code: "STATUS_NOT_VALID",
          message: "O pedido não pode ser cancelado depois de ser enviado.",
        });
      }

      await bdPizzaShop.order.update({
        where: { id: orderId },
        data: { status: "canceled" },
      });

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
