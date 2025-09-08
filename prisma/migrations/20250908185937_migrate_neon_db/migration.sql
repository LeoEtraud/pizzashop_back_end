/*
  Warnings:

  - You are about to drop the column `created_at` on the `auth_links` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `auth_links` table. All the data in the column will be lost.
  - You are about to drop the column `used_at` on the `auth_links` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `auth_links` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `evaluations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `restaurants` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expiresAt` to the `auth_links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `auth_links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."auth_links" DROP CONSTRAINT "auth_links_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluations" DROP CONSTRAINT "evaluations_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluations" DROP CONSTRAINT "evaluations_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."restaurants" DROP CONSTRAINT "restaurants_manager_id_fkey";

-- DropIndex
DROP INDEX "public"."auth_links_user_created_idx";

-- AlterTable
ALTER TABLE "public"."auth_links" DROP COLUMN "created_at",
DROP COLUMN "expires_at",
DROP COLUMN "used_at",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMPTZ(6),
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) NOT NULL;

-- DropTable
DROP TABLE "public"."evaluations";

-- DropTable
DROP TABLE "public"."order_items";

-- DropTable
DROP TABLE "public"."orders";

-- DropTable
DROP TABLE "public"."products";

-- DropTable
DROP TABLE "public"."restaurants";

-- DropEnum
DROP TYPE "public"."order_status";

-- CreateIndex
CREATE INDEX "auth_links_user_created_idx" ON "public"."auth_links"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."auth_links" ADD CONSTRAINT "auth_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
