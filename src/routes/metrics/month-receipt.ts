import { Router } from "express";
import dayjs from "dayjs";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const monthReceiptRouter = Router();

monthReceiptRouter.get(
  "/metrics/month-receipt",
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
          createdAt: { gte: startOfLastMonth.toDate() },
        },
        select: { createdAt: true, totalInCents: true },
      });

      const currentKey = today.format("YYYY-MM");
      const lastKey = lastMonth.format("YYYY-MM");

      let currentReceipt = 0;
      let lastReceipt = 0;

      for (const r of rows) {
        const key = dayjs(r.createdAt).format("YYYY-MM");
        if (key === currentKey) currentReceipt += r.totalInCents;
        else if (key === lastKey) lastReceipt += r.totalInCents;
      }

      const diffFromLastMonth =
        lastReceipt && currentReceipt
          ? Number(((currentReceipt * 100) / lastReceipt - 100).toFixed(2))
          : 0;

      return res.json({
        receipt: currentReceipt,
        diffFromLastMonth,
      });
    } catch (err) {
      next(err);
    }
  }
);
