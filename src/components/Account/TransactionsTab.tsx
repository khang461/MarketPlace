import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { Calendar, User, Store, Filter, DollarSign } from "lucide-react";

interface Transaction {
  id: string;
  type: "seller" | "buyer";
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REJECTED";
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    priceListed: number;
    images: Array<{ url: string }>;
  };
  depositRequest?: {
    id: string;
    depositAmount: number;
    status: string;
  };
  counterparty: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  dates: {
    createdAt: string;
    scheduledDate: string;
    completedAt?: string;
    cancelledAt?: string;
  };
  amount: {
    deposit: number;
    total: number;
    remaining: number;
  };
  appointmentId: string;
  contract?: {
    id: string;
    status: string;
    contractNumber: string;
    photos: Array<{
      url: string;
      publicId: string;
      uploadedAt: string;
    }>;
    signedAt?: string;
    completedAt?: string;
  };
}

export default function TransactionsTab() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "buyer" | "seller">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/transactions/user/history", {
        params: {
          page: 1,
          limit: 100,
        },
      });
      const allTransactions = response.data?.data || [];
      setTransactions(allTransactions);
    } catch (error) {
      console.error("❌ Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    // Only show COMPLETED and CANCELLED transactions
    if (txn.status !== "COMPLETED" && txn.status !== "CANCELLED") return false;

    // Filter by type
    if (filterType !== "all" && txn.type !== filterType) return false;

    // Filter by status
    if (filterStatus !== "all" && txn.status !== filterStatus) return false;

    return true;
  });

  const statusColors = {
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels = {
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
  };

  const renderTransactionCard = (transaction: Transaction) => {
    const isBuyer = transaction.type === "buyer";
    const vehicleInfo = `${transaction.listing.make} ${transaction.listing.model} ${transaction.listing.year}`;

    return (
      <div
        key={transaction.id}
        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
          isBuyer
            ? "bg-blue-50 border-blue-200"
            : "bg-purple-50 border-purple-200"
        }`}
        onClick={() => navigate(`/transactions/${transaction.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{isBuyer ? "🛒" : "💰"}</span>
              <h3 className="font-bold text-lg">
                {isBuyer ? "Mua xe" : "Bán xe"} - {vehicleInfo}
              </h3>
              {isBuyer ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Store className="w-4 h-4 text-purple-600" />
              )}
            </div>

            {isBuyer ? (
              <div>
                <p className="text-sm text-gray-600">
                  Người bán:{" "}
                  <span className="font-semibold">
                    {transaction.counterparty.name}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {transaction.counterparty.phone}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Người mua:{" "}
                  <span className="font-semibold">
                    {transaction.counterparty.name}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {transaction.counterparty.phone}
                </p>
              </div>
            )}
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              statusColors[transaction.status as "COMPLETED" | "CANCELLED"] || "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            {statusLabels[transaction.status as "COMPLETED" | "CANCELLED"] || transaction.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              {new Date(transaction.dates.scheduledDate).toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">
              Tổng: {transaction.amount.total.toLocaleString("vi-VN")} VNĐ
            </span>
          </div>
        </div>

        {/* Amount Details */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-semibold text-gray-700 mb-2">Thông tin thanh toán:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Đặt cọc</p>
              <p className="text-sm font-semibold text-gray-900">
                {transaction.amount.deposit.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Tổng giá trị</p>
              <p className="text-sm font-semibold text-gray-900">
                {transaction.amount.total.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              Tạo: {new Date(transaction.dates.createdAt).toLocaleDateString("vi-VN")}
            </span>
            {transaction.dates.completedAt && (
              <span className="text-green-600">
                Hoàn thành: {new Date(transaction.dates.completedAt).toLocaleDateString("vi-VN")}
              </span>
            )}
            {transaction.dates.cancelledAt && (
              <span className="text-red-600">
                Hủy: {new Date(transaction.dates.cancelledAt).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
          <span className="text-gray-500">ID: {transaction.id.slice(-6)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Lịch sử giao dịch</h2>
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-blue-600" />
          Lịch sử giao dịch
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Vai trò:</span>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "all" | "buyer" | "seller")
              }
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="buyer">Người mua</option>
              <option value="seller">Người bán</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Trạng thái:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-semibold">{filteredTransactions.length}</span>{" "}
            giao dịch
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) =>
              renderTransactionCard(transaction)
            )
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">
                Không có giao dịch nào
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Các giao dịch của bạn sẽ hiển thị ở đây
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
