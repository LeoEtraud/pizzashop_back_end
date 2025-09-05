import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import {
  authentication,
  getManagedRestaurantId,
} from "../../middlewares/authentication";
import type { OrderStatus, Prisma } from "@prisma/client";

export const getOrdersRouter = Router();

function qp(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length ? String(v[0] ?? "") : undefined;
  if (v == null) return undefined;
  return String(v);
}

getOrdersRouter.get("/orders", authentication, async (req, res, next) => {
  try {
    const restaurantId = await getManagedRestaurantId(req); // 👈 AQUI

    const perPage = 10;
    const pageIndexStr = qp(req.query.pageIndex) ?? "0";
    const pageIndex = Number(pageIndexStr);
    if (Number.isNaN(pageIndex) || pageIndex < 0) {
      return res.status(400).json({ message: "pageIndex inválido" });
    }

    const orderId = qp(req.query.orderId);
    const customerName = qp(req.query.customerName);
    const statusStr = qp(req.query.status);

    const allowed: OrderStatus[] = [
      "pending",
      "processing",
      "delivering",
      "delivered",
      "canceled",
    ];
    const status: OrderStatus | undefined = allowed.includes(
      statusStr as OrderStatus
    )
      ? (statusStr as OrderStatus)
      : undefined;

    const where: Prisma.OrderWhereInput = {
      restaurantId,
      ...(orderId ? { id: { contains: orderId, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(customerName
        ? {
            customer: {
              is: { name: { contains: customerName, mode: "insensitive" } },
            },
          }
        : {}),
    };

    const totalCount = await bdPizzaShop.order.count({ where });

    const all = await bdPizzaShop.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalInCents: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const weight: Record<OrderStatus, number> = {
      pending: 1,
      processing: 2,
      delivering: 3,
      delivered: 4,
      canceled: 99,
    };
    all.sort((a, b) => {
      const d = weight[a.status] - weight[b.status];
      if (d !== 0) return d;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const start = pageIndex * perPage;
    const page = all.slice(start, start + perPage).map((o) => ({
      orderId: o.id,
      createdAt: o.createdAt,
      status: o.status,
      customerName: o.customer?.name ?? "",
      total: o.totalInCents,
    }));

    return res.json({ orders: page, meta: { pageIndex, perPage, totalCount } });
  } catch (err) {
    next(err);
  }
});
