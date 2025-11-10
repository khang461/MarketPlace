import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Car,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import api from "../../config/api";
import Swal from "sweetalert2";
import ImagePreviewModal from "../../components/ImagePreviewModal";

// Interface cho appointment detail với thông tin populated
interface Appointment {
  _id?: string;
  id?: string;
  appointmentId?: string;
  auctionId?: string;
  scheduledDate: string;
  location: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  type: "CONTRACT_SIGNING" | "INSPECTION" | "OTHER";
  appointmentType?: "AUCTION" | "DEPOSIT" | "OTHER";
  contractPhotos?: Array<{ url?: string; photoUrl?: string }>;
  // Populated buyer/seller info
  buyer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  // API format
  buyerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  sellerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  // Vehicle and transaction info (might be populated)
  vehicle?: {
    title?: string;
    brand?: string;
    make?: string;
    model?: string;
    year?: number;
    price?: number;
  };
  transaction?: {
    depositAmount?: number;
    depositStatus?: string;
    vehiclePrice?: number;
    remainingAmount?: number;
    depositPercentage?: string;
  };
  confirmation?: {
    buyerConfirmed?: boolean;
    sellerConfirmed?: boolean;
    confirmedAt?: string;
  };
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [contractPhotos, setContractPhotos] = useState<{
    seller: string[];
    buyer: string[];
  }>({ seller: [], buyer: [] });
  // State cho preview files trước khi upload
  const [previewFiles, setPreviewFiles] = useState<{
    seller: File[];
    buyer: File[];
  }>({ seller: [], buyer: [] });
  const [completedContractPhotos, setCompletedContractPhotos] = useState<
    string[]
  >([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Chỉ đóng dropdown khi click bên ngoài dropdown
      if (dropdownOpen && !target.closest(".dropdown-menu-container")) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/appointments/staff");

      if (response.data.success) {
        console.log("Appointments API response:", response.data.data);
        const rawAppointments = response.data.data || [];

        // Normalize data: convert buyerId/sellerId to buyer/seller format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedAppointments = rawAppointments.map((apt: any) => ({
          ...apt,
          id: apt._id || apt.id,
          appointmentId: apt._id || apt.appointmentId,
          buyer:
            apt.buyer ||
            (apt.buyerId
              ? {
                  id: apt.buyerId._id || apt.buyerId.id,
                  name: apt.buyerId.fullName || apt.buyerId.name,
                  email: apt.buyerId.email,
                  phone: apt.buyerId.phone,
                }
              : undefined),
          seller:
            apt.seller ||
            (apt.sellerId
              ? {
                  id: apt.sellerId._id || apt.sellerId.id,
                  name: apt.sellerId.fullName || apt.sellerId.name,
                  email: apt.sellerId.email,
                  phone: apt.sellerId.phone,
                }
              : undefined),
        }));

        console.log("Normalized appointments:", normalizedAppointments);
        setAppointments(normalizedAppointments);

        // Fetch vehicle info for AUCTION appointments that don't have vehicle data
        const auctionAppointments = normalizedAppointments.filter(
          (apt: Appointment) =>
            apt.appointmentType === "AUCTION" && !apt.vehicle
        );

