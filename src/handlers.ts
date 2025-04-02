import { ActivityType } from "@prisma/client";
import { prisma } from ".";
import { Tx } from "./types";
import { fetchNft } from "./utils";

export async function onList(tx: Tx) {
    const { grossAmount, sellerId, mintOnchainId } = tx;
    const { nft } = await fetchNft(mintOnchainId, sellerId, true);
    await prisma.universalNFTData.update({
        where: {
            address: nft.address,
        },
        data: {
            price: BigInt(grossAmount),
            listed: true,
            owner: sellerId,
        },
    });
    // await prisma.user.upsert({
    //   where: { address: sellerId },
    //   update: { totalListed: { increment: 1 } },
    //   create: {
    //     address: sellerId,
    //     totalBought: 0,
    //     totalBoughtValue: BigInt(0),
    //     totalListed: 0,
    //     totalSold: 0,
    //     totalSoldValue: BigInt(0),
    //   },
    // });
    console.log(`${sellerId} Listed nft ${mintOnchainId} for ${grossAmount} SOL`);
}
export async function onDelist(tx: Tx) {
    const { sellerId, mintOnchainId } = tx;
    const { nft } = await fetchNft(mintOnchainId, sellerId, false);
    await prisma.universalNFTData.update({
        where: { address: nft.address },
        data: {
            price: null,
            listed: false,
            owner: sellerId,
        },
    });
    // const user = await prisma.user.findUnique({
    //   where: { address: sellerId },
    // });
    // await prisma.user.upsert({
    //   where: { address: sellerId },
    //   update: { totalListed: user!.totalListed > 0 ? user!.totalListed - 1 : 0 },
    //   create: {
    //     address: sellerId,
    //     totalBought: 0,
    //     totalBoughtValue: BigInt(0),
    //     totalListed: 0,
    //     totalSold: 0,
    //     totalSoldValue: BigInt(0),
    //   },
    // });
    console.log(`${sellerId} delisted ${mintOnchainId}`);
}

export async function onBuy(tx: Tx) {
    const time = new Date();
    const { mintOnchainId, sellerId, buyerId, grossAmount, txId } = tx as any;
    const { nft: nftInfo } = await fetchNft(mintOnchainId, buyerId, false);
    // await prisma.user.upsert({
    //   where: { address: sellerId },
    //   update: {
    //     totalSold: { increment: 1 },
    //     totalSoldValue: { increment: BigInt(grossAmount) },
    //   },
    //   create: {
    //     address: sellerId,
    //     totalBought: 0,
    //     totalBoughtValue: BigInt(0),
    //     totalListed: 0,
    //     totalSold: 1,
    //     totalSoldValue: BigInt(grossAmount),
    //   },
    // });
    // await prisma.user.upsert({
    //   where: { address: buyerId },
    //   update: {
    //     totalBought: { increment: 1 },
    //     totalBoughtValue: { increment: BigInt(grossAmount) },
    //   },
    //   create: {
    //     address: buyerId,
    //     totalBought: 1,
    //     totalBoughtValue: BigInt(grossAmount),
    //     totalListed: 0,
    //     totalSold: 0,
    //     totalSoldValue: BigInt(0),
    //   },
    // });
    await prisma.universalNFTData.update({
        where: { address: mintOnchainId },
        data: {
            listed: false,
            price: null,
            lastSale: grossAmount,
            owner: buyerId,
            offers: { deleteMany: {} },
        },
    });
    await prisma.activity.create({
        data: {
            time,
            to: buyerId,
            from: sellerId,
            txid: txId,
            universalNFTDataAddress: mintOnchainId,
            amount: BigInt(grossAmount),
            type: ActivityType.BUY,
        },
    });
    console.log(`${buyerId} bought ${mintOnchainId} from ${sellerId} for ${grossAmount} SOL`);
    // log the message here
}
export async function onMakeOffer(tx: Tx) {
    // user is the user making the offer, offer is the offer data, nft is the nft offer is made on
    const { user, offer, nft } = tx as any;
    const { nft: nftInfo } = await fetchNft(nft, "", true);
    await prisma.universalNFTData.update({
        where: {
            address: nftInfo.address,
        },
        data: {
            offers: {
                create: {
                    // replace this
                    address: "offer-address", // Replace with a unique address for the offer
                    nftMint: "nft-mint-address",
                    bidAmount: BigInt(100),
                    bidder: user,
                    updatedAt: new Date().toISOString(),
                    expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    image: nftInfo.image,
                    name: nftInfo.name,
                },
            },
        },
    });
}
export async function onCancelOffer(tx: Tx) {
    const { user, offer, nft } = tx as any;
    const { nft: nftInfo } = await fetchNft(nft, "", true);
    await prisma.universalNFTData.update({
        where: { address: nft },
        data: {
            offers: {
                delete: {
                    address: offer,
                },
            },
        },
    });
}
export async function onAcceptOffer(tx: Tx) {
    const time = new Date();
    const { sender, offer, nft, to, amountSOL, txId } = tx as any;
    const { nft: nftInfo } = await fetchNft(nft, "", false);
    // await prisma.user.upsert({
    //   where: { address: sender },
    //   update: {
    //     totalSold: { increment: 1 },
    //     totalSoldValue: { increment: BigInt(amountSOL) },
    //   },
    //   create: {
    //     address: sender,
    //     totalBought: 0,
    //     totalBoughtValue: BigInt(0),
    //     totalListed: 0,
    //     totalSold: 1,
    //     totalSoldValue: BigInt(amountSOL),
    //   },
    // });
    // await prisma.user.upsert({
    //   where: { address: to },
    //   update: {
    //     totalBought: { increment: 1 },
    //     totalBoughtValue: { increment: BigInt(amountSOL) },
    //   },
    //   create: {
    //     address: to,
    //     totalBought: 1,
    //     totalBoughtValue: BigInt(amountSOL),
    //     totalListed: 0,
    //     totalSold: 0,
    //     totalSoldValue: BigInt(0),
    //   },
    // });
    await prisma.universalNFTData.update({
        where: { address: nft },
        data: {
            listed: false,
            price: null,
            owner: to,
            offers: { deleteMany: {} },
        },
    });
    await prisma.activity.create({
        data: {
            time: time.toString(),
            to,
            from: sender,
            txid: txId,
            universalNFTDataAddress: nft,
            amount: BigInt(amountSOL),
            type: ActivityType.ACCEPT_BID,
        },
    });
}
export async function onRejectOffer(tx: Tx) {
    const { user, offer, nft } = tx as any;
    const { nft: nftInfo } = await fetchNft(nft, user, true);
    await prisma.universalNFTData.update({
        where: { address: nft },
        data: {
            offers: {
                delete: {
                    address: offer,
                },
            },
        },
    });
}
