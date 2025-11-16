// src/components/Auction/AuctionHistory.tsx
import { memo } from "react";
import type { Bid } from "../../types/auction";

type AnyUser = {
  _id?: string;
  id?: string;
  userId?: string;
  fullName?: string;
  name?: string;
  avatar?: string;
};

type AnyBid = Bid & {
  user?: AnyUser | null;
  userId?: string | AnyUser;
  _id?: string;
};

function safeText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      (o.fullName as string) ||
      (o.name as string) ||
      (o._id as string) ||
      (o.id as string) ||
      (o.userId as string) ||
      JSON.stringify(o)
    );
  }
  return String(v);
}

function getDisplayName(b: AnyBid): string {
  if (b.user && (b.user.fullName || b.user.name)) {
    return safeText(b.user.fullName || b.user.name);
  }
  return safeText(b.userId);
}

function getUserKey(b: AnyBid): string {
  if (b.user && (b.user._id || b.user.id || b.user.userId)) {
    return safeText(b.user._id || b.user.id || b.user.userId);
  }
  return safeText(b.userId || getDisplayName(b));
}

function getAvatar(b: AnyBid): string | undefined {
  if (b.user?.avatar) return b.user.avatar;
  if (b.userId && typeof b.userId === "object") {
    return (b.userId as AnyUser).avatar;
  }
  return undefined;
}

/** Lấy userId “thật” của bid để so sánh với topUserId / meId */
function getUserId(b: AnyBid): string | null {
  if (b.user && (b.user._id || b.user.id || b.user.userId)) {
    return safeText(b.user._id || b.user.id || b.user.userId);
  }
  if (typeof b.userId === "string") return b.userId;
  if (b.userId && typeof b.userId === "object") {
    const u = b.userId as AnyUser;
    return safeText(u._id || u.id || u.userId);
  }
  return null;
}

interface AuctionHistoryProps {
  bids: AnyBid[];
  topUserId?: string;
  meId?: string | null;
}

const AuctionHistory = memo(function AuctionHistory({
  bids,
  topUserId,
  meId,
}: AuctionHistoryProps) {
  if (!bids || bids.length === 0) {
    return <div className="text-sm text-gray-500">Chưa có lượt đấu giá</div>;
  }

  // Sort theo thời gian mới nhất → cũ nhất
  const items = [...bids].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="divide-y">
      {items.slice(0, 10).map((b) => {
        const displayName = getDisplayName(b);
        const avatar = getAvatar(b);
        const userKey = getUserKey(b);
        const key = b._id || `${userKey}-${b.createdAt}`;

        const uid = getUserId(b);
        const isTop = !!topUserId && !!uid && String(uid) === String(topUserId);
        const isMe = !!meId && !!uid && String(uid) === String(meId);

        return (
          <li
            key={key}
            className={`py-2 grid grid-cols-12 items-center gap-2 ${
              isTop ? "bg-indigo-50" : ""
            }`}
          >
            <div className="col-span-6 flex items-center gap-2 min-w-0">
              {isTop && (
                <span
                  className="text-amber-500 text-base"
                  title="Cao nhất hiện tại"
                >
                  👑
                </span>
              )}
              {avatar ? (
                <img src={avatar} className="w-6 h-6 rounded-full" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <span
                className={`text-sm truncate ${
                  isMe ? "font-semibold text-indigo-700" : ""
                }`}
              >
                {displayName}
              </span>
            </div>

            <div
              className={`col-span-3 text-sm font-medium text-right ${
                isTop ? "text-emerald-700" : ""
              }`}
            >
              {Number(b.price).toLocaleString("vi-VN")}₫
            </div>

            <div className="col-span-3 text-xs text-gray-500 text-right">
              {new Date(b.createdAt).toLocaleString("vi-VN")}
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export default AuctionHistory;
