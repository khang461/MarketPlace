// src/components/Auction/AuctionHistory.tsx
import { memo, useMemo, useState } from "react";
import type { Bid } from "../../types/auction";

type AnyUser = { _id?: string; id?: string; userId?: string; fullName?: string; name?: string; avatar?: string };
type AnyBid = Bid & { user?: AnyUser | null; userId?: string | AnyUser; _id?: string };

function isMongoId(value: string): boolean { return /^[0-9a-f]{24}$/i.test(value); }
function safeText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") { const s = String(v); if (isMongoId(s)) return ""; return s; }
  if (typeof v === "object") { try { return JSON.stringify(v); } catch { return ""; } }
  try { return String(v); } catch { return ""; }
}
function getDisplayName(b: AnyBid): string { if (b.user && (b.user.fullName || b.user.name)) return safeText(b.user.fullName || b.user.name); if (b.userId && typeof b.userId === "object") return safeText((b.userId as AnyUser).fullName || (b.userId as AnyUser).name); return safeText(b.userId) || "Người tham gia"; }
function getUserKey(b: AnyBid): string { const sid = getStableUserId(b); if (sid) return String(sid); const dn = getDisplayName(b); return dn || "anon"; }
function getAvatar(b: AnyBid): string | undefined { if (b.user?.avatar) return b.user.avatar; if (b.userId && typeof b.userId === "object") return (b.userId as AnyUser).avatar; return undefined; }
// Return a stable raw user id for deduplication/lookup. Do NOT run through `safeText` here
// because `safeText` intentionally blanks pure mongo ids for display purposes.
function getStableUserId(b: AnyBid): string | null {
  if (b.user) {
    if (b.user._id) return String(b.user._id);
    if (b.user.id) return String(b.user.id);
    if (b.user.userId) return String(b.user.userId);
  }
  if (typeof b.userId === "string") return b.userId;
  if (b.userId && typeof b.userId === "object") {
    const u = b.userId as AnyUser;
    if (u._id) return String(u._id);
    if (u.id) return String(u.id);
    if (u.userId) return String(u.userId);
  }
  return null;
}
// For display (readable name) we still use safeText-based helpers; this function
// keeps the old behaviour of returning a display-friendly id/name or null.
function getUserId(b: AnyBid): string | null { const sid = getStableUserId(b); if (sid) return sid; return null; }

interface AuctionHistoryProps { bids: AnyBid[]; meId?: string | null; uiStatus?: string; pageSize?: number }

const AuctionHistory = memo(function AuctionHistory({ bids, meId, uiStatus, pageSize }: AuctionHistoryProps) {
  const items = useMemo(() => {
    const map = new Map<string, AnyBid>();
    for (const b of bids) {
      // Prefer a stable user id for deduplication. This handles optimistic bids where
      // userId may be a string and server bids where userId is an object with _id.
      const uid = getUserId(b);
      const key = uid ? `u:${uid}` : b._id ? `id:${b._id}` : `name:${getDisplayName(b)}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, b);
      } else {
        const existingPrice = Number(existing.price || 0);
        const newPrice = Number(b.price || 0);
        // keep the higher price; if equal, keep the most recent
        if (!Number.isNaN(newPrice) && newPrice > existingPrice) map.set(key, b);
        else if (newPrice === existingPrice) {
          const exTime = new Date(existing.createdAt || 0).getTime();
          const newTime = new Date(b.createdAt || 0).getTime();
          if (newTime > exTime) map.set(key, b);
        }
      }
    }
    return Array.from(map.values()).sort((a, c) => {
      const pa = Number(a.price || 0);
      const pb = Number(c.price || 0);
      if (pb !== pa) return pb - pa;
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(c.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [bids]);

  const [page, setPage] = useState(1);

  // Build a map of userId -> display name from available bid objects so we can
  // show names even when a bid only contains a userId string (optimistic update).
  const nameById = (function buildNameMap() {
    const m = new Map<string, string>();
    for (const b of bids) {
      const uid = getUserId(b);
      const nameFromUser = b.user && (b.user.fullName || b.user.name);
      if (uid && nameFromUser) {
        m.set(uid, safeText(nameFromUser));
        continue;
      }
      if (b.userId && typeof b.userId === "object") {
        const u = b.userId as AnyUser;
        const name = u.fullName || u.name;
        if (u._id && name) m.set(String(u._id), safeText(name));
      }
    }
    return m;
  })();

  if (!items || items.length === 0) return <div className="text-sm text-gray-500">Chưa có lượt đấu giá</div>;

  const localTopUserId = items.length ? getUserId(items[0]) : null;
  const isRunning = uiStatus === "RUNNING";
  const ps = pageSize && pageSize > 0 ? pageSize : 20;
  const totalPages = Math.max(1, Math.ceil(items.length / ps));

  const renderList = (list: AnyBid[]) => (
    <ul className="divide-y">
      {list.map((b, idx) => {
        const rank = idx + 1;
        // Resolve display name with multiple fallbacks: explicit user, userId object,
        // name map from other bids, then fallback to readable string or generic label.
        const uid = getUserId(b);
        let displayName = "";
        if (b.user && (b.user.fullName || b.user.name)) {
          displayName = safeText(b.user.fullName || b.user.name);
        } else if (b.userId && typeof b.userId === "object") {
          displayName = safeText((b.userId as AnyUser).fullName || (b.userId as AnyUser).name);
        } else if (uid && nameById.has(uid)) {
          displayName = nameById.get(uid) as string;
        } else if (typeof b.userId === "string" && !isMongoId(b.userId)) {
          displayName = safeText(b.userId);
        } else {
          displayName = "Người tham gia";
        }
        const avatar = getAvatar(b);
        const userKey = getUserKey(b);
        const key = b._id || `${userKey}-${b.createdAt}`;
        const isTop = (!!localTopUserId && !!uid && String(uid) === String(localTopUserId)) || rank === 1;
        const isMe = !!meId && !!uid && String(uid) === String(meId);

        return (
          <li key={key} className={`py-2 px-2 grid grid-cols-12 items-center gap-2 ${isTop ? "bg-amber-50" : ""}`}>
            <div className="col-span-7 flex items-center gap-3 min-w-0">
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${isTop ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{rank}</div>
              {avatar ? <img src={avatar} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-7 h-7 rounded-full bg-gray-200" />}
              <div className="flex items-center gap-2 min-w-0">
                {isTop && <span className="text-amber-500 text-base" title="Cao nhất hiện tại">👑</span>}
                <span className={`text-sm truncate ${isMe ? "font-semibold text-indigo-700" : ""}`}>{displayName}</span>
                {isMe && <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">Bạn</span>}
              </div>
            </div>
            <div className={`col-span-3 text-sm font-medium text-right ${isTop ? "text-emerald-700" : ""}`}>{Number(b.price).toLocaleString("vi-VN")}₫</div>
            <div className="col-span-2 text-[11px] text-gray-500 text-right">{new Date(b.createdAt).toLocaleString("vi-VN")}</div>
          </li>
        );
      })}
    </ul>
  );

  if (isRunning) return renderList(items.slice(0, 5));

  const start = (page - 1) * ps;
  const pageItems = items.slice(start, start + ps);

  return (
    <div>
      {renderList(pageItems)}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border bg-white disabled:opacity-50">Trước</button>
          <div className="text-sm text-gray-600">{page} / {totalPages}</div>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border bg-white disabled:opacity-50">Sau</button>
        </div>
      )}
    </div>
  );
});

export default AuctionHistory;
