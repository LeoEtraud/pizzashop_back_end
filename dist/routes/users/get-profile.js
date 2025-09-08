"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.getProfileRouter = (0, express_1.Router)();
/**
 * GET /me
 * - precisa estar autenticado
 * - busca usuário pelo id/sub do token
 */
exports.getProfileRouter.get("/me", authentication_1.authentication, async (req, res, next) => {
    try {
        const { id, sub } = await (0, authentication_1.getCurrentUser)(req);
        const userId = id ?? sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prismaClient_1.bdPizzaShop.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.json(user);
    }
    catch (err) {
        next(err);
    }
});
