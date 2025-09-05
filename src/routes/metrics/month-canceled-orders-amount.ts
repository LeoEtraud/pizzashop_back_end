import { Router } from "express";
import dayjs from "dayjs";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const monthCanceledOrdersAmountRouter = Router();

monthCanceledOrdersAmountRouter.get(
  "/metrics/month-canceled-orders-amount",
  authentication,
  async (req, res, next) => {
    try {
      const restaurantId = await getManagedRestaurantId(req);

      const today = dayjs();
      const lastMonth = today.subtract(1, "month");
      const startOfLastMonth = lastMonth.startOf("month");

      const rows = await bdPizzaShop.order.findMany({
        where: {
          restaurantId,
          status: "canceled",
          createdAt: { gte: startOfLastMonth.toDate() },
        },
        select: { id: true, createdAt: true },
      });

      const currentKey = today.format("YYYY-MM");
      const lastKey = lastMonth.format("YYYY-MM");

      let currentCount = 0;
      let lastCount = 0;

      for (const r of rows) {
        const key = dayjs(r.createdAt).format("YYYY-MM");
        if (key === currentKey) currentCount++;
        else if (key === lastKey) lastCount++;
      }

      const diffFromLastMonth =
        lastCount && currentCount
          ? Number(((currentCount * 100) / lastCount - 100).toFixed(2))
          : 0;

      return res.json({
        amount: currentCount,
        diffFromLastMonth,
      });
    } catch (err) {
      next(err);
    }
  }
);
