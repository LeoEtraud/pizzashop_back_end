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

    // cria manager apenas se ainda não existir (NÃO atualiza dados de usuário existente)
    let manager = await bdPizzaShop.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!manager) {
      try {
        manager = await bdPizzaShop.user.create({
          data: { name: managerName, email, phone, role: "manager" },
          select: { id: true },
        });
      } catch (errCreate: any) {
        // condição de corrida: se outro processo criou o mesmo e-mail agora
        if (errCreate?.code === "P2002") {
          manager = await bdPizzaShop.user.findUnique({
            where: { email },
            select: { id: true },
          });
        } else {
          throw errCreate;
        }
      }
    }

    // cria o restaurante e retorna os dados criados
    const restaurant = await bdPizzaShop.restaurant.create({
      data: {
        name: restaurantName,
        managerId: manager!.id,
      },
      select: {
        id: true,
        name: true,
        managerId: true,
        createdAt: true, // remova se seu schema não tiver esse campo
        updatedAt: true, // remova se seu schema não tiver esse campo
      },
    });

    // opcional: Location do recurso criado
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
