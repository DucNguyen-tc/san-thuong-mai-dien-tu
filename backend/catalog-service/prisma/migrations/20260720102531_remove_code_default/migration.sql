-- DropIndex
DROP INDEX "product_name_trgm_idx";

-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "code" DROP DEFAULT;
