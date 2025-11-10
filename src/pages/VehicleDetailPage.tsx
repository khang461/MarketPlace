import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Share2,
  MapPin,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
} from "lucide-react";
import api from "../config/api";
import { getImageUrl } from "../utils/imageHelper";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

interface ListingDetail {
  _id: string;
  sellerId: {
    _id: string;
    email: string;
    phone: string;
    fullName: string;
    createdAt: string;
  };
  type: string;
  make: string;
  model: string;
  year: number;
  batteryCapacityKWh: number;
  mileageKm?: number;
  chargeCycles?: number;
  condition: string;
  photos: Array<{ url: string; kind: string }>;
  location: {
    city: string;
    district: string;
    address: string;
  };
  priceListed: number;
  tradeMethod: string;
  status: string;
  documents: Array<{ url: string; kind: string }>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  description?: string;
}

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    const fetchListingDetail = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/listings/${id}`);
        console.log("Listing detail:", response.data);
        setListing(response.data);
      } catch (error) {
        console.error("Error fetching listing detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchListingDetail();
    }
  }, [id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy sản phẩm
          </h1>
          <Link to="/search" className="text-blue-600 hover:underline">
            Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === listing.photos.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.photos.length - 1 : prev - 1
    );
  };

  const title = `${listing.make} ${listing.model} ${listing.year}`;

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để nhắn tin với người bán",
        confirmButtonColor: "#2563eb",
        showCancelButton: true,
        confirmButtonText: "Đăng nhập",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/signin");
        }
      });
      return;
    }

    try {
      const response = await api.get(`/chat/listing/${id}`);
      console.log("Chat created/found:", response.data);

      // Navigate to chat page with chatId and pass chat data via state
      navigate(`/chat/${response.data._id}`, {
        state: { chat: response.data },
      });
    } catch (error: unknown) {
      console.error("Error creating chat:", error);
      const axiosError = error as {
        response?: { data?: { error?: string; message?: string } };
      };

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          axiosError.response?.data?.error || "Không thể tạo cuộc trò chuyện",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  // Helper function để hiển thị popup số dư không đủ
  const showInsufficientBalanceDialog = (
    requiredAmount: number,
    currentBalance: number,
    missingAmount: number,
    vnpayUrl: string
  ) => {
    Swal.fire({
      icon: "warning",
      title: "Số dư không đủ",
      html: `
        <div class="text-left space-y-2">
          <p>Tổng tiền cần đặt cọc: <strong class="text-blue-600">${formatPrice(requiredAmount)}</strong></p>
          <p>Số dư hiện tại: <strong>${formatPrice(currentBalance)}</strong></p>
          <div class="border-b pb-2 mb-2">
            <p class="text-lg font-semibold text-orange-600">Bạn chỉ cần nạp thêm: <strong>${formatPrice(missingAmount)}</strong></p>
          </div>
          <p class="mt-3 text-gray-600">Bạn có muốn nạp trực tiếp <strong>${formatPrice(missingAmount)}</strong> vào ví để đặt cọc không?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Nạp tiền",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2563eb",
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirect to VNPay để nạp tiền (chỉ nạp số tiền còn thiếu)
        window.location.href = vnpayUrl;
      }
    });
  };

  const handleDeposit = async () => {
    if (isDepositing) return;

    if (!isAuthenticated) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để đặt cọc",
        confirmButtonColor: "#2563eb",
        showCancelButton: true,
        confirmButtonText: "Đăng nhập",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/signin");
        }
      });
      return;
    }

    // Yêu cầu nhập số tiền đặt cọc
    const { value: depositAmount } = await Swal.fire({
      title: "Đặt cọc",
      html: `
        <p class="text-left mb-4">Giá xe: <strong>${formatPrice(listing.priceListed)}</strong></p>
        <label class="block text-left mb-2">Số tiền đặt cọc (VND):</label>
        <input 
          id="depositAmount" 
          type="number" 
          class="swal2-input" 
          placeholder="Nhập số tiền" 
          min="${Math.round(listing.priceListed * 0.1)}" 
          step="100000"
        />
        <p class="text-left mt-2 text-sm text-gray-500">Số tiền tối thiểu: ${formatPrice(Math.round(listing.priceListed * 0.1))} (10% giá xe)</p>
      `,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      showCancelButton: true,
      preConfirm: () => {
        const amount = (document.getElementById('depositAmount') as HTMLInputElement).value;
        const minAmount = Math.round(listing.priceListed * 0.1); // 10% giá xe
        if (!amount || parseInt(amount) < minAmount) {
          Swal.showValidationMessage(`Số tiền phải lớn hơn hoặc bằng ${formatPrice(minAmount)} (10% giá xe)`);
          return false;
        }
        return parseInt(amount);
      }
    });
    
    if (!depositAmount) return;

    setIsDepositing(true);

    // Gọi API đặt cọc
    try {
      const response = await api.post("/deposits", {
        listingId: id,
        depositAmount: depositAmount,
      });

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Đặt cọc thành công!",
          text: "Yêu cầu đặt cọc của bạn đã được gửi đến người bán, xin hãy kiểm tra mục 「Yêu cầu đặt cọc」thường xuyên!",
          confirmButtonColor: "#2563eb",
        });
      } else if (response.data.vnpayUrl) {
        // Số dư không đủ, BE trả về URL VNPay để nạp tiền
        const requiredAmount = response.data.requiredAmount || 0;
        const currentBalance = response.data.currentBalance || 0;
        const missingAmount = response.data.missingAmount || (requiredAmount - currentBalance);
        
        showInsufficientBalanceDialog(
          requiredAmount,
          currentBalance,
          missingAmount,
          response.data.vnpayUrl || ''
        );
      } else {
        // Lỗi khác
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: response.data.message || "Không thể tạo yêu cầu đặt cọc",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error: unknown) {
      console.error("Error creating deposit:", error);
      const axiosError = error as {
        response?: { data?: { message?: string; error?: string; vnpayUrl?: string; requiredAmount?: number; currentBalance?: number; missingAmount?: number } };
      };

      // Kiểm tra nếu có vnpayUrl trong response lỗi
      if (axiosError.response?.data?.vnpayUrl) {
        const requiredAmount = axiosError.response.data.requiredAmount || 0;
        const currentBalance = axiosError.response.data.currentBalance || 0;
        const missingAmount = axiosError.response.data.missingAmount || (requiredAmount - currentBalance);
        
        showInsufficientBalanceDialog(
          requiredAmount,
          currentBalance,
          missingAmount,
          axiosError.response.data.vnpayUrl || ""
        );
      } else if (axiosError.response?.data?.error?.includes("freezeAmount is not a function")) {
        // Lỗi backend - walletService không có freezeAmount function
        Swal.fire({
          icon: "error",
          title: "Lỗi hệ thống",
          html: `
            <p>Xin lỗi, hệ thống đang gặp lỗi kỹ thuật.</p>
            <p class="text-sm text-gray-500 mt-2">Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.</p>
          `,
          confirmButtonColor: "#2563eb",
        });
      } else {
        const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || "Không thể tạo yêu cầu đặt cọc";
        const errorDetail = axiosError.response?.data?.error && axiosError.response.data.error !== errorMessage 
          ? `<p class="text-xs text-gray-500 mt-2">${axiosError.response.data.error}</p>` 
          : '';
        
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          html: `
            <p>${errorMessage}</p>
            ${errorDetail}
          `,
          confirmButtonColor: "#2563eb",
        });
      }
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link to="/" className="text-blue-600 hover:underline">
                Trang chủ
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li>
              <Link to="/search" className="text-blue-600 hover:underline">
                Tìm kiếm
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900">{title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={getImageUrl(listing.photos[currentImageIndex])}
                  alt={title}
                  className="w-full h-96 object-cover"
                />
                {listing.photos.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {listing.photos.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {listing.photos.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex
                          ? "border-blue-600"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={getImageUrl(photo)}
                        alt={`${title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Thông số kỹ thuật
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại:</span>
                    <span className="font-semibold">
                      {listing.type === "Car" ? "Ô tô điện" : "Pin xe điện"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hãng xe:</span>
                    <span className="font-semibold">{listing.make}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mẫu xe:</span>
                    <span className="font-semibold">{listing.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Năm sản xuất:</span>
                    <span className="font-semibold">{listing.year}</span>
                  </div>
                  {listing.mileageKm !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số km đã chạy:</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat("vi-VN").format(
                          listing.mileageKm
                        )}{" "}
                        km
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dung lượng pin:</span>
                    <span className="font-semibold">
                      {listing.batteryCapacityKWh} kWh
                    </span>
                  </div>
                  {listing.chargeCycles !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chu kỳ sạc:</span>
                      <span className="font-semibold">
                        {listing.chargeCycles}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tình trạng:</span>
                    <span className="font-semibold">{listing.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa điểm:</span>
                    <span className="font-semibold">
                      {listing.location.district}, {listing.location.city}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Phương thức giao dịch:
                    </span>
                    <span className="font-semibold">
                      {listing.tradeMethod === "meet"
                        ? "Gặp mặt trực tiếp"
                        : "Giao hàng tận nơi"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span
                      className={`font-semibold ${
                        listing.status === "Published"
                          ? "text-green-600"
                          : listing.status === "Draft"
                          ? "text-gray-600"
                          : listing.status === "PendingReview"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {listing.status === "Published"
                        ? "Đã đăng"
                        : listing.status === "Draft"
                        ? "Nháp"
                        : listing.status === "PendingReview"
                        ? "Chờ duyệt"
                        : listing.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả</h2>
                <div className="text-gray-700 leading-relaxed">
                  {showFullDescription ? (
                    <p>{listing.description}</p>
                  ) : (
                    <p>{listing.description.substring(0, 200)}...</p>
                  )}
                  {listing.description.length > 200 && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-blue-600 hover:underline mt-2"
                    >
                      {showFullDescription ? "Thu gọn" : "Xem thêm"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Price and Contact */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(listing.priceListed)}
                </p>
                {listing.status === "Published" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Đang bán
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isDepositing
                      ? "bg-blue-400 text-white cursor-wait opacity-80"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isDepositing ? "Đang đặt cọc..." : "Đặt cọc"}
                </button>
                <button className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Thêm vào yêu thích</span>
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Thông tin người bán
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {listing.sellerId.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">{listing.sellerId.fullName}</h4>
                  <p className="text-sm text-gray-600">
                    {listing.sellerId.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p>
                  <strong>Số điện thoại:</strong> {listing.sellerId.phone}
                </p>
                <p>
                  <strong>Tham gia từ:</strong>{" "}
                  {new Date(listing.sellerId.createdAt).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
              </div>

              {/* Chỉ hiển thị contact buttons nếu KHÔNG phải tin đăng của mình */}
              {user?.id !== listing.sellerId._id && (
                <div className="space-y-3">
                 
                  <button
                    onClick={handleStartChat}
                    className="w-full border border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Nhắn tin</span>
                  </button>
                </div>
              )}

              {/* Hiển thị badge nếu là tin đăng của mình */}
              {user?.id === listing.sellerId._id && (
                <div className="text-center">
                  <p className="text-blue-800 font-medium mb-2">Đây là tin đăng của bạn</p>
                  <button
                  onClick={() =>
                    navigate("/account", { state: { activeTab: "listings" } })
                  }
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                  Quản lý tin đăng
                  </button>
                </div>
              )}
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Vị trí</span>
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Thành phố:</strong> {listing.location.city}
                </p>
                <p>
                  <strong>Quận/Huyện:</strong> {listing.location.district}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {listing.location.address}
                </p>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Lưu ý an toàn</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Kiểm tra kỹ xe trước khi mua</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Giao dịch tại nơi công cộng</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Không chuyển tiền trước</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Yêu cầu giấy tờ đầy đủ</span>
                </li>
              </ul>
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin tin đăng</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Ngày đăng:</strong>{" "}
                  {new Date(listing.createdAt).toLocaleString("vi-VN")}
                </p>
                {listing.publishedAt && (
                  <p>
                    <strong>Ngày phê duyệt:</strong>{" "}
                    {new Date(listing.publishedAt).toLocaleString("vi-VN")}
                  </p>
                )}
                <p>
                  <strong>Cập nhật lần cuối:</strong>{" "}
                  {new Date(listing.updatedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;
