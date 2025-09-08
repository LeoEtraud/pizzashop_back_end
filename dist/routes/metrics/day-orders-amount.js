"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dayOrdersAmountRouter = void 0;
const express_1 = require("express");
const dayjs_1 = __importDefault(require("dayjs"));
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.dayOrdersAmountRouter = (0, express_1.Router)();
exports.dayOrdersAmountRouter.get("/metrics/day-orders-amount", authentication_1.authentication, async (req, res, next) => {
    try {
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req);
        const today = (0, dayjs_1.default)();
        const yesterday = today.subtract(1, "day");
        const startOfYesterday = yesterday.startOf("day");
        const rows = await prismaClient_1.bdPizzaShop.order.findMany({
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
            const key = (0, dayjs_1.default)(r.createdAt).format("YYYY-MM-DD");
            if (key === keyToday)
                todayCount++;
            else if (key === keyYesterday)
                yesterdayCount++;
        }
        const diffFromYesterday = yesterdayCount && todayCount
            ? Number(((todayCount * 100) / yesterdayCount - 100).toFixed(2))
            : 0;
        return res.json({
            amount: todayCount,
            diffFromYesterday,
        });
    }
    catch (err) {
        next(err);
    }
});
