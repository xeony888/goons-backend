import { Activity, ActivityType, Metadata, Offer, User } from "@prisma/client";
import { prisma } from ".";
import { CollectionMintNftResponse, MarketplaceOfferResponse, UniversalNFTDataWithOffersAndMetadata } from "./types";
import { options } from "./utils";
import { randomUUID } from "crypto";
export async function fetchAllCollectionMintsFromTensor(): Promise<CollectionMintNftResponse[]> {
    const collIds: string[] = (await prisma.collection.findMany()).map((collection) => collection.id);
    const result: CollectionMintNftResponse[] = [];
    for (const collId of collIds) {
        let cursor: string = "";
        while (true) {
            const response = await fetch(
                `https://api.mainnet.tensordev.io/api/v1/mint/collection?collId=${collId}&sortBy=ListingPriceAsc&limit=250${cursor ? "&cursor=" + cursor : ""}`,
                options,
            );
            if (response.status === 200) {
                const { mints, page } = await response.json();
                result.push(...mints);
                if (!page.hasMore) {
                    break;
                }
                cursor = page.endCursor;
            } else {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    }
    return result;
}

export async function fetchAllMintMetadata(mints: CollectionMintNftResponse[]): Promise<Map<string, any>> {
    const nftAddressToMetadata: Map<string, any> = new Map();
    const BATCH_SIZE = 100;
    const TIMEOUT_MS = 30000;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const processBatch = async (batch: CollectionMintNftResponse[]) => {
        await Promise.all(
            batch.map(async (mint) => {
                let retries = 3;
                while (retries > 0) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
                        const fetchResult = await fetch(mint.metadataUri, {
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);
                        if (!fetchResult.ok) throw new Error(`HTTP error! status: ${fetchResult.status}`);

                        const contentType = fetchResult.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const metadata = await fetchResult.json();
                            nftAddressToMetadata.set(mint.mint, metadata);
                        } else {
                            console.error(`Unexpected content-type for ${mint.mint}: ${contentType}`);
                        }
                        return;
                    } catch (error) {
                        retries--;
                        if (retries === 0) {
                            console.error(error);
                            console.error(`Failed to fetch metadata for ${mint.mint} after 3 retries`);
                            return;
                        }
                        await sleep(2000);
                    }
                }
            })
        );
    };

    for (let i = 0; i < mints.length; i += BATCH_SIZE) {
        const batch = mints.slice(i, i + BATCH_SIZE);
        await processBatch(batch);
    }

    return nftAddressToMetadata;
}

