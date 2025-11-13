import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../config/api";
import {
  Calendar,
  DollarSign,
  User,
  Store,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ImagePreviewModal from "../components/ImagePreviewModal";

interface Transaction {
  id: string;
  type: "seller" | "buyer";
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REJECTED";
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    priceListed: number;
    images: Array<{ url: string }>;
  };
  depositRequest?: {
    id: string;
    depositAmount: number;
    status: string;
  };
  counterparty: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  dates: {
    createdAt: string;
    scheduledDate: string;
    completedAt?: string;
    cancelledAt?: string;
  };
  amount: {
    deposit: number;
    total: number;
    remaining: number;
  };
  appointmentId: string;
  contract?: {
    id: string;
    status: string;
    contractNumber: string;
    photos: Array<{
      url: string;
      publicId: string;
      uploadedAt: string;
    }>;
    signedAt?: string;
    completedAt?: string;
  };
}

export default function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadTransaction = async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const response = await api.get("/transactions/user/history", {
        params: {
          page: 1,
          limit: 100,
        },
      });
      const transactions = response.data?.data || [];
      const foundTransaction = transactions.find(
        (txn: Transaction) => txn.id === transactionId
      );
      if (foundTransaction) {
        setTransaction(foundTransaction);
      } else {
        console.error("Transaction not found");
        setTransaction(null);
      }
    } catch (error) {
      console.error("Error loading transaction:", error);
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const openImagePreview = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy giao dịch</h2>
          <button
            onClick={() => navigate("/account")}
            className="text-blue-600 hover:underline"
          >
            Quay lại trang cá nhân
          </button>
        </div>
      </div>
    );
  }

  const isBuyer = transaction.type === "buyer";
  const vehicleInfo = `${transaction.listing.make} ${transaction.listing.model} ${transaction.listing.year}`;

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REJECTED: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    PENDING: "Đang xử lý",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
    REJECTED: "Đã từ chối",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:underline mb-4 flex items-center gap-2"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold">Chi tiết giao dịch</h1>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-block px-4 py-2 rounded-full font-semibold ${
              statusColors[transaction.status]
            }`}
          >
            {statusLabels[transaction.status]}
          </span>
        </div>

        {/* Main Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Vehicle Info */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold text-lg mb-3">Thông tin xe</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Xe</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vehicleInfo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Giá niêm yết</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transaction.listing.priceListed.toLocaleString("vi-VN")} VNĐ
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Buyer/Seller Info */}
            {isBuyer ? (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Người bán
                </h3>
                <p className="text-gray-700 font-medium">
                  {transaction.counterparty.name}
                </p>
                <p className="text-gray-600 text-sm">
                  {transaction.counterparty.email}
                </p>
                <p className="text-gray-600 text-sm">
                  {transaction.counterparty.phone}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-600" />
                  Người mua
                </h3>
                <p className="text-gray-700 font-medium">
                  {transaction.counterparty.name}
                </p>
                <p className="text-gray-600 text-sm">
                  {transaction.counterparty.email}
                </p>
                <p className="text-gray-600 text-sm">
                  {transaction.counterparty.phone}
                </p>
              </div>
            )}

            {/* Your Role */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Vai trò của bạn</h3>
              <div
                className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                  isBuyer
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {isBuyer ? "🛒 Người mua" : "💰 Người bán"}
              </div>
            </div>
          </div>

          <div className="border-t mt-6 pt-6 space-y-4">
            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="font-semibold">Thời gian hẹn</p>
                <p className="text-gray-700">
                  {new Date(transaction.dates.scheduledDate).toLocaleString(
                    "vi-VN"
                  )}
                </p>
              </div>
            </div>

            {/* Amount Details */}
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="font-semibold mb-3">Thông tin thanh toán</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Đặt cọc</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {transaction.amount.deposit.toLocaleString("vi-VN")} VNĐ
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Tổng giá trị</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {transaction.amount.total.toLocaleString("vi-VN")} VNĐ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Photos for COMPLETED transactions */}
          {transaction.status === "COMPLETED" &&
            transaction.contract &&
            transaction.contract.photos &&
            transaction.contract.photos.length > 0 && (
              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Ảnh hợp đồng đã ký
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Số hợp đồng: {transaction.contract.contractNumber}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Tổng số ảnh: {transaction.contract.photos.length}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {transaction.contract.photos.map((photo, index) => {
                    const imageUrl = photo.url.startsWith("http")
                      ? photo.url
                      : `${api.defaults.baseURL || ""}${
                          photo.url.startsWith("/") ? photo.url : "/" + photo.url
                        }`;
                    return (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => {
                          const photoUrls = transaction.contract!.photos.map(
                            (p) => p.url
                          );
                          openImagePreview(photoUrls, index);
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Contract photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                          onError={(e) => {
                            console.error(
                              "Error loading contract image:",
                              photo.url
                            );
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/300x200?text=Error";
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                          <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {transaction.contract.signedAt && (
                  <p className="text-xs text-gray-500 mt-4">
                    Đã ký:{" "}
                    {new Date(transaction.contract.signedAt).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                )}
                {transaction.contract.completedAt && (
                  <p className="text-xs text-gray-500">
                    Hoàn thành:{" "}
                    {new Date(
                      transaction.contract.completedAt
                    ).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            )}

          {/* Transaction Dates */}
          <div className="border-t mt-6 pt-6">
            <h3 className="font-semibold mb-3">Lịch sử giao dịch</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Tạo:{" "}
                  {new Date(transaction.dates.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
              {transaction.dates.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">
                    Hoàn thành:{" "}
                    {new Date(transaction.dates.completedAt).toLocaleString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              )}
              {transaction.dates.cancelledAt && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">
                    Hủy:{" "}
                    {new Date(transaction.dates.cancelledAt).toLocaleString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        currentIndex={previewIndex}
        onNavigate={setPreviewIndex}
      />
    </div>
  );
}

