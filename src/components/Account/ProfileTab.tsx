import React, { useState, useRef } from "react";
import {
  User,
  Package,
  Clock,
  Edit,
  X,
  Save,
  Upload,
  Camera,
} from "lucide-react";
import { UserData } from "../../types/account";
import api from "../../config/api";
import Swal from "sweetalert2";

interface ProfileTabProps {
  userData: UserData | null;
  onUpdate: (updatedData: UserData) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    avatar: "",
    gender: "",
    dateOfBirth: "",
    addresses: {
      fullAddress: "",
      ward: "",
      district: "",
      city: "",
      province: "",
      isActive: true,
    },
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm({
      fullName: userData?.fullName || userData?.name || "",
      avatar: userData?.avatar || "",
      gender: userData?.gender || "",
      dateOfBirth: userData?.dateOfBirth
        ? userData.dateOfBirth.split("T")[0]
        : "",
      addresses: {
        fullAddress: userData?.address?.fullAddress || "",
        ward: userData?.address?.ward || "",
        district: userData?.address?.district || "",
        city: userData?.address?.city || "",
        province: userData?.address?.province || "",
        isActive: userData?.address?.isActive || true,
      },
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      fullName: "",
      avatar: "",
      gender: "",
      dateOfBirth: "",
      addresses: {
        fullAddress: "",
        ward: "",
        district: "",
        city: "",
        province: "",
        isActive: true,
      },
    });
    setSelectedFile(null);
    setPreviewUrl("");
    setShowUrlInput(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Vui lòng chọn file ảnh hợp lệ!",
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Kích thước file không được vượt quá 5MB!",
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      setSelectedFile(file);

      // Tạo preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Cập nhật form với URL preview
      setEditForm({ ...editForm, avatar: url });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlToggle = () => {
    setShowUrlInput(!showUrlInput);
    // Nếu đang ẩn URL input, clear URL value
    if (!showUrlInput) {
      setEditForm({ ...editForm, avatar: "" });
    }
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!editForm.fullName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập họ và tên!",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (!editForm.gender) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng chọn giới tính!",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (!editForm.dateOfBirth) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng chọn ngày sinh!",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (!editForm.addresses.fullAddress.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập địa chỉ đầy đủ!",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      let avatarUrl = editForm.avatar;

      // Nếu có file được chọn, upload file lên server
      if (selectedFile) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);

        try {
          const uploadResponse = await api.put(
            "/profiles/upload-avatar",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          avatarUrl =
            uploadResponse.data.avatarUrl ||
            uploadResponse.data.profile?.personalInfo?.avatar;

          if (!avatarUrl) {
            throw new Error("Không nhận được URL ảnh từ server");
          }

          // Convert relative URL to full URL
          if (avatarUrl.startsWith("/uploads/")) {
            avatarUrl = `http://localhost:8081${avatarUrl}`;
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          Swal.fire({
            icon: "error",
            title: "Lỗi upload ảnh",
            text: "Không thể upload ảnh lên server. Vui lòng thử lại!",
            confirmButtonColor: "#2563eb",
          });
          return;
        }
      }

      const response = await api.put("/profiles", {
        fullName: editForm.fullName,
        avatar: avatarUrl,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth,
        addresses: editForm.addresses,
      });

      onUpdate(response.data);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl("");
      setShowUrlInput(false);

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Cập nhật thông tin thành công!",
        confirmButtonColor: "#2563eb",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { error?: string; message?: string; details?: string };
        };
        message?: string;
      };

