import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Car,
  DollarSign,
  MapPin,
  Edit,
  X,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import {
  createContract,
  getContractInfo,
  uploadContractPhotos,
  getContractTimeline,
  updateTimelineStep,
  generateContractPdf,
  getContractPdf,
  completeTransaction,
  cancelContract,
  type ContractInfo,
  type TimelineStepData,
  type TimelineStep,
  type TimelineStatus,
  type ContractType,
} from "../config/contractAPI";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

// Định nghĩa thứ tự timeline cố định
const TIMELINE_STEPS: TimelineStep[] = [
  "SIGN_CONTRACT",
  "NOTARIZATION",
  "TRANSFER_OWNERSHIP",
  "HANDOVER_PAPERS_AND_CAR",
  "COMPLETED",
];

const TIMELINE_STEP_LABELS: Record<TimelineStep, string> = {
  SIGN_CONTRACT: "Ký hợp đồng",
  NOTARIZATION: "Công chứng",
  TRANSFER_OWNERSHIP: "Chuyển quyền sở hữu",
  HANDOVER_PAPERS_AND_CAR: "Bàn giao giấy tờ và xe",
  COMPLETED: "Hoàn tất",
};

const STATUS_LABELS: Record<TimelineStatus, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
  BLOCKED: "Bị chặn",
};

const STATUS_COLORS: Record<TimelineStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700 border-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
  DONE: "bg-green-100 text-green-700 border-green-300",
  BLOCKED: "bg-red-100 text-red-700 border-red-300",
};

