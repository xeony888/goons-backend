import { PublicKey } from "@solana/web3.js";
import { NextFunction, Request, Response } from "express";
import nacl from "tweetnacl";


const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;
export function verifySignature(req: Request, res: Response, next: NextFunction) {
    try {
        const { pubkey, signature, message } = req.query as { pubkey: string, signature: string, message: string };
        const [_, dateString] = message.split("_");
        const now = Date.now();
        const date = new Date(dateString).getTime()
        const diffMs = now - date;
        if (diffMs > ONE_WEEK_MS) {
            res.status(403).json({ error: "Signature expired" });
            return;
        }
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = Buffer.from(signature, "base64");
        const publicKeyBytes = new PublicKey(pubkey).toBytes();
        const status = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        if (status) {
            next();
        } else {
            res.status(403).json({ error: "Signature verification failed" })
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error " });
    }
}