import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";

export const registerCustomerRouter = Router();

/**
 * POST /customers
 * body: { name: string; phone?: string; email: string }
 */
registerCustomerRouter.post("/customers", async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const phone =
      req.body?.phone !== undefined && req.body?.phone !== null
        ? String(req.body.phone).trim()
        : undefined;

    if (!name) return res.status(400).json({ message: "name é obrigatório" });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "email inválido" });

    await bdPizzaShop.user.create({
      data: { name, email, phone, role: "customer" },
    });

    // no Elysia estava 401 (provável engano); aqui retornamos 201 Created
    return res.status(201).send();
  } catch (err: any) {
    // Unique constraint
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "email já cadastrado" });
    }
    next(err);
  }
});
