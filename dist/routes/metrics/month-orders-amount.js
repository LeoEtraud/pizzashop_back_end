"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthOrdersAmountRouter = void 0;
const express_1 = require("express");
const dayjs_1 = __importDefault(require("dayjs"));
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.monthOrdersAmountRouter = (0, express_1.Router)();
exports.monthOrdersAmountRouter.get("/metrics/month-orders-amount", authentication_1.authentication, async (req, res, next) => {
    try {
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req);
        const today = (0, dayjs_1.default)();
        const lastMonth = today.subtract(1, "month");
        const startOfLastMonth = lastMonth.startOf("month");
        const rows = await prismaClient_1.bdPizzaShop.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startOfLastMonth.toDate() },
            },
            select: { id: true, createdAt: true },
        });
        const currentKey = today.format("YYYY-MM");
        const lastKey = lastMonth.format("YYYY-MM");
        let currentCount = 0;
        let lastCount = 0;
        for (const r of rows) {
            const key = (0, dayjs_1.default)(r.createdAt).format("YYYY-MM");
            if (key === currentKey)
                currentCount++;
            else if (key === lastKey)
                lastCount++;
        }
        const diffFromLastMonth = lastCount && currentCount
            ? Number(((currentCount * 100) / lastCount - 100).toFixed(2))
            : 0;
        return res.json({
            amount: currentCount,
            diffFromLastMonth,
        });
    }
    catch (err) {
        next(err);
    }
});
