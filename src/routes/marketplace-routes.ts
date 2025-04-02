// @ts-nocheck
import express from "express";
import * as marketplaceController from "../controllers/marketplace-controller";
const router = express.Router();

router.get("/nft-offers", marketplaceController.getOffersForNfts);
router.get("/user-offers", marketplaceController.getUserOffers);
router.get("/listed", marketplaceController.getListedNfts);
router.get("/marketplace-listings", marketplaceController.getMarketplaceListings);
router.get("/:user/bids", marketplaceController.getBids);
router.get("/:nft/bids", marketplaceController.getNftBids);
router.get("/transaction/buy", marketplaceController.getBuyTransaction);
router.get("/transaction/cancel", marketplaceController.getCancelTransaction);
router.get("/transaction/list", marketplaceController.getListTransaction);
router.get("/transaction/create-offer", marketplaceController.getCreateOfferTransaction);
router.get("/transaction/accept-offer", marketplaceController.getAcceptOfferTransaction);
router.get("/transaction/cancel-offer", marketplaceController.getCancelOfferTransaction);
router.get("/stats", marketplaceController.getUserStats);
router.get("/sales", marketplaceController.getRecentSales);
router.get("/leaderboard", marketplaceController.getLeaderboard);
router.get("/activity", marketplaceController.getUserActivity);
router.get("/single-nft", marketplaceController.getNftByAddress);
router.get("/users/:address", marketplaceController.getUserItemsByAddress);
export default router;