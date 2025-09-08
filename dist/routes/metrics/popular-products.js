"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popularProductsRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.popularProductsRouter = (0, express_1.Router)();
exports.popularProductsRouter.get("/metrics/popular-products", authentication_1.authentication, async (req, res, next) => {
    try {
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req);
        // Agrupa orderItems por productId, contando quantos itens por produto,
        // filtrando apenas pedidos do restaurante atual.
        const grouped = await prismaClient_1.bdPizzaShop.orderItem.groupBy({
            by: ["productId"],
            where: {
                order: { restaurantId }, // filtro via relação
                productId: { not: null },
            },
            _count: { productId: true }, // 👈 contamos por productId
            // ⚠️ Em groupBy, não dá pra usar _all aqui. Use um campo específico:
            orderBy: { _count: { productId: "desc" } },
            take: 5,
        });
        const productIds = grouped
            .map((g) => g.productId)
            .filter((id) => Boolean(id));
        if (productIds.length === 0) {
            return res.json([]); // nada a retornar
        }
        const products = await prismaClient_1.bdPizzaShop.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });
        const nameById = new Map(products.map((p) => [p.id, p.name]));
        const result = grouped.map((g) => {
            const amount = g._count?.productId ?? 0; // 👈 _count pode ser undefined
            const name = (g.productId ? nameById.get(g.productId) : undefined) ??
                "Produto indisponível";
            return { product: name, amount };
        });
        return res.json(result);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});
