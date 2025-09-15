import { bdPizzaShop } from "../database/prismaClient";

function dateAtLocal(year: number, monthIdx: number, day: number) {
  // monthIdx: 0=jan ... 11=dez
  return new Date(year, monthIdx, day, 12, 0, 0, 0); // meio-dia evita problemas de fuso
}

export async function seedNewRestaurant(params: {
  restaurantId: string;
  managerId: string;
}) {
  const { restaurantId } = params;

  // Evita duplicar produtos se já existir algo
  const alreadyHasProducts = await bdPizzaShop.product.count({
    where: { restaurantId },
  });
  if (alreadyHasProducts > 0) {
    return { skipped: true };
  }

  // Cliente demo
  const demoEmail = `customer+${restaurantId}@example.com`;
  const customer = await bdPizzaShop.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: "Francisco dos Santos",
      email: demoEmail,
      role: "customer",
    },
    select: { id: true },
  });

  // Produtos base
  const quatroQueijos = await bdPizzaShop.product.create({
    data: {
      name: "Pizza 4 queijos",
      priceInCents: 6000,
      restaurantId,
    },
    select: { id: true, priceInCents: true },
  });

  const calabresa = await bdPizzaShop.product.create({
    data: {
      name: "Pizza Calabresa",
      priceInCents: 5000,
      restaurantId,
    },
    select: { id: true, priceInCents: true },
  });

  // Gera pedidos de 01 ao 15 do mês atual (inclui hoje se hoje for dia 15)
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth(); // 0=jan ... 11=dez

  for (let day = 1; day <= 15; day++) {
    // Varia quantidades de forma determinística para diversificar o total
    // (sem "random" — repetível entre execuções)
    const qty4Q = (day % 3) + 1; // 1..3
    const qtyCal = (day % 2) + 1; // 1..2

    const total =
      qty4Q * quatroQueijos.priceInCents + qtyCal * calabresa.priceInCents;

    await bdPizzaShop.order.create({
      data: {
        customerId: customer.id,
        restaurantId,
        status: "pending",
        totalInCents: total,
        createdAt: dateAtLocal(year, monthIdx, day),
        orderItems: {
          create: [
            {
              productId: quatroQueijos.id,
              quantity: qty4Q,
              priceInCents: quatroQueijos.priceInCents,
            },
            {
              productId: calabresa.id,
              quantity: qtyCal,
              priceInCents: calabresa.priceInCents,
            },
          ],
        },
      },
    });
  }

  return { skipped: false };
}
