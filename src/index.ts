import express from "express";
import cors from "cors";
import WebSocket from "ws";

import marketplaceRoutes from "./routes/marketplace-routes";
import dotenv from "dotenv";
import { verifySignature } from "./middleware";
import { PrismaClient } from "@prisma/client";
import { fetchActivityPeriodic, fetchCollections, fetchMarketplaceData, fetchUserCardsPeriodic } from "./workers";
import { onAcceptOffer, onBuy, onDelist, onList } from "./handlers";
import { WebSocketResponse } from "./types";
/// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};
dotenv.config();
let lastPongReceived: any = null;
let pingTimeoutId: any = null;
let pongTimeoutId: any = null;
export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
let socket: WebSocket = null as unknown as WebSocket;

app.use(cors())
app.use(express.json())
export const COLLECTION_ADDRESSES = ["Goon5hY489pW6TE3D7z5m2uU4wbUG99sr5pjvSH9M86"];

app.use("/api/marketplace", verifySignature, marketplaceRoutes)
const FIVE_SECONDS = 5000;
const ONE_MINUTE = FIVE_SECONDS * 12;
const TWENTY_SECONDS = FIVE_SECONDS * 4;
async function setUpWebsocket() {
    socket = new WebSocket("wss://api.mainnet.tensordev.io/ws", {
        headers: {
            "x-tensor-api-key": process.env.TENSOR_API_KEY,
        },
    });
    const collection = await prisma.collection.findUnique({
        where: {
            address: COLLECTION_ADDRESSES[0],
        },
    });
    if (!collection) {
        throw new Error("Collection not found");
    }
    const collId = collection.id;
    if (!collId) {
        throw new Error("Collection ID not found");
    }
    socket.addEventListener("open", (event) => {
        socket.send(
            JSON.stringify({
                event: "newTransaction",
                payload: {
                    collId,
                },
            }),
        );
        // socket.send(JSON.stringify({
        //   "event": "tcompBidUpdate",
        //   "payload": {
        //     collId
        //   }
        // }))
        const sendPing = () => {
            const pingEvent = JSON.stringify({ event: "ping" });
            socket.send(pingEvent);
            pingTimeoutId = setTimeout(sendPing, 30000);
        };
        sendPing();
        const checkPongs = () => {
            if (lastPongReceived !== null && Date.now() - lastPongReceived > 40000) {
                console.log("Pong not received in the last 40 seconds. Reconnecting to WS...");
                cleanUp();
                main();
            } else {
                // console.log(`Last pong received ${(Date.now() - lastPongReceived) / 1000} seconds ago.`);
                pongTimeoutId = setTimeout(checkPongs, 10000);
            }
        };
        checkPongs();
    });
    socket.onerror = async (event) => {
        console.log("WS connection error, sleeping, cleaning up and trying to reconnect again");
        await sleep(1000);
        cleanUp();
        main();
    };
    let subscriptionId: string = "";
    socket.addEventListener("message", async (event: any) => {
        try {
            // Check if the incoming event has data attached to it
            // console.log("Recieved event");
            const event_stringified = event?.data?.toString();
            if (event_stringified !== "" && event_stringified !== null && event_stringified !== undefined) {
                const eventParsed: WebSocketResponse = JSON.parse(event_stringified);
                if ((eventParsed as any).id && !subscriptionId) {
                    subscriptionId = (eventParsed as any).id;
                }
                if (eventParsed.type === "pong") {
                    // console.log("received pong");
                    lastPongReceived = Date.now();
                }
                if (eventParsed.type === "newTransaction") {
                    const {
                        tx: { tx, mint },
                    } = eventParsed.data;
                    switch (tx.txType) {
                        case "LIST": {
                            await onList(tx);
                            break;
                        }
                        case "DELIST": {
                            await onDelist(tx);
                            break;
                        }
                        // case "CREATEORDER": {
                        //   await onMakeOffer(tx);
                        //   break;
                        // }
                        // case "CANCELORDER": {
                        //   await onCancelOffer(tx);
                        //   break;
                        // }
                        case "SALE_ACCEPT_BID": {
                            await onAcceptOffer(tx);
                            break;
                        }
                        case "SALE_BUY_NOW": {
                            await onBuy(tx);
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Errored reading message");
            console.error(e);
        }
    });
}
async function main() {
    await fetchCollections(COLLECTION_ADDRESSES);
    console.log("Collections fetched");
    setUpWebsocket();
    console.log("Websocket set up");
    await fetchActivityPeriodic();
    console.log("Activity fetched");
    await fetchUserCardsPeriodic();
    console.log("User cards fetched");
    while (true) {
        try {
            await fetchMarketplaceData();
            console.log(`data updated, sleeping for ${ONE_MINUTE / 1000}s`);
            await sleep(ONE_MINUTE);
        } catch (e) {
            console.log("Errored in data fetching loop");
            console.error(e);
            await sleep(TWENTY_SECONDS);
        }
    }
}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
main();
function cleanUp() {
    if (pingTimeoutId !== null) {
        clearTimeout(pingTimeoutId);
    }
    if (pongTimeoutId !== null) {
        clearTimeout(pongTimeoutId);
    }
    socket?.terminate();

    lastPongReceived = null;
    pingTimeoutId = null;
    pongTimeoutId = null;
    socket = null as unknown as WebSocket;
}


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})


