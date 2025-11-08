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

    if (form.startingPrice < 0) {
      setMsg("Giá khởi điểm phải >= 0.");
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
    <div className="container mx-auto px-4 py-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Tạo phiên đấu giá</h1>

      {/* Chỉ chọn listing đã được duyệt */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Chọn listing (ĐÃ DUYỆT)</label>
        <div className="flex gap-2 items-center">
          <select
            name="listingId"
            value={form.listingId}
            onChange={onChange}
            className="w-full border rounded-md px-3 py-2"
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
            className="px-3 py-2 rounded-md border text-sm"
            disabled={lsBusy}
          >
            Tải lại
          </button>
        </div>

        {lsErr && <div className="mt-1 text-xs text-amber-700">{lsErr}</div>}
      </div>

      {/* Form thông tin phiên */}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Bắt đầu</label>
            <input
              type="datetime-local"
              name="startAt"
              value={form.startAt}
              onChange={onChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Kết thúc</label>
            <input
              type="datetime-local"
              name="endAt"
              value={form.endAt}
              onChange={onChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Giá khởi điểm (₫)</label>
            <input
              type="number"
              min={0}
              name="startingPrice"
              value={form.startingPrice}
              onChange={onChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Tiền cọc (₫) <span className="text-gray-400">(không gửi khi tạo phiên)</span>
            </label>
            <input
              type="number"
              min={0}
              name="depositAmount"
              value={form.depositAmount}
              onChange={onChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy || !form.listingId}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
        >
          {busy ? "Đang tạo..." : "Tạo phiên"}
        </button>

        {msg && <div className="text-sm text-amber-700 mt-2">{msg}</div>}
      </form>
    </div>
  );
}
