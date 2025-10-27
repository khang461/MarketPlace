import React, { useState, useEffect } from "react";
import { Package, Eye, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Listing } from "../../types/account";
import api from "../../config/api";
import Swal from "sweetalert2";
import { getImageUrl } from "../../utils/imageHelper";

const ListingsTab: React.FC = () => {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setIsLoadingListings(true);
      const response = await api.get("/listings/mine");
      console.log("My listings:", response.data);
      setMyListings(response.data);
    } catch (error) {
      console.error("Error fetching my listings:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải danh sách tin đăng",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsLoadingListings(false);
    }
  };

  const handleSubmitListing = async (listingId: string) => {
    const result = await Swal.fire({
      title: "Xác nhận gửi duyệt",
      text: "Bạn có chắc muốn gửi tin đăng này để admin duyệt?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Gửi duyệt",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/listings/${listingId}/submit`);

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã gửi tin đăng để admin duyệt",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchMyListings();
      } catch (error: unknown) {
        console.error("Error submitting listing:", error);
        const axiosError = error as {
          response?: { data?: { error?: string; message?: string } };
        };

        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text:
            axiosError.response?.data?.error ||
            axiosError.response?.data?.message ||
            "Không thể gửi tin đăng",
          confirmButtonColor: "#2563eb",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      Draft: { bg: "bg-gray-100", text: "text-gray-800", label: "Nháp" },
      PendingReview: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Chờ duyệt",
      },
      Approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Đã duyệt",
      },
      Rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Bị từ chối",
      },
      Sold: { bg: "bg-blue-100", text: "text-blue-800", label: "Đã bán" },
    };
    const statusInfo = statusMap[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };
    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Tin đăng của tôi</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {myListings.length} tin đăng
            </span>
            <Link
              to="/post-listing"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              + Đăng tin mới
            </Link>
          </div>
        </div>

        {isLoadingListings ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            {myListings.map((listing) => (
              <div
                key={listing._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={
                      listing.photos && listing.photos.length > 0
                        ? getImageUrl(listing.photos[0])
                        : "/placeholder-car.jpg"
                    }
                    alt={`${listing.make} ${listing.model}`}
                    className="w-24 h-30 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {listing.make} {listing.model} {listing.year}
                        </h3>
                        <p className="text-blue-600 font-medium text-lg">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(listing.priceListed)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Loại:</span>{" "}
                          {listing.type === "Car" ? "Ô tô điện" : "Pin xe điện"}{" "}
                          • <span className="font-medium">Tình trạng:</span>{" "}
                          {listing.condition}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Địa điểm:</span>{" "}
                          {listing.location.district}, {listing.location.city}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đăng ngày{" "}
                          {new Date(listing.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(listing.status)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem chi tiết</span>
                      </button>

                      {listing.status === "Draft" && (
                        <button
                          onClick={() => handleSubmitListing(listing._id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                        >
                          <Send className="w-4 h-4" />
                          <span>Gửi duyệt</span>
                        </button>
                      )}

                      {listing.status === "PendingReview" && (
                        <span className="px-3 py-1 text-sm text-gray-600 italic">
                          Đang chờ admin duyệt...
                        </span>
                      )}

                      {listing.status === "Rejected" && (
                        <button
                          onClick={() => handleSubmitListing(listing._id)}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center space-x-1"
                        >
                          <Send className="w-4 h-4" />
                          <span>Gửi lại</span>
                        </button>
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
      {showDetailModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiết tin đăng
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Photos */}
              {selectedListing.photos && selectedListing.photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Hình ảnh</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedListing.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={getImageUrl(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loại</p>
                    <p className="font-medium">{selectedListing.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hãng</p>
                    <p className="font-medium">{selectedListing.make}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mẫu xe</p>
                    <p className="font-medium">{selectedListing.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Năm sản xuất</p>
                    <p className="font-medium">{selectedListing.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tình trạng</p>
                    <p className="font-medium">{selectedListing.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    {getStatusBadge(selectedListing.status)}
                  </div>
                </div>
              </div>

              {/* Technical Specs */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Thông số kỹ thuật
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedListing.mileageKm !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Số km đã đi</p>
                      <p className="font-medium">
                        {selectedListing.mileageKm.toLocaleString()} km
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Dung lượng pin</p>
                    <p className="font-medium">
                      {selectedListing.batteryCapacityKWh} kWh
                    </p>
                  </div>
                  {selectedListing.chargeCycles !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Số chu kỳ sạc</p>
                      <p className="font-medium">
                        {selectedListing.chargeCycles}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Trade */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Giá & Giao dịch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Giá niêm yết</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(selectedListing.priceListed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Phương thức giao dịch
                    </p>
                    <p className="font-medium">
                      {selectedListing.tradeMethod === "meet"
                        ? "Gặp mặt trực tiếp"
                        : "Giao hàng tận nơi"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Vị trí</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Thành phố</p>
                    <p className="font-medium">
                      {selectedListing.location.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quận/Huyện</p>
                    <p className="font-medium">
                      {selectedListing.location.district}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ</p>
                    <p className="font-medium">
                      {selectedListing.location.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thời gian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Ngày tạo</p>
                    <p className="font-medium">
                      {new Date(selectedListing.createdAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                    <p className="font-medium">
                      {new Date(selectedListing.updatedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                {selectedListing.status === "Draft" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleSubmitListing(selectedListing._id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi duyệt</span>
                  </button>
                )}

                {selectedListing.status === "Rejected" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleSubmitListing(selectedListing._id);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi lại</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDetailModal(false)}
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
