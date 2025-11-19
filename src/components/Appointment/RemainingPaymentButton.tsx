import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { payRemaining } from "../../config/appointmentAPI";
import RemainingPaymentModal from "./RemainingPaymentModal";
import Swal from "sweetalert2";

interface RemainingPaymentButtonProps {
  appointmentId: string;
  onPaymentSuccess?: () => void;
}

const RemainingPaymentButton: React.FC<RemainingPaymentButtonProps> = ({
  appointmentId,
  onPaymentSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const handlePayRemaining = async () => {
    if (!appointmentId || isLoading) return;

    setIsLoading(true);
    try {
      const response = await payRemaining(appointmentId);
      setPaymentUrl(response.paymentUrl || "");
      setQrCodeUrl(response.qrCodeUrl || "");
      setAmount(response.amount || 0);
      if (!response.paymentUrl && !response.qrCodeUrl) {
        throw new Error("Thiếu thông tin thanh toán");
      }
      setIsModalOpen(true);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tạo mã QR thanh toán. Vui lòng thử lại.",
        confirmButtonColor: "#10b981",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  return (
    <>
      <button
        onClick={handlePayRemaining}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Thanh toán phần còn lại
          </>
        )}
      </button>

      <RemainingPaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        paymentUrl={paymentUrl}
        qrCodeUrl={qrCodeUrl}
        amount={amount}
      />
    </>
  );
};

export default RemainingPaymentButton;
