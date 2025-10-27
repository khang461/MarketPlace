import React, { useState } from "react";
import { Upload, X, Eye, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../config/api";

const PostListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    type: "",
    make: "",
    model: "",
    year: "",
    priceListed: "",

    // Vehicle Details
    mileageKm: "",
    batteryCapacityKWh: "",
    chargeCycles: "0",
    condition: "",

    // Location
    city: "",
    district: "",
    address: "",

    // Other
    tradeMethod: "meet",
    images: [] as File[],
  });

  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Validation function for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Bước 1: Thông tin cơ bản
        if (!formData.type) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng chọn loại sản phẩm",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (!formData.make.trim()) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập hãng xe",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (!formData.model.trim()) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập mẫu xe",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (
          !formData.year ||
          parseInt(formData.year) < 2000 ||
          parseInt(formData.year) > 2025
        ) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập năm sản xuất hợp lệ (2000-2025)",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (!formData.priceListed || parseFloat(formData.priceListed) <= 0) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập giá bán hợp lệ",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        return true;

      case 2:
        // Bước 2: Thông số kỹ thuật
        if (
          formData.type === "Car" &&
          (!formData.mileageKm || parseFloat(formData.mileageKm) < 0)
        ) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập số km đã chạy",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (
          !formData.batteryCapacityKWh ||
          parseFloat(formData.batteryCapacityKWh) <= 0
        ) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập dung lượng pin",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (!formData.condition) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng chọn tình trạng",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        return true;

      case 3:
        // Bước 3: Hình ảnh
        if (formData.images.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng tải lên ít nhất 1 hình ảnh",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        return true;

      case 4:
        // Bước 4: Liên hệ
        if (!formData.city) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng chọn thành phố",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (!formData.district.trim()) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập quận/huyện",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        if (!formData.address.trim()) {
          Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin!",
            text: "Vui lòng nhập địa chỉ chi tiết",
            confirmButtonColor: "#2563eb",
          });
          return false;
        }
        return true;

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...formData.images, ...files].slice(0, 10); // Max 10 images

    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls].slice(0, 10));
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
    setImagePreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Step 1: Tạo listing (POST /api/listings)
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("type", formData.type);
      formDataToSend.append("make", formData.make);
      formDataToSend.append("model", formData.model);
      formDataToSend.append("year", formData.year);
      formDataToSend.append("batteryCapacityKWh", formData.batteryCapacityKWh);
      formDataToSend.append("mileageKm", formData.mileageKm || "0");
      formDataToSend.append("chargeCycles", formData.chargeCycles || "0");
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("priceListed", formData.priceListed);
      formDataToSend.append("tradeMethod", formData.tradeMethod);
      formDataToSend.append("sellerConfirm", "true");

      // Location fields
      formDataToSend.append("location[city]", formData.city);
      formDataToSend.append("location[district]", formData.district);
      formDataToSend.append("location[address]", formData.address);

      // Append images
      formData.images.forEach((image) => {
        formDataToSend.append("photos", image);
      });

      // Create listing
      const createResponse = await api.post("/listings", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const listingId = createResponse.data._id;

      // Success - Cho user chọn xem tin hoặc gửi duyệt luôn
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
        // User chọn gửi duyệt ngay
        try {
          await api.post(`/listings/${listingId}/submit`);

          await Swal.fire({
            icon: "success",
            title: "Đã gửi duyệt!",
            text: "Tin đăng đã được gửi cho admin duyệt. Chúng tôi sẽ xem xét trong vòng 24h.",
            confirmButtonColor: "#2563eb",
          });

          navigate("/account");
        } catch (error) {
          console.error("Error submitting listing:", error);

          await Swal.fire({
            icon: "error",
            title: "Lỗi gửi duyệt!",
            text: "Tin đăng đã được tạo nhưng không thể gửi duyệt. Vui lòng thử lại từ trang Tài khoản.",
            confirmButtonColor: "#dc2626",
          });

          navigate("/account");
        }
      } else if (result.isDenied) {
        // User chọn xem tin đăng
        navigate(`/vehicle/${listingId}`);
      } else {
        // User chọn về trang tài khoản
        navigate("/account");
      }
    } catch (error) {
      console.error("Error creating listing:", error);

      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Đã có lỗi xảy ra khi đăng tin. Vui lòng thử lại!";

      await Swal.fire({
        icon: "error",
        title: "Đăng tin thất bại!",
        text: errorMessage,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Thông tin cơ bản</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại sản phẩm *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn loại sản phẩm</option>
                  <option value="Car">Ô tô điện</option>
                  <option value="Battery">Pin xe điện</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hãng *
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="VD: VinFast, Honda, Toyota..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mẫu xe *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="VD: VF8 Plus, City, Camry..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm sản xuất *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="2024"
                  min="2000"
                  max="2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá bán *
              </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số km đã chạy *
                </label>
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dung lượng pin (kWh) *
                </label>
                <input
                  type="number"
                  name="batteryCapacityKWh"
                  value={formData.batteryCapacityKWh}
                  onChange={handleInputChange}
                  placeholder="87.7"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tình trạng *
                </label>
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
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số chu kỳ sạc
              </label>
              <input
                type="number"
                name="chargeCycles"
                value={formData.chargeCycles}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Để trống nếu không biết
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Hình ảnh</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tải lên hình ảnh (Tối đa 10 ảnh) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Kéo thả hoặc click để tải ảnh lên
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

            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Ảnh đã tải lên ({imagePreviewUrls.length}/10)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành phố *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận/Huyện *
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ chi tiết *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức giao dịch *
              </label>
              <select
                name="tradeMethod"
                value={formData.tradeMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="meet">Gặp mặt trực tiếp</option>
                <option value="post">Gửi qua bưu điện</option>
              </select>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Xem trước tin đăng</h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Loại:</strong>{" "}
                  {formData.type === "Car"
                    ? "Ô tô điện"
                    : formData.type === "Battery"
                    ? "Pin xe điện"
                    : "Chưa chọn"}
                </p>
                <p>
                  <strong>Giá:</strong>{" "}
                  {formData.priceListed
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(formData.priceListed))
                    : "Chưa nhập"}
                </p>
                <p>
                  <strong>Hãng:</strong> {formData.make || "Chưa nhập"} -{" "}
                  <strong>Model:</strong> {formData.model || "Chưa nhập"}
                </p>
                <p>
                  <strong>Năm:</strong> {formData.year || "Chưa nhập"} -{" "}
                  <strong>Địa điểm:</strong> {formData.city || "Chưa nhập"}
                </p>
                <p>
                  <strong>Tình trạng:</strong>{" "}
                  {formData.condition || "Chưa chọn"}
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
            Đăng tin bán xe điện
          </h1>
          <p className="text-gray-600">
            Điền thông tin chi tiết để thu hút nhiều khách hàng hơn
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
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
                      <span>{isSubmitting ? "Đang gửi..." : "Đăng tin"}</span>
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
        </div>
      </div>
    </div>
  );
};

export default PostListingPage;
