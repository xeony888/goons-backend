import { UniversalNFTData, Prisma, Metadata, Offer } from "@prisma/client";
import { prisma } from ".";
import { activityToUserUpdate, fetchAllCollectionMintsFromTensor, fetchAllMintMetadata, fetchOffersForMints, fetchTransactionHistoryRecent, formatOffersAndMints } from "./tensor";
import { CollectionMintNftResponse, MarketplaceOfferResponse } from "./types";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { different, differentMetadata, differentOffers, options } from "./utils";
export async function fetchCollections(collectionAddresses: string[]) {
    const collections = await prisma.collection.findMany();
    const newAddresses = collectionAddresses.filter((address) => !collections.find((collection) => collection.address === address));
    console.log(newAddresses);
    for (const address of newAddresses) {
        let collId: string | undefined = undefined;
        while (!collId) {
            const response1 = await fetch(`https://api.mainnet.tensordev.io/api/v1/collections/find_collection?filter=${address}`, options);
            if (response1.status === 200) {
                const json1 = await response1.json();
                collId = json1.collId;
                console.log(collId);
            } else if (response1.status === 404) {
                break;
            } else {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }
        if (collId) {
            await prisma.collection.create({
                data: {
                    address,
                    id: collId,
                },
            });
        }
    }
}
export async function fetchMarketplaceData() {
    const start = performance.now();
    console.log("fetching marketplace data");
    const mints: CollectionMintNftResponse[] = await fetchAllCollectionMintsFromTensor();
    const nftAddressToMetadata = await fetchAllMintMetadata(mints);
    console.log("nftAddressToMetadata", nftAddressToMetadata.size);
    console.log(`Fetched ${mints.length} nfts in collection`);
    // console.log(
    //   "mints",
    //   JSON.stringify(
    //     mints.map((m) => m.mint),
    //     null,
    //     2,
    //   ),
    // );
    const offers: MarketplaceOfferResponse[] = await fetchOffersForMints(mints);
    const formatted = formatOffersAndMints(mints, offers, nftAddressToMetadata);
    const toUpdate: UniversalNFTData[] = [];
    const toCreate: Prisma.UniversalNFTDataCreateManyInput[] = [];
    const toCreateMetadata: Metadata[] = [];
    const toCreateOffers: Offer[] = [];
    const toDeleteMetadata: string[] = [];
    const toDeleteOffers: string[] = [];
    const allNfts = await prisma.universalNFTData.findMany({
        include: {
            offers: true,
            metadata: true,
        },
    });
    console.log(`Fetched ${allNfts.length} nfts from the db`);
    for (const nft of formatted) {
        const dbNft = allNfts.find((n) => n.address === nft.address);
        if (dbNft) {
            if (different(dbNft, nft) || dbNft.burned) {
                toUpdate.push({
                    address: nft.address,
                    owner: nft.owner,
                    name: nft.name,
                    image: nft.image,
                    properties: nftAddressToMetadata.get(nft.address)?.properties,
                    price: nft.price,
                    time: nft.time,
                    lastSale: nft.lastSale,
                    listed: nft.listed,
                    burned: false,
                });
            }
            if (differentMetadata(dbNft, nft)) {
                toDeleteMetadata.push(...dbNft.metadata.map((metadata) => metadata.id));
                toCreateMetadata.push(...nft.metadata);
            }
            if (differentOffers(dbNft, nft)) {
                toDeleteOffers.push(...dbNft.offers.map((offer) => offer.address));
                toCreateOffers.push(...nft.offers);
            }
        } else {
            toCreateMetadata.push(...nft.metadata);
            toCreateOffers.push(...nft.offers);
            toCreate.push({
                address: nft.address,
                image: nft.image || "",
                properties: nftAddressToMetadata.get(nft.address)?.properties,
                name: nft.name,
                owner: nft.owner,
                price: nft.price,
                time: nft.time,
                listed: nft.listed,
                lastSale: nft.lastSale,
                burned: false,
            });
        }
    }
    console.log(`Creating ${toCreate.length} nfts`);
    await prisma.universalNFTData.createMany({
        data: toCreate,
    });
    console.log(`Deleting ${toDeleteOffers.length} offers`);
    await prisma.offer.deleteMany({
        where: {
            address: {
                in: toDeleteOffers,
            },
        },
    });
    console.log(`Creating ${toCreateOffers.length} offers`);
    await prisma.offer.createMany({
        data: toCreateOffers,
    });
    console.log(`Deleting ${toDeleteMetadata.length} metadata`);
    await prisma.metadata.deleteMany({
        where: {
            id: {
                in: toDeleteMetadata,
            },
        },
    });
    console.log(`Creating ${toCreateMetadata.length} metadata`);
    await prisma.metadata.createMany({
        data: toCreateMetadata,
    });
    console.log(`Updating ${toUpdate.length} nfts`);
    if (toUpdate.length > 0) {
        await prisma.$executeRawUnsafe(`
      UPDATE "UniversalNFTData"
      SET 
        "price" = CASE "address"
          ${toUpdate.map((nft) => `WHEN '${nft.address}' THEN ${nft.price !== undefined ? nft.price : "NULL"}`).join(" ")}
          ELSE "price"
        END,
        "listed" = CASE "address"
          ${toUpdate.map((nft) => `WHEN '${nft.address}' THEN ${nft.listed}`).join(" ")}
          ELSE "listed"
        END,
        "lastSale" = CASE "address"
          ${toUpdate.map((nft) => `WHEN '${nft.address}' THEN ${nft.lastSale !== null ? `'${nft.lastSale}'` : "NULL"}`).join(" ")}
          ELSE "lastSale"
        END,
        "owner" = CASE "address"
          ${toUpdate.map((nft) => `WHEN '${nft.address}' THEN '${nft.owner}'`).join(" ")}
          ELSE "owner"
        END,
        "properties" = CASE "address"
          ${toUpdate.map((nft) => `WHEN '${nft.address}' THEN ${nft.properties !== null ? `'${JSON.stringify(nft.properties)}'` : "NULL"}`).join(" ")}
          ELSE "properties"
        END,
        "burned" = CASE "address"
          ${toUpdate.map((nft) => `WHEN '${nft.address}' THEN ${nft.burned}`).join(" ")}
          ELSE "burned"
        END
      WHERE "address" IN (${toUpdate.map((nft) => `'${nft.address}'`).join(", ")})
    `);
    }
    const result = await prisma.universalNFTData.updateMany({
        where: {
            address: {
                notIn: formatted.map((nft) => nft.address),
            },
        },
        data: {
            burned: true,
        },
    });
    console.log(`Delisted ${result.count} nfts in DB`);
    const end = performance.now();
    console.log(`Function took ${(end - start) / 1000}s`);
}

export async function fetchUserCardsPeriodic() {
    const addresses = (await prisma.collection.findMany()).map((c) => c.address);
    const holderCounts = new Map<string, number>();
    let page = 1;
    const limit = 1000;
    for (const collectionAddress of addresses) {
        const umi = createUmi(process.env.SOLANA_RPC_URL!).use(dasApi());
        const address = publicKey(collectionAddress);
        const { items, total } = await umi.rpc.getAssetsByGroup({
            groupKey: "collection",
            groupValue: address,
            sortBy: { sortBy: "created", sortDirection: "asc" },
            limit,
            page,
        });
        for (const asset of items) {
            if (asset.ownership.owner) {
                const owner = asset.ownership.owner;
                const amount = holderCounts.get(owner) || 0;
                holderCounts.set(owner, amount + 1);
            }
        }
        console.log(`Fetched ${total} nfts in ${collectionAddress}`);
    }
    await prisma.$executeRaw`
      UPDATE "User" AS u
      SET cards = v.count
      FROM (VALUES 
        ${Prisma.join(Array.from(holderCounts).map(([address, count]) => Prisma.sql`(${address}, ${count})`))}
        ) AS v(address, count)
      WHERE u.address = v.address;
    `;
}

export async function fetchActivityPeriodic() {
    const activity = await fetchTransactionHistoryRecent();
    const userUpdates: [
        string,
        {
            address: string;
            level: number;
            totalListed: number;
            totalSold: number;
            totalSoldValue: bigint;
            totalBought: number;
            totalBoughtValue: bigint;
        },
    ][] = Array.from(activityToUserUpdate(activity));
    console.log(`Updating / creating ${userUpdates.length} users`);
    await prisma.$executeRaw`
    INSERT INTO "User" (
      "address",
      "level",
      "totalListed",
      "totalSold",
      "totalSoldValue",
      "totalBought",
      "totalBoughtValue"
    )
    SELECT * FROM UNNEST(
      ${userUpdates.map((u) => u[0])}::text[],
      ${userUpdates.map((u) => u[1].level)}::int[],
      ${userUpdates.map((u) => u[1].totalListed)}::int[],
      ${userUpdates.map((u) => u[1].totalSold)}::int[],
      ${userUpdates.map((u) => u[1].totalSoldValue)}::bigint[],
      ${userUpdates.map((u) => u[1].totalBought)}::int[],
      ${userUpdates.map((u) => u[1].totalBoughtValue)}::bigint[]
    )
    ON CONFLICT ("address") DO UPDATE SET
      "level" = "User"."level" + EXCLUDED."level",
      "totalListed" = "User"."totalListed" + EXCLUDED."totalListed",
      "totalSold" = "User"."totalSold" + EXCLUDED."totalSold",
      "totalSoldValue" = "User"."totalSoldValue" + EXCLUDED."totalSoldValue",
      "totalBought" = "User"."totalBought" + EXCLUDED."totalBought",
      "totalBoughtValue" = "User"."totalBoughtValue" + EXCLUDED."totalBoughtValue";
  `;
    console.log(`Fetched ${activity.length} new activity`);
    console.log(`Creating ${activity.length} activity`);
    await prisma.$executeRaw`SET session_replication_role = "replica"`;
    await prisma.activity.createMany({
        data: activity,
        skipDuplicates: true,
    });
    await prisma.$executeRaw`SET session_replication_role = "origin"`;
}


