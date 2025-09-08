"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = authentication;
exports.getCurrentUser = getCurrentUser;
exports.getManagedRestaurantId = getManagedRestaurantId;
const jwt = __importStar(require("jsonwebtoken"));
const prismaClient_1 = require("../database/prismaClient"); // 👈 importe o client
function authentication(req, res, next) {
    const token = req.cookies?.auth;
    if (!token)
        return res.status(401).json({ message: "Usuário não está autenticado!" });
    try {
        const rawSecret = (process.env.JWT_SECRET_KEY ?? process.env.JWT_SECRET);
        const payload = jwt.verify(token, rawSecret);
        req.user =
            typeof payload === "string" ? { sub: payload } : payload;
        next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido!" });
    }
}
async function getCurrentUser(req) {
    const user = req.user;
    if (!user)
        throw new Error("Unauthorized");
    return user;
}
/**
 * Retorna o restaurantId do manager autenticado.
 * 1) Se vier no token, usa;
 * 2) Senão, busca no banco pelo managerId = user.id|sub
 */
async function getManagedRestaurantId(req) {
    const user = await getCurrentUser(req);
    if (user.restaurantId)
        return user.restaurantId;
    const userId = user.id ?? user.sub; // alguns tokens usam 'sub'
    if (!userId)
        throw new Error("User id not present in token.");
    const restaurant = await prismaClient_1.bdPizzaShop.restaurant.findFirst({
        where: { managerId: userId },
        select: { id: true },
    });
    if (!restaurant) {
        throw new Error("User is not a restaurant manager.");
    }
    // opcional: “enriquece” o req.user para próximas chamadas
    req.user = { ...user, restaurantId: restaurant.id };
    return restaurant.id;
}
