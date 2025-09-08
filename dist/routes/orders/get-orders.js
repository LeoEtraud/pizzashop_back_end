"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.getOrdersRouter = (0, express_1.Router)();
function qp(v) {
    if (typeof v === "string")
        return v;
    if (Array.isArray(v))
        return v.length ? String(v[0] ?? "") : undefined;
    if (v == null)
        return undefined;
    return String(v);
}
exports.getOrdersRouter.get("/orders", authentication_1.authentication, async (req, res, next) => {
    try {
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req); // 👈 AQUI
        const perPage = 10;
        const pageIndexStr = qp(req.query.pageIndex) ?? "0";
        const pageIndex = Number(pageIndexStr);
        if (Number.isNaN(pageIndex) || pageIndex < 0) {
            return res.status(400).json({ message: "pageIndex inválido" });
        }
        const orderId = qp(req.query.orderId);
        const customerName = qp(req.query.customerName);
        const statusStr = qp(req.query.status);
        const allowed = [
            "pending",
            "processing",
            "delivering",
            "delivered",
            "canceled",
        ];
        const status = allowed.includes(statusStr)
            ? statusStr
            : undefined;
        const where = {
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
        const totalCount = await prismaClient_1.bdPizzaShop.order.count({ where });
        const all = await prismaClient_1.bdPizzaShop.order.findMany({
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
        const weight = {
            pending: 1,
            processing: 2,
            delivering: 3,
            delivered: 4,
            canceled: 99,
        };
        all.sort((a, b) => {
            const d = weight[a.status] - weight[b.status];
            if (d !== 0)
                return d;
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
    }
    catch (err) {
        next(err);
    }
});
