"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvaluationRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.createEvaluationRouter = (0, express_1.Router)();
/**
 * POST /evaluations
 * body: { restaurantId: string; rate: 1..5; comment?: string }
 */
exports.createEvaluationRouter.post("/evaluations", authentication_1.authentication, async (req, res, next) => {
    try {
        const { id, sub } = await (0, authentication_1.getCurrentUser)(req);
        const userId = id ?? sub;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const restaurantId = String(req.body?.restaurantId ?? "");
        const rate = Number(req.body?.rate ?? 0);
        const comment = req.body?.comment !== undefined && req.body?.comment !== null
            ? String(req.body.comment)
            : undefined;
        if (!restaurantId)
            return res.status(400).json({ message: "restaurantId inválido" });
        if (!Number.isInteger(rate) || rate < 1 || rate > 5) {
            return res
                .status(400)
                .json({ message: "rate deve ser inteiro entre 1 e 5" });
        }
        await prismaClient_1.bdPizzaShop.evaluation.create({
            data: {
                restaurantId,
                customerId: userId,
                rate,
                comment,
            },
        });
        return res.status(201).send();
    }
    catch (err) {
        next(err);
    }
});
