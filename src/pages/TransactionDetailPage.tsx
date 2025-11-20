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
  Clock,
} from "lucide-react";
import ImagePreviewModal from "../components/ImagePreviewModal";
import QRPaymentModal from "../components/QRPaymentModal";
import { generateRemainingPaymentQR } from "../config/depositPaymentAPI";
import {
  getContractInfo,
  getContractTimeline,
  type TimelineStepData,
  type TimelineStep,
} from "../config/contractAPI";
import Swal from "sweetalert2";

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
    staff?: {
      id: string;
      name: string;
    };
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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<{
    qrCode: string;
    paymentUrl: string;
    amount: number;
    title: string;
    description: string;
    orderId?: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Contract states - chỉ cần timeline
  const [timeline, setTimeline] = useState<TimelineStepData[]>([]);

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

  useEffect(() => {
    if (transaction?.appointmentId) {
      loadContractData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction?.appointmentId, transaction?.status, transaction?.amount]);

  const openImagePreview = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const loadContractData = async () => {
    if (!transaction?.appointmentId) {
      console.log("No appointmentId, skipping contract load");
      return;
    }

    // Kiểm tra xem giao dịch đã thanh toán 100% chưa
    const { deposit, total, remaining } = transaction.amount || {};

    // Kiểm tra nếu amount không tồn tại
    if (
      deposit === undefined ||
      total === undefined ||
      remaining === undefined
    ) {
      console.log("Amount data not available", { deposit, total, remaining });
      return;
    }

    // Thanh toán 100% nghĩa là:
    // - remaining === 0 (không còn tiền cần thanh toán)
    // - HOẶC deposit === total (đã thanh toán đủ bằng tổng)
    // - HOẶC deposit + remaining === total (tổng đã thanh toán bằng tổng)
    // - VÀ status phải là COMPLETED
    const isFullPayment =
      transaction.status === "COMPLETED" &&
      (remaining === 0 || deposit === total || deposit + remaining === total);

    console.log("loadContractData - Checking conditions:", {
      appointmentId: transaction.appointmentId,
      status: transaction.status,
      deposit,
      total,
      remaining,
      isFullPayment,
      condition1: remaining === 0,
      condition2: deposit === total,
      condition3: deposit + remaining === total,
    });

    // Chỉ load timeline nếu đã thanh toán 100% và status là COMPLETED
    if (!isFullPayment) {
      console.log("Not full payment or not completed, skipping timeline load");
      setTimeline([]); // Clear timeline nếu không đủ điều kiện
      return;
    }

    console.log("Loading contract data - conditions met");

    try {
      // Load contract info để lấy contractId
      console.log(
        "Calling getContractInfo for appointmentId:",
        transaction.appointmentId
      );
      const infoResponse = await getContractInfo(transaction.appointmentId);
      console.log("getContractInfo response:", infoResponse);

      // Try to extract contractId from response
      const responseData = infoResponse as {
        contractId?: string;
        _id?: string;
        contractInfo?: unknown;
      };
      console.log("Extracted responseData:", responseData);

      const id = responseData.contractId || responseData._id;

      if (!id) {
        console.log(
          "No contractId found in response, contract may not exist yet"
        );
        setTimeline([]);
        return;
      }

      console.log("contractId found:", id);

      // Load timeline if contractId exists
      try {
        console.log("Calling getContractTimeline for contractId:", id);
        const timelineResponse = await getContractTimeline(id);
        console.log("getContractTimeline response:", timelineResponse);

        // Lấy timeline từ response (có thể là timeline hoặc data)
        const timelineData =
          timelineResponse.timeline || timelineResponse.data || [];

        console.log("Timeline data extracted:", timelineData);
        console.log("Timeline length:", timelineData.length);

        setTimeline(timelineData);
        console.log("Timeline set successfully:", timelineData);
      } catch (err) {
        console.error("Error loading timeline:", err);
        setTimeline([]);
      }
    } catch (error: unknown) {
      // Contract might not exist yet - this is OK
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      console.error("Error loading contract:", error);
      console.error("Error status:", axiosError.response?.status);
      console.error("Error message:", axiosError.response?.data?.message);

      setTimeline([]);

      if (axiosError.response?.status !== 404) {
        console.error("Error loading contract (non-404):", error);
      }
    }
  };

  const handleRemainingPayment = async () => {
    if (!transaction || !transaction.depositRequest?.id) return;

    setIsProcessingPayment(true);

    try {
      const response = await generateRemainingPaymentQR({
        listingId: transaction.listing.id,
        depositRequestId: transaction.depositRequest.id,
      });

      if (response.success && response.qrCode) {
        setQrData({
          qrCode: response.qrCode,
          paymentUrl: response.paymentUrl,
          amount: response.remainingAmount,
          title: "Thanh toán số tiền còn lại",
          description: `Thanh toán ${response.remainingAmount.toLocaleString(
            "vi-VN"
          )} VNĐ cho giao dịch mua xe`,
          orderId: response.orderId,
        });
        setQrModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: response.message || "Không thể tạo QR code thanh toán",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error: unknown) {
      console.error("Error generating remaining payment QR:", error);
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          axiosError.response?.data?.message ||
          "Không thể tạo QR code thanh toán",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsProcessingPayment(false);
    }
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
                {(() => {
                  const { deposit, total, remaining } = transaction.amount;
                  const hasDepositRequest = !!transaction.depositRequest;

                  const tenPercentOfTotal = Math.round(total * 0.1);
                  const ninetyPercentOfTotal = Math.round(total * 0.9);
                  const isDepositTenPercent =
                    Math.abs(deposit - tenPercentOfTotal) <= 1000;
                  const isRemainingNinetyPercent =
                    Math.abs(remaining - ninetyPercentOfTotal) <= 1000;

                  const isFullPayment =
                    !hasDepositRequest ||
                    deposit === 0 ||
                    remaining === 0 ||
                    deposit === total ||
                    (isDepositTenPercent &&
                      isRemainingNinetyPercent &&
                      transaction.status === "COMPLETED");

                  if (isFullPayment) {
                    return (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                          <p className="text-xs text-gray-500 mb-1">
                            Số tiền đã thanh toán
                          </p>
                          <p className="text-2xl font-bold text-green-700">
                            {total.toLocaleString("vi-VN")} VNĐ
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Thanh toán toàn bộ
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Deposit case
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-gray-500 mb-1">
                            Đã thanh toán (Đặt cọc)
                            {total > 0 && (
                              <span className="ml-1 text-blue-600">
                                ({Math.round((deposit / total) * 100)}%)
                              </span>
                            )}
                          </p>
                          <p className="text-lg font-semibold text-blue-700">
                            {deposit.toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <p className="text-xs text-gray-500 mb-1">
                            Còn lại cần thanh toán
                          </p>
                          <p className="text-lg font-semibold text-orange-700">
                            {remaining.toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">
                          Tổng giá trị giao dịch
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {total.toLocaleString("vi-VN")} VNĐ
                        </p>
                      </div>
                      {/* Button thanh toán số tiền còn lại - chỉ hiển thị cho buyer */}
                      {isBuyer &&
                        transaction.status === "PENDING" &&
                        remaining > 0 &&
                        transaction.depositRequest?.id && (
                          <div className="mt-4">
                            <button
                              onClick={handleRemainingPayment}
                              disabled={isProcessingPayment}
                              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                                isProcessingPayment
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {isProcessingPayment
                                ? "Đang xử lý..."
                                : "Thanh toán số tiền còn lại"}
                            </button>
                          </div>
                        )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Contract Photos for COMPLETED and CANCELLED transactions */}
          {(transaction.status === "COMPLETED" ||
            transaction.status === "CANCELLED") &&
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
                          photo.url.startsWith("/")
                            ? photo.url
                            : "/" + photo.url
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
                    {new Date(transaction.contract.completedAt).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                )}
              </div>
            )}

          {/* Nhân viên xử lý cho COMPLETED và CANCELLED */}
          {(transaction.status === "COMPLETED" ||
            transaction.status === "CANCELLED") &&
            transaction.contract &&
            transaction.contract.staff && (
              <div className="border-t mt-6 pt-6">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Nhân viên xử lý:</span>{" "}
                  <span className="font-semibold text-purple-600">
                    {transaction.contract.staff.name}
                  </span>
                </p>
              </div>
            )}

          {/* Timeline Section - Chỉ hiển thị cho giao dịch đã thanh toán 100% */}
          {(() => {
            // Kiểm tra xem giao dịch đã thanh toán 100% chưa
            const { deposit, total, remaining } = transaction.amount || {};

            // Kiểm tra nếu amount không tồn tại
            if (
              deposit === undefined ||
              total === undefined ||
              remaining === undefined
            ) {
              return null;
            }

            // Thanh toán 100% nghĩa là:
            // - remaining === 0 (không còn tiền cần thanh toán)
            // - HOẶC deposit === total (đã thanh toán đủ bằng tổng)
            // - HOẶC deposit + remaining === total (tổng đã thanh toán bằng tổng)
            // - VÀ status phải là COMPLETED
            const isFullPayment =
              transaction.status === "COMPLETED" &&
              (remaining === 0 ||
                deposit === total ||
                deposit + remaining === total);

            // Chỉ hiển thị timeline nếu đã thanh toán 100% và có timeline data
            const shouldShowTimeline = isFullPayment && timeline.length > 0;

            console.log("shouldShowTimeline check:", {
              deposit,
              total,
              remaining,
              status: transaction.status,
              isFullPayment,
              timelineLength: timeline.length,
              shouldShowTimeline,
            });

            if (!shouldShowTimeline) {
              console.log("Timeline not shown - conditions not met");
              return null;
            }

            return (
              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Timeline hợp đồng
                </h3>
                <div className="space-y-4">
                  {(() => {
                    // Lấy tất cả steps từ timeline backend, nhưng giữ thứ tự cố định
                    const allSteps: TimelineStep[] = [
                      "SIGN_CONTRACT",
                      "NOTARIZATION",
                      "SUBMIT_REGISTRATION",
                      "WAITING_FOR_NEW_PAPERS",
                      "TRANSFER_OWNERSHIP",
                      "HANDOVER_PAPERS_AND_CAR",
                      "COMPLETED",
                    ];

                    // Lọc chỉ hiển thị các step có trong timeline từ backend
                    const stepsToShow = allSteps.filter((step) =>
                      timeline.some((t) => t.step === step)
                    );

                    return stepsToShow.map((step, index) => {
                      const stepData = timeline.find((t) => t.step === step) as
                        | TimelineStepData
                        | undefined;
                      const status = stepData?.status || "PENDING";
                      const isLast = index === stepsToShow.length - 1;

                      const stepLabels: Record<string, string> = {
                        SIGN_CONTRACT: "Ký hợp đồng",
                        NOTARIZATION: "Công chứng",
                        SUBMIT_REGISTRATION: "Nộp đăng ký",
                        WAITING_FOR_NEW_PAPERS: "Chờ giấy tờ mới",
                        TRANSFER_OWNERSHIP: "Chuyển quyền sở hữu",
                        HANDOVER_PAPERS_AND_CAR: "Bàn giao giấy tờ và xe",
                        COMPLETED: "Hoàn tất",
                      };

                      const statusLabels: Record<string, string> = {
                        PENDING: "Chờ xử lý",
                        IN_PROGRESS: "Đang thực hiện",
                        DONE: "Hoàn thành",
                        BLOCKED: "Bị chặn",
                      };

                      const statusColors: Record<string, string> = {
                        PENDING: "bg-gray-100 text-gray-700 border-gray-300",
                        IN_PROGRESS:
                          "bg-blue-100 text-blue-700 border-blue-300",
                        DONE: "bg-green-100 text-green-700 border-green-300",
                        BLOCKED: "bg-red-100 text-red-700 border-red-300",
                      };

                      return (
                        <div key={step} className="flex gap-4">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                status === "DONE"
                                  ? "bg-green-500 border-green-500 text-white"
                                  : status === "IN_PROGRESS"
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : status === "BLOCKED"
                                  ? "bg-red-500 border-red-500 text-white"
                                  : "bg-gray-200 border-gray-300 text-gray-500"
                              }`}
                            >
                              {status === "DONE" ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : status === "BLOCKED" ? (
                                <XCircle className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 h-full min-h-[60px] ${
                                  status === "DONE"
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                            )}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 pb-6">
                            <div className="mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {stepLabels[step]}
                              </h4>
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${statusColors[status]}`}
                              >
                                {statusLabels[status]}
                              </span>
                            </div>
                            {stepData?.note && (
                              <p className="text-gray-600 text-sm mb-2">
                                {stepData.note}
                              </p>
                            )}
                            {stepData?.dueDate && (
                              <p className="text-gray-500 text-xs">
                                Hạn:{" "}
                                {new Date(stepData.dueDate).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </p>
                            )}
                            {stepData?.updatedAt && (
                              <p className="text-gray-500 text-xs">
                                Cập nhật:{" "}
                                {new Date(stepData.updatedAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </p>
                            )}
                            {stepData?.attachments &&
                              stepData.attachments.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600 mb-1">
                                    Đính kèm:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {stepData.attachments.map((att, idx) => (
                                      <a
                                        key={idx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                      >
                                        <ImageIcon className="w-3 h-3" />
                                        {att.description || `File ${idx + 1}`}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Transaction Dates */}
          <div className="border-t mt-6 pt-6">
            <h3 className="font-semibold mb-3">Lịch sử giao dịch</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Tạo:{" "}
                  {new Date(transaction.dates.createdAt).toLocaleString(
                    "vi-VN"
                  )}
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

      {/* QR Payment Modal */}
      {qrData && (
        <QRPaymentModal
          isOpen={qrModalOpen}
          onClose={() => {
            setQrModalOpen(false);
            setQrData(null);
          }}
          qrCode={qrData.qrCode}
          paymentUrl={qrData.paymentUrl}
          amount={qrData.amount}
          title={qrData.title}
          description={qrData.description}
          orderId={qrData.orderId}
        />
      )}
    </div>
  );
}
