-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'PACKED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReverseShipmentStatus" AS ENUM ('PICKUP_PENDING', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED_TO_WAREHOUSE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable for order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "shipmentId" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "returnStatus" "ReturnStatus";

-- AlterTable for shipments
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "awb" TEXT;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED';
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "estimatedDelivery" TIMESTAMP(3);

-- Make shipments columns NOT NULL if they are already populated
UPDATE "shipments" SET "carrier" = 'Manual' WHERE "carrier" IS NULL;
UPDATE "shipments" SET "trackingNumber" = 'MOCK-' || id WHERE "trackingNumber" IS NULL;

-- Safely make columns not null and add constraints
ALTER TABLE "shipments" ALTER COLUMN "carrier" SET NOT NULL;
ALTER TABLE "shipments" ALTER COLUMN "trackingNumber" SET NOT NULL;

DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "shipments_trackingNumber_key" ON "shipments"("trackingNumber");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateTable for ShipmentEvent
CREATE TABLE IF NOT EXISTS "shipment_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable for ReturnEvent
CREATE TABLE IF NOT EXISTS "return_events" (
    "id" TEXT NOT NULL,
    "returnReqId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable for ReverseShipment
CREATE TABLE IF NOT EXISTS "reverse_shipments" (
    "id" TEXT NOT NULL,
    "returnReqId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "awb" TEXT,
    "status" "ReverseShipmentStatus" NOT NULL DEFAULT 'PICKUP_PENDING',
    "pickupDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reverse_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WalletRefund
CREATE TABLE IF NOT EXISTS "wallet_refunds" (
    "id" TEXT NOT NULL,
    "returnReqId" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "logisticsDeduction" DECIMAL(10,2) NOT NULL,
    "finalRefund" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_refunds_pkey" PRIMARY KEY ("id")
);

-- AddUniqueConstraints and Indexes
DO $$ BEGIN
    CREATE UNIQUE INDEX "reverse_shipments_returnReqId_key" ON "reverse_shipments"("returnReqId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX "reverse_shipments_trackingNumber_key" ON "reverse_shipments"("trackingNumber");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX "wallet_refunds_returnReqId_key" ON "wallet_refunds"("returnReqId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "shipment_events_shipmentId_idx" ON "shipment_events"("shipmentId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "return_events_returnReqId_idx" ON "return_events"("returnReqId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "order_items_shipmentId_idx" ON "order_items"("shipmentId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- AddForeignKeys (wrapped to prevent duplicate key errors if run multiple times)
DO $$ BEGIN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "return_events" ADD CONSTRAINT "return_events_returnReqId_fkey" FOREIGN KEY ("returnReqId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "reverse_shipments" ADD CONSTRAINT "reverse_shipments_returnReqId_fkey" FOREIGN KEY ("returnReqId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "wallet_refunds" ADD CONSTRAINT "wallet_refunds_returnReqId_fkey" FOREIGN KEY ("returnReqId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
