-- ============================================================
-- SUCKSPHERE — Complete Database Schema
-- Apply this in Supabase Dashboard → SQL Editor
-- Generated from prisma/schema.prisma (Phase 2)
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM (
  'CUSTOMER',
  'ADMIN',
  'CONTENT_EDITOR',
  'OPERATIONS',
  'SUPPORT',
  'MARKETING'
);

CREATE TYPE "ProductStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'HIDDEN',
  'ARCHIVED',
  'SOLD_OUT'
);

CREATE TYPE "DropStatus" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'ARCHIVED'
);

CREATE TYPE "InventoryType" AS ENUM (
  'PERMANENT',
  'LIMITED'
);

CREATE TYPE "MovementType" AS ENUM (
  'PURCHASE',
  'RESERVE',
  'UNRESERVE',
  'CANCEL',
  'RETURN',
  'RESTOCK',
  'ADJUSTMENT'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'EXCHANGE_REQUESTED',
  'RETURN_REQUESTED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'UNPAID',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'RAZORPAY',
  'COD',
  'WALLET',
  'MIXED'
);

CREATE TYPE "FulfillmentStatus" AS ENUM (
  'UNFULFILLED',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'RETURNED'
);

CREATE TYPE "WalletTxnType" AS ENUM (
  'CREDIT_RETURN',
  'CREDIT_PROMOTIONAL',
  'CREDIT_REFERRAL',
  'CREDIT_ADJUSTMENT',
  'DEBIT_ORDER',
  'DEBIT_EXPIRED'
);

CREATE TYPE "DiscountType" AS ENUM (
  'PERCENTAGE',
  'FLAT_AMOUNT',
  'FREE_SHIPPING'
);

CREATE TYPE "ReturnType" AS ENUM (
  'EXCHANGE',
  'RETURN_FOR_CREDIT'
);

CREATE TYPE "ReturnStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'RECEIVED',
  'COMPLETED'
);

CREATE TYPE "ReturnResolution" AS ENUM (
  'STORE_CREDIT',
  'EXCHANGE_SAME',
  'EXCHANGE_DIFF'
);

CREATE TYPE "ArchivePostType" AS ENUM (
  'EDITORIAL',
  'MOODBOARD',
  'OBSERVATION',
  'ARTIFACT',
  'CAMPAIGN'
);

CREATE TYPE "ContentStatus" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
);

CREATE TYPE "CampaignType" AS ENUM (
  'HERO',
  'EDITORIAL',
  'PRODUCT',
  'LOOKBOOK'
);

-- ── DOMAIN 1: IDENTITY & AUTH ─────────────────────────────────

