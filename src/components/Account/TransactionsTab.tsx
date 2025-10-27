import React from "react";
import { Clock } from "lucide-react";
import { Transaction } from "../../types/account";

interface TransactionsTabProps {
  transactions: Transaction[];
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Lịch sử giao dịch</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{transaction.vehicleTitle}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    transaction.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : transaction.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {transaction.status === "completed"
                    ? "Hoàn thành"
                    : transaction.status === "pending"
                    ? "Đang xử lý"
                    : "Đã hủy"}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Giá trị:</strong>{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(transaction.amount)}
                </p>
                <p>
                  <strong>Phương thức:</strong> {transaction.paymentMethod}
                </p>
                <p>
                  <strong>Ngày giao dịch:</strong>{" "}
                  {new Date(transaction.date).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
