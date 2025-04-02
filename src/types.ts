import { Metadata, Offer, UniversalNFTData } from "@prisma/client";

export type UserActiveListing = {
    txKey: string;
    keyVersion: number;
    source: string;
    txId: string;
    txType: string;
    grossAmount: string;
    grossAmountUnit: string;
    sellerId: string;
    txAt: string;
    blockNumber: number;
    mintOnchainId: string;
    privateTaker: string | null;
    mint: {
        onchainId: string;
        attributes: {
            value: string;
            trait_type: string;
        }[];
        imageUri: string;
        lastSale: any | null;
        metadataFetchedAt: string;
        metadataUri: string;
        files: {
            type: string;
            uri: string;
        }[];
        animationUri: string;
        name: string;
        rarityRankTT: number;
        rarityRankTTStat: number;
        rarityRankHrtt: number;
        rarityRankStat: number;
        sellRoyaltyFeeBPS: number;
        tokenEdition: string | null;
        tokenStandard: string;
        hidden: boolean;
        compressed: boolean;
        verifiedCollection: string;
        owner: string;
        inscription: string | null;
        tokenProgram: string | null;
        metadataProgram: string | null;
        transferHookProgram: string | null;
        listingNormalizedPrice: string | null;
        hybridAmount: string | null;
        slugDisplay: string;
        collId: string;
        collName: string;
        numMints: number;
    };
};

export type MarketplaceListing = {
    animationUri: string | null;
    attributes: { [key: string]: any }[]; // Replace `any` with a more specific type if attributes have a known structure
    collId: string;
    compressed: boolean;
    frozen: boolean;
    hidden: boolean;
    imageUri: string;
    inscription: string | null;
    lastSale: {
        price: string;
        priceUnit: string;
    } | null;
    listing: {
        price: string;
        txId: string;
        txAt: string;
        seller: string;
        source: string;
        blockNumber: string;
        priceUnit: any;
        privateTaker: string | null;
    } | null;
    metadataFetchedAt: string;
    metadataProgram: string;
    metadataUri: string;
    mint: string;
    name: string;
    owner: string;
    rarityRank: number;
    royaltyBps: number;
    tokenEdition: string | null;
    tokenProgram: string;
    tokenStandard: string;
    transferHookProgram: string | null;
    updateAuthority: string;
    verifiedCollection: string | null;
};

export type OfferResponse = {
    address: string;
    nftMint: string;
    bidAmount: string;
    bidder: string;
    createdAt: string;
    bidUpdatedAt: string;
    expiry: string;
    margin: string | null;
    collectionId: string;
    balance: string | null;
    name: string | null;
};
export type MarketplaceOfferResponse = {
    mint: string;
    bids: {
        address: string;
        bidder: string;
        expiry: string;
        margin: any;
        price: string;
        validFrom: string;
    }[];
};
export type UniversalOffer = {
    address: string;
    nftMint: string;
    bidAmount: bigint;
    bidder: string;
    updatedAt: string;
    expiry: string;
    image: string;
    name: string;
};

export type Tx = {
    txKey: string;
    keyVersion: number;
    source: string;
    txId: string;
    txType: string;
    grossAmount: string;
    grossAmountUnit: string;
    feeAmount: string | null;
    feeAmountUnit: string;
    listingType: string | null;
    listingEnd: string | null;
    sellerId: string;
    buyerId: string | null;
    txAt: string; // ISO date string
    blockNumber: number;
    blockIndex: number;
    ixIdx: number;
    subIxIdx: number | null;
    mintOnchainId: string;
    collectionOnchainId: string;
    txMetadata: Record<string, unknown>;
    fetchedAt: string; // ISO date string
    inflatedAt: string; // ISO date string
    inflatedBy: string;
    parsedAt: string;
};
export interface WebSocketResponse {
    status: string;
    type: string;
    data: {
        tx: {
            tx: Tx;
            mint: {
                onchainId: string;
                slug: string;
                accState: string;
                attributes: unknown[]; // or a more specific type
                imageUri: string;
                lastSale: Record<string, unknown>; // or a more specific type
                metadataFetchedAt: string; // ISO date string
                metadataUri: string;
                files: unknown[]; // or a more specific type
                animationUri: string | null;
                name: string;
                rarityRankTT: number;
                rarityRankTTStat: number;
                rarityRankHrtt: number;
                rarityRankStat: number;
                sellRoyaltyFeeBPS: number;
                tokenEdition: string | null;
                tokenStandard: string;
                hidden: boolean;
                compressed: boolean;
                verifiedCollection: string;
                owner: string;
                inscription: string | null;
                tokenProgram: string;
                metadataProgram: string;
                transferHookProgram: string | null;
                listingNormalizedPrice: number | null;
                hybridAmount: number | null;
                listing: Record<string, unknown>; // or a more specific type
            };
            instr: unknown | null;
        };
    };
}

export type CollectionMintNftResponse = {
    mint: string;
    slug: string;
    frozen: boolean;
    attributes: { trait_type: string; value: string }[];
    imageUri: string;
    lastSale: {
        price: string;
        priceUnit: any;
        txAt: string;
        txId: string;
        buyer: string;
        seller: string;
        source: string;
        blockNumber: string;
    } | null;
    metadataFetchedAt: string;
    metadataUri: string;
    animationUri: null;
    name: string;
    rarityRank: number;
    royaltyBps: number;
    tokenEdition: any;
    tokenStandard: string;
    hidden: boolean;
    compressed: boolean;
    verifiedCollection: string;
    updateAuthority: string;
    owner: string;
    listing: {
        price: string;
        txId: string;
        txAt: string;
        seller: string;
        source: string;
        blockNumber: string;
        priceUnit: any;
    } | null;
    inscription: any;
    tokenProgram: string;
    metadataProgram: string;
    transferHookProgram: string;
};
export type UniversalNFTDataWithOffersAndMetadata = UniversalNFTData & { offers: Offer[]; metadata: Metadata[] };