      let errorMessage = "Cập nhật thông tin thất bại";

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError.response?.data?.details) {
        errorMessage = axiosError.response.data.details;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      console.error("Error details:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const currentUser = userData || {};

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu</span>
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính *
                </label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gender: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh *
                </label>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dateOfBirth: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đại diện
              </label>
              <p className="text-xs text-gray-500 mb-3">
                💡 Có thể upload trực tiếp từ máy hoặc nhập URL
              </p>

              {/* Upload Options */}
              <div className="space-y-4">
                {/* Upload Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn ảnh từ máy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUrlToggle}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{showUrlInput ? "Ẩn URL" : "Nhập URL ảnh"}</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedFile && (
                    <span className="text-sm text-gray-600">
                      Đã chọn: {selectedFile.name}
                    </span>
                  )}
                </div>

                {/* URL Input (conditional) */}
                {showUrlInput && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL ảnh đại diện
                    </label>
                    <input
                      type="text"
                      value={editForm.avatar}
                      onChange={(e) =>
                        setEditForm({ ...editForm, avatar: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              {(previewUrl || editForm.avatar) && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Preview ảnh đại diện:
                  </h4>
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={
                          previewUrl ||
                          (editForm.avatar.startsWith("/uploads/")
                            ? `http://localhost:8081${editForm.avatar}`
                            : editForm.avatar)
                        }
                        alt="Avatar preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        onError={(e) => {
                          console.error("Preview image load error:", e);
                          (e.target as HTMLImageElement).src = "";
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Ảnh sẽ hiển thị như thế này trên profile của bạn
                  </p>
                </div>
              )}
            </div>

            {/* Address Section */}
            <div className="pt-4 border-t">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Thông tin địa chỉ
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ đầy đủ *
                  </label>
                  <input
                    type="text"
                    value={editForm.addresses.fullAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        addresses: {
                          ...editForm.addresses,
                          fullAddress: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Đường ABC"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã *
                    </label>
                    <input
                      type="text"
                      value={editForm.addresses.ward}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          addresses: {
                            ...editForm.addresses,
                            ward: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phường 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện *
                    </label>
                    <input
                      type="text"
                      value={editForm.addresses.district}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          addresses: {
                            ...editForm.addresses,
                            district: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Quận 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thành phố *
                    </label>
                    <input
                      type="text"
                      value={editForm.addresses.city}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          addresses: {
                            ...editForm.addresses,
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="TP.HCM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh *
                    </label>
                    <input
                      type="text"
                      value={editForm.addresses.province}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          addresses: {
                            ...editForm.addresses,
                            province: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Hồ Chí Minh"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                <strong>Email:</strong> {currentUser?.email} (không thể chỉnh
                sửa)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>Số điện thoại:</strong>{" "}
                {currentUser?.phone || "Chưa cập nhật"} (không thể chỉnh sửa)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
              {currentUser?.avatar ? (
                <img
                  src={
                    currentUser.avatar.startsWith("/uploads/")
                      ? `http://localhost:8081${currentUser.avatar}`
                      : currentUser.avatar
                  }
                  alt={currentUser.fullName || currentUser.name}
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    console.error("Image load error:", e);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {(currentUser?.fullName || currentUser?.name || "U").charAt(
                    0
                  )}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                {currentUser?.fullName || currentUser?.name}
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>
                  <strong>Email:</strong> {currentUser?.email}
                </p>
                <p>
                  <strong>Số điện thoại:</strong>{" "}
                  {currentUser?.phone || "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Giới tính:</strong>{" "}
                  {currentUser?.gender === "male"
                    ? "Nam"
                    : currentUser?.gender === "female"
                    ? "Nữ"
                    : "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Ngày sinh:</strong>{" "}
                  {currentUser?.dateOfBirth
                    ? new Date(currentUser.dateOfBirth).toLocaleDateString(
                        "vi-VN"
                      )
                    : "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Ngày tham gia:</strong>{" "}
                  {currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString(
                        "vi-VN"
                      )
                    : "N/A"}
                </p>
                <p>
                  <strong>Vai trò:</strong>{" "}
                  {currentUser?.role === "ADMIN"
                    ? "Quản trị viên"
                    : "Người dùng"}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <span
                    className={
                      currentUser?.status === "ACTIVE"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {currentUser?.status === "ACTIVE"
                      ? "Hoạt động"
                      : "Không hoạt động"}
                  </span>
                </p>
              </div>

              {/* Address Display */}
              {currentUser?.address && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Địa chỉ</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">
                      {currentUser.address.fullAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentUser.address.ward}, {currentUser.address.district}
                      , {currentUser.address.city},{" "}
                      {currentUser.address.province}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">
            {currentUser?.stats?.soldCount || 0}
          </h3>
          <p className="text-gray-600">Đã bán</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">
            {currentUser?.stats?.buyCount || 0}
          </h3>
          <p className="text-gray-600">Đã mua</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <User className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">
            {currentUser?.stats?.cancelRate || 0}%
          </h3>
          <p className="text-gray-600">Tỷ lệ hủy</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">
            {currentUser?.stats?.responseTime || 0}
          </h3>
          <p className="text-gray-600">Thời gian phản hồi</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Package className="w-8 h-8 text-teal-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">
            {currentUser?.stats?.completionRate || 0}%
          </h3>
          <p className="text-gray-600">Tỷ lệ hoàn thành</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <User className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">{currentUser?.rating || 0}</h3>
          <p className="text-gray-600">Đánh giá</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
