"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderDetailsRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.getOrderDetailsRouter = (0, express_1.Router)();
exports.getOrderDetailsRouter.get("/orders/:id", authentication_1.authentication, async (req, res, next) => {
    try {
        const { id: orderId } = req.params;
        const { restaurantId } = await (0, authentication_1.getCurrentUser)(req);
        if (!restaurantId) {
            return res
                .status(401)
                .json({ message: "User is not a restaurant manager." });
        }
        const order = await prismaClient_1.bdPizzaShop.order.findFirst({
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
    }
    catch (err) {
        next(err);
    }
});
