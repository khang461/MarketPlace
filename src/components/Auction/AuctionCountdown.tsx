import { useEffect, useMemo, useRef, useState } from "react";

/** Format thời gian gọn */
function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

type StatusUI = "PENDING" | "RUNNING" | "ENDED" | "CANCELLED";
type StatusApi = "active" | "scheduled" | "ended" | "closed" | "cancelled";

function normalizeStatus(
  start: number,
  end: number,
  status?: StatusUI | StatusApi
): StatusUI {
  if (!status) {
    const now = Date.now();
    if (now < start) return "PENDING";
    if (now <= end) return "RUNNING";
    return "ENDED";
  }
  switch (status) {
    case "PENDING":
    case "RUNNING":
    case "ENDED":
    case "CANCELLED":
      return status;
    case "cancelled":
      return "CANCELLED";
    case "active":
      return "RUNNING";
    case "scheduled":
      return "PENDING";
    case "ended":
    case "closed":
      return "ENDED";
    default: // fallback theo thời gian
    {
      const now = Date.now();
      if (now < start) return "PENDING";
      if (now <= end) return "RUNNING";
      return "ENDED";
    }
  }
}

export default function AuctionCountdown({
  startAt,
  endAt,
  status,
  onTick,
}: {
  startAt: string;
  endAt: string;
  status?: StatusUI | StatusApi; // <- giờ optional, nhận cả UI hoặc API
  onTick?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  // Giữ ổn định callback, tránh tạo interval lại khi prop thay đổi tham chiếu
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      tickRef.current?.();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const label = useMemo(() => {
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    const st = normalizeStatus(start, end, status);

    if (st === "CANCELLED") return "Đã hủy";
    if (st === "ENDED") return "Đã kết thúc";
    if (now < start) return `Bắt đầu sau ${fmt(start - now)}`;
    if (now < end) return `Còn lại ${fmt(end - now)}`;
    return "Đang cập nhật…";
  }, [now, startAt, endAt, status]);

  return <span className="text-sm text-gray-600">{label}</span>;
}
