"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvaluationsRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
const authentication_1 = require("../../middlewares/authentication");
exports.getEvaluationsRouter = (0, express_1.Router)();
function qp(v) {
    if (typeof v === "string")
        return v;
    if (Array.isArray(v))
        return v.length ? String(v[0] ?? "") : undefined;
    if (v == null)
        return undefined;
    return String(v);
}
/**
 * GET /evaluations?pageIndex=0
 * - exige manager
 * - pagina 10 por página, mais recentes primeiro
 * - (segurança) filtra por restaurantId do manager
 */
exports.getEvaluationsRouter.get("/evaluations", authentication_1.authentication, async (req, res, next) => {
    try {
        const restaurantId = await (0, authentication_1.getManagedRestaurantId)(req);
        const pageIndex = Number(qp(req.query.pageIndex) ?? "0");
        if (Number.isNaN(pageIndex) || pageIndex < 0) {
            return res.status(400).json({ message: "pageIndex inválido" });
        }
        const perPage = 10;
        const evaluations = await prismaClient_1.bdPizzaShop.evaluation.findMany({
            where: { restaurantId },
            orderBy: { createdAt: "desc" },
            skip: pageIndex * perPage,
            take: perPage,
        });
        return res.json(evaluations);
    }
    catch (err) {
        next(err);
    }
});
