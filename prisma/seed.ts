import { bdPizzaShop } from "../src/database/prismaClient";

async function main() {
  // cria um manager
  const manager = await bdPizzaShop.user.upsert({
    where: { email: "manager@pizza.com" },
    update: {},
    create: {
      name: "Manager 1",
      email: "manager@pizza.com",
      role: "manager",
    },
  });

  // cria um cliente
  const customer = await bdPizzaShop.user.upsert({
    where: { email: "customer@pizza.com" },
    update: {},
    create: {
      name: "Cliente 1",
      email: "customer@pizza.com",
      role: "customer",
    },
  });

  // cria um restaurante
  const restaurant = await bdPizzaShop.restaurant.create({
    data: {
      name: "Pizzaria Teste",
      description: "Pizzaria exemplo criada pelo seed",
      managerId: manager.id,
    },
  });

  // cria alguns produtos
  const margherita = await bdPizzaShop.product.create({
    data: {
      name: "Pizza Margherita",
      priceInCents: 4500,
      restaurantId: restaurant.id,
    },
  });

  const calabresa = await bdPizzaShop.product.create({
    data: {
      name: "Pizza Calabresa",
      priceInCents: 5000,
      restaurantId: restaurant.id,
    },
  });

  // cria um pedido
  await bdPizzaShop.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      status: "pending",
      totalInCents: 9500,
      orderItems: {
        create: [
          {
            productId: margherita.id,
            quantity: 1,
            priceInCents: 4500,
          },
          {
            productId: calabresa.id,
            quantity: 1,
            priceInCents: 5000,
          },
        ],
      },
    },
  });

  console.log("🌱 Seed executado com sucesso!");
}

main()
  .then(async () => {
    await bdPizzaShop.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await bdPizzaShop.$disconnect();
    process.exit(1);
  });
