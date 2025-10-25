import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy trang
          </h1>
          <p className="text-gray-600">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Về trang chủ</span>
          </Link>

          <Link
            to="/search"
            className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Tìm kiếm sản phẩm</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full text-gray-600 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Cần hỗ trợ? <Link to="/support" className="text-blue-600 hover:underline">Liên hệ chúng tôi</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;