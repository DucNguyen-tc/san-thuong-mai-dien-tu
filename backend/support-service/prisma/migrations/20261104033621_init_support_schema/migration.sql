-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('FORM', 'AI_ESCALATE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'ANALYZING', 'PENDING_REVIEW', 'RESPONDED', 'REOPENED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "TicketSentiment" AS ENUM ('ANGRY', 'FRUSTRATED', 'DISAPPOINTED', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('CUSTOMER', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_number" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "customer_name" VARCHAR(255),
    "subject" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) DEFAULT 'OTHER',
    "related_order_id" UUID,
    "source" "TicketSource" NOT NULL DEFAULT 'FORM',
    "chat_session_id" UUID,
    "sentiment" "TicketSentiment",
    "sentiment_score" INTEGER,
    "priority" "TicketPriority" NOT NULL DEFAULT 'P3',
    "ai_category" VARCHAR(50),
    "ai_summary" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to" UUID,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "sender_id" UUID,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_responses" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "ai_draft" TEXT NOT NULL,
    "rag_chunks_used" JSONB,
    "ai_tone" VARCHAR(30),
    "ai_confidence" INTEGER,
    "staff_id" UUID,
    "final_response" TEXT,
    "staff_notes" TEXT,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "idx_tickets_customer" ON "tickets"("customer_id");

-- CreateIndex
CREATE INDEX "idx_tickets_status" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "idx_tickets_priority" ON "tickets"("priority");

-- CreateIndex
CREATE INDEX "idx_tickets_created" ON "tickets"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ticket_messages_ticket" ON "ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_ticket_responses_ticket" ON "ticket_responses"("ticket_id");

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_responses" ADD CONSTRAINT "ticket_responses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
