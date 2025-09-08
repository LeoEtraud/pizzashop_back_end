"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomerRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../database/prismaClient");
exports.registerCustomerRouter = (0, express_1.Router)();
/**
 * POST /customers
 * body: { name: string; phone?: string; email: string }
 */
exports.registerCustomerRouter.post("/customers", async (req, res, next) => {
    try {
        const name = String(req.body?.name ?? "").trim();
        const email = String(req.body?.email ?? "")
            .trim()
            .toLowerCase();
        const phone = req.body?.phone !== undefined && req.body?.phone !== null
            ? String(req.body.phone).trim()
            : undefined;
        if (!name)
            return res.status(400).json({ message: "name é obrigatório" });
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ message: "email inválido" });
        await prismaClient_1.bdPizzaShop.user.create({
            data: { name, email, phone, role: "customer" },
        });
        // no Elysia estava 401 (provável engano); aqui retornamos 201 Created
        return res.status(201).send();
    }
    catch (err) {
        // Unique constraint
        if (err?.code === "P2002") {
            return res.status(409).json({ message: "email já cadastrado" });
        }
        next(err);
    }
});
