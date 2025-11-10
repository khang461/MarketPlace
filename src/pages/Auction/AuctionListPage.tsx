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

  const keys = ["items", "data", "results", "docs", "auctions", "list"];
  for (const k of keys) {
    if (Array.isArray(payload?.[k])) return payload[k] as Auction[];
  }

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

const SHOW_DEBUG = false; // bật true nếu muốn xem nguồn API & sample

export default function AuctionListPage() {
  const [items, setItems] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<{ source: string; rawSample?: any } | null>(null);
  const [params, setParams] = useSearchParams();

  const status = normalizeStatus(params.get("status") ?? "RUNNING");
  const qParam = (params.get("q") ?? "").trim();

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        let respAll: any | undefined;
        let arr: Auction[] = [];

        // 1) endpoint hợp nhất nếu có
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
            if (SHOW_DEBUG) {
              setDebug({
                source: "GET /auctions/all",
                rawSample: Array.isArray(respAll) ? respAll[0] : respAll?.items?.[0] ?? respAll?.data?.[0],
              });
            }
            return;
          }
        } catch {
          // fallback
        }

        // 2) fallback theo từng tab
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
          if (SHOW_DEBUG) {
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
        }
      } catch (err) {
        console.warn("fetch auctions error:", err);
        if (mounted) {
          setItems([]);
          if (SHOW_DEBUG) setDebug({ source: "error", rawSample: String(err) });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [status]);

  // Lọc theo ô tìm kiếm (BE đã lọc theo tab)
  const filtered = useMemo(() => {
    const term = qParam.toLowerCase();
    if (!term) return items;
    return items.filter((a) => {
      const listing: any = (a as any).listing;
      const primaryTitle =
        listing?.title ??
        [listing?.make, listing?.model, listing?.year].filter(Boolean).join(" ");
      const title = primaryTitle ? primaryTitle : a.listingId;
      return String(title).toLowerCase().includes(term);
    });
  }, [items, qParam]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Phiên đấu giá</h1>
          <p className="text-sm text-gray-500">Xem các phiên đang diễn ra, sắp diễn ra và đã kết thúc.</p>
        </div>
        <Link
          to="/auctions/create"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Tạo phiên
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-lg border bg-white p-1">
          {([
            { k: "RUNNING", label: "Đang diễn ra" },
            { k: "PENDING", label: "Sắp diễn ra" },
            { k: "ENDED", label: "Đã kết thúc" },
          ] as { k: TabKey; label: string }[]).map((t) => {
            const active = status === t.k;
            return (
              <button
                key={t.k}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  active ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() =>
                  setParams((p) => {
                    p.set("status", t.k);
                    return p;
                  })
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="sm:ml-auto relative">
          <input
            className="w-full sm:w-72 rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Tìm kiếm phiên…"
            defaultValue={qParam}
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
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
          </svg>
        </div>
      </div>

      {/* Debug nhỏ (tùy chọn) */}
      {SHOW_DEBUG && debug && (
        <div className="mb-3 text-xs text-gray-500">
          Nguồn: <code>{debug.source}</code> • Số lượng: <b>{items.length}</b>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <AuctionCard key={a._id} a={a} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

/* ================= Helpers (UI) ================ */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-6 animate-pulse rounded bg-gray-200" />
            <div className="h-6 animate-pulse rounded bg-gray-200" />
            <div className="h-6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center text-gray-600">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-gray-100">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
        </svg>
      </div>
      Không có phiên phù hợp.
      <div className="mt-1 text-xs text-gray-500">
        Hãy thử đổi tab hoặc tìm bằng từ khoá khác.
      </div>
    </div>
  );
}
