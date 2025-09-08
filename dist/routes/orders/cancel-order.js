"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrderRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.cancelOrderRouter = (0, express_1.Router)();
exports.cancelOrderRouter.patch("/orders/:id/cancel", authentication_1.authentication, async (req, res, next) => {
    try {
        const { id: orderId } = req.params;
        const { restaurantId } = await (0, authentication_1.getCurrentUser)(req);
        if (!restaurantId) {
            return res.status(401).json({
                message: "User is not a restaurant manager.",
            });
        }
        const order = await prismaClient_1.bdPizzaShop.order.findFirst({
            where: { id: orderId, restaurantId },
            select: { id: true, status: true },
        });
        if (!order) {
            return res.status(401).json({
                message: "Order not found under the user managed restaurant.",
            });
        }
        if (!["pending", "processing"].includes(order.status)) {
            return res.status(400).json({
                code: "STATUS_NOT_VALID",
                message: "O pedido não pode ser cancelado depois de ser enviado.",
            });
        }
        await prismaClient_1.bdPizzaShop.order.update({
            where: { id: orderId },
            data: { status: "canceled" },
        });
        return res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
