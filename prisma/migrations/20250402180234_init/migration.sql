-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LIST', 'BUY', 'SELL', 'DELIST', 'ACCEPT_BID', 'PLACE_BID', 'CANCEL_BID', 'UPDATE');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "featured_items" JSONB,
    "featured_achievements" JSONB,
    "username" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "address" TEXT NOT NULL,
    "cards" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "totalListed" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalSoldValue" BIGINT NOT NULL DEFAULT 0,
    "totalBought" INTEGER NOT NULL DEFAULT 0,
    "totalBoughtValue" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Activity" (
    "txid" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "amount" BIGINT,
    "type" "ActivityType" NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "universalNFTDataAddress" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("txid")
);

-- CreateTable
CREATE TABLE "UniversalNFTData" (
    "address" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "price" BIGINT,
    "time" INTEGER,
    "lastSale" BIGINT NOT NULL DEFAULT 0,
    "listed" BOOLEAN NOT NULL,
    "burned" BOOLEAN NOT NULL DEFAULT false,
    "properties" JSONB,

    CONSTRAINT "UniversalNFTData_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Collection" (
    "address" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "filters" JSONB,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Metadata" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "universalNFTDataAddress" TEXT,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "address" TEXT NOT NULL,
    "nftMint" TEXT NOT NULL,
    "bidAmount" BIGINT NOT NULL,
    "bidder" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "universalNFTDataAddress" TEXT,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Memory" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "collectionAddress" TEXT,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "collections" (
    "mint_address" TEXT NOT NULL,
    "merkle_tree_address" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symbol" TEXT,
    "platform" TEXT DEFAULT 'devnet',
    "mint_price" DECIMAL(65,30),
    "crossmint_id" TEXT,
    "enable" BOOLEAN DEFAULT false,
    "description" TEXT,
    "rarity_distribution" JSONB,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("mint_address")
);

-- CreateTable
CREATE TABLE "nfts" (
    "id" BIGSERIAL NOT NULL,
    "collection_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mint_address" TEXT,
    "is_available" BOOLEAN DEFAULT true,
    "metadata_uri" TEXT,
    "image_uri" TEXT,
    "metadata" JSONB,
    "buyback_price" DECIMAL(65,30),
    "rarity" BIGINT,

    CONSTRAINT "nfts_pkey" PRIMARY KEY ("id","collection_id")
);

-- CreateTable
CREATE TABLE "vm_txs" (
    "id" BIGSERIAL NOT NULL,
    "hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transfer_amount" DECIMAL(65,30),
    "sender" TEXT,
    "mint_state" TEXT,
    "nfts" JSONB,

    CONSTRAINT "vm_txs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vm_buybacks" (
    "id" BIGSERIAL NOT NULL,
    "hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seller" TEXT,
    "mint_address" TEXT,
    "nft" JSONB,

    CONSTRAINT "vm_buybacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vm_burns" (
    "id" BIGSERIAL NOT NULL,
    "vm_buyback_id" BIGINT NOT NULL,
    "hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seller" TEXT,
    "mint_address" TEXT,
    "nft" JSONB,

    CONSTRAINT "vm_burns_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_universalNFTDataAddress_fkey" FOREIGN KEY ("universalNFTDataAddress") REFERENCES "UniversalNFTData"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_universalNFTDataAddress_fkey" FOREIGN KEY ("universalNFTDataAddress") REFERENCES "UniversalNFTData"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_universalNFTDataAddress_fkey" FOREIGN KEY ("universalNFTDataAddress") REFERENCES "UniversalNFTData"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_collectionAddress_fkey" FOREIGN KEY ("collectionAddress") REFERENCES "Collection"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nft_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("mint_address") ON DELETE NO ACTION ON UPDATE NO ACTION;
