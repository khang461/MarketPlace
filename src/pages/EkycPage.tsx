import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CreditCard,
  UserCheck,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import api from "../config/api";
import Swal from "sweetalert2";

const EkycPage: React.FC = () => {
  const navigate = useNavigate();
  type EkycFrontData = {
    id?: string;
    name?: string;
    dob?: string;
    address?: string;
  };

  type EkycResult = {
    message?: string;
    status?: string;
    score?: number;
    ocr?: {
      front?: {
        data?: EkycFrontData[];
      };
    };
    faceMatch?: {
      code?: string;
      data?: { similarity?: number; isMatch?: boolean };
      message?: string;
    };
  };

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [face, setFace] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EkycResult | null>(null);

  const onFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Sai định dạng",
        text: "Chỉ chấp nhận ảnh",
      });
      return;
    }
    setter(file);
  };

  const handleVerify = async () => {
    if (!idFront || !idBack || !face) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu ảnh",
        text: "Vui lòng chọn đủ 3 ảnh: mặt trước, mặt sau và khuôn mặt.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("id_front", idFront);
      formData.append("id_back", idBack);
      formData.append("face", face);

      // Authorization header đã được gắn tự động trong api interceptor
      const response = await api.post("/ekyc/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data as EkycResult;
      setResult(data);

      const status = (data.status || "").toLowerCase();
      const isMatch = Boolean(data.faceMatch?.data?.isMatch);
      const similarity = data.faceMatch?.data?.similarity;

      if (status === "verified" && isMatch) {
        Swal.fire({
          icon: "success",
          title: "Xác minh thành công",
          text: `Trạng thái: verified${
            typeof data.score === "number" ? ` | Điểm: ${data.score}` : ""
          }${typeof similarity === "number" ? ` | Face: ${similarity}%` : ""}`,
          confirmButtonColor: "#2563eb",
        });
      } else if (status === "pending" || !isMatch) {
        Swal.fire({
          icon: "warning",
          title: "Chưa thể xác minh",
          text: !isMatch
            ? "Khuôn mặt không trùng khớp với CCCD. Vui lòng chụp lại ảnh rõ hơn và thử lại."
            : "Yêu cầu đang chờ xử lý. Vui lòng thử lại sau",
          confirmButtonColor: "#2563eb",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Xác minh thất bại",
          text: "Không thể xác minh danh tính. Vui lòng kiểm tra lại ảnh và thử lại",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("eKYC error:", err?.response?.data || error);
      Swal.fire({
        icon: "error",
        title: "Xác minh thất bại",
        text: err?.response?.data?.message || "Vui lòng thử lại",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = (file: File | null) => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <p className="text-[11px] text-gray-500 mb-1">Xem trước</p>
        <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-white">
          <img
            src={url}
            alt="preview"
            className="h-full w-full object-cover"
            onLoad={() => URL.revokeObjectURL(url)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" /> Xác minh danh tính
            (eKYC)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Vui lòng tải lên 3 ảnh: CCCD mặt trước, mặt sau và ảnh khuôn mặt để
            xác minh nhanh chóng.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CCCD mặt trước
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Ảnh rõ, đủ 4 góc, không lóa.
              </p>
              <div className="flex items-center gap-3">
                <label className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChange(e, setIdFront)}
                  />
                </label>
              </div>
              {renderPreview(idFront)}
            </div>

            <div className="bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CCCD mặt sau
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Rõ chữ, không che mờ thông tin.
              </p>
              <div className="flex items-center gap-3">
                <label className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChange(e, setIdBack)}
                  />
                </label>
              </div>
              {renderPreview(idBack)}
            </div>

            <div className="bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khuôn mặt
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Chụp chính diện, đủ sáng, không đeo kính/khẩu trang.
              </p>
              <div className="flex items-center gap-3">
                <label className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer inline-flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChange(e, setFace)}
                  />
                </label>
              </div>
              {renderPreview(face)}
            </div>
          </div>

          <div>
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang xác minh...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Bắt đầu xác minh
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Kết quả</h2>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full ${
                      result.status === "verified"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {result.status === "verified"
                      ? "Xác minh thành công"
                      : "Xác minh thất bại"}
                  </span>
                  {typeof result.score === "number" && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Điểm: {result.score}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm flex items-center gap-3">
                {result?.faceMatch?.data?.isMatch ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> Khuôn mặt trùng (
                    {result?.faceMatch?.data?.similarity}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" /> Khuôn mặt không trùng
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="ml-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Quay lại
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-sm">
              <div className="space-y-2">
                <p>
                  <span className="text-gray-500">Họ tên:</span>{" "}
                  <span className="font-medium">
                    {result?.ocr?.front?.data?.[0]?.name || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Số CCCD:</span>{" "}
                  <span className="font-medium">
                    {result?.ocr?.front?.data?.[0]?.id || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Ngày sinh:</span>{" "}
                  <span className="font-medium">
                    {result?.ocr?.front?.data?.[0]?.dob || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Địa chỉ:</span>{" "}
                  <span className="font-medium">
                    {result?.ocr?.front?.data?.[0]?.address || "N/A"}
                  </span>
                </p>
              </div>
              <div className="rounded-md bg-gray-50 border p-4 text-gray-700">
                <p className="font-medium mb-2">Lưu ý</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Nếu thông tin chưa chính xác, vui lòng tải ảnh rõ hơn và thử
                    lại.
                  </li>
                  <li>Ảnh cần đủ sáng, không mờ/nhòe, không bị che khuất.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EkycPage;
