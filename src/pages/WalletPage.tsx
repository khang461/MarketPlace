import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

interface WalletInfo {
  balance: number;
  frozenAmount: number;
  totalDeposited: number;
  totalWithdrawn: number;
  currency: string;
  status: string;
}

interface VNPayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  message?: string;
}

const WalletPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Nạp tiền vào ví');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    fetchWalletInfo();

    // Kiểm tra kết quả thanh toán từ VNPay return
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      const amount = urlParams.get('amount');
      showMessage('success', `Đã nạp ${formatCurrency(parseInt(amount || '0'))} vào ví thành công!`);
      // Clean URL
      window.history.replaceState({}, '', '/wallet');
    } else if (success === 'false') {
      const message = urlParams.get('message');
      showMessage('error', `Thanh toán thất bại: ${message}`);
      // Clean URL
      window.history.replaceState({}, '', '/wallet');
    }
  }, [isAuthenticated, navigate]);

  const fetchWalletInfo = async () => {
    try {
      const response = await api.get('/wallet');
      if (response.data.success) {
        setWalletInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    }
  };

  const handleAmountChange = (value: string) => {
    // Chỉ cho phép nhập số
    const regex = /^\d*$/;
    if (regex.test(value)) {
      setAmount(value);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  const handleDeposit = async () => {
    const depositAmount = parseInt(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      showMessage('error', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (depositAmount < 10000) {
      showMessage('error', 'Số tiền nạp tối thiểu là 10,000 VNĐ');
      return;
    }

    if (depositAmount > 100000000) {
      showMessage('error', 'Số tiền nạp tối đa là 100,000,000 VNĐ');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post<VNPayPaymentResponse>('wallet/deposit/vnpay', {
        amount: depositAmount,
        description: description
      });

      if (response.data.success && response.data.paymentUrl || '') {
        window.location.href = response.data.paymentUrl || '';
      } else {
        showMessage('error', response.data.message || 'Có lỗi xảy ra khi tạo thanh toán');
      }
    } catch (error: unknown) {
      console.error('Error creating payment:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại!';
      showMessage('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [100000, 500000, 1000000, 5000000];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ví của tôi</h1>
          <p className="text-gray-600">Quản lý số dư và nạp tiền vào ví</p>
        </div>

        {/* Wallet Info Card */}
        {walletInfo && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-2">Số dư hiện tại</p>
                <h2 className="text-4xl font-bold mb-4">{formatCurrency(walletInfo.balance)}</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Tiền Đã Cọc:</span>
                    <span className="font-semibold">{formatCurrency(walletInfo.frozenAmount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Đã nạp:</span>
                      <span className="font-semibold">{formatCurrency(walletInfo.totalDeposited)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Đã rút:</span>
                      <span className="font-semibold">{formatCurrency(walletInfo.totalWithdrawn)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-blue-200">Trạng thái:</span>
                      <span className={`font-semibold px-2 py-1 rounded ${
                        walletInfo.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {walletInfo.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="mt-6 flex justify-center">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div> */}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nạp tiền vào ví
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập số tiền (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Nhập số tiền"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
                <span className="absolute right-4 top-3 text-gray-500">₫</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nạp tiền vào ví"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Chọn nhanh:</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    {quickAmount >= 1000000 
                      ? `${quickAmount / 1000000}M`
                      : `${quickAmount / 1000}K`}₫
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={isLoading || !amount}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nạp tiền với VNPAY
                </>
              )}
            </button>

            {/* Message Alert */}
            {message && (
              <div className={`mt-4 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

           
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hướng dẫn nạp tiền
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Nhập số tiền</p>
                  <p className="text-sm text-gray-600">Nhập số tiền bạn muốn nạp hoặc chọn nhanh từ các mệnh giá có sẵn</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Chuyển đến VNPay</p>
                  <p className="text-sm text-gray-600">Click "Nạp tiền" để chuyển đến trang thanh toán VNPay</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Thanh toán</p>
                  <p className="text-sm text-gray-600">Thực hiện thanh toán qua thẻ ATM, Internet Banking, hoặc QR Code</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">4</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Hoàn tất</p>
                  <p className="text-sm text-gray-600">Tiền sẽ được cộng vào ví sau khi thanh toán thành công</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">✅ Bảo mật</p>
              <p className="text-sm text-green-700">
                Giao dịch được bảo vệ bởi hệ thống bảo mật tiên tiến của VNPay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;

