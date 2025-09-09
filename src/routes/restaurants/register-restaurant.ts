import { Router } from "express";
import { bdPizzaShop } from "../../database/prismaClient";

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

    // se já existir usuário com este e-mail, não altera nada e bloqueia criação
    const alreadyExists = await bdPizzaShop.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (alreadyExists) {
      return res.status(409).json({
        message: "já existe um restaurante cadastrado com essa conta de e-mail",
      });
    }

    // cria manager (se bater condição de corrida e alguém criar antes, tratamos P2002)
    let managerId: string;
    try {
      const manager = await bdPizzaShop.user.create({
        data: { name: managerName, email, phone, role: "manager" },
        select: { id: true },
      });
      managerId = manager.id;
    } catch (errCreate: any) {
      if (errCreate?.code === "P2002") {
        return res.status(409).json({
          message:
            "já existe um restaurante cadastrado com essa conta de e-mail",
        });
      }
      throw errCreate;
    }

    // cria o restaurante e retorna os dados criados
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

    res.setHeader("Location", `/restaurants/${restaurant.id}`);
    return res.status(201).json(restaurant);
  } catch (err: any) {
    // conflito pode acontecer se houver alguma unique key custom
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Conflito de dados" });
    }
    next(err);
  }
});
