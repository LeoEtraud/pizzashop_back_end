"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const prismaClient_1 = require("./database/prismaClient");
const send_authentication_magic_link_1 = require("./routes/send-authentication-magic-link");
const auth_links_1 = require("./routes/auth-links");
const get_orders_1 = require("./routes/orders/get-orders");
const get_order_details_1 = require("./routes/orders/get-order-details");
const approve_order_1 = require("./routes/orders/approve-order");
const dispatch_order_1 = require("./routes/orders/dispatch-order");
const deliver_order_1 = require("./routes/orders/deliver-order");
const cancel_order_1 = require("./routes/orders/cancel-order");
const daily_receipt_in_period_1 = require("./routes/metrics/daily-receipt-in-period");
const day_orders_amount_1 = require("./routes/metrics/day-orders-amount");
const month_canceled_orders_amount_1 = require("./routes/metrics/month-canceled-orders-amount");
const month_orders_amount_1 = require("./routes/metrics/month-orders-amount");
const month_receipt_1 = require("./routes/metrics/month-receipt");
const popular_products_1 = require("./routes/metrics/popular-products");
const get_profile_1 = require("./routes/users/get-profile");
const register_customer_1 = require("./routes/customers/register-customer");
const register_restaurant_1 = require("./routes/restaurants/register-restaurant");
const get_evaluations_1 = require("./routes/evaluations/get-evaluations");
const create_order_1 = require("./routes/orders/create-order");
const create_evaluation_1 = require("./routes/evaluations/create-evaluation");
const app = (0, express_1.default)();
function toOrigin(u) {
    try {
        return new URL(u).origin;
    }
    catch {
        return u;
    }
}
const FRONT_URLS = (process.env.FRONT_ORIGINS ||
    process.env.AUTH_REDIRECT_URL ||
    "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .map(toOrigin);
const corsConfig = {
    origin: FRONT_URLS, // NÃO use "*" com credentials
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
};
// ÚNICO middleware CORS — já responde preflight (OPTIONS) automaticamente
app.use((0, cors_1.default)(corsConfig));
/* ====================== Middlewares base ====================== */
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)()); // para ler/escrever cookies
// Cache leve (não altera CORS)
app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=59");
    next();
});
/* ======================= Estáticos (opcional) ======================= */
app.use(express_1.default.static("public"));
/* ========================= Healthcheck ========================= */
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
/* ========================= Suas rotas ========================= */
app.use(send_authentication_magic_link_1.authRouter);
app.use(auth_links_1.authLinksRouter);
app.use(get_orders_1.getOrdersRouter);
app.use(get_order_details_1.getOrderDetailsRouter);
app.use(approve_order_1.approveOrderRouter);
app.use(dispatch_order_1.dispatchOrderRouter);
app.use(deliver_order_1.deliverOrderRouter);
app.use(cancel_order_1.cancelOrderRouter);
app.use(get_profile_1.getProfileRouter);
app.use(register_customer_1.registerCustomerRouter);
app.use(register_restaurant_1.registerRestaurantRouter);
app.use(get_evaluations_1.getEvaluationsRouter);
app.use(create_order_1.createOrderRouter);
app.use(create_evaluation_1.createEvaluationRouter);
app.use(daily_receipt_in_period_1.dailyReceiptInPeriodRouter);
app.use(day_orders_amount_1.dayOrdersAmountRouter);
app.use(month_canceled_orders_amount_1.monthCanceledOrdersAmountRouter);
app.use(month_orders_amount_1.monthOrdersAmountRouter);
app.use(month_receipt_1.monthReceiptRouter);
app.use(popular_products_1.popularProductsRouter);
/* ===================== Tratador de erros global ===================== */
app.use((err, _req, res, _next) => {
    console.error(err);
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message ?? "Erro interno no servidor";
    if (!res.headersSent)
        res.status(status).json({ message });
});
/* ========================== Inicialização ========================== */
const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || "0.0.0.0";
if (process.env.TRUST_PROXY === "1")
    app.set("trust proxy", 1);
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV ?? "development"})`);
});
/* ======================= Logs de processo úteis ======================= */
process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
process.on("uncaughtException", (err) => console.error("[uncaughtException]", err));
/* ========================= Encerramento suave ========================= */
const shutdown = (signal) => {
    console.log(`\n${signal} recebido. Encerrando...`);
    server.close(async () => {
        try {
            await prismaClient_1.bdPizzaShop.$disconnect();
        }
        finally {
            console.log("✅ Encerrado. Até mais!");
            process.exit(0);
        }
    });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
exports.default = server;
