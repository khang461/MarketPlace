// src/pages/PostListingPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Upload, X, Eye, Send } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../config/api";

type ExistingPhoto = { url: string; kind?: string; publicId?: string };

const PostListingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = useMemo(() => new URLSearchParams(location.search).get("edit"), [location.search]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrefill, setIsLoadingPrefill] = useState<boolean>(!!editId);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    type: "",
    make: "",
    model: "",
    year: "",
    priceListed: "",

    // Vehicle Details (chung)
    mileageKm: "",
    batteryCapacityKWh: "",
    chargeCycles: "0",
    condition: "",

    // Car-only (mẫu hợp đồng)
    licensePlate: "",
    engineDisplacementCc: "",
    vehicleType: "",
    paintColor: "",
    engineNumber: "",
    chassisNumber: "",
    otherFeatures: "",

    // Location
    city: "",
    district: "",
    address: "",

    // Other
    tradeMethod: "meet",
    images: [] as File[],
  });

  // Ảnh preview cho ảnh mới
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  // Ảnh đã có trên server
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);

  /* ======================= Prefill khi edit ======================= */
  useEffect(() => {
    const fetchMine = async () => {
      if (!editId) return;
      try {
        setIsLoadingPrefill(true);
        const res = await api.get(`/listings/mine/${editId}`);
        const l = res.data;

        // map -> formData
        setFormData((prev) => ({
          ...prev,
          type: l.type ?? "",
          make: l.make ?? "",
          model: l.model ?? "",
          year: l.year ? String(l.year) : "",
          priceListed: l.priceListed != null ? String(l.priceListed) : "",

          mileageKm: l.mileageKm != null ? String(l.mileageKm) : "",
          batteryCapacityKWh: l.batteryCapacityKWh != null ? String(l.batteryCapacityKWh) : "",
          chargeCycles: l.chargeCycles != null ? String(l.chargeCycles) : "0",
          condition: l.condition ?? "",

          licensePlate: l.licensePlate ?? "",
          engineDisplacementCc: l.engineDisplacementCc != null ? String(l.engineDisplacementCc) : "",
          vehicleType: l.vehicleType ?? "",
          paintColor: l.paintColor ?? "",
          engineNumber: l.engineNumber ?? "",
          chassisNumber: l.chassisNumber ?? "",
          otherFeatures: l.otherFeatures ?? "",

          city: l.location?.city ?? "",
          district: l.location?.district ?? "",
          address: l.location?.address ?? "",

          tradeMethod: l.tradeMethod ?? "meet",
          images: [], // ảnh mới (nếu user chọn thêm)
        }));

        setExistingPhotos(Array.isArray(l.photos) ? l.photos : []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const msg = err?.response?.data?.message || "Không load được dữ liệu tin của bạn.";
        await Swal.fire({ icon: "error", title: "Lỗi tải dữ liệu", text: msg, confirmButtonColor: "#dc2626" });
        navigate("/account");
      } finally {
        setIsLoadingPrefill(false);
      }
    };

    fetchMine();
  }, [editId, navigate]);

  /* ======================= Validate theo bước ======================= */
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: {
        if (!formData.type) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng chọn loại sản phẩm", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (!formData.make.trim()) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập hãng", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (!formData.model.trim()) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập model", confirmButtonColor: "#2563eb" });
          return false;
        }
        const y = parseInt(formData.year);
        if (!formData.year || !Number.isFinite(y) || y < 1900 || y > 2025) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập năm sản xuất hợp lệ (1900-2025)", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (!formData.priceListed || parseFloat(formData.priceListed) <= 0) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập giá bán hợp lệ", confirmButtonColor: "#2563eb" });
          return false;
        }
        return true;
      }

      case 2: {
        if (formData.type === "Car") {
          if (formData.mileageKm === "" || parseFloat(formData.mileageKm) < 0) {
            Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập số km đã chạy", confirmButtonColor: "#2563eb" });
            return false;
          }
        }
        if (formData.type === "Battery") {
          if (!formData.batteryCapacityKWh || parseFloat(formData.batteryCapacityKWh) <= 0) {
            Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập dung lượng pin (kWh)", confirmButtonColor: "#2563eb" });
            return false;
          }
        }
        if (!formData.condition) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng chọn tình trạng", confirmButtonColor: "#2563eb" });
          return false;
        }
        return true;
      }

      case 3: {
        // Tạo mới: cần >= 3 ảnh.
        // Edit: cho phép bỏ qua; NHƯNG cảnh báo nếu tổng ảnh (cũ + mới) < 3 vì submit sẽ fail ở BE.
        if (!editId && formData.images.length < 3) {
          Swal.fire({ icon: "warning", title: "Thiếu hình ảnh!", text: "Vui lòng tải lên ít nhất 3 hình ảnh", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (editId && (existingPhotos.length + formData.images.length) < 3) {
          Swal.fire({
            icon: "info",
            title: "Cần tối thiểu 3 ảnh khi gửi duyệt",
            text: "Bạn có thể tiếp tục lưu nháp, nhưng khi gửi duyệt sẽ cần đủ 3 ảnh.",
            confirmButtonColor: "#2563eb"
          });
        }
        return true;
      }

      case 4: {
        if (!formData.city) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng chọn thành phố", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (!formData.district.trim()) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập quận/huyện", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (!formData.address.trim()) {
          Swal.fire({ icon: "warning", title: "Thiếu thông tin!", text: "Vui lòng nhập địa chỉ chi tiết", confirmButtonColor: "#2563eb" });
          return false;
        }
        if (!["meet", "ship", "consignment"].includes(formData.tradeMethod)) {
          Swal.fire({ icon: "warning", title: "Phương thức giao dịch!", text: "Hãy chọn meet/ship/consignment", confirmButtonColor: "#2563eb" });
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(4, currentStep + 1));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ======================= Upload ảnh mới ======================= */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...formData.images, ...files].slice(0, 10); // Max 10 ảnh mới
    setFormData((prev) => ({ ...prev, images: newImages }));

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls].slice(0, 10));
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: newImages }));
    setImagePreviewUrls(newPreviewUrls);
  };

  /* ======================= XÓA ẢNH CŨ (ĐÃ LƯU TRÊN SERVER) ======================= */
  const removeExistingPhoto = async (publicId?: string) => {
    if (!editId) return;
    if (!publicId) {
      Swal.fire({ icon: "error", title: "Không tìm thấy publicId ảnh", confirmButtonColor: "#dc2626" });
      return;
    }
    try {
      const ask = await Swal.fire({
        icon: "warning",
        title: "Xoá ảnh?",
        text: "Bạn chắc chắn muốn xoá ảnh này khỏi tin?",
        showCancelButton: true,
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ",
        confirmButtonColor: "#dc2626",
      });
      if (!ask.isConfirmed) return;

      // Gọi API BE: DELETE /listings/:id/photos/:publicId
      await api.delete(`/listings/${editId}/photos/${encodeURIComponent(publicId)}`);

      // Cập nhật UI
      setExistingPhotos((prev) => prev.filter((p) => p.publicId !== publicId));

      await Swal.fire({ icon: "success", title: "Đã xoá ảnh", timer: 1200, showConfirmButton: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không xoá được ảnh.";
      Swal.fire({ icon: "error", title: "Lỗi xoá ảnh", text: msg, confirmButtonColor: "#dc2626" });
    }
  };

  /* ======================= Submit ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let listingId = editId || "";

      // ---------- EDIT MODE ----------
      if (editId) {
        const fd = new FormData();

        // KHÓA type khi edit để tránh sai lệch BE (gửi nếu bạn thật sự muốn đổi)
        if (formData.type) fd.append("type", formData.type);
        if (formData.make) fd.append("make", formData.make);
        if (formData.model) fd.append("model", formData.model);
        if (formData.year) fd.append("year", formData.year);

        if (formData.batteryCapacityKWh) fd.append("batteryCapacityKWh", formData.batteryCapacityKWh);
        if (formData.mileageKm) fd.append("mileageKm", formData.mileageKm);
        if (formData.chargeCycles) fd.append("chargeCycles", formData.chargeCycles);

        if (formData.type === "Car") {
          if (formData.licensePlate) fd.append("licensePlate", formData.licensePlate);
          if (formData.engineDisplacementCc) fd.append("engineDisplacementCc", formData.engineDisplacementCc);
          if (formData.vehicleType) fd.append("vehicleType", formData.vehicleType);
          if (formData.paintColor) fd.append("paintColor", formData.paintColor);
          if (formData.engineNumber) fd.append("engineNumber", formData.engineNumber);
          if (formData.chassisNumber) fd.append("chassisNumber", formData.chassisNumber);
          if (formData.otherFeatures) fd.append("otherFeatures", formData.otherFeatures);
        }

        if (formData.condition) fd.append("condition", formData.condition);
        if (formData.priceListed) fd.append("priceListed", formData.priceListed);
        if (formData.tradeMethod) fd.append("tradeMethod", formData.tradeMethod);

        fd.append(
          "location",
          JSON.stringify({ city: formData.city, district: formData.district, address: formData.address })
        );

        // ảnh mới (nếu có)
        formData.images.forEach((img) => fd.append("photos", img));

        try {
          // ❗ KHÔNG set Content-Type, để browser tự thêm boundary
          await api.patch(`/listings/${editId}`, fd);

          await Swal.fire({
            icon: "success",
            title: "Cập nhật thành công!",
            text: "Tin của bạn đã được lưu.",
            confirmButtonColor: "#2563eb",
          });

          // Nếu tổng ảnh < 3 thì cảnh báo trước khi hỏi "Gửi duyệt"
          if ((existingPhotos.length + formData.images.length) < 3) {
            await Swal.fire({
              icon: "info",
              title: "Thiếu ảnh để gửi duyệt",
              text: "Tin chưa đủ 3 ảnh. Bạn cần bổ sung trước khi gửi duyệt.",
              confirmButtonColor: "#2563eb",
            });
            navigate("/account");
            return;
          }

          const ask = await Swal.fire({
            icon: "question",
            title: "Gửi duyệt ngay?",
            showCancelButton: true,
            confirmButtonText: "Gửi duyệt",
            cancelButtonText: "Để sau",
            confirmButtonColor: "#10b981",
          });

          if (ask.isConfirmed) {
            if (!editId) {
              await Swal.fire({
                icon: "error",
                title: "Lỗi!",
                text: "Không tìm thấy ID tin đăng để gửi duyệt.",
                confirmButtonColor: "#dc2626",
              });
              return;
            }
            try {
              await api.post(`/listings/${editId}/submit`, { commissionTermsAccepted: true });
              await Swal.fire({ icon: "success", title: "Đã gửi duyệt!", confirmButtonColor: "#2563eb" });
            } catch (error) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const msg = (error as any)?.response?.data?.message || "Không thể gửi duyệt tin đăng.";
              await Swal.fire({
                icon: "error",
                title: "Lỗi gửi duyệt!",
                text: msg,
                confirmButtonColor: "#dc2626",
              });
            }
          }

          navigate("/account");
          return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error("PATCH /listings/:id failed", err);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.errors?.[0]?.msg || // express-validator
            `HTTP ${err?.response?.status || ""} - Không rõ lỗi`;

          await Swal.fire({
            icon: "error",
            title: "Thao tác thất bại!",
            text: msg,
            confirmButtonColor: "#dc2626",
          });
          return;
        }
      }

      // ---------- CREATE MODE ----------
      const fd = new FormData();
      fd.append("type", formData.type);
      fd.append("make", formData.make);
      fd.append("model", formData.model);
      fd.append("year", formData.year);

      if (formData.batteryCapacityKWh) fd.append("batteryCapacityKWh", formData.batteryCapacityKWh);
      fd.append("mileageKm", formData.mileageKm || "0");
      fd.append("chargeCycles", formData.chargeCycles || "0");

      if (formData.type === "Car") {
        if (formData.licensePlate) fd.append("licensePlate", formData.licensePlate);
        if (formData.engineDisplacementCc) fd.append("engineDisplacementCc", formData.engineDisplacementCc);
        if (formData.vehicleType) fd.append("vehicleType", formData.vehicleType);
        if (formData.paintColor) fd.append("paintColor", formData.paintColor);
        if (formData.engineNumber) fd.append("engineNumber", formData.engineNumber);
        if (formData.chassisNumber) fd.append("chassisNumber", formData.chassisNumber);
        if (formData.otherFeatures) fd.append("otherFeatures", formData.otherFeatures);
      }

      fd.append("condition", formData.condition);
      fd.append("priceListed", formData.priceListed);
      fd.append("tradeMethod", formData.tradeMethod);
      fd.append("sellerConfirm", "true"); // theo yêu cầu BE

      // bắt buộc đồng ý điều khoản & phí hoa hồng
      fd.append("commissionTermsAccepted", "true");

      fd.append(
        "location",
        JSON.stringify({ city: formData.city, district: formData.district, address: formData.address })
      );

      formData.images.forEach((img) => fd.append("photos", img));

      // ❗ KHÔNG set Content-Type ở đây (để browser tự set)
      const createResponse = await api.post("/listings", fd);

      // Lấy listingId từ response (hỗ trợ nhiều cấu trúc response)
      listingId = createResponse.data?._id || createResponse.data?.data?._id || createResponse.data?.listing?._id || "";

      // Validate listingId
      if (!listingId) {
        console.error("Create listing response:", createResponse.data);
        await Swal.fire({
          icon: "error",
          title: "Lỗi tạo tin đăng!",
          text: "Không nhận được ID tin đăng từ server. Vui lòng thử lại.",
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      const result = await Swal.fire({
        icon: "success",
        title: "Tạo tin đăng thành công!",
        html: `
          <p class="mb-4">Tin đăng đã được lưu thành công!</p>
          <p class="text-sm text-gray-600">Bạn muốn làm gì tiếp theo?</p>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-paper-plane"></i> Gửi duyệt ngay',
        denyButtonText: '<i class="fas fa-eye"></i> Xem tin đăng',
        cancelButtonText: "Về trang tài khoản",
        confirmButtonColor: "#10b981",
        denyButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
      });

      if (result.isConfirmed) {
        try {
          if (!listingId) {
            throw new Error("Không có ID tin đăng để gửi duyệt");
          }
          await api.post(`/listings/${listingId}/submit`, { commissionTermsAccepted: true });
          await Swal.fire({
            icon: "success",
            title: "Đã gửi duyệt!",
            text: "Tin đăng đã được gửi cho admin duyệt.",
            confirmButtonColor: "#2563eb",
          });
          navigate("/account");
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = (error as any)?.response?.data?.message || "Tin đã tạo nhưng gửi duyệt thất bại.";
          await Swal.fire({ icon: "error", title: "Lỗi gửi duyệt!", text: msg, confirmButtonColor: "#dc2626" });
          navigate("/account");
        }
      } else if (result.isDenied) {
        if (listingId) {
          navigate(`/vehicle/${listingId}`);
        } else {
          navigate("/account");
        }
      } else {
        navigate("/account");
      }
    } catch (error) {
      console.error("Save listing error:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Đã có lỗi xảy ra. Vui lòng thử lại!";
      await Swal.fire({ icon: "error", title: "Thao tác thất bại!", text: errorMessage, confirmButtonColor: "#dc2626" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ======================= UI ======================= */
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Thông tin cơ bản</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại sản phẩm *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!!editId} // 🔒 Khóa khi đang edit
                  title={editId ? "Không thể đổi loại khi chỉnh sửa" : undefined}
                >
                  <option value="">Chọn loại sản phẩm</option>
                  <option value="Car">Ô tô điện</option>
                  <option value="Battery">Pin xe điện</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hãng *</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="VD: VinFast, Toyota, Hyundai..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="VD: VF8, City, Camry..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Năm sản xuất *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="2024"
                  min={1900}
                  max={2025}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán *</label>
              <input
                type="number"
                name="priceListed"
                value={formData.priceListed}
                onChange={handleInputChange}
                placeholder="1200000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Đơn vị: VNĐ</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Thông số kỹ thuật</h2>

            {formData.type === "Car" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số km đã chạy *</label>
                    <input
                      type="number"
                      name="mileageKm"
                      value={formData.mileageKm}
                      onChange={handleInputChange}
                      placeholder="15000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại xe</label>
                    <input
                      type="text"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      placeholder="Sedan / SUV / Hatchback..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biển số</label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleInputChange}
                      placeholder="30G-12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dung tích xi lanh (cc)</label>
                    <input
                      type="number"
                      name="engineDisplacementCc"
                      value={formData.engineDisplacementCc}
                      onChange={handleInputChange}
                      placeholder="1500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Màu sơn</label>
                    <input
                      type="text"
                      name="paintColor"
                      value={formData.paintColor}
                      onChange={handleInputChange}
                      placeholder="Đỏ / Trắng / Đen..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số máy</label>
                    <input
                      type="text"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleInputChange}
                      placeholder="1NZ-123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số khung</label>
                    <input
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleInputChange}
                      placeholder="VN123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đặc điểm khác</label>
                  <textarea
                    name="otherFeatures"
                    value={formData.otherFeatures}
                    onChange={handleInputChange}
                    placeholder="Bản cao cấp, có sunroof..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {formData.type === "Battery" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dung lượng pin (kWh) *</label>
                    <input
                      type="number"
                      name="batteryCapacityKWh"
                      value={formData.batteryCapacityKWh}
                      onChange={handleInputChange}
                      placeholder="60"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số chu kỳ sạc</label>
                    <input
                      type="number"
                      name="chargeCycles"
                      value={formData.chargeCycles}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">Để trống nếu không biết</p>
                  </div>
                </div>
              </>
            )}

            {/* Condition (chung) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn tình trạng</option>
                  <option value="New">Mới</option>
                  <option value="LikeNew">Như mới</option>
                  <option value="Used">Đã qua sử dụng</option>
                  <option value="Worn">Cũ/nhiều hao mòn</option>
                </select>
              </div>

              {/* BatteryCapacity cho Car (không bắt buộc) */}
              {formData.type === "Car" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dung lượng pin (kWh)</label>
                  <input
                    type="number"
                    name="batteryCapacityKWh"
                    value={formData.batteryCapacityKWh}
                    onChange={handleInputChange}
                    placeholder="(Không bắt buộc)"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Hình ảnh</h2>

            {/* Ảnh đã có: thêm nút Xoá từng ảnh */}
            {editId && existingPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Ảnh hiện có ({existingPhotos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingPhotos.map((p, idx) => (
                    <div key={p.publicId || idx} className="relative">
                      <img src={p.url} alt={`existing-${idx}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(p.publicId)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Xoá ảnh này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  *Bạn có thể xoá ảnh cũ bằng nút dấu <b>X</b> trên mỗi ảnh. Ảnh mới tải lên sẽ <b>được thêm</b> vào danh sách.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tải lên hình ảnh {editId ? "(Tối đa 10 ảnh mới)" : "(Tối đa 10 ảnh)"} {editId ? "" : "*"}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Kéo thả hoặc click để tải ảnh lên —{" "}
                  {!editId ? <strong>cần tối thiểu 3 ảnh</strong> : "không bắt buộc thêm ảnh khi chỉnh sửa"}
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                >
                  Chọn ảnh
                </label>
              </div>
            </div>

            {/* Image Previews (ảnh mới) */}
            {imagePreviewUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Ảnh mới sẽ thêm ({imagePreviewUrls.length}/10)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Bỏ ảnh này khỏi lần tải lên"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Thông tin liên hệ</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn thành phố</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP.HCM">TP.HCM</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện *</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="VD: Cầu Giấy, Quận 1..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ chi tiết *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Số nhà, tên đường..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức giao dịch *</label>
              <select
                name="tradeMethod"
                value={formData.tradeMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="meet">Gặp mặt trực tiếp</option>
                <option value="ship">Gửi vận chuyển</option>
                <option value="consignment">Ký gửi</option>
              </select>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Xem trước tin đăng</h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Loại:</strong>{" "}
                  {formData.type === "Car" ? "Ô tô điện" : formData.type === "Battery" ? "Pin xe điện" : "Chưa chọn"}
                </p>
                <p>
                  <strong>Giá:</strong>{" "}
                  {formData.priceListed
                    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        Number(formData.priceListed)
                      )
                    : "Chưa nhập"}
                </p>
                <p>
                  <strong>Hãng:</strong> {formData.make || "Chưa nhập"} - <strong>Model:</strong> {formData.model || "Chưa nhập"}
                </p>
                <p>
                  <strong>Năm:</strong> {formData.year || "Chưa nhập"} - <strong>Địa điểm:</strong> {formData.city || "Chưa nhập"}
                </p>
                <p>
                  <strong>Tình trạng:</strong> {formData.condition || "Chưa chọn"}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {editId ? "Chỉnh sửa tin bán xe điện" : "Đăng tin bán xe điện"}
          </h1>
          <p className="text-gray-600">
            {editId ? "Cập nhật thông tin tin đăng của bạn" : "Điền thông tin chi tiết để thu hút nhiều khách hàng hơn"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && <div className={`w-12 h-1 mx-2 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-600">
            <span>Thông tin cơ bản</span>
            <span>Chi tiết kỹ thuật</span>
            <span>Hình ảnh</span>
            <span>Liên hệ</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {isLoadingPrefill ? (
            <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {renderStep()}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={currentStep === 1}
                >
                  Quay lại
                </button>

                <div className="flex space-x-3">
                  {currentStep === 4 ? (
                    <>
                      <button
                        type="button"
                        className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 flex items-center space-x-2"
                        onClick={() => setCurrentStep(1)}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem lại</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2 ${
                          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmitting ? (editId ? "Đang lưu..." : "Đang đăng...") : editId ? "Lưu thay đổi" : "Đăng tin"}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Tiếp tục
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostListingPage;
