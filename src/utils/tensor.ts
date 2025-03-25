import { Transaction, VersionedTransaction } from "@solana/web3.js";

// TODO: this is copied from the frontend
export type TensorApiResponse = {
    txs: { tx?: { data: any }; txV0?: any; lastValidBlockheight: string }[];
};
export function parseJsonToTx(response: TensorApiResponse): (Transaction | VersionedTransaction)[] {
    const txs = [];
    for (const tx of response.txs) {
        if (!tx.tx?.data && tx.txV0?.data) {
            const transaction = VersionedTransaction.deserialize(tx.txV0.data);
            txs.push(transaction);
        } else {
            const transaction = Transaction.from(Buffer.from(tx.tx!.data));
            txs.push(transaction);
        }
    }
    return txs;
}