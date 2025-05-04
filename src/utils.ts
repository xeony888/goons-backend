import { UniversalNFTData } from "@prisma/client";
import { UniversalNFTDataWithOffersAndMetadata } from "./types";
import { COLLECTION_ADDRESSES, prisma } from ".";
import { fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import dotenv from "dotenv";
dotenv.config();
export const options = {
    method: "GET",
    headers: {
        accept: "application/json",
        "x-tensor-api-key": process.env.TENSOR_API_KEY as string,
    },
};
function deepEqual(x: any, y: any): boolean {
    const ok = Object.keys,
        tx = typeof x,
        ty = typeof y;
    return x && y && tx === "object" && tx === ty ? ok(x).length === ok(y).length && ok(x).every((key) => deepEqual(x[key], y[key])) : x === y;
}
export function different(nft1: UniversalNFTDataWithOffersAndMetadata, nft2: UniversalNFTDataWithOffersAndMetadata): boolean {
    return (
        nft1.listed !== nft2.listed ||
        nft1.price !== nft2.price ||
        nft1.lastSale !== nft2.lastSale ||
        nft1.owner !== nft2.owner ||
        !deepEqual(nft1.properties, nft2.properties)
    );
}

export function differentMetadata(nft1: UniversalNFTDataWithOffersAndMetadata, nft2: UniversalNFTDataWithOffersAndMetadata): boolean {
    for (const metadata of nft1.metadata) {
        const identical = nft2.metadata.find((pair) => pair.key === metadata.key);
        if (!identical || identical.value !== metadata.value) {
            return true;
        }
    }
    return nft1.metadata.length !== nft2.metadata.length;
}

export function differentOffers(nft1: UniversalNFTDataWithOffersAndMetadata, nft2: UniversalNFTDataWithOffersAndMetadata): boolean {
    for (const offer of nft1.offers) {
        const other = nft2.offers.find((o) => offer.address === o.address);
        if (!other || other.bidAmount !== offer.bidAmount) {
            return true;
        }
    }
    return nft1.offers.length !== nft2.offers.length;
}

const umi = createUmi(process.env.SOLANA_RPC_URL!).use(dasApi());
export async function fetchNft(address: string, owner?: string, listed?: boolean): Promise<{ nft: UniversalNFTData; inCollection: boolean }> {
    const nft = await prisma.universalNFTData.findUnique({ where: { address } });
    if (!nft) {
        const nftInfo = await fetchDigitalAsset(umi, publicKey(address));
        const metadata = await fetch(nftInfo.metadata.uri);
        const json = await metadata.json();

        if (nftInfo.metadata.collection.__option === "Some" && nftInfo.metadata.collection.value.verified) {
            if (!COLLECTION_ADDRESSES.includes(nftInfo.metadata.collection.value.key)) {
                return { nft: {} as UniversalNFTData, inCollection: false };
            }
        }
        return {
            nft: await prisma.universalNFTData.create({
                data: {
                    name: nftInfo.metadata.name,
                    owner: owner || "",
                    address,
                    listed: listed || false,
                    image: json.image,
                    properties: json.properties,
                    lastSale: BigInt(0),
                    metadata: {
                        createMany: {
                            data: json.attributes.map((attribute: any) => {
                                return {
                                    key: attribute.trait_type,
                                    value: attribute.value,
                                };
                            }),
                        },
                    },
                },
            }),
            inCollection: true,
        };
    } else {
        return { nft, inCollection: true };
    }
}