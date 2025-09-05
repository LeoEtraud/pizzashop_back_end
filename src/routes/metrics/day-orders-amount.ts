import { Router } from "express";
import dayjs from "dayjs";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const dayOrdersAmountRouter = Router();

dayOrdersAmountRouter.get(
  "/metrics/day-orders-amount",
  authentication,
  async (req, res, next) => {
    try {
      const restaurantId = await getManagedRestaurantId(req);

      const today = dayjs();
      const yesterday = today.subtract(1, "day");
      const startOfYesterday = yesterday.startOf("day");

      const rows = await bdPizzaShop.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: startOfYesterday.toDate() },
        },
        select: { id: true, createdAt: true },
      });

      const keyToday = today.format("YYYY-MM-DD");
      const keyYesterday = yesterday.format("YYYY-MM-DD");

      let todayCount = 0;
      let yesterdayCount = 0;

      for (const r of rows) {
        const key = dayjs(r.createdAt).format("YYYY-MM-DD");
        if (key === keyToday) todayCount++;
        else if (key === keyYesterday) yesterdayCount++;
      }

      const diffFromYesterday =
        yesterdayCount && todayCount
          ? Number(((todayCount * 100) / yesterdayCount - 100).toFixed(2))
          : 0;

      return res.json({
        amount: todayCount,
        diffFromYesterday,
      });
    } catch (err) {
      next(err);
    }
  }
);
