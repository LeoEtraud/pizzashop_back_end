"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.createOrderRouter = (0, express_1.Router)();
/**
 * POST /restaurants/:restaurantId/orders
 * body: { items: { productId: string; quantity: number }[] }
 */
exports.createOrderRouter.post("/restaurants/:restaurantId/orders", authentication_1.authentication, async (req, res, next) => {
    try {
        const { id, sub } = await (0, authentication_1.getCurrentUser)(req);
        const customerId = id ?? sub;
        if (!customerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const restaurantId = String(req.params?.restaurantId ?? "");
        if (!restaurantId) {
            return res.status(400).json({ message: "restaurantId inválido" });
        }
        const items = (Array.isArray(req.body?.items) ? req.body.items : []);
        if (items.length === 0) {
            return res.status(400).json({ message: "items é obrigatório" });
        }
        for (const it of items) {
            if (!it?.productId || typeof it.productId !== "string") {
                return res.status(400).json({ message: "productId inválido" });
            }
            if (typeof it.quantity !== "number" ||
                !Number.isInteger(it.quantity) ||
                it.quantity <= 0) {
                return res.status(400).json({ message: "quantity inválido" });
            }
        }
        const productsIds = [...new Set(items.map((i) => i.productId))];
        // valida se os produtos pertencem ao restaurante
        const products = await prismaClient_1.bdPizzaShop.product.findMany({
            where: { restaurantId, id: { in: productsIds } },
            select: { id: true, priceInCents: true },
        });
        const priceById = new Map(products.map((p) => [p.id, p.priceInCents]));
        // monta linhas do pedido e calcula total
        const orderProducts = items.map((item) => {
            const unit = priceById.get(item.productId);
            if (unit == null) {
                throw new Error("Not all products are available in this restaurant.");
            }
            const subtotal = unit * item.quantity;
            return {
                productId: item.productId,
                unitPriceInCents: unit,
                quantity: item.quantity,
                subtotalInCents: subtotal,
            };
        });
        const totalInCents = orderProducts.reduce((acc, cur) => acc + cur.subtotalInCents, 0);
        await prismaClient_1.bdPizzaShop.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    totalInCents,
                    customerId,
                    restaurantId,
                    // status default = 'pending' via Prisma schema
                },
                select: { id: true },
            });
            // cria itens
            await tx.orderItem.createMany({
                data: orderProducts.map((op) => ({
                    orderId: order.id,
                    productId: op.productId,
                    priceInCents: op.unitPriceInCents,
                    quantity: op.quantity,
                })),
            });
        });
        return res.status(201).send();
    }
    catch (err) {
        // se o throw vier da validação dos produtos
        if (err instanceof Error && /Not all products/.test(err.message)) {
            return res.status(400).json({ message: err.message });
        }
        next(err);
    }
});
