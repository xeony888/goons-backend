import express from "express";
import cors from "cors";
import marketplaceRoutes from "./routes/marketplace-routes";
import dotenv from "dotenv";
import { verifySignature } from "./middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())


app.use("/api/marketplace", verifySignature, marketplaceRoutes)

async function main() {

}

main();


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})
