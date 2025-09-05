import "express-serve-static-core";
import type { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?:
      | (JwtPayload & {
          id?: string;
          sub?: string;
          restaurantId?: string;
        })
      | null;
  }
}
export {};
