-- CreateEnum
CREATE TYPE "UserEventType" AS ENUM ('VIEW', 'ADD_TO_CART');

-- CreateTable
CREATE TABLE "user_product_events" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "event_type" "UserEventType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_product_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_product_events_customer_id_created_at_idx" ON "user_product_events"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "recommendation_logs_created_at_idx" ON "recommendation_logs"("created_at");
