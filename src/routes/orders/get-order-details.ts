import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getCurrentUser,
} from "../../middlewares/authentication";

export const getOrderDetailsRouter = Router();

getOrderDetailsRouter.get(
  "/orders/:id",
  authentication,
  async (req, res, next) => {
    try {
      const { id: orderId } = req.params;
      const { restaurantId } = await getCurrentUser(req);
      if (!restaurantId) {
        return res
          .status(401)
          .json({ message: "User is not a restaurant manager." });
      }

      const order = await bdPizzaShop.order.findFirst({
        where: { id: orderId, restaurantId },
        select: {
          id: true,
          createdAt: true,
          status: true,
          totalInCents: true,
          customer: { select: { name: true, phone: true, email: true } },
          orderItems: {
            select: {
              id: true,
              priceInCents: true,
              quantity: true,
              product: { select: { name: true } },
            },
          },
        },
      });

      if (!order) {
        return res.status(401).json({
          message: "Order not found under the user managed restaurant.",
        });
      }

      return res.json(order);
    } catch (err) {
      next(err);
    }
  }
);