export async function fetchOffersForMints(mints: { mint: string }[]): Promise<MarketplaceOfferResponse[]> {
    const offers: MarketplaceOfferResponse[] = [];
    let i = 0;
    while (i < mints.length) {
        const tempMints: string[] = mints.slice(i, Math.min(i + 100, mints.length)).map((mint) => mint.mint);
        const params = tempMints.join("&mints=");
        const response = await fetch(`https://api.mainnet.tensordev.io/api/v1/collections/nft_bids?mints=${params}`, options);
        if (response.status !== 200) {
            console.log(`Rate limited when fetching offers #${i}-${i + 100}, sleeping for 2 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
        } else {
            const json = await response.json();
            offers.push(...json);
            i += 100;
        }
    }
    console.log(`Fetched ${offers.length} offers`);
    return offers;
}
export function formatOffersAndMints(
    mints: CollectionMintNftResponse[],
    offers: MarketplaceOfferResponse[],
    nftAddressToMetadata: Map<string, any>,
): UniversalNFTDataWithOffersAndMetadata[] {
    const formatted = mints.map((nft) => {
        const myOffers = offers.find((offer) => offer.mint === nft.mint);
        const offersForMint: Offer[] =
            myOffers?.bids.map((offer) => ({
                nftMint: myOffers.mint,
                address: offer.address,
                bidAmount: BigInt(offer.price),
                bidder: offer.bidder,
                image: nft.imageUri,
                name: nft.name,
                expiry: offer.expiry,
                updatedAt: offer.validFrom,
                universalNFTDataAddress: nft.mint,
            })) || [];

        return {
            image: nft.imageUri,
            name: nft.name,
            address: nft.mint,
            price: nft.listing?.price ? BigInt(nft.listing?.price) : null,
            owner: nft.listing?.seller || nft.owner,
            metadata:
                nft.attributes?.map<Metadata>((attribute: any) => ({
                    id: randomUUID(),
                    key: attribute.trait_type,
                    value: String(attribute.value),
                    universalNFTDataAddress: nft.mint,
                })) || [],
            offers: offersForMint,
            time: 0,
            lastSale: BigInt(nft.lastSale?.price || "0"),
            listed: nft.listing ? true : false,
            burned: false,
            properties: nftAddressToMetadata.get(nft.mint)?.properties || null,
        };
    });
    return formatted;
}

export async function fetchTransactionHistoryRecent() {
    const collIds: string[] = (await prisma.collection.findMany()).map((collection) => collection.id);
    let result: Activity[] = [];
    for (const collId of collIds) {
        const name = "firstActivity:" + collId;
        let last = await prisma.memory.findUnique({ where: { name } });
        let first: string | undefined = undefined;
        let cursor: string = "";
        loop: while (true) {
            const response = await fetch(
                `https://api.mainnet.tensordev.io/api/v1/collections/tx_history?limit=100&collId=${collId}${cursor ? "&cursor=" + cursor : ""}`,
                options,
            );
            if (response.status === 200) {
                const { txs, page } = await response.json();
                if (!first) {
                    first = txs[0]?.tx?.txKey;
                }
                for (const { tx, mint } of txs) {
                    if (last && tx.txKey === last.value) {
                        // takes advantage of ordering of activity
                        break loop; // named break, breaks out of while loop
                    } else {
                        result.push({
                            txid: tx.txKey,
                            time: new Date(tx.txAt),
                            amount: tx.grossAmount ? BigInt(tx.grossAmount) : null,
                            from: tx.sellerId || tx.buyerId || "",
                            to: tx.buyerId ?? null,
                            type: getActivityType(tx.txType),
                            universalNFTDataAddress: mint.onchainId,
                        });
                    }
                }
                if (!page.hasMore) {
                    break;
                }
                cursor = page.cursor;
            } else {
                console.log(`Rate limited fetching ${result.length}-${result.length + 100}`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        await prisma.memory.upsert({
            where: { name },
            update: { value: first },
            create: { name, value: first || "" },
        });
    }
    return result;
}

function getActivityType(txType: string): ActivityType {
    let type: ActivityType;
    if (txType === "LIST") {
        type = ActivityType.LIST;
    } else if (txType === "DELIST") {
        type = ActivityType.DELIST;
    } else if (txType === "SALE_BUY_NOW") {
        type = ActivityType.BUY;
    } else if (txType === "SWAP_SELL_NFT") {
        // list?
        type = ActivityType.SELL;
    } else if (txType === "SWAP_WITHDRAW_NFT") {
        // delist?
        type = ActivityType.DELIST;
    } else if (txType === "SALE_ACCEPT_BID") {
        type = ActivityType.ACCEPT_BID;
    } else if (txType === "PLACE_BID") {
        type = ActivityType.PLACE_BID;
    } else if (txType === "CANCEL_BID") {
        type = ActivityType.CANCEL_BID;
    } else if (txType === "ADJUST_PRICE") {
        type = ActivityType.UPDATE;
    } else if (txType === "SWAP_BUY_NFT") {
        type = ActivityType.BUY;
    } else if (txType === "SWAP_DEPOSIT_NFT") {
        type = ActivityType.LIST;
    } else {
        console.log(`Did not have ${txType}`);
        type = ActivityType.UPDATE;
    }
    return type;
}
const DEFAULT_USER: User = {
    address: "",
    cards: 0,
    level: 0,
    totalListed: 0,
    totalSold: 0,
    totalSoldValue: BigInt(0),
    totalBought: 0,
    totalBoughtValue: BigInt(0),
};
export function activityToUserUpdate(activity: Activity[]) {
    const users: Map<string, User> = new Map<string, User>();
    for (const item of activity) {
        let user = users.get(item.from) || DEFAULT_USER;
        if (item.type === ActivityType.ACCEPT_BID) {
            // does accept bid also fire a BUY tx?
            user.totalSold++;
            user.cards--;
            user.totalSoldValue += BigInt(item.amount || 0);
        } else if (item.type === ActivityType.BUY) {
            user.totalBought++;
            user.cards++;
            user.totalBoughtValue += BigInt(item.amount || 0);
        } else if (item.type === ActivityType.CANCEL_BID) {
            // no need to update here
        } else if (item.type === ActivityType.DELIST) {
            user.totalListed--;
        } else if (item.type === ActivityType.LIST) {
            user.totalListed++;
        } else if (item.type === ActivityType.PLACE_BID) {
            // no need to update here
        } else if (item.type === ActivityType.SELL) {
            user.totalSold++;
            user.cards--;
            user.totalSoldValue += BigInt(item.amount || 0);
        } else if (item.type === ActivityType.UPDATE) {
            // no need to update here
        }
        users.set(user.address, user);
    }
    return users;
}
