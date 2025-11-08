// auctionAPI.ts
import api from "./api";

export const createAuction = (payload: {
  listingId: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  startingPrice: number;
}) => api.post("/auctions", payload);

export const placeBid = (auctionId: string, price: number) =>
  api.post(`/auctions/${auctionId}/bid`, { price });

export const getAuctionById = (auctionId: string) =>
  api.get(`/auctions/${auctionId}`);

export const getOngoingAuctions = (params?: { page?: number; limit?: number }) =>
  api.get("/auctions/ongoing", { params });

export const getUpcomingAuctions = (params?: { page?: number; limit?: number }) =>
  api.get("/auctions/upcoming", { params });

export const getEndedAuctions = (params?: { page?: number; limit?: number }) =>
  api.get("/auctions/ended", { params });

export const getAllAuctions = (params?: {
  page?: number; limit?: number; status?: "ongoing"|"upcoming"|"ended"; listingId?: string;
}) => api.get("/auctions/all", { params });
