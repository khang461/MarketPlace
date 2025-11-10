/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar, Clock, MapPin, User, Car, Eye, CheckCircle, XCircle,
  FileText, ChevronDown, Image as ImageIcon, Trash2
} from "lucide-react";
import api from "../../config/api";
import Swal from "sweetalert2";
import ImagePreviewModal from "../../components/ImagePreviewModal";

type ContractStatus = "SIGNED" | "COMPLETED" | "CANCELLED";

interface ContractPhoto {
  url: string;
  publicId?: string;
  uploadedAt?: string;
  description?: string;
  _id?: string;
}

interface ContractItem {
  _id: string;
  appointmentId: { _id: string; scheduledDate: string; status: ContractStatus };
  depositRequestId?: string | null;
  buyerId: { _id: string; email: string; phone: string };
  sellerId: { _id: string; email: string; phone: string };
  listingId?: { _id: string; model?: string; year?: number };
  contractNumber: string;
  contractDate: string;

  // display-friendly names/addresses from API
  buyerName: string;
  buyerIdNumber?: string;
  buyerAddress?: string;

  sellerName: string;
  sellerIdNumber?: string;
  sellerAddress?: string;

  // vehicle
  vehicleBrand: string;
  vehicleModel: string;
  vehicleType?: string;
  vehicleColor?: string;
  manufactureYear: number;

  // money
  purchasePrice: number;
  depositAmount: number;

  // status
  status: ContractStatus;
  signedAt?: string;
  completedAt?: string;

  // media
  contractPhotos: ContractPhoto[];

  // staff
  staffId: string;
  staffName: string;

  createdAt: string;
  updatedAt: string;
}

