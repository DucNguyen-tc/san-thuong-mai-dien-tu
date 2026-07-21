CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "promotions" ADD COLUMN     "code" VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN     "min_order_value" DECIMAL(12,0),
ADD COLUMN     "usage_limit" INTEGER,
ADD COLUMN     "used_count" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

CREATE INDEX "product_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
