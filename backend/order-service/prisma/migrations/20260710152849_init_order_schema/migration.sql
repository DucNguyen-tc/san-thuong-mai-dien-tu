-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VNPAY', 'MOMO', 'CASH');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "shipping_address" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "subtotal" DECIMAL(12,0) NOT NULL,
    "discount_amount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "shipping_fee" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,0) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "product_name_snapshot" VARCHAR(255) NOT NULL,
    "variant_attributes_snapshot" JSONB NOT NULL,
    "original_unit_price" DECIMAL(12,0) NOT NULL,
    "unit_price_snapshot" DECIMAL(12,0) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(12,0) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_orders_customer_id" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("status");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ràng buộc CHECK: Đảm bảo số lượng sản phẩm mua trong đơn hàng luôn lớn hơn 0
ALTER TABLE "order_items" ADD CONSTRAINT check_order_item_quantity CHECK (quantity > 0);

