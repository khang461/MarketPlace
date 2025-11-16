// src/types/auction.ts

/** Trạng thái theo API (BE) */
export type AuctionStatusApi = "active" | "scheduled" | "ended" | "closed" | "cancelled" | "pending" | "ongoing" | "upcoming";

/** Trạng thái dùng trong UI cũ */
export type AuctionStatusUI = "RUNNING" | "PENDING" | "ENDED" | "CANCELLED";

/** Map từ status API -> status UI */
export const mapAuctionStatus = (s: AuctionStatusApi): AuctionStatusUI => {
  switch (s) {
    case "active":
    case "ongoing":
      return "RUNNING";
    case "scheduled":
    case "pending":
    case "upcoming":
      return "PENDING";
    case "cancelled":
      return "CANCELLED";
    case "ended":
    case "closed":
      return "ENDED";
    default:
      return "ENDED";
  }
};

export interface Bid {
  userId: string;
  price: number;
  createdAt: string; // ISO
}

export interface Auction {
  _id: string;
  listingId: string;
  startAt: string;        // ISO
  endAt: string;          // ISO
  startingPrice: number;
  status: AuctionStatusApi;
  currentPrice?: number;
  highestBidderId?: string;
  bids: Bid[];

  /** Optional: nếu FE cũ đang dùng auction.listing.xxx thì tạm để any */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastMessage?: any;
}

/** Helpers tiện dùng trong FE */
export const getHighestBid = (a: Pick<Auction, "bids" | "startingPrice">) =>
  a.bids?.length ? Math.max(...a.bids.map((b) => b.price)) : a.startingPrice;

export const isOngoing = (a: Pick<Auction, "startAt" | "endAt" | "status">) => {
  const now = Date.now();
  return (
    a.status === "active" &&
    new Date(a.startAt).getTime() <= now &&
    now < new Date(a.endAt).getTime()
  );
};

export const isUpcoming = (a: Pick<Auction, "startAt" | "status">) =>
  a.status === "scheduled" && Date.now() < new Date(a.startAt).getTime();

export const isEnded = (a: Pick<Auction, "endAt" | "status">) =>
  (a.status === "ended" || a.status === "closed") &&
  Date.now() >= new Date(a.endAt).getTime();
