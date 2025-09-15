import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";
import { seedNewRestaurant } from "../../services/seedNewRestaurant";

export const registerRestaurantRouter = Router();

registerRestaurantRouter.post("/restaurants", async (req, res, next) => {
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

    // Verifica se já existe usuário com esse e-mail
    const alreadyExists = await bdPizzaShop.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (alreadyExists) {
      return res.status(409).json({
        message: "já existe um restaurante cadastrado com essa conta de e-mail",
      });
    }

    // Cria manager
    let managerId: string;
    try {
      const manager = await bdPizzaShop.user.create({
        data: { name: managerName, email, phone, role: "manager" },
        select: { id: true },
      });
      managerId = manager.id;
    } catch (e: any) {
      if (e?.code === "P2002") {
        return res.status(409).json({
          message:
            "já existe um restaurante cadastrado com essa conta de e-mail",
        });
      }
      throw e;
    }

    // Cria restaurante
    const restaurant = await bdPizzaShop.restaurant.create({
      data: {
        name: restaurantName,
        managerId,
      },
      select: {
        id: true,
        name: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Executa seed logo após criar restaurante
    const seed = await seedNewRestaurant({
      restaurantId: restaurant.id,
      managerId,
    });

    res.setHeader("Location", `/restaurants/${restaurant.id}`);
    return res.status(201).json({
      ...restaurant,
      message: seed.skipped
        ? "Restaurante criado (já possuía dados demo)."
        : "Restaurante criado com dados de demonstração.",
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Conflito de dados" });
    }
    next(err);
  }
});
