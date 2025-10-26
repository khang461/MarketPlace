import React, { useState } from "react";
import { User, Package, Clock, Edit, X, Save } from "lucide-react";
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
    avatarUrl: "",
  });

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm({
      fullName: userData?.fullName || userData?.name || "",
      avatarUrl: userData?.avatar || "",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      fullName: "",
      avatarUrl: "",
    });
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await api.put("/profiles", {
        fullName: editForm.fullName,
        avatarUrl: editForm.avatarUrl,
      });

      onUpdate(response.data);
      setIsEditing(false);

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
        response?: { data?: { error?: string; message?: string } };
      };

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          "Cập nhật thông tin thất bại",
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
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
                URL Avatar
              </label>
              <input
                type="text"
                value={editForm.avatarUrl}
                onChange={(e) =>
                  setEditForm({ ...editForm, avatarUrl: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập URL ảnh đại diện"
              />
            </div>

            {editForm.avatarUrl && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Preview:</span>
                <img
                  src={editForm.avatarUrl}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

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
                  src={currentUser.avatar}
                  alt={currentUser.fullName || currentUser.name}
                  className="w-24 h-24 rounded-full object-cover"
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
