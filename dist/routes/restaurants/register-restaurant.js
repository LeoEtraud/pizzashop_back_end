"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRestaurantRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
exports.registerRestaurantRouter = (0, express_1.Router)();
/**
 * POST /restaurants
 * body: { restaurantName: string; managerName: string; phone: string; email: string }
 */
exports.registerRestaurantRouter.post("/restaurants", async (req, res, next) => {
    try {
        const restaurantName = String(req.body?.restaurantName ?? "").trim();
        const managerName = String(req.body?.managerName ?? "").trim();
        const phone = String(req.body?.phone ?? "").trim();
        const email = String(req.body?.email ?? "")
            .trim()
            .toLowerCase();
        if (!restaurantName || !managerName || !phone || !email) {
            return res.status(400).json({ message: "payload inválido" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "email inválido" });
        }
        // cria ou promove manager
        const manager = await prismaClient_1.bdPizzaShop.user.upsert({
            where: { email },
            update: { name: managerName, phone, role: "manager" },
            create: { name: managerName, email, phone, role: "manager" },
            select: { id: true },
        });
        await prismaClient_1.bdPizzaShop.restaurant.create({
            data: {
                name: restaurantName,
                managerId: manager.id,
            },
        });
        return res.status(204).send();
    }
    catch (err) {
        // conflito pode acontecer se houver alguma unique key custom
        if (err?.code === "P2002") {
            return res.status(409).json({ message: "Conflito de dados" });
        }
        next(err);
    }
});
