"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveOrderRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.approveOrderRouter = (0, express_1.Router)();
exports.approveOrderRouter.patch("/orders/:id/approve", authentication_1.authentication, async (req, res, next) => {
    try {
        const { id: orderId } = req.params;
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req);
        const order = await prismaClient_1.bdPizzaShop.order.findFirst({
            where: { id: orderId, restaurantId },
            select: { id: true, status: true },
        });
        if (!order)
            return res.status(401).json({ message: "Unauthorized" });
        if (order.status !== "pending") {
            return res
                .status(400)
                .json({ message: "Order was already approved before." });
        }
        await prismaClient_1.bdPizzaShop.order.update({
            where: { id: orderId },
            data: { status: "processing" },
        });
        return res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
