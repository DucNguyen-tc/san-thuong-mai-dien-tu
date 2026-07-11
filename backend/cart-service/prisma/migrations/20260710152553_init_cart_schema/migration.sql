-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT');

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" BIGSERIAL NOT NULL,
    "cart_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "product_name_snapshot" VARCHAR(255) NOT NULL,
    "variant_attributes_snapshot" JSONB NOT NULL,
    "unit_price_snapshot" DECIMAL(12,0) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ràng buộc UNIQUE dạng PARTIAL: Mỗi khách hàng chỉ có tối đa 01 giỏ hàng ở trạng thái ACTIVE
CREATE UNIQUE INDEX uq_active_cart_per_customer ON "carts" ("customer_id") WHERE "status" = 'ACTIVE';

-- Ràng buộc CHECK: Đảm bảo số lượng sản phẩm trong giỏ hàng luôn lớn hơn 0
ALTER TABLE "cart_items" ADD CONSTRAINT check_cart_item_quantity CHECK (quantity > 0);
