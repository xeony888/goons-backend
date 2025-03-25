import { Connection } from "@solana/web3.js";
import { Request, Response } from "express";



const connection = new Connection(process.env.SOLANA_RPC_URL!);
const options = {
    method: "GET",
    headers: {
        accept: "application/json",
        "Content-Type": "application/json", // maybe remove
        "x-tensor-api-key": process.env.TENSOR_API_KEY as string,
    },
};

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