const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<"all" | ContractStatus>("all");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const [selected, setSelected] = useState<ContractItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // image preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // local preview before upload (hai bên: seller/buyer – vẫn giữ UI giống trang cũ)
  const [previewFiles, setPreviewFiles] = useState<{ seller: File[]; buyer: File[] }>({ seller: [], buyer: [] });

  useEffect(() => { fetchContracts(); }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (dropdownOpen && !target.closest(".dropdown-menu-container")) setDropdownOpen(null);
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [dropdownOpen]);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get("/contracts");
      if (res.data?.success) {
        const list: ContractItem[] = (res.data.data || []).map((c: any) => ({
          ...c,
          // đảm bảo các field tồn tại
          appointmentId: c.appointmentId || {},
          contractPhotos: Array.isArray(c.contractPhotos) ? c.contractPhotos : [],
        }));
        setContracts(list);
      } else {
        setError(res.data?.message || "Không thể tải danh sách hợp đồng");
      }
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi tải dữ liệu hợp đồng");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("vi-VN", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit"
        })
      : "N/A";

  const getStatusBadge = (status: ContractStatus) => {
    const config: Record<ContractStatus, { color: string; icon: any; label: string }> = {
      SIGNED:     { color: "bg-yellow-100 text-yellow-800", icon: Clock,      label: "Chờ hoàn tất" },
      COMPLETED:  { color: "bg-green-100 text-green-800",   icon: CheckCircle, label: "Đã hoàn thành" },
      CANCELLED:  { color: "bg-red-100 text-red-800",       icon: XCircle,     label: "Đã hủy" },
    };
    const Icon = config[status].icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status].color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config[status].label}
      </span>
    );
  };

  const filtered = useMemo(
    () => contracts.filter(c => filterStatus === "all" || c.status === filterStatus),
    [contracts, filterStatus]
  );

  const toggleDropdown = (id: string) => setDropdownOpen(dropdownOpen === id ? null : id);

  const openModal = (c: ContractItem) => { setSelected(c); setIsModalOpen(true); };
  const closeModal = () => {
    // revoke local preview urls
    previewFiles.seller.forEach(f => URL.revokeObjectURL(URL.createObjectURL(f)));
    previewFiles.buyer.forEach(f => URL.revokeObjectURL(URL.createObjectURL(f)));
    setPreviewFiles({ seller: [], buyer: [] });
    setSelected(null);
    setIsModalOpen(false);
  };

  const openImagePreview = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  // === Upload ảnh 2 bên (giữ logic “đủ 3 + 3”) ===
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: "seller" | "buyer") => {
    const files = e.target.files;
    if (!files?.length) return;
    const current = previewFiles[side] || [];
    const incoming = Array.from(files);
    if (current.length + incoming.length > 3) {
      Swal.fire({ icon: "warning", title: "Chưa hợp lệ", text: "Mỗi bên tối đa 3 ảnh.", confirmButtonColor: "#2563eb" });
      return;
    }
    setPreviewFiles(prev => ({ ...prev, [side]: [...current, ...incoming].slice(0,3) }));
    e.target.value = "";
  };

  const handleRemovePreviewFile = (side: "seller" | "buyer", index: number) => {
    setPreviewFiles(prev => ({ ...prev, [side]: prev[side].filter((_, i) => i !== index) }));
  };

  const handleUploadBothSides = async () => {
    if (!selected) return;
    const sellerFiles = previewFiles.seller, buyerFiles = previewFiles.buyer;
    if (sellerFiles.length !== 3 || buyerFiles.length !== 3) {
      Swal.fire({ icon: "warning", title: "Chưa đủ ảnh", text: "Cần đủ 3 ảnh bên bán và 3 ảnh bên mua.", confirmButtonColor: "#2563eb" });
      return;
    }
    try {
      const fd = new FormData();
      sellerFiles.forEach(f => fd.append("photos", f));
      buyerFiles.forEach(f => fd.append("photos", f));
      fd.append("description", "Ảnh hợp đồng đã ký");
      // Giữ nguyên endpoint cũ (upload theo appointmentId)
      await api.post(`/contracts/${selected.appointmentId?._id}/upload-photos`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({ icon: "success", title: "Đã upload ảnh", timer: 1500, showConfirmButton: false });
      setPreviewFiles({ seller: [], buyer: [] });
      await fetchContracts();
      // refresh selected
      setSelected(prev => prev ? (contracts.find(c => c._id === prev._id) || prev) : prev);
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Upload thất bại", text: err?.response?.data?.message || "Vui lòng thử lại.", confirmButtonColor: "#2563eb" });
    }
  };

  const handleDeletePhoto = async (_url: string, _side: "seller" | "buyer", _index: number) => {
    const ok = await Swal.fire({
      title: "Xóa ảnh?", text: "Bạn có chắc muốn xóa ảnh này?",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc3545", cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa", cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed || !selected) return;
    // TODO: nếu backend có endpoint xóa ảnh riêng, gọi vào đây
    // Tạm thời chỉ refresh lại list cho đơn giản
    await fetchContracts();
    setSelected(contracts.find(c => c._id === selected._id) || selected);
    Swal.fire({ icon: "success", title: "Đã xóa ảnh", timer: 1200, showConfirmButton: false });
  };

  const handleComplete = async () => {
    if (!selected) return;
    try {
      await api.post(`/contracts/${selected.appointmentId?._id}/complete`);
      Swal.fire({ icon: "success", title: "Hoàn thành giao dịch", timer: 1800, showConfirmButton: false });
      await fetchContracts();
      closeModal();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Lỗi", text: err?.response?.data?.message || "Không thể hoàn thành.", confirmButtonColor: "#2563eb" });
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    const { value: formData } = await Swal.fire({
      title: "Hủy giao dịch", width: 520,
      html: `
        <div style="text-align:left">
          <label class="block text-sm font-medium text-gray-700 mb-2">Lý do hủy:</label>
          <textarea id="cancelReason" style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:8px;min-height:100px"></textarea>
          <p class="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-3">
            ⚠️ 80% tiền cọc sẽ hoàn cho người mua, 20% giữ làm phí hủy.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận hủy",
      confirmButtonColor: "#dc3545",
      cancelButtonText: "Đóng",
      preConfirm: () => {
        const reason = (document.getElementById("cancelReason") as HTMLTextAreaElement)?.value?.trim();
        if (!reason) {
          Swal.showValidationMessage("Vui lòng nhập lý do hủy");
          return false;
        }
        return { reason };
      },
    });
    if (!formData) return;
    try {
      await api.post(`/contracts/${selected.appointmentId?._id}/cancel`, formData);
      Swal.fire({ icon: "success", title: "Đã hủy giao dịch", timer: 2000, showConfirmButton: false });
      await fetchContracts();
      closeModal();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Lỗi", text: err?.response?.data?.message || "Không thể hủy.", confirmButtonColor: "#2563eb" });
    }
  };

  const createPlaceholder = (n = 80) => ".".repeat(n);

  // In hợp đồng (đổ dữ liệu từ contract luôn – không phụ thuộc nữa vào contract/appointment khác)
  const generateContractWithData = (c: ContractItem) => {
    const remaining = Math.max(0, (c.purchasePrice || 0) - (c.depositAmount || 0));
    const html = `
<div style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.6;max-width:800px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:30px;">
    <p style="font-weight:bold;font-size:16pt;margin:0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight:bold;font-size:14pt;margin:5px 0;">Độc lập - Tự do - Hạnh phúc</p>
    <p style="font-weight:bold;font-size:18pt;margin:20px 0;text-transform:uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
  </div>

  <p style="margin-bottom: 20px;">Hôm nay, ngày ${new Date().toLocaleDateString("vi-VN")} tại ${createPlaceholder(40)}, chúng tôi gồm có:</p>

  <p style="font-weight:bold;text-transform:uppercase;margin:20px 0 10px;">BÊN BÁN (BÊN A):</p>
  <p>Ông/Bà: ${(c.sellerName || "N/A").toUpperCase()} <span style="margin-left:20px;">Sinh ngày: ${createPlaceholder(15)}</span></p>
  <p>CMND/CCCD: ${c.sellerIdNumber || "N/A"} <span style="margin-left:20px;">Cấp ngày: ${createPlaceholder(15)}</span> <span style="margin-left:20px;">Tại: ${createPlaceholder(30)}</span></p>
  <p>Địa chỉ: ${c.sellerAddress || "N/A"}</p>

  <p style="font-weight:bold;text-transform:uppercase;margin:20px 0 10px;">BÊN MUA (BÊN B):</p>
  <p>Ông/Bà: ${(c.buyerName || "N/A").toUpperCase()} <span style="margin-left:20px;">Sinh ngày: ${createPlaceholder(15)}</span></p>
  <p>CMND/CCCD: ${c.buyerIdNumber || "N/A"} <span style="margin-left:20px;">Cấp ngày: ${createPlaceholder(15)}</span> <span style="margin-left:20px;">Tại: ${createPlaceholder(30)}</span></p>
  <p>Địa chỉ: ${c.buyerAddress || "N/A"}</p>

  <p style="margin:20px 0;">Hai bên đồng ý thực hiện việc mua bán xe với các điều khoản sau:</p>

  <p style="font-weight:bold;text-transform:uppercase;margin:20px 0 10px;">ĐIỀU 1. THÔNG TIN XE</p>
  <p>Hãng: ${(c.vehicleBrand || "N/A").toUpperCase()} — Mẫu: ${(c.vehicleModel || "N/A")} — Năm: ${c.manufactureYear || "N/A"} — Màu: ${c.vehicleColor || "N/A"}</p>
  <p>Số máy: ${createPlaceholder(20)} — Số khung: ${createPlaceholder(20)} — Biển số: ${createPlaceholder(15)}</p>

  <p style="font-weight:bold;text-transform:uppercase;margin:20px 0 10px;">ĐIỀU 2. GIÁ & THANH TOÁN</p>
  <p>Giá mua: <b>${(c.purchasePrice || 0).toLocaleString("vi-VN")} VNĐ</b></p>
  <p>Đặt cọc: <b>${(c.depositAmount || 0).toLocaleString("vi-VN")} VNĐ</b></p>
  <p>Còn lại: <b>${remaining.toLocaleString("vi-VN")} VNĐ</b></p>

  <p style="font-weight:bold;text-transform:uppercase;margin:20px 0 10px;">ĐIỀU 3. THỜI GIAN & ĐỊA ĐIỂM</p>
  <p>Thời gian giao xe: ${formatDateTime(c.appointmentId?.scheduledDate)}</p>
  <p>Địa điểm: ${createPlaceholder(50)}</p>

  <div style="display:flex;justify-content:space-between;margin-top:50px;text-align:center;">
    <div style="width:45%;">
      <p style="font-weight:bold;text-transform:uppercase;margin:0;">BÊN A</p>
      <p>(Ký, ghi rõ họ tên)</p>
      <p style="margin-top:60px;font-weight:bold;">${(c.sellerName || "N/A").toUpperCase()}</p>
    </div>
    <div style="width:45%;">
      <p style="font-weight:bold;text-transform:uppercase;margin:0;">BÊN B</p>
      <p>(Ký, ghi rõ họ tên)</p>
      <p style="margin-top:60px;font-weight:bold;">${(c.buyerName || "N/A").toUpperCase()}</p>
    </div>
  </div>
</div>
    `.trim();
    printHTML(html);
    setDropdownOpen(null);
  };

  const generateEmptyContract = () => {
    const html = `
<div style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.6;max-width:800px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:30px;">
    <p style="font-weight:bold;font-size:16pt;margin:0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight:bold;font-size:14pt;margin:5px 0;">Độc lập - Tự do - Hạnh phúc</p>
    <p style="font-weight:bold;font-size:18pt;margin:20px 0;text-transform:uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
  </div>
  ${"".padEnd(600, "• ")}
</div>
    `.trim();
    printHTML(html);
    setDropdownOpen(null);
  };

  const printHTML = (content: string) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head>
        <title>Hợp đồng mua bán xe</title>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family:'Times New Roman',serif; font-size:14pt; line-height:1.6; margin:2cm; }
          p { margin:0 0 5px 0; }
        </style>
      </head><body>${content}</body></html>
    `);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  // ===== UI =====

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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hợp đồng</h1>
          <p className="text-gray-600 mt-1">Danh sách hợp đồng ký với khách hàng</p>
        </div>
        <button onClick={fetchContracts} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Làm mới
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="SIGNED">Chờ hoàn tất</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <span className="text-sm text-gray-500">
            Hiển thị {filtered.length} / {contracts.length} hợp đồng
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người mua</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người bán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian ký</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Không có hợp đồng nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Car className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {`${c.vehicleBrand || ""} ${c.vehicleModel || ""} ${c.manufactureYear || ""}`.trim() || "Thông tin xe"}
                          </div>
                          <div className="text-xs text-gray-500">Số HĐ: {c.contractNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{c.buyerName || "N/A"}</div>
                          <div className="text-xs text-gray-500">{c.buyerId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{c.sellerName || "N/A"}</div>
                          <div className="text-xs text-gray-500">{c.sellerId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDateTime(c.appointmentId?.scheduledDate)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">—</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openModal(c)} className="text-blue-600 hover:text-blue-900 flex items-center">
                          <Eye className="w-4 h-4 mr-1" /> Xem chi tiết
                        </button>

                        {c.status !== "CANCELLED" && (
                          <div className="relative dropdown-menu-container">
                            <button onClick={() => toggleDropdown(c._id)} className="text-green-600 hover:text-green-900 flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              In hợp đồng
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            {dropdownOpen === c._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={(e) => { e.stopPropagation(); generateContractWithData(c); }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <FileText className="w-4 h-4 mr-3" /> Hợp đồng có dữ liệu
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); generateEmptyContract(); }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <FileText className="w-4 h-4 mr-3" /> Hợp đồng trắng
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
            <div className="text-2xl font-bold text-yellow-600">{contracts.filter(c => c.status === "SIGNED").length}</div>
            <div className="text-sm text-gray-600">Chờ hoàn tất</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{contracts.filter(c => c.status === "COMPLETED").length}</div>
            <div className="text-sm text-gray-600">Đã hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{contracts.filter(c => c.status === "CANCELLED").length}</div>
            <div className="text-sm text-gray-600">Đã hủy</div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết hợp đồng</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Xe */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin xe</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Xe:</span> {selected.vehicleBrand} {selected.vehicleModel} {selected.manufactureYear}</p>
                    <p><span className="font-medium">Màu:</span> {selected.vehicleColor || "N/A"}</p>
                    <p><span className="font-medium">Thời gian hẹn:</span> {formatDateTime(selected.appointmentId?.scheduledDate)}</p>
                  </div>
                </div>
                {/* Tiền */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin giao dịch</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Giá xe:</span> {(selected.purchasePrice || 0).toLocaleString("vi-VN")} VNĐ</p>
                    <p><span className="font-medium">Đặt cọc:</span> {(selected.depositAmount || 0).toLocaleString("vi-VN")} VNĐ</p>
                    <p><span className="font-medium">Còn lại:</span> {Math.max(0, (selected.purchasePrice||0)-(selected.depositAmount||0)).toLocaleString("vi-VN")} VNĐ</p>
                    <p><span className="font-medium">Trạng thái HĐ:</span> {getStatusBadge(selected.status)}</p>
                  </div>
                </div>
              </div>

              {/* Hai bên */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3">🟠 Bên Bán</h3>
                  <div className="bg-orange-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700"><span className="font-medium">Tên:</span> {selected.sellerName}</p>
                    <p className="text-gray-700"><span className="font-medium">Email:</span> {selected.sellerId?.email}</p>
                    <p className="text-gray-700"><span className="font-medium">SĐT:</span> {selected.sellerId?.phone}</p>
                  </div>

                  {selected.status === "SIGNED" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Upload ảnh hợp đồng (Bên Bán)</h4>

                      {/* ảnh đã có */}
                      {selected.contractPhotos?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-2">Ảnh đã upload: </p>
                          <div className="grid grid-cols-3 gap-2">
                            {selected.contractPhotos.slice(0,3).map((p, idx) => (
                              <div key={`seller-u-${idx}`} className="relative group">
                                <div className="cursor-pointer" onClick={() => openImagePreview(selected.contractPhotos.map(x => x.url), idx)}>
                                  <img
                                    src={p.url}
                                    className="w-full h-24 object-cover rounded-lg border-2 border-orange-200 hover:border-orange-400"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                </div>
                                <button onClick={(e)=>{e.stopPropagation();handleDeletePhoto(p.url,"seller",idx);}}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-lg"
                                  title="Xóa ảnh">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* preview chọn mới */}
                      {previewFiles.seller.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-orange-600 mb-2 font-medium">Ảnh đã chọn (chưa upload) ({previewFiles.seller.length}/3)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {previewFiles.seller.map((file, idx) => {
                              const url = URL.createObjectURL(file);
                              return (
                                <div key={`seller-p-${idx}`} className="relative group">
                                  <div className="cursor-pointer" onClick={() => { setPreviewImages(previewFiles.seller.map(f => URL.createObjectURL(f))); setPreviewIndex(idx); setIsPreviewOpen(true); }}>
                                    <img src={url} className="w-full h-24 object-cover rounded-lg border-2 border-orange-300 hover:border-orange-500" />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                  </div>
                                  <button className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-lg"
                                    onClick={(e)=>{e.stopPropagation(); handleRemovePreviewFile("seller", idx); URL.revokeObjectURL(url);}}>
                                    <Trash2 className="w-3 h-3"/>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {previewFiles.seller.length < 3 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                          <input type="file" accept="image/*" multiple
                            onChange={(e) => handleFileSelect(e, "seller")}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                          <p className="text-xs text-gray-400 mt-1">Tối đa 3 ảnh</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-3">🟢 Bên Mua</h3>
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700"><span className="font-medium">Tên:</span> {selected.buyerName}</p>
                    <p className="text-gray-700"><span className="font-medium">Email:</span> {selected.buyerId?.email}</p>
                    <p className="text-gray-700"><span className="font-medium">SĐT:</span> {selected.buyerId?.phone}</p>
                  </div>

                  {selected.status === "SIGNED" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Upload ảnh hợp đồng (Bên Mua)</h4>

                      {/* ảnh đã có */}
                      {selected.contractPhotos?.length > 3 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-2">Ảnh đã upload:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {selected.contractPhotos.slice(3,6).map((p, idx) => (
                              <div key={`buyer-u-${idx}`} className="relative group">
                                <div className="cursor-pointer" onClick={() => openImagePreview(selected.contractPhotos.map(x => x.url), 3+idx)}>
                                  <img src={p.url} className="w-full h-24 object-cover rounded-lg border-2 border-green-200 hover:border-green-400" />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                </div>
                                <button onClick={(e)=>{e.stopPropagation();handleDeletePhoto(p.url,"buyer",idx);}}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-lg"
                                  title="Xóa ảnh">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* preview chọn mới */}
                      {previewFiles.buyer.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-green-600 mb-2 font-medium">Ảnh đã chọn (chưa upload) ({previewFiles.buyer.length}/3)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {previewFiles.buyer.map((file, idx) => {
                              const url = URL.createObjectURL(file);
                              return (
                                <div key={`buyer-p-${idx}`} className="relative group">
                                  <div className="cursor-pointer" onClick={() => { setPreviewImages(previewFiles.buyer.map(f => URL.createObjectURL(f))); setPreviewIndex(idx); setIsPreviewOpen(true); }}>
                                    <img src={url} className="w-full h-24 object-cover rounded-lg border-2 border-green-300 hover:border-green-500" />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                  </div>
                                  <button className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-lg"
                                    onClick={(e)=>{e.stopPropagation(); handleRemovePreviewFile("buyer", idx); URL.revokeObjectURL(url);}}>
                                    <Trash2 className="w-3 h-3"/>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {previewFiles.buyer.length < 3 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                          <input type="file" accept="image/*" multiple
                            onChange={(e) => handleFileSelect(e, "buyer")}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                          <p className="text-xs text-gray-400 mt-1">Tối đa 3 ảnh</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Nút upload chung */}
              {selected.status === "SIGNED" && previewFiles.seller.length === 3 && previewFiles.buyer.length === 3 && (
                <div className="mt-4">
                  <button onClick={handleUploadBothSides} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                    Upload ảnh
                  </button>
                </div>
              )}

              {/* Ảnh hợp đồng đã ký (mọi trạng thái đều hiển thị nếu có) */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ảnh hợp đồng đã ký</h3>
                {selected.contractPhotos?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selected.contractPhotos.map((p, idx) => (
                      <div key={p._id || idx} className="relative group">
                        <div className="cursor-pointer" onClick={() => openImagePreview(selected.contractPhotos.map(x=>x.url), idx)}>
                          <img
                            src={p.url}
                            className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all pointer-events-none">
                            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Không có ảnh hợp đồng.</div>
                )}
              </div>

              {/* Action buttons */}
              {selected.status === "SIGNED" && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button onClick={handleCancel} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Hủy giao dịch</button>
                  <button onClick={handleComplete} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Hoàn thành giao dịch</button>
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

export default ContractManagement;
