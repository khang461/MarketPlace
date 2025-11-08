/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Auction/AuctionListPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getOngoingAuctions,
  getUpcomingAuctions,
  getEndedAuctions,
  getAllAuctions,
} from "../../config/auctionAPI";
import type { Auction } from "../../types/auction";
import { AuctionCard } from "../../components/Auction";
import { useSearchParams, Link } from "react-router-dom";

type TabKey = "RUNNING" | "PENDING" | "ENDED";

function normalizeStatus(s?: string): TabKey {
  const k = (s ?? "").toUpperCase();
  return k === "PENDING" || k === "ENDED" ? (k as TabKey) : "RUNNING";
}

/** Tìm mảng auction bên trong payload theo nhiều shape khác nhau */
function pickItems(payload: any): Auction[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Auction[];

  // các key phổ biến
  const keys = ["items", "data", "results", "docs", "auctions", "list"];
  for (const k of keys) {
    if (Array.isArray(payload?.[k])) return payload[k] as Auction[];
  }

  // nếu payload là object lồng nhau -> quét 1 tầng
  for (const v of Object.values(payload)) {
    if (Array.isArray(v)) return v as Auction[];
    if (v && typeof v === "object") {
      for (const k of keys) {
        if (Array.isArray((v as any)[k])) return (v as any)[k] as Auction[];
      }
    }
  }

  return [];
}

const statusMap: Record<TabKey, "ongoing" | "upcoming" | "ended"> = {
  RUNNING: "ongoing",
  PENDING: "upcoming",
  ENDED: "ended",
};

export default function AuctionListPage() {
  const [items, setItems] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<{ source: string; rawSample?: any } | null>(null);
  const [params, setParams] = useSearchParams();

  const status = normalizeStatus(params.get("status") ?? "RUNNING");
  const q = (params.get("q") ?? "").trim();

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        let respAll: any | undefined;
        let arr: Auction[] = [];

        // 1) Thử /auctions/all?status=...
        try {
          const { data } = await getAllAuctions({
            page: 1,
            limit: 50,
            status: statusMap[status],
          });
          respAll = data;
          arr = pickItems(respAll);
          if (arr.length && mounted) {
            setItems(arr);
            setDebug({
              source: "GET /auctions/all",
              rawSample: Array.isArray(respAll) ? respAll[0] : respAll?.items?.[0] ?? respAll?.data?.[0],
            });
            return;
          }
        } catch {
          // ignore -> fallback endpoints riêng
        }

        // 2) Fallback theo tab riêng lẻ
        let respEach: any;
        if (status === "RUNNING") {
          ({ data: respEach } = await getOngoingAuctions({ page: 1, limit: 50 }));
        } else if (status === "PENDING") {
          ({ data: respEach } = await getUpcomingAuctions({ page: 1, limit: 50 }));
        } else {
          ({ data: respEach } = await getEndedAuctions({ page: 1, limit: 50 }));
        }

        arr = pickItems(respEach);

        if (mounted) {
          setItems(arr);
          setDebug({
            source:
              status === "RUNNING"
                ? "GET /auctions/ongoing"
                : status === "PENDING"
                ? "GET /auctions/upcoming"
                : "GET /auctions/ended",
            rawSample: Array.isArray(respEach) ? respEach[0] : respEach?.items?.[0] ?? respEach?.data?.[0],
          });
        }
      } catch (err) {
        console.warn("fetch auctions error:", err);
        if (mounted) {
          setItems([]);
          setDebug({ source: "error", rawSample: String(err) });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [status]);

  // Chỉ lọc theo từ khóa (server đã lọc theo tab)
  const filtered = useMemo(() => {
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter((a) => {
      const listing: any = (a as any).listing;
      const primaryTitle =
        listing?.title ??
        [listing?.make, listing?.model, listing?.year].filter(Boolean).join(" ");
      const title = primaryTitle ? primaryTitle : a.listingId;
      return String(title).toLowerCase().includes(term);
    });
  }, [items, q]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-2xl font-semibold">Phiên đấu giá</h1>
        <Link to="/auctions/create" className="text-sm underline">
          + Tạo phiên
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { k: "RUNNING", label: "Đang diễn ra" },
          { k: "PENDING", label: "Sắp diễn ra" },
          { k: "ENDED", label: "Đã kết thúc" },
        ].map((t) => (
          <button
            key={t.k}
            className={`px-3 py-1 rounded border ${
              status === t.k
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white"
            }`}
            onClick={() =>
              setParams((p) => {
                p.set("status", t.k as TabKey);
                return p;
              })
            }
          >
            {t.label}
          </button>
        ))}

        <input
          className="ml-auto rounded border px-3 py-1"
          placeholder="Tìm kiếm…"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value.trim();
              setParams((p) => {
                if (v) p.set("q", v);
                else p.delete("q");
                return p;
              });
            }
          }}
        />
      </div>

      {/* Debug nhỏ: nguồn & số lượng (xoá nếu không cần) */}
      {debug && (
        <div className="mb-3 text-xs text-gray-500">
          Nguồn: <code>{debug.source}</code> • Số lượng: <b>{items.length}</b>
        </div>
      )}

      {loading ? (
        <div>Đang tải…</div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <AuctionCard key={a._id} a={a} />
          ))}
        </div>
      ) : (
        <div className="text-gray-500">
          Không có phiên phù hợp
          <div className="text-xs mt-1">
            (BE đang trả rỗng cho tab này, hoặc shape khác thường. Xem “Nguồn” ở trên.)
          </div>
        </div>
      )}
    </div>
  );
}
