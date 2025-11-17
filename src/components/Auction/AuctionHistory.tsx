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

// ===== helper nhận diện ObjectId =====
function isMongoId(value: string): boolean {
  return /^[0-9a-f]{24}$/i.test(value);
}

function safeText(v: unknown): string {
  if (v == null) return "";

  if (typeof v === "string" || typeof v === "number") {
    const s = String(v);
    // Nếu nhìn như MongoId thì không dùng làm tên hiển thị
    if (isMongoId(s)) return "";
    return s;
  }

  if (typeof v === "object") {
    const o = v as Record<string, unknown>;

    const name =
      (o.fullName as string) ||
      (o.name as string);

    if (name && !isMongoId(name)) return name;

    const idCandidate =
      (o._id as string) ||
      (o.id as string) ||
      (o.userId as string);

    if (idCandidate && !isMongoId(idCandidate)) {
      return idCandidate;
    }

    try {
      return JSON.stringify(o);
    } catch {
      return "";
    }
  }

  try {
    return String(v);
  } catch {
    return "";
  }
}

function getDisplayName(b: AnyBid): string {
  if (b.user && (b.user.fullName || b.user.name)) {
    const s = safeText(b.user.fullName || b.user.name);
    if (s) return s;
  }

  if (b.userId && typeof b.userId === "object") {
    const u = b.userId as AnyUser;
    const s = safeText(u.fullName || u.name);
    if (s) return s;
  }

  const s = safeText(b.userId);
  if (s) return s;

  return "Người tham gia";
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
    const s = safeText(b.user._id || b.user.id || b.user.userId);
    return s || null;
  }
  if (typeof b.userId === "string") return b.userId;
  if (b.userId && typeof b.userId === "object") {
    const u = b.userId as AnyUser;
    const s = safeText(u._id || u.id || u.userId);
    return s || null;
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

  // Đã truyền topBids từ ngoài (đã sort theo giá cao → thấp),
  // ở đây chỉ sort theo thời gian nếu bạn muốn, còn mình giữ nguyên thứ tự.
  const items = [...bids]; // nếu muốn sort theo thời gian thì thay bằng sort(createdAt)

  return (
    <ul className="divide-y">
      {items.slice(0, 10).map((b, index) => {
        const rank = index + 1;
        const displayName = getDisplayName(b) || "Người tham gia";
        const avatar = getAvatar(b);
        const userKey = getUserKey(b);
        const key = b._id || `${userKey}-${b.createdAt}`;

        const uid = getUserId(b);
        const isTop =
          (!!topUserId && !!uid && String(uid) === String(topUserId)) ||
          rank === 1;
        const isMe = !!meId && !!uid && String(uid) === String(meId);

        return (
          <li
            key={key}
            className={`py-2 px-2 grid grid-cols-12 items-center gap-2 ${
              isTop ? "bg-amber-50" : ""
            }`}
          >
            {/* Cột rank + avatar + tên */}
            <div className="col-span-7 flex items-center gap-3 min-w-0">
              {/* Rank */}
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                  isTop
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {rank}
              </div>

              {/* Avatar */}
              {avatar ? (
                <img
                  src={avatar}
                  className="w-7 h-7 rounded-full object-cover"
                  alt=""
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200" />
              )}

              {/* Tên + badge */}
              <div className="flex items-center gap-2 min-w-0">
                {isTop && (
                  <span
                    className="text-amber-500 text-base"
                    title="Cao nhất hiện tại"
                  >
                    👑
                  </span>
                )}
                <span
                  className={`text-sm truncate ${
                    isMe ? "font-semibold text-indigo-700" : ""
                  }`}
                >
                  {displayName}
                </span>
                {isMe && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                    Bạn
                  </span>
                )}
              </div>
            </div>

            {/* Giá */}
            <div
              className={`col-span-3 text-sm font-medium text-right ${
                isTop ? "text-emerald-700" : ""
              }`}
            >
              {Number(b.price).toLocaleString("vi-VN")}₫
            </div>

            {/* Thời gian */}
            <div className="col-span-2 text-[11px] text-gray-500 text-right">
              {new Date(b.createdAt).toLocaleString("vi-VN")}
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export default AuctionHistory;
