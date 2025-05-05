import { Connection } from "@solana/web3.js";
import { Request, Response } from "express";
import { options } from "../utils";
import { COLLECTION_ADDRESSES, prisma } from "..";
import { Prisma } from "@prisma/client";
import { UniversalOffer } from "../types";
import dotenv from "dotenv";

dotenv.config();
const connection = new Connection(process.env.SOLANA_RPC_URL!);


export const getListTransaction = async (req: Request, res: Response) => {
    try {
        const { mint, owner, price } = req.query;
        const blockhash = await connection.getLatestBlockhash();
        const response = await fetch(`https://api.mainnet.tensordev.io/api/v1/tx/list?mint=${mint}&price=${price}&owner=${owner}&blockhash=${blockhash.blockhash}`, options);
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getListTransaction");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getBuyTransaction = async (req: Request, res: Response) => {
    try {
        const { buyer, mint, owner, maxPrice } = req.query;
        const blockhash = await connection.getLatestBlockhash();
        const url = `https://api.mainnet.tensordev.io/api/v1/tx/buy?buyer=${buyer}&mint=${mint}&owner=${owner}&maxPrice=${maxPrice}&blockhash=${blockhash.blockhash}`;
        const response = await fetch(url, options);
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getBuyTransaction");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getCancelTransaction = async (req: Request, res: Response) => {
    try {
        const { mint, owner } = req.query;
        const blockhash = await connection.getLatestBlockhash();
        const response = await fetch(
            `https://api.mainnet.tensordev.io/api/v1/tx/delist?mint=${mint}&owner=${owner}&blockhash=${blockhash.blockhash}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-tensor-api-key": process.env.TENSOR_API_KEY as string,
                },
            },
        );
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getCancelTransaction");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getCreateOfferTransaction = async (req: Request, res: Response) => {
    try {
        const { mint, price, owner } = req.query;
        const blockhash = await connection.getLatestBlockhash();
        const response = await fetch(
            `https://api.mainnet.tensordev.io/api/v1/tx/bid?owner=${owner}&price=${price}&mint=${mint}&blockhash=${blockhash.blockhash}`,
            options,
        );
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getCreateOfferTransaction");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getAcceptOfferTransaction = async (req: Request, res: Response) => {
    try {
        const { seller, mint, bidAddress, minPrice } = req.query;
        const blockhash = await connection.getLatestBlockhash();
        const response = await fetch(
            `https://api.mainnet.tensordev.io/api/v1/tx/sell?seller=${seller}&mint=${mint}&bidAddress=${bidAddress}&minPrice=${minPrice}&blockhash=${blockhash.blockhash}`,
            options,
        );
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getAcceptOfferTransaction");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getCancelOfferTransaction = async (req: Request, res: Response) => {
    try {
        const { bidStateAddress } = req.query;
        const blockhash = await connection.getLatestBlockhash();
        const response = await fetch(
            `https://api.mainnet.tensordev.io/api/v1/tx/cancel_bid?bidStateAddress=${bidStateAddress}&blockhash=${blockhash.blockhash}`,
            options,
        );
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getCancelOfferTransaction");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Fetches offers for the specified NFTs from the database and returns them.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getOffersForNfts = async (req: Request, res: Response) => {
    try {
        const { nfts } = req.query as { nfts: string };
        const nftsList: string[] = nfts.split(",");
        // const params = nftsList.join("&mints=");
        // const response = await fetch(`https://api.mainnet.tensordev.io/api/v1/collections/nft_bids?mints=${params}`, options)
        // const json = await response.json();
        // console.log(json);
        const nftsDb = await prisma.universalNFTData.findMany({
            where: {
                address: {
                    in: nftsList,
                },
            },
            include: {
                offers: true,
            },
        });
        const result: { [key: string]: any } = {};
        for (const nft of nftsList) {
            result[nft] = nftsDb.find((nftInfo) => nftInfo.address === nft)?.offers || [];
        }
        return res.status(200).json(result);
    } catch (e) {
        console.log("Error in getOffersForNfts");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Retrieves offers made by specified user wallets and NFTs owned by those wallets.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getUserOffers = async (req: Request, res: Response) => {
    try {
        const { wallets } = req.query as { wallets: string };
        const all = wallets.split(",");
        const allOffers: UniversalOffer[] = await prisma.offer.findMany({
            where: {
                bidder: {
                    in: all,
                },
            },
        });
        const myNfts = await prisma.universalNFTData.findMany({
            where: {
                owner: {
                    in: all,
                },
            },
            include: {
                offers: true,
            },
        });
        for (const nft of myNfts) {
            allOffers.push(...nft.offers);
        }
        return res.status(200).json(allOffers);
    } catch (e) {
        console.log("Error in getUserOffers");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Retrieves marketplace listings that are currently active, including metadata, offers, and activity.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getMarketplaceListings = async (req: Request, res: Response) => {
    try {
        const { searchTerm, sortBy, page, itemsPerPage, metadataConditions, priceRange } = req.query;
        console.log(`Data: ${searchTerm}, ${sortBy}, ${page}, ${itemsPerPage}, ${metadataConditions}, ${priceRange}`)
        const conditions = JSON.parse(metadataConditions as string);
        const prices = JSON.parse(priceRange as string);
        const skip = parseInt(page as string) * parseInt(itemsPerPage as string);
        const take = parseInt(itemsPerPage as string);
        const where: Prisma.UniversalNFTDataWhereInput = {
            burned: false,
            AND: [searchTerm ? { name: { contains: searchTerm as string, mode: "insensitive" } } : {}],
        };
        const listings = await prisma.universalNFTData.findMany({
            where: where,
            include: {
                metadata: true,
                offers: true,
                activity: true,
            },
            orderBy:
                sortBy === "price-low-high"
                    ? { price: { sort: "asc", nulls: "last" } }
                    : sortBy === "price-high-low"
                        ? { price: { sort: "desc", nulls: "last" } }
                        : sortBy === "newest"
                            ? { time: "desc" }
                            : undefined,
            skip,
            take,
        });
        const count = await prisma.universalNFTData.count({
            where: where,
        });
        const filteredListings = listings.filter((item) => {
            for (const key in conditions) {
                if (conditions[key].length !== 0) {
                    const metadata = item.metadata.find((m) => m.key === key);
                    if (!(metadata && conditions[key].includes(metadata.value))) {
                        return false;
                    }
                }
            }
            if (prices.length === 0) return true;
            for (const price of prices) {
                if (!item.price) return false;
                if (item.price >= price[0] && item.price <= price[1]) {
                    return true;
                }
            }
            return false;
        });
        return res.status(200).json({
            listings: filteredListings,
            amount: count,
        });
    } catch (e) {
        console.log("Error in getMarketplaceListings");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Retrieves NFTs owned by the specified wallets, including metadata, offers, and activity.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getListedNfts = async (req: Request, res: Response) => {
    try {
        const { wallets: walletsString } = req.query as { wallets: string };
        // const wallets = walletsString.split(",").join("&wallets=");
        const wallets = walletsString.split(",");
        const nfts = await prisma.universalNFTData.findMany({
            where: {
                owner: {
                    in: wallets,
                },
            },
            include: {
                offers: true,
                activity: true,
                metadata: true,
            },
        });
        return res.status(200).json(nfts);
    } catch (e) {
        console.log("Error in getListedNfts");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Fetches bids for NFTs owned by a specific user.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getBids = async (req: Request, res: Response) => {
    try {
        const { owner } = req.params;
        const { limit } = req.query;
        const response = await fetch(`https://api.mainnet.tensordev.io/api/v1/user/nft_bids?owner=${owner}&limit=${limit}`, options);
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getBids");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Retrieves bids for a specific NFT from the external API.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getNftBids = async (req: Request, res: Response) => {
    try {
        const { nft } = req.params;
        const response = await fetch(`https://api.mainnet.tensordev.io/api/v1/collections/nft_bids?mints=${nft}`, options);
        const json = await response.json();
        return res.status(200).json(json);
    } catch (e) {
        console.log("Error in getNftBids");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};





/**
 * Retrieves recent NFT sales from the database, sorted by time in descending order.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getRecentSales = async (req: Request, res: Response) => {
    try {
        const { amount } = req.query as { amount: string };
        const limit = parseInt(amount ?? "10", 10); // Default to 10 if not provided

        const sales = await prisma.activity.findMany({
            orderBy: { time: "desc" },
            take: limit,
            include: {
                nft: true,
            },
        });
        return res.status(200).json(sales);
    } catch (e) {
        console.log("Error in getRecentSales");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Retrieves leaderboard data of users with the highest total sales.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const { amount } = req.query as { amount: string };
        const limit = parseInt(amount ?? "10", 10);
        const leaderboard = await prisma.user.findMany({
            orderBy: { cards: "desc" },
            take: limit,
        });
        const packs = await prisma.vm_txs.groupBy({
            by: ["sender"],
            _count: true,
            where: {
                mint_state: "success",
                sender: {
                    in: leaderboard.map((user) => user.address),
                },
            },
        });
        for (const user of leaderboard) {
            (user as any).packs = packs.find((pack) => pack.sender === user.address)?._count ?? 0;
        }
        console.log(leaderboard);
        return res.status(200).json(leaderboard);
    } catch (e) {
        console.log("Error in getLeaderboard");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Retrieves aggregate statistics for specified user wallets, including total listed, bought, and sold.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getUserStats = async (req: Request, res: Response) => {
    try {
        const { wallets: walletsString } = req.query as { wallets: string };
        const wallets = walletsString.split(",").map((w) => w.trim());
        const stats: any = {
            totalListed: 0,
            totalSold: 0,
            totalBought: 0,
            totalBoughtValue: BigInt(0),
            totalSoldValue: BigInt(0),
        };
        for (const wallet of wallets) {
            const user = await prisma.user.upsert({
                where: {
                    address: wallet,
                },
                update: {},
                create: {
                    address: wallet,
                    totalListed: 0,
                    totalSold: 0,
                    totalBought: 0,
                    totalBoughtValue: BigInt(0),
                    totalSoldValue: BigInt(0),
                },
            });
            for (const key in user) {
                // @ts-ignore
                stats[key] += user[key];
            }
        }
        stats.totalBoughtValue = stats.totalBoughtValue.toString();
        stats.totalSoldValue = stats.totalSoldValue.toString();
        return res.status(200).json(stats);
    } catch (e) {
        console.log("Error in getUserStats");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * Retrieves recent activity (sales) for specified wallets, sorted by time in descending order.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getUserActivity = async (req: Request, res: Response) => {
    try {
        const { wallets: walletsString, limit } = req.query as { wallets: string; limit: string };
        const take = parseInt(limit ?? "15", 10);
        const wallets = walletsString.split(",");
        const sales = await prisma.activity.findMany({
            where: {
                OR: [{ to: { in: wallets } }, { from: { in: wallets } }],
            },
            orderBy: { time: "desc" },
            take,
            include: {
                nft: true,
            },
        });
        return res.status(200).json(sales);
    } catch (e) {
        console.log("Error in getUserActivity");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getNftByAddress = async (req: Request, res: Response) => {
    try {
        const { address } = req.query as { address: string };

        const nft = await prisma.universalNFTData.findUnique({
            where: {
                address,
            },
            include: {
                offers: true,
                metadata: true,
                activity: true,
            },
        });
        return res.status(200).json(nft);
    } catch (e) {
        console.log("Error in getNftByAddress");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getMarketplaceFilters = async (req: Request, res: Response) => {
    try {
        // Get unique metadata keys first
        const filterData = await prisma.collection.findUnique({
            where: {
                address: COLLECTION_ADDRESSES[0],
            },
            select: {
                filters: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: filterData,
        });
    } catch (error) {
        console.log("Error in getMarketplaceFilters");
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserItemsByAddress = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        const { searchTerm, sortBy, page, itemsPerPage, metadataConditions, priceRange } = req.query;
        const conditions = JSON.parse(metadataConditions as string);
        const prices = JSON.parse(priceRange as string);
        const skip = parseInt(page as string) * parseInt(itemsPerPage as string);
        const take = parseInt(itemsPerPage as string);

        const where: Prisma.UniversalNFTDataWhereInput = {
            owner: address,
            burned: false,
            AND: [searchTerm ? { name: { contains: searchTerm as string, mode: "insensitive" } } : {}],
        };

        const items = await prisma.universalNFTData.findMany({
            where: where,
            include: {
                metadata: true,
                offers: true,
                activity: true,
            },
            orderBy:
                sortBy === "price-low-high"
                    ? { price: { sort: "asc", nulls: "last" } }
                    : sortBy === "price-high-low"
                        ? { price: { sort: "desc", nulls: "last" } }
                        : sortBy === "newest"
                            ? { time: "desc" }
                            : undefined,
            skip,
            take,
        });

        const count = await prisma.universalNFTData.count({
            where: where,
        });

        const filteredItems = items.filter((item) => {
            for (const key in conditions) {
                if (conditions[key].length !== 0) {
                    const metadata = item.metadata.find((m) => m.key === key);
                    if (!(metadata && conditions[key].includes(metadata.value))) {
                        return false;
                    }
                }
            }
            if (prices.length === 0) return true;
            for (const price of prices) {
                if (!item.price) return false;
                if (item.price >= price[0] && item.price <= price[1]) {
                    return true;
                }
            }
            return false;
        });

        res.status(200).json({
            items: filteredItems,
            amount: count,
        });
    } catch (e) {
        console.log("Error in getUserItemsByAddress");
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
};