        if (auctionAppointments.length > 0) {
          console.log(
            `🔍 Fetching vehicle info for ${auctionAppointments.length} auction appointments...`
          );

          // Fetch vehicle info in parallel
          const vehiclePromises = auctionAppointments.map(
            async (apt: Appointment) => {
              try {
                const appointmentId = apt._id || apt.appointmentId;
                if (!appointmentId) return apt;

                const contractResponse = await api.get(
                  `/contracts/${appointmentId}`
                );
                const contract =
                  contractResponse.data.contractInfo ||
                  contractResponse.data.data;

                if (contract?.vehicle) {
                  const depositAmount =
                    contract.transaction?.depositAmount || 0;
                  const finalPrice = contract.transaction?.finalPrice || 0;

                  return {
                    ...apt,
                    vehicle: {
                      make: contract.vehicle.model || contract.vehicle.make,
                      model: contract.vehicle.model,
                      year: contract.vehicle.year,
                      type: contract.vehicle.type,
                    },
                    transaction: contract.transaction
                      ? {
                          depositAmount,
                          vehiclePrice: finalPrice,
                          remainingAmount: finalPrice - depositAmount,
                          depositPercentage:
                            finalPrice > 0
                              ? `${((depositAmount / finalPrice) * 100).toFixed(
                                  2
                                )}%`
                              : "0%",
                          depositStatus: "PAID",
                        }
                      : undefined,
                  };
                }
                return apt;
              } catch (error) {
                console.error(
                  `Failed to fetch vehicle for appointment ${apt.id}:`,
                  error
                );
                return apt;
              }
            }
          );

          const enrichedAuctions = await Promise.all(vehiclePromises);

          // Merge back into the appointments list
          const updatedAppointments = normalizedAppointments.map(
            (apt: Appointment) => {
              const enriched = enrichedAuctions.find(
                (e: Appointment) => e.id === apt.id
              );
              return enriched || apt;
            }
          );

          console.log(
            "✅ Updated appointments with vehicle info:",
            updatedAppointments
          );
          setAppointments(updatedAppointments);
        }
      } else {
        setError("Không thể tải danh sách lịch hẹn");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Chờ xử lý",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Đã hoàn thành",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Đã hủy",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.CONFIRMED;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(
    (appointment) =>
      filterStatus === "all" || appointment.status === filterStatus
  );

  const toggleDropdown = (appointmentId: string) => {
    setDropdownOpen(dropdownOpen === appointmentId ? null : appointmentId);
  };

  const openModal = async (appointment: Appointment) => {
    console.log("📋 Selected appointment data:", appointment);
    console.log("🚗 Vehicle data:", appointment.vehicle);
    console.log("💰 Transaction data:", appointment.transaction);
    console.log(
      "📋 Full appointment object:",
      JSON.stringify(appointment, null, 2)
    );

    setSelectedAppointment(appointment);
    setIsModalOpen(true);

    // Nếu đã hoàn thành và danh sách ảnh có sẵn trong appointment, dùng luôn
    if (
      appointment.status === "COMPLETED" &&
      Array.isArray(appointment.contractPhotos)
    ) {
      const urls = appointment.contractPhotos
        .map((p: { url?: string; photoUrl?: string }) => p?.url || p?.photoUrl)
        .filter(Boolean) as string[];
      if (urls.length > 0) {
        setCompletedContractPhotos(urls);
      }
    }

    // Fetch contract info (bao gồm vehicle, transaction, và photos)
    // API /contracts/{id} sẽ trả về đầy đủ thông tin
    if (appointment.appointmentId || appointment._id) {
      await fetchContractPhotos(
        appointment.appointmentId || appointment._id || ""
      );
    }
  };

  const closeModal = () => {
    // Cleanup preview URLs để tránh memory leak
    previewFiles.seller.forEach((file) => {
      const url = URL.createObjectURL(file);
      URL.revokeObjectURL(url);
    });
    previewFiles.buyer.forEach((file) => {
      const url = URL.createObjectURL(file);
      URL.revokeObjectURL(url);
    });

    setIsModalOpen(false);
    setSelectedAppointment(null);
    setContractPhotos({ seller: [], buyer: [] });
    setPreviewFiles({ seller: [], buyer: [] });
    setCompletedContractPhotos([]);
  };

  const fetchContractPhotos = async (appointmentId: string) => {
    try {
      const response = await api.get(`/contracts/${appointmentId}`);
      console.log("Contract API response:", response.data);

      // Kiểm tra nhiều cấu trúc response có thể có
      const contract =
        response.data.data ||
        response.data.contractInfo ||
        response.data.contract ||
        response.data;

      if (contract) {
        console.log("Contract data:", contract);
        console.log("Full contract keys:", Object.keys(contract));

        // **LẤY THÔNG TIN VEHICLE VÀ TRANSACTION TỪ CONTRACT**
        if (contract.vehicle || contract.transaction) {
          setSelectedAppointment((prev) => {
            if (!prev) return prev;

            const depositAmount = contract.transaction?.depositAmount || 0;
            const finalPrice = contract.transaction?.finalPrice || 0;
            const remainingAmount = finalPrice - depositAmount;
            const depositPercentage =
              finalPrice > 0
                ? `${((depositAmount / finalPrice) * 100).toFixed(2)}%`
                : "0%";

            // Map vehicle data from contract format to display format
            const vehicleInfo = contract.vehicle
              ? {
                  title: contract.vehicle.model || prev.vehicle?.title,
                  brand: contract.vehicle.brand || prev.vehicle?.brand,
                  make:
                    contract.vehicle.make ||
                    contract.vehicle.model ||
                    prev.vehicle?.make,
                  model: contract.vehicle.model || prev.vehicle?.model,
                  year: contract.vehicle.year || prev.vehicle?.year,
                  price: finalPrice || prev.vehicle?.price || 0,
                  type: contract.vehicle.type,
                }
              : prev.vehicle;

            // Map transaction data
            const transactionInfo = contract.transaction
              ? {
                  depositAmount: depositAmount,
                  depositStatus: "PAID", // Assume paid if contract exists
                  vehiclePrice: finalPrice,
                  remainingAmount: remainingAmount,
                  depositPercentage: depositPercentage,
                  appointmentType: contract.transaction.appointmentType,
                }
              : prev.transaction;

            return {
              ...prev,
              vehicle: vehicleInfo,
              transaction: transactionInfo,
            };
          });
          console.log("✅ Updated vehicle and transaction from contract API");
        }

        // Kiểm tra xem có photos ở đâu không
        console.log("contract.photos:", contract.photos);
        console.log("contract.sellerPhotos:", contract.sellerPhotos);
        console.log("contract.buyerPhotos:", contract.buyerPhotos);

        // Thử nhiều cách để lấy photos
        let sellerPhotos: string[] = [];
        let buyerPhotos: string[] = [];
        let signedContractPhotos: string[] = [];

        // Cách 1: sellerPhotos và buyerPhotos trực tiếp
        if (contract.sellerPhotos && Array.isArray(contract.sellerPhotos)) {
          sellerPhotos = contract.sellerPhotos;
        }
        if (contract.buyerPhotos && Array.isArray(contract.buyerPhotos)) {
          buyerPhotos = contract.buyerPhotos;
        }

        // Cách 2: photos object với seller/buyer
        if (
          !sellerPhotos.length &&
          contract.photos?.seller &&
          Array.isArray(contract.photos.seller)
        ) {
          sellerPhotos = contract.photos.seller;
        }
        if (
          !buyerPhotos.length &&
          contract.photos?.buyer &&
          Array.isArray(contract.photos.buyer)
        ) {
          buyerPhotos = contract.photos.buyer;
        }

        // Cách 3: photos array với side property
        if (Array.isArray(contract.photos)) {
          const sellerPhotosFromArray = contract.photos
            .filter(
              (p: { side?: string; url?: string; photoUrl?: string }) =>
                p.side === "seller"
            )
            .map(
              (p: { url?: string; photoUrl?: string }) => p.url || p.photoUrl
            )
            .filter(Boolean);
          const buyerPhotosFromArray = contract.photos
            .filter(
              (p: { side?: string; url?: string; photoUrl?: string }) =>
                p.side === "buyer"
            )
            .map(
              (p: { url?: string; photoUrl?: string }) => p.url || p.photoUrl
            )
            .filter(Boolean);

          if (sellerPhotosFromArray.length)
            sellerPhotos = sellerPhotosFromArray;
          if (buyerPhotosFromArray.length) buyerPhotos = buyerPhotosFromArray;
        }

        // Cách 4: contractPhotos là mảng ảnh đã ký (COMPLETED)
        if (Array.isArray(contract.contractPhotos)) {
          signedContractPhotos = (
            contract.contractPhotos as Array<{
              url?: string;
              photoUrl?: string;
            }>
          )
            .map((p) => p.url || p.photoUrl)
            .filter(Boolean) as string[];
        }

        console.log("Final Seller photos:", sellerPhotos);
        console.log("Final Buyer photos:", buyerPhotos);

        // Chỉ cập nhật nếu có photos, không reset về rỗng
        if (sellerPhotos.length > 0 || buyerPhotos.length > 0) {
          setContractPhotos((prev) => ({
            seller: sellerPhotos.length > 0 ? sellerPhotos : prev.seller,
            buyer: buyerPhotos.length > 0 ? buyerPhotos : prev.buyer,
          }));
        }

        if (signedContractPhotos.length > 0) {
          setCompletedContractPhotos(signedContractPhotos);
        } else {
          // Fallback: lấy từ danh sách appointments trong state
          const fromList = appointments.find(
            (a) => a.appointmentId === appointmentId || a._id === appointmentId
          )?.contractPhotos;
          if (Array.isArray(fromList)) {
            const urls = fromList
              .map((p) => p?.url || p?.photoUrl)
              .filter(Boolean) as string[];
            if (urls.length > 0) {
              setCompletedContractPhotos(urls);
            }
          }
        }
      } else {
        console.warn("No contract data found in response");
        // Không reset về rỗng, giữ nguyên state hiện tại
      }
    } catch (error) {
      console.error("Error fetching contract photos:", error);
      // Không reset về rỗng khi có lỗi, giữ nguyên state hiện tại
    }
  };

  // Xử lý khi chọn file - chỉ preview, chưa upload
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "seller" | "buyer"
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const currentFiles = previewFiles[side] || [];
      const totalFiles = currentFiles.length + newFiles.length;

      // Giới hạn tối đa 3 ảnh
      if (totalFiles > 3) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: `Chỉ có thể chọn tối đa 3 ảnh. Bạn đã chọn ${
            currentFiles.length
          } ảnh, chỉ có thể thêm ${3 - currentFiles.length} ảnh nữa.`,
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      // Thêm files vào preview
      setPreviewFiles((prev) => ({
        ...prev,
        [side]: [...prev[side], ...newFiles].slice(0, 3), // Đảm bảo không quá 3
      }));

      // Reset input để có thể chọn lại file giống nhau
      e.target.value = "";
    }
  };

  // Xóa file khỏi preview (chỉ xóa khỏi state, chưa upload)
  const handleRemovePreviewFile = (side: "seller" | "buyer", index: number) => {
    setPreviewFiles((prev) => ({
      ...prev,
      [side]: prev[side].filter((_, i) => i !== index),
    }));
  };

  // Upload tất cả files - BỎ tính năng upload từng bên, chuyển sang upload chung

  // Upload cả 2 bên: yêu cầu đủ 3 ảnh bên bán và 3 ảnh bên mua
  const handleUploadBothSides = async () => {
    const sellerFiles = previewFiles.seller;
    const buyerFiles = previewFiles.buyer;

    if (sellerFiles.length !== 3 || buyerFiles.length !== 3) {
      Swal.fire({
        icon: "warning",
        title: "Chưa đủ ảnh",
        text: "Vui lòng chọn đủ các mặt của hợp đồng.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (!selectedAppointment) return;

    try {
      const formData = new FormData();
      // Append theo thứ tự: seller trước, buyer sau
      sellerFiles.forEach((file) => formData.append("photos", file));
      buyerFiles.forEach((file) => formData.append("photos", file));
      formData.append("description", "Ảnh hợp đồng đã ký");

      const response = await api.post(
        `/contracts/${selectedAppointment.appointmentId}/upload-photos`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        const uploadedPhotos = response.data.data?.photos || [];
        const photoUrls = uploadedPhotos
          .map((p: { url?: string; photoUrl?: string }) => p.url || p.photoUrl)
          .filter(Boolean) as string[];

        // Chia 6 ảnh: 3 ảnh đầu cho seller, 3 ảnh sau cho buyer (theo thứ tự append)
        const sellerUrls = photoUrls.slice(0, 3);
        const buyerUrls = photoUrls.slice(3, 6);

        setContractPhotos((prev) => ({
          ...prev,
          seller: sellerUrls.length === 3 ? sellerUrls : prev.seller,
          buyer: buyerUrls.length === 3 ? buyerUrls : prev.buyer,
        }));

        // Xóa preview sau khi upload
        setPreviewFiles({ seller: [], buyer: [] });

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã upload 6 ảnh hợp đồng (3 bên bán, 3 bên mua).",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error uploading both sides photos:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text:
          axiosError.response?.data?.message ||
          "Không thể upload ảnh. Vui lòng thử lại.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const openImagePreview = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  // Xóa ảnh đã upload (cần gọi API)
  const handleDeletePhoto = async (
    _photoUrl: string,
    side: "seller" | "buyer",
    index: number
  ) => {
    // Xác nhận trước khi xóa
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa ảnh này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        // TODO: Gọi API xóa ảnh nếu backend có endpoint
        // await api.delete(`/contracts/${selectedAppointment?.appointmentId}/photos`, { data: { photoUrl, side } });

        // Xóa khỏi state ngay lập tức
        setContractPhotos((prev) => ({
          ...prev,
          [side]: prev[side].filter((_, i) => i !== index),
        }));

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã xóa ảnh thành công",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error deleting photo:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Không thể xóa ảnh. Vui lòng thử lại.",
          confirmButtonColor: "#2563eb",
        });
      }
    }
  };

  // Tạo preview URL từ File object
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleCompleteTransaction = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await api.post(
        `/contracts/${selectedAppointment.appointmentId}/complete`
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: response.data.message || "Đã hoàn thành giao dịch thành công",
          confirmButtonColor: "#2563eb",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh appointments list
        await fetchAppointments();
        closeModal();
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text:
            response.data.message || "Có lỗi xảy ra khi hoàn thành giao dịch.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text:
          axiosError.response?.data?.message ||
          "Không thể hoàn thành giao dịch. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const handleCancelTransaction = async () => {
    if (!selectedAppointment) return;

    // Hiển thị modal nhập lý do hủy
    const { value: formData } = await Swal.fire({
      title: "Hủy giao dịch",
      width: "520px",
      html: `
        <div class="text-left" style="max-width: 100%; overflow: hidden;">
          <div style="margin-bottom: 24px;">
            <label class="block text-sm font-medium text-gray-700 mb-3">Lý do hủy giao dịch:</label>
            <textarea 
              id="cancelReason" 
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; resize: none; min-height: 120px; line-height: 1.5;"
              placeholder="Nhập lý do hủy giao dịch (bắt buộc)"
              rows="5"
              required
            ></textarea>
          </div>
          
          <div class="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            <p>⚠️ <strong>Lưu ý:</strong> Khi hủy giao dịch, 80% tiền đặt cọc sẽ được hoàn về ví người mua, 20% sẽ được giữ lại làm phí hủy.</p>
          </div>
        </div>
      `,
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Hủy",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        const reason = (
          document.getElementById("cancelReason") as HTMLTextAreaElement
        ).value.trim();
        if (!reason || reason.length === 0) {
          Swal.showValidationMessage("Vui lòng nhập lý do hủy giao dịch");
          return false;
        }
        return { reason };
      },
    });

    // Nếu user hủy dialog
    if (!formData) {
      return;
    }

    try {
      const response = await api.post(
        `/contracts/${selectedAppointment.appointmentId}/cancel`,
        formData
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text:
            response.data.message ||
            "Đã hủy giao dịch thành công, tiền đã hoàn về ví người mua",
          confirmButtonColor: "#2563eb",
          timer: 3000,
          showConfirmButton: false,
        });

        // Refresh appointments list
        await fetchAppointments();
        closeModal();
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi hủy giao dịch.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text:
          axiosError.response?.data?.message ||
          "Không thể hủy giao dịch. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const createPlaceholder = (length: number = 80) => {
    return ".".repeat(length);
  };

  const generateContractWithData = (appointment: Appointment) => {
    const contractContent = createContractContent(appointment);
    downloadContractPDF(contractContent);
    setDropdownOpen(null);
  };

  const generateEmptyContract = () => {
    const contractContent = createEmptyContractContent();
    downloadContractPDF(contractContent);
    setDropdownOpen(null);
  };

  const createContractContent = (appointment: Appointment): string => {
    return `
<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.6; max-width: 800px; margin: 0 auto;">

<div style="text-align: center; margin-bottom: 30px;">
  <p style="font-weight: bold; font-size: 16pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p style="font-weight: bold; font-size: 14pt; margin: 5px 0;">Độc lập - Tự do - Hạnh phúc</p>
  <p style="font-weight: bold; font-size: 18pt; margin: 20px 0; text-transform: uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
</div>

<p style="margin-bottom: 20px;">Hôm nay, ngày ${new Date().toLocaleDateString(
      "vi-VN"
    )} tại ${appointment.location}, chúng tôi gồm có:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN BÁN (SAU ĐÂY GỌI LÀ BÊN A):</p>
<p style="margin: 5px 0;">Ông: ${(
      appointment.seller?.name || "N/A"
    ).toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${createPlaceholder(
      15
    )}</span></p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(
      20
    )}<span style="margin-left: 20px;">cấp ngày: ${createPlaceholder(
      15
    )}</span><span style="margin-left: 20px;">tại: ${createPlaceholder(
      40
    )}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN MUA (SAU ĐÂY GỌI LÀ BÊN B):</p>
<p style="margin: 5px 0;">Ông: ${(
      appointment.buyer?.name || "N/A"
    ).toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${createPlaceholder(
      15
    )}</span></p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(
      20
    )}<span style="margin-left: 20px;">Cấp ngày: ${createPlaceholder(
      15
    )}</span><span style="margin-left: 20px;">tại: ${createPlaceholder(
      40
    )}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="margin: 20px 0;">Hai bên đồng ý thực hiện việc mua bán xe máy với các thỏa thuận sau đây:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 1. ĐỐI TƯỢNG CỦA HỢP ĐỒNG</p>
<p style="margin: 5px 0;">Bên A đồng ý bán và bên B đồng ý mua chiếc xe được mô tả dưới đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. Đặc điểm xe:</p>
<p style="margin: 3px 0;">Biển số: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Nhãn hiệu: ${(
      appointment.vehicle?.make || "N/A"
    ).toUpperCase()};</p>
<p style="margin: 3px 0;">Dung tích xi lanh: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Loại xe: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Màu sơn: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Số máy: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Số khung: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Các đặc điểm khác: ${createPlaceholder(40)}</p>

<p style="font-weight: bold; margin: 10px 0 5px 0;">2. Giấy đăng ký xe số: ${createPlaceholder(
      20
    )} do ${createPlaceholder(50)} cấp ngày ${createPlaceholder(15)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 2. GIÁ MUA BÁN VÀ PHƯƠNG THỨC THANH TOÁN</p>
<p style="font-weight: bold; margin: 5px 0;">1. Giá mua bán xe nêu tại Điều 1 là: ${(
      appointment.transaction?.depositAmount || 0
    ).toLocaleString("vi-VN")} VNĐ</p>
<p style="margin: 5px 0;">(Bằng chữ: ${createPlaceholder(50)})</p>
<p style="font-weight: bold; margin: 5px 0;">2. Số tiền đặt cọc: ${(
      appointment.transaction?.depositAmount || 0
    ).toLocaleString("vi-VN")} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">3. Số tiền còn lại: ${createPlaceholder(
      20
    )} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">4. Phương thức thanh toán: ${createPlaceholder(
      20
    )}</p>
<p style="margin: 5px 0;">5. Việc thanh toán số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 3. THỜI HẠN, ĐỊA ĐIỂM VÀ PHƯƠNG THỨC GIAO XE</p>
<p style="margin: 5px 0;">Hai bên thống nhất giao xe tại địa điểm: ${appointment.location.toUpperCase()}</p>
<p style="margin: 5px 0;">Thời gian giao xe: ${new Date(
      appointment.scheduledDate
    ).toLocaleDateString("vi-VN")}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 4. QUYỀN SỞ HỮU ĐỐI VỚI XE MUA BÁN</p>
<p style="margin: 5px 0;">1. Bên mua có trách nhiệm thực hiện việc đăng ký quyền sở hữu đối với xe tại cơ quan có thẩm quyền;</p>
<p style="margin: 5px 0;">2. Quyền sở hữu đối với xe nêu trên được chuyển cho Bên B, kể từ thời điểm thực hiện xong các thủ tục đăng ký quyền sở hữu xe;</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 5. VIỆC NỘP THUẾ VÀ LỆ PHÍ CÔNG CHỨNG</p>
<p style="margin: 5px 0;">Thuế và lệ phí liên quan đến việc mua bán chiếc xe theo Hợp đồng này do BÊN MUA chịu trách nhiệm nộp.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 6. PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP</p>
<p style="margin: 5px 0;">Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp, các bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, thì một trong hai bên có quyền khởi kiện để yêu cầu tòa án có thẩm quyền giải quyết theo quy định của pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 7. CAM ĐOAN CỦA CÁC BÊN</p>
<p style="margin: 5px 0;">Bên A và bên B chịu trách nhiệm trước pháp luật về những lời cam đoan sau đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. BÊN A CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân, về xe mua bán ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Xe mua bán không có tranh chấp, không bị cơ quan nhà nước có thẩm quyền xử lý theo quy định pháp luật;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này;</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">2. BÊN B CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Đã xem xét kỹ, biết rõ về xe mua bán và các giấy tờ chứng minh quyền sở hữu;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 8. ĐIỀU KHOẢN CUỐI CÙNG</p>
<p style="margin: 5px 0;">1. Hai bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết Hợp đồng này;</p>
<p style="margin: 5px 0;">2. Hai bên đã tự đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng và ký vào Hợp đồng này trước sự có mặt của Công chứng viên;</p>
<p style="margin: 5px 0;">3. Hợp đồng có hiệu lực thời điểm các bên ký kết hợp đồng</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN A</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${(
      appointment.seller?.name || "N/A"
    ).toUpperCase()}</p>
  </div>
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN B</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${(
      appointment.buyer?.name || "N/A"
    ).toUpperCase()}</p>
  </div>
</div>

</div>
    `.trim();
  };

  const createEmptyContractContent = (): string => {
    return `
<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.6; max-width: 800px; margin: 0 auto;">

<div style="text-align: center; margin-bottom: 30px;">
  <p style="font-weight: bold; font-size: 16pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p style="font-weight: bold; font-size: 14pt; margin: 5px 0;">Độc lập - Tự do - Hạnh phúc</p>
  <p style="font-weight: bold; font-size: 18pt; margin: 20px 0; text-transform: uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
</div>

<p style="margin-bottom: 20px;">Hôm nay, ngày ${createPlaceholder(
      20
    )} tại ${createPlaceholder(60)}, chúng tôi gồm có:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN BÁN (SAU ĐÂY GỌI LÀ BÊN A):</p>
<p style="margin: 5px 0;">Ông: ${createPlaceholder(
      30
    )} Sinh ngày: ${createPlaceholder(15)}</p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(
      20
    )} cấp ngày: ${createPlaceholder(15)} tại: ${createPlaceholder(40)}</p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>
<p style="margin: 5px 0;">Cùng vợ là bà: ${createPlaceholder(30)}</p>
<p style="margin: 5px 0;">Sinh ngày: ${createPlaceholder(15)}</p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(
      20
    )} cấp ngày: ${createPlaceholder(15)} tại: ${createPlaceholder(40)}</p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN MUA (SAU ĐÂY GỌI LÀ BÊN B):</p>
<p style="margin: 5px 0;">Ông: ${createPlaceholder(
      30
    )} Sinh ngày: ${createPlaceholder(15)}</p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(
      20
    )} Cấp ngày: ${createPlaceholder(15)} tại: ${createPlaceholder(40)}</p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="margin: 20px 0;">Hai bên đồng ý thực hiện việc mua bán xe máy với các thỏa thuận sau đây:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 1. ĐỐI TƯỢNG CỦA HỢP ĐỒNG</p>
<p style="margin: 5px 0;">Bên A đồng ý bán và bên B đồng ý mua chiếc xe được mô tả dưới đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. Đặc điểm xe:</p>
<p style="margin: 3px 0;">Biển số: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Nhãn hiệu: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Dung tích xi lanh: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Loại xe: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Màu sơn: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Số máy: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Số khung: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Các đặc điểm khác: ${createPlaceholder(40)}</p>

<p style="font-weight: bold; margin: 10px 0 5px 0;">2. Giấy đăng ký xe số: ${createPlaceholder(
      20
    )} do ${createPlaceholder(50)} cấp ngày ${createPlaceholder(15)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 2. GIÁ MUA BÁN VÀ PHƯƠNG THỨC THANH TOÁN</p>
<p style="font-weight: bold; margin: 5px 0;">1. Giá mua bán xe nêu tại Điều 1 là: ${createPlaceholder(
      20
    )} VNĐ</p>
<p style="margin: 5px 0;">(Bằng chữ: ${createPlaceholder(50)})</p>
<p style="font-weight: bold; margin: 5px 0;">2. Số tiền đặt cọc: ${createPlaceholder(
      20
    )} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">3. Số tiền còn lại: ${createPlaceholder(
      20
    )} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">4. Phương thức thanh toán: ${createPlaceholder(
      20
    )}</p>
<p style="margin: 5px 0;">5. Việc thanh toán số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 3. THỜI HẠN, ĐỊA ĐIỂM VÀ PHƯƠNG THỨC GIAO XE</p>
<p style="margin: 5px 0;">Hai bên thống nhất giao xe tại địa điểm: ${createPlaceholder(
      60
    )}</p>
<p style="margin: 5px 0;">Thời gian giao xe: NGAY SAU KHI KÝ KẾT HỢP ĐỒNG NÀY</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 4. QUYỀN SỞ HỮU ĐỐI VỚI XE MUA BÁN</p>
<p style="margin: 5px 0;">1. Bên mua có trách nhiệm thực hiện việc đăng ký quyền sở hữu đối với xe tại cơ quan có thẩm quyền;</p>
<p style="margin: 5px 0;">2. Quyền sở hữu đối với xe nêu trên được chuyển cho Bên B, kể từ thời điểm thực hiện xong các thủ tục đăng ký quyền sở hữu xe;</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 5. VIỆC NỘP THUẾ VÀ LỆ PHÍ CÔNG CHỨNG</p>
<p style="margin: 5px 0;">Thuế và lệ phí liên quan đến việc mua bán chiếc xe theo Hợp đồng này do BÊN MUA chịu trách nhiệm nộp.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 6. PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP</p>
<p style="margin: 5px 0;">Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp, các bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, thì một trong hai bên có quyền khởi kiện để yêu cầu tòa án có thẩm quyền giải quyết theo quy định của pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 7. CAM ĐOAN CỦA CÁC BÊN</p>
<p style="margin: 5px 0;">Bên A và bên B chịu trách nhiệm trước pháp luật về những lời cam đoan sau đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. BÊN A CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân, về xe mua bán ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Xe mua bán không có tranh chấp, không bị cơ quan nhà nước có thẩm quyền xử lý theo quy định pháp luật;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này;</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">2. BÊN B CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Đã xem xét kỹ, biết rõ về xe mua bán và các giấy tờ chứng minh quyền sở hữu;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 8. ĐIỀU KHOẢN CUỐI CÙNG</p>
<p style="margin: 5px 0;">1. Hai bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết Hợp đồng này;</p>
<p style="margin: 5px 0;">2. Hai bên đã tự đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng và ký vào Hợp đồng này trước sự có mặt của Công chứng viên;</p>
<p style="margin: 5px 0;">3. Hợp đồng có hiệu lực thời điểm các bên ký kết hợp đồng</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN A</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${createPlaceholder(30)}</p>
  </div>
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN B</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${createPlaceholder(30)}</p>
  </div>
</div>

</div>
    `.trim();
  };

  const downloadContractPDF = (content: string) => {
    // Tạo window mới để in
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Hợp đồng mua bán xe</title>
            <style>
              @page {
                size: A4;
                margin: 0;
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
              }
              body { 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt; 
                line-height: 1.6; 
                margin: 2cm;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              p {
                margin: 0 0 5px 0;
              }
              div {
                box-sizing: border-box;
              }
              @media print {
                body { 
                  margin: 2cm;
                }
                @page {
                  margin: 0;
                  @top-left { content: ""; }
                  @top-center { content: ""; }
                  @top-right { content: ""; }
                  @bottom-left { content: ""; }
                  @bottom-center { content: ""; }
                  @bottom-right { content: ""; }
                }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Đợi content render trước khi in
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
          <p className="text-gray-600 mt-1">
            Quản lý tất cả lịch hẹn ký hợp đồng
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            Lọc theo trạng thái:
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="CONFIRMED">Chờ xử lý</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <span className="text-sm text-gray-500">
            Hiển thị {filteredAppointments.length} / {appointments.length} lịch
            hẹn
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên xe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người mua
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian & Địa điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Không có lịch hẹn nào</p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Car className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.vehicle?.make ||
                            appointment.vehicle?.model
                              ? `${appointment.vehicle?.make || ""} ${
                                  appointment.vehicle?.model || ""
                                } ${appointment.vehicle?.year || ""}`.trim()
                              : appointment.appointmentType === "AUCTION"
                              ? "🎯 Xe đấu giá (xem chi tiết)"
                              : "Thông tin xe (xem chi tiết)"}
                          </div>
                          {appointment.appointmentType && (
                            <div className="text-xs text-gray-500">
                              {appointment.appointmentType === "AUCTION"
                                ? "Đấu giá"
                                : "Đặt cọc"}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.buyer?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.seller?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(appointment.scheduledDate)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">
                            {appointment.location}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(appointment)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem chi tiết
                        </button>

                        {appointment.status === "CONFIRMED" && (
                          <div className="relative dropdown-menu-container">
                            <button
                              onClick={() =>
                                appointment.id && toggleDropdown(appointment.id)
                              }
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              In hợp đồng
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </button>

                            {dropdownOpen === appointment.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateContractWithData(appointment);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <FileText className="w-4 h-4 mr-3" />
                                  Hợp đồng có dữ liệu
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateEmptyContract();
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <FileText className="w-4 h-4 mr-3" />
                                  Hợp đồng trắng
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter((a) => a.status === "CONFIRMED").length}
            </div>
            <div className="text-sm text-gray-600">Chờ xử lý</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter((a) => a.status === "COMPLETED").length}
            </div>
            <div className="text-sm text-gray-600">Đã hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter((a) => a.status === "CANCELLED").length}
            </div>
            <div className="text-sm text-gray-600">Đã hủy</div>
          </div>
        </div>
      </div>

      {/* Modal Chi tiết */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết lịch hẹn
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Thông tin xe và giao dịch */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {/* Card trái: Thông tin xe */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin xe
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Xe:</span>{" "}
                      {selectedAppointment.vehicle?.make || "N/A"}{" "}
                      {selectedAppointment.vehicle?.model || "N/A"}{" "}
                      {selectedAppointment.vehicle?.year || "N/A"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Tiêu đề:</span>{" "}
                      {selectedAppointment.vehicle?.title || "N/A"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Thời gian:</span>{" "}
                      {formatDate(selectedAppointment.scheduledDate)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Địa điểm:</span>{" "}
                      {selectedAppointment.location}
                    </p>
                  </div>
                </div>

                {/* Card phải: Thông tin giao dịch */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin giao dịch
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Giá xe:</span>{" "}
                      {(
                        selectedAppointment.transaction?.vehiclePrice ||
                        selectedAppointment.vehicle?.price ||
                        0
                      ).toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Tiền đặt cọc:</span>{" "}
                      {(
                        selectedAppointment.transaction?.depositAmount || 0
                      ).toLocaleString("vi-VN")}{" "}
                      VNĐ{" "}
                      {selectedAppointment.transaction?.depositPercentage
                        ? `(${selectedAppointment.transaction.depositPercentage})`
                        : ""}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Số tiền còn lại:</span>{" "}
                      {(
                        selectedAppointment.transaction?.remainingAmount || 0
                      ).toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Trạng thái cọc:</span>{" "}
                      <span
                        className={`font-semibold ${
                          selectedAppointment.transaction?.depositStatus ===
                          "PAID"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {selectedAppointment.transaction?.depositStatus ||
                          "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Hai bên */}
              <div className="grid grid-cols-2 gap-6">
                {/* Bên Bán */}
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3">
                    🟠 Bên Bán
                  </h3>
                  <div className="bg-orange-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">Tên:</span>{" "}
                      {selectedAppointment.seller?.name || "N/A"}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedAppointment.seller?.email || "N/A"}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Số điện thoại:</span>{" "}
                      {selectedAppointment.seller?.phone || "N/A"}
                    </p>
                  </div>

                  {/* Upload ảnh cho bên bán */}
                  {selectedAppointment.status === "CONFIRMED" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Upload ảnh hợp đồng (Bên Bán)
                      </h4>
                      {/* Hiển thị ảnh đã upload */}
                      {contractPhotos.seller.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">
                            Ảnh đã upload ({contractPhotos.seller.length}/3):
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {contractPhotos.seller.map((photo, index) => {
                              const imageUrl = photo.startsWith("http")
                                ? photo
                                : `${api.defaults.baseURL || ""}${
                                    photo.startsWith("/") ? photo : "/" + photo
                                  }`;
                              return (
                                <div key={index} className="relative group">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() =>
                                      openImagePreview(
                                        contractPhotos.seller,
                                        index
                                      )
                                    }
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Seller photo ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-colors"
                                      onError={(e) => {
                                        console.error(
                                          "Error loading seller image:",
                                          photo,
                                          "Full URL:",
                                          imageUrl
                                        );
                                        (e.target as HTMLImageElement).src =
                                          "https://via.placeholder.com/150?text=Error";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  {/* Nút xóa ảnh */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePhoto(photo, "seller", index);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Xóa ảnh"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {/* Hiển thị placeholder cho slot trống */}
                            {Array.from({
                              length: 3 - contractPhotos.seller.length,
                            }).map((_, index) => (
                              <div
                                key={`empty-${index}`}
                                className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                              >
                                <span className="text-xs text-gray-400">
                                  Trống
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preview ảnh chưa upload */}
                      {previewFiles.seller.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-orange-600 mb-2 font-medium">
                            Ảnh đã chọn (chưa upload) (
                            {previewFiles.seller.length}/3):
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {previewFiles.seller.map((file, index) => {
                              const previewUrl = createPreviewUrl(file);
                              return (
                                <div key={index} className="relative group">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const previewUrls =
                                        previewFiles.seller.map((f) =>
                                          createPreviewUrl(f)
                                        );
                                      setPreviewImages(previewUrls);
                                      setPreviewIndex(index);
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    <img
                                      src={previewUrl}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border-2 border-orange-300 hover:border-orange-500 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  {/* Nút xóa preview */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePreviewFile("seller", index);
                                      URL.revokeObjectURL(previewUrl);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Xóa khỏi preview"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {/* Hiển thị placeholder cho slot trống */}
                            {Array.from({
                              length: 3 - previewFiles.seller.length,
                            }).map((_, index) => (
                              <div
                                key={`empty-preview-${index}`}
                                className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                              >
                                <span className="text-xs text-gray-400">
                                  Trống
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input chọn file - chỉ hiển thị khi còn slot */}
                      {contractPhotos.seller.length +
                        previewFiles.seller.length <
                        3 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileSelect(e, "seller")}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Còn{" "}
                            {3 -
                              (contractPhotos.seller.length +
                                previewFiles.seller.length)}{" "}
                            slot trống
                          </p>
                        </div>
                      )}

                      {/* Yêu cầu đủ 3 ảnh mỗi bên mới cho phép upload */}
                      <p className="text-xs text-gray-500">
                        Cần đủ các mặt của hợp đồng để có thể upload.
                      </p>

                      {contractPhotos.seller.length === 0 &&
                        previewFiles.seller.length === 0 && (
                          <div className="mb-3 text-xs text-gray-400">
                            Chưa có ảnh nào được chọn
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Bên Mua */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-3">
                    🟢 Bên Mua
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">Tên:</span>{" "}
                      {selectedAppointment.buyer?.name || "N/A"}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedAppointment.buyer?.email || "N/A"}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Số điện thoại:</span>{" "}
                      {selectedAppointment.buyer?.phone || "N/A"}
                    </p>
                  </div>

                  {/* Upload ảnh cho bên mua */}
                  {selectedAppointment.status === "CONFIRMED" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Upload ảnh hợp đồng (Bên Mua)
                      </h4>
                      {/* Hiển thị ảnh đã upload */}
                      {contractPhotos.buyer.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">
                            Ảnh đã upload ({contractPhotos.buyer.length}/3):
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {contractPhotos.buyer.map((photo, index) => {
                              const imageUrl = photo.startsWith("http")
                                ? photo
                                : `${api.defaults.baseURL || ""}${
                                    photo.startsWith("/") ? photo : "/" + photo
                                  }`;
                              return (
                                <div key={index} className="relative group">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() =>
                                      openImagePreview(
                                        contractPhotos.buyer,
                                        index
                                      )
                                    }
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Buyer photo ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
                                      onError={(e) => {
                                        console.error(
                                          "Error loading buyer image:",
                                          photo,
                                          "Full URL:",
                                          imageUrl
                                        );
                                        (e.target as HTMLImageElement).src =
                                          "https://via.placeholder.com/150?text=Error";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  {/* Nút xóa ảnh đã upload */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePhoto(photo, "buyer", index);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Xóa ảnh"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {/* Hiển thị placeholder cho slot trống */}
                            {Array.from({
                              length: 3 - contractPhotos.buyer.length,
                            }).map((_, index) => (
                              <div
                                key={`empty-${index}`}
                                className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                              >
                                <span className="text-xs text-gray-400">
                                  Trống
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preview ảnh chưa upload */}
                      {previewFiles.buyer.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-green-600 mb-2 font-medium">
                            Ảnh đã chọn (chưa upload) (
                            {previewFiles.buyer.length}/3):
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {previewFiles.buyer.map((file, index) => {
                              const previewUrl = createPreviewUrl(file);
                              return (
                                <div key={index} className="relative group">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const previewUrls =
                                        previewFiles.buyer.map((f) =>
                                          createPreviewUrl(f)
                                        );
                                      setPreviewImages(previewUrls);
                                      setPreviewIndex(index);
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    <img
                                      src={previewUrl}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border-2 border-green-300 hover:border-green-500 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  {/* Nút xóa preview */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePreviewFile("buyer", index);
                                      URL.revokeObjectURL(previewUrl);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Xóa khỏi preview"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {/* Hiển thị placeholder cho slot trống */}
                            {Array.from({
                              length: 3 - previewFiles.buyer.length,
                            }).map((_, index) => (
                              <div
                                key={`empty-preview-${index}`}
                                className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                              >
                                <span className="text-xs text-gray-400">
                                  Trống
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input chọn file - chỉ hiển thị khi còn slot */}
                      {contractPhotos.buyer.length + previewFiles.buyer.length <
                        3 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileSelect(e, "buyer")}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Còn{" "}
                            {3 -
                              (contractPhotos.buyer.length +
                                previewFiles.buyer.length)}{" "}
                            slot trống
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Cần đủ các mặt của hợp đồng để có thể upload.
                      </p>

                      {contractPhotos.buyer.length === 0 &&
                        previewFiles.buyer.length === 0 && (
                          <div className="mb-3 text-xs text-gray-400">
                            Chưa có ảnh nào được chọn
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Nút Upload chung cho cả 2 bên */}
              {selectedAppointment.status === "CONFIRMED" &&
                previewFiles.seller.length === 3 &&
                previewFiles.buyer.length === 3 && (
                  <div className="mt-4">
                    <button
                      onClick={handleUploadBothSides}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Upload ảnh
                    </button>
                  </div>
                )}

              {/* Ảnh hợp đồng đã ký khi hoàn thành */}
              {selectedAppointment.status === "COMPLETED" && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Ảnh hợp đồng đã ký
                  </h3>
                  {completedContractPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {completedContractPhotos.map((photo, index) => {
                        const imageUrl = photo.startsWith("http")
                          ? photo
                          : `${api.defaults.baseURL || ""}${
                              photo.startsWith("/") ? photo : "/" + photo
                            }`;
                        return (
                          <div key={index} className="relative group">
                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                openImagePreview(completedContractPhotos, index)
                              }
                            >
                              <img
                                src={imageUrl}
                                alt={`Contract photo ${index + 1}`}
                                className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                onError={(e) => {
                                  console.error(
                                    "Error loading contract image:",
                                    photo,
                                    "Full URL:",
                                    imageUrl
                                  );
                                  (e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/300x200?text=Error";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Không có ảnh hợp đồng.
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              {selectedAppointment.status === "CONFIRMED" && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={handleCancelTransaction}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Hủy giao dịch
                  </button>
                  <button
                    onClick={handleCompleteTransaction}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Hoàn thành giao dịch
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
};

export default AppointmentManagement;
