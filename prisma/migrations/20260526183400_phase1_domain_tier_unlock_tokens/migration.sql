-- Phase 1 (additive): ProductDomain, UserTier, Profile.tier, Product domain gates,
-- UnlockAccessToken (UUID PK, tokenHash only — no raw bearer storage).
-- ProductChannel is unchanged; domain is backfilled from channel when present.

-- CreateEnum
CREATE TYPE "ProductDomain" AS ENUM ('PREMIUM_WEAR', 'EXCLUSIVE_RACK', 'EXCLUSIVE_UNLOCK');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('STANDARD', 'VIP', 'INNER_CIRCLE');

-- CreateEnum
CREATE TYPE "UnlockTokenStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "UnlockTokenType" AS ENUM ('STANDARD', 'INVITE', 'ADMIN', 'RESERVATION', 'CAMPAIGN');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "tier" "UserTier" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "products" ADD COLUMN "domain" "ProductDomain" NOT NULL DEFAULT 'PREMIUM_WEAR',
ADD COLUMN "requiresTierAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "minimumTier" "UserTier",
ADD COLUMN "requiresUnlockToken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "unlockStartsAt" TIMESTAMPTZ,
ADD COLUMN "unlockEndsAt" TIMESTAMPTZ;

-- Backfill ProductDomain from ProductChannel (no runtime switch yet; data alignment only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'channel'
  ) THEN
    UPDATE "products" SET "domain" = 'PREMIUM_WEAR'::"ProductDomain" WHERE "channel"::text = 'DROP';
    UPDATE "products" SET "domain" = 'EXCLUSIVE_RACK'::"ProductDomain" WHERE "channel"::text = 'EXCLUSIVE_RACK';
    UPDATE "products" SET "domain" = 'EXCLUSIVE_UNLOCK'::"ProductDomain" WHERE "channel"::text = 'EXCLUSIVE_UNLOCK';
  END IF;
END $$;

-- CreateTable
CREATE TABLE "unlock_access_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash" TEXT NOT NULL,
    "type" "UnlockTokenType" NOT NULL DEFAULT 'STANDARD',
    "status" "UnlockTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "productId" TEXT NOT NULL,
    "claimedByProfileId" TEXT,
    "claimedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unlock_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unlock_access_tokens_tokenHash_key" ON "unlock_access_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "unlock_access_tokens_productId_status_idx" ON "unlock_access_tokens"("productId", "status");

-- CreateIndex
CREATE INDEX "unlock_access_tokens_claimedByProfileId_idx" ON "unlock_access_tokens"("claimedByProfileId");

-- CreateIndex
CREATE INDEX "unlock_access_tokens_expiresAt_status_idx" ON "unlock_access_tokens"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "products_domain_idx" ON "products"("domain");

-- CreateIndex
CREATE INDEX "products_domain_status_idx" ON "products"("domain", "status");

-- AddForeignKey
ALTER TABLE "unlock_access_tokens" ADD CONSTRAINT "unlock_access_tokens_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlock_access_tokens" ADD CONSTRAINT "unlock_access_tokens_claimedByProfileId_fkey" FOREIGN KEY ("claimedByProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
