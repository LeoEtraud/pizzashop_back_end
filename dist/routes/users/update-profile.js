"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.updateProfileRouter = (0, express_1.Router)();
exports.updateProfileRouter.put("/profile", authentication_1.authentication, async (req, res, next) => {
    try {
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req);
        const name = String(req.body?.name ?? "").trim();
        const description = req.body?.description === undefined || req.body?.description === null
            ? null
            : String(req.body.description).trim();
        if (!name) {
            return res.status(400).json({ message: "name é obrigatório" });
        }
        await prismaClient_1.bdPizzaShop.restaurant.update({
            where: { id: restaurantId },
            data: { name, description },
        });
        return res.status(204).send();
    }
    catch (err) {
        // Caso o restaurante não exista
        if (err?.code === "P2025") {
            return res.status(404).json({ message: "Restaurant not found." });
        }
        next(err);
    }
});
