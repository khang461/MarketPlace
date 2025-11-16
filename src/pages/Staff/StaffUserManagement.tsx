/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  RefreshCw,
  Search,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Ban,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../config/api";

type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
type UserRole = "user" | "staff" | "admin" | "USER" | "STAFF" | "ADMIN";

interface Address {
  fullAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  province?: string;
}

interface IUser {
  _id: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar?: string;
  address?: Address | string;
  createdAt?: string;
  updatedAt?: string;
}

const StaffUserManagement: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<"all" | UserStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Pagination (client-side)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Nếu muốn server-side pagination:
  // const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setErr(null);

      // --- Client-side load toàn bộ ---
      const res = await api.get("/users");
      const list: IUser[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setUsers(list || []);

      // --- Nếu muốn server-side pagination, dùng block bên dưới và bỏ block trên ---
      // const res = await api.get("/users", {
      //   params: {
      //     page,
      //     limit: pageSize,
      //     search: search || undefined,
      //     status: filterStatus !== "all" ? filterStatus : undefined,
      //   },
      // });
      // setUsers(res.data?.data || []);
      // setTotal(res.data?.total || 0);

    } catch (e) {
      console.error(e);
      setErr("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  // Bình thường ta sẽ refetch khi search/filter đổi nếu dùng server-side
  // useEffect(() => { fetchUsers(); }, [page, pageSize, search, filterStatus]);

  const normalizedRole = (role?: UserRole) =>
    (role || "user").toString().toLowerCase();

  const canToggleStatus = (u: IUser) => normalizedRole(u.role) !== "admin";

  const getDisplayName = (u: IUser) => u.fullName || u.name || "(Không tên)";

  const getStatusBadge = (status?: UserStatus) => {
    const map: Record<UserStatus, { cls: string; label: string; Icon: any }> = {
      ACTIVE:   { cls: "bg-green-100 text-green-700",   label: "Hoạt động",  Icon: CheckCircle },
      SUSPENDED:{ cls: "bg-yellow-100 text-yellow-700", label: "Tạm khóa",    Icon: Ban },
      DELETED:  { cls: "bg-red-100 text-red-700",       label: "Đã xóa (mềm)",Icon: XCircle },
    };
    const cfg = map[status || "ACTIVE"];
    const Icon = cfg.Icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </span>
    );
  };

  // Badge role 3 màu: ADMIN tím, STAFF xanh dương, USER xám
  const getRoleBadge = (role?: UserRole) => {
    const r = normalizedRole(role);
    const style =
      r === "admin"
        ? { wrap: "bg-purple-50 text-purple-700 border-purple-200", icon: "text-purple-600" }
        : r === "staff"
        ? { wrap: "bg-blue-50 text-blue-700 border-blue-200", icon: "text-blue-600" }
        : { wrap: "bg-gray-50 text-gray-700 border-gray-200", icon: "text-gray-500" }; // user
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style.wrap}`}>
        <Shield className={`w-3 h-3 mr-1 ${style.icon}`} />
        {(role || "user").toString().toUpperCase()}
      </span>
    );
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => (filterStatus === "all" ? true : u.status === filterStatus))
      .filter((u) => {
        if (!q) return true;
        return (
          getDisplayName(u).toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").toLowerCase().includes(q)
        );
      });
  }, [users, filterStatus, search]);

  // Client-side pagination slice
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset page về 1 khi filter/search/pageSize đổi để tránh lệch trang
  useEffect(() => {
    setPage(1);
  }, [filterStatus, search, pageSize]);

  const openDetail = async (u: IUser) => {
    try {
      const res = await api.get(`/users/${u._id}`);
      const detail: IUser = res.data?.user || res.data || u;
      setSelectedUser(detail);
      setDetailOpen(true);
    } catch (e) {
      console.error(e);
      setSelectedUser(u);
      setDetailOpen(true);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedUser(null);
  };

  const confirmChangeStatus = async (u: IUser, next: UserStatus) => {
    if (!canToggleStatus(u)) {
      Swal.fire({
        icon: "warning",
        title: "Không thể thao tác",
        text: "Bạn không có quyền thay đổi trạng thái của tài khoản admin.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const textMap: Record<UserStatus, string> = {
      ACTIVE: "Mở khóa tài khoản và cho phép đăng nhập, sử dụng hệ thống.",
      SUSPENDED: "Khoá tạm thời, không cho user đăng nhập/sử dụng.",
      DELETED:
        "Xóa mềm tài khoản. User sẽ ẩn khỏi danh sách thông thường (dữ liệu vẫn còn trong hệ thống).",
    };

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Xác nhận thay đổi trạng thái?",
      html: `
        <div class="text-left">
          <div class="mb-2"><b>User:</b> ${getDisplayName(u)} (${u.email})</div>
          <div class="mb-2"><b>Trạng thái hiện tại:</b> ${u.status}</div>
          <div class="mb-2"><b>Trạng thái mới:</b> ${next}</div>
          <div class="text-sm text-gray-600 mt-3">${textMap[next]}</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    });

    if (!isConfirmed) return;

    try {
      setUpdatingId(u._id);
      await api.put(`/users/${u._id}`, { status: next });

      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, status: next } : x)));
      setSelectedUser((prev) => (prev && prev._id === u._id ? { ...prev, status: next } : prev));

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã cập nhật trạng thái người dùng.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: e?.response?.data?.error || "Không thể cập nhật trạng thái.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Pagination UI handlers
  const gotoFirst = () => setPage(1);
  const gotoPrev = () => setPage((p) => Math.max(1, p - 1));
  const gotoNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const gotoLast = () => setPage(totalPages);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Đang tải người dùng…</span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
            <p className="mt-1 text-sm text-red-700">{err}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Quản lý người dùng (Staff)
          </h1>
          <p className="text-gray-600 mt-1">Xem & cập nhật trạng thái tài khoản</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DELETED">DELETED</option>
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-500">
            Hiển thị {paginatedUsers.length} / {filteredUsers.length} / {users.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    Không có người dùng nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  return (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={getDisplayName(u)}
                                className="h-10 w-10 rounded-lg object-cover border"
                                onError={(e) => ((e.target as HTMLImageElement).src = "https://via.placeholder.com/80?text=User")}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{getDisplayName(u)}</div>
                            <div className="text-xs text-gray-500">
                            
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-3">
                          <span className="inline-flex items-center">
                            <Mail className="w-4 h-4 mr-1 text-gray-400" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <span className="inline-flex items-center">
                              <Phone className="w-4 h-4 mr-1 text-gray-400" />
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(u.status || "ACTIVE")}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openDetail(u)}
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Chi tiết
                          </button>

                          {u.status !== "DELETED" && (
                            <>
                              {u.status !== "ACTIVE" ? (
                                <button
                                  disabled={!canToggleStatus(u) || updatingId === u._id}
                                  onClick={() => confirmChangeStatus(u, "ACTIVE")}
                                  className={`inline-flex items-center ${canToggleStatus(u) ? "text-green-600 hover:text-green-800" : "text-gray-400 cursor-not-allowed"}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Mở khóa
                                </button>
                              ) : (
                                <button
                                  disabled={!canToggleStatus(u) || updatingId === u._id}
                                  onClick={() => confirmChangeStatus(u, "SUSPENDED")}
                                  className={`inline-flex items-center ${canToggleStatus(u) ? "text-yellow-600 hover:text-yellow-800" : "text-gray-400 cursor-not-allowed"}`}
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Tạm khóa
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Trang <span className="font-semibold">{currentPage}</span>/<span className="font-semibold">{totalPages}</span>{" "}
            • {totalItems} kết quả
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={gotoFirst}
              disabled={currentPage === 1}
              className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Trang đầu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={gotoPrev}
              disabled={currentPage === 1}
              className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current page input (optional) */}
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const v = Number(e.target.value || 1);
                setPage(Math.min(Math.max(1, v), totalPages));
              }}
              className="w-16 px-2 py-1 border rounded text-sm text-center"
            />

            <button
              onClick={gotoNext}
              disabled={currentPage === totalPages}
              className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={gotoLast}
              disabled={currentPage === totalPages}
              className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Trang cuối"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-gray-600">Đang hoạt động</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter((u) => u.status === "SUSPENDED").length}
            </div>
            <div className="text-sm text-gray-600">Tạm khóa</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.status === "DELETED").length}
            </div>
            <div className="text-sm text-gray-600">Đã xóa (mềm)</div>
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      {detailOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chi tiết người dùng</h2>
              <button onClick={closeDetail} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={getDisplayName(selectedUser)}
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-blue-600" />
                  </div>
                )}

                <div>
                  <div className="text-xl font-semibold">{getDisplayName(selectedUser)}</div>
                  <div className="mt-2 flex items-center gap-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status || "ACTIVE")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin cơ bản</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedUser.email}
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedUser.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Tạo lúc:&nbsp;
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Địa chỉ</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">
                        {(() => {
                          const addr = selectedUser.address;
                          if (!addr) return "—";
                          if (typeof addr === "string") return addr;
                          const parts = [
                            addr.fullAddress,
                            addr.ward,
                            addr.district,
                            addr.city,
                            addr.province,
                          ].filter(Boolean);
                          return parts.length ? parts.join(", ") : "—";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hành động nhanh — chỉ status */}
              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={!canToggleStatus(selectedUser) || updatingId === selectedUser._id || selectedUser.status === "ACTIVE"}
                    onClick={() => confirmChangeStatus(selectedUser, "ACTIVE")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
                      !canToggleStatus(selectedUser) || updatingId === selectedUser._id || selectedUser.status === "ACTIVE"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mở khóa
                  </button>

                  <button
                    disabled={!canToggleStatus(selectedUser) || updatingId === selectedUser._id || selectedUser.status === "SUSPENDED"}
                    onClick={() => confirmChangeStatus(selectedUser, "SUSPENDED")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
                      !canToggleStatus(selectedUser) || updatingId === selectedUser._id || selectedUser.status === "SUSPENDED"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-yellow-500 text-white hover:bg-yellow-600"
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    Tạm khóa
                  </button>

                  <button
                    disabled
                    title="Chỉ admin mới được xóa mềm"
                    className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    Xóa (mềm)
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
              <button onClick={closeDetail} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffUserManagement;
