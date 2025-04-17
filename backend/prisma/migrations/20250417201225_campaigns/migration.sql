-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('STANDARD', 'MODEL', 'PRODUCT', 'MERGED');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "campaign_type" "CampaignType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "is_model_campaign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_product_campaign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "merge_date" TIMESTAMP(6),
ADD COLUMN     "merge_status" TEXT,
ADD COLUMN     "merged_campaign_id" INTEGER,
ADD COLUMN     "source_campaign_ids" TEXT;
