import { Router } from "express";
import dayjs from "dayjs";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";

export const dailyReceiptInPeriodRouter = Router();

// normaliza query param para string
function qp(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length ? String(v[0] ?? "") : undefined;
  if (v == null) return undefined;
  return String(v);
}

dailyReceiptInPeriodRouter.get(
  "/metrics/daily-receipt-in-period",
  authentication,
  async (req, res, next) => {
    try {
      const restaurantId = await getManagedRestaurantId(req);

      const fromStr = qp(req.query.from);
      const toStr = qp(req.query.to);

      const startDate = fromStr ? dayjs(fromStr) : dayjs().subtract(7, "day");
      const endDate = toStr
        ? dayjs(toStr)
        : fromStr
          ? startDate.add(7, "day")
          : dayjs();

      if (endDate.diff(startDate, "day") > 7) {
        return res.status(400).json({
          code: "INVALID_PERIOD",
          message: "O intervalo das datas não pode ser superior a 7 dias.",
        });
      }

      // replicando o ajuste de utcOffset do código original
      const gteDate = startDate
        .startOf("day")
        .add(startDate.utcOffset(), "minute")
        .toDate();
      const lteDate = endDate
        .endOf("day")
        .add(endDate.utcOffset(), "minute")
        .toDate();

      const rows = await bdPizzaShop.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: gteDate, lte: lteDate },
        },
        select: { createdAt: true, totalInCents: true },
      });

      // agrupa por 'DD/MM' e soma o total
      const acc = new Map<string, number>();
      for (const r of rows) {
        const key = dayjs(r.createdAt).format("DD/MM");
        acc.set(key, (acc.get(key) ?? 0) + r.totalInCents);
      }

      const result = Array.from(acc.entries())
        .map(([date, receipt]) => ({ date, receipt }))
        .filter((r) => r.receipt >= 1)
        .sort((a, b) => {
          const [dA, mA] = a.date.split("/").map(Number);
          const [dB, mB] = b.date.split("/").map(Number);
          if (mA === mB) return dA - dB;
          const dateA = new Date(2023, mA - 1);
          const dateB = new Date(2023, mB - 1);
          return dateA.getTime() - dateB.getTime();
        });

      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
