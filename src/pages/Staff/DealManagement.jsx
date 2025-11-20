import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
  Eye,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import StaffLayout from "../../components/Layout/StaffLayout";
import api from "../../config/api";
import Swal from "sweetalert2";

const statusConfig = {
  INITIATED: { label: "Khởi tạo", color: "bg-gray-100 text-gray-700" },
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  DEPOSIT_PAID: { label: "Đã đặt cọc", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang xử lý", color: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "Hoàn tất", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
  DEFAULT: { label: "Không xác định", color: "bg-gray-100 text-gray-700" },
  DONE: { label: "Hoàn tất", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Đang xử lý", color: "bg-indigo-100 text-indigo-700" },
};



const paperworkStepOrder = [
  {
    key: "SIGN_CONTRACT",
    label: "Ký hợp đồng mua bán",
    milestoneKey: "signContract",
  },
  {
    key: "NOTARIZATION",
    label: "Công chứng hợp đồng",
    milestoneKey: "notarization",
  },
  {
    key: "SUBMIT_REGISTRATION",
    label: "Nộp hồ sơ sang tên",
    milestoneKey: null,
  },
  {
    key: "WAITING_FOR_NEW_PAPERS",
    label: "Chờ giấy tờ mới",
    milestoneKey: null,
  },
  {
    key: "HANDOVER_PAPERS_AND_CAR",
    label: "Bàn giao xe",
    milestoneKey: "handover",
  },
];

const paymentTimelineSteps = [
  { key: "dealCreatedAt", label: "Khởi tạo giao dịch" },
  { key: "depositPaidAt", label: "Đặt cọc" },
  { key: "remainingPaidAt", label: "Thanh toán phần còn lại" },
  { key: "fullPaymentPaidAt", label: "Đã thanh toán đủ" },
  { key: "paperworkStartedAt", label: "Bắt đầu thủ tục giấy tờ" },
  { key: "paperworkCompletedAt", label: "Hoàn tất giấy tờ" },
  { key: "handoverCompletedAt", label: "Đã bàn giao xe" },
  { key: "payoutCompletedAt", label: "Đã thanh toán cho người bán" },
];

const formatCurrency = (value) => {
  if (typeof value !== "number") return "—";
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeDeal = (deal) => {
  const listing = deal?.listingId || {};
  const buyer = deal?.buyerId || {};
  const seller = deal?.sellerId || {};

  return {
    id: deal?._id || deal?.dealId,
    dealId: deal?.dealId || deal?._id,
    status: deal?.status || "PENDING",
    source: deal?.source || "NORMAL_DEPOSIT",
    dealType: deal?.dealType || "STANDARD",
    listing: {
      id: listing?._id || listing?.id,
      title:
        listing?.title ||
        [listing?.make, listing?.model, listing?.year].filter(Boolean).join(" ") ||
        "Xe chưa rõ",
      make: listing?.make,
      model: listing?.model,
      year: listing?.year,
      priceListed: listing?.priceListed,
      thumbnail:
        listing?.photos?.[0] ||
        "https://via.placeholder.com/120x80.png?text=No+Image",
    },
    buyer: {
      id: buyer?._id || buyer?.id,
      name: buyer?.fullName || buyer?.name || "N/A",
      email: buyer?.email,
      phone: buyer?.phone,
    },
    seller: {
      id: seller?._id || seller?.id,
      name: seller?.fullName || seller?.name || "N/A",
      email: seller?.email,
      phone: seller?.phone,
    },
    paymentPlan: deal?.paymentPlan || {},
    timeline: deal?.timeline || {},
    payments: Array.isArray(deal?.payments) ? deal.payments : [],
    paperworkProgress: Array.isArray(deal?.paperworkProgress)
      ? deal.paperworkProgress
      : [],
    appointmentMilestones: deal?.appointmentMilestones || {},
    contract: {
      id: deal?.contractId,
      status: deal?.contractStatus,
      pdfUrl: deal?.contractPdfUrl,
    },
    notes: deal?.notes,
    cancellation: deal?.cancellation,
  };
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.DEFAULT;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

const PaymentTimeline = ({ timeline }) => (
  <div className="space-y-3">
    {paymentTimelineSteps.map((step) => {
      const completed = Boolean(timeline?.[step.key]);
      return (
        <div
          key={step.key}
          className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-2">
            {completed ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-700">{step.label}</span>
          </div>
          <span className="text-xs text-gray-500">
            {completed ? formatDateTime(timeline?.[step.key]) : "Chưa thực hiện"}
          </span>
        </div>
      );
    })}
  </div>
);

const PaymentsTable = ({ payments }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left font-semibold text-gray-600">
            Loại
          </th>
          <th className="px-4 py-2 text-left font-semibold text-gray-600">
            Số tiền
          </th>
          <th className="px-4 py-2 text-left font-semibold text-gray-600">
            Trạng thái
          </th>
          <th className="px-4 py-2 text-left font-semibold text-gray-600">
            Thời gian
          </th>
          <th className="px-4 py-2 text-left font-semibold text-gray-600">
            Order ID
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {payments.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
              Chưa có ghi nhận thanh toán
            </td>
          </tr>
        ) : (
          payments.map((payment, index) => (
            <tr key={`${payment.orderId || index}`}>
              <td className="px-4 py-3 capitalize">
                {payment.type?.toLowerCase() || "—"}
              </td>
              <td className="px-4 py-3 font-semibold">
                {formatCurrency(payment.amount)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={payment.status?.toUpperCase()} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatDateTime(payment.recordedAt)}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {payment.orderId || "—"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const buildPaperworkMap = (items = []) => {
  const map = {};
  items.forEach((item) => {
    if (item.step) {
      map[item.step] = item;
    }
  });
  return map;
};

const DealDetailModal = ({
  deal,
  isOpen,
  onClose,
  onRefresh,
  onInviteNotary,
  openNotaryModal,
  openHandoverModal,
}) => {
  const [attachmentError, setAttachmentError] = useState(null);
  const [stepLoadingMap, setStepLoadingMap] = useState({});
  const [dealState, setDealState] = useState(deal);

  useEffect(() => {
    setDealState(deal);
  }, [deal]);

  if (!dealState || !isOpen) return null;

  const paperworkMap = buildPaperworkMap(dealState.paperworkProgress);
  const milestoneMap = dealState.appointmentMilestones || {};

  const resolveAttachmentUrl = (attachment) => {
    if (!attachment) return null;
    const raw =
      attachment.url ||
      attachment.link ||
      attachment.path ||
      attachment.fileUrl ||
      (typeof attachment === "string" ? attachment : null);

    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return `${api.defaults?.baseURL || ""}${
      raw.startsWith("/") ? raw : `/${raw}`
    }`;
  };

  const handleOpenAttachment = (attachment) => {
    const url = resolveAttachmentUrl(attachment);
    if (!url) {
      setAttachmentError("Không thể mở tệp đính kèm. Thiếu đường dẫn hợp lệ.");
      setTimeout(() => setAttachmentError(null), 2500);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdatePaperworkStep = async (stepKey) => {
    const result = await Swal.fire({
      title: "Cập nhật tiến độ",
      input: "textarea",
      inputLabel: "Ghi chú (tuỳ chọn)",
      inputPlaceholder: "Nhập ghi chú nếu cần...",
      inputAttributes: { rows: 3 },
      showCancelButton: true,
      confirmButtonText: "Cập nhật",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    const note = result.value?.trim();
    setStepLoadingMap((prev) => ({ ...prev, [stepKey]: true }));

    try {
      const response = await api.patch(
        `/deals/${dealState.dealId}/paperwork/${stepKey}`,
        note ? { note } : {}
      );

      const updated = response.data?.data;
      if (updated?.paperworkProgress) {
        setDealState((prev) =>
          prev
            ? {
                ...prev,
                ...updated,
                paperworkProgress: updated.paperworkProgress,
              }
            : prev
        );
      }

      Swal.fire({
        icon: "success",
        title: "Đã cập nhật trạng thái",
        timer: 1500,
        showConfirmButton: false,
      });
      onRefresh?.();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Không thể cập nhật",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Vui lòng thử lại sau.",
      });
    } finally {
      setStepLoadingMap((prev) => ({ ...prev, [stepKey]: false }));
    }
  };

  const renderAppointmentInfo = (milestoneKey) => {
    const milestone = milestoneMap[milestoneKey];
    if (!milestone) return null;
    return (
      <div className="mt-2 text-xs text-gray-600 space-y-1">
        {/* <p>
          Trạng thái:{" "}
          <span className="font-medium">
            {milestone.status || milestone.state || "—"}
          </span>
        </p> */}
        {milestone.scheduledAt && (
          <p>Thời gian: {formatDateTime(milestone.scheduledAt)}</p>
        )}
        
      </div>
    );
  };

  const completedSteps = paperworkStepOrder.filter(
    (step) => paperworkMap[step.key]?.status === "DONE"
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500">
              Chi tiết giao dịch
            </p>
            
            <p className="text-sm text-gray-500 mt-1">
              Ngày tạo: {formatDateTime(dealState.timeline?.dealCreatedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col lg:flex-row gap-6">
            <div className="flex gap-4 flex-1">
              <div>
                <p className="text-sm text-gray-500">Thông tin xe</p>
                <p className="text-lg font-semibold">{dealState.listing.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Giá niêm yết: {formatCurrency(dealState.listing.priceListed)}
                </p>
                
              </div>
            </div>
            <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
              <p className="text-sm text-gray-500">Tiến độ giấy tờ</p>
              <p className="text-lg font-semibold mt-1">
                {completedSteps}/{paperworkStepOrder.length} bước hoàn tất
              </p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${
                      (completedSteps / paperworkStepOrder.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-gray-900">
                Người mua
              </p>
              <p>{dealState.buyer.name}</p>
              <p className="text-sm text-gray-600">{dealState.buyer.email}</p>
              <p className="text-sm text-gray-600">{dealState.buyer.phone}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-gray-900">
                Người bán
              </p>
              <p>{dealState.seller.name}</p>
              <p className="text-sm text-gray-600">{dealState.seller.email}</p>
              <p className="text-sm text-gray-600">{dealState.seller.phone}</p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Timeline giấy tờ
                </h3>
                <p className="text-sm text-gray-500">
                  Theo dõi từng bước xử lý hồ sơ
                </p>
              </div>
              {milestoneMap?.notarization?.status === "NOT_SCHEDULED" && (
                <button
                  onClick={() => openNotaryModal(dealState)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Mời công chứng
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {paperworkStepOrder.map((step) => {
                const data = paperworkMap[step.key] || {};
                const status = (data.status || "PENDING").toUpperCase();
                const milestoneInfo = step.milestoneKey
                  ? renderAppointmentInfo(step.milestoneKey)
                  : null;
                const canUpdate = [
                  "SUBMIT_REGISTRATION",
                  "WAITING_FOR_NEW_PAPERS",
                ].includes(step.key);
                const isHandoverStep =
                  step.key === "HANDOVER_PAPERS_AND_CAR";
                return (
                  <div
                    key={step.key}
                    className="border border-gray-100 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status === "DONE" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">
                          {step.label}
                        </span>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    {data.note && (
                      <p className="text-sm text-gray-600 mt-1">
                        Ghi chú: {data.note}
                      </p>
                    )}
                    {data.attachments?.length ? (
                      <div className="text-xs text-gray-600 mt-2 space-y-1">
                        <p className="text-gray-500">Đính kèm:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.attachments.map((attachment, idx) => {
                            const label =
                              attachment?.label ||
                              attachment?.name ||
                              `Tệp đính kèm ${idx + 1}`;
                            const url = resolveAttachmentUrl(attachment);
                            const canOpen = Boolean(url);
                            return (
                              <button
                                key={`${url || idx}`}
                                type="button"
                                onClick={() =>
                                  canOpen && handleOpenAttachment(attachment)
                                }
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-blue-600 border-blue-100 hover:bg-blue-50 transition-colors ${
                                  canOpen ? "" : "opacity-60 cursor-not-allowed"
                                }`}
                                disabled={!canOpen}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span className="underline">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {milestoneInfo}
                    {canUpdate && status !== "DONE" && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleUpdatePaperworkStep(step.key)}
                          disabled={Boolean(stepLoadingMap[step.key])}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-60"
                        >
                          {stepLoadingMap[step.key] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Đang cập nhật...
                            </>
                          ) : (
                            "Cập nhật"
                          )}
                        </button>
                      </div>
                    )}
                    {isHandoverStep && status !== "DONE" && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => openHandoverModal(dealState)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Calendar className="w-4 h-4" />
                          Gửi lịch bàn giao
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {attachmentError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {attachmentError}
            </div>
          )}

          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Lịch sử thanh toán
              </h3>
              <PaymentsTable payments={deal.payments} />
            </div>
            <div className="border border-gray-100 rounded-xl p-4 space-y-2">
              <h3 className="text-base font-semibold text-gray-900">
                Hợp đồng & ghi chú
              </h3>
              <div className="text-sm text-gray-700">
                <p>
                  <span className="font-medium">Hợp đồng:</span>{" "}
                  {deal.contract?.id || "Chưa tạo"}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span>{" "}
                  {deal.contract?.status || "—"}
                </p>
                {deal.contract?.pdfUrl && (
                  <a
                    href={deal.contract.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline text-sm mt-1"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Xem file hợp đồng
                  </a>
                )}
              </div>
              {deal.notes && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Ghi chú:</span> {deal.notes}
                </div>
              )}
              {deal.cancellation && (
                <div className="text-sm text-red-600 flex items-start gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Đã hủy</p>
                    <p>Lý do: {deal.cancellation.reason || "Không rõ"}</p>
                    {deal.cancellation.penalty && (
                      <p>Phạt: {formatCurrency(deal.cancellation.penalty)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div> */}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                onClose();
                onRefresh?.();
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              onClick={() =>
                window.open(`/transactions/${dealState.dealId}`, "_blank")
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Xem giao dịch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotarizationRequestModal = ({
  deal,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [slots, setSlots] = useState([""]);
  const [location, setLocation] = useState("Văn phòng công chứng");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSlots([""]);
      setLocation("Văn phòng công chứng");
      setNotes("");
      setError("");
    }
  }, [isOpen, deal]);

  if (!deal || !isOpen) return null;

  const handleSlotChange = (index, value) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addSlot = () => {
    if (slots.length >= 5) return;
    setSlots((prev) => [...prev, ""]);
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const validateSlots = (slotValues) => {
    if (slotValues.length === 0) {
      setError("Vui lòng cung cấp ít nhất 1 khung giờ.");
      return false;
    }
    const now = Date.now();

    for (const slot of slotValues) {
      const ts = new Date(slot).getTime();
      if (Number.isNaN(ts)) {
        setError("Các khung giờ phải hợp lệ.");
        return false;
      }
      if (ts <= now) {
        setError("Khung giờ phải lớn hơn thời gian hiện tại.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filteredSlots = slots
      .map((slot) => slot?.trim())
      .filter((slot) => slot.length > 0);

    if (!validateSlots(filteredSlots)) return;

    await onSubmit({
      dealId: deal.dealId,
      proposedSlots: filteredSlots.map((slot) =>
        new Date(slot).toISOString()
      ),
      location: location.trim() || "Văn phòng công chứng",
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">
              Mời công chứng
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              {deal.dealId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khung giờ đề xuất (tối đa 5)
            </label>
            <div className="space-y-3">
              {slots.map((slot, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="datetime-local"
                    value={slot}
                    onChange={(e) => handleSlotChange(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="px-2 py-2 text-red-500 hover:text-red-700"
                      disabled={isSubmitting}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {slots.length < 5 && (
              <button
                type="button"
                onClick={addSlot}
                className="mt-3 text-sm text-blue-600 hover:underline"
                disabled={isSubmitting}
              >
                + Thêm khung giờ
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa điểm công chứng
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Để trống sẽ mặc định “Văn phòng công chứng”.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
              placeholder="Ví dụ: Mang theo CCCD bản gốc, đầy đủ giấy tờ liên quan..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HandoverRequestModal = ({
  deal,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [slots, setSlots] = useState([""]);
  const [location, setLocation] = useState("Bãi giao xe EV Center");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSlots([""]);
      setLocation("Bãi giao xe EV Center");
      setNotes("");
      setError("");
    }
  }, [isOpen, deal]);

  if (!deal || !isOpen) return null;

  const handleSlotChange = (index, value) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addSlot = () => {
    if (slots.length >= 5) return;
    setSlots((prev) => [...prev, ""]);
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const validateSlots = (slotValues) => {
    if (slotValues.length === 0) {
      setError("Vui lòng cung cấp ít nhất 1 khung giờ.");
      return false;
    }
    const now = Date.now();

    for (const slot of slotValues) {
      const ts = new Date(slot).getTime();
      if (Number.isNaN(ts)) {
        setError("Các khung giờ phải hợp lệ.");
        return false;
      }
      if (ts <= now) {
        setError("Khung giờ phải lớn hơn thời gian hiện tại.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filteredSlots = slots
      .map((slot) => slot?.trim())
      .filter((slot) => slot.length > 0);

    if (!validateSlots(filteredSlots)) return;

    await onSubmit({
      dealId: deal.dealId,
      proposedSlots: filteredSlots.map((slot) =>
        new Date(slot).toISOString()
      ),
      location: location.trim() || "Bãi giao xe EV Center",
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">
              Gửi lịch bàn giao
            </p>
            
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khung giờ đề xuất (tối đa 5)
            </label>
            <div className="space-y-3">
              {slots.map((slot, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="datetime-local"
                    value={slot}
                    onChange={(e) => handleSlotChange(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="px-2 py-2 text-red-500 hover:text-red-700"
                      disabled={isSubmitting}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {slots.length < 5 && (
              <button
                type="button"
                onClick={addSlot}
                className="mt-3 text-sm text-blue-600 hover:underline"
                disabled={isSubmitting}
              >
                + Thêm khung giờ
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa điểm bàn giao
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
              placeholder="Ví dụ: Mang cavet, chìa khóa dự phòng..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DealManagement = () => {
  const [rawDeals, setRawDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [detailDeal, setDetailDeal] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notaryModalDeal, setNotaryModalDeal] = useState(null);
  const [isNotarySubmitting, setIsNotarySubmitting] = useState(false);
  const [handoverModalDeal, setHandoverModalDeal] = useState(null);
  const [isHandoverSubmitting, setIsHandoverSubmitting] = useState(false);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/deals/admin");
      const deals = Array.isArray(response.data?.data)
        ? response.data.data
        : response.data;
      setRawDeals(Array.isArray(deals) ? deals : []);
    } catch (err) {
      console.error("Failed to fetch deals:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách giao dịch."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const normalizedDeals = useMemo(
    () => rawDeals.map((deal) => normalizeDeal(deal)),
    [rawDeals]
  );

  const filteredDeals = useMemo(() => {
    return normalizedDeals.filter((deal) => {
      const matchStatus =
        statusFilter === "all" || deal.status === statusFilter;
      const keyword = searchKeyword.trim().toLowerCase();
      const matchKeyword =
        keyword.length === 0 ||
        deal.dealId?.toLowerCase().includes(keyword) ||
        deal.buyer.name.toLowerCase().includes(keyword) ||
        deal.seller.name.toLowerCase().includes(keyword) ||
        deal.listing.title.toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
  }, [normalizedDeals, statusFilter, searchKeyword]);

  useEffect(() => {
    if (!selectedDealId && filteredDeals.length > 0) {
      setSelectedDealId(filteredDeals[0].id);
    } else if (
      selectedDealId &&
      filteredDeals.findIndex((d) => d.id === selectedDealId) === -1
    ) {
      setSelectedDealId(filteredDeals[0]?.id || null);
    }
  }, [filteredDeals, selectedDealId]);

  const openDetailModal = (deal) => {
    setSelectedDealId(deal.id);
    setDetailDeal(deal);
    setIsDetailOpen(true);
  };

  const openNotaryModal = (deal) => {
    setNotaryModalDeal(deal);
  };

  const openHandoverModal = (deal) => {
    setHandoverModalDeal(deal);
  };

  const handleSubmitNotaryRequest = async ({
    dealId,
    proposedSlots,
    location,
    notes,
  }) => {
    try {
      setIsNotarySubmitting(true);
      await api.post(
        `/appointments/deals/${dealId}/notarization-request`,
        {
          proposedSlots,
          location,
          notes,
        }
      );
      Swal.fire({
        icon: "success",
        title: "Đã gửi yêu cầu công chứng",
        timer: 1800,
        showConfirmButton: false,
      });
      setNotaryModalDeal(null);
      fetchDeals();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Không thể gửi yêu cầu",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Vui lòng thử lại sau.",
      });
    } finally {
      setIsNotarySubmitting(false);
    }
  };

  const paperworkSummary = (deal) => {
    const map = buildPaperworkMap(deal.paperworkProgress);
    const done = paperworkStepOrder.filter(
      (step) => map[step.key]?.status === "DONE"
    ).length;
    return { done, total: paperworkStepOrder.length };
  };

  const handleSubmitHandoverRequest = async ({
    dealId,
    proposedSlots,
    location,
    notes,
  }) => {
    try {
      setIsHandoverSubmitting(true);
      const response = await api.post(
        `/appointments/deals/${dealId}/handover-request`,
        {
          proposedSlots,
          location,
          notes,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Đã gửi lịch bàn giao",
        text: "Đang chờ buyer/seller chọn khung giờ.",
        timer: 2000,
        showConfirmButton: false,
      });

      setHandoverModalDeal(null);

      const updatedAppointment =
        response.data?.appointment ||
        response.data?.data?.appointment ||
        response.data?.data;

      if (updatedAppointment && detailDeal?.appointmentMilestones?.handover) {
        setDetailDeal((prev) =>
          prev
            ? {
                ...prev,
                appointmentMilestones: {
                  ...prev.appointmentMilestones,
                  handover: {
                    ...prev.appointmentMilestones.handover,
                    status: updatedAppointment.status,
                    proposedSlots: updatedAppointment.proposedSlots,
                    location: updatedAppointment.location,
                  },
                },
              }
            : prev
        );
      }

      fetchDeals();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Không thể gửi yêu cầu",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Vui lòng thử lại sau.",
      });
    } finally {
      setIsHandoverSubmitting(false);
    }
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý giao dịch
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi tiến trình thanh toán và thủ tục giấy tờ của từng giao
              dịch.
            </p>
          </div>
          <button
            onClick={fetchDeals}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Tìm kiếm
            </label>
            <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Mã giao dịch, người mua, xe..."
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="w-full sm:w-52">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Lọc trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              {Object.keys(statusConfig).map((key) =>
                key === "DEFAULT" ? null : (
                  <option key={key} value={key}>
                    {statusConfig[key].label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600">Đang tải dữ liệu giao dịch...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Không thể tải dữ liệu</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Xe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer / Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá xe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiến độ giấy tờ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-gray-500"
                      >
                        Không có giao dịch phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedDealId === deal.id ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-3">
                            
                            <div>
                              <div className="font-semibold">
                                {deal.listing.title}
                              </div>
                            
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="font-medium">{deal.buyer.name}</div>
                          <div className="text-xs text-gray-500">
                            {deal.buyer.phone} · {deal.buyer.email}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Seller:{" "}
                            <span className="font-medium text-gray-800">
                              {deal.seller.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(deal.listing.priceListed)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cọc:{" "}
                            {formatCurrency(deal.paymentPlan?.depositAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={deal.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {(() => {
                            const summary = paperworkSummary(deal);
                            return (
                              <div>
                                <span className="font-semibold text-gray-900">
                                  {summary.done}/{summary.total}
                                </span>{" "}
                                bước
                                <div className="mt-1 w-32 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{
                                      width: `${
                                        (summary.done / summary.total) * 100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => openDetailModal(deal)}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <DealDetailModal
        deal={detailDeal}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={fetchDeals}
        onInviteNotary={handleSubmitNotaryRequest}
        openNotaryModal={openNotaryModal}
        openHandoverModal={openHandoverModal}
      />

      <NotarizationRequestModal
        deal={notaryModalDeal}
        isOpen={Boolean(notaryModalDeal)}
        onClose={() => setNotaryModalDeal(null)}
        onSubmit={handleSubmitNotaryRequest}
        isSubmitting={isNotarySubmitting}
      />

      <HandoverRequestModal
        deal={handoverModalDeal}
        isOpen={Boolean(handoverModalDeal)}
        onClose={() => setHandoverModalDeal(null)}
        onSubmit={handleSubmitHandoverRequest}
        isSubmitting={isHandoverSubmitting}
      />
    </StaffLayout>
  );
};

export default DealManagement;
