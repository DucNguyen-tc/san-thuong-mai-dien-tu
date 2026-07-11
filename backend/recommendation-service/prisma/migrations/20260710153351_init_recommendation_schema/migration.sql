-- Kích hoạt extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "RecommendationEventType" AS ENUM ('IMPRESSION', 'CLICK', 'PURCHASE');

-- CreateTable
CREATE TABLE "product_vectors" (
    "product_id" UUID NOT NULL,
    "embedding" vector(500) NOT NULL,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_vectors_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "recommendation_logs" (
    "id" BIGSERIAL NOT NULL,
    "source_product_id" UUID NOT NULL,
    "recommended_product_id" UUID NOT NULL,
    "customer_id" UUID,
    "event_type" "RecommendationEventType" NOT NULL,
    "similarity_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_logs_pkey" PRIMARY KEY ("id")
);

-- Thay đổi cột embedding sang kiểu vector (nếu Prisma generate dạng text)
-- (Thường Prisma Unsupported("vector(500)") sẽ tự động tạo đúng kiểu, nhưng ta thêm câu lệnh tạo Index HNSW)
CREATE INDEX ON "product_vectors" USING hnsw (embedding vector_cosine_ops);