CREATE TABLE profiles (
  id          TEXT        PRIMARY KEY,  -- mirrors auth.users.id (UUID)
  email       TEXT        NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName"  TEXT,
  phone       TEXT,
  role        "UserRole"  NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" TEXT        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "firstName" TEXT        NOT NULL,
  "lastName"  TEXT        NOT NULL,
  line1       TEXT        NOT NULL,
  line2       TEXT,
  city        TEXT        NOT NULL,
  state       TEXT        NOT NULL,
  pincode     TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  "isDefault" BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_profile ON addresses("profileId");

-- ── DOMAIN 2: CATALOGUE ───────────────────────────────────────

CREATE TABLE categories (
  id       TEXT    PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT    NOT NULL UNIQUE,
  slug     TEXT    NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0
);

-- drops must exist before products (FK below)
CREATE TABLE drops (
  id                    TEXT          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT          NOT NULL,
  slug                  TEXT          NOT NULL UNIQUE,
  tagline               TEXT          NOT NULL,
  description           TEXT          NOT NULL,
  status                "DropStatus"  NOT NULL DEFAULT 'SCHEDULED',
  season                TEXT,
  "releaseAt"           TIMESTAMPTZ,
  "endsAt"              TIMESTAMPTZ,
  "heroImageUrl"        TEXT,
  "campaignImageUrls"   TEXT[]        NOT NULL DEFAULT '{}',
  "isPasswordProtected" BOOLEAN       NOT NULL DEFAULT FALSE,
  "accessPasswordHash"  TEXT,
  "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id             TEXT            PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT            NOT NULL,
  slug           TEXT            NOT NULL UNIQUE,
  tagline        TEXT,
  "shortDesc"    TEXT,
  description    TEXT            NOT NULL,
  symbolism      TEXT,
  status         "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "isFeatured"   BOOLEAN         NOT NULL DEFAULT FALSE,
  "categoryId"   TEXT            NOT NULL REFERENCES categories(id),
  "dropId"       TEXT            REFERENCES drops(id),
  "seoTitle"     TEXT,
  "seoDescription" TEXT,
  "createdAt"    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "publishedAt"  TIMESTAMPTZ
);

CREATE INDEX idx_products_status     ON products(status);
CREATE INDEX idx_products_drop       ON products("dropId");
CREATE INDEX idx_products_category   ON products("categoryId");

CREATE TABLE product_variants (
  id             TEXT      PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId"    TEXT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            TEXT      NOT NULL UNIQUE,
  size           TEXT      NOT NULL,
  color          TEXT,
  "colorHex"     TEXT,
  price          DECIMAL(10,2) NOT NULL,
  "comparePrice" DECIMAL(10,2),
  position       INTEGER   NOT NULL DEFAULT 0
);

CREATE INDEX idx_variants_product ON product_variants("productId");

CREATE TABLE product_images (
  id          TEXT    PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT    NOT NULL,
  alt         TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  "isCover"   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_images_product ON product_images("productId");

CREATE TABLE product_tags (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  UNIQUE("productId", tag)
);

CREATE INDEX idx_tags_tag ON product_tags(tag);

CREATE TABLE wishlist_items (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" TEXT        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "productId" TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("profileId", "productId")
);

-- ── DOMAIN 4: INVENTORY ────────────────────────────────────────

CREATE TABLE inventory (
  id              TEXT            PRIMARY KEY DEFAULT gen_random_uuid(),
  "variantId"     TEXT            NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  type            "InventoryType" NOT NULL DEFAULT 'PERMANENT',
  "totalStock"    INTEGER         NOT NULL DEFAULT 0,
  "reservedStock" INTEGER         NOT NULL DEFAULT 0,
  "soldStock"     INTEGER         NOT NULL DEFAULT 0,
  "lowStockAt"    INTEGER         NOT NULL DEFAULT 5,
  "updatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id            TEXT          PRIMARY KEY DEFAULT gen_random_uuid(),
  "inventoryId" TEXT          NOT NULL REFERENCES inventory(id),
  delta         INTEGER       NOT NULL,
  type          "MovementType" NOT NULL,
  reason        TEXT,
  "orderId"     TEXT,
  "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_movements_inventory ON inventory_movements("inventoryId");

-- ── DOMAIN 7: COUPONS (must exist before orders) ──────────────

CREATE TABLE coupons (
  id                      TEXT           PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    TEXT           NOT NULL UNIQUE,
  type                    "DiscountType" NOT NULL,
  value                   DECIMAL(10,2)  NOT NULL,
  "minOrderAmount"        DECIMAL(10,2),
  "maxUses"               INTEGER,
  "usedCount"             INTEGER        NOT NULL DEFAULT 0,
  "perUserLimit"          INTEGER        NOT NULL DEFAULT 1,
  "isActive"              BOOLEAN        NOT NULL DEFAULT TRUE,
  "startsAt"              TIMESTAMPTZ,
  "expiresAt"             TIMESTAMPTZ,
  "applicableDropIds"     TEXT[]         NOT NULL DEFAULT '{}',
  "applicableCategoryIds" TEXT[]         NOT NULL DEFAULT '{}',
  description             TEXT,
  "createdAt"             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── DOMAIN 5: ORDERS ──────────────────────────────────────────

CREATE TABLE orders (
  id                    TEXT                NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber"         TEXT                NOT NULL UNIQUE,
  "profileId"           TEXT                REFERENCES profiles(id),
  email                 TEXT                NOT NULL,
  status                "OrderStatus"       NOT NULL DEFAULT 'PENDING',
  "paymentStatus"       "PaymentStatus"     NOT NULL DEFAULT 'UNPAID',
  "paymentMethod"       "PaymentMethod"     NOT NULL DEFAULT 'RAZORPAY',
  subtotal              DECIMAL(10,2)       NOT NULL,
  "shippingCost"        DECIMAL(10,2)       NOT NULL DEFAULT 0,
  "discountAmount"      DECIMAL(10,2)       NOT NULL DEFAULT 0,
  "walletCredit"        DECIMAL(10,2)       NOT NULL DEFAULT 0,
  total                 DECIMAL(10,2)       NOT NULL,
  "couponId"            TEXT                REFERENCES coupons(id),
  "shippingAddress"     JSONB               NOT NULL,
  "fulfillmentStatus"   "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
  "fulfillmentProvider" TEXT,
  "fulfillmentRef"      TEXT,
  "razorpayOrderId"     TEXT,
  "razorpayPaymentId"   TEXT,
  notes                 TEXT,
  "adminNotes"          TEXT,
  "createdAt"           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "paidAt"              TIMESTAMPTZ,
  "fulfilledAt"         TIMESTAMPTZ
);

CREATE INDEX idx_orders_profile        ON orders("profileId");
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders("paymentStatus");
CREATE INDEX idx_orders_created        ON orders("createdAt");

CREATE TABLE order_items (
  id            TEXT          PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"     TEXT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "variantId"   TEXT          NOT NULL REFERENCES product_variants(id),
  "productName" TEXT          NOT NULL,
  "variantSku"  TEXT          NOT NULL,
  size          TEXT          NOT NULL,
  color         TEXT,
  "imageUrl"    TEXT,
  price         DECIMAL(10,2) NOT NULL,
  quantity      INTEGER       NOT NULL,
  total         DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items("orderId");

CREATE TABLE shipments (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"       TEXT        NOT NULL REFERENCES orders(id),
  carrier         TEXT,
  "trackingNumber" TEXT,
  "trackingUrl"   TEXT,
  provider        TEXT,
  "providerRef"   TEXT,
  "providerStatus" TEXT,
  "shippedAt"     TIMESTAMPTZ,
  "deliveredAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_order ON shipments("orderId");

-- ── DOMAIN 6: WALLET ──────────────────────────────────────────

CREATE TABLE wallets (
  id          TEXT          PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" TEXT          NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance     DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency    TEXT          NOT NULL DEFAULT 'INR',
  "updatedAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id          TEXT            PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId"  TEXT            NOT NULL REFERENCES wallets(id),
  amount      DECIMAL(10,2)   NOT NULL,
  type        "WalletTxnType" NOT NULL,
  description TEXT,
  "orderId"   TEXT            REFERENCES orders(id),
  "returnId"  TEXT,           -- FK added after return_requests table is created
  "expiresAt" TIMESTAMPTZ,
  "isExpired" BOOLEAN         NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_txns_wallet ON wallet_transactions("walletId");
CREATE INDEX idx_wallet_txns_order  ON wallet_transactions("orderId");

-- ── DOMAIN 8: RETURNS ─────────────────────────────────────────

CREATE TABLE return_requests (
  id             TEXT               PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"      TEXT               NOT NULL REFERENCES orders(id),
  "profileId"    TEXT               NOT NULL REFERENCES profiles(id),
  type           "ReturnType"       NOT NULL,
  status         "ReturnStatus"     NOT NULL DEFAULT 'PENDING',
  resolution     "ReturnResolution",
  reason         TEXT               NOT NULL,
  "adminNotes"   TEXT,
  "evidenceUrls" TEXT[]             NOT NULL DEFAULT '{}',
  "creditAmount" DECIMAL(10,2),
  "createdAt"    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  "resolvedAt"   TIMESTAMPTZ
);

CREATE INDEX idx_returns_order  ON return_requests("orderId");
CREATE INDEX idx_returns_status ON return_requests(status);

-- Now add the FK from wallet_transactions to return_requests
ALTER TABLE wallet_transactions
  ADD CONSTRAINT fk_wallet_txns_return
  FOREIGN KEY ("returnId") REFERENCES return_requests(id);

CREATE TABLE return_items (
  id            TEXT    PRIMARY KEY DEFAULT gen_random_uuid(),
  "returnReqId" TEXT    NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  "orderItemId" TEXT    NOT NULL REFERENCES order_items(id),
  quantity      INTEGER NOT NULL,
  reason        TEXT
);

CREATE INDEX idx_return_items_req ON return_items("returnReqId");

-- ── COUPON USAGES (after orders + profiles) ───────────────────

CREATE TABLE coupon_usages (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid(),
  "couponId"  TEXT        NOT NULL REFERENCES coupons(id),
  "profileId" TEXT        NOT NULL REFERENCES profiles(id),
  "orderId"   TEXT        NOT NULL,
  "usedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("couponId", "profileId")
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages("couponId");

-- ── DOMAIN 9: EDITORIAL ───────────────────────────────────────

CREATE TABLE archive_posts (
  id            TEXT              PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT              NOT NULL,
  slug          TEXT              NOT NULL UNIQUE,
  type          "ArchivePostType" NOT NULL,
  status        "ContentStatus"   NOT NULL DEFAULT 'DRAFT',
  excerpt       TEXT              NOT NULL,
  body          TEXT,
  "coverImage"  TEXT,
  tags          TEXT[]            NOT NULL DEFAULT '{}',
  "authorId"    TEXT,
  "publishedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_archive_status ON archive_posts(status);
CREATE INDEX idx_archive_type   ON archive_posts(type);

CREATE TABLE homepage_content (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE,
  value       TEXT        NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT
);

CREATE TABLE campaign_assets (
  id          TEXT           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT           NOT NULL,
  type        "CampaignType" NOT NULL,
  url         TEXT           NOT NULL,
  alt         TEXT,
  "dropId"    TEXT,
  position    INTEGER        NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN        NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_drop ON campaign_assets("dropId");
CREATE INDEX idx_campaign_type ON campaign_assets(type);

-- ── PRISMA MIGRATION TRACKING ────────────────────────────────
-- Prisma needs this table to know migrations have been applied

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  id                      TEXT        PRIMARY KEY,
  checksum                TEXT        NOT NULL,
  finished_at             TIMESTAMPTZ,
  migration_name          TEXT        NOT NULL,
  logs                    TEXT,
  rolled_back_at          TIMESTAMPTZ,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_steps_count     INTEGER     NOT NULL DEFAULT 0
);

-- Insert a baseline migration record so Prisma knows this schema was applied manually
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  'manual_sql_baseline_sucksphere_phase2',
  '20260510000000_init',
  NOW(),
  1
);

-- ── SUPABASE AUTH TRIGGER ────────────────────────────────────
-- Auto-create a profile row whenever a new user registers via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to Supabase auth schema
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
-- Enable RLS on customer-facing tables
-- Admin operations use the service role key which bypasses RLS

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items    ENABLE ROW LEVEL SECURITY;

-- Profile: users can read/update only their own profile
CREATE POLICY "profiles_self_read"   ON profiles FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid()::text = id);

-- Addresses: users can CRUD only their own
CREATE POLICY "addresses_self_all" ON addresses FOR ALL USING (auth.uid()::text = "profileId");

-- Orders: users can read their own
CREATE POLICY "orders_self_read" ON orders FOR SELECT USING (auth.uid()::text = "profileId");

-- Order items: users can read items belonging to their orders
CREATE POLICY "order_items_self_read" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items."orderId"
      AND orders."profileId" = auth.uid()::text
  ));

-- Wallets: users can read their own
CREATE POLICY "wallets_self_read" ON wallets FOR SELECT USING (auth.uid()::text = "profileId");

-- Wallet transactions: users can read their own via wallet
CREATE POLICY "wallet_txns_self_read" ON wallet_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wallets WHERE wallets.id = wallet_transactions."walletId"
      AND wallets."profileId" = auth.uid()::text
  ));

-- Returns: users can read/create their own return requests
CREATE POLICY "returns_self_read"   ON return_requests FOR SELECT USING (auth.uid()::text = "profileId");
CREATE POLICY "returns_self_create" ON return_requests FOR INSERT WITH CHECK (auth.uid()::text = "profileId");

-- Wishlist: users manage their own
CREATE POLICY "wishlist_self_all" ON wishlist_items FOR ALL USING (auth.uid()::text = "profileId");

-- Public read: products, categories, drops, images, tags, archive posts
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops            ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory        ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assets  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read"         ON products         FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "variants_public_read"         ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "images_public_read"           ON product_images   FOR SELECT USING (TRUE);
CREATE POLICY "tags_public_read"             ON product_tags     FOR SELECT USING (TRUE);
CREATE POLICY "categories_public_read"       ON categories       FOR SELECT USING (TRUE);
CREATE POLICY "drops_public_read"            ON drops            FOR SELECT USING (status IN ('LIVE', 'ENDED'));
CREATE POLICY "archive_public_read"          ON archive_posts    FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "inventory_public_read"        ON inventory        FOR SELECT USING (TRUE);
CREATE POLICY "homepage_content_public_read" ON homepage_content FOR SELECT USING (TRUE);
CREATE POLICY "campaign_assets_public_read"  ON campaign_assets  FOR SELECT USING ("isActive" = TRUE);
