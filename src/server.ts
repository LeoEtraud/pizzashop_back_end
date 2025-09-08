import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { bdPizzaShop } from "./database/prismaClient";
import { authRouter } from "./routes/send-authentication-magic-link";
import { authLinksRouter } from "./routes/auth-links";
import { getOrdersRouter } from "./routes/orders/get-orders";
import { getOrderDetailsRouter } from "./routes/orders/get-order-details";
import { approveOrderRouter } from "./routes/orders/approve-order";
import { dispatchOrderRouter } from "./routes/orders/dispatch-order";
import { deliverOrderRouter } from "./routes/orders/deliver-order";
import { cancelOrderRouter } from "./routes/orders/cancel-order";
import { dailyReceiptInPeriodRouter } from "./routes/metrics/daily-receipt-in-period";
import { dayOrdersAmountRouter } from "./routes/metrics/day-orders-amount";
import { monthCanceledOrdersAmountRouter } from "./routes/metrics/month-canceled-orders-amount";
import { monthOrdersAmountRouter } from "./routes/metrics/month-orders-amount";
import { monthReceiptRouter } from "./routes/metrics/month-receipt";
import { popularProductsRouter } from "./routes/metrics/popular-products";
import { getProfileRouter } from "./routes/users/get-profile";
import { registerCustomerRouter } from "./routes/customers/register-customer";
import { registerRestaurantRouter } from "./routes/restaurants/register-restaurant";
import { getEvaluationsRouter } from "./routes/evaluations/get-evaluations";
import { createOrderRouter } from "./routes/orders/create-order";
import { createEvaluationRouter } from "./routes/evaluations/create-evaluation";

const app = express();

function toOrigin(u: string) {
  try {
    return new URL(u).origin;
  } catch {
    return u;
  }
}

const FRONT_URLS = (
  process.env.FRONT_ORIGINS ||
  process.env.AUTH_REDIRECT_URL ||
  "https://pizzashop-three.vercel.app/"
)
  .split(",")
  .map((s) => s.trim())
  .map(toOrigin);

const corsConfig: cors.CorsOptions = {
  origin: FRONT_URLS, // NÃO use "*" com credentials
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
};

// ÚNICO middleware CORS — já responde preflight (OPTIONS) automaticamente
app.use(cors(corsConfig));

/* ====================== Middlewares base ====================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // para ler/escrever cookies

// Cache leve (não altera CORS)
app.use((_req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );
  next();
});

/* ======================= Estáticos (opcional) ======================= */
app.use(express.static("public"));

/* ========================= Healthcheck ========================= */
app.get("/health", (_req, res) =>
  res.json({ ok: true, uptime: process.uptime() })
);

/* ========================= Suas rotas ========================= */
app.use(authRouter);
app.use(authLinksRouter);

app.use(getOrdersRouter);
app.use(getOrderDetailsRouter);
app.use(approveOrderRouter);
app.use(dispatchOrderRouter);
app.use(deliverOrderRouter);
app.use(cancelOrderRouter);

app.use(getProfileRouter);
app.use(registerCustomerRouter);
app.use(registerRestaurantRouter);

app.use(getEvaluationsRouter);
app.use(createOrderRouter);
app.use(createEvaluationRouter);

app.use(dailyReceiptInPeriodRouter);
app.use(dayOrdersAmountRouter);
app.use(monthCanceledOrdersAmountRouter);
app.use(monthOrdersAmountRouter);
app.use(monthReceiptRouter);
app.use(popularProductsRouter);
/* ===================== Tratador de erros global ===================== */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Erro interno no servidor";
  if (!res.headersSent) res.status(status).json({ message });
});

/* ========================== Inicialização ========================== */
const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || "0.0.0.0";
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

const server = app.listen(PORT, HOST, () => {
  console.log(
    `🚀 Server on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV ?? "development"})`
  );
});

/* ======================= Logs de processo úteis ======================= */
process.on("unhandledRejection", (reason) =>
  console.error("[unhandledRejection]", reason)
);
process.on("uncaughtException", (err) =>
  console.error("[uncaughtException]", err)
);

/* ========================= Encerramento suave ========================= */
const shutdown = (signal: string) => {
  console.log(`\n${signal} recebido. Encerrando...`);
  server.close(async () => {
    try {
      await bdPizzaShop.$disconnect();
    } finally {
      console.log("✅ Encerrado. Até mais!");
      process.exit(0);
    }
  });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default server;
