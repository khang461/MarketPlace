/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/account/ListingsTab.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Package, Eye, Send, X, Pencil, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Listing } from "../../types/account";
import api from "../../config/api";
import Swal from "sweetalert2";
import { getImageUrl } from "../../utils/imageHelper";

/** Utils */
const fmtVND = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
    : "—";

const join = (arr: Array<string | undefined | null>) =>
  arr.filter(Boolean).join(", ") || "—";

const Badge: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = "", children }) => (
  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const statusMap: Record<string, { bg: string; text: string; label: string }> = {
  Draft: { bg: "bg-gray-100", text: "text-gray-800", label: "Nháp" },
  PendingReview: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Chờ duyệt" },
  Published: { bg: "bg-green-100", text: "text-green-800", label: "Đã duyệt" },
  Rejected: { bg: "bg-red-100", text: "text-red-800", label: "Bị từ chối" },
  Sold: { bg: "bg-blue-100", text: "text-blue-800", label: "Đã bán" },
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = status
    ? statusMap[status] ?? { bg: "bg-gray-100", text: "text-gray-800", label: status }
    : { bg: "bg-gray-100", text: "text-gray-800", label: "—" };
  return <Badge className={`${s.bg} ${s.text}`}>{s.label}</Badge>;
};

const Info = ({ label, value }: { label: string; value?: string | number }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-medium">{value ?? "—"}</p>
  </div>
);

const ListingsTab: React.FC = () => {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  /** ===== Load mine ===== */
  const refreshMine = useCallback(async () => {
    try {
      setIsLoading(true);
      // BE: GET /api/listings/mine  (axios baseURL đã /api)
      const { data } = await api.get("/listings/mine");
      setMyListings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải danh sách tin đăng",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMine();
  }, [refreshMine]);

  /** ===== Actions ===== */
  const goEdit = (id: string) => {
    // Trang đăng tin mở ở chế độ sửa theo query edit.
    navigate(`/post-listing?edit=${encodeURIComponent(id)}`);
  };

  const submitForReview = async (listingId: string) => {
    // tìm record hiện tại để kiểm ảnh
    const l = myListings.find((x) => x._id === listingId);

    // BE yêu cầu tối thiểu 3 ảnh trước khi submit
    const photoCount = (l?.photos?.length ?? 0);
    if (photoCount < 3) {
      const go = await Swal.fire({
        icon: "info",
        title: "Cần tối thiểu 3 ảnh",
        text: "Vui lòng bổ sung ít nhất 3 ảnh trước khi gửi duyệt.",
        showCancelButton: true,
        confirmButtonText: "Đi tới chỉnh sửa",
        cancelButtonText: "Để sau",
        confirmButtonColor: "#2563eb",
      });
      if (go.isConfirmed && l) goEdit(l._id);
      return;
    }

    const ask = await Swal.fire({
      title: "Xác nhận gửi duyệt",
      text: "Bạn có chắc muốn gửi tin đăng này để admin duyệt?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Gửi duyệt",
      cancelButtonText: "Hủy",
    });
    if (!ask.isConfirmed) return;

    try {
      await api.post(`/listings/${listingId}/submit`, { commissionTermsAccepted: true });
      Swal.fire({
        icon: "success",
        title: "Đã gửi duyệt",
        timer: 1200,
        showConfirmButton: false,
      });
      refreshMine();
      setShow(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("submit error", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          error?.response?.data?.message ||
          (Array.isArray(error?.response?.data?.errors) && error.response.data.errors[0]?.msg) ||
          "Không thể gửi tin đăng",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  /** ===== Render ===== */
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Tin đăng của tôi</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{myListings.length} tin đăng</span>
            <Link
              to="/post-listing"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              + Đăng tin mới
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Bạn chưa có tin đăng nào</p>
            <Link
              to="/post-listing"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myListings.map((l) => (
              <div key={l._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <img
                    src={l.photos?.[0] ? getImageUrl(l.photos[0]) : "/placeholder-car.jpg"}
                    alt={`${l.make || ""} ${l.model || ""}`}
                    className="w-24 h-30 object-cover rounded"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {[l.make, l.model, l.year].filter(Boolean).join(" ")}
                        </h3>
                        <p className="text-blue-600 font-medium text-lg">{fmtVND(l.priceListed)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Loại:</span> {l.type === "Car" ? "Xe điện" : "Pin"} •{" "}
                          <span className="font-medium">Tình trạng:</span> {l.condition || "—"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Địa điểm:</span>{" "}
                          {join([l.location?.district, l.location?.city])}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đăng ngày {l.createdAt ? new Date(l.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </p>

                        {/* Rejected reason */}
                        {l.status === "Rejected" && l.rejectReason && (
                          <div className="mt-2">
                            <Badge className="bg-red-50 text-red-700 border border-red-200">
                              Lý do từ chối: {l.rejectReason}
                            </Badge>
                          </div>
                        )}

                        {/* Pending review hint */}
                        {l.status === "PendingReview" && (
                          <div className="mt-2">
                            <Badge className="bg-yellow-50 text-yellow-800 border border-yellow-200">
                              Đang chờ admin duyệt
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <StatusBadge status={l.status} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelected(l);
                          setShow(true);
                        }}
                        className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 flex items-center space-x-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem chi tiết</span>
                      </button>

                      {(l.status === "Draft" || l.status === "Rejected") && (
                        <button
                          onClick={() => goEdit(l._id)}
                          className="px-3 py-1 text-sm border border-emerald-600 text-emerald-700 rounded hover:bg-emerald-50 flex items-center space-x-1"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Chỉnh sửa</span>
                        </button>
                      )}

                      {l.status === "Draft" && (
                        <button
                          onClick={() => submitForReview(l._id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                        >
                          <Send className="w-4 h-4" />
                          <span>Gửi duyệt</span>
                        </button>
                      )}

                      {l.status === "Rejected" && (
                        <>
                          <span className="text-sm text-gray-500 ml-1">
                            Hãy chỉnh sửa theo góp ý rồi gửi lại.
                          </span>
                          <button
                            onClick={() => submitForReview(l._id)}
                            className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center space-x-1"
                          >
                            <Send className="w-4 h-4" />
                            <span>Gửi lại</span>
                          </button>
                        </>
                      )}

                      {l.status === "Published" && (
                        <Link
                          to={`/vehicle/${l._id}`}
                          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center space-x-1"
                          title="Xem trang công khai"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Xem công khai</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {show && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết tin đăng</h2>
              <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Photos */}
              {selected.photos?.length ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Hình ảnh</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selected.photos.map((p, i) => (
                      <img
                        key={i}
                        src={getImageUrl(p)}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Basic */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label="Loại" value={selected.type === "Car" ? "Xe điện" : "Pin"} />
                  <Info label="Hãng" value={selected.make} />
                  <Info label="Mẫu" value={selected.model} />
                  <Info label="Năm SX" value={selected.year} />
                  <Info label="Tình trạng" value={selected.condition} />
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <StatusBadge status={selected.status} />
                  </div>
                  {selected.status === "Rejected" && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Lý do từ chối</p>
                      <p className="font-medium text-red-600">{selected.rejectReason || "—"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Specs */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info
                    label="Số km đã đi"
                    value={
                      typeof selected.mileageKm === "number"
                        ? `${selected.mileageKm.toLocaleString()} km`
                        : undefined
                    }
                  />
                  <Info
                    label="Dung lượng pin"
                    value={
                      typeof selected.batteryCapacityKWh === "number"
                        ? `${selected.batteryCapacityKWh} kWh`
                        : undefined
                    }
                  />
                  <Info
                    label="Số chu kỳ sạc"
                    value={typeof selected.chargeCycles === "number" ? selected.chargeCycles : undefined}
                  />
                  <Info label="Loại xe" value={(selected as any).vehicleType} />
                  <Info label="Dung tích xi lanh (cc)" value={(selected as any).engineDisplacementCc} />
                  <Info label="Màu sơn" value={(selected as any).paintColor} />
                  <Info label="Biển số" value={(selected as any).licensePlate} />
                  <Info label="Số máy" value={(selected as any).engineNumber} />
                  <Info label="Số khung" value={(selected as any).chassisNumber} />
                  <Info label="Đặc điểm khác" value={(selected as any).otherFeatures} />
                </div>
              </div>

              {/* Price & trade */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Giá & Giao dịch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Giá niêm yết</p>
                    <p className="text-2xl font-bold text-blue-600">{fmtVND(selected.priceListed)}</p>
                  </div>
                  <Info
                    label="Phương thức giao dịch"
                    value={
                      selected.tradeMethod === "meet"
                        ? "Gặp mặt"
                        : selected.tradeMethod === "ship"
                        ? "Giao hàng"
                        : "Ký gửi"
                    }
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Vị trí</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Info label="Thành phố" value={selected.location?.city} />
                  <Info label="Quận/Huyện" value={selected.location?.district} />
                  <Info label="Địa chỉ" value={selected.location?.address} />
                </div>
              </div>

              {/* Times */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thời gian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info
                    label="Ngày tạo"
                    value={selected.createdAt && new Date(selected.createdAt).toLocaleString("vi-VN")}
                  />
                  <Info
                    label="Cập nhật lần cuối"
                    value={selected.updatedAt && new Date(selected.updatedAt).toLocaleString("vi-VN")}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                {(selected.status === "Draft" || selected.status === "Rejected") && (
                  <button
                    onClick={() => goEdit(selected._id)}
                    className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center space-x-2"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                )}

                {selected.status === "Draft" && (
                  <button
                    onClick={() => submitForReview(selected._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi duyệt</span>
                  </button>
                )}

                {selected.status === "Rejected" && (
                  <button
                    onClick={() => submitForReview(selected._id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi lại</span>
                  </button>
                )}

                {selected.status === "Published" && (
                  <Link
                    to={`/vehicle/${selected._id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Xem công khai</span>
                  </Link>
                )}

                <button
                  onClick={() => setShow(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListingsTab;