export default function ContractDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const userId = (user as { _id?: string; id?: string })?._id || (user as { _id?: string; id?: string })?.id;

  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [timeline, setTimeline] = useState<TimelineStepData[]>([]);
  const [contractId, setContractId] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUpdateTimelineModal, setShowUpdateTimelineModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [contractType, setContractType] = useState<ContractType>("DEPOSIT");
  const [contractTerms, setContractTerms] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [selectedStep, setSelectedStep] = useState<TimelineStep | null>(null);
  const [stepStatus, setStepStatus] = useState<TimelineStatus>("PENDING");
  const [stepNote, setStepNote] = useState("");
  const [stepDueDate, setStepDueDate] = useState("");
  const [stepAttachments, setStepAttachments] = useState<File[]>([]);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (appointmentId) {
      loadContractData();
    }
  }, [appointmentId]);

  const loadContractData = async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      // Load contract info
      const infoResponse = await getContractInfo(appointmentId);
      setContractInfo(infoResponse.contractInfo);

      // Try to extract contractId from response if available
      // Backend might return contractId in the response
      const responseData = infoResponse as any;
      if (responseData.contractId || responseData._id) {
        const id = responseData.contractId || responseData._id;
        setContractId(id);
        setContractStatus(responseData.status || "");
        
        // Load timeline if contractId exists
        try {
          const timelineResponse = await getContractTimeline(id);
          setTimeline(timelineResponse.timeline || []);
        } catch (err) {
          console.log("Timeline not available yet");
        }
      }
      // Note: If contractId is not in getContractInfo response,
      // we need to get it from createContract response or another endpoint
      // Timeline will be loaded after contract is created
    } catch (error: any) {
      console.error("Error loading contract:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải thông tin hợp đồng";
      
      if (error.response?.status === 404) {
        // Contract doesn't exist yet - this is OK, will show create button
        console.log("Contract not found - will show create button");
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMsg,
          confirmButtonText: "Đóng",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!appointmentId) return;
    setActionLoading("create");
    try {
      const response = await createContract(appointmentId, {
        contractType,
        contractTerms: contractTerms || undefined,
      });
      
      const newContractId = response.data._id;
      setContractId(newContractId);
      setContractStatus(response.data.status);
      
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã tạo hợp đồng thành công!",
        confirmButtonText: "Đóng",
      });
      
      setShowCreateModal(false);
      // Load timeline for the new contract
      try {
        const timelineResponse = await getContractTimeline(newContractId);
        setTimeline(timelineResponse.timeline || []);
      } catch (err) {
        console.log("Timeline not available yet");
      }
      // Reload data
      await loadContractData();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo hợp đồng";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUploadPhotos = async () => {
    if (!appointmentId || selectedPhotos.length === 0) return;
    setActionLoading("upload");
    try {
      const response = await uploadContractPhotos(appointmentId, selectedPhotos);
      
      setContractStatus(response.contractStatus);
      const newContractId = response.contractId;
      if (newContractId) {
        setContractId(newContractId);
        
        // Load timeline after upload
        try {
          const timelineResponse = await getContractTimeline(newContractId);
          setTimeline(timelineResponse.timeline || []);
        } catch (err) {
          console.log("Timeline not available yet");
        }
      }
      
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: `Đã upload ${response.uploadedPhotos.length} ảnh thành công!`,
        confirmButtonText: "Đóng",
      });
      
      setShowUploadModal(false);
      setSelectedPhotos([]);
      await loadContractData();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể upload ảnh";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTimeline = async () => {
    if (!contractId || !selectedStep) return;
    setActionLoading("update-timeline");
    try {
      const response = await updateTimelineStep(
        contractId,
        selectedStep,
        {
          status: stepStatus,
          note: stepNote || undefined,
          dueDate: stepDueDate || undefined,
        },
        stepAttachments.length > 0 ? stepAttachments : undefined
      );
      
      setTimeline(response.timeline);
      
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã cập nhật timeline thành công!",
        confirmButtonText: "Đóng",
      });
      
      setShowUpdateTimelineModal(false);
      resetTimelineForm();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật timeline";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGeneratePdf = async () => {
    if (!contractId) return;
    setActionLoading("generate-pdf");
    try {
      const response = await generateContractPdf(contractId);
      
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã tạo PDF hợp đồng thành công!",
        confirmButtonText: "Đóng",
      });
      
      // Reload to get updated PDF URL
      await loadContractData();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo PDF";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewPdf = async () => {
    if (!contractId) return;
    setActionLoading("view-pdf");
    try {
      const response = await getContractPdf(contractId, true);
      // If redirect=true, backend should redirect, otherwise open URL
      if (response.contractPdfUrl) {
        window.open(response.contractPdfUrl, "_blank");
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải PDF";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!appointmentId) return;
    
    const result = await Swal.fire({
      title: "Xác nhận hoàn tất",
      text: "Bạn có chắc chắn muốn hoàn tất giao dịch này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
    
    if (!result.isConfirmed) return;
    
    setActionLoading("complete");
    try {
      await completeTransaction(appointmentId);
      
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã hoàn tất giao dịch thành công!",
        confirmButtonText: "Đóng",
      });
      
      await loadContractData();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể hoàn tất giao dịch";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!appointmentId || !cancelReason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng nhập lý do hủy",
        confirmButtonText: "Đóng",
      });
      return;
    }
    
    setActionLoading("cancel");
    try {
      await cancelContract(appointmentId, cancelReason);
      
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã hủy giao dịch thành công!",
        confirmButtonText: "Đóng",
      });
      
      setShowCancelModal(false);
      setCancelReason("");
      await loadContractData();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể hủy giao dịch";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resetTimelineForm = () => {
    setSelectedStep(null);
    setStepStatus("PENDING");
    setStepNote("");
    setStepDueDate("");
    setStepAttachments([]);
  };

  const openUpdateTimelineModal = (step: TimelineStep) => {
    const existingStep = timeline.find((t) => t.step === step);
    setSelectedStep(step);
    setStepStatus(existingStep?.status || "PENDING");
    setStepNote(existingStep?.note || "");
    setStepDueDate(existingStep?.dueDate || "");
    setStepAttachments([]);
    setShowUpdateTimelineModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStepData = (step: TimelineStep): TimelineStepData | undefined => {
    return timeline.find((t) => t.step === step);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!contractInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Chưa có hợp đồng
            </h2>
            <p className="text-gray-600 mb-6">
              Hợp đồng chưa được tạo cho lịch hẹn này.
            </p>
            {isStaff() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Tạo hợp đồng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Chi tiết hợp đồng
            </h1>
            {isStaff() && (
              <div className="flex gap-2">
                {!contractId && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={actionLoading !== null}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Tạo hợp đồng
                  </button>
                )}
                {contractId && (
                  <>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      disabled={actionLoading !== null}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload ảnh
                    </button>
                    <button
                      onClick={handleGeneratePdf}
                      disabled={actionLoading === "generate-pdf"}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      {actionLoading === "generate-pdf" ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                      Sinh PDF
                    </button>
                    <button
                      onClick={handleViewPdf}
                      disabled={actionLoading === "view-pdf"}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      {actionLoading === "view-pdf" ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      Xem PDF
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={actionLoading === "complete" || contractStatus === "COMPLETED"}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                    >
                      {actionLoading === "complete" ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Hoàn tất
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      disabled={actionLoading !== null || contractStatus === "CANCELLED"}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                    >
                      <XCircle className="w-5 h-5" />
                      Hủy
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contract Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Buyer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Thông tin người mua
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Họ tên:</span>
                <p className="font-semibold">{contractInfo.buyer.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-semibold">{contractInfo.buyer.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Số điện thoại:</span>
                <p className="font-semibold">{contractInfo.buyer.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">CMND/CCCD:</span>
                <p className="font-semibold">{contractInfo.buyer.idNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Địa chỉ:</span>
                <p className="font-semibold">{contractInfo.buyer.address}</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-green-600" />
              Thông tin người bán
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Họ tên:</span>
                <p className="font-semibold">{contractInfo.seller.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-semibold">{contractInfo.seller.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Số điện thoại:</span>
                <p className="font-semibold">{contractInfo.seller.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">CMND/CCCD:</span>
                <p className="font-semibold">{contractInfo.seller.idNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Địa chỉ:</span>
                <p className="font-semibold">{contractInfo.seller.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-6 h-6 text-purple-600" />
            Thông tin xe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-600">Tiêu đề:</span>
              <p className="font-semibold">{contractInfo.vehicle.title}</p>
            </div>
            <div>
              <span className="text-gray-600">Hãng:</span>
              <p className="font-semibold">{contractInfo.vehicle.brand}</p>
            </div>
            <div>
              <span className="text-gray-600">Model:</span>
              <p className="font-semibold">{contractInfo.vehicle.model}</p>
            </div>
            <div>
              <span className="text-gray-600">Loại:</span>
              <p className="font-semibold">{contractInfo.vehicle.type}</p>
            </div>
            <div>
              <span className="text-gray-600">Màu sắc:</span>
              <p className="font-semibold">{contractInfo.vehicle.color}</p>
            </div>
            <div>
              <span className="text-gray-600">Năm sản xuất:</span>
              <p className="font-semibold">{contractInfo.vehicle.year}</p>
            </div>
            <div>
              <span className="text-gray-600">Giá:</span>
              <p className="font-semibold text-green-600">
                {formatCurrency(contractInfo.vehicle.price)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Số máy:</span>
              <p className="font-semibold">{contractInfo.vehicle.engineNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Số khung:</span>
              <p className="font-semibold">{contractInfo.vehicle.chassisNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Biển số:</span>
              <p className="font-semibold">{contractInfo.vehicle.licensePlate}</p>
            </div>
            <div>
              <span className="text-gray-600">Số đăng ký:</span>
              <p className="font-semibold">{contractInfo.vehicle.registrationNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Ngày đăng ký:</span>
              <p className="font-semibold">{formatDate(contractInfo.vehicle.registrationDate)}</p>
            </div>
            <div>
              <span className="text-gray-600">Cấp bởi:</span>
              <p className="font-semibold">{contractInfo.vehicle.registrationIssuedBy}</p>
            </div>
            <div>
              <span className="text-gray-600">Cấp cho:</span>
              <p className="font-semibold">{contractInfo.vehicle.registrationIssuedTo}</p>
            </div>
            <div>
              <span className="text-gray-600">Địa chỉ đăng ký:</span>
              <p className="font-semibold">{contractInfo.vehicle.registrationAddress}</p>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            Thông tin giao dịch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Tiền đặt cọc:</span>
              <p className="font-semibold text-blue-600 text-lg">
                {formatCurrency(contractInfo.transaction.depositAmount)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Giá cuối cùng:</span>
              <p className="font-semibold text-green-600 text-lg">
                {formatCurrency(contractInfo.transaction.finalPrice)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Ngày hẹn:</span>
              <p className="font-semibold">{formatDate(contractInfo.transaction.appointmentDate)}</p>
            </div>
            <div>
              <span className="text-gray-600">Địa điểm:</span>
              <p className="font-semibold">{contractInfo.transaction.location}</p>
            </div>
            <div>
              <span className="text-gray-600">Loại lịch hẹn:</span>
              <p className="font-semibold">{contractInfo.transaction.appointmentType}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Timeline hợp đồng
          </h2>
          <div className="space-y-4">
            {TIMELINE_STEPS.map((step, index) => {
              const stepData = getStepData(step);
              const status = stepData?.status || "PENDING";
              const isLast = index === TIMELINE_STEPS.length - 1;

              return (
                <div key={step} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
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
                        <CheckCircle className="w-6 h-6" />
                      ) : status === "BLOCKED" ? (
                        <XCircle className="w-6 h-6" />
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-full min-h-[60px] ${
                          status === "DONE" ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {TIMELINE_STEP_LABELS[step]}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[status]}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      {isStaff() && (
                        <button
                          onClick={() => openUpdateTimelineModal(step)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Cập nhật
                        </button>
                      )}
                    </div>
                    {stepData?.note && (
                      <p className="text-gray-600 text-sm mb-2">{stepData.note}</p>
                    )}
                    {stepData?.dueDate && (
                      <p className="text-gray-500 text-xs">
                        Hạn: {formatDate(stepData.dueDate)}
                      </p>
                    )}
                    {stepData?.updatedAt && (
                      <p className="text-gray-500 text-xs">
                        Cập nhật: {formatDateTime(stepData.updatedAt)}
                      </p>
                    )}
                    {stepData?.attachments && stepData.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Đính kèm:</p>
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
            })}
          </div>
        </div>

        {/* Modals */}
        {/* Create Contract Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Tạo hợp đồng</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại hợp đồng
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as ContractType)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="DEPOSIT">Đặt cọc</option>
                    <option value="FULL_PAYMENT">Thanh toán đầy đủ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điều khoản hợp đồng (tùy chọn)
                  </label>
                  <textarea
                    value={contractTerms}
                    onChange={(e) => setContractTerms(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Nhập điều khoản hợp đồng..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateContract}
                    disabled={actionLoading === "create"}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {actionLoading === "create" ? "Đang tạo..." : "Tạo hợp đồng"}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Photos Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Upload ảnh hợp đồng</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedPhotos([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn ảnh
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedPhotos(files);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {selectedPhotos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Đã chọn {selectedPhotos.length} ảnh
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUploadPhotos}
                    disabled={actionLoading === "upload" || selectedPhotos.length === 0}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {actionLoading === "upload" ? "Đang upload..." : "Upload"}
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedPhotos([]);
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Timeline Modal */}
        {showUpdateTimelineModal && selectedStep && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Cập nhật: {TIMELINE_STEP_LABELS[selectedStep]}
                </h3>
                <button
                  onClick={() => {
                    setShowUpdateTimelineModal(false);
                    resetTimelineForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={stepStatus}
                    onChange={(e) => setStepStatus(e.target.value as TimelineStatus)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="IN_PROGRESS">Đang thực hiện</option>
                    <option value="DONE">Hoàn thành</option>
                    <option value="BLOCKED">Bị chặn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={stepNote}
                    onChange={(e) => setStepNote(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Nhập ghi chú..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={stepDueDate}
                    onChange={(e) => setStepDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đính kèm (tùy chọn)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setStepAttachments(files);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {stepAttachments.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Đã chọn {stepAttachments.length} file
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateTimeline}
                    disabled={actionLoading === "update-timeline"}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {actionLoading === "update-timeline" ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                  <button
                    onClick={() => {
                      setShowUpdateTimelineModal(false);
                      resetTimelineForm();
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-red-600">Hủy giao dịch</h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do hủy <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Nhập lý do hủy giao dịch..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel" || !cancelReason.trim()}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {actionLoading === "cancel" ? "Đang hủy..." : "Xác nhận hủy"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason("");
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

