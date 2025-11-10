// src/pages/Auction/AuctionCreatePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { createAuction } from "../../config/auctionAPI";
import type { Listing } from "../../types/account";

type FormState = {
  listingId: string;
  startAt: string;       // datetime-local format (YYYY-MM-DDTHH:mm)
  endAt: string;         // datetime-local format
  startingPrice: number;
  depositAmount: number; // chỉ hiển thị UI, KHÔNG gửi lên /auctions
};

const dtLocalPlus = (mins: number) =>
  new Date(Date.now() + mins * 60_000).toISOString().slice(0, 16);

const fmtVND = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n)
    ? n.toLocaleString("vi-VN") + "₫"
    : "";

export default function AuctionCreatePage() {
  const nav = useNavigate();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [lsBusy, setLsBusy] = useState(true);
  const [lsErr, setLsErr] = useState<string>("");

  const [form, setForm] = useState<FormState>({
    listingId: "",
    startAt: dtLocalPlus(15),
    endAt: dtLocalPlus(75),
    startingPrice: 0,
    depositAmount: 0,
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Load listing của tôi (đã duyệt)
  const fetchMine = async () => {
    setLsBusy(true);
    setLsErr("");
    try {
      const res = await api.get<Listing[]>("/listings/mine");
      const data = res.data || [];
      const published = data.filter((l) => l.status === "Published");
      setMyListings(published);

      if (published.length === 0) {
        setLsErr("Bạn chưa có listing nào đã được duyệt (Published).");
      }

      // nếu listing hiện tại không còn hợp lệ -> reset
      if (published.findIndex((x) => x._id === form.listingId) === -1) {
        setForm((s) => ({ ...s, listingId: "" }));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("getMyListings error:", e);
      const code = e?.response?.status;
      if (code === 401) setLsErr("Bạn cần đăng nhập để xem danh sách.");
      else setLsErr("Không thể tải danh sách listing.");
    } finally {
      setLsBusy(false);
    }
  };

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listing đang chọn
  const selectedListing = useMemo(
    () => myListings.find((l) => l._id === form.listingId),
    [myListings, form.listingId]
  );

  // Tính giá tối thiểu: 80% của priceListed (nếu có)
  const minStartingPrice = useMemo(() => {
    const base = selectedListing?.priceListed;
    if (typeof base === "number" && !Number.isNaN(base)) {
      return Math.ceil(base * 0.8);
    }
    return 0; // nếu không có priceListed thì không áp ngưỡng 80%
  }, [selectedListing]);

  // Label cho dropdown
  const listingOptions = useMemo(
    () =>
      myListings.map((l) => {
        const title = [l.make, l.model, l.year ? `(${l.year})` : ""]
          .filter(Boolean)
          .join(" ");
        const price =
          typeof l.priceListed === "number"
            ? ` • ${l.priceListed.toLocaleString("vi-VN")}₫`
            : "";
        return { id: l._id, label: `✅ ${title || l._id}${price}` };
      }),
    [myListings]
  );

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({
      ...s,
      [name]:
        name === "startingPrice" || name === "depositAmount"
          ? Number(value)
          : value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!form.listingId) {
      setMsg("Vui lòng chọn Listing đã duyệt.");
      return;
    }

    // Validate thời gian
    const startMs = new Date(form.startAt).getTime();
    const endMs = new Date(form.endAt).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      setMsg("Thời gian không hợp lệ.");
      return;
    }
    if (endMs <= startMs) {
      setMsg("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    // Validate giá khởi điểm
    if (form.startingPrice < 0) {
      setMsg("Giá khởi điểm phải ≥ 0.");
      return;
    }
    if (
      typeof selectedListing?.priceListed === "number" &&
      !Number.isNaN(selectedListing.priceListed) &&
      form.startingPrice < minStartingPrice
    ) {
      setMsg(
        `Giá khởi điểm phải ≥ 80% giá trị xe (${fmtVND(minStartingPrice)}).`
      );
      return;
    }

    setBusy(true);
    try {
      // ✅ Payload đúng theo Swagger BE: KHÔNG gửi depositAmount
      const payload = {
        listingId: form.listingId,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        startingPrice: Number(form.startingPrice),
      };

      const { data } = await createAuction(payload);
      const id = data?._id || data?.id;

      if (id) {
        nav(`/auctions/${id}`);
      } else {
        setMsg("Tạo phiên thành công nhưng không nhận được ID.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("create auction error:", err);
      setMsg(err?.response?.data?.message || "Không thể tạo phiên.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tạo phiên đấu giá</h1>
        <p className="text-sm text-gray-500 mt-1">
          Chọn xe đã được duyệt và thiết lập thời gian &amp; giá khởi điểm. Giá khởi điểm phải{" "}
          <span className="font-medium">≥ 80% giá trị xe</span>.
        </p>
      </div>

      {/* Card: chọn listing */}
      <div className="rounded-xl border bg-white shadow-sm p-4 mb-5">
        <label className="block text-sm font-medium mb-2">
          Chọn listing (ĐÃ DUYỆT)
        </label>
        <div className="flex gap-2 items-center">
          <select
            name="listingId"
            value={form.listingId}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={lsBusy}
          >
            <option value="">-- Chọn listing đã duyệt --</option>
            {listingOptions.map((op) => (
              <option key={op.id} value={op.id}>
                {op.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchMine}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 active:scale-[.99] transition"
            disabled={lsBusy}
          >
            Tải lại
          </button>
        </div>

        {lsErr && <div className="mt-2 text-xs text-amber-700">{lsErr}</div>}

        {/* Thông tin listing đang chọn */}
        {selectedListing && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 border text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">
                  {[
                    selectedListing.make,
                    selectedListing.model,
                    selectedListing.year ? `(${selectedListing.year})` : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </div>
                <div className="text-gray-600">
                  Giá niêm yết:{" "}
                  <span className="font-medium">
                    {fmtVND(selectedListing.priceListed)}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 border border-emerald-200">
                Published
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card: form thông tin phiên */}
      <form onSubmit={submit} className="rounded-xl border bg-white shadow-sm p-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bắt đầu</label>
            <input
              type="datetime-local"
              name="startAt"
              value={form.startAt}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Thời gian hệ thống: {new Date().toLocaleString("vi-VN")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kết thúc</label>
            <input
              type="datetime-local"
              name="endAt"
              value={form.endAt}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Giá khởi điểm (₫)
            </label>
            <input
              type="number"
              min={minStartingPrice || 0}
              step={1000}
              name="startingPrice"
              value={form.startingPrice}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="mt-1 text-xs">
              {typeof selectedListing?.priceListed === "number" ? (
                <span className="text-gray-600">
                  Tối thiểu:{" "}
                  <span className="font-medium">
                    {fmtVND(minStartingPrice)} (80% của {fmtVND(selectedListing.priceListed)})
                  </span>
                </span>
              ) : (
                <span className="text-gray-500">
                  Listing chưa có giá niêm yết, chỉ cần ≥ 0.
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tiền cọc (₫){" "}
              <span className="text-gray-400">(không gửi khi tạo phiên)</span>
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              name="depositAmount"
              value={form.depositAmount}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 active:scale-[.99] transition"
          >
            Quay lại
          </button>

          <button
            type="submit"
            disabled={busy || !form.listingId}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 active:scale-[.99] transition"
          >
            {busy ? "Đang tạo..." : "Tạo phiên"}
          </button>
        </div>

        {msg && (
          <div className="text-sm text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
